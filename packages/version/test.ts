import * as assert from "assert";
import * as path from "path";
import { ResolvedNative, Version } from "./index";

before(function() {
    this.assets = path.normalize(path.join(__dirname, "..", "..", "assets"));
    this.gameDirectory = path.join(this.assets, "temp");
});

describe("Version", function () {
    describe("#getLibraryInfo", function () {
        it("should be able to parse normal minecraft library", function () {
            const name = "com.mojang:patchy:1.1";
            const parsed = Version.getLibraryInfo(name);
            assert.equal(parsed.groupId, "com.mojang");
            assert.equal(parsed.artifactId, "patchy");
            assert.equal(parsed.version, "1.1");
            assert.equal(parsed.type, "jar");
            assert.equal(parsed.isSnapshot, false);
            assert.equal(parsed.path, "com/mojang/patchy/1.1/patchy-1.1.jar");
        });

        it("should be able to parse strange forge library", function () {
            const name = "net.minecraftforge:forge:1.14.3-27.0.47:universal";
            const parsed = Version.getLibraryInfo(name);
            assert.equal(parsed.groupId, "net.minecraftforge");
            assert.equal(parsed.artifactId, "forge");
            assert.equal(parsed.version, "1.14.3-27.0.47");
            assert.equal(parsed.classifier, "universal");
            assert.equal(parsed.type, "jar");
            assert.equal(parsed.isSnapshot, false);
            assert.equal(parsed.path, "net/minecraftforge/forge/1.14.3-27.0.47/forge-1.14.3-27.0.47-universal.jar");
        });

        it("should be able to parse strange forge resource", function () {
            const name = "de.oceanlabs.mcp:mcp_config:1.14.3-20190624.152911@zip";
            const parsed = Version.getLibraryInfo(name);
            assert.equal(parsed.groupId, "de.oceanlabs.mcp");
            assert.equal(parsed.artifactId, "mcp_config");
            assert.equal(parsed.version, "1.14.3-20190624.152911");
            assert.equal(parsed.classifier, "");
            assert.equal(parsed.type, "zip");
            assert.equal(parsed.isSnapshot, false);
            assert.equal(parsed.path, "de/oceanlabs/mcp/mcp_config/1.14.3-20190624.152911/mcp_config-1.14.3-20190624.152911.zip");
        });
    });

    describe("#resolveLibraries", function () {
        it("should be able to resolve normal minecraft library", function () {
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
            assert.equal(resolved.download, rawLib.downloads.artifact);
            assert.equal(resolved.checksums, undefined);
            assert.equal(resolved.serverreq, undefined);
            assert.equal(resolved.clientreq, undefined);
            assert.equal(resolved.name, rawLib.name);
        });
        it("should be able to resolve legacy forge library", function () {
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
            assert.equal(resolved.name, lib.name);
            assert.equal(resolved.serverreq, lib.serverreq);
            assert.equal(resolved.clientreq, lib.clientreq);
            assert.equal(resolved.checksums, lib.checksums);
            assert.equal(resolved.download.sha1, lib.checksums[0]);
            assert.equal(resolved.download.path, "org/scala-lang/plugins/scala-continuations-library_2.11/1.0.2/scala-continuations-library_2.11-1.0.2.jar");
        });
        it("should be able to filter out useless native library", function () {
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
            assert(!onOsx);
            assert(onWin);
            assert(onLinux);
        });
        it("should be able to select correct native library by system", function () {
            const selectionNative = {
                extract: {
                    exclude: [
                        "META-INF/",
                    ],
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
            assert(onOsx instanceof ResolvedNative);
            assert(onWin instanceof ResolvedNative);
            assert(onLinux instanceof ResolvedNative);

            assert.equal(onOsx.download, selectionNative.downloads.classifiers["natives-osx"]);
            assert.equal(onWin.download, selectionNative.downloads.classifiers["natives-windows"]);
            assert.equal(onLinux.download, selectionNative.downloads.classifiers["natives-linux"]);
        });
        it("should correct work on mixture case of selection & rule", function () {
            const lib = {
                extract: {
                    exclude: [
                        "META-INF/",
                    ],
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
            assert(onOsx instanceof ResolvedNative);
            assert(onWin === undefined);
            assert(onLinux === undefined);

            assert.equal(onOsx.download, lib.downloads.classifiers["natives-osx"]);
        });
        it("should be able to handle the case with arch", function () {
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
                    exclude: [
                        "META-INF/",
                    ],
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

            const [onOsx] = Version.resolveLibraries([lib], { name: "osx", version: "", arch: "64" });
            const [onWin] = Version.resolveLibraries([lib], { name: "windows", version: "", arch: "64" });
            const [onWin32] = Version.resolveLibraries([lib], { name: "windows", version: "", arch: "32" });
            const [onLinux] = Version.resolveLibraries([lib], { name: "linux", version: "", arch: "64" });
            assert(onOsx === undefined);
            assert(onWin instanceof ResolvedNative);
            assert(onWin32 instanceof ResolvedNative);
            assert(onLinux === undefined);

            assert.equal(onWin.download, lib.downloads.classifiers["natives-windows-64"]);
            assert.equal(onWin32.download, lib.downloads.classifiers["natives-windows-32"]);
        });
    });
    describe("#mixinArgumentString", function () {
        it("should be able to mixin the version string", () => {
            // tslint:disable:max-line-length
            const s = Version.mixinArgumentString("--tweakClass com.mumfrey.liteloader.launch.LiteLoaderTweaker --username ${auth_player_name} --version ${version_name} --gameDir ${game_directory} --assetsDir ${assets_root} --assetIndex ${assets_index_name} --uuid ${auth_uuid} --accessToken ${auth_access_token} --userType ${user_type} --versionType ${version_type}", "--tweakClass com.mumfrey.liteloader.launch.LiteLoaderTweaker --username ${auth_player_name} --version ${version_name} --gameDir ${game_directory} --assetsDir ${assets_root} --assetIndex ${assets_index_name} --uuid ${auth_uuid} --accessToken ${auth_access_token} --userType ${user_type} --tweakClass net.minecraftforge.fml.common.launcher.FMLTweaker --versionType Forge");
            assert.equal(s, "--tweakClass com.mumfrey.liteloader.launch.LiteLoaderTweaker --tweakClass net.minecraftforge.fml.common.launcher.FMLTweaker --username ${auth_player_name} --version ${version_name} --gameDir ${game_directory} --assetsDir ${assets_root} --assetIndex ${assets_index_name} --uuid ${auth_uuid} --accessToken ${auth_access_token} --userType ${user_type} --versionType ${version_type}");
        });
    });

    // it("should be able to extends the version", async function () {
    //     const ver = await Version.parse(this.gameDirectory, "1.12.2-Liteloader1.12.2-1.12.2-SNAPSHOT");
    //     const ver2 = await Version.parse(this.gameDirectory, "1.12.2-forge1.12.2-14.23.5.2823");

    //     const out = Version.extendsVersion("test", ver, ver2);
    //     assert(out);
    // });
});
