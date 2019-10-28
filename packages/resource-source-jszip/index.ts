import { PackInfo, ResourceLocation, ResourceSource } from "@xmcl/resource-manager";
import Zip from "jszip";

const ATOZ = /[a-z]/;

export class ResourceSourceZip implements ResourceSource {
    type = "zip";
    constructor(readonly name: string, private zip: Zip) { }
    update(location: ResourceLocation, data: string, type: "base64" | "text" = "text"): Promise<void> {
        const path = `assets/${location.domain}/${location.path}`;
        this.zip.file(path, data, { base64: type === "base64" });
        return Promise.resolve();
    }
    has(location: ResourceLocation): Promise<boolean> {
        const path = `assets/${location.domain}/${location.path}`;
        const file = this.zip.file(path);
        if (!file) { return Promise.resolve(true); }
        return Promise.resolve(false);
    }
    async load(location: ResourceLocation, type: "base64" | "text" = "text") {
        const path = `assets/${location.domain}/${location.path}`;
        const file = this.zip.file(path);
        if (!file) { return Promise.resolve(); }

        const metaPath = `${path}.mcmeta`;
        const metaFile = this.zip.file(metaPath);
        return {
            data: await file.async(type),
            metadata: metaFile ? JSON.parse(await metaFile.async("text")) : undefined,
            location,
        };
    }
    async info(): Promise<PackInfo> {
        const iconPath = this.zip.file("pack.png");
        const metaPath = this.zip.file("pack.mcmeta");
        const info: any = {
            name: this.name,
            description: "",
            format: -1,
            icon: undefined,
        };
        if (iconPath) { info.icon = await iconPath.async("base64"); }
        if (metaPath) {
            const { description, pack_format } = JSON.parse(await metaPath.async("text")).pack;
            info.description = description;
            info.format = pack_format;
        }
        return info;
    }
    domains(): Promise<string[]> {
        const set: { [domain: string]: boolean } = {};
        Object.keys(this.zip.files)
            .filter((file) => file.startsWith("assets") && file.length > 7 && file[7].match(ATOZ))
            .map((file) => file.substring(7, file.indexOf("/", 7)))
            .forEach((file) => { set[file] = true; });
        return Promise.resolve(Object.keys(set));
    }
}
