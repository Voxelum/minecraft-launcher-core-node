# Class Channel

The channel for send and listen the Minecraft packet.
## 🏭 Constructors

### constructor

```ts
new Channel(): Channel
```
#### Return Type

- `Channel`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/channel.ts#L47" target="_blank" rel="noreferrer">packages/client/channel.ts:47</a>
</p>


## 🏷️ Properties

### compressionThreshold <Badge type="danger" text="private" />

```ts
compressionThreshold: number = -1
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/channel.ts#L45" target="_blank" rel="noreferrer">packages/client/channel.ts:45</a>
</p>


### connection <Badge type="danger" text="private" />

```ts
connection: Socket = ...
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/channel.ts#L38" target="_blank" rel="noreferrer">packages/client/channel.ts:38</a>
</p>


### enableCompression <Badge type="danger" text="private" />

```ts
enableCompression: boolean = false
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/channel.ts#L44" target="_blank" rel="noreferrer">packages/client/channel.ts:44</a>
</p>


### inbound <Badge type="danger" text="private" />

```ts
inbound: Writable
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/channel.ts#L41" target="_blank" rel="noreferrer">packages/client/channel.ts:41</a>
</p>


### listened <Badge type="danger" text="private" />

```ts
listened: boolean = false
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/channel.ts#L42" target="_blank" rel="noreferrer">packages/client/channel.ts:42</a>
</p>


### outbound <Badge type="danger" text="private" />

```ts
outbound: Writable
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/channel.ts#L40" target="_blank" rel="noreferrer">packages/client/channel.ts:40</a>
</p>


### state

```ts
state: keyof States = 'handshake'
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/channel.ts#L21" target="_blank" rel="noreferrer">packages/client/channel.ts:21</a>
</p>


### states <Badge type="danger" text="private" /> <Badge type="tip" text="readonly" />

```ts
states: Object = ...
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/channel.ts#L23" target="_blank" rel="noreferrer">packages/client/channel.ts:23</a>
</p>


## 🔑 Accessors

### ready

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/channel.ts#L71" target="_blank" rel="noreferrer">packages/client/channel.ts:71</a>
</p>


## 🔧 Methods

### disconnect

```ts
disconnect(): Promise<void>
```
#### Return Type

- `Promise<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/channel.ts#L124" target="_blank" rel="noreferrer">packages/client/channel.ts:124</a>
</p>


### findCoderById

```ts
findCoderById(packetId: number, side: Side): Coder<any>
```
#### Parameters

- **packetId**: `number`
- **side**: `Side`
#### Return Type

- `Coder<any>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/channel.ts#L75" target="_blank" rel="noreferrer">packages/client/channel.ts:75</a>
</p>


### getPacketId

```ts
getPacketId(packetInst: any, side: Side): number
```
#### Parameters

- **packetInst**: `any`
- **side**: `Side`
#### Return Type

- `number`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/channel.ts#L80" target="_blank" rel="noreferrer">packages/client/channel.ts:80</a>
</p>


### listen

```ts
listen(option: Object): Promise<void>
```
Open the connection and start to listen the port.
#### Parameters

- **option**: `Object`
#### Return Type

- `Promise<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/channel.ts#L104" target="_blank" rel="noreferrer">packages/client/channel.ts:104</a>
</p>


### on

```ts
on(channel: string, listener: Function): Channel
```
#### Parameters

- **channel**: `string`
- **listener**: `Function`
#### Return Type

- `Channel`

*Inherited from: `EventEmitter.on`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/channel.ts#L172" target="_blank" rel="noreferrer">packages/client/channel.ts:172</a>
</p>


### onPacket

```ts
onPacket(packet: Function, listener: Function): Channel
```
Listen for sepcific packet by its class name.
#### Parameters

- **packet**: `Function`
- **listener**: `Function`
#### Return Type

- `Channel`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/channel.ts#L162" target="_blank" rel="noreferrer">packages/client/channel.ts:162</a>
</p>


### once

```ts
once(channel: string, listener: Function): Channel
```
#### Parameters

- **channel**: `string`
- **listener**: `Function`
#### Return Type

- `Channel`

*Inherited from: `EventEmitter.once`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/channel.ts#L173" target="_blank" rel="noreferrer">packages/client/channel.ts:173</a>
</p>


### oncePacket

```ts
oncePacket(packet: Function, listener: Function): Channel
```
#### Parameters

- **packet**: `Function`
- **listener**: `Function`
#### Return Type

- `Channel`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/channel.ts#L166" target="_blank" rel="noreferrer">packages/client/channel.ts:166</a>
</p>


### registerPacket

```ts
registerPacket(entry: PacketRegistryEntry): void
```
#### Parameters

- **entry**: `PacketRegistryEntry`
#### Return Type

- `void`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/channel.ts#L94" target="_blank" rel="noreferrer">packages/client/channel.ts:94</a>
</p>


### registerPacketType

```ts
registerPacketType(clazz: Function): void
```
#### Parameters

- **clazz**: `Function`
#### Return Type

- `void`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/channel.ts#L86" target="_blank" rel="noreferrer">packages/client/channel.ts:86</a>
</p>


### send

```ts
send(message: T, skeleton: Partial<T>): Promise<void>
```
Sent a packet to server.
#### Parameters

- **message**: `T`
- **skeleton**: `Partial<T>`
#### Return Type

- `Promise<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/channel.ts#L144" target="_blank" rel="noreferrer">packages/client/channel.ts:144</a>
</p>


