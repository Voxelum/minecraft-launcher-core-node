import { futils, MinecraftFolder, MinecraftLocation, Version } from "@xmcl/core";
import got from "got";
import { getRawIfUpdate, InstallOptions, UpdatedObject } from "./util";

const { ensureFile, writeFile } = futils;

export const YARN_MAVEN_URL = "https://maven.fabricmc.net/net/fabricmc/yarn/maven-metadata.xml";
export const LOADER_MAVEN_URL = "https://maven.fabricmc.net/net/fabricmc/fabric-loader/maven-metadata.xml";

/**
 * Fabric Yarn version list
 * @see https://github.com/FabricMC/yarn
 */
export interface YarnVersionList extends UpdatedObject {
    versions: string[];
}

/**
 * Fabric mod loader version list
 * @see https://fabricmc.net/
 */
export interface LoaderVersionList extends UpdatedObject {
    versions: string[];
}

export interface FabricArtifactVersion {
    gameVersion?: string; // "20w10a",
    separator?: string;
    build?: number,
    maven: string; // "net.fabricmc:yarn:20w10a+build.7",
    version: string; // "20w10a+build.7",
    stable: boolean;
}

export interface FabricArtifacts {
    mappings: FabricArtifactVersion[];
    loader: FabricArtifactVersion[];
}

export interface LoaderArtifact {
    loader: FabricArtifactVersion;
    launcherMeta: {
        version: number;
        libraries: {
            client: { name: string; url: string; }[];
            common: { name: string; url: string; }[];
            server: { name: string; url: string; }[];
        },
        mainClass: {
            client: string;
            server: string;
        };
    };
}

export const DEFAULT_FABRIC_API = "https://meta.fabricmc.net/v2";

/**
 * Get all the artifacts provided by fabric
 * @param remote The fabric API host
 * @beta
 */
export function getArtifacts(remote: string = DEFAULT_FABRIC_API): Promise<FabricArtifacts> {
    return got(remote + "/versions").json();
}
/**
 * Get fabric-yarn artifact list
 * @param remote The fabric API host
 * @beta
 */
export function getYarnArtifactList(remote: string = DEFAULT_FABRIC_API): Promise<FabricArtifactVersion[]> {
    return got(remote + "/versions/yarn").json();
}
/**
 * Get fabric-yarn artifact list by Minecraft version
 * @param minecraft The Minecraft version
 * @param remote The fabric API host
 * @beta
 */
export function getYarnArtifactListFor(minecraft: string, remote: string = DEFAULT_FABRIC_API): Promise<FabricArtifactVersion[]> {
    return got(remote + "/versions/yarn/" + minecraft).json();
}
/**
 * Get fabric-loader artifact list
 * @param remote The fabric API host
 * @beta
 */
export function getLoaderArtifactList(remote: string = DEFAULT_FABRIC_API): Promise<FabricArtifactVersion[]> {
    return got(remote + "/versions/loader").json();
}
/**
 * Get fabric-loader artifact list by Minecraft version
 * @param minecraft The minecraft version
 * @param remote The fabric API host
 * @beta
 */
export function getLoaderArtifactListFor(minecraft: string, remote: string = DEFAULT_FABRIC_API): Promise<LoaderArtifact[]> {
    return got(remote + "/versions/loader/" + minecraft).json();
}
/**
 * Get fabric-loader artifact list by Minecraft version
 * @param minecraft The minecraft version
 * @param loader The yarn-loader version
 * @param remote The fabric API host
 * @beta
 */
export function getLoaderArtifact(minecraft: string, loader: string, remote: string = DEFAULT_FABRIC_API): Promise<LoaderArtifact> {
    return got(remote + "/versions/loader/" + minecraft + "/" + loader).json();
}

/**
 * Parse the maven xml provided by Fabric. This is pretty tricky. I don't want to include another lib to parse xml.
 * Therefore I just use RegExp here to match.
 *
 * @param content The xml string from Fabric.
 */
export function parseVersionMavenXML(content: string) {
    const matchVersions = /<version>(.+)<\/version>/g;
    const matched = content.match(matchVersions);
    if (!matched) {
        return [];
    }
    return matched.map((v) => v.substring(9, v.length - 10));
}

/**
 * Get or refresh the yarn version list.
 */
