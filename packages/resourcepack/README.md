# Resourcepack Module

[![npm version](https://img.shields.io/npm/v/@xmcl/resourcepack.svg)](https://www.npmjs.com/package/@xmcl/resourcepack)
[![Downloads](https://img.shields.io/npm/dm/@xmcl/resourcepack.svg)](https://npmjs.com/@xmcl/resourcepack)
[![Install size](https://packagephobia.now.sh/badge?p=@xmcl/resourcepack)](https://packagephobia.now.sh/result?p=@xmcl/resourcepack)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Build/badge.svg)](https://github.com/Voxelum/minecraft-launcher-core-node/actions?query=workflow%3ABuild)

Provide function to read resource pack.

## Usage

### Parse ResourcePack Basic Info

Read pack metadata from file:

```ts
    import { ResourcePack, PackMeta } from "@xmcl/resourcepack"
    const fileFullPath = "path/to/pack/some-pack.zip";
    const pack: PackMeta.Pack = await ResourcePack.readPackMeta(fileFullPath);
    // or you want read from folder, same function call
    const dirFullPath = "path/to/pack/some-pack";
    const fromFolder: PackMeta.Pack = await ResourcePack.readPackMeta(dirFullPath);

    // if you have already read the file, don't want to reopen the file
    // the file path will be only used for resource pack name
    const fileContentBuffer: Buffer;
    const fromBuff: PackMeta.Pack = await ResourcePack.readPackMeta(fileFullPath, fileContentBuffer);
```

Read pack icon:

```ts
    import { ResourcePack, PackMeta } from "@xmcl/resourcepack"
    const fileFullPath = "path/to/pack/some-pack.zip";
    const pack: Uint8Array = await ResourcePack.readIcon(fileFullPath);
```

Put them together in efficent way (don't open resource pack again and again):

```ts
    import { ResourcePack, PackMeta } from "@xmcl/resourcepack"
    const fileFullPath = "path/to/pack/some-pack.zip";
    const res = await ResourcePack.open(fileFullPath);
    const pack: PackMeta.Pack = await ResourcePack.readPackMeta(res);
    const icon: Uint8Array = await ResourcePack.readIcon(res);

    // or

    const pack: PackMeta.Pack = await res.info();
    const icon: Uint8Array = await res.icon();
```

### Read ResourcePack Content

You can read resource pack content just like Minecraft:

```ts
    import { ResourcePack, ResourceLocation } from "@xmcl/resourcepack"
    const fileFullPath = "path/to/pack/some-pack.zip";
    const pack: ResourcePack = await ResourcePack.open(fileFullPath);

    // this is almost the same with original Minecraft
    // this get the dirt texture png -> minecraft:textures/block/dirt.png
    const resLocation: ResourceLocation = ResourceLocation.ofTexturePath("block/dirt");

    console.log(resLocation); // minecraft:textures/block/dirt.png

    const resource: Resource | void = pack.load(resLocation);
    if (resource) {
        const binaryContent: Uint8Array = resource.content;
        // this is the metadata for resource, like animated texture metadata.
        const metadata: PackMeta = resource.metadata;
    }
```
