import { MinecraftFolder, MinecraftLocation, ResolvedLibrary, ResolvedVersion, Version } from "@xmcl/core";
import { ensureDir, missing, readFile, validateSha1 } from "@xmcl/core/fs";
import Task from "@xmcl/task";
import { cpus } from "os";
import { join } from "path";
import {
    downloadFileIfAbsentTask,
    getIfUpdate,
    UpdatedObject,
    Downloader,
    downloader,
} from "./downloader";

/**
 * The minecraft installer
 */
export namespace Installer {

    /**
     * The function to swap library host
     */
    export type LibraryHost = (libId: ResolvedLibrary) => string | string[] | undefined;
    /**
     * The version metadata containing the download version information, like url
     */
    export interface VersionMeta {
        id: string;
        type: string;
        time: string;
        releaseTime: string;
        url: string;
    }
    /**
     * Minecraft version metadata list
     */
    export interface VersionMetaList extends UpdatedObject {
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
        versions: VersionMeta[];
    }

    /**
     * Default minecraft version manifest url.
     */
    export const DEFAULT_VERSION_MANIFEST_URL = "https://launchermeta.mojang.com/mc/game/version_manifest.json";
    /**
     * Default resource/assets url root
     */
    export const DEFAULT_RESOURCE_ROOT_URL = "https://resources.download.minecraft.net";

    export function updateVersionMeta(): Promise<VersionMetaList | undefined>;
    export function updateVersionMeta(option: {
        remote?: string,
    }): Promise<VersionMetaList | undefined>;
    export function updateVersionMeta(option: {
        fallback?: VersionMetaList,
        remote?: string,
    }): Promise<VersionMetaList | undefined>;
    export function updateVersionMeta(option: {
        fallback: VersionMetaList,
        remote?: string,
    }): Promise<VersionMetaList>;
    /**
     * Get/refresh a version metadata.
     * This try to send http GET request to offical Minecraft metadata endpoint by default.
     * You can swap the endpoint by passing url on `remote` in option.
     */
    export function updateVersionMeta(option: {
        /**
         * fallback meta container if there is no internet
         */
        fallback?: VersionMetaList,
        /**
         * remote url of this request
         */
        remote?: string,
    } = {}): Promise<VersionMetaList | undefined> {
        return getIfUpdate(option.remote || DEFAULT_VERSION_MANIFEST_URL, JSON.parse, option.fallback);
    }
    export interface DownloaderOption {
        /**
         * An external downloader. If this is assigned, the returned task won't be able to track progress.
         *
         * You should track the download progress by you self.
         */
        downloader?: Downloader;
    }
    /**
     * Change the library host url
     */
    export interface LibraryOption extends DownloaderOption {
        libraryHost?: LibraryHost;
    }
    /**
     * Change the host url of assets download
     */
    export interface AssetsOption extends DownloaderOption {
        assetsHost?: string | string[];
    }
    /**
     * Replace the minecraft client or server jar download
     */
    export interface JarOption extends DownloaderOption {
        /**
         * The client jar url
         */
        client?: string;
        /**
         * The server jar url
         */
        server?: string;
    }
    export type Option = AssetsOption & JarOption & LibraryOption;

    /**
     * Install the Minecraft game to a location by version metadata
     *
     * @param type The type of game, client or server
     * @param versionMeta The version metadata
     * @param minecraft The Minecraft location
     * @param option
     */
    export function install(type: "server" | "client", versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: Option): Promise<ResolvedVersion> {
        return Task.execute(installTask(type, versionMeta, minecraft, option)).wait();
    }
    /**
     * Install the Minecraft game to a location by version metadata
     *
     * @param type The type of game, client or server
     * @param versionMeta The version metadata
     * @param minecraft The Minecraft location
     * @param option
     */
    export function installTask(type: "server" | "client", versionMeta: VersionMeta, minecraft: MinecraftLocation, option: Option = {}): Task<ResolvedVersion> {
        async function install(context: Task.Context) {
            const version = await context.execute(installVersionTask(type, versionMeta, minecraft, option));
            if (type === "client") {
                await context.execute(installDependenciesTask(version, option));
            } else {
                await context.execute(installLibrariesTask(version, option));
            }
            return version;
        }
        install.parameters = { version: versionMeta.id };
        return install;
    }

    /**
     * Only install the json/jar. Do not check dependencies;
     *
     * @param type client or server
     * @param versionMeta the version metadata; get from updateVersionMeta
     * @param minecraft minecraft location
     */
    export function installVersion(type: "client" | "server", versionMeta: VersionMeta, minecraft: MinecraftLocation, option: JarOption = {}): Promise<ResolvedVersion> {
        return Task.execute(installVersionTask(type, versionMeta, minecraft, option)).wait();
    }

