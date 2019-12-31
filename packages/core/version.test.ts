import { currentPlatform } from "./platform";
import { join, normalize } from "path";
import { ResolvedNative, LibraryInfo, Version } from "./version";

const root = normalize(join(__dirname, "..", "..", "mock"));

describe("Version", () => {
    describe("#getLibraryInfo", () => {
        test("should be able to parse normal minecraft library", () => {
            const name = "com.mojang:patchy:1.1";
            const parsed = LibraryInfo.resolve(name);
            expect(parsed.groupId).toEqual("com.mojang");
            expect(parsed.artifactId).toEqual("patchy");
            expect(parsed.version).toEqual("1.1");
            expect(parsed.type).toEqual("jar");
            expect(parsed.isSnapshot).toEqual(false);
            expect(parsed.path).toEqual("com/mojang/patchy/1.1/patchy-1.1.jar");
        });

        test("should be able to parse strange forge library", () => {
            const name = "net.minecraftforge:forge:1.14.3-27.0.47:universal";
            const parsed = LibraryInfo.resolve(name);
            expect(parsed.groupId).toEqual("net.minecraftforge");
            expect(parsed.artifactId).toEqual("forge");
            expect(parsed.version).toEqual("1.14.3-27.0.47");
            expect(parsed.classifier).toEqual("universal");
            expect(parsed.type).toEqual("jar");
            expect(parsed.isSnapshot).toEqual(false);
            expect(parsed.path).toEqual("net/minecraftforge/forge/1.14.3-27.0.47/forge-1.14.3-27.0.47-universal.jar");
        });

        test("should be able to parse strange forge resource", () => {
            const name = "de.oceanlabs.mcp:mcp_config:1.14.3-20190624.152911@zip";
            const parsed = LibraryInfo.resolve(name);
            expect(parsed.groupId).toEqual("de.oceanlabs.mcp");
            expect(parsed.artifactId).toEqual("mcp_config");
            expect(parsed.version).toEqual("1.14.3-20190624.152911");
            expect(parsed.classifier).toEqual("");
            expect(parsed.type).toEqual("zip");
            expect(parsed.isSnapshot).toEqual(false);
            expect(parsed.path).toEqual("de/oceanlabs/mcp/mcp_config/1.14.3-20190624.152911/mcp_config-1.14.3-20190624.152911.zip");
        });
    });

    describe("#resolveLibraries", () => {
        test("should be able to resolve normal minecraft library", () => {
            const rawLib = {
                name: "com.mojang:patchy:1.1",
                downloads: {
                    artifact: {
                        size: 15817,
                        sha1: "aef610b34a1be37fa851825f12372b78424d8903",
                        path: "com/mojang/patchy/1.1/patchy-1.1.jar",
                        url: "https://libraries.minecraft.net/com/mojang/patchy/1.1/patchy-1.1.jar",
                    },
                },
            };

            const [resolved] = Version.resolveLibraries([rawLib], { name: "osx", version: "", arch: "x64" });
            expect(resolved.download).toEqual(rawLib.downloads.artifact);
            expect(resolved.checksums).toEqual(undefined);
            expect(resolved.serverreq).toEqual(undefined);
            expect(resolved.clientreq).toEqual(undefined);
            expect(resolved.name).toEqual(rawLib.name);
        });
        test("should be able to resolve legacy forge library", () => {
            const lib = {
                name: "org.scala-lang.plugins:scala-continuations-library_2.11:1.0.2",
                url: "http://files.minecraftforge.net/maven/",
                checksums: [
                    "87213338cd5a153a7712cb574c0ddd2edfee0386",
                    "0b4c1bf8d48993f138d6e10c0c144e50acfff581",
                ],
                serverreq: true,
                clientreq: true,
            };
            const [resolved] = Version.resolveLibraries([lib], { name: "osx", version: "", arch: "x64" });
            expect(resolved.name).toEqual(lib.name);
            expect(resolved.serverreq).toEqual(lib.serverreq);
            expect(resolved.clientreq).toEqual(lib.clientreq);
            expect(resolved.checksums).toEqual(lib.checksums);
            expect(resolved.download.sha1).toEqual(lib.checksums[0]);
            expect(resolved.download.path).toEqual("org/scala-lang/plugins/scala-continuations-library_2.11/1.0.2/scala-continuations-library_2.11-1.0.2.jar");
        });
        test("should be able to filter out useless native library", () => {
            const lib = {
                name: "org.lwjgl.lwjgl:lwjgl_util:2.9.4-nightly-20150209",
                rules: [
                    {
                        action: "allow",
                    },
                    {
                        action: "disallow",
                        os: {
                            name: "osx",
                        },
                    },
                ],
                downloads: {
                    artifact: {
                        size: 173887,
                        sha1: "d51a7c040a721d13efdfbd34f8b257b2df882ad0",
                        path: "org/lwjgl/lwjgl/lwjgl_util/2.9.4-nightly-20150209/lwjgl_util-2.9.4-nightly-20150209.jar",
                        url: "https://libraries.minecraft.net/org/lwjgl/lwjgl/lwjgl_util/2.9.4-nightly-20150209/lwjgl_util-2.9.4-nightly-20150209.jar",
                    },
                },
            };
            const [onOsx] = Version.resolveLibraries([lib], { name: "osx", version: "", arch: "64" });
            const [onWin] = Version.resolveLibraries([lib], { name: "windows", version: "", arch: "64" });
            const [onLinux] = Version.resolveLibraries([lib], { name: "linux", version: "", arch: "64" });
            expect(onOsx).toBeFalsy();
            expect(onWin).toBeTruthy();
            expect(onLinux).toBeTruthy();
        });
        test("should be able to select correct native library by system", () => {
            const selectionNative = {
                extract: {
                    exclude: ["META-INF/",],
                },
                name: "net.java.jinput:jinput-platform:2.0.5",
                natives: {
                    linux: "natives-linux",
                    osx: "natives-osx",
                    windows: "natives-windows",
                },
                downloads: {
                    classifiers: {
                        "natives-linux": {
                            size: 10362,
                            sha1: "7ff832a6eb9ab6a767f1ade2b548092d0fa64795",
                            path: "net/java/jinput/jinput-platform/2.0.5/jinput-platform-2.0.5-natives-linux.jar",
                            url: "https://libraries.minecraft.net/net/java/jinput/jinput-platform/2.0.5/jinput-platform-2.0.5-natives-linux.jar",
                        },
                        "natives-osx": {
                            size: 12186,
                            sha1: "53f9c919f34d2ca9de8c51fc4e1e8282029a9232",
                            path: "net/java/jinput/jinput-platform/2.0.5/jinput-platform-2.0.5-natives-osx.jar",
                            url: "https://libraries.minecraft.net/net/java/jinput/jinput-platform/2.0.5/jinput-platform-2.0.5-natives-osx.jar",
                        },
                        "natives-windows": {
                            size: 155179,
                            sha1: "385ee093e01f587f30ee1c8a2ee7d408fd732e16",
                            path: "net/java/jinput/jinput-platform/2.0.5/jinput-platform-2.0.5-natives-windows.jar",
                            url: "https://libraries.minecraft.net/net/java/jinput/jinput-platform/2.0.5/jinput-platform-2.0.5-natives-windows.jar",
                        },
                    },
                },
            };

            const [onOsx] = Version.resolveLibraries([selectionNative], { name: "osx", version: "", arch: "64" });
            const [onWin] = Version.resolveLibraries([selectionNative], { name: "windows", version: "", arch: "64" });
            const [onLinux] = Version.resolveLibraries([selectionNative], { name: "linux", version: "", arch: "64" });
            expect(onOsx).toBeInstanceOf(ResolvedNative);
            expect(onWin).toBeInstanceOf(ResolvedNative);
            expect(onLinux).toBeInstanceOf(ResolvedNative);

            expect(onOsx.download).toEqual(selectionNative.downloads.classifiers["natives-osx"]);
            expect(onWin.download).toEqual(selectionNative.downloads.classifiers["natives-windows"]);
            expect(onLinux.download).toEqual(selectionNative.downloads.classifiers["natives-linux"]);
        });
        test("should correct work on mixture case of selection & rule", () => {
            const lib = {
                extract: {
                    exclude: ["META-INF/",],
                },
                name: "ca.weblite:java-objc-bridge:1.0.0",
                natives: {
                    osx: "natives-osx",
                },
                rules: [
                    {
                        action: "allow",
                        os: {
                            name: "osx",
                        },
                    },
                ],
                downloads: {
                    classifiers: {
                        "natives-osx": {
                            size: 5629,
                            sha1: "08befab4894d55875f33c3d300f4f71e6e828f64",
                            path: "ca/weblite/java-objc-bridge/1.0.0/java-objc-bridge-1.0.0-natives-osx.jar",
                            url: "https://libraries.minecraft.net/ca/weblite/java-objc-bridge/1.0.0/java-objc-bridge-1.0.0-natives-osx.jar",
                        },
                    },
                    artifact: {
                        size: 40502,
                        sha1: "6ef160c3133a78de015830860197602ca1c855d3",
                        path: "ca/weblite/java-objc-bridge/1.0.0/java-objc-bridge-1.0.0.jar",
                        url: "https://libraries.minecraft.net/ca/weblite/java-objc-bridge/1.0.0/java-objc-bridge-1.0.0.jar",
                    },
                },
            };

            const [onOsx] = Version.resolveLibraries([lib], { name: "osx", version: "", arch: "64" });
            const [onWin] = Version.resolveLibraries([lib], { name: "windows", version: "", arch: "64" });
            const [onLinux] = Version.resolveLibraries([lib], { name: "linux", version: "", arch: "64" });
            expect(onOsx).toBeInstanceOf(ResolvedNative);
            expect(onWin).toBeUndefined();
            expect(onLinux).toBeUndefined();

            expect(onOsx.download).toEqual(lib.downloads.classifiers["natives-osx"]);
        });
        test("should be able to handle the case with arch", () => {
            const lib = {
                downloads: {
                    classifiers: {
                        "natives-windows-32": {
                            path: "tv/twitch/twitch-external-platform/4.5/twitch-external-platform-4.5-natives-windows-32.jar",
                            sha1: "18215140f010c05b9f86ef6f0f8871954d2ccebf",
                            size: 5654047,
                            url: "https://libraries.minecraft.net/tv/twitch/twitch-external-platform/4.5/twitch-external-platform-4.5-natives-windows-32.jar",
                        },
                        "natives-windows-64": {
                            path: "tv/twitch/twitch-external-platform/4.5/twitch-external-platform-4.5-natives-windows-64.jar",
                            sha1: "c3cde57891b935d41b6680a9c5e1502eeab76d86",
                            size: 7457619,
                            url: "https://libraries.minecraft.net/tv/twitch/twitch-external-platform/4.5/twitch-external-platform-4.5-natives-windows-64.jar",
                        },
                    },
                },
                extract: {
                    exclude: ["META-INF/",],
                },
                name: "tv.twitch:twitch-external-platform:4.5",
                natives: {
                    windows: "natives-windows-${arch}",
                },
                rules: [
                    {
                        action: "allow",
                        os: {
                            name: "windows",
                        },
                    },
                ],
            };

            const [onOsx] = Version.resolveLibraries([lib], { name: "osx", version: "", arch: "x64" });
            const [onWin] = Version.resolveLibraries([lib], { name: "windows", version: "", arch: "x64" });
            const [onWin32] = Version.resolveLibraries([lib], { name: "windows", version: "", arch: "x32" });
            const [onLinux] = Version.resolveLibraries([lib], { name: "linux", version: "", arch: "x64" });
            expect(onOsx).toBeUndefined();
            expect(onWin).toBeInstanceOf(ResolvedNative);
            expect(onWin32).toBeInstanceOf(ResolvedNative);
            expect(onLinux).toBeUndefined();

            expect(onWin.download).toEqual(lib.downloads.classifiers["natives-windows-64"]);
            expect(onWin32.download).toEqual(lib.downloads.classifiers["natives-windows-32"]);
        });
    });
    describe("#mixinArgumentString", () => {
        test("should be able to mixin the version string", () => {
            // tslint:disable:max-line-length
            const s = Version.mixinArgumentString("--tweakClass com.mumfrey.liteloader.launch.LiteLoaderTweaker --username ${auth_player_name} --version ${version_name} --gameDir ${game_directory} --assetsDir ${assets_root} --assetIndex ${assets_index_name} --uuid ${auth_uuid} --accessToken ${auth_access_token} --userType ${user_type} --versionType ${version_type}", "--tweakClass com.mumfrey.liteloader.launch.LiteLoaderTweaker --username ${auth_player_name} --version ${version_name} --gameDir ${game_directory} --assetsDir ${assets_root} --assetIndex ${assets_index_name} --uuid ${auth_uuid} --accessToken ${auth_access_token} --userType ${user_type} --tweakClass net.minecraftforge.fml.common.launcher.FMLTweaker --versionType Forge");
            expect(s).toEqual("--tweakClass com.mumfrey.liteloader.launch.LiteLoaderTweaker --tweakClass net.minecraftforge.fml.common.launcher.FMLTweaker --username ${auth_player_name} --version ${version_name} --gameDir ${game_directory} --assetsDir ${assets_root} --assetIndex ${assets_index_name} --uuid ${auth_uuid} --accessToken ${auth_access_token} --userType ${user_type} --versionType ${version_type}");
        });
    });

    describe("#parse", () => {
        test("should throw if no main class", async () => {
            await expect(Version.parse(root, "no-main-class"))
                .rejects
                .toEqual({
                    missing: "MainClass",
                    version: "no-main-class",
                    type: "CorruptedVersionJson",
                });

        });
        test("should throw if no asset json", async () => {
            await expect(Version.parse(root, "no-assets-json"))
                .rejects
                .toEqual({
                    type: "CorruptedVersionJson",
                    version: "no-assets-json",
                    missing: "AssetIndex",
                });
        });
        test("should throw if no downloads", async () => {
            await expect(Version.parse(root, "no-downloads"))
                .rejects
                .toEqual({
                    type: "CorruptedVersionJson",
                    version: "no-downloads",
                    missing: "Downloads",
                });
        });
        test("should be able to parse 1.17.10 version", async () => {
            const version = await Version.parse(root, "1.7.10");
            expect(version.id).toEqual("1.7.10");
            expect(version.client).toEqual("1.7.10");
            expect(version.mainClass).toBeTruthy();
            expect(version.libraries).toBeInstanceOf(Array);
            expect(version.arguments).toBeTruthy();
            expect(version.arguments.game).toBeInstanceOf(Array);
            expect(version.arguments.jvm).toBeInstanceOf(Array);
            expect(version.minecraftDirectory).toEqual(root);
        });
        // test("should be able to parse 1.13.2 version", async () => {
        //     const version = await parse(root, "1.13.2");
        //     expect(version.id).toEqual("1.13.2");
        //     expect(version.client).toEqual("1.13.2");
        //     expect(version.mainClass).toBeTruthy();
        //     expect(version.libraries).toBeInstanceOf(Array);
        //     expect(version.arguments).toBeTruthy();
        //     expect(version.arguments.game).toBeInstanceOf(Array);
        //     expect(version.arguments.jvm).toBeInstanceOf(Array);
        //     expect(version.minecraftDirectory).toEqual(root);
        // });
        test("should be able to throw if version not existed", async () => {
            await expect(Version.parse(root, "1.12"))
                .rejects
                .toStrictEqual({
                    type: "MissingVersionJson",
                    version: "1.12",
                });
        });
        test("should be able to parse extended profile for forge", async () => {
            const version = await Version.parse(root, "1.7.10-Forge10.13.3.1400-1.7.10");
            expect(version.id).toEqual("1.7.10-Forge10.13.3.1400-1.7.10");
            expect(version.client).toEqual("1.7.10");
            expect(version.mainClass).toBeTruthy();
            expect(version.libraries).toBeInstanceOf(Array);
            expect(version.arguments).toBeTruthy();
            expect(version.arguments.game).toBeInstanceOf(Array);
            expect(version.arguments.jvm).toBeInstanceOf(Array);
            expect(version.minecraftDirectory).toEqual(root);
        });
        it("should be able to parse version chain", async function () {
            // const ver = await Version.parse(root, "1.12.2-Liteloader1.12.2-1.12.2-SNAPSHOT");
            // expect(ver).toBeTruthy();
            // expect(ver.pathChain).toBeInstanceOf(Array);
            // expect(ver.pathChain).toHaveLength(2);
            // expect(ver.pathChain[0]).toBe(mc.getVersionRoot("1.12.2-Liteloader1.12.2-1.12.2-SNAPSHOT")) ；
            // const mc = new MinecraftFolder(this.gameDirectory);
            // assert.equal(ver.pathChain.length, 2);
            // assert.equal(ver.pathChain[0]);
            // assert.equal(ver.pathChain[1], mc.getVersionRoot("1.12.2"));
        });
    });

    describe("#checkAllowed", () => {
        test("should be able to handle empty rules", () => {
            expect(Version.checkAllowed([]))
                .toBeTruthy();
        });
        test("should be able to handle featured rules", () => {
            expect(Version.checkAllowed([
                {
                    action: "allow",
                    features: {
                        is_demo_user: true,
                    },
                },
            ], currentPlatform, ["is_demo_user"]))
                .toBeTruthy();
        });
        test("should be able to handle featured rules with flag false", () => {
            expect(Version.checkAllowed([
                {
                    action: "allow",
                    features: {
                        is_demo_user: false,
                    },
                },
            ], currentPlatform, [""]))
                .toBeTruthy();
        });
    });

    describe("#mixinArgumentString", () => {
        it("should be able to mixin the version string", () => {
            // tslint:disable:max-line-length
            const s = Version.mixinArgumentString("--tweakClass com.mumfrey.liteloader.launch.LiteLoaderTweaker --username ${auth_player_name} --version ${version_name} --gameDir ${game_directory} --assetsDir ${assets_root} --assetIndex ${assets_index_name} --uuid ${auth_uuid} --accessToken ${auth_access_token} --userType ${user_type} --versionType ${version_type}", "--tweakClass com.mumfrey.liteloader.launch.LiteLoaderTweaker --username ${auth_player_name} --version ${version_name} --gameDir ${game_directory} --assetsDir ${assets_root} --assetIndex ${assets_index_name} --uuid ${auth_uuid} --accessToken ${auth_access_token} --userType ${user_type} --tweakClass net.minecraftforge.fml.common.launcher.FMLTweaker --versionType Forge");
            expect(s).toEqual("--tweakClass com.mumfrey.liteloader.launch.LiteLoaderTweaker --tweakClass net.minecraftforge.fml.common.launcher.FMLTweaker --username ${auth_player_name} --version ${version_name} --gameDir ${game_directory} --assetsDir ${assets_root} --assetIndex ${assets_index_name} --uuid ${auth_uuid} --accessToken ${auth_access_token} --userType ${user_type} --versionType ${version_type}");
        });
    });

    // it("should be able to extends the version", async function () {
    //     const ver = await Version.parse(this.gameDirectory, "1.12.2-Liteloader1.12.2-1.12.2-SNAPSHOT");
    //     const ver2 = await Version.parse(this.gameDirectory, "1.12.2-forge1.12.2-14.23.5.2823");

    //     const out = Version.extendsVersion("test", ver, ver2);
    //     assert(out);
    // });
});
