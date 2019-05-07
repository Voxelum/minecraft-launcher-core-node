import * as assert from "assert";
import { World } from "..";

describe("World", () => {
    it("should load level of a simple map", async function () {
        const { level } = await World.load(`${this.assets}/sample-map`, ["level"]);
        assert(level, "dir fail");
    });

    it("should load level of a simple map from zip", async function () {
        const { level } = await World.load(`${this.assets}/sample-map.zip`, ["level"]);
        assert.equal(level.DataVersion, 512);
        assert.equal(level.LevelName, "Testa");
        assert.equal(level.Difficulty, 2);
    });

    it("should not load a non-map directory", async function () {
        try {
            const entry = await World.load(`${this.assets}/sample-resourcepack`, ["level"]);
            throw new Error("Fail");
        } catch (e) { }
    });
    it("should not load a non-map file", async function () {
        try {
            const entry = await World.load(`${this.assets}/sample-resourcepack.zip`, ["level"]);
            throw new Error("Fail");
        } catch (e) { }
    });
});