    /**
     * Only install the json/jar. Do not check dependencies;
     *
     * @param type client or server
     * @param versionMeta the version metadata; get from updateVersionMeta
     * @param minecraft minecraft location
     */
    export function installVersionTask(type: "client" | "server", versionMeta: VersionMeta, minecraft: MinecraftLocation, option: JarOption = {}): Task<ResolvedVersion> {
        async function installVersion(context: Task.Context) {
            await context.execute(installVersionJsonTask(versionMeta, minecraft, option));
            const version = await Version.parse(minecraft, versionMeta.id);
            await context.execute(installVersionJarTask(type, version, minecraft, option));
            return version;
        }
        installVersion.parameters = { version: versionMeta.id };
        return installVersion;
    }

    /**
     * Install the completeness of the Minecraft game assets and libraries.
     *
     * @param version The resolved version produced by Version.parse
     * @param minecraft The minecraft location
     */
    export function installDependencies(version: ResolvedVersion, option?: Option): Promise<ResolvedVersion> {
        return Task.execute(installDependenciesTask(version, option)).wait();
    }
    /**
     * Install the completeness of the Minecraft game assets and libraries.
     *
     * @param version The resolved version produced by Version.parse
     * @param minecraft The minecraft location
     */
    export function installDependenciesTask(version: ResolvedVersion, option: Option = {}): Task<ResolvedVersion> {
        async function installDependencies(context: Task.Context) {
            await Promise.all([
                context.execute(installAssetsTask(version, option)),
                context.execute(installLibrariesTask(version, option)),
            ]);
            return version;
        }
        installDependencies.parameters = { version: version.id };
        return installDependencies;
    }

    /**
     * Install or check the assets to resolved version
     * @param version The target version
     * @param option The option to replace assets host url
     */
    export function installAssets(version: ResolvedVersion, option?: AssetsOption): Promise<ResolvedVersion> {
        return Task.execute(installAssetsTask(version, option)).wait();
    }
    /**
     * Install or check the assets to resolved version
     * @param version The target version
     * @param option The option to replace assets host url
     */
    export function installAssetsTask(version: ResolvedVersion, option: AssetsOption = {}): Task<ResolvedVersion> {
        async function installAssets(context: Task.Context) {
            const cores = cpus().length || 4;
            const folder = MinecraftFolder.from(version.minecraftDirectory);
            const jsonPath = folder.getPath("assets", "indexes", version.assets + ".json");

            await context.execute(function assetsJson(work) {
                const worker = option.downloader || downloader;

                return downloadFileIfAbsentTask({
                    url: version.assetIndex.url,
                    destination: jsonPath,
                    checksum: {
                        algorithm: "sha1",
                        hash: version.assetIndex.sha1,
                    },
                }, worker)(work);
            });

            interface AssetIndex {
                objects: {
                    [key: string]: {
                        hash: string,
                        size: number,
                    };
                };
            }
            const { objects } = JSON.parse(await readFile(jsonPath).then((b) => b.toString())) as AssetIndex;
            await ensureDir(folder.getPath("assets", "objects"));
            const objectArray = Object.keys(objects).map((k) => ({ name: k, ...objects[k] }));

            const totalSize = objectArray.reduce((p, v) => p + v.size, 0);
            const averageSize = totalSize / cores;

            const all = [];
            let accumSize = 0;
            let startIndex = 0;
            for (let i = 0; i < objectArray.length; ++i) {
                const obj = objectArray[i];
                accumSize += obj.size;
                if (accumSize > averageSize) {
                    all.push(context.execute(installAssetsByClusterTask(version.id, objectArray.slice(startIndex, i + 1), folder, option)));
                    startIndex = i + 1;
                    accumSize = 0;
                }
            }
            if (startIndex < objectArray.length) {
                all.push(context.execute(installAssetsByClusterTask(version.id, objectArray.slice(startIndex, objectArray.length), folder, option)));
            }
            await Promise.all(all);

            return version;
        }
        installAssets.parameters = { version: version.id };
        return installAssets;
    }

    /**
     * Install all the libraries of providing version
     * @param version The target version
     * @param option The library host swap option
     */
    export function installLibraries(version: ResolvedVersion, option: LibraryOption = {}): Promise<ResolvedVersion> {
        return Task.execute(installLibrariesTask(version, option)).wait();
    }
    /**
     * Install all the libraries of providing version
     * @param version The target version
     * @param option The library host swap option
     */
    export function installLibrariesTask<T extends Pick<ResolvedVersion, "minecraftDirectory" | "libraries">>(version: T, option: LibraryOption = {}): Task<T> {
        async function installLibraries(context: Task.Context) {
            const folder = MinecraftFolder.from(version.minecraftDirectory);
            try {
                const promises = version.libraries.map((lib) =>
                    context.execute(installLibraryTask(lib, folder, option)).catch((e) => {
                        console.error(`Error occured during downloading lib: ${lib.name}`);
                        console.error(e);
                        throw e;
                    }));
                await Promise.all(promises);
            } catch (e) {
                console.error("Fail to download libraries.");
                throw e;
            }
            return version;
        }
        installLibraries.parameters = { version: Reflect.get(version, "id") || "" };
        return installLibraries;
    }

