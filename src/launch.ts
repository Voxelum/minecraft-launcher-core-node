import { Version, Library, Native, Artifact } from './version'
import { Auth, UserType } from './auth';
import { ChildProcess, ExecOptions, spawn } from 'child_process'
import { v4 } from 'uuid'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as os from 'os'
import * as Zip from 'jszip'
import { MinecraftFolder } from './utils/folder';
import format from './utils/format'
import { GameProfile } from './profile';

export namespace Launcher {
    export interface Option {
        /**
         * The auth information
         */
        auth?: Auth,
        accessToken?: string,
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

    /**
     * Launch the minecraft as a child process. This function use spawn to create child process. To use an alternative way, see function generateArguments.
     * 
     * This function will also check if the runtime libs are completed, and will extract native libs if needed.
     * 
     * @param options The detail options for this launching. 
     * @see ChildProcess
     * @see spawn
     * @see generateArguments
     */
    export async function launch(options: Option): Promise<ChildProcess> {
        const args = await generateArguments(options);
        const version = options.version as Version;
        const minecraftFolder = new MinecraftFolder(options.resourcePath as string)

        let missing = ensureLibraries(minecraftFolder, version)
        if (missing.length > 0) throw {
            type: "MissingLibs",
            libs: missing,
        }
        await extractNative(minecraftFolder, version)

        return spawn(args[0], args.slice(1), { cwd: options.gamePath })
    }

    /**
     * Generate the arguments array by options. This function is useful if you want to launch the process by yourself.
     * 
     * This function will NOT check if the runtime libs are completed, and WONT'T check or extract native libs.
     * 
     */
    export async function generateArguments(options: Option) {
        if (!options.version) throw new Error('Version cannot be null!')
        if (!options.auth) options.auth = Auth.offline('Steve');
        if (!path.isAbsolute(options.gamePath)) options.gamePath = path.resolve(options.gamePath);
        if (!options.resourcePath) options.resourcePath = options.gamePath;
        if (!options.minMemory) options.minMemory = 512;
        if (!options.maxMemory) options.maxMemory = options.minMemory;
        if (!options.launcherName) options.launcherName = 'JMCCC'
        if (!options.launcherBrand) options.launcherBrand = 'InfinityStudio'
        if (!options.isDemo) options.isDemo = false;
        options.version = typeof options.version === 'string' ? await Version.parse(options.resourcePath, options.version) : options.version;

        const mc = new MinecraftFolder(options.resourcePath)
        const version = options.version;
        const cmd: string[] = [];
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
        if (options.extraJVMArgs) cmd.push(...options.extraJVMArgs);

        const jvmOptions = {
            natives_directory: (mc.getNativesRoot(version.id)),
            launcher_name: options.launcherName,
            launcher_version: options.launcherBrand,
            classpath: `${[...version.libraries.map(lib => mc.getLibraryByPath(lib.download.path)),
            mc.getVersionJar(version.client)]
                .join(os.platform() === 'darwin' ? ':' : ';')}`
        };
        cmd.push(...version.arguments.jvm.map(arg => format(arg as string, jvmOptions)))

        cmd.push(version.mainClass);
        const assetsDir = path.join(options.resourcePath, 'assets');
        const resolution = options.resolution || { width: 850, height: 470 }
        const mcOptions = {
            version_name: version.id,
            version_type: version.type,
            assets_root: (assetsDir),
            game_assets: (assetsDir),
            assets_index_name: version.assets,
            game_directory: (options.gamePath),
            auth_player_name: options.auth.selectedProfile ? options.auth.selectedProfile.name || 'Steve' : 'Steve',
            auth_uuid: options.auth.selectedProfile.id.replace(/-/g, ''),
            auth_access_token: options.auth.accessToken || v4(),
            user_properties: JSON.stringify(options.auth.properties),
            user_type: UserType.toString(options.auth.userType),
            resolution_width: resolution.width || 850,
            resolution_height: resolution.height || 470,
        }

        cmd.push(...version.arguments.game.map(arg => format(arg as string, mcOptions)));

        if (options.extraMCArgs) cmd.push(...options.extraMCArgs);
        if (options.server) {
            cmd.push('--server'); cmd.push(options.server.ip);
            if (options.server.port) {
                cmd.push('--port'); cmd.push(options.server.port.toString());
            }
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

    function ensureLibraries(resourcePath: MinecraftFolder, version: Version): Library[] {
        return version.libraries.filter(lib => !fs.existsSync(resourcePath.getLibraryByPath(lib.download.path)))
    }

    async function extractNative(mc: MinecraftFolder, version: Version) {
        const native = mc.getNativesRoot(version.id)
        await fs.ensureDir(native)
        const natives = version.libraries.filter(lib => lib instanceof Native) as Native[];
        return Promise.all(natives.map(async (n) => {
            const excluded: string[] = n.extractExclude ? n.extractExclude : []
            const containsExcludes = (path: string) => excluded.filter(s => path.startsWith(s)).length === 0
            let from = mc.getLibraryByPath(n.download.path)
            let zip = await Zip().loadAsync(await fs.readFile(from))
            for (const entry of zip.filter(containsExcludes)) {
                const filePath = path.join(native, entry.name);
                await fs.ensureFile(filePath)
                await fs.writeFile(filePath, await entry.async('nodebuffer'))
            }
        }))
    }
    interface CompletedOption extends Option {
        auth: Auth,
        launcherName: string,
        launcherBrand: string,
        resourcePath: string
        minMemory: number
        maxMemory: number
        version: Version,

        server?: { ip: string, port?: number }
        resolution?: { width?: number, height?: number, fullscreen: false }
        extraJVMArgs?: string[]
        extraMCArgs?: string[]
        isDemo?: boolean,

        yggdrasilAgent?: {
            jar: string,
            server: string,
        },
        extraExecOption?: ExecOptions,

        ignoreInvalidMinecraftCertificates: boolean
        ignorePatchDiscrepancies: boolean
    }
}

export default Launcher
