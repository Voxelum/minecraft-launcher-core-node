import { LibraryInfo, MinecraftFolder, MinecraftLocation, Version as VersionJson } from '@xmcl/core'
import { getDownloadBaseOptions } from '@xmcl/file-transfer'
import { parse as parseForge } from '@xmcl/forge-site-parser'
import { Task, task } from '@xmcl/task'
import { filterEntries, open, openEntryReadStream, readAllEntries, readEntry } from '@xmcl/unzip'
import { createWriteStream } from 'fs'
import { writeFile } from 'fs/promises'
import { basename, dirname, join, relative, sep } from 'path'
import { pipeline } from 'stream/promises'
import { Dispatcher, request } from 'undici'
import { Entry, ZipFile } from 'yauzl'
import { ZipFile as WriteableZipFile } from 'yazl'
import { DownloadTask } from './downloadTask'
import { LibraryOptions, resolveLibraryDownloadUrls } from './minecraft'
import { InstallProfile, InstallProfileOption, installByProfileTask } from './profile'
import { InstallOptions as InstallOptionsBase, ensureDir, ensureFile, joinUrl, normalizeArray } from './utils'
import { ZipValidator } from './zipValdiator'

export interface ForgeVersionList {
  mcversion: string
  versions: ForgeVersion[]
}
/**
 * The forge version metadata to download a forge
 */
export interface ForgeVersion {
  /**
     * The installer info
     */
  installer: {
    md5: string
    sha1: string
    /**
         * The url path to concat with forge maven
         */
    path: string
  }
  universal: {
    md5: string
    sha1: string
    /**
         * The url path to concat with forge maven
         */
    path: string
  }
  /**
     * The minecraft version
     */
  mcversion: string
  /**
     * The forge version (without minecraft version)
     */
  version: string

  type: 'buggy' | 'recommended' | 'common' | 'latest'
}

/**
 * All the useful entries in forge installer jar
 */
export interface ForgeInstallerEntries {
  /**
     *  maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}.jar
     */
  forgeJar?: Entry
  /**
     *  maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-universal.jar
     */
  forgeUniversalJar?: Entry
  /**
     * data/client.lzma
     */
  clientLzma?: Entry
  /**
     * data/server.lzma
     */
  serverLzma?: Entry
  /**
     * install_profile.json
     */
  installProfileJson?: Entry
  /**
     * version.json
     */
  versionJson?: Entry
  /**
   * forge-${forgeVersion}-universal.jar
   */
  legacyUniversalJar?: Entry
  /**
   * forge-${forgeVersion}-shim.jar
   */
  shimJar?: Entry
  /**
   * data/run.sh
   */
  runSh?: Entry
  /**
   * data/run.bat
   */
  runBat?: Entry
  /**
     * data/unix_args.txt
     */
  unixArgs?: Entry
  /**
   * data/user_jvm_args.txt
   */
  userJvmArgs?: Entry
  /**
   * data/win_args.txt
   */
  winArgs?: Entry
}

export type ForgeInstallerEntriesPattern = ForgeInstallerEntries & Required<Pick<ForgeInstallerEntries, 'versionJson' | 'installProfileJson'>>
export type ForgeLegacyInstallerEntriesPattern = Required<Pick<ForgeInstallerEntries, 'installProfileJson' | 'legacyUniversalJar'>>

type RequiredVersion = {
  /**
     * The installer info.
     *
     * If this is not presented, it will genreate from mcversion and forge version.
     */
  installer?: {
    sha1?: string
    /**
     * The url path to concat with forge maven
     */
    path: string
  }
  /**
   * The minecraft version
   */
  mcversion: string
  /**
   * The forge version (without minecraft version)
   */
  version: string
}

export const DEFAULT_FORGE_MAVEN = 'http://files.minecraftforge.net/maven'

/**
 * The options to install forge.
 */
export interface InstallForgeOptions extends LibraryOptions, InstallOptionsBase, InstallProfileOption {
  side?: 'client' | 'server'
}

export class DownloadForgeInstallerTask extends DownloadTask {
  readonly installJarPath: string

