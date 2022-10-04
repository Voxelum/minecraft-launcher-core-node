import { FileHandle } from 'fs/promises'
import { Writable } from 'stream'
import { Dispatcher, stream } from 'undici'
import { AbortSignal } from './abort'
import { Segment } from './segmentPolicy'
import { StatusController } from './status'

export async function * range(
  url: URL,
  segment: Segment,
  headers: Record<string, string>,
  handle: FileHandle,
  statusController: StatusController | undefined,
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
      handle.write(chunk, 0, chunk.length, segment.start).then(({ bytesWritten }) => {
        // track the progress
        segment.start += bytesWritten
        statusController?.onProgress(url, bytesWritten, statusController.progress + bytesWritten)
        cb()
      }, cb)
    },
  })

  while (true) {
    try {
      await stream(url, {
        method: 'GET',
        dispatcher,
        headers: {
          ...headers,
          Range: segment.end < 0 ? undefined : `bytes=${segment.start}-${(segment.end) ?? ''}`,
        },
        throwOnError: true,
        maxRedirections: 2,
        signal: abortSignal,
        opaque: fileStream,
        onInfo({ headers }) {
          if (typeof headers['content-length'] === 'string') {
            contentLength = Number.parseInt(headers['content-length'] ?? '0')
            segment.end = contentLength
          }
        },
      }, ({ opaque }) => opaque as Writable)
      return
    } catch (e) {
      yield e
    }
  }
}
