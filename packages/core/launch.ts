import { createExtractStream } from "@xmcl/unzip";
import { validateSha1, readFile, writeFile, getSha1, mkdir } from "./util";
import { ChildProcess, spawn, SpawnOptions } from "child_process";
import { createReadStream } from "fs";
import { join, isAbsolute, resolve, delimiter } from "path";
import { v4 } from "uuid";
import { MinecraftFolder } from "./folder";
import { Platform, getPlatform } from "./platform";
import { Version, ResolvedNative, ResolvedVersion, ResolvedLibrary } from "./version";
import { EventEmitter } from "events";

function format(template: string, args: any) {
    return template.replace(/\$\{(.*?)}/g, (key) => {
        const value = args[key.substring(2).substring(0, key.length - 3)];
        return value ? value : key;
    });
}

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
 * @see {@link generateArguments}
 * @see {@link launch}
 */
export interface LaunchOption {
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
     * Overwrite the version name of the current version.
     * If this is absent, it will use version name from resolved version.
     */
    versionName?: string;
    /**
     * Overwrite the version type of the current version.
     * If this is absent, it will use version type from resolved version.
     *
     * Some people use this to show fantastic message on the welcome screen.
     */
    versionType?: string;
    /**
     * The full path of launched game icon
     * Currently, this only supported on MacOS
     */
    gameIcon?: string;
    /**
     * The launched game name
     * Currently, this only supported on MacOS
     */
    gameName?: string;
    /**
     * The path of parent directory of saves/logs/configs/mods/resourcepacks
     */
    gamePath: string;
    /**
     * The path of parent directory of assets/libraries
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
    /**
     * Assign the spawn options to the process.
     *
     * If you try to set `{ shell: true }`, you might want to make all argument rounded with "".
     * The `launch` function will do it for you, but if you want to spawn process by yourself, remember to do that.
     */
    extraExecOption?: SpawnOptions;
    isDemo?: boolean;

    /**
     * Native directory. It's .minecraft/versions/<version>/<version>-natives by default.
     * You can replace this by your self.
     */
    nativeRoot?: string;
    /**
     * Enable features. Not really in used...
     */
    features?: EnabledFeatures;
    /**
     * Support yushi's yggdrasil agent https://github.com/to2mbn/authlib-injector/wiki
     */
    yggdrasilAgent?: {
        /**
         * The jar file path of the authlib-injector
         */
        jar: string;
        /**
         * The auth server host
         */
        server: string;
        /**
         * The prefetched base64
         */
        prefetched?: string;
    };
    /**
     * Add `-Dfml.ignoreInvalidMinecraftCertificates=true` to jvm argument
     */
    ignoreInvalidMinecraftCertificates?: boolean;
    /**
     * Add `-Dfml.ignorePatchDiscrepancies=true` to jvm argument
     */
    ignorePatchDiscrepancies?: boolean;
    /**
     * The platform of this launch will run. By default, it will fetch the current machine info if this is absent.
     */
    platform?: Platform;

    /**
     * The launcher precheck functions. These will run before it run.
     *
     * This property is only used for `launch` function. The `generateArguments` function won't use this!
     * @see {@link launch}
     * @see {@link generateArguments}
     */
    prechecks?: LaunchPrecheck[];
}

/**
 * The function to check the game status before the game launched. Will be used in `launch` function.
 * @see {@link launch}
 */
export interface LaunchPrecheck {
    (resourcePath: MinecraftFolder, version: ResolvedVersion, option: LaunchOption): Promise<void>;
}

/**
 * Thrown when the version jar is corrupted. This interface only used in `LaunchPrecheck.checkVersion`
 * @see {@link LaunchPrecheck.checkVersion}
 */
export interface CorruptedVersionJarError {
    error: "CorruptedVersionJar";
    version: string;
}
/**
 * Thrown when the libraries jar is corrupted. This interface only used in `LaunchPrecheck.checkLibraries`
 * @see {@link LaunchPrecheck.checkLibraries}
 */