  constructor(forgeVersion: string, installer: RequiredVersion['installer'], minecraft: MinecraftFolder, options: InstallForgeOptions, legacy?: boolean) {
    const classifier = legacy ? 'universal' : 'installer'
    const ext = legacy ? 'zip' : 'jar'
    const path = installer
      ? installer.path
      : `net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-${classifier}.${ext}`
    let url: string
    if (installer) {
      try {
        const parsedUrl = new URL(path)
        url = parsedUrl.toString()
      } catch (e) {
        const forgeMavenPath = path.replace('/maven', '').replace('maven', '')
        url = joinUrl(DEFAULT_FORGE_MAVEN, forgeMavenPath)
      }
    } else {
      const forgeMavenPath = path.replace('/maven', '').replace('maven', '')
      url = joinUrl(DEFAULT_FORGE_MAVEN, forgeMavenPath)
    }

    const library = VersionJson.resolveLibrary({
      name: `net.minecraftforge:forge:${forgeVersion}:${classifier}`,
      downloads: {
        artifact: {
          url,
          path: `net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-${classifier}.${ext}`,
          size: -1,
          sha1: installer?.sha1 || '',
        },
      },
    })!
    const mavenHost = options.mavenHost ? normalizeArray(options.mavenHost) : []

    if (mavenHost.indexOf(DEFAULT_FORGE_MAVEN) === -1) {
      mavenHost.push(DEFAULT_FORGE_MAVEN)
    }

    const urls = resolveLibraryDownloadUrls(library, { ...options, mavenHost })

    const installJarPath = minecraft.getLibraryByPath(library.path)

    super({
      url: urls,
      destination: installJarPath,
      validator: installer?.sha1
        ? options.checksumValidatorResolver?.({ algorithm: 'sha1', hash: installer?.sha1 }) || { algorithm: 'sha1', hash: installer?.sha1 }
        : new ZipValidator(),
      ...getDownloadBaseOptions(options),
    })

    this.installJarPath = installJarPath
    this.name = 'downloadInstaller'
    this.param = { version: forgeVersion }
  }
}

function getLibraryPathWithoutMaven(mc: MinecraftFolder, name: string) {
  // remove the maven/ prefix
  return mc.getLibraryByPath(name.substring(name.indexOf('/') + 1))
}
function extractEntryTo(zip: ZipFile, e: Entry, dest: string) {
  return openEntryReadStream(zip, e).then((stream) => pipeline(stream, createWriteStream(dest)))
}

async function installLegacyForgeFromUniversalZip(forgeZip: ZipFile, mc: MinecraftFolder, forgeVersion: string, mcVersion: string) {
  const minecraftZip = await open(mc.getVersionJar(mcVersion), { lazyEntries: true, autoClose: false })
  const forgeEntries = await readAllEntries(forgeZip)
  const mcEntries = await readAllEntries(minecraftZip)
  const finalZipEntries: Record<string, [Entry, ZipFile]> = {}
  // forge entries overwrite mc entries
  for (const e of mcEntries) {
    if (e.fileName.startsWith('META-INF')) continue
    finalZipEntries[e.fileName] = [e, minecraftZip]
  }
  for (const e of forgeEntries) {
    if (e.fileName.startsWith('META-INF')) continue
    finalZipEntries[e.fileName] = [e, forgeZip]
  }
  const finalZip = new WriteableZipFile()
  for (const [k, [e, zip]] of Object.entries(finalZipEntries)) {
    finalZip.addReadStream(await openEntryReadStream(zip, e), e.fileName)
  }
  finalZip.end()
  const dest = mc.getLibraryByPath(`net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}.jar`)
  await ensureDir(dirname(dest))
  await pipeline(finalZip.outputStream, createWriteStream(dest))
  const versionId = `${mcVersion}-forge-${forgeVersion}`
  await ensureDir(mc.getVersionRoot(versionId))
  const versionJson: VersionJson = {
    id: versionId,
    inheritsFrom: mcVersion,
    time: new Date().toUTCString(),
    type: 'release',
    releaseTime: new Date().toUTCString(),
    minimumLauncherVersion: 4,
    arguments: {
      game: [
      ],
      // eslint-disable-next-line no-template-curly-in-string
      jvm: ['-Dminecraft.applet.TargetDirectory=${game_directory}'],
    },
    mainClass: 'net.minecraft.launchwrapper.Launch',
    libraries: [
      { name: `net.minecraftforge:forge:${forgeVersion}` },
      {
        downloads: {
          artifact: {
            path: 'guava-12.0.1.jar',
            sha1: 'b8e78b9af7bf45900e14c6f958486b6ca682195f',
            size: -1,
            url: 'https://files.minecraftforge.net/maven/com/google/guava/guava/12.0.1/guava-12.0.1.jar',
          },
        },
        name: 'com.google.guava:guava:12.0.1',
      },
      {
        downloads: {
          artifact: {
            path: 'argo-2.25.jar',
            sha1: 'bb672829fde76cb163004752b86b0484bd0a7f4b',
            size: -1,
            url: 'https://files.minecraftforge.net/maven/net/sourceforge/argo/argo/2.25/argo-2.25.jar',
          },
        },
        name: 'net.sourceforge.argo:argo:2.25',
      },
      {
        downloads: {
          artifact: {
            path: 'asm-all-4.0.jar',
            sha1: '98308890597acb64047f7e896638e0d98753ae82',
            size: -1,
            url: 'https://files.multimc.org/fmllibs/asm-all-4.0.jar',
          },
        },
        name: 'org.ow2.asm:asm-all:4.0',
      },
      {
        downloads: {
          artifact: {
            path: 'bcprov-jdk15on-147.jar',
            sha1: 'b6f5d9926b0afbde9f4dbe3db88c5247be7794bb',
            size: -1,
            url: 'https://files.multimc.org/fmllibs/bcprov-jdk15on-147.jar',
          },
        },
        name: 'org.bouncycastle:bcprov-jdk15on:1.47',
      },
    ],
  }
  await writeFile(mc.getVersionJson(versionId), JSON.stringify(versionJson, null, 4))
  return versionId
}

