# Class WorldReader

## 🏭 Constructors

### constructor

```ts
WorldReader(fs: FileSystem): WorldReader
```
#### Parameters

- **fs**: `FileSystem`
#### Return Type

- `WorldReader`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/game-data/level.ts#L126" target="_blank" rel="noreferrer">packages/game-data/level.ts:126</a>
</p>


## 🔧 Methods

### getAdvancementsData <Badge type="tip" text="public" />

```ts
getAdvancementsData(): Promise<AdvancementDataFrame[]>
```
#### Return Type

- `Promise<AdvancementDataFrame[]>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/game-data/level.ts#L187" target="_blank" rel="noreferrer">packages/game-data/level.ts:187</a>
</p>


### getEntityData <Badge type="tip" text="public" />

```ts
getEntityData(chunkX: number, chunkZ: number): Promise<RegionDataFrame>
```
Get entity data frame
#### Parameters

- **chunkX**: `number`
The x value of chunk coord
- **chunkZ**: `number`
The z value of chunk coord
#### Return Type

- `Promise<RegionDataFrame>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/game-data/level.ts#L142" target="_blank" rel="noreferrer">packages/game-data/level.ts:142</a>
</p>


### getLevelData <Badge type="tip" text="public" />

```ts
getLevelData(): Promise<LevelDataFrame>
```
Read the level data
#### Return Type

- `Promise<LevelDataFrame>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/game-data/level.ts#L175" target="_blank" rel="noreferrer">packages/game-data/level.ts:175</a>
</p>


### getMCAData <Badge type="tip" text="public" />

```ts
getMCAData(prefix: string, chunkX: number, chunkZ: number): Promise<RegionDataFrame>
```
Get mca data frame
#### Parameters

- **prefix**: `string`
The folder to load the .mca file from
- **chunkX**: `number`
The x value of chunk coord
- **chunkZ**: `number`
The z value of chunk coord
#### Return Type

- `Promise<RegionDataFrame>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/game-data/level.ts#L154" target="_blank" rel="noreferrer">packages/game-data/level.ts:154</a>
</p>


### getPlayerData <Badge type="tip" text="public" />

```ts
getPlayerData(): Promise<PlayerDataFrame[]>
```
#### Return Type

- `Promise<PlayerDataFrame[]>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/game-data/level.ts#L181" target="_blank" rel="noreferrer">packages/game-data/level.ts:181</a>
</p>


### getRegionData <Badge type="tip" text="public" />

```ts
getRegionData(chunkX: number, chunkZ: number): Promise<RegionDataFrame>
```
Get region data frame
#### Parameters

- **chunkX**: `number`
The x value of chunk coord
- **chunkZ**: `number`
The z value of chunk coord
#### Return Type

- `Promise<RegionDataFrame>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/game-data/level.ts#L132" target="_blank" rel="noreferrer">packages/game-data/level.ts:132</a>
</p>


### create <Badge type="warning" text="static" />

```ts
create(path: string | Uint8Array): Promise<WorldReader>
```
#### Parameters

- **path**: `string | Uint8Array`
#### Return Type

- `Promise<WorldReader>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/game-data/level.ts#L122" target="_blank" rel="noreferrer">packages/game-data/level.ts:122</a>
</p>


