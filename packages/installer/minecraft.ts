import { LibraryInfo, MinecraftFolder, MinecraftLocation, ResolvedLibrary, ResolvedVersion, Version as VersionJson } from "@xmcl/core";
import { CancelledError, task, Task, TaskLooped } from "@xmcl/task";
import { open, readEntry, walkEntriesGenerator } from "@xmcl/unzip";
import { delimiter, join } from "path";
import { ZipFile } from "yauzl";
import { DownloadCommonOptions, DownloadFallbackTask, getAndParseIfUpdate, joinUrl, Timestamped, withAgents } from "./http";
import { all, checksum, ensureDir, errorFrom, normalizeArray, readFile, spawnProcess } from "./utils";

/**
 * The function to swap library host.
 */
export type LibraryHost = (library: ResolvedLibrary) => string | string[] | undefined;

export interface MinecraftVersionBaseInfo {
    /**
     * The version id, like 1.14.4
     */
    id: string;
    /**
     * The version json download url
     */
    url: string;
}

/**
 * The version metadata containing the version information, like download url
 */
export interface MinecraftVersion extends MinecraftVersionBaseInfo {
    /**
     * The version id, like 1.14.4
     */
    id: string;
    type: string;
    time: string;
    releaseTime: string;
    /**
     * The version json download url
     */
    url: string;
}

export interface AssetInfo {
    name: string;
    hash: string;
    size: number;
}

/**
 * Minecraft version metadata list
 */
export interface MinecraftVersionList extends Timestamped {
    latest: {
        /**
         * Snapshot version id of the Minecraft
         */
        snapshot: string
        /**
         * Release version id of the Minecraft, like 1.14.2
         */
        release: string,
    };
    /**
     * All the vesrsion list
     */
    versions: MinecraftVersion[];
}

export interface InstallProfile {
    spec?: number;
    /**
     * The type of this installation, like "forge"
     */
    profile: string;
    /**
     * The version of this installation
     */
    version: string;
    /**
     * The version json path
     */
    json: string;
    /**
     * The maven artifact name: <org>:<artifact-id>:<version>
     */
    path: string;
    /**
     * The minecraft version
     */
    minecraft: string;
    /**
     * The processor shared variables. The key is the name of variable to replace.
     *
     * The value of client/server is the value of the variable.
     */
    data: { [key: string]: { client: string; server: string; }; };
    /**
     * The post processor. Which require java to run.
     */
    processors: Array<{
        /**
         * The executable jar path
         */
        jar: string;
        /**
         * The classpath to run
         */
        classpath: string[];
        args: string[];
        outputs?: { [key: string]: string; };
    }>;
    /**
     * The required install profile libraries
     */
    libraries: VersionJson.NormalLibrary[];
    /**
     * Legacy format
     */
    versionInfo?: VersionJson;
}

/**
 * Default minecraft version manifest url.
 */
export const DEFAULT_VERSION_MANIFEST_URL = "https://launchermeta.mojang.com/mc/game/version_manifest.json";
/**
 * Default resource/assets url root
 */
export const DEFAULT_RESOURCE_ROOT_URL = "https://resources.download.minecraft.net";

/**
 * Get and update the version list.
 * This try to send http GET request to offical Minecraft metadata endpoint by default.
 * You can swap the endpoint by passing url on `remote` in option.
 *
 * @returns The new list if there is
 */
export function getVersionList(option: {
    /**
     * If this presents, it will send request with the original list timestamp.
     *
     * If the server believes there is no modification after the original one,
     * it will directly return the orignal one.
     */
    original?: MinecraftVersionList,
    /**
     * remote url of this request
     */
    remote?: string,
} = {}): Promise<MinecraftVersionList> {
    return getAndParseIfUpdate(option.remote || DEFAULT_VERSION_MANIFEST_URL, JSON.parse, option.original);
}

/**
 * Change the library host url
 */
export interface LibraryOptions extends DownloadCommonOptions {
    /**
     * A more flexiable way to control library download url.
     * @see mavenHost
     */
    libraryHost?: LibraryHost;
    /**
     * The alterative maven host to download library. It will try to use these host from the `[0]` to the `[maven.length - 1]`
     */
    mavenHost?: string | string[];
    /**
     * Control how many libraries download task should run at the same time.
     * It will override the `maxConcurrencyOption` if this is presented.
     *
     * This will be ignored if you have your own downloader assigned.
     */
    librariesDownloadConcurrency?: number;
}
/**
 * Change the host url of assets download
 */
