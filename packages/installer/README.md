# Installer Module

[![npm version](https://img.shields.io/npm/v/@xmcl/installer.svg)](https://www.npmjs.com/package/@xmcl/installer)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

This is a sub-module belong to [minecraft-launcher-core](https://www.npmjs.com/package/@xmcl/minecraft-launcher-core) module. You can still use this individually.

## Usage

### Minecraft Install

Fully install vanilla minecraft client including assets and libs.

```ts
    import { Installer } from "@xmcl/installer";
    import { MinecraftLocation } from "@xmcl/util";
    import { ResolvedVersion } from "@xmcl/core";

    const minecraft: MinecraftLocation;
    const list: Installer.VersionMetaList = await Installer.updateVersionMeta();
    const aVersion: Installer.VersionMeta = list[0]; // i just pick the first version in list here
    await Installer.install("client", aVersion, minecraft);
```

Just install libraries:

```ts
    import { Installer } from "@xmcl/installer";
    import { MinecraftLocation } from "@xmcl/util";
    import { ResolvedVersion, Version } from "@xmcl/core";

    const minecraft: MinecraftLocation;
    const version: string; // version string like 1.13
    const resolvedVersion: ResolvedVersion = await Version.parse(version);
    await Installer.installLibraries(resolvedVersion);
```

Just install assets:

```ts
    import { Installer } from "@xmcl/installer";
    import { MinecraftLocation } from "@xmcl/util";
    import { ResolvedVersion, Version } from "@xmcl/core";

    const minecraft: MinecraftLocation;
    const version: string; // version string like 1.13
    const resolvedVersion: ResolvedVersion = await Version.parse(version);
    await Installer.installAssets(resolvedVersion);
```

Just ensure all assets and libraries are installed:

```ts
    import { Installer } from "@xmcl/installer";
    import { MinecraftLocation } from "@xmcl/util";
    import { ResolvedVersion, Version } from "@xmcl/core";

    const minecraft: MinecraftLocation;
    const version: string; // version string like 1.13
    const resolvedVersion: ResolvedVersion = await Version.parse(version);
    await Installer.installDependencies(resolvedVersion);
```

Get the report of the version. It can check if version missing assets/libraries.

```ts
    import { Installer, VersionDiagnosis } from "@xmcl/core";
    const minecraftLocation: string;
    const minecraftVersionId: string;

    const report: VersionDiagnosis = await Installer.diagnose(minecraftLocation, minecraftVersionId);
```

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
