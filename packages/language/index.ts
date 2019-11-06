import { missing } from "@xmcl/util";
import { MinecraftFolder, MinecraftLocation } from "@xmcl/common";
import * as fs from "fs";
import * as path from "path";

export class Language {
    constructor(readonly id: string, readonly name: string, readonly region: string, readonly bidirectional: boolean) { }
}

export namespace Language {
    /**
     * Read all Minecraft supported languages from a version of Minecraft game asset. This requires a installed Minecraft assets.
     *
     * @param location The location of Minecraft game, .minecraft folder
     * @param version The version you want to read
     */
    export async function read(location: MinecraftLocation, version: string): Promise<Language[]> {
        const loca: MinecraftFolder = typeof location === "string" ? new MinecraftFolder(location) : location;
        const json = path.join(loca.assets, "indexes", version + ".json");
        if (await missing(json)) {
            throw { type: "MissingVersionIndex", location: loca.root };
        }
        const obj = await fs.promises.readFile(json).then((b) => b.toString()).then(JSON.parse);
        const meta = obj.objects["pack.mcmeta"];
        const hash = meta.hash;
        const head = hash.substring(0, 2);
        const loc = path.join(loca.assets, "objects", head, hash);
        if (await missing(loc)) {
            throw { type: "PackMcmetaNotExist", hash, location: loca.root };
        }
        const langs = await fs.promises.readFile(loc).then((b) => b.toString()).then(JSON.parse);
        if (!langs.language) {
            throw { type: "IllegalPackMcmetaStructure", location: loca.root };
        }
        const arr = [];
        for (const langKey in langs.language) {
            const langObj = langs.language[langKey];
            arr.push(new Language(langKey, langObj.name, langObj.region, langObj.bidirectional));
        }
        return arr;
    }
}

export default Language;
