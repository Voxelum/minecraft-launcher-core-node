import { MinecraftFolder } from "@xmcl/util";
import * as path from "path";
import { LiteLoader } from "./index";

describe.skip("Liteloader", async () => {
    const root = path.normalize(path.join(__dirname, "..", "..", "temp"));

    jest.setTimeout(100000000);

    test("should be able to fetch liteloader version json", () => {
        return LiteLoader.VersionMetaList.update({}).then((list) => {
            expect(list).toBeTruthy();
        }).catch((e) => {
            if (e.error === "500: Internal Server Error") {
                console.warn("Liteloader website is down. Cannot test this.");
            }
        });
    });
    test("should not be able to read other file", async () => {
        expect(LiteLoader.meta(`${root}/sample-mod.jar`))
            .rejects
            .toHaveProperty("type", "IllegalInputType");
        expect(LiteLoader.meta(`${root}/sample-map.zip`))
            .rejects
            .toHaveProperty("type", "IllegalInputType");
        expect(LiteLoader.meta(`${root}/sample-resourcepack.zip`))
            .rejects
            .toHaveProperty("type", "IllegalInputType");
        expect(LiteLoader.meta(`${root}/not-exist.zip`))
            .rejects
            .toHaveProperty("type", "IllegalInputType");
    });
    test("should be able to parse liteloader info", async () => {
        const metadata = await LiteLoader.meta(`${root}/sample-mod.litemod`);
        if (!metadata) { throw new Error("Should not happen"); }
        expect(metadata.name).toEqual("ArmorsHUDRevived");
        expect(metadata.mcversion).toEqual("1.12.r2");
        expect(metadata.revision).toEqual(143);
        expect(metadata.author).toEqual("Shadow_Hawk");
    });

    test("should be able to install liteloader on 1.12.2", async () => {
        // tslint:disable-next-line:max-line-length
        const meta: LiteLoader.VersionMeta = { url: "http://repo.mumfrey.com/content/repositories/snapshots/", type: "SNAPSHOT", file: "liteloader-1.12.2-SNAPSHOT.jar", version: "1.12.2-SNAPSHOT", md5: "1420785ecbfed5aff4a586c5c9dd97eb", timestamp: "1511880271", mcversion: "1.12.2", tweakClass: "com.mumfrey.liteloader.launch.LiteLoaderTweaker", libraries: [{ name: "net.minecraft:launchwrapper:1.12" }, { name: "org.ow2.asm:asm-all:5.2" }] };
        return LiteLoader.installAndCheck(meta, new MinecraftFolder(root));
    });
    test("should be able to install liteloader to forge", async () => {
        // tslint:disable-next-line:max-line-length
        const meta: LiteLoader.VersionMeta = { url: "http://repo.mumfrey.com/content/repositories/snapshots/", type: "SNAPSHOT", file: "liteloader-1.12.2-SNAPSHOT.jar", version: "1.12.2-SNAPSHOT", md5: "1420785ecbfed5aff4a586c5c9dd97eb", timestamp: "1511880271", mcversion: "1.12.2", tweakClass: "com.mumfrey.liteloader.launch.LiteLoaderTweaker", libraries: [{ name: "net.minecraft:launchwrapper:1.12" }, { name: "org.ow2.asm:asm-all:5.2" }] };
        return LiteLoader.installAndCheck(meta, new MinecraftFolder(root), "1.12.2-forge1.12.2-14.23.5.2823");
    });
});
