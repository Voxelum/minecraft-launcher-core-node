# Nbt Module

[![npm version](https://img.shields.io/npm/v/@xmcl/nbt.svg)](https://www.npmjs.com/package/nbt)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://travis-ci.org/voxelum/minecraft-launcher-core-node.svg)](https://travis-ci.org/voxelum/minecraft-launcher-core-node)

This is a sub-module belong to [minecraft-launcher-core](https://www.npmjs.com/package/@xmcl/minecraft-launcher-core) module. You can still use this individually.

### NBT

```ts
    import { NBT } from "@xmcl/nbt";
    const fileData: Buffer;
    const compressed: boolean;
    const readed: NBT.Persistence.TypedObject = NBT.Persistence.deserialize(fileData, compressed);

    const serial = NBT.Persistence.createSerializer()
        .register("server", {
            name: NBT.TagType.String,
            host: NBT.TagType.String,
            port: NBT.TagType.Int,
            icon: NBT.TagType.String,
        });
    const serverInfo;
    const serialized: Buffer = serial.serialize(serverInfo, "server");
```
