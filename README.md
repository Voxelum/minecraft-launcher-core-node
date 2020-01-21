# Minecraft Launcher Core

[![npm version](https://img.shields.io/npm/v/@xmcl/minecraft-launcher-core.svg)](https://www.npmjs.com/package/@xmcl/minecraft-launcher-core)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Convensional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://www.conventionalcommits.org)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

Provide several useful functions to build a Minecraft Launcher.

Most packages are targeting the [Electron](https://electronjs.org) environment. Feel free to report issues related to it.

## Installation & Usage

This repo maintaining multiple mini packages for specific functions.

If you use electron to write a minimum launcher, you can install `@xmcl/core` which only has such functions:

- Parse existed Minecraft version
- Launch the game

If you have bigger ambition on your launcher, you want it be able to download/install Minecraft, then you can have `@xmcl/installer`, which contains the functions of:

- Get the version information of Minecraft/Forge/Liteloader/Fabric
- Install Minecraft/Forge/Liteloader/Fabric to the game folder

If you still not satisfied, as you want even provide the function to parse existed resource pack and mods under game folder, then you will have `@xmcl/mod-parser` and `@xmcl/resourcepack` modules, which contain such functions:

- Parse Forge/Liteloader/Fabric mods metadata
- Parse resource pack metadata

There are more packages for advantage usages, and you can check out the getting started section to navigate.

## Browser Only Module

The `@xmcl/model` is a browser only package, as it's using [THREE.js](https://threejs.org/) to create model. You can see it in the section - [Build THREE.js model for block and player](#build-threejs-model-for-block-and-player).

## Getting Started

- [Minecraft Launcher Core](#minecraft-launcher-core)
  - [Installation & Usage](#installation--usage)
  - [Browser Only Module](#browser-only-module)
  - [Getting Started](#getting-started)
    - [Build THREE.js model for block and player (PREVIEW, not available yet)](#build-threejs-model-for-block-and-player-preview-not-available-yet)
    - [Install Fabric](#install-fabric)
    - [Install Forge](#install-forge)
    - [Install Java 8 From Mojang Source](#install-java-8-from-mojang-source)
    - [Install Minecraft](#install-minecraft)
    - [Launch](#launch)
    - [Load Minecraft Block Model](#load-minecraft-block-model)
    - [Load Minecraft Resource](#load-minecraft-resource)
    - [Mojang Security API](#mojang-security-api)
    - [Parse Fabric Mod Metadata](#parse-fabric-mod-metadata)
    - [Parse Forge Mod/Config](#parse-forge-modconfig)
    - [Parse Liteloader Mod](#parse-liteloader-mod)
    - [Parse ResourcePack Basic Info](#parse-resourcepack-basic-info)
    - [Parse Version JSON](#parse-version-json)
    - [Ping Minecraft Server](#ping-minecraft-server)
    - [Progress Moniting](#progress-moniting)
    - [Read and Write NBT](#read-and-write-nbt)
    - [Read and Write Server Info](#read-and-write-server-info)
    - [Read ResourcePack Content](#read-resourcepack-content)
    - [Save/World Data Loading](#saveworld-data-loading)
    - [Scan Local Java](#scan-local-java)
    - [TextComponent](#textcomponent)
    - [User Login (Official/Offline)](#user-login-officialoffline)
    - [User Skin Operation](#user-skin-operation)
  - [Caching Request](#caching-request)
  - [Bundle & Treeshaking](#bundle--treeshaking)
  - [Contribute](#contribute)
    - [Setup Dev Workspace](#setup-dev-workspace)
    - [How to Dev](#how-to-dev)
    - [Before Submit PR](#before-submit-pr)
  - [Dependencies & Module Coupling](#dependencies--module-coupling)
    - [Core Features (Node/Electron Only)](#core-features-nodeelectron-only)
    - [User Authorization Features (Node/Electron/Browser)](#user-authorization-features-nodeelectronbrowser)
    - [General Gaming Features (Node/Electron/Browser)](#general-gaming-features-nodeelectronbrowser)
    - [Client Only Features (Browser Only)](#client-only-features-browser-only)
  - [Credit](#credit)

### Build THREE.js model for block and player (PREVIEW, not available yet)

*Please read how to use [resource-manager](https://github.com/voxelum/minecraft-launcher-core-node/packages/resource-manager/README.md) before this*

Create THREE.js block model:

```ts
    import { BlockModelFactory } from "@xmcl/model";

    const textureRegistry: TextureRegistry;

    const factory = new BlockModelFactory(textureRegistry);
    const model: BlockModel.Resolved;
    const o3d: THREE.Object3D = factory.getObject(model);
    // add o3d to your three scene
```

Create THREE.js player model:

```ts
    import { PlayerModel } from "@xmcl/model";

    const player: PlayerModel = new PlayerModel();
    const isSlimSkin: boolean; // if this skin use alex model
    player.setSkin("http://your-skin-url", isSlimSkin);

    const o3d: THREE.Object3D = player.playerObject3d;
    // add o3d to your three scene
```

### Install Fabric

Fetch the new fabric version list.

```ts
    import { FabricInstaller } from "@xmcl/installer";
    const versionList: Fabric.VersionList = await FabricInstaller.updateVersionList();
    const latestYarnVersion = versionList.yarnVersions[0]; // yarn version is combined by mcversion+yarn build number
    const latestLoaderVersion = versionList.loaderVersions[0];
```

Install fabric to the client. This installation process doesn't ensure the minecraft libraries.

```ts
    import { FabricInstaller } from "@xmcl/fabric";
    const minecraftLocation: MinecraftLocation;
    const yarnVersion: string; // e.g. "1.14.1+build.10"
    const loaderVersion: string; // e.g. "0.4.7+build.147"
    const installPromise: Promise<void> = FabricInstaller.install(yarnVersion, loaderVersion, minecraftLocation)
```

Please run `Installer.installDependencies` after that to install fully.

### Install Forge

Get the forge version info and install forge from it. 

```ts
    import { ForgeInstaller, MinecraftLocation } from "@xmcl/installer";
    const list: ForgeInstaller.VersionMetaList = await ForgeInstaller.getVersionMetaList();
    const minecraftLocation: MinecraftLocation;
    const mcversion = page.mcversion; // mc version
    const firstVersionOnPage: ForgeInstaller.VersionMeta = page.versions[0];
    await ForgeInstaller.install(firstVersionOnPage, minecraftLocation);
```

Notice that this installation doesn't ensure full libraries installation.
Please run `Installer.installDependencies` afther that.

The new 1.13 forge installation process requires java to run. 
Either you have `java` executable in your environment variable PATH,
or you can assign java location by `ForgeInstaller.install(forgeVersionMeta, minecraftLocation, { java: yourJavaExecutablePath });`.

If you use this auto installation process to install forge, please checkout [Lex's Patreon](https://www.patreon.com/LexManos).
Consider support him to maintains forge.


### Install Java 8 From Mojang Source

Scan java installation path from the disk. (Require a lzma unpacker, like [7zip-bin](https://www.npmjs.com/package/7zip-bin) or [lzma-native](https://www.npmjs.com/package/lzma-native))

```ts
    import { JavaInstaller } from "@xmcl/java-installer";

    // this require a unpackLZMA util to work
    // you can use `7zip-bin`
    // or `lzma-native` for this
    const unpackLZMA: (src: string, dest: string) => Promise<void>;

    await JavaInstaller.installJreFromMojang({
        destination: "your/java/home",
        unpackLZMA,
    });
```


### Install Minecraft

Fully install vanilla minecraft client including assets and libs.

```ts
    import { Installer } from "@xmcl/installer";
    import { ResolvedVersion, MinecraftLocation } from "@xmcl/core";

    const minecraft: MinecraftLocation;
    const list: Installer.VersionList = await Installer.getVersionList();
    const aVersion: Installer.Version = list[0]; // i just pick the first version in list here
    await Installer.install("client", aVersion, minecraft);
```

Treeshake friendly import:

```ts
    import { install, getVersionList, Version, VersionList } from "@xmcl/installer/minecraft";
    import { ResolvedVersion, MinecraftLocation } from "@xmcl/core";

    const minecraft: MinecraftLocation;
    const list: VersionList = await getVersionList();
    const aVersion: Version = list[0]; // i just pick the first version in list here
    await install("client", aVersion, minecraft);
```

Just install libraries:

```ts
    import { Installer } from "@xmcl/installer";
    import { ResolvedVersion, MinecraftLocation, Version } from "@xmcl/core";

    const minecraft: MinecraftLocation;
    const version: string; // version string like 1.13
    const resolvedVersion: ResolvedVersion = await Version.parse(version);
    await Installer.installLibraries(resolvedVersion);
```

Just install assets:

```ts
    import { Installer } from "@xmcl/installer";
    import { MinecraftLocation, ResolvedVersion, Version } from "@xmcl/core";

    const minecraft: MinecraftLocation;
    const version: string; // version string like 1.13
    const resolvedVersion: ResolvedVersion = await Version.parse(version);
    await Installer.installAssets(resolvedVersion);
```

Just ensure all assets and libraries are installed:

```ts
    import { Installer } from "@xmcl/installer";
    import { MinecraftLocation, ResolvedVersion, Version } from "@xmcl/core";

    const minecraft: MinecraftLocation;
    const version: string; // version string like 1.13
    const resolvedVersion: ResolvedVersion = await Version.parse(version);
    await Installer.installDependencies(resolvedVersion);
```

Get the report of the version. It can check if version missing assets/libraries.

```ts
    import { Diagnosis } from "@xmcl/core";
    const minecraftLocation: string;
    const minecraftVersionId: string;

    const report: Diagnosis.Report = await Diagnosis.diagnose(minecraftLocation, minecraftVersionId);
```


### Launch

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

### Load Minecraft Block Model

You can use this to load Minecraft block model and texture.

```ts
    import { ResourceManager, ModelLoader, TextureRegistry, ModelRegistry } from "@xmcl/resource-manager";
    import { BlockModel } from "@xmcl/system";

    const man = new ResourceManager();
    // setup resource manager
    man.addResourceSource(new YourCustomizedResourceSource());

    const loader = new ModelLoader(man);

    await loader.loadModel("block/grass"); // load grass model
    await loader.loadModel("block/stone"); // load stone model
    // ... load whatever you want model

    const textures: TextureRegistry = loader.textures;
    const models: ModelRegistry = loader.models;

    const resolvedModel: BlockModel.Resolved = models["block/grass"];
```

### Load Minecraft Resource

You can use this module in nodejs/electron:

```ts
import { ResourceManager, ResourceLocation } from "@xmcl/resource-manager"
const manager: ResourceManager<Buffer> = new ResourceManager();

// add a resource source which load resource from file
await manager.addResourceSource(new MyFileSystemResourceSource('/base/path'));

// load grass block model resource; it will load file at `assets/${location.domain}/${location.path}`
// which is '/base/path/assets/minecraft/models/block/grass.json'
// same logic with minecraft
const resource = await manager.load(ResourceLocation.ofModelPath('block/grass'));

const url: string = resource.url; // your resource url which is file:///base/path/assets/minecraft/models/block/grass.json
const content: Buffer = resource.content; // your resource content
const modelJSON = JSON.parse(content.toString());
```

You can also use this module in browser:

```ts
import { ResourceManager, ResourceLocation } from "@xmcl/resource-manager"
const manager: ResourceManager<string> = new ResourceManager();

// add a resource source which load resource from an remote url
await manager.addResourceSource(new MyRemoteWhateverResourceSource('https://my-domain/xxx'));

// load grass block model resource; it will load file at `assets/${location.domain}/${location.path}`
// which is 'https://my-domain/xxx/assets/minecraft/models/block/grass.json'
// same logic with minecraft
const resource = await manager.load(ResourceLocation.ofModelPath('block/grass'));

const url: string = resource.url; // your resource url which is https://my-domain/xxx/assets/minecraft/models/block/grass.json
const content: string = resource.content; // your resource content string
const modelJSON = JSON.parse(content);
```

Please notice that in the sample above, all the `ResourceSource` should be implemented by yourself.

The resource manager will do the simplest cache for same resource location.

You can clear the cache by:

```ts
manager.clearCache();
```


### Mojang Security API

Validate if user have a validated IP address, and get & answer challenges to validate player's identity.

```ts
    import { checkLocation, getChallenges, responseChallenges } from "@xmcl/user";
    const accessToken: string;
    const validIp: boolean = await checkLocation(accessToken);

    if (!validIp) {
        const challenges: MojangChallenge[] = await getChallenges(accessToken);
        // after your answer the challenges
        const responses: MojangChallengeResponse[];
        await responseChallenges(accessToken, responses);
    }
```

### Parse Fabric Mod Metadata

```ts
    import { Fabric } from "@xmcl/mods";
    const modJarBinary = fs.readFileSync("your-fabric.jar");
    const metadata: Fabric.ModMetadata = await Fabric.readModMetaData(modJarBinary);

    // or directly read from path
    const sameMetadata: Fabric.ModMetadata = await Fabric.readModMetaData("your-fabric.jar");
```


### Parse Forge Mod/Config

Read the forge mod metadata, including `@Mod` annotation, mcmods.info, and toml metadata.

```ts
    import { Forge } from "@xmcl/mods";
    const forgeModJarBuff: Buffer;
    const metadata: Forge.MetaData[] = Forge.readModMetaData(forgeModJarBuff);

    const modid = metadata[0].modid; // get modid of first mods
```

Read the forge mod config file (.cfg)

```ts
    const modConfigString: string;
    const config: Forge.Config = Forge.Config.parse(modConfigString);
    const serializedBack: string = Forge.Config.stringify(config);
```


### Parse Liteloader Mod

Read .litemod metadata:

```ts
    import { LiteLoader } from "@xmcl/mods";
    const metadata: LiteLoader.MetaData = await LiteLoader.readModMetaData(`${mock}/mods/sample-mod.litemod`);
```

### Parse ResourcePack Basic Info

Read pack metadata from file:

```ts
    import { ResourcePack, PackMeta } from "@xmcl/resourcepack"
    const fileFullPath = "path/to/pack/some-pack.zip";
    const pack: PackMeta.Pack = await ResourcePack.readPackMeta(fileFullPath);
    // or you want read from folder, same function call
    const dirFullPath = "path/to/pack/some-pack";
    const fromFolder: PackMeta.Pack = await ResourcePack.readPackMeta(dirFullPath);

    // if you have already read the file, don't want to reopen the file
    // the file path will be only used for resource pack name
    const fileContentBuffer: Buffer;
    const fromBuff: PackMeta.Pack = await ResourcePack.readPackMeta(fileFullPath, fileContentBuffer);
```

Read pack icon:

```ts
    import { ResourcePack, PackMeta } from "@xmcl/resourcepack"
    const fileFullPath = "path/to/pack/some-pack.zip";
    const pack: Uint8Array = await ResourcePack.readIcon(fileFullPath);
```

Put them together in efficent way (don't open resource pack again and again):

```ts
    import { ResourcePack, PackMeta } from "@xmcl/resourcepack"
    const fileFullPath = "path/to/pack/some-pack.zip";
    const res = await ResourcePack.open(fileFullPath);
    const pack: PackMeta.Pack = await ResourcePack.readPackMeta(res);
    const icon: Uint8Array = await ResourcePack.readIcon(res);

    // or

    const pack: PackMeta.Pack = await res.info();
    const icon: Uint8Array = await res.icon();
```


### Parse Version JSON 

Parse minecraft version as a resolved version, which is used for launching process. You can also read version info from it if you want.

```ts
    import { Versoin } from "@xmcl/core";
    const minecraftLocation: string;
    const minecraftVersionId: string;

    const resolvedVersion: ResolvedVersion = await Version.parse(minecraftLocation, minecraftVersionId);
```


### Ping Minecraft Server  

Read sever info (server ip, port) and fetch its status (ping, server motd):

```ts
    import { fetchStatus, Status } from '@xmcl/client'
    // or you want the raw json
    const rawStatusJson: Status = await fetchStatus(info);
```

### Progress Moniting

You can use `@xmcl/task` model to track the progress of a task. *In the launcher, they are majorly download task.*

The module is designed with event based. Use event to track what's happening.

The module won't mutate the task node, as many of us use the state management things required `Unidirectional Data Flow`.

Therefore you can just treat the `TaskRuntime` object a stateless event emitter.

```ts
    import { Task, TaskRuntime, TaskHandle } from "@xmcl/task";

    const runtime: TaskRuntime = Task.createRuntime();
    const task: Task<YourResultType>; // your task
    
    runtime.on("update", ({ progress, total, message }, node) => {
        // handle the progress, total update.
        // message usually the current downloading url.
    });
    runtime.on("execute", (node, parent) => {
        const name = child.name; // name is just the name to create the task

        const newChildPath = child.path; // path is the chaining all parents' name togather
        // if parent name is 'install'
        // and child name is 'json'
        // the path will be 'install.json'

        const arguments = child.arguments; // argument is optional
        // normally the arguments is some values that helps you to localized
        // like 'library' task in during install library
        // it will provide a 'lib' property which is the name of the library
    });

    runtime.on("finish", (result, node) => {
        // every node, parent or child will emit finish event when it finish
    });

    runtime.on("node-error", (error, node) => {
        // emit when a task node (parent or child) failed
    });

    const handle: TaskHandle<YourResultType> = runtime.submit(task);
    await handle.wait();
    // the error will still reject to the promise
```

### Read and Write NBT

You can simply deserialize/serialize nbt.

```ts
    import { serialize, deserialize } from "@xmcl/nbt";
    const fileData: Buffer;
    // compressed = undefined will not perform compress algorithm
    // compressed = true will use gzip algorithm
    const compressed: true | "gzip" | "deflate" | undefined;
    const readed: any = await deserialize(fileData, { compressed });
    // The deserialize return object contain __nbtPrototype__ property which define its nbt type
    // After you do the modification on it, you can serialize it back to NBT
    const buf: Buffer = await serialize(readed, { compressed });
```

You can use class with annotation (decorator) to serialize/deserialize the type consistently.

Suppose you are reading the [servers.dat](https://minecraft.gamepedia.com/Servers.dat_format). You can have:

```ts
import { serialize, deserialize, TagType } from "@xmcl/nbt";

class ServerInfo {
    @TagType(TagType.String)
    icon: string = "";
    @TagType(TagType.String)
    ip: string = "";
    @TagType(TagType.String)
    name: string = "";
    @TagType(TagType.Byte)
    acceptTextures: number = 0;
}

class Servers {
    @TagType([ServerInfo])
    servers: ServerInfo[] = []
}

// read
// explict tell the function to deserialize into the type Servers
const servers = await deserialize(data, { type: Servers });
const infos: ServerInfo[] = servers.servers;

// write
const servers: Servers;
const binary = await serialize(servers);
```

### Read and Write Server Info

```ts
import { readInfo, writeInfo, ServerInfo } from "@xmcl/server-info";

const seversDatBuffer: Buffer; // this is the servers.dat under .minecraft folder
const infos: ServerInfo[] = await readInfo(seversDatBuffer);
const info: ServerInfo = infos[0];

// info.ip -> server ip
// info.name -> server name
```

### Read ResourcePack Content

You can read resource pack content just like Minecraft:

```ts
    import { ResourcePack, ResourceLocation } from "@xmcl/resourcepack"
    const fileFullPath = "path/to/pack/some-pack.zip";
    const pack: ResourcePack = await ResourcePack.open(fileFullPath);

    // this is almost the same with original Minecraft
    // this get the dirt texture png -> minecraft:textures/block/dirt.png
    const resLocation: ResourceLocation = ResourceLocation.ofTexturePath("block/dirt");

    console.log(resLocation); // minecraft:textures/block/dirt.png

    const resource: Resource | void = pack.load(resLocation);
    if (resource) {
        const binaryContent: Uint8Array = resource.content;
        // this is the metadata for resource, like animated texture metadata.
        const metadata: PackMeta = resource.metadata;
    }
```

### Save/World Data Loading

Read the level info from a buffer.

```ts
    import { WorldReader, LevelDataFrame } from '@xmcl/world'
    const worldSaveFolder: string;
    const reader: WorldReader = await WorldReader.create(worldSaveFolder);
    const levelData: LevelDataFrame = await reader.getLevelData();
```

***Preview*** Read the region data, this feature is not tested yet, but the api will look like this

```ts
    import { WorldReader, RegionDataFrame, RegionReader } from "@xmcl/world";
    const worldSaveFolder: string;
    const reader: WorldReader = await WorldReader.create(worldSaveFolder);
    const chunkX: number;
    const chunkZ: number;
    const region: RegionDataFrame = await reader.getRegionData(chunkX, chunkZ);
```

### Scan Local Java

This will scan the paths in arguments and some common places to install java in current os.

So passing an empty array is OK.

```ts
    import { JavaInstaller, JavaInfo } from "@xmcl/java-installer";

    const validJavaList: JavaInfo[] = await JavaInstaller.scanLocalJava([
        "my/java/home"
    ]);

    // it can parse java major version, like `8` or `10`
    const javaMajorVersion: number = validJavaList[0].majorVersion;

    // also the java version
    const javaVersion: string = validJavaList[0].version;

    // also contain the path
    const jPath: string = validJavaList[0].path;
```

### TextComponent

Create TextComponent from string OR Minecraft's formatted string, like `'§cThis is red'`:

```ts
    import { TextComponent, fromFormattedString } from "@xmcl/text-component";
    const formattedString: string;
    const fromFormatted: TextComponent = fromFormattedString(formattedString);
```

Render the TextComponent to css:

```ts
    import { TextComponent, render, RenderNode } from "@xmcl/text-component";
    const yourComponent: TextComponent;
    const node: RenderNode = render(yourComponent);

    node.text; // the text of the node
    node.style; // style of the node
    node.children; // children

    // you can render in dom like this:

    function renderToDom(node: RenderNode) {
        const span = document.createElement('span');
        span.style = node.style;
        span.textContent = node.text;
        for (const child of node.children) {
            span.appendChild(renderToDom(child));
        }
    } 
```

Iterate the TextComponent and its children:

```ts
    import { TextComponent, flat } from "@xmcl/text-component";
    const yourComponent: TextComponent;
    const selfAndAllChildren: Array<TextComponent> = flat(yourComponent);
```

### User Login (Official/Offline)

You can do official or offline login:

```ts
    import { login, offline, Authentication } from "@xmcl/user";
    const username: string;
    const password: string;
    const authFromMojang: Authentication = await login({ username, password }); // official login
    const authOffline: Authentication = offline(username); // offline login

    const accessToken: string = authFromMojang.accessToken;
```

Validate/Refresh/Invalidate access token. This is majorly used for reduce user login and login again.

```ts
    import { validate, refresh } from "@xmcl/user";
    const accessToken: string;
    const clientToken: string;
    const valid: boolean = await validate({ accessToken, clientToken });
    if (!valid) {
        const newAuth: Auth = await refresh({ accessToken, clientToken });
    }
    await invalidate({ accessToken, clientToken });
```

Use third party Yggdrasil API to auth:

```ts
    import { login, YggdrasilAuthAPI } from "@xmcl/user";
    const username: string;
    const password: string;
    const yourAPI: YggdrasilAuthAPI;
    const authFromMojang = await login({ username, password }, yourAPI); // official login
```


### User Skin Operation

Or lookup profile by name:

```ts
    import { lookupByName, GameProfile } from "@xmcl/user";

    const username: string;
    const gameProfile: GameProfile = await lookupByName(username);
```

Fetch the user game profile by uuid. (This could also be used for get skin)


```ts
    import { lookup, GameProfile } from "@xmcl/user";
    const userUUID: string;
    const gameProfile: GameProfile = await lookup(userUUID);
```

Get player skin:

```ts
    import { lookup, GameProfile, getTextures } from "@xmcl/user";
    const userUUID: string;
    const gameProfile: GameProfile = await lookup(userUUID);
    const infos: GameProfile.TexturesInfo | undefined = getTextures(gameProfile);
    const skin: GameProfile.Texture = infos!.textures.SKIN!;
    const skinUrl: string = skin.url; // use url to display skin
    const isSlim: boolean = GameProfile.Texture.isSlim(skin); // determine if model is slim or not
```

Set player skin from URL:

```ts
    import { lookup, GameProfile, setTexture } from "@xmcl/user";
    const userUUID: string;
    const userAccessToken: string;
    const userNewSkinUrl: string;
    await setTexture({
        accessToken: userAccessToken,
        uuid: userUUID,
        type: "skin",
        texture: {
            url: userNewSkinUrl,
            metadata: { model: "slim" }, 
            // suppose this model is a slim model
            // if this model is a normal model, this should be steve
        }
    });
```

Set player skin from binary (read file file):

```ts
    import { lookup, GameProfile, setTexture } from "@xmcl/user";
    const userUUID: string;
    const userAccessToken: string;
    const userNewSkinData: Uint8Array; 
    // in nodejs this can be a `Buffer` from file
    // in browser this can come from a `Blob`
    await setTexture({
        accessToken: userAccessToken,
        uuid: userUUID,
        type: "skin",
        texture: {
            data: userNewSkinData,
            metadata: { model: "steve" }, 
        }
    });
```

Delete player skin (reset to default):

```ts
    import { lookup, GameProfile, setTexture } from "@xmcl/user";
    const userUUID: string;
    const userAccessToken: string;
    await setTexture({
        accessToken: userAccessToken,
        uuid: userUUID,
        type: "skin",
    });
```


## Caching Request

The functions that request minecraft version manifest, forge version webpage, or liteload version manifest can have cache option.

You should save the old result from those functions and pass it as the fallback option. These function will check if your old manifest is outdated or not, and it will only request a new one when your fallback option is outdated.

For Minecraft:

```ts
    const forceGetTheVersionMeta = Installer.getVersionList();
    const result = Installer.getVersionList({ fallback: forceGetTheVersionMeta }); // this should not request the manifest url again, since the forceGetTheVersionMeta is not outdated.
```

Normally you will load the last version manifest from file:

```ts
    const oldManifest = JSON.parse(fs.readFileSync("manifest-whatevername-cache.json").toString());
    const result = Installer.getVersionList({ fallback: oldManifest }); // the result should up-to-date.
```

For Forge, it's the same:

```ts
    const forgeGet = ForgeInstaller.getVersionList(); // force get

    const oldWebPageCache = JSON.parse(fs.readFileSync("forge-anyname-cache.json").toString());
    const updated = ForgeInstaller.getVersionList({ fallback: oldWebPageCache }); // this should be up-to-date
```

## Bundle & Treeshaking

The module built with `ES5` module option by typescript. Please make sure your bundle system support esm import/export.

Some bundler like webpack, rollup support treeshake by default. But the some modules have `export * as SomeNamespace from ...`, which affact the treeshaking.

Like the installer module, if you care about the package size and you want to treeshake your bundle.

You can import the certain module specificly:

```ts
import { install } from "@xmcl/installer/minecraft"; // direct import install Minecraft function
```

Some modules require a preload

```ts
// in nodejs/electron
import "@xmcl/user/setup"; // preload to setup requester
import { login } from "@xmcl/user/auth"; // direct import login function


// in browser
import "@xmcl/user/setup.module";
import { login } from "@xmcl/user/auth"; // direct import login function
```

## Contribute

Feel free to contribute to the project. You can fork the project and make PR to here just like any other github project.

### Setup Dev Workspace

Use git to clone the project `git clone https://github.com/Voxelum/minecraft-launcher-core-node`.

After you cloned the project, you can just install it like normal node project by `npm install` in your repo folder. If there are somethings missing, you can try to run `npm run update` or `npx lerna bootstrap`.

### How to Dev

The code are splited into seperated projects, which layed in under `packages` folder. Most of them are really simple (only one `index.ts` file or few files).

If you want to write some code for specific module, the command `npm run dev` might help you.

For example, you want to add a functions to parse minecraft chunk data, you can add some code in `packages/world/index.ts`. You might also want to add some test related to your new features, just add sth. in `packages/world/test.ts`. 

During this process, you can first run `npm run dev world`, and it will start to auto compile & test the code for world module. You can see the result immediately.

**Highly recommended to add test for the features,** ~~which I always lazy to add.~~

### Before Submit PR

Make sure you run `npm run build` to pass lint and compile at least. (I always forget this) 

## Dependencies & Module Coupling

Just depict some big idea for the module design here. They may not be totally accurate. 

### Core Features (Node/Electron Only)

The features like version parsing, installing, diagnosing, are in this group:

- @xmcl/core
  - @xmcl/installer

They all depends on `@xmcl/core` module, which providing the basic version parsing system. This feature group is nodejs/electron only, as it definity requires file read/write, downloading to file functions, which are no sense on browser in my opinion.

The modules below are used as helper:

- `got`, for downloader
- `yauzl`, for decompressing zip

### User Authorization Features (Node/Electron/Browser)

The features like login, fetch user info/textures goes here:

- @xmcl/user

In node, it will use `got` as requester.
In browser, it will use `fetch` as requester.

### General Gaming Features (Node/Electron/Browser)

The features like parsing game setting, parsing forge mod metadata, NBT parsing, game saves parsing, they don't really have any strong connection.

- @xmcl/nbt
- @xmcl/forge
- @xmcl/gamesetting
- @xmcl/text-component
- @xmcl/system
  - @xmcl/resource-manager
  - @xmcl/world
  - @xmcl/resourcepack
- *@xmcl/client (this is node only module)* 

### Client Only Features (Browser Only)

The features only serves for browser:

- @xmcl/model

## Credit

[Yu Xuanchi](https://github.com/yuxuanchiadm), co-worker, quality control of this project.

[Haowei Wen](https://github.com/yushijinhun), the author of [JMCCC](https://github.com/to2mbn/JMCCC), [Authlib Injector](https://github.com/to2mbn/authlib-injector), and [Indexyz](https://github.com/Indexyz), help me a lot on Minecraft launching, authing.

