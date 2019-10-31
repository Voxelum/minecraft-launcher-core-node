# Liteloader Module

[![npm version](https://img.shields.io/npm/v/@xmcl/liteloader.svg)](https://www.npmjs.com/package/liteloader)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

This is a sub-module belong to [minecraft-launcher-core](https://www.npmjs.com/package/@xmcl/minecraft-launcher-core) module. You can still use this individually.

## Usage

### Install Liteloader

Fetch liteloader version and install:

```ts
    import { LiteLoader } from "@xmcl/liteloader";

    const root: string; // minecraft root
    const list = await LiteLoader.VersionMetaList.update();
    const meta = list.versions['some-version'].release!;
    await LiteLoader.installAndCheck(meta, new MinecraftFolder(root));
```

Read .litemod metadata:

```ts
    import { LiteLoader } from "@xmcl/liteloader";
    const metadata: LiteLoader.MetaData = await LiteLoader.meta(`${mock}/mods/sample-mod.litemod`);
```