export async function getYarnVersionList(option: {
    /**
     * If this presents, it will send request with the original list timestamp.
     *
     * If the server believes there is no modification after the original one,
     * it will directly return the orignal one.
     */
    original?: YarnVersionList,
    /**
     * remote maven xml url of this request
     */
    remote?: string,
} = {}): Promise<YarnVersionList> {
    const timestamp = option.original?.timestamp;
    const yarn = await getRawIfUpdate(YARN_MAVEN_URL, timestamp);
    return {
        versions: yarn.content ? parseVersionMavenXML(yarn.content) : option.original?.versions!,
        timestamp: yarn.timestamp,
    };
}

/**
 * Get or refresh the fabric mod loader version list.
 */
export async function getLoaderVersionList(option: {
    /**
     * If this presents, it will send request with the original list timestamp.
     *
     * If the server believes there is no modification after the original one,
     * it will directly return the orignal one.
     */
    original?: LoaderVersionList,
    /**
     * remote maven xml url of this request
     */
    remote?: string,
}): Promise<LoaderVersionList> {
    const timestamp = option.original?.timestamp;
    const loader = await getRawIfUpdate(LOADER_MAVEN_URL, timestamp);
    return {
        versions: loader.content ? parseVersionMavenXML(loader.content) : option.original?.versions!,
        timestamp: loader.timestamp,
    };
}

/**
 * Install the fabric to the client. Notice that this will only install the json.
 * You need to call `Installer.installDependencies` to get a full client.
 * @param yarnVersion The yarn version
 * @param loaderVersion The fabric loader version
 * @param minecraft The minecraft location
 * @returns The installed version id
 */
export async function install(yarnVersion: string, loaderVersion: string, minecraft: MinecraftLocation, options: InstallOptions = {}) {
    const folder = MinecraftFolder.from(minecraft);
    const mcversion = yarnVersion.split("+")[0];
    const id = options.versionId || `${mcversion}-fabric${yarnVersion}-${loaderVersion}`;

    const jsonFile = folder.getVersionJson(id);

    const body: Version = await got(`https://fabricmc.net/download/technic/?yarn=${encodeURIComponent(yarnVersion)}&loader=${encodeURIComponent(loaderVersion)}`).json();
    body.id = id;
    if (typeof options.inheritsFrom === "string") {
        body.inheritsFrom = options.inheritsFrom;
    }
    await ensureFile(jsonFile);
    await writeFile(jsonFile, JSON.stringify(body));

    return id;
}

/**
 * Generate fabric version json to the disk according to yarn and loader
 * @param side Client or server
 * @param yarnVersion The yarn version string or artifact
 * @param loader The loader artifact
 * @param minecraft The Minecraft Location
 * @param options The options
 * @beta
 */
export async function installFromVersionMeta(side: "client" | "server", yarnVersion: string | FabricArtifactVersion, loader: LoaderArtifact, minecraft: MinecraftLocation, options: InstallOptions = {}) {
    const folder = MinecraftFolder.from(minecraft);

    let yarn: string;
    let id = options.versionId;
    let mcversion: string;
    if (typeof yarnVersion === "string") {
        yarn = yarnVersion;
        mcversion = yarn.split("+")[0];
    } else {
        yarn = yarnVersion.version;
        mcversion = yarnVersion.gameVersion || yarn.split("+")[0];
    }
    id = id || `${mcversion}-fabric${yarnVersion}-${loader.loader.version}`;
    let libraries = [
        { name: loader.loader.maven, url: "https://maven.fabricmc.net/" },
        { name: `net.fabricmc:yarn:${yarn}`, url: "https://maven.fabricmc.net/" },
        ...loader.launcherMeta.libraries.common,
        ...loader.launcherMeta.libraries[side],
    ];
    let mainClass = loader.launcherMeta.mainClass[side];
    let inheritsFrom = options.inheritsFrom || mcversion;

    let jsonFile = folder.getVersionJson(id);

    await ensureFile(jsonFile);
    await writeFile(jsonFile, JSON.stringify({
        id,
        inheritsFrom,
        mainClass,
        libraries,
        arguments: {
            game: [],
            jvm: [],
        },
        releaseTime: new Date().toJSON(),
        time: new Date().toJSON(),
    }));

    return id;
}
