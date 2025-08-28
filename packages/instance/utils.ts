/**
 * Check if error is system error with code
 */
export function isSystemError(error: any): error is Error & { code: string } {
  return error && typeof error.code === 'string'
}

/**
 * Filter out null/undefined values
 */
export function isNonnull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}
