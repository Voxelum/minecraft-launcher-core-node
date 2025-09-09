import { MinecraftFolder, ResolvedServerVersion, ServerOptions, Version, generateArgumentsServer } from '@xmcl/core';
import { copy, writeFile } from 'fs-extra';
import { join, relative } from 'path';

/**
 * The abstract layer to export instance as a runnable server.
 * 
 * This will emit the .sh and .bat files to start the server with all dependencies/mods needed.
 */
export abstract class ServerExporter {
  /**
   * @param from Absolute path
   * @param to Relative path to the output
   */
  abstract copyFile(from: string, to: string): void
  abstract emitFile(path: string, content: string): void
  abstract end(): Promise<void>

  /**
   * 
   * @param minecraftPath The root folder of the Minecraft installation
   * @param context The context to resolve server version and generate server options
   */
  constructor(protected minecraftPath: string) { }

  async exportInstance(
    serverDir: string,
    options: ServerOptions,
    version: string,
    files: string[]
  ): Promise<void> {
    const ops = { ...options }
    ops.javaPath = 'java' // force use system java

    ops.classPath = ops.classPath?.map(cp => relative(this.minecraftPath, cp)) // force to use relative path

    const mc = MinecraftFolder.from(this.minecraftPath)

    // copy all files to the output folder
    files.forEach(file => this.copyFile(join(serverDir, file), file))

    // copy all libs to the output folder
    const serverVersion = await Version.parseServer(this.minecraftPath, version)
    serverVersion.libraries.forEach(lib => this.copyFile(mc.getLibraryByPath(lib.path), `libraries/${lib.path}`))

    // copy mc server jar
    const serverJarPath = mc.getVersionJar(serverVersion.minecraftVersion, 'server')
    this.copyFile(serverJarPath, relative(mc.root, serverJarPath))

    if (ops.serverExectuableJarPath) {
      // copy to the output folder
      this.copyFile(ops.serverExectuableJarPath, 'server.jar')
      ops.serverExectuableJarPath = 'server.jar'
    }

    const winArgs = generateArgumentsServer(ops, ';', '\\')
    const linuxArgs = generateArgumentsServer(ops, ':', '/')

    // write bat and sh
    const batContent = `@echo off\n${winArgs.join(' ')}`
    const shContent = `#!/bin/sh\n${linuxArgs.join(' ')}`
    this.emitFile('server.bat', batContent)
    this.emitFile('server.sh', shContent)

    await this.end()
  }
}

/**
 * The implementation of `ServerFSExporter` which export the server to a folder in the local filesystem.
 */
export class ServerFSExporter extends ServerExporter {
  #promises: Promise<void>[] = []

  constructor(dataRoot: string, protected outputFolder: string) {
    super(dataRoot)
  }

  copyFile(from: string, to: string) {
    this.#promises.push(copy(from, join(this.outputFolder, to)))
  }

  emitFile(path: string, content: string) {
    this.#promises.push(writeFile(join(this.outputFolder, path), content))
  }

  async end(): Promise<void> {
    await Promise.all(this.#promises)
  }
}
