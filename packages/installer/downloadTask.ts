import { AbortableTask } from '@xmcl/task';
import { AbortSignal } from './http/abort';
import { createDownload, Download, DownloadError, DownloadOptions } from './http/download';
import { StatusController } from './http/status';

export class DownloadTask extends AbortableTask<void> implements StatusController {
  readonly download: Download;
  protected abort: (isCancelled: boolean) => void = () => { };

  constructor(options: DownloadOptions) {
    super();
    options.statusController = this;
    this.download = createDownload(options);
  }

  reset(progress: number, total: number): void {
    this._progress = progress;
    this._total = total;
  }

  onProgress(chunkSize: number, progress: number): void {
    this._progress = progress;
    this.update(chunkSize);
  }

  protected process(): Promise<void> {
    const listeners: Array<() => void> = []
    const aborted = () => this.isCancelled || this.isPaused
    const signal: AbortSignal = {
      get aborted() { return aborted() },
      addEventListener(event, listener) {
        if (event !== "abort") {
          throw new Error();
        }
        listeners.push(listener);
        return this;
      }
    }
    this.abort = () => {
      listeners.forEach(l => l())
    }
    return this.download.start(signal);
  }

  protected isAbortedError(e: any): boolean {
    if (e instanceof DownloadError && e.reason === 'abort') {
      return true;
    }
    return false;
  }
}
