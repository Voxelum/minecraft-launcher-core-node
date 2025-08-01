import { readdir } from 'fs-extra'

/**
 * Read directory if it exists, return empty array if not
 */
export async function readdirIfPresent(path: string): Promise<string[]> {
  try {
    return await readdir(path)
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return []
    }
    throw error
  }
}

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
