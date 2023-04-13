import { readFileSync } from "fs";
import { join, normalize } from "path";
import { getIndexInChunk, LegacyRegionSectionDataFrame, NewRegionSectionDataFrame, RegionReader, WorldReader } from "./index";

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

    describe("#getRegionData", () => {
        test("should be able to get region data", async () => {
            const reader = await WorldReader.create(`${root}/saves/sample-map`);
            const region = await reader.getRegionData(0, 0);
            expect(region.DataVersion).toEqual(1976); // 1628
            expect(region.Level.Entities).toBeInstanceOf(Array);
            expect(region.Level.Sections).toBeInstanceOf(Array);
        })
        test("should be able to get the correct section", async () => {
            let reader = await WorldReader.create(`${root}/saves/1.12.2`);
            let region = await reader.getRegionData(0, 0);
            let section = region.Level.Sections[0] as LegacyRegionSectionDataFrame;
            // the blocks is the string format of nbt data in the `Block` section
            let blocks = readFileSync(join(root, "saves/1.12.2/block.txt")).toString().split(" ").map((s) => s.trim()).filter((s) => s.length !== 0).map((s) => Number.parseInt(s));
            // the data is the string format of nbt data in `Data` section
            let data = readFileSync(join(root, "saves/1.12.2/data.txt")).toString().split(" ").map((s) => s.trim()).filter((s) => s.length !== 0).map((s) => Number.parseInt(s));

            // If they equal, then we correctly found the section
            expect(section.Blocks).toEqual(blocks);
            expect(section.Data).toEqual(data);
        });
    });
});


