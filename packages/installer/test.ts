import { MinecraftFolder, MinecraftLocation } from "@xmcl/util";
import { Version } from "@xmcl/version";
import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { Installer } from "./index";

describe.skip("Install", () => {
    const root = path.normalize(path.join(__dirname, "..", "..", "mock"));
    jest.setTimeout(100000000);

    async function assertNoError(version: string, loc: MinecraftLocation) {
        const diag = await Version.diagnose(version, loc);
        expect(Object.keys(diag.missingAssets)).toHaveLength(0);
        expect(diag.missingLibraries.length).toHaveLength(0);
        assert(!diag.missingAssetsIndex, "Missing Asset Index");
        assert(!diag.missingVersionJar, "Missing Version Jar");
        expect(diag.missingVersionJson).toEqual(diag.missingVersionJson);
    }
    describe("MinecraftClient", () => {
        async function installVersionClient(version: Installer.VersionMeta, gameDirectory: string) {
            const loc = new MinecraftFolder(gameDirectory);
            await Installer.installTask("client", version, loc).execute();
            assert(fs.existsSync(loc.getVersionJar(version.id)));
            assert(fs.existsSync(loc.getVersionJson(version.id)));
            await assertNoError(version.id, loc);
        }
        test("should fetch minecraft version", () => Installer.updateVersionMeta());
        test("should not fetch duplicate version", async () => {
            const first = await Installer.updateVersionMeta();
            const sec = await Installer.updateVersionMeta({ fallback: first });
            expect(first).toEqual(sec);
            expect(first.timestamp).toEqual(sec.timestamp);
        });
        test("should be able to install 1.7.10", async () => {
            await installVersionClient({
                id: "1.7.10",
                type: "release",
                time: "",
                releaseTime: "",
                url: "https://launchermeta.mojang.com/v1/packages/2e818dc89e364c7efcfa54bec7e873c5f00b3840/1.7.10.json",
            }, root);
        });
        test("should be able to install 1.12.2", async () => {
            await installVersionClient({
                id: "1.12.2",
                type: "release",
                time: "2018-02-15T16:26:45+00:00",
                releaseTime: "2017-09-18T08:39:46+00:00",
                url: "https://launchermeta.mojang.com/mc/game/cf72a57ff499d6d9ade870b2143ee54958bd33ef/1.12.2.json",
            }, root);
        });
        test("should install 17w43b", async () => {
            await installVersionClient({
                id: "17w43b",
                type: "snapshot",
                time: "2018-01-15T11:09:31+00:00",
                releaseTime: "2017-10-26T13:36:22+00:00",
                url: "https://launchermeta.mojang.com/mc/game/0383e8585ef976baa88e2dc3357e6b9899bf263e/17w43b.json",
            }, root);
        });
        test("should be able to install 1.13.2", async () => {
            await installVersionClient({
                id: "1.13.2",
                type: "release",
                time: "2019-01-30T15:15:25+00:00",
                releaseTime: "2018-10-22T11:41:07+00:00",
                url: "https://launchermeta.mojang.com/v1/packages/26ec75fc9a8b990fa976100a211475d18bd97de0/1.13.2.json",
            }, root);
        });
        test("should be able to install 1.14.4", async () => {
            await installVersionClient({
                id: "1.14.4",
                type: "release",
                url: "https://launchermeta.mojang.com/v1/packages/132979c36455cc1e17e5f9cc767b4e13c6947033/1.14.4.json",
                time: "2019-07-19T09:28:03+00:00",
                releaseTime: "2019-07-19T09:25:47+00:00",
            }, root);
        });
    });

    describe("MinecraftServer", () => {
        test(
            "should be able to install minecraft server on 1.12.2",
            async () => {
                const meta = {
                    id: "1.12.2",
                    type: "release",
                    time: "2018-02-15T16:26:45+00:00",
                    releaseTime: "2017-09-18T08:39:46+00:00",
                    url: "https://launchermeta.mojang.com/mc/game/cf72a57ff499d6d9ade870b2143ee54958bd33ef/1.12.2.json",
                };
                const version = await Installer.install("server", meta, root);
            }
        );
    });
});

