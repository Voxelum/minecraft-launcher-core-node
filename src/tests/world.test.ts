import * as assert from "assert";
import * as fs from "fs";
import got = require("got");
import { World } from "..";

describe("WorldInfo", () => {
    // it("should validate a simple map", async function() {
    //     const entry = await World.findEntry(`${this.assets}/sample-map`);
    //     assert(entry, "dir fail");
    //     assert.equal(entry, "level.dat");
    // });
    // it("should validate a zip map", async function() {
    //     const entry = await World.findEntry(`${this.assets}/sample-map.zip`);
    //     assert(entry, "zip fail");
    //     assert.equal(entry, "sample-map/level.dat");
    // });
    // it("should not validate a non-map directory", async function() {
    //     try {
    //         const entry = await World.findEntry(`${this.assets}/sample-resourcepack`);
    //         throw new Error("Fail");
    //     } catch (e) { }
    // });
    // it("should not validate a non-map file", async function() {
    //     try {
    //         const entry = await World.findEntry(`${this.assets}/sample-resourcepack.zip`);
    //         throw new Error("Fail");
    //     } catch (e) { }
    // });
    // it("should read a simpe map", function() {
    //     assert(World.parse(fs.readFileSync(`${this.assets}/sample-map/level.dat`)));
    // });
    it("should work", async function () {
        got.stream("https://minecraft.curseforge.com/projects/journeymap/files/2682921/download", {
            followRedirect: true,
        }).on("response", (resp) => {
            console.log("response");
            console.log(resp.url);
            console.log(resp.headers);
            console.log(resp.statusCode);
            console.log(resp.statusMessage);
            resp.pause();
        }).on("downloadProgress", (p) => {
            console.log(p);
        });
    });
});
