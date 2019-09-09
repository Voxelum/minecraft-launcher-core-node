# World Module

[![npm version](https://img.shields.io/npm/v/@xmcl/world.svg)](https://www.npmjs.com/package/world)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://travis-ci.org/voxelum/minecraft-launcher-core-node.svg)](https://travis-ci.org/voxelum/minecraft-launcher-core-node)

This is a sub-module belong to [minecraft-launcher-core](https://www.npmjs.com/package/@xmcl/minecraft-launcher-core) module. You can still use this individually.

### Save/World Data Loading

```ts
    import { World, LevelDataFrame } from '@xmcl/world'
    const levelDatBuffer: Buffer;
    const info: LevelDataFrame = await World.parseLevelData(levelDatBuffer);
```

Read the level info from a buffer.

```ts
    import { World } from "@xmcl/world";
    const worldSaveFolder: string;
    const { level, players } = await World.load(worldSaveFolder, ["level", "player"]);
```

Read the level data & player data by save folder location string.
