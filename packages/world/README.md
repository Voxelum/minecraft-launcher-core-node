# World Module

[![npm version](https://img.shields.io/npm/v/@xmcl/world.svg)](https://www.npmjs.com/package/@xmcl/world)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

Provides functions to parse Minecraft saves.

## Usage

### Save/World Data Loading

Read the level info from a buffer.

```ts
    import { WorldReader, LevelDataFrame } from '@xmcl/world'
    const worldSaveFolder: string;
    const reader: WorldReader = await WorldReader.create(worldSaveFolder);
    const levelData: LevelDataFrame = await reader.getLevelData();
```

***Preview*** Read the region data, this feature is not tested yet, but the api will look like this

```ts
    import { WorldReader, RegionDataFrame, RegionReader } from "@xmcl/world";
    const worldSaveFolder: string;
    const reader: WorldReader = await WorldReader.create(worldSaveFolder);
    const chunkX: number;
    const chunkZ: number;
    const region: RegionDataFrame = await reader.getRegionData(chunkX, chunkZ);
```
