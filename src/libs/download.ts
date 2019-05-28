import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import Task from "treelike-task";
import { computeChecksum as computeChecksum, ensureDir, exists, missing } from "./utils/common";
import { decompressXZ, unpack200 } from "./utils/decompress";
import { MinecraftFolder, MinecraftLocation } from "./utils/folder";
import { createDownloadWork, fetchBuffer, getIfUpdate, UpdatedObject } from "./utils/network";
import { Library, Version, VersionMeta } from "./version";


type LibraryHost = (libId: string) => string | undefined;
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
    type LibraryHost = (libId: string) => string | undefined;

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
         * Only install the json/jar. Do not check dependencies;
         */
        function downloadVersion(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation): Promise<Version>;

        function downloadVersion(type: "client", versionMeta: VersionMeta, minecraft: MinecraftLocation): Promise<Version>;
        function downloadVersion(type: "server", versionMeta: VersionMeta, minecraft: MinecraftLocation): Promise<Version>;

        function downloadVersionTask(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation): Task<Version>;

        /**
         * Check the completeness of the Minecraft game assets and libraries.
         *
         * @param version
         * @param minecraft
         * @param option
         */
        function checkDependencies(version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }): Promise<Version>;
        function checkDependenciesTask(version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }): Task<Version>;
    }
}

(Version as any).DEFAULT_VERSION_MANIFEST_URL = "https://launchermeta.mojang.com/mc/game/version_manifest.json";
(Version as any).DEFAULT_RESOURCE_ROOT_URL = "https://resources.download.minecraft.net";

Version.updateVersionMeta = (option: {
    fallback?: Version.MetaContainer,
    remote?: string,
} = {}) => {
    return getIfUpdate(option.remote || Version.DEFAULT_VERSION_MANIFEST_URL,
        JSON.parse, option.fallback);
};

Version.install = (type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }) => {
    return Version.installTask(type, versionMeta, minecraft, option).execute();
};

Version.installTask = (type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }) =>
    Task.create({ name: "install", arguments: { version: versionMeta.id, type } }, install(type, versionMeta, minecraft, option));

Version.checkDependencies = (version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }) => {
    return Version.checkDependenciesTask(version, minecraft, option).execute();
};

Version.checkDependenciesTask = function (version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }): Task<Version> {
    return Task.create({ name: "checkDependency", arguments: { version: version.id } }, checkDependency(version, minecraft, option));
};

Version.downloadVersion = function (type: string, meta: VersionMeta, minecraft: MinecraftLocation) {
    return Version.downloadVersionTask(type, meta, minecraft).execute();
};

Version.downloadVersionTask = function (type: string, meta: VersionMeta, minecraft: MinecraftLocation) {
    return Task.create({ name: "downloadVersion", arguments: { type, version: meta.id } }, downloadVersion(type, meta, minecraft, true));
};

function install(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }) {
    return async (context: Task.Context) => {
        const ver = await context.execute("downloadVersion", downloadVersion(type, versionMeta, minecraft, option ? option.checksum : undefined));
        return type === "client" ? context.execute("checkDependencies", checkDependency(ver, minecraft, option)) : ver;
    };
}

function downloadVersion(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, checksum?: boolean) {
    return async (context: Task.Context) => {
        const ver = await context.execute("downloadVersionJson", downloadVersionJson(versionMeta, minecraft));
        await context.execute("downloadVersionJar", downloadVersionJar(type, ver, minecraft, checksum));
        return ver;
    };
}

function downloadVersionJson(version: VersionMeta, minecraft: MinecraftLocation) {
    return async (context: Task.Context) => {
        const folder: MinecraftFolder = typeof minecraft === "string" ? new MinecraftFolder(minecraft) : minecraft;
        const json = folder.getVersionJson(version.id);
        await context.execute("ensureVersionRoot", () => ensureDir(folder.getVersionRoot(version.id)));

        if (await exists(json)) {
            const actualSha1 = await computeChecksum(json, "sha1");
            const expectSha1 = version.url.split("/")[5];
            if (expectSha1 !== actualSha1) {
                await context.execute("downloadJson", createDownloadWork(version.url, json));
            }
        } else {
            await context.execute("downloadJson", createDownloadWork(version.url, json));
        }

        return context.execute("resolveJson", () => Version.parse(minecraft, version.id));
    };
}

