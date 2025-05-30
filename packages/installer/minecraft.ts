/* eslint-disable n/no-unsupported-features/node-builtins */
import { MinecraftFolder, MinecraftLocation, ResolvedLibrary, ResolvedVersion, Version, Version as VersionJson } from '@xmcl/core'
import { ChecksumNotMatchError, ChecksumValidatorOptions, DownloadBaseOptions, JsonValidator, Validator, getDownloadBaseOptions } from '@xmcl/file-transfer'
import { Task, task } from '@xmcl/task'
import { link } from 'fs'
import { readFile, stat, writeFile } from 'fs/promises'
import { join, relative, sep } from 'path'
import { promisify } from 'util'
import { DownloadMultipleTask, DownloadTask } from './downloadTask'
import { ParallelTaskOptions, ensureDir, joinUrl, normalizeArray } from './utils'
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
export async function getVersionList(options: {
  /**
   * Request dispatcher
   */
  fetch?: typeof fetch,
  remote?: string
} = {}): Promise<MinecraftVersionList> {
  const response = await (options.fetch ?? fetch)(options.remote ?? DEFAULT_VERSION_MANIFEST_URL);
  return await response.json() as any
}

/**
 * Change the library host url
 */
export interface LibraryOptions extends DownloadBaseOptions, ParallelTaskOptions {
  /**
   * A more flexiable way to control library download url.
   * @see mavenHost
   */
  libraryHost?: LibraryHost
  /**
   * The alterative maven host to download library. It will try to use these host from the `[0]` to the `[maven.length - 1]`
   */
  mavenHost?: string | string[]
  /**
   * Control how many libraries download task should run at the same time.
   * It will override the `maxConcurrencyOption` if this is presented.
   *
   * This will be ignored if you have your own downloader assigned.
   */
  librariesDownloadConcurrency?: number

  checksumValidatorResolver?: (checksum: ChecksumValidatorOptions) => Validator
}
/**
 * Change the host url of assets download
 */
export interface AssetsOptions extends DownloadBaseOptions, ParallelTaskOptions {
  /**
   * The alternative assets host to download asset. It will try to use these host from the `[0]` to the `[assetsHost.length - 1]`
   */
  assetsHost?: string | string[]
  /**
   * Control how many assets download task should run at the same time.
   * It will override the `maxConcurrencyOption` if this is presented.
   *
   * This will be ignored if you have your own downloader assigned.
   */
  assetsDownloadConcurrency?: number
  /**
   * Use hash as the assets index file name. Default is `false`
   */
  useHashForAssetsIndex?: boolean
  /**
   * The assets index download or url replacement
   */
  assetsIndexUrl?: string | string[] | ((version: ResolvedVersion) => string | string[])

  fetch?: typeof fetch

  checksumValidatorResolver?: (checksum: ChecksumValidatorOptions) => Validator
  /**
   * Only precheck the size of the assets. Do not check the hash.
   */
  prevalidSizeOnly?: boolean
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
export interface JarOption extends DownloadBaseOptions, ParallelTaskOptions, InstallSideOption {
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

