# Resourcepack Module

[![npm version](https://img.shields.io/npm/v/@xmcl/resourcepack.svg)](https://www.npmjs.com/package/@xmcl/resourcepack)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

This is a sub-module belong to [minecraft-launcher-core](https://www.npmjs.com/package/@xmcl/minecraft-launcher-core) module. You can still use this individually.

## Usage

### Read ResourcePack Basic Info

Read ResourcePack from filePath

```ts
    import { ResourcePack } from "@xmcl/resourcepack"
    const fileFullPath = "path/to/pack/some-pack.zip";
    const pack: ResourcePack = await ResourcePack.read(fileFullPath);
    // or you want read from folder, same function call
    const dirFullPath = "path/to/pack/some-pack";
    const fromFolder: ResourcePack = await ResourcePack.read(dirFullPath);

    // if you have already read the file, don't want to reopen the file
    // the file path will be only used for resource pack name
    const fileContentBuffer: Buffer;
    const packPromise: ResourcePack = await ResourcePack.read(fileFullPath, fileContentBuffer);
```

