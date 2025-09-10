import { Resource, ResourceMetadata } from '../resource'

export interface ResourceActionDispatcher {
  (action: ResourceAction.Remove, file: string): void
  (action: ResourceAction.Upsert, resource: Resource): void
  (action: ResourceAction.BatchUpdate, updates: UpdateResourcePayload[]): void
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
