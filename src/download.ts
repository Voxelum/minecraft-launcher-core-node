import * as https from 'https'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as url from 'url'
import * as urls from 'url';
import { EventEmitter } from 'events';
import UPDATE from './utils/update'
import DOWN, { DownloadTask } from './utils/download'
import Task from './utils/task';
import CHECKSUM from './utils/checksum'
import { Asset, Library, Version, VersionMeta, VersionMetaList } from './version'
import { MinecraftLocation, MinecraftFolder } from './utils/folder';
import { AbstractTask } from './utils/task';

declare module './version' {
    interface VersionMeta {
        id: string,
        type: string,
        time: string,
        releaseTime: string,
        url: string
    }
    interface VersionMetaList {
        latest: {
            snapshot: string,
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

        function downloadVersion(type: 'server', versionMeta: VersionMeta, minecraft: MinecraftLocation, checksum?: boolean): Promise<Version>
        function downloadVersion(type: 'client', versionMeta: VersionMeta, minecraft: MinecraftLocation, checksum?: boolean): Promise<Version>
        function downloadVersion(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, checksum?: boolean): Promise<Version>

        function downloadVersionTask(type: 'server', versionMeta: VersionMeta, minecraft: MinecraftLocation, checksum?: boolean): Task<Version>
        function downloadVersionTask(type: 'client', versionMeta: VersionMeta, minecraft: MinecraftLocation, checksum?: boolean): Task<Version>
        function downloadVersionTask(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, checksum?: boolean): Task<Version>

        function downloadVersionJson(version: VersionMeta, minecraft: MinecraftLocation): Promise<Version>
        function downloadVersionJsonTask(version: VersionMeta, minecraft: MinecraftLocation): Task<Version>

        function downloadVersionJar(type: 'client', version: Version, minecraft: MinecraftLocation, checksum?: boolean): Promise<Version>
        function downloadVersionJar(type: 'server', version: Version, minecraft: MinecraftLocation, checksum?: boolean): Promise<Version>
        function downloadVersionJar(type: string, version: Version, minecraft: MinecraftLocation, checksum?: boolean): Promise<Version>

        function downloadVersionJarTask(type: 'client', version: Version, minecraft: MinecraftLocation, checksum?: boolean): Task<Version>
        function downloadVersionJarTask(type: 'server', version: Version, minecraft: MinecraftLocation, checksum?: boolean): Task<Version>
        function downloadVersionJarTask(type: string, version: Version, minecraft: MinecraftLocation, checksum?: boolean): Task<Version>

        function checkDependency(version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string, assetsHost?: string }): Promise<Version>;
        function checkDependencyTask(version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string, assetsHost?: string }): Task<Version>;
        function downloadLibraries(version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string }): Promise<Version>;
        function downloadLibrariesTask(version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string }): Task<Version>;
        function downloadAssets(version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, assetsHost?: string }): Promise<Version>;
        function downloadAssetsTask(version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, assetsHost?: string }): Task<Version>;
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
    return Version.downloadVersion(type, versionMeta, minecraft, option ? option.checksum : undefined)
        .then(ver => type === 'client' ? Version.checkDependency(ver, minecraft, option) : ver)
}

Version.installTask = (type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string, assetsHost?: string }) =>
    new InstallTask(type, versionMeta, minecraft, option)

Version.downloadVersion = (type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, checksum: boolean = true) =>
    Task.execute(new DownloadVersion(type, versionMeta, minecraft, checksum))

Version.downloadVersionTask = (type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, checksum: boolean = true) =>
    new DownloadVersion(type, versionMeta, minecraft, checksum)

Version.downloadVersionJson = (version: VersionMeta, minecraft: MinecraftLocation) =>
    Task.execute(new DownloadVersionJson(version, minecraft))

Version.downloadVersionJsonTask = (version: VersionMeta, minecraft: MinecraftLocation) =>
    new DownloadVersionJson(version, minecraft)

Version.downloadVersionJar = (type: string, version: Version, minecraft: MinecraftLocation, checksum: boolean = false) =>
    Task.execute(new DownloadVersionJar(type, version, minecraft, checksum));

Version.downloadVersionJarTask = (type: string, version: Version, minecraft: MinecraftLocation, checksum: boolean = false) =>
    new DownloadVersionJar(type, version, minecraft, checksum);

Version.downloadLibraries = (version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string }) =>
    Task.execute(new DownloadLibraries(version, minecraft, option))

