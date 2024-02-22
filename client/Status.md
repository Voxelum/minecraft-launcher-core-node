# Interface Status

The json format for Minecraft server handshake status query response
## 🏷️ Properties

### description

```ts
description: string | TextComponent
```
The motd of server, which might be the raw TextComponent string or structurelized TextComponent JSON
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/status.ts#L67" target="_blank" rel="noreferrer">packages/client/status.ts:67</a>
</p>


### favicon

```ts
favicon: string
```
The base 64 favicon data
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/status.ts#L71" target="_blank" rel="noreferrer">packages/client/status.ts:71</a>
</p>


### modinfo <Badge type="info" text="optional" />

```ts
modinfo: Object
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/status.ts#L72" target="_blank" rel="noreferrer">packages/client/status.ts:72</a>
</p>


### ping

```ts
ping: number
```
The ping from server
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/status.ts#L79" target="_blank" rel="noreferrer">packages/client/status.ts:79</a>
</p>


### players

```ts
players: Object
```
The player info in server
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/status.ts#L50" target="_blank" rel="noreferrer">packages/client/status.ts:50</a>
</p>


### version

```ts
version: Object
```
The version info of the server
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/client/status.ts#L36" target="_blank" rel="noreferrer">packages/client/status.ts:36</a>
</p>


