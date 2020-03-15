import { futils, LibraryInfo, MinecraftFolder, MinecraftLocation, ResolvedLibrary, ResolvedVersion, Version as VersionJson } from "@xmcl/core";
import { Task, task } from "@xmcl/task";
import { open } from "@xmcl/unzip";
import { delimiter, join } from "path";
import { batchedTask, DownloaderOptions, downloadFileTask, getIfUpdate, HasDownloader, joinUrl, normailzeDownloader, normalizeArray, spawnProcess, UpdatedObject } from "./util";

const { ensureDir, readFile, validateSha1 } = futils;

/**
 * The function to swap library host.
 */
export type LibraryHost = (library: ResolvedLibrary) => string | string[] | undefined;

/**
 * The version metadata containing the version information, like download url
 */
export interface Version {
    id: string;
    type: string;
    time: string;
    releaseTime: string;
    url: string;
}
/**
 * Minecraft version metadata list
 */
export interface VersionList extends UpdatedObject {
    latest: {
        /**
         * Snapshot version id of the Minecraft
         */
        snapshot: string
        /**
         * Release version id of the Minecraft, like 1.14.2
         */
        release: string,
    };
    /**
     * All the vesrsion list
     */
    versions: Version[];
}

export interface InstallProfile {
    spec?: number;
    /**
     * The type of this installation, like "forge"
     */
    profile: string;
    /**
     * The version of this installation
     */
    version: string;
    /**
     * The version json path
     */
    json: string;
    /**
     * The maven artifact name: <org>:<artifact-id>:<version>
     */
    path: string;
    /**
     * The minecraft version
     */
    minecraft: string;
    /**
     * The processor shared variables. The key is the name of variable to replace.
     *
     * The value of client/server is the value of the variable.
     */
    data: { [key: string]: { client: string; server: string; }; };
    /**
     * The post processor. Which require java to run.
     */
    processors: Array<{
        /**
         * The executable jar path
         */
        jar: string;
        /**
         * The classpath to run
         */
        classpath: string[];
        args: string[];
        outputs?: { [key: string]: string; };
    }>;
    /**
     * The required install profile libraries
     */
    libraries: VersionJson.NormalLibrary[];
}

/**
 * Default minecraft version manifest url.
 */
export const DEFAULT_VERSION_MANIFEST_URL = "https://launchermeta.mojang.com/mc/game/version_manifest.json";
/**
 * Default resource/assets url root
 */
export const DEFAULT_RESOURCE_ROOT_URL = "https://resources.download.minecraft.net";

/**
 * Get and update the version list.
 * This try to send http GET request to offical Minecraft metadata endpoint by default.
 * You can swap the endpoint by passing url on `remote` in option.
 *
 * @returns The new list if there is
 */
export function getVersionList(option: {
    /**
     * If this presents, it will send request with the original list timestamp.
     *
     * If the server believes there is no modification after the original one,
     * it will directly return the orignal one.
     */
    original?: VersionList,
    /**
     * remote url of this request
     */
    remote?: string,
} = {}): Promise<VersionList> {
    return getIfUpdate(option.remote || DEFAULT_VERSION_MANIFEST_URL, JSON.parse, option.original);
}

export type DownloaderOption = DownloaderOptions;

/**
 * Change the library host url
 */
export interface LibraryOption extends DownloaderOptions {
    /**
     * A more flexiable way to control library download url.
     * @see mavenHost
     */
    libraryHost?: LibraryHost;
    /**
     * The alterative maven host to download library. It will try to use these host from the `[0]` to the `[maven.length - 1]`
     */
    mavenHost?: string | string[];
    /**
     * Control how many libraries download task should run at the same time.
     * It will override the `maxConcurrencyOption` if this is presented.
     */
    librariesDownloadConcurrency?: number;
}
/**
 * Change the host url of assets download
 */
export interface AssetsOption extends DownloaderOptions {
    /**
     * The alternative assets host to download asset. It will try to use these host from the `[0]` to the `[assetsHost.length - 1]`
     */
    assetsHost?: string | string[];
    /**
     * Control how many assets download task should run at the same time.
     * It will override the `maxConcurrencyOption` if this is presented.
     */
    assetsDownloadConcurrency?: number;
}
/**
 * Replace the minecraft client or server jar download
 */
export interface JarOption extends DownloaderOptions {
    /**
     * The client jar url
     */
    client?: string;
    /**
     * The server jar url
     */
    server?: string;

    /**
     * The version json url replacement
     */
    jsonUrl?: string;
}

