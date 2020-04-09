import * as fs from "fs";
import * as path from "path";
import { ResourcePack, readPackMetaAndIcon, readPackMeta } from "./index";

describe("Resourcepack", () => {
    const root = path.normalize(path.join(__dirname, "..", "..", "mock"));

    describe("#head", () => {
        test("should read resource pack zip buf", async () => {
            const buff = fs.readFileSync(`${root}/resourcepacks/sample-resourcepack.zip`);
            const metadata = await readPackMeta(buff);
            if (!metadata) { throw new Error("Pack cannot be null"); }
            expect(metadata.description).toEqual("Vattic\u0027s Faithful 32x32 pack");
            expect(metadata.pack_format).toEqual(1);
        });
        test("should read resource pack from zip path", async () => {
            const metadata = await readPackMeta(`${root}/resourcepacks/sample-resourcepack.zip`);
            if (!metadata) { throw new Error("Pack cannot be null"); }
            expect(metadata.description).toEqual("Vattic\u0027s Faithful 32x32 pack");
            expect(metadata.pack_format).toEqual(1);
        });
        test("should read resource pack zip with icon", async () => {
            const buff = fs.readFileSync(`${root}/resourcepacks/sample-resourcepack.zip`);
            const pack = await readPackMetaAndIcon(buff);
            if (!pack) { throw new Error("Pack cannot be null"); }
            expect(pack.metadata.description).toEqual("Vattic\u0027s Faithful 32x32 pack");
            expect(pack.metadata.pack_format).toEqual(1);
            expect(pack.icon).toBeTruthy();
        });
        test("should read resource pack folder", async () => {
            const pack = await readPackMetaAndIcon(`${root}/resourcepacks/sample-resourcepack`);
            if (!pack) { throw new Error("Pack cannot be null"); }
            expect(pack.metadata.description).toEqual("Vattic\u0027s Faithful 32x32 pack");
            expect(pack.metadata.pack_format).toEqual(1);
            expect(pack.icon).toBeTruthy();
        });
        test("should read resource pack folder with icon", async () => {
            const pack = await readPackMetaAndIcon(`${root}/resourcepacks/sample-resourcepack`);
            if (!pack) { throw new Error("Pack cannot be null"); }
            expect(pack.metadata.description).toEqual("Vattic\u0027s Faithful 32x32 pack");
            expect(pack.metadata.pack_format).toEqual(1);
            expect(pack.icon).toBeTruthy();
        });
        test("should throw if there is no pack.meta in directory", async () => {
            try {
                fs.mkdirSync(`${root}/resourcepacks/empty-resourcepack`, { recursive: true });
            } catch  { }
            await expect(readPackMetaAndIcon(`${root}/resourcepacks/empty-resourcepack`))
                .rejects
                .toThrowError(new Error("Illegal Resourcepack: Cannot find pack.mcmeta!"));
        });
        test("should throw if there is no pack.meta in zip", async () => {
            await expect(readPackMetaAndIcon(`${root}/resourcepacks/empty-resourcepack.zip`))
                .rejects
                .toThrowError(new Error("Illegal Resourcepack: Cannot find pack.mcmeta!"));
        });
    });
    describe("#domain", () => {
        test("should be able to read empty", async () => {
            const pack = await ResourcePack.open(`${root}/resourcepacks/empty-resourcepack.zip`);
            await expect(pack.domains())
                .resolves
                .toHaveLength(0);
        });
        test("should be able to read domain", async () => {
            const pack = await ResourcePack.open(`${root}/resourcepacks/1.14.4.zip`);
            await expect(pack.domains())
                .resolves
                .toEqual(["minecraft", "realms"]);
        });
    });
    describe("#info", () => {
        test("should be able to read info", async () => {
            const pack = await ResourcePack.open(`${root}/resourcepacks/sample-resourcepack.zip`);
            await expect(pack.info())
                .resolves
                .toBeTruthy();
        });
        test("should be able to read info", async () => {
            const pack = await ResourcePack.open(`${root}/resourcepacks/empty-resourcepack.zip`);
            await expect(pack.info())
                .rejects
                .toBeTruthy();
        });
    });
    describe("#icon", () => {
        test("#should not be able to load icon from empty", async () => {
            const pack = await ResourcePack.open(`${root}/resourcepacks/empty-resourcepack.zip`);
            await expect(pack.icon())
                .rejects
                .toBeTruthy();
        });
        test("#should be able to load icon", async () => {
            const pack = await ResourcePack.open(`${root}/resourcepacks/sample-resourcepack.zip`);
            await expect(pack.icon())
                .resolves
                .toBeTruthy();
        });
    });
});
