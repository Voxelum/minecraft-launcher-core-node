# Class MojangClient

The mojang api client. Please referece https://wiki.vg/Mojang_API.

All the apis need user to authenticate the access token from microsoft.
## 🏭 Constructors

### constructor

```ts
new MojangClient(dispatcher: Dispatcher): MojangClient
```
#### Parameters

- **dispatcher**: `Dispatcher`
#### Return Type

- `MojangClient`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/mojang.ts#L211" target="_blank" rel="noreferrer">packages/user/mojang.ts:211</a>
</p>


## 🏷️ Properties

### dispatcher <Badge type="danger" text="private" /> <Badge type="info" text="optional" />

```ts
dispatcher: Dispatcher
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/mojang.ts#L211" target="_blank" rel="noreferrer">packages/user/mojang.ts:211</a>
</p>


## 🔧 Methods

### checkGameOwnership

```ts
checkGameOwnership(token: string, signal: AbortSignal): Promise<MinecraftOwnershipResponse>
```
Return the owner ship list of the player with those token.
#### Parameters

- **token**: `string`
- **signal**: `AbortSignal`
#### Return Type

- `Promise<MinecraftOwnershipResponse>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/mojang.ts#L413" target="_blank" rel="noreferrer">packages/user/mojang.ts:413</a>
</p>


### checkNameAvailability

```ts
checkNameAvailability(name: string, token: string, signal: AbortSignal): Promise<NameAvailability>
```
#### Parameters

- **name**: `string`
- **token**: `string`
- **signal**: `AbortSignal`
#### Return Type

- `Promise<NameAvailability>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/mojang.ts#L244" target="_blank" rel="noreferrer">packages/user/mojang.ts:244</a>
</p>


### getNameChangeInformation

```ts
getNameChangeInformation(token: string): Promise<NameChangeInformation>
```
#### Parameters

- **token**: `string`
#### Return Type

- `Promise<NameChangeInformation>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/mojang.ts#L233" target="_blank" rel="noreferrer">packages/user/mojang.ts:233</a>
</p>


### getProfile

```ts
getProfile(token: string, signal: AbortSignal): Promise<MicrosoftMinecraftProfile>
```
#### Parameters

- **token**: `string`
- **signal**: `AbortSignal`
#### Return Type

- `Promise<MicrosoftMinecraftProfile>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/mojang.ts#L257" target="_blank" rel="noreferrer">packages/user/mojang.ts:257</a>
</p>


### getSecurityChallenges

```ts
getSecurityChallenges(token: string): Promise<MojangChallenge[]>
```
#### Parameters

- **token**: `string`
#### Return Type

- `Promise<MojangChallenge[]>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/mojang.ts#L375" target="_blank" rel="noreferrer">packages/user/mojang.ts:375</a>
</p>


### hideCape

```ts
hideCape(token: string, signal: AbortSignal): Promise<void>
```
#### Parameters

- **token**: `string`
- **signal**: `AbortSignal`
#### Return Type

- `Promise<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/mojang.ts#L324" target="_blank" rel="noreferrer">packages/user/mojang.ts:324</a>
</p>


### resetSkin

```ts
resetSkin(token: string, signal: AbortSignal): Promise<void>
```
#### Parameters

- **token**: `string`
- **signal**: `AbortSignal`
#### Return Type

- `Promise<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/mojang.ts#L310" target="_blank" rel="noreferrer">packages/user/mojang.ts:310</a>
</p>


### setName

```ts
setName(name: string, token: string, signal: AbortSignal): Promise<MicrosoftMinecraftProfile>
```
#### Parameters

- **name**: `string`
- **token**: `string`
- **signal**: `AbortSignal`
#### Return Type

- `Promise<MicrosoftMinecraftProfile>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/mojang.ts#L213" target="_blank" rel="noreferrer">packages/user/mojang.ts:213</a>
</p>


### setSkin

```ts
setSkin(fileName: string, skin: string | Buffer, variant: "slim" | "classic", token: string, signal: AbortSignal): Promise<MinecraftProfileResponse>
```
#### Parameters

- **fileName**: `string`
- **skin**: `string | Buffer`
- **variant**: `"slim" | "classic"`
- **token**: `string`
- **signal**: `AbortSignal`
#### Return Type

- `Promise<MinecraftProfileResponse>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/mojang.ts#L280" target="_blank" rel="noreferrer">packages/user/mojang.ts:280</a>
</p>


### showCape

```ts
showCape(capeId: string, token: string, signal: AbortSignal): Promise<MicrosoftMinecraftProfile>
```
#### Parameters

- **capeId**: `string`
- **token**: `string`
- **signal**: `AbortSignal`
#### Return Type

- `Promise<MicrosoftMinecraftProfile>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/mojang.ts#L338" target="_blank" rel="noreferrer">packages/user/mojang.ts:338</a>
</p>


### submitSecurityChallenges

```ts
submitSecurityChallenges(answers: MojangChallengeResponse[], token: string): Promise<void>
```
#### Parameters

- **answers**: `MojangChallengeResponse[]`
- **token**: `string`
#### Return Type

- `Promise<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/mojang.ts#L390" target="_blank" rel="noreferrer">packages/user/mojang.ts:390</a>
</p>


### verifySecurityLocation

```ts
verifySecurityLocation(token: string, signal: AbortSignal): Promise<boolean>
```
#### Parameters

- **token**: `string`
- **signal**: `AbortSignal`
#### Return Type

- `Promise<boolean>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/mojang.ts#L359" target="_blank" rel="noreferrer">packages/user/mojang.ts:359</a>
</p>


