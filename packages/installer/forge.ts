import { futils, LibraryInfo, MinecraftFolder, MinecraftLocation, Version as VersionJson } from "@xmcl/core";
import { parse as parseForge } from "@xmcl/forge-site-parser";
import { Task } from "@xmcl/task";
import { Entry, open } from "@xmcl/unzip";
import { createWriteStream } from "fs";
import { join } from "path";
import { DownloaderOption, installByProfileTask, InstallProfile, InstallProfileOption, LibraryOption, resolveLibraryDownloadUrls } from "./minecraft";
import { downloadFileTask, getIfUpdate, InstallOptions as InstallOptionsBase, UpdatedObject, DefaultDownloader, HasDownloader, normailzeDownloader } from "./util";

const { copyFile, ensureDir, ensureFile, unlink, waitStream, writeFile } = futils;

export interface VersionList extends UpdatedObject {
    mcversion: string;
    versions: Version[];
}
/**
 * The forge version metadata to download a forge
 */
export interface Version {
    /**
     * The installer info
     */
    installer: {
        md5: string;
        sha1: string;
        /**
         * The url path to concat with forge maven
         */
        path: string;
    };
    universal: {
        md5: string;
        sha1: string;
        /**
         * The url path to concat with forge maven
         */
        path: string;
    };
    /**
     * The minecraft version
     */
    mcversion: string;
    /**
     * The forge version (without minecraft version)
     */
    version: string;

    type?: "buggy" | "recommended" | "common" | "latest";
}

type RequiredVersion = {
    /**
     * The installer info
     */
    installer: {
        sha1?: string;
        /**
         * The url path to concat with forge maven
         */
        path: string;
    };
    universal: {
        sha1?: string;
        /**
         * The url path to concat with forge maven
         */
        path: string;
    };
    /**
     * The minecraft version
     */
    mcversion: string;
    /**
     * The forge version (without minecraft version)
     */
    version: string;
}

export const DEFAULT_FORGE_MAVEN = "http://files.minecraftforge.net/maven";

/**
 * The options to install forge.
 */
export interface Options extends DownloaderOption, LibraryOption, InstallOptionsBase, InstallProfileOption {
}

function installByInstallerTask(version: RequiredVersion, minecraft: MinecraftLocation, options: HasDownloader<Options>) {
    const mc = MinecraftFolder.from(minecraft);
    const forgeVersion = `${version.mcversion}-${version.version}`;

    return Task.create("installForge", async function installForge(context: Task.Context) {
        let installJarPath = mc.getLibraryByPath(version.installer.path.substring(version.installer.path.substring(1).indexOf("/") + 1));

        let forgeMavenPath = version.installer.path.replace("/maven", "").replace("maven", "");
        let library = VersionJson.resolveLibrary({
            name: `net.minecraftforge:forge:${forgeVersion}:installer`,
            downloads: {
                artifact: {
                    url: `${DEFAULT_FORGE_MAVEN}${forgeMavenPath}`,
                    path: `net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-installer.jar`,
                    size: -1,
                    sha1: version.installer.sha1 || "",
                }
            }
        })!;
        let mavenHost = options.mavenHost ? [...options.mavenHost, DEFAULT_FORGE_MAVEN] : [DEFAULT_FORGE_MAVEN];
        let urls = resolveLibraryDownloadUrls(library, { ...options, mavenHost });

        context.update(0, 120);

        let downloadTask = Task.create("downloadInstaller", downloadFileTask({
            url: urls,
            destination: installJarPath,
            checksum: version.installer.sha1 ? {
                hash: version.installer.sha1,
                algorithm: "sha1",
            } : undefined,
        }, options));

        await context.execute(downloadTask, 20);

        let zip = await open(installJarPath, { lazyEntries: true });
        let [forgeEntry, forgeUniversalEntry, clientDataEntry, serverDataEntry, installProfileEntry, versionEntry] = await zip.filterEntries([
            `maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}.jar`,
            `maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-universal.jar`,
            "data/client.lzma",
            "data/server.lzma",
            "install_profile.json",
            "version.json"
        ]);

        if (!forgeEntry) { throw new Error("Missing forge jar entry"); }
        if (!forgeUniversalEntry) { throw new Error("Missing forge universal entry"); }
        if (!installProfileEntry) { throw new Error("Missing install profile"); }
        if (!versionEntry) { throw new Error("Missing version entry"); }

        function getLibraryPath(name: string) {
            // remove the maven/ prefix
            return mc.getLibraryByPath(name.substring(name.indexOf("/") + 1));
        }
        function extractEntryTo(e: Entry, dest: string) {
            return zip.openEntry(e).then((stream) => stream.pipe(createWriteStream(dest))).then(waitStream);
        }

        let profile: InstallProfile = await zip.readEntry(installProfileEntry).then((b) => b.toString()).then(JSON.parse);
        let versionJson: VersionJson = await zip.readEntry(versionEntry).then((b) => b.toString()).then(JSON.parse);

        // forge version and mavens, compatible with twitch api
        let clientMaven = `net.minecraftforge:forge:${forgeVersion}:clientdata@lzma`;
        let serverMaven = `net.minecraftforge:forge:${forgeVersion}:serverdata@lzma`;

        // override forge bin patch location
        profile.data.BINPATCH.client = `[${clientMaven}]`;
        profile.data.BINPATCH.server = `[${serverMaven}]`;

        // apply override for inheritsFrom
        versionJson.id = options.versionId || versionJson.id;
        versionJson.inheritsFrom = options.inheritsFrom || versionJson.inheritsFrom;

        // resolve all the required paths
        let rootPath = mc.getVersionRoot(versionJson.id);

        let versionJsonPath = join(rootPath, `${versionJson.id}.json`);
        let installJsonPath = join(rootPath, "install_profile.json");
        let serverBinPath = mc.getLibraryByPath(LibraryInfo.resolve(serverMaven).path);
        let clientBinPath = mc.getLibraryByPath(LibraryInfo.resolve(clientMaven).path);

        await ensureFile(versionJsonPath);
        await ensureFile(clientBinPath);

        await Promise.all([
            writeFile(installJsonPath, JSON.stringify(profile)),
            writeFile(versionJsonPath, JSON.stringify(versionJson)),
            extractEntryTo(forgeEntry, getLibraryPath(forgeEntry.fileName)),
            extractEntryTo(forgeUniversalEntry, getLibraryPath(forgeUniversalEntry.fileName)),
            extractEntryTo(serverDataEntry, serverBinPath),
            extractEntryTo(clientDataEntry, clientBinPath),
        ]);

        await installByProfileTask(profile, minecraft, options).run(context);

        return versionJson.id;
    });
}

