# Class Client

## 🏭 Constructors

### constructor

```ts
new Client(options: ClientOptions): Client
```
#### Parameters

- **options**: `ClientOptions`
#### Return Type

- `Client`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/discord-rpc/Client.ts#L130" target="_blank" rel="noreferrer">packages/discord-rpc/Client.ts:130</a>
</p>


## 🏷️ Properties

### _nonceMap <Badge type="danger" text="private" />

```ts
_nonceMap: Map<string, Object> = ...
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/discord-rpc/Client.ts#L121" target="_blank" rel="noreferrer">packages/discord-rpc/Client.ts:121</a>
</p>


### accessToken <Badge type="danger" text="private" /> <Badge type="info" text="optional" />

```ts
accessToken: string
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/discord-rpc/Client.ts#L86" target="_blank" rel="noreferrer">packages/discord-rpc/Client.ts:86</a>
</p>


### application <Badge type="info" text="optional" />

```ts
application: APIApplication
```
current application
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/discord-rpc/Client.ts#L102" target="_blank" rel="noreferrer">packages/discord-rpc/Client.ts:102</a>
</p>


### clientId

```ts
clientId: string
```
application id
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/discord-rpc/Client.ts#L75" target="_blank" rel="noreferrer">packages/discord-rpc/Client.ts:75</a>
</p>


### clientSecret <Badge type="info" text="optional" />

```ts
clientSecret: string
```
application secret
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/discord-rpc/Client.ts#L79" target="_blank" rel="noreferrer">packages/discord-rpc/Client.ts:79</a>
</p>


### connectionPromise <Badge type="danger" text="private" /> <Badge type="info" text="optional" />

```ts
connectionPromise: Promise<void>
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/discord-rpc/Client.ts#L120" target="_blank" rel="noreferrer">packages/discord-rpc/Client.ts:120</a>
</p>


### dispatcher <Badge type="info" text="optional" />

```ts
dispatcher: Dispatcher
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/discord-rpc/Client.ts#L113" target="_blank" rel="noreferrer">packages/discord-rpc/Client.ts:113</a>
</p>


### pipeId <Badge type="info" text="optional" />

```ts
pipeId: number
```
pipe id
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/discord-rpc/Client.ts#L84" target="_blank" rel="noreferrer">packages/discord-rpc/Client.ts:84</a>
</p>


### refreshTimeout <Badge type="danger" text="private" /> <Badge type="info" text="optional" />

```ts
refreshTimeout: Timeout
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/discord-rpc/Client.ts#L119" target="_blank" rel="noreferrer">packages/discord-rpc/Client.ts:119</a>
</p>


### refreshToken <Badge type="danger" text="private" /> <Badge type="info" text="optional" />

```ts
refreshToken: string
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/discord-rpc/Client.ts#L87" target="_blank" rel="noreferrer">packages/discord-rpc/Client.ts:87</a>
</p>


### tokenType <Badge type="danger" text="private" />

```ts
tokenType: string = 'Bearer'
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/discord-rpc/Client.ts#L88" target="_blank" rel="noreferrer">packages/discord-rpc/Client.ts:88</a>
</p>


### transport <Badge type="tip" text="readonly" />

```ts
transport: Transport
```
transport instance
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/discord-rpc/Client.ts#L93" target="_blank" rel="noreferrer">packages/discord-rpc/Client.ts:93</a>
</p>


### user <Badge type="info" text="optional" />

```ts
user: ClientUser
```
current user
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/discord-rpc/Client.ts#L98" target="_blank" rel="noreferrer">packages/discord-rpc/Client.ts:98</a>
</p>


## 🔑 Accessors

### isConnected

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/discord-rpc/Client.ts#L115" target="_blank" rel="noreferrer">packages/discord-rpc/Client.ts:115</a>
</p>


## 🔧 Methods

### authenticate <Badge type="danger" text="private" />

```ts
authenticate(): Promise<void>
```
#### Return Type

- `Promise<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/discord-rpc/Client.ts#L210" target="_blank" rel="noreferrer">packages/discord-rpc/Client.ts:210</a>
</p>


### authorize <Badge type="danger" text="private" />

```ts
authorize(options: AuthorizeOptions): Promise<void>
```
#### Parameters

- **options**: `AuthorizeOptions`
#### Return Type

- `Promise<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/discord-rpc/Client.ts#L253" target="_blank" rel="noreferrer">packages/discord-rpc/Client.ts:253</a>
</p>


### connect

```ts
connect(): Promise<void>
```
connect to the local rpc server
#### Return Type

- `Promise<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/discord-rpc/Client.ts#L321" target="_blank" rel="noreferrer">packages/discord-rpc/Client.ts:321</a>
</p>


### destroy

```ts
destroy(): Promise<void>
```
disconnects from the local rpc server
#### Return Type

