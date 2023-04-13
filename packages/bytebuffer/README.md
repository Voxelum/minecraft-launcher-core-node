# ByteBuffer Module

[![npm version](https://img.shields.io/npm/v/@xmcl/bytebuffer.svg)](https://www.npmjs.com/package/@xmcl/bytebuffer)
[![Downloads](https://img.shields.io/npm/dm/@xmcl/bytebuffer.svg)](https://npmjs.com/@xmcl/bytebuffer)
[![Install size](https://packagephobia.now.sh/badge?p=@xmcl/bytebuffer)](https://packagephobia.now.sh/result?p=@xmcl/bytebuffer)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Build/badge.svg)](https://github.com/Voxelum/minecraft-launcher-core-node/actions?query=workflow%3ABuild)

Provide some functions to query Minecraft server status.

## Usage

### Read Binary from Bytebuffer  

Read sever info (server ip, port) and fetch its status (ping, server motd):

```ts
    import { ByteBuffer } from '@xmcl/bytebuffer'
    const serverInfo = {
        host: 'your host',
        port: 25565, // be default
    };
    const options: QueryOptions = {
        /**
         * see http://wiki.vg/Protocol_version_numbers
         */
        protocol: 203,
    };
    const rawStatusJson: Status = await fetchStatus(info, options);
```
