import { MinecraftFolder, MinecraftLocation, Version as VersionJson } from '@xmcl/core'
import { download, getDownloadBaseOptions } from '@xmcl/file-transfer'
import { open, readEntry } from '@xmcl/unzip'
import { BadForgeInstallerJarError, InstallForgeOptions, isForgeInstallerEntries, unpackForgeInstaller, walkForgeInstallerEntries } from './forge'
import { resolveLibraryDownloadUrls } from './minecraft'
import { InstallProfile, installByProfile } from './profile'
import { normalizeArray } from './utils'
import { ZipValidator } from './zipValdiator'

export async function downloadNeoForgedInstaller(project: 'forge' | 'neoforge', version: string, minecraft: MinecraftLocation, options: InstallForgeOptions): Promise<string> {
  const folder = MinecraftFolder.from(minecraft)
  const url = `https://maven.neoforged.net/releases/net/neoforged/${project}/${version}/${project}-${version}-installer.jar`

  const library = VersionJson.resolveLibrary({
    name: `net.neoforged:${project}:${version}:installer`,
    downloads: {
      artifact: {
        url,
        path: `net/neoforged/${project}/${version}/${project}-${version}-installer.jar`,
        size: -1,
        sha1: '',
      },
    },
  })!
  const mavenHost = options.mavenHost ? normalizeArray(options.mavenHost) : []

  const urls = resolveLibraryDownloadUrls(library, { ...options, mavenHost })

  const installJarPath = folder.getLibraryByPath(library.path)

  await download({
    url: urls,
    destination: installJarPath,
    validator: new ZipValidator(),
    ...getDownloadBaseOptions(options),
    signal: options.signal,
    progressController: (url, chunkSize, progress, total) => {
      options.onForgeInstallerDownloadUpdate?.(version, {
        url,
        chunkSize,
        progress,
        total,
      })
    },
  })

  return installJarPath
}

export async function installNeoForgedTask(project: 'forge' | 'neoforge', version: string, minecraft: MinecraftLocation, options: InstallForgeOptions): Promise<string> {
  const [_, forgeVersion] = version.split('-')
  const mc = MinecraftFolder.from(minecraft)
  const jarPath = await downloadNeoForgedInstaller(project, version, mc, options)

  const zip = await open(jarPath, { lazyEntries: true, autoClose: false })
  const entries = await walkForgeInstallerEntries(zip, forgeVersion)

  if (!entries.installProfileJson) {
    throw new BadForgeInstallerJarError(jarPath, 'install_profile.json')
  }
  const profile: InstallProfile = await readEntry(zip, entries.installProfileJson).then((b) => b.toString()).then(JSON.parse)
  if (isForgeInstallerEntries(entries)) {
    // new forge
    const versionId = await unpackForgeInstaller(zip, entries, forgeVersion, profile, mc, jarPath, options)
    await installByProfile(profile, minecraft, options)
    return versionId
  } else {
    // bad forge
    throw new BadForgeInstallerJarError(jarPath)
  }
}
