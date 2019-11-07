import * as path from "path";
import { World } from "./index";

describe("World", () => {
    const root = path.normalize(path.join(__dirname, "..", "..", "mock"));

    // test("should load level of a simple map", async () => {
    //     const { level } = await World.load(`${root}/saves/sample-map`, ["level"]);
    //     expect(level.DataVersion).toEqual(512);
    //     expect(level.LevelName).toEqual("Testa");
    //     expect(level.Difficulty).toEqual(2);
    // });

    // test("should load level of a simple map from zip", async () => {
    //     const { level } = await World.load(`${root}/saves/sample-map.zip`, ["level"]);
    //     expect(level.DataVersion).toEqual(512);
    //     expect(level.LevelName).toEqual("Testa");
    //     expect(level.Difficulty).toEqual(2);
    // });

    // test("should not load a non-map directory", async () => {
    //     await expect(World.load(`${root}/resourcepacks/sample-resourcepack`, ["level"]))
    //         .rejects
    //         .toBeTruthy();
    // });
    // test("should not load a non-map file", async () => {
    //     await expect(World.load(`${root}/resourcepacks/sample-resourcepack.zip`, ["level"]))
    //         .rejects
    //         .toBeTruthy();
    // });
});
