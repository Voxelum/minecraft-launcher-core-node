# Class CurseforgeV1Client

Reference the https://docs.curseforge.com/#curseforge-core-api-mods
## 🏭 Constructors

### constructor

```ts
new CurseforgeV1Client(apiKey: string, options: CurseforgeClientOptions): CurseforgeV1Client
```
#### Parameters

- **apiKey**: `string`
- **options**: `CurseforgeClientOptions`
#### Return Type

- `CurseforgeV1Client`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L538" target="_blank" rel="noreferrer">packages/curseforge/index.ts:538</a>
</p>


## 🏷️ Properties

### apiKey <Badge type="danger" text="private" />

```ts
apiKey: string
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L538" target="_blank" rel="noreferrer">packages/curseforge/index.ts:538</a>
</p>


### baseUrl <Badge type="danger" text="private" />

```ts
baseUrl: string
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L536" target="_blank" rel="noreferrer">packages/curseforge/index.ts:536</a>
</p>


### dispatcher <Badge type="danger" text="private" /> <Badge type="info" text="optional" />

```ts
dispatcher: Dispatcher
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L535" target="_blank" rel="noreferrer">packages/curseforge/index.ts:535</a>
</p>


### headers

```ts
headers: Record<string, string>
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L534" target="_blank" rel="noreferrer">packages/curseforge/index.ts:534</a>
</p>


## 🔧 Methods

### getCategories

```ts
getCategories(signal: AbortSignal): Promise<ModCategory[]>
```

#### Parameters

- **signal**: `AbortSignal`
#### Return Type

- `Promise<ModCategory[]>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L550" target="_blank" rel="noreferrer">packages/curseforge/index.ts:550</a>
</p>


### getFiles

```ts
getFiles(fileIds: number[], signal: AbortSignal): Promise<File[]>
```

#### Parameters

- **fileIds**: `number[]`
- **signal**: `AbortSignal`
#### Return Type

- `Promise<File[]>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L684" target="_blank" rel="noreferrer">packages/curseforge/index.ts:684</a>
</p>


### getMod

```ts
getMod(modId: number, signal: AbortSignal): Promise<Mod>
```
Get the mod by mod Id.
#### Parameters

- **modId**: `number`
The id of mod
- **signal**: `AbortSignal`
#### Return Type

- `Promise<Mod>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L574" target="_blank" rel="noreferrer">packages/curseforge/index.ts:574</a>
</p>


### getModDescription

```ts
getModDescription(modId: number, signal: AbortSignal): Promise<string>
```

#### Parameters

- **modId**: `number`
- **signal**: `AbortSignal`
#### Return Type

- `Promise<string>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L594" target="_blank" rel="noreferrer">packages/curseforge/index.ts:594</a>
</p>


### getModFile

```ts
getModFile(modId: number, fileId: number, signal: AbortSignal): Promise<File>
```

#### Parameters

- **modId**: `number`
- **fileId**: `number`
- **signal**: `AbortSignal`
#### Return Type

- `Promise<File>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L641" target="_blank" rel="noreferrer">packages/curseforge/index.ts:641</a>
</p>


### getModFileChangelog

```ts
getModFileChangelog(modId: number, fileId: number, signal: AbortSignal): Promise<string>
```
https://docs.curseforge.com/#get-mod-file-changelog
#### Parameters

- **modId**: `number`
- **fileId**: `number`
- **signal**: `AbortSignal`
#### Return Type

- `Promise<string>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L740" target="_blank" rel="noreferrer">packages/curseforge/index.ts:740</a>
</p>


### getModFiles

```ts
getModFiles(options: GetModFilesOptions, signal: AbortSignal): Promise<Object>
```

#### Parameters

- **options**: `GetModFilesOptions`
- **signal**: `AbortSignal`
#### Return Type

- `Promise<Object>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L614" target="_blank" rel="noreferrer">packages/curseforge/index.ts:614</a>
</p>


### getMods

```ts
getMods(modIds: number[], signal: AbortSignal): Promise<Mod[]>
```

#### Parameters

- **modIds**: `number[]`
- **signal**: `AbortSignal`
#### Return Type

- `Promise<Mod[]>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L661" target="_blank" rel="noreferrer">packages/curseforge/index.ts:661</a>
</p>


### searchMods

```ts
searchMods(options: SearchOptions, signal: AbortSignal): Promise<Object>
```

#### Parameters

- **options**: `SearchOptions`
- **signal**: `AbortSignal`
#### Return Type

- `Promise<Object>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/curseforge/index.ts#L707" target="_blank" rel="noreferrer">packages/curseforge/index.ts:707</a>
</p>


