# Class DownloadAgent

## 🏭 Constructors

### constructor

```ts
new DownloadAgent(retryHandler: RetryPolicy, rangePolicy: RangePolicy, dispatcher: Dispatcher, checkpointHandler: undefined | CheckpointHandler): DownloadAgent
```
#### Parameters

- **retryHandler**: `RetryPolicy`
- **rangePolicy**: `RangePolicy`
- **dispatcher**: `Dispatcher`
- **checkpointHandler**: `undefined | CheckpointHandler`
#### Return Type

- `DownloadAgent`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/agent.ts#L33" target="_blank" rel="noreferrer">packages/file-transfer/agent.ts:33</a>
</p>


## 🏷️ Properties

### checkpointHandler <Badge type="tip" text="readonly" />

```ts
checkpointHandler: undefined | CheckpointHandler
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/agent.ts#L37" target="_blank" rel="noreferrer">packages/file-transfer/agent.ts:37</a>
</p>


### dispatcher <Badge type="tip" text="readonly" />

```ts
dispatcher: Dispatcher
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/agent.ts#L36" target="_blank" rel="noreferrer">packages/file-transfer/agent.ts:36</a>
</p>


### rangePolicy <Badge type="tip" text="readonly" />

```ts
rangePolicy: RangePolicy
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/agent.ts#L35" target="_blank" rel="noreferrer">packages/file-transfer/agent.ts:35</a>
</p>


### retryHandler <Badge type="tip" text="readonly" />

```ts
retryHandler: RetryPolicy
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/agent.ts#L34" target="_blank" rel="noreferrer">packages/file-transfer/agent.ts:34</a>
</p>


## 🔧 Methods

### dispatch

```ts
dispatch(url: URL, method: string, headers: Record<string, string>, destination: string, handle: FileHandle, progressController: undefined | ProgressController, abortSignal: undefined | AbortSignal): Promise<void>
```
#### Parameters

- **url**: `URL`
- **method**: `string`
- **headers**: `Record<string, string>`
- **destination**: `string`
- **handle**: `FileHandle`
- **progressController**: `undefined | ProgressController`
- **abortSignal**: `undefined | AbortSignal`
#### Return Type

- `Promise<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/agent.ts#L58" target="_blank" rel="noreferrer">packages/file-transfer/agent.ts:58</a>
</p>


### head <Badge type="danger" text="private" />

```ts
head(url: URL, headers: Record<string, string>, signal: AbortSignal): Promise<ResponseData>
```
#### Parameters

- **url**: `URL`
- **headers**: `Record<string, string>`
- **signal**: `AbortSignal`
#### Return Type

- `Promise<ResponseData>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/agent.ts#L42" target="_blank" rel="noreferrer">packages/file-transfer/agent.ts:42</a>
</p>


