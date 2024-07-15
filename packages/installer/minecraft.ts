import { MinecraftFolder, MinecraftLocation, ResolvedLibrary, ResolvedVersion, Version, Version as VersionJson } from '@xmcl/core'
import { ChecksumNotMatchError, DownloadBaseOptions, JsonValidator, download, getDownloadBaseOptions } from '@xmcl/file-transfer'
import type { Abortable } from 'events'
import { readFile, stat, writeFile } from 'fs/promises'
import { join, relative, sep } from 'path'
import { DownloadProgressPayload } from './DownloadProgressPayload'
import { ChecksumOptions, FetchOptions, doFetch, ensureDir, joinUrl, normalizeArray, settled } from './utils'
import { ZipValidator } from './zipValdiator'

/**
 * The function to swap library host.
 */
export type LibraryHost = (library: ResolvedLibrary) => string | string[] | undefined

export interface MinecraftVersionBaseInfo {
  /**
     * The version id, like 1.14.4
     */
  id: string
  /**
     * The version json download url
     */
  url: string
}

/**
 * The version metadata containing the version information, like download url
 */
export interface MinecraftVersion extends MinecraftVersionBaseInfo {
  /**
     * The version id, like 1.14.4
     */
  id: string
  type: string
  time: string
  releaseTime: string
  /**
     * The version json download url
     */
  url: string
}

export interface AssetInfo {
  name: string
  hash: string
  size: number
}

/**
 * Minecraft version metadata list
 */
export interface MinecraftVersionList {
  latest: {
    /**
         * Snapshot version id of the Minecraft
         */
    snapshot: string
    /**
         * Release version id of the Minecraft, like 1.14.2
         */
    release: string
  }
  /**
     * All the vesrsion list
     */
  versions: MinecraftVersion[]
}

/**
 * Default minecraft version manifest url.
 */
export const DEFAULT_VERSION_MANIFEST_URL = 'https://launchermeta.mojang.com/mc/game/version_manifest.json'
/**
 * Default resource/assets url root
 */
export const DEFAULT_RESOURCE_ROOT_URL = 'https://resources.download.minecraft.net'

/**
 * Get and update the version list.
 * This try to send http GET request to offical Minecraft metadata endpoint by default.
 * You can swap the endpoint by passing url on `remote` in option.
 *
 * @returns The new list if there is
 */
export async function getVersionList(options: FetchOptions = {}): Promise<MinecraftVersionList> {
  const response = await doFetch(options, DEFAULT_VERSION_MANIFEST_URL)
  return await response.json() as MinecraftVersionList
}

/**
 * Change the library host url
 */
export interface LibraryOptions extends DownloadBaseOptions, ChecksumOptions, Abortable {
  /**
   * A more flexiable way to control library download url.
   * @see mavenHost
   */
  libraryHost?: LibraryHost
  /**
   * The alterative maven host to download library. It will try to use these host from the `[0]` to the `[maven.length - 1]`
   */
  mavenHost?: string | string[]

  onLibraryDownloadUpdate?: (library: ResolvedLibrary, progress: DownloadProgressPayload) => void
}
/**
 * Change the host url of assets download
 */
export interface AssetsOptions extends DownloadBaseOptions, ChecksumOptions, FetchOptions {
  /**
   * The alternative assets host to download asset. It will try to use these host from the `[0]` to the `[assetsHost.length - 1]`
   */
  assetsHost?: string | string[]
  /**
   * The assets index download or url replacement
   */
  assetsIndexUrl?: string | string[] | ((version: ResolvedVersion) => string | string[])

  /**
   * Only precheck the size of the assets. Do not check the hash.
   */
  prevalidSizeOnly?: boolean

  onLogFileDownloadUpdate?: (progress: DownloadProgressPayload) => void

  onAssetDownloadUpdate?: (asset: AssetInfo, progress: DownloadProgressPayload) => void

  onAssetIndexDownloadUpdate?: (index: Version.AssetIndex, progress: DownloadProgressPayload) => void
}

export type InstallLibraryVersion = Pick<ResolvedVersion, 'libraries' | 'minecraftDirectory'>

