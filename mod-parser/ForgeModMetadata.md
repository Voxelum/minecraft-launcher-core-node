# Interface ForgeModMetadata

Represnet a full scan of a mod file data.
## 🏷️ Properties

### fmlPluginClassName <Badge type="info" text="optional" />

```ts
fmlPluginClassName: string
```
*Inherited from: `ForgeModASMData.fmlPluginClassName`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/mod-parser/forge.ts#L219" target="_blank" rel="noreferrer">packages/mod-parser/forge.ts:219</a>
</p>


### fmlPluginMcVersion <Badge type="info" text="optional" />

```ts
fmlPluginMcVersion: string
```
*Inherited from: `ForgeModASMData.fmlPluginMcVersion`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/mod-parser/forge.ts#L220" target="_blank" rel="noreferrer">packages/mod-parser/forge.ts:220</a>
</p>


### manifest

```ts
manifest: Record<string, any>
```
The java manifest file data. If no metadata, it will be an empty object
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/mod-parser/forge.ts#L665" target="_blank" rel="noreferrer">packages/mod-parser/forge.ts:665</a>
</p>


### manifestMetadata <Badge type="info" text="optional" />

```ts
manifestMetadata: ManifestMetadata
```
The mod info extract from manfiest. If no manifest, it will be undefined!
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/mod-parser/forge.ts#L669" target="_blank" rel="noreferrer">packages/mod-parser/forge.ts:669</a>
</p>


### mcmodInfo

```ts
mcmodInfo: ForgeModMcmodInfo[]
```
The mcmod.info file metadata. If no mcmod.info file, it will be an empty array
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/mod-parser/forge.ts#L661" target="_blank" rel="noreferrer">packages/mod-parser/forge.ts:661</a>
</p>


### modAnnotations

```ts
modAnnotations: ForgeModAnnotationData[]
```
*Inherited from: `ForgeModASMData.modAnnotations`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/mod-parser/forge.ts#L222" target="_blank" rel="noreferrer">packages/mod-parser/forge.ts:222</a>
</p>


### modsToml

```ts
modsToml: ForgeModTOMLData[]
```
The toml mod metadata
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/mod-parser/forge.ts#L673" target="_blank" rel="noreferrer">packages/mod-parser/forge.ts:673</a>
</p>


### usedForgePackage

```ts
usedForgePackage: boolean
```
Does class files contain forge package
*Inherited from: `ForgeModASMData.usedForgePackage`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/mod-parser/forge.ts#L209" target="_blank" rel="noreferrer">packages/mod-parser/forge.ts:209</a>
</p>


### usedLegacyFMLPackage

```ts
usedLegacyFMLPackage: boolean
```
Does class files contain cpw package
*Inherited from: `ForgeModASMData.usedLegacyFMLPackage`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/mod-parser/forge.ts#L205" target="_blank" rel="noreferrer">packages/mod-parser/forge.ts:205</a>
</p>


### usedMinecraftClientPackage

```ts
usedMinecraftClientPackage: boolean
```
Does class files contain minecraft.client package
*Inherited from: `ForgeModASMData.usedMinecraftClientPackage`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/mod-parser/forge.ts#L217" target="_blank" rel="noreferrer">packages/mod-parser/forge.ts:217</a>
</p>


### usedMinecraftPackage

```ts
usedMinecraftPackage: boolean
```
Does class files contain minecraft package
*Inherited from: `ForgeModASMData.usedMinecraftPackage`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/mod-parser/forge.ts#L213" target="_blank" rel="noreferrer">packages/mod-parser/forge.ts:213</a>
</p>


