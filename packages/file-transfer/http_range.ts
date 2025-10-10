import { Writable } from 'stream'
import { Dispatcher, stream } from 'undici'
import { types } from 'util'
// @ts-ignore
import { parseRangeHeader } from 'undici/lib/core/util'
import type { RangeTracker } from './download'

export interface GetWithRangeOptions {
  url: string
  range: RangeTracker
  headers: Record<string, string>
  dispatcher: Dispatcher
  signal?: AbortSignal
  blackhole: Writable
}

export interface HTTPResource {
  url: string
  contentLength: number
  range?: {
    offset: number
    total: number
  }
}

type Opaque = {
  range: RangeTracker
  blackhole: Writable
  http?: HTTPResourceOrStatusError
}

export type HTTPResourceOrStatusError = HTTPResource | { statusCode: number }

export async function getWithRange({ url, headers, range, dispatcher, signal, blackhole }: GetWithRangeOptions): Promise<HTTPResourceOrStatusError> {
  const opaque: Opaque = { range, blackhole }
  await stream<Opaque>(url, {
    method: 'GET',
    headers: {
      ...headers,
      'Range': `bytes=${range.position}-${range.end}`,
    },
    dispatcher,
    signal,
    opaque,
  }, ({ statusCode, headers, context, opaque }) => {
    if (statusCode === 203 || statusCode >= 300) {
      opaque.http = { statusCode }
      return opaque.blackhole
    }

    const rangeHeader = parseRangeHeader(headers['content-range'] as string)
    if (rangeHeader?.start && opaque.range.position !== rangeHeader.start) {
      throw new RangeError(`Range mismatch. ${opaque.range.position} !== ${rangeHeader.start}`)
    }
    const length = headers['content-length'] ? parseInt(headers['content-length'] as string) : 0

    const redirectedUrl = 'history' in context && context.history instanceof Array ? context.history[context.history.length - 1] : undefined

    const metadata = {
      url: redirectedUrl ? redirectedUrl : url,
      contentLength: length,
      range: headers['accept-ranges'] === 'bytes' && rangeHeader && rangeHeader.size ? {
        offset: rangeHeader.start,
        total: rangeHeader.size,
      } : undefined,
    }
    opaque.http = metadata

    if (opaque.range.construct(metadata)) {
      return opaque.blackhole
    }

    return new Writable({
      write(chunk, encoding, callback) {
        if (opaque.range.write(chunk, callback)) {
          // gracefully stop due to the range is dynamically changed
          this.destroy(new Error('ABORT_END'))
        }
      },
      writev(chunks, callback) {
        this.write(Buffer.concat(chunks.map((c) => c.chunk)), callback)
      },
      final(callback) {
        opaque.range.final()
        callback()
      },
      emitClose: false,
    })
  }).catch((e) => {
    if (types.isNativeError(e)) {
      if (!e.stack) {
        e.stack = new Error().stack
      }
      if (e.message === 'ABORT_END') {
        // graceful return if the end is reached
        return
      }
    }
    throw e as Error
  })

  if ('statusCode' in opaque.http!) {
    throw new Error(`Invalid status code: ${opaque.http!.statusCode}`)
  }

  return opaque.http!
}
