import { MinecraftFolder, MinecraftLocation, ResolvedLibrary, ResolvedVersion, Version as VersionJson } from "@xmcl/core";
import { task, Task } from "@xmcl/task";
import { join } from "path";
import { DownloadCommonOptions, DownloadFallbackTask, getAndParseIfUpdate, joinUrl, Timestamped, withAgents } from "./http";
import { ensureDir, normalizeArray, readFile } from "./utils";

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
        await withAgents(options, (options) => this.all(tasks, {
            throwErrorImmediately: options.throwErrorImmediately ?? false,
            getErrorMessage: () => `Errors during install Minecraft ${version.id}'s assets at ${version.minecraftDirectory}`
        }));

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
        const tasks = version.libraries.map((lib) => new InstallLibraryTask(lib, folder, options));
        await withAgents(options, (options) => this.all(tasks, {
            throwErrorImmediately: options.throwErrorImmediately ?? false,
            getErrorMessage: () => `Errors during install libraries at ${version.minecraftDirectory}`
        }));
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
        // const sizes = assets.map((a) => a.size).map((a, b) => a + b, 0);

        await withAgents(options, (options) => this.all(tasks, {
            throwErrorImmediately: options.throwErrorImmediately ?? false,
            getErrorMessage: () => `Errors during install assets at ${folder.root}`,
        }));
    });
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
