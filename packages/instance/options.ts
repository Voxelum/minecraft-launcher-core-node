import { RuntimeVersions, InstanceUpstream } from './instance'

/**
 * Options for creating a new instance
 */
export interface CreateInstanceOptions {
  name: string
  author?: string
  description?: string
  java?: string
  runtime?: RuntimeVersions
  server?: {
    host: string
    port?: number
  } | null
  minMemory?: number
  maxMemory?: number
  showLog?: boolean
  vmOptions?: string[]
  mcOptions?: string[]
  resolution?: {
    width?: number
    height?: number
    fullscreen?: boolean
  }
  icon?: string
  url?: string
  resourcepacks?: boolean
  shaderpacks?: boolean
  lastPlayedDate?: number
  playtime?: number
  upstream?: InstanceUpstream
  /**
   * Additional tags for the instance
   */
  tags?: string[]
  /**
   * Environment variables for launching
   */
  env?: Record<string, string>
}

/**
 * Third-party launcher manifest structure
 */
export interface ThirdPartyLauncherManifest {
  instances: Array<{
    path: string
    options: CreateInstanceOptions
  }>
  folder: {
    versions: string
    libraries: string
    assets: string
    jre?: string
  }
}

/**
 * Supported instance types for parsing
 */
export type InstanceType = 'mmc' | 'vanilla' | 'modrinth' | 'curseforge'
