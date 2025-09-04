import type { Task } from '@xmcl/task';
import type { ensureDir, remove, rename, rmdir, unlink } from 'fs-extra';
import type { dirname } from 'path';
import type { fileURLToPath } from 'url';
import { InstanceFile, InstanceFileUpdate } from './instance-files';
import { ChecksumWorker, InstanceSystemEnv } from './internal-type';

export interface InstanceFileOperationHandlerContext extends InstanceSystemEnv {
  worker: ChecksumWorker

  onSpecialFile: (file: InstanceFile) => void

  getCachedResource(sha1: string): Promise<string | undefined>

  getPeerActualUrl: (peerUrl: string) => Promise<string | undefined>

  getUnzipTask: (p: UnzipTaskPayload[], finished: Set<string>) => Task<void>

  getDownloadTask: (p: HttpTaskPayload[], finished: Set<string>) => Task<void>

  getFileOperationTask: (p: FileOperationPayload[], finished: Set<string>, unhandled: InstanceFile[]) => Task<void>

  fileURLToPath: typeof fileURLToPath

  rename: typeof rename

  unlink: typeof unlink

  dirname: typeof dirname

  ensureDir: typeof ensureDir

  rmdir: typeof rmdir

  remove: typeof remove
}

export interface UnzipTaskPayload { file: InstanceFile; zipPath: string; entryName: string; destination: string }
export interface HttpTaskPayload { file: InstanceFile; options: { urls: string[]; sha1?: string; destination: string; size?: number } }
export interface FileOperationPayload { file: InstanceFile; src: string; destination: string }

/**
 * The handler to handle the instance file install.
 *
 * In the process, there will be 3 folder location involved:
 * 1. instance location: the location where the instance files are located
 * 2. workspace location: the location where the files are downloaded and unzipped
 * 3. backup location: the location where the files are backuped or removed
 *
 * The whole process is divided into three phases:
 * 1. Link or copy existed files to workspace folder. Download and unzip news files into workspace location. The linked failed files will be downloaded.
 * 2. Move files which need to be removed or backup to backup location
 * 3. Rename workspace location files into instance location
 *
 * The step 2 and 3 will modify the original instance files.
 * If the process is interrupted, the instance files need to be restored to the original state.
 * The backup folder will only exist if the whole process is successfully finished.
 * The workspace location will be kept if the process is interrupted, or it will be removed if it's successfully finished.
 */
export class InstanceFileOperationHandler {
  // Phase 1: Download and unzip files into a workspace location
  /**
   * All files need to be downloaded
   */
  #httpsQueue: Array<HttpTaskPayload> = []
  /**
   * All files need to be unzipped
   */
  #unzipQueue: Array<UnzipTaskPayload> = []
  // Phase 2: Move files from workspace location to instance location
  /**
   * All files need to be removed or backup
   */
  #backupQueue: Array<InstanceFile> = []
  #removeQueue: Array<InstanceFile> = []
  // Phase 3: Link or copy existed files
  /**
   * Extra files need to be copied or linked
   */
  #linkQueue: Array<FileOperationPayload> = []

  /**
   * Store the unresolvable files.
   *
   * This will be recomputed each time the handler is processed.
   */
  readonly unresolvable: InstanceFile[] = []

  constructor(
    private instancePath: string,
    /**
     * Finished download/unzip/link file path
     */
    readonly finished: Set<string>,
    private workspacePath: string,
    private backupPath: string,
    private context: InstanceFileOperationHandlerContext
  ) {
  }


