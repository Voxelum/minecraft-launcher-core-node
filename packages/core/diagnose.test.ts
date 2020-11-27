jest.mock("./utils");

import { MinecraftFolder } from "./folder";
import { diagnoseLibraries } from "./diagnose";
import { join } from "path";

const resolvedLib = {
    "name": "com.mojang:patchy:1.1",
    "download": {
        "path": "com/mojang/patchy/1.1/patchy-1.1.jar",
        "sha1": "aef610b34a1be37fa851825f12372b78424d8903",
        "size": 15817,
        "url": "https://libraries.minecraft.net/com/mojang/patchy/1.1/patchy-1.1.jar"
    },
    "groupId": "com.mojang",
    "artifactId": "patchy",
    "version": "1.1",
    "isSnapshot": false,
    "type": "jar",
    "classifier": "",
    "path": "com/mojang/patchy/1.1/patchy-1.1.jar"
} as const;

describe("#diagnoseLibraries", () => {
    beforeEach(() => {
        require("./utils").__reset();
    });

    test("should diagnose empty result for valid library", async () => {
        require("./utils").__addChecksum({ "temp/libraries/com/mojang/patchy/1.1/patchy-1.1.jar": "aef610b34a1be37fa851825f12372b78424d8903" });
        require("./utils").__addExistedFile("temp/libraries/com/mojang/patchy/1.1/patchy-1.1.jar");
        const issue = await diagnoseLibraries({
            ...resolvedVersion,
            libraries: [resolvedLib]
        } as any, MinecraftFolder.from("temp"));
        expect(issue).toHaveLength(0);
    });
    test("should diagnose invalid library for no such file", async () => {
        require("./utils").__addChecksum({ "temp/libraries/com/mojang/patchy/1.1/patchy-1.1.jar": "aef610b34a1be37fa851825f12372b78424d8903" });
        const issue = await diagnoseLibraries({
            ...resolvedVersion,
            libraries: [resolvedLib]
        } as any, MinecraftFolder.from("temp"));
        expect(issue).toHaveLength(1);
        expect(issue[0]).toEqual({
            type: "missing",
            role: "library",
            file: join("temp", "libraries", "com", "mojang", "patchy", "1.1", "patchy-1.1.jar"),
            expectedChecksum: "aef610b34a1be37fa851825f12372b78424d8903",
            receivedChecksum: "",
            hint: "Problem on library! Please consider to use Installer.installLibraries to fix.",
            library: resolvedLib
        })
    });
    test("should diagnose invalid library for checksum not match", async () => {
        require("./utils").__addChecksum({ "temp/libraries/com/mojang/patchy/1.1/patchy-1.1.jar": "asd" });
        require("./utils").__addExistedFile("temp/libraries/com/mojang/patchy/1.1/patchy-1.1.jar");
        const issue = await diagnoseLibraries({
            ...resolvedVersion,
            libraries: [resolvedLib]
        } as any, MinecraftFolder.from("temp"));
        expect(issue).toHaveLength(1);
        expect(issue[0]).toEqual({
            type: "corrupted",
            role: "library",
            file: join("temp", "libraries", "com", "mojang", "patchy", "1.1", "patchy-1.1.jar"),
            expectedChecksum: "aef610b34a1be37fa851825f12372b78424d8903",
            receivedChecksum: "asd",
            hint: "Problem on library! Please consider to use Installer.installLibraries to fix.",
            library: resolvedLib
        })
    });
});

