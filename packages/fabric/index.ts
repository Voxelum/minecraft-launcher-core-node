import { ensureFile, fetchJson, getIfUpdate, MinecraftFolder, MinecraftLocation, UpdatedObject } from "@xmcl/util";
import * as parser from "fast-html-parser";
import { promises } from "fs";

export namespace Fabric {
    export interface VersionList extends UpdatedObject {
        yarnVersions: string[];
        loaderVersions: string[];
    }

    function parseWebPage(content: string) {
        const dom = parser.parse(content);
        const yarns = dom.querySelector("#yarnVersion");
        const loaders = dom.querySelector("#loaderVersion");

        return {
            yarnVersions: yarns.childNodes.filter((n) => typeof n.attributes.value === "string")
                .map((n) => n.attributes.value as string),
            loaderVersions: loaders.childNodes.filter((n) => typeof n.attributes.value === "string")
                .map((n) => n.attributes.value as string),
        };
    }

    export async function updateVersionList(versionList?: VersionList) {
        return getIfUpdate("https://fabricmc.net/use/", parseWebPage, versionList);
    }

    export async function install(yarnVersion: string, loaderVersion: string, minecraft: MinecraftLocation) {
        const folder = MinecraftFolder.from(minecraft);
        const mcversion = yarnVersion.split("+")[0];
        const id = `${mcversion}-fabric${yarnVersion}-${loaderVersion}`;

        const jsonFile = folder.getVersionJson(id);

        const { body } = await fetchJson(`https://fabricmc.net/download/technic/?yarn=${encodeURIComponent(yarnVersion)}&loader=${encodeURIComponent(loaderVersion)}`);
        body.id = id;
        await ensureFile(jsonFile);
        await promises.writeFile(jsonFile, JSON.stringify(body));
    }
}