export interface AssetsOptions extends DownloadCommonOptions {
    /**
     * The alternative assets host to download asset. It will try to use these host from the `[0]` to the `[assetsHost.length - 1]`
     */
    assetsHost?: string | string[];
    /**
     * Control how many assets download task should run at the same time.
     * It will override the `maxConcurrencyOption` if this is presented.
     *
     * This will be ignored if you have your own downloader assigned.
     */
    assetsDownloadConcurrency?: number;

    /**
     * The assets index download or url replacement
     */
    assetsIndexUrl?: string | string[] | ((version: ResolvedVersion) => string | string[]);
}

export type InstallLibraryVersion = Pick<ResolvedVersion, "libraries" | "minecraftDirectory">;

function resolveDownloadUrls<T>(original: string, version: T, option?: string | string[] | ((version: T) => string | string[])) {
    let result = [original];
    if (typeof option === "function") {
        result.unshift(...normalizeArray(option(version)));
    } else {
        result.unshift(...normalizeArray(option));
    }
    return result;
}
/**
 * Replace the minecraft client or server jar download
 */
export interface JarOption extends DownloadCommonOptions {
    /**
     * The version json url replacement
     */
    json?: string | string[] | ((version: MinecraftVersionBaseInfo) => string | string[]);
    /**
     * The client jar url replacement
     */
    client?: string | string[] | ((version: ResolvedVersion) => string | string[]);
    /**
     * The server jar url replacement
     */
    server?: string | string[] | ((version: ResolvedVersion) => string | string[]);
}

export interface InstallSideOption {
    /**
     * The installation side
     */
    side?: "client" | "server";
}

export interface InstallProfileOption extends LibraryOptions, InstallSideOption {
    /**
     * New forge (>=1.13) require java to install. Can be a executor or java executable path.
     */
    java?: string;
}


export type Options = DownloadCommonOptions & AssetsOptions & JarOption & LibraryOptions & InstallSideOption;

export interface PostProcessFailedError {
    error: "PostProcessFailed";
    jar: string;
    commands: string[];
}
export interface PostProcessNoMainClassError {
    error: "PostProcessNoMainClass";
    jarPath: string;
}
export interface PostProcessBadJarError {
    error: "PostProcessBadJar";
    jarPath: string;
    causeBy: Error;
}

export type PostProcessError = PostProcessBadJarError | PostProcessFailedError | PostProcessNoMainClassError;

/**
 * Install the Minecraft game to a location by version metadata.
 *
 * This will install version json, version jar, and all dependencies (assets, libraries)
 *
 * @param versionMeta The version metadata
 * @param minecraft The Minecraft location
 * @param option
 */
export async function install(versionMeta: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, option: Options = {}): Promise<ResolvedVersion> {
    return installTask(versionMeta, minecraft, option).startAndWait();
}

/**
 * Only install the json/jar. Do not install dependencies.
 *
 * @param versionMeta the version metadata; get from updateVersionMeta
 * @param minecraft minecraft location
 */
export function installVersion(versionMeta: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, options: JarOption = {}): Promise<ResolvedVersion> {
    return installVersionTask(versionMeta, minecraft, options).startAndWait();
}

/**
 * Install the completeness of the Minecraft game assets and libraries on a existed version.
 *
 * @param version The resolved version produced by Version.parse
 * @param minecraft The minecraft location
 */
export function installDependencies(version: ResolvedVersion, options?: Options): Promise<ResolvedVersion> {
    return installDependenciesTask(version, options).startAndWait();
}

/**
 * Install or check the assets to resolved version
 *
 * @param version The target version
 * @param options The option to replace assets host url
 */
export function installAssets(version: ResolvedVersion, options: AssetsOptions = {}): Promise<ResolvedVersion> {
    return installAssetsTask(version, options).startAndWait();
}

/**
 * Install all the libraries of providing version
 * @param version The target version
 * @param options The library host swap option
 */
