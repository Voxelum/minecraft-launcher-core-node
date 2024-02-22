# Launcher Core Module

[![npm version](https://img.shields.io/npm/v/@xmcl/core.svg)](https://www.npmjs.com/package/@xmcl/core)
[![Downloads](https://img.shields.io/npm/dm/@xmcl/core.svg)](https://npmjs.com/@xmcl/core)
[![Install size](https://packagephobia.now.sh/badge?p=@xmcl/core)](https://packagephobia.now.sh/result?p=@xmcl/core)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Build/badge.svg)](https://github.com/Voxelum/minecraft-launcher-core-node/actions?query=workflow%3ABuild)

Provide the core function to parse Minecraft version and launch.

## Usage

### Parse Version JSON 

Parse minecraft version as a resolved version, which is used for launching process. You can also read version info from it if you want.

```ts
import { Version } from "@xmcl/core";
const minecraftLocation: string;
const minecraftVersionId: string;

const resolvedVersion: ResolvedVersion = await Version.parse(minecraftLocation, minecraftVersionId);
```

### Diagnose

Get the report of the version. It can check if version missing assets/libraries.

```ts
import { MinecraftLocation, diagnose, ResolvedVersion } from "@xmcl/core";

const minecraft: MinecraftLocation;
const version: string; // version string like 1.13
const resolvedVersion: ResolvedVersion = await Version.parse(minecraft, version);

const report: MinecraftIssueReport = await diagnose(resolvedVersion.id, resolvedVersion.minecraftDirectory);

const issues: MinecraftIssues[] = report.issues;

for (let issue of issues) {
    switch (issue.role) {
        case "minecraftJar": // your jar has problem
        case "versionJson": // your json has problem
        case "library": // your lib might be missing or corrupted
        case "assets": // some assets are missing or corrupted
        // and so on
    }
}
```


### Launch Game

Launch minecraft from a version:

```ts
import { launch } from "@xmcl/core"
const version: string; // full version id, like 1.13, or your forge version like, 1.13-forge-<someForgeVersion>
const javaPath: string; // java executable path
const gamePath: string; // .minecraft path
const proc: Promise<ChildProcess> = launch({ gamePath, javaPath, version });
```

Detach from the parent process. So your launcher's exit/crash won't affact the Minecraft running.

```ts
const proc: Promise<ChildProcess> = Launcher.launch({ gamePath, javaPath, version, extraExecOption: { detached: true } });
```

## 🧾 Classes

<div class="definition-grid class"><a href="core/MinecraftFolder">MinecraftFolder</a><a href="core/ResolvedLibrary">ResolvedLibrary</a></div>

## 🤝 Interfaces

<div class="definition-grid interface"><a href="core/AssetIndexIssue">AssetIndexIssue</a><a href="core/AssetIssue">AssetIssue</a><a href="core/BadVersionJsonError">BadVersionJsonError</a><a href="core/BaseServerOptions">BaseServerOptions</a><a href="core/CircularDependenciesError">CircularDependenciesError</a><a href="core/CorruptedVersionJarError">CorruptedVersionJarError</a><a href="core/CorruptedVersionJsonError">CorruptedVersionJsonError</a><a href="core/DiagnoseOptions">DiagnoseOptions</a><a href="core/EnabledFeatures">EnabledFeatures</a><a href="core/Issue">Issue</a><a href="core/JavaVersion">JavaVersion</a><a href="core/LaunchOption">LaunchOption</a><a href="core/LaunchPrecheck">LaunchPrecheck</a><a href="core/LibraryInfo">LibraryInfo</a><a href="core/LibraryIssue">LibraryIssue</a><a href="core/MinecraftIssueReport">MinecraftIssueReport</a><a href="core/MinecraftJarIssue">MinecraftJarIssue</a><a href="core/MinecraftProcessWatcher">MinecraftProcessWatcher</a><a href="core/MinecraftServerOptions">MinecraftServerOptions</a><a href="core/MissingLibrariesError">MissingLibrariesError</a><a href="core/MissingVersionJsonError">MissingVersionJsonError</a><a href="core/Platform">Platform</a><a href="core/ResolvedVersion">ResolvedVersion</a><a href="core/ServerOptions">ServerOptions</a><a href="core/Version">Version</a><a href="core/VersionJsonIssue">VersionJsonIssue</a></div>

## 🗃️ Namespaces

<div class="definition-grid namespace"><a href="core/LaunchPrecheck-1">LaunchPrecheck</a><a href="core/LibraryInfo-1">LibraryInfo</a><a href="core/MinecraftPath">MinecraftPath</a><a href="core/Version-1">Version</a></div>

## 🏭 Functions

### createMinecraftProcessWatcher

```ts
createMinecraftProcessWatcher(process: ChildProcess, emitter: EventEmitter= ...): MinecraftProcessWatcher
```
Create a process watcher for a minecraft process.

It will watch the stdout and the error event of the process to detect error and minecraft state.
#### Parameters

- **process**: `ChildProcess`
The Minecraft process
- **emitter**: `EventEmitter`
The event emitter which will emit usefule event
#### Return Type

- `MinecraftProcessWatcher`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L491" target="_blank" rel="noreferrer">packages/core/launch.ts:491</a>
</p>


### diagnose

```ts
diagnose(version: string, minecraftLocation: MinecraftLocation, options: DiagnoseOptions): Promise<MinecraftIssueReport>
```
Diagnose the version. It will check the version json/jar, libraries and assets.
#### Parameters

- **version**: `string`
The version id string
- **minecraftLocation**: `MinecraftLocation`
- **options**: `DiagnoseOptions`
#### Return Type

- `Promise<MinecraftIssueReport>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/diagnose.ts#L156" target="_blank" rel="noreferrer">packages/core/diagnose.ts:156</a>
</p>


### diagnoseAssetIndex

```ts
diagnoseAssetIndex(resolvedVersion: ResolvedVersion, minecraft: MinecraftFolder): Promise<AssetIndexIssue | undefined>
```
#### Parameters

- **resolvedVersion**: `ResolvedVersion`
- **minecraft**: `MinecraftFolder`
#### Return Type

- `Promise<AssetIndexIssue | undefined>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/diagnose.ts#L280" target="_blank" rel="noreferrer">packages/core/diagnose.ts:280</a>
</p>


### diagnoseAssets

```ts
diagnoseAssets(assetObjects: Record<string, Object>, minecraft: MinecraftFolder, options: DiagnoseOptions): Promise<AssetIssue[]>
```
Diagnose assets currently installed.
#### Parameters

- **assetObjects**: `Record<string, Object>`
The assets object metadata to check
- **minecraft**: `MinecraftFolder`
The minecraft location
- **options**: `DiagnoseOptions`
#### Return Type

- `Promise<AssetIssue[]>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/diagnose.ts#L214" target="_blank" rel="noreferrer">packages/core/diagnose.ts:214</a>
</p>


### diagnoseFile

```ts
diagnoseFile(__namedParameters: Object, options: DiagnoseOptions): Promise<undefined | Object>
```
Diagnose a single file by a certain checksum algorithm. By default, this use sha1
#### Parameters

- **__namedParameters**: `Object`
- **options**: `DiagnoseOptions`
#### Return Type

- `Promise<undefined | Object>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/diagnose.ts#L119" target="_blank" rel="noreferrer">packages/core/diagnose.ts:119</a>
</p>


### diagnoseJar

```ts
diagnoseJar(resolvedVersion: ResolvedVersion, minecraft: MinecraftFolder, options: DiagnoseOptions & Object): Promise<MinecraftJarIssue | undefined>
```
#### Parameters

- **resolvedVersion**: `ResolvedVersion`
- **minecraft**: `MinecraftFolder`
- **options**: `DiagnoseOptions & Object`
#### Return Type

- `Promise<MinecraftJarIssue | undefined>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/diagnose.ts#L290" target="_blank" rel="noreferrer">packages/core/diagnose.ts:290</a>
</p>


### diagnoseLibraries

```ts
diagnoseLibraries(resolvedVersion: ResolvedVersion, minecraft: MinecraftFolder, options: DiagnoseOptions): Promise<LibraryIssue[]>
```
Diagnose all libraries presented in this resolved version.
#### Parameters

- **resolvedVersion**: `ResolvedVersion`
The resolved version to check
- **minecraft**: `MinecraftFolder`
The minecraft location
- **options**: `DiagnoseOptions`
#### Return Type

- `Promise<LibraryIssue[]>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/diagnose.ts#L251" target="_blank" rel="noreferrer">packages/core/diagnose.ts:251</a>
</p>


### generateArguments

```ts
generateArguments(options: LaunchOption): Promise<string[]>
```
Generate the arguments array by options. This function is useful if you want to launch the process by yourself.

This function will **NOT** check if the runtime libs are completed, and **WONT'T** check or extract native libs.

If you want to ensure native. Please see [checkNatives](#checkNatives).
#### Parameters

- **options**: `LaunchOption`
The launch options.
#### Return Type

- `Promise<string[]>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L605" target="_blank" rel="noreferrer">packages/core/launch.ts:605</a>
</p>


### generateArgumentsServer

```ts
generateArgumentsServer(options: MinecraftServerOptions | ServerOptions): Promise<string[]>
```
Generate the argument for server
#### Parameters

- **options**: `MinecraftServerOptions | ServerOptions`
#### Return Type

- `Promise<string[]>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L569" target="_blank" rel="noreferrer">packages/core/launch.ts:569</a>
</p>


### getPlatform

```ts
getPlatform(): Platform
```
Get Minecraft style platform info. (Majorly used to enable/disable native dependencies)
#### Return Type

- `Platform`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/platform.ts#L24" target="_blank" rel="noreferrer">packages/core/platform.ts:24</a>
</p>


### launch

```ts
launch(options: LaunchOption): Promise<ChildProcess>
```
Launch the minecraft as a child process. This function use spawn to create child process. To use an alternative way, see function generateArguments.

By default, it will use the ``LauncherPrecheck.Default`` to pre-check:
- It will also check if the runtime libs are completed, and will extract native libs if needed.
- It might throw exception when the version jar is missing/checksum not matched.
- It might throw if the libraries/natives are missing.

If you DON'T want such precheck, and you want to change it. You can assign the ``prechecks`` property in launch

````ts
launch({ ...otherOptions, prechecks: yourPrechecks });
````
#### Parameters

- **options**: `LaunchOption`
The detail options for this launching.
#### Return Type

- `Promise<ChildProcess>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L543" target="_blank" rel="noreferrer">packages/core/launch.ts:543</a>
</p>


### launchServer

```ts
launchServer(options: MinecraftServerOptions | ServerOptions): Promise<ChildProcess>
```
#### Parameters

- **options**: `MinecraftServerOptions | ServerOptions`
#### Return Type

- `Promise<ChildProcess>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L427" target="_blank" rel="noreferrer">packages/core/launch.ts:427</a>
</p>



## 🏷️ Variables

### DEFAULT_EXTRA_JVM_ARGS <Badge type="tip" text="const" />

```ts
DEFAULT_EXTRA_JVM_ARGS: readonly string[] = ...
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/launch.ts#L23" target="_blank" rel="noreferrer">packages/core/launch.ts:23</a>
</p>



## ⏩ Type Aliases

### MinecraftIssues

```ts
MinecraftIssues: LibraryIssue | MinecraftJarIssue | VersionJsonIssue | AssetIssue | AssetIndexIssue
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/diagnose.ts#L36" target="_blank" rel="noreferrer">packages/core/diagnose.ts:36</a>
</p>


### MinecraftLocation

```ts
MinecraftLocation: MinecraftFolder | string
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/folder.ts#L98" target="_blank" rel="noreferrer">packages/core/folder.ts:98</a>
</p>


### VersionParseError

```ts
VersionParseError: (BadVersionJsonError | CorruptedVersionJsonError | MissingVersionJsonError | CircularDependenciesError) & Error | Error
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/core/version.ts#L140" target="_blank" rel="noreferrer">packages/core/version.ts:140</a>
</p>