export type Option = AssetsOption & JarOption & LibraryOption;

type RequiredVersion = Pick<Version, "id" | "url">

/**
 * Install the Minecraft game to a location by version metadata.
 *
 * This will install version json, version jar, and all dependencies (assets, libraries)
 *
 * @param type The type of game, client or server
 * @param versionMeta The version metadata
 * @param minecraft The Minecraft location
 * @param option
 */
export function install(type: "server" | "client", versionMeta: RequiredVersion, minecraft: MinecraftLocation, option?: Option): Promise<ResolvedVersion> {
    return Task.execute(installTask(type, versionMeta, minecraft, option)).wait();
}
/**
 * Install the Minecraft game to a location by version metadata
 *
 * This will install version json, version jar, and all dependencies (assets, libraries)
 *
 * Tasks emmitted:
 * - install
 *  - installVersion
 *   - json
 *   - jar
 *  - installDependencies
 *   - installAssets
 *     - assetsJson
 *     - asset
 *   - installLibraries
 *     - library
 *
 * @param type The type of game, client or server
 * @param versionMeta The version metadata
 * @param minecraft The Minecraft location
 * @param option
 */
export function installTask(type: "server" | "client", versionMeta: RequiredVersion, minecraft: MinecraftLocation, option: Option = {}): Task<ResolvedVersion> {
    normailzeDownloader(option);
    return task("install", async function install(context: Task.Context) {
        context.update(0, 100);
        const version = await context.execute(installVersionTask(type, versionMeta, minecraft, option), 20);
        if (type === "client") {
            await context.execute(installDependenciesTask(version, option), 80);
        } else {
            await context.execute(installLibrariesTask(version, option), 80);
        }
        return version;
    }, { version: versionMeta.id });
}

/**
 * Only install the json/jar. Do not install dependencies.
 *
 * @param type client or server
 * @param versionMeta the version metadata; get from updateVersionMeta
 * @param minecraft minecraft location
 */
export function installVersion(type: "client" | "server", versionMeta: Version, minecraft: MinecraftLocation, option: JarOption = {}): Promise<ResolvedVersion> {
    return Task.execute(installVersionTask(type, versionMeta, minecraft, option)).wait();
}

/**
 * Only install the json/jar. Do not check dependencies;
 *
 * Task emmitted:
 * - installVersion
 *   - json
 *   - jar
 *
 * @param type client or server
 * @param versionMeta the version metadata; get from updateVersionMeta
 * @param minecraft minecraft location
 */
export function installVersionTask(type: "client" | "server", versionMeta: RequiredVersion, minecraft: MinecraftLocation, options: JarOption = {}): Task<ResolvedVersion> {
    normailzeDownloader(options);
    return task("installVersion", async function installVersion(context: Task.Context) {
        context.update(0, 100);
        await context.execute(installVersionJsonTask(versionMeta, minecraft, options), 40);
        const version = await VersionJson.parse(minecraft, versionMeta.id);
        await context.execute(installVersionJarTask(type, version, minecraft, options), 60);
        return version;
    }, { version: versionMeta.id });
}

/**
 * Install the completeness of the Minecraft game assets and libraries on a existed version.
 *
 * @param version The resolved version produced by Version.parse
 * @param minecraft The minecraft location
 */
export function installDependencies(version: ResolvedVersion, option?: Option): Promise<ResolvedVersion> {
    return Task.execute(installDependenciesTask(version, option)).wait();
}
/**
 * Install the completeness of the Minecraft game assets and libraries.
 *
 * Tasks emitted:
 * - installDependencies
 *  - installAssets
 *   - assetsJson
 *   - asset
 *  - installLibraries
 *   - library
 *
 * @param version The resolved version produced by Version.parse
 * @param minecraft The minecraft location
 */
export function installDependenciesTask(version: ResolvedVersion, options: Option = {}): Task<ResolvedVersion> {
    normailzeDownloader(options);
    return task("installDependencies", async function installDependencies(context: Task.Context) {
        context.update(0, 100);
        await Promise.all([
            context.execute(installAssetsTask(version, options), 50),
            context.execute(installLibrariesTask(version, options), 50),
        ]);
        return version;
    }, { version: version.id });
}

/**
 * Install or check the assets to resolved version
 * @param version The target version
 * @param options The option to replace assets host url
 */
export function installAssets(version: ResolvedVersion, options?: AssetsOption): Promise<ResolvedVersion> {
    return Task.execute(installAssetsTask(version, options)).wait();
}

