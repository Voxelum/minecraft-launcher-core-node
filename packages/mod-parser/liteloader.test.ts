import { readLiteloaderMod } from "./liteloader";

declare const mockDir: string

describe("Liteloader", () => {
    jest.setTimeout(100000000);

    describe("#meta", () => {
        test("should not be able to read other file", async () => {
            await expect(readLiteloaderMod(`${mockDir}/mods/sample-mod.jar`))
                .rejects
                .toHaveProperty("error", "IllegalInputType");
            await expect(readLiteloaderMod(`${mockDir}/saves/sample-map.zip`))
                .rejects
                .toHaveProperty("error", "IllegalInputType");
            await expect(readLiteloaderMod(`${mockDir}/resourcepacks/sample-resourcepack.zip`))
                .rejects
                .toHaveProperty("error", "IllegalInputType");
            await expect(readLiteloaderMod(`${mockDir}/not-exist.zip`))
                .rejects
                .toBeTruthy();
        });
        test("should be able to parse liteloader info", async () => {
            const metadata = await readLiteloaderMod(`${mockDir}/mods/sample-mod.litemod`);
            if (!metadata) { throw new Error("Should not happen"); }
            expect(metadata.name).toEqual("ArmorsHUDRevived");
            expect(metadata.mcversion).toEqual("1.12.r2");
            expect(metadata.revision).toEqual(143);
            expect(metadata.author).toEqual("Shadow_Hawk");
        });
    });
});
