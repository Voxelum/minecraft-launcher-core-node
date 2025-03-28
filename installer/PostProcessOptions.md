# Interface PostProcessOptions

## 🏷️ Properties

### handler <Badge type="info" text="optional" />

```ts
handler: (postProcessor: PostProcessor) => Promise<boolean>
```
Custom handlers to handle the post processor
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/profile.ts#L72" target="_blank" rel="noreferrer">packages/installer/profile.ts:72</a>
</p>


### java <Badge type="info" text="optional" />

```ts
java: string
```
The java exectable path. It will use ``java`` by default.
*Inherited from: `SpawnJavaOptions.java`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/utils.ts#L43" target="_blank" rel="noreferrer">packages/installer/utils.ts:43</a>
</p>


### onPostProcessFailed <Badge type="info" text="optional" />

```ts
onPostProcessFailed: (proc: PostProcessor, jar: string, classPaths: string, mainClass: string, args: string[], error: unknown) => void
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/profile.ts#L74" target="_blank" rel="noreferrer">packages/installer/profile.ts:74</a>
</p>


### onPostProcessSuccess <Badge type="info" text="optional" />

```ts
onPostProcessSuccess: (proc: PostProcessor, jar: string, classPaths: string, mainClass: string, args: string[]) => void
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/profile.ts#L75" target="_blank" rel="noreferrer">packages/installer/profile.ts:75</a>
</p>


### spawn <Badge type="info" text="optional" />

```ts
spawn: (command: string, args?: readonly string[], options?: SpawnOptions) => ChildProcess
```
The spawn process function. Used for spawn the java process at the end.

By default, it will be the spawn function from "child_process" module. You can use this option to change the 3rd party spawn like [cross-spawn](https://www.npmjs.com/package/cross-spawn)
*Inherited from: `SpawnJavaOptions.spawn`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/utils.ts#L50" target="_blank" rel="noreferrer">packages/installer/utils.ts:50</a>
</p>


