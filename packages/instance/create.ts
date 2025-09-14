import { assignShallow } from './edit'
import { InstanceSchema, createInstanceTemplate } from './instance'

export type CreateInstanceOption = Partial<Omit<InstanceSchema, 'lastAccessDate' | 'creationDate'>> & {
  path?: string
  name: string
  resolution?: InstanceSchema['resolution']
  runtime?: InstanceSchema['runtime']
  server?: InstanceSchema['server']
  /**
   * Create resourcepacks folder
   */
  resourcepacks?: boolean
  /**
   * Create shaderpacks folder
   */
  shaderpacks?: boolean
}

export function createInstance(
  payload: CreateInstanceOption,
  getCandidatePath: (name: string) => string,
  getLatestRelease: () => string,
) {
  const instance = createInstanceTemplate()

  assignShallow(instance, payload)
  if (payload.runtime) {
    assignShallow(instance.runtime, payload.runtime)
    instance.runtime.labyMod = payload.runtime.labyMod || ''
  }
  if (payload.resolution) {
    if (instance.resolution) {
      assignShallow(instance.resolution, payload.resolution)
    } else {
      instance.resolution = payload.resolution
    }
  }
  if (payload.server) {
    instance.server = payload.server
  }

  payload.name = payload.name.trim()

  if (!payload.path) {
    instance.path = getCandidatePath(payload.name)
  }

  instance.runtime.minecraft = instance.runtime.minecraft || getLatestRelease()
  instance.creationDate = Date.now()
  instance.lastAccessDate = Date.now()

  instance.author = payload.author ?? instance.author
  instance.description = payload.description ?? instance.description
  instance.showLog = payload.showLog ?? instance.showLog
  instance.upstream = payload.upstream
  instance.icon = payload.icon ?? ''

  return instance
}