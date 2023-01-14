import { diagnose, MinecraftFolder, MinecraftLocation, Version } from "@xmcl/core";
import { existsSync } from "fs";
import { join } from "path";
import { installFabricYarnAndLoader } from "./fabric";
import { installForge } from "./forge";
import { ForgeVersion, getVersionList, install, installDependencies, MinecraftVersion } from "./index";
import { getLiteloaderVersionList, installLiteloader, LiteloaderVersion } from "./liteloader";
import { exists } from "./utils";

declare const tempDir: string;
const javaPath = (global as any).Java;

describe("Install", () => {
    jest.setTimeout(100000000);

    async function assertNoError(version: string, loc: MinecraftLocation) {
        const diag = await diagnose(version, loc);
        expect(diag.issues).toHaveLength(0);
    }
    describe("MinecraftClient", () => {
        async function installVersionClient(version: MinecraftVersion, gameDirectory: string) {
            const loc = MinecraftFolder.from(gameDirectory);
            await install(version, loc);
            expect(existsSync(loc.getVersionJar(version.id))).toBeTruthy();
            expect(existsSync(loc.getVersionJson(version.id))).toBeTruthy();
            await assertNoError(version.id, loc);
        }
        test("should not fetch duplicate version", async () => {
            const first = await getVersionList();
            const sec = await getVersionList({ original: first });
            expect(first).toEqual(sec);
            expect(first.timestamp).toEqual(sec.timestamp);
        });
        test("should be able to install 1.6.4", async () => {
            await installVersionClient({
                id: "1.6.4",
                type: "release",
                time: "2019-06-28T07:06:16+00:00",
                releaseTime: "2013-09-19T15:52:37+00:00",
                url: "https://launchermeta.mojang.com/v1/packages/b71bae449192fbbe1582ff32fb3765edf0b9b0a8/1.6.4.json",
            }, tempDir);
        });
        test("should be able to install 1.7.10", async () => {
            await installVersionClient({
                id: "1.7.10",
                type: "release",
                time: "",
                releaseTime: "",
                url: "https://launchermeta.mojang.com/v1/packages/2e818dc89e364c7efcfa54bec7e873c5f00b3840/1.7.10.json",
            }, tempDir);
        });
        test("should be able to install 1.12.2", async () => {
            await installVersionClient({
                id: "1.12.2",
                type: "release",
                time: "2018-02-15T16:26:45+00:00",
                releaseTime: "2017-09-18T08:39:46+00:00",
                url: "https://launchermeta.mojang.com/v1/packages/6e69e85d0f85f4f4b9e12dd99d102092a6e15918/1.12.2.json",
            }, tempDir);
        });
        test("should be able to install 1.14.4", async () => {
            await installVersionClient({
                id: "1.14.4",
                type: "release",
                url: "https://launchermeta.mojang.com/v1/packages/132979c36455cc1e17e5f9cc767b4e13c6947033/1.14.4.json",
                time: "2019-07-19T09:28:03+00:00",
                releaseTime: "2019-07-19T09:25:47+00:00",
            }, tempDir);
        });
        test("should be able to install 1.15.2", async () => {
            await installVersionClient({
                "id": "1.15.2",
                "type": "release",
                "url": "https://launchermeta.mojang.com/v1/packages/b2bc26bec3ed3d4763722941b75a25c0a043b744/1.15.2.json",
                "time": "2020-01-24T11:23:24+00:00",
                "releaseTime": "2020-01-17T10:03:52+00:00"
            }, tempDir);
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
                    url: "https://launchermeta.mojang.com/v1/packages/6e69e85d0f85f4f4b9e12dd99d102092a6e15918/1.12.2.json",
                };
                const version = await install(meta, tempDir, { side: "server" });
            },
        );
    });
});

describe("Diagnosis", () => {
    describe("#diagnose", () => {
        test.skip("should be able to diagnose empty json folder", async () => {
            await diagnose("1.7.10", tempDir);
            // expect(v17.version).toBe("1.7.0");
            // expect(v17.minecraftLocation.tempDir).toBe(tempDir);
            // expect(v17.missingAssetsIndex).toBe(false);
            // expect(v17.missingLibraries.length).toBe(0);
            // expect(v17.missingVersionJar).toBe(true);
            // expect(v17.missingVersionJson).toBe(true);
        });
    });
});

