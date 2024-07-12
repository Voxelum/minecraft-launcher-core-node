import { MinecraftFolder, MinecraftLocation, Version } from '@xmcl/core'
import { writeFile } from 'fs/promises'
import { FetchOptions, doFetch, ensureFile } from './utils'

export const DEFAULT_META_URL = 'https://meta.quiltmc.org'

export interface InstallQuiltVersionOptions extends FetchOptions {
  minecraftVersion: string
  version: string
  minecraft: MinecraftLocation
  side?: 'client' | 'server'
}

/**
 * Install quilt version via profile API
 */
export async function installQuiltVersion(options: InstallQuiltVersionOptions) {
  const side = options.side ?? 'client'
  const url = side === 'client'
    ? `${DEFAULT_META_URL}/v3/versions/loader/${options.minecraftVersion}/${options.version}/profile/json`
    : `${DEFAULT_META_URL}/v3/versions/loader/${options.minecraftVersion}/${options.version}/server/json`
  const response = await doFetch(options, url)
  const content: Version = await response.json() as any

  const minecraft = MinecraftFolder.from(options.minecraft)
  const versionName = content.id

  const jsonPath = side === 'client' ? minecraft.getVersionJson(versionName) : minecraft.getVersionServerJson(versionName)

  await ensureFile(jsonPath)
  await writeFile(jsonPath, JSON.stringify(content))

  return versionName
}


export interface QuiltArtifactVersion {
  separator: string
  build: number
  /**
   * e.g. "org.quiltmc:quilt-loader:0.16.1",
   */
  maven: string
  version: string
}

/**
 * Get quilt loader versions list
 */
export async function getQuiltLoaderVersions(options?: FetchOptions): Promise<QuiltArtifactVersion[]> {
  const response = await doFetch(options, `${DEFAULT_META_URL}/v3/versions/loader`)
  const content: QuiltArtifactVersion[] = await response.json() as any
  return content
}


export interface GetQuiltOptions extends FetchOptions {
  minecraftVersion: string
}

/**
 * Get quilt loader versions list for a specific minecraft version
 */
export async function getQuiltLoaderVersionsByMinecraft(options: GetQuiltOptions): Promise<QuiltArtifactVersion[]> {
  const response = await doFetch(options, `${DEFAULT_META_URL}/v3/versions/loader/${options.minecraftVersion}`)
  const content: QuiltArtifactVersion[] = await response.json() as any
  return content
}
