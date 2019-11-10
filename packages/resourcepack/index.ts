import { FileSystem, System } from "@xmcl/common";
import { PackMeta } from "./format";

export class ResourceLocation {
    /**
     * build from texture path
     */
    static ofTexturePath(path: string) {
        const idx = path.indexOf(":");
        if (idx === -1) { return new ResourceLocation("minecraft", `textures/${path}.png`); }
        if (idx === 0) { return new ResourceLocation("minecraft", `textures/${path.substring(1, path.length)}.png`); }
        return new ResourceLocation(path.substring(0, idx), `textures/${path.substring(idx + 1, path.length)}.png`);
    }

    /**
     * build from model path
     */
    static ofModelPath(path: string) {
        const idx = path.indexOf(":");
        if (idx === -1) { return new ResourceLocation("minecraft", `models/${path}.json`); }
        if (idx === 0) { return new ResourceLocation("minecraft", `models/${path.substring(1, path.length)}.json`); }
        return new ResourceLocation(path.substring(0, idx), `models/${path.substring(idx + 1, path.length)}.json`);
    }

    /**
     * from absoluted path
     */
    static fromPath(path: string) {
        const idx = path.indexOf(":");
        if (idx === -1) { return new ResourceLocation("minecraft", path); }
        if (idx === 0) { return new ResourceLocation("minecraft", path.substring(1, path.length)); }
        return new ResourceLocation(path.substring(0, idx), path.substring(idx + 1, path.length));
    }

    static getAssetsPath(location: ResourceLocation) {
        return `assets/${location.domain}/${location.path}`;
    }

    constructor(
        readonly domain: string,
        readonly path: string) { }
    toString() { return `${this.domain}:${this.path}`; }
}

export interface Resource<T = Uint8Array> {
    /**
     * the absolute location of the resource
     */
    location: ResourceLocation;
    /**
     * The real resource url;
     */
    url: string;
    /**
     * The resource content
     */
    content: T;
    /**
     * The metadata of the resource
     */
    metadata: PackMeta;
}

export interface ResourcePack {
    /**
     * Load the resource
     * @param location The resource location
     * @param urlOnly Should only provide the url, no content
     */
    load(location: ResourceLocation, urlOnly: true): Promise<Resource | void>;
    load(location: ResourceLocation, urlOnly: boolean): Promise<Resource | void>;
    /**
     * Does the resource source has the resource
     */
    has(location: ResourceLocation): Promise<boolean>;
    /**
     * The owned domain. You can think about the modids.
     */
    domains(): Promise<string[]>;
    /**
     * The pack info, just like resource pack
     */
    info(): Promise<PackMeta.Pack>;

    /**
     * The icon of the resource pack
     */
    icon(): Promise<Uint8Array>;
}

class ResourcePackImpl implements ResourcePack {
    async load(location: ResourceLocation, urlOnly: any) {
        const p = this.getPath(location);
        const name = p.substring(0, p.lastIndexOf("."));
        const metafileName = name + ".mcmeta";
        if (await this.fs.existsFile(p)) {
            return {
                location,
                url: this.fs.type === "path" ? `file://${this.fs.root}${p}` : "",
                content: await this.fs.readFile(p),
                metadata: await this.fs.existsFile(metafileName) ? JSON.parse(await this.fs.readFile(metafileName, "utf-8")) : {}
            };
        }
        return undefined;
    }
    has(location: ResourceLocation): Promise<boolean> {
        return this.fs.existsFile(this.getPath(location));
    }
    async domains(): Promise<string[]> {
        const files = await this.fs.listFiles("assets");
        const result: string[] = [];
        for (const f of files) {
            if (await this.fs.isDirectory("assets/" + f)) {
                result.push(f);
            }
        }
        return result;
    }
    async info(): Promise<PackMeta.Pack> {
        return JSON.parse(await this.fs.readFile("pack.mcmeta", "utf-8"));
    }
    icon(): Promise<Uint8Array> {
        return this.fs.readFile("pack.png");
    }
    constructor(private fs: FileSystem) { }

    private getPath(location: ResourceLocation) {
        return `assets/${location.domain}/${location.path}`;
    }
}

export namespace ResourcePack {
    export async function open(resourcePack: string | Buffer): Promise<ResourcePack> {
        return new ResourcePackImpl(await System.openFileSystem(resourcePack));
    }
    /**
     * Read the resource pack metadata from zip file or directory.
     *
     * If you have already read the data of the zip file, you can pass it as the second parameter. The second parameter will be ignored on reading directory.
     *
     * @param resourcePack The absolute path of the resource pack file
     * @param buffer The zip file data Buffer you read.
     * @param cacheIcon If cache the icon in to the resource pack object
     */
    export async function head(resourcePack: string | Buffer, cacheIcon?: boolean): Promise<{ metadata: PackMeta.Pack, icon?: string }> {
        const system = await System.openFileSystem(resourcePack);
        if (!await system.existsFile("pack.mcmeta")) {
            throw new Error("Illegal Resourcepack: Cannot find pack.mcmeta!");
        }
        const metadata = JSON.parse(await system.readFile("pack.mcmeta", "utf-8"));
        if (!metadata.pack) {
            throw new Error("Illegal Resourcepack: pack.mcmeta doesn't contain the pack metadata!");
        }
        let icon;
        if (cacheIcon) {
            icon = "data:image/png;base64, " + await system.readFile("pack.png", "base64");
        }
        return { metadata: metadata.pack, icon };
    }
}

export * from "./format";
export default ResourcePack;
