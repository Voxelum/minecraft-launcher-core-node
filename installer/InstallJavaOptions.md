# Interface InstallJavaOptions

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


### cacheDir <Badge type="info" text="optional" />

```ts
cacheDir: string
```
The cached directory which compressed java lzma will be download to.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/java.ts#L36" target="_blank" rel="noreferrer">packages/installer/java.ts:36</a>
</p>


### destination

```ts
destination: string
```
The destination of this installation
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/java.ts#L31" target="_blank" rel="noreferrer">packages/installer/java.ts:31</a>
</p>


### dispatcher <Badge type="info" text="optional" />

```ts
dispatcher: Dispatcher
```
The dispatcher for API
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/java.ts#L49" target="_blank" rel="noreferrer">packages/installer/java.ts:49</a>
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


### platform <Badge type="info" text="optional" />

```ts
platform: Platform
```
The platform to install. It will be auto-resolved by default.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/java.ts#L41" target="_blank" rel="noreferrer">packages/installer/java.ts:41</a>
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


### unpackLZMA

```ts
unpackLZMA: UnpackLZMAFunction
```
Unpack lzma function. It must present, else it will not be able to unpack mojang provided LZMA.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/java.ts#L45" target="_blank" rel="noreferrer">packages/installer/java.ts:45</a>
</p>


