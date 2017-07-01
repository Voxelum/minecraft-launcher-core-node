import { Asset, Library, Version } from './version'
import { MinecraftLocation } from './file_struct';
import * as https from 'https'
import * as fs from 'fs'
import * as path from 'path'
import * as url from 'url'
import { GET, DOWN, DIR, READ, CHECKSUM } from './string_utils'
import * as urls from 'url';

export interface VersionMetaList {
    latest: {
        snapshot: string,
        release: string
    },
    versions: VersionMeta[]
}

export interface VersionMeta {
    id: string,
    type: string,
    time: string,
    releaseTime: string,
    url: string
}

export class VersionListUpdater {
    constructor(private remote: string) { }
    fetchVersionList(fallback?: { list: VersionMetaList, date: string }): Promise<{ list: VersionMetaList, date: string }> {
        return new Promise((resolve, reject) => {
            let u = url.parse(this.remote)
            let req = https.request({
                host: u.host,
                path: u.path,
                headers: fallback ? { 'If-Modified-Since': fallback.date } : undefined
            }, (res) => {
                if (res.statusCode == 200) {
                    res.setEncoding('utf-8')
                    let buf = ''
                    let last = res.headers['Last-Modified']
                    res.on('data', e => buf += e)
                    res.on('end', () => {
                        let obj = JSON.parse(buf)
                        //TODO check the data
                        resolve({ list: obj, date: last })
                    })
                }
                else if (res.statusCode == 304)
                    resolve(fallback)
            })
            req.on('error', e => reject(e))
            req.end()
        });
    }
}

export namespace VersionDownloader {
    export async function downloadVersionJson(version: VersionMeta, minecraft: MinecraftLocation) {
        let json = minecraft.getVersionJson(version.id)
        await DIR(minecraft.getVersionRoot(version.id))
        if (!fs.existsSync(json)) await new Promise<void>((res, rej) => {
            let jsonStream = fs.createWriteStream(json)
            let u = url.parse(version.url)
            https.get({ host: u.host, path: u.path }, res => res.pipe(jsonStream)).on('error', (e) => rej(e))
            jsonStream.on('finish', () => {
                jsonStream.close();
                res()
            })
        });
        let versionInstance = Version.parse(minecraft.root, version.id)
        if (versionInstance) return versionInstance
        else throw new Error('Cannot parse version')
    }

    export function downloadVersion(type: 'server', versionMeta: VersionMeta, minecraft: MinecraftLocation): Promise<Version>
    export function downloadVersion(type: 'client', versionMeta: VersionMeta, minecraft: MinecraftLocation): Promise<Version>
    export function downloadVersion(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation): Promise<Version>
    export function downloadVersion(type: string, versionMeta: VersionMeta, minecraft: MinecraftLocation): Promise<Version> {
        return downloadVersionJson(versionMeta, minecraft)
            .then((version) => downloadVersionJar(type, version, minecraft))
    }

    export function downloadVersionJar(type: 'client', version: Version, minecraft: MinecraftLocation, checksum?: boolean): Promise<Version>
    export function downloadVersionJar(type: 'server', version: Version, minecraft: MinecraftLocation, checksum?: boolean): Promise<Version>
    export function downloadVersionJar(type: string, version: Version, minecraft: MinecraftLocation, checksum?: boolean): Promise<Version>
    export async function downloadVersionJar(type: string, version: Version, minecraft: MinecraftLocation, checksum: boolean = true): Promise<Version> {
        await DIR(minecraft.getVersionRoot(version.version))
        let filename = type == 'client' ? version.version + '.jar' : version.version + '-' + type + '.jar'
        let jar = path.join(minecraft.getVersionRoot(version.version), filename)
        if (fs.existsSync(jar)) return version
        await new Promise<void>((acc, den) => {
            let jarStream = fs.createWriteStream(jar)
            let u = url.parse(version.downloads[type].url)
            https.get({ host: u.host, path: u.path }, (res) => res.pipe(jarStream)).on('error', (e) => den(e))
            jarStream.on('finish', () => {
                jarStream.close(); acc()
            })
        })
        if (checksum) if (await CHECKSUM(jar) != version.assetIndexDownloadInfo.sha1)
            throw new Error('SHA1 not matched! Probably caused by the incompleted file or illegal file source!')
        return version
    }

}

export class VersionChecker {
    constructor(private libraryHost: string = 'https://libraries.minecraft.net',
        private assetsHost: string = 'https://resources.download.minecraft.net'
    ) { }

    checkDependencies(version: Version, minecraft: MinecraftLocation, checksum: boolean = true): Promise<Version> {
        return Promise.all([this.downloadAssets(version, minecraft, checksum), this.downloadLibraries(version, minecraft, checksum)]).then(v => version)
    }

    async downloadLibraries(version: Version, minecraft: MinecraftLocation, checksum: boolean = true): Promise<Version> {
        let list = []
        for (let lib of version.libraries)
            if (lib.downloadInfo) {
                const rawPath = lib.downloadInfo.path
                let filePath = path.join(minecraft.libraries, rawPath)
                let dirPath = path.dirname(filePath)
                if (!fs.existsSync(filePath)) {
                    if (!fs.existsSync(dirPath)) await DIR(dirPath)
                    let path = lib.customizedUrl || this.libraryHost
                    list.push(DOWN(path + "/" + rawPath, filePath))
                }
            }
        return Promise.all(list).then(v => version)
    }

    async downloadAssets(version: Version, minecraft: MinecraftLocation, checksum: boolean = true): Promise<Version> {
        let jsonPath = minecraft.getPath('assets', 'indexes', version.assets + '.json')
        if (!fs.existsSync(jsonPath)) {
            await DIR(path.join(minecraft.assets, 'indexes'))
            await DOWN(version.assetIndexDownloadInfo.url, jsonPath)
        }
        let content: any = JSON.parse(await READ(jsonPath)).objects
        await DIR(minecraft.getPath('assets', 'objects'))
        let list = []
        for (var key in content) if (content.hasOwnProperty(key)) {
            var element = content[key];
            let hash: string = element.hash
            let head = hash.substring(0, 2)
            let dir = minecraft.getPath('assets', 'objects', head)
            let file = path.join(dir, hash)
            if (!fs.existsSync(file)) {
                await DIR(dir)
                let task = DOWN(this.assetsHost + '/' + key, file)
                if (checksum) if (await task.then(e => CHECKSUM(file)) != element.hash)
                    throw new Error('SHA1 not matched! Probably caused by the incompleted file or illegal file source!')
                list.push(task)
            }
        }
        return Promise.all(list).then(r => version)
    }
}


