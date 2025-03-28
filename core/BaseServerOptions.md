# Interface BaseServerOptions

## 🏷️ Properties

### extraExecOption <Badge type="info" text="optional" />

```ts
extraExecOption: SpawnOptions
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L432" target="_blank" rel="noreferrer">packages/core/launch.ts:432</a>
</p>


### extraJVMArgs <Badge type="info" text="optional" />

```ts
extraJVMArgs: string[]
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L430" target="_blank" rel="noreferrer">packages/core/launch.ts:430</a>
</p>


### extraMCArgs <Badge type="info" text="optional" />

```ts
extraMCArgs: string[]
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L431" target="_blank" rel="noreferrer">packages/core/launch.ts:431</a>
</p>


### javaPath

```ts
javaPath: string
```
Java executable.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L423" target="_blank" rel="noreferrer">packages/core/launch.ts:423</a>
</p>


### maxMemory <Badge type="info" text="optional" />

```ts
maxMemory: number
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L429" target="_blank" rel="noreferrer">packages/core/launch.ts:429</a>
</p>


### minMemory <Badge type="info" text="optional" />

```ts
minMemory: number
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L428" target="_blank" rel="noreferrer">packages/core/launch.ts:428</a>
</p>


### nogui <Badge type="info" text="optional" />

```ts
nogui: boolean
```
No gui for the server launch
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L427" target="_blank" rel="noreferrer">packages/core/launch.ts:427</a>
</p>


### prependCommand <Badge type="info" text="optional" />

```ts
prependCommand: string | string[]
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L434" target="_blank" rel="noreferrer">packages/core/launch.ts:434</a>
</p>


### spawn <Badge type="info" text="optional" />

```ts
spawn: (command: string, args?: readonly string[], options?: SpawnOptions) => ChildProcess
```
The spawn process function. Used for spawn the java process at the end. By default, it will be the spawn function from "child_process" module. You can use this option to change the 3rd party spawn like [cross-spawn](https://www.npmjs.com/package/cross-spawn)
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L439" target="_blank" rel="noreferrer">packages/core/launch.ts:439</a>
</p>


