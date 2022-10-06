import { AbortableTask } from "@xmcl/task";
import { download, DownloadOptions } from "./http";
import { AbortSignal } from "./http/abort";
import { DownloadAbortError } from "./http/error";
import { StatusController } from "./http/status";

export class DownloadTask extends AbortableTask<void> implements StatusController {
    protected abort: (isCancelled: boolean) => void = () => { };

    constructor(protected options: DownloadOptions) {
        super();
        this._from = options.url instanceof Array ? options.url[0] : options.url;
        this._to = options.destination;
    }

    reset(progress: number, total: number): void {
        this._progress = progress;
        this._total = total;
        this.update(0);
    }

    onProgress(url: URL, chunkSize: number, progress: number): void {
        this._progress = progress;
        this._from = url.toString();
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
        return download({
            ...this.options,
            statusController: this,
            abortSignal: signal,
        });
    }

    protected isAbortedError(e: any): boolean {
        if (e instanceof DownloadAbortError) {
            return true;
        }
        return false;
    }
}
