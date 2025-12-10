import {
  ftruncate,
  rename,
  close as sclose,
  mkdir as smkdir,
  open as sopen,
  unlink,
  write,
} from 'fs'
import { dirname } from 'path'
import { PassThrough, Writable } from 'stream'
import { Dispatcher } from 'undici'
import { promisify } from 'util'
import { isNativeError } from 'util/types'
import { getDefaultAgent } from './agent'
import type { CheckpointHandler } from './checkpoint'
import { getWithRange, HTTPResource } from './http_range'
import { ProgressTrackerMultiple, ProgressTrackerSingle } from './progress'
import { RangePolicy, resolveRangePolicy } from './range_policy'

export interface DownloadBaseOptions {
  throttler?: DownloadThrottler
}

export function getDownloadBaseOptions(options?: DownloadBaseOptions): DownloadBaseOptions {
  return {
    throttler: options?.throttler || getDefaultDownloadThrottler(),
  }
}

export interface DownloadOptions extends DownloadBaseOptions {
  /**
   * The url or urls (fallback) of the resource
   */
  url: string | string[]
  /**
   * The header of the request
   */
  headers?: Record<string, any>
  /**
   * Where the file will be downloaded to
   */
  destination: string
  /**
   * The progress controller. If you want to track download progress, you should use this.
   */
  tracker?: ProgressTrackerSingle
  /**
   * The user abort signal to abort the download
   */
  abortSignal?: AbortSignal
  /**
   * Will first download to pending file and then rename to actual file
   */
  pendingFile?: string
  /**
   * The expected total size of the file.
   */
  expectedTotal?: number
}

export type DownloadMultipleOption = Pick<
  DownloadOptions,
  'url' | 'headers' | 'destination' | 'pendingFile' | 'expectedTotal'
>

export interface DownloadMultipleOptions extends DownloadBaseOptions {
  options: DownloadMultipleOption[]

  tracker?: ProgressTrackerMultiple

  abortSignal?: AbortSignal

  maxConcurrency?: number
}

export async function downloadMultiple(
  options: DownloadMultipleOptions,
): Promise<PromiseSettledResult<void>[]> {
  const tracker = options.tracker
  const chunks: DownloadMultipleOptions['options'][] = []

  if (options.maxConcurrency) {
    for (let i = 0; i < options.options.length; i += options.maxConcurrency) {
      chunks.push(options.options.slice(i, i + options.maxConcurrency))
    }
  } else {
    // If maxConcurrency is not set, download all files in one batch
    chunks.push(options.options)
  }

  const result = [] as PromiseSettledResult<void>[]
  for (const chunk of chunks) {
    result.push(
      ...(await Promise.allSettled(
        chunk.map((opt) =>
          download({
            ...opt,
            tracker: tracker?.subSingle(),
            abortSignal: options.abortSignal,
          }),
        ),
      )),
    )
  }
  return result
}

export async function download(options: DownloadOptions): Promise<void> {
  const urls = typeof options.url === 'string' ? [options.url] : options.url
  const headers = options.headers || {}
  const destination = options.destination
  const tracker = options.tracker
  const pendingFile = options.pendingFile
  const abortSignal = options.abortSignal
  const throttler = options.throttler || getDefaultDownloadThrottler()

  // Check if already aborted before opening file
  if (abortSignal?.aborted) {
    throw new Error('Download aborted')
  }

  const fd = await openFd(options.pendingFile || options.destination)
  const handle = new DownloadHandle(fd, throttler.rangePolicy, tracker, abortSignal)
  const errors = []

  try {
    for (const url of urls) {
      const probeRange = handle.probe()

      // start probing
      // this might download all the file if the server does not support range requests
      // if this failed, it will throw and we will try next url
      const probeResult = await getWithRange({
        url,
        headers: headers,
        range: probeRange,
        dispatcher: throttler.dispatcher,
        blackhole: throttler.blackhole,
        signal: handle.signal,
      }).catch((e) => e)

      if (probeResult instanceof Error) {
        // probe failed, try next url
        continue
      }

      if (!probeResult.range) {
        // the download does not support range requests, and the whole file has been downloaded in the probe step.
        return
      }

      handle.construct(
        {
          ...probeResult,
          range: probeResult.range,
        },
        headers,
        throttler.dispatcher,
        throttler.blackhole,
      )

      // add to tracked list for speed monitoring
      throttler.tracked.add(handle)

      const error = await handle.wait()

      if (!error) {
        break
      }

      errors.push(error)
    }

    throttler.tracked.delete(handle)

    if (errors.length > 0) {
      throw new AggregateError(errors, 'All urls failed to download')
    } else if (pendingFile) {
      await renameAsync(pendingFile, destination).catch((e) => {
        if (isNativeError(e) && 'code' in e && e.code === 'EEXIST') {
          return unlinkAsync(destination).then(() => renameAsync(pendingFile, destination))
        }
      })
    }
  } finally {
    // Ensure file descriptor is closed on error
    await close(fd).catch(() => {})
  }
}

