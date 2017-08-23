import { GET, DOWN, DIR, CHECKSUM, UPDATE, READB } from './utils';
import { MinecraftFolder, MinecraftLocation } from './file_struct';
import download from './utils/download'
import * as path from 'path'
import * as zip from 'jszip'
import * as fs from 'fs-extra'
import { Version } from './version';

export namespace Forge {
    export interface VersionMetaList {
        adfocus: string,
        artifact: string,
        branches: { [key: string]: number[] }, //sort by github branch
        mcversion: { [key: string]: number[] }, //sort by mcversion
        homepage: string,
        webpath: string,
        name: string,
        promos: { [key: string]: number }, //list all latest
        number: { [key: string]: VersionMeta } //search by number
    }

    export namespace VersionMetaList {
        export async function update(option?: {
            fallback?: {
                list: VersionMetaList, date: string
            }, remote?: string
        }): Promise<{ list: VersionMetaList, date: string }> {
            if (!option) option = {}
            return UPDATE({
                fallback: option.fallback,
                remote: option.remote || 'http://files.minecraftforge.net/maven/net/minecraftforge/forge/json'
            }).then(result => result as { list: VersionMetaList, date: string })
        }
    }

    export interface VersionMeta {
        branch: string | null,
        build: number,
        files: [string, string, string][],
        mcversion: string,
        modified: number,
        version: string
    }

    export namespace VersionMeta {
        export async function installForge(version: VersionMeta, minecraft: MinecraftLocation, checksum: boolean = false,
            maven: string = 'http://files.minecraftforge.net/maven'): Promise<Version> {
            const mc = typeof minecraft === 'string' ? new MinecraftFolder(minecraft) : minecraft;
            let versionPath = `${version.mcversion}-${version.version}`
            let universalURL = `${maven}/net/minecraftforge/forge/${versionPath}/forge-${versionPath}-universal.jar`
            let installerURL = `${maven}/net/minecraftforge/forge/${versionPath}/forge-${versionPath}-installer.jar`
            let localForgePath = `${version.mcversion}-forge-${version.version}`
            let root = mc.getVersionRoot(localForgePath)
            let filePath = path.join(root, `${localForgePath}.jar`)
            let jsonPath = path.join(root, `${localForgePath}.json`)
            if (!fs.existsSync(root))
                await DIR(root)
            if (!fs.existsSync(filePath)) {
                try {
                    await download(universalURL, filePath)
                }
                catch (e) {
                    await fs.outputFile(filePath,
                        await zip(await download(installerURL))
                            .file(`forge-${versionPath}-universal.jar`)
                            .async('nodebuffer'))
                }
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
            if (!fs.existsSync(jsonPath)) {
                new Zip(filePath).extractEntryTo('version.json', path.dirname(jsonPath), false, true)//TODO performance?
                await new Promise((resolve, reject) => {
                    fs.rename(path.join(path.dirname(jsonPath), 'version.json'), jsonPath, (err) => {
                        if (err) reject(err)
                        else resolve()
                    })
                });
            }
            return Version.parse(minecraft, localForgePath)
        }
    }
}
