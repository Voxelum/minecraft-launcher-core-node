import { PackMeta, ResourcePack, Resource, ResourceLocation } from "@xmcl/resourcepack";

interface ResourceSourceWrapper {
    source: ResourcePack;
    info: PackMeta.Pack;
    domains: string[];
}

/**
 * The resource manager just like Minecraft. Design to be able to use in both nodejs and browser environment.
 */
export class ResourceManager {
    get allResourcePacks() { return this.list.map((l) => l.info); }

    constructor(private list: Array<ResourceSourceWrapper> = []) { }

    /**
     * Add a new resource source to the end of the resource list.
     */
    async addResourcePack(resourcePack: ResourcePack) {
        let info;
        try {
            info = await resourcePack.info();
        } catch{
            info = { pack_format: -1, description: "" };
        }
        const domains = await resourcePack.domains();
        const wrapper = { info, source: resourcePack, domains };

        this.list.push(wrapper);
    }

    /**
     * Clear all resource packs in this manager
     */
    clear() {
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
    }

    /**
    * Get the resource in that location. This will walk through current resource source list to load the resource.
    * @param location The resource location
    */
    async get(location: ResourceLocation): Promise<Resource | undefined> {
        for (const src of this.list) {
            let resource = await src.source.get(location);
            if (resource) { return resource; }
        }
        return undefined;
    }
}

export * from "./model-loader";
