# Interface LaunchOption

General launch option, used to generate launch arguments.
## 🏷️ Properties

### accessToken <Badge type="info" text="optional" />

```ts
accessToken: string
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L53" target="_blank" rel="noreferrer">packages/core/launch.ts:53</a>
</p>


### extraClassPaths <Badge type="info" text="optional" />

```ts
extraClassPaths: string[]
```
Add extra classpaths
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L172" target="_blank" rel="noreferrer">packages/core/launch.ts:172</a>
</p>


### extraExecOption <Badge type="info" text="optional" />

```ts
extraExecOption: SpawnOptions
```
Assign the spawn options to the process.

If you try to set ``{ shell: true }``, you might want to make all argument rounded with "".
The ``launch`` function will do it for you, but if you want to spawn process by yourself, remember to do that.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L132" target="_blank" rel="noreferrer">packages/core/launch.ts:132</a>
</p>


### extraJVMArgs <Badge type="info" text="optional" />

```ts
extraJVMArgs: string[]
```
Extra jvm options. This will append after to generated options.
If this is empty, the ``DEFAULT_EXTRA_JVM_ARGS`` will be used.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L117" target="_blank" rel="noreferrer">packages/core/launch.ts:117</a>
</p>


### extraMCArgs <Badge type="info" text="optional" />

```ts
extraMCArgs: string[]
```
Extra program arguments. This will append after to generated options.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L121" target="_blank" rel="noreferrer">packages/core/launch.ts:121</a>
</p>


### features <Badge type="info" text="optional" />

```ts
features: EnabledFeatures
```
Enable features. Not really in used...
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L143" target="_blank" rel="noreferrer">packages/core/launch.ts:143</a>
</p>


### gameIcon <Badge type="info" text="optional" />

```ts
gameIcon: string
```
The full path of launched game icon
Currently, this only supported on MacOS
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L75" target="_blank" rel="noreferrer">packages/core/launch.ts:75</a>
</p>


### gameName <Badge type="info" text="optional" />

```ts
gameName: string
```
The launched game name
Currently, this only supported on MacOS
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L80" target="_blank" rel="noreferrer">packages/core/launch.ts:80</a>
</p>


### gamePath

```ts
gamePath: string
```
The path of parent directory of saves/logs/configs/mods/resourcepacks
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L84" target="_blank" rel="noreferrer">packages/core/launch.ts:84</a>
</p>


### gameProfile <Badge type="info" text="optional" />

```ts
gameProfile: { id: string; name: string }
```
User selected game profile. For game display name &
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L49" target="_blank" rel="noreferrer">packages/core/launch.ts:49</a>
</p>


### ignoreInvalidMinecraftCertificates <Badge type="info" text="optional" />

```ts
ignoreInvalidMinecraftCertificates: boolean
```
Add ``-Dfml.ignoreInvalidMinecraftCertificates=true`` to jvm argument
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L164" target="_blank" rel="noreferrer">packages/core/launch.ts:164</a>
</p>


### ignorePatchDiscrepancies <Badge type="info" text="optional" />

```ts
ignorePatchDiscrepancies: boolean
```
Add ``-Dfml.ignorePatchDiscrepancies=true`` to jvm argument
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L168" target="_blank" rel="noreferrer">packages/core/launch.ts:168</a>
</p>


### isDemo <Badge type="info" text="optional" />

```ts
isDemo: boolean
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L133" target="_blank" rel="noreferrer">packages/core/launch.ts:133</a>
</p>


### javaPath

```ts
javaPath: string
```
The java executable file path. (Not the java home directory!)
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L92" target="_blank" rel="noreferrer">packages/core/launch.ts:92</a>
</p>


### launcherBrand <Badge type="info" text="optional" />

```ts
launcherBrand: string
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L58" target="_blank" rel="noreferrer">packages/core/launch.ts:58</a>
</p>


### launcherName <Badge type="info" text="optional" />

```ts
launcherName: string
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L57" target="_blank" rel="noreferrer">packages/core/launch.ts:57</a>
</p>


### maxMemory <Badge type="info" text="optional" />

```ts
maxMemory: number
```
Min memory, this will add a jvm flag -Xmx to the command result
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L100" target="_blank" rel="noreferrer">packages/core/launch.ts:100</a>
</p>


