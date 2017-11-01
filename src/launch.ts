import { Version, Library, Native, Artifact, checkAllowed } from './version'
import { Auth, UserType } from './auth';
import { exec, ChildProcess, ExecOptions } from 'child_process'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as os from 'os'
import * as Zip from 'jszip'
import { MinecraftFolder } from './utils/folder';
/**
 * this module migrates from JMCCC https://github.com/to2mbn/JMCCC/tree/master/jmccc/src/main/java/org/to2mbn/jmccc/launch
 */
export namespace Launcher {
    export interface Option {
        /**
         * The path for saves/logs/configs
         */
        gamePath: string
        /**
         * The path for assets/mods/resource packs
         */
        resourcePath?: string
        javaPath: string
        minMemory: number
        maxMemory?: number
        version: string | Version,
        server?: { ip: string, port?: number }
        resolution?: { width?: number, height?: number, fullscreen: false }
        extraJVMArgs?: string[]
        extraMCArgs?: string[]
        extraExecOption?: ExecOptions,


        /**
         * Support yushi's yggdrasil agent https://github.com/to2mbn/authlib-injector/wiki
         */
        yggdrasilAgent?: {
            jar: string,
            server: string,
        },

        ignoreInvalidMinecraftCertificates?: boolean
        ignorePatchDiscrepancies?: boolean

    }

    export async function launch(auth: Auth, options: Option): Promise<ChildProcess> {
        await fs.ensureDir(options.gamePath)
        if (!options.version) throw new Error('Version cannot be null!')
        if (!path.isAbsolute(options.gamePath)) options.gamePath = path.resolve(options.gamePath)
        if (!options.resourcePath) options.resourcePath = options.gamePath;
        if (!options.maxMemory) options.maxMemory = options.minMemory;
        let mc = new MinecraftFolder(options.resourcePath)
        let v: Version = options.version instanceof Version ? options.version : await Version.parse(options.resourcePath, options.version)
        if (!v) throw "Cannot find version " + options.version

        if (!fs.existsSync(path.join(mc.versions, v.version, v.version + '.jar')))
            throw new Error('No version jar for ' + v.version);
        let missing = checkLibs(mc, v)
        if (missing.length > 0) throw new Error('Missing library!')
        checkNative(mc, v)

        let args = genArgs(auth, options, v).join(' ')
        return exec(args, {
            encoding: "binary",
            cwd: options.gamePath
        })
    }

    function checkLibs(resourcePath: MinecraftFolder, version: Version): Library[] {
        let libs: Library[] = []
        for (let lib of version.libraries)
            if (!fs.existsSync(resourcePath.getLibrary(lib)))
                libs.push(lib)
        return libs
    }

    async function checkNative(mc: MinecraftFolder, version: Version) {
        let native = mc.getNativesRoot(version.root)
        await fs.ensureDir(native)
        const natives = version.libraries.map(lib => lib as Native)
            .filter(lib => lib.extractExcludes)
        for (let n of natives) {
            const containsExcludes = (path: string) =>
                n.extractExcludes.filter((ex) => path.startsWith(ex)).length === 0
            let from = mc.getLibrary(n)
            let zip = await Zip().loadAsync(await fs.readFile(from))
            for (const entry of zip.filter(containsExcludes)) {
                const filePath = path.join(native, entry.name);
                await fs.ensureFile(filePath)
                await fs.writeFile(filePath, await entry.async('nodebuffer'))
            }

        }
    }

    function genArgs(auth: Auth, options: any, version: Version): string[] {
        let mc = new MinecraftFolder(options.resourcePath)
        let cmd: string[] = [];
        if (options.javaPath.match(/.* *.*/)) { options.javaPath = '"' + options.javaPath + '"' }
        cmd.push(options.javaPath);

        const replaceJVM = (elem: any) => {
            if (typeof elem === 'object') {
                if (checkAllowed(elem.rules)) {
                    return elem.value instanceof Array ? elem.value.join(' ') : elem.value
                }
                return undefined;
            }
            if (elem.indexOf('$') !== -1) {
                if (elem.indexOf('${natives_directory}') !== -1)
                    return elem.replace('${natives_directory}', mc.getNativesRoot(version.root))
                elem = elem.replace('${launcher_name}', 'launcher')
                elem = elem.replace('${launcher_version}', 'launcher')
                if (elem.indexOf('${classpath}') !== -1)
                    return elem.replace('${classpath}',
                        [...version.libraries.map(lib => mc.getLibrary(lib)), mc.getVersionJar(version.root)]
                            .join(os.platform() === 'darwin' ? ':' : ';'))
            }
            return elem;
        }

        // cmd.push('-XX:+UseConcMarkSweepGC');
        // cmd.push('-XX:+CMSIncrementalMode');
        // cmd.push('-XX:-UseAdaptiveSizePolicy');
        // cmd.push('-XX:-OmitStackTraceInFastThrow');
        cmd.push(`-Xmn${(options.minMemory)}M`);
        cmd.push(`-Xms${(options.maxMemory)}M`);

        if (options.ignoreInvalidMinecraftCertificates)
            cmd.push('-Dfml.ignoreInvalidMinecraftCertificates=true');
        if (options.ignorePatchDiscrepancies)
            cmd.push('-Dfml.ignorePatchDiscrepancies=true');

        if (options.yggdrasilAgent)
            cmd.push(`-javaagent:${options.yggdrasilAgent.jar}=@${options.yggdrasilAgent.server}`)
        //add extra jvm args
        if (options.extraJVMArgs) cmd = cmd.concat(options.extraJVMArgs);

        cmd.push(...version.jvmArgs.map(replaceJVM).filter(e => e !== undefined))

        if (version.legacy) {
            //handle
        }
        cmd.push(version.mainClass);

        let gameArgs = version.gameArgs;
        let assetsDir = path.join(options.resourcePath, (version.legacy ? path.join('assets', 'virtual, legacy') : 'assets'));

        const replace = (element: string) => {
            if (typeof element !== 'string') {
                return undefined;
            }
            if (element.startsWith('$')) {
                switch (element) {
                    case '${version_name}': return version.version
                    case '${version_type}': return (version.type) ? version.type : 'alpha'
                    case '${assets_root}': return assetsDir
                    case '${game_assets}': return assetsDir
                    case '${assets_index_name}': return version.assets
                    case '${game_directory}': return options.gamePath
                    case '${auth_player_name}': return auth.selectedProfile.name
                    case '${auth_uuid}': return auth.selectedProfile.id.replace('-', '')
                    case '${auth_access_token}': return auth.accessToken
                    case '${user_properties}': return JSON.stringify(auth.properties)
                    case '${user_type}': return UserType.toString(auth.userType)
                }
            }
            return element;
        }
        cmd.push(...gameArgs.map(replace).filter(e => e !== undefined))

        if (options.extraMCArgs)
            cmd = cmd.concat(options.extraMCArgs);

        if (options.server) {
            cmd.push(`--server ${options.server.ip}`)
            if (options.server.port)
                cmd.push(`--port ${options.server.port}`)
        }

        if (options.resolution) {
            if (options.resolution.fullscreen)
                cmd.push('--fullscreen');
            else {
                if (options.resolution.height)
                    cmd.push(`--height ${options.resolution.height}`);
                if (options.resolution.width)
                    cmd.push(`--width ${options.resolution.width}`)
            }
        }

        return cmd
    }
}

export default Launcher
