export function resolveAbortSignal(signal?: AbortSignal) {
  if (signal) { return signal }
  return {
    aborted: false,
    addEventListener() { return this },
    removeEventListener() { return this },
  }
}

export interface AbortSignal {
  readonly aborted: boolean
  addEventListener(event: string, handler: () => void): this
  removeEventListener(event: string, handler: () => void): this
}
