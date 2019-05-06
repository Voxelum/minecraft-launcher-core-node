import * as assert from "assert";
import { LiteLoader } from "..";

describe("Liteloader", () => {
    it("should be able to fetch liteloader version json", function () {
        return LiteLoader.VersionMetaList.update({}).then((list) => {
            assert(list);
        }).catch((e) => {
            if (e.error === "500: Internal Server Error") {
                console.warn("Liteloader website is down. Cannot test this.");
                this.skip();
            }
        });
    }).timeout(1000000);
    it("should not be able to read other file", async function () {
        try {
            const metadata = await LiteLoader.meta(`${this.assets}/sample-mod.jar`);
            throw new Error("Should not happen");
        } catch (e) {
            assert.equal(e.type, "IllegalInputType");
        }
        try {
            const metadata = await LiteLoader.meta(`${this.assets}/sample-map.zip`);
            throw new Error("Should not happen");
        } catch (e) {
            assert.equal(e.type, "IllegalInputType");
        }
        try {
            const metadata = await LiteLoader.meta(`${this.assets}/sample-resourcepack.zip`);
            throw new Error("Should not happen");
        } catch (e) {
            assert.equal(e.type, "IllegalInputType", "resourcepack");
        }
        try {
            const metadata = await LiteLoader.meta(`${this.assets}/not-exist`);
            throw new Error("Should not happen");
        } catch (e) {
            assert.equal(e.type, "IllegalInputType");
        }
    });
    it("should be able to parse liteloader info", async function () {
        const metadata = await LiteLoader.meta(`${this.assets}/sample-mod.litemod`);
        if (!metadata) { throw new Error("Should not happen"); }
        assert.equal(metadata.name, "ArmorsHUDRevived");
        assert.equal(metadata.mcversion, "1.12.r2");
        assert.deepEqual(metadata.revision, 143);
        assert.equal(metadata.author, "Shadow_Hawk");
    });
});
