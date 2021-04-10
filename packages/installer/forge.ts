import { LibraryInfo, MinecraftFolder, MinecraftLocation, Version as VersionJson } from "@xmcl/core";
import { parse as parseForge } from "@xmcl/forge-site-parser";
import { Task, task } from "@xmcl/task";
import { filterEntries, open, openEntryReadStream, readEntry } from "@xmcl/unzip";
import { createWriteStream } from "fs";
import { join } from "path";
import { Entry, ZipFile } from "yauzl";
import { DownloadFallbackTask, getAndParseIfUpdate, Timestamped, withAgents } from "./http";
import { LibraryOptions, resolveLibraryDownloadUrls } from "./minecraft";
import { installByProfileTask, InstallProfile, InstallProfileOption } from "./profile";
import { ensureFile, errorFrom, InstallOptions as InstallOptionsBase, normalizeArray, pipeline, writeFile } from "./utils";

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

export interface ForgeVersionList extends Timestamped {
    mcversion: string;
    versions: ForgeVersion[];
}
/**
 * The forge version metadata to download a forge
 */
export interface ForgeVersion {
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


/**
 * All the useful entries in forge installer jar
 */
export interface ForgeInstallerEntries {
    /**
     *  maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}.jar
     */
    forgeJar?: Entry
    /**
     *  maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-universal.jar
     */
    forgeUniversalJar?: Entry
    /**
     * data/client.lzma
     */
    clientLzma?: Entry
    /**
     * data/server.lzma
     */
    serverLzma?: Entry
    /**
     * install_profile.json
     */
    installProfileJson?: Entry
    /**
     * version.json
     */
    versionJson?: Entry
    /**
     * forge-${forgeVersion}-universal.jar
     */
    legacyUniversalJar?: Entry
}

export type ForgeInstallerEntriesPattern = ForgeInstallerEntries & Required<Pick<ForgeInstallerEntries, "forgeJar" | "versionJson" | "installProfileJson">>;
export type ForgeLegacyInstallerEntriesPattern = Required<Pick<ForgeInstallerEntries, "installProfileJson" | "legacyUniversalJar">>;


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
export interface InstallForgeOptions extends LibraryOptions, InstallOptionsBase, InstallProfileOption {
}

export class DownloadForgeInstallerTask extends DownloadFallbackTask {
    readonly installJarPath: string

