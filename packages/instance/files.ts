/**
 * Represent an instance file
 */
export interface InstanceFile {
  /**
   * The path of the file relative to the instance root
   */
  path: string
  /**
   * The hash of the instance file. The sha1 is required
   */
  hashes: {
    [hash: string]: string
  }
  /**
   * The download url of the instance file
   */
  downloads?: string[]
  /**
   * The associated curseforge project/file of the instance file
   */
  curseforge?: {
    projectId: number
    fileId: number
  }
  /**
   * The associated modrinth project/version of the instance file 
   */
  modrinth?: {
    projectId: string
    versionId: string
  }
  /**
   * The file size in bytes
   */
  size?: number
}

/**
 * File update operation types
 */
export type FileOperation = 'add' | 'remove' | 'keep' | 'backup-add' | 'backup-remove'

/**
 * Represents a file update operation
 */
export interface InstanceFileUpdate {
  file: InstanceFile
  operation: FileOperation
}

/**
 * The instance lock schema. Represent the intermediate state of the instance files.
 */
export interface InstanceLockSchema {
  /**
   * The instance lock version
   * @default 1
   */
  version: number
  /**
   * The upstream data for this locked instance file state
   */
  upstream: import('./instance').InstanceUpstream
  /**
   * All the files associated with current upstream
   */
  files: InstanceFile[]
  /**
   * The files max mtime of the last install
   */
  mtime: number
}

/**
 * Represent a intermediate state of the instance files.
 */
export interface InstanceInstallLockSchema extends InstanceLockSchema {
  /**
   * The finished files path
   */
  finishedPath: string[]
  /**
   * The backup files path
   */
  backup: string
  /**
   * The install workspace path
   */
  workspace: string
}

/**
 * Instance manifest for sharing/syncing instances
 */
export interface InstanceManifest {
  /**
   * Instance metadata
   */
  name?: string
  description?: string
  minMemory?: number
  maxMemory?: number
  vmOptions?: string[]
  mcOptions?: string[]
  /**
   * Runtime versions
   */
  runtime: import('./instance').RuntimeVersions
  /**
   * List of files in the instance
   */
  files: Array<InstanceFile>
}
