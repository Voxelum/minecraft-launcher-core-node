import UPDATE from './utils/update';
import download from './utils/download';
import * as fs from 'fs-extra';
import * as path from 'path'
import * as url from 'url'

import { MinecraftLocation, MinecraftFolder } from './file_struct';

export interface LiteVersionMetaList {
    meta: {
        description: string,
        authors: string,
        url: string,
        updated: string,
        updatedTime: number
    }
    versions: { [version: string]: { snapshot?: LiteVersionMeta, release?: LiteVersionMeta } }
}
export namespace LiteVersionMetaList {
    export async function update(option?: {
        fallback?: {
            list: LiteVersionMetaList, date: string
        }, remote?: string
    }): Promise<{ list: LiteVersionMetaList, date: string }> {
        if (!option) option = {}
        return UPDATE({
            fallback: option.fallback,
            remote: option.remote || 'http://dl.liteloader.com/versions/versions.json'
        }).then(result => {
            let metalist = { meta: result.list.meta, versions: {} };
            for (let mcversion in result.list.versions) {
                const versions: { release?: LiteVersionMeta, snapshot?: LiteVersionMeta }
                    = (metalist.versions as any)[mcversion] = {}
                const snapshots = result.list.versions[mcversion].snapshots;
                const artifacts = result.list.versions[mcversion].artefacts; //that's right, artefact
                if (snapshots) {
                    const { stream, file, version, md5, timestamp } = snapshots['com.mumfrey:liteloader'].latest;
                    const type = (stream === 'RELEASE' ? 'RELEASE' : 'SNAPSHOT');
                    versions.snapshot = {
                        type,
                        file,
                        version,
                        md5,
                        timestamp,
                        mcversion
                    }
                }
                if (artifacts) {
                    const { stream, file, version, md5, timestamp } = artifacts['com.mumfrey:liteloader'].latest;
                    const type = (stream === 'RELEASE' ? 'RELEASE' : 'SNAPSHOT');
                    versions.release = {
                        type,
                        file,
                        version,
                        md5,
                        timestamp,
                        mcversion
                    }
                }
            }
            return { list: metalist, date: result.date }
        })
    }
}

export interface LiteVersionMeta {
    version: string,
    file: string,
    mcversion: string,
    type: "RELEASE" | "SNAPSHOT",
    md5: string,
    timestamp: string,
}

export namespace LiteVersionMeta {
    const snapshotRoot = 'http://dl.liteloader.com/versions/com/mumfrey/liteloader';
    const releaseRoot = 'http://repo.mumfrey.com/content/repositories/liteloader/com/mumfrey/liteloader'

    export async function installLiteloader(meta: LiteVersionMeta, location: MinecraftLocation) {
        const mc = typeof location === 'string' ? new MinecraftFolder(location) : location
        let targetURL
        if (meta.type === 'SNAPSHOT')
            targetURL = `${snapshotRoot}/${meta.version}/${meta.version}.jar`
        else if (meta.type === 'RELEASE')
            targetURL = `${releaseRoot}/${meta.version}/${meta.file}`
        else throw new Error("Unknown meta type: " + meta.type)

        let jsonURL = `https://raw.githubusercontent.com/Mumfrey/LiteLoaderInstaller/${meta.mcversion}/src/main/resources/install_profile.json`
        const liteloaderPath = `${meta.mcversion}-Liteloader-${meta.version}`
        const versionPath = mc.getVersionRoot(liteloaderPath)
        if (!fs.existsSync(versionPath))
            await fs.mkdirp(versionPath)
        return Promise.all([
            download(targetURL, path.join(versionPath, liteloaderPath + '.jar')),
            download(jsonURL, path.join(versionPath, liteloaderPath + '.json'))
        ])
    }

    export function installLiteloaderAsMod(meta: LiteVersionMeta, filePath: string) {

    }
}