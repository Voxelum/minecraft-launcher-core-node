import { Version, Library, Native, Artifact } from './version'
import { Auth, UserType } from './auth';
import { exec, ChildProcess, ExecOptions } from 'child_process'
import { v4 } from 'uuid'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as os from 'os'
import * as Zip from 'jszip'
import { MinecraftFolder } from './utils/folder';
import format from './utils/format'

export namespace Launcher {
    export interface Option {
        auth?: Auth,
        launcherName?: string,
        launcherBrand?: string,

        /**
         * The path for saves/logs/configs
         */
        gamePath: string
        /**
         * The path for assets/mods/resource packs
         */
        resourcePath?: string
        javaPath: string

        minMemory?: number
        maxMemory?: number
        version: string | Version,
        server?: { ip: string, port?: number }
        resolution?: { width?: number, height?: number, fullscreen: false }
        extraJVMArgs?: string[]
        extraMCArgs?: string[]
        extraExecOption?: ExecOptions,
        isDemo?: boolean,

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

    export async function launch(options: Option): Promise<ChildProcess> {
        await fs.ensureDir(options.gamePath)
        if (!options.version) throw new Error('Version cannot be null!')
        if (!options.auth) options.auth = Auth.offline('Steve');
        if (!path.isAbsolute(options.gamePath)) options.gamePath = path.resolve(options.gamePath)
        if (!options.resourcePath) options.resourcePath = options.gamePath;
        if (!options.minMemory) options.minMemory = 512;
        if (!options.maxMemory) options.maxMemory = options.minMemory;
        if (!options.launcherName) options.launcherName = 'JMCCC'
        if (!options.launcherBrand) options.launcherBrand = 'InfinityStudio'
        if (!options.isDemo) options.isDemo = false;
        let mc = new MinecraftFolder(options.resourcePath)
        let v: Version = typeof options.version === 'string' ? await Version.parse(options.resourcePath, options.version) : options.version;
        if (!v) throw "Cannot find version " + options.version

        if (!fs.existsSync(path.join(mc.versions, v.id, v.id + '.jar')))
            throw new Error('No version jar for ' + v.id);
        let missing = ensureLibraries(mc, v)
        if (missing.length > 0) throw new Error('Missing library!')
        extractNative(mc, v)

        let args = genArgs(options.auth, options, v).join(' ')
        return exec(args, {
            encoding: "binary",
            cwd: options.gamePath
        })
    }

    export async function generateArguments(options: Option) {
        if (!options.version) throw new Error('Version cannot be null!')
        if (!options.auth) options.auth = Auth.offline('Steve');
        if (!path.isAbsolute(options.gamePath)) options.gamePath = path.resolve(options.gamePath)
        if (!options.resourcePath) options.resourcePath = options.gamePath;
        if (!options.minMemory) options.minMemory = 512;
        if (!options.maxMemory) options.maxMemory = options.minMemory;
        if (!options.launcherName) options.launcherName = 'JMCCC'
        if (!options.launcherBrand) options.launcherBrand = 'InfinityStudio'
        if (!options.isDemo) options.isDemo = false;
        let v: Version = typeof options.version === 'string' ? await Version.parse(options.resourcePath, options.version) : options.version;
        let mc = new MinecraftFolder(options.resourcePath)
        return genArgs(options.auth, options, v);
    }

    function ensureLibraries(resourcePath: MinecraftFolder, version: Version): Library[] {
        return version.libraries.filter(lib => !fs.existsSync(resourcePath.getLibraryByPath(lib.download.path)))
    }

    async function extractNative(mc: MinecraftFolder, version: Version) {
        let native = mc.getNativesRoot(version.id)
        await fs.ensureDir(native)
        const natives = version.libraries.filter(lib => lib instanceof Native) as Native[];
        for (let n of natives) {
            const excluded: string[] = n.extractExclude ? n.extractExclude : []
            const containsExcludes = (path: string) => excluded.filter(s => path.startsWith(s)).length === 0
            let from = mc.getLibraryByPath(n.download.path)
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

        const wrap = (s: string) => `"${s}"`;
        cmd.push(format(version.jvmArguments, {
            natives_directory: `"${mc.getNativesRoot(version.id)}"`,
            launcher_name: options.launcherName,
            launcher_version: options.launcherBrand,
            classpath: `"${[...version.libraries.map(lib => mc.getLibraryByPath(lib.download.path)),
                mc.getVersionJar(version.client)]
                .join(os.platform() === 'darwin' ? ':' : ';')}"`
        }));
        cmd.push(version.mainClass);
        let assetsDir = path.join(options.resourcePath, 'assets');

        cmd.push(format(version.minecraftArguments, {
            version_name: version.id,
            version_type: version.type,
            assets_root: wrap(assetsDir),
            game_assets: wrap(assetsDir),
            assets_index_name: version.assets,
            game_directory: wrap(options.gamePath),
            auth_player_name: auth.selectedProfile ? auth.selectedProfile.name || 'Steve' : 'Steve',
            auth_uuid: auth.selectedProfile.id.replace('-', ''),
            auth_access_token: auth.accessToken || v4(),
            user_properties: JSON.stringify(auth.properties),
            user_type: UserType.toString(auth.userType),
        }));

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
