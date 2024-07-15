import { LibraryInfo, MinecraftFolder, MinecraftLocation } from '@xmcl/core'
import { DownloadBaseOptions, download, getDownloadBaseOptions } from '@xmcl/file-transfer'
import { writeFile } from 'fs/promises'
import { dirname } from 'path'
import { DownloadProgressPayload } from './DownloadProgressPayload'
import { FetchOptions, doFetch, ensureDir } from './utils'

export interface LabyModManifest {
  labyModVersion: string
  commitReference: string
  sha1: string
  releaseTime: number
  size: number

  assets: {
    shader: string
    common: string
    fonts: string
    'vanilla-theme': string
    'fancy-theme': string
    i18n: string
  }

  minecraftVersions: MinecraftVersion[]
}

interface MinecraftVersion {
  tag: string
  version: string
  index: number
  type: string
  runtime: {
    name: string
    version: number
  }
  customManifestUrl: string
}

export async function getLabyModManifest(env = 'production', options?: FetchOptions): Promise<LabyModManifest> {
  const url = `https://laby-releases.s3.de.io.cloud.ovh.net/api/v1/manifest/${env}/latest.json`
  const res = await doFetch(options, url)
  return await res.json() as any
}

export interface InstallLabyModOptions extends DownloadBaseOptions, FetchOptions {
  environment?: string

  onLabyModAssetDownloadUpdate?: (name: string, progress: DownloadProgressPayload) => void
}

async function downloadJson(manifest: LabyModManifest, tag: string, folder: MinecraftFolder, environment: string, options?: InstallLabyModOptions) {
  const librariesUrl = `https://laby-releases.s3.de.io.cloud.ovh.net/api/v1/libraries/${environment}.json`
  const versionInfo = manifest.minecraftVersions.find((v) => v.tag === tag)!

  interface LibInfo {
    name: string
    url: string
    minecraftVersion: string
    sha1: string
    size: number
    natives: any[]
    resolvedAt: number
  }
  // Get version json and merge with libraries
  const libraries: LibInfo[] = await doFetch(options, librariesUrl)
    .then((res) => res.json() as any)
    .then((res) => res.libraries as LibInfo[])
    .then((libs) => libs.filter(lib => lib.minecraftVersion === 'all' || lib.minecraftVersion === tag))
  const versionJson = await doFetch(options, versionInfo.customManifestUrl).then((res) => res.json() as any)

  versionJson.libraries.push(...libraries.map((l) => ({
    name: l.name,
    downloads: {
      artifact: {
        path: LibraryInfo.resolve(l.name).path,
        sha1: l.sha1,
        size: l.size,
        url: l.url,
      },
    },
  })), {
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
  versionJson.id = `LabyMod-4-${tag}-${manifest.commitReference}`

  // write json to file
  const versionPath = folder.getPath('versions', versionJson.id, `${versionJson.id}.json`)
  await ensureDir(dirname(versionPath))
  await writeFile(versionPath, JSON.stringify(versionJson, null, 4))

  return versionJson.id
}

export async function installLabyMod4(manifest: LabyModManifest, tag: string, minecraft: MinecraftLocation, options?: InstallLabyModOptions): Promise<string> {
  const folder = MinecraftFolder.from(minecraft)
  const environment = options?.environment ?? 'production'

  const versionId = await downloadJson(manifest, tag, folder, environment, options)

  // Download assets
  for (const [name, hash] of Object.entries(manifest.assets)) {
    const url = `https://laby-releases.s3.de.io.cloud.ovh.net/api/v1/download/assets/labymod4/${environment}/${manifest.commitReference}/${name}/${hash}.jar`
    const destination = folder.getPath('labymod-neo', 'assets', `${name}.jar`)
    await download({
      url,
      destination,
      validator: { algorithm: 'sha1', hash },
      ...getDownloadBaseOptions(options),
      signal: options?.signal,
      progressController: (url, chunkSize, progress, total) => {
        options?.onLabyModAssetDownloadUpdate?.(name, { url, chunkSizeOrStatus: chunkSize, progress, total })
      },
    })
  }

  return versionId
}