async function installLegacyForgeFromZip(zip: ZipFile, entries: ForgeLegacyInstallerEntriesPattern, profile: InstallProfile, mc: MinecraftFolder, jarFilePath: string, options: InstallForgeOptions) {
  const versionJson = profile.versionInfo
  if (!versionJson) {
    throw new Error(`Malform legacy installer json ${profile.version}`)
  }

  // apply override for inheritsFrom
  versionJson.id = options.versionId || versionJson.id
  versionJson.inheritsFrom = options.inheritsFrom || versionJson.inheritsFrom

  const rootPath = mc.getVersionRoot(versionJson.id)
  const versionJsonPath = join(rootPath, `${versionJson.id}.json`)
  await ensureFile(versionJsonPath)

  const forgeLib = versionJson.libraries.find((l) => l.name.startsWith('net.minecraftforge:forge') || l.name.startsWith('net.minecraftforge:minecraftforge'))
  if (!forgeLib) {
    throw new BadForgeInstallerJarError(jarFilePath)
  }
  const library = LibraryInfo.resolve(forgeLib)
  const jarPath = mc.getLibraryByPath(library.path)
  await ensureFile(jarPath)

  await Promise.all([
    writeFile(versionJsonPath, JSON.stringify(versionJson, undefined, 4)),
    extractEntryTo(zip, entries.legacyUniversalJar, jarPath),
  ])

  return versionJson.id
}

/**
 * Unpack forge installer jar file content to the version library artifact directory.
 * @param zip The forge jar file
 * @param entries The entries
 * @param profile The forge install profile
 * @param mc The minecraft location
 * @returns The installed version id
 */