/**
 * Install or check the assets to resolved version
 *
 * Task emitted:
 * - installAssets
 *  - assetsJson
 *  - asset
 *
 * @param version The target version
 * @param options The option to replace assets host url
 */
export function installAssetsTask(version: ResolvedVersion, options: AssetsOption = {}): Task<ResolvedVersion> {
    async function installAssets(context: Task.Context) {
        normailzeDownloader(options);
        let folder = MinecraftFolder.from(version.minecraftDirectory);
        let jsonPath = folder.getPath("assets", "indexes", version.assets + ".json");

        await context.execute(task("assetsJson", downloadFileTask({
            url: version.assetIndex.url,
            destination: jsonPath,
            checksum: {
                algorithm: "sha1",
                hash: version.assetIndex.sha1,
            },
        }, options)));

        await ensureDir(folder.getPath("assets", "objects"));
        interface AssetIndex {
            objects: {
                [key: string]: {
                    hash: string,
                    size: number,
                };
            };
        }

        let { objects } = JSON.parse(await readFile(jsonPath).then((b) => b.toString())) as AssetIndex;
        let objectArray = Object.keys(objects).map((k) => ({ name: k, ...objects[k] }));
        let tasks = objectArray.map((o) => installAssetTask(version.id, o, folder, options));
        let sizes = objectArray.map((a) => a.size).map((a, b) => a + b, 0);

        await batchedTask(context, tasks, sizes, options.assetsDownloadConcurrency || options.maxConcurrency, options.throwErrorImmediately,
            () => `Errors during install Minecraft ${version.id}'s assets at ${version.minecraftDirectory}`);

        return version;
    }
    return task("installAssets", installAssets, { version: version.id })
}

/**
 * Install all the libraries of providing version
 * @param version The target version
 * @param option The library host swap option
 */
export function installLibraries(version: ResolvedVersion, option: LibraryOption = {}): Promise<void> {
    return Task.execute(installLibrariesTask(version, option)).wait();
}
/**
 * Install all the libraries of providing version
 *
 * Task emmitted:
 * - installLibraries
 *  - library
 *
 * @param version The target version
 * @param option The library host swap option
 */
export function installLibrariesTask<T extends Pick<ResolvedVersion, "minecraftDirectory" | "libraries">>(version: T, option: LibraryOption = {}): Task<void> {
    normailzeDownloader(option);
    return task("installLibraries", async function installLibraries(context: Task.Context) {
        let folder = MinecraftFolder.from(version.minecraftDirectory);
        let tasks = version.libraries.map((lib) => installLibraryTask(lib, folder, option));
        await batchedTask(context, tasks, tasks.map(() => 10), option.librariesDownloadConcurrency || option.maxConcurrency, option.throwErrorImmediately,
            () => `Errors during install Minecraft ${version.minecraftDirectory} libraries.`);
    }, { version: Reflect.get(version, "id") || "" });
}

/**
 * Only install several resolved libraries
 * @param libraries The resolved libraries
 * @param minecraft The minecraft location
 * @param option The install option
 */
export function installResolvedLibraries(libraries: ResolvedLibrary[], minecraft: MinecraftLocation, option?: LibraryOption): Promise<void> {
    return Task.execute(installResolvedLibrariesTask(libraries, minecraft, option)).wait();
}

/**
 * Only install several resolved libraries.
 *
 * Task emmitted:
 * - installLibraries
 *  - library
 *
 * @param libraries The resolved libraries
 * @param minecraft The minecraft location
 * @param option The install option
 */
export function installResolvedLibrariesTask(libraries: ResolvedLibrary[], minecraft: MinecraftLocation, option?: LibraryOption): Task<void> {
    return installLibrariesTask({ libraries, minecraftDirectory: typeof minecraft === "string" ? minecraft : minecraft.root }, option);
}

export interface InstallProfileOption extends LibraryOption {
    /**
     * New forge (>=1.13) require java to install. Can be a executor or java executable path.
     */
    java?: string;
    /**
     * The installation side
     */
    side?: "client" | "server";
}

/**
 * Resolve processors in install profile
 */
