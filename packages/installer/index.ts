import { downloadFile, downloadFileIfAbsentWork, downloadFileWork, fetchBuffer, getIfUpdate, UpdatedObject } from "@xmcl/net";
import Task from "@xmcl/task";
import { MinecraftFolder, MinecraftLocation, vfs } from "@xmcl/util";
import { ResolvedLibrary, ResolvedVersion, Version } from "@xmcl/version";
import * as os from "os";
import * as path from "path";
import { decompressXZ, unpack200 } from "./decompress";


export namespace Installer {
    export type LibraryHost = (libId: ResolvedLibrary) => string | undefined;
    export interface VersionMeta {
        id: string;
        type: string;
        time: string;
        releaseTime: string;
        url: string;
    }
    interface VersionMetaList extends UpdatedObject {
        latest: {
            snapshot: string
            release: string,
        };
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
     * get/refresh a version metadata
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

    /**
     * Change the library host url
     */
    export interface LibraryOption {
        libraryHost?: LibraryHost;
    }
    /**
     * Change the host url of assets download
     */
    export interface AssetsOption {
        assetsHost?: string;
    }
    /**
     * Replace the minecraft client or server jar download
     */
    export interface JarOption {
        /**
         * The client jar url
         */
        client?: string;
        /**
         * The server jar url
         */
        server?: string;
    }
    export type Option = AssetsOption & AssetsOption & JarOption & LibraryOption;

    /**
     * Install the Minecraft game to a location by version metadata
     *
     * @param type The type of game, client or server
     * @param versionMeta The version metadata
     * @param minecraft The Minecraft location
     * @param option
     */
    export function install(type: "server" | "client", versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: Option): Promise<ResolvedVersion> {
        return installTask(type, versionMeta, minecraft, option).execute();
    }

    export function installTask(type: "server" | "client", versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: Option): Task<ResolvedVersion> {
        return Task.create({ name: "install", arguments: { version: versionMeta.id, type } }, installWork(type, versionMeta, minecraft, option));
    }

    /**
     * Only install the json/jar. Do not check dependencies;
     *
     * @param type client or server
     * @param versionMeta the version metadata; get from updateVersionMeta
     * @param minecraft minecraft location
     */
    export function installVersion(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: JarOption): Promise<ResolvedVersion> {
        return installVersionTask(type, versionMeta, minecraft, option).execute();
    }

    export function installVersionTask(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: JarOption): Task<ResolvedVersion> {
        return Task.create({ name: "installVersion", arguments: { type, version: versionMeta.id } }, installVersionWork(type as any, versionMeta, minecraft, option));
    }

    /**
     * Install the completeness of the Minecraft game assets and libraries.
     *
     * @param version The resolved version produced by Version.parse
     * @param minecraft The minecraft location
     */
    export function installDependencies(version: ResolvedVersion, option?: Option): Promise<ResolvedVersion> {
        return installDependenciesTask(version, option).execute();
    }
    export function installDependenciesTask(version: ResolvedVersion, option?: Option): Task<ResolvedVersion> {
        return Task.create({ name: "installDependencies", arguments: { version: version.id } }, installDependenciesWork(version, option));
    }

    /**
     * Install or check the assets to resolved version
     * @param version The target version
     * @param option The option to replace assets host url
     */
    export function installAssets(version: ResolvedVersion, option?: { assetsHost?: string }): Promise<ResolvedVersion> {
        return installAssetsTask(version, option).execute();
    }
    export function installAssetsTask(version: ResolvedVersion, option?: { assetsHost?: string }): Task<ResolvedVersion> {
        return Task.create({ name: "installAssets", arguments: { version: version.id } }, installAssets0(version, option || {}));
    }

    export function installLibraries(version: ResolvedVersion, option?: { libraryHost?: LibraryHost }): Promise<ResolvedVersion> {
        return installLibrariesTask(version, option).execute();
    }
    export function installLibrariesTask(version: ResolvedVersion, option?: { libraryHost?: LibraryHost }): Task<ResolvedVersion> {
        return Task.create({ name: "installLibraries", arguments: { version: version.id } }, installLibrariesWork(version, option));
    }

