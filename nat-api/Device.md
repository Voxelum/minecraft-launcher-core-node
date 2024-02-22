# Class Device

## 🏭 Constructors

### constructor

```ts
new Device(url: string): Device
```
#### Parameters

- **url**: `string`
#### Return Type

- `Device`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/device.ts#L75" target="_blank" rel="noreferrer">packages/nat-api/lib/device.ts:75</a>
</p>


## 🏷️ Properties

### baseUrl <Badge type="danger" text="private" />

```ts
baseUrl: string = ''
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/device.ts#L72" target="_blank" rel="noreferrer">packages/nat-api/lib/device.ts:72</a>
</p>


### client <Badge type="danger" text="private" />

```ts
client: Client
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/device.ts#L73" target="_blank" rel="noreferrer">packages/nat-api/lib/device.ts:73</a>
</p>


### device <Badge type="danger" text="private" /> <Badge type="info" text="optional" />

```ts
device: DeviceInfo
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/device.ts#L69" target="_blank" rel="noreferrer">packages/nat-api/lib/device.ts:69</a>
</p>


### lastUpdate <Badge type="danger" text="private" />

```ts
lastUpdate: number = 0
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/device.ts#L70" target="_blank" rel="noreferrer">packages/nat-api/lib/device.ts:70</a>
</p>


### services

```ts
services: string[]
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/device.ts#L67" target="_blank" rel="noreferrer">packages/nat-api/lib/device.ts:67</a>
</p>


### ttl <Badge type="danger" text="private" />

```ts
ttl: number = ...
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/device.ts#L71" target="_blank" rel="noreferrer">packages/nat-api/lib/device.ts:71</a>
</p>


### url <Badge type="tip" text="readonly" />

```ts
url: string
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/device.ts#L75" target="_blank" rel="noreferrer">packages/nat-api/lib/device.ts:75</a>
</p>


## 🔧 Methods

### _getService <Badge type="danger" text="private" />

```ts
_getService(types: string[]): Promise<Object>
```
#### Parameters

- **types**: `string[]`
#### Return Type

- `Promise<Object>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/device.ts#L190" target="_blank" rel="noreferrer">packages/nat-api/lib/device.ts:190</a>
</p>


### connectDevice

```ts
connectDevice(): Promise<DeviceInfo>
```
#### Return Type

- `Promise<DeviceInfo>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/device.ts#L84" target="_blank" rel="noreferrer">packages/nat-api/lib/device.ts:84</a>
</p>


### run

```ts
run(action: string, args: Record<string, undefined | string | number>): Promise<any>
```
#### Parameters

- **action**: `string`
- **args**: `Record<string, undefined | string | number>`
#### Return Type

- `Promise<any>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/device.ts#L115" target="_blank" rel="noreferrer">packages/nat-api/lib/device.ts:115</a>
</p>


