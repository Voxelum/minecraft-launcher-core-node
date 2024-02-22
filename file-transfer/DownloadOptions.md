# Interface DownloadOptions

## 🏷️ Properties

### abortSignal <Badge type="info" text="optional" />

```ts
abortSignal: AbortSignal
```
The user abort signal to abort the download
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/download.ts#L57" target="_blank" rel="noreferrer">packages/file-transfer/download.ts:57</a>
</p>


### agent <Badge type="info" text="optional" />

```ts
agent: DownloadAgent
```
The download agent
*Inherited from: `DownloadBaseOptions.agent`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/download.ts#L20" target="_blank" rel="noreferrer">packages/file-transfer/download.ts:20</a>
</p>


### destination

```ts
destination: string
```
Where the file will be downloaded to
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/download.ts#L45" target="_blank" rel="noreferrer">packages/file-transfer/download.ts:45</a>
</p>


### headers <Badge type="info" text="optional" />

```ts
headers: Record<string, any>
```
The header of the request
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/download.ts#L41" target="_blank" rel="noreferrer">packages/file-transfer/download.ts:41</a>
</p>


### pendingFile <Badge type="info" text="optional" />

```ts
pendingFile: string
```
Will first download to pending file and then rename to actual file
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/download.ts#L61" target="_blank" rel="noreferrer">packages/file-transfer/download.ts:61</a>
</p>


### progressController <Badge type="info" text="optional" />

```ts
progressController: ProgressController
```
The progress controller. If you want to track download progress, you should use this.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/download.ts#L49" target="_blank" rel="noreferrer">packages/file-transfer/download.ts:49</a>
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


### url

```ts
url: string | string[]
```
The url or urls (fallback) of the resource
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/download.ts#L37" target="_blank" rel="noreferrer">packages/file-transfer/download.ts:37</a>
</p>


### validator <Badge type="info" text="optional" />

```ts
validator: Validator | ChecksumValidatorOptions
```
The validator, or the options to create a validator based on checksum.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/download.ts#L53" target="_blank" rel="noreferrer">packages/file-transfer/download.ts:53</a>
</p>


