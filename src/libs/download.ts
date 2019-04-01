import * as https from 'https'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as url from 'url'
import * as os from 'os';
import Task from 'treelike-task'

import UPDATE from './utils/update';
import { downloadTask } from './utils/download';
import CHECKSUM from './utils/checksum';
import { Library, Version, VersionMeta, VersionMetaList, Diagnosis } from './version';
import { MinecraftLocation, MinecraftFolder } from './utils/folder';
import { decompressXZ, unpack200 } from './utils/decompress';
import checksum from './utils/checksum';

type LibraryHost = (libId: string) => string | undefined;
declare module './version' {
    /**
     * Version metadata about download
     */
    interface VersionMeta {
        id: string
        type: string
        time: string
        releaseTime: string
        url: string
    }
    interface VersionMetaList {
        latest: {
            snapshot: string
            release: string
        },
        versions: VersionMeta[]
    }
    type LibraryHost = (libId: string) => string | undefined;

    interface Diagnosis {
        minecraftLocation: MinecraftFolder;

        missingVersionJson: string;
        missingVersionJar: boolean;
        missingAssetsIndex: boolean;

        missingLibraries: Library[];
        missingAssets: { [file: string]: string };
    }

    namespace Version {
        type MetaContainer = { list: VersionMetaList, date: string }

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
            remote?: string
        }): Promise<MetaContainer>;

        /**
         * Install the server to a location by version metadata
         */
        function install(type: 'server', versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }): Promise<Version>;

        /**
         * Install the client to a location by version metadata
         */
        function install(type: 'client', versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }): Promise<Version>;

        /**
         * Install the Minecraft game to a location by version metadata
         * 
         * @param type The type of game, client or server
         * @param versionMeta The version metadata
         * @param minecraft The Minecraft location
         * @param option 
         */
        function install(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }): Promise<Version>;

        function installTask(type: 'server', versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }): Task<Version>;
        function installTask(type: 'client', versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }): Task<Version>;
        function installTask(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }): Task<Version>;

        function diagnose(version: string, minecraft: MinecraftLocation): Promise<Diagnosis>;
        function diagnoseTask(version: string, minecraft: MinecraftLocation): Task<Diagnosis>;
        function fix(diagnose: Diagnosis): Promise<void>;
        function fixTask(diagnose: Diagnosis): Task<void>;

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

Version.updateVersionMeta = function (option?: {
    fallback?: Version.MetaContainer, remote?: string
}): Promise<Version.MetaContainer> {
    if (!option) option = {}
    return UPDATE({
        fallback: option.fallback,
        remote: option.remote || 'https://launchermeta.mojang.com/mc/game/version_manifest.json'
    }).then(result => result as { list: VersionMetaList, date: string })
}

Version.install = function (type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }) {
    return Version.installTask(type, versionMeta, minecraft, option).execute();
}
Version.installTask = (type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }) =>
    Task.create('install', install(type, versionMeta, minecraft, option))

Version.checkDependencies = function (version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }) {
    return Version.checkDependenciesTask(version, minecraft, option).execute();
}

Version.checkDependenciesTask = function (version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }): Task<Version> {
    return Task.create('checkDependency', checkDependency(version, minecraft, option));
}

function exists(p: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        fs.access(p, (e) => {
            if (e) resolve(false);
            else resolve(true);
        })
    });
}

