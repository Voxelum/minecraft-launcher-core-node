import { fetchJson, getRawIfUpdate, UpdatedObject } from "./downloader";
import { MinecraftFolder, MinecraftLocation } from "@xmcl/core";
import { ensureFile, writeFile } from "@xmcl/core/fs";

export const YARN_MAVEN_URL = "https://maven.fabricmc.net/net/fabricmc/yarn/maven-metadata.xml";
export const LOADER_MAVEN_URL = "https://maven.fabricmc.net/net/fabricmc/fabric-loader/maven-metadata.xml";
export interface VersionList extends UpdatedObject {
    /**
     * All the yarn versions
     */
    yarnVersions: string[];
    /**
     * All the loader versions
     */
    loaderVersions: string[];
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
 * Get or refresh the version list.
 */
export async function getVersionList(versionList?: VersionList): Promise<VersionList> {
    const timestamp = versionList ? versionList.timestamp : undefined;
    const yarn = await getRawIfUpdate(YARN_MAVEN_URL, timestamp);
    const loader = await getRawIfUpdate(LOADER_MAVEN_URL, timestamp);
    let yarnList;
    let loaderList;
    if (yarn.content) {
        yarnList = parseVersionMavenXML(yarn.content);
    }
    if (loader.content) {
        loaderList = parseVersionMavenXML(loader.content);
    }
    return {
        yarnVersions: yarnList || (versionList ? versionList.yarnVersions : []),
        loaderVersions: loaderList || (versionList ? versionList.loaderVersions : []),
        timestamp: new Date(yarn.timestamp) > new Date(loader.timestamp) ? yarn.timestamp : loader.timestamp,
    }
}

/**
 * Install the fabric to the client. Notice that this will only install the json.
 * You need to call `Installer.installDependencies` to get a full client.
 * @param yarnVersion The yarn version
 * @param loaderVersion The fabric loader version
 * @param minecraft The minecraft location
 * @returns The installed version id
 */
export async function install(yarnVersion: string, loaderVersion: string, minecraft: MinecraftLocation) {
    const folder = MinecraftFolder.from(minecraft);
    const mcversion = yarnVersion.split("+")[0];
    const id = `${mcversion}-fabric${yarnVersion}-${loaderVersion}`;

    const jsonFile = folder.getVersionJson(id);

    const { body } = await fetchJson(`https://fabricmc.net/download/technic/?yarn=${encodeURIComponent(yarnVersion)}&loader=${encodeURIComponent(loaderVersion)}`);
    body.id = id;
    await ensureFile(jsonFile);
    await writeFile(jsonFile, JSON.stringify(body));

    return id;
}