function resolveDownloadUrls<T>(original: string, version: T, option?: string | string[] | ((version: T) => string | string[])) {
  const result = [] as string[]
  if (typeof option === 'function') {
    result.unshift(...normalizeArray(option(version)))
  } else {
    result.unshift(...normalizeArray(option))
  }
  if (result.indexOf(original) === -1) {
    result.push(original)
  }
  return result
}
/**
 * Replace the minecraft client or server jar download
 */
export interface JarOption extends DownloadBaseOptions, ChecksumOptions, InstallSideOption, Abortable {
  /**
   * The version json url replacement
   */
  json?: string | string[] | ((version: MinecraftVersionBaseInfo) => string | string[])
  /**
   * The client jar url replacement
   */
  client?: string | string[] | ((version: ResolvedVersion) => string | string[])
  /**
   * The server jar url replacement
   */
  server?: string | string[] | ((version: ResolvedVersion) => string | string[])

  onJarDownloadUpdate?: (version: ResolvedVersion, progress: DownloadProgressPayload) => void

  onJsonDownloadUpdate?: (version: MinecraftVersionBaseInfo, progress: DownloadProgressPayload) => void
}

export interface InstallSideOption {
  /**
     * The installation side
     */
  side?: 'client' | 'server'
}

export type Options = DownloadBaseOptions & ChecksumOptions & AssetsOptions & JarOption & LibraryOptions & InstallSideOption

/**
 * Install the Minecraft game to a location by version metadata.
 *
 * This will install version json, version jar, and all dependencies (assets, libraries)
 *
 * @param versionMeta The version metadata
 * @param minecraft The Minecraft location
 * @param option
 */
export async function install(versionMeta: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, options: Options = {}): Promise<ResolvedVersion> {
  const version = await installVersion(versionMeta, minecraft, options)
  if (options.side !== 'server') {
    await installDependencies(version, options)
  }
  return version
}

/**
 * Only install the json/jar. Do not install dependencies.
 *
 * @param versionMeta the version metadata; get from updateVersionMeta
 * @param minecraft minecraft location
 */
export async function installVersion(versionMeta: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, options: JarOption = {}): Promise<ResolvedVersion> {
  const folder = MinecraftFolder.from(minecraft)
  await installJson(versionMeta, folder, options)
  const version = await VersionJson.parse(folder, versionMeta.id)
  const side = options.side ?? 'client'
  if (version.downloads[side]) {
    await installJar(version as any, folder, options)
  }
  if (side === 'server') {
    const jarPath = folder.getVersionJar(versionMeta.id, 'server')
    const server: Version = {
      id: versionMeta.id,
      type: 'release',
      time: version.time,
      releaseTime: version.releaseTime,
      jar: relative(folder.libraries, jarPath).replaceAll(sep, '/'),
      arguments: {
        game: [],
        jvm: [],
      },
      mainClass: '',
      minimumLauncherVersion: 13,
      libraries: [],
    }
    await writeFile(join(folder.getVersionRoot(versionMeta.id), 'server.json'), JSON.stringify(server, null, 2))
  }
  return version
}

/**
 * Install the completeness of the Minecraft game assets and libraries on a existed version.
 *
 * @param version The resolved version produced by Version.parse
 * @param minecraft The minecraft location
 */
export async function installDependencies(version: ResolvedVersion, options?: Options): Promise<ResolvedVersion> {
  await settled([
    installAssets(version, options),
    installLibraries(version, options),
  ])
  return version
}

/**
 * Install or check the assets to resolved version
 *
 * @param version The target version
 * @param options The option to replace assets host url
 */
