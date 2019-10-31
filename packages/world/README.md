# World Module

[![npm version](https://img.shields.io/npm/v/@xmcl/world.svg)](https://www.npmjs.com/package/world)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

This is a sub-module belong to [minecraft-launcher-core](https://www.npmjs.com/package/@xmcl/minecraft-launcher-core) module. You can still use this individually.

## Usage

### Save/World Data Loading

Read the level info from a buffer.

```ts
    import { World, LevelDataFrame } from '@xmcl/world'
    const levelDatBuffer: Buffer;
    const info: LevelDataFrame = await World.parseLevelData(levelDatBuffer);
```
Read the level data & player data by save folder location string.

```ts
    import { World } from "@xmcl/world";
    const worldSaveFolder: string;
    const { level, players } = await World.load(worldSaveFolder, ["level", "player"]);
```

