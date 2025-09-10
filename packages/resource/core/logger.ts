
export interface Logger {
  error(error: Error, scope?: string): void
}
