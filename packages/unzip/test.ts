import { createReadStream, existsSync } from "fs";
import { join } from "path";
import Unzip from ".";

const mockRoot = join(__dirname, "..", "..", "mock");
const tempRoot = join(__dirname, "..", "..", "temp");

describe("Unzip", () => {
    describe("#extractEntries", () => {
        test("should extract the exact entry", async () => {
            await Unzip.extractEntries(join(mockRoot, "mods", "sample-mod.jar"), tempRoot, ["mcmod.info"]);
            expect(existsSync(join(tempRoot, "mcmod.info"))).toBeTruthy();
        });
    });
    describe("#createExtractStream", () => {
        test("should extract the exact entry", async () => {
            await createReadStream(join(mockRoot, "mods", "sample-mod.jar"))
                .pipe(Unzip.createExtractStream(tempRoot, ["Config.class"]))
                .wait();
            expect(existsSync(join(tempRoot, "Config.class"))).toBeTruthy();
        });
    });
    describe("#createParseStream", () => {
        test("should parse the exact entry", async () => {
            const result = await createReadStream(join(mockRoot, "mods", "sample-mod.jar"))
                .pipe(Unzip.createParseEntriesStream(["Config.class"]))
                .wait();
            expect(result.entries["Config.class"]).toBeTruthy();
            expect(Object.keys(result.entries)).toHaveLength(1);
        });
    });
});
