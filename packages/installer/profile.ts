import { LibraryInfo, MinecraftFolder, MinecraftLocation, Version, Version as VersionJson } from '@xmcl/core'
import { AbortableTask, CancelledError, task } from '@xmcl/task'
import { filterEntries, open, readEntry, walkEntriesGenerator } from '@xmcl/unzip'
import { spawn } from 'child_process'
import { readFile, writeFile } from 'fs/promises'
import { basename, delimiter, dirname, join, relative, sep } from 'path'
import { ZipFile } from 'yauzl'
import { InstallLibraryTask, InstallSideOption, LibraryOptions } from './minecraft'
import { checksum, errorToString, missing, SpawnJavaOptions, waitProcess } from './utils'

export interface PostProcessor {
  /**
     * The executable jar path
     */
  jar: string
  /**
     * The classpath to run
     */
  classpath: string[]
  args: string[]
  outputs?: { [key: string]: string }
  sides?: Array<'client' | 'server'>
}

export interface InstallProfile {
  spec?: number
  /**
   * The type of this installation, like "forge"
   */
  profile: string
  /**
   * The version of this installation
   */
  version: string
  /**
   * The version json path
   */
  json: string
  /**
   * The maven artifact name: `<org>:<artifact-id>:<version>`
   */
  path: string
  /**
   * The minecraft version
   */
  minecraft: string
  /**
   * The processor shared variables. The key is the name of variable to replace.
   *
   * The value of client/server is the value of the variable.
   */
  data?: { [key: string]: { client: string; server: string } }
  /**
     * The post processor. Which require java to run.
     */
  processors?: Array<PostProcessor>
  /**
   * The required install profile libraries
   */
  libraries: VersionJson.NormalLibrary[]
  /**
   * Legacy format
   */
  versionInfo?: VersionJson
}

export interface InstallProfileOption extends LibraryOptions, InstallSideOption, SpawnJavaOptions {
  /**
     * New forge (>=1.13) require java to install. Can be a executor or java executable path.
     */
  java?: string
}

/**
 * Resolve processors in install profile
 */
