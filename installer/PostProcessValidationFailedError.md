# Class PostProcessValidationFailedError

## 🏭 Constructors

### constructor

```ts
PostProcessValidationFailedError(jarPath: string, commands: string[], message: string, file: string, expect: string, actual: string): PostProcessValidationFailedError
```
#### Parameters

- **jarPath**: `string`
- **commands**: `string[]`
- **message**: `string`
- **file**: `string`
- **expect**: `string`
- **actual**: `string`
#### Return Type

- `PostProcessValidationFailedError`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/profile.ts#L338" target="_blank" rel="noreferrer">packages/installer/profile.ts:338</a>
</p>


## 🏷️ Properties

### actual <Badge type="tip" text="readonly" />

```ts
actual: string
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/profile.ts#L338" target="_blank" rel="noreferrer">packages/installer/profile.ts:338</a>
</p>


### commands <Badge type="tip" text="public" />

```ts
commands: string[]
```
*Inherited from: `PostProcessFailedError.commands`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/profile.ts#L330" target="_blank" rel="noreferrer">packages/installer/profile.ts:330</a>
</p>


### expect <Badge type="tip" text="readonly" />

```ts
expect: string
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/profile.ts#L338" target="_blank" rel="noreferrer">packages/installer/profile.ts:338</a>
</p>


### file <Badge type="tip" text="readonly" />

```ts
file: string
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/profile.ts#L338" target="_blank" rel="noreferrer">packages/installer/profile.ts:338</a>
</p>


### jarPath <Badge type="tip" text="public" />

```ts
jarPath: string
```
*Inherited from: `PostProcessFailedError.jarPath`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/profile.ts#L330" target="_blank" rel="noreferrer">packages/installer/profile.ts:330</a>
</p>


### name

```ts
name: string = 'PostProcessValidationFailedError'
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/profile.ts#L342" target="_blank" rel="noreferrer">packages/installer/profile.ts:342</a>
</p>


