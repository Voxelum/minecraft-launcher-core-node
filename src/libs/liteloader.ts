import * as fs from "fs";
import * as path from "path";
import Task from "treelike-task";
import { bufferEntry, open, parseEntries, ZipFile } from "yauzlw";
import { MinecraftFolder, MinecraftLocation } from "../../packages/util/folder";
import { ensureDir } from "../../packages/util/fs";
import { getIfUpdate, UpdatedObject } from "../../packages/util/network";
import { Version } from "./version";

export namespace LiteLoader {
    export const DEFAULT_VERSION_MANIFEST = "http://dl.liteloader.com/versions/versions.json";
    export interface MetaData {
        readonly mcversion: string;
        readonly name: string;
        readonly revision: number;

        readonly author?: string;
        readonly version?: string;
        readonly description?: string;
        readonly url?: string;

        readonly tweakClass?: string;
        readonly dependsOn?: string[];
        readonly injectAt?: string;
        readonly requiredAPIs?: string[];
        readonly classTransformerClasses?: string[];
    }
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
        export async function update(option: { fallback?: VersionMetaList, remote?: string } = {}): Promise<VersionMetaList> {
            const fallback = option.fallback || { timestamp: "" };
            const result = await getIfUpdate(option.remote || DEFAULT_VERSION_MANIFEST, parse, { timestamp: fallback.timestamp });
            if (result.timestamp === fallback.timestamp) {
                return fallback as VersionMetaList;
            }
            return result as VersionMetaList;
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

    export async function meta(mod: string | Buffer | ZipFile) {
        let zip: ZipFile;
        if (mod instanceof ZipFile) {
            zip = mod;
        } else if (mod instanceof Buffer) {
            zip = await open(mod);
        } else if (typeof mod === "string" && fs.existsSync(mod)) {
            zip = await open(mod);
        } else {
            throw {
                type: "IllegalInputType",
                message: "Illegal input type! Expect Buffer or string (filePath)",
                mod,
            };
        }
        const { "litemod.json": entry } = await parseEntries(zip, ["litemod.json"]);
        if (entry == null) {
            throw {
                type: "IllegalInputType",
                message: "Illegal input type! Expect a jar file contains litemod.json",
                mod,
            };
        }
        const data = await bufferEntry(zip, entry);
        zip.close();
        const metadata = JSON.parse(data.toString().trim(), (key, value) => key === "revision" ? Number.parseInt(value, 10) : value) as MetaData;
        if (!metadata.version) {
            (metadata as any).version = `${metadata.mcversion}:${metadata.revision || 0}`;
        }
        return metadata;
    }

    const snapshotRoot = "http://dl.liteloader.com/versions/";
    const releaseRoot = "http://repo.mumfrey.com/content/repositories/liteloader/";

    function buildVersionInfo(versionMeta: VersionMeta, mountedJSON: any) {
        const id = `${mountedJSON.id}-Liteloader${versionMeta.mcversion}-${versionMeta.version}`;
        const time = new Date(Number.parseInt(versionMeta.timestamp, 10) * 1000).toISOString();
        const releaseTime = time;
        const type = versionMeta.type;
        const args = mountedJSON.arguments ? mountedJSON.arguments.game : mountedJSON.minecraftArguments.split(" ");
        const libraries = [{
            name: `com.mumfrey:liteloader:${versionMeta.version}`,
            url: type === "SNAPSHOT" ? snapshotRoot : releaseRoot,
        }, ...versionMeta.libraries.map(processLibraries)];
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
        return installTask(versionMeta, location, version).execute();
    }

    export function installTask(versionMeta: VersionMeta, location: MinecraftLocation, version?: string): Task<void> {
        return Task.create("installLiteloader", async (context) => {
            const mc: MinecraftFolder = typeof location === "string" ? new MinecraftFolder(location) : location;
            const mountVersion = version || versionMeta.mcversion;

            const mountedJSON: any = await context.execute("resolveMinecraftVersionJson", async () => {
                if (!fs.existsSync(mc.getVersionJson(mountVersion))) { throw { type: "MissingVersionJson", version: mountVersion, location: mc.root }; }
                return fs.promises.readFile(mc.getVersionJson(mountVersion)).then((b) => b.toString()).then(JSON.parse);
            });

            await context.execute("generateLiteloaderJson", async () => {
                const versionInf = buildVersionInfo(versionMeta, mountedJSON);
                const versionPath = mc.getVersionRoot(versionInf.id);

                await ensureDir(versionPath);
                await fs.promises.writeFile(path.join(versionPath, versionInf.id + ".json"), JSON.stringify(versionInf, undefined, 4));
            });
        });
    }

    export function installAndCheck(versionMeta: VersionMeta, location: MinecraftLocation, version?: string) {
        return installAndCheckTask(versionMeta, location, version).execute();
    }

    export function installAndCheckTask(versionMeta: VersionMeta, location: MinecraftLocation, version?: string): Task<void> {
        return Task.create("installLiteloader", async (context) => {
            const mc: MinecraftFolder = typeof location === "string" ? new MinecraftFolder(location) : location;
            const mountVersion = version || versionMeta.mcversion;

            const mountedJSON: any = await context.execute("resolveMinecraftVersionJson", async () => {
                if (!fs.existsSync(mc.getVersionJson(mountVersion))) { throw { type: "MissingVersionJson", version: mountVersion, location: mc.root }; }
                return fs.promises.readFile(mc.getVersionJson(mountVersion)).then((b) => b.toString()).then(JSON.parse);
            });

            const versionInf = await context.execute("generateLiteloaderJson", async () => {
                const inf = buildVersionInfo(versionMeta, mountedJSON);
                const versionPath = mc.getVersionRoot(inf.id);

                await ensureDir(versionPath);
                await fs.promises.writeFile(path.join(versionPath, inf.id + ".json"), JSON.stringify(inf, undefined, 4));

                return inf;
            });

            await context.execute("checkDependency", async (ctx) => {
                const resolved = await Version.parse(mc, versionInf.id);
                Version.checkDependenciesTask(resolved, mc).work(ctx);
            });
        });
    }
}

export default LiteLoader;
