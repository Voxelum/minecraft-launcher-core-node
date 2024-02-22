# Interface ProjectVersion

## 🏷️ Properties

### author_id

```ts
author_id: string
```
The ID of the author who published this version
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/modrinth/types.ts#L178" target="_blank" rel="noreferrer">packages/modrinth/types.ts:178</a>
</p>


### changelog <Badge type="info" text="optional" />

```ts
changelog: string
```
The changelog for this version of the mod.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/modrinth/types.ts#L194" target="_blank" rel="noreferrer">packages/modrinth/types.ts:194</a>
</p>


### changelog_url <Badge type="info" text="optional" />

```ts
changelog_url: string
```
DEPRECATED A link to the changelog for this version of the mod
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/modrinth/types.ts#L198" target="_blank" rel="noreferrer">packages/modrinth/types.ts:198</a>
</p>


### date_published

```ts
date_published: string
```
The date that this version was published
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/modrinth/types.ts#L202" target="_blank" rel="noreferrer">packages/modrinth/types.ts:202</a>
</p>


### dependencies

```ts
dependencies: Object[]
```
A list of specific versions of mods that this version depends on
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/modrinth/types.ts#L218" target="_blank" rel="noreferrer">packages/modrinth/types.ts:218</a>
</p>


### downloads

```ts
downloads: number
```
The number of downloads this specific version has
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/modrinth/types.ts#L206" target="_blank" rel="noreferrer">packages/modrinth/types.ts:206</a>
</p>


### featured

```ts
featured: boolean
```
Whether the version is featured or not
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/modrinth/types.ts#L182" target="_blank" rel="noreferrer">packages/modrinth/types.ts:182</a>
</p>


### files

```ts
files: ModVersionFile[]
```
A list of files available for download for this version
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/modrinth/types.ts#L214" target="_blank" rel="noreferrer">packages/modrinth/types.ts:214</a>
</p>


### game_versions

```ts
game_versions: string[]
```
A list of versions of Minecraft that this version of the mod supports
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/modrinth/types.ts#L222" target="_blank" rel="noreferrer">packages/modrinth/types.ts:222</a>
</p>


### id

```ts
id: string
```
The ID of the version, encoded as a base62 string
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/modrinth/types.ts#L170" target="_blank" rel="noreferrer">packages/modrinth/types.ts:170</a>
</p>


### loaders

```ts
loaders: string[]
```
The mod loaders that this version supports
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/modrinth/types.ts#L226" target="_blank" rel="noreferrer">packages/modrinth/types.ts:226</a>
</p>


### name

```ts
name: string
```
The name of this version
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/modrinth/types.ts#L186" target="_blank" rel="noreferrer">packages/modrinth/types.ts:186</a>
</p>


### project_id

```ts
project_id: string
```
The ID of the project this version is for
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/modrinth/types.ts#L174" target="_blank" rel="noreferrer">packages/modrinth/types.ts:174</a>
</p>


### version_number

```ts
version_number: string
```
The version number. Ideally will follow semantic versioning
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/modrinth/types.ts#L190" target="_blank" rel="noreferrer">packages/modrinth/types.ts:190</a>
</p>


### version_type

```ts
version_type: string
```
The type of the release - alpha, beta, or release
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/modrinth/types.ts#L210" target="_blank" rel="noreferrer">packages/modrinth/types.ts:210</a>
</p>


