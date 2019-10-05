# Installer Module

[![npm version](https://img.shields.io/npm/v/@xmcl/installer.svg)](https://www.npmjs.com/package/installer)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

This is a sub-module belong to [minecraft-launcher-core](https://www.npmjs.com/package/@xmcl/minecraft-launcher-core) module. You can still use this individually.

### Minecraft Install

```ts
    import { Installer } from "@xmcl/installer";
    import { MinecraftLocation } from "@xmcl/util";
    import { ResolvedVersion } from "@xmcl/version";

    const minecraft: MinecraftLocation;
    const versionPromise: Promise<ResolvedVersion> = Installer.updateVersionMeta()
        .then((metas: Installer.VersionMetaList) => metas.versions[0]) // i just pick the first version in list here
        .then((meta: Installer.VersionMeta) => Installer.install("client", meta, minecraft));
```

Fully install vanilla minecraft client including assets and libs.
