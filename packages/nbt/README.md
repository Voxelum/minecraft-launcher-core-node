# Nbt Module

[![npm version](https://img.shields.io/npm/v/@xmcl/nbt.svg)](https://www.npmjs.com/package/@xmcl/nbt)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

This is a sub-module belong to [minecraft-launcher-core](https://www.npmjs.com/package/@xmcl/minecraft-launcher-core) module. You can still use this individually.

## Usage

### Read and Write NBT

You can simply deserialize/serialize nbt.

```ts
    import { serialize, deserialize } from "@xmcl/nbt";
    const fileData: Buffer;
    // compressed = undefined will not perform compress algorithm
    // compressed = true will use gzip algorithm
    const compressed: true | "gzip" | "deflate" | undefined;
    const readed: any = await deserialize(fileData, { compressed });
    // The deserialize return object contain __nbtPrototype__ property which define its nbt type
    // After you do the modification on it, you can serialize it back to NBT
    const buf: Buffer = await serialize(readed, { compressed });
```

You can use it with the type cast. Suppose you are reading the [servers.dat](https://minecraft.gamepedia.com/Servers.dat_format). You can have:

```ts
    interface ServerInfo { icon: string; ip: string; name: string; acceptTextures: number }
    interface ServerNBTFormat {
        servers: Array<ServerInfo>;
    }
    // this function will auto fit the typescript type
    const readed: ServerNBTFormat = await deserialize(fileData);
    // or 
    const readed = await deserialize<ServerNBTFormat>(fileData);
    // notice that this type cast can be unsafe, make sure you know the nbt structure!!!
    
    // the first server in servers.dat
    const oneServer: ServerInfo = readed.servers[0];
```

You can use class with annotation (decorator) to serialize/deserialize the type consistently

```ts
import { serialize, deserialize, TagType } from "@xmcl/nbt";

class ServerInfo {
    @TagType(TagType.String)
    icon: string;
    @TagType(TagType.String)
    host: string;
    @TagType(TagType.String)
    name: string;
    @TagType(TagType.Int)
    icon: number
}

const serial = new Serializer()
    .register("server", {
        name: NBT.TagType.String,
        host: NBT.TagType.String,
        port: NBT.TagType.Int,
        icon: NBT.TagType.String,
    });
const serverInfo: any; // this doesn't require the js object to be a TypedObject
const serialized: Buffer = await serial.serialize(serverInfo, "server");

```
