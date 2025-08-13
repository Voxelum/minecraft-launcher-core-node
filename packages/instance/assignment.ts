import { Instance, InstanceSchema, RuntimeVersions } from './instance'
import { CreateInstanceOptions } from './options'
import { createInstanceTemplate } from './templates'

/**
 * Interface for version metadata provider
 */
export interface VersionMetadataProvider {
  getLatestRelease(): string
}

/**
  * Safely assign properties from source to target, only updating if values differ
  */
export function assignShallow<T extends Record<string, any>>(target: T, source: Partial<T>): boolean {
  let hasChanges = false
  for (const key in source) {
    if (source[key] !== undefined && target[key] !== source[key]) {
      target[key] = source[key]!
      hasChanges = true
    }
  }
  return hasChanges
}

/**
 * Load and assign instance data from options
 */
export function loadInstanceFromOptions(
  options: InstanceSchema,
  versionProvider: VersionMetadataProvider
): Instance {
  const instance = createInstanceTemplate()

  // Assign basic properties
  instance.author = options.author || ''
  assignShallow(instance, options)
  
  instance.name = instance.name.trim()
  // Handle runtime versions
  if (options.runtime) {
    assignShallow(instance.runtime, options.runtime)
  }

  // Assign specific properties with type safety
  instance.assignMemory = options.assignMemory ?? instance.assignMemory
  instance.showLog = options.showLog ?? instance.showLog
  instance.hideLauncher = options.hideLauncher ?? instance.hideLauncher
  instance.fastLaunch = options.fastLaunch ?? instance.fastLaunch
  instance.icon = options.icon ?? instance.icon
  instance.maxMemory = options.maxMemory ?? instance.maxMemory
  instance.minMemory = options.minMemory ?? instance.minMemory
  instance.vmOptions = options.vmOptions ?? instance.vmOptions
  instance.mcOptions = options.mcOptions ?? instance.mcOptions
  instance.creationDate = options.creationDate ?? instance.creationDate
  instance.lastAccessDate = options.lastAccessDate ?? instance.lastAccessDate
  instance.disableAuthlibInjector = options.disableAuthlibInjector ?? instance.disableAuthlibInjector
  instance.disableElybyAuthlib = options.disableElybyAuthlib ?? instance.disableElybyAuthlib

  // Handle resolution
  if (options.resolution) {
    if (instance.resolution) {
      instance.resolution.width = options.resolution.width
      instance.resolution.height = options.resolution.height
      instance.resolution.fullscreen = options.resolution.fullscreen
    } else {
      instance.resolution = options.resolution
    }
  }

  // Set default minecraft version if not specified
  instance.runtime.minecraft = instance.runtime.minecraft || versionProvider.getLatestRelease()

  // Assign remaining properties
  instance.upstream = options.upstream
  instance.playTime = options.playTime ?? instance.playTime
  instance.lastPlayedDate = options.lastPlayedDate ?? instance.lastPlayedDate
  instance.prependCommand = options.prependCommand ?? instance.prependCommand

  if (options.server) {
    instance.server = options.server
  }

  return instance
}


export function createInstanceFromOptions(
  payload: CreateInstanceOptions,
  versionProvider: VersionMetadataProvider
): InstanceSchema {
  const instance = createInstanceTemplate()

  assignShallow(instance, payload)

  if (payload.runtime) {
    assignShallow(instance.runtime, payload.runtime)
  }

  if (payload.resolution) {
    if (instance.resolution) {
      assignShallow(instance.resolution, payload.resolution)
    } else {
      instance.resolution = payload.resolution
    }
  }

  if (payload.server) {
    instance.server = payload.server
  }

  instance.runtime.minecraft = instance.runtime.minecraft || versionProvider.getLatestRelease()
  instance.creationDate = Date.now()
  instance.lastAccessDate = Date.now()

  instance.author = payload.author ?? instance.author
  instance.description = payload.description ?? instance.description
  instance.showLog = payload.showLog ?? instance.showLog
  instance.upstream = payload.upstream
  instance.icon = payload.icon ?? ''

  return instance
}

/**
 * Edit options for instances
 */
export interface EditInstanceOptions {
  name?: string
  author?: string
  description?: string
  icon?: string
  url?: string
  fileApi?: string
  runtime?: Partial<RuntimeVersions>
  java?: string
  assignMemory?: boolean | 'auto'
  maxMemory?: number | undefined
  minMemory?: number | undefined
  vmOptions?: string[] | undefined
  mcOptions?: string[] | undefined
  showLog?: boolean
  hideLauncher?: boolean
  fastLaunch?: boolean
  disableAuthlibInjector?: boolean
  disableElybyAuthlib?: boolean
  prependCommand?: string | undefined
  resolution?: { width?: number; height?: number; fullscreen?: boolean }
  server?: {
    host: string
    port?: number
  } | undefined
  env?: Record<string, string> | undefined
}

/**
 * Compute changes between current instance and edit options
 */
