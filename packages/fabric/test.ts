import { MinecraftFolder } from "@xmcl/util";
import assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { Fabric } from "./index";


describe.skip("Fabric", () => {
    const root = path.join(__dirname, "..", "..", "mock");
    test("should be able to install fabric", async () => {
        await Fabric.install("1.14.1+build.10", "0.4.7+build.147", root);
        assert(fs.existsSync(new MinecraftFolder(root).getVersionJson("1.14.1-fabric1.14.1+build.10-0.4.7+build.147")));
    });

    test("#updateVersionList", async () => {
        const list = await Fabric.updateVersionList();
        expect(list.timestamp).toBeInstanceOf(String);
        expect(list.yarnVersions).toBeInstanceOf(Array);
        expect(list.yarnVersions.every((s) => typeof s === "string")).toBeTruthy();
        expect(list.loaderVersions.every((s) => typeof s === "string")).toBeTruthy();
    });
});
