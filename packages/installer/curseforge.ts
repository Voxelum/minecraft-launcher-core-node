import { MinecraftFolder, MinecraftLocation } from "@xmcl/core";
import { Task } from "@xmcl/task";
import { CachedZipFile, open } from "@xmcl/unzip";
import { Agent as HttpsAgent } from "https";
import { basename, join } from "path";
import { DownloaderOption } from "./minecraft";
import { batchedTask, downloadFileTask, createErr, resolveDownloader, fetchText } from "./util";

export interface Options extends DownloaderOption {
    /**
     * The function to query a curseforge project downloadable url.
     */
    queryFileUrl?: CurseforgeURLQuery;
    /**
     * Should it replace the override files if the file is existed.
     */
    replaceExisted?: boolean;
    /**
     * Overload the manifest for this installation.
     * It will use this manifest instead of the read manifest from modpack zip to install.
     */
    manifest?: Manifest;
    /**
     * The function to resolve the file path from url and other.
     *
     * By default this will install all the file
     */
    filePathResolver?: FilePathResolver;
}

export interface InstallFileOptions extends DownloaderOption {
    /**
     * The function to query a curseforge project downloadable url.
     */
    queryFileUrl?: CurseforgeURLQuery;
}

type InputType = string | Buffer | CachedZipFile;

export interface BadCurseforgeModpackError {
    error: "BadCurseforgeModpack";
    /**
     * What required entry is missing in modpack.
     */
    entry: string;
}

export interface Manifest {
    manifestType: string;
    manifestVersion: number;
    minecraft: {
        /**
         * Minecraft version
         */
        version: string;
        libraries?: string;
        /**
         * Can be forge
         */
        modLoaders: {
            id: string;
            primary: boolean;
        }[];
    };
    name: string;
    version: string;
    author: string;
    files: {
        projectID: number;
        fileID: number;
        required: boolean;
    }[];
    overrides: string;
}

export interface File {
    projectID: number;
    fileID: number;
}

/**
 * Read the mainifest data from modpack
 * @throws {@link BadCurseforgeModpackError}
 */
export function readManifestTask(zip: InputType) {
    return Task.create("unpack", async () => {
        let zipFile = typeof zip === "string" || zip instanceof Buffer ? await open(zip) : zip;
        let mainfiestEntry = zipFile.entries["manifest.json"];
        if (!mainfiestEntry) {
            throw createErr({ error: "BadCurseforgeModpack", entry: "manifest.json" });
        }
        let buffer = await zipFile.readEntry(mainfiestEntry)
        let content: Manifest = JSON.parse(buffer.toString());
        return content;
    })
}

/**
 * Read the mainifest data from modpack
 * @throws {@link BadCurseforgeModpackError}
 */
export function readManifest(zip: InputType) {
    return readManifestTask(zip).execute().wait();
}

export type FilePathResolver = (projectId: number, fileId: number, minecraft: MinecraftFolder, url: string) => string | Promise<string>;
export type CurseforgeURLQuery = (projectId: number, fileId: number) => Promise<string>;
export type CurseforgeFileTypeQuery = (projectId: number) => Promise<"mods" | "resourcepacks">;

export function createDefaultCurseforgeQuery(): CurseforgeURLQuery {
    let agent = new HttpsAgent();
    return (projectId, fileId) => fetchText(`https://addons-ecs.forgesvc.net/api/v2/addon/${projectId}/file/${fileId}/download-url`, { https: agent });
}
/**
 * Install curseforge modpack to a specific Minecraft location.
 *
 * @param zip The curseforge modpack zip buffer or file path
 * @param minecraft The minecraft location
 * @param options The options for query curseforge
 */
export function installCurseforgeModpack(zip: InputType, minecraft: MinecraftLocation, options?: Options) {
    return installCurseforgeModpackTask(zip, minecraft, options).execute().wait();
}

/**
 * Install curseforge modpack to a specific Minecraft location.
 *
 * This will NOT install the Minecraft version in the modpack, and will NOT install the forge or other modload listed in modpack!
 * Please resolve them by yourself.
 *
 * @param zip The curseforge modpack zip buffer or file path
 * @param minecraft The minecraft location
 * @param options The options for query curseforge
 * @throws {@link BadCurseforgeModpackError}
 */
export function installCurseforgeModpackTask(zip: InputType, minecraft: MinecraftLocation, options: Options = {}) {
    return Task.create("installCurseforgeModpack", (context) => resolveDownloader(options, async function installCurseforgeModpack(options) {
        let mc = MinecraftFolder.from(minecraft);
        let zipFile = typeof zip === "string" || zip instanceof Buffer ? await open(zip) : zip;

        let mainfest = options?.manifest ?? await context.execute(readManifestTask(zipFile), 10);

        await context.execute(Task.create("download", async (c) => {
            let requestor = options?.queryFileUrl || createDefaultCurseforgeQuery();
            let resolver = options?.filePathResolver || ((p, f, m, u) => m.getMod(basename(u)));
            let sizes = mainfest.files.map(() => 10);
            let tasks = mainfest.files.map((f) => Task.create("file", async (c) => {
                let u = await requestor(f.projectID, f.fileID);
                let dest = resolver(f.projectID, f.fileID, mc, u);
                if (typeof dest !== "string") {
                    dest = await dest;
                }
                return downloadFileTask({ destination: dest, url: u }, options)(c);
            }));
            await batchedTask(c, tasks, sizes, options.maxConcurrency, options.throwErrorImmediately, (e) => `Fail to install curseforge modpack to ${mc.root}: ${e.map((x: any) => x.message).join("\n")}`);
        }), 80);

        await context.execute(Task.create("deploy", async (c) => {
            let total = Object.keys(zipFile.entries).filter((e) => e.startsWith(mainfest.overrides)).length;
            let processed = 0;
            c.update(processed, total);
            await zipFile.extractEntries(mc.root, {
                replaceExisted: options.replaceExisted,
                entryHandler(root, e) {
                    if (e.fileName.startsWith(mainfest.overrides)) {
                        return e.fileName.substring(mainfest.overrides.length);
                    }
                    return undefined;
                },
                onAfterExtracted(_, e) {
                    c.update(processed += 1, total, e.fileName);
                }
            });
        }), 10);

        return mainfest;
    }));
}

/**
 * Install a cureseforge xml file to a specific locations
 */
export function installCurseforgeFile(file: File, destination: string, options?: InstallFileOptions) {
    return installCurseforgeFileTask(file, destination, options).execute().wait();
}

/**
 * Install a cureseforge xml file to a specific locations
 */
export function installCurseforgeFileTask(file: File, destination: string, options: InstallFileOptions = {}) {
    return Task.create("installCurseforgeFile", (context) => resolveDownloader(options, async (options) => {
        let requestor = options.queryFileUrl || createDefaultCurseforgeQuery();
        let url = await requestor(file.projectID, file.fileID);
        return downloadFileTask({ destination: join(destination, basename(url)), url }, options)(context);
    }));
}
