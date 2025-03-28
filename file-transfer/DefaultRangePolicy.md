# Class DefaultRangePolicy

## 🏭 Constructors

### constructor

```ts
DefaultRangePolicy(rangeThreshold: number, concurrency: number): DefaultRangePolicy
```
#### Parameters

- **rangeThreshold**: `number`
- **concurrency**: `number`
#### Return Type

- `DefaultRangePolicy`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/rangePolicy.ts#L31" target="_blank" rel="noreferrer">packages/file-transfer/rangePolicy.ts:31</a>
</p>


## 🏷️ Properties

### concurrency <Badge type="tip" text="readonly" />

```ts
concurrency: number
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/rangePolicy.ts#L33" target="_blank" rel="noreferrer">packages/file-transfer/rangePolicy.ts:33</a>
</p>


### rangeThreshold <Badge type="tip" text="readonly" />

```ts
rangeThreshold: number
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/rangePolicy.ts#L32" target="_blank" rel="noreferrer">packages/file-transfer/rangePolicy.ts:32</a>
</p>


## 🔧 Methods

### computeRanges

```ts
computeRanges(total: number): Range[]
```
#### Parameters

- **total**: `number`
#### Return Type

- `Range[]`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/rangePolicy.ts#L40" target="_blank" rel="noreferrer">packages/file-transfer/rangePolicy.ts:40</a>
</p>


### getConcurrency

```ts
getConcurrency(): number
```
#### Return Type

- `number`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/file-transfer/rangePolicy.ts#L36" target="_blank" rel="noreferrer">packages/file-transfer/rangePolicy.ts:36</a>
</p>