export async function installAssets(version: ResolvedVersion, options: AssetsOptions = {}): Promise<ResolvedVersion> {
  const folder = MinecraftFolder.from(version.minecraftDirectory)
  if (version.logging?.client?.file) {
    const file = version.logging.client.file

    await download({
      url: file.url,
      validator: {
        algorithm: 'sha1',
        hash: file.sha1,
      },
      destination: folder.getLogConfig(file.id),
      signal: options.signal,
      progressController: (url, chunkSize, progress, total) => {
        options.onLogFileDownloadUpdate?.({
          url,
          chunkSizeOrStatus: chunkSize,
          progress,
          total,
        })
      },
      ...getDownloadBaseOptions(options),
    })
  }
  const jsonPath = folder.getPath('assets', 'indexes', version.assets + '.json')

  if (version.assetIndex) {
    await installAssetIndex(version as any, options)
  }

  await ensureDir(folder.getPath('assets', 'objects'))
  interface AssetIndex {
    objects: {
      [key: string]: {
        hash: string
        size: number
      }
    }
  }

  const getAssetIndexFallback = async () => {
    const urls = resolveDownloadUrls(version.assetIndex!.url, version, options.assetsIndexUrl)
    for (const url of urls) {
      try {
        const response = await doFetch(options, url)
        const json = await response.json() as any
        await writeFile(jsonPath, JSON.stringify(json))
        return json
      } catch {
        // ignore
      }
    }
  }

  let objectArray: any[]
  try {
    const { objects } = JSON.parse(await readFile(jsonPath).then((b) => b.toString())) as AssetIndex
    objectArray = Object.keys(objects).map((k) => ({ name: k, ...objects[k] }))
  } catch (e) {
    if ((e instanceof SyntaxError)) {
      throw e
    }
    const { objects } = await getAssetIndexFallback()
    objectArray = Object.keys(objects).map((k) => ({ name: k, ...objects[k] }))
  }

  await settled(objectArray.map((o) => installAsset(o, folder, options)))

  return version
}

/**
 * Install all the libraries of providing version
 * @param version The target version
 * @param options The library host swap option
 */
export async function installLibraries(version: InstallLibraryVersion, options: LibraryOptions = {}): Promise<void> {
  const folder = MinecraftFolder.from(version.minecraftDirectory)
  await settled(version.libraries.map((lib) => installLibrary(lib, folder, options)))
}

/**
 * Only install several resolved libraries
 * @param libraries The resolved libraries
 * @param minecraft The minecraft location
 * @param option The install option
 */
export function installResolvedLibraries(libraries: ResolvedLibrary[], minecraft: MinecraftLocation, option?: LibraryOptions) {
  return installLibraries({ libraries, minecraftDirectory: typeof minecraft === 'string' ? minecraft : minecraft.root }, option)
}

/**
 * Only install several resolved assets.
 * @param assets The assets to install
 * @param folder The minecraft folder
 * @param options The asset option
 */
export async function installResolvedAssets(assets: AssetInfo[], folder: MinecraftFolder, options: AssetsOptions = {}) {
  await ensureDir(folder.getPath('assets', 'objects'))

  // const sizes = assets.map((a) => a.size).map((a, b) => a + b, 0);

  await settled(assets.map((o) => installAsset(o, folder, options)))
}

async function installJson(version: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, options: Options) {
  const folder = MinecraftFolder.from(minecraft)
  const destination = folder.getVersionJson(version.id)
  const expectSha1 = version.url.split('/')[5]
  const urls = resolveDownloadUrls(version.url, version, options.json)

  return download({
    url: urls,
    validator: expectSha1 ? options.checksumValidatorResolver?.({ algorithm: 'sha1', hash: expectSha1 }) || { algorithm: 'sha1', hash: expectSha1 } : new JsonValidator(),
    destination,
    ...getDownloadBaseOptions(options),
    signal: options.signal,
    progressController: (url, chunkSize, progress, total) => {
      options.onJsonDownloadUpdate?.(version, {
        chunkSizeOrStatus: chunkSize,
        progress,
        total,
        url,
      })
    },
  })
}

export async function installJar(version: ResolvedVersion & { downloads: Required<ResolvedVersion>['downloads'] }, minecraft: MinecraftLocation, options: Options) {
  const folder = MinecraftFolder.from(minecraft)
  const type = options.side ?? 'client'
  const destination = folder.getVersionJar(version.id, type)
  const _download = version.downloads[type]
  if (!_download) {
    throw new Error(`Cannot find downloadable jar in ${type}`)
  }
  const urls = resolveDownloadUrls(_download.url, version, options[type])
  const expectSha1 = _download.sha1

  return download({
    url: urls,
    validator: options.checksumValidatorResolver?.({ algorithm: 'sha1', hash: expectSha1 }) || { algorithm: 'sha1', hash: expectSha1 },
    destination,
    ...getDownloadBaseOptions(options),
    signal: options.signal,
    progressController: (url, chunkSize, progress, total) => {
      options.onJarDownloadUpdate?.(version, {
        chunkSizeOrStatus: chunkSize,
        progress,
        total,
        url,
      })
    },
  })
}

