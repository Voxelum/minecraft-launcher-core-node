import { InstanceSchema, RuntimeVersions } from './instance'

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
 * Edit options for instances
 */
export interface EditInstanceOptions extends Partial<Omit<InstanceSchema, 'runtime' | 'server'>> {
  resolution?: InstanceSchema['resolution']
  runtime?: InstanceSchema['runtime']
  /**
   * If this is undefined, it will disable the server of this instance
   */
  server?: InstanceSchema['server']
}

/**
 * Compute changes between current instance and edit options
 */
export async function computeInstanceEditChanges(
  currentInstance: InstanceSchema,
  editOptions: EditInstanceOptions,
  getIconUrl: (path: string) => Promise<string>
): Promise<Partial<InstanceSchema>> {
  const result: Partial<InstanceSchema> = {}

  // Check simple properties
  const simpleProps = ['name', 'author', 'description', 'icon', 'url', 'fileApi', 'java',
    'lastAccessDate',
    'lastPlayedDate',
    'playtime',
    'version'
  ] as const
  for (const prop of simpleProps) {
    if (prop in editOptions && editOptions[prop] !== currentInstance[prop]) {
      (result as any)[prop] = editOptions[prop]
    }
  }

  if ('upstream' in editOptions) {
    result.upstream = editOptions.upstream
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
          resultRuntime[version] = runtime[version] || ''
        }
      } else {
        resultRuntime[version] = runtime[version] || ''
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

  if ('icon' in result && result.icon) {
    const iconURL = new URL(result.icon)
    const path = iconURL.searchParams.get('path')
    if (iconURL.host === 'launcher' && iconURL.pathname === '/media' && path) {
      result.icon = await getIconUrl(path)
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
