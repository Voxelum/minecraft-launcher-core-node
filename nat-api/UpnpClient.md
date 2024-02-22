# Class UpnpClient

## 🏭 Constructors

### constructor

```ts
new UpnpClient(ssdp: Ssdp): UpnpClient
```
#### Parameters

- **ssdp**: `Ssdp`
#### Return Type

- `UpnpClient`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/upnp.ts#L72" target="_blank" rel="noreferrer">packages/nat-api/lib/upnp.ts:72</a>
</p>


## 🏷️ Properties

### _destroyed <Badge type="danger" text="private" />

```ts
_destroyed: boolean
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/upnp.ts#L65" target="_blank" rel="noreferrer">packages/nat-api/lib/upnp.ts:65</a>
</p>


### address <Badge type="danger" text="private" />

```ts
address: undefined | AddressInfo
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/upnp.ts#L67" target="_blank" rel="noreferrer">packages/nat-api/lib/upnp.ts:67</a>
</p>


### device <Badge type="danger" text="private" />

```ts
device: undefined | Device
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/upnp.ts#L66" target="_blank" rel="noreferrer">packages/nat-api/lib/upnp.ts:66</a>
</p>


### expiredAt <Badge type="danger" text="private" />

```ts
expiredAt: number = 0
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/upnp.ts#L68" target="_blank" rel="noreferrer">packages/nat-api/lib/upnp.ts:68</a>
</p>


### promise <Badge type="danger" text="private" />

```ts
promise: undefined | Promise<Object>
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/upnp.ts#L70" target="_blank" rel="noreferrer">packages/nat-api/lib/upnp.ts:70</a>
</p>


### ssdp <Badge type="danger" text="private" />

```ts
ssdp: Ssdp
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/upnp.ts#L72" target="_blank" rel="noreferrer">packages/nat-api/lib/upnp.ts:72</a>
</p>


### timeout <Badge type="tip" text="readonly" />

```ts
timeout: number
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/upnp.ts#L64" target="_blank" rel="noreferrer">packages/nat-api/lib/upnp.ts:64</a>
</p>


### ttl <Badge type="danger" text="private" />

```ts
ttl: number = 300_000
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/upnp.ts#L69" target="_blank" rel="noreferrer">packages/nat-api/lib/upnp.ts:69</a>
</p>


## 🔧 Methods

### destroy

```ts
destroy(): void
```
#### Return Type

- `void`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/upnp.ts#L264" target="_blank" rel="noreferrer">packages/nat-api/lib/upnp.ts:264</a>
</p>


### externalIp

```ts
externalIp(): Promise<string>
```
#### Return Type

- `Promise<string>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/upnp.ts#L201" target="_blank" rel="noreferrer">packages/nat-api/lib/upnp.ts:201</a>
</p>


### findGateway

```ts
findGateway(): Promise<Object>
```
#### Return Type

- `Promise<Object>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/upnp.ts#L220" target="_blank" rel="noreferrer">packages/nat-api/lib/upnp.ts:220</a>
</p>


### getMappings

```ts
getMappings(options: GetMappingOptions= {}): Promise<MappingInfo[]>
```
#### Parameters

- **options**: `GetMappingOptions`
#### Return Type

- `Promise<MappingInfo[]>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/upnp.ts#L139" target="_blank" rel="noreferrer">packages/nat-api/lib/upnp.ts:139</a>
</p>


### map

```ts
map(options: UpnpMapOptions): Promise<void>
```
#### Parameters

- **options**: `UpnpMapOptions`
#### Return Type

- `Promise<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/upnp.ts#L77" target="_blank" rel="noreferrer">packages/nat-api/lib/upnp.ts:77</a>
</p>


### unmap

```ts
unmap(options: UpnpUnmapOptions): Promise<boolean>
```
#### Parameters

- **options**: `UpnpUnmapOptions`
#### Return Type

- `Promise<boolean>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/upnp.ts#L109" target="_blank" rel="noreferrer">packages/nat-api/lib/upnp.ts:109</a>
</p>