    constructor(forgeVersion: string, installer: RequiredVersion["installer"], minecraft: MinecraftFolder, options: InstallForgeOptions) {
        const path = installer ? installer.path : `net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-installer.jar`;

        const forgeMavenPath = path.replace("/maven", "").replace("maven", "");
        const library = VersionJson.resolveLibrary({
            name: `net.minecraftforge:forge:${forgeVersion}:installer`,
            downloads: {
                artifact: {
                    url: `${DEFAULT_FORGE_MAVEN}${forgeMavenPath}`,
                    path: `net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-installer.jar`,
                    size: -1,
                    sha1: installer?.sha1 || "",
                }
            }
        })!;
        const mavenHost = options.mavenHost ? [...normalizeArray(options.mavenHost), DEFAULT_FORGE_MAVEN] : [DEFAULT_FORGE_MAVEN];
        const urls = resolveLibraryDownloadUrls(library, { ...options, mavenHost });

        const installJarPath = minecraft.getLibraryByPath(library.path);
        super({
            urls,
            destination: installJarPath,
            checksum: installer?.sha1 ? {
                hash: installer.sha1,
                algorithm: "sha1",
            } : undefined,
            overwriteWhen: options.overwriteWhen,
            agents: options.agents,
            headers: options.headers,
            segmentThreshold: options.segmentThreshold,
            retry: options.retry,
        })

        this.installJarPath = installJarPath;
        this.name = "downloadInstaller";
        this.param = { version: forgeVersion };
    }
}


function getLibraryPathWithoutMaven(mc: MinecraftFolder, name: string) {
    // remove the maven/ prefix
    return mc.getLibraryByPath(name.substring(name.indexOf("/") + 1));
}
function extractEntryTo(zip: ZipFile, e: Entry, dest: string) {
    return openEntryReadStream(zip, e).then((stream) => pipeline(stream, createWriteStream(dest)));
}

async function installLegacyForgeFromZip(zip: ZipFile, entries: ForgeLegacyInstallerEntriesPattern, profile: InstallProfile, mc: MinecraftFolder, options: InstallForgeOptions) {
    const versionJson = profile.versionInfo!;

    // apply override for inheritsFrom
    versionJson.id = options.versionId || versionJson.id;
    versionJson.inheritsFrom = options.inheritsFrom || versionJson.inheritsFrom;

    const rootPath = mc.getVersionRoot(versionJson.id);
    const versionJsonPath = join(rootPath, `${versionJson.id}.json`);
    await ensureFile(versionJsonPath);

    const library = LibraryInfo.resolve(versionJson.libraries.find((l) => l.name.startsWith("net.minecraftforge:forge"))!);

    await Promise.all([
        writeFile(versionJsonPath, JSON.stringify(versionJson, undefined, 4)),
        extractEntryTo(zip, entries.legacyUniversalJar, mc.getLibraryByPath(library.path)),
    ]);

    return versionJson.id;
}

async function installForgeFromZip(zip: ZipFile, entries: ForgeInstallerEntriesPattern, forgeVersion: string, profile: InstallProfile, mc: MinecraftFolder, options: InstallForgeOptions) {
    const versionJson: VersionJson = await readEntry(zip, entries.versionJson).then((b) => b.toString()).then(JSON.parse);

    // apply override for inheritsFrom
    versionJson.id = options.versionId || versionJson.id;
    versionJson.inheritsFrom = options.inheritsFrom || versionJson.inheritsFrom;

    // resolve all the required paths
    const rootPath = mc.getVersionRoot(versionJson.id);

    const versionJsonPath = join(rootPath, `${versionJson.id}.json`);
    const installJsonPath = join(rootPath, "install_profile.json");

    await ensureFile(versionJsonPath);

    const promises: Promise<void>[] = [];
    if (entries.forgeUniversalJar) {
        promises.push(extractEntryTo(zip, entries.forgeUniversalJar, getLibraryPathWithoutMaven(mc, entries.forgeUniversalJar.fileName)));
    }

    if (!profile.data) {
        profile.data = {};
    }

    if (entries.serverLzma) {
        // forge version and mavens, compatible with twitch api
        const serverMaven = `net.minecraftforge:forge:${forgeVersion}:serverdata@lzma`;
        // override forge bin patch location
        profile.data.BINPATCH.server = `[${serverMaven}]`;

        const serverBinPath = mc.getLibraryByPath(LibraryInfo.resolve(serverMaven).path);
        await ensureFile(serverBinPath);
        promises.push(extractEntryTo(zip, entries.serverLzma, serverBinPath));
    }

    if (entries.clientLzma) {
        // forge version and mavens, compatible with twitch api
        const clientMaven = `net.minecraftforge:forge:${forgeVersion}:clientdata@lzma`;
        // override forge bin patch location
        profile.data.BINPATCH.client = `[${clientMaven}]`;

        const clientBinPath = mc.getLibraryByPath(LibraryInfo.resolve(clientMaven).path);
        await ensureFile(clientBinPath);
        promises.push(extractEntryTo(zip, entries.clientLzma, clientBinPath));
    }

    promises.push(
        writeFile(installJsonPath, JSON.stringify(profile)),
        writeFile(versionJsonPath, JSON.stringify(versionJson)),
        extractEntryTo(zip, entries.forgeJar, getLibraryPathWithoutMaven(mc, entries.forgeJar.fileName)),
    );

    await Promise.all(promises);

    return versionJson.id;
}

export function isLegacyForgeInstallerEntries(entries: ForgeInstallerEntries): entries is ForgeLegacyInstallerEntriesPattern {
    return !!entries.legacyUniversalJar && !!entries.installProfileJson;
}

export function isForgeInstallerEntries(entries: ForgeInstallerEntries): entries is ForgeInstallerEntriesPattern {
    return !!entries.forgeJar && !!entries.installProfileJson && !!entries.versionJson;
}

/**
 * Walk the forge installer file to find key entries
 * @param zip THe forge instal
 * @param forgeVersion Forge version to install
 */
export async function walkForgeInstallerEntries(zip: ZipFile, forgeVersion: string): Promise<ForgeInstallerEntries> {
    const [forgeJar, forgeUniversalJar, clientLzma, serverLzma, installProfileJson, versionJson, legacyUniversalJar] = await filterEntries(zip, [
        `maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}.jar`,
        `maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-universal.jar`,
        "data/client.lzma",
        "data/server.lzma",
        "install_profile.json",
        "version.json",
        `forge-${forgeVersion}-universal.jar`, // legacy installer format
    ]);
    return {
        forgeJar,
        forgeUniversalJar,
        clientLzma,
        serverLzma,
        installProfileJson,
        versionJson,
        legacyUniversalJar
    };
}

function installByInstallerTask(version: RequiredVersion, minecraft: MinecraftLocation, options: InstallForgeOptions) {
    return task("installForge", async function () {
        function getForgeArtifactVersion() {
            let [_, minor] = version.mcversion.split(".");
            let minorVersion = Number.parseInt(minor);
            if (minorVersion >= 7 && minorVersion <= 8) {
                return `${version.mcversion}-${version.version}-${version.mcversion}`;
            }
            return `${version.mcversion}-${version.version}`;
        }
        const forgeVersion = getForgeArtifactVersion();
        const mc = MinecraftFolder.from(minecraft);

        return withAgents(options, async (options) => {
            const jarPath = await this.yield(new DownloadForgeInstallerTask(forgeVersion, version.installer, mc, options)
                .map(function () { return this.installJarPath }));

            const zip = await open(jarPath, { lazyEntries: true, autoClose: false });
            const entries = await walkForgeInstallerEntries(zip, forgeVersion);

            if (!entries.installProfileJson) {
                throw errorFrom({ error: "BadForgeInstallerJar", entry: "install_profile.json" }, "Missing install profile");
            }
            const profile: InstallProfile = await readEntry(zip, entries.installProfileJson).then((b) => b.toString()).then(JSON.parse);
            if (isForgeInstallerEntries(entries)) {
                // new forge
                const versionId = await installForgeFromZip(zip, entries, forgeVersion, profile, mc, options);
                await this.concat(installByProfileTask(profile, minecraft, options));
                return versionId;
            } else if (isLegacyForgeInstallerEntries(entries)) {
                // legacy forge
                return installLegacyForgeFromZip(zip, entries, profile, mc, options);
            } else {
                // bad forge
                throw errorFrom({ error: "BadForgeInstallerJar" });
            }
        });
    });
}

/**
 * Install forge to target location.
 * Installation task for forge with mcversion >= 1.13 requires java installed on your pc.
 * @param version The forge version meta
 * @returns The installed version name.
 * @throws {@link ForgeError}
 */
export function installForge(version: RequiredVersion, minecraft: MinecraftLocation, options?: InstallForgeOptions) {
    return installForgeTask(version, minecraft, options).startAndWait();
}

/**
 * Install forge to target location.
 * Installation task for forge with mcversion >= 1.13 requires java installed on your pc.
 * @param version The forge version meta
 * @returns The task to install the forge
 * @throws {@link ForgeError}
 */
export function installForgeTask(version: RequiredVersion, minecraft: MinecraftLocation, options: InstallForgeOptions = {}): Task<string> {
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
export async function getForgeVersionList(option: {
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
    original?: ForgeVersionList;
} = {}): Promise<ForgeVersionList> {
    const mcversion = option.mcversion || "";
    const url = mcversion === "" ? "http://files.minecraftforge.net/maven/net/minecraftforge/forge/index.html" : `http://files.minecraftforge.net/maven/net/minecraftforge/forge/index_${mcversion}.html`;
    return getAndParseIfUpdate(url, parseForge, option.original);
}
