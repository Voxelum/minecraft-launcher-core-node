import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import Task from "treelike-task";
import { computeChecksum as computeChecksum, ensureDir, exists, validate } from "./utils/common";
import { decompressXZ, unpack200 } from "./utils/decompress";
import { MinecraftFolder, MinecraftLocation } from "./utils/folder";
import { downloadFile, downloadFileIfAbsentWork, downloadFileWork, fetchBuffer, getIfUpdate, UpdatedObject } from "./utils/network";
import { Library, Version, VersionMeta } from "./version";

type LibraryHost = (libId: Library) => string | undefined;
declare module "./version" {
    /**
     * Version metadata about download
     */
    interface VersionMeta {
        id: string;
        type: string;
        time: string;
        releaseTime: string;
        url: string;
    }
    interface VersionMetaList {
        latest: {
            snapshot: string
            release: string,
        };
        versions: VersionMeta[];
    }

    namespace Version {
        /**
         * Default minecraft version manifest url.
         */
        const DEFAULT_VERSION_MANIFEST_URL = "https://launchermeta.mojang.com/mc/game/version_manifest.json";
        /**
         * Default resource/assets url root
         */
        const DEFAULT_RESOURCE_ROOT_URL = "https://resources.download.minecraft.net";

        type MetaContainer = VersionMetaList & UpdatedObject;

        /**
         * get/refresh a version metadata
         */
        function updateVersionMeta(option?: {
            /**
             * fallback meta container if there is no internet
             */
            fallback?: MetaContainer,
            /**
             * remote url of this request
             */
            remote?: string,
        }): Promise<MetaContainer>;

        /**
         * Install the server to a location by version metadata
         */
        function install(type: "server", versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }): Promise<Version>;

        /**
         * Install the client to a location by version metadata
         */
        function install(type: "client", versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }): Promise<Version>;

        /**
         * Install the Minecraft game to a location by version metadata
         *
         * @param type The type of game, client or server
         * @param versionMeta The version metadata
         * @param minecraft The Minecraft location
         * @param option
         */
        function install(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }): Promise<Version>;

        function installTask(type: "server", versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }): Task<Version>;
        function installTask(type: "client", versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }): Task<Version>;
        function installTask(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }): Task<Version>;

        /**
         * @deprecated
         * alias for installVersion
         */
        function downloadVersion(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation): Promise<Version>;

        /**
         * @deprecated
         * alias for installVersionTask
         */
        function downloadVersionTask(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation): Task<Version>;

        /**
         * Only install the json/jar. Do not check dependencies;
         *
         * @param type client or server
         * @param versionMeta the version metadata; get from updateVersionMeta
         * @param minecraft minecraft location
         */
        function installVersion(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation): Promise<Version>;

        function installVersion(type: "client", versionMeta: VersionMeta, minecraft: MinecraftLocation): Promise<Version>;
        function installVersion(type: "server", versionMeta: VersionMeta, minecraft: MinecraftLocation): Promise<Version>;

        function installVersionTask(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation): Task<Version>;

        /**
         * Check the completeness of the Minecraft game assets and libraries.
         * @deprecated
         * use installDependencies
         */
        function checkDependencies(version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }): Promise<Version>;
        function checkDependenciesTask(version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }): Task<Version>;


        /**
         * Install the completeness of the Minecraft game assets and libraries.
         *
         * @param version The resolved version produced by Version.parse
         * @param minecraft The minecraft location
         */
        function installDependencies(version: Version, minecraft: MinecraftLocation, option?: { libraryHost?: LibraryHost, assetsHost?: string }): Promise<Version>;
        function installDependenciesTask(version: Version, minecraft: MinecraftLocation, option?: { libraryHost?: LibraryHost, assetsHost?: string }): Task<Version>;

        function installAssets(version: Version, minecraft: MinecraftLocation, option?: { assetsHost?: string }): Promise<Version>;
        function installAssetsTask(version: Version, minecraft: MinecraftLocation, option?: { assetsHost?: string }): Task<Version>;

        function installLibraries(version: Version, minecraft: MinecraftLocation, option?: { libraryHost?: LibraryHost }): Promise<Version>;
        function installLibrariesTask(version: Version, minecraft: MinecraftLocation, option?: { libraryHost?: LibraryHost }): Task<Version>;

        function installLibrariesDirect(libraries: Library[], minecraft: MinecraftLocation, option?: { libraryHost?: LibraryHost }): Promise<void>;
        function installLibrariesDirectTask(libraries: Library[], minecraft: MinecraftLocation, option?: { libraryHost?: LibraryHost }): Task<void>;
    }
}

