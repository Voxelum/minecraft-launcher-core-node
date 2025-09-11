import { ResourceMetadata } from './ResourceMetadata'
import { Resource } from './Resource'

export interface ResourcesState {
  files: Resource[]
  push(action: ResourceAction.Remove, file: string): void
  push(action: ResourceAction.Upsert, resource: Resource): void
  push(action: ResourceAction.BatchUpdate, updates: UpdateResourcePayload[]): void
}

export const enum ResourceAction {
  /**
   * Upsert a resource
   */
  Upsert = 0,
  /**
   * Remove a resource file
   */
  Remove = 1,
  /**
   * Update multiple resources metadata
   */
  BatchUpdate = 2,
}

export type UpdateResourcePayload = {
  hash: string
  icons?: string[]
  metadata?: ResourceMetadata
  uris?: string[]
}
