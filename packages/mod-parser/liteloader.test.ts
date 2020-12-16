import { MinecraftFolder } from "@xmcl/core";
import { join, normalize } from "path";
import { readLiteloaderMod } from "./liteloader";

describe("Liteloader", () => {
    const root = normalize(join(__dirname, "..", "..", "temp"));
    const mock = normalize(join(__dirname, "..", "..", "mock"));

    jest.setTimeout(100000000);

    describe("#meta", () => {
        test("should not be able to read other file", async () => {
            await expect(readLiteloaderMod(`${mock}/mods/sample-mod.jar`))
                .rejects
                .toHaveProperty("error", "IllegalInputType");
            await expect(readLiteloaderMod(`${mock}/saves/sample-map.zip`))
                .rejects
                .toHaveProperty("error", "IllegalInputType");
            await expect(readLiteloaderMod(`${mock}/resourcepacks/sample-resourcepack.zip`))
                .rejects
                .toHaveProperty("error", "IllegalInputType");
            await expect(readLiteloaderMod(`${mock}/not-exist.zip`))
                .rejects
                .toBeTruthy();
        });
        test("should be able to parse liteloader info", async () => {
            const metadata = await readLiteloaderMod(`${mock}/mods/sample-mod.litemod`);
            if (!metadata) { throw new Error("Should not happen"); }
            expect(metadata.name).toEqual("ArmorsHUDRevived");
            expect(metadata.mcversion).toEqual("1.12.r2");
            expect(metadata.revision).toEqual(143);
            expect(metadata.author).toEqual("Shadow_Hawk");
        });
    });
});