function downloadVersionJar(type: string, version: Version, minecraft: MinecraftLocation, checksum?: boolean) {
    return async (context: Task.Context) => {
        const folder: MinecraftFolder = typeof minecraft === "string" ? new MinecraftFolder(minecraft) : minecraft;
        await context.execute("ensureRootDir", () => ensureDir(folder.getVersionRoot(version.id)));
        const filename = type === "client" ? version.id + ".jar" : version.id + "-" + type + ".jar";
        const jar = path.join(folder.getVersionRoot(version.id), filename);
        const exist = await exists(jar);
        if (!exist) {
            await context.execute("downloadJar", createDownloadWork(version.downloads[type].url, jar));
        }
        if (checksum) {
            let hash = await context.execute("checksumJar", () => computeChecksum(jar));
            if (hash !== version.downloads[type].sha1 && exist) {
                await context.execute("redownloadJar", createDownloadWork(version.downloads[type].url, jar));
                hash = await context.execute("rechecksumJar", () => computeChecksum(jar));
            }
            if (hash !== version.downloads[type].sha1) {
                throw new Error("SHA1 not matched! Probably caused by the incompleted file or illegal file source!");
            }
        }
        return version;
    };
}


function checkDependency(version: Version, minecraft: MinecraftLocation, option: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string } = {}) {
    return async (context: Task.Context) => {
        await Promise.all([context.execute("downloadAssets", downloadAssets(version, minecraft, option)),
        context.execute("downloadLibraries", downloadLibraries(version, minecraft, option))]);
        return version;
    };
}

function downloadLib(lib: Library, folder: MinecraftFolder, libraryHost?: LibraryHost, checksum?: boolean) {
    return async (context: Task.Context) => {
        const rawPath = lib.download.path;
        const filePath = path.join(folder.libraries, rawPath);
        const exist = await exists(filePath);
        let downloadURL: string;

        const isCompressed = (lib.checksums) ? lib.checksums.length > 1 ? true : false : false;
        const canDecompress = decompressXZ !== undefined;
        const compressed = isCompressed && canDecompress;

        if (libraryHost) {
            const url = libraryHost(lib.name);
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
                await createDownloadWork(downloadURL, filePath)(context);
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

export function downloadLibraries(version: Pick<Version, "libraries">, minecraft: MinecraftLocation, option?: { libraryHost?: LibraryHost }) {
    return async (context: Task.Context) => {
        const folder: MinecraftFolder = typeof minecraft === "string" ? new MinecraftFolder(minecraft) : minecraft;
        const fullOption = option || {};
        const libraryHost: LibraryHost | undefined = fullOption.libraryHost;
        try {
            const promises = version.libraries.map((lib) =>
                context.execute({ name: "ensureLibrary", arguments: { lib: lib.name } }, downloadLib(lib, folder, libraryHost)).catch((e) => {
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

type Objects = AssetIndex["objects"];

const cores = os.cpus().length || 4;

function downloadAssetsByCluster(objects: Array<{ name: string, hash: string, size: number }>, folder: MinecraftFolder, assetsHost: string) {
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
            const exist = await exists(file);
            if (!exist) {
                await Task.create("", createDownloadWork(`${assetsHost}/${head}/${hash}`, file)).onUpdate(({ progress }) => {
                    context.update(lastProgress + progress);
                }).execute();
            } else {
                const sum = await computeChecksum(file);
                if (sum !== hash) {
                    await Task.create("", createDownloadWork(`${assetsHost}/${head}/${hash}`, file)).onUpdate(({ progress }) => {
                        context.update(lastProgress + progress);
                    }).execute();
                }
            }
            lastProgress += size;
            context.update(lastProgress);
        }
    };
}

function downloadAssets(version: Version, minecraft: MinecraftLocation, option: { checksum?: boolean, assetsHost?: string }) {
    return async (context: Task.Context) => {
        const folder: MinecraftFolder = typeof minecraft === "string" ? new MinecraftFolder(minecraft) : minecraft;
        const jsonPath = folder.getPath("assets", "indexes", version.assets + ".json");
        if (await missing(jsonPath) || await computeChecksum(jsonPath, "sha1") !== version.assetIndex.sha1) {
            await ensureDir(path.join(folder.assets, "indexes"));
            await context.execute("downloadAssetsJson", createDownloadWork(version.assetIndex.url, jsonPath));
        }
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
                all.push(context.execute({ name: "downloadAsset", arguments: { version: version.id } },
                    downloadAssetsByCluster(objectArray.slice(startIndex, i + 1), folder, assetsHost)));
                startIndex = i + 1;
            }
        }
        if (startIndex < objectArray.length) {
            all.push(context.execute({ name: "downloadAsset", arguments: { version: version.id } },
                downloadAssetsByCluster(objectArray.slice(startIndex, objectArray.length), folder, assetsHost)));
        }
        // const avg = Math.ceil(objectArray.length / cores);
        // for (let i = 0; i < cores; i++) {
        //     all.push(context.execute({ name: "downloadAsset", arguments: { version: version.id } }, downloadAssetsByCluster(objectArray.slice(i * avg, (i + 1) * avg), folder, assetsHost)));
        // }
        await Promise.all(all);

        return version;
    };
}
