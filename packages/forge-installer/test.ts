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
    assert.equal(Object.keys(diag.missingAssets).length, 0, JSON.stringify(diag.missingAssets, null, 4));
    assert.equal(diag.missingLibraries.length, 0, JSON.stringify(diag.missingLibraries, null, 4));
    assert(!diag.missingAssetsIndex, "Missing Asset Index");
    assert(!diag.missingVersionJar, "Missing Version Jar");
    assert.equal(diag.missingVersionJson, "", diag.missingVersionJson);
}

before(function () {
    this.assets = path.normalize(path.join(__dirname, "..", "..", "assets"));
    this.gameDirectory = path.join(this.assets, "temp");
});

describe("ForgeWebpage", function () {
    it("should get the webpage infomation for 1.12.2", async () => {
        const page = await ForgeWebPage.getWebPage({ mcversion: "1.12.2" });
        assert(page);

        const vers = new Set<string>();
        for (const v of page.versions) {
            assert(v.changelog);
            assert(v.universal);
            assert(v.mdk);
            assert(v.installer);
            assert.equal(page.mcversion, v.mcversion);
            if (vers.has(v.version)) { throw new Error("Should not have duplicated version"); }
            vers.add(v.version);
        }
    }).timeout(100000);

    it("should get the webpage infomation for 1.13.2", async () => {
        const page = await ForgeWebPage.getWebPage({ mcversion: "1.13.2" });
        assert(page);

        const vers = new Set<string>();
        for (const v of page.versions) {
            assert(v.universal);
            assert(v.installer);
            assert.equal(page.mcversion, v.mcversion);
            if (vers.has(v.version)) { throw new Error("Should not have duplicated version"); }
            vers.add(v.version);
        }
    }).timeout(100000);

    it("should not fetch duplicate forge version", async () => {
        const first = await ForgeWebPage.getWebPage();
        const sec = await ForgeWebPage.getWebPage({ fallback: first });

        assert.equal(first.timestamp, sec.timestamp);
    }).timeout(100000);
});

describe("ForgeInstaller", function () {
    it("should install forge on 1.7.10", async function () {
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
        const result = await ForgeInstaller.install(meta, new MinecraftFolder(this.gameDirectory), {
            tempDir: `${this.gameDirectory}/`,
        });
        await Installer.installDependencies(await Version.parse(this.gameDirectory, result), this.gameDirectory);
        await assertNoError(result, this.gameDirectory);
    }).timeout(100000000);;
    it("should install forge on 1.12.2", async function () {
        before(() => {
            if (fs.existsSync(`${this.gameDirectory}/versions/1.12.2-forge1.12.2-14.23.5.2823/1.12.2-forge1.12.2-14.23.5.2823.json`)) {
                fs.unlinkSync(`${this.gameDirectory}/versions/1.12.2-forge1.12.2-14.23.5.2823/1.12.2-forge1.12.2-14.23.5.2823.json`);
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
        const result = await ForgeInstaller.install(meta, new MinecraftFolder(this.gameDirectory), {
            tempDir: `${this.gameDirectory}/`,
        });
        await Installer.installDependencies(await Version.parse(this.gameDirectory, result), this.gameDirectory);
        await assertNoError(result, this.gameDirectory);
    }).timeout(100000000);
    it("should install forge 1.13.2-25.0.209", async function () {
        before(async () => {
            if (fs.existsSync(`${this.gameDirectory}/versions/1.13.2-forge1.13.2-25.0.209/1.13.2-forge1.13.2-25.0.209.json`)) {
                fs.unlinkSync(`${this.gameDirectory}/versions/1.13.2-forge1.13.2-25.0.209/1.13.2-forge1.13.2-25.0.209.json`);
            }
            if (!fs.existsSync(`${this.gameDirectory}/temps`)) {
                fs.mkdirSync(`${this.gameDirectory}/temps`);
            }

            try {
                await new Promise((resolve, reject) => {
                    exec("java", (e, so, se) => {
                        if (e) { reject(e); } else { resolve(); }
                    });
                });
            } catch (e) {
                this.skip();
            }
        });
        const mc = new MinecraftFolder(this.gameDirectory);
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
        const result = await ForgeInstaller.install(meta, new MinecraftFolder(this.gameDirectory), {
            tempDir: `${this.gameDirectory}/temps`,
            clearTempDirAfterInstall: false,
        });
        await Installer.installDependencies(await Version.parse(this.gameDirectory, result), this.gameDirectory);
        await assertNoError(result, this.gameDirectory);
    }).timeout(100000000);
});