export function installLibraries(version: ResolvedVersion, options: LibraryOptions = {}): Promise<void> {
    return installLibrariesTask(version, options).startAndWait();
}

/**
 * Only install several resolved libraries
 * @param libraries The resolved libraries
 * @param minecraft The minecraft location
 * @param option The install option
 */
export async function installResolvedLibraries(libraries: ResolvedLibrary[], minecraft: MinecraftLocation, option?: LibraryOptions): Promise<void> {
    await installLibrariesTask({ libraries, minecraftDirectory: typeof minecraft === "string" ? minecraft : minecraft.root }, option)
}

/**
 * Resolve processors in install profile
 */
export function resolveProcessors(side: "client" | "server", installProfile: InstallProfile, minecraft: MinecraftFolder) {
    function normalizePath(val: string) {
        if (val && val.match(/^\[.+\]$/g)) { // match sth like [net.minecraft:client:1.15.2:slim]
            let name = val.substring(1, val.length - 1);
            return minecraft.getLibraryByPath(LibraryInfo.resolve(name).path);
        }
        return val;
    }
    function normalizeVariable(val: string) {
        if (val && val.match(/^{.+}$/g)) { // match sth like {MAPPINGS}
            let key = val.substring(1, val.length - 1);
            val = variables[key][side];
        }
        return val;
    }
    // store the mapping of {VARIABLE_NAME} -> real path in disk
    let variables: Record<string, { client: string; server: string }> = {
        MINECRAFT_JAR: {
            client: minecraft.getVersionJar(installProfile.minecraft),
            server: minecraft.getVersionJar(installProfile.minecraft, "server"),
        },
    };
    for (let key in installProfile.data) {
        let { client, server } = installProfile.data[key];
        variables[key] = {
            client: normalizePath(client),
            server: normalizePath(server),
        };
    }
    let processors = installProfile.processors.map((proc) => ({
        ...proc,
        args: proc.args.map(normalizePath).map(normalizeVariable),
        outputs: proc.outputs ? Object.entries(proc.outputs).map(([k, v]) => ({ [normalizeVariable(k)]: normalizeVariable(v) }))
            .reduce((a, b) => ({ ...a, ...b }), {}) : proc.outputs,
    }));
    return processors;
}

/**
 * Post process the post processors from `InstallProfile`.
 *
 * @param processors The processor info
 * @param minecraft The minecraft location
 * @param java The java executable path
 * @throws {@link PostProcessError}
 */
export function postProcess(processors: InstallProfile["processors"], minecraft: MinecraftFolder, java: string) {
    return new PostProcessingTask(processors, minecraft, java).startAndWait();
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
    return installByProfileTask(installProfile, minecraft, options).startAndWait();
}

/**
 * Install the Minecraft game to a location by version metadata.
 *
 * This will install version json, version jar, and all dependencies (assets, libraries)
 *
 * @param type The type of game, client or server
 * @param versionMeta The version metadata
 * @param minecraft The Minecraft location
 * @param options
 */
export function installTask(versionMeta: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, options: Options = {}): Task<ResolvedVersion> {
    return task("install", async function () {
        return withAgents(options, async (options) => {
            const version = await this.yield(installVersionTask(versionMeta, minecraft, options));
            if (options.side !== "server") {
                await this.yield(installDependenciesTask(version, options));
            }
            return version;
        });
    });
}
/**
 * Only install the json/jar. Do not install dependencies.
 *
 * @param type client or server
 * @param versionMeta the version metadata; get from updateVersionMeta
 * @param minecraft minecraft location
 */
export function installVersionTask(versionMeta: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, options: JarOption = {}): Task<ResolvedVersion> {
    return task("version", async function () {
        return withAgents(options, async (options) => {
            await this.yield(new InstallJsonTask(versionMeta, minecraft, options));
            const version = await VersionJson.parse(minecraft, versionMeta.id);
            await this.yield(new InstallJarTask(version, minecraft, options));
            return version;
        });
    }, versionMeta);
}

/**
 * Install the completeness of the Minecraft game assets and libraries on a existed version.
 *
 * @param version The resolved version produced by Version.parse
 * @param minecraft The minecraft location
 */
