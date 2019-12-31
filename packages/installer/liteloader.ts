import { MinecraftFolder, MinecraftLocation } from "@xmcl/core";
import { ensureDir, missing, readFile, writeFile, validateMd5 } from "@xmcl/core/fs";
import Task from "@xmcl/task";
import { join } from "path";
import { getIfUpdate, UpdatedObject } from "./net";

export namespace LiteLoaderInstaller {
    export const DEFAULT_VERSION_MANIFEST = "http://dl.liteloader.com/versions/versions.json";
    export interface VersionMetaList extends UpdatedObject {
        meta: {
            description: string,
            authors: string,
            url: string,
            updated: string,
            updatedTime: number,
        };
        versions: { [version: string]: { snapshot?: VersionMeta, release?: VersionMeta } };
    }
    function processLibraries(lib: { name: string, url?: string }) {
        if (Object.keys(lib).length === 1 && lib.name) {
            if (lib.name.startsWith("org.ow2.asm")) {
                lib.url = "https://files.minecraftforge.net/maven/";
            }
        }
        return lib;
    }
    export namespace VersionMetaList {

        function parse(content: string) {
            const result = JSON.parse(content);
            const metalist = { meta: result.meta, versions: {} };
            for (const mcversion in result.versions) {
                const versions: { release?: VersionMeta, snapshot?: VersionMeta }
                    = (metalist.versions as any)[mcversion] = {};
                const snapshots = result.versions[mcversion].snapshots;
                const artifacts = result.versions[mcversion].artefacts; // that's right, artefact
                const url = result.versions[mcversion].repo.url;
                if (snapshots) {
                    const { stream, file, version, md5, timestamp, tweakClass, libraries } = snapshots["com.mumfrey:liteloader"].latest;
                    const type = (stream === "RELEASE" ? "RELEASE" : "SNAPSHOT");
                    versions.snapshot = {
                        url,
                        type,
                        file,
                        version,
                        md5,
                        timestamp,
                        mcversion,
                        tweakClass,
                        libraries: libraries.map(processLibraries),
                    };
                }
                if (artifacts) {
                    const { stream, file, version, md5, timestamp, tweakClass, libraries } = artifacts["com.mumfrey:liteloader"].latest;
                    const type = (stream === "RELEASE" ? "RELEASE" : "SNAPSHOT");
                    versions.release = {
                        url,
                        type,
                        file,
                        version,
                        md5,
                        timestamp,
                        mcversion,
                        tweakClass,
                        libraries: libraries.map(processLibraries),
                    };
                }
            }
            return metalist;
        }
        export function update(): Promise<VersionMetaList>;
        export function update(option?: { fallback: VersionMetaList, remote?: string }): Promise<VersionMetaList>;
        export function update(option?: { remote?: string }): Promise<VersionMetaList | undefined>;
        export function update(option?: { fallback: undefined, remote?: string }): Promise<VersionMetaList | undefined>;
        export async function update(option: { fallback?: VersionMetaList, remote?: string } = {}): Promise<VersionMetaList | undefined> {
            return getIfUpdate(option.remote || DEFAULT_VERSION_MANIFEST, parse, option.fallback);
        }
    }

    export interface VersionMeta {
        version: string;
        url: string;
        file: string;
        mcversion: string;
        type: "RELEASE" | "SNAPSHOT";
        md5: string;
        timestamp: string;
        libraries: Array<{ name: string, url?: string }>;
        tweakClass: string;
    }

    const snapshotRoot = "http://dl.liteloader.com/versions/";
    const releaseRoot = "http://repo.mumfrey.com/content/repositories/liteloader/";

    function buildVersionInfo(versionMeta: VersionMeta, mountedJSON: any) {
        const id = `${mountedJSON.id}-Liteloader${versionMeta.mcversion}-${versionMeta.version}`;
        const time = new Date(Number.parseInt(versionMeta.timestamp, 10) * 1000).toISOString();
        const releaseTime = time;
        const type = versionMeta.type;
        const args = mountedJSON.arguments ? mountedJSON.arguments.game : mountedJSON.minecraftArguments.split(" ");
        const libraries = [
            {
                name: `com.mumfrey:liteloader:${versionMeta.version}`,
                url: type === "SNAPSHOT" ? snapshotRoot : releaseRoot,
            }, ...versionMeta.libraries.map(processLibraries)
        ];
        const mainClass = "net.minecraft.launchwrapper.Launch";
        const inheritsFrom = mountedJSON.id;
        const jar = mountedJSON.jar || mountedJSON.id;
        const info: any = {
            id, time, releaseTime, type, libraries, mainClass, inheritsFrom, jar,
        };
        if (mountedJSON.arguments) {
            info.arguments = {
                game: ["--tweakClass", versionMeta.tweakClass, ...args],
                jvm: [...mountedJSON.arguments.jvm],
            };
        } else {
            args.unshift(versionMeta.tweakClass);
            args.unshift("--tweakClass");
            info.minecraftArguments = args.join(" ");
        }
        return info;
    }

    export function install(versionMeta: VersionMeta, location: MinecraftLocation, version?: string) {
        return Task.execute(installTask(versionMeta, location, version)).wait();
    }

    export function installTask(versionMeta: VersionMeta, location: MinecraftLocation, version?: string): Task<void> {
        return async function installLiteloader(context) {
            const mc: MinecraftFolder = MinecraftFolder.from(location);
            const mountVersion = version || versionMeta.mcversion;
            const id = `${mountVersion}-Liteloader${versionMeta.mcversion}-${versionMeta.version}`;

            if (await validateMd5(mc.getVersionJson(id), versionMeta.md5)) {
                return;
            }
            const mountedJSON: any = await context.execute(async function resolveVersionJson() {
                if (await missing(mc.getVersionJson(mountVersion))) {
                    throw { type: "MissingVersionJson", version: mountVersion, location: mc.root };
                }
                return readFile(mc.getVersionJson(mountVersion)).then((b) => b.toString()).then(JSON.parse);
            });

            const versionInf = await context.execute(async function generateLiteloaderJson() {
                const inf = buildVersionInfo(versionMeta, mountedJSON);
                const versionPath = mc.getVersionRoot(inf.id);

                await ensureDir(versionPath);
                await writeFile(join(versionPath, inf.id + ".json"), JSON.stringify(inf, undefined, 4));
                return inf;
            });
        };
    }

    export function installAndCheck(versionMeta: VersionMeta, location: MinecraftLocation, version?: string) {
        return Task.execute(installTask(versionMeta, location, version)).wait();
    }
}

export default LiteLoaderInstaller;
