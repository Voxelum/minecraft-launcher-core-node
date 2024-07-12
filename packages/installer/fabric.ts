import { MinecraftFolder, MinecraftLocation } from '@xmcl/core'
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

export interface FabricOptions extends FetchOptions {
}

/**
 * Get all the artifacts provided by fabric
 * @param remote The fabric API host
 * @beta
 */
export async function getFabricArtifacts(options?: FabricOptions): Promise<FabricArtifacts> {
  const response = await doFetch(options, 'https://meta.fabricmc.net/v2/versions')
  const body = response.json()
  return body
}
/**
 * Get fabric-yarn artifact list
 * @param remote The fabric API host
 * @beta
 */
export async function getYarnArtifactList(options?: FabricOptions): Promise<FabricArtifactVersion[]> {
  const response = await doFetch(options, 'https://meta.fabricmc.net/v2/versions/yarn')
  const body = response.json()
  return body
}
/**
 * Get fabric-yarn artifact list by Minecraft version
 * @param minecraft The Minecraft version
 * @param remote The fabric API host
 * @beta
 */
export async function getYarnArtifactListFor(minecraft: string, options?: FabricOptions): Promise<FabricArtifactVersion[]> {
  const response = await doFetch(options, 'https://meta.fabricmc.net/v2/versions/yarn/' + minecraft)
  const body = response.json()
  return body
}
/**
 * Get fabric-loader artifact list
 * @param remote The fabric API host
 * @beta
 */
export async function getLoaderArtifactList(options?: FabricOptions): Promise<FabricArtifactVersion[]> {
  const response = await doFetch(options, 'https://meta.fabricmc.net/v2/versions/loader')
  const body = response.json()
  return body
}
/**
 * Get fabric-loader artifact list by Minecraft version
 * @param minecraft The minecraft version
 * @param remote The fabric API host
 * @beta
 */
export async function getLoaderArtifactListFor(minecraft: string, options?: FabricOptions): Promise<FabricLoaderArtifact[]> {
  const response = await doFetch(options, 'https://meta.fabricmc.net/v2/versions/loader/' + minecraft)
  const body = response.json()
  return body
}
/**
 * Get fabric-loader artifact list by Minecraft version
 * @param minecraft The minecraft version
 * @param loader The yarn-loader version
 * @param remote The fabric API host
 * @beta
 */
export async function getFabricLoaderArtifact(minecraft: string, loader: string, options?: FabricOptions): Promise<FabricLoaderArtifact> {
  const response = await doFetch(options, 'https://meta.fabricmc.net/v2/versions/loader/' + minecraft + '/' + loader)
  const body = response.json()
  return body
}

export interface FabricInstallOptions extends InstallOptions {
  side?: 'client' | 'server'
  yarnVersion?: string | FabricArtifactVersion
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
  const id = `${mcversion}-fabric${loader.loader.version}`
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
