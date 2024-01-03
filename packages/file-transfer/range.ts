import { FileHandle } from 'fs/promises'
import { Writable } from 'stream'
import { Dispatcher, request, stream } from 'undici'
import { AbortSignal } from './abort'
import { Range } from './rangePolicy'
import { ProgressController } from './progress'

export async function * head(url: URL, headers: Record<string, string>, signal: AbortSignal | undefined, dispatcher: Dispatcher | undefined) {
  let timeout = 5_000
  while (true) {
    try {
      const response = await request(url, {
        method: 'HEAD',
        maxRedirections: 2,
        // @ts-ignore
        connectTimeout: timeout,
        headersTimeout: timeout,
        headers,
        signal,
        dispatcher,
      })
      return response
    } catch (e) {
      timeout = timeout * 2 > 40_000 ? 40_000 : timeout * 2
      yield e
    }
  }
}

export async function * range(
  url: URL,
  segment: Range,
  headers: Record<string, string>,
  handle: FileHandle,
  total: number,
  statusController: ProgressController | undefined,
  abortSignal: AbortSignal | undefined,
  dispatcher: Dispatcher | undefined,
): AsyncGenerator<any, void, void> {
  if (segment.start >= segment.end) {
    // the segment is finished, just ignore it
    return
  }
  let contentLength = -1
  const fileStream = new Writable({
    write(chunk, en, cb) {
      // track the progress
      const position = segment.start
      segment.start += chunk.length
      handle.write(chunk, 0, chunk.length, position).then(({ bytesWritten }) => {
        statusController?.onProgress(url, bytesWritten, statusController.progress + bytesWritten, total)
        cb()
      }, cb)
    },
  })

  let nextUrl = url
  while (true) {
    try {
      const { opaque } = await stream(nextUrl, {
        method: 'GET',
        dispatcher,
        headers: {
          ...headers,
          Range: segment.end < 0 ? undefined : `bytes=${segment.start}-${(segment.end) ?? ''}`,
        },
        throwOnError: true,
        maxRedirections: 2,
        signal: abortSignal,
        opaque: { fileStream },
      }, ({ opaque, headers: responseHeaders, statusCode }) => {
        if (statusCode >= 300) {
          if (typeof responseHeaders.location === 'string') {
            nextUrl = new URL(responseHeaders.location)
            Object.assign(opaque as any, { continue: true })
          } else {
            (opaque as any).error = Object.assign(new Error(`Unexpected status code ${statusCode} from ${url}`), {
              name: 'UnexpectedStatusCodeError',
              range: segment.end < 0 ? undefined : `bytes=${segment.start}-${(segment.end) ?? ''}`,
            })
            // return a run-away writable
            return new Writable({ write(chunk, en, cb) { cb() } })
          }
        }
        if (typeof responseHeaders['content-length'] === 'string') {
          contentLength = Number.parseInt(responseHeaders['content-length'] ?? '0')
          segment.end = contentLength
        }
        return (opaque as any).fileStream as Writable
      })
      if ((opaque as any).continue) {
        continue
      }
      if ((opaque as any).error) {
        throw (opaque as any).error
      }
      return
    } catch (e) {
      yield e
    }
  }
}