export interface DownloadThrottlerOptions {
  minSpeedThreshold?: number
  minDivideSize?: number
  dispatcher?: Dispatcher
  rangePolicy?: RangePolicy
  checkpointHandler?: CheckpointHandler
}

export function getDefaultDownloadThrottler(
  options: DownloadThrottlerOptions = {},
): DownloadThrottler {
  return new DownloadThrottler(
    options.dispatcher || getDefaultAgent(),
    resolveRangePolicy(options.rangePolicy),
    options.checkpointHandler,
  )
}

export class DownloadThrottler {
  tracked: Set<DownloadHandle> = new Set()
  blackhole: PassThrough = new PassThrough()

  constructor(
    /**
     * The undici dispatcher
     */
    readonly dispatcher: Dispatcher,
    /**
     * The range policy to compute the ranges to download
     */
    readonly rangePolicy: RangePolicy,
    /**
     * The checkpoint handler to save & restore the download progress
     */
    readonly checkpointHandler?: CheckpointHandler,
  ) {}

  /**
   * Throttle the download speed, divide slow ranges into smaller ranges
   */
  throttle() {
    if (this.tracked.size === 0) return
    for (const handle of this.tracked) {
      handle.divideIfSlow()
    }
  }
}

const unlinkAsync = promisify(unlink)
const renameAsync = promisify(rename)
const mkdir = promisify(smkdir)
const open = promisify(sopen)
const close = promisify(sclose)

function assignError(e: Error) {
  e.stack = new Error().stack
  Object.assign(e, {
    phase: 'open',
  })
}

async function openFd(output: string) {
  const fd = await open(output, 'w').catch(async (e) => {
    if (e.code === 'ENOENT') {
      await mkdir(dirname(output), { recursive: true })
      return await open(output, 'w').catch((e) => {
        assignError(e)
        throw e
      })
    }
    assignError(e)
    throw e
  })
  return fd
}

export class RangeRunningWatch {
  constructor(
    public tracker: RangeTracker,
    public startPosition: number,
    public startTime: number,
  ) {}

  get lifetime() {
    return Date.now() - this.startTime
  }

  get avgSpeed() {
    const downloaded = this.tracker.position - this.startPosition
    return downloaded / (this.lifetime / 1000)
  }
}

export class RangeTracker {
  running: RangeRunningWatch | undefined

  position: number
  dirty = false

  get isRunning() {
    return !!this.running
  }

  get done() {
    return this.position > this.end
  }

  constructor(
    readonly fd: number,
    readonly start: number,
    /**
     * The end byte position (inclusive)
     */
    public end: number,
    readonly onConstruct: (range: RangeTracker, metadata: HTTPResource) => boolean = () => false,
  ) {
    this.position = start
  }

  construct(metadata: HTTPResource) {
    this.running = new RangeRunningWatch(this, this.position, Date.now())
    return this.onConstruct(this, metadata)
  }

