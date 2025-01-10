/* eslint-disable n/no-unsupported-features/node-builtins */
import { LibraryInfo, MinecraftFolder, MinecraftLocation } from '@xmcl/core'
import { DownloadBaseOptions, getDownloadBaseOptions } from '@xmcl/file-transfer'
import { AbortableTask, CancelledError, Task, task } from '@xmcl/task'
import { writeFile } from 'fs/promises'
import { dirname } from 'path'
import { Dispatcher, request } from 'undici'
import { DownloadTask } from './downloadTask'
import { ensureDir } from './utils'

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

export async function getLabyModManifest(env = 'production', options?: { dispatcher?: Dispatcher }): Promise<LabyModManifest> {
  const url = `https://laby-releases.s3.de.io.cloud.ovh.net/api/v1/manifest/${env}/latest.json`
  const res = await request(url, options)
  return await res.body.json() as any
}

export interface InstallLabyModOptions extends DownloadBaseOptions {
  dispatcher?: Dispatcher
  environment?: string
  fetch?: typeof fetch
}

class JsonTask extends AbortableTask<string> {
  private controller = new AbortController()

  constructor(private manifest: LabyModManifest, private tag: string, private folder: MinecraftFolder, private environment: string, private fetch?: typeof globalThis.fetch) {
    super()
    this.name = 'json'
    this.param = { version: tag }
  }

  protected async process(): Promise<string> {
    this.controller = new AbortController()
    const librariesUrl = `https://laby-releases.s3.de.io.cloud.ovh.net/api/v1/libraries/${this.environment}.json`
    const versionInfo = this.manifest.minecraftVersions.find((v) => v.tag === this.tag)!

    interface LibInfo {
      name: string
      url: string
      minecraftVersion: string
      sha1: string
      size: number
      natives: any[]
      resolvedAt: number
    }

    const fetch = this.fetch ?? globalThis.fetch

    const metadataResponse = await fetch(librariesUrl, { signal: this.controller.signal })

    if (!metadataResponse.ok) {
      throw Object.assign(new Error(`Failed to fetch libraries metadata: ${metadataResponse.statusText}: ${await metadataResponse.text()}`), {
        name: 'FetchLabyModMetadataError',
      })
    }
    // Get version json and merge with libraries
    const libraries: LibInfo[] = await metadataResponse.json()
      .then((res) => res.libraries as LibInfo[])
      .then((libs) => libs.filter(lib => lib.minecraftVersion === 'all' || lib.minecraftVersion === this.tag))

    const versionJsonResponse = await fetch(versionInfo.customManifestUrl, { signal: this.controller.signal })

    if (!versionJsonResponse.ok) {
      throw Object.assign(new Error(`Failed to fetch version json: ${versionJsonResponse.statusText}: ${await versionJsonResponse.text()}`), {
        name: 'FetchLabyModVersionJsonError',
      })
    }
    const versionJson = await versionJsonResponse.json()

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
      name: `net.labymod:LabyMod:${this.manifest.labyModVersion}`,
      downloads: {
        artifact: {
          path: `net/labymod/LabyMod/${this.manifest.labyModVersion}/LabyMod-${this.manifest.labyModVersion}.jar`,
          sha1: this.manifest.sha1,
          size: this.manifest.size,
          url: `https://laby-releases.s3.de.io.cloud.ovh.net/api/v1/download/labymod4/${this.environment}/${this.manifest.commitReference}.jar`,
        },
      },
    })
    versionJson.id = `LabyMod-4-${this.tag}-${this.manifest.commitReference}`

    // write json to file
    const versionPath = this.folder.getPath('versions', versionJson.id, `${versionJson.id}.json`)
    await ensureDir(dirname(versionPath))
    await writeFile(versionPath, JSON.stringify(versionJson, null, 4))

    return versionJson.id
  }

  protected abort(isCancelled: boolean): void {
    this.controller.abort(new CancelledError())
  }

  protected isAbortedError(e: any): boolean {
    return e instanceof CancelledError
  }
}

export function installLabyMod4Task(manifest: LabyModManifest, tag: string, minecraft: MinecraftLocation, options?: InstallLabyModOptions): Task<string> {
  return task('installLabyMod', async function () {
    const folder = MinecraftFolder.from(minecraft)
    const environment = options?.environment ?? 'production'

    const versionId = await this.yield(new JsonTask(manifest, tag, folder, environment, options?.fetch))

    // Download assets
    for (const [name, hash] of Object.entries(manifest.assets)) {
      const url = `https://laby-releases.s3.de.io.cloud.ovh.net/api/v1/download/assets/labymod4/${environment}/${manifest.commitReference}/${name}/${hash}.jar`
      const destination = folder.getPath('labymod-neo', 'assets', `${name}.jar`)
      await this.yield(new DownloadTask({
        url,
        destination,
        validator: { algorithm: 'sha1', hash },
        ...getDownloadBaseOptions(options),
      }).setName('asset', { name }))
    }

    return versionId
  })
}

export function installLaby4Mod(manifest: LabyModManifest, tag: string, minecraft: MinecraftLocation, options?: InstallLabyModOptions): Promise<string> {
  return installLabyMod4Task(manifest, tag, minecraft, options).startAndWait()
}
