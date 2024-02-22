# Interface AssetsOptions

Change the host url of assets download
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


### assetsDownloadConcurrency <Badge type="info" text="optional" />

```ts
assetsDownloadConcurrency: number
```
Control how many assets download task should run at the same time.
It will override the ``maxConcurrencyOption`` if this is presented.

This will be ignored if you have your own downloader assigned.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L133" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:133</a>
</p>


### assetsHost <Badge type="info" text="optional" />

```ts
assetsHost: string | string[]
```
The alternative assets host to download asset. It will try to use these host from the ``[0]`` to the ``[assetsHost.length - 1]``
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L126" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:126</a>
</p>


### assetsIndexUrl <Badge type="info" text="optional" />

```ts
assetsIndexUrl: string | string[] | Function
```
The assets index download or url replacement
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L138" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:138</a>
</p>


### checksumValidatorResolver <Badge type="info" text="optional" />

```ts
checksumValidatorResolver: Function
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L140" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:140</a>
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


### prevalidSizeOnly <Badge type="info" text="optional" />

```ts
prevalidSizeOnly: boolean
```
Only precheck the size of the assets. Do not check the hash.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L144" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:144</a>
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


