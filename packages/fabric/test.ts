import { MinecraftFolder } from "@xmcl/util";
import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { Fabric } from "./index";

before(function () {
    this.assets = path.normalize(path.join(__dirname, "..", "..", "assets"));
    this.gameDirectory = path.join(this.assets, "temp");
});

describe("Fabric", function () {
    it("should be able to install fabric", async function () {
        await Fabric.install("1.14.1+build.10", "0.4.7+build.147", this.gameDirectory);
        assert(fs.existsSync(new MinecraftFolder(this.gameDirectory).getVersionJson("1.14.1-fabric1.14.1+build.10-0.4.7+build.147")));
    }).timeout(100000000);
});
