import { GET, DOWN } from './string_utils';
import { MinecraftLocation } from './file_struct';
import * as path from 'path'
import * as Zip from 'adm-zip';
export interface ForgeVersionMetaList {
    adfocus: string,
    artifact: string,
    branches: { [key: string]: number[] },
    mcversion: { [key: string]: number[] },
    homepage: string,
    webpath: string,
    name: string,
    promos: string[],
    number: { [key: string]: ForgeVersionMeta }
}

export interface ForgeVersionMeta {
    branch: string | null,
    build: number,
    files: [string, string, string][],
    mcversion: string,
    modified: number,
    version: string
}

export interface ForgeVerionDownloader {
    fetchVersionList(): Promise<ForgeVersionMetaList>
}

export class DefaultForgeVersionDownloader {
    constructor(protected api: DefaultForgeVersionDownloader.API = {
        versions: 'http://files.minecraftforge.net/maven/net/minecraftforge/forge/json',
        maven: 'http://files.minecraftforge.net/maven'
    }) { }
    fetchVersionList(): Promise<ForgeVersionMetaList> {
        return GET(this.api.versions).then(s => JSON.parse(s))
    }

    installForge(version: ForgeVersionMeta, minecraft: MinecraftLocation): Promise<void> {
        let versionPath = `${version.mcversion}-${version.version}`
        let url = `${this.api.maven}/net/minecraftforge/forge/${versionPath}/${versionPath}-universal.jar`

        let forgePath = `${version.mcversion}-forge-${versionPath}`
        let root = minecraft.getVersionRoot(forgePath)
        let filePath = path.join(root, `${forgePath}.jar`)

        return DOWN(url, filePath).then(v => {
            let zip = new Zip(filePath)
            zip.extractEntryTo('version.json', path.join(root, `${forgePath}.json`))//TODO performance?
        })
    }
}

export namespace DefaultForgeVersionDownloader {
    export interface API {
        readonly versions: string
        readonly maven: string
    }
}