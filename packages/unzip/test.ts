import { createReadStream, existsSync } from "fs";
import { join } from "path";
import { extract, createExtractStream } from ".";

const mockRoot = join(__dirname, "..", "..", "mock");
const tempRoot = join(__dirname, "..", "..", "temp");

describe("Unzip", () => {
    describe("#extractEntries", () => {
        test("should extract the exact entry", async () => {
            await extract(join(mockRoot, "mods", "sample-mod.jar"), tempRoot, { entries: ["mcmod.info"] });
            expect(existsSync(join(tempRoot, "mcmod.info"))).toBeTruthy();
        });
        test("should extract the nested entry", async () => {
            await extract(join(mockRoot, "mods", "sample-mod-1.13.jar"), join(tempRoot, "unzip-test"));
            expect(existsSync(join(tempRoot, "unzip-test", "mezz", "jei", "JustEnoughItems.class"))).toBeTruthy();
        });
    });
    describe("#createExtractStream", () => {
        test("should extract the exact entry", async () => {
            await createReadStream(join(mockRoot, "mods", "sample-mod.jar"))
                .pipe(createExtractStream(tempRoot, { entries: ["Config.class"] }))
                .wait();
            expect(existsSync(join(tempRoot, "Config.class"))).toBeTruthy();
        });
    });
});
