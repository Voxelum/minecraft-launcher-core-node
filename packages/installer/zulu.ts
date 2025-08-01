import { DownloadBaseOptions, getDownloadBaseOptions } from '@xmcl/file-transfer'
import { Task, task } from '@xmcl/task'
import { open, readAllEntries } from '@xmcl/unzip'
import { createReadStream, createWriteStream } from 'fs'
import { stat, symlink, unlink } from 'fs/promises'
import { basename, dirname, join } from 'path'
import { pipeline } from 'stream/promises'
import { extract } from 'tar-stream'
import { createGunzip } from 'zlib'
import { DownloadTask } from './downloadTask'
import { UnzipTask } from './unzip'
import { ensureDir } from './utils'

/**
 * Zulu JRE download information
 */
export interface ZuluJRE {
  /**
   * Features of this JRE build (e.g., javafx, musl, crac)
   */
  features: string[]
  /**
   * Target architecture (e.g., x64, arm64, ia32)
   */
  architecture: string
  /**
   * Target operating system (e.g., win32, linux, darwin)
   */
  os: string
  /**
   * SHA256 hash of the download file
   */
  sha256: string
  /**
   * Size of the download file in bytes
   */
  size: number
  /**
   * Download URL for the JRE
   */
  url: string
}

/**
 * Options for installing Zulu Java
 */
export interface InstallZuluJavaOptions extends DownloadBaseOptions {
  /**
   * The destination directory where Java will be installed
   */
  destination: string
}

/**
 * Create a task to install Zulu JRE from the provided JRE information
 * @param jre The Zulu JRE information containing download details
 * @param options Installation options including destination and download settings
 * @returns A task that downloads and installs the Zulu JRE
 */
export function installZuluJavaTask(jre: ZuluJRE, options: InstallZuluJavaOptions): Task<void> {
  const { destination } = options
  const version = 1 // Default version for task caching
  
  return task('installZuluJava', async function () {
    const packedFile = join(destination, basename(jre.url))
    
    // Download the JRE archive
    await this.yield(new DownloadTask({
      url: jre.url,
      destination: packedFile,
      validator: {
        algorithm: 'sha256',
        hash: jre.sha256,
      },
      expectedTotal: jre.size,
      ...getDownloadBaseOptions(options),
    }).setName('download'))

    try {
      if (jre.url.endsWith('.tar.gz')) {
        // Handle tar.gz files (Linux and macOS)
        await extractTarGz.call(this, packedFile, destination, jre)
      } else if (jre.url.endsWith('.zip')) {
        // Handle zip files (Windows)
        await extractZip.call(this, packedFile, destination, jre)
      } else {
        throw new Error(`Unsupported archive format: ${jre.url}`)
      }
    } finally {
      // Clean up the downloaded archive
      try {
        await stat(packedFile).then(() => unlink(packedFile))
      } catch {
        // Ignore cleanup errors
      }
    }
  }, { version })
}

/**
 * Install Zulu JRE (convenience function that runs the task)
 * @param jre The Zulu JRE information
 * @param options Installation options
 * @returns Promise that resolves when installation is complete
 */
export function installZuluJava(jre: ZuluJRE, options: InstallZuluJavaOptions): Promise<void> {
  return installZuluJavaTask(jre, options).startAndWait()
}

/**
 * Extract tar.gz archive (for Linux and macOS)
 */
async function extractTarGz(this: any, packedFile: string, destination: string, jre: ZuluJRE) {
  const extractStream = extract()
  
  const allPipe = [
    pipeline(
      createReadStream(packedFile),
      createGunzip(),
      extractStream,
    )
  ] as Promise<void>[]

  let first = ''
  let substring = 0
  const links = [] as {
    path: string
    linkTo: string
  }[]

  for await (const entry of extractStream) {
    if (!first) {
      first = entry.header.name
      if (first.endsWith('/') && jre.url.endsWith(entry.header.name.substring(0, entry.header.name.length - 1) + '.tar.gz')) {
        // Skip the root directory if it matches the archive name
        substring = first.length
        continue
      }
    }

    const filePath = join(destination, entry.header.name.substring(substring))
    
    if (entry.header.type === 'directory') {
      await ensureDir(filePath)
    } else if (entry.header.linkname && entry.header.type === 'symlink') {
      links.push({
        path: join(destination, entry.header.linkname),
        linkTo: filePath,
      })
    } else if (entry.header.type === 'file') {
      await ensureDir(dirname(filePath))
      allPipe.push(pipeline(
        entry,
        createWriteStream(filePath)
      ))
    }
  }

  // Create symbolic links
  for (const link of links) {
    try {
      await symlink(link.path, link.linkTo)
    } catch {
      // Ignore symlink errors on platforms that don't support them
    }
  }

  await Promise.all(allPipe)
}

/**
 * Extract zip archive (for Windows)
 */
async function extractZip(this: any, packedFile: string, destination: string, jre: ZuluJRE) {
  const zipFile = await open(packedFile)
  
  try {
    const prefix = basename(jre.url).slice(0, -4) + '/'
    const entries = await readAllEntries(zipFile).then(ens => 
      ens.filter(e => e.fileName !== prefix && !e.fileName.endsWith('/'))
    )
    
    await this.yield(new UnzipTask(zipFile, entries, destination, (e) => {
      if (e.fileName.startsWith(prefix)) {
        return e.fileName.substring(prefix.length)
      }
      return e.fileName
    }).setName('decompress'))
  } finally {
    zipFile.close()
  }
}

/**
 * Select the best Zulu JRE from an array of options based on current platform and preferences
 * @param jres Array of available Zulu JRE options
 * @param platform Target platform (defaults to current platform)
 * @param arch Target architecture (defaults to current architecture)
 * @returns The best matching Zulu JRE or undefined if none found
 */
export function selectZuluJRE(
  jres: ZuluJRE[], 
  platform: string = process.platform, 
  arch: string = process.arch
): ZuluJRE | undefined {
  // Normalize platform names
  const normalizedPlatform = platform === 'darwin' ? 'darwin' : 
                            platform === 'win32' ? 'win32' : 'linux'
  
  // Normalize architecture names
  const normalizedArch = arch === 'x64' ? 'x64' :
                        arch === 'arm64' ? 'arm64' :
                        arch === 'ia32' || arch === 'x86' ? 'ia32' : arch

  // Filter by platform and architecture
  const targets = jres.filter(jre => 
    jre.os === normalizedPlatform && jre.architecture === normalizedArch
  )

  if (targets.length === 0) {
    return undefined
  }

  // Preference order: musl > javafx > default
  const withMusl = targets.find(jre => jre.features.includes('musl'))
  if (withMusl) {
    return withMusl
  }

  const withJavafx = targets.find(jre => jre.features.includes('javafx'))
  if (withJavafx) {
    return withJavafx
  }

  // Return the first available option
  return targets[0]
}
