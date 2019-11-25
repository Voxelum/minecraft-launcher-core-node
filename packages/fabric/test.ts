import { MinecraftFolder } from "@xmcl/util";
import assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { Fabric } from "./index";


describe("Fabric", () => {
    const root = path.join(__dirname, "..", "..", "temp");
    const mockRoot = path.join(__dirname, "..", "..", "mock");
    test("should be able to install fabric", async () => {
        await Fabric.install("1.14.1+build.10", "0.4.7+build.147", root);
        expect(fs.existsSync(MinecraftFolder.from(root).getVersionJson("1.14.1-fabric1.14.1+build.10-0.4.7+build.147")))
            .toBeTruthy();
    });

    describe("#parseVersionMavenXML", () => {
        test("should parse valid version xml from fabric", () => {
            const xmlString = fs.readFileSync(path.join(mockRoot, "fabric-yarn.xml")).toString();
            const versions = Fabric.parseVersionMavenXML(xmlString);
            expect(versions).toEqual([
                "19w13b.8",
                "3D Shareware v1.34.2",
                "1.14 Pre-Release 4+build.7",
                "1.14.3+build.13",
                "1.14.4-pre7+build.1",
                "1.14_combat-3+build.2",
                "1.14.4+build.15",
                "19w46b+build.1"
            ]);
        });
        test("should just return empty if the input is invalid", () => {
            const versions = Fabric.parseVersionMavenXML("");
            expect(versions).toEqual([]);
        })
    });

    test("#updateVersionList", async () => {
        const list = await Fabric.updateVersionList();
        expect(list).toBeTruthy();
        if (list) {
            expect(typeof list.timestamp).toEqual("string");
            expect(list.yarnVersions).toBeInstanceOf(Array);
            expect(list.yarnVersions.every((s) => typeof s === "string")).toBeTruthy();
            expect(list.loaderVersions.every((s) => typeof s === "string")).toBeTruthy();
        }
    });

    test("#readModMetadata", async () => {
        const mod = await Fabric.readModMetaData(path.join(mockRoot, "mods", "fabric-sample.jar"));
        expect(mod).toBeTruthy();
        expect(mod).toEqual({
            schemaVersion: 1,
            id: "appleskin",
            version: "1.0.8",
            name: "AppleSkin",
            description: "Adds various food-related HUD improvements",
            authors: ["squeek502"],
            contact:
            {
                sources: "https://github.com/squeek502/AppleSkin",
                homepage: "https://minecraft.curseforge.com/projects/appleskin",
                issues: "https://github.com/squeek502/AppleSkin/issues"
            },
            license: "Unlicense",
            icon: "assets/appleskin/appleskin.png",
            environment: "*",
            entrypoints: { client: ["squeek.appleskin.AppleSkin"] },
            mixins: ["appleskin.mixins.json"],
            depends: { fabricloader: ">=0.4.0", fabric: "*" }
        });
    });
});
