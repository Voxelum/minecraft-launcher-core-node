import { MinecraftFolder, MinecraftLocation, Version } from "@xmcl/core";
import { exists, remove } from "@xmcl/core/fs";
import { existsSync, readFileSync } from "fs";
import { join, normalize } from "path";
import { FabricInstaller, ForgeInstaller, Installer, LiteLoaderInstaller, Diagnosis, CurseforgeInstaller } from "./index";
import { MultipleError } from "./minecraft";

const root = normalize(join(__dirname, "..", "..", "temp"));
const mockRoot = normalize(join(__dirname, "..", "..", "mock"));
const javaPath = (global as any).Java;

describe("Install", () => {
    jest.setTimeout(100000000);

    async function assertNoError(version: string, loc: MinecraftLocation) {
        const diag = await Diagnosis.diagnose(version, loc);
        expect(Object.keys(diag.assets)).toHaveLength(0);
        expect(diag.libraries).toHaveLength(0);
        expect(diag.assetsIndex).toBeFalsy();
        expect(diag.versionJar).toBeFalsy();
        expect(diag.versionJson).toEqual(diag.versionJson);
    }
    describe("MinecraftClient", () => {
        async function installVersionClient(version: Installer.Version, gameDirectory: string) {
            const loc = MinecraftFolder.from(gameDirectory);
            await Installer.install("client", version, loc);
            expect(existsSync(loc.getVersionJar(version.id))).toBeTruthy();
            expect(existsSync(loc.getVersionJson(version.id))).toBeTruthy();
            await assertNoError(version.id, loc);
        }
        test("should fetch minecraft version", () => Installer.getVersionList());
        test("should not fetch duplicate version", async () => {
            const first = await Installer.getVersionList();
            const sec = await Installer.getVersionList({ original: first });
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
        test("should be able to install 1.15.2", async () => {
            await installVersionClient({
                "id": "1.15.2",
                "type": "release",
                "url": "https://launchermeta.mojang.com/v1/packages/b2bc26bec3ed3d4763722941b75a25c0a043b744/1.15.2.json",
                "time": "2020-01-24T11:23:24+00:00",
                "releaseTime": "2020-01-17T10:03:52+00:00"
            }, root);
        });
        test("should throw immediately if throwErrorImmediately is enabled", async () => {
            await expect(Installer.installAssets(await Version.parse(mockRoot, "1.14.4"), {
                assetsHost: "no-op",
                throwErrorImmediately: true,
            })).rejects.not.toBeInstanceOf(MultipleError);
        });
        test("should throw all event if throwErrorImmediately is disabled", async () => {
            await expect(Installer.installAssets(await Version.parse(mockRoot, "1.14.4"), {
                assetsHost: "no-op",
                throwErrorImmediately: false,
            })).rejects.toBeInstanceOf(MultipleError);
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
            },
        );
    });
});

describe("Diagnosis", () => {
    describe("#diagnose", () => {
        test.skip("should be able to diagnose empty json folder", async () => {
            await Diagnosis.diagnose("1.7.10", root);
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
        const meta: ForgeInstaller.Version = {
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
        };
        const result = await ForgeInstaller.install(meta, root);
        expect(result).toEqual("1.7.10-Forge10.13.3.1400-1.7.10");
        await expect(exists(join(root, "versions", "1.7.10-Forge10.13.3.1400-1.7.10", "1.7.10-Forge10.13.3.1400-1.7.10.json")))
            .resolves
            .toBeTruthy();
        await Installer.installDependencies(await Version.parse(root, result));
    });
    test("should install forge on 1.12.2", async () => {
        const meta: ForgeInstaller.Version = {
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
        };
        const result = await ForgeInstaller.install(meta, MinecraftFolder.from(root));
        expect(result).toEqual("1.12.2-forge1.12.2-14.23.5.2823");
        await expect(exists(join(root, "versions", "1.12.2-forge1.12.2-14.23.5.2823", "1.12.2-forge1.12.2-14.23.5.2823.json")))
            .resolves
            .toBeTruthy();
        await Installer.installDependencies(await Version.parse(root, result));
        // await assertNoError(result, root);
    });
    test("should install forge 1.13.2-25.0.209", async () => {
        const meta: ForgeInstaller.Version = {
            mcversion: "1.13.2",
            version: "25.0.209",
            universal: {
                md5: "d565c9d4c5c5e1f223fecd6d29ce8294",
                sha1: "ad053f1db76e9683de0c4d6c54d0d6928a6bc1f2",
                path: "/maven/net/minecraftforge/forge/1.13.2-25.0.209/forge-1.13.2-25.0.209-sources.jar",
            },
            installer: {
                md5: "9870b8ebe8393d427a375d5a0f355af3",
                sha1: "36a0bb39da14d29f9dfec61d7538937ae8af7ab9",
                path: "/maven/net/minecraftforge/forge/1.13.2-25.0.209/forge-1.13.2-25.0.209-installer.jar",
            },
        };
        const result = await ForgeInstaller.install(meta, MinecraftFolder.from(root), { java: javaPath });
        expect(result).toEqual("1.13.2-forge-25.0.209");
        await expect(exists(join(root, "versions", "1.13.2-forge-25.0.209", "1.13.2-forge-25.0.209.json")))
            .resolves
            .toBeTruthy();
        await Installer.installDependencies(await Version.parse(root, result));
    });

    test("should install forge 1.14.4-forge-28.0.45", async () => {
        const meta: ForgeInstaller.Version = {
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
        };
        const result = await ForgeInstaller.install(meta, MinecraftFolder.from(root), { java: javaPath });
        expect(result).toEqual("1.14.4-forge-28.0.45");
        await expect(exists(join(root, "versions", "1.14.4-forge-28.0.45", "1.14.4-forge-28.0.45.json")))
            .resolves
            .toBeTruthy();
        await Installer.installDependencies(await Version.parse(root, result));
        // await assertNoError(result, root);
    });
});

describe("LiteloaderInstaller", () => {
    describe("#update", () => {
        test("should be able to fetch liteloader version json", async () => {
            await LiteLoaderInstaller.getVersionList({}).then((list) => {
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
            const meta: LiteLoaderInstaller.Version = { url: "http://repo.mumfrey.com/content/repositories/snapshots/", type: "SNAPSHOT", file: "liteloader-1.12.2-SNAPSHOT.jar", version: "1.12.2-SNAPSHOT", md5: "1420785ecbfed5aff4a586c5c9dd97eb", timestamp: "1511880271", mcversion: "1.12.2", tweakClass: "com.mumfrey.liteloader.launch.LiteLoaderTweaker", libraries: [{ name: "net.minecraft:launchwrapper:1.12" }, { name: "org.ow2.asm:asm-all:5.2" }] };
            const result = await LiteLoaderInstaller.install(meta, MinecraftFolder.from(root));
            await Installer.installDependencies(await Version.parse(root, result));
        });
        test("should be able to install liteloader to forge", async () => {
            const meta: LiteLoaderInstaller.Version = { url: "http://repo.mumfrey.com/content/repositories/snapshots/", type: "SNAPSHOT", file: "liteloader-1.12.2-SNAPSHOT.jar", version: "1.12.2-SNAPSHOT", md5: "1420785ecbfed5aff4a586c5c9dd97eb", timestamp: "1511880271", mcversion: "1.12.2", tweakClass: "com.mumfrey.liteloader.launch.LiteLoaderTweaker", libraries: [{ name: "net.minecraft:launchwrapper:1.12" }, { name: "org.ow2.asm:asm-all:5.2" }] };
            const result = await LiteLoaderInstaller.install(meta, MinecraftFolder.from(root), { inheritsFrom: "1.12.2-forge1.12.2-14.23.5.2823" });
            await Installer.installDependencies(await Version.parse(root, result));
        });
    });
});


describe("FabricInstaller", () => {
    test("should be able to install fabric", async () => {
        await FabricInstaller.install("1.14.1+build.10", "0.4.7+build.147", root);
        expect(existsSync(MinecraftFolder.from(root).getVersionJson("1.14.1-fabric1.14.1+build.10-0.4.7+build.147")))
            .toBeTruthy();
    });

    describe("#parseVersionMavenXML", () => {
        test("should parse valid version xml from fabric", () => {
            const xmlString = readFileSync(join(mockRoot, "fabric-yarn.xml")).toString();
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

    describe("#updateVersionList", () => {
        let freshList: FabricInstaller.YarnVersionList;
        test("should be able to get fresh list", async () => {
            freshList = await FabricInstaller.getYarnVersionList();
            expect(freshList).toBeTruthy();
            if (freshList) {
                expect(typeof freshList.timestamp).toEqual("string");
                expect(freshList.versions).toBeInstanceOf(Array);
                expect(freshList.versions.every((s) => typeof s === "string")).toBeTruthy();
            }
        });
        test("should be able to get 304", async () => {
            const list = await FabricInstaller.getYarnVersionList({ original: freshList });
            expect(list).toEqual(freshList);
            expect(list).toBeTruthy();
            if (list) {
                expect(typeof list.timestamp).toEqual("string");
                expect(list.versions).toBeInstanceOf(Array);
                expect(list.versions.every((s) => typeof s === "string")).toBeTruthy();
            }
        });
    });
});

describe("CurseforgeInstaller", () => {
    describe("#install", () => {
        test("should be able to install curseforge", async () => {
            let dest = join(root, "modpack-test-root");
            await remove(dest);
            const manifest = await CurseforgeInstaller.installCurseforgeModpack(join(mockRoot, "modpack.zip"), dest, {});
            expect(existsSync(join(dest, "mods", "# LibLoader.jar"))).toBeTruthy();
            expect(existsSync(join(dest, "mods", "jei_1.12.2-4.15.0.291.jar"))).toBeTruthy();
            expect(existsSync(join(dest, "mods", "RealisticTorches-1.12.2-2.1.1.jar"))).toBeTruthy();
            expect(existsSync(join(dest, "resources", "minecraft", "textures", "gui", "options_background.png"))).toBeTruthy();
            expect(manifest).toEqual({
                "author": "Shivaxi",
                "files": [
                    {
                        "fileID": 2803400,
                        "projectID": 238222,
                        "required": true,
                    },
                    {
                        "fileID": 2520544,
                        "projectID": 235729,
                        "required": true,
                    },
                ],
                "manifestType": "minecraftModpack",
                "manifestVersion": 1,
                "minecraft": {
                    "modLoaders": [
                        {
                            "id": "forge-14.23.5.2838",
                            "primary": true,
                        },
                    ],
                    "version": "1.12.2",
                },
                "name": "RLCraft",
                "overrides": "overrides",
                "version": "v2.8.1",
            });
        });
    });
});
