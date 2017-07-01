import { GET, DOWN, DIR, CHECKSUM } from './string_utils';
import { MinecraftLocation } from './file_struct';
import * as path from 'path'
import * as Zip from 'adm-zip';
import * as fs from 'fs'
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
    fetchVersionList(): Promise<ForgeVersionMetaList>,
    installForge(version: ForgeVersionMeta, minecraft: MinecraftLocation, checksum?: boolean): Promise<void>
}

export class DefaultForgeVersionDownloader implements ForgeVerionDownloader {
    constructor(protected api: DefaultForgeVersionDownloader.API = {
        versions: 'http://files.minecraftforge.net/maven/net/minecraftforge/forge/json',
        maven: 'http://files.minecraftforge.net/maven'
    }) { }
    fetchVersionList(): Promise<ForgeVersionMetaList> {
        return GET(this.api.versions).then(s => JSON.parse(s))
    }

    async installForge(version: ForgeVersionMeta, minecraft: MinecraftLocation, checksum: boolean = false): Promise<void> {
        let versionPath = `${version.mcversion}-${version.version}`
        let url = `${this.api.maven}/net/minecraftforge/forge/${versionPath}/${versionPath}-universal.jar`

        let forgePath = `${version.mcversion}-forge-${versionPath}`
        let root = minecraft.getVersionRoot(forgePath)
        let filePath = path.join(root, `${forgePath}.jar`)
        let jsonPath = path.join(root, `${forgePath}.json`)
        if (!fs.existsSync(root))
            await DIR(root)
        if (!fs.existsSync(filePath)) {
            await DOWN(url, filePath)
            if (checksum) {
                let sum
                if (version.files[2] &&
                    version.files[2][1] == 'universal' &&
                    version.files[2][2] &&
                    await CHECKSUM(filePath) != version.files[2][2])
                    throw new Error('Checksum not matched! Probably caused by incompleted file or illegal file source.')
                else
                    for (let arr of version.files)
                        if (arr[1] == 'universal')
                            if (await CHECKSUM(filePath) != arr[2])
                                throw new Error('Checksum not matched! Probably caused by incompleted file or illegal file source.')
            }
        }
        if (!fs.existsSync(jsonPath))
            new Zip(filePath).extractEntryTo('version.json', path.join(root, `${forgePath}.json`))//TODO performance?
    }
}

export namespace DefaultForgeVersionDownloader {
    export interface API {
        readonly versions: string
        readonly maven: string
    }
}