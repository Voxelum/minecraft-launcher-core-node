import * as fs from "fs-extra";
import * as Zip from "jszip";
import * as path from "path";
import Task from "treelike-task";
import { MinecraftFolder, MinecraftLocation } from "./utils/folder";
import { getIfUpdate, UpdatedObject } from "./utils/update";
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
                        libraries,
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
                        libraries,
                    };
                }
            }
            return metalist;
        }
        export function update(option: { fallback?: VersionMetaList, remote?: string } = {}): Promise<VersionMetaList> {
            return getIfUpdate(option.remote || DEFAULT_VERSION_MANIFEST,
                parse, option.fallback,
            );
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

    export async function meta(mod: string | Buffer | Zip) {
        let zip;
        if (mod instanceof Zip) {
            zip = mod;
        } else if (mod instanceof Buffer) {
            zip = await new Zip().loadAsync(mod);
        } else if (typeof mod === "string" && fs.existsSync(mod)) {
            zip = await new Zip().loadAsync(await fs.readFile(mod));
        } else {
            throw {
                type: "IllegalInputType",
                message: "Illegal input type! Expect Buffer or string (filePath)",
                mod,
            };
        }
        const json = zip.file("litemod.json");
        if (json == null) {
            throw {
                type: "IllegalInputType",
                message: "Illegal input type! Expect a jar file contains litemod.json",
                mod,
            };
        }
        return json.async("nodebuffer")
            .then((data) => JSON.parse(data.toString().trim(), (key, value) => key === "revision" ? Number.parseInt(value, 10) : value) as MetaData)
            .then((m) => {
                if (!m.version) { (m as any).version = `${m.name}:${m.version ? m.version : m.mcversion ? m.mcversion + "_" + m.revision || "0" : m.revision || "0"}`; }
                return m;
            });
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
        }, ...versionMeta.libraries];
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

            if (!fs.existsSync(mc.getVersionJson(mountVersion))) { throw { type: "MissingVersionJson", version: mountVersion, location: mc.root }; }
            const mountedJSON: any = await fs.readJson(mc.getVersionJson(mountVersion));
            const versionInf = buildVersionInfo(versionMeta, mountedJSON);
            const versionPath = mc.getVersionRoot(versionInf.id);

            await fs.ensureDir(versionPath);
            await context.execute("writeJson", () => fs.writeFile(path.join(versionPath, versionInf.id + ".json"), JSON.stringify(versionInf, undefined, 4)));

            if (!fs.existsSync(versionPath)) {
                await fs.ensureDir(versionPath);
            }
        });
    }

    export function installAndCheck(versionMeta: VersionMeta, location: MinecraftLocation, version?: string) {
        return installAndCheckTask(versionMeta, location, version).execute();
    }

    export function installAndCheckTask(versionMeta: VersionMeta, location: MinecraftLocation, version?: string): Task<void> {
        return Task.create("installLiteloader", async (context) => {
            const mc: MinecraftFolder = typeof location === "string" ? new MinecraftFolder(location) : location;
            const mountVersion = version || versionMeta.mcversion;

            if (!fs.existsSync(mc.getVersionJson(mountVersion))) { throw { type: "MissingVersionJson", version: mountVersion, location: mc.root }; }
            const mountedJSON: any = await fs.readJson(mc.getVersionJson(mountVersion));
            const versionInf = buildVersionInfo(versionMeta, mountedJSON);
            const versionPath = mc.getVersionRoot(versionInf.id);

            await fs.ensureDir(versionPath);
            await context.execute("writeJson", () => fs.writeFile(path.join(versionPath, versionInf.id + ".json"), JSON.stringify(versionInf, undefined, 4)));

            if (!fs.existsSync(versionPath)) {
                await fs.ensureDir(versionPath);
            }

            const resolved = await Version.parse(mc, versionInf.id);
            await context.execute("checkDependency", Version.checkDependenciesTask(resolved, mc).work);
        });
    }
}

export default LiteLoader;
