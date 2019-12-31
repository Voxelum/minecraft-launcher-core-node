import { MinecraftFolder } from "@xmcl/core";
import { LiteLoaderInstaller } from "./liteloader";
import { join, normalize } from "path";

const tempRoot = normalize(join(__dirname, "..", "..", "temp"));
const mockRoot = normalize(join(__dirname, "..", "..", "mock"));

describe("Liteloader", () => {
    describe("#update", () => {
        test("should be able to fetch liteloader version json", async () => {
            await LiteLoaderInstaller.VersionMetaList.update({}).then((list) => {
                expect(list).toBeTruthy();
            }).catch((e) => {
                if (e.error === "500: Internal Server Error") {
                    console.warn("Liteloader website is down. Cannot test this.");
                }
            });
        });
    });
    describe("#install", () => {
        test("should be able to install liteloader on 1.12.2", async () => {
            // tslint:disable-next-line:max-line-length
            const meta: LiteLoaderInstaller.VersionMeta = { url: "http://repo.mumfrey.com/content/repositories/snapshots/", type: "SNAPSHOT", file: "liteloader-1.12.2-SNAPSHOT.jar", version: "1.12.2-SNAPSHOT", md5: "1420785ecbfed5aff4a586c5c9dd97eb", timestamp: "1511880271", mcversion: "1.12.2", tweakClass: "com.mumfrey.liteloader.launch.LiteLoaderTweaker", libraries: [{ name: "net.minecraft:launchwrapper:1.12" }, { name: "org.ow2.asm:asm-all:5.2" }] };
            await LiteLoaderInstaller.installAndCheck(meta, MinecraftFolder.from(tempRoot));
        });
        test("should be able to install liteloader to forge", async () => {
            // tslint:disable-next-line:max-line-length
            const meta: LiteLoaderInstaller.VersionMeta = { url: "http://repo.mumfrey.com/content/repositories/snapshots/", type: "SNAPSHOT", file: "liteloader-1.12.2-SNAPSHOT.jar", version: "1.12.2-SNAPSHOT", md5: "1420785ecbfed5aff4a586c5c9dd97eb", timestamp: "1511880271", mcversion: "1.12.2", tweakClass: "com.mumfrey.liteloader.launch.LiteLoaderTweaker", libraries: [{ name: "net.minecraft:launchwrapper:1.12" }, { name: "org.ow2.asm:asm-all:5.2" }] };
            await LiteLoaderInstaller.installAndCheck(meta, MinecraftFolder.from(tempRoot), "1.12.2-forge1.12.2-14.23.5.2823");
        });
    });
});
