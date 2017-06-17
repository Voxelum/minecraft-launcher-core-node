import { Asset, Library } from './version'
import * as https from 'https'

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

export interface MinecraftRepository {
    fetchVersionList(): Promise<VersionMetaList>
    downloadLibrary(Library: Library): Promise<void>
    downloadAsset(asset: Asset): Promise<void>
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

