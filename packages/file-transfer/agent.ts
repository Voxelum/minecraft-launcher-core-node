import { FileHandle } from 'fs/promises'
import CachePolicy from 'http-cache-semantics'
import { Dispatcher, errors, getGlobalDispatcher } from 'undici'
import { AbortSignal } from './abort'
import { CheckpointHandler, createInMemoryCheckpointHandler } from './checkpoint'
import { DownloadAbortError } from './error'
import { parseRangeInfo } from './metadata'
import { createDefaultRetryHandler, RetryPolicy } from './retry'
import { head, range } from './range'
import { DefaultRangePolicy, Range, RangePolicy } from './rangePolicy'
import { ProgressController } from './progress'

const { ResponseStatusCodeError, RequestAbortedError } = errors
export interface DownloadAgentOptions {
  retryHandler?: RetryPolicy
  rangePolicy?: RangePolicy
  dispatcher?: Dispatcher
  checkpointHandler?: CheckpointHandler
}

export function resolveAgent(agent?: DownloadAgent | DownloadAgentOptions) {
  return agent instanceof DownloadAgent
    ? agent
    : new DownloadAgent(
      agent?.retryHandler ?? createDefaultRetryHandler(3),
      agent?.rangePolicy ?? new DefaultRangePolicy(2 * 1024 * 1024, 4),
      agent?.dispatcher ?? getGlobalDispatcher(),
      agent?.checkpointHandler ?? createInMemoryCheckpointHandler(),
    )
}

export class DownloadAgent {
  constructor(
    readonly retryHandler: RetryPolicy,
    readonly rangePolicy: RangePolicy,
    readonly dispatcher: Dispatcher,
    readonly checkpointHandler: CheckpointHandler | undefined,
  ) {

  }

  private async head(url: URL, headers: Record<string, string>, signal?: AbortSignal) {
    const kernel = head(url, headers, signal, this.dispatcher)

    let current = await kernel.next()
    let attempt = 0
    for (; !current.done; current = await kernel.next(), attempt++) {
      const error = current.value
      if (error instanceof RequestAbortedError || !await this.retryHandler.retry(url, attempt, error)) {
        // won't retry anymore
        await kernel.throw(error)
      }
    }

    return current.value
  }

  async dispatch(url: URL, method: string, headers: Record<string, string>, destination: string, handle: FileHandle, progressController: ProgressController | undefined, abortSignal: AbortSignal | undefined) {
    let targetUrl: URL = url
    let ranges: Range[] | undefined

    const req = {
      url: url.toString(),
      method,
      headers,
    }
    const checkpoint = await this.checkpointHandler?.lookup(url, handle, destination)
    let policy = checkpoint?.policy
    if (checkpoint) {
      if (checkpoint.policy.satisfiesWithoutRevalidation(req)) {
        // Use checkpoint without revalidate
        ranges = checkpoint.ranges
        targetUrl = new URL(checkpoint.url)
      } else {
        // try to revalidate
        headers = checkpoint.policy.revalidationHeaders(req) as Record<string, string>
      }
    }

    let total = -1

    if (!ranges) {
      let location = url.toString()
      // Fetch download metadata
      const response = await this.head(url, headers, abortSignal)

      const history = (response.context as any)?.history as (URL[] | undefined)
      location = history?.[history?.length - 1].toString() || location

      // Try to revalidate the resource
      const revalidation = policy?.revalidatedPolicy(req, {
        headers: response.headers,
        status: response.statusCode,
      })

      if (!revalidation?.modified && checkpoint) {
        // Resource is not modified and we trust the last checkpoint
        ranges = checkpoint.ranges
        targetUrl = new URL(location)
        total = checkpoint.contentLength
      } else if (response.statusCode === 200 || response.statusCode === 201) {
        // Respect head request result
        // Calculate the resource slices/ranges
        const { contentLength, isAcceptRanges } = parseRangeInfo(response.headers)
        ranges = contentLength && isAcceptRanges
          ? this.rangePolicy.computeRanges(contentLength)
          : [{ start: 0, end: contentLength - 1 }]
        targetUrl = new URL(location)
        total = contentLength
        await handle.truncate(total)
      } else if (response.statusCode === 405) {
        // Do not support HEAD request, we just download without range
        ranges = [{ start: 0, end: -1 }]
        await handle.truncate()
      } else {
        // @ts-ignore
        throw new ResponseStatusCodeError(`Fail to check metadata of ${url}`, response.statusCode, response.headers, response.body)
      }

      // Update the checkpoint policy
      policy = revalidation?.policy ?? new CachePolicy(req, {
        status: response.statusCode,
        headers: response.headers,
      })

      this.checkpointHandler?.put(url, handle, destination, {
        policy,
        ranges,
        contentLength: total,
        url: url.toString(),
      })
    }

    // Update the download status
    const remaining = ranges.map((s) => s.end - s.start).reduce((a, b) => a + b, 0)
    progressController?.onProgress(targetUrl, -1, total - remaining, total)
    const _ranges = ranges
    const results = await Promise.all(ranges.map(async (r) => {
      // Start download range
      const kernel = range(targetUrl, r, headers, handle, total, progressController, abortSignal, this.dispatcher)

      let attempt = 0
      for (let current = await kernel.next(); !current.done; current = await kernel.next(), attempt++) {
        // The yield value must be error
        const err = current.value
        if (err instanceof RequestAbortedError || !await this.retryHandler.retry(url, attempt, err)) {
          // won't retry anymore
          await kernel.return(err)
          return err
        }

        const remaining = _ranges.map((s) => s.end - s.start).reduce((a, b) => a + b, 0)
        progressController?.onProgress(targetUrl, -1, total - remaining, total)
      }
    }))

    const errors = results.filter((r) => !!r)

    if (errors[0] instanceof RequestAbortedError) {
      // Throw abort error anyway
      throw new DownloadAbortError(`Download is aborted by user: ${targetUrl}`, [], headers, destination, ranges)
    }

    if (errors.length > 0) {
      if (policy && ranges.length > 0) {
        await this.checkpointHandler?.put(url, handle, destination, {
          url: targetUrl.toString(),
          policy,
          contentLength: total,
          ranges,
        }).catch(() => { })
      }

      throw errors[0]
    }

    await this.checkpointHandler?.delete(url, handle, destination)
  }
}
