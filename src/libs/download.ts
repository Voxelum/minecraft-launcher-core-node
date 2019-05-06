import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import Task from "treelike-task";
import { computeChecksum as computeChecksum, ensureDir, exists } from "./utils/common";
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
    Task.create("install", install(type, versionMeta, minecraft, option));

Version.checkDependencies = (version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }) => {
    return Version.checkDependenciesTask(version, minecraft, option).execute();
};

Version.checkDependenciesTask = function (version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }): Task<Version> {
    return Task.create("checkDependency", checkDependency(version, minecraft, option));
};


function install(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }) {
    return (context: Task.Context) => {
        return context.execute("downloadVersion", downloadVersion(type, versionMeta, minecraft, option ? option.checksum : undefined))
            .then((ver) => type === "client" ? context.execute("checkDependencies", checkDependency(ver, minecraft, option)) : ver);
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
        if (!await exists(json)) {
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
        await context.execute("downloadAssets", downloadAssets(version, minecraft, option));
        await context.execute("downloadLibraries", downloadLibraries(version, minecraft, option));
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

function downloadLibraries(version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost }) {
    return async (context: Task.Context) => {
        const folder: MinecraftFolder = typeof minecraft === "string" ? new MinecraftFolder(minecraft) : minecraft;
        const fullOption = option || {};
        const libraryHost: LibraryHost | undefined = fullOption.libraryHost;
        try {
            const promises = version.libraries.map((lib) =>
                context.execute({ name: "ensureLibrary", arguments: { lib: lib.name } }, downloadLib(lib, folder, libraryHost)).catch((e) => {
                    console.error(`Error occured during: ${lib.name}`);
                    console.error(e);
                }));
            await Promise.all(promises);
        } catch (e) {
            console.error("Fail to download libraries.");
            throw e;
        }
        return version;
    };
}

function downloadAsset(content: any, key: string, folder: MinecraftFolder, assetsHost: string) {
    return async (context: Task.Context) => {
        if (!content.hasOwnProperty(key)) { return; }
        const element = content[key];
        const hash: string = element.hash;
        const head = hash.substring(0, 2);
        const dir = folder.getPath("assets", "objects", head);
        await ensureDir(dir);
        const file = path.join(dir, hash);
        const exist = await exists(file);
        if (!exist) {
            await createDownloadWork(`${assetsHost}/${head}/${hash}`, file)(context);
        } else {
            const sum = await computeChecksum(file);
            if (sum !== hash) {
                await createDownloadWork(`${assetsHost}/${head}/${hash}`, file)(context);
            }
        }
    };
}

const cores = os.cpus.length || 4;

function downloadAssets(version: Version, minecraft: MinecraftLocation, option: { checksum?: boolean, assetsHost?: string }) {
    return async (context: Task.Context) => {
        const folder: MinecraftFolder = typeof minecraft === "string" ? new MinecraftFolder(minecraft) : minecraft;
        const jsonPath = folder.getPath("assets", "indexes", version.assets + ".json");
        if (!(await exists(jsonPath))) {
            await ensureDir(path.join(folder.assets, "indexes"));
            await context.execute("downloadAssetsJson", createDownloadWork(version.assetIndex.url, jsonPath));
        }
        const content: any = JSON.parse(await fs.promises.readFile(jsonPath).then((b) => b.toString())).objects;
        await ensureDir(folder.getPath("assets", "objects"));
        const assetsHost = option.assetsHost || Version.DEFAULT_RESOURCE_ROOT_URL;
        try {
            const keys = Object.keys(content);
            for (let i = 0; i < keys.length; i += cores) {
                const all = [];
                for (let j = 0; j < cores; j++) {
                    const hash = keys[j + i];
                    if (hash === undefined) { break; }
                    all.push(context.execute({ name: "downloadAsset", arguments: { hash } }, downloadAsset(content, hash, folder, assetsHost)));
                }
                await Promise.all(all);
            }
        } catch (e) {
            throw e;
        }
        return version;
    };
}