export function resolveProcessors(side: "client" | "server", installProfile: InstallProfile, minecraft: MinecraftFolder) {
    function normalizePath(val: string) {
        if (val && val.match(/^\[.+\]$/g)) { // match sth like [net.minecraft:client:1.15.2:slim]
            let name = val.substring(1, val.length - 1);
            return minecraft.getLibraryByPath(LibraryInfo.resolve(name).path);
        }
        return val;
    }
    function normalizeVariable(val: string) {
        if (val && val.match(/^{.+}$/g)) { // match sth like {MAPPINGS}
            let key = val.substring(1, val.length - 1);
            val = variables[key][side];
        }
        return val;
    }
    // store the mapping of {VARIABLE_NAME} -> real path in disk
    let variables: Record<string, { client: string; server: string }> = {
        MINECRAFT_JAR: {
            client: minecraft.getVersionJar(installProfile.minecraft),
            server: minecraft.getVersionJar(installProfile.minecraft, "server"),
        },
    };
    for (let key in installProfile.data) {
        let { client, server } = installProfile.data[key];
        variables[key] = {
            client: normalizePath(client),
            server: normalizePath(server),
        };
    }
    let processors = installProfile.processors.map((proc) => ({
        ...proc,
        args: proc.args.map(normalizePath).map(normalizeVariable),
        outputs: proc.outputs ? Object.entries(proc.outputs).map(([k, v]) => ({ [normalizeVariable(k)]: normalizeVariable(v) }))
            .reduce((a, b) => ({ ...a, ...b }), {}) : proc.outputs,
    }));
    return processors;
}

/**
 * Install by install profile. The install profile usually contains some preprocess should run before installing dependencies.
 *
 * @param installProfile The install profile
 * @param minecraft The minecraft location
 * @param options The options to install
 */
export function installByProfile(installProfile: InstallProfile, minecraft: MinecraftLocation, options: InstallProfileOption = {}) {
    return installByProfileTask(installProfile, minecraft, options).execute().wait();
}

/**
 * Install by install profile. The install profile usually contains some preprocess should run before installing dependencies.
 *
 * @param installProfile The install profile
 * @param minecraft The minecraft location
 * @param options The options to install
 */
