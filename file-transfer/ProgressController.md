# Interface ProgressController

The controller that maintain the download status
## 🏷️ Properties

### progress <Badge type="tip" text="readonly" />

```ts
progress: number
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/progress.ts#L7" target="_blank" rel="noreferrer">packages/file-transfer/progress.ts:7</a>
</p>


## 🔧 Methods

### onProgress

```ts
onProgress(url: URL, chunkSize: number, progress: number, total: number): void
```
#### Parameters

- **url**: `URL`
- **chunkSize**: `number`
- **progress**: `number`
- **total**: `number`
#### Return Type

- `void`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/progress.ts#L8" target="_blank" rel="noreferrer">packages/file-transfer/progress.ts:8</a>
</p>


