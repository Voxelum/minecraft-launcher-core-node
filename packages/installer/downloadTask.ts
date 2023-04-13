import { AbortSignal, download, DownloadAbortError, DownloadOptions, ProgressController } from '@xmcl/download-core'
import { AbortableTask } from '@xmcl/task'

export class DownloadTask extends AbortableTask<void> implements ProgressController {
  protected abort: (isCancelled: boolean) => void = () => { }

  constructor(protected options: DownloadOptions) {
    super()
    this._from = options.url instanceof Array ? options.url[0] : options.url
    this._to = options.destination
  }

  onProgress(url: URL, chunkSize: number, progress: number, total: number): void {
    this._progress = progress
    this._total = total
    this._from = url.toString()
    this.update(chunkSize)
  }

  protected process(): Promise<void> {
    const listeners: Array<() => void> = []
    const aborted = () => this.isCancelled || this.isPaused
    const signal: AbortSignal = {
      get aborted() { return aborted() },
      addEventListener(event, listener) {
        if (event !== 'abort') {
          return this
        }
        listeners.push(listener)
        return this
      },
      removeEventListener(event, listener) {
        // noop as this will be auto gc
        return this
      },
    }
    this.abort = () => {
      listeners.forEach((l) => l())
    }
    return download({
      ...this.options,
      progressController: this,
      abortSignal: signal,
    })
  }

  protected isAbortedError(e: any): boolean {
    if (e instanceof DownloadAbortError) {
      return true
    }
    return false
  }
}
