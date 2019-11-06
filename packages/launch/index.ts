import { MinecraftFolder, GameProfile, UserType } from "@xmcl/common";
import Unzip from "@xmcl/unzip";
import { computeChecksum, currentPlatform, ensureDir, missing, vfs } from "@xmcl/util";
import { ResolvedNative, ResolvedVersion, Version } from "@xmcl/version";
import { ChildProcess, SpawnOptions, spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { v4 } from "uuid";


function filterFeature(arg: Version.LaunchArgument, features: Launcher.ProvidedFeatures) {
    if (typeof arg === "object") {
        if (Version.checkAllowed(arg.rules, currentPlatform, Object.keys(features))) {
            const values = arg.value instanceof Array ? arg.value : [arg.value];
            const args = arg.rules.filter((r) => r.features).map((r) =>
                Object.entries(r.features!).map(([k, v]) => v ? features[k] : {}).reduce((a, b) => ({ ...a, ...b }), {}))
                .reduce((a, b) => ({ ...a, ...b }), {});
            const formatedArgs = values.map((v) => format(v, args));
            return formatedArgs;
        }
    } else {
        return arg;
    }
}

function format(template: string, args: any) {
    return template.replace(/\$\{(.*?)}/g, (key) => {
        const value = args[key.substring(2).substring(0, key.length - 3)];
        return value ? value : key;
    });
}

export namespace Launcher {
    export interface ResolutionFeature {
        has_custom_resolution: { resolution_width: string, resolution_height: string };
    }
    export interface DemoFeature {
        is_demo_user: {};
    }
    export interface GenericFeatures {
        [featureName: string]: { [argumentKey: string]: object };
    }

    export type ProvidedFeatures = Partial<ResolutionFeature> & Partial<DemoFeature> & GenericFeatures;

    export interface UserInfo {
        /**
         * User selected game profile. For game display name &
         */
        selectedProfile: GameProfile;
        accessToken: string;
        userType: UserType;
        properties: object;
    }

    /**
     * General launch option, used to generate launch arguments.
     */
    export interface Option {
        /**
         * The auth information
         * @deprecated
         */
        auth?: UserInfo;

        /**
         * The user info;
         */
        user?: UserInfo;

        launcherName?: string;
        launcherBrand?: string;

        /**
         * The path for saves/logs/configs
         */
        gamePath: string;
        /**
         * The path for assets/mods/resource packs
         */
        resourcePath?: string;
        /**
         * The java executable file path. (Not the java home direcotry!)
         */
        javaPath: string;

        /**
         * Min memory, this will add a jvm flag -Xms to the command result
         */
        minMemory?: number;
        /**
         * Min memory, this will add a jvm flag -Xmx to the command result
         */
        maxMemory?: number;
        /**
         * The version of launched Minecraft. Can be either resolved version or version string
         */
        version: string | ResolvedVersion;
        /**
         * Directly launch to a server
         */
        server?: { ip: string, port?: number };
        /**
         * Resolution. This will add --height & --width or --fullscreen to the java arguments
         */
        resolution?: { width?: number, height?: number, fullscreen: false };
        /**
         * Extra jvm options. This will append after to generated options.
         */
        extraJVMArgs?: string[];
        /**
         * Extra program arguments. This will append after to generated options.
         */
        extraMCArgs?: string[];
        extraExecOption?: SpawnOptions;
        isDemo?: boolean;

        /**
         * Native directory. It's .minecraft/versions/<version>/<version>-natives by default.
         * You can replace this by your self.
         */
        nativeRoot?: string;

        /**
         * Enable features. It's just a placeholder, not in used now.
         */
        features?: ProvidedFeatures;

        /**
         * Support yushi's yggdrasil agent https://github.com/to2mbn/authlib-injector/wiki
         */
        yggdrasilAgent?: {
            jar: string,
            server: string,
        };

        /**
         * Add `-Dfml.ignoreInvalidMinecraftCertificates=true` to jvm argument
         */
        ignoreInvalidMinecraftCertificates?: boolean;
        /**
         * Add `-Dfml.ignorePatchDiscrepancies=true` to jvm argument
         */
        ignorePatchDiscrepancies?: boolean;
    }

    export interface PrecheckService {
        /**
         * Make sure the libraries are all good.
         *
         * @param resourcePath The launching resource path, containing libraries folder
         * @param version The resolved version
         */
        ensureLibraries?(resourcePath: MinecraftFolder, version: ResolvedVersion): Promise<void>;
        /**
         * Ensure required natives are all good.
         *
         * @param resourcePath The minecraft root
         * @param version The resolved version
         * @param root The native root directory
         */
        ensureNatives?(resourcePath: MinecraftFolder, version: ResolvedVersion, root: string): Promise<void>;
    }

    export interface ServerOptions {
        javaPath: string;
        /**
         * Minecraft location
         */
        path: string;
        /**
         * Current working directory. Default is the same with the path.
         */
        cwd?: string;
        version: string | ResolvedVersion;

        nogui?: boolean;

        minMemory?: number;
        maxMemory?: number;
        extraJVMArgs?: string[];
        extraMCArgs?: string[];
        extraExecOption?: SpawnOptions;
    }

    export async function launchServer(options: ServerOptions) {
        const args = await generateArgumentsServer(options);
        const version = options.version as ResolvedVersion;
        const minecraftFolder = new MinecraftFolder(options.path);

        await ensureLibraries(minecraftFolder, version);

        const spawnOption = { cwd: options.path, env: process.env, ...(options.extraExecOption || {}) };

        return spawn(args[0], args.slice(1), spawnOption);
    }

    /**
     * Launch the minecraft as a child process. This function use spawn to create child process. To use an alternative way, see function generateArguments.
     *
     * This function will also check if the runtime libs are completed, and will extract native libs if needed.
     * This function might throw exception when the version jar is missing/checksum not matched.
     * This function might throw if the libraries/natives are missing
     *
     * @param options The detail options for this launching.
     * @see ChildProcess
     * @see spawn
     * @see generateArguments
     */
    export async function launch(options: Option & PrecheckService): Promise<ChildProcess> {
        const args = await generateArguments(options);
        const version = options.version as ResolvedVersion;
        const minecraftFolder = new MinecraftFolder(options.resourcePath as string);

        const jarPath = minecraftFolder.getVersionJar(version.client);
        if (!fs.existsSync(jarPath)) {
            throw {
                type: "MissingVersionJar",
                version: version.client,
            };
        }
        if (await computeChecksum(jarPath, "sha1") !== version.downloads.client.sha1) {
            throw {
                type: "CorruptedVersionJar",
                version: version.client,
            };
        }

        await (options.ensureLibraries || ensureLibraries)(minecraftFolder, version);
        await (options.ensureNatives || ensureNative)(minecraftFolder, version, options.nativeRoot || minecraftFolder.getNativesRoot(version.id));

        const spawnOption = { cwd: options.gamePath, env: process.env, ...(options.extraExecOption || {}) };

        return spawn(args[0], args.slice(1), spawnOption);
    }

    /**
     * Generate the argument for server
     */
    export async function generateArgumentsServer(options: ServerOptions) {
        const { javaPath, path: gamePath, version, minMemory = 1024, maxMemory = 1024, extraJVMArgs = [], extraMCArgs = [], extraExecOption = {} } = options;
        const mc = new MinecraftFolder(gamePath);
        const resolvedVersion = typeof version === "string" ? await Version.parse(mc, version) : version;
        const cmd = [
            javaPath, `-Xms${(minMemory)}M`, `-Xmx${(maxMemory)}M`, ...extraJVMArgs,
            "-jar",
            mc.getVersionJar(resolvedVersion.client, "server"),
            ...extraMCArgs,
        ];
        if (options.nogui) {
            cmd.push("nogui");
        }
        options.version = resolvedVersion;

        return cmd;
    }

    /**
     * Generate the arguments array by options. This function is useful if you want to launch the process by yourself.
     *
     * This function will NOT check if the runtime libs are completed, and WONT'T check or extract native libs.
     *
     */
    export async function generateArguments(options: Option) {
        if (!options.version) { throw new Error("Version cannot be null!"); }
        if (!path.isAbsolute(options.gamePath)) { options.gamePath = path.resolve(options.gamePath); }
        if (!options.resourcePath) { options.resourcePath = options.gamePath; }
        if (!options.minMemory) { options.minMemory = 512; }
        if (!options.maxMemory) { options.maxMemory = options.minMemory; }
        if (!options.launcherName) { options.launcherName = "Launcher"; }
        if (!options.launcherBrand) { options.launcherBrand = "0.0.1"; }
        if (!options.isDemo) { options.isDemo = false; }
        options.version = typeof options.version === "string" ? await Version.parse(options.resourcePath, options.version) : options.version;

        const mc = new MinecraftFolder(options.resourcePath);
        const version = options.version;
        const cmd: string[] = [];
        const profile: GameProfile = options.auth ? options.auth.selectedProfile : { id: v4().replace(/-/g, ""), name: "Steve" };
        const accessToken = options.auth ? options.auth.accessToken : v4().replace(/-/g, "");
        const properties = options.auth ? options.auth.properties : {};
        const userType = options.auth ? options.auth.userType : "Mojang";

        cmd.push(options.javaPath);

        cmd.push(`-Xms${(options.minMemory)}M`);
        cmd.push(`-Xmx${(options.maxMemory)}M`);

        if (options.ignoreInvalidMinecraftCertificates) {
            cmd.push("-Dfml.ignoreInvalidMinecraftCertificates=true");
        }
        if (options.ignorePatchDiscrepancies) {
            cmd.push("-Dfml.ignorePatchDiscrepancies=true");
        }

        if (options.yggdrasilAgent) {
            cmd.push(`-javaagent:${options.yggdrasilAgent.jar}=${options.yggdrasilAgent.server}`);
        }
        // add extra jvm args
        if (options.extraJVMArgs) { cmd.push(...options.extraJVMArgs); }

        const jvmOptions = {
            natives_directory: options.nativeRoot || (mc.getNativesRoot(version.id)),
            launcher_name: options.launcherName,
            launcher_version: options.launcherBrand,
            classpath: `${[
                ...version.libraries.map((lib) => mc.getLibraryByPath(lib.download.path)),
                mc.getVersionJar(version.client)
            ]
                .join(path.delimiter)}`,
        };
        cmd.push(...version.arguments.jvm.map((arg) => format(arg as string, jvmOptions)));

        cmd.push(version.mainClass);
        const assetsDir = path.join(options.resourcePath, "assets");
        const resolution = options.resolution || { width: 850, height: 470 };
        const mcOptions = {
            version_name: version.id,
            version_type: version.type,
            assets_root: assetsDir,
            game_assets: assetsDir,
            assets_index_name: version.assets,
            game_directory: options.gamePath,
            auth_player_name: profile.name,
            auth_uuid: profile.id,
            auth_access_token: accessToken,
            user_properties: JSON.stringify(properties),
            user_type: userType,
            resolution_width: resolution.width || 850,
            resolution_height: resolution.height || 470,
        };

        cmd.push(...version.arguments.game.map((arg) => filterFeature(arg, {})).filter((s) => !!s).map((arg) => format(arg as string, mcOptions)));

        if (options.extraMCArgs) { cmd.push(...options.extraMCArgs); }
        if (options.server) {
            cmd.push("--server"); cmd.push(options.server.ip);
            if (options.server.port) {
                cmd.push("--port"); cmd.push(options.server.port.toString());
            }
        }
        if (options.resolution) {
            if (options.resolution.fullscreen) {
                cmd.push("--fullscreen");
            } else {
                if (options.resolution.height) {
                    cmd.push(`--height ${options.resolution.height}`);
                }
                if (options.resolution.width) {
                    cmd.push(`--width ${options.resolution.width}`);
                }
            }
        }
        return cmd;
    }

    /**
     * Make sure the libraries are all good.
     *
     * @param resourcePath The launching resource path, containing libraries folder
     * @param version The resolved version
     */
    export async function ensureLibraries(resourcePath: MinecraftFolder, version: ResolvedVersion) {
        const missingMask = await Promise.all(version.libraries.map((lib) => missing(resourcePath.getLibraryByPath(lib.download.path))));
        const missingLibs = version.libraries.filter((_, index) => missingMask[index]);

        if (missingLibs.length > 0) {
            throw {
                type: "MissingLibs",
                libs: missingLibs,
            };
        }
        const corruptedMask = await Promise.all(version.libraries
            .map((lib) => computeChecksum(resourcePath.getLibraryByPath(lib.download.path))
                .then((sum) => lib.download.sha1 !== "" && sum !== lib.download.sha1)),
        );
        const corruptedLibs = version.libraries.filter((_, index) => corruptedMask[index]);

        if (corruptedLibs.length > 0) {
            throw {
                type: "CorruptedLibs",
                libs: corruptedLibs,
            };
        }
    }

    /**
     * Ensure the native are correctly extracted there.
     */
    export async function ensureNative(mc: MinecraftFolder, version: ResolvedVersion, native: string) {
        await ensureDir(native);
        const natives = version.libraries.filter((lib) => lib instanceof ResolvedNative) as ResolvedNative[];
        const checksumFile = path.join(native, ".json");

        interface CheckEntry { file: string; sha1: string; name: string; }
        const shaEntries: CheckEntry[] = await vfs.readFile(checksumFile).then((b) => b.toString()).then(JSON.parse).catch((e) => undefined);

        const extractedNatives: CheckEntry[] = [];
        async function extractJar(n: ResolvedNative | undefined) {
            if (!n) { return; }
            const excluded: string[] = n.extractExclude ? n.extractExclude : [];
            const containsExcludes = (p: string) => excluded.filter((s) => p.startsWith(s)).length === 0;
            const notInMetaInf = (p: string) => p.indexOf("META-INF/") === -1;
            const notSha1AndNotGit = (p: string) => !(p.endsWith(".sha1") || p.endsWith(".git"));
            const from = mc.getLibraryByPath(n.download.path);
            await fs.createReadStream(from).pipe(Unzip.createExtractStream(native, (entry) => {
                const filtered = containsExcludes(entry.fileName) && notInMetaInf(entry.fileName) && notSha1AndNotGit(entry.fileName) ? entry.fileName : undefined;
                if (filtered) {
                    extractedNatives.push({ file: entry.fileName, name: n.name, sha1: "" });
                }
                return filtered;
            })).wait();
        }
        if (shaEntries) {
            const validEntries: { [name: string]: boolean } = {};
            for (const entry of shaEntries) {
                if (typeof entry.file !== "string") { continue; }
                const file = path.join(native, entry.file);
                const valid = await vfs.validate(file, { algorithm: "sha1", hash: entry.sha1 });
                if (!valid) {
                    validEntries[entry.name] = true;
                }
            }
            const missingNatives = natives.filter((n) => !validEntries[n.name]);
            if (missingNatives.length !== 0) {
                await Promise.all(missingNatives.map(extractJar));
            }
        } else {
            await Promise.all(natives.map(extractJar));
            const checkSumContent = await Promise.all(extractedNatives.map(async (n) => ({ ...n, sha1: await computeChecksum(path.join(native, n.file)) })));
            const targetContent = JSON.stringify(checkSumContent);
            await vfs.writeFile(checksumFile, targetContent);
        }
    }
}

export default Launcher;
