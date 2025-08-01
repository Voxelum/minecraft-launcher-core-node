import { Instance, InstanceUpstream } from './instance'

/**
 * Check if two upstream sources are from the same origin
 */
export function isUpstreamSameOrigin(a: InstanceUpstream, b: InstanceUpstream): boolean {
  const aType = a.type
  const bType = b.type
  if (aType !== bType) return false
  if (a.type === 'curseforge-modpack') return a.modId === (b as any).modId
  if (a.type === 'modrinth-modpack') return a.projectId === (b as any).projectId
  if (a.type === 'ftb-modpack') return a.id === (b as any).id
  if (a.type === 'peer') return a.id === (b as any).id
  return false
}

/**
 * Create a default instance template
 */
export function createInstanceTemplate(): Instance {
  return {
    path: '',
    name: '',

    resolution: undefined,
    minMemory: undefined,
    maxMemory: undefined,
    vmOptions: undefined,
    mcOptions: undefined,
    env: undefined,

    url: '',
    icon: '',

    runtime: {
      minecraft: '',
      forge: '',
      liteloader: '',
      fabricLoader: '',
      yarn: '',
      optifine: '',
      quiltLoader: '',
      neoForged: '',
      labyMod: '',
    },
    java: '',
    version: '',
    server: null,

    author: '',
    description: '',

    lastAccessDate: -1,
    creationDate: -1,
    modpackVersion: '',
    fileApi: '',
    tags: [],

    assignMemory: undefined,
    prependCommand: undefined,
    showLog: undefined,
    hideLauncher: undefined,
    disableAuthlibInjector: undefined,
    disableElybyAuthlib: undefined,
    fastLaunch: undefined,
    upstream: undefined,
    lastPlayedDate: 0,
    playtime: 0,
  }
}

/**
 * Default instance template (frozen for immutability)
 */
export const DEFAULT_INSTANCE: Instance = Object.freeze(createInstanceTemplate())
