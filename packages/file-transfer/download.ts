import { FileHandle, mkdir, open, unlink } from 'fs/promises'
import { constants } from 'fs'
import { dirname } from 'path'
import { errors } from 'undici'
import { DownloadAgent, resolveAgent } from './agent'
import { DownloadAbortError, DownloadAggregateError, DownloadFileSystemError } from './error'
import { AbortSignal } from './abort'
import { resolveProgressController, ProgressController } from './progress'
import { ChecksumValidatorOptions, resolveValidator, ValidationError, Validator } from './validator'
import assert from 'assert'

export interface DownloadBaseOptions {
  /**
   * The header of the request
   */
  headers?: Record<string, any>
  /**
   * The download agent
   */
  agent?: DownloadAgent
  /**
   * Re-validate the file after download success
   * @default false
   */
  skipRevalidate?: boolean
  /**
   * Should skip prevalidate the file
   * @default false
   */
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
  const agent = resolveAgent(options.agent)
  const skipRevalidate = options.skipRevalidate ?? false
  const skipPrevalidate = options.skipPrevalidate ?? false

  let fd = undefined as FileHandle | undefined

  // Access file handle
  try {
    await mkdir(dirname(destination), { recursive: true }).catch(() => { })
    // use O_RDWR for read write which won't be truncated
    fd = await open(destination, constants.O_RDWR | constants.O_CREAT)

    const size = (await fd.stat()).size
    // pre-validate the file
    if (size !== 0 && !skipPrevalidate) {
      const error = await validator.validate(fd, destination, urls[0]).catch((e) => e)
      // if the file size is not 0 and checksum matched, we just don't process the file
      if (!error) {
        await fd?.close().catch(() => { })
        return
      }
    }
  } catch (e) {
    await fd?.close().catch(() => { })
    throw new DownloadFileSystemError(`Fail to get access on ${destination}`, urls, headers, destination, e)
  }

  // Start to download

  try {
    // File descriptor scope
    try {
      // Aggregated errors
      let aggregatedErrors: { url: string }[] = []
      for (const url of urls) {
        try {
          await agent.dispatch(new URL(url), 'GET', headers, destination, fd, progressController, abortSignal)
          await fd.datasync()
          if (!skipRevalidate) {
            await validator.validate(fd, destination, url)
          }
          // Dismiss all errors
          aggregatedErrors = []
          break
        } catch (e) {
          if (e instanceof errors.RequestAbortedError) {
            // User abortion during HEAD
            throw new DownloadAbortError('Download is aborted by user.', urls, headers, destination, [])
          }
          if (e instanceof DownloadAbortError) {
            // User abortion should throw anyway
            throw e
          }

          aggregatedErrors.push(Object.assign((e as any), {
            url,
          }))
        }
      }

      if (aggregatedErrors.length > 0) {
        throw aggregatedErrors
      }
    } finally {
      await fd.close().catch(() => { })
    }
  } catch (e) {
    if (e instanceof DownloadAbortError) {
      e.urls = urls
      throw e
    }

    assert(e instanceof Array)

    if (e[e.length - 1] instanceof ValidationError) {
      // Last download corrupted...
      await unlink(destination).catch(() => { })
    }

    throw new DownloadAggregateError(`Some errors occurred during download process: ${urls.join(', ')}. ${JSON.stringify(e)}`, urls, headers, destination, e as any)
  }
}
