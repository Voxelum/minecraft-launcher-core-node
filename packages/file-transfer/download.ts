import { fdatasync, close as sclose, open as sopen, rename as srename, stat as sstat, unlink as sunlink, write } from 'fs'
import { mkdir } from 'fs/promises'
import { dirname } from 'path'
import { PassThrough, Writable, finished as sfinished } from 'stream'
import { Agent, Dispatcher, errors, stream } from 'undici'
import { promisify } from 'util'
// @ts-ignore
import { parseRangeHeader } from 'undici/lib/core/util'
import { getDefaultAgentOptions } from './agent'
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

async function head(url: string, headers: Record<string, string>, dispatcher: Dispatcher, signal?: AbortSignal) {
  try {
    const { opaque } = await stream(url, {
      method: 'HEAD',
      headers,
      dispatcher,
      signal,
      opaque: {},
      headersTimeout: 5000,
      bodyTimeout: 5000,
      throwOnError: true,
    }, ({ opaque, headers, context, statusCode }) => {
      const length = headers['content-length'] ? parseInt(headers['content-length'] as string) : 0
      const rangeHeader = parseRangeHeader(headers['content-range'])
      const offset = rangeHeader?.start ?? 0
      const total = rangeHeader?.size || length
      const ctx = context as Context
      const metadata = opaque as Metadata

      metadata.offset = offset
      metadata.total = total
      metadata.acceptRange = headers['accept-ranges'] === 'bytes'

      if (ctx) {
        metadata.pathname = ctx.opts.path
        metadata.origin = ctx.opts.origin as string
      }

      const pass = new PassThrough()

      if (statusCode === 203) {
        setImmediate(() => pass.emit('error', new errors.ResponseStatusCodeError('', statusCode, headers, '')))
      }

      return pass
    })

    return opaque as Metadata
  } catch (e) {
    if (e instanceof errors.ResponseStatusCodeError) {
      if (e.statusCode === 405) {
        return undefined
      }
    }
    throw e
  }
}

async function get(url: string, fd: number, destination: string, headers: Record<string, string>, range: Range | undefined,
  dispatcher: Dispatcher, progress: (url: URL, chunkSize: number, written: number, partLength: number, totalLength: number) => void, signal?: AbortSignal) {
  const parsedUrl = new URL(url)

  let writable: Writable | undefined
  try {
    const requestHeader = { ...headers }
    if (range) {
      requestHeader.range = `bytes=${range.start}-${range.end}`
    }
    await stream(url, {
      method: 'GET',
      maxRedirections: 5,
      headers: requestHeader,
      throwOnError: true,
      dispatcher,
      signal,
    }, ({ statusCode, headers }) => {
      if (statusCode === 203 || statusCode >= 300) {
        const pass = new PassThrough()

        setImmediate(() => pass.emit('error', new errors.ResponseStatusCodeError('', statusCode, headers, '')))

        return pass
      }

      const length = headers['content-length'] ? parseInt(headers['content-length'] as string) : 0
      const rangeHeader = parseRangeHeader(headers['content-range'])
      const offset = rangeHeader?.start ?? range?.start ?? 0
      const totalLength = rangeHeader?.size ?? 0

      let written = 0
      const writable = new Writable({
        write(chunk, encoding, callback) {
          write(fd, chunk, 0, chunk.length, offset + written, callback)
          written += chunk.length
          progress(parsedUrl, chunk.length, written, length, totalLength)
        },
        writev(chunks, callback) {
          const buffer = Buffer.concat(chunks.map((c) => c.chunk))
          write(fd, buffer, 0, buffer.length, offset + written, callback)
          written += buffer.length
          progress(parsedUrl, buffer.length, written, length, totalLength)
        },
        final(callback) {
          progress(parsedUrl, 0, written, length, totalLength)
          callback()
        },
        highWaterMark: 1024 * 1024,
        emitClose: false,
      })

      progress(parsedUrl, 0, written, length, totalLength)

      return writable
    })

    if (writable && !writable.writableFinished) {
      await finished(writable)
    }
  } catch (e) {
    const err = e as any
    if (!err.stack) {
      err.stack = new Error().stack
    }
    return e
  }
}

function computeRanges(metadata: Metadata | undefined, rangePolicy: RangePolicy) {
  if (!metadata) return [undefined]
  const ranges = rangePolicy.computeRanges(metadata.total)
  if (ranges.length > 1) return ranges
  return [undefined]
}

function getUrl(metadata: Metadata | undefined, original: string) {
  if (!metadata || !metadata.pathname || !metadata.origin) return original
  try {
    const url = new URL(metadata.pathname, metadata.origin)
    return url.toString()
  } catch {
    return original
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
  const dispatcher = options?.dispatcher ?? new Agent(getDefaultAgentOptions())

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
      const metadataOrMetadata = !options.skipHead
        ? await head(url, headers, dispatcher, abortSignal).catch((e) => {
          return decorate(e, 'head') as Error
        })
        : undefined
      if (metadataOrMetadata instanceof Error) {
        if (metadataOrMetadata instanceof errors.RequestAbortedError) throw metadataOrMetadata
        aggregate.push(metadataOrMetadata)
        continue
      }
      const metadata = metadataOrMetadata
      const ranges = metadata?.acceptRange ? computeRanges(metadata, rangePolicy) : [undefined]
      const redirectedUrl = getUrl(metadata, url)
      let writtens = ranges.map(() => 0)
      let totals = ranges.map(() => 0)
      let results = await Promise.all(ranges.map(
        (range, index) => get(redirectedUrl, fd, output, headers, range, dispatcher, (url, chunk, written, partLength, totalLength) => {
          writtens[index] = written
          totals[index] = partLength
          const writtenTotal = writtens.reduce((a, b) => a + b, 0)
          const totalTotal = metadata?.total || totalLength || totals.reduce((a, b) => a + b, 0)
          progressController(url, chunk, writtenTotal, totalTotal)
        }, abortSignal)),
      )

      if (metadataOrMetadata && results.some(e => e instanceof errors.ResponseStatusCodeError)) {
        // Invalid range, we will retry without range
        writtens = [0]
        totals = [0]
        results = [
          await get(redirectedUrl, fd, output, headers, undefined, dispatcher, (url, chunk, written, partLength, totalLength) => {
            writtens[0] = written
            totals[0] = partLength
            const writtenTotal = writtens.reduce((a, b) => a + b, 0)
            const totalTotal = metadata?.total || totalLength || totals.reduce((a, b) => a + b, 0)
            progressController(url, chunk, writtenTotal, totalTotal)
          }, abortSignal),
        ]
      }

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
      const flatten = [] as Error[]
      const flatError = (e: any) => {
        if (e instanceof AggregateError) {
          for (const err of e.errors) {
            flatError(err)
          }
        }
        flatten.push(e)
      }
      for (const e of aggregate) {
        flatError(e)
      }
      throw new AggregateError(flatten)
    }

    throw aggregate[0]
  } finally {
    await close(fd).catch(() => undefined)
  }
}