  /**
  * Emit the task to prepare download & unzip files into workspace location.
  *
  * These tasks will do the phase 1 of the instance file operation.
  */
  async * prepareInstallFilesTasks(file: InstanceFileUpdate[]) {
    for (const f of file) {
      await this.#handleFile(f)
    }

    const unhandled = [] as InstanceFile[]
    if (this.#linkQueue.length > 0) {
      yield [this.context.getFileOperationTask(this.#linkQueue, this.finished, unhandled)] as Task[]
    }

    for (const file of unhandled) {
      if (await this.#handleUnzip(file, this.context.join(this.workspacePath, file.path))) continue
      if (await this.#handleHttp(file, this.context.join(this.workspacePath, file.path))) continue
      this.unresolvable.push(file)
    }

    const phase1 = [] as Task[]
    if (this.#unzipQueue.length > 0) {
      phase1.push(this.context.getUnzipTask(this.#unzipQueue, this.finished))
    }
    if (this.#httpsQueue.length > 0) {
      phase1.push(this.context.getDownloadTask(this.#httpsQueue, this.finished))
    }
    yield phase1
  }

  /**
   * Do the phase 2 and 3, move files from workspace location to instance location and link or copy existed files.
   */
  async backupAndRename() {
    // phase 2, create the backup
    const finished = [] as [string, string][]
    try {
      for (const file of this.#backupQueue) {
        const src = this.context.join(this.instancePath, file.path)
        const dest = this.context.join(this.backupPath, file.path)

        await this.context.ensureDir(this.context.dirname(dest))
        await this.context.rename(src, dest)
        finished.push([src, dest])
      }
    } catch (e) {
      // rollback with best effort
      this.context.logger.warn('Rollback due to backup files failed', e)
      for (const [src, dest] of finished) {
        await this.context.rename(dest, src).catch(() => undefined)
      }

      throw e
    }
    this.context.logger.log('Backup stage finished ' + finished.length)

    finished.splice(0, finished.length)

    // phase 3, move the workspace files to instance location
    await this.context.ensureDir(this.instancePath)
    const files = [
      ...this.#linkQueue.map(f => f.file),
      ...this.#unzipQueue.map(f => f.file),
      ...this.#httpsQueue.map(f => f.file),
    ]

    try {
      const dirToCreate = Array.from(new Set(files.map(file => this.context.dirname(this.context.join(this.instancePath, file.path)))))
      await Promise.all(dirToCreate.map(dir => this.context.ensureDir(dir)))

      await Promise.all(files.map(async (file) => {
        const src = this.context.join(this.workspacePath, file.path)
        const dest = this.context.join(this.instancePath, file.path)
        await this.context.rename(src, dest)
        finished.push([src, dest])
      }))
    } catch (e) {
      // rollback with best effort
      this.context.logger.warn('Rollback due to rename files failed', e)
      for (const [src, dest] of finished) {
        await this.context.rename(dest, src).catch(() => undefined)
      }

      throw e
    }
    this.context.logger.log('Rename stage finished ' + finished.length)

    for (const file of this.#removeQueue) {
      const dest = this.context.join(this.backupPath, file.path)
      await this.context.unlink(dest).catch(() => undefined)
      await this.context.rmdir(this.context.dirname(dest)).catch(() => undefined)
    }
    this.context.logger.log('Remove stage finished ' + this.#removeQueue.length)

    // Remove the workspace folder
    await this.context.remove(this.workspacePath)
  }

  /**
  * Get a task to handle the instance file operation
  */
  async #handleFile({ file, operation }: InstanceFileUpdate) {
    const instancePath = this.instancePath
    const destination = this.context.join(instancePath, file.path)

    if (this.context.relative(instancePath, destination).startsWith('..')) {
      return
    }

    if (operation === 'keep') {
      return
    }

    if (operation === 'remove') {
      this.#backupQueue.push(file)
      this.#removeQueue.push(file)
      return
    }

    if (operation === 'backup-remove') {
      this.#backupQueue.push(file)
      return
    }

    const isSpecialResource = file.path.startsWith('mods') || file.path.startsWith('resourcepacks') || file.path.startsWith('shaderpacks')
    const sha1 = file.hashes.sha1
    if (isSpecialResource) {
      this.context.onSpecialFile(file)
    }

    await this.#dispatchFileTask(file, sha1)

    if (operation === 'backup-add') {
      // backup legacy file
      this.#backupQueue.push(file)
    }
  }

  async #handleUnzip(file: InstanceFile, destination: string) {
    const zipUrl = file.downloads!.find(u => u.startsWith('zip:'))
    if (!zipUrl) return

    const url = new URL(zipUrl)

    if (!url.host) {
      // Zip url with absolute path
      const zipPath = decodeURI(url.pathname).substring(1)
      const entry = url.searchParams.get('entry')
      if (entry) {
        const entryName = entry
        this.#unzipQueue.push({ file, zipPath, entryName, destination })
        return true
      }
    }

    // Zip file using the sha1 resource relative apth
    const filePath = await this.context.getCachedResource(url.host)
    if (filePath) {
      this.#unzipQueue.push({ file, zipPath: filePath, entryName: file.path, destination })
      return true
    }
  }

  /**
   * Handle a file with http download. If the file can be handled by http, return `true`
   */
  async #handleHttp(file: InstanceFile, destination: string, sha1?: string) {
    const urls = file.downloads!.filter(u => u.startsWith('http'))
    const peerUrl = file.downloads!.find(u => u.startsWith('peer://'))

    if (peerUrl) {
      const url = await this.context.getPeerActualUrl(peerUrl)
      if (url) {
        urls.push(url)
      }
    }

    if (urls.length > 0) {
      // Prefer HTTP download than peer download
      this.#httpsQueue.push({
        options: {
          urls,
          destination,
          sha1,
          size: file.size,
        },
        file,
      })
      return true
    }
  }

  /**
   * Handle a file with link. If the file is existed in database, then it can be handled by link, return `true`
   */
  async #handleLink(file: InstanceFile, destination: string, sha1: string) {
    if (file.downloads) {
      if (file.downloads[0].startsWith('file://')) {
        this.#linkQueue.push({ file, src: this.context.fileURLToPath(file.downloads[0]), destination })
        return true
      }
    }

    if (!sha1) return

    const resourcePath = await this.context.getCachedResource(sha1)
    if (resourcePath) {
      this.#linkQueue.push({ file, destination, src: resourcePath })
      return true
    }
  }

  async #dispatchFileTask(file: InstanceFile, sha1: string) {
    const destination = this.context.join(this.workspacePath, file.path)
    if (await this.#handleLink(file, destination, sha1)) return

    if (!file.downloads) {
      this.unresolvable.push(file)
      return
    }

    if (await this.#handleUnzip(file, destination)) return

    if (await this.#handleHttp(file, destination, sha1)) return

    this.unresolvable.push(file)
  }
}