  checksumValidatorResolver?: (checksum: ChecksumValidatorOptions) => Validator
}

export interface InstallSideOption {
  /**
     * The installation side
     */
  side?: 'client' | 'server'
}

export type Options = DownloadBaseOptions & ParallelTaskOptions & AssetsOptions & JarOption & LibraryOptions & InstallSideOption

/**
 * Install the Minecraft game to a location by version metadata.
 *
 * This will install version json, version jar, and all dependencies (assets, libraries)
 *
 * @param versionMeta The version metadata
 * @param minecraft The Minecraft location
 * @param option
 */
export async function install(versionMeta: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, option: Options = {}): Promise<ResolvedVersion> {
  return installTask(versionMeta, minecraft, option).startAndWait()
}

/**
 * Only install the json/jar. Do not install dependencies.
 *
 * @param versionMeta the version metadata; get from updateVersionMeta
 * @param minecraft minecraft location
 */
export function installVersion(versionMeta: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, options: JarOption = {}): Promise<ResolvedVersion> {
  return installVersionTask(versionMeta, minecraft, options).startAndWait()
}

/**
 * Install the completeness of the Minecraft game assets and libraries on a existed version.
 *
 * @param version The resolved version produced by Version.parse
 * @param minecraft The minecraft location
 */
export function installDependencies(version: ResolvedVersion, options?: Options): Promise<ResolvedVersion> {
  return installDependenciesTask(version, options).startAndWait()
}

/**
 * Install or check the assets to resolved version
 *
 * @param version The target version
 * @param options The option to replace assets host url
 */
export function installAssets(version: ResolvedVersion, options: AssetsOptions = {}): Promise<ResolvedVersion> {
  return installAssetsTask(version, options).startAndWait()
}

/**
 * Install all the libraries of providing version
 * @param version The target version
 * @param options The library host swap option
 */
export function installLibraries(version: ResolvedVersion, options: LibraryOptions = {}): Promise<void> {
  return installLibrariesTask(version, options).startAndWait()
}

/**
 * Only install several resolved libraries
 * @param libraries The resolved libraries
 * @param minecraft The minecraft location
 * @param option The install option
 */
export async function installResolvedLibraries(libraries: ResolvedLibrary[], minecraft: MinecraftLocation, option?: LibraryOptions): Promise<void> {
  await installLibrariesTask({ libraries, minecraftDirectory: typeof minecraft === 'string' ? minecraft : minecraft.root }, option).startAndWait()
}

/**
 * Install the Minecraft game to a location by version metadata.
 *
 * This will install version json, version jar, and all dependencies (assets, libraries)
 *
 * @param type The type of game, client or server
 * @param versionMeta The version metadata
 * @param minecraft The Minecraft location
 * @param options
 */
export function installTask(versionMeta: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, options: Options = {}): Task<ResolvedVersion> {
  return task('install', async function () {
    const version = await this.yield(installVersionTask(versionMeta, minecraft, options))
    if (options.side !== 'server') {
      await this.yield(installDependenciesTask(version, options))
    }
    return version
  })
}
/**
 * Only install the json/jar. Do not install dependencies.
 *
 * @param type client or server
 * @param versionMeta the version metadata; get from updateVersionMeta
 * @param minecraft minecraft location
 */
export function installVersionTask(versionMeta: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, options: JarOption = {}): Task<ResolvedVersion> {
  return task('version', async function () {
    const folder = MinecraftFolder.from(minecraft)
    await this.yield(new InstallJsonTask(versionMeta, folder, options))
    const version = await VersionJson.parse(folder, versionMeta.id)
    const side = options.side ?? 'client'
    if (version.downloads[side]) {
      await this.yield(new InstallJarTask(version as any, folder, options))
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
  }, versionMeta)
}

/**
 * Install the completeness of the Minecraft game assets and libraries on a existed version.
 *
 * @param version The resolved version produced by Version.parse
 * @param minecraft The minecraft location
 */
export function installDependenciesTask(version: ResolvedVersion, options: Options = {}): Task<ResolvedVersion> {
  return task('dependencies', async function () {
    await Promise.all([
      this.yield(installAssetsTask(version, options)),
      this.yield(installLibrariesTask(version, options)),
    ])
    return version
  })
}

/**
 * Install or check the assets to resolved version
 *
 * @param version The target version
 * @param options The option to replace assets host url
 */
export function installAssetsTask(version: ResolvedVersion, options: AssetsOptions = {}): Task<ResolvedVersion> {
  return task('assets', async function () {
    const folder = MinecraftFolder.from(version.minecraftDirectory)
    if (version.logging?.client?.file) {
      const file = version.logging.client.file

      await this.yield(new DownloadTask({
        url: file.url,
        validator: {
          algorithm: 'sha1',
          hash: file.sha1,
        },
        destination: folder.getLogConfig(file.id),
        ...getDownloadBaseOptions(options),
      }).setName('asset', { name: file.id, hash: file.sha1, size: file.size }))
    }
    const jsonPath = folder.getPath('assets', 'indexes', (version.assetIndex?.sha1 ?? version.assets) + '.json')

    if (version.assetIndex) {
      await this.yield(new InstallAssetIndexTask(version as any, options))
      await promisify(link)(
        folder.getPath('assets', 'indexes', version.assetIndex.sha1 + '.json'),
        folder.getPath('assets', 'indexes', version.assets + '.json'),
      ).catch(() => { })
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
          const response = await (options.fetch || fetch)(url, { })
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
      const { objects } = await getAssetIndexFallback()
      objectArray = Object.keys(objects).map((k) => ({ name: k, ...objects[k] }))
    }
    await this.yield(new InstallAssetTask(objectArray, folder, options))

    return version
  })
}

/**
 * Install all the libraries of providing version
 * @param version The target version
 * @param options The library host swap option
 */
export function installLibrariesTask(version: InstallLibraryVersion, options: LibraryOptions = {}): Task<void> {
  return new InstallLibraryTask(version.libraries, MinecraftFolder.from(version.minecraftDirectory), options)
    .setName('libraries', { count: version.libraries.length })
}

/**
 * Only install several resolved libraries
 * @param libraries The resolved libraries
 * @param minecraft The minecraft location
 * @param option The install option
 */
export function installResolvedLibrariesTask(libraries: ResolvedLibrary[], minecraft: MinecraftLocation, option?: LibraryOptions) {
  return installLibrariesTask({ libraries, minecraftDirectory: typeof minecraft === 'string' ? minecraft : minecraft.root }, option)
}

/**
 * Only install several resolved assets.
 * @param assets The assets to install
 * @param folder The minecraft folder
 * @param options The asset option
 */
export function installResolvedAssetsTask(assets: AssetInfo[], folder: MinecraftFolder, options: AssetsOptions = {}) {
  return task('assets', async function () {
    await ensureDir(folder.getPath('assets', 'objects'))

    await this.yield(new InstallAssetTask(assets, folder, options))
  })
}

export class InstallJsonTask extends DownloadTask {
  constructor(version: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, options: Options) {
    const folder = MinecraftFolder.from(minecraft)
    const destination = folder.getVersionJson(version.id)
    const expectSha1 = version.url.split('/')[5]
    const urls = resolveDownloadUrls(version.url, version, options.json)

    super({
      url: urls,
      validator: expectSha1 ? options.checksumValidatorResolver?.({ algorithm: 'sha1', hash: expectSha1 }) || { algorithm: 'sha1', hash: expectSha1 } : new JsonValidator(),
      destination,
      ...getDownloadBaseOptions(options),
    })

    this.name = 'json'
    this.param = version
  }
}

export class InstallJarTask extends DownloadTask {
  constructor(version: ResolvedVersion & { downloads: Required<ResolvedVersion>['downloads'] }, minecraft: MinecraftLocation, options: Options) {
    const folder = MinecraftFolder.from(minecraft)
    const type = options.side ?? 'client'
    const destination = folder.getVersionJar(version.id, type)
    const download = version.downloads[type]
    if (!download) {
      throw new Error(`Cannot find downloadable jar in ${type}`)
    }
    const urls = resolveDownloadUrls(download.url, version, options[type])
    const expectSha1 = download.sha1

    super({
      url: urls,
      validator: options.checksumValidatorResolver?.({ algorithm: 'sha1', hash: expectSha1 }) || { algorithm: 'sha1', hash: expectSha1 },
      destination,
      ...getDownloadBaseOptions(options),
    })

    this.name = 'jar'
    this.param = version
  }
}

export class InstallAssetIndexTask extends DownloadTask {
  constructor(version: ResolvedVersion & { assetIndex: Version.AssetIndex }, options: AssetsOptions = {}) {
    const folder = MinecraftFolder.from(version.minecraftDirectory)
    const expectSha1 = version.assetIndex.sha1
    const jsonPath = folder.getPath('assets', 'indexes', (options.useHashForAssetsIndex ? expectSha1 : version.assets) + '.json')

    super({
      url: resolveDownloadUrls(version.assetIndex.url, version, options.assetsIndexUrl),
      destination: jsonPath,
      validator: options.checksumValidatorResolver?.({ algorithm: 'sha1', hash: expectSha1 }) || { algorithm: 'sha1', hash: expectSha1 },
      ...getDownloadBaseOptions(options),
    })

    this.name = 'assetIndex'
    this.param = version
  }
}

export class InstallLibraryTask extends DownloadMultipleTask {
  constructor(libs: ResolvedLibrary[], folder: MinecraftFolder, options: LibraryOptions) {
    super(libs.map(lib => {
      const libraryPath = lib.download.path
      const destination = join(folder.libraries, libraryPath)
      const urls: string[] = resolveLibraryDownloadUrls(lib, options)
      const expectSha1 = lib.download.sha1
      return {
        url: urls,
        validator: lib.download.sha1 === ''
          ? new ZipValidator()
          : options.checksumValidatorResolver?.({ algorithm: 'sha1', hash: expectSha1 }) || { algorithm: 'sha1', hash: expectSha1 },
        destination,
        ...getDownloadBaseOptions(options),
        skipHead: lib.download.size < 2 * 1024 * 1024,
      }
    }))

    this.name = 'library'
    this._total = libs.reduce((a, b) => a + (b.download?.size ?? 0), 0)
    this.param = { count: libs.length }
  }
}

export class InstallAssetTask extends DownloadMultipleTask {
  #total = 0

  constructor(assets: AssetInfo[], folder: MinecraftFolder, options: AssetsOptions) {
    const assetsHosts = normalizeArray(options.assetsHost || [])

    if (assetsHosts.indexOf(DEFAULT_RESOURCE_ROOT_URL) === -1) {
      assetsHosts.push(DEFAULT_RESOURCE_ROOT_URL)
    }

    super(assets.map((asset) => {
      const { hash, size, name } = asset
      const head = hash.substring(0, 2)
      const dir = folder.getPath('assets', 'objects', head)
      const file = join(dir, hash)
      const urls = assetsHosts.map((h) => `${h}/${head}/${hash}`)
      return {
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
      }
    }))

    this.#total = assets.reduce((a, b) => a + b.size, 0)
    this.name = 'asset'
    this.param = { count: assets.length }
  }

  get total(): number {
    return this.#total
  }
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
