import { MinecraftFolder, MinecraftLocation, Version } from '@xmcl/core'
import { writeFile } from 'fs/promises'
import { FetchOptions, doFetch, ensureFile } from './utils'
import { FabricArtifactVersion, FabricLoaderArtifact } from './fabric'

export const DEFAULT_META_URL_QUILT = 'https://meta.quiltmc.org'

export interface GetQuiltOptions extends FetchOptions {
  minecraftVersion: string
}

export interface QuiltLoaderArtifact extends FabricLoaderArtifact {
  hashed: FabricLoaderArtifact['intermediary']
}

/**
 * Get supported fabric game versions
 */
export async function getQuiltGames(options?: FetchOptions): Promise<string[]> {
  const response = await doFetch(options, `${DEFAULT_META_URL_QUILT}/v3/game`)
  const body = await response.json() as Array<{ version: string }>
  return body.map((g) => g.version)
}

/**
 * Get quilt-loader artifact list
 */
export async function getQuiltLoaders(options?: FetchOptions): Promise<FabricArtifactVersion[]> {
  const response = await doFetch(options, `${DEFAULT_META_URL_QUILT}/v3/versions/loader`)
  const body = response.json()
  return body
}

/**
 * Get quilt loader versions list for a specific minecraft version
 */
export async function getQuiltLoaderVersionsByMinecraft(options: GetQuiltOptions): Promise<QuiltLoaderArtifact[]> {
  const response = await doFetch(options, `${DEFAULT_META_URL_QUILT}/v3/versions/loader/${options.minecraftVersion}`)
  const content: QuiltLoaderArtifact[] = await response.json()
  return content
}

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
    ? `${DEFAULT_META_URL_QUILT}/v3/versions/loader/${options.minecraftVersion}/${options.version}/profile/json`
    : `${DEFAULT_META_URL_QUILT}/v3/versions/loader/${options.minecraftVersion}/${options.version}/server/json`
  const response = await doFetch(options, url)
  const content: Version = await response.json() as any

  const minecraft = MinecraftFolder.from(options.minecraft)
  const versionName = `${options.minecraftVersion}-quilt${options.version}`

  const jsonPath = side === 'client' ? minecraft.getVersionJson(versionName) : minecraft.getVersionServerJson(versionName)

  await ensureFile(jsonPath)
  await writeFile(jsonPath, JSON.stringify(content))

  return versionName
}