function diagnose(version: string, minecraft: MinecraftFolder): (context: Task.Context) => Promise<Diagnosis> {
    return async (context: Task.Context) => {
        const jarPath = minecraft.getVersionJar(version);
        const missingJar = await exists(jarPath);
        let resolvedVersion;
        try {
            resolvedVersion = await Version.parse(minecraft, version);
        } catch (e) {
            return {
                minecraftLocation: minecraft,

                missingVersionJson: e.version,
                missingVersionJar: missingJar,
                missingAssetsIndex: false,

                missingLibraries: [],
                missingAssets: {},
            }
        }
        const assetsIndexPath = minecraft.getAssetsIndex(resolvedVersion.assets);
        const missingAssetsIndex = await exists(assetsIndexPath);
        const libMask = await Promise.all(resolvedVersion.libraries.map(async (lib) => {
            const libPath = minecraft.getLibraryByPath(lib.download.path);
            if (await exists(libPath)) {
                if (lib.download.sha1) {
                    return checksum(libPath).then(c => c === lib.download.sha1);
                }
                return true;
            }
            return false;
        }));
        const missingLibraries = resolvedVersion.libraries.filter((_, i) => !libMask[i]);
        const missingAssets: { [object: string]: string } = {};

        if (!missingAssetsIndex) {
            const objects = (await fs.readJson(assetsIndexPath)).objects;
            const files = Object.keys(objects);
            const assetsMask = await Promise.all(files.map(async (object) => {
                const { hash } = objects[object];
                const hashPath = minecraft.getAsset(hash);
                if (await exists(hashPath)) {
                    return (await checksum(hashPath)) === hash;
                }
                return false;
            }));
            files.filter((_, i) => !assetsMask[i]).forEach((file) => { missingAssets[file] = objects[file].hash; });
        }

        return {
            minecraftLocation: minecraft,

            missingVersionJson: '',
            missingVersionJar: missingJar,
            missingAssetsIndex,

            missingLibraries,
            missingAssets,
        }
    }
}

function install(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }) {
    return (context: Task.Context) => {
        return context.execute('downloadVersion', downloadVersion(type, versionMeta, minecraft, option ? option.checksum : undefined))
            .then(ver => type === 'client' ? context.execute('checkDependencies', checkDependency(ver, minecraft, option)) : ver)
    }
}

function downloadVersion(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, checksum?: boolean) {
    return (context: Task.Context) => {
        return context.execute('downloadVersionJson', downloadVersionJson(versionMeta, minecraft))
            .then((version) => context.execute('downloadVersionJar', downloadVersionJar(type, version, minecraft, checksum)))
    }
}

function downloadVersionJson(version: VersionMeta, minecraft: MinecraftLocation) {
    return async (context: Task.Context) => {
        const folder: MinecraftFolder = typeof minecraft === 'string' ? new MinecraftFolder(minecraft) : minecraft;
        let json = folder.getVersionJson(version.id);
        await context.execute('ensureVersionRoot', () => fs.ensureDir(folder.getVersionRoot(version.id)));
        if (!fs.existsSync(json)) await context.execute('getJson', downloadTask(version.url, json));
        return Version.parse(minecraft, version.id);
    }
}

function downloadVersionJar(type: string, version: Version, minecraft: MinecraftLocation, checksum?: boolean) {
    return async (context: Task.Context) => {
        const folder: MinecraftFolder = typeof minecraft === 'string' ? new MinecraftFolder(minecraft) : minecraft
        await context.execute('ensureRootDir', () => fs.ensureDir(folder.getVersionRoot(version.id)))
        let filename = type == 'client' ? version.id + '.jar' : version.id + '-' + type + '.jar'
        let jar = path.join(folder.getVersionRoot(version.id), filename);
        const exist = fs.existsSync(jar);
        if (!exist)
            await context.execute('downloadJar', downloadTask(version.downloads[type].url, jar))
        if (checksum) {
            let hash = await context.execute('checksumJar', () => CHECKSUM(jar))
            if (hash != version.downloads[type].sha1 && exist) {
                await context.execute('redownloadJar', downloadTask(version.downloads[type].url, jar));
                hash = await context.execute('rechecksumJar', () => CHECKSUM(jar))
            }
            if (hash != version.downloads[type].sha1)
                throw new Error('SHA1 not matched! Probably caused by the incompleted file or illegal file source!')
        }
        return version
    }
}


function checkDependency(version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost, assetsHost?: string }) {
    return async (context: Task.Context) => {
        return context.execute('downloadAssets', downloadAssets(version, minecraft, option))
            .then((version) => context.execute('downloadLibraries', downloadLibraries(version, minecraft, option)))
    }
}

