# Interface SearchOptions

The search options of the search API.
## 🏷️ Properties

### categoryId <Badge type="info" text="optional" />

```ts
categoryId: number
```
This is actually the sub category id of the ``sectionId``. All the numbers for this should also be fetch by ``getCategories``.

To get available values, you can:

````ts
const cat = await getCategories();
const sectionId = 6; // the mods
const categoryIds = cat
 .filter(c => c.gameId === 432) // 432 is minecraft game id
 .filter(c => c.rootGameCategoryId === sectionId) // only under the section id
 .map(c => c.id);
// Use categoryIds' id to search under the corresponding section id.
````
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L399" target="_blank" rel="noreferrer">packages/curseforge/index.ts:399</a>
</p>


### classId <Badge type="info" text="optional" />

```ts
classId: number
```
The category section id, which is also a category id.
You can fetch if from ``getCategories``.

To get available categories, you can:

````ts
const cat = await getCategories();
const sectionIds = cat
 .filter(c => c.gameId === 432) // 432 is minecraft game id
 .filter(c => c.rootGameCategoryId === null).map(c => c.id);
// the sectionIds is all normal sections here
````
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L381" target="_blank" rel="noreferrer">packages/curseforge/index.ts:381</a>
</p>


### gameId <Badge type="info" text="optional" />

```ts
gameId: number
```
The game id. The Minecraft is 432.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L405" target="_blank" rel="noreferrer">packages/curseforge/index.ts:405</a>
</p>


### gameVersion <Badge type="info" text="optional" />

```ts
gameVersion: string
```
The game version. For Minecraft, it should looks like 1.12.2.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L409" target="_blank" rel="noreferrer">packages/curseforge/index.ts:409</a>
</p>


### gameVersionTypeId <Badge type="info" text="optional" />

```ts
gameVersionTypeId: number
```
Filter only mods that contain files tagged with versions of the given gameVersionTypeId
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L435" target="_blank" rel="noreferrer">packages/curseforge/index.ts:435</a>
</p>


### index <Badge type="info" text="optional" />

```ts
index: number
```
The index of the addon, NOT the page!

When your page size is 25, if you want to get next page contents, you should have index = 25 to get 2nd page content.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L417" target="_blank" rel="noreferrer">packages/curseforge/index.ts:417</a>
</p>


### modLoaderType <Badge type="info" text="optional" />

```ts
modLoaderType: FileModLoaderType
```
Filter only mods associated to a given modloader (Forge, Fabric ...). Must be coupled with gameVersion.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L429" target="_blank" rel="noreferrer">packages/curseforge/index.ts:429</a>
</p>


### modLoaderTypes <Badge type="info" text="optional" />

```ts
modLoaderTypes: string[]
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L431" target="_blank" rel="noreferrer">packages/curseforge/index.ts:431</a>
</p>


### pageSize <Badge type="info" text="optional" />

```ts
pageSize: number
```
The page size, or the number of the addons in a page.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L445" target="_blank" rel="noreferrer">packages/curseforge/index.ts:445</a>
</p>


### searchFilter <Badge type="info" text="optional" />

```ts
searchFilter: string
```
The keyword of search. If this is absent, it just list out the available addons by ``sectionId`` and ``categoryId``.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L449" target="_blank" rel="noreferrer">packages/curseforge/index.ts:449</a>
</p>


### slug <Badge type="info" text="optional" />

```ts
slug: string
```
Filter by slug (coupled with classId will result in a unique result).
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L439" target="_blank" rel="noreferrer">packages/curseforge/index.ts:439</a>
</p>


### sortField <Badge type="info" text="optional" />

```ts
sortField: ModsSearchSortField
```
Filter by ModsSearchSortField enumeration
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L421" target="_blank" rel="noreferrer">packages/curseforge/index.ts:421</a>
</p>


### sortOrder <Badge type="info" text="optional" />

```ts
sortOrder: "desc" | "asc"
```
'asc' if sort is in ascending order, 'desc' if sort is in descending order
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L425" target="_blank" rel="noreferrer">packages/curseforge/index.ts:425</a>
</p>