export function resolveProcessors(side: 'client' | 'server', installProfile: InstallProfile, minecraft: MinecraftFolder) {
  function normalizePath(val: string) {
    if (val && val.match(/^\[.+\]$/g)) { // match sth like [net.minecraft:client:1.15.2:slim]
      const name = val.substring(1, val.length - 1)
      return minecraft.getLibraryByPath(LibraryInfo.resolve(name).path)
    }
    return val
  }

  const normalizeVariable = (val: string) => {
    if (!val) return val
    // replace "{A}/{B}, which the value of A and B are from varaiables
    // for example, variables = { A: "a", B: "b" }
    // "{A}/{B}" => "a/b"
    // The key variable name can be any alphabet characters and number other special characters
    // Another example, "{A}" => "a"
    return val.replace(/{([A-Za-z0-9_-]+)}/g, (_, key) => variables[key]?.[side] ?? '')
  }

  // store the mapping of {VARIABLE_NAME} -> real path in disk
  const variables: Record<string, { client: string; server: string }> = {
    SIDE: {
      client: 'client',
      server: 'server',
    },
    MINECRAFT_JAR: {
      client: minecraft.getVersionJar(installProfile.minecraft),
      server: minecraft.getVersionJar(installProfile.minecraft, 'server'),
    },
    ROOT: {
      client: minecraft.root,
      server: minecraft.root,
    },
    MINECRAFT_VERSION: {
      client: installProfile.minecraft,
      server: installProfile.minecraft,
    },
    LIBRARY_DIR: {
      client: minecraft.libraries,
      server: minecraft.libraries,
    },
  }
  if (installProfile.data) {
    for (const key in installProfile.data) {
      const { client, server } = installProfile.data[key]
      variables[key] = {
        client: normalizePath(client),
        server: normalizePath(server),
      }
    }
  }

  const resolveOutputs = (proc: PostProcessor, args: string[]) => {
    const original = proc.outputs
      ? Object.entries(proc.outputs).map(([k, v]) => ({ [normalizeVariable(k)]: normalizeVariable(v) })).reduce((a, b) => Object.assign(a, b), {})
      : {}
    for (const [key, val] of Object.entries(original)) {
      original[key] = val.replace(/'/g, '')
    }
    const outputIndex = args.indexOf('--output') === -1 ? args.indexOf('--out-jar') : args.indexOf('--output')
    const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : undefined
    if (outputFile && !original[outputFile]) {
      original[outputFile] = ''
    }
    return original
  }
  const processors = (installProfile.processors || []).map((proc) => {
    const args = proc.args.map(normalizePath).map(normalizeVariable)
    return {
      ...proc,
      args,
      outputs: resolveOutputs(proc, args),
    }
  }).filter((proc) => proc.sides ? proc.sides.indexOf(side) !== -1 : true)
  return processors
}

/**
 * Post process the post processors from `InstallProfile`.
 *
 * @param processors The processor info
 * @param minecraft The minecraft location
 * @param java The java executable path
 * @throws {@link PostProcessError}
 */
export function postProcess(processors: PostProcessor[], minecraft: MinecraftFolder, javaOptions: SpawnJavaOptions) {
  return new PostProcessingTask(processors, minecraft, javaOptions).startAndWait()
}

/**
 * Install by install profile. The install profile usually contains some preprocess should run before installing dependencies.
 *
 * @param installProfile The install profile
 * @param minecraft The minecraft location
 * @param options The options to install
 * @throws {@link PostProcessError}
 */
export function installByProfile(installProfile: InstallProfile, minecraft: MinecraftLocation, options: InstallProfileOption = {}) {
  return installByProfileTask(installProfile, minecraft, options).startAndWait()
}

/**
 * Install by install profile. The install profile usually contains some preprocess should run before installing dependencies.
 *
 * @param installProfile The install profile
 * @param minecraft The minecraft location
 * @param options The options to install
 */
export function installByProfileTask(installProfile: InstallProfile, minecraft: MinecraftLocation, options: InstallProfileOption = {}) {
  return task('installByProfile', async function () {
    const minecraftFolder = MinecraftFolder.from(minecraft)

    const processor = resolveProcessors(options.side || 'client', installProfile, minecraftFolder)

    const installRequiredLibs = VersionJson.resolveLibraries(installProfile.libraries)

    await this.all(installRequiredLibs.map((lib) => new InstallLibraryTask(lib, minecraftFolder, options)), {
      throwErrorImmediately: options.throwErrorImmediately ?? false,
      getErrorMessage: (errs) => `Errors during install libraries at ${minecraftFolder.root}: ${errs.map(errorToString).join('\n')}`,
    })

    await this.yield(new PostProcessingTask(processor, minecraftFolder, options))

    if (options.side === 'client') {
      const versionJson: VersionJson = await readFile(minecraftFolder.getVersionJson(installProfile.version)).then((b) => b.toString()).then(JSON.parse)
      const libraries = VersionJson.resolveLibraries(versionJson.libraries)
      await this.all(libraries.map((lib) => new InstallLibraryTask(lib, minecraftFolder, options)), {
        throwErrorImmediately: options.throwErrorImmediately ?? false,
        getErrorMessage: (errs) => `Errors during install libraries at ${minecraftFolder.root}: ${errs.map(errorToString).join('\n')}`,
      })
    } else {
      const argsText = process.platform === 'win32' ? 'win_args.txt' : 'unix_args.txt'

      if (!installProfile.processors) { return }

      let txtPath: string | undefined
      for (const p of installProfile.processors) {
        txtPath = p.args.find(a => a.startsWith('{ROOT}') && a.endsWith(argsText))
        if (txtPath) break
      }
      if (!txtPath) { return }
      txtPath = txtPath.replace('{ROOT}', minecraftFolder.root)

      if (await missing(txtPath)) {
        throw new Error(`No ${argsText} found in the forge jar`)
      }

      const content = await readFile(txtPath, 'utf-8')
      const args = content.split('\n').map(v => v.trim().split(' ')).flatMap(v => v).filter(v => v)
      // find the Main class or -jar
      let mainClass: string = ''
      let jar: string | undefined
      const game = [] as string[]
      const jvm = [] as string[]
      let found = false
      for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('-')) {
          if (args[i] === '-jar') {
            jar = join(dirname(txtPath), args[i + 1])
            found = true
            i++
            continue
          }
        } else {
          mainClass = args[i]
          found = true
          continue
        }
        if (!found) {
          jvm.push(args[i])
        } else {
          game.push(args[i])
        }
      }

      const libraries: Version.Library[] = [...installProfile.libraries]
      const forgeVersion = basename(dirname(txtPath)).substring(installProfile.minecraft.length + 1)
      const serverProfile: Version = {
        id: installProfile.version,
        libraries,
        type: 'release',
        arguments: {
          game,
          jvm,
        },
        jar: jar ? relative(minecraftFolder.libraries, jar).replaceAll(sep, '/') : jar,
        releaseTime: new Date().toJSON(),
        time: new Date().toJSON(),
        minimumLauncherVersion: 13,
        mainClass,
        _minecraftVersion: installProfile.minecraft,
        _forgeVersion: forgeVersion,
      }
      await writeFile(join(minecraftFolder.getVersionRoot(serverProfile.id), 'server.json'), JSON.stringify(serverProfile, null, 4))
    }
  })
}

