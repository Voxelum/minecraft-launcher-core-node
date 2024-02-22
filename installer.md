# Installer Module

[![npm version](https://img.shields.io/npm/v/@xmcl/installer.svg)](https://www.npmjs.com/package/@xmcl/installer)
[![Downloads](https://img.shields.io/npm/dm/@xmcl/installer.svg)](https://npmjs.com/@xmcl/installer)
[![Install size](https://packagephobia.now.sh/badge?p=@xmcl/installer)](https://packagephobia.now.sh/result?p=@xmcl/installer)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Build/badge.svg)](https://github.com/Voxelum/minecraft-launcher-core-node/actions?query=workflow%3ABuild)

Provide functions to install Minecraft client, libraries, and assets.

## Usage

### Install Minecraft

Fully install vanilla minecraft client including assets and libs.

```ts
import { getVersionList, MinecraftVersion, install } from "@xmcl/installer";
import { MinecraftLocation } from "@xmcl/core";

const minecraft: MinecraftLocation;
const list: MinecraftVersion[] = (await getVersionList()).versions;
const aVersion: MinecraftVersion = list[0]; // i just pick the first version in list here
await install(aVersion, minecraft);
```

Just install libraries:

```ts
import { installLibraries } from "@xmcl/installer";
import { ResolvedVersion, MinecraftLocation, Version } from "@xmcl/core";

const minecraft: MinecraftLocation;
const version: string; // version string like 1.13
const resolvedVersion: ResolvedVersion = await Version.parse(minecraft, version);
await installLibraries(resolvedVersion);
```

Just install assets:

```ts
import { installAssets } from "@xmcl/installer";
import { MinecraftLocation, ResolvedVersion, Version } from "@xmcl/core";

const minecraft: MinecraftLocation;
const version: string; // version string like 1.13
const resolvedVersion: ResolvedVersion = await Version.parse(minecraft, version);
await installAssets(resolvedVersion);
```

Just ensure all assets and libraries are installed:

```ts
import { installDependencies } from "@xmcl/installer";
import { MinecraftLocation, ResolvedVersion, Version } from "@xmcl/core";

const minecraft: MinecraftLocation;
const version: string; // version string like 1.13
const resolvedVersion: ResolvedVersion = await Version.parse(minecraft, version);
await installDependencies(resolvedVersion);
```

### Limit the concurrency of installation

The library is using undici as the backbone of http request. It's a very fast http client. But it's also very aggressive. It will create a lot of connections to the server. If you want to limit the concurrency of the installation, you want to create your own undici `Dispatcher` to handle the request.

```ts
import { Dispatcher, Agent } from "undici";

const agent = new Agent({
    connection: 16 // only 16 connection (socket) we should create at most
    // you can have other control here.
});

await installAssets(resolvedVersion, { 
  agent: { // notice this is the DownloadAgent from `@xmcl/file-transfer`
    dispatcher: agent // this is the undici Dispatcher option
  }
});
```

There are other type of `Dispatcher`, like `Pool`, `Client`, `ProxyAgent`. You can read undici document for more information.

### Progress Moniting on Installation

Most install function has a corresponding task function. For example, `install` function has the function name `installTask` which is the task version monitor the progress of install.

Here is the example of just moniting the install task overall progress: 

```ts
// suppose you have define such functions to update UI
declare function updateTaskProgress(task: Task<any>, progress: number, total: number): void;
declare function setTaskToFail(task: Task<any>): void;
declare function setTaskToSuccess(task: Task<any>): void;
declare function trackTask(task: Task<any>): void;

const installAllTask: Task<ResolvedVersion> = installTask(versionMetadata, mcLocation);
await installAllTask.startAndWait({
    onStart(task: Task<any>) {
        // a task start
        // task.path show the path
        // task.name is the name
        trackTask(task)
    },
    onUpdate(task: Task<any>, chunkSize: number) {
        // a task update
        // the chunk size usually the buffer size
        // you can use this to track download speed

        // you can track this specific task progress
        updateTaskProgress(task, task.progress, task.total);

        // or you can update the root task by
        updateTaskProgress(task, installAllTask.progress, installAllTask.total);
    },
    onFailed(task: Task<any>, error: any) {
        // on a task fail
        setTaskToFail(task);
    },
    onSucceed(task: Task<any>, result: any) {
        // on task success
        setTaskToSuccess(task);
    },
    // on task is paused/resumed/cancelled
    onPaused(task: Task<any>) {
    },
    onResumed(task: Task<any>) {
    },
    onCancelled(task: Task<any>) {
    },
});

```

The task is designed to organize the all the works in a tree like structure.

The `installTask` has such parent/child structure

- install
  - version
    - json
    - jar
  - dependencies
    - assets
      - assetsJson
      - asset
    - libraries
      - library

To generally display this tree in UI. You can identify the task by its `path`.

```ts
function updateTaskUI(task: Task<any>, progress: number, total: number) {
    // you can use task.path as identifier
    // and update the task on UI
    const path = task.path;
    // the path can be something like `install.version.json`
}
```

Or you can use your own identifier like uuid:

```ts
// you customize function to make task to a user reacable string to display in UI
declare function getTaskName(task: Task<any>): string;

function runTask(rootTask: Task<any>) {
    // your own id for this root task
    const uid = uuid();
    await rootTask.startAndWait({
        onStart(task: Task<any>) {
            // tell ui that a task with such name started
            // the task id is a number id from 0
            trackTask(`${uid}.${task.id}`, getTaskName(task));
        },
        onUpdate(task: Task<any>, chunkSize: number) {
            // update the total progress 
            updateTaskProgress(`${uid}.${task.id}`, installAllTask.progress, installAllTask.total);
        },
        onStart(task: Task<any>) {
            // tell ui this task ended
            endTask(`${uid}.${task.id}`);
        },
    });
}

```

### Install Library/Assets with Customized Host

To swap the library to your self-host or other customized host, you can assign the `libraryHost` field in options.

For example, if you want to download the library `commons-io:commons-io:2.5` from your self hosted server, you can have

```ts
// the example for call `installLibraries`
// this option will also work for other functions involving libraries like `install`, `installDependencies`.
await installLibraries(resolvedVersion, {
    libraryHost(library: ResolvedLibrary) {
        if (library.name === "commons-io:commons-io:2.5") {
            // the downloader will first try the first url in the array
            // if this failed, it will try the 2nd.
            // if it's still failed, it will try original url
            return ["https://your-host.org/the/path/to/the/jar", "your-sencodary-url"];
            // if you just have one url
            // just return a string here...
        }
        // return undefined if you don't want to change lib url
        return undefined;
    },
    mavenHost: ['https://www.your-other-maven.org'], // you still can use this to add other maven
});

// it will first try you libraryHost url and then try mavenHost url.
```

To swap the assets host, you can just assign the assets host url to the options

```ts
await installAssets(resolvedVersion, {
    assetsHost: "https://www.your-url/assets"
});
```

The assets host should accept the get asset request like `GET https://www.your-url/assets/<hash-head>/<hash>`, where `hash-head` is the first two char in `<hash>`. The `<hash>` is the sha1 of the asset. 

### Install Forge

Get the forge version info and install forge from it. 

```ts
import { installForge, getForgeVersionList, ForgeVersionList, ForgeVersion } from "@xmcl/installer";
import { MinecraftLocation } from "@xmcl/core";

const list: ForgeVersionList = await getForgeVersionList();
const minecraftLocation: MinecraftLocation;
const mcversion = page.mcversion; // mc version
const firstVersionOnPage: ForgeVersion = page.versions[0];
await installForge(firstVersionOnPage, minecraftLocation);
```

If you know forge version and minecraft version. You can directly do such:

```ts
import { installForge } from "@xmcl/installer";

const forgeVersion = 'a-forge-version'; // like 31.1.27
await installForge({ version: forgeVersion, mcversion: '1.15.2' }, minecraftLocation);
```

Notice that this installation doesn't ensure full libraries installation.
Please run `installDependencies` afther that.

The new 1.13 forge installation process requires java to run. 
Either you have `java` executable in your environment variable PATH,
or you can assign java location by `installForge(forgeVersionMeta, minecraftLocation, { java: yourJavaExecutablePath });`.

If you use this auto installation process to install forge, please checkout [Lex's Patreon](https://www.patreon.com/LexManos).
Consider support him to maintains forge.

### Install Fabric

Fetch the new fabric version list.

```ts
import { installFabric, FabricArtifactVersion } from "@xmcl/installer";

const versionList: FabricArtifactVersion[] = await getFabricArtifactList();
```

Install fabric to the client. This installation process doesn't ensure the minecraft libraries.

```ts
const minecraftLocation: MinecraftLocation;
await installFabric(versionList[0], minecraftLocation);
```

Please run `Installer.installDependencies` after that to install fully.

## New Forge Installing process

The module have three stage for installing new forge *(mcversion >= 1.13)*

1. Deploy forge installer jar
   1. Download installer jar
   2. Extract forge universal jar files in installer jar into `.minecraft/libraries`
   3. Extract `version.json` into target version folder, `.minecraft/versions/<ver>/<ver>.json`
   4. Extract `installer_profile.json` into target version folder, `.minecraft/versions/<ver>/installer_profile.json`
2. Download Dependencies
   1. Merge libraires in `installer_profile.json` and `<ver>.json`
   2. Download them
3. Post processing forge jar
   1. Parse `installer_profile.json`
   2. Get the processors info and execute all of them.

The `installForge` will do all of them.

The `installByProfile` will do 2 and 3.

### Install Java 8 From Mojang Source

Scan java installation path from the disk. (Require a lzma unpacker, like [7zip-bin](https://www.npmjs.com/package/7zip-bin) or [lzma-native](https://www.npmjs.com/package/lzma-native))

```ts
import { installJreFromMojang } from "@xmcl/installer";

// this require a unpackLZMA util to work
// you can use `7zip-bin`
// or `lzma-native` for this
const unpackLZMA: (src: string, dest: string) => Promise<void>;

await installJreFromMojang({
    destination: "your/java/home",
    unpackLZMA,
});
```

## 🧾 Classes

<div class="definition-grid class"><a href="installer/BadForgeInstallerJarError">BadForgeInstallerJarError</a><a href="installer/BadOptifineJarError">BadOptifineJarError</a><a href="installer/DownloadForgeInstallerTask">DownloadForgeInstallerTask</a><a href="installer/DownloadJRETask">DownloadJRETask</a><a href="installer/DownloadNeoForgedInstallerTask">DownloadNeoForgedInstallerTask</a><a href="installer/DownloadTask">DownloadTask</a><a href="installer/InstallAssetIndexTask">InstallAssetIndexTask</a><a href="installer/InstallAssetTask">InstallAssetTask</a><a href="installer/InstallJarTask">InstallJarTask</a><a href="installer/InstallJsonTask">InstallJsonTask</a><a href="installer/InstallLibraryTask">InstallLibraryTask</a><a href="installer/MissingVersionJsonError-1">MissingVersionJsonError</a><a href="installer/ParseJavaVersionError">ParseJavaVersionError</a><a href="installer/PostProcessBadJarError">PostProcessBadJarError</a><a href="installer/PostProcessFailedError">PostProcessFailedError</a><a href="installer/PostProcessNoMainClassError">PostProcessNoMainClassError</a><a href="installer/PostProcessingTask">PostProcessingTask</a><a href="installer/UnzipTask">UnzipTask</a></div>

## 🤝 Interfaces

<div class="definition-grid interface"><a href="installer/AssetInfo">AssetInfo</a><a href="installer/AssetsOptions">AssetsOptions</a><a href="installer/DirectoryEntry">DirectoryEntry</a><a href="installer/DownloadInfo">DownloadInfo</a><a href="installer/Entry">Entry</a><a href="installer/EntryResolver">EntryResolver</a><a href="installer/FabricArtifactVersion">FabricArtifactVersion</a><a href="installer/FabricArtifacts">FabricArtifacts</a><a href="installer/FabricInstallOptions">FabricInstallOptions</a><a href="installer/FabricLoaderArtifact">FabricLoaderArtifact</a><a href="installer/FabricOptions">FabricOptions</a><a href="installer/FetchJavaRuntimeManifestOptions">FetchJavaRuntimeManifestOptions</a><a href="installer/FileEntry">FileEntry</a><a href="installer/ForgeInstallerEntries">ForgeInstallerEntries</a><a href="installer/ForgeVersion">ForgeVersion</a><a href="installer/ForgeVersionList">ForgeVersionList</a><a href="installer/GetQuiltOptions">GetQuiltOptions</a><a href="installer/InstallForgeOptions">InstallForgeOptions</a><a href="installer/InstallJavaOptions">InstallJavaOptions</a><a href="installer/InstallJavaRuntimeOptions">InstallJavaRuntimeOptions</a><a href="installer/InstallLabyModOptions">InstallLabyModOptions</a><a href="installer/InstallOptifineOptions">InstallOptifineOptions</a><a href="installer/InstallOptions">InstallOptions</a><a href="installer/InstallProfile">InstallProfile</a><a href="installer/InstallProfileIssueReport">InstallProfileIssueReport</a><a href="installer/InstallProfileOption">InstallProfileOption</a><a href="installer/InstallQuiltVersionOptions">InstallQuiltVersionOptions</a><a href="installer/InstallSideOption">InstallSideOption</a><a href="installer/JarOption">JarOption</a><a href="installer/JavaInfo">JavaInfo</a><a href="installer/JavaRuntimeManifest">JavaRuntimeManifest</a><a href="installer/JavaRuntimeTarget">JavaRuntimeTarget</a><a href="installer/JavaRuntimeTargets">JavaRuntimeTargets</a><a href="installer/JavaRuntimes">JavaRuntimes</a><a href="installer/LabyModManifest">LabyModManifest</a><a href="installer/LibraryOptions">LibraryOptions</a><a href="installer/LinkEntry">LinkEntry</a><a href="installer/LiteloaderVersion">LiteloaderVersion</a><a href="installer/LiteloaderVersionList">LiteloaderVersionList</a><a href="installer/MinecraftVersion">MinecraftVersion</a><a href="installer/MinecraftVersionBaseInfo">MinecraftVersionBaseInfo</a><a href="installer/MinecraftVersionList">MinecraftVersionList</a><a href="installer/PostProcessor">PostProcessor</a><a href="installer/ProcessorIssue">ProcessorIssue</a><a href="installer/QuiltArtifactVersion">QuiltArtifactVersion</a></div>

## 🗃️ Namespaces

<div class="definition-grid namespace"><a href="installer/LiteloaderVersionList-1">LiteloaderVersionList</a></div>

## 🏳️ Enums

<div class="definition-grid enum"><a href="installer/JavaRuntimeTargetType">JavaRuntimeTargetType</a></div>

## 🏭 Functions

### diagnoseInstall

```ts
diagnoseInstall(installProfile: InstallProfile, minecraftLocation: MinecraftLocation, side: "server" | "client"= 'client'): Promise<InstallProfileIssueReport>
```
Diagnose a install profile status. Check if it processor output correctly processed.

This can be used for check if forge correctly installed when minecraft &gt;= 1.13
#### Parameters

- **installProfile**: `InstallProfile`
The install profile.
- **minecraftLocation**: `MinecraftLocation`
The minecraft location
- **side**: `"server" | "client"`
#### Return Type

- `Promise<InstallProfileIssueReport>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/diagnose.ts#L33" target="_blank" rel="noreferrer">packages/installer/diagnose.ts:33</a>
</p>


### fetchJavaRuntimeManifest

```ts
fetchJavaRuntimeManifest(options: FetchJavaRuntimeManifestOptions= {}): Promise<JavaRuntimeManifest>
```
Fetch java runtime manifest. It should be able to resolve to your platform, or you can assign the platform.

Also, you should assign the target to download, or it will use the latest java 16.
#### Parameters

- **options**: `FetchJavaRuntimeManifestOptions`
The options of fetch runtime manifest
#### Return Type

- `Promise<JavaRuntimeManifest>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/java-runtime.ts#L196" target="_blank" rel="noreferrer">packages/installer/java-runtime.ts:196</a>
</p>


### generateOptifineVersion

```ts
generateOptifineVersion(editionRelease: string, minecraftVersion: string, launchWrapperVersion: string, options: InstallOptifineOptions= {}): Version
```
Generate the optifine version json from provided info.
#### Parameters

- **editionRelease**: `string`
The edition + release with _
- **minecraftVersion**: `string`
The minecraft version
- **launchWrapperVersion**: `string`
The launch wrapper version
- **options**: `InstallOptifineOptions`
The install options
 Might be changed and don't break the major version
#### Return Type

- `Version`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/optifine.ts#L25" target="_blank" rel="noreferrer">packages/installer/optifine.ts:25</a>
</p>


### getDefaultEntryResolver

```ts
getDefaultEntryResolver(): EntryResolver
```
#### Return Type

- `EntryResolver`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/unzip.ts#L14" target="_blank" rel="noreferrer">packages/installer/unzip.ts:14</a>
</p>


### getFabricArtifacts

```ts
getFabricArtifacts(options: FabricOptions): Promise<FabricArtifacts>
```
Get all the artifacts provided by fabric
#### Parameters

- **options**: `FabricOptions`
#### Return Type

- `Promise<FabricArtifacts>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/fabric.ts#L49" target="_blank" rel="noreferrer">packages/installer/fabric.ts:49</a>
</p>


### getFabricLoaderArtifact

```ts
getFabricLoaderArtifact(minecraft: string, loader: string, options: FabricOptions): Promise<FabricLoaderArtifact>
```
Get fabric-loader artifact list by Minecraft version
#### Parameters

- **minecraft**: `string`
The minecraft version
- **loader**: `string`
The yarn-loader version
- **options**: `FabricOptions`
#### Return Type

- `Promise<FabricLoaderArtifact>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/fabric.ts#L103" target="_blank" rel="noreferrer">packages/installer/fabric.ts:103</a>
</p>


### getForgeVersionList

```ts
getForgeVersionList(options: Object= {}): Promise<ForgeVersionList>
```
Query the webpage content from files.minecraftforge.net.

You can put the last query result to the fallback option. It will check if your old result is up-to-date.
It will request a new page only when the fallback option is outdated.
#### Parameters

- **options**: `Object`
#### Return Type

- `Promise<ForgeVersionList>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/forge.ts#L555" target="_blank" rel="noreferrer">packages/installer/forge.ts:555</a>
</p>


### getLabyModManifest

```ts
getLabyModManifest(env: string= 'production', options: Object): Promise<LabyModManifest>
```
#### Parameters

- **env**: `string`
- **options**: `Object`
#### Return Type

- `Promise<LabyModManifest>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/labymod.ts#L41" target="_blank" rel="noreferrer">packages/installer/labymod.ts:41</a>
</p>


### getLiteloaderVersionList

```ts
getLiteloaderVersionList(options: Object= {}): Promise<LiteloaderVersionList>
```
Get or update the LiteLoader version list.

This will request liteloader offical json by default. You can replace the request by assigning the remote option.
#### Parameters

- **options**: `Object`
#### Return Type

- `Promise<LiteloaderVersionList>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/liteloader.ts#L112" target="_blank" rel="noreferrer">packages/installer/liteloader.ts:112</a>
</p>


### getLoaderArtifactList

```ts
getLoaderArtifactList(options: FabricOptions): Promise<FabricArtifactVersion[]>
```
Get fabric-loader artifact list
#### Parameters

- **options**: `FabricOptions`
#### Return Type

- `Promise<FabricArtifactVersion[]>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/fabric.ts#L80" target="_blank" rel="noreferrer">packages/installer/fabric.ts:80</a>
</p>


### getLoaderArtifactListFor

```ts
getLoaderArtifactListFor(minecraft: string, options: FabricOptions): Promise<FabricLoaderArtifact[]>
```
Get fabric-loader artifact list by Minecraft version
#### Parameters

- **minecraft**: `string`
The minecraft version
- **options**: `FabricOptions`
#### Return Type

- `Promise<FabricLoaderArtifact[]>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/fabric.ts#L91" target="_blank" rel="noreferrer">packages/installer/fabric.ts:91</a>
</p>


### getPotentialJavaLocations

```ts
getPotentialJavaLocations(): Promise<string[]>
```
Get all potential java locations for Minecraft.

On mac/linux, it will perform ``which java``. On win32, it will perform ``where java``
#### Return Type

- `Promise<string[]>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/java.ts#L199" target="_blank" rel="noreferrer">packages/installer/java.ts:199</a>
</p>


### getQuiltVersionsList

```ts
getQuiltVersionsList(options: GetQuiltOptions): Promise<QuiltArtifactVersion[]>
```
#### Parameters

- **options**: `GetQuiltOptions`
#### Return Type

- `Promise<QuiltArtifactVersion[]>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/quilt.ts#L54" target="_blank" rel="noreferrer">packages/installer/quilt.ts:54</a>
</p>


### getVersionList

```ts
getVersionList(options: Object= {}): Promise<MinecraftVersionList>
```
Get and update the version list.
This try to send http GET request to offical Minecraft metadata endpoint by default.
You can swap the endpoint by passing url on ``remote`` in option.
#### Parameters

- **options**: `Object`
#### Return Type

- `Promise<MinecraftVersionList>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L86" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:86</a>
</p>


### getYarnArtifactList

```ts
getYarnArtifactList(options: FabricOptions): Promise<FabricArtifactVersion[]>
```
Get fabric-yarn artifact list
#### Parameters

- **options**: `FabricOptions`
#### Return Type

- `Promise<FabricArtifactVersion[]>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/fabric.ts#L59" target="_blank" rel="noreferrer">packages/installer/fabric.ts:59</a>
</p>


### getYarnArtifactListFor

```ts
getYarnArtifactListFor(minecraft: string, options: FabricOptions): Promise<FabricArtifactVersion[]>
```
Get fabric-yarn artifact list by Minecraft version
#### Parameters

- **minecraft**: `string`
The Minecraft version
- **options**: `FabricOptions`
#### Return Type

- `Promise<FabricArtifactVersion[]>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/fabric.ts#L70" target="_blank" rel="noreferrer">packages/installer/fabric.ts:70</a>
</p>


### install

```ts
install(versionMeta: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, option: Options= {}): Promise<ResolvedVersion>
```
Install the Minecraft game to a location by version metadata.

This will install version json, version jar, and all dependencies (assets, libraries)
#### Parameters

- **versionMeta**: `MinecraftVersionBaseInfo`
The version metadata
- **minecraft**: `MinecraftLocation`
The Minecraft location
- **option**: `Options`

#### Return Type

- `Promise<ResolvedVersion>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L199" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:199</a>
</p>


### installAssets

```ts
installAssets(version: ResolvedVersion, options: AssetsOptions= {}): Promise<ResolvedVersion>
```
Install or check the assets to resolved version
#### Parameters

- **version**: `ResolvedVersion`
The target version
- **options**: `AssetsOptions`
The option to replace assets host url
#### Return Type

- `Promise<ResolvedVersion>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L229" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:229</a>
</p>


### installAssetsTask

```ts
installAssetsTask(version: ResolvedVersion, options: AssetsOptions= {}): Task<ResolvedVersion>
```
Install or check the assets to resolved version
#### Parameters

- **version**: `ResolvedVersion`
The target version
- **options**: `AssetsOptions`
The option to replace assets host url
#### Return Type

- `Task<ResolvedVersion>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L311" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:311</a>
</p>


### installByInstallerTask

```ts
installByInstallerTask(version: RequiredVersion, minecraft: MinecraftLocation, options: InstallForgeOptions): TaskRoutine<string>
```
#### Parameters

- **version**: `RequiredVersion`
- **minecraft**: `MinecraftLocation`
- **options**: `InstallForgeOptions`
#### Return Type

- `TaskRoutine<string>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/forge.ts#L478" target="_blank" rel="noreferrer">packages/installer/forge.ts:478</a>
</p>


### installByProfile

```ts
installByProfile(installProfile: InstallProfile, minecraft: MinecraftLocation, options: InstallProfileOption= {}): Promise<void>
```
Install by install profile. The install profile usually contains some preprocess should run before installing dependencies.
#### Parameters

- **installProfile**: `InstallProfile`
The install profile
- **minecraft**: `MinecraftLocation`
The minecraft location
- **options**: `InstallProfileOption`
The options to install
#### Return Type

- `Promise<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/profile.ts#L174" target="_blank" rel="noreferrer">packages/installer/profile.ts:174</a>
</p>


### installByProfileTask

```ts
installByProfileTask(installProfile: InstallProfile, minecraft: MinecraftLocation, options: InstallProfileOption= {}): TaskRoutine<void>
```
Install by install profile. The install profile usually contains some preprocess should run before installing dependencies.
#### Parameters

- **installProfile**: `InstallProfile`
The install profile
- **minecraft**: `MinecraftLocation`
The minecraft location
- **options**: `InstallProfileOption`
The options to install
#### Return Type

- `TaskRoutine<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/profile.ts#L185" target="_blank" rel="noreferrer">packages/installer/profile.ts:185</a>
</p>


### installDependencies

```ts
installDependencies(version: ResolvedVersion, options: Options): Promise<ResolvedVersion>
```
Install the completeness of the Minecraft game assets and libraries on a existed version.
#### Parameters

- **version**: `ResolvedVersion`
The resolved version produced by Version.parse
- **options**: `Options`
#### Return Type

- `Promise<ResolvedVersion>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L219" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:219</a>
</p>


### installDependenciesTask

```ts
installDependenciesTask(version: ResolvedVersion, options: Options= {}): Task<ResolvedVersion>
```
Install the completeness of the Minecraft game assets and libraries on a existed version.
#### Parameters

- **version**: `ResolvedVersion`
The resolved version produced by Version.parse
- **options**: `Options`
#### Return Type

- `Task<ResolvedVersion>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L295" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:295</a>
</p>


### installFabric

```ts
installFabric(loader: FabricLoaderArtifact, minecraft: MinecraftLocation, options: FabricInstallOptions= {}): Promise<string>
```
Generate fabric version json to the disk according to yarn and loader
#### Parameters

- **loader**: `FabricLoaderArtifact`
The loader artifact
- **minecraft**: `MinecraftLocation`
The Minecraft Location
- **options**: `FabricInstallOptions`
The options
#### Return Type

- `Promise<string>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/fabric.ts#L151" target="_blank" rel="noreferrer">packages/installer/fabric.ts:151</a>
</p>


### installForge

```ts
installForge(version: RequiredVersion, minecraft: MinecraftLocation, options: InstallForgeOptions): Promise<string>
```
Install forge to target location.
Installation task for forge with mcversion &gt;= 1.13 requires java installed on your pc.
#### Parameters

- **version**: `RequiredVersion`
The forge version meta
- **minecraft**: `MinecraftLocation`
- **options**: `InstallForgeOptions`
#### Return Type

- `Promise<string>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/forge.ts#L532" target="_blank" rel="noreferrer">packages/installer/forge.ts:532</a>
</p>


### installForgeTask

```ts
installForgeTask(version: RequiredVersion, minecraft: MinecraftLocation, options: InstallForgeOptions= {}): Task<string>
```
Install forge to target location.
Installation task for forge with mcversion &gt;= 1.13 requires java installed on your pc.
#### Parameters

- **version**: `RequiredVersion`
The forge version meta
- **minecraft**: `MinecraftLocation`
- **options**: `InstallForgeOptions`
#### Return Type

- `Task<string>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/forge.ts#L543" target="_blank" rel="noreferrer">packages/installer/forge.ts:543</a>
</p>


### installJavaRuntimeTask

```ts
installJavaRuntimeTask(options: InstallJavaRuntimeOptions): Task<void>
```
Install java runtime from java runtime manifest
#### Parameters

- **options**: `InstallJavaRuntimeOptions`
The options to install java runtime
#### Return Type

- `Task<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/java-runtime.ts#L271" target="_blank" rel="noreferrer">packages/installer/java-runtime.ts:271</a>
</p>


### installJreFromMojang

```ts
installJreFromMojang(options: InstallJavaOptions): Promise<void>
```
Install JRE from Mojang offical resource. It should install jdk 8.
#### Parameters

- **options**: `InstallJavaOptions`
The install options
#### Return Type

- `Promise<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/java.ts#L127" target="_blank" rel="noreferrer">packages/installer/java.ts:127</a>
</p>


### installJreFromMojangTask

```ts
installJreFromMojangTask(options: InstallJavaOptions): TaskRoutine<void>
```
Install JRE from Mojang offical resource. It should install jdk 8.
#### Parameters

- **options**: `InstallJavaOptions`
The install options
#### Return Type

- `TaskRoutine<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/java.ts#L84" target="_blank" rel="noreferrer">packages/installer/java.ts:84</a>
</p>


### installLaby4Mod

```ts
installLaby4Mod(manifest: LabyModManifest, tag: string, minecraft: MinecraftLocation, options: InstallLabyModOptions): Promise<string>
```
#### Parameters

- **manifest**: `LabyModManifest`
- **tag**: `string`
- **minecraft**: `MinecraftLocation`
- **options**: `InstallLabyModOptions`
#### Return Type

- `Promise<string>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/labymod.ts#L146" target="_blank" rel="noreferrer">packages/installer/labymod.ts:146</a>
</p>


### installLabyMod4Task

```ts
installLabyMod4Task(manifest: LabyModManifest, tag: string, minecraft: MinecraftLocation, options: InstallLabyModOptions): Task<string>
```
#### Parameters

- **manifest**: `LabyModManifest`
- **tag**: `string`
- **minecraft**: `MinecraftLocation`
- **options**: `InstallLabyModOptions`
#### Return Type

- `Task<string>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/labymod.ts#L122" target="_blank" rel="noreferrer">packages/installer/labymod.ts:122</a>
</p>


### installLibraries

```ts
installLibraries(version: ResolvedVersion, options: LibraryOptions= {}): Promise<void>
```
Install all the libraries of providing version
#### Parameters

- **version**: `ResolvedVersion`
The target version
- **options**: `LibraryOptions`
The library host swap option
#### Return Type

- `Promise<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L238" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:238</a>
</p>


### installLibrariesTask

```ts
installLibrariesTask(version: InstallLibraryVersion, options: LibraryOptions= {}): Task<void>
```
Install all the libraries of providing version
#### Parameters

- **version**: `InstallLibraryVersion`
The target version
- **options**: `LibraryOptions`
The library host swap option
#### Return Type

- `Task<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L383" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:383</a>
</p>


### installLiteloader

```ts
installLiteloader(versionMeta: LiteloaderVersion, location: MinecraftLocation, options: InstallOptions): Promise<string>
```
Install the liteloader to specific minecraft location.

This will install the liteloader amount on the corresponded Minecraft version by default.
If you want to install over the forge. You should first install forge and pass the installed forge version id to the third param,
like ``1.12-forge-xxxx``
#### Parameters

- **versionMeta**: `LiteloaderVersion`
The liteloader version metadata.
- **location**: `MinecraftLocation`
The minecraft location you want to install
- **options**: `InstallOptions`
#### Return Type

- `Promise<string>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/liteloader.ts#L135" target="_blank" rel="noreferrer">packages/installer/liteloader.ts:135</a>
</p>


### installLiteloaderTask

```ts
installLiteloaderTask(versionMeta: LiteloaderVersion, location: MinecraftLocation, options: InstallOptions= {}): Task<string>
```
Install the liteloader to specific minecraft location.

This will install the liteloader amount on the corresponded Minecraft version by default.
If you want to install over the forge. You should first install forge and pass the installed forge version id to the third param,
like ``1.12-forge-xxxx``
#### Parameters

- **versionMeta**: `LiteloaderVersion`
The liteloader version metadata.
- **location**: `MinecraftLocation`
The minecraft location you want to install
- **options**: `InstallOptions`
#### Return Type

- `Task<string>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/liteloader.ts#L183" target="_blank" rel="noreferrer">packages/installer/liteloader.ts:183</a>
</p>


### installNeoForged

```ts
installNeoForged(project: "forge" | "neoforge", version: string, minecraft: MinecraftLocation, options: InstallForgeOptions): Promise<string>
```
#### Parameters

- **project**: `"forge" | "neoforge"`
- **version**: `string`
- **minecraft**: `MinecraftLocation`
- **options**: `InstallForgeOptions`
#### Return Type

- `Promise<string>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/neoForged.ts#L49" target="_blank" rel="noreferrer">packages/installer/neoForged.ts:49</a>
</p>


### installNeoForgedTask

```ts
installNeoForgedTask(project: "forge" | "neoforge", version: string, minecraft: MinecraftLocation, options: InstallForgeOptions): Task<string>
```
#### Parameters

- **project**: `"forge" | "neoforge"`
- **version**: `string`
- **minecraft**: `MinecraftLocation`
- **options**: `InstallForgeOptions`
#### Return Type

- `Task<string>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/neoForged.ts#L53" target="_blank" rel="noreferrer">packages/installer/neoForged.ts:53</a>
</p>


### installOptifine

```ts
installOptifine(installer: string, minecraft: MinecraftLocation, options: InstallOptifineOptions): Promise<string>
```
Install optifine by optifine installer
#### Parameters

- **installer**: `string`
The installer jar file path
- **minecraft**: `MinecraftLocation`
The minecraft location
- **options**: `InstallOptifineOptions`
The option to install
 Might be changed and don't break the major version
#### Return Type

- `Promise<string>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/optifine.ts#L60" target="_blank" rel="noreferrer">packages/installer/optifine.ts:60</a>
</p>


### installOptifineTask

```ts
installOptifineTask(installer: string, minecraft: MinecraftLocation, options: InstallOptifineOptions= {}): TaskRoutine<string>
```
Install optifine by optifine installer task
#### Parameters

- **installer**: `string`
The installer jar file path
- **minecraft**: `MinecraftLocation`
The minecraft location
- **options**: `InstallOptifineOptions`
The option to install
 Might be changed and don't break the major version
#### Return Type

- `TaskRoutine<string>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/optifine.ts#L87" target="_blank" rel="noreferrer">packages/installer/optifine.ts:87</a>
</p>


### installQuiltVersion

```ts
installQuiltVersion(options: InstallQuiltVersionOptions): Promise<string>
```
#### Parameters

- **options**: `InstallQuiltVersionOptions`
#### Return Type

- `Promise<string>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/quilt.ts#L16" target="_blank" rel="noreferrer">packages/installer/quilt.ts:16</a>
</p>


### installResolvedAssetsTask

```ts
installResolvedAssetsTask(assets: AssetInfo[], folder: MinecraftFolder, options: AssetsOptions= {}): TaskRoutine<void>
```
Only install several resolved assets.
#### Parameters

- **assets**: `AssetInfo[]`
The assets to install
- **folder**: `MinecraftFolder`
The minecraft folder
- **options**: `AssetsOptions`
The asset option
#### Return Type

- `TaskRoutine<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L409" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:409</a>
</p>


### installResolvedLibraries

```ts
installResolvedLibraries(libraries: ResolvedLibrary[], minecraft: MinecraftLocation, option: LibraryOptions): Promise<void>
```
Only install several resolved libraries
#### Parameters

- **libraries**: `ResolvedLibrary[]`
The resolved libraries
- **minecraft**: `MinecraftLocation`
The minecraft location
- **option**: `LibraryOptions`
The install option
#### Return Type

- `Promise<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L248" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:248</a>
</p>


### installResolvedLibrariesTask

```ts
installResolvedLibrariesTask(libraries: ResolvedLibrary[], minecraft: MinecraftLocation, option: LibraryOptions): Task<void>
```
Only install several resolved libraries
#### Parameters

- **libraries**: `ResolvedLibrary[]`
The resolved libraries
- **minecraft**: `MinecraftLocation`
The minecraft location
- **option**: `LibraryOptions`
The install option
#### Return Type

- `Task<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L399" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:399</a>
</p>


### installTask

```ts
installTask(versionMeta: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, options: Options= {}): Task<ResolvedVersion>
```
Install the Minecraft game to a location by version metadata.

This will install version json, version jar, and all dependencies (assets, libraries)
#### Parameters

- **versionMeta**: `MinecraftVersionBaseInfo`
The version metadata
- **minecraft**: `MinecraftLocation`
The Minecraft location
- **options**: `Options`

#### Return Type

- `Task<ResolvedVersion>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L262" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:262</a>
</p>


### installVersion

```ts
installVersion(versionMeta: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, options: JarOption= {}): Promise<ResolvedVersion>
```
Only install the json/jar. Do not install dependencies.
#### Parameters

- **versionMeta**: `MinecraftVersionBaseInfo`
the version metadata; get from updateVersionMeta
- **minecraft**: `MinecraftLocation`
minecraft location
- **options**: `JarOption`
#### Return Type

- `Promise<ResolvedVersion>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L209" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:209</a>
</p>


### installVersionTask

```ts
installVersionTask(versionMeta: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, options: JarOption= {}): Task<ResolvedVersion>
```
Only install the json/jar. Do not install dependencies.
#### Parameters

- **versionMeta**: `MinecraftVersionBaseInfo`
the version metadata; get from updateVersionMeta
- **minecraft**: `MinecraftLocation`
minecraft location
- **options**: `JarOption`
#### Return Type

- `Task<ResolvedVersion>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L278" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:278</a>
</p>


### isForgeInstallerEntries

```ts
isForgeInstallerEntries(entries: ForgeInstallerEntries): entries is ForgeInstallerEntriesPattern
```
#### Parameters

- **entries**: `ForgeInstallerEntries`
#### Return Type

- `entries is ForgeInstallerEntriesPattern`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/forge.ts#L425" target="_blank" rel="noreferrer">packages/installer/forge.ts:425</a>
</p>


### isLegacyForgeInstallerEntries

```ts
isLegacyForgeInstallerEntries(entries: ForgeInstallerEntries): entries is Required<Pick<ForgeInstallerEntries, "installProfileJson" | "legacyUniversalJar">>
```
#### Parameters

- **entries**: `ForgeInstallerEntries`
#### Return Type

- `entries is Required<Pick<ForgeInstallerEntries, "installProfileJson" | "legacyUniversalJar">>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/forge.ts#L421" target="_blank" rel="noreferrer">packages/installer/forge.ts:421</a>
</p>


### parseJavaVersion

```ts
parseJavaVersion(versionText: string): Object | undefined
```
Parse version string and major version number from stderr of java process.
#### Parameters

- **versionText**: `string`
The stderr for ``java -version``
#### Return Type

- `Object | undefined`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/java.ts#L165" target="_blank" rel="noreferrer">packages/installer/java.ts:165</a>
</p>


### postProcess

```ts
postProcess(processors: PostProcessor[], minecraft: MinecraftFolder, javaOptions: SpawnJavaOptions): Promise<void>
```
Post process the post processors from ``InstallProfile``.
#### Parameters

- **processors**: `PostProcessor[]`
The processor info
- **minecraft**: `MinecraftFolder`
The minecraft location
- **javaOptions**: `SpawnJavaOptions`
#### Return Type

- `Promise<void>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/profile.ts#L162" target="_blank" rel="noreferrer">packages/installer/profile.ts:162</a>
</p>


### resolveJava

```ts
resolveJava(path: string): Promise<JavaInfo | undefined>
```
Try to resolve a java info at this path. This will call ``java -version``
#### Parameters

- **path**: `string`
The java exectuable path.
#### Return Type

- `Promise<JavaInfo | undefined>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/java.ts#L135" target="_blank" rel="noreferrer">packages/installer/java.ts:135</a>
</p>


### resolveLibraryDownloadUrls

```ts
resolveLibraryDownloadUrls(library: ResolvedLibrary, libraryOptions: LibraryOptions): string[]
```
Resolve a library download urls with fallback.
#### Parameters

- **library**: `ResolvedLibrary`
The resolved library
- **libraryOptions**: `LibraryOptions`
The library install options
#### Return Type

- `string[]`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L565" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:565</a>
</p>


### resolveProcessors

```ts
resolveProcessors(side: "server" | "client", installProfile: InstallProfile, minecraft: MinecraftFolder): Object[]
```
Resolve processors in install profile
#### Parameters

- **side**: `"server" | "client"`
- **installProfile**: `InstallProfile`
- **minecraft**: `MinecraftFolder`
#### Return Type

- `Object[]`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/profile.ts#L77" target="_blank" rel="noreferrer">packages/installer/profile.ts:77</a>
</p>


### scanLocalJava

```ts
scanLocalJava(locations: string[]): Promise<JavaInfo[]>
```
Scan local java version on the disk.

It will check if the passed ``locations`` are the home of java.
Notice that the locations should not be the executable, but the path of java installation, like JAVA_HOME.

This will call ``getPotentialJavaLocations`` and then ``resolveJava``
#### Parameters

- **locations**: `string[]`
The location (like java_home) want to check.
#### Return Type

- `Promise<JavaInfo[]>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/java.ts#L260" target="_blank" rel="noreferrer">packages/installer/java.ts:260</a>
</p>


### unpackForgeInstaller

```ts
unpackForgeInstaller(zip: ZipFile, entries: ForgeInstallerEntriesPattern, forgeVersion: string, profile: InstallProfile, mc: MinecraftFolder, jarPath: string, options: InstallForgeOptions): Promise<string>
```
Unpack forge installer jar file content to the version library artifact directory.
#### Parameters

- **zip**: `ZipFile`
The forge jar file
- **entries**: `ForgeInstallerEntriesPattern`
The entries
- **forgeVersion**: `string`
The expected version of forge
- **profile**: `InstallProfile`
The forge install profile
- **mc**: `MinecraftFolder`
The minecraft location
- **jarPath**: `string`
- **options**: `InstallForgeOptions`
#### Return Type

- `Promise<string>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/forge.ts#L344" target="_blank" rel="noreferrer">packages/installer/forge.ts:344</a>
</p>


### walkForgeInstallerEntries

```ts
walkForgeInstallerEntries(zip: ZipFile, forgeVersion: string): Promise<ForgeInstallerEntries>
```
Walk the forge installer file to find key entries
#### Parameters

- **zip**: `ZipFile`
THe forge instal
- **forgeVersion**: `string`
Forge version to install
#### Return Type

- `Promise<ForgeInstallerEntries>`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/forge.ts#L434" target="_blank" rel="noreferrer">packages/installer/forge.ts:434</a>
</p>



## 🏷️ Variables

### DEFAULT_FORGE_MAVEN <Badge type="tip" text="const" />

```ts
DEFAULT_FORGE_MAVEN: "http://files.minecraftforge.net/maven" = 'http://files.minecraftforge.net/maven'
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/forge.ts#L137" target="_blank" rel="noreferrer">packages/installer/forge.ts:137</a>
</p>


### DEFAULT_META_URL <Badge type="tip" text="const" />

```ts
DEFAULT_META_URL: "https://meta.quiltmc.org" = 'https://meta.quiltmc.org'
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/quilt.ts#L6" target="_blank" rel="noreferrer">packages/installer/quilt.ts:6</a>
</p>


### DEFAULT_RESOURCE_ROOT_URL <Badge type="tip" text="const" />

```ts
DEFAULT_RESOURCE_ROOT_URL: "https://resources.download.minecraft.net" = 'https://resources.download.minecraft.net'
```
Default resource/assets url root
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L77" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:77</a>
</p>


### DEFAULT_RUNTIME_ALL_URL <Badge type="tip" text="const" />

```ts
DEFAULT_RUNTIME_ALL_URL: "https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json" = 'https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json'
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/java-runtime.ts#L133" target="_blank" rel="noreferrer">packages/installer/java-runtime.ts:133</a>
</p>


### DEFAULT_VERSION_MANIFEST <Badge type="tip" text="const" />

```ts
DEFAULT_VERSION_MANIFEST: "http://dl.liteloader.com/versions/versions.json" = 'http://dl.liteloader.com/versions/versions.json'
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/liteloader.ts#L8" target="_blank" rel="noreferrer">packages/installer/liteloader.ts:8</a>
</p>


### DEFAULT_VERSION_MANIFEST_URL <Badge type="tip" text="const" />

```ts
DEFAULT_VERSION_MANIFEST_URL: "https://launchermeta.mojang.com/mc/game/version_manifest.json" = 'https://launchermeta.mojang.com/mc/game/version_manifest.json'
```
Default minecraft version manifest url.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L73" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:73</a>
</p>


### LOADER_MAVEN_URL <Badge type="tip" text="const" />

```ts
LOADER_MAVEN_URL: "https://maven.fabricmc.net/net/fabricmc/fabric-loader/maven-metadata.xml" = 'https://maven.fabricmc.net/net/fabricmc/fabric-loader/maven-metadata.xml'
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/fabric.ts#L7" target="_blank" rel="noreferrer">packages/installer/fabric.ts:7</a>
</p>


### YARN_MAVEN_URL <Badge type="tip" text="const" />

```ts
YARN_MAVEN_URL: "https://maven.fabricmc.net/net/fabricmc/yarn/maven-metadata.xml" = 'https://maven.fabricmc.net/net/fabricmc/yarn/maven-metadata.xml'
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/fabric.ts#L6" target="_blank" rel="noreferrer">packages/installer/fabric.ts:6</a>
</p>



## ⏩ Type Aliases

### AnyEntry

```ts
AnyEntry: FileEntry | DirectoryEntry | LinkEntry
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/java-runtime.ts#L118" target="_blank" rel="noreferrer">packages/installer/java-runtime.ts:118</a>
</p>


### ForgeInstallerEntriesPattern

```ts
ForgeInstallerEntriesPattern: ForgeInstallerEntries & Required<Pick<ForgeInstallerEntries, "versionJson" | "installProfileJson">>
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/forge.ts#L111" target="_blank" rel="noreferrer">packages/installer/forge.ts:111</a>
</p>


### ForgeLegacyInstallerEntriesPattern

```ts
ForgeLegacyInstallerEntriesPattern: Required<Pick<ForgeInstallerEntries, "installProfileJson" | "legacyUniversalJar">>
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/forge.ts#L112" target="_blank" rel="noreferrer">packages/installer/forge.ts:112</a>
</p>


### InstallIssues

```ts
InstallIssues: ProcessorIssue | LibraryIssue
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/diagnose.ts#L4" target="_blank" rel="noreferrer">packages/installer/diagnose.ts:4</a>
</p>


### InstallLibraryVersion

```ts
InstallLibraryVersion: Pick<ResolvedVersion, "libraries" | "minecraftDirectory">
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L147" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:147</a>
</p>


### LibraryHost

```ts
LibraryHost: Function
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L14" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:14</a>
</p>


### Options

```ts
Options: DownloadBaseOptions & ParallelTaskOptions & AssetsOptions & JarOption & LibraryOptions & InstallSideOption
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/minecraft.ts#L188" target="_blank" rel="noreferrer">packages/installer/minecraft.ts:188</a>
</p>


### UnpackLZMAFunction

```ts
UnpackLZMAFunction: Function | Function
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/java.ts#L52" target="_blank" rel="noreferrer">packages/installer/java.ts:52</a>
</p>



