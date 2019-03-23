import * as assert from "assert";
import { Forge, Mod } from "../index";

describe("Mod", () => {
    it("should read mod in jar", async function() {
        const v = await Mod.parse(`${this.assets}/sample-mod.jar`, "forge");
        assert(v);
    });
    it("litemod reading", async function() {
        const v = await Mod.parse(`${this.assets}/sample-mod.litemod`, "liteloader");
        assert(v);
    });
});