function downloadLib(lib: Library, folder: MinecraftFolder, libraryHost?: LibraryHost, checksum?: boolean) {
    return async (context: Task.Context) => {
        const rawPath = lib.download.path;
        const filePath = path.join(folder.libraries, rawPath);
        const exist = await exists(filePath);
        let downloadURL: string;

        const isCompressed = (lib.checksums) ? lib.checksums.length > 1 ? true : false : false
        const canDecompress = decompressXZ !== undefined;
        const compressed = isCompressed && canDecompress;

        if (libraryHost) {
            const url = libraryHost(lib.name);
            downloadURL = url ? url : lib.download.url; // handle external host 
        } else {
            // if there is no external host, and we cannot decompress, then we need to swap this two lib src... forge src is missing
            downloadURL = (lib.name.startsWith('com.typesafe:config:') || lib.name.startsWith('com.typesafe.akka:akka-actor_2.11')) && !canDecompress ?
                `http://central.maven.org/maven2/${lib.download.path}` :
                lib.download.url;
        }
        if (compressed) {
            downloadURL += '.pack.xz';
        }
        const _download = async () => {
            await fs.ensureDir(path.dirname(filePath));
            if (compressed) {
                if (!decompressXZ || !unpack200) throw new Error('Require external support for unpack compressed library!');
                const decompressed = await context.execute('decompress',
                    async () => decompressXZ(await context.execute('downloadLib', downloadTask(downloadURL)) as Buffer));
                await context.execute('unpack', () => unpack200(decompressed).then(buf => fs.writeFile(filePath, buf)));
            } else {
                await downloadTask(downloadURL, filePath)(context);
            }
        }
        if (!exist) {
            await _download();
        } else if (lib.download.sha1 && typeof lib.download.sha1 === 'string') {
            if (await CHECKSUM(filePath) !== lib.download.sha1)
                await _download();
        }
    }
}

function downloadLibraries(version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: LibraryHost }) {
    return async (context: Task.Context) => {
        const folder: MinecraftFolder = typeof minecraft === 'string' ? new MinecraftFolder(minecraft) : minecraft;
        let all = [];
        const op = option || {};
        const libraryHost: LibraryHost | undefined = op.libraryHost;
        const checksum = option ? option.checksum : true;
        try {
            const promises = version.libraries.map(lib =>
                context.execute(lib.name, downloadLib(lib, folder, libraryHost, checksum)).catch(e => {
                    console.error(`Error occured during: ${lib.name}`);
                    console.error(e);
                }));
            await Promise.all(promises);
        }
        catch (e) {
            throw e;
        }
        return version;
    }
}

function downloadAsset(content: any, key: string, folder: MinecraftFolder, assetsHost: string, checksum: boolean) {
    return async (context: Task.Context) => {
        if (!content.hasOwnProperty(key)) return;
        const element = content[key];
        const hash: string = element.hash;
        const head = hash.substring(0, 2);
        const dir = folder.getPath('assets', 'objects', head);
        await fs.ensureDir(dir);
        const file = path.join(dir, hash);
        const exist = await exists(file);
        if (!exist) {
            await downloadTask(`${assetsHost}/${head}/${hash}`, file)(context);
        } else {
            let sum = await CHECKSUM(file);
            if (sum !== hash) {
                await downloadTask(`${assetsHost}/${head}/${hash}`, file)(context);
            }
        }
    }
}

const cores = os.cpus.length || 4;

function downloadAssets(version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, assetsHost?: string }) {
    return async (context: Task.Context) => {
        const folder: MinecraftFolder = typeof minecraft === 'string' ? new MinecraftFolder(minecraft) : minecraft
        const jsonPath = folder.getPath('assets', 'indexes', version.assets + '.json');
        if (!fs.existsSync(jsonPath)) {
            await fs.ensureDir(path.join(folder.assets, 'indexes'))
            await context.execute('downloadAssetsJson', downloadTask(version.assetIndex.url, jsonPath))
        }
        const content: any = (await fs.readJson(jsonPath)).objects
        await fs.ensureDir(folder.getPath('assets', 'objects'));
        const assetsHost = option ? option.assetsHost || 'https://resources.download.minecraft.net' : 'https://resources.download.minecraft.net';
        const checksum = option ? option.checksum ? option.checksum : false : false;
        try {
            const keys = Object.keys(content);
            for (let i = 0; i < keys.length; i += cores) {
                const all = [];
                for (let j = 0; j < cores; j++) {
                    const hash = keys[j + i];
                    if (hash === undefined) break;
                    all.push(context.execute(`${hash}`, downloadAsset(content, hash, folder, assetsHost, checksum)));
                }
                await Promise.all(all);
            }
        }
        catch (e) {
            throw e;
        }
        return version;
    }
}
