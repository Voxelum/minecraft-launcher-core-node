import { Range } from './rangePolicy'

export class DownloadError extends Error {
  constructor(
    message: string,
    public urls: string[],
    readonly headers: Record<string, any>,
    readonly destination: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
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
    options?: ErrorOptions,
  ) {
    super(
      message,
      urls,
      headers,
      destination,
      options,
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
      { cause: error },
    )
    this.name = 'DownloadFileSystemError'
  }
}

export class DownloadAggregateError extends AggregateError {
  constructor(
    errors: any[],
    message: string,
    readonly urls: string[],
    readonly headers: Record<string, any>,
    readonly destination: string,
    options?: ErrorOptions,
  ) {
    super(
      errors,
      message,
      options,
    )
    this.name = 'DownloadAggregateError'
  }
}
