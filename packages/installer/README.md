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
