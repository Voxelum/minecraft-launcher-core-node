# Class PacketOutbound

## 🏭 Constructors

### constructor

```ts
new PacketOutbound(opts: TransformOptions): PacketOutbound
```
#### Parameters

- **opts**: `TransformOptions`
#### Return Type

- `PacketOutbound`

*Inherited from: `Transform.constructor`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/node_modules/.pnpm/@types+node@18.15.11/node_modules/@types/node/stream.d.ts#L1045" target="_blank" rel="noreferrer">node_modules/.pnpm/@types+node@18.15.11/node_modules/@types/node/stream.d.ts:1045</a>
</p>


## 🔧 Methods

### _transform

```ts
_transform(packet: Buffer, encoding: string, callback: TransformCallback): void
```
#### Parameters

- **packet**: `Buffer`
- **encoding**: `string`
- **callback**: `TransformCallback`
#### Return Type

- `void`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/channel.ts#L325" target="_blank" rel="noreferrer">packages/client/channel.ts:325</a>
</p>


### writePacketLength <Badge type="warning" text="protected" /> <Badge type="warning" text="abstract" />

```ts
writePacketLength(bb: ByteBuffer, len: number): void
```
#### Parameters

- **bb**: `ByteBuffer`
- **len**: `number`
#### Return Type

- `void`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/channel.ts#L323" target="_blank" rel="noreferrer">packages/client/channel.ts:323</a>
</p>


