import { LibraryInfo, MinecraftFolder, MinecraftLocation, Version, Version as VersionJson } from '@xmcl/core'
import { AbortableTask, CancelledError, Task, task } from '@xmcl/task'
import { filterEntries, open, readEntry, walkEntriesGenerator } from '@xmcl/unzip'
import { spawn } from 'child_process'
import { readFile, writeFile } from 'fs/promises'
import { delimiter, dirname, join, relative, sep } from 'path'
import { ZipFile } from 'yauzl'
import { convertClasspathToMaven, parseManifest } from './manifest'
import { InstallLibraryTask, InstallSideOption, LibraryOptions } from './minecraft'
import { SpawnJavaOptions, checksum, missing, waitProcess } from './utils'

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

export interface PostProcessOptions extends SpawnJavaOptions {
  /**
   * Custom handlers to handle the post processor
   */
  handler?: (postProcessor: PostProcessor) => Promise<boolean>
  onPostProcessFailed?: (proc: PostProcessor, jar: string, classPaths: string, mainClass: string, args: string[], error: unknown) => void
  onPostProcessSuccess?: (proc: PostProcessor, jar: string, classPaths: string, mainClass: string, args: string[]) => void
  customPostProcessTask?: (processor: PostProcessor[], minecraftFolder: MinecraftFolder, options: PostProcessOptions, originalTask: () => Task<void>) => Task<void>
}

export interface InstallProfileOption extends LibraryOptions, InstallSideOption, PostProcessOptions {
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
export function postProcess(processors: PostProcessor[], minecraft: MinecraftFolder, options: PostProcessOptions) {
  return new PostProcessingTask(processors, minecraft, options).startAndWait()
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

function parseArgumentsFromArgsFile(content: string, parentDir: string, serverProfile: Version) {
  const args = content.split('\n').map(v => v.trim().split(' ')).flatMap(v => v).filter(v => v)
  // find the Main class or -jar
  let mainClass: string = ''
  let jar: string | undefined
  let found = false
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('-')) {
      if (args[i] === '-jar') {
        jar = join(parentDir, args[i + 1])
        found = true
        i++
        continue
      }
    } else if (!mainClass) {
      mainClass = args[i]
      found = true
      continue
    }
    if (!found) {
      if (!args[i].startsWith('-D')) {
        serverProfile.arguments!.jvm.push(args[i], args[i + 1])
        i++
      } else {
        serverProfile.arguments!.jvm.push(args[i])
      }
    } else {
      serverProfile.arguments!.game.push(args[i])
    }
  }

  serverProfile.mainClass = mainClass

  return jar
}