export class PostProcessBadJarError extends Error {
  constructor(public jarPath: string, public causeBy: Error) {
    super(`Fail to post process bad jar: ${jarPath}`)
  }

  name = 'PostProcessBadJarError'
}

export class PostProcessNoMainClassError extends Error {
  constructor(public jarPath: string) {
    super(`Fail to post process bad jar without main class: ${jarPath}`)
  }

  name = 'PostProcessNoMainClassError'
}

export class PostProcessFailedError extends Error {
  constructor(public jarPath: string, public commands: string[], message: string) {
    super(message)
  }

  name = 'PostProcessFailedError'
}

const PAUSEED = Symbol('PAUSED')
/**
 * Post process the post processors from `InstallProfile`.
 *
 * @param processors The processor info
 * @param minecraft The minecraft location
 * @param java The java executable path
 * @throws {@link PostProcessError}
 */
export class PostProcessingTask extends AbortableTask<void> {
  readonly name: string = 'postProcessing'

  private pointer = 0

  private _abort = () => { }

  constructor(private processors: PostProcessor[], private minecraft: MinecraftFolder, private java: SpawnJavaOptions) {
    super()
    this.param = processors
    this._total = processors.length
  }

  protected async findMainClass(lib: string) {
    let zip: ZipFile | undefined
    let mainClass: string | undefined
    try {
      zip = await open(lib, { lazyEntries: true })
      for await (const entry of walkEntriesGenerator(zip)) {
        if (entry.fileName === 'META-INF/MANIFEST.MF') {
          const content = await readEntry(zip, entry).then((b) => b.toString())
          mainClass = content.split('\n')
            .map((l) => l.split(': '))
            .find((arr) => arr[0] === 'Main-Class')?.[1].trim()
          break
        }
      }
    } catch (e) {
      throw new PostProcessBadJarError(lib, e as any)
    } finally {
      zip?.close()
    }
    if (!mainClass) {
      throw new PostProcessNoMainClassError(lib)
    }
    return mainClass
  }

  protected async isInvalid(outputs: Required<PostProcessor>['outputs']) {
    for (const [file, expect] of Object.entries(outputs)) {
      if (!expect) {
        return false
      }
      const sha1 = await checksum(file, 'sha1').catch((e) => '')
      if (!sha1) return true // if file not exist, the file is not generated
      if (!expect) return false // if expect is empty, we just need file exists
      const expected = expect.replace(/'/g, '')
      if (expected !== sha1) {
        return true
      }
    }
    return false
  }

  protected async postProcess(mc: MinecraftFolder, proc: PostProcessor, javaOptions: SpawnJavaOptions) {
    const jarRealPath = mc.getLibraryByPath(LibraryInfo.resolve(proc.jar).path)
    const mainClass = await this.findMainClass(jarRealPath)
    this._to = proc.jar
    const cp = [...proc.classpath, proc.jar].map(LibraryInfo.resolve).map((p) => mc.getLibraryByPath(p.path)).join(delimiter)
    const cmd = ['-cp', cp, mainClass, ...proc.args]
    try {
      await new Promise((resolve, reject) => {
        const process = (javaOptions?.spawn ?? spawn)(javaOptions.java ?? 'java', cmd)
        waitProcess(process).then(resolve, reject)
        this._abort = () => {
          reject(PAUSEED)
          process.kill(1)
        }
      })
    } catch (e) {
      if (typeof e === 'string') {
        throw new PostProcessFailedError(proc.jar, [javaOptions.java ?? 'java', ...cmd], e)
      }
      throw e
    }
    if (proc.outputs && await this.isInvalid(proc.outputs)) {
      throw new PostProcessFailedError(proc.jar, [javaOptions.java ?? 'java', ...cmd], 'Validate the output of process failed!')
    }
  }

  protected async process(): Promise<void> {
    for (; this.pointer < this.processors.length; this.pointer++) {
      const proc = this.processors[this.pointer]
      if (this.isCancelled) {
        throw new CancelledError()
      }
      if (this.isPaused) {
        throw PAUSEED
      }
      if (!proc.outputs || Object.keys(proc.outputs).length === 0 || await this.isInvalid(proc.outputs)) {
        await this.postProcess(this.minecraft, proc, this.java)
      }
      if (this.isCancelled) {
        throw new CancelledError()
      }
      if (this.isPaused) {
        throw PAUSEED
      }
      this._progress = this.pointer
      this.update(1)
    }
  }

  protected async abort(isCancelled: boolean): Promise<void> {
    // this.activeProcess?.kill()
    this._abort()
  }

  protected isAbortedError(e: any): boolean {
    return e === PAUSEED
  }
}
