import { MinecraftLocation, MinecraftFolder } from './utils/folder';
import * as path from 'path'
import * as fs from 'fs-extra'

export class Language {
    constructor(readonly id: string, readonly name: string, readonly region: string, readonly bidirectional: boolean) { }
}

export namespace Language {
    export async function read(location: MinecraftLocation, version: string): Promise<Language[]> {
        const loca: MinecraftFolder = typeof location === 'string' ? new MinecraftFolder(location) : location;;
        let json = path.join(loca.assets, 'indexes', version + '.json');
        if (!fs.existsSync(json))
            throw { type: 'MissingVersionIndex', location: loca.root }
        let obj = await fs.readJson(json);
        let meta = obj.objects['pack.mcmeta'];
        let hash = meta.hash;
        let head = hash.substring(0, 2);
        let loc = path.join(loca.assets, 'objects', head, hash);
        if (!fs.existsSync(loc))
            throw { type: 'PackMcmetaNotExist', hash, location: loca.root };
        let langs = await fs.readJson(loc);
        if (!langs.language)
            throw { type: 'IllegalPackMcmetaStructure', location: loca.root };
        let arr = [];
        for (let langKey in langs.language) {
            let langObj = langs.language[langKey];
            arr.push(new Language(langKey, langObj.name, langObj.region, langObj.bidirectional));
        }
        return arr;
    }
}

export default Language;