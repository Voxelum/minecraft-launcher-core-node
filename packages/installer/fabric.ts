import { MinecraftFolder, MinecraftLocation } from '@xmcl/core'
import type { Version } from '@xmcl/core'
import { writeFile } from 'fs/promises'
import { FetchOptions, InstallOptions, doFetch, ensureFile } from './utils'

export interface FabricArtifactVersion {
  gameVersion?: string // "20w10a",
  separator?: string
  build?: number
  maven: string // "net.fabricmc:yarn:20w10a+build.7",
  version: string // "20w10a+build.7",
  stable: boolean
}

export interface FabricArtifacts {
  mappings: FabricArtifactVersion[]
  loader: FabricArtifactVersion[]
}

export interface FabricLoaderArtifact {
  loader: FabricArtifactVersion
  intermediary: FabricArtifactVersion
  launcherMeta: {
    version: number
    libraries: {
      client: { name: string; url: string }[]
      common: { name: string; url: string }[]
      server: { name: string; url: string }[]
    }
    mainClass: {
      client: string
      server: string
    }
  }
}

/**
 * Get supported fabric game versions
 */
export async function getFabricGames(options?: FetchOptions): Promise<string[]> {
  const response = await doFetch(options, `${DEFAULT_META_URL_FABRIC}/v2/game`)
  const body = await response.json() as Array<{ version: string }>
  return body.map((g) => g.version)
}

/**
 * Get fabric-loader artifact list
 */
export async function getFabricLoaders(options?: FetchOptions): Promise<FabricArtifactVersion[]> {
  const response = await doFetch(options, `${DEFAULT_META_URL_FABRIC}/v2/versions/loader`)
  const body = response.json()
  return body
}

/**
 * Get fabric-loader artifact list by Minecraft version
 * @param minecraft The minecraft version
 */
export async function getLoaderArtifactListFor(minecraft: string, options?: FetchOptions): Promise<FabricLoaderArtifact[]> {
  const response = await doFetch(options, `${DEFAULT_META_URL_FABRIC}/v2/versions/loader/` + minecraft)
  const body = response.json()
  return body
}
/**
 * Get fabric-loader artifact list by Minecraft version
 * @param minecraft The minecraft version
 * @param loader The yarn-loader version
 */
export async function getFabricLoaderArtifact(minecraft: string, loader: string, options?: FetchOptions): Promise<FabricLoaderArtifact> {
  const response = await doFetch(options, `${DEFAULT_META_URL_FABRIC}/v2/versions/loader/` + minecraft + '/' + loader)
  const body = response.json()
  return body
}

export interface FabricInstallOptions extends InstallOptions {
  side?: 'client' | 'server'
}

/**
 * Generate fabric version json from loader artifact.
 * @param loader The fabric loader artifact
 * @param side The side of the fabric
 * @param options
 * @returns The generated version json
 */
export function getVersionJsonFromLoaderArtifact(loader: FabricLoaderArtifact, side: 'client' | 'server', options: FabricInstallOptions = {}) {
  const mcversion = loader.intermediary.version
  const id = options.versionId || `${mcversion}-fabric${loader.loader.version}`
  const libraries = [
    { name: loader.loader.maven, url: 'https://maven.fabricmc.net/' },
    { name: loader.intermediary.maven, url: 'https://maven.fabricmc.net/' },
    ...loader.launcherMeta.libraries.common,
    ...loader.launcherMeta.libraries[side],
  ]
  const mainClass = loader.launcherMeta.mainClass[side]
  const inheritsFrom = options.inheritsFrom || mcversion

  return {
    id,
    inheritsFrom,
    mainClass,
    libraries,
    arguments: {
      game: [],
      jvm: [],
    },
    releaseTime: new Date().toJSON(),
    time: new Date().toJSON(),
  }
}

/**
 * Install fabric version json.
 *
 * If side is `server`, it requires the Minecraft version json to be installed.
 *
 * @returns The installed version id
 */
export async function installFabricByLoaderArtifact(loader: FabricLoaderArtifact, minecraft: MinecraftLocation, options: FabricInstallOptions = {}) {
  const folder = MinecraftFolder.from(minecraft)

  const side = options.side || 'client'
  const version = getVersionJsonFromLoaderArtifact(loader, side, options)

  const jsonFile = side === 'client' ? folder.getVersionJson(version.id) : folder.getVersionServerJson(version.id)
  await ensureFile(jsonFile)
  await writeFile(jsonFile, JSON.stringify(version, null, 4))

  return version.id
}

export interface InstallFabricVersionOptions extends FetchOptions, InstallOptions {
  minecraftVersion: string
  version: string
  minecraft: MinecraftLocation
  side?: 'client' | 'server'
}

export const DEFAULT_META_URL_FABRIC = 'https://meta.fabricmc.net'

export async function installFabric(options: InstallFabricVersionOptions) {
  const side = options.side ?? 'client'
  const url = side === 'client'
    ? `${DEFAULT_META_URL_FABRIC}/v2/versions/loader/${options.minecraftVersion}/${options.version}/profile/json`
    : `${DEFAULT_META_URL_FABRIC}/v2/versions/loader/${options.minecraftVersion}/${options.version}/server/json`
  const response = await doFetch(options, url)
  const content: Version = await response.json() as any

  const minecraft = MinecraftFolder.from(options.minecraft)
  if (options.inheritsFrom) {
    content.inheritsFrom = options.inheritsFrom
    content.id = options.versionId || `${options.inheritsFrom}-fabric${options.version}`
  } else {
    content.id = options.versionId || `${options.minecraftVersion}-fabric${options.version}`
  }

  const jsonPath = side === 'client' ? minecraft.getVersionJson(content.id) : minecraft.getVersionServerJson(content.id)

  await ensureFile(jsonPath)
  await writeFile(jsonPath, JSON.stringify(content))

  return content.id
}
