import {
  ProgressTracker,
  ProgressTrackerMultiple,
  ProgressTrackerSingle,
} from '@xmcl/file-transfer'

type TrackEvent<T extends object> = {
  [K in keyof T]: { phase: K; payload: T[K] }
}[keyof T]

export interface Tracker<T extends object> {
  <E extends TrackEvent<T>>(event: E): void
}

export type Raw<T extends object> = T
export type WithDownload<T extends object> = T & { download: ProgressTracker }
export type WithProgress<T extends object> = T & { progress: { progress: number; total: number } }

export function onState<T extends object, K extends keyof T>(
  tracker: Tracker<T> | undefined,
  phase: K,
  payload: T[K],
): void {
  tracker?.({ phase, payload } as any)
}

export function onProgress<T extends object, K extends keyof T>(
  tracker: Tracker<T> | undefined,
  phase: K,
  payload: T[K],
  progress: { progress: number; total: number },
): void {
  tracker?.({ phase, payload: { ...payload, progress } } as any)
}

export function onDownloadMultiple<T extends object, K extends keyof T>(
  tracker: Tracker<T> | undefined,
  phase: K,
  payload: Omit<T[K], 'download'>,
): ProgressTrackerMultiple {
  const parent = new ProgressTrackerMultiple()
  tracker?.({ phase, payload: { ...payload, download: parent } } as any)
  return parent
}

export function onDownloadSingle<T extends object, K extends keyof T>(
  tracker: Tracker<T> | undefined,
  phase: K,
  payload: Omit<T[K], 'download'>,
): ProgressTrackerSingle {
  const single = new ProgressTrackerSingle()
  tracker?.({ phase, payload: { ...payload, download: single } } as any)
  return single
}
