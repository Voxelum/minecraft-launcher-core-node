import { Version, Library, Native, Artifact } from './version'
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
        fs.ensureDir(native)
        for (let lib of version.libraries) if ((lib as Native).extractExcludes) {
            const excludes = (lib as Native).extractExcludes;
            let from = mc.getLibrary(lib)
            let zip = await Zip().loadAsync(await fs.readFile(from))
            for (const entry of zip.filter((path, entry) => {
                for (let exclude of excludes)
                    if (path.startsWith(exclude)) return false;
                return true
            })) {
                await fs.writeFile(path.join(native, entry.name), await entry.async('nodebuffer'))
            }
        }
    }

    function genArgs(auth: Auth, options: any, version: Version): string[] {
        let mc = new MinecraftFolder(options.resourcePath)
        let cmd: string[] = [];
        if (options.javaPath.match(/.* *.*/)) { options.javaPath = '"' + options.javaPath + '"' }
        cmd.push(options.javaPath);

        if (os.platform() == 'win32')
            cmd.push('-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump')
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

        cmd.push('-Djava.library.path=' + mc.getNativesRoot(version.root));

        cmd.push('-classpath');

        let libs: Library[] = version.libraries.slice();
        // libs.filter(lib => lib instanceof Native).map(lib => <Native>lib).forEach(handleNative);
        let libPaths: string[] = libs.map(lib => mc.getLibrary(lib));
        libPaths.push(mc.getVersionJar(version.root));

        cmd.push(libPaths.join(os.platform() === 'darwin' ? ':' : ';'));

        if (version.legacy) {
            //handle
        }
        cmd.push(version.mainClass);

        let args = version.launchArgs;

        args = args.replace("${version_name}", version.version);
        args = args.replace("${version_type}", (version.type) ? version.type : 'alpha');

        let assetsDir = path.join(options.resourcePath, (version.legacy ? path.join('assets', 'virtual, legacy') : 'assets'));
        args = args.replace("${assets_root}", assetsDir);
        args = args.replace("${game_assets}", assetsDir);
        args = args.replace("${assets_index_name}", version.assets);
        args = args.replace("${game_directory}", options.gamePath);//TODO check if need to handle the dependency

        args = args.replace("${auth_player_name}", auth.selectedProfile.name);
        args = args.replace("${auth_uuid}", auth.selectedProfile.id.replace('-', ''));
        args = args.replace("${auth_access_token}", auth.accessToken);
        args = args.replace("${user_properties}", JSON.stringify(auth.properties));
        args = args.replace("${user_type}", UserType.toString(auth.userType));

        cmd.push(args);
        //extra mc args
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