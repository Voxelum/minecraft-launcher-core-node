import { FileHandle } from 'fs/promises'
import CachePolicy from 'http-cache-semantics'
import { Segment } from './segmentPolicy'

export interface DownloadCheckpoint {
  segments: Segment[]
  url: string
  contentLength: number
  policy: CachePolicy
}

export interface CheckpointHandler {
  findCheckpoint(url: URL, handle: FileHandle, destination: string): Promise<DownloadCheckpoint | undefined>
  putCheckpoint(url: URL, handle: FileHandle, destination: string, checkpoint: DownloadCheckpoint): Promise<void>
  deleteCheckpoint(url: URL, handle: FileHandle, destination: string): Promise<void>
}

export function createInMemoryCheckpointHandler(): CheckpointHandler {
  const storage: Record<string, DownloadCheckpoint | undefined> = {}
  return {
    async findCheckpoint(url: URL, handle: FileHandle, destination: string) {
      const result = storage[destination]
      delete storage[destination]
      return result
    },
    async putCheckpoint(url: URL, handle: FileHandle, destination: string, checkpoint: DownloadCheckpoint) {
      storage[destination] = checkpoint
    },
    async deleteCheckpoint(url, handle, destination) {
      delete storage[destination]
    }
  }
}
