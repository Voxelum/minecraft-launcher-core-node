# Interface JarOption

Replace the minecraft client or server jar download
## 🏷️ Properties

### agent <Badge type="info" text="optional" />

```ts
agent: DownloadAgent
```
The download agent
*Inherited from: `DownloadBaseOptions.agent`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/download.ts#L20" target="_blank" rel="noreferrer">packages/file-transfer/download.ts:20</a>
</p>


### checksumValidatorResolver <Badge type="info" text="optional" />

```ts
checksumValidatorResolver: Function
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L178" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:178</a>
</p>


### client <Badge type="info" text="optional" />

```ts
client: string | string[] | Function
```
The client jar url replacement
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L172" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:172</a>
</p>


### headers <Badge type="info" text="optional" />

```ts
headers: Record<string, any>
```
The header of the request
*Inherited from: `DownloadBaseOptions.headers`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/download.ts#L16" target="_blank" rel="noreferrer">packages/file-transfer/download.ts:16</a>
</p>


### json <Badge type="info" text="optional" />

```ts
json: string | string[] | Function
```
The version json url replacement
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L168" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:168</a>
</p>


### server <Badge type="info" text="optional" />

```ts
server: string | string[] | Function
```
The server jar url replacement
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L176" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:176</a>
</p>


### side <Badge type="info" text="optional" />

```ts
side: "server" | "client"
```
The installation side
*Inherited from: `InstallSideOption.side`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L185" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:185</a>
</p>


### skipPrevalidate <Badge type="info" text="optional" />

```ts
skipPrevalidate: boolean
```
Should skip prevalidate the file
*Inherited from: `DownloadBaseOptions.skipPrevalidate`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/download.ts#L30" target="_blank" rel="noreferrer">packages/file-transfer/download.ts:30</a>
</p>


### skipRevalidate <Badge type="info" text="optional" />

```ts
skipRevalidate: boolean
```
Re-validate the file after download success
*Inherited from: `DownloadBaseOptions.skipRevalidate`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/download.ts#L25" target="_blank" rel="noreferrer">packages/file-transfer/download.ts:25</a>
</p>


### throwErrorImmediately <Badge type="info" text="optional" />

```ts
throwErrorImmediately: boolean
```
*Inherited from: `ParallelTaskOptions.throwErrorImmediately`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/utils.ts#L95" target="_blank" rel="noreferrer">packages/installer/utils.ts:95</a>
</p>


