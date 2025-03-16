import { fdatasync, close as sclose, mkdir as smkdir, open as sopen, rename as srename, stat as sstat, unlink as sunlink, write } from 'fs'
import { dirname } from 'path'
import { PassThrough, Writable, finished as sfinished } from 'stream'
import { Dispatcher, errors, stream } from 'undici'
import { promisify } from 'util'
// @ts-ignore
import { parseRangeHeader } from 'undici/lib/core/util'
import { getDefaultAgent } from './agent'
import { CheckpointHandler } from './checkpoint'
import { ProgressController, resolveProgressController } from './progress'
import { DefaultRangePolicy, Range, RangePolicy } from './rangePolicy'
import { ChecksumValidatorOptions, Validator, resolveValidator } from './validator'

const rename = promisify(srename)
const unlink = promisify(sunlink)
const stat = promisify(sstat)
const open = promisify(sopen)
const close = promisify(sclose)
const finished = promisify(sfinished)
const datasync = promisify(fdatasync)
const mkdir = promisify(smkdir)

export function getDownloadBaseOptions<T extends DownloadBaseOptions>(options?: T): DownloadBaseOptions {
  if (!options) return {}
  return {
    headers: options.headers,
    rangePolicy: options.rangePolicy,
    dispatcher: options.dispatcher,
    checkpointHandler: options.checkpointHandler,
    skipHead: options.skipHead,
    skipRevalidate: options.skipRevalidate,
    skipPrevalidate: options.skipPrevalidate,
  }
}

export interface DownloadBaseOptions {
  /**
   * The header of the request
   */
  headers?: Record<string, any>
  /**
   * The range policy to compute the ranges to download
   */
  rangePolicy?: RangePolicy
  /**
   * The undici dispatcher
   */
  dispatcher?: Dispatcher
  /**
   * The checkpoint handler to save & restore the download progress
   */
  checkpointHandler?: CheckpointHandler

  skipHead?: boolean

  skipRevalidate?: boolean

  skipPrevalidate?: boolean
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
  progressController?: ProgressController
  /**
   * The validator, or the options to create a validator based on checksum.
   */
  validator?: Validator | ChecksumValidatorOptions
  /**
   * The user abort signal to abort the download
   */
  abortSignal?: AbortSignal
  /**
   * Will first download to pending file and then rename to actual file
   */
  pendingFile?: string
}

interface Context {
  history: URL[]
  opts: Dispatcher.DispatchOptions
}
interface Metadata {
  origin?: string
  pathname?: string
  offset: number
  total: number
  acceptRange: boolean
}

async function getWithRange(
  url: string,
  fd: number,
  headers: Record<string, string>,
  range: Range,
  dispatcher: Dispatcher,
  onHeaderMetadata: (metadata: HeaderMetadata) => void,
  onDataWritten: (chunkSize: number, metadata: HeaderMetadata) => void,
  signal?: AbortSignal
) {
  let writable: Writable | undefined
  try {
    const requestHeader = { ...headers }
    if (range.end !== -1) {
      requestHeader.range = `bytes=${range.start}-${range.end}`
    }
    const noRetry = {
      value: true,
    }
    await stream(url, {
      method: 'GET',
      maxRedirections: 5,
      headers: requestHeader,
      dispatcher,
      signal,
      // @ts-expect-error
      noRetry,
    }, ({ statusCode, headers, context }) => {
      if (statusCode === 203 || statusCode >= 300) {
        const pass = new PassThrough()

        setImmediate(() => pass.emit('error', new errors.ResponseStatusCodeError('', statusCode, headers, '')))

        return pass
      }

      const length = headers['content-length'] ? parseInt(headers['content-length'] as string) : 0
      const rangeHeader = parseRangeHeader(headers['content-range'])
      if (range.start && rangeHeader?.start && range.start !== rangeHeader.start) {
        throw new RangeError(`Range mismatch. ${range.start} !== ${rangeHeader.start}`)
      }

      const redirectedUrl = 'history' in context && context.history instanceof Array ? context.history[context.history.length - 1] : undefined

      const acceptRange = headers['accept-ranges'] === 'bytes'

      if (acceptRange) {
        noRetry.value = false
      }

      const metadata = {
        url: redirectedUrl ? redirectedUrl : url,
        contentLength: length,
        range: headers['accept-ranges'] === 'bytes' ? {
          offset: rangeHeader?.start ?? range.start,
          total: rangeHeader?.size ?? length,
        } : undefined,
      }
      onHeaderMetadata(metadata)

      function writeBuf(chunk: Buffer, callback: (err?: Error | null) => void) {
        write(fd, chunk, 0, chunk.length, rangeTracker.start, (err) => {
          rangeTracker.start += chunk.length
          onDataWritten(chunk.length, metadata)
          if (rangeTracker.start > rangeTracker.end) {
            callback(new RangeError('REACHED_THE_END'))
          } else {
            callback(err)
          }
        })
      }

      const rangeTracker = range
      const writable = new Writable({
        write(chunk, encoding, callback) {
          writeBuf(chunk, callback)
        },
        writev(chunks, callback) {
          const buffer = Buffer.concat(chunks.map((c) => c.chunk))
          writeBuf(buffer, callback)
        },
        final(callback) {
          onDataWritten(0, metadata)
          callback()
        },
        emitClose: false,
      })

      return writable
    })

    if (writable && !writable.writableFinished) {
      await finished(writable)
    }
  } catch (e) {
    if ((e as any)?.message === 'REACHED_THE_END') {
      return
    }
    const err = e as any
    if (!err.stack) {
      err.stack = new Error().stack
    }
    return e
  }
}

