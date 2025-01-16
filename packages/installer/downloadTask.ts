import { download, DownloadOptions } from '@xmcl/file-transfer'
import { AbortableTask } from '@xmcl/task'
import { errors } from 'undici'

export class DownloadTask extends AbortableTask<void> {
  protected controller: AbortController | undefined

  constructor(protected options: DownloadOptions) {
    super()
    this._from = options.url instanceof Array ? options.url[0] : options.url
    this._to = options.destination
  }

  protected abort(): void {
    if (this.controller) {
      this.controller.abort()
    }
  }

  protected process(): Promise<void> {
    this.controller = new AbortController()
    const signal = this.controller.signal
    return download({
      ...this.options,
      progressController: (url, chunkSize, progress, total) => {
        this._progress = progress
        this._total = total
        this._from = url.toString()
        this.update(chunkSize)
      },
      abortSignal: signal,
    })
  }

  protected isAbortedError(e: any): boolean {
    if (e instanceof errors.RequestAbortedError || e.code === 'UND_ERR_ABORTED') {
      return true
    }
    return false
  }
}

export class DownloadMultipleTask extends AbortableTask<void> {
  protected controller: AbortController | undefined
  protected progresses: number[] = []
  protected totals: number[] = []

  constructor(protected options: DownloadOptions[]) {
    super()
    this._progress = -1
    this._total = -1
  }

  get total(): number {
    if (this._total === -1) {
      this._total = this.totals.reduce((a, b) => a + b, 0)
    }
    return this._total
  }

  get progress(): number {
    if (this._progress === -1) {
      this._progress = this.progresses.reduce((a, b) => a + b, 0)
    }
    return this._progress
  }

  protected onFinished?: (index: number) => void

  protected async process(): Promise<void> {
    this.progresses = this.options.map(() => 0)
    this.totals = this.options.map(() => 0)
    this.controller = new AbortController()
    const results = await Promise.allSettled(this.options.map(async (options, i) => {
      await download({
        ...options,
        progressController: (url, chunkSize, written, total) => {
          this.progresses[i] = written
          this.totals[i] = total

          this._total = -1
          this._progress = -1

          this.update(chunkSize)
          this._from = url.toString()
        },
        abortSignal: this.controller?.signal,
      })
      this.progresses[i] = this.totals[i]
      this.update(0)
      this.onFinished?.(i)
    }))
    const rejecteds = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    if (rejecteds.length > 0) {
      if (this.isAbortedError(rejecteds[0].reason)) {
        throw rejecteds[0].reason
      }
      throw new AggregateError(rejecteds.map((r) => r.reason).flatMap(r => r instanceof AggregateError ? r.errors : r))
    }
  }

  protected abort(isCancelled: boolean): void {
    if (this.controller) {
      this.controller.abort()
    }
  }

  protected isAbortedError(e: any): boolean {
    if (e instanceof errors.RequestAbortedError || e.code === 'UND_ERR_ABORTED') {
      return true
    }
    return false
  }
}
