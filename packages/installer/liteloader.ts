import { MinecraftFolder, MinecraftLocation } from "@xmcl/core";
import { Task, task } from "@xmcl/task";
import { readFile, writeFile } from 'fs/promises';
import { join } from "path";
import { Dispatcher, request } from 'undici';
import { ensureDir, InstallOptions, missing } from "./utils";

export const DEFAULT_VERSION_MANIFEST = "http://dl.liteloader.com/versions/versions.json";
/**
 * The liteloader version list. Containing the minecraft version -> liteloader version info mapping.
 */
export interface LiteloaderVersionList {
    meta: {
        description: string,
        authors: string,
        url: string,
        updated: string,
        updatedTime: number,
    };
    versions: { [version: string]: { snapshot?: LiteloaderVersion, release?: LiteloaderVersion } };
}
function processLibraries(lib: { name: string, url?: string }) {
    if (Object.keys(lib).length === 1 && lib.name) {
        if (lib.name.startsWith("org.ow2.asm")) {
            lib.url = "https://files.minecraftforge.net/maven/";
        }
    }
    return lib;
}
export namespace LiteloaderVersionList {
    export function parse(content: string) {
        const result = JSON.parse(content);
        const metalist = { meta: result.meta, versions: {} };
        for (const mcversion in result.versions) {
            const versions: { release?: LiteloaderVersion, snapshot?: LiteloaderVersion }
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

}

/**
 * A liteloader remote version information
 */
export interface LiteloaderVersion {
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

/**
 * This error is only thrown from liteloader install currently.
 */
export class MissingVersionJsonError extends Error {
    constructor(public version: string,
        /**
         * The path of version json
         */
        public path: string) {
        super()
    }
    error: "MissingVersionJson" = "MissingVersionJson"

}
/**
 * Get or update the LiteLoader version list.
 *
 * This will request liteloader offical json by default. You can replace the request by assigning the remote option.
 */
export async function getLiteloaderVersionList(options: {
    /**
     * The request dispatcher
     */
    dispatcher?: Dispatcher;
} = {}): Promise<LiteloaderVersionList> {
    const response = await request(DEFAULT_VERSION_MANIFEST, { dispatcher: options.dispatcher, throwOnError: true });
    const body = await response.body.text();
    return LiteloaderVersionList.parse(body);
}

/**
 * Install the liteloader to specific minecraft location.
 *
 * This will install the liteloader amount on the corresponded Minecraft version by default.
 * If you want to install over the forge. You should first install forge and pass the installed forge version id to the third param,
 * like `1.12-forge-xxxx`
 *
 * @param versionMeta The liteloader version metadata.
 * @param location The minecraft location you want to install
 * @param version The real existed version id (under the the provided minecraft location) you want to installed liteloader inherit
 * @throws {@link MissingVersionJsonError}
 */
export function installLiteloader(versionMeta: LiteloaderVersion, location: MinecraftLocation, options?: InstallOptions) {
    return installLiteloaderTask(versionMeta, location, options).startAndWait();
}


function buildVersionInfo(versionMeta: LiteloaderVersion, mountedJSON: any) {
    const id = `${mountedJSON.id}-Liteloader${versionMeta.mcversion}-${versionMeta.version}`;
    const time = new Date(Number.parseInt(versionMeta.timestamp, 10) * 1000).toISOString();
    const releaseTime = time;
    const type = versionMeta.type;
    const libraries = [
        {
            name: `com.mumfrey:liteloader:${versionMeta.version}`,
            url: type === "SNAPSHOT" ? snapshotRoot : releaseRoot,
        },
        ...versionMeta.libraries.map(processLibraries),
    ];
    const mainClass = "net.minecraft.launchwrapper.Launch";
    const inheritsFrom = mountedJSON.id;
    const jar = mountedJSON.jar || mountedJSON.id;
    const info: any = {
        id, time, releaseTime, type, libraries, mainClass, inheritsFrom, jar,
    };
    if (mountedJSON.arguments) {
        // liteloader not supported for version > 1.12...
        // just write this for exception
        info.arguments = {
            game: ["--tweakClass", versionMeta.tweakClass],
            jvm: [],
        };
    } else {
        info.minecraftArguments = `--tweakClass ${versionMeta.tweakClass} ` + mountedJSON.minecraftArguments;
    }
    return info;
}


/**
 * Install the liteloader to specific minecraft location.
 *
 * This will install the liteloader amount on the corresponded Minecraft version by default.
 * If you want to install over the forge. You should first install forge and pass the installed forge version id to the third param,
 * like `1.12-forge-xxxx`
 *
 * @tasks installLiteloader, installLiteloader.resolveVersionJson installLiteloader.generateLiteloaderJson
 *
 * @param versionMeta The liteloader version metadata.
 * @param location The minecraft location you want to install
 * @param version The real existed version id (under the the provided minecraft location) you want to installed liteloader inherit
 */
export function installLiteloaderTask(versionMeta: LiteloaderVersion, location: MinecraftLocation, options: InstallOptions = {}): Task<string> {
    return task("installLiteloader", async function installLiteloader() {
        const mc: MinecraftFolder = MinecraftFolder.from(location);

        const mountVersion = options.inheritsFrom || versionMeta.mcversion;

        const mountedJSON: any = await this.yield(task("resolveVersionJson", async function resolveVersionJson() {
            if (await missing(mc.getVersionJson(mountVersion))) {
                throw new MissingVersionJsonError(mountVersion, mc.getVersionJson(mountVersion));
            }
            return readFile(mc.getVersionJson(mountVersion)).then((b) => b.toString()).then(JSON.parse);
        }));

        const versionInf = await this.yield(task("generateLiteloaderJson", async function generateLiteloaderJson() {
            const inf = buildVersionInfo(versionMeta, mountedJSON);

            inf.id = options.versionId || inf.id;
            inf.inheritsFrom = options.inheritsFrom || inf.inheritsFrom;

            const versionPath = mc.getVersionRoot(inf.id);

            await ensureDir(versionPath);
            await writeFile(join(versionPath, inf.id + ".json"), JSON.stringify(inf, undefined, 4));

            return inf;
        }));
        return versionInf.id as string;
    });
}
