# Installer Module

[![npm version](https://img.shields.io/npm/v/@xmcl/java-installer.svg)](https://www.npmjs.com/package/@xmcl/java-installer)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

Provide functions to install jaav from Minecraft source.

## Usage

### Install Java 8 From Mojang Source

Scan java installation path from the disk. (Require a lzma unpacker, like [7zip-bin](https://www.npmjs.com/package/7zip-bin) or [lzma-native](https://www.npmjs.com/package/lzma-native))

```ts
    import { JavaInstaller } from "@xmcl/java-installer";

    // this require a unpackLZMA util to work
    // you can use `7zip-bin`
    // or `lzma-native` for this
    const unpackLZMA: (src: string, dest: string) => Promise<void>;

    await JavaInstaller.installJreFromMojang({
        destination: "your/java/home",
        unpackLZMA,
    });
```

### Scan Local Java

This will scan the paths in arguments and some common places to install java in current os.

So passing an empty array is OK.

```ts
    import { JavaInstaller, JavaInfo } from "@xmcl/java-installer";

    const validJavaList: JavaInfo[] = await JavaInstaller.scanLocalJava([
        "my/java/home"
    ]);

    // it can parse java major version, like `8` or `10`
    const javaMajorVersion: number = validJavaList[0].majorVersion;

    // also the java version
    const javaVersion: string = validJavaList[0].version;

    // also contain the path
    const jPath: string = validJavaList[0].path;
```




