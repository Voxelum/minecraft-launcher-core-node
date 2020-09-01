/**
 * The resource pack module to read Minecraft resource pack just like Minecraft in-game.
 *
 * You can open the ResourcePack by {@link ResourcePack.open} and get resource by {@link ResourcePack.get}.
 *
 * Or you can just load resource pack metadata by {@link readPackMetaAndIcon}.
 *
 * @packageDocumentation
 */

import { FileSystem, resolveFileSystem } from "@xmcl/system";
import { PackMeta } from "./format";

/**
 * The Minecraft used object to map the game resource location.
 */
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

/**
 * The resource in the resource pack on a `ResourceLocation`
 * @see {@link ResourceLocation}
 */
export interface Resource {
    /**
     * The absolute location of the resource
     */
    readonly location: ResourceLocation;
    /**
     * The real resource url which is used for reading the content of it.
     */
    readonly url: string;
    /**
     * Read the resource content
     */
    read(): Promise<Uint8Array>;
    read(encoding: undefined): Promise<Uint8Array>;
    read(encoding: "utf-8" | "base64"): Promise<string>;
    read(encoding?: "utf-8" | "base64"): Promise<Uint8Array | string>;
    /**
     * Read the metadata of the resource
     */
    readMetadata(): Promise<PackMeta>;
}

/**
 * The Minecraft resource pack. Providing the loading resource from `ResourceLocation` function.
 * It's a wrap of `FileSystem` which provides cross node/browser accssing.
 *
 * @see {@link ResourceLocation}
 * @see {@link FileSystem}
 */
export class ResourcePack {
    constructor(readonly fs: FileSystem) { }
    /**
     * Load the resource content
     * @param location The resource location
     * @param type The output type of the resource
     */
    async load(location: ResourceLocation, type?: "utf-8" | "base64"): Promise<Uint8Array | string | undefined> {
        const p = this.getPath(location);
        if (await this.fs.existsFile(p)) {
            return this.fs.readFile(p, type);
        }
        return undefined;
    }

    /**
     * Load the resource metadata which is localted at <resource-path>.mcmeta
     */
    async loadMetadata(location: ResourceLocation) {
        const p = this.getPath(location);
        const name = p.substring(0, p.lastIndexOf("."));
        const metafileName = name + ".mcmeta";
        return await this.fs.existsFile(metafileName) ? JSON.parse((await this.fs.readFile(metafileName, "utf-8")).replace(/^\uFEFF/, "")) : {}
    }

    /**
     * Get the url of the resource location.
     * Please notice that this is depended on `FileSystem` implementation of the `getUrl`.
     *
     * @returns The absolute url like `file://` or `http://` depending on underlaying `FileSystem`.
     * @see {@link FileSystem}
     */
    getUrl(location: ResourceLocation) {
        const p = this.getPath(location);
        return this.fs.getUrl(p);
    }

    /**
     * Get the resource on the resource location.
     *
     * It can be undefined if there is no resource at that location.
     * @param location THe resource location
     */
    async get(location: ResourceLocation): Promise<Resource | undefined> {
        if (await this.has(location)) {
            return {
                location,
                url: this.getUrl(location),
                read: ((encoding: any) => this.load(location, encoding)) as any,
                readMetadata: () => this.loadMetadata(location),
            }
        }
    }

    /**
     * Does the resource pack has the resource
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
        let { pack } = await this.fs.readFile("pack.mcmeta", "utf-8").then(
            (s) => JSON.parse(s.replace(/^\uFEFF/, "")),
            () => { throw new Error("Illegal Resourcepack: Cannot find pack.mcmeta!"); });
        if (!pack) {
            throw new Error("Illegal Resourcepack: pack.mcmeta doesn't contain the pack metadata!");
        }
        return pack;
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
        return new ResourcePack(await resolveFileSystem(resourcePack));
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
    const system = await resolveFileSystem(resourcePack);
    if (!await system.existsFile("pack.mcmeta")) {
        throw new Error("Illegal Resourcepack: Cannot find pack.mcmeta!");
    }
    const metadata = JSON.parse((await system.readFile("pack.mcmeta", "utf-8")).replace(/^\uFEFF/, ""));
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
    const system = await resolveFileSystem(resourcePack);
    return system.readFile("pack.png");
}

/**
 * Read both metadata and icon
 *
 * @see {@link readIcon}
 * @see {@link readPackMeta}
 */
export async function readPackMetaAndIcon(resourcePack: string | Uint8Array | FileSystem) {
    const system = await resolveFileSystem(resourcePack);
    return {
        metadata: await readPackMeta(system),
        icon: await readIcon(system).catch(() => undefined),
    };
}

