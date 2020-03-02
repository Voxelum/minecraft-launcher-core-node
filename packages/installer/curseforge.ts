import { MinecraftFolder, MinecraftLocation } from "@xmcl/core";
import { Task } from "@xmcl/task";
import { CachedZipFile, open } from "@xmcl/unzip";
import got from "got";
import { basename, join } from "path";
import { downloadFileIfAbsentTask } from "./util";
import { DownloaderOption } from "./minecraft";

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
    mainifest?: Manifest;
}

export interface InstallFileOptions extends DownloaderOption {
    /**
     * The function to query a curseforge project downloadable url.
     */
    queryFileUrl?: CurseforgeURLQuery;
}

type InputType = string | Buffer | CachedZipFile;

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
 */
export function readManifestTask(zip: InputType) {
    return Task.create("unpack", async () => {
        let zipFile = typeof zip === "string" || zip instanceof Buffer ? await open(zip) : zip;
        let mainfiestEntry = zipFile.entries["manifest.json"];
        if (!mainfiestEntry) {
            throw { error: "InvalidModpack", modpack: zip };
        }
        let buffer = await zipFile.readEntry(mainfiestEntry)
        let content: Manifest = JSON.parse(buffer.toString());
        return content;
    })
}

/**
 * Read the mainifest data from modpack
 */
export function readManifest(zip: InputType) {
    return readManifestTask(zip).execute().wait();
}

export type CurseforgeURLQuery = (projectId: number, fileId: number) => Promise<string>;
export type CurseforgeFileTypeQuery = (projectId: number) => Promise<"mods" | "resourcepacks">;

export const DEFAULT_QUERY: CurseforgeURLQuery = (projectId, fileId) => {
    return got.get(`https://addons-ecs.forgesvc.net/api/v2/addon/${projectId}/file/${fileId}/download-url`).text();
};

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
 */
export function installCurseforgeModpackTask(zip: InputType, minecraft: MinecraftLocation, options?: Options) {
    return Task.create("installCurseforgeModpack", async (context: Task.Context) => {
        let mc = MinecraftFolder.from(minecraft);
        let zipFile = typeof zip === "string" || zip instanceof Buffer ? await open(zip) : zip;

        let mainfest = options?.mainifest ?? await context.execute(readManifestTask(zipFile), 10);

        await context.execute(Task.create("download", async (c) => {
            let requestor = options?.queryFileUrl || DEFAULT_QUERY;
            let urls = await Promise.all(mainfest.files.map((f) => requestor(f.projectID, f.fileID)))
            c.update(0, urls.length * 10);
            let tasks = urls.map((u) => Task.create("file", downloadFileIfAbsentTask({ destination: mc.getMod(basename(u)), url: u })));
            await Promise.all(tasks.map((t) => c.execute(t, 10)));
        }), 80);

        await context.execute(Task.create("deploy", async (c) => {
            let total = Object.keys(zipFile.entries).filter((e) => e.startsWith(mainfest.overrides)).length;
            let processed = 0;
            c.update(processed, total);
            await zipFile.extractEntries(mc.root, {
                replaceExisted: options?.replaceExisted,
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
    })
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
export function installCurseforgeFileTask(file: File, destination: string, options?: InstallFileOptions) {
    return Task.create("curseforge-file", async (context) => {
        let requestor = options?.queryFileUrl ?? DEFAULT_QUERY;
        let url = await requestor(file.projectID, file.fileID);
        return downloadFileIfAbsentTask({ destination: join(destination, basename(url)), url }, options?.downloader, options?.downloadStrategy)(context);
    });
}