    /**
     * Only install several resolved libraries
     * @param libraries The resolved libraries
     * @param minecraft The minecraft location
     * @param option The install option
     */
    export function installLibrariesDirect(libraries: ResolvedLibrary[], minecraft: MinecraftLocation, option?: { libraryHost?: LibraryHost }): Promise<void> {
        return installLibrariesDirectTask(libraries, minecraft, option).execute();
    }
    export function installLibrariesDirectTask(libraries: ResolvedLibrary[], minecraft: MinecraftLocation, option?: { libraryHost?: LibraryHost }): Task<void> {
        return Task.create({ name: "installLibraries", arguments: {} }, async (ctx) => { await installLibrariesWork({ libraries, minecraftDirectory: typeof minecraft === "string" ? minecraft : minecraft.root }, option)(ctx); });
    }
}

function installWork(type: "client" | "server", versionMeta: Installer.VersionMeta, minecraft: MinecraftLocation, option?: Installer.Option) {
    return async (context: Task.Context) => {
        const version = await context.execute("installVersion", installVersionWork(type, versionMeta, minecraft, option));
        if (type === "client") {
            await context.execute("installDependencies", installDependenciesWork(version, option));
        } else {
            await context.execute("installLibraries", installLibrariesWork(version, option));
        }
        return version;
    };
}

function installVersionWork(type: "client" | "server", versionMeta: Installer.VersionMeta, minecraft: MinecraftLocation, option?: Installer.JarOption) {
    return async (context: Task.Context) => {
        await context.execute("json", installVersionJsonWork(versionMeta, minecraft));
        const version = await Version.parse(minecraft, versionMeta.id);
        await context.execute("jar", installVersionJarWork(type, version, minecraft, option));
        return version;
    };
}

function installVersionJsonWork(version: Installer.VersionMeta, minecraft: MinecraftLocation) {
    return async (context: Task.Context) => {
        const folder: MinecraftFolder = typeof minecraft === "string" ? new MinecraftFolder(minecraft) : minecraft;
        await vfs.ensureDir(folder.getVersionRoot(version.id));

        const json = folder.getVersionJson(version.id);
        const expectSha1 = version.url.split("/")[5];
        await downloadFileIfAbsentWork({ url: version.url, destination: json, checksum: { algorithm: "sha1", hash: expectSha1 } })(context);
    };
}

function installVersionJarWork(type: "client" | "server", version: ResolvedVersion, minecraft: MinecraftLocation, option: Installer.JarOption = {}) {
    return async (context: Task.Context) => {
        const folder: MinecraftFolder = typeof minecraft === "string" ? new MinecraftFolder(minecraft) : minecraft;
        await vfs.ensureDir(folder.getVersionRoot(version.id));

        const filename = type === "client" ? version.id + ".jar" : version.id + "-" + type + ".jar";
        const jar = path.join(folder.getVersionRoot(version.id), filename);

        let url = option[type];
        if (!url) { url = version.downloads[type].url; }

        await downloadFileIfAbsentWork({ url, destination: jar, checksum: { algorithm: "sha1", hash: version.downloads[type].sha1 } })(context);

        const valid = await vfs.validate(jar, { algorithm: "sha1", hash: version.downloads[type].sha1 });
        if (!valid) {
            throw new Error("SHA1 not matched! Probably caused by the incompleted file or illegal file source!");
        }
        return version;
    };
}

function installDependenciesWork(version: ResolvedVersion, option: { checksum?: boolean, libraryHost?: Installer.LibraryHost, assetsHost?: string } = {}) {
    return async (context: Task.Context) => {
        await Promise.all([
            context.execute("installAssets", installAssets0(version, option)),
            context.execute("installLibraries", installLibrariesWork(version, option))]);
        return version;
    };
}

function installLibraryWork(lib: ResolvedLibrary, folder: MinecraftFolder, libraryHost?: Installer.LibraryHost) {
    return async (context: Task.Context) => {
        context.update(0, -1, lib.name);
        const rawPath = lib.download.path;
        const filePath = path.join(folder.libraries, rawPath);
        const exist = await vfs.exists(filePath);
        let downloadURL: string;

        const isCompressed = (lib.checksums) ? lib.checksums.length > 1 ? true : false : false;
        const canDecompress = decompressXZ !== undefined;
        const compressed = isCompressed && canDecompress;

        if (libraryHost) {
            const url = libraryHost(lib);
            downloadURL = url ? url : lib.download.url; // handle external host
        } else {
            // if there is no external host, and we cannot decompress, then we need to swap this two lib src... forge src is missing
            downloadURL = (lib.name.startsWith("com.typesafe:config:") || lib.name.startsWith("com.typesafe.akka:akka-actor_2.11")) && !canDecompress ?
                `http://central.maven.org/maven2/${lib.download.path}` :
                lib.download.url;
        }
        if (compressed) {
            downloadURL += ".pack.xz";
        }
        const doDownload = async () => {
            await vfs.ensureDir(path.dirname(filePath));
            if (compressed) {
                if (!decompressXZ || !unpack200) { throw new Error("Require external support for unpack compressed library!"); }
                const buff = await context.execute("downloadLib", () => fetchBuffer(downloadURL).then((r) => r.body));
                const decompressed = await context.execute("decompress", async () => decompressXZ(buff));
                await context.execute("unpack", () => unpack200(decompressed).then((buf) => vfs.writeFile(filePath, buf)));
            } else {
                await downloadFileWork({ url: downloadURL, destination: filePath })(context);

                const valid = await vfs.validate(filePath, { algorithm: "sha1", hash: lib.download.sha1 });
                if (!valid) {
                    await downloadFileWork({ url: lib.download.url, destination: filePath })(context);
                }
            }
        };
        if (!exist) {
            await doDownload();
        } else if (lib.download.sha1 && typeof lib.download.sha1 === "string") {
            const valid = await vfs.validate(filePath, { algorithm: "sha1", hash: lib.download.sha1 });
            if (!valid) {
                await doDownload();
            }
        }
    };
}

function installLibrariesWork<T extends Pick<ResolvedVersion, "libraries" | "minecraftDirectory">>(version: T, option?: Installer.LibraryOption) {
    return async (context: Task.Context) => {
        const folder: MinecraftFolder = new MinecraftFolder(version.minecraftDirectory);
        const fullOption = option || {};
        const libraryHost: Installer.LibraryHost | undefined = fullOption.libraryHost;
        try {
            const promises = version.libraries.map((lib) =>
                context.execute({ name: "library", arguments: { lib: lib.name } }, installLibraryWork(lib, folder, libraryHost)).catch((e) => {
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
    };
}

interface AssetIndex {
    objects: {
        [key: string]: {
            hash: string,
            size: number,
        };
    };
}

const cores = os.cpus().length || 4;

function installAssetsByCluster(objects: Array<{ name: string, hash: string, size: number }>, folder: MinecraftFolder, assetsHost: string) {
    return async (context: Task.Context) => {
        const totalSize = objects.map((c) => c.size).reduce((a, b) => a + b, 0);
        context.update(0, totalSize);
        let lastProgress = 0;

        for (const o of objects) {
            const { hash, size, name } = o;

            const head = hash.substring(0, 2);
            const dir = folder.getPath("assets", "objects", head);
            await vfs.ensureDir(dir);

            context.update(lastProgress, undefined, `${assetsHost}/${head}/${hash}`);

            const file = path.join(dir, hash);
            let valid = await vfs.validate(file, { algorithm: "sha1", hash });
            if (!valid) {
                await downloadFile({
                    url: `${assetsHost}/${head}/${hash}`,
                    destination: file,
                    progress(written) {
                        context.update(lastProgress + written);
                    },
                });
                valid = await vfs.validate(file, { algorithm: "sha1", hash });
                if (!valid) {
                    await downloadFile({
                        url: `${Installer.DEFAULT_RESOURCE_ROOT_URL}/${head}/${hash}`,
                        destination: file,
                        progress(written) {
                            context.update(lastProgress + written);
                        },
                    });
                }

            }
            lastProgress += size;
            context.update(lastProgress);
        }
    };
}

function installAssets0(version: ResolvedVersion, option: { assetsHost?: string }) {
    return async (context: Task.Context) => {
        const folder: MinecraftFolder = new MinecraftFolder(version.minecraftDirectory);
        const jsonPath = folder.getPath("assets", "indexes", version.assets + ".json");

        await context.execute("assetsJson", downloadFileIfAbsentWork({
            url: version.assetIndex.url,
            destination: jsonPath,
            checksum: {
                algorithm: "sha1",
                hash: version.assetIndex.sha1,
            },
        }));

        const { objects } = JSON.parse(await vfs.readFile(jsonPath).then((b) => b.toString())) as AssetIndex;
        await vfs.ensureDir(folder.getPath("assets", "objects"));
        const assetsHost = option.assetsHost || Installer.DEFAULT_RESOURCE_ROOT_URL;
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
                all.push(context.execute({ name: "assets", arguments: { version: version.id } },
                    installAssetsByCluster(objectArray.slice(startIndex, i + 1), folder, assetsHost)));
                startIndex = i + 1;
                accumSize = 0;
            }
        }
        if (startIndex < objectArray.length) {
            all.push(context.execute({ name: "assets", arguments: { version: version.id } },
                installAssetsByCluster(objectArray.slice(startIndex, objectArray.length), folder, assetsHost)));
        }
        await Promise.all(all);

        return version;
    };
}
