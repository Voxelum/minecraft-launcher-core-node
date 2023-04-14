import { Range } from './rangePolicy'

export class DownloadError extends Error {
  constructor(
    message: string,
    public urls: string[],
    readonly headers: Record<string, any>,
    readonly destination: string,
  ) {
    super(message)
    this.name = 'DownloadError'
  }
}

export class DownloadAbortError extends DownloadError {
  constructor(
    message: string,
    urls: string[],
    headers: Record<string, any>,
    destination: string,
    readonly segments: Range[],
  ) {
    super(
      message,
      urls,
      headers,
      destination,
    )
    this.name = 'DownloadAbortError'
  }
}

export class DownloadFileSystemError extends DownloadError {
  constructor(
    message: string,
    urls: string[],
    headers: Record<string, any>,
    destination: string,
    readonly error: unknown,
  ) {
    super(
      message,
      urls,
      headers,
      destination,
    )
    this.name = 'DownloadFileSystemError'
  }
}

export class DownloadAggregateError extends DownloadError {
  constructor(
    message: string,
    urls: string[],
    headers: Record<string, any>,
    destination: string,
    readonly errors: unknown & { url: string },
  ) {
    super(
      message,
      urls,
      headers,
      destination,
    )
    this.name = 'DownloadAggregateError'
  }
}
