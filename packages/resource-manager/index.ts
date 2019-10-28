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

export interface PackInfo {
    readonly name: string;
    readonly description: string;
    readonly format: number;
    readonly icon?: string;
}

export interface Resource {
    /**
     * the absolute location of the resource
     */
    location: ResourceLocation;
    data: string;
    metadata?: { [section: string]: any };
}

export interface ResourceSource {
    readonly type: string;
    load(location: ResourceLocation, type?: "base64" | "text"): Promise<Resource | void>;
    has(location: ResourceLocation): Promise<boolean>;
    update(location: ResourceLocation, data: string, type?: "base64" | "text"): Promise<void>;
    domains(): Promise<string[]>;
    info(): Promise<PackInfo>;
}

interface ResourceSourceWrapper {
    source: ResourceSource;
    info: PackInfo;
    domains: string[];
}

export class ResourceManager {

    get allPacks() { return this.list.map((l) => l.info); }
    private cache: { [location: string]: Resource | undefined } = {};

    constructor(private list: ResourceSourceWrapper[] = []) { }

    async addResourceSource(source: ResourceSource) {
        const info = await source.info();
        const domains = await source.domains();
        const wrapper = { info, source, domains };

        this.list.push(wrapper);
    }

    clearCache() { this.cache = {}; }
    clearAll() {
        this.cache = {};
        this.list.splice(0, this.list.length);
    }

    swap(first: number, second: number) {
        if (first >= this.list.length || first < 0 || second >= this.list.length || second < 0) {
            throw new Error("Illegal index");
        }

        const fir = this.list[first];
        this.list[first] = this.list[second];
        this.list[second] = fir;

        this.clearCache();
    }

    invalidate(location: ResourceLocation) {
        delete this.cache[location.toString()];
    }

    async load(location: ResourceLocation, encoding: "base64" | "text" = "text"): Promise<Resource | undefined> {
        const cached = this.cache[location.toString()];
        if (cached) { return cached; }

        for (const src of this.list) {
            const loaded = await src.source.load(location, encoding);
            if (!loaded) { continue; }
            return this.putCache(loaded);
        }

        return undefined;
    }

    private putCache(res: Resource) {
        this.cache[res.location.toString()] = res;
        return res;
    }
}