    /**
     * Only install several resolved libraries
     * @param libraries The resolved libraries
     * @param minecraft The minecraft location
     * @param option The install option
     */
    export function installLibrariesDirect(libraries: ResolvedLibrary[], minecraft: MinecraftLocation, option?: LibraryOption): Promise<void> {
        return Task.execute(installLibrariesDirectTask(libraries, minecraft, option)).wait();
    }
    /**
     * Only install several resolved libraries
     * @param libraries The resolved libraries
     * @param minecraft The minecraft location
     * @param option The install option
     */
    export function installLibrariesDirectTask(libraries: ResolvedLibrary[], minecraft: MinecraftLocation, option?: LibraryOption): Task<void> {
        return new Proxy(installLibrariesTask({ libraries, minecraftDirectory: typeof minecraft === "string" ? minecraft : minecraft.root }, option), {
            apply(target, thisArgs, args) {
                return (target(args[0]) as Promise<any>).then(() => undefined);
            },
        }) as any;
    }

    /**
     * Diagnose the version. It will check the version json/jar, libraries and assets.
     *
     * @param version The version id string
     * @param minecraft The minecraft location
     */
    export function diagnose(version: string, minecraft: MinecraftLocation): Promise<VersionDiagnosis> {
        return Task.execute(diagnoseTask(version, minecraft)).wait();
    }

    /**
     * Diagnose the version. It will check the version json/jar, libraries and assets.
     *
     * @param version The version id string
     * @param minecraft The minecraft location
     */
    export function diagnoseTask(version: string, minecraftLocation: MinecraftLocation): Task<VersionDiagnosis> {
        async function getStatus(file: string, sha1?: string) {
            if (await missing(file)) {
                return VersionDiagnoseStatus.Missing;
            }
            if (sha1 && (!await validateSha1(file, sha1))) {
                return VersionDiagnoseStatus.Corrupted;
            }
            return VersionDiagnoseStatus.Good;
        }
        const minecraft = MinecraftFolder.from(minecraftLocation);
        return async function diagnose(context: Task.Context) {
            let resolvedVersion: ResolvedVersion;
            try {
                resolvedVersion = await context.execute(function checkVersionJson() { return Version.parse(minecraft, version) });
            } catch (e) {
                console.error(e);
                return {
                    minecraftLocation: minecraft,
                    version,

                    versionJson: { value: e.version, status: VersionDiagnoseStatus.Unknown },

                    versionJar: VersionDiagnoseStatus.Unknown,
                    assetsIndex: VersionDiagnoseStatus.Unknown,

                    libraries: [],
                    assets: [],
                } as VersionDiagnosis;
            }
            const jarPath = minecraft.getVersionJar(resolvedVersion.client);
            const assetsIndexPath = minecraft.getAssetsIndex(resolvedVersion.assets);

            const missingJar = await context.execute(function checkJar() {
                return getStatus(jarPath, resolvedVersion.downloads.client.sha1);
            });
            const assetsIndex = await context.execute(async function checkAssetIndex() {
                return getStatus(assetsIndexPath, resolvedVersion.assetIndex.sha1);
            });
            const libMask = await context.execute(function checkLibraries() {
                return Promise.all(resolvedVersion.libraries.map(async (lib) => {
                    const libPath = minecraft.getLibraryByPath(lib.download.path);
                    return getStatus(libPath, lib.download.sha1);
                }));
            });
            const libraries = resolvedVersion.libraries.map((l, i) => ({ value: l, status: libMask[i] }))
                .filter((v) => v.status !== VersionDiagnoseStatus.Good);
            // const assets: { [object: string]: string } = {};

            let assets: any[] = [];
            if (assetsIndex === VersionDiagnoseStatus.Good) {
                const objects = (await readFile(assetsIndexPath, "utf-8").then((b) => JSON.parse(b.toString()))).objects;
                const files = Object.keys(objects);
                const assetsMask = await context.execute(function checkAssets() {
                    return Promise.all(files.map(async (object) => {
                        const { hash } = objects[object];
                        const hashPath = minecraft.getAsset(hash);
                        return getStatus(hashPath, hash);
                    }));
                });
                assets = files.map((path, i) => ({
                    value: { file: path, hash: objects[path] },
                    status: assetsMask[i]
                })).filter((v) => v.status !== VersionDiagnoseStatus.Good);
            }

            return {
                minecraftLocation: minecraft,
                version,

                versionJson: { value: "", status: VersionDiagnoseStatus.Good },
                versionJar: missingJar,
                assetsIndex,

                libraries,
                assets,
            } as VersionDiagnosis;
        };
    }
}

