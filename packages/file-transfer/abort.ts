export function resolveAbortSignal(signal?: AbortSignal) {
  if (signal) { return signal }
  return {
    aborted: false,
    addEventListener() { return this },
    removeEventListener() { return this },
  }
}
