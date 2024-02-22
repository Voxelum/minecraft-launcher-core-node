# Interface Mod

## 🏷️ Properties

### allowModDistribution

```ts
allowModDistribution: null | boolean
```
Is mod allowed to be distributed
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L131" target="_blank" rel="noreferrer">packages/curseforge/index.ts:131</a>
</p>


### authors

```ts
authors: Author[]
```
The list of authors
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L106" target="_blank" rel="noreferrer">packages/curseforge/index.ts:106</a>
</p>


### categories

```ts
categories: ModCategory[]
```
List of categories that this mod is related to
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L98" target="_blank" rel="noreferrer">packages/curseforge/index.ts:98</a>
</p>


### classId

```ts
classId: null | number
```
The class id this mod belongs to
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L102" target="_blank" rel="noreferrer">packages/curseforge/index.ts:102</a>
</p>


### dateCreated

```ts
dateCreated: string
```
The creation date of the mod
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L123" target="_blank" rel="noreferrer">packages/curseforge/index.ts:123</a>
</p>


### dateModified

```ts
dateModified: string
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L125" target="_blank" rel="noreferrer">packages/curseforge/index.ts:125</a>
</p>


### dateReleased

```ts
dateReleased: string
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L126" target="_blank" rel="noreferrer">packages/curseforge/index.ts:126</a>
</p>


### defaultFileId

```ts
defaultFileId: number
```
The default download file id
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L144" target="_blank" rel="noreferrer">packages/curseforge/index.ts:144</a>
</p>


### downloadCount

```ts
downloadCount: number
```
Number of downloads for the mod
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L86" target="_blank" rel="noreferrer">packages/curseforge/index.ts:86</a>
</p>


### gameId

```ts
gameId: number
```
Game id. Minecraft is 432.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L59" target="_blank" rel="noreferrer">packages/curseforge/index.ts:59</a>
</p>


### gamePopularityRank

```ts
gamePopularityRank: number
```
The mod popularity rank for the game
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L135" target="_blank" rel="noreferrer">packages/curseforge/index.ts:135</a>
</p>


### id

```ts
id: number
```
The addon id. You can use this in many functions required the ``addonID``
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L55" target="_blank" rel="noreferrer">packages/curseforge/index.ts:55</a>
</p>


### isAvailable

```ts
isAvailable: boolean
```
Is the mod available for search. This can be false when a mod is experimental, in a deleted state or has only alpha files
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L139" target="_blank" rel="noreferrer">packages/curseforge/index.ts:139</a>
</p>


### isFeatured

```ts
isFeatured: boolean
```
Whether the mod is included in the featured mods list
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L90" target="_blank" rel="noreferrer">packages/curseforge/index.ts:90</a>
</p>


### latestFiles

```ts
latestFiles: File[]
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L115" target="_blank" rel="noreferrer">packages/curseforge/index.ts:115</a>
</p>


### latestFilesIndexes

```ts
latestFilesIndexes: FileIndex[]
```
List of file related details for the latest files of the mod
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L119" target="_blank" rel="noreferrer">packages/curseforge/index.ts:119</a>
</p>


### links

```ts
links: Object
```
Relevant links for the mod such as Issue tracker and Wiki
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L69" target="_blank" rel="noreferrer">packages/curseforge/index.ts:69</a>
</p>


### logo

```ts
logo: ModAsset
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L108" target="_blank" rel="noreferrer">packages/curseforge/index.ts:108</a>
</p>


### mainFileId

```ts
mainFileId: number
```
The id of the main file of the mod
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L114" target="_blank" rel="noreferrer">packages/curseforge/index.ts:114</a>
</p>


### name

```ts
name: string
```
The display name of the addon
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L63" target="_blank" rel="noreferrer">packages/curseforge/index.ts:63</a>
</p>


### primaryCategoryId

```ts
primaryCategoryId: number
```
The main category of the mod as it was chosen by the mod author
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L94" target="_blank" rel="noreferrer">packages/curseforge/index.ts:94</a>
</p>


### screenshots

```ts
screenshots: ModAsset[]
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L110" target="_blank" rel="noreferrer">packages/curseforge/index.ts:110</a>
</p>


### slug

```ts
slug: string
```
The mod slug that would appear in the URL
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L67" target="_blank" rel="noreferrer">packages/curseforge/index.ts:67</a>
</p>


### status

```ts
status: ModStatus
```
Current mod status
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L82" target="_blank" rel="noreferrer">packages/curseforge/index.ts:82</a>
</p>


### summary

```ts
summary: string
```
One line summery
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L78" target="_blank" rel="noreferrer">packages/curseforge/index.ts:78</a>
</p>


### thumbsUpCount

```ts
thumbsUpCount: number
```
The mod's thumbs up count
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L148" target="_blank" rel="noreferrer">packages/curseforge/index.ts:148</a>
</p>