export async function unpackForgeInstaller(zip: ZipFile, entries: ForgeInstallerEntriesPattern, profile: InstallProfile, mc: MinecraftFolder, jarPath: string, options: InstallForgeOptions) {
  const versionJson: VersionJson = await readEntry(zip, entries.versionJson).then((b) => b.toString()).then(JSON.parse)

  // apply override for inheritsFrom
  versionJson.id = options.versionId || versionJson.id
  versionJson.inheritsFrom = options.inheritsFrom || versionJson.inheritsFrom

  // resolve all the required paths
  const rootPath = mc.getVersionRoot(versionJson.id)

  const versionJsonPath = join(rootPath, `${versionJson.id}.json`)
  const installJsonPath = join(rootPath, 'install_profile.json')

  const mavenLibVersionPath = dirname(jarPath)

  const unpackData = (entry: Entry) => {
    promises.push(extractEntryTo(zip, entry, join(mavenLibVersionPath, entry.fileName.substring('data/'.length))))
  }

  await ensureFile(versionJsonPath)

  const promises: Promise<void>[] = []
  if (entries.forgeUniversalJar) {
    promises.push(extractEntryTo(zip, entries.forgeUniversalJar, getLibraryPathWithoutMaven(mc, entries.forgeUniversalJar.fileName)))
  }

  if (!profile.data) {
    profile.data = {}
  }

  const mavenPaths = relative(mc.libraries, mavenLibVersionPath).split(sep)
  const mavenVersion = mavenPaths.pop()
  const mavenArtifact = mavenPaths.pop()
  const mavenGroup = mavenPaths.join('.')
  const mavenPath = `${mavenGroup}:${mavenArtifact}:${mavenVersion}`

  const installerMaven = `${mavenPath}:installer`
  profile.data.INSTALLER = {
    client: `[${installerMaven}]`,
    server: `[${installerMaven}]`,
  }

  if (entries.serverLzma) {
    // forge version and mavens, compatible with twitch api
    const serverMaven = `${mavenPath}:serverdata@lzma`
    // override forge bin patch location
    profile.data.BINPATCH.server = `[${serverMaven}]`

    const serverBinPath = mc.getLibraryByPath(LibraryInfo.resolve(serverMaven).path)
    await ensureFile(serverBinPath)
    promises.push(extractEntryTo(zip, entries.serverLzma, serverBinPath))
  }

  if (entries.clientLzma) {
    // forge version and mavens, compatible with twitch api
    const clientMaven = `${mavenPath}:clientdata@lzma`
    // override forge bin patch location
    profile.data.BINPATCH.client = `[${clientMaven}]`

    const clientBinPath = mc.getLibraryByPath(LibraryInfo.resolve(clientMaven).path)
    await ensureFile(clientBinPath)
    promises.push(extractEntryTo(zip, entries.clientLzma, clientBinPath))
  }

  if (entries.forgeJar) {
    promises.push(extractEntryTo(zip, entries.forgeJar, getLibraryPathWithoutMaven(mc, entries.forgeJar.fileName)))
  }
  if (entries.runBat) { unpackData(entries.runBat) }
  if (entries.runSh) { unpackData(entries.runSh) }
  if (entries.winArgs) { unpackData(entries.winArgs) }
  if (entries.unixArgs) { unpackData(entries.unixArgs) }
  if (entries.userJvmArgs) { unpackData(entries.userJvmArgs) }

  promises.push(
    writeFile(installJsonPath, JSON.stringify(profile)),
    writeFile(versionJsonPath, JSON.stringify(versionJson)),
  )

  await Promise.all(promises)

  return versionJson.id
}

export function isLegacyForgeInstallerEntries(entries: ForgeInstallerEntries): entries is ForgeLegacyInstallerEntriesPattern {
  return !!entries.legacyUniversalJar && !!entries.installProfileJson
}

export function isForgeInstallerEntries(entries: ForgeInstallerEntries): entries is ForgeInstallerEntriesPattern {
  return !!entries.installProfileJson && !!entries.versionJson
}

/**
 * Walk the forge installer file to find key entries
 * @param zip THe forge instal
 * @param forgeVersion Forge version to install
 */
export async function walkForgeInstallerEntries(zip: ZipFile, forgeVersion: string): Promise<ForgeInstallerEntries> {
  const [forgeJar, forgeUniversalJar, shimJar, clientLzma, serverLzma, installProfileJson, versionJson, legacyUniversalJar, runSh, runBat, unixArgs, userJvmArgs, winArgs] = await filterEntries(zip, [
    `maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}.jar`,
    `maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-universal.jar`,
    `maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-shim.jar`,
    'data/client.lzma',
    'data/server.lzma',
    'install_profile.json',
    'version.json',
    (e) => e.fileName === `forge-${forgeVersion}-universal.jar` || (e.fileName.startsWith('forge-') && e.fileName.endsWith('-universal.jar')) || (e.fileName.startsWith('minecraftforge-universal-')), // legacy installer format
    'data/run.sh',
    'data/run.bat',
    'data/unix_args.txt',
    'data/user_jvm_args.txt',
    'data/win_args.txt',
  ])
  return {
    forgeJar,
    forgeUniversalJar,
    shimJar,
    clientLzma,
    serverLzma,
    installProfileJson,
    versionJson,
    legacyUniversalJar,
    runSh,
    runBat,
    unixArgs,
    userJvmArgs,
    winArgs,
  }
}