export function installByProfileTask(installProfile: InstallProfile, minecraft: MinecraftLocation, options: InstallProfileOption = {}) {
    normailzeDownloader(options);
    async function findMainClass(lib: string) {
        const zip = await open(lib, { lazyEntries: true });
        const [manifest] = await zip.filterEntries(["META-INF/MANIFEST.MF"]);
        let mainClass: string | undefined;
        if (manifest) {
            const content = await zip.readEntry(manifest).then((b) => b.toString());
            mainClass = content.split("\n")
                .map((l) => l.split(": "))
                .find((arr) => arr[0] === "Main-Class")?.[1].trim();
        }
        zip.close();
        return mainClass;
    }
    async function postProcess(mc: MinecraftFolder, proc: InstallProfile["processors"][number], java: string) {
        let shouldProcess = false;
        if (proc.outputs) {
            for (const file in proc.outputs) {
                if (! await validateSha1(file, proc.outputs[file].replace(/'/g, ""))) {
                    shouldProcess = true;
                    break;
                }
            }
        } else {
            shouldProcess = true;
        }
        if (!shouldProcess) { return; }
        const jarRealPath = mc.getLibraryByPath(LibraryInfo.resolve(proc.jar).path);
        const mainClass = await findMainClass(jarRealPath);
        if (!mainClass) { throw new Error(`Cannot find main class for processor ${proc.jar}.`); }
        const cp = [...proc.classpath, proc.jar].map(LibraryInfo.resolve).map((p) => mc.getLibraryByPath(p.path)).join(delimiter);
        const cmd = ["-cp", cp, mainClass, ...proc.args];
        try {
            await spawnProcess(java, cmd);
        } catch (e) {
            throw new Error(`Fail on execute processor ${proc.jar}: ${JSON.stringify(cmd)}`)
        }
        let failed = false;
        if (proc.outputs) {
            for (const file in proc.outputs) {
                if (! await validateSha1(file, proc.outputs[file].replace(/'/g, ""))) {
                    console.error(`Fail to process ${proc.jar} @ ${file} since its validation failed.`);
                    failed = true;
                }
            }
        }
        if (failed) {
            console.error(`Java arguments: ${JSON.stringify(cmd)}`);
            throw new Error("Fail to process post processing since its validation failed.");
        }
    }
    function postProcessingTask(minecraft: MinecraftFolder, processors: InstallProfile["processors"], java: string, failImmediately: boolean) {
        return task("postProcessing", async function postProcessing(ctx) {
            if (!processors || processors.length === 0) {
                return;
            }

            ctx.update(0, processors.length);
            let done = 0;
            for (let proc of processors) {
                try {
                    await postProcess(minecraft, proc, java);
                } catch (e) {
                    e = e || new Error(`Fail to post porcess ${proc.jar}: ${proc.args.join(" ")}, ${proc.classpath.join(" ")}`);
                    throw e;
                }
                ctx.update(done += 1, processors.length);
            }

            done += 1;
            ctx.update(done, processors.length);
        });
    }

    return task("install", async function install(context: Task.Context) {
        const minecraftFolder = MinecraftFolder.from(minecraft);
        const java = options.java || "java";

        let processor = resolveProcessors(options.side || "client", installProfile, minecraftFolder);

        let versionJson: VersionJson = await readFile(minecraftFolder.getVersionJson(installProfile.version)).then((b) => b.toString()).then(JSON.parse);
        let libraries = VersionJson.resolveLibraries([...installProfile.libraries, ...versionJson.libraries]);

        await context.execute(installResolvedLibrariesTask(libraries, minecraft, options), 50);
        await context.execute(postProcessingTask(minecraftFolder, processor, java, options.throwErrorImmediately || false), 50);
    });
}

function installVersionJsonTask(version: RequiredVersion, minecraft: MinecraftLocation, options: HasDownloader<Option>) {
    return task("json", async function json(context: Task.Context) {
        let folder = MinecraftFolder.from(minecraft);
        await ensureDir(folder.getVersionRoot(version.id));

        let destination = folder.getVersionJson(version.id);
        let url = version.url;
        let expectSha1 = version.url.split("/")[5];

        await downloadFileTask({
            url,
            checksum: { algorithm: "sha1", hash: expectSha1 },
            destination: destination,
        }, options)(context);
    });
}

function installVersionJarTask(type: "client" | "server", version: ResolvedVersion, minecraft: MinecraftLocation, options: HasDownloader<Option>) {
    return task("jar", async function jar(context: Task.Context) {
        const folder = MinecraftFolder.from(minecraft);
        const destination = join(folder.getVersionRoot(version.id),
            type === "client" ? version.id + ".jar" : version.id + "-" + type + ".jar");
        const url = options[type] || version.downloads[type].url;
        const expectSha1 = version.downloads[type].sha1;

        await downloadFileTask({
            url,
            checksum: { algorithm: "sha1", hash: expectSha1 },
            destination: destination,
        }, options)(context);
        return version;
    });
}

function installLibraryTask(lib: ResolvedLibrary, folder: MinecraftFolder, options: HasDownloader<Option>) {
    return task("library", async function library(context: Task.Context) {
        context.update(0, -1, lib.name);

        const libraryPath = lib.download.path;
        const filePath = join(folder.libraries, libraryPath);

        const urls: string[] = resolveLibraryDownloadUrls(lib, options);

        const checksum = lib.download.sha1 === "" ? undefined : {
            algorithm: "sha1",
            hash: lib.download.sha1,
        }

        await downloadFileTask({
            url: urls,
            checksum,
            destination: filePath,
        }, options)(context);
    }, { lib: lib.name });
}

function installAssetTask(version: string, asset: { name: string, hash: string, size: number }, folder: MinecraftFolder, option: HasDownloader<AssetsOption>) {
    return task("assets", async function assets(context: Task.Context) {
        const assetsHosts = [
            ...normalizeArray(option.assetsHost),
            DEFAULT_RESOURCE_ROOT_URL,
        ];

        const { hash, size, name } = asset;

        const head = hash.substring(0, 2);
        const dir = folder.getPath("assets", "objects", head);
        const file = join(dir, hash);
        const urls = assetsHosts.map((h) => `${h}/${head}/${hash}`);

        context.update(0, size, name);
        await downloadFileTask({
            url: urls,
            checksum: {
                hash,
                algorithm: "sha1",
            },
            destination: file,
        }, option)(context);
    }, { version });
}

const DEFAULT_MAVENS = ["https://repo1.maven.org/maven2/"];

/**
 * Resolve a library download urls with fallback.
 *
 * @param library The resolved library
 * @param libraryOptions The library install options
 */
export function resolveLibraryDownloadUrls(library: ResolvedLibrary, libraryOptions: LibraryOption) {
    const libraryHosts = libraryOptions.libraryHost?.(library);

    return [
        // user defined alternative host to download
        ...normalizeArray(libraryHosts),
        ...normalizeArray(libraryOptions.mavenHost).map((m) => joinUrl(m, library.download.path)),
        library.download.url,
        ...DEFAULT_MAVENS.map((m) => joinUrl(m, library.download.path)),
    ];
}