export function computeInstanceEditChanges(
  currentInstance: InstanceSchema,
  editOptions: EditInstanceOptions
): Partial<InstanceSchema> {
  const result: Partial<InstanceSchema> = {}

  // Check simple properties
  const simpleProps = ['name', 'author', 'description', 'icon', 'url', 'fileApi'] as const
  for (const prop of simpleProps) {
    if (prop in editOptions && editOptions[prop] !== currentInstance[prop]) {
      (result as any)[prop] = editOptions[prop]
    }
  }

  // Handle memory options
  if ('maxMemory' in editOptions && editOptions.maxMemory !== currentInstance.maxMemory) {
    if (typeof editOptions.maxMemory === 'undefined') {
      result.maxMemory = undefined
    } else if (typeof editOptions.maxMemory === 'number') {
      result.maxMemory = Math.floor(editOptions.maxMemory > 0 ? editOptions.maxMemory : 0)
    }
  }

  if ('minMemory' in editOptions && editOptions.minMemory !== currentInstance.minMemory) {
    if (typeof editOptions.minMemory === 'undefined') {
      result.minMemory = undefined
    } else if (typeof editOptions.minMemory === 'number') {
      result.minMemory = Math.floor(editOptions.minMemory > 0 ? editOptions.minMemory : 0)
    }
  }

  // Handle boolean properties
  const boolProps = [
    'assignMemory', 'showLog', 'hideLauncher', 'fastLaunch',
    'disableAuthlibInjector', 'disableElybyAuthlib'
  ] as const
  for (const prop of boolProps) {
    if (prop in editOptions && editOptions[prop] !== currentInstance[prop]) {
      (result as any)[prop] = editOptions[prop]
    }
  }

  // Handle prependCommand
  if ('prependCommand' in editOptions && editOptions.prependCommand !== currentInstance.prependCommand) {
    result.prependCommand = editOptions.prependCommand
  }

  // Handle resolution
  if ('resolution' in editOptions) {
    const currentRes = currentInstance.resolution
    const newRes = editOptions.resolution

    if (!editOptions.resolution) {
      result.resolution = undefined
    } else if ((currentRes === undefined && newRes !== undefined) ||
      (currentRes !== undefined && newRes === undefined) ||
      (currentRes && newRes &&
        (currentRes.fullscreen !== newRes.fullscreen ||
          currentRes.width !== newRes.width ||
          currentRes.height !== newRes.height))) {
      result.resolution = editOptions.resolution
    }
  }

  // Handle runtime
  if ('runtime' in editOptions && editOptions.runtime) {
    const runtime = editOptions.runtime
    const currentRuntime = currentInstance.runtime
    const resultRuntime: Partial<RuntimeVersions> = {}

    for (const version of Object.keys(runtime) as Array<keyof RuntimeVersions>) {
      if (version in currentRuntime) {
        if (currentRuntime[version] !== runtime[version]) {
          resultRuntime[version] = runtime[version] || undefined
        }
      } else {
        resultRuntime[version] = runtime[version] || undefined
      }
    }

    if (Object.keys(resultRuntime).length > 0) {
      result.runtime = { ...currentInstance.runtime, ...resultRuntime }
    }
  }

  // Handle server
  if ('server' in editOptions) {
    if (editOptions.server) {
      if (editOptions.server.host !== currentInstance.server?.host ||
        editOptions.server.port !== currentInstance.server?.port) {
        result.server = editOptions.server
      }
    } else if (currentInstance.server !== undefined) {
      result.server = editOptions.server
    }
  }

  // Handle array options
  if ('vmOptions' in editOptions) {
    const hasDiff = typeof editOptions.vmOptions !== typeof currentInstance.vmOptions ||
      editOptions.vmOptions?.length !== currentInstance.vmOptions?.length ||
      editOptions.vmOptions?.some((e, i) => e !== currentInstance.vmOptions?.[i])
    if (hasDiff) {
      result.vmOptions = editOptions.vmOptions
    }
  }

  if ('mcOptions' in editOptions) {
    const hasDiff = typeof editOptions.mcOptions !== typeof currentInstance.mcOptions ||
      editOptions.mcOptions?.length !== currentInstance.mcOptions?.length ||
      editOptions.mcOptions?.some((e, i) => e !== currentInstance.mcOptions?.[i])
    if (hasDiff) {
      result.mcOptions = editOptions.mcOptions
    }
  }

  // Handle environment variables
  if ('env' in editOptions) {
    const hasDiff = typeof editOptions.env !== typeof currentInstance.env ||
      (editOptions.env && currentInstance.env &&
        Object.keys(editOptions.env).some(k => editOptions.env?.[k] !== currentInstance.env?.[k]))
    if (hasDiff) {
      result.env = editOptions.env
    }
  }

  return result
}

/**
 * Apply computed changes to an instance
 */
export function applyInstanceChanges(
  instance: InstanceSchema,
  changes: Partial<InstanceSchema>
): InstanceSchema {
  const result = { ...instance }

  for (const [key, value] of Object.entries(changes)) {
    if (key === 'runtime' && value && typeof value === 'object') {
      result.runtime = { ...result.runtime, ...value as Partial<RuntimeVersions> }
    } else {
      (result as any)[key] = value
    }
  }

  return result
}