export class BadForgeInstallerJarError extends Error {
  name = 'BadForgeInstallerJarError'

  constructor(
    public jarPath: string,
    /**
         * What entry in jar is missing
         */
    public entry?: string) {
    super(entry ? `Missing entry ${entry} in forge installer jar: ${jarPath}` : `Bad forge installer: ${jarPath}`)
  }
}

export function installByInstallerTask(version: RequiredVersion, minecraft: MinecraftLocation, options: InstallForgeOptions) {
  return task('installForge', async function () {
    function getForgeArtifactVersion() {
      const [_, minor] = version.mcversion.split('.')
      const minorVersion = Number.parseInt(minor)
      if (minorVersion >= 7 && minorVersion <= 8) {
        return `${version.mcversion}-${version.version}-${version.mcversion}`
      }
      if (version.version.startsWith(version.mcversion)) {
        return version.version
      }
      return `${version.mcversion}-${version.version}`
    }
    const forgeVersion = getForgeArtifactVersion()
    const isLegacy = version.mcversion.startsWith('1.4.')
    const mc = MinecraftFolder.from(minecraft)
    const jarPath: string = await this.yield(new DownloadForgeInstallerTask(forgeVersion, version.installer, mc, options, isLegacy)
      .map(function () { return this.installJarPath }))

    if (isLegacy) {
      const forgeZip = await open(jarPath, { lazyEntries: true, autoClose: false })
      const versionId = await installLegacyForgeFromUniversalZip(forgeZip, mc, forgeVersion, version.mcversion)
      return versionId
    }

    const zip = await open(jarPath, { lazyEntries: true, autoClose: false })
    const entries = await walkForgeInstallerEntries(zip, forgeVersion)

    if (!entries.installProfileJson) {
      throw new BadForgeInstallerJarError(jarPath, 'install_profile.json')
    }
    const profile: InstallProfile = await readEntry(zip, entries.installProfileJson).then((b) => b.toString()).then(JSON.parse)
    if (isForgeInstallerEntries(entries)) {
      // new forge
      const versionId = await unpackForgeInstaller(zip, entries, profile, mc, jarPath, options)
      await this.concat(installByProfileTask(profile, minecraft, options))
      return versionId
    } else if (isLegacyForgeInstallerEntries(entries)) {
      // legacy forge
      return installLegacyForgeFromZip(zip, entries, profile, mc, jarPath, options)
    } else {
      // bad forge
      throw new BadForgeInstallerJarError(jarPath)
    }
  })
}

/**
 * Install forge to target location.
 * Installation task for forge with mcversion >= 1.13 requires java installed on your pc.
 * @param version The forge version meta
 * @returns The installed version name.
 * @throws {@link BadForgeInstallerJarError}
 */
export function installForge(version: RequiredVersion, minecraft: MinecraftLocation, options?: InstallForgeOptions) {
  return installForgeTask(version, minecraft, options).startAndWait()
}

/**
 * Install forge to target location.
 * Installation task for forge with mcversion >= 1.13 requires java installed on your pc.
 * @param version The forge version meta
 * @returns The task to install the forge
 * @throws {@link BadForgeInstallerJarError}
 */
export function installForgeTask(version: RequiredVersion, minecraft: MinecraftLocation, options: InstallForgeOptions = {}): Task<string> {
  return installByInstallerTask(version, minecraft, options)
}

/**
 * Query the webpage content from files.minecraftforge.net.
 *
 * You can put the last query result to the fallback option. It will check if your old result is up-to-date.
 * It will request a new page only when the fallback option is outdated.
 *
 * @param option The option can control querying minecraft version, and page caching.
 */
export async function getForgeVersionList(options: {
  /**
     * The minecraft version you are requesting
     */
  minecraft?: string
  dispatcher?: Dispatcher
} = {}): Promise<ForgeVersionList> {
  const mcversion = options.minecraft || ''
  const url = mcversion === '' ? 'http://files.minecraftforge.net/maven/net/minecraftforge/forge/index.html' : `http://files.minecraftforge.net/maven/net/minecraftforge/forge/index_${mcversion}.html`
  const response = await request(url, {
    dispatcher: options.dispatcher,
    maxRedirections: 3,
  })
  const body = parseForge(await response.body.text())
  return body as any
}
