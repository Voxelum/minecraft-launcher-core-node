# Namespace RegionReader

## 🏭 Functions

### getSection

```ts
getSection(region: RegionDataFrame, chunkY: number): RegionSectionDataFrame
```
Get a chunk section in a region by chunk Y value.
#### Parameters

- **region**: `RegionDataFrame`
The region
- **chunkY**: `number`
The y value of the chunk. It should be from [0, 16)
#### Return Type

- `RegionSectionDataFrame`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/game-data/level.ts#L231" target="_blank" rel="noreferrer">packages/game-data/level.ts:231</a>
</p>


### getSectionBlockIdArray

```ts
getSectionBlockIdArray(section: NewRegionSectionDataFrame): number[]
```
Create an array of block ids from the chunk section given
#### Parameters

- **section**: `NewRegionSectionDataFrame`
The chunk section
#### Return Type

- `number[]`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/game-data/level.ts#L272" target="_blank" rel="noreferrer">packages/game-data/level.ts:272</a>
</p>


### getSectionInformation

```ts
getSectionInformation(section: NewRegionSectionDataFrame): { bitLength: number; blockStates: bigint[]; palette: BlockStateData[] }
```
Returns the palette, blockStates and bitLength for a section
#### Parameters

- **section**: `NewRegionSectionDataFrame`
The chunk section
#### Return Type

- `{ bitLength: number; blockStates: bigint[]; palette: BlockStateData[] }`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/game-data/level.ts#L240" target="_blank" rel="noreferrer">packages/game-data/level.ts:240</a>
</p>


### seekBlockState

```ts
seekBlockState(section: NewRegionSectionDataFrame, index: number): BlockStateData
```
Seek the block state data from new region format.
#### Parameters

- **section**: `NewRegionSectionDataFrame`
The new region section
- **index**: `number`
The chunk index, which is a number in range [0, 4096)
#### Return Type

- `BlockStateData`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/game-data/level.ts#L334" target="_blank" rel="noreferrer">packages/game-data/level.ts:334</a>
</p>


### seekBlockStateId

```ts
seekBlockStateId(section: LegacyRegionSectionDataFrame | NewRegionSectionDataFrame, index: number): number
```
Seek the section and get the block state id from the section.
#### Parameters

- **section**: `LegacyRegionSectionDataFrame | NewRegionSectionDataFrame`
The section
- **index**: `number`
The chunk index
#### Return Type

- `number`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/game-data/level.ts#L313" target="_blank" rel="noreferrer">packages/game-data/level.ts:313</a>
</p>


### walkBlockStateId

```ts
walkBlockStateId(section: RegionSectionDataFrame, reader: (x: number, y: number, z: number, id: number) => void): void
```
Walk through all the position in this chunk and emit all the id in every position.
#### Parameters

- **section**: `RegionSectionDataFrame`
The chunk section
- **reader**: `(x: number, y: number, z: number, id: number) => void`
The callback which will receive the position + state id.
#### Return Type

- `void`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/game-data/level.ts#L288" target="_blank" rel="noreferrer">packages/game-data/level.ts:288</a>
</p>


