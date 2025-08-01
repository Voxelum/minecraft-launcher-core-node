/**
 * Runtime versions for a Minecraft instance
 */
export interface RuntimeVersions {
  /**
   * Minecraft version of this version. e.g. 1.7.10
   * @default ""
   */
  minecraft: string
  /**
   * Forge version of this version. e.g. 14.23.5.2838
   * @default ""
   */
  forge?: string
  /**
   * NeoForged version of this version. e.g. 14.23.5.2838
   * @default ""
   */
  neoForged?: string
  /**
   * @default ""
   */
  liteloader?: string
  /**
   * Fabric loader version, e.g. 0.7.2+build.175
   * @default ""
   */
  fabricLoader?: string
  /**
   * @default ""
   */
  quiltLoader?: string
  /**
   * Fabric yarn version, e.g. 1.15.1+build.14
   * @default ""
   * @deprecated
   */
  yarn?: string
  /**
   * Optifine version e.g. HD_U_F1_pre6 or HD_U_E6
   * @default ""
   */
  optifine?: string
  /**
   * The labyMod version
   * @default ""
   */
  labyMod?: string

  [id: string]: undefined | string
}

/**
 * Modrinth modpack upstream configuration
 */
export interface ModrinthUpstream {
  type: 'modrinth-modpack'
  projectId: string
  versionId: string
  sha1?: string
}

/**
 * Curseforge modpack upstream configuration
 */
export interface CurseforgeUpstream {
  type: 'curseforge-modpack'
  modId: number
  fileId: number
  sha1?: string
}

/**
 * FTB modpack upstream configuration
 */
export interface FTBUpstream {
  type: 'ftb-modpack'
  id: number
  versionId: number
}

/**
 * Peer upstream configuration (for local sharing)
 */
export interface PeerUpstream {
  type: 'peer'
  id: string
}

/**
 * Union type for all possible upstream configurations
 */
export type InstanceUpstream = CurseforgeUpstream | ModrinthUpstream | FTBUpstream | PeerUpstream

/**
 * Core instance data structure
 */
export interface InstanceData {
  /**
   * The display name of the profile. It will also be the modpack display name
   * @default ""
   */
  name: string
  /**
   * The author of this instance
   * @default ""
   */
  author: string
  /**
   * The description of this instance
   * @default ""
   */
  description: string
  /**
   * The target version id to launch. It will be computed from "runtime"
   * @default ""
   */
  version: string
  /**
   * The runtime version requirement of the profile.
   *
   * Containing the forge & liteloader & etc.
   * @default { "minecraft": "", "forge": "", "liteloader": "" }
   */
  runtime: RuntimeVersions
  /**
   * The java path on the disk
   */
  java?: string
  /**
   * The resolution of the game
   */
  resolution?: { width?: number; height?: number; fullscreen?: boolean }
  /**
   * Can be override by global setting
   */
  minMemory?: number
  /**
   * Can be override by global setting
   */
  maxMemory?: number
  /**
   * Can be override by global setting
   */
  assignMemory?: true | 'auto' | false
  /**
   * JVM options
   */
  vmOptions?: string[]
  /**
   * Minecraft options
   */
  mcOptions?: string[]
  /**
   * The launch environment variables
   */
  env?: Record<string, string>
  /**
   * Command to prepend before launch
   */
  prependCommand?: string
  /**
   * Command to execute before launch
   */
  preExecuteCommand?: string
  /**
   * @default ""
   */
  url: string
  /**
   * @default ""
   */
  icon: string
  /**
   * The version number of the modpack. This only available for modpack
   * @default ""
   */
  modpackVersion: string
  /**
   * @default ""
   */
  fileApi: string
  /**
   * The option for instance to launch server directly
   * @default null
   */
  server: {
    host: string
    port?: number
  } | null
  /**
   * The custom tags on instance
   * @default []
   */
  tags: string[]
  /**
   * Various boolean flags
   */
  showLog?: boolean
  hideLauncher?: boolean
  fastLaunch?: boolean
  disableElybyAuthlib?: boolean
  disableAuthlibInjector?: boolean
  /**
   * Use latest version settings
   */
  useLatest?: false | 'release' | 'alpha'
  /**
   * Play time tracking
   */
  playTime?: number
  lastPlayedDate?: number
  /**
   * The upstream data source for this instance
   */
  upstream?: InstanceUpstream
}

/**
 * Full instance schema with timestamps
 */
export interface InstanceSchema extends InstanceData {
  /**
   * @default 0
   */
  lastAccessDate: number
  /**
   * @default 0
   */
  lastPlayedDate: number
  /**
   * @default 0
   */
  playtime: number
  /**
   * @default 0
   */
  creationDate: number
}

/**
 * Instance with path information
 */
export interface Instance extends InstanceSchema {
  path: string
}
