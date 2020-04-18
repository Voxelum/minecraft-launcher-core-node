import { LibraryInfo, MinecraftFolder, MinecraftLocation, Version as VersionJson } from "@xmcl/core";
import { parse as parseForge } from "@xmcl/forge-site-parser";
import { Task } from "@xmcl/task";
import { Entry, open } from "@xmcl/unzip";
import { createWriteStream } from "fs";
import { join } from "path";
import { installByProfileTask, InstallProfile, InstallProfileOption, LibraryOption, resolveLibraryDownloadUrls } from "./minecraft";
import { downloadFileTask, getAndParseIfUpdate, InstallOptions as InstallOptionsBase, UpdatedObject, HasDownloader, normalizeArray, createErr, DownloaderOptions, ensureFile, pipeline, writeFile, resolveDownloader } from "./util";

export interface BadForgeInstallerJarError {
    error: "BadForgeInstallerJar";
    /**
     * What entry in jar is missing
     */
    entry: string;
}
export interface BadForgeUniversalJarError {
    error: "BadForgeUniversalJar";
    /**
     * What entry in jar is missing
     */
    entry: string;
}

export type ForgeError = BadForgeInstallerJarError | BadForgeUniversalJarError;

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

    type: "buggy" | "recommended" | "common" | "latest";
}

