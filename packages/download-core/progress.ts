import { URL } from 'url'

/**
 * The controller that maintain the download status
 */
export interface ProgressController {
  readonly progress: number
  onProgress(url: URL, chunkSize: number, progress: number, total: number): void
}

export function createProgressController(onProgress?: ProgressController['onProgress']): ProgressController {
  let progress = 0
  const controller: ProgressController = {
    get progress() { return progress },
    onProgress(url, chunk, _progress, total) {
      progress = _progress
      onProgress?.(url, chunk, _progress, total)
    },
  }
  return controller
}

export function resolveProgressController(controller?: ProgressController | ProgressController['onProgress']): ProgressController {
  if (!controller) { return createProgressController() }
  if (typeof controller === 'function') { return createProgressController(controller) }
  return controller
}