const resolvedVersion = {
    "id": "1.14.4",
    "assetIndex": {
        "id": "1.14",
        "sha1": "695d8e3d95465bece605c92e9b0385278018eff9",
        "size": 226558,
        "totalSize": 208314198,
        "url": "https://launchermeta.mojang.com/v1/packages/695d8e3d95465bece605c92e9b0385278018eff9/1.14.json"
    },
    "assets": "1.14",
    "minecraftVersion": "1.14.4",
    "inheritances": ["1.14.4"],
    "arguments": {
        "jvm": [
            {
                "rules": [
                    {
                        "action": "allow",
                        "os": {
                            "name": "windows"
                        }
                    }
                ],
                "value": "-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump"
            },
            {
                "rules": [
                    {
                        "action": "allow",
                        "os": {
                            "name": "windows",
                            "version": "^10\\."
                        }
                    }
                ],
                "value": [
                    "-Dos.name=Windows 10",
                    "-Dos.version=10.0"
                ]
            },
            "-Djava.library.path=${natives_directory}",
            "-Dminecraft.launcher.brand=${launcher_name}",
            "-Dminecraft.launcher.version=${launcher_version}",
            "-cp",
            "${classpath}"
        ],
        "game": [
            "--username",
            "${auth_player_name}",
            "--version",
            "${version_name}",
            "--gameDir",
            "${game_directory}",
            "--assetsDir",
            "${assets_root}",
            "--assetIndex",
            "${assets_index_name}",
            "--uuid",
            "${auth_uuid}",
            "--accessToken",
            "${auth_access_token}",
            "--userType",
            "${user_type}",
            "--versionType",
            "${version_type}",
            {
                "rules": [
                    {
                        "action": "allow",
                        "features": {
                            "is_demo_user": true
                        }
                    }
                ],
                "value": "--demo"
            },
            {
                "rules": [
                    {
                        "action": "allow",
                        "features": {
                            "has_custom_resolution": true
                        }
                    }
                ],
                "value": [
                    "--width",
                    "${resolution_width}",
                    "--height",
                    "${resolution_height}"
                ]
            }
        ]
    },
    "downloads": {
        "client": {
            "sha1": "8c325a0c5bd674dd747d6ebaa4c791fd363ad8a9",
            "size": 25191691,
            "url": "https://launcher.mojang.com/v1/objects/8c325a0c5bd674dd747d6ebaa4c791fd363ad8a9/client.jar"
        },
        "server": {
            "sha1": "3dc3d84a581f14691199cf6831b71ed1296a9fdf",
            "size": 35958734,
            "url": "https://launcher.mojang.com/v1/objects/3dc3d84a581f14691199cf6831b71ed1296a9fdf/server.jar"
        }
    },
    "libraries": [
        {
            "name": "com.mojang:patchy:1.1",
            "download": {
                "path": "com/mojang/patchy/1.1/patchy-1.1.jar",
                "sha1": "aef610b34a1be37fa851825f12372b78424d8903",
                "size": 15817,
                "url": "https://libraries.minecraft.net/com/mojang/patchy/1.1/patchy-1.1.jar"
            },
            "groupId": "com.mojang",
            "artifactId": "patchy",
            "version": "1.1",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "com/mojang/patchy/1.1/patchy-1.1.jar"
        },
        {
            "name": "oshi-project:oshi-core:1.1",
            "download": {
                "path": "oshi-project/oshi-core/1.1/oshi-core-1.1.jar",
                "sha1": "9ddf7b048a8d701be231c0f4f95fd986198fd2d8",
                "size": 30973,
                "url": "https://libraries.minecraft.net/oshi-project/oshi-core/1.1/oshi-core-1.1.jar"
            },
            "groupId": "oshi-project",
            "artifactId": "oshi-core",
            "version": "1.1",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "oshi-project/oshi-core/1.1/oshi-core-1.1.jar"
        },
        {
            "name": "net.java.dev.jna:jna:4.4.0",
            "download": {
                "path": "net/java/dev/jna/jna/4.4.0/jna-4.4.0.jar",
                "sha1": "cb208278274bf12ebdb56c61bd7407e6f774d65a",
                "size": 1091208,
                "url": "https://libraries.minecraft.net/net/java/dev/jna/jna/4.4.0/jna-4.4.0.jar"
            },
            "groupId": "net.java.dev.jna",
            "artifactId": "jna",
            "version": "4.4.0",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "net/java/dev/jna/jna/4.4.0/jna-4.4.0.jar"
        },
        {
            "name": "net.java.dev.jna:platform:3.4.0",
            "download": {
                "path": "net/java/dev/jna/platform/3.4.0/platform-3.4.0.jar",
                "sha1": "e3f70017be8100d3d6923f50b3d2ee17714e9c13",
                "size": 913436,
                "url": "https://libraries.minecraft.net/net/java/dev/jna/platform/3.4.0/platform-3.4.0.jar"
            },
            "groupId": "net.java.dev.jna",
            "artifactId": "platform",
            "version": "3.4.0",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "net/java/dev/jna/platform/3.4.0/platform-3.4.0.jar"
        },
        {
            "name": "com.ibm.icu:icu4j-core-mojang:51.2",
            "download": {
                "path": "com/ibm/icu/icu4j-core-mojang/51.2/icu4j-core-mojang-51.2.jar",
                "sha1": "63d216a9311cca6be337c1e458e587f99d382b84",
                "size": 1634692,
                "url": "https://libraries.minecraft.net/com/ibm/icu/icu4j-core-mojang/51.2/icu4j-core-mojang-51.2.jar"
            },
            "groupId": "com.ibm.icu",
            "artifactId": "icu4j-core-mojang",
            "version": "51.2",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "com/ibm/icu/icu4j-core-mojang/51.2/icu4j-core-mojang-51.2.jar"
        },
        {
            "name": "com.mojang:javabridge:1.0.22",
            "download": {
                "path": "com/mojang/javabridge/1.0.22/javabridge-1.0.22.jar",
                "sha1": "6aa6453aa99a52a5cd91749da1af6ab70e082ab3",
                "size": 5111,
                "url": "https://libraries.minecraft.net/com/mojang/javabridge/1.0.22/javabridge-1.0.22.jar"
            },
            "groupId": "com.mojang",
            "artifactId": "javabridge",
            "version": "1.0.22",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "com/mojang/javabridge/1.0.22/javabridge-1.0.22.jar"
        },
        {
            "name": "net.sf.jopt-simple:jopt-simple:5.0.3",
            "download": {
                "path": "net/sf/jopt-simple/jopt-simple/5.0.3/jopt-simple-5.0.3.jar",
                "sha1": "cdd846cfc4e0f7eefafc02c0f5dce32b9303aa2a",
                "size": 78175,
                "url": "https://libraries.minecraft.net/net/sf/jopt-simple/jopt-simple/5.0.3/jopt-simple-5.0.3.jar"
            },
            "groupId": "net.sf.jopt-simple",
            "artifactId": "jopt-simple",
            "version": "5.0.3",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "net/sf/jopt-simple/jopt-simple/5.0.3/jopt-simple-5.0.3.jar"
        },
        {
            "name": "io.netty:netty-all:4.1.25.Final",
            "download": {
                "path": "io/netty/netty-all/4.1.25.Final/netty-all-4.1.25.Final.jar",
                "sha1": "d0626cd3108294d1d58c05859add27b4ef21f83b",
                "size": 3823147,
                "url": "https://libraries.minecraft.net/io/netty/netty-all/4.1.25.Final/netty-all-4.1.25.Final.jar"
            },
            "groupId": "io.netty",
            "artifactId": "netty-all",
            "version": "4.1.25.Final",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "io/netty/netty-all/4.1.25.Final/netty-all-4.1.25.Final.jar"
        },
        {
            "name": "com.google.guava:guava:21.0",
            "download": {
                "path": "com/google/guava/guava/21.0/guava-21.0.jar",
                "sha1": "3a3d111be1be1b745edfa7d91678a12d7ed38709",
                "size": 2521113,
                "url": "https://libraries.minecraft.net/com/google/guava/guava/21.0/guava-21.0.jar"
            },
            "groupId": "com.google.guava",
            "artifactId": "guava",
            "version": "21.0",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "com/google/guava/guava/21.0/guava-21.0.jar"
        },
        {
            "name": "org.apache.commons:commons-lang3:3.5",
            "download": {
                "path": "org/apache/commons/commons-lang3/3.5/commons-lang3-3.5.jar",
                "sha1": "6c6c702c89bfff3cd9e80b04d668c5e190d588c6",
                "size": 479881,
                "url": "https://libraries.minecraft.net/org/apache/commons/commons-lang3/3.5/commons-lang3-3.5.jar"
            },
            "groupId": "org.apache.commons",
            "artifactId": "commons-lang3",
            "version": "3.5",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "org/apache/commons/commons-lang3/3.5/commons-lang3-3.5.jar"
        },
        {
            "name": "commons-io:commons-io:2.5",
            "download": {
                "path": "commons-io/commons-io/2.5/commons-io-2.5.jar",
                "sha1": "2852e6e05fbb95076fc091f6d1780f1f8fe35e0f",
                "size": 208700,
                "url": "https://libraries.minecraft.net/commons-io/commons-io/2.5/commons-io-2.5.jar"
            },
            "groupId": "commons-io",
            "artifactId": "commons-io",
            "version": "2.5",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "commons-io/commons-io/2.5/commons-io-2.5.jar"
        },
        {
            "name": "commons-codec:commons-codec:1.10",
            "download": {
                "path": "commons-codec/commons-codec/1.10/commons-codec-1.10.jar",
                "sha1": "4b95f4897fa13f2cd904aee711aeafc0c5295cd8",
                "size": 284184,
                "url": "https://libraries.minecraft.net/commons-codec/commons-codec/1.10/commons-codec-1.10.jar"
            },
            "groupId": "commons-codec",
            "artifactId": "commons-codec",
            "version": "1.10",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "commons-codec/commons-codec/1.10/commons-codec-1.10.jar"
        },
        {
            "name": "net.java.jinput:jinput:2.0.5",
            "download": {
                "path": "net/java/jinput/jinput/2.0.5/jinput-2.0.5.jar",
                "sha1": "39c7796b469a600f72380316f6b1f11db6c2c7c4",
                "size": 208338,
                "url": "https://libraries.minecraft.net/net/java/jinput/jinput/2.0.5/jinput-2.0.5.jar"
            },
            "groupId": "net.java.jinput",
            "artifactId": "jinput",
            "version": "2.0.5",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "net/java/jinput/jinput/2.0.5/jinput-2.0.5.jar"
        },
        {
            "name": "net.java.jutils:jutils:1.0.0",
            "download": {
                "path": "net/java/jutils/jutils/1.0.0/jutils-1.0.0.jar",
                "sha1": "e12fe1fda814bd348c1579329c86943d2cd3c6a6",
                "size": 7508,
                "url": "https://libraries.minecraft.net/net/java/jutils/jutils/1.0.0/jutils-1.0.0.jar"
            },
            "groupId": "net.java.jutils",
            "artifactId": "jutils",
            "version": "1.0.0",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "net/java/jutils/jutils/1.0.0/jutils-1.0.0.jar"
        },
        {
            "name": "com.mojang:brigadier:1.0.17",
            "download": {
                "path": "com/mojang/brigadier/1.0.17/brigadier-1.0.17.jar",
                "sha1": "c6b7dc51dd44379cc751b7504816006e9be4b1e6",
                "size": 77392,
                "url": "https://libraries.minecraft.net/com/mojang/brigadier/1.0.17/brigadier-1.0.17.jar"
            },
            "groupId": "com.mojang",
            "artifactId": "brigadier",
            "version": "1.0.17",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "com/mojang/brigadier/1.0.17/brigadier-1.0.17.jar"
        },
        {
            "name": "com.mojang:datafixerupper:2.0.24",
            "download": {
                "path": "com/mojang/datafixerupper/2.0.24/datafixerupper-2.0.24.jar",
                "sha1": "0944c24a8519981847ffb36c6dcd059d96fcb4b0",
                "size": 436066,
                "url": "https://libraries.minecraft.net/com/mojang/datafixerupper/2.0.24/datafixerupper-2.0.24.jar"
            },
            "groupId": "com.mojang",
            "artifactId": "datafixerupper",
            "version": "2.0.24",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "com/mojang/datafixerupper/2.0.24/datafixerupper-2.0.24.jar"
        },
        {
            "name": "com.google.code.gson:gson:2.8.0",
            "download": {
                "path": "com/google/code/gson/gson/2.8.0/gson-2.8.0.jar",
                "sha1": "c4ba5371a29ac9b2ad6129b1d39ea38750043eff",
                "size": 231952,
                "url": "https://libraries.minecraft.net/com/google/code/gson/gson/2.8.0/gson-2.8.0.jar"
            },
            "groupId": "com.google.code.gson",
            "artifactId": "gson",
            "version": "2.8.0",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "com/google/code/gson/gson/2.8.0/gson-2.8.0.jar"
        },
        {
            "name": "com.mojang:authlib:1.5.25",
            "download": {
                "path": "com/mojang/authlib/1.5.25/authlib-1.5.25.jar",
                "sha1": "9834cdf236c22e84b946bba989e2f94ef5897c3c",
                "size": 65621,
                "url": "https://libraries.minecraft.net/com/mojang/authlib/1.5.25/authlib-1.5.25.jar"
            },
            "groupId": "com.mojang",
            "artifactId": "authlib",
            "version": "1.5.25",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "com/mojang/authlib/1.5.25/authlib-1.5.25.jar"
        },
        {
            "name": "org.apache.commons:commons-compress:1.8.1",
            "download": {
                "path": "org/apache/commons/commons-compress/1.8.1/commons-compress-1.8.1.jar",
                "sha1": "a698750c16740fd5b3871425f4cb3bbaa87f529d",
                "size": 365552,
                "url": "https://libraries.minecraft.net/org/apache/commons/commons-compress/1.8.1/commons-compress-1.8.1.jar"
            },
            "groupId": "org.apache.commons",
            "artifactId": "commons-compress",
            "version": "1.8.1",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "org/apache/commons/commons-compress/1.8.1/commons-compress-1.8.1.jar"
        },
        {
            "name": "org.apache.httpcomponents:httpclient:4.3.3",
            "download": {
                "path": "org/apache/httpcomponents/httpclient/4.3.3/httpclient-4.3.3.jar",
                "sha1": "18f4247ff4572a074444572cee34647c43e7c9c7",
                "size": 589512,
                "url": "https://libraries.minecraft.net/org/apache/httpcomponents/httpclient/4.3.3/httpclient-4.3.3.jar"
            },
            "groupId": "org.apache.httpcomponents",
            "artifactId": "httpclient",
            "version": "4.3.3",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "org/apache/httpcomponents/httpclient/4.3.3/httpclient-4.3.3.jar"
        },
        {
            "name": "commons-logging:commons-logging:1.1.3",
            "download": {
                "path": "commons-logging/commons-logging/1.1.3/commons-logging-1.1.3.jar",
                "sha1": "f6f66e966c70a83ffbdb6f17a0919eaf7c8aca7f",
                "size": 62050,
                "url": "https://libraries.minecraft.net/commons-logging/commons-logging/1.1.3/commons-logging-1.1.3.jar"
            },
            "groupId": "commons-logging",
            "artifactId": "commons-logging",
            "version": "1.1.3",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "commons-logging/commons-logging/1.1.3/commons-logging-1.1.3.jar"
        },
        {
            "name": "org.apache.httpcomponents:httpcore:4.3.2",
            "download": {
                "path": "org/apache/httpcomponents/httpcore/4.3.2/httpcore-4.3.2.jar",
                "sha1": "31fbbff1ddbf98f3aa7377c94d33b0447c646b6e",
                "size": 282269,
                "url": "https://libraries.minecraft.net/org/apache/httpcomponents/httpcore/4.3.2/httpcore-4.3.2.jar"
            },
            "groupId": "org.apache.httpcomponents",
            "artifactId": "httpcore",
            "version": "4.3.2",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "org/apache/httpcomponents/httpcore/4.3.2/httpcore-4.3.2.jar"
        },
        {
            "name": "it.unimi.dsi:fastutil:8.2.1",
            "download": {
                "path": "it/unimi/dsi/fastutil/8.2.1/fastutil-8.2.1.jar",
                "sha1": "5ad88f325e424f8dbc2be5459e21ea5cab3864e9",
                "size": 18800417,
                "url": "https://libraries.minecraft.net/it/unimi/dsi/fastutil/8.2.1/fastutil-8.2.1.jar"
            },
            "groupId": "it.unimi.dsi",
            "artifactId": "fastutil",
            "version": "8.2.1",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "it/unimi/dsi/fastutil/8.2.1/fastutil-8.2.1.jar"
        },
        {
            "name": "org.apache.logging.log4j:log4j-api:2.8.1",
            "download": {
                "path": "org/apache/logging/log4j/log4j-api/2.8.1/log4j-api-2.8.1.jar",
                "sha1": "e801d13612e22cad62a3f4f3fe7fdbe6334a8e72",
                "size": 228859,
                "url": "https://libraries.minecraft.net/org/apache/logging/log4j/log4j-api/2.8.1/log4j-api-2.8.1.jar"
            },
            "groupId": "org.apache.logging.log4j",
            "artifactId": "log4j-api",
            "version": "2.8.1",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "org/apache/logging/log4j/log4j-api/2.8.1/log4j-api-2.8.1.jar"
        },
        {
            "name": "org.apache.logging.log4j:log4j-core:2.8.1",
            "download": {
                "path": "org/apache/logging/log4j/log4j-core/2.8.1/log4j-core-2.8.1.jar",
                "sha1": "4ac28ff2f1ddf05dae3043a190451e8c46b73c31",
                "size": 1402925,
                "url": "https://libraries.minecraft.net/org/apache/logging/log4j/log4j-core/2.8.1/log4j-core-2.8.1.jar"
            },
            "groupId": "org.apache.logging.log4j",
            "artifactId": "log4j-core",
            "version": "2.8.1",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "org/apache/logging/log4j/log4j-core/2.8.1/log4j-core-2.8.1.jar"
        },
        {
            "name": "org.lwjgl:lwjgl:3.2.2",
            "download": {
                "path": "org/lwjgl/lwjgl/3.2.2/lwjgl-3.2.2.jar",
                "sha1": "8ad6294407e15780b43e84929c40e4c5e997972e",
                "size": 321900,
                "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl/3.2.2/lwjgl-3.2.2.jar"
            },
            "groupId": "org.lwjgl",
            "artifactId": "lwjgl",
            "version": "3.2.2",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "org/lwjgl/lwjgl/3.2.2/lwjgl-3.2.2.jar"
        },
        {
            "name": "org.lwjgl:lwjgl-jemalloc:3.2.2",
            "download": {
                "path": "org/lwjgl/lwjgl-jemalloc/3.2.2/lwjgl-jemalloc-3.2.2.jar",
                "sha1": "ee8e57a79300f78294576d87c4a587f8c99402e2",
                "size": 34848,
                "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl-jemalloc/3.2.2/lwjgl-jemalloc-3.2.2.jar"
            },
            "groupId": "org.lwjgl",
            "artifactId": "lwjgl-jemalloc",
            "version": "3.2.2",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "org/lwjgl/lwjgl-jemalloc/3.2.2/lwjgl-jemalloc-3.2.2.jar"
        },
        {
            "name": "org.lwjgl:lwjgl-openal:3.2.2",
            "download": {
                "path": "org/lwjgl/lwjgl-openal/3.2.2/lwjgl-openal-3.2.2.jar",
                "sha1": "2b772a102b0a11ee5f2109a5b136f4dc7c630827",
                "size": 80012,
                "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl-openal/3.2.2/lwjgl-openal-3.2.2.jar"
            },
            "groupId": "org.lwjgl",
            "artifactId": "lwjgl-openal",
            "version": "3.2.2",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "org/lwjgl/lwjgl-openal/3.2.2/lwjgl-openal-3.2.2.jar"
        },
        {
            "name": "org.lwjgl:lwjgl-opengl:3.2.2",
            "download": {
                "path": "org/lwjgl/lwjgl-opengl/3.2.2/lwjgl-opengl-3.2.2.jar",
                "sha1": "6ac5bb88b44c43ea195a570aab059f63da004cd8",
                "size": 929780,
                "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl-opengl/3.2.2/lwjgl-opengl-3.2.2.jar"
            },
            "groupId": "org.lwjgl",
            "artifactId": "lwjgl-opengl",
            "version": "3.2.2",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "org/lwjgl/lwjgl-opengl/3.2.2/lwjgl-opengl-3.2.2.jar"
        },
        {
            "name": "org.lwjgl:lwjgl-glfw:3.2.2",
            "download": {
                "path": "org/lwjgl/lwjgl-glfw/3.2.2/lwjgl-glfw-3.2.2.jar",
                "sha1": "d3ad4df38e400b8afba1de63f84338809399df5b",
                "size": 108907,
                "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl-glfw/3.2.2/lwjgl-glfw-3.2.2.jar"
            },
            "groupId": "org.lwjgl",
            "artifactId": "lwjgl-glfw",
            "version": "3.2.2",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "org/lwjgl/lwjgl-glfw/3.2.2/lwjgl-glfw-3.2.2.jar"
        },
        {
            "name": "org.lwjgl:lwjgl-stb:3.2.2",
            "download": {
                "path": "org/lwjgl/lwjgl-stb/3.2.2/lwjgl-stb-3.2.2.jar",
                "sha1": "3b8e6ebc5851dd3d17e37e5cadce2eff2a429f0f",
                "size": 104469,
                "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl-stb/3.2.2/lwjgl-stb-3.2.2.jar"
            },
            "groupId": "org.lwjgl",
            "artifactId": "lwjgl-stb",
            "version": "3.2.2",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "org/lwjgl/lwjgl-stb/3.2.2/lwjgl-stb-3.2.2.jar"
        },
        {
            "name": "com.mojang:text2speech:1.11.3",
            "download": {
                "path": "com/mojang/text2speech/1.11.3/text2speech-1.11.3.jar",
                "sha1": "f378f889797edd7df8d32272c06ca80a1b6b0f58",
                "size": 13164,
                "url": "https://libraries.minecraft.net/com/mojang/text2speech/1.11.3/text2speech-1.11.3.jar"
            },
            "groupId": "com.mojang",
            "artifactId": "text2speech",
            "version": "1.11.3",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "",
            "path": "com/mojang/text2speech/1.11.3/text2speech-1.11.3.jar"
        },
        {
            "name": "org.lwjgl:lwjgl:3.2.2:natives-windows",
            "download": {
                "path": "org/lwjgl/lwjgl/3.2.2/lwjgl-3.2.2-natives-windows.jar",
                "sha1": "05359f3aa50d36352815fc662ea73e1c00d22170",
                "size": 279593,
                "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl/3.2.2/lwjgl-3.2.2-natives-windows.jar"
            },
            "groupId": "org.lwjgl",
            "artifactId": "lwjgl",
            "version": "3.2.2",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "natives-windows",
            "path": "org/lwjgl/lwjgl/3.2.2/lwjgl-3.2.2-natives-windows.jar"
        },
        {
            "name": "org.lwjgl:lwjgl-jemalloc:3.2.2:natives-windows",
            "download": {
                "path": "org/lwjgl/lwjgl-jemalloc/3.2.2/lwjgl-jemalloc-3.2.2-natives-windows.jar",
                "sha1": "338b25b99da3ba5f441f6492f2ce2a9c608860ed",
                "size": 220623,
                "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl-jemalloc/3.2.2/lwjgl-jemalloc-3.2.2-natives-windows.jar"
            },
            "groupId": "org.lwjgl",
            "artifactId": "lwjgl-jemalloc",
            "version": "3.2.2",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "natives-windows",
            "path": "org/lwjgl/lwjgl-jemalloc/3.2.2/lwjgl-jemalloc-3.2.2-natives-windows.jar"
        },
        {
            "name": "org.lwjgl:lwjgl-openal:3.2.2:natives-windows",
            "download": {
                "path": "org/lwjgl/lwjgl-openal/3.2.2/lwjgl-openal-3.2.2-natives-windows.jar",
                "sha1": "ec20a7d42a2438528fca87e60b1705f1e2339ddb",
                "size": 1310102,
                "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl-openal/3.2.2/lwjgl-openal-3.2.2-natives-windows.jar"
            },
            "groupId": "org.lwjgl",
            "artifactId": "lwjgl-openal",
            "version": "3.2.2",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "natives-windows",
            "path": "org/lwjgl/lwjgl-openal/3.2.2/lwjgl-openal-3.2.2-natives-windows.jar"
        },
        {
            "name": "org.lwjgl:lwjgl-opengl:3.2.2:natives-windows",
            "download": {
                "path": "org/lwjgl/lwjgl-opengl/3.2.2/lwjgl-opengl-3.2.2-natives-windows.jar",
                "sha1": "d8dcdc91066cae2d2d8279cb4a9f9f05d9525826",
                "size": 170798,
                "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl-opengl/3.2.2/lwjgl-opengl-3.2.2-natives-windows.jar"
            },
            "groupId": "org.lwjgl",
            "artifactId": "lwjgl-opengl",
            "version": "3.2.2",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "natives-windows",
            "path": "org/lwjgl/lwjgl-opengl/3.2.2/lwjgl-opengl-3.2.2-natives-windows.jar"
        },
        {
            "name": "org.lwjgl:lwjgl-glfw:3.2.2:natives-windows",
            "download": {
                "path": "org/lwjgl/lwjgl-glfw/3.2.2/lwjgl-glfw-3.2.2-natives-windows.jar",
                "sha1": "dc6826d636bf796b33a49038c354210e661bfc17",
                "size": 266648,
                "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl-glfw/3.2.2/lwjgl-glfw-3.2.2-natives-windows.jar"
            },
            "groupId": "org.lwjgl",
            "artifactId": "lwjgl-glfw",
            "version": "3.2.2",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "natives-windows",
            "path": "org/lwjgl/lwjgl-glfw/3.2.2/lwjgl-glfw-3.2.2-natives-windows.jar"
        },
        {
            "name": "org.lwjgl:lwjgl-stb:3.2.2:natives-windows",
            "download": {
                "path": "org/lwjgl/lwjgl-stb/3.2.2/lwjgl-stb-3.2.2-natives-windows.jar",
                "sha1": "811f705cbb29e8ae8d60bdf8fdd38c0c123ad3ef",
                "size": 465810,
                "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl-stb/3.2.2/lwjgl-stb-3.2.2-natives-windows.jar"
            },
            "groupId": "org.lwjgl",
            "artifactId": "lwjgl-stb",
            "version": "3.2.2",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "natives-windows",
            "path": "org/lwjgl/lwjgl-stb/3.2.2/lwjgl-stb-3.2.2-natives-windows.jar"
        },
        {
            "name": "com.mojang:text2speech:1.11.3:natives-windows",
            "download": {
                "path": "com/mojang/text2speech/1.11.3/text2speech-1.11.3-natives-windows.jar",
                "sha1": "c0b242c0091be5acbf303263c7eeeaedd70544c7",
                "size": 81379,
                "url": "https://libraries.minecraft.net/com/mojang/text2speech/1.11.3/text2speech-1.11.3-natives-windows.jar"
            },
            "groupId": "com.mojang",
            "artifactId": "text2speech",
            "version": "1.11.3",
            "isSnapshot": false,
            "type": "jar",
            "classifier": "natives-windows",
            "path": "com/mojang/text2speech/1.11.3/text2speech-1.11.3-natives-windows.jar",
            "extractExclude": ["META-INF/"]
        }
    ],
    "mainClass": "net.minecraft.client.main.Main",
    "minimumLauncherVersion": 21,
    "releaseTime": "2019-07-19T09:25:47+00:00",
    "time": "2019-07-19T09:25:47+00:00",
    "type": "release",
    "logging": {
        "client": {
            "argument": "-Dlog4j.configurationFile=${path}",
            "file": {
                "id": "client-1.12.xml",
                "sha1": "ef4f57b922df243d0cef096efe808c72db042149",
                "size": 877,
                "url": "https://launcher.mojang.com/v1/objects/ef4f57b922df243d0cef096efe808c72db042149/client-1.12.xml"
            },
            "type": "log4j2-xml"
        }
    },
    "pathChain": ["temp\\versions\\1.14.4"],
    "minecraftDirectory": "temp"
} as const;
