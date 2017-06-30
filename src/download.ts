import { Asset, Library, Version } from './version'
import { MinecraftLocation } from './file_struct'
import * as https from 'https'
import * as fs from 'fs'
import * as path from 'path'
import * as url from 'url'
import { GET, DOWN, DIR, READ } from './string_utils'
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

export interface VersionDownloader {

    fetchVersionList(): Promise<VersionMetaList>

    downloadVersion(versionMeta: VersionMeta, minecraft: MinecraftLocation): Promise<Version>

    downloadVersionJson(version: VersionMeta, minecraft: MinecraftLocation): Promise<Version>
    downloadVersionJar(type: string, version: Version, minecraft: MinecraftLocation): Promise<Version>
    downloadVersionJar(type: 'client', version: Version, minecraft: MinecraftLocation): Promise<Version>
    downloadVersionJar(type: 'server', version: Version, minecraft: MinecraftLocation): Promise<Version>

    checkDependencies(version: Version, minecraft: MinecraftLocation): Promise<Version>
    downloadLibraries(version: Version, minecraft: MinecraftLocation): Promise<Version>
    downloadAssets(version: Version, minecraft: MinecraftLocation): Promise<Version>
}

export namespace VersionDownloader {
    export interface API {
        readonly versions: string
        readonly library: string
        readonly assets: string
    }
    export function mojang(): API {
        return {
            versions: 'https://launchermeta.mojang.com/mc/game/version_manifest.json',
            library: 'https://libraries.minecraft.net',
            assets: 'https://resources.download.minecraft.net'
        }
    }
}
export class MojangRepository implements VersionDownloader {
    constructor(private api: VersionDownloader.API = VersionDownloader.mojang()) { }
    fetchVersionList() {
        return GET(this.api.versions).then(r => JSON.parse(r))
    }

    downloadVersion(versionMeta: VersionMeta, minecraft: MinecraftLocation) {
        return this.downloadVersionJson(versionMeta, minecraft)
            .then((version) => this.downloadVersionJar('client', version, minecraft))
    }

    async downloadVersionJson(version: VersionMeta, minecraft: MinecraftLocation) {
        let json = minecraft.getVersionJson(version.id)
        await DIR(minecraft.getVersionRoot(version.id))
        if (!fs.existsSync(json)) await new Promise<void>((res, rej) => {
            let jsonStream = fs.createWriteStream(json)
            let u = url.parse(version.url)
            https.get({ host: u.host, path: u.path }, (res) => res.pipe(jsonStream)).on('error', (e) => rej(e))
            jsonStream.on('finish', () => {
                jsonStream.close();
                res()
            })
        });
        let versionInstance = Version.parse(minecraft.root, version.id)
        if (versionInstance) return versionInstance
        else throw new Error('Cannot parse version')
    }

    async downloadVersionJar(type: string, version: Version, minecraft: MinecraftLocation) {
        await DIR(minecraft.getVersionRoot(version.version))
        let filename = type == 'client' ? version.version + '.jar' : version.version + '-' + type + '.jar'
        let jar = path.join(minecraft.getVersionRoot(version.version), filename)
        if (fs.existsSync(jar))
            return version
        await new Promise<void>((acc, den) => {
            let jarStream = fs.createWriteStream(jar)
            let u = url.parse(version.downloads[type].url)
            https.get({ host: u.host, path: u.path }, (res) => res.pipe(jarStream)).on('error', (e) => den(e))
            jarStream.on('finish', () => {
                jarStream.close();
                acc()
            })
        })
        return version
    }

    async downloadLibraries(version: Version, minecraft: MinecraftLocation): Promise<Version> {
        let list = []
        for (let lib of version.libraries) {
            if (lib.downloadInfo) {
                const rawPath = lib.downloadInfo.path
                let filePath = path.join(minecraft.libraries, rawPath)
                let dirPath = path.dirname(filePath)

                if (!fs.existsSync(filePath)) {
                    if (!fs.existsSync(dirPath))
                        await DIR(dirPath)
                    list.push(DOWN(this.api.library + "/" + rawPath, filePath))
                }
            }
        }
        return Promise.all(list).then(v => version)
    }
    checkDependencies(version: Version, minecraft: MinecraftLocation): Promise<Version> {
        return Promise.all([this.downloadAssets(version, minecraft), this.downloadLibraries(version, minecraft)]).then(v => version)
    }

    async downloadAssets(version: Version, minecraft: MinecraftLocation): Promise<Version> {
        let jsonPath = minecraft.getPath('assets', 'indexes', version.assets + '.json')
        if (!fs.existsSync(jsonPath)) {
            await DIR(path.join(minecraft.assets, 'indexes'))
            await DOWN(version.assetIndexDownloadInfo.url, jsonPath)
        }
        let content: any = JSON.parse(await READ(jsonPath)).objects

        await DIR(minecraft.getPath('assets', 'objects'))
        let list = []
        for (var key in content) {
            if (content.hasOwnProperty(key)) {
                var element = content[key];
                let hash: string = element.hash
                let head = hash.substring(0, 2)
                let dir = minecraft.getPath('assets', 'objects', head)
                let file = path.join(dir, hash)
                if (!fs.existsSync(file)) {
                    await DIR(dir)
                    list.push(DOWN(this.api.library + '/' + key, file))
                }
            }
        }
        return Promise.all(list).then(r => version)
    }
}

