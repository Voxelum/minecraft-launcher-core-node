import * as https from 'https'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as url from 'url'
import * as os from 'os';
import Task from 'treelike-task'

import UPDATE from './utils/update';
import { downloadTask } from './utils/download';
import CHECKSUM from './utils/checksum';
import { Library, Version, VersionMeta, VersionMetaList } from './version';
import { MinecraftLocation, MinecraftFolder } from './utils/folder';
import { decompressXZ, unpack200 } from './utils/decompress';

declare module './version' {
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
    namespace Version {
        type MetaContainer = { list: VersionMetaList, date: string }

        function updateVersionMeta(option?: {
            fallback?: MetaContainer, remote?: string
        }): Promise<MetaContainer>;

        function install(type: 'server', versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string, assetsHost?: string }): Promise<Version>;
        function install(type: 'client', versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string, assetsHost?: string }): Promise<Version>;
        function install(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string, assetsHost?: string }): Promise<Version>;

        function installTask(type: 'server', versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string, assetsHost?: string }): Task<Version>;
        function installTask(type: 'client', versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string, assetsHost?: string }): Task<Version>;
        function installTask(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string, assetsHost?: string }): Task<Version>;

        function checkDependencies(version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string, assetsHost?: string }): Promise<Version>;
        function checkDependenciesTask(version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string, assetsHost?: string }): Task<Version>;
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

Version.install = function (type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string, assetsHost?: string }) {
    return Version.installTask(type, versionMeta, minecraft, option).execute();
}
Version.installTask = (type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string, assetsHost?: string }) =>
    Task.create('install', install(type, versionMeta, minecraft, option))

Version.checkDependencies = function (version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string, assetsHost?: string }) {
    return Version.checkDependenciesTask(version, minecraft, option).execute();
}

Version.checkDependenciesTask = function (version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string, assetsHost?: string }): Task<Version> {
    return Task.create('checkDependency', checkDependency(version, minecraft, option));
}


function install(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string, assetsHost?: string }) {
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
        let ver = Version.parse(minecraft, version.id);
        if (ver) return ver;
        else throw new Error('Cannot parse version');
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

export type LibraryHost = (libId: string) => string | undefined;

function checkDependency(version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string | LibraryHost, assetsHost?: string }) {
    return async (context: Task.Context) => {
        return context.execute('downloadAssets', downloadAssets(version, minecraft, option))
            .then((version) => context.execute('downloadLibraries', downloadLibraries(version, minecraft, option)))
    }
}

function downloadLib(lib: Library, folder: MinecraftFolder, libraryHost?: LibraryHost, checksum?: boolean) {
    return async (context: Task.Context) => {
        const rawPath = lib.download.path;
        const filePath = path.join(folder.libraries, rawPath);
        const exist = fs.existsSync(filePath);
        let downloadURL: string;
        if (libraryHost) {
            const url = libraryHost(lib.name);
            if (url) downloadURL = url;
            else downloadURL = lib.download.url;
        } else {
            if (lib.name.startsWith('com.typesafe:config:') || lib.name.startsWith('com.typesafe.akka:akka-actor_2.11'))
                downloadURL = `http://central.maven.org/maven2/${lib.download.path}`;
            else
                downloadURL = lib.download.url;
        }
        if (lib.download.compressed) {
            downloadURL += '.pack.xz';
        }
        const _download = async () => {
            await fs.ensureDir(path.dirname(filePath));
            if (lib.download.compressed) {
                if (!decompressXZ || !unpack200) throw new Error('Require external support for unpack compressed library!');
                const decompressed = await context.execute('decompress',
                    async () => decompressXZ(await context.execute('downloadLib', downloadTask(downloadURL)) as Buffer));
                await context.execute('unpack', () => unpack200(decompressed).then(buf => fs.writeFile(filePath, buf)));
            } else {
                await context.execute('downloadLib', downloadTask(downloadURL, filePath));
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

function downloadLibraries(version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string | LibraryHost }) {
    return async (context: Task.Context) => {
        const folder: MinecraftFolder = typeof minecraft === 'string' ? new MinecraftFolder(minecraft) : minecraft;
        let all = [];
        const op = option || {};
        const libraryHost: LibraryHost | undefined = (typeof op.libraryHost === 'string' ? (l) => undefined : op.libraryHost);
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
        const file = path.join(dir, hash);
        const exist = fs.existsSync(file);
        if (!exist) {
            await fs.ensureDir(dir);
            await context.execute(hash, downloadTask(`${assetsHost}/${head}/${hash}`, file));
        }
        if (checksum) {
            let sum = await context.execute('checksum', () => CHECKSUM(file));
            if (sum != hash && exist) {// if exist, re-download
                await fs.ensureDir(dir);
                await context.execute(`re-${hash}`, downloadTask(`${assetsHost}/${head}/${hash}`, file));
                sum = await context.execute('re-checksum', () => CHECKSUM(file));
            }
            if (sum != hash)
                throw new Error(`SHA1 not matched!\n${sum}\n${hash}\n@${file}\n Probably caused by the incompleted file or illegal file source!`)
        }
    }
}

function downloadAssets(version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, assetsHost?: string }) {
    return async (context: Task.Context) => {
        const folder: MinecraftFolder = typeof minecraft === 'string' ? new MinecraftFolder(minecraft) : minecraft
        const jsonPath = folder.getPath('assets', 'indexes', version.assets + '.json')
        if (!fs.existsSync(jsonPath)) {
            await context.execute('ensureIndexes', () => fs.ensureDir(path.join(folder.assets, 'indexes')))
            await context.execute('downloadAssetsJson', downloadTask(version.assetIndex.url, jsonPath))
        }
        const content: any = (await fs.readJson(jsonPath)).objects
        await context.execute('ensureObjects', () => fs.ensureDir(folder.getPath('assets', 'objects')))
        const assetsHost = option ? option.assetsHost || 'https://resources.download.minecraft.net' : 'https://resources.download.minecraft.net';
        const checksum = option ? option.checksum ? option.checksum : false : false;
        try {
            await Promise.all(Object.keys(content).map(key => context.execute(key, downloadAsset(content, key, folder, assetsHost, checksum))))
        }
        catch (e) {
            throw e;
        }
        return version;
    }
}