describe("RegionReader", () => {
    /**
     * Convert Minecraft BlockState toString() result to object format.
     */
    function nameToBlockState(name: string) {
        let patt = /Block\{(.+)\}(\[(.+)\])?/g;
        let mat = patt.exec(name)!;
        let result: any = {
            Name: mat[1]!,
        };
        if (mat[2]!) {
            result.Properties = {}
            let s = mat[2].substring(1, mat[2]!.length - 1)!
            s.split(",").map((s) => s.split("=")).forEach(([key, value]) => {
                result.Properties[key] = value
            });
        }
        return result;
    }

    function getMockData(version: string) {
        let expected: Record<number, { name: string; id: number }> = {};
        readFileSync(`${root}/saves/${version}/mock.txt`).toString().split("\n").map((l) => l.split(" ")).forEach(([id, x, y, z, name]) => {
            if (typeof x === "undefined") { return; }
            let i = getIndexInChunk(Number.parseInt(x), Number.parseInt(y), Number.parseInt(z));
            expected[i] = { name, id: Number.parseInt(id) };
        });
        return expected;
    }

    // The mock data contains the expected blockstate id, x, y, z, blockstate info
    // which is dump from mod
    // For the dump script, please see these gist
    // 1.14.4: https://gist.github.com/ci010/27415d55a3e72399924433b759924f2e
    // 1.12.2 https://gist.github.com/ci010/9032360a9137c8f8c37c0b07a93b3ee6
    const MOCK_144 = getMockData("1.14.4");
    const MOCK_122 = getMockData("1.12.2");
    const MOCK_164 = getMockData("1.16.4")

    describe("#seekBlockStateId", () => {
        test("should be able to seek 1.12.2 (legacy) version chunk", async () => {
            let mockData = MOCK_122;
            let reader = await WorldReader.create(`${root}/saves/1.12.2`);
            let region = await reader.getRegionData(0, 0);
            let chunkY = 0;
            let section = RegionReader.getSection(region, chunkY);

            // compare the seeked id with the expect id
            // 1.12.2 mock data record the global blockstate id, and the chunk also save global blockstate id
            // therefore we can directly compare them here
            for (let x = 0; x < 16; x += 2) {
                for (let y = 0; y < 16; y += 2) {
                    for (let z = 0; z < 16; z += 2) {
                        let i = getIndexInChunk(x, y, z);
                        let id = RegionReader.seekBlockStateId(section, i);
                        let expected = mockData[i];
                        if (typeof expected === "undefined") {
                            continue;
                        }
                        expect(id).toEqual(expected.id);
                    }
                }
            }
        });
        test("should be able to seek 1.14.4 chunk", async () => {
            let reader = await WorldReader.create(`${root}/saves/1.14.4`);
            let region = await reader.getRegionData(0, 0);
            let chunkY = 0;
            let section = RegionReader.getSection(region, chunkY) as NewRegionSectionDataFrame;
            let mockData = MOCK_144;

            // 1.14.4, chunk save local blockstate id, we need to convert them to blockstate string
            // by Palette (the map from id to blockstate)
            // then we can compare the blockstate object
            for (let x = 0; x < 16; x += 2) {
                for (let y = 0; y < 16; y += 2) {
                    for (let z = 0; z < 16; z += 2) {
                        let i = getIndexInChunk(x, y, z);
                        let id = RegionReader.seekBlockStateId(section, i);
                        let expected = mockData[i];
                        if (typeof expected === "undefined") {
                            continue;
                        }
                        let actualObject = section.Palette![id];
                        let expectedObject = nameToBlockState(expected.name.trim());
                        expect(actualObject).toEqual(expectedObject);
                    }
                }
            }
        });
        test("should be able to seek 1.16.4 chunk", async () => {
            let reader = await WorldReader.create(`${root}/saves/1.16.4`);
            let region = await reader.getRegionData(0, 0);
            let chunkY = 0;
            let section = RegionReader.getSection(region, chunkY) as NewRegionSectionDataFrame;
            let mockData = MOCK_164;

            // 1.14.4, chunk save local blockstate id, we need to convert them to blockstate string
            // by Palette (the map from id to blockstate)
            // then we can compare the blockstate object
            for (let x = 0; x < 16; x += 2) {
                for (let y = 0; y < 16; y += 2) {
                    for (let z = 0; z < 16; z += 2) {
                        let i = getIndexInChunk(x, y, z);
                        let id = RegionReader.seekBlockStateId(section, i);
                        let expected = mockData[i];
                        if (typeof expected === "undefined") {
                            continue;
                        }
                        let actualObject = section.Palette![id];
                        let expectedObject = nameToBlockState(expected.name.trim());
                        expect(actualObject).toEqual(expectedObject);
                    }
                }
            }
        })
    });
    describe("#seekBlockState", () => {
        test("should be able to get block state from new version chunk mca", async () => {
            let mockData = MOCK_144;
            let reader = await WorldReader.create(`${root}/saves/1.14.4`);
            let region = await reader.getRegionData(0, 0);
            let chunkY = 0;
            let section = RegionReader.getSection(region, chunkY) as NewRegionSectionDataFrame;

            for (let x = 0; x < 16; x += 2) {
                for (let y = 0; y < 16; y += 2) {
                    for (let z = 0; z < 16; z += 2) {
                        let i = getIndexInChunk(x, y, z);
                        let state = RegionReader.seekBlockState(section, i);
                        let expected = mockData[i];
                        if (typeof expected === "undefined") {
                            continue;
                        }
                        let actualObject = state;
                        let expectedObject = nameToBlockState(expected.name.trim());
                        expect(actualObject).toEqual(expectedObject);
                    }
                }
            }
        });
    });
    describe("#readBlockState", () => {
        test("should be able to read new chunk format", async () => {
            let mockData = MOCK_144;
            let reader = await WorldReader.create(`${root}/saves/1.14.4`);
            let region = await reader.getRegionData(0, 0);
            let chunkY = 0;
            let section = RegionReader.getSection(region, chunkY) as NewRegionSectionDataFrame;

            RegionReader.walkBlockStateId(section, (x, y, z, id) => {
                let i = getIndexInChunk(x, y, z);
                let expectedName = mockData[i]?.name
                if (typeof expectedName === "undefined") {
                    return;
                }
                let actualObject = section.Palette![id];
                let expectedObject = nameToBlockState(expectedName.trim());
                expect(actualObject).toEqual(expectedObject);
            });
        });
        test("should be able to read legacy chunk format", async () => {
            let mockData = MOCK_122;
            let reader = await WorldReader.create(`${root}/saves/1.12.2`);
            let region = await reader.getRegionData(0, 0);
            let chunkY = 0;
            let section = RegionReader.getSection(region, chunkY) as LegacyRegionSectionDataFrame;

            RegionReader.walkBlockStateId(section, (x, y, z, id) => {
                let i = getIndexInChunk(x, y, z);
                let expectedId = mockData[i]?.id
                if (typeof expectedId === "undefined") {
                    return;
                }
                expect(id).toEqual(expectedId);
            });
        });
    });

});
