import { fetchJson, getRawIfUpdate, UpdatedObject, InstallOptions } from "./util";
import { MinecraftFolder, MinecraftLocation } from "@xmcl/core";
import { ensureFile, writeFile } from "@xmcl/core/fs";

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

    const { body } = await fetchJson(`https://fabricmc.net/download/technic/?yarn=${encodeURIComponent(yarnVersion)}&loader=${encodeURIComponent(loaderVersion)}`);
    body.id = id;
    if (typeof options.inheritsFrom === "string") {
        body.inheritsFrom = options.inheritsFrom;
    }
    await ensureFile(jsonFile);
    await writeFile(jsonFile, JSON.stringify(body));

    return id;
}
