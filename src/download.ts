import { Asset, Library, Version } from './version'
import { MinecraftLocation } from './file_struct'
import * as https from 'https'
import * as fs from 'fs'
import * as path from 'path'
import * as url from 'url'
import { GET } from './string_utils'
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
}
export interface AssetsDownloader {
    downloadLibrary(Library: Library, minecraft: MinecraftLocation, callback: () => void): void
    downloadAsset(asset: Asset, minecraft: MinecraftLocation, callback: () => void): void
}

export class MojangRepository implements VersionDownloader {
    fetchVersionList() {
        return GET('https://launchermeta.mojang.com/mc/game/version_manifest.json').then(r => JSON.parse(r))
    }

    downloadVersion(versionMeta: VersionMeta, minecraft: MinecraftLocation) {
        return this.downloadVersionJson(versionMeta, minecraft)
            .then((version) => this.downloadVersionJar('client', version, minecraft))
    }

    private checkDir(version: string, minecraft: MinecraftLocation) {
        let v = minecraft.versions
        if (!fs.existsSync(v)) fs.mkdirSync(v)
        let vR = minecraft.getVersionRoot(version)
        if (!fs.existsSync(vR)) fs.mkdirSync(vR)
    }
    async downloadVersionJson(version: VersionMeta, minecraft: MinecraftLocation) {
        let json = minecraft.getVersionJson(version.id)
        this.checkDir(version.id, minecraft)
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
        this.checkDir(version.version, minecraft)
        let filename = type == 'client' ? version.version + '.jar' : version.version + '-' + type + '.jar'
        let jar = path.join(minecraft.getVersionRoot(version.version), filename)
        if (fs.existsSync(jar))
            return version
        await new Promise<void>((acc, den) => {
            let jsonStream = fs.createWriteStream(jar)
            let u = url.parse(version.downloads[type].url)
            https.get({ host: u.host, path: u.path }, (res) => res.pipe(jsonStream)).on('error', (e) => den(e))
            jsonStream.on('finish', () => {
                jsonStream.close();
                acc()
            })
        })
        return version
    }
}

export namespace MinecraftRepository {
    // export function defaultVersionList(): Promise<VersionMetaList> {
    //     return new Promise((resolve, reject) => {
    //         https.request({
    //             host: ""
    //         })
    //     });
    // }
}

