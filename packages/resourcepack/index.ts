import { FileSystem, System } from "@xmcl/system";
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

export class ResourcePack {
    constructor(private fs: FileSystem) { }
    /**
     * Load the resource
     * @param location The resource location
     * @param urlOnly Should only provide the url, no content
     */
    load(location: ResourceLocation, urlOnly: boolean): Promise<Resource | void>;
    async load(location: ResourceLocation, urlOnly: boolean): Promise<Resource | void> {
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
    /**
     * Does the resource source has the resource
     */
    has(location: ResourceLocation): Promise<boolean> {
        return this.fs.existsFile(this.getPath(location));
    }
    /**
     * The owned domain. You can think about the modids.
     */
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
    /**
     * The pack info, just like resource pack
     */
    async info(): Promise<PackMeta.Pack> {
        return JSON.parse(await this.fs.readFile("pack.mcmeta", "utf-8"));
    }

    /**
     * The icon of the resource pack
     */
    icon(): Promise<Uint8Array> {
        return this.fs.readFile("pack.png");
    }

    private getPath(location: ResourceLocation) {
        return `assets/${location.domain}/${location.path}`;
    }

    static async open(resourcePack: string | Uint8Array | FileSystem): Promise<ResourcePack> {
        return new ResourcePack(await System.resolveFileSystem(resourcePack));
    }
}

export * from "./format";

/**
 * Read the resource pack metadata from zip file or directory.
 *
 * If you have already read the data of the zip file, you can pass it as the second parameter. The second parameter will be ignored on reading directory.
 *
 * @param resourcePack The absolute path of the resource pack file, or a buffer, or a opened resource pack.
 */
export async function readPackMeta(resourcePack: string | Uint8Array | FileSystem): Promise<PackMeta.Pack> {
    const system = await System.resolveFileSystem(resourcePack);
    if (!await system.existsFile("pack.mcmeta")) {
        throw new Error("Illegal Resourcepack: Cannot find pack.mcmeta!");
    }
    const metadata = JSON.parse(await system.readFile("pack.mcmeta", "utf-8"));
    if (!metadata.pack) {
        throw new Error("Illegal Resourcepack: pack.mcmeta doesn't contain the pack metadata!");
    }
    return metadata.pack;
}

/**
 * Read the resource pack icon png binary.
 * @param resourcePack The absolute path of the resource pack file, or a buffer, or a opened resource pack.
 */
export async function readIcon(resourcePack: string | Uint8Array | FileSystem): Promise<Uint8Array> {
    const system = await System.resolveFileSystem(resourcePack);
    return system.readFile("pack.png");
}

/**
 * Read both metadata and icon
 */
export async function readPackMetaAndIcon(resourcePack: string | Uint8Array | FileSystem) {
    const system = await System.resolveFileSystem(resourcePack);
    return {
        metadata: await readPackMeta(system),
        icon: await readIcon(system).catch(() => undefined),
    };
}