### minMemory <Badge type="info" text="optional" />

```ts
minMemory: number
```
Min memory, this will add a jvm flag -Xms to the command result
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L96" target="_blank" rel="noreferrer">packages/core/launch.ts:96</a>
</p>


### nativeRoot <Badge type="info" text="optional" />

```ts
nativeRoot: string
```
Native directory. It's .minecraft/versions/&lt;version&gt;/&lt;version&gt;-natives by default.
You can replace this by your self.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L139" target="_blank" rel="noreferrer">packages/core/launch.ts:139</a>
</p>


### platform <Badge type="info" text="optional" />

```ts
platform: Platform
```
The platform of this launch will run. By default, it will fetch the current machine info if this is absent.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L176" target="_blank" rel="noreferrer">packages/core/launch.ts:176</a>
</p>


### prechecks <Badge type="info" text="optional" />

```ts
prechecks: LaunchPrecheck[]
```
The launcher precheck functions. These will run before it run.

This property is only used for ``launch`` function. The ``generateArguments`` function won't use this!
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L188" target="_blank" rel="noreferrer">packages/core/launch.ts:188</a>
</p>


### prependCommand <Badge type="info" text="optional" />

```ts
prependCommand: string | string[]
```
Prepend command before java command.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L125" target="_blank" rel="noreferrer">packages/core/launch.ts:125</a>
</p>


### properties <Badge type="info" text="optional" />

```ts
properties: object
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L55" target="_blank" rel="noreferrer">packages/core/launch.ts:55</a>
</p>


### resolution <Badge type="info" text="optional" />

```ts
resolution: { fullscreen?: true; height?: number; width?: number }
```
Resolution. This will add --height & --width or --fullscreen to the java arguments
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L112" target="_blank" rel="noreferrer">packages/core/launch.ts:112</a>
</p>


### resourcePath <Badge type="info" text="optional" />

```ts
resourcePath: string
```
The path of parent directory of assets/libraries
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L88" target="_blank" rel="noreferrer">packages/core/launch.ts:88</a>
</p>


### server <Badge type="info" text="optional" />

```ts
server: { ip: string; port?: number }
```
Directly launch to a server
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L108" target="_blank" rel="noreferrer">packages/core/launch.ts:108</a>
</p>


### spawn <Badge type="info" text="optional" />

```ts
spawn: (command: string, args?: readonly string[], options?: SpawnOptions) => ChildProcess
```
The spawn process function. Used for spawn the java process at the end.

By default, it will be the spawn function from "child_process" module. You can use this option to change the 3rd party spawn like [cross-spawn](https://www.npmjs.com/package/cross-spawn)
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L195" target="_blank" rel="noreferrer">packages/core/launch.ts:195</a>
</p>


### useHashAssetsIndex <Badge type="info" text="optional" />

```ts
useHashAssetsIndex: boolean
```
Use hash assets index. This will use the assets index hash as the assets index name.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L180" target="_blank" rel="noreferrer">packages/core/launch.ts:180</a>
</p>


### userType <Badge type="info" text="optional" />

```ts
userType: "mojang" | "legacy"
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L54" target="_blank" rel="noreferrer">packages/core/launch.ts:54</a>
</p>


### version

```ts
version: string | ResolvedVersion
```
The version of launched Minecraft. Can be either resolved version or version string
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L104" target="_blank" rel="noreferrer">packages/core/launch.ts:104</a>
</p>


### versionName <Badge type="info" text="optional" />

```ts
versionName: string
```
Overwrite the version name of the current version.
If this is absent, it will use version name from resolved version.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L63" target="_blank" rel="noreferrer">packages/core/launch.ts:63</a>
</p>


### versionType <Badge type="info" text="optional" />

```ts
versionType: string
```
Overwrite the version type of the current version.
If this is absent, it will use version type from resolved version.

Some people use this to show fantastic message on the welcome screen.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L70" target="_blank" rel="noreferrer">packages/core/launch.ts:70</a>
</p>


### yggdrasilAgent <Badge type="info" text="optional" />

```ts
yggdrasilAgent: { jar: string; prefetched?: string; server: string }
```
Support yushi's yggdrasil agent https://github.com/to2mbn/authlib-injector/wiki
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L147" target="_blank" rel="noreferrer">packages/core/launch.ts:147</a>
</p>


