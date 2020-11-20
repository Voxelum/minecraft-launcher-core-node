import { MinecraftFolder, MinecraftLocation, Version, diagnose } from "@xmcl/core";
import { existsSync } from "fs";
import { join, normalize } from "path";
import { getYarnVersionList, installFabricYarnAndLoader, YarnVersionList } from "./fabric";
import { installForge } from "./forge";
import { ForgeVersion, getVersionList, install, installDependencies, MinecraftVersion } from "./index";
import { getLiteloaderVersionList, installLiteloader, LiteloaderVersion } from "./liteloader";
import { exists } from "./utils";

const root = normalize(join(__dirname, "..", "..", "temp"));
const mockRoot = normalize(join(__dirname, "..", "..", "mock"));
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
            }, root);
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
                url: "https://launchermeta.mojang.com/v1/packages/6e69e85d0f85f4f4b9e12dd99d102092a6e15918/1.12.2.json",
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
        test("should be able to install 1.15.2", async () => {
            await installVersionClient({
                "id": "1.15.2",
                "type": "release",
                "url": "https://launchermeta.mojang.com/v1/packages/b2bc26bec3ed3d4763722941b75a25c0a043b744/1.15.2.json",
                "time": "2020-01-24T11:23:24+00:00",
                "releaseTime": "2020-01-17T10:03:52+00:00"
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
                    url: "https://launchermeta.mojang.com/v1/packages/6e69e85d0f85f4f4b9e12dd99d102092a6e15918/1.12.2.json",
                };
                const version = await install(meta, root, { side: "server" });
            },
        );
    });
});

