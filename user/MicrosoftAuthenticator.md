# Class MicrosoftAuthenticator

The microsoft authenticator for Minecraft (Xbox) account.
## 🏭 Constructors

### constructor

```ts
new MicrosoftAuthenticator(dispatcher: Dispatcher): MicrosoftAuthenticator
```
#### Parameters

- **dispatcher**: `Dispatcher`
#### Return Type

- `MicrosoftAuthenticator`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/microsoft.ts#L52" target="_blank" rel="noreferrer">packages/user/microsoft.ts:52</a>
</p>


## 🏷️ Properties

### dispatcher <Badge type="danger" text="private" /> <Badge type="info" text="optional" />

```ts
dispatcher: Dispatcher
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/microsoft.ts#L52" target="_blank" rel="noreferrer">packages/user/microsoft.ts:52</a>
</p>


## 🔧 Methods

### acquireXBoxToken

```ts
acquireXBoxToken(oauthAccessToken: string, signal: AbortSignal): Promise<Object>
```
Acquire both Minecraft and xbox token and xbox game profile.
You can use the xbox token to login Minecraft by [loginMinecraftWithXBox](#loginMinecraftWithXBox).

This method is the composition of calling
- [authenticateXboxLive](#authenticateXboxLive)
- [authorizeXboxLive](#authorizeXboxLive) to ``rp://api.minecraftservices.com/``
- [authorizeXboxLive](#authorizeXboxLive) to ``http://xboxlive.com``
- [getXboxGameProfile](#getXboxGameProfile)

You can call them individually if you want a more detailed control.
#### Parameters

- **oauthAccessToken**: `string`
The microsoft access token
- **signal**: `AbortSignal`
The abort signal
#### Return Type

- `Promise<Object>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/microsoft.ts#L164" target="_blank" rel="noreferrer">packages/user/microsoft.ts:164</a>
</p>


### authenticateXboxLive

```ts
authenticateXboxLive(oauthAccessToken: string, signal: AbortSignal): Promise<XBoxResponse>
```
Authenticate with xbox live by ms oauth access token
#### Parameters

- **oauthAccessToken**: `string`
The oauth access token
- **signal**: `AbortSignal`
#### Return Type

- `Promise<XBoxResponse>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/microsoft.ts#L58" target="_blank" rel="noreferrer">packages/user/microsoft.ts:58</a>
</p>


### authorizeXboxLive

```ts
authorizeXboxLive(xblResponseToken: string, relyingParty: "rp://api.minecraftservices.com/" | "http://xboxlive.com"= 'rp://api.minecraftservices.com/', signal: AbortSignal): Promise<XBoxResponse>
```
Authorize the xbox live. It will get the xsts token in response.
#### Parameters

- **xblResponseToken**: `string`
The [Token](#Token)
- **relyingParty**: `"rp://api.minecraftservices.com/" | "http://xboxlive.com"`
- **signal**: `AbortSignal`
#### Return Type

- `Promise<XBoxResponse>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/microsoft.ts#L90" target="_blank" rel="noreferrer">packages/user/microsoft.ts:90</a>
</p>


### getXboxGameProfile

```ts
getXboxGameProfile(xuid: string, uhs: string, xstsToken: string, signal: AbortSignal): Promise<XBoxGameProfileResponse>
```
Get xbox user profile, including **username** and **avatar**.

You can find the parameters from the [XBoxResponse](XBoxResponse).
#### Parameters

- **xuid**: `string`
The ``xuid`` in a [DisplayClaims](#DisplayClaims)
- **uhs**: `string`
The ``uhs`` in a [DisplayClaims](#DisplayClaims)
- **xstsToken**: `string`
The [Token](#Token)
- **signal**: `AbortSignal`
#### Return Type

- `Promise<XBoxGameProfileResponse>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/microsoft.ts#L127" target="_blank" rel="noreferrer">packages/user/microsoft.ts:127</a>
</p>


### loginMinecraftWithXBox

```ts
loginMinecraftWithXBox(uhs: string, xstsToken: string, signal: AbortSignal): Promise<MinecraftAuthResponse>
```
This will return the response with Minecraft access token!

This access token allows us to launch the game, but, we haven't actually checked if the account owns the game. Everything until here works with a normal Microsoft account!
#### Parameters

- **uhs**: `string`
uhs from [XBoxResponse](XBoxResponse) of [acquireXBoxToken](#acquireXBoxToken)
- **xstsToken**: `string`
You need to get this token from [acquireXBoxToken](#acquireXBoxToken)
- **signal**: `AbortSignal`
#### Return Type

- `Promise<MinecraftAuthResponse>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/microsoft.ts#L180" target="_blank" rel="noreferrer">packages/user/microsoft.ts:180</a>
</p>