/**
 * @task installForge
 * @child installForgeJar
 * @child installForgeJson
 */
function installByUniversalTask(version: RequiredVersion, minecraft: MinecraftLocation, options: HasDownloader<Options>) {
    return Task.create("installForge", async function installForge(context: Task.Context) {
        const mc = MinecraftFolder.from(minecraft);

        const paths = version.universal.path.split("/");
        const forgeVersion = paths[paths.length - 2];
        const jarPath = mc.getLibraryByPath(`net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}.jar`);

        let forgeMavenPath = version.universal.path.replace("/maven", "").replace("maven", "");
        let library = VersionJson.resolveLibrary({
            name: `net.minecraftforge:forge:${forgeVersion}:universal`,
            downloads: {
                artifact: {
                    url: `${DEFAULT_FORGE_MAVEN}${forgeMavenPath}`,
                    path: `/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-universal.jar`,
                    size: -1,
                    sha1: version.universal.sha1 || "",
                }
            }
        })!;
        let mavenHost = options.mavenHost ? [...options.mavenHost, DEFAULT_FORGE_MAVEN] : [DEFAULT_FORGE_MAVEN];
        let urls = resolveLibraryDownloadUrls(library, { ...options, mavenHost });

        await context.execute(Task.create("jar", downloadFileTask({
            destination: jarPath,
            url: urls,
            checksum: version.universal.sha1 ? { hash: version.universal.sha1, algorithm: "sha1" } : undefined,
        }, options)), 80);

        let json = await context.execute(Task.create("json", async function installForgeJson() {
            let zip = await open(jarPath, { lazyEntries: true });
            let [versionEntry] = await zip.filterEntries(["version.json"]);

            if (versionEntry) {
                let versionJson: VersionJson = await zip.readEntry(versionEntry).then((b) => b.toString()).then(JSON.parse);

                versionJson.id = options.versionId || versionJson.id;
                versionJson.inheritsFrom = options.inheritsFrom || versionJson.inheritsFrom;

                let rootPath = mc.getVersionRoot(versionJson.id);
                let jsonPath = join(rootPath, `${versionJson.id}.json`);

                await ensureDir(rootPath);
                await writeFile(jsonPath, JSON.stringify(versionJson, undefined, 4));

                return versionJson;
            }
            throw new Error(`Cannot install forge json for ${version.version} since the version json is missing!`);
        }), 20);

        let realJarPath = mc.getLibraryByPath(LibraryInfo.resolve(json.libraries.find((l: any) => l.name.startsWith("net.minecraftforge:forge"))!).path);

        if (realJarPath !== jarPath) {
            await ensureFile(realJarPath);
            await copyFile(jarPath, realJarPath);
            await unlink(jarPath);
        }

        return json.id;
    });
}

/**
 * Install forge to target location.
 * Installation task for forge with mcversion >= 1.13 requires java installed on your pc.
 * @param version The forge version meta
 * @returns The installed version name.
 */
export function install(version: RequiredVersion, minecraft: MinecraftLocation, options?: Options) {
    return Task.execute(installTask(version, minecraft, options)).wait();
}

/**
 * Install forge to target location.
 * Installation task for forge with mcversion >= 1.13 requires java installed on your pc.
 * @param version The forge version meta
 * @returns The task to install the forge
 */
export function installTask(version: RequiredVersion, minecraft: MinecraftLocation, options: Options = {}): Task<string> {
    let byInstaller = true;
    try {
        let minorVersion = Number.parseInt(version.mcversion.split(".")[1], 10);
        byInstaller = minorVersion >= 13;
    } catch { }
    normailzeDownloader(options);
    return byInstaller
        ? installByInstallerTask(version, minecraft, options)
        : installByUniversalTask(version, minecraft, options);
}

/**
 * Query the webpage content from files.minecraftforge.net.
 *
 * You can put the last query result to the fallback option. It will check if your old result is up-to-date.
 * It will request a new page only when the fallback option is outdated.
 *
 * @param option The option can control querying minecraft version, and page caching.
 */
export async function getVersionList(option: {
    /**
     * The minecraft version you are requesting
     */
    mcversion?: string;
    /**
     * If this presents, it will send request with the original list timestamp.
     *
     * If the server believes there is no modification after the original one,
     * it will directly return the orignal one.
     */
    original?: VersionList;
} = {}): Promise<VersionList> {
    const mcversion = option.mcversion || "";
    const url = mcversion === "" ? "http://files.minecraftforge.net/maven/net/minecraftforge/forge/index.html" : `http://files.minecraftforge.net/maven/net/minecraftforge/forge/index_${mcversion}.html`;
    return getIfUpdate(url, parseForge, option.original);
}
