import UPDATE from './utils/update';
import Task from 'treelike-task'
import { downloadTask } from './utils/download';
import { MinecraftLocation, MinecraftFolder } from './utils/folder';
import { Version } from './version'
import * as fs from 'fs-extra';
import * as path from 'path'
import * as url from 'url'
import * as Zip from 'jszip'
import Mod from './mod';

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
        export function update(option?: {
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
                    const url = result.list.versions[mcversion].repo.url;
                    if (snapshots) {
                        const { stream, file, version, md5, timestamp, tweakClass, libraries } = snapshots['com.mumfrey:liteloader'].latest;
                        const type = (stream === 'RELEASE' ? 'RELEASE' : 'SNAPSHOT');
                        versions.snapshot = {
                            url,
                            type,
                            file,
                            version,
                            md5,
                            timestamp,
                            mcversion,
                            tweakClass,
                            libraries,
                        }
                    }
                    if (artifacts) {
                        const { stream, file, version, md5, timestamp, tweakClass, libraries } = artifacts['com.mumfrey:liteloader'].latest;
                        const type = (stream === 'RELEASE' ? 'RELEASE' : 'SNAPSHOT');
                        versions.release = {
                            url,
                            type,
                            file,
                            version,
                            md5,
                            timestamp,
                            mcversion,
                            tweakClass,
                            libraries,
                        }
                    }
                }
                return { list: metalist, date: result.date }
            })
        }
    }

    export interface VersionMeta {
        version: string,
        url: string,
        file: string,
        mcversion: string,
        type: "RELEASE" | "SNAPSHOT",
        md5: string,
        timestamp: string,
        libraries: { name: string, url?: string }[],
        tweakClass: string,
    }

    export async function meta(mod: string | Buffer | Zip) {
        let zip;
        if (mod instanceof Zip)
            zip = mod;
        else if (mod instanceof Buffer)
            zip = await new Zip().loadAsync(mod);
        else if (typeof mod === 'string')
            zip = await new Zip().loadAsync(await fs.readFile(mod));
        else
            throw ('Illegal input type! Expect Buffer or string (filePath)')
        return zip.file('litemod.json').async('nodebuffer').then(data => JSON.parse(data.toString().trim()) as MetaData)
            .then(m => {
                if (!m.version) (m as any).version = `${m.name}:${m.version ? m.version : m.mcversion ? m.mcversion + '_' + m.revision || '0' : m.revision || '0'}`
                return m;
            })
    }

    const snapshotRoot = 'http://dl.liteloader.com/versions/';
    const releaseRoot = 'http://repo.mumfrey.com/content/repositories/liteloader/'

    export function install(meta: VersionMeta, location: MinecraftLocation, version?: string) {
        return installTask(meta, location, version).execute();
    }

    function buildVersionInfo(meta: VersionMeta, mountedJSON: any) {
        const id = `${mountedJSON.id}-Liteloader${meta.mcversion}-${meta.version}`;
        const time = new Date(Number.parseInt(meta.timestamp) * 1000).toISOString();
        const releaseTime = time;
        const type = meta.type;
        const args = mountedJSON.arguments ? mountedJSON.arguments.game : mountedJSON.minecraftArguments.split(' ');
        const libraries = [{
            name: `com.mumfrey:liteloader:${meta.version}`,
            url: type === 'SNAPSHOT' ? snapshotRoot : releaseRoot,
        }, ...meta.libraries];
        const mainClass = 'net.minecraft.launchwrapper.Launch';
        const inheritsFrom = mountedJSON.id;
        const jar = mountedJSON.jar || mountedJSON.id;
        const info: any = {
            id, time, releaseTime, type, libraries, mainClass, inheritsFrom, jar
        };
        if (mountedJSON.arguments) {
            info.arguments = {
                game: args,
                jvm: [...mountedJSON.arguments.jvm]
            }
        } else {
            info.minecraftArguments = args.join(' ');
        }
        return info;
    }

    export function installTask(meta: VersionMeta, location: MinecraftLocation, version?: string): Task<void> {
        return Task.create('installLiteloader', async (context) => {
            const mc: MinecraftFolder = typeof location === 'string' ? new MinecraftFolder(location) : location;
            const mountVersion = version || meta.mcversion;

            if (!fs.existsSync(mc.getVersionJson(mountVersion))) throw new Error(`Version doesn't exist: ${mountVersion}`);
            const mountedJSON: any = await fs.readJson(mc.getVersionJson(mountVersion));
            const versionInf = buildVersionInfo(meta, mountedJSON);
            const versionPath = mc.getVersionRoot(versionInf.id);

            await fs.ensureDir(versionPath);
            await context.execute('writeJson', () => fs.writeFile(path.join(versionPath, versionInf.id + '.json'), JSON.stringify(versionInf, undefined, 4)));

            if (!fs.existsSync(versionPath))
                await fs.ensureDir(versionPath);

            const resolved = await Version.parse(mc, versionInf.id)
            await context.execute('checkDependency', Version.checkDependenciesTask(resolved, mc).work);
        });
    }
    export function installLiteloaderAsMod(meta: VersionMeta, filePath: string) {

    }
}

Mod.register('liteloader', option =>
    LiteLoader.meta(option)
        .then(m => [new Mod<LiteLoader.MetaData>(`${m.name}:${m.version}`, m)]))

export default LiteLoader;