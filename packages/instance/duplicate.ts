import { AbortableTask, TaskState } from '@xmcl/task'
import { copyFile, ensureDir, link, stat } from 'fs-extra'
import { join, resolve } from 'path'
import { getInstanceFiles } from './files_discovery'
import { Logger } from './internal_type'
import { shouldBeExcluded } from './manifest_generation'

export class DuplicateInstanceTask extends AbortableTask<void> {
  constructor(
    private instancePath: string,
    private newPath: string,
    private logger: Logger,
  ) {
    super()
  }

  protected async process(): Promise<void> {
    const { instancePath: path, newPath } = this
    const throwIfAborted = () => {
      if (this.state === TaskState.Paused || this.state === TaskState.Cancelled) {
        throw 'aborted'
      }
    }
    const files = await getInstanceFiles(this.instancePath, this.logger, (filePath, fstat) => {
      if (shouldBeExcluded(filePath, fstat)) {
        return true
      }
      return false
    })
    throwIfAborted()
    const isSameDisk = (await stat(path)).dev === (await stat(newPath)).dev
    const linkOrCopy = isSameDisk
      ? async (src: string, dest: string) =>
          link(src, dest)
            .catch(() => copyFile(src, dest))
            .then(() => {
              this._progress++
              this.update(0)
            })
      : copyFile

    const promises = [] as Promise<void>[]
    this._total = files.length
    this._progress = 0
    for (const [file] of files) {
      throwIfAborted()
      const src = join(path, file.path)
      const dest = join(newPath, file.path)
      await ensureDir(resolve(dest, '..'))
      if (
        file.path.startsWith('mods/') ||
        file.path.startsWith('resourcepacks/') ||
        file.path.startsWith('shaderpacks/')
      ) {
        promises.push(linkOrCopy(src, dest))
      } else {
        promises.push(copyFile(src, dest))
      }
    }
    await Promise.allSettled(promises)
  }

  protected abort(isCancelled: boolean): void {}

  protected isAbortedError(e: any): boolean {
    return e === 'aborted'
  }
}
