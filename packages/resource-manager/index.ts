import { PackMeta } from "@xmcl/common";

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
    constructor(
        readonly domain: string,
        readonly path: string) { }
    toString() { return `${this.domain}:${this.path}`; }
}

export interface Resource<T> {
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

/**
 * The source of the resource. You can think this as the resource pack in minecraft.
 */
export interface ResourceSource<T> {
    readonly type: string;
    /**
     * Load the resource
     * @param location The resource location
     * @param urlOnly Should only provide the url, no content
     */
    load(location: ResourceLocation, urlOnly: true): Promise<Resource<null> | void>;
    load(location: ResourceLocation, urlOnly: boolean): Promise<Resource<T> | void>;
    /**
     * Does the resource source has the resource
     */
    has(location: ResourceLocation): Promise<boolean>;
    /**
     * Update the resource content to the source
     * @param location The resource location
     * @param data The resource content
     */
    update(location: ResourceLocation, data: T): Promise<void>;
    /**
     * The owned domain. You can think about the modids.
     */
    domains(): Promise<string[]>;
    /**
     * The pack info, just like resource pack
     */
    info(): Promise<PackMeta.Pack>;
}

interface ResourceSourceWrapper<T> {
    source: ResourceSource<T>;
    info: PackMeta.Pack;
    domains: string[];
}

/**
 * The resource manager. Design to be able to use in both nodejs and browser environment.
 * @template T The type of the resource content. If you use this in node, it's probably `Buffer`. If you are in browser, it might be `string`. Just align this with your `ResourceSource`
 */
export class ResourceManager<T = string> {
    get allSources() { return this.list.map((l) => l.info); }
    private cache: { [location: string]: Resource<T> | undefined } = {};

    constructor(private list: Array<ResourceSourceWrapper<T>> = []) { }

    /**
     * Add a new resource source to the end of the resource list.
     */
    async addResourceSource(source: ResourceSource<T>) {
        const info = await source.info();
        const domains = await source.domains();
        const wrapper = { info, source, domains };

        this.list.push(wrapper);
    }

    /**
     * Clear all cache
     */
    clearCache() { this.cache = {}; }
    /**
     * Clear all resource source and cache
     */
    clearAll() {
        this.cache = {};
        this.list.splice(0, this.list.length);
    }

    /**
     * Swap the resource source priority.
     */
    swap(first: number, second: number) {
        if (first >= this.list.length || first < 0 || second >= this.list.length || second < 0) {
            throw new Error("Illegal index");
        }

        const fir = this.list[first];
        this.list[first] = this.list[second];
        this.list[second] = fir;

        this.clearCache();
    }

    /**
     * Invalidate the resource cache
     */
    invalidate(location: ResourceLocation) {
        delete this.cache[location.toString()];
    }

    load(location: ResourceLocation): Promise<Resource<T> | undefined>;
    load(location: ResourceLocation, urlOnly: false): Promise<Resource<T> | undefined>;
    load(location: ResourceLocation, urlOnly: true): Promise<Resource<null> | undefined>;
    /**
     * Load the resource in that location. This will walk through current resource source list to load the resource.
     * @param location The resource location
     * @param urlOnly If true, it will force return uri, else it will return the normal resource content
     */
    async load(location: ResourceLocation, urlOnly: boolean = false): Promise<any> {
        const cached = this.cache[location.toString()];
        if (cached) { return cached; }

        for (const src of this.list) {
            const loaded = await src.source.load(location, urlOnly);
            if (!loaded) { continue; }
            this.putCache(loaded);
            return loaded;
        }

        return undefined;
    }

    private putCache(res: Resource<T>) {
        this.cache[res.location.toString()] = res;
    }
}

export abstract class AbstractResourceSource<T> implements ResourceSource<T> {
    constructor(readonly type: string) { }

    async load(location: ResourceLocation, urlOnly: boolean) {
        const path = `assets/${location.domain}/${location.path}`;
        const resource: Resource<any> = {
            url: this.getUrl(path),
            content: urlOnly ? null : await this.loadResource(path),
            location,
            metadata: await this.loadResourceMetadata(path),
        };
        return resource;
    }
    has(location: ResourceLocation): Promise<boolean> {
        return this.hasResource(`assets/${location.domain}/${location.path}`);
    }

    update(location: ResourceLocation, data: T): Promise<void> {
        throw new Error("Unsupported");
    }

    abstract domains(): Promise<string[]>;
    abstract info(): Promise<PackMeta.Pack>;

    protected abstract hasResource(path: string): Promise<boolean>;
    protected abstract loadResource(path: string): Promise<T>;
    protected abstract loadResourceMetadata(path: string): Promise<any>;
    protected abstract getUrl(path: string): string;
}

export * from "./model-loader";
