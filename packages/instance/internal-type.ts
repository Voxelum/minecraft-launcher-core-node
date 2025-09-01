import type { existsSync } from 'fs'
import type { readdir, stat, readFile } from 'fs-extra'
import type { join, relative } from 'path'
import type { pathToFileURL } from 'url'
import type { ResourceMetadata } from './instance-files-discovery'
/**
 * Logger interface abstraction
 */
export interface Logger {
  warn(message: string | Error): void
  log(message: string): void
}

/**
 * Worker interface for computing checksums
 */
export interface ChecksumWorker {
  checksum(filePath: string, algorithm: string): Promise<string>
}

export interface InstanceSystemEnv {
  join: typeof join
  relative: typeof relative
  stat: typeof stat
  readdir: typeof readdir
  existsSync: typeof existsSync
  logger: Logger
  readFile: typeof readFile
  pathToFileURL: typeof pathToFileURL
  sep: string
}

/**
 * Resource manager interface abstraction
 */
export interface ResourceManager {
  getSnapshotsByIno(inos: number[]): Promise<Array<{ ino: number; sha1: string }>>
  getMetadataByHashes(hashes: string[]): Promise<Array<ResourceMetadata | undefined>>
  getUrisByHash(hashes: string[]): Promise<Array<{ sha1: string; uri: string }>>
}

/**
 * Interface for version metadata provider
 */
export interface VersionMetadataProvider {
  getLatestRelease(): string
}

