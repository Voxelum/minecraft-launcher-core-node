# Fabric Module

[![npm version](https://img.shields.io/npm/v/@xmcl/fabric.svg)](https://www.npmjs.com/package/@xmcl/fabric)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

This is a sub-module belong to [minecraft-launcher-core](https://www.npmjs.com/package/@xmcl/minecraft-launcher-core) module. You can still use this individually.

## Usage

### Fetch & Install Fabric

Fetch the new fabric version list.

```ts
    import { Fabric } from "@xmcl/fabric";
    const versionList: Fabric.VersionList = await Fabric.updateVersionList();
    const latestYarnVersion = versionList.yarnVersions[0]; // yarn version is combined by mcversion+yarn build number
    const latestLoaderVersion = versionList.loaderVersions[0];
```

Install fabric to the client. This installation process doesn't ensure the minecraft libraries.

```ts
    import { Fabric } from "@xmcl/fabric";
    const minecraftLocation: MinecraftLocation;
    const yarnVersion: string; // e.g. "1.14.1+build.10"
    const loaderVersion: string; // e.g. "0.4.7+build.147"
    const installPromise: Promise<void> = Fabric.install(yarnVersion, loaderVersion, minecraftLocation)
```

Please run `Installer.installDependencies` after that to install fully.

### Parse Fabric Mod Metadata

```ts
    import { Fabric } from "@xmcl/fabric";
    const modJarBinary = fs.readFileSync("your-fabric.jar");
    const metadata: Fabric.ModMetadata = await Fabric.readModMetaData(modJarBinary);

    // or directly read from path
    const sameMetadata: Fabric.ModMetadata = await Fabric.readModMetaData("your-fabric.jar");
```