# Interface File

## 🏷️ Properties

### alternateFileId

```ts
alternateFileId: number
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L272" target="_blank" rel="noreferrer">packages/curseforge/index.ts:272</a>
</p>


### dependencies

```ts
dependencies: FileDependency[]
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L273" target="_blank" rel="noreferrer">packages/curseforge/index.ts:273</a>
</p>


### displayName

```ts
displayName: string
```
Display name
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L229" target="_blank" rel="noreferrer">packages/curseforge/index.ts:229</a>
</p>


### downloadCount

```ts
downloadCount: number
```
Number of downloads for the mod
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L258" target="_blank" rel="noreferrer">packages/curseforge/index.ts:258</a>
</p>


### downloadUrl <Badge type="info" text="optional" />

```ts
downloadUrl: string
```
Url to download
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L263" target="_blank" rel="noreferrer">packages/curseforge/index.ts:263</a>
</p>


### fileDate

```ts
fileDate: string
```
The date of this file uploaded
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L249" target="_blank" rel="noreferrer">packages/curseforge/index.ts:249</a>
</p>


### fileLength

```ts
fileLength: number
```
# bytes of this file.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L253" target="_blank" rel="noreferrer">packages/curseforge/index.ts:253</a>
</p>


### fileName

```ts
fileName: string
```
File name. Might be the same with ``displayName``
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L233" target="_blank" rel="noreferrer">packages/curseforge/index.ts:233</a>
</p>


### fileStatus

```ts
fileStatus: FileStatus
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L242" target="_blank" rel="noreferrer">packages/curseforge/index.ts:242</a>
</p>


### gameId

```ts
gameId: number
```
The game id related to the mod that this file belongs to
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L217" target="_blank" rel="noreferrer">packages/curseforge/index.ts:217</a>
</p>


### gameVersions

```ts
gameVersions: string[]
```
Game version string array, like ``["1.12.2"]``
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L267" target="_blank" rel="noreferrer">packages/curseforge/index.ts:267</a>
</p>


### hashes

```ts
hashes: FileHash[]
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L244" target="_blank" rel="noreferrer">packages/curseforge/index.ts:244</a>
</p>


### id

```ts
id: number
```
The fileID
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L213" target="_blank" rel="noreferrer">packages/curseforge/index.ts:213</a>
</p>


### isAlternate

```ts
isAlternate: boolean
```
Metadata used for sorting by game versions
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L271" target="_blank" rel="noreferrer">packages/curseforge/index.ts:271</a>
</p>


### isAvailable

```ts
isAvailable: boolean
```
Whether the file is available to download
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L225" target="_blank" rel="noreferrer">packages/curseforge/index.ts:225</a>
</p>


### modId

```ts
modId: number
```
The projectId (addonId)
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L221" target="_blank" rel="noreferrer">packages/curseforge/index.ts:221</a>
</p>


### modules

```ts
modules: Module[]
```
What files inside?
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L277" target="_blank" rel="noreferrer">packages/curseforge/index.ts:277</a>
</p>


### releaseType

```ts
releaseType: number
```
Release or type.
- ``1`` is the release
- ``2`` beta
- ``3`` alpha
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L240" target="_blank" rel="noreferrer">packages/curseforge/index.ts:240</a>
</p>


### sortableGameVersions <Badge type="info" text="optional" />

```ts
sortableGameVersions: SortableGameVersion[]
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L278" target="_blank" rel="noreferrer">packages/curseforge/index.ts:278</a>
</p>