export enum VersionDiagnoseStatus {
    /**
     * File is missing
     */
    Missing = "missing",
    /**
     * File checksum not match
     */
    Corrupted = "corrupted",
    /**
     * Not checked
     */
    Unknown = "unknown",
    /**
     * File is good
     */
    Good = "",
}

export interface VersionDiagnoseItem<T> {
    status: VersionDiagnoseStatus;
    value: T;
}

/**
 * General diagnosis of the version.
 * The missing diagnosis means either the file not existed, or the file not valid (checksum not matched)
 */
export interface VersionDiagnosis {
    minecraftLocation: MinecraftFolder;
    version: string;

    versionJson: VersionDiagnoseItem<string>;
    versionJar: VersionDiagnoseStatus;
    assetsIndex: VersionDiagnoseStatus;
    libraries: VersionDiagnoseItem<ResolvedLibrary>[];
    assets: VersionDiagnoseItem<{ file: string; hash: string }>[];
}

function installVersionJsonTask(version: Installer.VersionMeta, minecraft: MinecraftLocation, option: Installer.Option) {
    return async function jar(context: Task.Context) {
        const folder = MinecraftFolder.from(minecraft);
        await ensureDir(folder.getVersionRoot(version.id));

        const destination = folder.getVersionJson(version.id);
        const url = version.url;
        const expectSha1 = version.url.split("/")[5];
        const worker = option.downloader || downloader;

        await downloadFileIfAbsentTask({
            url,
            checksum: { algorithm: "sha1", hash: expectSha1 },
            destination: destination,
        }, worker)(context);
    };
}

function installVersionJarTask(type: "client" | "server", version: ResolvedVersion, minecraft: MinecraftLocation, option: Installer.Option) {
    return async function json(context: Task.Context) {
        const folder = MinecraftFolder.from(minecraft);
        await ensureDir(folder.getVersionRoot(version.id));

        const destination = join(folder.getVersionRoot(version.id),
            type === "client" ? version.id + ".jar" : version.id + "-" + type + ".jar");
        const url = option[type] || version.downloads[type].url;
        const expectSha1 = version.downloads[type].sha1;
        const worker = option.downloader || downloader;

        await downloadFileIfAbsentTask({
            url,
            checksum: { algorithm: "sha1", hash: expectSha1 },
            destination: destination,
        }, worker)(context);
        return version;
    };
}

function installLibraryTask(lib: ResolvedLibrary, folder: MinecraftFolder, option: Installer.Option) {
    async function library(context: Task.Context) {
        const fallbackMavens = ["http://central.maven.org/maven2/"];

        context.update(0, -1, lib.name);

        const libraryPath = lib.download.path;
        const filePath = join(folder.libraries, libraryPath);
        const worker = option.downloader || downloader;

        const urls: string[] = [lib.download.url, ...fallbackMavens.map((m) => `${m}${lib.download.path}`)];
        // user defined alternative host to download
        const extra = option.libraryHost?.(lib);
        if (extra) {
            urls.unshift(...(typeof extra === "string" ? [extra] : extra));
        }

        const checksum = lib.download.sha1 === "" ? undefined : {
            algorithm: "sha1",
            hash: lib.download.sha1,
        }

        await downloadFileIfAbsentTask({
            url: urls,
            checksum,
            destination: filePath,
        }, worker)(context);
    }
    library.parameter = { lib: lib.name };
    return library;
}

function installAssetsByClusterTask(version: string, objects: Array<{ name: string, hash: string, size: number }>, folder: MinecraftFolder, option: Installer.AssetsOption) {
    async function assets(context: Task.Context) {
        const totalSize = objects.map((c) => c.size).reduce((a, b) => a + b, 0);
        context.update(0, totalSize);
        const assetsHosts = [...(option.assetsHost || []), Installer.DEFAULT_RESOURCE_ROOT_URL];
        const worker = option.downloader || downloader;
        let lastProgress = 0;

        for (const o of objects) {
            const { hash, size, name } = o;

            const head = hash.substring(0, 2);
            const dir = folder.getPath("assets", "objects", head);
            const file = join(dir, hash);
            const urls = assetsHosts.map((h) => `${h}/${head}/${hash}`);

            await ensureDir(dir);

            context.update(lastProgress, totalSize, urls[0]);
            await worker.downloadFileIfAbsent({
                url: urls,
                checksum: {
                    hash,
                    algorithm: "sha1",
                },
                destination: file,
                pausable: context.pausealbe,
                progress(p, t, m) { context.update(lastProgress + p, totalSize, m); }
            })
            context.pausealbe(undefined, undefined);

            lastProgress += size;
            context.update(lastProgress);
        }
    }
    assets.parameters = { version };
    return assets;
}