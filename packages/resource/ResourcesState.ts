import { ResourceMetadata } from './ResourceMetadata'
import { Resource } from './Resource'

export type ResourceActionTuple = [Resource, ResourceAction.Upsert] | [string, ResourceAction.Remove] | [UpdateResourcePayload[], ResourceAction.BatchUpdate]

export class ResourceState {
  /**
   * The mods under instance folder
   */
  files = [] as Resource[]

  filesUpdates(ops: ResourceActionTuple[]) {
    const files = [...this.files]
    for (const [r, a] of ops) {
      if (!r) {
        console.warn('Invalid resource', r)
        continue
      }
      if (a === ResourceAction.Upsert) {
        const index = files.findIndex(m => m.path === r.path)
        if (index === -1) {
          files.push(r)
        } else {
          files[index] = r
        }
      } else if (a === ResourceAction.Remove) {
        const index = files.findIndex(m => m.path === r)
        if (index !== -1) files.splice(index, 1)
      } else {
        for (const update of r as UpdateResourcePayload[]) {
          for (const m of files) {
            if (m.hash === update.hash) {
              applyUpdateToResource(m, update)
            }
          }
        }
      }
    }
    this.files = files
  }
}

export function applyUpdateToResource(resource: Resource, update: UpdateResourcePayload) {
  resource.name = update.metadata?.name ?? resource.name
  for (const [key, val] of Object.entries(update.metadata ?? {})) {
    if (!val) continue
    (resource.metadata as any)[key] = val as any
  }
  resource.icons = update.icons ?? resource.icons
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