export function installDependenciesTask(version: ResolvedVersion, options: Options = {}): Task<ResolvedVersion> {
    return task("dependencies", async function () {
        await withAgents(options, (options) => Promise.all([
            this.yield(installAssetsTask(version, options)),
            this.yield(installLibrariesTask(version, options)),
        ]));
        return version;
    });
}

/**
 * Install or check the assets to resolved version
 *
 * @param version The target version
 * @param options The option to replace assets host url
 */
export function installAssetsTask(version: ResolvedVersion, options: AssetsOptions = {}): Task<ResolvedVersion> {
    return task("assets", async function () {
        const folder = MinecraftFolder.from(version.minecraftDirectory);
        const jsonPath = folder.getPath("assets", "indexes", version.assets + ".json");

        await this.yield(new InstallAssetIndexTask(version, options));

        await ensureDir(folder.getPath("assets", "objects"));
        interface AssetIndex {
            objects: {
                [key: string]: {
                    hash: string;
                    size: number;
                };
            };
        }

        const { objects } = JSON.parse(await readFile(jsonPath).then((b) => b.toString())) as AssetIndex;
        const objectArray = Object.keys(objects).map((k) => ({ name: k, ...objects[k] }));
        const tasks = objectArray.map((o) => new InstallAssetTask(o, folder, options));
        // let sizes = objectArray.map((a) => a.size).map((a, b) => a + b, 0);
        await withAgents(options, (options) => all(tasks.map((t) => this.yield(t)), options.throwErrorImmediately ?? false, () => `Errors during install Minecraft ${version.id}'s assets at ${version.minecraftDirectory}`));
        return version;
    });
}

/**
 * Install all the libraries of providing version
 * @param version The target version
 * @param options The library host swap option
 */
export function installLibrariesTask(version: InstallLibraryVersion, options: LibraryOptions = {}): Task<void> {
    return task("libraries", async function () {
        const folder = MinecraftFolder.from(version.minecraftDirectory);
        await withAgents(options, (options) => all(version.libraries.map((lib) => this.yield(new InstallLibraryTask(lib, folder, options))), options.throwErrorImmediately ?? false));
    });
}

/**
 * Only install several resolved libraries
 * @param libraries The resolved libraries
 * @param minecraft The minecraft location
 * @param option The install option
 */
export function installResolvedLibrariesTask(libraries: ResolvedLibrary[], minecraft: MinecraftLocation, option?: LibraryOptions) {
    return installLibrariesTask({ libraries, minecraftDirectory: typeof minecraft === "string" ? minecraft : minecraft.root }, option);
}

/**
 * Only install several resolved assets.
 * @param assets The assets to install
 * @param folder The minecraft folder
 * @param options The asset option
 */
export function installResolvedAssetsTask(assets: AssetInfo[], folder: MinecraftFolder, options: AssetsOptions = {}) {
    return task("assets", async function () {
        await ensureDir(folder.getPath("assets", "objects"));

        const tasks = assets.map((o) => new InstallAssetTask(o, folder, options));
        const sizes = assets.map((a) => a.size).map((a, b) => a + b, 0);

        await withAgents(options, (options) => all(tasks.map((t) => this.yield(t)), options.throwErrorImmediately ?? false, () => `Errors during install assets at ${folder.root}`));
    });
}

/**
 * Install by install profile. The install profile usually contains some preprocess should run before installing dependencies.
 *
 * @param installProfile The install profile
 * @param minecraft The minecraft location
 * @param options The options to install
 */
export function installByProfileTask(installProfile: InstallProfile, minecraft: MinecraftLocation, options: InstallProfileOption = {}) {
    return task("installByProfile", async function () {
        const minecraftFolder = MinecraftFolder.from(minecraft);
        const java = options.java || "java";

        const processor = resolveProcessors(options.side || "client", installProfile, minecraftFolder);

        const versionJson: VersionJson = await readFile(minecraftFolder.getVersionJson(installProfile.version)).then((b) => b.toString()).then(JSON.parse);
        const libraries = VersionJson.resolveLibraries([...installProfile.libraries, ...versionJson.libraries]);

        await this.yield(installResolvedLibrariesTask(libraries, minecraft, options));
        await this.yield(new PostProcessingTask(processor, minecraftFolder, java));
    });
}

