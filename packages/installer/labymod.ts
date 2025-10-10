/* eslint-disable n/no-unsupported-features/node-builtins */
import { LibraryInfo, MinecraftFolder, MinecraftLocation } from '@xmcl/core'
import {
  DownloadBaseOptions,
  downloadMultiple,
  getDownloadBaseOptions
} from '@xmcl/file-transfer'
import { writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import { Dispatcher } from 'undici'
import { diagnoseFile } from './diagnose'
import { LabyModManifest } from './labymod.browser'
import { onDownloadMultiple, onState, Tracker, WithDownload } from './tracker'
import { ensureDir, InstallOptions } from './utils'

export interface LabyModTrackerEvents {
  labymod: { version: string; tag: string }
  'labymod.json': { version: string; tag: string }
  'labymod.assets': WithDownload<{ count: number }>
}

/**
 * Information about a LabyMod addon from the Flint store
 */
export interface LabyModAddon {
  id: number
  namespace: string
  name: string
  featured: boolean
  verified: boolean
  organization: number
  author: string
  downloads: number
  download_string: string
  short_description: string
  rating: {
    count: number
    rating: number
  }
  changelog: string
  required_labymod_build: number
  releases: number
  last_update: number
  licence: string
  version_string: string
  meta: string[]
  dependencies: Array<{
    namespace: string
    optional: boolean
  }>
  permissions: string[]
  file_hash: string
  source_url?: string
  brand_images: Array<{
    type: string
    hash: string
  }>
}

/**
 * Information about a LabyMod addon from the index
 */
export interface LabyModAddonIndex {
  name: string
  namespace: string
  short_description: string
  author: string
  organization_name: string
  ranking: number
  tags: number[]
  rating: {
    count: number
    rating: number
  }
  version_string: string
  meta: string[]
  dependencies: Array<{
    namespace: string
    optional: boolean
  }>
  required_labymod_build: number
  icon_hash: string
  thumbnail_hash: string
  file_hash: string
}

/**
 * Get the LabyMod addon index from Flint store
 * @param env The environment (production, beta, etc.)
 * @param options Request options
 * @returns List of all available addons
 */
export async function getLabyModAddonIndex(env = 'production', options?: { dispatcher?: Dispatcher }): Promise<LabyModAddonIndex[]> {
  const url = `https://flintmc.net/api/client-store/get-index/${env}`
  const res = await request(url, options)
  return await res.body.json() as any
}

/**
 * Get detailed information about a specific LabyMod addon
 * @param namespace The addon namespace (e.g., 'labyfabric', 'modcompat')
 * @param env The environment (production, beta, etc.)
 * @param options Request options
 * @returns Detailed addon information
 */
export async function getLabyModAddon(namespace: string, env = 'production', options?: { dispatcher?: Dispatcher }): Promise<LabyModAddon> {
  const url = `https://flintmc.net/api/client-store/get-modification/${namespace}/${env}`
  const res = await request(url, options)
  return await res.body.json() as any
}

export interface InstallLabyModOptions extends DownloadBaseOptions, InstallOptions {
  dispatcher?: Dispatcher
  environment?: string
  fetch?: typeof fetch
  /**
   * The tracker to track the install process
   */
  tracker?: Tracker<LabyModTrackerEvents>
  abortSignal?: AbortSignal
}
export interface InstallLabyModAddonOptions extends DownloadBaseOptions {
  dispatcher?: Dispatcher
  environment?: string
  /**
   * Whether to install addon dependencies automatically
   * @default true
   */
  installDependencies?: boolean
}
async function createLabyModJson(
  manifest: LabyModManifest,
  tag: string,
  folder: MinecraftFolder,
  environment: string,
  options: InstallLabyModOptions,
): Promise<string> {
  const librariesUrl = `https://laby-releases.s3.de.io.cloud.ovh.net/api/v1/libraries/${environment}.json`
  const versionInfo = manifest.minecraftVersions.find((v) => v.tag === tag)!

  if (!versionInfo) {
    throw Object.assign(new Error(`Cannot find version info for ${tag}`), {
      name: 'VersionInfoNotFoundError',
    })
  }

  interface LibInfo {
    name: string
    url: string
    minecraftVersion: string
    sha1: string
    size: number
    natives: any[]
    resolvedAt: number
  }

  const fetch = options.fetch ?? globalThis.fetch

  const metadataResponse = await fetch(librariesUrl)

  if (!metadataResponse.ok) {
    throw Object.assign(
      new Error(
        `Failed to fetch libraries metadata: ${metadataResponse.statusText}: ${await metadataResponse.text()}`,
      ),
      {
        name: 'FetchLabyModMetadataError',
      },
    )
  }
  // Get version json and merge with libraries
  const libraries: LibInfo[] = await metadataResponse
    .json()
    .then((res) => res.libraries as LibInfo[])
    .then((libs) =>
      libs.filter((lib) => lib.minecraftVersion === 'all' || lib.minecraftVersion === tag),
    )

  const versionJsonResponse = await fetch(versionInfo.customManifestUrl)

  if (!versionJsonResponse.ok) {
    throw Object.assign(
      new Error(
        `Failed to fetch version json: ${versionJsonResponse.statusText}: ${await versionJsonResponse.text()}`,
      ),
      {
        name: 'FetchLabyModVersionJsonError',
      },
    )
  }
  const versionJson = await versionJsonResponse.json()

  versionJson.libraries.push(
    ...libraries.map((l) => ({
      name: l.name,
      downloads: {
        artifact: {
          path: LibraryInfo.resolve(l.name).path,
          sha1: l.sha1,
          size: l.size,
          url: l.url,
        },
      },
    })),
    {
      name: `net.labymod:LabyMod:${manifest.labyModVersion}`,
      downloads: {
        artifact: {
          path: `net/labymod/LabyMod/${manifest.labyModVersion}/LabyMod-${manifest.labyModVersion}.jar`,
          sha1: manifest.sha1,
          size: manifest.size,
          url: `https://laby-releases.s3.de.io.cloud.ovh.net/api/v1/download/labymod4/${environment}/${manifest.commitReference}.jar`,
        },
      },
    })
  versionJson.id = `${tag}-LabyMod-4-${manifest.commitReference}`

  if (!versionJson.inheritFrom) {
    versionJson.inheritFrom = versionJson._minecraftVersion || tag
  }

  // write json to file
  const versionPath = folder.getPath('versions', versionJson.id, `${versionJson.id}.json`)
  await ensureDir(dirname(versionPath))
  await writeFile(versionPath, JSON.stringify(versionJson, null, 4))

  return versionJson.id
}

export async function installLabyMod4(
  manifest: LabyModManifest,
  tag: string,
  minecraft: MinecraftLocation,
  options: InstallLabyModOptions = {},
): Promise<string> {
  const folder = MinecraftFolder.from(minecraft)
  const environment = options?.environment ?? 'production'
  onState(options.tracker, 'labymod', { version: manifest.labyModVersion, tag })

  const versionId = await createLabyModJson(manifest, tag, folder, environment, options)

  // Diagnose assets first in parallel
  const assetEntries = Object.entries(manifest.assets)
  const diagnoseResults = await Promise.all(
    assetEntries.map(async ([name, hash]) => {
      const destination = folder.getPath('labymod-neo', 'assets', `${name}.jar`)
      const url = `https://laby-releases.s3.de.io.cloud.ovh.net/api/v1/download/assets/labymod4/${environment}/${manifest.commitReference}/${name}/${hash}.jar`

      const issue = await diagnoseFile(
        {
          file: destination,
          expectedChecksum: '', // LabyMod doesn't provide checksums for assets
          role: 'labymod-asset',
          hint: 'Problem on labymod asset! Please consider to reinstall labymod.',
        },
        { signal: options.abortSignal },
      )

      return {
        name,
        hash,
        url,
        destination,
        needsDownload: !!issue,
      }
    }),
  )

  // Only download assets that need to be downloaded
  const assetsToDownload = diagnoseResults.filter((r) => r.needsDownload)

  if (assetsToDownload.length > 0) {
    await downloadMultiple({
      options: assetsToDownload.map((r) => ({
        url: r.url,
        destination: r.destination,
      })),
      ...getDownloadBaseOptions(options),
      tracker: onDownloadMultiple(options.tracker, 'labymod.assets', {
        count: assetsToDownload.length,
      }),
      abortSignal: options.abortSignal,
    })
  }

  return versionId
}

export function installLaby4Mod(
  manifest: LabyModManifest,
  tag: string,
  minecraft: MinecraftLocation,
  options?: InstallLabyModOptions,
): Promise<string> {
  return installLabyMod4(manifest, tag, minecraft, options)
}

/**
 * Install a LabyMod addon (like Fabric Loader addon - labyfabric)
 *
 * The addon will be downloaded to the labymod-neo/addons directory.
 * If the addon has dependencies and installDependencies is true (default),
 * they will also be installed.
 *
 * @param addon The addon information (from getLabyModAddon or getLabyModAddonIndex)
 * @param minecraft The Minecraft location
 * @param options Installation options
 * @returns Task that resolves to the installed addon file path
 */
export function installLabyModAddonTask(addon: LabyModAddon | LabyModAddonIndex, minecraft: MinecraftLocation, options?: InstallLabyModAddonOptions): Task<string> {
  return task('installLabyModAddon', async function () {
    const folder = MinecraftFolder.from(minecraft)
    const environment = options?.environment ?? 'production'
    const installDependencies = options?.installDependencies ?? true

    // Install dependencies first if needed
    if (installDependencies && addon.dependencies && addon.dependencies.length > 0) {
      for (const dep of addon.dependencies) {
        if (!dep.optional) {
          const depAddon = await getLabyModAddon(dep.namespace, environment, options)
          await this.yield(installLabyModAddonTask(depAddon, minecraft, {
            ...options,
            installDependencies: true,
          }))
        }
      }
    }

    // Download the addon jar
    const url = `https://flintmc.net/api/client-store/fetch-jar-by-hash/${addon.file_hash}`
    const destination = join(folder.getPath('labymod-neo', 'addons'), `${addon.namespace}.jar`)

    await this.yield(new DownloadTask({
      url,
      destination,
      validator: { algorithm: 'sha1', hash: addon.file_hash },
      ...getDownloadBaseOptions(options),
    }).setName('addon', { name: addon.name, namespace: addon.namespace }))

    return destination
  })
}

/**
 * Install a LabyMod addon by namespace (like 'labyfabric' for Fabric Loader)
 *
 * @param namespace The addon namespace
 * @param minecraft The Minecraft location
 * @param options Installation options
 * @returns Promise that resolves to the installed addon file path
 */
export async function installLabyModAddon(namespace: string, minecraft: MinecraftLocation, options?: InstallLabyModAddonOptions): Promise<string> {
  const environment = options?.environment ?? 'production'
  const addon = await getLabyModAddon(namespace, environment, options)
  return installLabyModAddonTask(addon, minecraft, options).startAndWait()
}

/**
 * Install Fabric Loader addon for LabyMod 4
 *
 * This installs the labyfabric addon which allows running Fabric mods within LabyMod.
 * It will also install required dependencies like modcompat.
 *
 * @param minecraft The Minecraft location
 * @param options Installation options
 * @returns Promise that resolves to the installed addon file path
 */
export function installLabyModFabricAddon(minecraft: MinecraftLocation, options?: InstallLabyModAddonOptions): Promise<string> {
  return installLabyModAddon('labyfabric', minecraft, options)
}

/**
 * Install Fabric Loader addon for LabyMod 4 as a task
 *
 * This installs the labyfabric addon which allows running Fabric mods within LabyMod.
 * It will also install required dependencies like modcompat.
 *
 * @param minecraft The Minecraft location
 * @param options Installation options
 * @returns Task that resolves to the installed addon file path
 */
export async function installLabyModFabricAddonTask(minecraft: MinecraftLocation, options?: InstallLabyModAddonOptions): Promise<Task<string>> {
  const environment = options?.environment ?? 'production'
  const addon = await getLabyModAddon('labyfabric', environment, options)
  return installLabyModAddonTask(addon, minecraft, options)
}

/**
 * Install Forge Loader addon for LabyMod 4
 *
 * This installs the labyforge addon which allows running Forge mods within LabyMod.
 * Note: Forge Loader only supports Minecraft 1.8.9.
 * It will also install required dependencies like modcompat.
 *
 * @param minecraft The Minecraft location
 * @param options Installation options
 * @returns Promise that resolves to the installed addon file path
 */
export function installLabyModForgeAddon(minecraft: MinecraftLocation, options?: InstallLabyModAddonOptions): Promise<string> {
  return installLabyModAddon('labyforge', minecraft, options)
}

/**
 * Install Forge Loader addon for LabyMod 4 as a task
 *
 * This installs the labyforge addon which allows running Forge mods within LabyMod.
 * Note: Forge Loader only supports Minecraft 1.8.9.
 * It will also install required dependencies like modcompat.
 *
 * @param minecraft The Minecraft location
 * @param options Installation options
 * @returns Task that resolves to the installed addon file path
 */
export async function installLabyModForgeAddonTask(minecraft: MinecraftLocation, options?: InstallLabyModAddonOptions): Promise<Task<string>> {
  const environment = options?.environment ?? 'production'
  const addon = await getLabyModAddon('labyforge', environment, options)
  return installLabyModAddonTask(addon, minecraft, options)
}

/**
 * Check if a LabyMod addon supports a specific Minecraft version
 *
 * @param addon The addon to check
 * @param minecraftVersion The Minecraft version to check (e.g., '1.20.1', '1.21')
 * @returns true if the addon supports the version, false otherwise
 */
export function isLabyModAddonCompatible(addon: LabyModAddon | LabyModAddonIndex, minecraftVersion: string): boolean {
  const versionString = addon.version_string
  if (!versionString || versionString === '*') {
    return true
  }

  // Parse version ranges like "1.16.5<1.21.10" or "1.8.9,1.12.2" or "1.8.9<1.21.8"
  const ranges = versionString.split(',')

  for (const range of ranges) {
    if (range.includes('<')) {
      // Range format: "min<max"
      const [min, max] = range.split('<')
      if (compareVersions(minecraftVersion, min.trim()) >= 0 &&
        compareVersions(minecraftVersion, max.trim()) <= 0) {
        return true
      }
    } else {
      // Exact version match
      if (range.trim() === minecraftVersion) {
        return true
      }
    }
  }

  return false
}

/**
 * Compare two Minecraft version strings
 * @returns negative if a < b, positive if a > b, 0 if equal
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number)
  const partsB = b.split('.').map(Number)
  const maxLength = Math.max(partsA.length, partsB.length)

  for (let i = 0; i < maxLength; i++) {
    const numA = partsA[i] || 0
    const numB = partsB[i] || 0
    if (numA !== numB) {
      return numA - numB
    }
  }
  return 0
}
