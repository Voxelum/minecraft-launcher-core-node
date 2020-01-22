# Server Info Module

[![npm version](https://img.shields.io/npm/v/@xmcl/nbt.svg)](https://www.npmjs.com/package/@xmcl/nbt)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

Provide function to parse server info (servers.dat)

## Usage

### Read and Write Server Info

```ts
import { readInfo, writeInfo, ServerInfo } from "@xmcl/server-info";

const seversDatBuffer: Buffer; // this is the servers.dat under .minecraft folder
const infos: ServerInfo[] = await readInfo(seversDatBuffer);
const info: ServerInfo = infos[0];

// info.ip -> server ip
// info.name -> server name
```
