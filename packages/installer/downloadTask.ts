import { AbortableTask } from "@xmcl/task";
import { AbortSignal } from "./http/abort";
import { createDownload, Download, DownloadOptions } from "./http/download";
import { DownloadError } from "./http/error";
import { StatusController } from "./http/status";

export class DownloadTask extends AbortableTask<void> implements StatusController {
  readonly download: Download;
  protected abort: (isCancelled: boolean) => void = () => { };

  constructor(options: DownloadOptions) {
      super();
      options.statusController = this;
      this.download = createDownload(options);
      this._from = options.url[0];
      this._to = options.destination;
  }

  reset(progress: number, total: number): void {
      this._progress = progress;
      this._total = total;
  }

  onProgress(url: string, chunkSize: number, progress: number): void {
      this._progress = progress;
      this._from = url;
      this.update(chunkSize);
  }

  protected process(): Promise<void> {
      const listeners: Array<() => void> = []
      const aborted = () => this.isCancelled || this.isPaused
      const signal: AbortSignal = {
          get aborted() { return aborted() },
          addEventListener(event, listener) {
              if (event !== "abort") {
                  return this;
              }
              listeners.push(listener);
              return this;
          },
          removeEventListener(event, listener) {
              // noop as this will be auto gc
              return this;
          }
      }
      this.abort = () => {
          listeners.forEach((l) => l())
      }
      return this.download.start(signal);
  }

  protected isAbortedError(e: any): boolean {
      if (e instanceof Array) { e = e[0] }
      if (e instanceof DownloadError && e.error === "DownloadAborted") {
          return true;
      }
      return false;
  }
}
