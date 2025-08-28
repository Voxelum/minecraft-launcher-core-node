import { readFile } from 'fs-extra'
import { join } from 'path'
import { pathToFileURL } from 'url'
import { CreateInstanceOptions } from '../instance'
import { InstanceFile } from '../instance-files'
import { getInstanceFiles } from '../instance-files-discovery'
import { InstanceSystemEnv } from '../internal-type'
import { CurseforgeModpackManifest, getInstanceConfigFromCurseforgeModpack } from '../modpack'

/**
 * Curseforge launcher instance configuration
 */
export interface CurseforgeInstance {
  baseModLoader: {
    forgeVersion?: string
    name: string
    downloadUrl: string
    versionJson: string
    minecraftVersion: string
    installProfileJson?: string
  }
  gameVersion: string
  javaArgsOverride?: string
  name: string
  lastPlayed: string
  manifest: CurseforgeModpackManifest
  projectID: number
  fileID: number
  customAuthor?: string
  isMemoryOverride: boolean
  allocatedMemory: number
  instancePath: string
  installedAddons: Array<{
    addonID: number
    installedFile: {
      id: number
      fileName: string
      downloadUrl: string
      packageFingerprint: number
      projectId: number
      FileNameOnDisk: string
      Hashes: { value: string }[]
    }
  }>
}

/**
 * Parse Curseforge instance configuration
 */
export async function parseCurseforgeInstance(instancePath: string): Promise<CreateInstanceOptions> {
  const data = await readFile(join(instancePath, 'minecraftinstance.json'), 'utf-8')
  const cf = JSON.parse(data) as CurseforgeInstance

  const config = getInstanceConfigFromCurseforgeModpack(cf.manifest)

  const options: CreateInstanceOptions = {
    ...config,
    name: cf.name,
    author: cf.customAuthor || config.author,
    lastPlayedDate: new Date(cf.lastPlayed).getTime(),
    minMemory: cf.allocatedMemory ? Number(cf.allocatedMemory) : undefined,
  }

  if (cf.fileID && cf.projectID) {
    options.upstream = {
      type: 'curseforge-modpack',
      modId: cf.projectID,
      fileId: cf.fileID,
    }
  }

  return options
}

/**
 * Parse Curseforge instance files
 */
export async function parseCurseforgeInstanceFiles(instancePath: string, env: InstanceSystemEnv): Promise<InstanceFile[]> {
  const files = await getInstanceFiles(instancePath, env, (f) => {
    if (f === 'minecraftinstance.json') return true
    return false
  })

  for (const [file] of files) {
    file.downloads = [pathToFileURL(join(instancePath, file.path)).toString()]
  }

  return files.map(([file]) => file)
}