- `Promise<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/discord-rpc/Client.ts#L382" target="_blank" rel="noreferrer">packages/discord-rpc/Client.ts:382</a>
</p>


### hanleAccessTokenResponse <Badge type="danger" text="private" />

```ts
hanleAccessTokenResponse(data: any): void
```
#### Parameters

- **data**: `any`
#### Return Type

- `void`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/discord-rpc/Client.ts#L238" target="_blank" rel="noreferrer">packages/discord-rpc/Client.ts:238</a>
</p>


### login

```ts
login(options: AuthorizeOptions): Promise<void>
```
will try to authorize if a scope is specified, else it's the same as ``connect()``
#### Parameters

- **options**: `AuthorizeOptions`
options for the authorization
#### Return Type

- `Promise<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/discord-rpc/Client.ts#L367" target="_blank" rel="noreferrer">packages/discord-rpc/Client.ts:367</a>
</p>


### refreshAccessToken <Badge type="danger" text="private" />

```ts
refreshAccessToken(): Promise<void>
```
#### Return Type

- `Promise<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/discord-rpc/Client.ts#L218" target="_blank" rel="noreferrer">packages/discord-rpc/Client.ts:218</a>
</p>


### subscribe

```ts
subscribe(event: "OVERLAY" | "CURRENT_USER_UPDATE" | "GUILD_STATUS" | "GUILD_CREATE" | "CHANNEL_CREATE" | "RELATIONSHIP_UPDATE" | "VOICE_CHANNEL_SELECT" | "VOICE_STATE_CREATE" | "VOICE_STATE_DELETE" | "VOICE_STATE_UPDATE" | "VOICE_SETTINGS_UPDATE" | "VOICE_SETTINGS_UPDATE_2" | "VOICE_CONNECTION_STATUS" | "SPEAKING_START" | "SPEAKING_STOP" | "GAME_JOIN" | "GAME_SPECTATE" | "ACTIVITY_JOIN" | "ACTIVITY_JOIN_REQUEST" | "ACTIVITY_SPECTATE" | "ACTIVITY_INVITE" | "ACTIVITY_PIP_MODE_UPDATE" | "NOTIFICATION_CREATE" | "MESSAGE_CREATE" | "MESSAGE_UPDATE" | "MESSAGE_DELETE" | "LOBBY_DELETE" | "LOBBY_UPDATE" | "LOBBY_MEMBER_CONNECT" | "LOBBY_MEMBER_DISCONNECT" | "LOBBY_MEMBER_UPDATE" | "LOBBY_MESSAGE" | "OVERLAY_UPDATE" | "ENTITLEMENT_CREATE" | "ENTITLEMENT_DELETE" | "USER_ACHIEVEMENT_UPDATE" | "VOICE_CHANNEL_EFFECT_SEND" | "THERMAL_STATE_UPDATE", args: any): Promise<Object>
```
Used to subscribe to events. ``evt`` of the payload should be set to the event being subscribed to. ``args`` of the payload should be set to the args needed for the event.
#### Parameters

- **event**: `"OVERLAY" | "CURRENT_USER_UPDATE" | "GUILD_STATUS" | "GUILD_CREATE" | "CHANNEL_CREATE" | "RELATIONSHIP_UPDATE" | "VOICE_CHANNEL_SELECT" | "VOICE_STATE_CREATE" | "VOICE_STATE_DELETE" | "VOICE_STATE_UPDATE" | "VOICE_SETTINGS_UPDATE" | "VOICE_SETTINGS_UPDATE_2" | "VOICE_CONNECTION_STATUS" | "SPEAKING_START" | "SPEAKING_STOP" | "GAME_JOIN" | "GAME_SPECTATE" | "ACTIVITY_JOIN" | "ACTIVITY_JOIN_REQUEST" | "ACTIVITY_SPECTATE" | "ACTIVITY_INVITE" | "ACTIVITY_PIP_MODE_UPDATE" | "NOTIFICATION_CREATE" | "MESSAGE_CREATE" | "MESSAGE_UPDATE" | "MESSAGE_DELETE" | "LOBBY_DELETE" | "LOBBY_UPDATE" | "LOBBY_MEMBER_CONNECT" | "LOBBY_MEMBER_DISCONNECT" | "LOBBY_MEMBER_UPDATE" | "LOBBY_MESSAGE" | "OVERLAY_UPDATE" | "ENTITLEMENT_CREATE" | "ENTITLEMENT_DELETE" | "USER_ACHIEVEMENT_UPDATE" | "VOICE_CHANNEL_EFFECT_SEND" | "THERMAL_STATE_UPDATE"`
event name now subscribed to
- **args**: `any`
args for the event
#### Return Type

- `Promise<Object>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/discord-rpc/Client.ts#L306" target="_blank" rel="noreferrer">packages/discord-rpc/Client.ts:306</a>
</p>


