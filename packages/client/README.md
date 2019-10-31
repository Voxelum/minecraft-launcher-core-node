# Client Module

[![npm version](https://img.shields.io/npm/v/@xmcl/client.svg)](https://www.npmjs.com/package/client)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

This is a sub-module belong to [minecraft-launcher-core](https://www.npmjs.com/package/@xmcl/minecraft-launcher-core) module. You can still use this individually.

## Usage

### Minecraft Client Ping Server

Read sever info (server ip, port) and fetch its status (ping, server motd):

```ts
    import { Server } from '@xmcl/client'
    const seversDatBuffer: Buffer; // this is the servers.dat under .minecraft folder
    const infos: Server.Info[] = await Server.readInfo(seversDatBuffer);
    const info: Server.Info = infos[0]
    // fetch the server status
    const promise: Promise<Server.Status> = Server.fetchStatus(info);
    // or you want the raw json
    const rawJsonPromise: Promise<Server.StatusFrame> = Server.fetchStatusFrame(info);
```
