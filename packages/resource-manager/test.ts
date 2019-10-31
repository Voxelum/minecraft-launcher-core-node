import { ResourceLocation, ResourceManager } from ".";

describe("ResourceManager", () => {
    test("#addResourceSource", () => {
        const man = new ResourceManager();
        const dummy: any = { info() { return {}; }, domain() { return []; } };
        man.addResourceSource(dummy);
        expect(man.allSources).toHaveLength(1);
        expect(man.allSources[0]).toEqual({});
    });
    test("#load", () => {
        const man = new ResourceManager();
        const dummy: any = {
            info() { return {}; }, domain() { return []; }, load() {
                return "";
            },
        };
        man.addResourceSource(dummy);
        expect(man.load(ResourceLocation.fromPath("abc")))
            .resolves
            .toEqual("");
    });
    test("#clearCache", () => {

    });
});
