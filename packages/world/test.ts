import { normalize, join } from "path";
import { WorldReader, RegionReader } from "./index";

const root = normalize(join(__dirname, "..", "..", "mock"));

describe("WorldReader", () => {
    test("should load level of a simple map", async () => {
        const world = await WorldReader.create(`${root}/saves/sample-map`);
        const level = await world.getLevelData();
        expect(level.DataVersion).toEqual(512);
        expect(level.LevelName).toEqual("Testa");
        expect(level.Difficulty).toEqual(2);
    });
    describe("#create", () => {
        test("should load map from path", async () => {
            await expect(WorldReader.create(`${root}/saves/sample-map`))
                .resolves
                .toBeTruthy();
        });
        test("should load map from zip", async () => {
            await expect(WorldReader.create(`${root}/saves/sample-map.zip`))
                .resolves
                .toBeTruthy()
        });
    });
    test("#getLevelData", async () => {
        const reader = await WorldReader.create(`${root}/saves/sample-map`);
        const level = await reader.getLevelData();
        expect(level.DataVersion).toEqual(512);
        expect(level.LevelName).toEqual("Testa");
        expect(level.Difficulty).toEqual(2);
    });
    test("#getPlayerData", async () => {
        const reader = await WorldReader.create(`${root}/saves/sample-map`);
        const players = await reader.getPlayerData();
        expect(players).toHaveLength(1);
    });
    test("#getRegionData", async () => {
        const reader = await WorldReader.create(`${root}/saves/sample-map`);
        const region = await reader.getRegionData(0, 0);
        expect(region.DataVersion).toEqual(1976); // 1628
        expect(region.Level.Entities).toBeInstanceOf(Array);
        expect(region.Level.Sections).toBeInstanceOf(Array);
    })
});

describe("RegionReader", () => {
    test("#getBlockStateAt", async () => {
        const reader = await WorldReader.create(`${root}/saves/1.12`);
        const region = await reader.getRegionData(0, 0);
        // const regionReader = new RegionReader(region);
        // const block = regionReader.getBlockStateAt(0, 0, 0);
        // expect(block).toEqual({ Name: "minecraft:bedrock" });
        const chunkY = 0;
        // for (let chunkY = 0; chunkY < region.Level.Sections.length; chunkY++) {
        const section = RegionReader.getSection(region, chunkY);

        // console.log(Reflect.get(section, "Palette"))
        let arr: any = new Set();
        RegionReader.readBlockState(section, (x, y, z, id) => {
            if (y === 4) {
                arr.add(id);
            }
        });
        const missing = new Set();
        if ("Palette" in section) {
            for (let x = 0; x < 16; x++) {
                for (let y = 0; y < 16; y++) {
                    for (let z = 0; z < 16; z++) {
                        let i = y << 8 | z << 4 | x;
                        const result = RegionReader.seekBlockState(section, i);
                        if (!result) {
                            missing.add({ pos: { x, y: y + chunkY * 16, z }, id: RegionReader.seekBlockId(section, i) });
                        } else if (result && result.Name !== "minecraft:air" && result.Name !== "minecraft:bedrock") {
                            // console.log(`(${x}, ${y}, ${z}): ${result.Name}`);
                        }
                    }
                }
            }

            if (missing.size !== 0) {
                // console.log(`Level ${chunkY}`);
                // console.log(missing);
                // console.log(section.Palette);
                // console.log(section.Palette.length);
            }
        }
    });
});