export async function installAssetIndex(version: ResolvedVersion & { assetIndex: Version.AssetIndex }, options: AssetsOptions = {}) {
  const folder = MinecraftFolder.from(version.minecraftDirectory)
  const jsonPath = folder.getPath('assets', 'indexes', version.assets + '.json')
  const expectSha1 = version.assetIndex.sha1

  return download({
    url: resolveDownloadUrls(version.assetIndex.url, version, options.assetsIndexUrl),
    destination: jsonPath,
    validator: options.checksumValidatorResolver?.({ algorithm: 'sha1', hash: expectSha1 }) || { algorithm: 'sha1', hash: expectSha1 },
    ...getDownloadBaseOptions(options),
    signal: options.signal,
    progressController: (url, chunkSize, progress, total) => {
      options.onAssetIndexDownloadUpdate?.(version.assetIndex, {
        chunkSizeOrStatus: chunkSize,
        progress,
        total,
        url,
      })
    },
  })
}

export async function installLibrary(lib: ResolvedLibrary, folder: MinecraftFolder, options: LibraryOptions) {
  const libraryPath = lib.download.path
  const destination = join(folder.libraries, libraryPath)
  const urls: string[] = resolveLibraryDownloadUrls(lib, options)
  const expectSha1 = lib.download.sha1

  return download({
    url: urls,
    validator: lib.download.sha1 === ''
      ? new ZipValidator()
      : options.checksumValidatorResolver?.({ algorithm: 'sha1', hash: expectSha1 }) || { algorithm: 'sha1', hash: expectSha1 },
    destination,
    ...getDownloadBaseOptions(options),
    skipHead: lib.download.size < 2 * 1024 * 1024,
    signal: options.signal,
    progressController: (url, chunkSize, progress, total) => {
      options.onLibraryDownloadUpdate?.(lib, {
        chunkSizeOrStatus: chunkSize,
        progress,
        total,
        url,
      })
    },
  })
}

async function installAsset(asset: AssetInfo, folder: MinecraftFolder, options: AssetsOptions) {
  const assetsHosts = normalizeArray(options.assetsHost || [])

  if (assetsHosts.indexOf(DEFAULT_RESOURCE_ROOT_URL) === -1) {
    assetsHosts.push(DEFAULT_RESOURCE_ROOT_URL)
  }

  const { hash, size, name } = asset

  const head = hash.substring(0, 2)
  const dir = folder.getPath('assets', 'objects', head)
  const file = join(dir, hash)
  const urls = assetsHosts.map((h) => `${h}/${head}/${hash}`)

  return download({
    url: urls,
    destination: file,
    validator: options.prevalidSizeOnly
      ? {
        async validate(destination, url) {
          const fstat = await stat(destination).catch(() => ({ size: -1 }))
          if (fstat.size !== size) {
            throw new ChecksumNotMatchError('size', size.toString(), fstat.size.toString(), destination, url)
          }
        },
      }
      : options.checksumValidatorResolver?.({ algorithm: 'sha1', hash }) || { algorithm: 'sha1', hash },
    ...getDownloadBaseOptions(options),
    skipHead: asset.size < 2 * 1024 * 1024,
    signal: options.signal,
    progressController: (url, chunkSize, progress, total) => {
      options.onAssetDownloadUpdate?.(asset, {
        chunkSizeOrStatus: chunkSize,
        progress,
        total,
        url,
      })
    },
  })
}

const DEFAULT_MAVENS = ['https://repo1.maven.org/maven2/']

/**
 * Resolve a library download urls with fallback.
 *
 * @param library The resolved library
 * @param libraryOptions The library install options
 */
export function resolveLibraryDownloadUrls(library: ResolvedLibrary, libraryOptions: LibraryOptions): string[] {
  const urls = libraryOptions.libraryHost?.(library) ?? [
    ...normalizeArray(libraryOptions.mavenHost).map((m) => joinUrl(m, library.download.path)),
    library.download.url,
    ...DEFAULT_MAVENS.map((m) => joinUrl(m, library.download.path)),
  ]

  return [...new Set(normalizeArray(urls))]
}
