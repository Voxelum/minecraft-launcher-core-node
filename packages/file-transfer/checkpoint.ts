import { FileHandle } from 'fs/promises'
import CachePolicy from 'http-cache-semantics'
import { Range } from './rangePolicy'

export interface DownloadCheckpoint {
  ranges: Range[]
  url: string
  contentLength: number
  policy: CachePolicy
}

export interface CheckpointHandler {
  lookup(url: URL, handle: FileHandle, destination: string): Promise<DownloadCheckpoint | undefined>
  put(url: URL, handle: FileHandle, destination: string, checkpoint: DownloadCheckpoint): Promise<void>
  delete(url: URL, handle: FileHandle, destination: string): Promise<void>
}

export function createInMemoryCheckpointHandler(): CheckpointHandler {
  const storage: Record<string, DownloadCheckpoint | undefined> = {}
  return {
    async lookup(url: URL, handle: FileHandle, destination: string) {
      const result = storage[destination]
      delete storage[destination]
      return result
    },
    async put(url: URL, handle: FileHandle, destination: string, checkpoint: DownloadCheckpoint) {
      storage[destination] = checkpoint
    },
    async delete(url, handle, destination) {
      delete storage[destination]
    },
  }
}