describe("ForgeInstaller", () => {
    jest.setTimeout(100000000);

    test("should install forge on 1.7.10", async () => {
        const meta: ForgeVersion = {
            version: "10.13.4.1614",
            installer: {
                md5: "8e16eecbe08db1d421532cda746338b3",
                sha1: "9345b92ac4e27bc4f2e993de094468035702a9c6",
                path: "/maven/net/minecraftforge/forge/1.7.10-10.13.4.1614-1.7.10/forge-1.7.10-10.13.4.1614-1.7.10-installer.jar",
            },
            universal: {
                md5: "add0fba161c4652a96efb4264ec2d9ec",
                sha1: "25fd97f72beca728112256938e03e8105b1b78cc",
                path: "/maven/net/minecraftforge/forge/1.7.10-10.13.4.1614-1.7.10/forge-1.7.10-10.13.4.1614-1.7.10-universal.jar",
            },
            mcversion: "1.7.10",
            type: "common",
        };
        const result = await installForge(meta, tempDir);

        expect(result).toEqual("1.7.10-Forge10.13.4.1614-1.7.10");
        await expect(exists(join(tempDir, "versions", "1.7.10-Forge10.13.4.1614-1.7.10", "1.7.10-Forge10.13.4.1614-1.7.10.json")))
            .resolves
            .toBeTruthy();
        const resolvedVersion = await Version.parse(tempDir, result);
        // https://github.com/Voxelum/minecraft-launcher-core-node/issues/210
        resolvedVersion.libraries.filter((lib) => lib.groupId === "org.scala-lang.plugins")
            .forEach((lib) => { (lib.download as any).sha1 = "" });
        await installDependencies(resolvedVersion);
    });
    test("should install forge 1.12.2-14.23.5.2852", async () => {
        const meta = {
            mcversion: "1.12.2",
            version: "14.23.5.2852",
            installer: {
                sha1: "0d833a6c8a1a6b3a0a07ed6d22504b84bcbbb5d7",
                path: "/maven/net/minecraftforge/forge/1.12.2-14.23.5.2852/forge-1.12.2-14.23.5.2852-installer.jar"
            }
        };
        const result = await installForge(meta, MinecraftFolder.from(tempDir), { java: javaPath });
        expect(result).toEqual("1.12.2-forge-14.23.5.2852");
        await expect(exists(join(tempDir, "versions", "1.12.2-forge-14.23.5.2852", "1.12.2-forge-14.23.5.2852.json")))
            .resolves
            .toBeTruthy();
        await installDependencies(await Version.parse(tempDir, result));
    });

    test("should install forge 1.14.4-forge-28.0.45", async () => {
        const meta: ForgeVersion = {
            mcversion: "1.14.4",
            version: "28.0.45",
            universal: {
                md5: "7f95bfb1266784cf1b9b9fa285bd9b68",
                sha1: "4638379f1729ffe707ed1de94950318558366e54",
                path: "/maven/net/minecraftforge/forge/1.14.4-28.0.45/forge-1.14.4-28.0.45-universal.jar",
            },
            installer: {
                md5: "a17c1f9ae4ba0bcefc53860a2563ef10",
                sha1: "7cd1db289412ba5e0cabab23d4f85f1abc4dfe84",
                path: "/maven/net/minecraftforge/forge/1.14.4-28.0.45/forge-1.14.4-28.0.45-installer.jar",
            },
            type: "common",
        };
        const result = await installForge(meta, MinecraftFolder.from(tempDir), { java: javaPath });
        expect(result).toEqual("1.14.4-forge-28.0.45");
        await expect(exists(join(tempDir, "versions", "1.14.4-forge-28.0.45", "1.14.4-forge-28.0.45.json")))
            .resolves
            .toBeTruthy();
        await installDependencies(await Version.parse(tempDir, result));
    });
});

describe("LiteloaderInstaller", () => {
    describe("#update", () => {
        test("should be able to fetch liteloader version json", async () => {
            await getLiteloaderVersionList({}).then((list) => {
                expect(list).toBeTruthy();
            }).catch((e) => {
                if (e.error === "500: Internal Server Error") {
                    console.warn("Liteloader website is down. Cannot test this.");
                }
            });
        });
    });
    describe("#install", () => {
        test("should be able to install liteloader on 1.12.2", async () => {
            const meta: LiteloaderVersion = { url: "http://repo.mumfrey.com/content/repositories/snapshots/", type: "SNAPSHOT", file: "liteloader-1.12.2-SNAPSHOT.jar", version: "1.12.2-SNAPSHOT", md5: "1420785ecbfed5aff4a586c5c9dd97eb", timestamp: "1511880271", mcversion: "1.12.2", tweakClass: "com.mumfrey.liteloader.launch.LiteLoaderTweaker", libraries: [{ name: "net.minecraft:launchwrapper:1.12" }, { name: "org.ow2.asm:asm-all:5.2" }] };
            const result = await installLiteloader(meta, MinecraftFolder.from(tempDir));
            await installDependencies(await Version.parse(tempDir, result));
        });
        test("should be able to install liteloader to forge", async () => {
            const meta: LiteloaderVersion = { url: "http://repo.mumfrey.com/content/repositories/snapshots/", type: "SNAPSHOT", file: "liteloader-1.12.2-SNAPSHOT.jar", version: "1.12.2-SNAPSHOT", md5: "1420785ecbfed5aff4a586c5c9dd97eb", timestamp: "1511880271", mcversion: "1.12.2", tweakClass: "com.mumfrey.liteloader.launch.LiteLoaderTweaker", libraries: [{ name: "net.minecraft:launchwrapper:1.12" }, { name: "org.ow2.asm:asm-all:5.2" }] };
            const result = await installLiteloader(meta, MinecraftFolder.from(tempDir), { inheritsFrom: "1.12.2-forge-14.23.5.2852" });
            const resolvedVersion = await Version.parse(tempDir, result);
            // https://github.com/Voxelum/minecraft-launcher-core-node/issues/210
            resolvedVersion.libraries.filter((lib) => lib.groupId === "org.scala-lang.plugins")
                .forEach((lib) => { (lib.download as any).sha1 = "" });
            await installDependencies(resolvedVersion);
        });
    });
});


describe("FabricInstaller", () => {
    // test("should be able to install fabric", async () => {
    //     await installFabricYarnAndLoader("1.14.1+build.10", "0.4.7+build.147", tempDir);
    //     expect(existsSync(MinecraftFolder.from(tempDir).getVersionJson("1.14.1-fabric1.14.1+build.10-0.4.7+build.147")))
    //         .toBeTruthy();
    // });
});