Version.downloadLibrariesTask = (version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string }) =>
    new DownloadLibraries(version, minecraft, option)

Version.checkDependency = (version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string, assetsHost?: string }) =>
    Task.execute(new CheckDependencies(version, minecraft, option))

Version.checkDependencyTask = (version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string, assetsHost?: string }) =>
    new CheckDependencies(version, minecraft, option)

Version.downloadAssets = (version: Version, minecraft: MinecraftLocation, option?: {
    checksum?: boolean, assetsHost?: string
}) => Task.execute(new DownloadAssets(version, minecraft, option))

Version.downloadAssetsTask = (version: Version, minecraft: MinecraftLocation, option?: {
    checksum?: boolean, assetsHost?: string
}) => new DownloadAssets(version, minecraft, option)


class InstallTask extends AbstractTask<Version>{
    execute(context: Task.Context): Promise<Version> {
        const { type, versionMeta, minecraft, option } = this;
        return context.execute(new DownloadVersion(type, versionMeta, minecraft, option ? option.checksum : undefined))
            .then(ver => type === 'client' ? context.execute(new CheckDependencies(ver, minecraft, option)) : ver)
    }
    constructor(readonly type: string, readonly versionMeta: VersionMeta,
        readonly minecraft: MinecraftLocation,
        readonly option?: { checksum?: boolean, libraryHost?: string, assetsHost?: string }) { super() }
}
class DownloadVersion extends AbstractTask<Version>{
    execute(context: Task.Context): Promise<Version> {
        const { type, versionMeta, minecraft, checksum } = this;
        return context.execute(new DownloadVersionJson(versionMeta, minecraft))
            .then((version) => context.execute(new DownloadVersionJar(type, version, minecraft, checksum)))
    }
    constructor(readonly type: string, readonly versionMeta: VersionMeta, readonly minecraft: MinecraftLocation,
        readonly checksum: boolean = true) {
        super();
    }
}

class DownloadVersionJson extends AbstractTask<Version>{
    constructor(readonly version: VersionMeta, readonly minecraft: MinecraftLocation) { super() }
    async execute(context: Task.Context): Promise<Version> {
        const { minecraft, version } = this;
        const folder: MinecraftFolder = typeof minecraft === 'string' ? new MinecraftFolder(minecraft) : minecraft
        let json = folder.getVersionJson(version.id)
        await context.wrap('ensureVersionRoot', fs.ensureDir(folder.getVersionRoot(version.id)))
        if (!fs.existsSync(json)) await context.wrap('getJson', new Promise<void>((res, rej) => {
            let jsonStream = fs.createWriteStream(json)
            let u = url.parse(version.url)
            https.get({ host: u.host, path: u.path }, res => res.pipe(jsonStream)).on('error', (e) => rej(e))
            jsonStream.on('finish', () => {
                jsonStream.close();
                res()
            })
        }));
        let versionInstance = Version.parse(minecraft, version.id)
        if (versionInstance) return versionInstance
        else throw new Error('Cannot parse version')
    }
}

class DownloadVersionJar extends AbstractTask<Version>{
    constructor(
        readonly type: string, readonly version: Version,
        readonly minecraft: MinecraftLocation,
        readonly checksum: boolean = false) {
        super();
    }
    async execute(context: Task.Context) {
        const { type, version, minecraft, checksum } = this;
        const folder: MinecraftFolder = typeof minecraft === 'string' ? new MinecraftFolder(minecraft) : minecraft
        await context.wrap('ensureRootDir', () => fs.ensureDir(folder.getVersionRoot(version.version)))
        let filename = type == 'client' ? version.version + '.jar' : version.version + '-' + type + '.jar'
        let jar = path.join(folder.getVersionRoot(version.version), filename);
        const exist = fs.existsSync(jar);
        if (!exist)
            await context.execute(new DownloadTask('downloadJar', version.downloads[type].url, jar))
        if (checksum) {
            let hash = await context.wrap('checksumJar', CHECKSUM(jar))
            if (hash != version.downloads[type].sha1 && exist) {
                await context.execute(new DownloadTask('redownloadJar', version.downloads[type].url, jar));
                hash = await context.wrap('rechecksumJar', CHECKSUM(jar))
            }
            if (hash != version.downloads[type].sha1)
                throw new Error('SHA1 not matched! Probably caused by the incompleted file or illegal file source!')
        }
        return version
    }
}
class CheckDependencies extends AbstractTask<Version>{
    constructor(readonly version: Version, readonly minecraft: MinecraftLocation, readonly option?: { checksum?: boolean, libraryHost?: string, assetsHost?: string }) { super() }
    execute(context: Task.Context): Promise<Version> {
        const { version, minecraft, option } = this;
        return context.execute(new DownloadAssets(version, minecraft, option)).then((version) => context.execute(new DownloadLibraries(version, minecraft, option)))
    }
}