/**
 * Post process the post processors from `InstallProfile`.
 *
 * @param processors The processor info
 * @param minecraft The minecraft location
 * @param java The java executable path
 * @throws {@link PostProcessError}
 */
export class PostProcessingTask extends TaskLooped<void> {
    readonly name: string = "postProcessing";
    readonly param: object;

    private pointer: number = 0;

    constructor(private processors: InstallProfile["processors"], private minecraft: MinecraftFolder, private java: string) {
        super();
        this.param = processors
        this._total = processors.length;
    }

    protected async shouldProcess(proc: InstallProfile["processors"][number], shouldProcessDefault: boolean) {
        let shouldProcess = false;
        if (proc.outputs) {
            for (const file in proc.outputs) {
                let sha1 = await checksum(file, "sha1").catch((e) => "");
                let expected = proc.outputs[file].replace(/'/g, "");
                if (expected !== sha1) {
                    shouldProcess = true;
                    break;
                }
            }
        } else {
            shouldProcess = shouldProcessDefault;
        }
        return shouldProcess;
    }

    protected async findMainClass(lib: string) {
        let zip: ZipFile | undefined;
        let mainClass: string | undefined;
        try {
            zip = await open(lib, { lazyEntries: true });
            for await (const entry of walkEntriesGenerator(zip)) {
                if (entry.fileName === "META-INF/MANIFEST.MF") {
                    const content = await readEntry(zip, entry).then((b) => b.toString());
                    mainClass = content.split("\n")
                        .map((l) => l.split(": "))
                        .find((arr) => arr[0] === "Main-Class")?.[1].trim();
                    break;
                }
            }
        } catch (e) {
            throw errorFrom({ error: "PostProcessBadJar", jarPath: lib, causeBy: e });
        } finally {
            zip?.close();
        }
        if (!mainClass) {
            throw errorFrom({ error: "PostProcessNoMainClass", jarPath: lib })
        }
        return mainClass;
    }

    protected async postProcess(mc: MinecraftFolder, proc: InstallProfile["processors"][number], java: string) {
        let jarRealPath = mc.getLibraryByPath(LibraryInfo.resolve(proc.jar).path);
        let mainClass = await this.findMainClass(jarRealPath);
        let cp = [...proc.classpath, proc.jar].map(LibraryInfo.resolve).map((p) => mc.getLibraryByPath(p.path)).join(delimiter);
        let cmd = ["-cp", cp, mainClass, ...proc.args];
        try {
            await spawnProcess(java, cmd);
        } catch (e) {
            if (typeof e === "string") {
                throw errorFrom({ error: "PostProcessFailed", jar: proc.jar, commands: [java, ...cmd] }, e);
            }
            throw e;
        }
    }

    protected async process(): Promise<[boolean, void | undefined]> {
        for (this.pointer = 0; this.pointer < this.processors.length; this.pointer++) {
            const proc = this.processors[this.pointer];
            if (this.shouldProcess(proc, true)) {
                await this.postProcess(this.minecraft, proc, this.java);
            }
            if (this.isCancelled) {
                throw new CancelledError(undefined);
            }
            if (this.isPaused) {
                return [false, undefined];
            }
            this._progress = this.pointer;
            this.update(1);
        }
        return [true, undefined];
    }
    protected async validate(): Promise<void> {
        const result = await Promise.all(this.processors.map((p) => this.shouldProcess(p, false)));
        if (result.some((r) => r)) {
            throw new Error("Invalid");
        }
        return Promise.resolve();
    }
    protected shouldTolerant(e: any): boolean {
        return e.message === "Invalid";
    }
    protected async abort(isCancelled: boolean): Promise<void> {
    }
    protected reset(): void {
        this.pointer = 0;
    }
}

export class InstallJsonTask extends DownloadFallbackTask {
    constructor(version: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, options: Options) {
        const folder = MinecraftFolder.from(minecraft);
        const destination = folder.getVersionJson(version.id);
        const expectSha1 = version.url.split("/")[5];
        const urls = resolveDownloadUrls(version.url, version, options.json);

        super({
            overwriteWhen: options.overwriteWhen,
            agents: options.agents,
            headers: options.headers,
            segmentThreshold: options.segmentThreshold,
            urls,
            checksum: expectSha1 ? { algorithm: "sha1", hash: expectSha1 } : undefined,
            destination,
        });

        this.name = "json";
        this.param = version;
    }
}

export class InstallJarTask extends DownloadFallbackTask {

