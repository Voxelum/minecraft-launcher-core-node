import { vfs } from "@xmcl/util";
import * as fs from "fs";
import * as path from "path";
import { ResourcePack } from "./index";

describe("Resourcepack", () => {
    const root = path.normalize(path.join(__dirname, "..", "..", "mock"));

    test("should read resource pack zip", async () => {
        const buff = fs.readFileSync(`${root}/resourcepacks/sample-resourcepack.zip`);
        const pack = await ResourcePack.read(`${root}/resourcepacks/sample-resourcepack.zip`, buff);
        if (!pack) { throw new Error("Pack cannot be null"); }
        expect(pack.metadata.description).toEqual("Vattic\u0027s Faithful 32x32 pack");
        expect(pack.metadata.pack_format).toEqual(1);
        expect(pack.icon).toBeFalsy();
    });

    test("should read resource pack zip's icon", async () => {
        const buff = fs.readFileSync(`${root}/resourcepacks/sample-resourcepack.zip`);
        const pack = await ResourcePack.read(`${root}/resourcepacks/sample-resourcepack.zip`, buff);
        const icon = await ResourcePack.readIcon(pack);
        expect(icon).toBeTruthy();
    });

    // test("should read empty resource pack zip's icon", async () => {
    //     const pack = await ResourcePack.read(`${root}/resourcepacks/empty-resourcepack.zip`);
    //     const icon = await ResourcePack.readIcon(pack);
    //     expect(icon).toBe("");
    // });

    test("should read resource pack from path", async () => {
        const pack = await ResourcePack.read(`${root}/resourcepacks/sample-resourcepack.zip`);
        if (!pack) { throw new Error("Pack cannot be null"); }
        expect(pack.metadata.description).toEqual("Vattic\u0027s Faithful 32x32 pack");
        expect(pack.metadata.pack_format).toEqual(1);
        expect(pack.icon).toBeFalsy();
    });
    test("should read resource pack zip with icon", async () => {
        const buff = fs.readFileSync(`${root}/resourcepacks/sample-resourcepack.zip`);
        const pack = await ResourcePack.read(`${root}/resourcepacks/sample-resourcepack.zip`, buff, true);
        if (!pack) { throw new Error("Pack cannot be null"); }
        expect(pack.metadata.description).toEqual("Vattic\u0027s Faithful 32x32 pack");
        expect(pack.metadata.pack_format).toEqual(1);
        expect(pack.icon).toBeTruthy();
    });
    test("should read resource pack folder", async () => {
        const pack = await ResourcePack.read(`${root}/resourcepacks/sample-resourcepack`);
        if (!pack) { throw new Error("Pack cannot be null"); }
        expect(pack.metadata.description).toEqual("Vattic\u0027s Faithful 32x32 pack");
        expect(pack.metadata.pack_format).toEqual(1);
        expect(pack.icon).toBeFalsy();
    });
    test("should read resource pack folder's icon", async () => {
        const pack = await ResourcePack.read(`${root}/resourcepacks/sample-resourcepack`);
        const icon = await ResourcePack.readIcon(pack);
        expect(icon).toBeTruthy();
    });
    // test("should read empty resource pack folder's icon", async () => {
    //     const pack = await ResourcePack.read(`${root}/resourcepacks/empty-resourcepack`);
    //     const icon = await ResourcePack.readIcon(pack);
    //     expect(icon).toBe("");
    // });
    test("should read resource pack folder's icon", async () => {
        const pack = await ResourcePack.read(`${root}/resourcepacks/sample-resourcepack`);
        const icon = await ResourcePack.readIcon(pack);
        expect(icon).toBeTruthy();
    });
    test("should read resource pack folder with icon", async () => {
        const pack = await ResourcePack.read(`${root}/resourcepacks/sample-resourcepack`, undefined, true);
        if (!pack) { throw new Error("Pack cannot be null"); }
        expect(pack.metadata.description).toEqual("Vattic\u0027s Faithful 32x32 pack");
        expect(pack.metadata.pack_format).toEqual(1);
        expect(pack.icon).toBeTruthy();
    });

    test("should throw if there is no pack.meta in directory", async () => {
        await vfs.ensureDir(`${root}/resourcepacks/empty-resourcepack`);
        await expect(ResourcePack.read(`${root}/resourcepacks/empty-resourcepack`))
            .rejects
            .toThrowError(new Error("Illegal Resourcepack: Cannot find pack.mcmeta!"));
    });
    test("should throw if there is no pack.meta in zip", async () => {
        await expect(ResourcePack.read(`${root}/resourcepacks/empty-resourcepack.zip`))
            .rejects
            .toThrowError(new Error("Illegal Resourcepack: Cannot find pack.mcmeta!"));
    });
});
