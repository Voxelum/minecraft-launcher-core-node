import { PackMeta } from "@xmcl/common";
import { ResourcePack, Resource, ResourceLocation } from "@xmcl/resourcepack";

interface ResourceSourceWrapper {
    source: ResourcePack;
    info: PackMeta.Pack;
    domains: string[];
}

/**
 * The resource manager. Design to be able to use in both nodejs and browser environment.
 * @template T The type of the resource content. If you use this in node, it's probably `Buffer`. If you are in browser, it might be `string`. Just align this with your `ResourceSource`
 */
export class ResourceManager {
    get allResourcePacks() { return this.list.map((l) => l.info); }
    private cache: { [location: string]: Resource | undefined } = {};

    constructor(private list: Array<ResourceSourceWrapper> = []) { }

    /**
     * Add a new resource source to the end of the resource list.
     */
    async addResourcePack(resourcePack: ResourcePack) {
        const info = await resourcePack.info();
        const domains = await resourcePack.domains();
        const wrapper = { info, source: resourcePack, domains };

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
        delete this.cache[`${location.domain}:${location.path}`];
    }

    load(location: ResourceLocation): Promise<Resource | undefined>;
    load(location: ResourceLocation, urlOnly: false): Promise<Resource | undefined>;
    load(location: ResourceLocation, urlOnly: true): Promise<Resource | undefined>;
    /**
     * Load the resource in that location. This will walk through current resource source list to load the resource.
     * @param location The resource location
     * @param urlOnly If true, it will force return uri, else it will return the normal resource content
     */
    async load(location: ResourceLocation, urlOnly: boolean = false): Promise<any> {
        const cached = this.cache[`${location.domain}:${location.path}`];
        if (cached) { return cached; }

        for (const src of this.list) {
            const loaded = await src.source.load(location, urlOnly);
            if (!loaded) { continue; }
            this.putCache(loaded);
            return loaded;
        }

        return undefined;
    }

    private putCache(res: Resource) {
        this.cache[`${res.location.domain}:${res.location.path}`] = res;
    }
}

export * from "./model-loader";