type RequiredVersion = {
    /**
     * The installer info.
     *
     * If this is not presented, it will genreate from mcversion and forge version.
     */
    installer?: {
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
export interface Options extends DownloaderOptions, LibraryOption, InstallOptionsBase, InstallProfileOption {
}

function installByInstallerTask(version: RequiredVersion, minecraft: MinecraftLocation, options: Options) {
    function getForgeArtifactVersion() {
        let [_, minor] = version.mcversion.split(".");
        let minorVersion = Number.parseInt(minor);
        if (minorVersion >= 7 && minorVersion <= 8) {
            return `${version.mcversion}-${version.version}-${version.mcversion}`;
        }
        return `${version.mcversion}-${version.version}`;
    }

    return Task.create("installForge", (context) => resolveDownloader(options, async function (options) {
        const mc = MinecraftFolder.from(minecraft);
        const forgeVersion = getForgeArtifactVersion();

        let inf = version.installer;
        let path = inf ? inf.path : `net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-installer.jar`;

        let forgeMavenPath = path.replace("/maven", "").replace("maven", "");
        let library = VersionJson.resolveLibrary({
            name: `net.minecraftforge:forge:${forgeVersion}:installer`,
            downloads: {
                artifact: {
                    url: `${DEFAULT_FORGE_MAVEN}${forgeMavenPath}`,
                    path: `net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-installer.jar`,
                    size: -1,
                    sha1: version.installer?.sha1 || "",
                }
            }
        })!;
        let mavenHost = options.mavenHost ? [...normalizeArray(options.mavenHost), DEFAULT_FORGE_MAVEN] : [DEFAULT_FORGE_MAVEN];
        let urls = resolveLibraryDownloadUrls(library, { ...options, mavenHost });

        context.update(0, 120);

        let installJarPath = mc.getLibraryByPath(library.path);
        let downloadTask = Task.create("downloadInstaller", downloadFileTask({
            url: urls,
            destination: installJarPath,
            checksum: version.installer?.sha1 ? {
                hash: version.installer.sha1,
                algorithm: "sha1",
            } : undefined,
        }, options));

        await context.execute(downloadTask, 20);

        let zip = await open(installJarPath, { lazyEntries: true });
        let [forgeEntry, forgeUniversalEntry, clientDataEntry, serverDataEntry, installProfileEntry, versionEntry, legacyUniversalEntry] = await zip.filterEntries([
            `maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}.jar`,
            `maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-universal.jar`,
            "data/client.lzma",
            "data/server.lzma",
            "install_profile.json",
            "version.json",
            `forge-${forgeVersion}-universal.jar`, // legacy installer format
        ]);

        function getLibraryPathWithoutMaven(name: string) {
            // remove the maven/ prefix
            return mc.getLibraryByPath(name.substring(name.indexOf("/") + 1));
        }
        function extractEntryTo(e: Entry, dest: string) {
            return zip.openEntry(e).then((stream) => pipeline(stream, createWriteStream(dest)));
        }

        if (legacyUniversalEntry) {
            if (!installProfileEntry) { throw createErr({ error: "BadForgeInstallerJar", entry: "install_profile.json" }, "Missing install profile"); }

            let profile: InstallProfile = await zip.readEntry(installProfileEntry).then((b) => b.toString()).then(JSON.parse);
            let versionJson = profile.versionInfo!;

            // apply override for inheritsFrom
            versionJson.id = options.versionId || versionJson.id;
            versionJson.inheritsFrom = options.inheritsFrom || versionJson.inheritsFrom;

            let rootPath = mc.getVersionRoot(versionJson.id);

            let versionJsonPath = join(rootPath, `${versionJson.id}.json`);
            await ensureFile(versionJsonPath);

            let library = LibraryInfo.resolve(versionJson.libraries.find((l) => l.name.startsWith("net.minecraftforge:forge"))!);

            await Promise.all([
                writeFile(versionJsonPath, JSON.stringify(versionJson, undefined, 4)),
                extractEntryTo(legacyUniversalEntry, mc.getLibraryByPath(library.path)),
            ]);

            return versionJson.id;
        } else {
            if (!forgeEntry) { throw createErr({ error: "BadForgeInstallerJar", entry: `maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}.jar` }, "Missing forge jar entry") }
            if (!installProfileEntry) { throw createErr({ error: "BadForgeInstallerJar", entry: "install_profile.json" }, "Missing install profile"); }
            if (!versionEntry) { throw createErr({ error: "BadForgeInstallerJar", entry: "version.json" }, "Missing version entry"); }

            let profile: InstallProfile = await zip.readEntry(installProfileEntry).then((b) => b.toString()).then(JSON.parse);
            let versionJson: VersionJson = await zip.readEntry(versionEntry).then((b) => b.toString()).then(JSON.parse);

            // apply override for inheritsFrom
            versionJson.id = options.versionId || versionJson.id;
            versionJson.inheritsFrom = options.inheritsFrom || versionJson.inheritsFrom;

            // resolve all the required paths
            let rootPath = mc.getVersionRoot(versionJson.id);

            let versionJsonPath = join(rootPath, `${versionJson.id}.json`);
            let installJsonPath = join(rootPath, "install_profile.json");

            await ensureFile(versionJsonPath);

            let promises: Promise<void>[] = [];
            if (forgeUniversalEntry) {
                promises.push(extractEntryTo(forgeUniversalEntry, getLibraryPathWithoutMaven(forgeUniversalEntry.fileName)));
            }
            if (serverDataEntry) {
                // forge version and mavens, compatible with twitch api
                let serverMaven = `net.minecraftforge:forge:${forgeVersion}:serverdata@lzma`;
                // override forge bin patch location
                profile.data.BINPATCH.server = `[${serverMaven}]`;

                let serverBinPath = mc.getLibraryByPath(LibraryInfo.resolve(serverMaven).path);
                await ensureFile(serverBinPath);
                promises.push(extractEntryTo(serverDataEntry, serverBinPath));
            }
            if (clientDataEntry) {
                // forge version and mavens, compatible with twitch api
                let clientMaven = `net.minecraftforge:forge:${forgeVersion}:clientdata@lzma`;
                // override forge bin patch location
                profile.data.BINPATCH.client = `[${clientMaven}]`;

                let clientBinPath = mc.getLibraryByPath(LibraryInfo.resolve(clientMaven).path);
                await ensureFile(clientBinPath);
                promises.push(extractEntryTo(clientDataEntry, clientBinPath));
            }
            promises.push(
                writeFile(installJsonPath, JSON.stringify(profile)),
                writeFile(versionJsonPath, JSON.stringify(versionJson)),
                extractEntryTo(forgeEntry, getLibraryPathWithoutMaven(forgeEntry.fileName)),
            );

            await Promise.all(promises);

            await installByProfileTask(profile, minecraft, options).run(context);

            return versionJson.id;
        }
    }));
}

/**
 * Install forge to target location.
 * Installation task for forge with mcversion >= 1.13 requires java installed on your pc.
 * @param version The forge version meta
 * @returns The installed version name.
 * @throws {@link ForgeError}
 */
export function install(version: RequiredVersion, minecraft: MinecraftLocation, options?: Options) {
    return Task.execute(installTask(version, minecraft, options)).wait();
}

/**
 * Install forge to target location.
 * Installation task for forge with mcversion >= 1.13 requires java installed on your pc.
 * @param version The forge version meta
 * @returns The task to install the forge
 * @throws {@link ForgeError}
 */
export function installTask(version: RequiredVersion, minecraft: MinecraftLocation, options: Options = {}): Task<string> {
    return installByInstallerTask(version, minecraft, options);
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
    return getAndParseIfUpdate(url, parseForge, option.original);
}
