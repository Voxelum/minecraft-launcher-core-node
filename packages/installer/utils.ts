import { ChildProcess, ExecOptions, spawn, SpawnOptions } from 'child_process'
import { access, mkdir, stat } from 'fs/promises'
import { dirname } from 'path'

export { checksum } from '@xmcl/core'

export function missing(target: string) {
  return access(target).then(() => false, () => true)
}

export async function ensureDir(target: string) {
  try {
    await mkdir(target)
  } catch (err) {
    const e: any = err
    if (await stat(target).then((s) => s.isDirectory()).catch(() => false)) { return }
    if (e.code === 'EEXIST') { return }
    if (e.code === 'ENOENT') {
      if (dirname(target) === target) {
        throw e
      }
      try {
        await ensureDir(dirname(target))
        await mkdir(target)
      } catch {
        if (await stat(target).then((s) => s.isDirectory()).catch((e) => false)) { return }
        throw e
      }
      return
    }
    throw e
  }
}

export interface SpawnJavaOptions {
  /**
     * The java exectable path. It will use `java` by default.
     *
     * @defaults "java"
     */
  java?: string

  /**
     * The spawn process function. Used for spawn the java process at the end.
     *
     * By default, it will be the spawn function from "child_process" module. You can use this option to change the 3rd party spawn like [cross-spawn](https://www.npmjs.com/package/cross-spawn)
     */
  spawn?: (command: string, args?: ReadonlyArray<string>, options?: SpawnOptions) => ChildProcess
}

export function ensureFile(target: string) {
  return ensureDir(dirname(target))
}
export function normalizeArray<T>(arr: T | T[] = []): T[] {
  return arr instanceof Array ? arr : [arr]
}
export function spawnProcess(spawnJavaOptions: SpawnJavaOptions, args: string[], options?: ExecOptions) {
  const process = (spawnJavaOptions?.spawn ?? spawn)(spawnJavaOptions.java ?? 'java', args, options)
  return waitProcess(process)
}

export function waitProcess(process: ChildProcess) {
  return new Promise<void>((resolve, reject) => {
    const errorMsg: string[] = []
    process.on('error', (err) => {
      reject(err)
    })
    process.on('close', (code) => {
      if (code !== 0) { reject(errorMsg.join('')) } else { resolve() }
    })
    process.on('exit', (code) => {
      if (code !== 0) { reject(errorMsg.join('')) } else { resolve() }
    })
    process.stdout?.setEncoding('utf-8')
    process.stdout?.on('data', (buf) => { })
    process.stderr?.setEncoding('utf-8')
    process.stderr?.on('data', (buf) => { errorMsg.push(buf.toString()) })
  })
}

/**
 * Join two urls
 */
export function joinUrl(a: string, b: string) {
  if (a.endsWith('/') && b.startsWith('/')) {
    return a + b.substring(1)
  }
  if (!a.endsWith('/') && !b.startsWith('/')) {
    return a + '/' + b
  }
  return a + b
}

export interface ParallelTaskOptions {
  throwErrorImmediately?: boolean
}
/**
 * Shared install options
 */
export interface InstallOptions {
  /**
     * When you want to install a version over another one.
     *
     * Like, you want to install liteloader over a forge version.
     * You should fill this with that forge version id.
     */
  inheritsFrom?: string

  /**
     * Override the newly installed version id.
     *
     * If this is absent, the installed version id will be either generated or provided by installer.
     */
  versionId?: string
}

export function errorToString(e: any) {
  if (e instanceof Error) {
    return e.stack ? e.stack : e.message
  }
  return e.toString()
}
