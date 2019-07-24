import { MinecraftFolder, MinecraftLocation } from "@xmcl/util";
import { Version } from "@xmcl/version";
import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { Installer } from "./index";

before(function () {
    this.assets = path.normalize(path.join(__dirname, "..", "..", "assets"));
    this.gameDirectory = path.join(this.assets, "temp");
});
describe("Install", function () {
    async function assertNoError(version: string, loc: MinecraftLocation) {
        const diag = await Version.diagnose(version, loc);
        assert.equal(Object.keys(diag.missingAssets).length, 0, JSON.stringify(diag.missingAssets, null, 4));
        assert.equal(diag.missingLibraries.length, 0, JSON.stringify(diag.missingLibraries, null, 4));
        assert(!diag.missingAssetsIndex, "Missing Asset Index");
        assert(!diag.missingVersionJar, "Missing Version Jar");
        assert.equal(diag.missingVersionJson, "", diag.missingVersionJson);
    }
    describe("MinecraftClient", () => {
        async function installVersionClient(version: Installer.VersionMeta, gameDirectory: string) {
            const loc = new MinecraftFolder(gameDirectory);
            await Installer.installTask("client", version, loc).execute();
            assert(fs.existsSync(loc.getVersionJar(version.id)));
            assert(fs.existsSync(loc.getVersionJson(version.id)));
            await assertNoError(version.id, loc);
        }
        it("should fetch minecraft version", () => Installer.updateVersionMeta()).timeout(100000);
        it("should not fetch duplicate version", async () => {
            const first = await Installer.updateVersionMeta();
            const sec = await Installer.updateVersionMeta({ fallback: first });
            assert.equal(first, sec);
            assert.equal(first.timestamp, sec.timestamp);
        });
        it("should be able to install 1.12.2", async function () {
            await installVersionClient({
                id: "1.12.2",
                type: "release",
                time: "2018-02-15T16:26:45+00:00",
                releaseTime: "2017-09-18T08:39:46+00:00",
                url: "https://launchermeta.mojang.com/mc/game/cf72a57ff499d6d9ade870b2143ee54958bd33ef/1.12.2.json",
            }, this.gameDirectory);
        }).timeout(100000000);
        it("should install 17w43b", async function () {
            await installVersionClient({
                id: "17w43b",
                type: "snapshot",
                time: "2018-01-15T11:09:31+00:00",
                releaseTime: "2017-10-26T13:36:22+00:00",
                url: "https://launchermeta.mojang.com/mc/game/0383e8585ef976baa88e2dc3357e6b9899bf263e/17w43b.json",
            }, this.gameDirectory);
        }).timeout(100000000);
        it("should be able to install 1.13.2", async function () {
            await installVersionClient({
                id: "1.13.2",
                type: "release",
                time: "2019-01-30T15:15:25+00:00",
                releaseTime: "2018-10-22T11:41:07+00:00",
                url: "https://launchermeta.mojang.com/v1/packages/26ec75fc9a8b990fa976100a211475d18bd97de0/1.13.2.json",
            }, this.gameDirectory);
        }).timeout(100000000);
        it("should be able to install 1.14.2", async function () {
            await installVersionClient({
                id: "1.14.2",
                type: "release",
                url: "https://launchermeta.mojang.com/v1/packages/bc3ada07878913436f1333ba7af7f77115427ccc/1.14.2.json",
                time: "2019-06-07T09:06:32+00:00",
                releaseTime: "2019-05-27T11:48:25+00:00",
            }, this.gameDirectory);
        }).timeout(100000000);
    });

    describe("MinecraftServer", function () {
        it("should be able to install minecraft server on 1.12.2", async function () {
            const meta = {
                id: "1.12.2",
                type: "release",
                time: "2018-02-15T16:26:45+00:00",
                releaseTime: "2017-09-18T08:39:46+00:00",
                url: "https://launchermeta.mojang.com/mc/game/cf72a57ff499d6d9ade870b2143ee54958bd33ef/1.12.2.json",
            };
            const version = await Installer.install("server", meta, this.gameDirectory);
        }).timeout(100000000);
    });

});

