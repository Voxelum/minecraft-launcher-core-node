# Class YggdrasilThirdPartyClient

## 🏭 Constructors

### constructor

```ts
new YggdrasilThirdPartyClient(api: string, options: YggdrasilClientOptions): YggdrasilThirdPartyClient
```
Create thirdparty (authlib-injector) style client
#### Parameters

- **api**: `string`
The api url following https://github.com/yushijinhun/authlib-injector/wiki/Yggdrasil-%E6%9C%8D%E5%8A%A1%E7%AB%AF%E6%8A%80%E6%9C%AF%E8%A7%84%E8%8C%83
- **options**: `YggdrasilClientOptions`
#### Return Type

- `YggdrasilThirdPartyClient`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/yggdrasil.ts#L234" target="_blank" rel="noreferrer">packages/user/yggdrasil.ts:234</a>
</p>


## 🏷️ Properties

### api <Badge type="tip" text="public" />

```ts
api: string
```
The official-like api endpoint
*Inherited from: `YggdrasilClient.api`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/yggdrasil.ts#L101" target="_blank" rel="noreferrer">packages/user/yggdrasil.ts:101</a>
</p>


### dispatcher <Badge type="warning" text="protected" /> <Badge type="info" text="optional" />

```ts
dispatcher: Dispatcher
```
*Inherited from: `YggdrasilClient.dispatcher`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/yggdrasil.ts#L94" target="_blank" rel="noreferrer">packages/user/yggdrasil.ts:94</a>
</p>


### headers <Badge type="warning" text="protected" />

```ts
headers: Record<string, string>
```
*Inherited from: `YggdrasilClient.headers`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/yggdrasil.ts#L95" target="_blank" rel="noreferrer">packages/user/yggdrasil.ts:95</a>
</p>


### profileApi <Badge type="tip" text="public" />

```ts
profileApi: string
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/yggdrasil.ts#L226" target="_blank" rel="noreferrer">packages/user/yggdrasil.ts:226</a>
</p>


### textureApi <Badge type="tip" text="public" />

```ts
textureApi: string
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/yggdrasil.ts#L227" target="_blank" rel="noreferrer">packages/user/yggdrasil.ts:227</a>
</p>


## 🔧 Methods

### invalidate

```ts
invalidate(accessToken: string, clientToken: string, signal: AbortSignal): Promise<boolean>
```
#### Parameters

- **accessToken**: `string`
- **clientToken**: `string`
- **signal**: `AbortSignal`
#### Return Type

- `Promise<boolean>`

*Inherited from: `YggdrasilClient.invalidate`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/yggdrasil.ts#L120" target="_blank" rel="noreferrer">packages/user/yggdrasil.ts:120</a>
</p>


### login

```ts
login(__namedParameters: Object, signal: AbortSignal): Promise<YggrasilAuthentication>
```
#### Parameters

- **__namedParameters**: `Object`
- **signal**: `AbortSignal`
#### Return Type

- `Promise<YggrasilAuthentication>`

*Inherited from: `YggdrasilClient.login`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/yggdrasil.ts#L133" target="_blank" rel="noreferrer">packages/user/yggdrasil.ts:133</a>
</p>


### lookup

```ts
lookup(uuid: string, unsigned: boolean= true, signal: AbortSignal): Promise<GameProfileWithProperties>
```
#### Parameters

- **uuid**: `string`
- **unsigned**: `boolean`
- **signal**: `AbortSignal`
#### Return Type

- `Promise<GameProfileWithProperties>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/yggdrasil.ts#L246" target="_blank" rel="noreferrer">packages/user/yggdrasil.ts:246</a>
</p>


### refresh

```ts
refresh(__namedParameters: Object, signal: AbortSignal): Promise<YggrasilAuthentication>
```
#### Parameters

- **__namedParameters**: `Object`
- **signal**: `AbortSignal`
#### Return Type

- `Promise<YggrasilAuthentication>`

*Inherited from: `YggdrasilClient.refresh`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/yggdrasil.ts#L160" target="_blank" rel="noreferrer">packages/user/yggdrasil.ts:160</a>
</p>


### setTexture

```ts
setTexture(options: SetTextureOption, signal: AbortSignal): Promise<void>
```
#### Parameters

- **options**: `SetTextureOption`
- **signal**: `AbortSignal`
#### Return Type

- `Promise<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/yggdrasil.ts#L276" target="_blank" rel="noreferrer">packages/user/yggdrasil.ts:276</a>
</p>


### validate

```ts
validate(accessToken: string, clientToken: string, signal: AbortSignal): Promise<boolean>
```
#### Parameters

- **accessToken**: `string`
- **clientToken**: `string`
- **signal**: `AbortSignal`
#### Return Type

- `Promise<boolean>`

*Inherited from: `YggdrasilClient.validate`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/yggdrasil.ts#L106" target="_blank" rel="noreferrer">packages/user/yggdrasil.ts:106</a>
</p>


