import { InstanceSchema, createInstanceTemplate } from './instance'
import { VersionMetadataProvider } from './internal_type'

export type CreateInstanceOption = Partial<
  Omit<InstanceSchema, 'lastAccessDate' | 'creationDate' | 'playTime' | 'lastPlayedDate'>
> & {
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
  getLatestRelease: VersionMetadataProvider,
) {
  const instance = createInstanceTemplate()

  instance.name = payload.name ?? instance.name
  instance.author = payload.author ?? instance.author
  instance.description = payload.description ?? instance.description
  instance.version = payload.version ?? instance.version
  instance.java = payload.java ?? instance.java
  instance.minMemory = payload.minMemory || instance.minMemory
  if (payload.maxMemory) instance.maxMemory = payload.maxMemory
  if (payload.assignMemory !== undefined) instance.assignMemory = payload.assignMemory
  if (payload.vmOptions !== undefined) instance.vmOptions = payload.vmOptions
  if (payload.mcOptions !== undefined) instance.mcOptions = payload.mcOptions
  if (payload.env !== undefined) instance.env = payload.env
  if (payload.prependCommand !== undefined) instance.prependCommand = payload.prependCommand
  if (payload.preExecuteCommand !== undefined)
    instance.preExecuteCommand = payload.preExecuteCommand
  if (payload.url !== undefined) instance.url = payload.url
  if (payload.icon !== undefined) instance.icon = payload.icon
  if (payload.modpackVersion !== undefined) instance.modpackVersion = payload.modpackVersion
  if (payload.fileApi !== undefined) instance.fileApi = payload.fileApi
  if (payload.showLog !== undefined) instance.showLog = payload.showLog
  if (payload.hideLauncher !== undefined) instance.hideLauncher = payload.hideLauncher
  if (payload.fastLaunch !== undefined) instance.fastLaunch = payload.fastLaunch
  if (payload.disableElybyAuthlib !== undefined)
    instance.disableElybyAuthlib = payload.disableElybyAuthlib
  if (payload.disableAuthlibInjector !== undefined)
    instance.disableAuthlibInjector = payload.disableAuthlibInjector
  if (payload.useLatest !== undefined) instance.useLatest = payload.useLatest
  if (payload.upstream !== undefined) instance.upstream = payload.upstream
  if (payload.runtime) {
    if (payload.runtime.minecraft !== undefined)
      instance.runtime.minecraft = payload.runtime.minecraft
    if (payload.runtime.forge !== undefined) instance.runtime.forge = payload.runtime.forge
    if (payload.runtime.neoForged !== undefined)
      instance.runtime.neoForged = payload.runtime.neoForged
    if (payload.runtime.liteloader !== undefined)
      instance.runtime.liteloader = payload.runtime.liteloader
    if (payload.runtime.fabricLoader !== undefined)
      instance.runtime.fabricLoader = payload.runtime.fabricLoader
    if (payload.runtime.quiltLoader !== undefined)
      instance.runtime.quiltLoader = payload.runtime.quiltLoader
    if (payload.runtime.yarn !== undefined) instance.runtime.yarn = payload.runtime.yarn
    if (payload.runtime.optifine !== undefined) instance.runtime.optifine = payload.runtime.optifine
    instance.runtime.labyMod = payload.runtime.labyMod || ''
  }
  if (payload.resolution) {
    if (instance.resolution) {
      if (payload.resolution.width !== undefined)
        instance.resolution.width = payload.resolution.width
      if (payload.resolution.height !== undefined)
        instance.resolution.height = payload.resolution.height
      if (payload.resolution.fullscreen !== undefined)
        instance.resolution.fullscreen = payload.resolution.fullscreen
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

  instance.runtime.minecraft = instance.runtime.minecraft || getLatestRelease.getLatestRelease()
  instance.creationDate = Date.now()
  instance.lastAccessDate = Date.now()

  instance.author = payload.author ?? instance.author
  instance.description = payload.description ?? instance.description
  instance.showLog = payload.showLog ?? instance.showLog
  instance.upstream = payload.upstream
  instance.icon = payload.icon ?? ''

  return instance
}