async function downloadLib(lib: any, folder: any, libraryHost: any, checksum: any) {
    if (lib.downloadInfo) {
        const rawPath = lib.downloadInfo.path
        const filePath = path.join(folder.libraries, rawPath)
        const dirPath = path.dirname(filePath)
        const exist = fs.existsSync(filePath);
        const rpath = libraryHost || lib.customizedUrl || 'https://libraries.minecraft.net'
        if (!exist) {
            await fs.ensureDir(dirPath)
            await DOWN(rpath + "/" + rawPath, filePath)
        }
        if (checksum && lib.downloadInfo.sha1) {
            let sum = await CHECKSUM(filePath)
            if (exist && sum != lib.downloadInfo.sha1) {
                await DOWN(rpath + "/" + rawPath, filePath)
                sum = await CHECKSUM(filePath)
            }
            if (sum != lib.downloadInfo.sha1)
                throw new Error('')
        }
    }
}

class DownloadLibraries extends AbstractTask<Version> {
    async execute(context: Task.Context): Promise<Version> {
        const { version, minecraft, option } = this;
        const folder: MinecraftFolder = typeof minecraft === 'string' ? new MinecraftFolder(minecraft) : minecraft
        let all = []
        const libraryHost = option ? option.libraryHost : undefined
        const checksum = option ? option.checksum : true;
        try {
            await Promise.all(version.libraries.map(lib => context.wrap(lib.id, downloadLib(lib, folder, libraryHost, checksum))))
        }
        catch (e) {
            throw e;
        }
        return version;
    }
    constructor(readonly version: Version, readonly minecraft: MinecraftLocation, readonly option?: { checksum?: boolean, libraryHost?: string }) { super() }

}
async function downloadAsset(content: any, key: any, folder: any, assetsHost: any, checksum: any) {
    if (!content.hasOwnProperty(key)) return
    var element = content[key];
    let hash: string = element.hash
    let head = hash.substring(0, 2)
    let dir = folder.getPath('assets', 'objects', head)
    let file = path.join(dir, hash)
    const exist = fs.existsSync(file)
    if (!exist) {
        await fs.ensureDir(dir)
        await DOWN(`${assetsHost}/${head}/${hash}`, file)
    }
    if (checksum) {
        let sum = await CHECKSUM(file)
        if (sum != hash && exist) {// if exist, re-download
            await fs.ensureDir(dir)
            await DOWN(`${assetsHost}/${head}/${hash}`, file)
            sum = await CHECKSUM(file)
        }
        if (sum != hash)
            throw new Error(`SHA1 not matched!\n${sum}\n${hash}\n@${file}\n Probably caused by the incompleted file or illegal file source!`)
    }
}

class DownloadAssets extends AbstractTask<Version>{
    constructor(readonly version: Version, readonly minecraft: MinecraftLocation, readonly option?: {
        checksum?: boolean, assetsHost?: string
    }) { super() }
    async execute(context: Task.Context): Promise<Version> {
        const { version, minecraft, option } = this;
        const folder: MinecraftFolder = typeof minecraft === 'string' ? new MinecraftFolder(minecraft) : minecraft
        let jsonPath = folder.getPath('assets', 'indexes', version.assets + '.json')
        if (!fs.existsSync(jsonPath)) {
            await context.wrap('ensureIndexes', fs.ensureDir(path.join(folder.assets, 'indexes')))
            await context.execute(new DownloadTask('downloadAssetsJson', version.assetIndexDownloadInfo.url, jsonPath))
        }
        let content: any = (await fs.readJson(jsonPath)).objects
        await context.wrap('ensureObjects', fs.ensureDir(folder.getPath('assets', 'objects')))
        const assetsHost = option ? option.assetsHost || 'https://resources.download.minecraft.net' : 'https://resources.download.minecraft.net';
        const checksum = option ? option.checksum ? option.checksum : false : false;
        try {
            await Object.keys(content).map(key => context.wrap(key, downloadAsset(content, key, folder, assetsHost, checksum)))
        }
        catch (e) {
            throw e;
        }
        return version;
    }
}


