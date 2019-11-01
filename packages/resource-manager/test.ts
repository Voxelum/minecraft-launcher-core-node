import { ResourceLocation, ResourceManager } from ".";

describe("ResourceLocation", () => {
    describe("#ofModelPath", () => {
        test("default", () => {
            const l = ResourceLocation.ofModelPath("block/grass");
            expect(l.domain).toEqual("minecraft");
            expect(l.path).toEqual("models/block/grass.json");
        });
        test("custom domain", () => {
            const l = ResourceLocation.ofModelPath("my-modid:block/grass");
            expect(l.domain).toEqual("my-modid");
            expect(l.path).toEqual("models/block/grass.json");
        });
    });
    describe("#ofTexturePath", () => {
        test("default", () => {
            const l = ResourceLocation.ofTexturePath("block/grass");
            expect(l.domain).toEqual("minecraft");
            expect(l.path).toEqual("textures/block/grass.png");
        });
        test("custom domain", () => {
            const l = ResourceLocation.ofTexturePath("my-modid:block/grass");
            expect(l.domain).toEqual("my-modid");
            expect(l.path).toEqual("textures/block/grass.png");
        });
    });
    describe("#ofPath", () => {
        test("default", () => {
            const l = ResourceLocation.fromPath("some/block/image.png");
            expect(l.domain).toEqual("minecraft");
            expect(l.path).toEqual("some/block/image.png");
        });
        test("custom domain", () => {
            const l = ResourceLocation.fromPath("my-modid:some/block/image.png");
            expect(l.domain).toEqual("my-modid");
            expect(l.path).toEqual("some/block/image.png");
        });
    });
    test("#getAssetsPath", () => {
        const path = ResourceLocation.getAssetsPath({ domain: "modid", path: "path/to/file" });
        expect(path).toEqual("assets/modid/path/to/file");
    });
});

describe("ResourceManager", () => {
    test("#addResourceSource", async () => {
        const man = new ResourceManager();
        const dummy: any = {
            info() { return {}; },
            domains() { return []; },
        };
        await man.addResourceSource(dummy);
        expect(man.allSources).toHaveLength(1);
        expect(man.allSources[0]).toEqual({});
    });
    test("#load", async () => {
        const man = new ResourceManager();
        const dummy: any = {
            info() { return {}; },
            domains() { return []; },
            load() { return ""; },
        };
        await man.addResourceSource(dummy);
        await expect(man.load(ResourceLocation.fromPath("abc")))
            .resolves
            .toEqual("");
    });
    test("cache", async () => {
        const man = new ResourceManager();
        const monitor = jest.fn();
        const dummy: any = {
            info() { return {}; },
            domains() { return []; },
            load(r: any) { monitor(); return { location: r }; },
        };
        await man.addResourceSource(dummy);
        await man.load({ domain: "a", path: "b" });
        await man.load({ domain: "a", path: "b" });
        expect(monitor).toBeCalledTimes(1);
    });
    test("#clearCache", async () => {
        const man = new ResourceManager();
        const monitor = jest.fn();
        const dummy: any = {
            info() { return {}; },
            domains() { return []; },
            load(r: any) { monitor(); return { location: r }; },
        };
        await man.addResourceSource(dummy);
        await man.load({ domain: "a", path: "b" });
        man.clearCache();
        await man.load({ domain: "a", path: "b" });
        expect(monitor).toBeCalledTimes(2);
    });
    test("#clearAll", async () => {
        const man = new ResourceManager();
        const monitor = jest.fn();
        const dummy: any = {
            info() { return {}; },
            domains() { return []; },
            load(r: any) { monitor(); return { location: r }; },
        };
        await man.addResourceSource(dummy);
        await man.load({ domain: "a", path: "b" });
        man.clearAll();
        const result = await man.load({ domain: "a", path: "b" });
        expect(result).toBeUndefined();
        expect(monitor).toBeCalledTimes(1);
    });
    test("#swap", async () => {
        const man = new ResourceManager();
        const monitor = jest.fn();
        const dummy: any = {
            info() { return "A"; },
            domains() { return []; },
            load(r: any) { monitor(); return { location: r }; },
        };
        const dummyB: any = {
            info() { return "B"; },
            domains() { return []; },
            load(r: any) { monitor(); return { location: r }; },
        };
        await man.addResourceSource(dummy);
        await man.addResourceSource(dummyB);

        expect(man.allSources).toEqual(["A", "B"]);
        man.swap(0, 1);
        expect(man.allSources).toEqual(["B", "A"]);
    });
});