(Version as any).DEFAULT_VERSION_MANIFEST_URL = "https://launchermeta.mojang.com/mc/game/version_manifest.json";
(Version as any).DEFAULT_RESOURCE_ROOT_URL = "https://resources.download.minecraft.net";

Version.updateVersionMeta = (option: { fallback?: Version.MetaContainer, remote?: string } = {}) =>
    getIfUpdate(option.remote || Version.DEFAULT_VERSION_MANIFEST_URL, JSON.parse, option.fallback);

Version.install = function (type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }) {
    return Version.installTask(type, versionMeta, minecraft, option).execute();
};

Version.installTask = function (type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }) {
    return Task.create({ name: "install", arguments: { version: versionMeta.id, type } }, install(type, versionMeta, minecraft, option));
};

Version.installDependencies = function (version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }) {
    return Version.installDependenciesTask(version, minecraft, option).execute();
};

Version.installDependenciesTask = function (version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }): Task<Version> {
    return Task.create({ name: "installDependencies", arguments: { version: version.id } }, installDependencies(version, minecraft, option));
};

Version.checkDependencies = Version.installDependencies;
Version.checkDependenciesTask = Version.installDependenciesTask;

Version.installVersion = function (type: string, meta: VersionMeta, minecraft: MinecraftLocation) {
    return Version.installVersionTask(type, meta, minecraft).execute();
};

Version.installVersionTask = function (type: string, meta: VersionMeta, minecraft: MinecraftLocation) {
    return Task.create({ name: "installVersion", arguments: { type, version: meta.id } }, installVersion(type, meta, minecraft));
};

Version.downloadVersion = Version.installVersion;
Version.downloadVersionTask = Version.installVersionTask;

Version.installLibrariesTask = function (version: Version, minecraft: MinecraftLocation, option?: { libraryHost?: LibraryHost }) {
    return Task.create({ name: "installLibraries", arguments: { version: version.id } }, installLibraries(version, minecraft, option));
};

Version.installLibraries = function (version: Version, minecraft: MinecraftLocation, option?: { libraryHost?: LibraryHost }) {
    return Version.installLibrariesTask(version, minecraft, option).execute();
};

Version.installAssetsTask = function (version: Version, minecraft: MinecraftLocation, option?: { assetsHost?: string }) {
    return Task.create({ name: "installAssets", arguments: { version: version.id } }, installAssets(version, minecraft, option || {}));
};

Version.installAssets = function (version: Version, minecraft: MinecraftLocation, option?: { assetsHost?: string }) {
    return Version.installAssetsTask(version, minecraft, option).execute();
};

Version.installLibrariesDirect = function (libraries: Library[], minecraft: MinecraftLocation, option?: { libraryHost?: LibraryHost }) {
    return Version.installLibrariesDirectTask(libraries, minecraft, option).execute();
};

Version.installLibrariesDirectTask = function (libraries: Library[], minecraft: MinecraftLocation, option?: { libraryHost?: LibraryHost }) {
    return Task.create({ name: "installLibiraries", arguments: {} }, (ctx) => { installLibraries({ libraries }, minecraft, option)(ctx); });
};

function install(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }) {
    return async (context: Task.Context) => {
        const version = await context.execute("installVersion", installVersion(type, versionMeta, minecraft));
        if (type === "client") {
            await context.execute("installDependencies", installDependencies(version, minecraft, option));
        } else {
            await context.execute("installLibraries", installLibraries(version, minecraft, option));
        }
        return version;
    };
}

function installVersion(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation) {
    return async (context: Task.Context) => {
        await context.execute("json", installVersionJson(versionMeta, minecraft));
        const version = await Version.parse(minecraft, versionMeta.id);
        await context.execute("jar", installVersionJar(type, version, minecraft));
        return version;
    };
}

function installVersionJson(version: VersionMeta, minecraft: MinecraftLocation) {
    return async (context: Task.Context) => {
        const folder: MinecraftFolder = typeof minecraft === "string" ? new MinecraftFolder(minecraft) : minecraft;
        await ensureDir(folder.getVersionRoot(version.id));

        const json = folder.getVersionJson(version.id);
        const expectSha1 = version.url.split("/")[5];
        await downloadFileIfAbsentWork({ url: version.url, destination: json, checksum: { algorithm: "sha1", hash: expectSha1 } })(context);
    };
}

