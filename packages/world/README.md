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
