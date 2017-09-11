import UPDATE from './utils/update';
import download, { DownloadTask } from './utils/download';
import { MinecraftLocation, MinecraftFolder } from './utils/folder';
import * as fs from 'fs-extra';
import * as path from 'path'
import * as url from 'url'
import * as Zip from 'jszip'
import Mod from './mod';
import { AbstractTask, Task } from './utils/task';

export namespace LiteLoader {
    export interface MetaData {
        readonly mcversion: string,
        readonly name: string,
        readonly revision: number,

        readonly author?: string,
        readonly version?: string,
        readonly description?: string,
        readonly url?: string,

        readonly tweakClass?: string,
        readonly dependsOn?: string[],
        readonly injectAt?: string,
        readonly requiredAPIs?: string[],
        readonly classTransformerClasses?: string[]
    }
    export interface VersionMetaList {
        meta: {
            description: string,
            authors: string,
            url: string,
            updated: string,
            updatedTime: number
        }
        versions: { [version: string]: { snapshot?: VersionMeta, release?: VersionMeta } }
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
                remote: option.remote || 'http://dl.liteloader.com/versions/versions.json'
            }).then(result => {
                let metalist = { meta: result.list.meta, versions: {} };
                for (let mcversion in result.list.versions) {
                    const versions: { release?: VersionMeta, snapshot?: VersionMeta }
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

    export interface VersionMeta {
        version: string,
        file: string,
        mcversion: string,
        type: "RELEASE" | "SNAPSHOT",
        md5: string,
        timestamp: string,
    }

    export async function meta(mod: string | Buffer) {
        let zip;
        if (mod instanceof Buffer)
            zip = await new Zip().loadAsync(mod);
        else if (typeof mod === 'string')
            zip = await new Zip().loadAsync(await fs.readFile(mod));
        else
            throw ('Illegal input type! Expect Buffer or string (filePath)')
        return zip.file('litemod.json').async('nodebuffer').then(data => JSON.parse(data.toString()) as MetaData)
            .then(m => {
                if (!m.version) (m as any).version = `${m.name}:${m.version ? m.version : m.mcversion ? m.mcversion + '_' + m.revision || '0' : m.revision || '0'}`
                return m;
            })
    }

    const snapshotRoot = 'http://dl.liteloader.com/versions/com/mumfrey/liteloader';
    const releaseRoot = 'http://repo.mumfrey.com/content/repositories/liteloader/com/mumfrey/liteloader'

    export function install(meta: VersionMeta, location: MinecraftLocation) {
        return Task.execute(new InstallTask(meta, location))
    }
    export function installTask(meta: VersionMeta, location: MinecraftLocation): Task<void> {
        return new InstallTask(meta, location)
    }
    class InstallTask extends AbstractTask<void>{
        constructor(readonly meta: VersionMeta, readonly location: MinecraftLocation) { super() }
        async execute(context: Task.Context): Promise<void> {
            const { location, meta } = this;
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
                await fs.ensureDir(versionPath)
            await Promise.all([
                context.execute(new DownloadTask('downloadJar', targetURL, path.join(versionPath, liteloaderPath + '.jar'))),
                context.execute(new DownloadTask('downloadJson', jsonURL, path.join(versionPath, liteloaderPath + '.json')))
            ])
        }
    }
    export function installLiteloaderAsMod(meta: VersionMeta, filePath: string) {

    }
}
Mod.register('liteloader', option => LiteLoader.meta(option).then(m => new Mod<LiteLoader.MetaData>('liteloader', `${m.name}:${m.version}`, m)))

export default LiteLoader;