class DownloadJob {
  constructor(
    readonly url: string,
    readonly fd: number,
    readonly headers: Record<string, string>,
    readonly onProgress: (url: URL | string, chunkSize: number, progress: number, total: number) => void,
    readonly dispatcher: Dispatcher,
    readonly rangePolicy: RangePolicy,
    readonly signal?: AbortSignal
  ) { }

  readonly progress = [{
    start: 0,
    end: -1,
  }] as Range[]

  public contentLength = 0

  async run() {
    const progress = this.progress
    const rangesPromises = [] as Promise<unknown>[]
    const sumProgress = () => this.contentLength - progress.map(v => v.end - v.start + 1).reduce((a, b) => a + b, 0)
    const initial = getWithRange(this.url, this.fd, this.headers, progress[0], this.dispatcher, (metadata) => {
      this.contentLength = metadata.contentLength
      if (metadata.range) {
        // start to divide the range
        const ranges = this.rangePolicy.computeRanges(metadata.contentLength)
        if (ranges.length > 1) {
          const [first, ...pendings] = ranges
          progress[0].end = first.end
          progress.push(...pendings)
          rangesPromises.push(...pendings.map((range) => getWithRange(this.url, this.fd, this.headers, range, this.dispatcher, () => {
            this.onProgress(metadata.url, 0, sumProgress(), metadata.contentLength)
          }, (chunkSize) => {
            this.onProgress(metadata.url, chunkSize, sumProgress(), metadata.contentLength)
          }, this.signal)))
        }
      } else {
        progress[0].end = metadata.contentLength - 1
      }
    }, (chunkSize, metadata) => {
      // emit update
      this.onProgress(metadata.url, chunkSize, sumProgress(), metadata.contentLength)
    }, this.signal)

    return await Promise.all([initial, ...rangesPromises])
  }
}

interface HeaderMetadata {
  url: string
  contentLength: number
  range?: {
    offset: number
    total: number
  }
}

/**
 * Download url or urls to a file path. This process is abortable, it's compatible with the dom like `AbortSignal`.
 */
export async function download(options: DownloadOptions) {
  const urls = typeof options.url === 'string' ? [options.url] : options.url
  const headers = options.headers || {}
  const destination = options.destination
  const progressController = resolveProgressController(options.progressController)
  const validator = resolveValidator(options.validator)
  const abortSignal = options.abortSignal
  const pendingFile = options.pendingFile
  const skipPrevalidate = options.skipPrevalidate
  const skipRevalidate = options.skipRevalidate
  const rangePolicy = options?.rangePolicy ?? new DefaultRangePolicy(2 * 1024 * 1024, 4)
  const dispatcher = options?.dispatcher ?? getDefaultAgent()

  await mkdir(dirname(destination), { recursive: true }).catch(() => { })

  if (!skipPrevalidate && validator) {
    const error = await validator.validate(destination, urls[0]).catch((e) => e)
    if (!error) {
      // file is already downloaded and validated
      return
    }

    if (pendingFile) {
      const error = await validator.validate(destination, urls[0]).catch((e) => e)
      if (!error) {
        // file is already downloaded and validated
        // we will overwrite destination with pending file
        await unlink(destination).catch(() => undefined)
        await rename(pendingFile, destination)
        return
      }
    }
  }

  const output = pendingFile || destination
  const fd = await open(output, 'w').catch((e) => {
    e.stack = new Error().stack
    Object.assign(e, {
      phase: 'open',
      urls,
      headers,
      destination,
      pendingFile,
    })
    throw e
  })

  try {
    const aggregate: Error[] = []
    for (const url of urls) {
      const decorate = (e: any, phase: string) => Object.assign(e, {
        phase,
        urls,
        url,
        headers,
        destination,
        pendingFile,
      })

      const job = new DownloadJob(url, fd, headers, (url, chunkSize, progress, total) => {
        progressController(typeof url === 'string' ? new URL(url) : url, chunkSize, progress, total)
      }, dispatcher, rangePolicy, abortSignal)

      const results = await job.run()

      let noErrors = true
      for (const e of results) {
        if (!e) continue
        if (e instanceof errors.RequestAbortedError) throw e
        noErrors = false
        aggregate.push(decorate(e, 'get'))
      }

      try {
        await datasync(fd)
      } catch (e) {
        noErrors = false
        const err = e as any
        if (!err.stack) {
          err.stack = new Error().stack
        }
        aggregate.push(decorate(e, 'datasync'))
      }

      if (!skipRevalidate && validator) {
        const error = await validator.validate(output, urls[0]).catch((e) => e)
        if (error) {
          noErrors = false
          aggregate.push(decorate(error, 'validate'))
        }
      }

      // if we have any errors, we will continue to next url
      if (!noErrors) continue

      // if we are not download to a pending file, we are good
      if (!pendingFile) return

      await unlink(destination).catch(() => undefined)
      const fStat = await stat(pendingFile).catch(() => undefined)
      const err = await rename(pendingFile, destination).catch(e => decorate(e, 'rename'))
      if (err && fStat?.ino !== (await stat(destination).catch(() => undefined))?.ino) {
        err.stack = new Error().stack
        throw err
      }

      return
    }

    if (aggregate.length > 1) {
      throw new AggregateError(aggregate.flatMap(e => e instanceof AggregateError ? e.errors : e))
    }

    throw aggregate[0]
  } finally {
    await close(fd).catch(() => undefined)
  }
}
