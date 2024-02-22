# Class Ssdp

## 🏭 Constructors

### constructor

```ts
new Ssdp(sourcePort: number, sockets: Socket[]): Ssdp
```
#### Parameters

- **sourcePort**: `number`
- **sockets**: `Socket[]`
#### Return Type

- `Ssdp`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/ssdp.ts#L53" target="_blank" rel="noreferrer">packages/nat-api/lib/ssdp.ts:53</a>
</p>


## 🏷️ Properties

### _destroyed <Badge type="danger" text="private" />

```ts
_destroyed: boolean
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/ssdp.ts#L51" target="_blank" rel="noreferrer">packages/nat-api/lib/ssdp.ts:51</a>
</p>


### multicast <Badge type="tip" text="readonly" />

```ts
multicast: string
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/ssdp.ts#L48" target="_blank" rel="noreferrer">packages/nat-api/lib/ssdp.ts:48</a>
</p>


### port <Badge type="tip" text="readonly" />

```ts
port: number
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/ssdp.ts#L49" target="_blank" rel="noreferrer">packages/nat-api/lib/ssdp.ts:49</a>
</p>


### sockets <Badge type="tip" text="readonly" />

```ts
sockets: Socket[]
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/ssdp.ts#L55" target="_blank" rel="noreferrer">packages/nat-api/lib/ssdp.ts:55</a>
</p>


### sourcePort <Badge type="tip" text="readonly" />

```ts
sourcePort: number
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/ssdp.ts#L54" target="_blank" rel="noreferrer">packages/nat-api/lib/ssdp.ts:54</a>
</p>


## 🔧 Methods

### _parseMimeHeader <Badge type="danger" text="private" />

```ts
_parseMimeHeader(headerStr: string): Record<string, string>
```
#### Parameters

- **headerStr**: `string`
#### Return Type

- `Record<string, string>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/ssdp.ts#L132" target="_blank" rel="noreferrer">packages/nat-api/lib/ssdp.ts:132</a>
</p>


### _parseResponse <Badge type="danger" text="private" />

```ts
_parseResponse(response: string, addr: AddressInfo, remote: RemoteInfo): void
```
#### Parameters

- **response**: `string`
- **addr**: `AddressInfo`
- **remote**: `RemoteInfo`
#### Return Type

- `void`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/ssdp.ts#L118" target="_blank" rel="noreferrer">packages/nat-api/lib/ssdp.ts:118</a>
</p>


### destroy

```ts
destroy(): void
```
#### Return Type

- `void`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/ssdp.ts#L145" target="_blank" rel="noreferrer">packages/nat-api/lib/ssdp.ts:145</a>
</p>


### search

```ts
search(device: string): Promise<SsdpSearchResult>
```
#### Parameters

- **device**: `string`
#### Return Type

- `Promise<SsdpSearchResult>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/nat-api/lib/ssdp.ts#L86" target="_blank" rel="noreferrer">packages/nat-api/lib/ssdp.ts:86</a>
</p>


