import Unzip from "@xmcl/unzip";
import { MinecraftFolder, computeChecksum, currentPlatform, ensureDir, missing, vfs, Platform, JavaExecutor, validateSha1 } from "@xmcl/util";
import { ResolvedNative, ResolvedVersion, Version } from "@xmcl/version";
import { ChildProcess, SpawnOptions, spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { v4 } from "uuid";

function format(template: string, args: any) {
    return template.replace(/\$\{(.*?)}/g, (key) => {
        const value = args[key.substring(2).substring(0, key.length - 3)];
        return value ? value : key;
    });
}

export namespace Launcher {
    export const DEFAULT_EXTRA_JVM_ARGS = Object.freeze([
        "-Xmx2G",
        "-XX:+UnlockExperimentalVMOptions",
        "-XX:+UseG1GC",
        "-XX:G1NewSizePercent=20",
        "-XX:G1ReservePercent=20",
        "-XX:MaxGCPauseMillis=50",
        "-XX:G1HeapRegionSize=32M"
    ]);
    export interface EnabledFeatures {
        [featureName: string]: object | boolean | undefined;
        has_custom_resolution?: { resolution_width: string, resolution_height: string };
        is_demo_user?: boolean;
    }

    /**
     * General launch option, used to generate launch arguments.
     */
    export interface Option {
        /**
         * User selected game profile. For game display name &
         */
        gameProfile?: {
            name: string;
            id: string;
        };
        accessToken?: string;
        userType?: "mojang" | "legacy";
        properties?: object;

        launcherName?: string;
        launcherBrand?: string;

        /**
         * The full path of launched game icon
         */
        gameIcon?: string;

        /**
         * The launched game process name
         */
        gameName?: string;

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
        resolution?: { width?: number, height?: number, fullscreen?: true };
        /**
         * Extra jvm options. This will append after to generated options.
         * If this is empty, the `DEFAULT_EXTRA_JVM_ARGS` will be used.
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
         * Enable features.
         */
        features?: EnabledFeatures;

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
        const minecraftFolder = MinecraftFolder.from(options.path);

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
        const gamePath = !path.isAbsolute(options.gamePath) ? path.resolve(options.gamePath) : options.gamePath;
        const resourcePath = options.resourcePath || gamePath;
        const version = typeof options.version === "string" ? await Version.parse(resourcePath, options.version) : options.version;

        const args = await generateArguments({ ...options, version, gamePath, resourcePath });
        const minecraftFolder = MinecraftFolder.from(resourcePath);

        const jarPath = minecraftFolder.getVersionJar(version.client);
        if (!await validateSha1(jarPath, version.downloads.client.sha1)) {
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
        const mc = MinecraftFolder.from(gamePath);
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
        if (!options.isDemo) { options.isDemo = false; }

        const gamePath = !path.isAbsolute(options.gamePath) ? path.resolve(options.gamePath) : options.gamePath;
        const resourcePath = options.resourcePath || gamePath;
        const version = typeof options.version === "string" ? await Version.parse(resourcePath, options.version) : options.version;
        const mc = MinecraftFolder.from(resourcePath);
        const cmd: string[] = [];

        const { id = v4().replace(/-/g, ""), name = "Steve" } = options.gameProfile || {};
        const accessToken = options.accessToken || v4().replace(/-/g, "");
        const properties = options.properties || {};
        const userType = options.userType || "Mojang";
        const features = options.features || {};
        const jvmArguments = normalizeArguments(version.arguments.jvm, currentPlatform, features);
        const gameArguments = normalizeArguments(version.arguments.game, currentPlatform, features);
        const featureValues = Object.values(features).filter((f) => typeof f === "object").reduce((a: any, b: any) => ({ ...a, ...b }), {});
        const launcherName = options.launcherName || "Launcher";
        const launcherBrand = options.launcherBrand || "0.0.1";
        const nativeRoot = options.nativeRoot || mc.getNativesRoot(version.id);

        let gameIcon = options.gameIcon;
        if (!gameIcon) {
            const index = mc.getAssetsIndex(version.assetIndex.id);
            const indexContent = await vfs.readFile(index, { encoding: "utf-8" }).then((b) => JSON.parse(b.toString()));
            if ("icons/minecraft.icns" in indexContent) {
                gameIcon = mc.getAsset(indexContent["icons/minecraft.icns"].hash);
            } else if ("minecraft/icons/minecraft.icns" in indexContent) {
                gameIcon = mc.getAsset(indexContent["minecraft/icons/minecraft.icns"].hash);
            } else {
                gameIcon = "";
            }
        }
        const gameName = options.gameName || "Minecraft";

        cmd.push(options.javaPath);

        if (currentPlatform.name === "osx") {
            cmd.push(`-Xdock:name=${gameName}`);
            if (gameIcon) {
                cmd.push(`-Xdock:icon=${gameIcon}`);
            }
        }

        if (options.minMemory) {
            cmd.push(`-Xms${(options.minMemory)}M`);
        }
        if (options.maxMemory) {
            cmd.push(`-Xmx${(options.maxMemory)}M`);
        }

        if (options.ignoreInvalidMinecraftCertificates) {
            cmd.push("-Dfml.ignoreInvalidMinecraftCertificates=true");
        }
        if (options.ignorePatchDiscrepancies) {
            cmd.push("-Dfml.ignorePatchDiscrepancies=true");
        }

        if (options.yggdrasilAgent) {
            cmd.push(`-javaagent:${options.yggdrasilAgent.jar}=${options.yggdrasilAgent.server}`);
        }

        const jvmOptions = {
            natives_directory: nativeRoot,
            launcher_name: launcherName,
            launcher_version: launcherBrand,
            classpath: `${[
                ...version.libraries.filter((lib) => !(lib instanceof ResolvedNative)).map((lib) => mc.getLibraryByPath(lib.download.path)),
                mc.getVersionJar(version.client)
            ].join(path.delimiter)}`,
            ...featureValues,
        };

        cmd.push(...jvmArguments.map((arg) => format(arg, jvmOptions)));

        // add extra jvm args
        if (options.extraJVMArgs instanceof Array) {
            if (options.extraJVMArgs.some((v) => typeof v !== "string")) {
                throw new Error("Require extraJVMArgs be all string!");
            }
            cmd.push(...options.extraJVMArgs);
        } else {
            cmd.push(...DEFAULT_EXTRA_JVM_ARGS);
        }

        cmd.push(version.mainClass);
        const assetsDir = path.join(resourcePath, "assets");
        const resolution = options.resolution;
        const mcOptions = {
            version_name: version.id,
            version_type: version.type,
            assets_root: assetsDir,
            game_assets: assetsDir,
            assets_index_name: version.assets,
            game_directory: gamePath,
            auth_player_name: name,
            auth_uuid: id,
            auth_access_token: accessToken,
            user_properties: JSON.stringify(properties),
            user_type: userType,
            resolution_width: -1,
            resolution_height: -1,
            ...featureValues,
        };

        if (resolution) {
            mcOptions.resolution_width = resolution.width;
            mcOptions.resolution_height = resolution.height;
        }

        cmd.push(...gameArguments.map((arg) => format(arg, mcOptions)));

        if (options.extraMCArgs) {
            cmd.push(...options.extraMCArgs);
        }
        if (options.server) {
            cmd.push("--server", options.server.ip);
            if (options.server.port) {
                cmd.push("--port", options.server.port.toString());
            }
        }
        if (options.resolution && !cmd.find((a) => a === "--width")) {
            if (options.resolution.fullscreen) {
                cmd.push("--fullscreen");
            } else {
                if (options.resolution.height) {
                    cmd.push("--height", options.resolution.height.toString());
                }
                if (options.resolution.width) {
                    cmd.push("--width", options.resolution.width.toString());
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
     * @param native The native directory path
     */
    export async function ensureNative(mc: MinecraftFolder, version: ResolvedVersion, native: string = mc.getNativesRoot(version.id)) {
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
                const valid = await vfs.validateSha1(file, entry.sha1);
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

    /**
     * Truely normalize the launch argument.
     */
    export function normalizeArguments(args: Version.LaunchArgument[], platform: Platform, features: EnabledFeatures): string[] {
        return args.map((arg) => {
            if (typeof arg === "string") {
                return arg;
            }
            if (!Version.checkAllowed(arg.rules, platform, Object.keys(features))) {
                return "";
            }
            return arg.value;
        }).reduce<string[]>((result, cur) => {
            if (cur instanceof Array) {
                result.push(...cur);
            } else if (cur) {
                result.push(cur);
            }
            return result;
        }, []);
    }
}

export default Launcher;
