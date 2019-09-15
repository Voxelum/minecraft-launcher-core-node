import { Installer } from "@xmcl/installer";
import { MinecraftFolder, MinecraftLocation } from "@xmcl/util";
import { Version } from "@xmcl/version";
import * as assert from "assert";
import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { ForgeWebPage } from "./forgeweb";
import { ForgeInstaller } from "./index";

async function assertNoError(version: string, loc: MinecraftLocation) {
    const diag = await Version.diagnose(version, loc);
    expect(Object.keys(diag.missingAssets).length).toHaveLength(0);
    expect(diag.missingLibraries.length).toHaveLength(0);
    assert(!diag.missingAssetsIndex, "Missing Asset Index");
    assert(!diag.missingVersionJar, "Missing Version Jar");
    expect(diag.missingVersionJson).toBe("");
}

jest.mock("@xmcl/net");
import * as net from "@xmcl/net";

const mockNet = net as jest.Mocked<typeof net>;

describe.skip("ForgeWebpage", () => {


    test("should get the webpage infomation for 1.12.2", async () => {
        mockNet.getIfUpdate.mockReturnValue(Promise.resolve({
            timestamp: "0",
        }));
        const page = await ForgeWebPage.getWebPage({ mcversion: "1.12.2" });
        assert(page);

        expect(mockNet.getIfUpdate).toHaveBeenCalled();
        expect(mockNet.getIfUpdate).toHaveBeenCalledWith();

        const vers = new Set<string>();
        for (const v of page.versions) {
            assert(v.changelog);
            assert(v.universal);
            assert(v.mdk);
            assert(v.installer);
            expect(page.mcversion).toEqual(v.mcversion);
            if (vers.has(v.version)) { throw new Error("Should not have duplicated version"); }
            vers.add(v.version);
        }
    });

    test("should get the webpage infomation for 1.13.2", async () => {
        const page = await ForgeWebPage.getWebPage({ mcversion: "1.13.2" });
        assert(page);

        const vers = new Set<string>();
        for (const v of page.versions) {
            assert(v.universal);
            assert(v.installer);
            expect(page.mcversion).toEqual(v.mcversion);
            if (vers.has(v.version)) { throw new Error("Should not have duplicated version"); }
            vers.add(v.version);
        }
    });

    test("should not fetch duplicate forge version", async () => {
        const first = await ForgeWebPage.getWebPage();
        const sec = await ForgeWebPage.getWebPage({ fallback: first });

        expect(first.timestamp).toEqual(sec.timestamp);
    });
});

describe.skip("ForgeInstaller", () => {
    const assets = path.normalize(path.join(__dirname, "..", "..", "mock"));
    const gameDirectory = path.join(assets, "temp");

    jest.setTimeout(100000000);

    test("should install forge on 1.7.10", async () => {
        const meta: ForgeInstaller.VersionMeta = {
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
        const result = await ForgeInstaller.install(meta, new MinecraftFolder(gameDirectory), {
            tempDir: `${gameDirectory}/`,
        });
        await Installer.installDependencies(await Version.parse(gameDirectory, result));
        await assertNoError(result, gameDirectory);
    });
    test("should install forge on 1.12.2", async () => {
        beforeAll(() => {
            if (fs.existsSync(`${gameDirectory}/versions/1.12.2-forge1.12.2-14.23.5.2823/1.12.2-forge1.12.2-14.23.5.2823.json`)) {
                fs.unlinkSync(`${gameDirectory}/versions/1.12.2-forge1.12.2-14.23.5.2823/1.12.2-forge1.12.2-14.23.5.2823.json`);
            }
        });
        const meta: ForgeInstaller.VersionMeta = {
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
        const result = await ForgeInstaller.install(meta, new MinecraftFolder(gameDirectory), {
            tempDir: `${gameDirectory}/`,
        });
        await Installer.installDependencies(await Version.parse(gameDirectory, result));
        await assertNoError(result, gameDirectory);
    });
    test("should install forge 1.13.2-25.0.209", async () => {
        beforeAll(async () => {
            if (fs.existsSync(`${gameDirectory}/versions/1.13.2-forge1.13.2-25.0.209/1.13.2-forge1.13.2-25.0.209.json`)) {
                fs.unlinkSync(`${gameDirectory}/versions/1.13.2-forge1.13.2-25.0.209/1.13.2-forge1.13.2-25.0.209.json`);
            }
            if (!fs.existsSync(`${gameDirectory}/temps`)) {
                fs.mkdirSync(`${gameDirectory}/temps`);
            }

            try {
                await new Promise((resolve, reject) => {
                    exec("java", (e, so, se) => {
                        if (e) { reject(e); } else { resolve(); }
                    });
                });
            } catch (e) {
                // skip();
            }
        });
        const mc = new MinecraftFolder(gameDirectory);
        const meta: ForgeInstaller.VersionMeta = {
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
        const result = await ForgeInstaller.install(meta, new MinecraftFolder(gameDirectory), {
            tempDir: `${gameDirectory}/temps`,
            clearTempDirAfterInstall: false,
        });
        await Installer.installDependencies(await Version.parse(gameDirectory, result));
        await assertNoError(result, gameDirectory);
    });

    test("should install forge 1.14.4-forge-28.0.45", async () => {
        beforeAll(async () => {
            if (fs.existsSync(`${gameDirectory}/versions/1.14.4-forge-28.0.45/1.14.4-forge-28.0.45.json`)) {
                fs.unlinkSync(`${gameDirectory}/versions/1.14.4-forge-28.0.45/1.14.4-forge-28.0.45.json`);
            }
            if (!fs.existsSync(`${gameDirectory}/temps`)) {
                fs.mkdirSync(`${gameDirectory}/temps`);
            }

            try {
                await new Promise((resolve, reject) => {
                    exec("java", (e, so, se) => {
                        if (e) { reject(e); } else { resolve(); }
                    });
                });
            } catch (e) {
                // skip();
            }
        });
        const meta: ForgeInstaller.VersionMeta = {
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
        const result = await ForgeInstaller.install(meta, new MinecraftFolder(gameDirectory), {
            tempDir: `${gameDirectory}/temps`,
            clearTempDirAfterInstall: false,
        });
        await Installer.installDependencies(await Version.parse(gameDirectory, result));
        await assertNoError(result, gameDirectory);
    });
});
