import { FileHandle } from 'fs/promises'
import CachePolicy from 'http-cache-semantics'
import { errors, Dispatcher, getGlobalDispatcher, request } from 'undici'
import { head, range } from './segment'
import { parseRangeInfo } from './metadata'
import { createDefaultRetryHandler, RetryPolicy } from './retry'
import { AbortSignal } from './abort'
import { DefaultSegmentPolicy, Segment, SegmentPolicy } from './segmentPolicy'
import { StatusController } from './status'
import { CheckpointHandler, createInMemoryCheckpointHandler } from './checkpoint'
import { DownloadAbortError } from './error'

const { ResponseStatusCodeError, RequestAbortedError } = errors
export interface DownloadAgentOptions {
  retryHandler?: RetryPolicy
  segmentPolicy?: SegmentPolicy
  dispatcher?: Dispatcher
  checkpointHandler?: CheckpointHandler
}

export function resolveAgent(agent?: DownloadAgent | DownloadAgentOptions) {
  return agent instanceof DownloadAgent
    ? agent
    : new DownloadAgent(
      agent?.retryHandler ?? createDefaultRetryHandler(3),
      agent?.segmentPolicy ?? new DefaultSegmentPolicy(2 * 1024 * 1024, 4),
      agent?.dispatcher ?? getGlobalDispatcher(),
      agent?.checkpointHandler ?? createInMemoryCheckpointHandler(),
    )
}

export class DownloadAgent {
  constructor(
    readonly retryHandler: RetryPolicy,
    readonly segmentPolicy: SegmentPolicy,
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

  async dispatch(url: URL, method: string, headers: Record<string, string>, destination: string, handle: FileHandle, statusController: StatusController | undefined, abortSignal: AbortSignal | undefined) {
    let targetUrl: URL = url
    let segments: Segment[] | undefined

    const req = {
      url: url.toString(),
      method,
      headers,
    }
    const checkpoint = await this.checkpointHandler?.findCheckpoint(url, handle, destination)
    let policy = checkpoint?.policy
    if (checkpoint) {
      if (checkpoint.policy.satisfiesWithoutRevalidation(req)) {
        // Use checkpoint without revalidate
        segments = checkpoint.segments
        targetUrl = new URL(checkpoint.url)
      } else {
        // try to revalidate
        headers = checkpoint.policy.revalidationHeaders(req) as Record<string, string>
      }
    }

    let total = -1

    if (!segments) {
      let location = url.toString()
      const response = await this.head(url, headers, abortSignal)

      const history = (response.context as any)?.history as (URL[] | undefined)
      location = history?.[history?.length - 1].toString() || location

      // Try to revalidate the resource
      const revalidation = policy?.revalidatedPolicy(req, {
        headers: response.headers,
        status: response.statusCode,
      })

      if (!revalidation?.modified && checkpoint) {
        segments = checkpoint.segments
        targetUrl = new URL(location)
        total = checkpoint.contentLength
      } else if (response.statusCode === 200 || response.statusCode === 201) {
        // Respect head request result
        const { contentLength, isAcceptRanges } = parseRangeInfo(response.headers)
        segments = contentLength && isAcceptRanges
          ? this.segmentPolicy.computeSegments(contentLength)
          : [{ start: 0, end: contentLength }]
        targetUrl = new URL(location)
        total = contentLength
      } else if (response.statusCode === 405) {
        // Do not support HEAD request, we just download without range
        segments = [{ start: 0, end: -1 }]
      } else {
        // @ts-ignore
        throw new ResponseStatusCodeError(`Fail to check metadata of ${url}`, response.statusCode, response.headers, response.body)
      }

      if (revalidation) {
        // Update the checkpoint
        policy = revalidation.policy;
      } else {
        policy = new CachePolicy(req, {
          status: response.statusCode,
          headers: response.headers,
        });
      }

      this.checkpointHandler?.putCheckpoint(url, handle, destination, {
        policy,
        segments,
        contentLength: total,
        url: url.toString(),
      });
    }

    const ranges = segments
    const remaining = ranges.map(s => s.end - s.start).reduce((a, b) => a + b, 0)
    statusController?.reset(total - remaining, total)
    const results = await Promise.all(ranges.map(async (segment) => {
      const kernel = range(targetUrl, segment, headers, handle, statusController, abortSignal, this.dispatcher)

      let attempt = 0
      for (let current = await kernel.next(); !current.done; current = await kernel.next(), attempt++) {

        const err = current.value
        if (err instanceof RequestAbortedError || !await this.retryHandler.retry(url, attempt, err)) {
          // won't retry anymore
          await kernel.return(err);
          return err;
        }

        const remaining = ranges.map(s => s.end - s.start).reduce((a, b) => a + b, 0)
        statusController?.reset(total - remaining, total);
      }
    }))

    const errors = results.filter(r => !!r)

    if (errors[0] instanceof RequestAbortedError) {
      // Throw abort error anyway
      throw new DownloadAbortError(`Download is aborted by user: ${targetUrl}`, [], headers, destination, segments)
    }

    if (errors.length > 0) {
      if (policy && segments.length > 0) {
        await this.checkpointHandler?.putCheckpoint(url, handle, destination, {
          url: targetUrl.toString(),
          policy,
          contentLength: total,
          segments,
        }).catch(() => { })
      }

      throw errors[0]
    }
    await this.checkpointHandler?.deleteCheckpoint(url, handle, destination)
  }
}
