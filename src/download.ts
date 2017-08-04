import { MinecraftLocation, MinecraftFolder } from './file_struct';
import * as https from 'https'
import * as fs from 'fs'
import * as path from 'path'
import * as url from 'url'
import { GET, DOWN, DIR, READ, CHECKSUM, UPDATE } from './string_utils'
import * as urls from 'url';

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

        function downloadVersion(type: 'server', versionMeta: VersionMeta, minecraft: MinecraftLocation, checksum?: boolean): Promise<Version>
        function downloadVersion(type: 'client', versionMeta: VersionMeta, minecraft: MinecraftLocation, checksum?: boolean): Promise<Version>
        function downloadVersion(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, checksum?: boolean): Promise<Version>

        function downloadVersionJson(version: VersionMeta, minecraft: MinecraftLocation): Promise<Version>

        function downloadVersionJar(type: 'client', version: Version, minecraft: MinecraftLocation, checksum?: boolean): Promise<Version>
        function downloadVersionJar(type: 'server', version: Version, minecraft: MinecraftLocation, checksum?: boolean): Promise<Version>
        function downloadVersionJar(type: string, version: Version, minecraft: MinecraftLocation, checksum?: boolean): Promise<Version>

        function checkDependency(version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string, assetsHost?: string }): Promise<Version>;
        function downloadLibraries(version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string }): Promise<Version>;
        function downloadAssets(version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, assetsHost?: string }): Promise<Version>;
    }
}

import { Asset, Library, Version, VersionMeta, VersionMetaList } from './version'

Version.updateVersionMeta = function (option?: {
    fallback?: Version.MetaContainer, remote?: string
}): Promise<Version.MetaContainer> {
    if (!option) option = {}
    return UPDATE({
        fallback: option.fallback,
        remote: option.remote || 'https://launchermeta.mojang.com/mc/game/version_manifest.json'
    }).then(result => result as { list: VersionMetaList, date: string })
}

Version.downloadVersion = function downloadVersion(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation, checksum: boolean = true): Promise<Version> {
    return Version.downloadVersionJson(versionMeta, minecraft).then((version) => Version.downloadVersionJar(type, version, minecraft, checksum))
}
Version.downloadVersionJson = async function (version: VersionMeta, minecraft: MinecraftLocation) {
    const folder: MinecraftFolder = typeof minecraft === 'string' ? new MinecraftFolder(minecraft) : minecraft
    let json = folder.getVersionJson(version.id)
    await DIR(folder.getVersionRoot(version.id))
    if (!fs.existsSync(json)) await new Promise<void>((res, rej) => {
        let jsonStream = fs.createWriteStream(json)
        let u = url.parse(version.url)
        https.get({ host: u.host, path: u.path }, res => res.pipe(jsonStream)).on('error', (e) => rej(e))
        jsonStream.on('finish', () => {
            jsonStream.close();
            res()
        })
    });
    let versionInstance = Version.parse(minecraft, version.id)
    if (versionInstance) return versionInstance
    else throw new Error('Cannot parse version')
}
Version.downloadVersionJar = async function (type: string, version: Version, minecraft: MinecraftLocation, checksum: boolean = false): Promise<Version> {
    const folder: MinecraftFolder = typeof minecraft === 'string' ? new MinecraftFolder(minecraft) : minecraft
    await DIR(folder.getVersionRoot(version.version))
    let filename = type == 'client' ? version.version + '.jar' : version.version + '-' + type + '.jar'
    let jar = path.join(folder.getVersionRoot(version.version), filename)
    const exist = fs.existsSync(jar)
    if (!exist)
        await DOWN(version.downloads[type].url, jar)
    if (checksum) {
        let hash = await CHECKSUM(jar)
        if (hash != version.downloads[type].sha1 && exist) {
            await DOWN(version.downloads[type].url, jar)
            hash = await CHECKSUM(jar)
        }
        if (hash != version.downloads[type].sha1)
            throw new Error('SHA1 not matched! Probably caused by the incompleted file or illegal file source!')
    }
    return version
}
Version.checkDependency = function (version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string, assetsHost?: string }): Promise<Version> {
    return Promise.all([this.downloadAssets(version, minecraft, option), this.downloadLibraries(version, minecraft, option)]).then(v => version)
}

async function downloadLib(lib: any, folder: any, libraryHost: any, checksum: any) {
    if (lib.downloadInfo) {
        const rawPath = lib.downloadInfo.path
        const filePath = path.join(folder.libraries, rawPath)
        const dirPath = path.dirname(filePath)
        const exist = fs.existsSync(filePath);
        const rpath = libraryHost || lib.customizedUrl || 'https://libraries.minecraft.net'
        if (!exist) {
            if (!fs.existsSync(dirPath)) await DIR(dirPath)
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
Version.downloadLibraries = async function (version: Version, minecraft: MinecraftLocation, option?: { checksum?: boolean, libraryHost?: string }): Promise<Version> {
    const folder: MinecraftFolder = typeof minecraft === 'string' ? new MinecraftFolder(minecraft) : minecraft
    let all = []
    const libraryHost = option ? option.libraryHost : undefined
    const checksum = option ? option.checksum : true;
    try {
        await Promise.all(version.libraries.map(lib => downloadLib(lib, folder, libraryHost, checksum)))
    }
    catch (e) {
        throw e;
    }
    return version;
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
        await DIR(dir)
        await DOWN(`${assetsHost}/${head}/${hash}`, file)
    }
    if (checksum) {
        let sum = await CHECKSUM(file)
        if (sum != hash && exist) {// if exist, re-download
            await DIR(dir)
            await DOWN(`${assetsHost}/${head}/${hash}`, file)
            sum = await CHECKSUM(file)
        }
        if (sum != hash)
            throw new Error(`SHA1 not matched!\n${sum}\n${hash}\n@${file}\n Probably caused by the incompleted file or illegal file source!`)
    }
}
Version.downloadAssets = async function (version: Version, minecraft: MinecraftLocation, option?: {
    checksum?: boolean, assetsHost?: string, cb?: (name: string, progress: number) => void
}): Promise<Version> {
    const folder: MinecraftFolder = typeof minecraft === 'string' ? new MinecraftFolder(minecraft) : minecraft
    let jsonPath = folder.getPath('assets', 'indexes', version.assets + '.json')
    if (!fs.existsSync(jsonPath)) {
        await DIR(path.join(folder.assets, 'indexes'))
        await DOWN(version.assetIndexDownloadInfo.url, jsonPath)
    }
    let content: any = JSON.parse(await READ(jsonPath)).objects
    await DIR(folder.getPath('assets', 'objects'))
    const assetsHost = option ? option.assetsHost || 'https://resources.download.minecraft.net' : 'https://resources.download.minecraft.net';
    const checksum = option ? option.checksum ? option.checksum : false : false;
    try {
        await Object.keys(content).map(key => downloadAsset(content, key, folder, assetsHost, checksum))
    }
    catch (e) {
        throw e;
    }
    return version;
}


