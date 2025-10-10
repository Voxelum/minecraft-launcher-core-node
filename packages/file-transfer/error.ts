
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
