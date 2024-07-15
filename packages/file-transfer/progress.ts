/**
 * The controller that maintain the download status
 */
export interface ProgressController {
  (url: URL, chunkSizeOrStatus: number | 'start' | 'end', written: number, total: number): void
}

export function createProgressController(onProgress?: ProgressController): ProgressController {
  const controller: ProgressController = (url, chunk, _progress, total) => {
    onProgress?.(url, chunk, _progress, total)
  }
  return controller
}

export function resolveProgressController(controller?: ProgressController | ProgressController): ProgressController {
  if (!controller) { return createProgressController() }
  if (typeof controller === 'function') { return createProgressController(controller) }
  return controller
}
