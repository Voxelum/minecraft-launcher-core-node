import { DownloadError } from './error';
import { ValidationError } from './validator';
import { isCommonNetworkError } from './error';

/**
 * The handler that decide whether 
 */
export interface RetryHandler {
  retry(url: string, attempt: number, error: ValidationError): boolean | Promise<boolean>;
  retry(url: string, attempt: number, error: DownloadError): boolean | Promise<boolean>;
  /**
   * You should decide whether we should retry the download again?
   * 
   * @param url The current downloading url
   * @param attempt How many time it try to retry download? The first retry will be `1`.
   * @param error The error object thrown during this download. It can be {@link DownloadError} or ${@link ValidationError}.
   * @returns If we should retry and download it again.
   */
  retry(url: string, attempt: number, error: any): boolean | Promise<boolean>;
}

export interface DefaultRetryHandlerOptions {
  /**
   * The max retry count
   */
  maxRetryCount?: number
  /**
   * Should we retry on the error
   */
  shouldRetry?: (e: any) => boolean
}

export function isRetryHandler(options?: DefaultRetryHandlerOptions | RetryHandler): options is RetryHandler {
  if (!options) return false;
  return "retry" in options && typeof options.retry === "function";
}


export function resolveRetryHandler(options?: DefaultRetryHandlerOptions | RetryHandler): RetryHandler {
  if (isRetryHandler(options)) return options;
  return createRetryHandler(options?.maxRetryCount ?? 3, options?.shouldRetry ?? isCommonNetworkError)
}

/**
 * Create a simple count based retry handler
 * @param maxRetryCount The max count we should try
 * @param shouldRetry Should the error be retry
 */
export function createRetryHandler(maxRetryCount: number, shouldRetry: (e: any) => boolean) {
  const handler: RetryHandler = {
    retry(url, attempt, error) {
      return shouldRetry(error) && attempt < maxRetryCount
    }
  }
  return handler;
}
