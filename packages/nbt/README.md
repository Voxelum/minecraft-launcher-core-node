# Nbt Module

[![npm version](https://img.shields.io/npm/v/@xmcl/nbt.svg)](https://www.npmjs.com/package/@xmcl/nbt)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

This is a sub-module belong to [minecraft-launcher-core](https://www.npmjs.com/package/@xmcl/minecraft-launcher-core) module. You can still use this individually.

## Usage

### Read and Write NBT

You can simply deserialize/serialize nbt.

```ts
    import { NBT } from "@xmcl/nbt";
    const fileData: Buffer;
    // compressed = undefined will not perform compress algorithm
    // compressed = true will use gzip algorithm
    const compressed: true | "gzip" | "deflate" | undefined;
    const readed: NBT.TypedObject = await NBT.deserialize(fileData, { compressed });
    // NBT.Persistence.TypedObject is just a object with __nbtPrototype__ defining its nbt type
    // After you do the modification on it, you can serialize it back to NBT
    const buf: Buffer = await NBT.serialize(readed, { compressed });

    // or use serializer style
    const serial = NBT.createSerializer()
        .register("server", {
            name: NBT.TagType.String,
            host: NBT.TagType.String,
            port: NBT.TagType.Int,
            icon: NBT.TagType.String,
        });
    const serverInfo: any; // this doesn't require the js object to be a TypedObject
    const serialized: Buffer = await serial.serialize(serverInfo, "server");
```
