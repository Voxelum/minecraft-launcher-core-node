import type { InstanceSystemEnv } from './internal-type'
import { ThirdPartyLauncherManifest, InstanceType } from './modpack'
import {
  parseCurseforgeInstance,
  parseCurseforgeInstanceFiles
} from './parsers/curseforge-parser'
import {
  parseModrinthInstance,
  parseModrinthInstanceFiles
} from './parsers/modrinth-parser'
import {
  detectMMCRoot,
  parseMultiMCInstance,
  parseMultiMCInstanceFiles
} from './parsers/multimc-parser'
import {
  parseVanillaInstance,
  parseVanillaInstanceFiles
} from './parsers/vanilla-parser'
import { isSystemError } from './utils'

/**
 * Check if a path is a MultiMC instance
 */
function isMultiMCInstance({ existsSync, join }: InstanceSystemEnv, path: string): boolean {
  return existsSync(join(path, 'instance.cfg')) && existsSync(join(path, 'mmc-pack.json'))
}

/**
 * Check if a path is a Modrinth instance
 */
function isModrinthInstance({ existsSync, join }: InstanceSystemEnv, path: string): boolean {
  return existsSync(join(path, 'profile.json'))
}

/**
 * Check if a path is a CurseForge instance
 */
function isCurseforgeInstance({ existsSync, join }: InstanceSystemEnv, path: string): boolean {
  return existsSync(join(path, 'minecraftinstance.json'))
}

/**
 * Check if a path is a Vanilla Minecraft installation
 */
function isVanillaMinecraft({ existsSync, join }: InstanceSystemEnv, path: string): boolean {
  return existsSync(join(path, 'launcher_profiles.json'))
}

/**
 * Auto-detect the launcher type from a path
 */
export function detectLauncherType(path: string, env: InstanceSystemEnv): InstanceType | null {
  if (isMultiMCInstance(env, path) || (detectMMCRoot(path) !== path && env.existsSync(env.join(detectMMCRoot(path), 'instances')))) {
    return 'mmc'
  }

  if (isModrinthInstance(env, path) || env.existsSync(env.join(path, 'profiles'))) {
    return 'modrinth'
  }

  if (isCurseforgeInstance(env, path) || env.existsSync(env.join(path, 'Instances'))) {
    return 'curseforge'
  }

  if (isVanillaMinecraft(env, path)) {
    return 'vanilla'
  }

  return null
}

/**
 * Parse launcher data to get instances and shared folders
 */
export async function parseLauncherData(
  path: string,
  env: InstanceSystemEnv,
  type?: InstanceType,
): Promise<ThirdPartyLauncherManifest> {
  const actualType = type || detectLauncherType(path, env)
  const { join, readdir, existsSync } = env

  if (!actualType) {
    throw new Error(`Cannot detect launcher type for path: ${path}`)
  }

  try {
    switch (actualType) {
      case 'mmc': {
        const rootPath = detectMMCRoot(path)
        const instancesPath = join(rootPath, 'instances')
        const instances = await readdir(instancesPath)

        const manifests = await Promise.allSettled(instances.map(async (instance) => {
          const instancePath = join(instancesPath, instance)
          const options = await parseMultiMCInstance(instancePath)
          return {
            options,
            path: instancePath,
          }
        }))

        return {
          folder: {
            assets: join(rootPath, 'assets'),
            libraries: join(rootPath, 'libraries'),
            versions: '',
            jre: undefined,
          },
          instances: manifests
            .filter((m): m is PromiseFulfilledResult<any> => m.status === 'fulfilled')
            .map(m => m.value),
        }
      }

      case 'modrinth': {
        const instancesPath = join(path, 'profiles')
        const instances = await readdir(instancesPath)

        const manifests = await Promise.allSettled(instances.map(async (instance) => {
          const instancePath = join(instancesPath, instance)
          const options = await parseModrinthInstance(instancePath)
          return {
            options,
            path: instancePath,
          }
        }))

        const assets = join(path, 'meta', 'assets')
        const libraries = join(path, 'meta', 'libraries')
        const versions = join(path, 'meta', 'versions')
        const jre = join(path, 'meta', 'java_versions')

        return {
          folder: {
            assets: existsSync(assets) ? assets : '',
            libraries: existsSync(libraries) ? libraries : '',
            versions: existsSync(versions) ? versions : '',
            jre: existsSync(jre) ? jre : undefined,
          },
          instances: manifests
            .filter((m): m is PromiseFulfilledResult<any> => m.status === 'fulfilled')
            .map(m => m.value),
        }
      }

      case 'curseforge': {
        const instancesPath = join(path, 'Instances')
        const minecraftDataPath = join(path, 'Install')

        const instances = await readdir(instancesPath)
        const manifests = await Promise.allSettled(instances.map(async (instance) => {
          const instancePath = join(instancesPath, instance)
          const options = await parseCurseforgeInstance(instancePath)
          return {
            options,
            path: instancePath,
          }
        }))

        const versionDir = join(minecraftDataPath, 'versions')
        const libDir = join(minecraftDataPath, 'libraries')
        const assetsDir = join(minecraftDataPath, 'assets')

        return {
          folder: {
            versions: existsSync(versionDir) ? versionDir : '',
            libraries: existsSync(libDir) ? libDir : '',
            assets: existsSync(assetsDir) ? assetsDir : '',
            jre: undefined,
          },
          instances: manifests
            .filter((m): m is PromiseFulfilledResult<any> => m.status === 'fulfilled')
            .map(m => m.value),
        }
      }

      case 'vanilla': {
        const vanillaInstances = await parseVanillaInstance(path)

        const assets = join(path, 'assets')
        const libraries = join(path, 'libraries')
        const versions = join(path, 'versions')
        const jre = join(path, 'jre')

        return {
          folder: {
            assets: existsSync(assets) ? assets : '',
            libraries: existsSync(libraries) ? libraries : '',
            versions: existsSync(versions) ? versions : '',
            jre: existsSync(jre) ? jre : undefined,
          },
          instances: vanillaInstances,
        }
      }

      default:
        throw new Error(`Unsupported launcher type: ${actualType}`)
    }
  } catch (error) {
    if (isSystemError(error) && error.code === 'ENOENT') {
      throw new Error(`Bad instance path: ${path}`, { cause: error })
    }
    throw error
  }
}

/**
 * Parse instance files from a specific instance path
 */
export async function parseInstanceFiles(
  path: string,
  env: InstanceSystemEnv,
  type?: InstanceType,
) {
  const actualType = type || detectLauncherType(path, env)

  if (!actualType) {
    throw new Error(`Cannot detect launcher type for path: ${path}`)
  }

  switch (actualType) {
    case 'mmc':
      return parseMultiMCInstanceFiles(path, env)

    case 'modrinth':
      return parseModrinthInstanceFiles(path, env)

    case 'curseforge':
      return parseCurseforgeInstanceFiles(path, env)

    case 'vanilla':
      return parseVanillaInstanceFiles(path, env)

    default:
      throw new Error(`Unsupported launcher type: ${actualType}`)
  }
}
