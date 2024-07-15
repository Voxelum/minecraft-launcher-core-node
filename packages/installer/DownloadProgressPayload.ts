export interface DownloadProgressPayload {
  url?: URL
  file?: string
  chunkSizeOrStatus: number | 'start' | 'end'
  progress: number
  total: number
}