describe("Diagnosis", () => {
    describe("#diagnose", () => {
        test.skip("should be able to diagnose empty json folder", async () => {
            await diagnose("1.7.10", root);
            // expect(v17.version).toBe("1.7.0");
            // expect(v17.minecraftLocation.root).toBe(root);
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
            version: "10.13.3.1400",
            installer: {
                md5: "fb37fa073dce193f798ecf8987c25dba",
                sha1: "925d171aa9db651ae430967775a48038c180858a",
                path: "/maven/net/minecraftforge/forge/1.7.10-10.13.3.1400-1.7.10/forge-1.7.10-10.13.3.1400-1.7.10-installer.jar",
            },
            universal: {
                md5: "3cc321afc2c8a641b4f070f7905c2d6e",
                sha1: "d96b5933bee1d07fd3e9e4f51e8fd0a1b3f9fd68",
                path: "/maven/net/minecraftforge/forge/1.7.10-10.13.3.1400-1.7.10/forge-1.7.10-10.13.3.1400-1.7.10-universal.jar",
            },
            mcversion: "1.7.10",
            type: "common",
        };
        const result = await installForge(meta, root);

        expect(result).toEqual("1.7.10-Forge10.13.3.1400-1.7.10");
        await expect(exists(join(root, "versions", "1.7.10-Forge10.13.3.1400-1.7.10", "1.7.10-Forge10.13.3.1400-1.7.10.json")))
            .resolves
            .toBeTruthy();
        await installDependencies(await Version.parse(root, result));
    });
    test("should install forge on 1.12.2", async () => {
        const meta: ForgeVersion = {
            mcversion: "1.12.2",
            version: "14.23.5.2823",
            universal: {
                md5: "61e0e4606c3443eb834d9ddcbc6457a3",
                sha1: "cec39eddde28eb6f7ac921c8d82d6a5b7916e81b",
                path: "/maven/net/minecraftforge/forge/1.12.2-14.23.5.2823/forge-1.12.2-14.23.5.2823-universal.jar",
            },
            installer: {
                md5: "181ccfb55847f31368503746a1ae7e40",
                sha1: "3dd9ecd967edbdb0993c9c7e6b8c55cca294f447",
                path: "/maven/net/minecraftforge/forge/1.12.2-14.23.5.2823/forge-1.12.2-14.23.5.2823-installer.jar",
            },
            type: "common",
        };
        const result = await installForge(meta, MinecraftFolder.from(root));
        expect(result).toEqual("1.12.2-forge1.12.2-14.23.5.2823");
        await expect(exists(join(root, "versions", "1.12.2-forge1.12.2-14.23.5.2823", "1.12.2-forge1.12.2-14.23.5.2823.json")))
            .resolves
            .toBeTruthy();
        await installDependencies(await Version.parse(root, result));
    });
    test("should install forge 1.12.2-14.23.5.2852", async () => {
        const meta = {
            mcversion: "1.12.2",
            version: "14.23.5.2852",
            installer: {
                sha1: "9c2b201b97730688f9e8ae2a1d671707f5c937f5",
                path: "/maven/net/minecraftforge/forge/1.12.2-14.23.5.2852/forge-1.12.2-14.23.5.2852-installer.jar"
            }
        };
        const result = await installForge(meta, MinecraftFolder.from(root), { java: javaPath });
        expect(result).toEqual("1.12.2-forge-14.23.5.2852");
        await expect(exists(join(root, "versions", "1.12.2-forge-14.23.5.2852", "1.12.2-forge-14.23.5.2852.json")))
            .resolves
            .toBeTruthy();
        await installDependencies(await Version.parse(root, result));
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
                md5: "f719c80d52a3d0ea60e1feba96dd394e",
                sha1: "ee1f3a8268894134d9b37b7469e5cf07021bbac1",
                path: "/maven/net/minecraftforge/forge/1.14.4-28.0.45/forge-1.14.4-28.0.45-installer.jar",
            },
            type: "common",
        };
        const result = await installForge(meta, MinecraftFolder.from(root), { java: javaPath });
        expect(result).toEqual("1.14.4-forge-28.0.45");
        await expect(exists(join(root, "versions", "1.14.4-forge-28.0.45", "1.14.4-forge-28.0.45.json")))
            .resolves
            .toBeTruthy();
        await installDependencies(await Version.parse(root, result));
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
            const result = await installLiteloader(meta, MinecraftFolder.from(root));
            await installDependencies(await Version.parse(root, result));
        });
        test("should be able to install liteloader to forge", async () => {
            const meta: LiteloaderVersion = { url: "http://repo.mumfrey.com/content/repositories/snapshots/", type: "SNAPSHOT", file: "liteloader-1.12.2-SNAPSHOT.jar", version: "1.12.2-SNAPSHOT", md5: "1420785ecbfed5aff4a586c5c9dd97eb", timestamp: "1511880271", mcversion: "1.12.2", tweakClass: "com.mumfrey.liteloader.launch.LiteLoaderTweaker", libraries: [{ name: "net.minecraft:launchwrapper:1.12" }, { name: "org.ow2.asm:asm-all:5.2" }] };
            const result = await installLiteloader(meta, MinecraftFolder.from(root), { inheritsFrom: "1.12.2-forge1.12.2-14.23.5.2823" });
            await installDependencies(await Version.parse(root, result));
        });
    });
});


describe("FabricInstaller", () => {
    test("should be able to install fabric", async () => {
        await installFabricYarnAndLoader("1.14.1+build.10", "0.4.7+build.147", root);
        expect(existsSync(MinecraftFolder.from(root).getVersionJson("1.14.1-fabric1.14.1+build.10-0.4.7+build.147")))
            .toBeTruthy();
    });

    describe("#updateVersionList", () => {
        let freshList: YarnVersionList;
        test("should be able to get fresh list", async () => {
            freshList = await getYarnVersionList();
            expect(freshList).toBeTruthy();
            if (freshList) {
                expect(typeof freshList.timestamp).toEqual("string");
                expect(freshList.versions).toBeInstanceOf(Array);
                expect(freshList.versions.every((s) => typeof s === "object")).toBeTruthy();
            }
        });
        test("should be able to get 304", async () => {
            const list = await getYarnVersionList({ original: freshList });
            expect(list).toEqual(freshList);
            expect(list).toBeTruthy();
            if (list) {
                expect(typeof list.timestamp).toEqual("string");
                expect(list.versions).toBeInstanceOf(Array);
                expect(list.versions.every((s) => typeof s === "object")).toBeTruthy();
            }
        });
    });
});
