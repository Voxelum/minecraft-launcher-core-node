import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { ResourcePack } from "./index";

before(function () {
    this.assets = path.normalize(path.join(__dirname, "..", "..", "assets"));
    this.gameDirectory = path.join(this.assets, "temp");
});

describe("Resourcepack", function () {
    it("should read resource pack correctly", async function () {
        const buff = fs.readFileSync(`${this.assets}/sample-resourcepack.zip`);
        const pack = await ResourcePack.read(`${this.assets}/sample-resourcepack.zip`, buff);
        if (!pack) { throw new Error("Pack cannot be null"); }
        assert.equal(pack.metadata.description, "Vattic\u0027s Faithful 32x32 pack");
        assert.equal(pack.metadata.pack_format, 1);
    });
    it("should read resource pack folder", async function () {
        const pack = await ResourcePack.read(`${this.assets}/sample-resourcepack`);
        if (!pack) { throw new Error("Pack cannot be null"); }
        assert.equal(pack.metadata.description, "Vattic\u0027s Faithful 32x32 pack");
        assert.equal(pack.metadata.pack_format, 1);
    });
});
