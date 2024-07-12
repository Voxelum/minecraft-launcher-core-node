import { URL } from "url"

export interface DownloadProgressPayload {
  url: URL
  chunkSize: number
  progress: number
  total: number
}