  write(chunk: Buffer, callback: (error?: Error | null) => void): boolean {
    let length = chunk.length
    if (length === 0) {
      callback()
      return false
    }
    let beyond = false
    // ensure not to write beyond the range
    if (this.position + length > this.end + 1) {
      length = this.end - this.position + 1
      beyond = true
    }
    if (length <= 0) {
      callback(new Error('ABORT_END'))
      return true
    }
    write(this.fd, chunk, 0, length, this.position, (err, written) => {
      if (err) {
        this.running = undefined
        callback(err)
        return
      }
      if (written !== length) {
        this.running = undefined
        callback(new Error(`Short write. ${written} !== ${length}`))
        return
      }
      this.position += written
      callback()
    })
    if (beyond) {
      callback(new Error('ABORT_END'))
      return true
    }
    return false
  }

  final() {
    this.running = undefined
  }
}

function noop() {
  return false
}

export class DownloadHandle {
  #ranges: RangeTracker[] = []
  #promise = Promise.withResolvers<Error | undefined>()
  #errors: Error[] = []

  constructor(
    readonly fd: number,
    readonly policy: RangePolicy,
    readonly tracker?: ProgressTrackerSingle,
    readonly signal?: AbortSignal,
  ) {}

  wait() {
    return this.#promise.promise
  }

  probe() {
    return new RangeTracker(this.fd, 0, 0, (range, metadata) => {
      if (metadata.range) {
        return true
      }
      ftruncate(this.fd, metadata.contentLength, () => {})
      range.end = metadata.contentLength - 1
      this.tracker?.setAccessor({
        url: metadata.url,
        total: metadata.contentLength,
        acceptRanges: false,
        get progress() {
          return range.position
        },
        get speed() {
          return range.running?.avgSpeed ?? 0
        },
      })
      return false
    })
  }

  dispatch = (range: RangeTracker) => {}

  /**
   * Pivot the initial ranges based on the content length
   */
  construct(
    resource: Required<HTTPResource>,
    headers: Record<string, string>,
    dispatcher: Dispatcher,
    blackhole: Writable,
  ) {
    this.dispatch = (range) =>
      getWithRange({
        url: resource.url,
        headers: headers,
        range,
        dispatcher: dispatcher,
        blackhole: blackhole,
      })
        .catch((e) => {
          this.#errors.push(e)
        })
        .finally(() => {
          this.#checkCompletion()
        })
    const total = resource.range ? resource.range.total : resource.contentLength
    this.#ranges = this.policy
      .computeRanges(total)
      .map((range) => new RangeTracker(this.fd, range.start, range.end, noop))
    this.#ranges.forEach(this.dispatch)
    const ranges = this.#ranges
    this.tracker?.setAccessor({
      url: resource.url,
      total,
      acceptRanges: !!resource.range,
      get progress() {
        return ranges.map((r) => r.position - r.start).reduce((a, b) => a + b, 0)
      },
      get speed() {
        return ranges
          .filter((r) => r.running)
          .map((r) => r.running!.avgSpeed)
          .reduce((a, b) => a + b, 0)
      },
    })
  }

  #checkCompletion = () => {
    if (this.#ranges.every((r) => !r.isRunning)) {
      this.#promise.resolve(this.#errors.length > 0 ? new AggregateError(this.#errors) : undefined)
    }
  }

  /**
   * Divide slow ranges into smaller ranges
   */
  divideIfSlow() {
    const slow = this.#ranges.filter((r) => r.running && this.policy.shouldDivide(r.running))
    const newRanges: RangeTracker[] = []

    for (const range of slow) {
      if (range.done || range.dirty) {
        continue
      }

      const mid = this.policy.divideRange(range.position, range.end)
      if (typeof mid === 'number') {
        range.dirty = true
        const newRange = new RangeTracker(this.fd, mid + 1, range.end, () => {
          range.end = mid
          return false
        })
        newRanges.push(newRange)
      }
    }

    this.#ranges.push(...newRanges)
    newRanges.forEach(this.dispatch)

    return newRanges
  }
}
