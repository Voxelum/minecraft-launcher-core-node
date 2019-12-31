import { MinecraftFolder } from "@xmcl/core";
import * as fs from "fs";
import { FabricInstaller } from "./fabric";
import { normalize, join } from "path";

const tempRoot = normalize(join(__dirname, "..", "..", "temp"));
const mockRoot = normalize(join(__dirname, "..", "..", "mock"));
if (!fs.existsSync(tempRoot)) {
    fs.mkdirSync(tempRoot);
}

describe("FabricInstaller", () => {
    test("should be able to install fabric", async () => {
        await FabricInstaller.install("1.14.1+build.10", "0.4.7+build.147", tempRoot);
        expect(fs.existsSync(MinecraftFolder.from(tempRoot).getVersionJson("1.14.1-fabric1.14.1+build.10-0.4.7+build.147")))
            .toBeTruthy();
    });

    describe("#parseVersionMavenXML", () => {
        test("should parse valid version xml from fabric", () => {
            const xmlString = fs.readFileSync(join(mockRoot, "fabric-yarn.xml")).toString();
            const versions = FabricInstaller.parseVersionMavenXML(xmlString);
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
            const versions = FabricInstaller.parseVersionMavenXML("");
            expect(versions).toEqual([]);
        })
    });

    test("#updateVersionList", async () => {
        const list = await FabricInstaller.updateVersionList();
        expect(list).toBeTruthy();
        if (list) {
            expect(typeof list.timestamp).toEqual("string");
            expect(list.yarnVersions).toBeInstanceOf(Array);
            expect(list.yarnVersions.every((s) => typeof s === "string")).toBeTruthy();
            expect(list.loaderVersions.every((s) => typeof s === "string")).toBeTruthy();
        }
    });
});
