# Interface InstallProfile

## 🏷️ Properties

### data <Badge type="info" text="optional" />

```ts
data: Object
```
The processor shared variables. The key is the name of variable to replace.

The value of client/server is the value of the variable.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/profile.ts#L52" target="_blank" rel="noreferrer">packages/installer/profile.ts:52</a>
</p>


### json

```ts
json: string
```
The version json path
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/profile.ts#L38" target="_blank" rel="noreferrer">packages/installer/profile.ts:38</a>
</p>


### libraries

```ts
libraries: NormalLibrary[]
```
The required install profile libraries
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/profile.ts#L60" target="_blank" rel="noreferrer">packages/installer/profile.ts:60</a>
</p>


### minecraft

```ts
minecraft: string
```
The minecraft version
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/profile.ts#L46" target="_blank" rel="noreferrer">packages/installer/profile.ts:46</a>
</p>


### path

```ts
path: string
```
The maven artifact name: &lt;org&gt;:&lt;artifact-id&gt;:&lt;version&gt;
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/profile.ts#L42" target="_blank" rel="noreferrer">packages/installer/profile.ts:42</a>
</p>


### processors <Badge type="info" text="optional" />

```ts
processors: PostProcessor[]
```
The post processor. Which require java to run.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/profile.ts#L56" target="_blank" rel="noreferrer">packages/installer/profile.ts:56</a>
</p>


### profile

```ts
profile: string
```
The type of this installation, like "forge"
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/profile.ts#L30" target="_blank" rel="noreferrer">packages/installer/profile.ts:30</a>
</p>


### spec <Badge type="info" text="optional" />

```ts
spec: number
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/profile.ts#L26" target="_blank" rel="noreferrer">packages/installer/profile.ts:26</a>
</p>


### version

```ts
version: string
```
The version of this installation
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/profile.ts#L34" target="_blank" rel="noreferrer">packages/installer/profile.ts:34</a>
</p>


### versionInfo <Badge type="info" text="optional" />

```ts
versionInfo: Version
```
Legacy format
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/profile.ts#L64" target="_blank" rel="noreferrer">packages/installer/profile.ts:64</a>
</p>