    constructor(version: ResolvedVersion, minecraft: MinecraftLocation, options: Options) {
        const folder = MinecraftFolder.from(minecraft);
        const type = options.side ?? "client";
        const destination = join(folder.getVersionRoot(version.id),
            type === "client" ? version.id + ".jar" : version.id + "-" + type + ".jar");
        const urls = resolveDownloadUrls(version.downloads[type].url, version, options[type]);
        const expectSha1 = version.downloads[type].sha1;

        super({
            overwriteWhen: options.overwriteWhen,
            agents: options.agents,
            headers: options.headers,
            segmentThreshold: options.segmentThreshold,
            urls,
            checksum: { algorithm: "sha1", hash: expectSha1 },
            destination,
        });

        this.name = "jar";
        this.param = version;
    }
}

export class InstallAssetIndexTask extends DownloadFallbackTask {
    constructor(version: ResolvedVersion, options: AssetsOptions = {}) {
        const folder = MinecraftFolder.from(version.minecraftDirectory);
        const jsonPath = folder.getPath("assets", "indexes", version.assets + ".json");

        super({
            urls: resolveDownloadUrls(version.assetIndex.url, version, options.assetsIndexUrl),
            destination: jsonPath,
            checksum: {
                algorithm: "sha1",
                hash: version.assetIndex.sha1,
            },
            overwriteWhen: options.overwriteWhen,
            agents: options.agents,
            headers: options.headers,
            segmentThreshold: options.segmentThreshold,
        });

        this.name = "assetIndex";
        this.param = version;
    }
}

export class InstallLibraryTask extends DownloadFallbackTask {
    constructor(lib: ResolvedLibrary, folder: MinecraftFolder, options: LibraryOptions) {
        const libraryPath = lib.download.path;
        const destination = join(folder.libraries, libraryPath);
        const urls: string[] = resolveLibraryDownloadUrls(lib, options);
        const checksum = lib.download.sha1 === "" ? undefined : {
            algorithm: "sha1",
            hash: lib.download.sha1,
        }

        super({
            urls,
            checksum,
            destination,
            overwriteWhen: options.overwriteWhen,
            agents: options.agents,
            headers: options.headers,
            segmentThreshold: options.segmentThreshold,
        });

        this.name = "library";
        this.param = lib;
    }
}

export class InstallAssetTask extends DownloadFallbackTask {
    constructor(asset: AssetInfo, folder: MinecraftFolder, options: AssetsOptions) {
        const assetsHosts = [
            ...normalizeArray(options.assetsHost),
            DEFAULT_RESOURCE_ROOT_URL,
        ];

        const { hash, size, name } = asset;

        const head = hash.substring(0, 2);
        const dir = folder.getPath("assets", "objects", head);
        const file = join(dir, hash);
        const urls = assetsHosts.map((h) => `${h}/${head}/${hash}`);

        super({
            overwriteWhen: options.overwriteWhen,
            agents: options.agents,
            headers: options.headers,
            segmentThreshold: options.segmentThreshold,
            urls,
            checksum: {
                hash,
                algorithm: "sha1",
            },
            destination: file,
        })

        this._total = size;
        this.name = "asset";
        this.param = asset;
    }
}

const DEFAULT_MAVENS = ["https://repo1.maven.org/maven2/"];

/**
 * Resolve a library download urls with fallback.
 *
 * @param library The resolved library
 * @param libraryOptions The library install options
 */
export function resolveLibraryDownloadUrls(library: ResolvedLibrary, libraryOptions: LibraryOptions): string[] {
    const libraryHosts = libraryOptions.libraryHost?.(library) ?? [];

    return [
        // user defined alternative host to download
        ...normalizeArray(libraryHosts),
        ...normalizeArray(libraryOptions.mavenHost).map((m) => joinUrl(m, library.download.path)),
        library.download.url,
        ...DEFAULT_MAVENS.map((m) => joinUrl(m, library.download.path)),
    ];
}
