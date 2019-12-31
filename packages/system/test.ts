import { join } from "path";
import { System } from ".";

const mockRoot = join(__dirname, "..", "..", "mock");

describe("FileSystem", () => {
    describe("#listFiles", () => {
        test("should list file in jar", async () => {
            const fs = await System.openFileSystem(join(mockRoot, "mods", "sample-mod.jar"));
            const files = await fs.listFiles("/");
            expect(files).toEqual(["Config.class", "mcmod.info", "NuclearCraft.class"])
        });
        test("should list file in litemods", async () => {
            const fs = await System.openFileSystem(join(mockRoot, "mods", "sample-mod.litemod"));
            const files = await fs.listFiles("/");
            expect(files).toEqual(["META-INF", "com", "assets", "litemod.json"]);
        });
        test("should list file in zip", async () => {
            const fs = await System.openFileSystem(join(mockRoot, "resourcepacks", "sample-resourcepack.zip"));
            const files = await fs.listFiles("/");
            expect(files).toEqual(["pack.mcmeta", "pack.png"]);
        });
        test("should list nested file in zip", async () => {
            const fs = await System.openFileSystem(join(mockRoot, "resourcepacks", "1.14.4.zip"));
            const files = await fs.listFiles("assets");
            expect(files).toEqual([".mcassetsroot", "minecraft", "realms"]);
        });
    });
    describe("#missingFile", () => {
        test("should detect missing file", async () => {
            const fs = await System.openFileSystem(join(mockRoot, "resourcepacks", "1.14.4.zip"));
            await expect(fs.missingFile("assetss"))
                .resolves
                .toBeTruthy();
        });
        test("should detect non-missing file", async () => {
            const fs = await System.openFileSystem(join(mockRoot, "resourcepacks", "1.14.4.zip"));
            await expect(fs.missingFile("assets"))
                .resolves
                .toBeFalsy();
        });
    });
    describe("#existsFile", () => {
        test("should detect missing file", async () => {
            const fs = await System.openFileSystem(join(mockRoot, "resourcepacks", "1.14.4.zip"));
            await expect(fs.existsFile("assetss"))
                .resolves
                .toBeFalsy();
        });
        test("should detect non-missing file", async () => {
            const fs = await System.openFileSystem(join(mockRoot, "resourcepacks", "1.14.4.zip"));
            await expect(fs.existsFile("assets"))
                .resolves
                .toBeTruthy();
        });
    });
    describe("#walkFiles", () => {
        test("should walk every files in folder", async () => {
            const fs = await System.openFileSystem(join(mockRoot, "resourcepacks"));
            const paths: string[] = [];
            await fs.walkFiles("/", (path) => {
                paths.push(path);
            });
            expect(paths).toHaveLength(5);
        });
        test("should walk every files in zip", async () => {
            const fs = await System.openFileSystem(join(mockRoot, "resourcepacks", "1.14.4.zip"));
            const paths: string[] = [];
            await fs.walkFiles("/", (path) => {
                paths.push(path);
            });
            expect(paths).toEqual([
                "assets/.mcassetsroot",
                "assets/minecraft/blockstates/grass_block.json",
                "assets/minecraft/models/block/block.json",
                "assets/minecraft/models/block/grass_block.json",
                "assets/minecraft/models/block/grass_block_snow.json",
                "assets/minecraft/shaders/post/antialias.json",
                "assets/minecraft/shaders/program/antialias.fsh",
                "assets/minecraft/shaders/program/antialias.json",
                "assets/minecraft/textures/block/dirt.png",
                "assets/minecraft/textures/block/grass_block_side.png",
                "assets/minecraft/textures/block/grass_block_side_overlay.png",
                "assets/minecraft/textures/block/grass_block_snow.png",
                "assets/minecraft/textures/block/grass_block_top.png",
                "data/.mcassetsroot",
                "data/minecraft/recipes/bookshelf.json"
            ])
        });
    });
    describe("#isDirectory", () => {
        test("should identify dir on root", async () => {
            const fs = await System.openFileSystem(join(mockRoot, "resourcepacks", "1.14.4.zip"));
            await expect(fs.isDirectory("assets"))
                .resolves
                .toBeTruthy();
        });
        test("should identify nested dir", async () => {
            const fs = await System.openFileSystem(join(mockRoot, "resourcepacks", "1.14.4.zip"));
            await expect(fs.isDirectory("assets/minecraft"))
                .resolves
                .toBeTruthy();
        });
        test("should identify nested file", async () => {
            const fs = await System.openFileSystem(join(mockRoot, "resourcepacks", "1.14.4.zip"));
            await expect(fs.isDirectory("assets/.mcassetsroot"))
                .resolves
                .toBeFalsy();
        });
        test("should identify wrong nested dir", async () => {
            const fs = await System.openFileSystem(join(mockRoot, "resourcepacks", "1.14.4.zip"));
            await expect(fs.isDirectory("assets/.mcas"))
                .resolves
                .toBeFalsy();
        });
        test("should identify wrong nested file", async () => {
            const fs = await System.openFileSystem(join(mockRoot, "resourcepacks", "1.14.4.zip"));
            await expect(fs.isDirectory("assets/.mcassetsrootxxx"))
                .resolves
                .toBeFalsy();
        });
    });
});