export interface MissingLibrariesError {
    error: "MissingLibraries";
    libraries: ResolvedLibrary[];
    version: ResolvedVersion;
}

export namespace LaunchPrecheck {
    /**
     * The default launch precheck. It will check version jar, libraries and natives.
     */
    export const Default: LaunchPrecheck[] = [checkVersion, checkLibraries, checkNatives];

    /**
     * Quick check if Minecraft version jar is corrupted
     * @throws {@link CorruptedVersionJarError}
     */
    export async function checkVersion(resource: MinecraftFolder, version: ResolvedVersion, option: LaunchOption) {
        const jarPath = resource.getVersionJar(version.minecraftVersion);
        if (!await validateSha1(jarPath, version.downloads.client.sha1)) {
            throw Object.assign(new Error(`Corrupted Version jar ${jarPath}. Either the file not reachable or the file sha1 not matched!`), {
                error: "CorruptedVersionJar",
                version: version.minecraftVersion,
            } as CorruptedVersionJarError);
        }
    };
    /**
     * Quick check if there are missed libraries.
     * @throws {@link MissingLibrariesError}
     */
    export async function checkLibraries(resource: MinecraftFolder, version: ResolvedVersion, option: LaunchOption) {
        const validMask = await Promise.all(version.libraries
            .map((lib) => validateSha1(resource.getLibraryByPath(lib.download.path), lib.download.sha1)));
        const corruptedLibs = version.libraries.filter((_, index) => !validMask[index]);

        if (corruptedLibs.length > 0) {
            throw Object.assign(new Error(`Missing ${corruptedLibs.length} libraries! Either the file not reachable or the file sha1 not matched!`), {
                error: "MissingLibraries",
                libraries: corruptedLibs,
                version,
            } as MissingLibrariesError);
        }
    };
    /**
     * Ensure the native are correctly extracted there.
     * @param native The native directory path
     */
    export async function checkNatives(resource: MinecraftFolder, version: ResolvedVersion, option: LaunchOption) {
        const native: string = option.nativeRoot || resource.getNativesRoot(version.id);
        await mkdir(native, { recursive: true }).catch((e) => {
            if (e.code !== "EEXIST") { throw e; }
        });
        const natives = version.libraries.filter((lib) => lib instanceof ResolvedNative) as ResolvedNative[];
        const checksumFile = join(native, ".json");
        const includedLibs = natives.map((n) => n.name).sort();

        interface ChecksumFile { entries: CheckEntry[]; libraries: string[] }
        interface CheckEntry { file: string; sha1: string; name: string; }

        const checksumFileObject: ChecksumFile = await readFile(checksumFile, "utf-8").then(JSON.parse).catch((e) => undefined);

        let shaEntries: CheckEntry[] | undefined;
        if (checksumFileObject && checksumFileObject.libraries) {
            // only if the lib not change
            // consider the case of os changed or java changed
            if (checksumFileObject.libraries.sort().every((v, i) => v === includedLibs[i])) {
                shaEntries = checksumFileObject.entries;
            }
        }

        const extractedNatives: CheckEntry[] = [];
        async function extractJar(n: ResolvedNative | undefined) {
            if (!n) { return; }
            const excluded: string[] = n.extractExclude || [];

            const containsExcludes = (p: string) => excluded.filter((s) => p.startsWith(s)).length === 0;
            const notInMetaInf = (p: string) => p.indexOf("META-INF/") === -1;
            const notSha1AndNotGit = (p: string) => !(p.endsWith(".sha1") || p.endsWith(".git"));

            const from = resource.getLibraryByPath(n.download.path);
            await createReadStream(from).pipe(createExtractStream(native, {
                entryHandler: (dest, entry) => {
                    const filtered = containsExcludes(entry.fileName) && notInMetaInf(entry.fileName) && notSha1AndNotGit(entry.fileName) ? entry.fileName : undefined;
                    if (filtered) {
                        extractedNatives.push({ file: entry.fileName, name: n.name, sha1: "" });
                    }
                    return filtered;
                }
            })).wait();
        }
        if (shaEntries) {
            const validEntries: { [name: string]: boolean } = {};
            for (const entry of shaEntries) {
                if (typeof entry.file !== "string") { continue; }
                const file = join(native, entry.file);
                const valid = await validateSha1(file, entry.sha1);
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
            const entries = await Promise.all(extractedNatives.map(async (n) => ({
                ...n,
                sha1: await getSha1(join(native, n.file))
            })));
            const fileContent = JSON.stringify({
                entries,
                libraries: includedLibs,
            });
            await writeFile(checksumFile, fileContent);
        }
    }
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
    const spawnOption = { cwd: options.path, env: process.env, ...(options.extraExecOption || {}) };
    return spawn(args[0], args.slice(1), spawnOption);
}

/**
 * The Minecraft process watcher. You can inspect Minecraft launch state by this.
 *
 * Generally, there are several cases after you call `launch` and get `ChildProcess` object
 *
 * 1. child process fire an error, no real process start.
 * 2. child process started, but game crash (code is not 0).
 * 3. cihld process started, game normally exit (code is 0).
 */
export interface MinecraftProcessWatcher extends EventEmitter {
    /**
     * Fire when the process DOESN'T start at all, like "java not found".
     *
     * The minecraft-kill or minecraft-exit will NOT fire after this fired.
     */
    on(event: "error", listener: (error: any) => void): this;
    /**
     * Fire after Minecraft process exit.
     */
    on(event: "minecraft-exit", listener: (event: {
        /**
         * The code of the process exit. This is the nodejs child process "exit" event arg.
         */
        code: number;
        /**
         * The signal of the process exit. This is the nodejs child process "exit" event arg.
         */
        signal: string;
        /**
         * The crash report content
         */
        crashReport: string;
        /**
         * The location of the crash report
         */
        crashReportLocation: string;
    }) => void): this;
    /**
     * Fire around the time when Minecraft window appeared in screen.
     *
     * Since the Minecraft window will take time to init, this event fire when it capture some keywords from stdout.
     */
    on(event: "minecraft-window-ready", listener: () => void): this;
}

/**
 * Create a process watcher for a minecraft process.
 *
 * It will watch the stdout and the error event of the process to detect error and minecraft state.
 * @param process The Minecraft process
 * @param emitter The event emitter which will emit usefule event
 */
export function createMinecraftProcessWatcher(process: ChildProcess, emitter: EventEmitter = new EventEmitter()): MinecraftProcessWatcher {
    let crashReport = "";
    let crashReportLocation = "";
    let waitForReady = true;
    process.on("error", (e) => {
        emitter.emit("error", e);
    });
    process.on("exit", (code, signal) => {
        if (code !== 0 && (crashReport || crashReportLocation)) {
            emitter.emit("minecraft-exit", {
                code,
                signal,
                crashReport,
                crashReportLocation,
            });
        } else {
            emitter.emit("minecraft-exit", { code, signal });
        }
    });
    process.stdout?.on("data", (s) => {
        const string = s.toString();
        if (string.indexOf("---- Minecraft Crash Report ----") !== -1) {
            crashReport = string;
        } else if (string.indexOf("Crash report saved to:") !== -1) {
            crashReportLocation = string.substring(string.indexOf("Crash report saved to:") + "Crash report saved to: #@!@# ".length);
        } else if (waitForReady && string.indexOf("Reloading ResourceManager") !== -1 || string.indexOf("LWJGL Version: ") !== -1 || string.indexOf("OpenAL initialized.") !== -1) {
            waitForReady = false;
            emitter.emit("minecraft-window-ready");
        }
    });
    return emitter;
}

/**
 * Launch the minecraft as a child process. This function use spawn to create child process. To use an alternative way, see function generateArguments.
 *
 * By default, it will use the `LauncherPrecheck.Default` to pre-check:
 * - It will also check if the runtime libs are completed, and will extract native libs if needed.
 * - It might throw exception when the version jar is missing/checksum not matched.
 * - It might throw if the libraries/natives are missing.
 *
 * If you DON'T want such precheck, and you want to change it. You can assign the `prechecks` property in launch
 *
 * ```ts
 * launch({ ...otherOptions, prechecks: yourPrechecks });
 * ```
 *
 * @param options The detail options for this launching.
 * @see [ChildProcess](https://nodejs.org/api/child_process.html)
 * @see [spawn](https://nodejs.org/api/spawn.html)
 * @see {@link generateArguments}
 * @see {@link createMinecraftProcessWatcher}
 */
export async function launch(options: LaunchOption): Promise<ChildProcess> {
    const gamePath = !isAbsolute(options.gamePath) ? resolve(options.gamePath) : options.gamePath;
    const resourcePath = options.resourcePath || gamePath;
    const version = typeof options.version === "string" ? await Version.parse(resourcePath, options.version) : options.version;

    let args = await generateArguments({ ...options, version, gamePath, resourcePath });

    const minecraftFolder = MinecraftFolder.from(resourcePath);
    const prechecks: LaunchPrecheck[] = options.prechecks || LaunchPrecheck.Default;
    await Promise.all(prechecks.map((f) => f(minecraftFolder, version, options)));
    const spawnOption = { cwd: options.gamePath, ...(options.extraExecOption || {}) };

    if (options.extraExecOption?.shell) {
        args = args.map((a) => `"${a}"`);
    }
    // fix the ENOTFOUND if cwd does not existed.
    if (!existsSync(gamePath)) {
        await mkdir(gamePath);
    }

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
        mc.getVersionJar(resolvedVersion.minecraftVersion, "server"),
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
 * @throws TypeError if options does not fully fulfill the requirement
 */
export async function generateArguments(options: LaunchOption) {
    if (!options.version) { throw new TypeError("Version cannot be null!"); }
    if (!options.isDemo) { options.isDemo = false; }

    const currentPlatform = options.platform ?? getPlatform();
    const gamePath = !isAbsolute(options.gamePath) ? resolve(options.gamePath) : options.gamePath;
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
        const indexContent = await readFile(index, { encoding: "utf-8" }).then((b) => JSON.parse(b.toString()));
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
        cmd.push("-Dauthlibinjector.side=client");
        if (options.yggdrasilAgent.prefetched) {
            cmd.push(`-Dauthlibinjector.yggdrasil.prefetched=${options.yggdrasilAgent.prefetched}`);
        }
    }

    const jvmOptions = {
        natives_directory: nativeRoot,
        launcher_name: launcherName,
        launcher_version: launcherBrand,
        classpath: `${[
            ...version.libraries.filter((lib) => !(lib instanceof ResolvedNative)).map((lib) => mc.getLibraryByPath(lib.download.path)),
            mc.getVersionJar(version.minecraftVersion)
        ].join(delimiter)}`,
        ...featureValues,
    };

    cmd.push(...jvmArguments.map((arg) => format(arg, jvmOptions)));

    // add extra jvm args
    if (options.extraJVMArgs instanceof Array) {
        if (options.extraJVMArgs.some((v) => typeof v !== "string")) {
            throw new TypeError("Require extraJVMArgs be all string!");
        }
        cmd.push(...options.extraJVMArgs);
    } else {
        cmd.push(...DEFAULT_EXTRA_JVM_ARGS);
    }

    cmd.push(version.mainClass);
    const assetsDir = join(resourcePath, "assets");
    const resolution = options.resolution;
    const versionName = options.versionName || version.id;
    const versionType = options.versionType || version.type;
    const mcOptions = {
        version_name: versionName,
        version_type: versionType,
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
 * Truely normalize the launch argument.
 */
function normalizeArguments(args: Version.LaunchArgument[], platform: Platform, features: EnabledFeatures): string[] {
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
