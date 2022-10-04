import { URL } from 'url'

/**
 * The controller that maintain the download status
 */
export interface StatusController {
  readonly total: number
  readonly progress: number
  reset(progress: number, total: number): void
  onProgress(url: URL, chunkSize: number, progress: number): void
}

export function createStatusController() {
  let total = 0
  let progress = 0
  const controller: StatusController = {
    get total() { return total },
    get progress() { return progress },
    reset(_progress, _total) { progress = _progress; total = _total },
    onProgress(_, __, _progress) { progress = _progress },
  }
  return controller
}

export function resolveStatusController(controller?: StatusController) {
  if (!controller) { return createStatusController() }
  return controller
}