function installVersionJar(type: string, version: Version, minecraft: MinecraftLocation) {
    return async (context: Task.Context) => {
        const folder: MinecraftFolder = typeof minecraft === "string" ? new MinecraftFolder(minecraft) : minecraft;
        await ensureDir(folder.getVersionRoot(version.id));

        const filename = type === "client" ? version.id + ".jar" : version.id + "-" + type + ".jar";
        const jar = path.join(folder.getVersionRoot(version.id), filename);

        await downloadFileIfAbsentWork({ url: version.downloads[type].url, destination: jar, checksum: { algorithm: "sha1", hash: version.downloads[type].sha1 } })(context);

        if (await computeChecksum(jar) !== version.downloads[type].sha1) {
            throw new Error("SHA1 not matched! Probably caused by the incompleted file or illegal file source!");
        }
        return version;
    };
}

function installDependencies(version: Version, minecraft: MinecraftLocation, option: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string } = {}) {
    return async (context: Task.Context) => {
        await Promise.all([
            context.execute("installAssets", installAssets(version, minecraft, option)),
            context.execute("installLibraries", installLibraries(version, minecraft, option))]);
        return version;
    };
}

function installLibrary(lib: Library, folder: MinecraftFolder, libraryHost?: LibraryHost, checksum?: boolean) {
    return async (context: Task.Context) => {
        context.update(0, -1, lib.name);
        const rawPath = lib.download.path;
        const filePath = path.join(folder.libraries, rawPath);
        const exist = await exists(filePath);
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
            await ensureDir(path.dirname(filePath));
            if (compressed) {
                if (!decompressXZ || !unpack200) { throw new Error("Require external support for unpack compressed library!"); }
                const buff = await context.execute("downloadLib", () => fetchBuffer(downloadURL).then((r) => r.body));
                const decompressed = await context.execute("decompress", async () => decompressXZ(buff));
                await context.execute("unpack", () => unpack200(decompressed).then((buf) => fs.promises.writeFile(filePath, buf)));
            } else {
                await downloadFileWork({ url: downloadURL, destination: filePath })(context);
            }
        };
        if (!exist) {
            await doDownload();
        } else if (lib.download.sha1 && typeof lib.download.sha1 === "string") {
            if (await computeChecksum(filePath) !== lib.download.sha1) {
                await doDownload();
            }
        }
    };
}

export function installLibraries<T extends Pick<Version, "libraries">>(version: T, minecraft: MinecraftLocation, option?: { libraryHost?: LibraryHost }) {
    return async (context: Task.Context) => {
        const folder: MinecraftFolder = typeof minecraft === "string" ? new MinecraftFolder(minecraft) : minecraft;
        const fullOption = option || {};
        const libraryHost: LibraryHost | undefined = fullOption.libraryHost;
        try {
            const promises = version.libraries.map((lib) =>
                context.execute({ name: "library", arguments: { lib: lib.name } }, installLibrary(lib, folder, libraryHost)).catch((e) => {
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

            context.update(lastProgress, undefined, name);

            const head = hash.substring(0, 2);
            const dir = folder.getPath("assets", "objects", head);
            await ensureDir(dir);

            const file = path.join(dir, hash);
            if (!await validate(file, hash)) {
                await downloadFile({
                    url: `${assetsHost}/${head}/${hash}`,
                    destination: file,
                    progress(written) {
                        context.update(lastProgress + written);
                    },
                });
            }
            lastProgress += size;
            context.update(lastProgress);
        }
    };
}

function installAssets(version: Version, minecraft: MinecraftLocation, option: { assetsHost?: string }) {
    return async (context: Task.Context) => {
        const folder: MinecraftFolder = typeof minecraft === "string" ? new MinecraftFolder(minecraft) : minecraft;
        const jsonPath = folder.getPath("assets", "indexes", version.assets + ".json");

        await context.execute("assetsJson", downloadFileIfAbsentWork({
            url: version.assetIndex.url,
            destination: jsonPath,
            checksum: {
                algorithm: "sha1",
                hash: version.assetIndex.sha1,
            },
        }));

        const { objects } = JSON.parse(await fs.promises.readFile(jsonPath).then((b) => b.toString())) as AssetIndex;
        await ensureDir(folder.getPath("assets", "objects"));
        const assetsHost = option.assetsHost || Version.DEFAULT_RESOURCE_ROOT_URL;
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
