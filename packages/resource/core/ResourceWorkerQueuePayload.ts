import { File, ResourceMetadata } from '../resource'
import { ResourceSnapshotTable } from './schema'

export interface ResourceWorkerQueuePayload {
  filePath: string
  file?: File
  record?: ResourceSnapshotTable
  metadata?: ResourceMetadata
  uris?: string[]
  icons?: string[]
}
