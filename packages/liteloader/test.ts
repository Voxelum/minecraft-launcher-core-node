import { MinecraftFolder } from "@xmcl/util";
import * as path from "path";
import * as assert from "assert";
import { LiteLoader } from "./index";

before(function () {
    this.assets = path.normalize(path.join(__dirname, "..", "..", "assets"));
    this.gameDirectory = path.join(this.assets, "temp");
});

describe("Liteloader", async function () {
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

    it("should be able to install liteloader on 1.12.2", async function () {
        // tslint:disable-next-line:max-line-length
        const meta: LiteLoader.VersionMeta = { url: "http://repo.mumfrey.com/content/repositories/snapshots/", type: "SNAPSHOT", file: "liteloader-1.12.2-SNAPSHOT.jar", version: "1.12.2-SNAPSHOT", md5: "1420785ecbfed5aff4a586c5c9dd97eb", timestamp: "1511880271", mcversion: "1.12.2", tweakClass: "com.mumfrey.liteloader.launch.LiteLoaderTweaker", libraries: [{ name: "net.minecraft:launchwrapper:1.12" }, { name: "org.ow2.asm:asm-all:5.2" }] };
        return LiteLoader.installAndCheck(meta, new MinecraftFolder(this.gameDirectory));
    }).timeout(100000000);
    it("should be able to install liteloader to forge", async function () {
        // tslint:disable-next-line:max-line-length
        const meta: LiteLoader.VersionMeta = { url: "http://repo.mumfrey.com/content/repositories/snapshots/", type: "SNAPSHOT", file: "liteloader-1.12.2-SNAPSHOT.jar", version: "1.12.2-SNAPSHOT", md5: "1420785ecbfed5aff4a586c5c9dd97eb", timestamp: "1511880271", mcversion: "1.12.2", tweakClass: "com.mumfrey.liteloader.launch.LiteLoaderTweaker", libraries: [{ name: "net.minecraft:launchwrapper:1.12" }, { name: "org.ow2.asm:asm-all:5.2" }] };
        return LiteLoader.installAndCheck(meta, new MinecraftFolder(this.gameDirectory), "1.12.2-forge1.12.2-14.23.5.2823");
    }).timeout(100000000);
});