async function parseJar(minecraftFolder: MinecraftFolder, jar: string, installProfile: InstallProfile, serverVersion: Version) {
  let zip: ZipFile | undefined
  try {
    const jsonContent: Version = JSON.parse(await readFile(minecraftFolder.getVersionJson(installProfile.version), 'utf-8'))
    zip = await open(jar, { lazyEntries: true, autoClose: false })
    const [entry] = await filterEntries(zip, ['META-INF/MANIFEST.MF'])
    if (entry) {
      const manifestContent = await readEntry(zip, entry).then((b) => b.toString())
      const result = parseManifest(manifestContent)
      serverVersion.mainClass = result.mainClass
      const cp = [...result.classPath, relative(minecraftFolder.libraries, jar).replaceAll(sep, '/')]
      serverVersion.libraries.push(...jsonContent.libraries.filter(l => !l.name.endsWith(':client')))
      const mavenPaths = convertClasspathToMaven(cp)
      for (const name of mavenPaths) {
        if (serverVersion.libraries.find(l => l.name === name)) continue
        if (name.startsWith(':')) continue
        serverVersion.libraries.push({ name })
      }
    }
  } catch (e) {
    throw new PostProcessBadJarError(jar, e as any)
  } finally {
    zip?.close()
  }
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

    const side = options.side === 'server' ? 'server' : 'client'

    const processor = resolveProcessors(side, installProfile, minecraftFolder)

    const installRequiredLibs = VersionJson.resolveLibraries(installProfile.libraries)

    await this.yield(new InstallLibraryTask(installRequiredLibs, minecraftFolder, options))

    if (options.customPostProcessTask) {
      await this.yield(options.customPostProcessTask(processor, minecraftFolder, options, () => new PostProcessingTask(processor, minecraftFolder, options)))
    } else {
      await this.yield(new PostProcessingTask(processor, minecraftFolder, options))
    }

    if (side === 'client') {
      const versionJson: VersionJson = await readFile(minecraftFolder.getVersionJson(installProfile.version)).then((b) => b.toString()).then(JSON.parse)
      const libraries = VersionJson.resolveLibraries(versionJson.libraries)
      await this.yield(new InstallLibraryTask(libraries, minecraftFolder, options))
    } else {
      const argsText = process.platform === 'win32' ? 'win_args.txt' : 'unix_args.txt'

      if (!installProfile.processors) { return }

      let txtPath: string | undefined
      for (const p of installProfile.processors) {
        txtPath = p.args.find(a => a.startsWith('{ROOT}') && a.endsWith(argsText))
        if (txtPath) {
          txtPath = txtPath.replace('{ROOT}', minecraftFolder.root)
          if (await missing(txtPath)) {
            throw new Error(`No ${argsText} found in the forge jar`)
          }
          break
        }
      }
      const serverProfile: Version = {
        id: installProfile.version,
        libraries: [],
        type: 'release',
        arguments: {
          game: [],
          jvm: [],
        },
        releaseTime: new Date().toJSON(),
        time: new Date().toJSON(),
        minimumLauncherVersion: 13,
        mainClass: '',
        inheritsFrom: installProfile.minecraft,
      }

      let jar: string | undefined

      if (!txtPath) {
        // legacy
        const info = LibraryInfo.resolve(installProfile.path)
        const libPath = minecraftFolder.getLibraryByPath(info.path)
        jar = libPath
      } else {
        const content = await readFile(txtPath, 'utf-8')
        jar = parseArgumentsFromArgsFile(content, dirname(txtPath), serverProfile)
      }

      if (jar) {
        await parseJar(minecraftFolder, jar, installProfile, serverProfile)
      }

      const neoForgeVersion = serverProfile.arguments?.game.find((v, i, arr) => arr[i - 1] === '--fml.neoForgeVersion')
      if (neoForgeVersion) {
        serverProfile.libraries.push({
          name: `net.neoforged:neoforge:${neoForgeVersion}:universal`,
        }, {
          name: `net.neoforged:neoforge:${neoForgeVersion}:server`,
        })
      }
      const neoFormVersion = serverProfile.arguments?.game.find((v, i, arr) => arr[i - 1] === '--fml.neoFormVersion')
      if (neoFormVersion) {
        serverProfile.libraries.push({
          name: `net.minecraft:server:${installProfile.minecraft}-${neoFormVersion}:extra`,
        }, {
          name: `net.minecraft:server:${installProfile.minecraft}-${neoFormVersion}:srg`,
        })
      }

      if (!serverProfile.mainClass) {
        throw new PostProcessNoMainClassError(jar!)
      }

      await writeFile(join(minecraftFolder.getVersionRoot(serverProfile.id), 'server.json'), JSON.stringify(serverProfile, null, 4))

      const resolvedLibraries = VersionJson.resolveLibraries(serverProfile.libraries)
      await this.yield(new InstallLibraryTask(resolvedLibraries, minecraftFolder, options))
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

export class PostProcessValidationFailedError extends PostProcessFailedError {
  constructor(jarPath: string, commands: string[], message: string, readonly file: string, readonly expect: string, readonly actual: string) {
    super(jarPath, commands, message)
  }

  name = 'PostProcessValidationFailedError'
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

  constructor(private processors: PostProcessor[], private minecraft: MinecraftFolder, private options: PostProcessOptions) {
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
      const sha1 = await checksum(file, 'sha1').catch((e) => '') as string
      const expected = expect.replace(/'/g, '')
      if (!sha1) return [file, expected, sha1] as const // if file not exist, the file is not generated
      if (!expect) return false // if expect is empty, we just need file exists
      if (expected !== sha1) {
        return [file, expected, sha1] as const
      }
    }
    return false
  }

  protected async postProcess(mc: MinecraftFolder, proc: PostProcessor, options: PostProcessOptions) {
    if (await options.handler?.(proc).catch(() => false)) {
      return
    }
    const jarRealPath = mc.getLibraryByPath(LibraryInfo.resolve(proc.jar).path)
    const mainClass = await this.findMainClass(jarRealPath)
    this._to = proc.jar
    const cp = [...proc.classpath, proc.jar].map(LibraryInfo.resolve).map((p) => mc.getLibraryByPath(p.path)).join(delimiter)
    const cmd = ['-cp', cp, mainClass, ...proc.args]
    try {
      await new Promise((resolve, reject) => {
        const process = (options?.spawn ?? spawn)(options.java ?? 'java', cmd)
        waitProcess(process).then(resolve, reject)
        this._abort = () => {
          reject(PAUSEED)
          process.kill(1)
        }
      })
      options.onPostProcessSuccess?.(proc, jarRealPath, cp, mainClass, proc.args)
    } catch (e) {
      if (e !== PAUSEED) {
        options.onPostProcessFailed?.(proc, jarRealPath, cp, mainClass, proc.args, e)
      }
      if (e instanceof Error && e.name === 'Error') {
        throw new PostProcessFailedError(proc.jar, [options.java ?? 'java', ...cmd], e.message)
      }
      throw e
    }
    // if (proc.outputs) {
    //   const invalidation = await this.isInvalid(proc.outputs)
    //   if (invalidation) {
    //     const [file, expect, actual] = invalidation
    //     throw new PostProcessValidationFailedError(proc.jar, [options.java ?? 'java', ...cmd], 'Validate the output of process failed!', file, expect, actual)
    //   }
    // }
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
      await this.postProcess(this.minecraft, proc, this.options)
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
    this._abort()
  }

  protected isAbortedError(e: any): boolean {
    return e === PAUSEED
  }
}
