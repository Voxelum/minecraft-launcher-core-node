# Client Module

[![npm version](https://img.shields.io/npm/v/@xmcl/client.svg)](https://www.npmjs.com/package/@xmcl/client)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

Provide some functions to query Minecraft server status.

## Usage

### Ping Minecraft Server  

Read sever info (server ip, port) and fetch its status (ping, server motd):

```ts
    import { fetchStatus, Status } from '@xmcl/client'
    // or you want the raw json
    const rawStatusJson: Status = await fetchStatus(info);
```
