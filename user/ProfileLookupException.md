# Interface ProfileLookupException

## 🏷️ Properties

### error

```ts
error: "NoPlayerFoundException" | "IllegalArgumentException" | "GeneralException"
```
- statusCode=204 -&gt; error="NoPlayerFound"
- statusCode=400 -&gt; error="IllegalArgumentException" (parsed from body)
- statusCode=other -&gt; error=statusCode.toString()
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/yggdrasil.ts#L61" target="_blank" rel="noreferrer">packages/user/yggdrasil.ts:61</a>
</p>


### errorMessage <Badge type="info" text="optional" />

```ts
errorMessage: string
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/yggdrasil.ts#L62" target="_blank" rel="noreferrer">packages/user/yggdrasil.ts:62</a>
</p>


### statusCode <Badge type="info" text="optional" />

```ts
statusCode: number
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/yggdrasil.ts#L63" target="_blank" rel="noreferrer">packages/user/yggdrasil.ts:63</a>
</p>


### statusMessage <Badge type="info" text="optional" />

```ts
statusMessage: string
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/user/yggdrasil.ts#L64" target="_blank" rel="noreferrer">packages/user/yggdrasil.ts:64</a>
</p>


