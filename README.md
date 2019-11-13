# Minecraft Launcher Core

[![npm version](https://img.shields.io/npm/v/@xmcl/minecraft-launcher-core.svg)](https://www.npmjs.com/package/@xmcl/minecraft-launcher-core)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Convensional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://www.conventionalcommits.org)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

Provide several useful functions for Minecraft.

Most packages are targeting the [Electron](https://electronjs.org) environment. Feel free to report issues related to it.

## Installation & Usage

This repo maintaining multiple mini packages for specific functions.

If you use electron to write a launcher, you can install all of them in a single package: `@xmcl/minecraft-launcher-core` like:

`import { NBT, ServerInfo, ...so on...} from '@xmcl/minecraft-launcher-core'`

Or you can import them seperately, if you want to add specific package to dependency, like just using `@xmcl/nbt`:

`import { NBT } from '@xmcl/nbt'`

The `@xmcl/model` is a browser only package, as it's using [THREE.js](https://threejs.org/) to create model. You can see it in the section - [Build THREE.js model for block and player](#build-threejs-model-for-block-and-player).

Currently, I'm planning make several packages usable in **both browser and node environments**, like `@xmcl/resource-manager`, which can load minecraft model in minecraft resource packs. 

Or even `@xmcl/nbt` package, someone might need to parse nbt in browser.

## Getting Started

- [Minecraft Launcher Core](#minecraft-launcher-core)
  - [Installation & Usage](#installation--usage)
  - [Getting Started](#getting-started)
    - [User Login & Auth (Official/Offline)](#user-login--auth-officialoffline)
    - [Minecraft Client Ping Server](#minecraft-client-ping-server)
    - [Fetch & Install Fabric](#fetch--install-fabric)
    - [Forge Mod Parsing](#forge-mod-parsing)
    - [Forge Installation](#forge-installation)
    - [Minecraft Install](#minecraft-install)
    - [Install Liteloader](#install-liteloader)
    - [Build THREE.js model for block and player](#build-threejs-model-for-block-and-player)
    - [Mojang Account Info](#mojang-account-info)
    - [Read/Write NBT](#readwrite-nbt)
    - [Game Profile](#game-profile)
    - [Load Minecraft Resource](#load-minecraft-resource)
    - [Load Minecraft Block Model](#load-minecraft-block-model)
    - [Read ResourcePack Basic Info](#read-resourcepack-basic-info)
    - [Progress Moniting](#progress-moniting)
    - [TextComponent](#textcomponent)
    - [Minecraft Version Parsing](#minecraft-version-parsing)
    - [Save/World Data Loading](#saveworld-data-loading)
  - [Experiental Features](#experiental-features)
    - [Caching Request](#caching-request)
  - [Credit](#credit)

### User Login & Auth (Official/Offline)

You can do official or offline login:

```ts
    import { Auth } from "@xmcl/auth";
    const username: string;
    const password: string;
    const authFromMojang: Auth = await Auth.Yggdrasil.login({ username, password }); // official login
    const authOffline: Auth = Auth.offline(username); // offline login

    const accessToken: string = authFromMojang.accessToken;
```

Validate/Refresh/Invalidate access token. This is majorly used for reduce user login and login again.

```ts
    import { Auth } from "@xmcl/auth";
    const accessToken: string;
    const clientToken: string;
    const valid: boolean = await Auth.Yggdrasil.validate({ accessToken, clientToken });
    if (!valid) {
        const newAuth: Auth = await Auth.Yggdrasil.refresh({ accessToken, clientToken });
    }
    await Auth.Yggdrasil.invalidate({ accessToken, clientToken });
```

Use third party Yggdrasil API to auth:

```ts
    import { Auth } from "@xmcl/auth";
    const username: string;
    const password: string;
    const yourAPI: Auth.Yggdrasil.API;
    const authFromMojang: Auth = await Auth.Yggdrasil.login({ username, password }, yourAPI); // official login
```

### Minecraft Client Ping Server

Read sever info (server ip, port) and fetch its status (ping, server motd):

```ts
    import { Server } from '@xmcl/client'
    const seversDatBuffer: Buffer; // this is the servers.dat under .minecraft folder
    const infos: Server.Info[] = await Server.readInfo(seversDatBuffer);
    const info: Server.Info = infos[0]
    // fetch the server status
    const promise: Promise<Server.Status> = Server.fetchStatus(info);
    // or you want the raw json
    const rawJsonPromise: Promise<Server.StatusFrame> = Server.fetchStatusFrame(info);
```

### Fetch & Install Fabric

Fetch the new fabric version list.

```ts
    import { Fabric } from "@xmcl/fabric";
    const versionList: Fabric.VersionList = await Fabric.updateVersionList();
    const latestYarnVersion = versionList.yarnVersions[0]; // yarn version is combined by mcversion+yarn build number
    const latestLoaderVersion = versionList.loaderVersions[0];
```

Install fabric to the client. This installation process doesn't ensure the minecraft libraries.

```ts
    import { Fabric } from "@xmcl/fabric";
    const minecraftLocation: MinecraftLocation;
    const yarnVersion: string; // e.g. "1.14.1+build.10"
    const loaderVersion: string; // e.g. "0.4.7+build.147"
    const installPromise: Promise<void> = Fabric.install(yarnVersion, loaderVersion, minecraftLocation)
```

Please run `Installer.installDependencies` after that to install fully.

### Forge Mod Parsing

Read the forge mod metadata, including `@Mod` annotation and mcmods.info json data.

```ts
    import { Forge } from "@xmcl/forge";
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

### Forge Installation

Get the forge version info and install forge from it. 

```ts
    import { ForgeInstaller, ForgeWebPage } from "@xmcl/forge-installer";
    import { MinecraftLocation } from "@xmcl/util";
    const page: ForgeWebPage = await ForgeWebPage.getWebPage();
    const minecraftLocation: MinecraftLocation;
    const mcversion = page.mcversion; // mc version
    const firstVersionOnPage: ForgeWebPage.Version = page.versions[0];
    await ForgeInstaller.install(firstVersionOnPage, minecraftLocation);
```

Notice that this installation doesn't ensure full libraries installation.
Please run `Installer.installDependencies` afther that.

The new 1.13 forge installation process requires java to run. 
Either you have `java` executable in your environment variable PATH,
or you can assign java location by `ForgeInstaller.install(forgeVersionMeta, minecraftLocation, { java: yourJavaExecutablePath });`.

If you use this auto installation process to install forge, please checkout [Lex's Patreon](https://www.patreon.com/LexManos).
Consider support him to maintains forge.

### Minecraft Install

Fully install vanilla minecraft client including assets and libs.

```ts
    import { Installer } from "@xmcl/installer";
    import { MinecraftLocation } from "@xmcl/util";
    import { ResolvedVersion } from "@xmcl/version";

    const minecraft: MinecraftLocation;
    const list: Installer.VersionMetaList = await Installer.updateVersionMeta();
    const aVersion: Installer.VersionMeta = list[0]; // i just pick the first version in list here
    await Installer.install("client", aVersion, minecraft);
```

Just install libraries:

```ts
    import { Installer } from "@xmcl/installer";
    import { MinecraftLocation } from "@xmcl/util";
    import { ResolvedVersion, Version } from "@xmcl/version";

    const minecraft: MinecraftLocation;
    const version: string; // version string like 1.13
    const resolvedVersion: ResolvedVersion = await Version.parse(version);
    await Installer.installLibraries(resolvedVersion);
```

Just install assets:

```ts
    import { Installer } from "@xmcl/installer";
    import { MinecraftLocation } from "@xmcl/util";
    import { ResolvedVersion, Version } from "@xmcl/version";

    const minecraft: MinecraftLocation;
    const version: string; // version string like 1.13
    const resolvedVersion: ResolvedVersion = await Version.parse(version);
    await Installer.installAssets(resolvedVersion);
```

Just ensure all assets and libraries are installed:

```ts
    import { Installer } from "@xmcl/installer";
    import { MinecraftLocation } from "@xmcl/util";
    import { ResolvedVersion, Version } from "@xmcl/version";

    const minecraft: MinecraftLocation;
    const version: string; // version string like 1.13
    const resolvedVersion: ResolvedVersion = await Version.parse(version);
    await Installer.installDependencies(resolvedVersion);
```

### Install Liteloader

Fetch liteloader version and install:

```ts
    import { LiteLoader } from "@xmcl/liteloader";

    const root: string; // minecraft root
    const list = await LiteLoader.VersionMetaList.update();
    const meta = list.versions['some-version'].release!;
    await LiteLoader.installAndCheck(meta, new MinecraftFolder(root));
```

Read .litemod metadata:

```ts
    import { LiteLoader } from "@xmcl/liteloader";
    const metadata: LiteLoader.MetaData = await LiteLoader.meta(`${mock}/mods/sample-mod.litemod`);
```

### Build THREE.js model for block and player

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

### Mojang Account Info

Get personal info from mojang.

```ts
    import { MojangService } from "@xmcl/mojang";
    const accessToken: string;
    const info: Promise<MojangAccount> = MojangService.getAccountInfo(accessToken);
```

Validate if user have a validated IP address, and get & answer challenges to validate player's identity.

```ts
    import { MojangService } from "@xmcl/mojang";
    const accessToken: string;
    const validIp: boolean = await MojangService.checkLocation(accessToken);

    if (!validIp) {
        const challenges: MojangChallenge[] = await MojangService.getChallenges(accessToken);
        // after your answer the challenges
        const responses: MojangChallengeResponse[];
        await MojangService.responseChallenges(accessToken, responses);
    }
```

### Read/Write NBT

You can simply deserialize/serialize nbt.

```ts
    import { NBT } from "@xmcl/nbt";
    const fileData: Buffer;
    const compressed: boolean;
    const readed: NBT.Persistence.TypedObject = await NBT.Persistence.deserialize(fileData, { compressed });
    // NBT.Persistence.TypedObject is just a object with __nbtPrototype__ defining its nbt type
    // After you do the modification on it, you can serialize it back to NBT
    const buf: Buffer = await NBT.Persistence.serialize(readed, { compressed });

    // or use serializer style
    const serial = NBT.Persistence.createSerializer()
        .register("server", {
            name: NBT.TagType.String,
            host: NBT.TagType.String,
            port: NBT.TagType.Int,
            icon: NBT.TagType.String,
        });
    const serverInfo: any; // this doesn't require the js object to be a TypedObject
    const serialized: Buffer = await serial.serialize(serverInfo, "server");
```

### Game Profile 

Or lookup profile by name:

```ts
    const username: string;
    const gameProfilePromise: Promise<GameProfile> = ProfileService.lookup(username);
```

Fetch the user game profile by uuid. (This could also be used for get skin)


```ts
    import { ProfileService, GameProfile } from "@xmcl/profile-service"
    const userUUID: string;
    const gameProfilePromise: GameProfile = await ProfileService.fetch(userUUID);
```

Get player texture:

```ts
    const gameProfilePromise: GameProfile;
    const texturesPromise: Promise<GameProfile.Textures> = ProfileService.fetchProfileTexture(gameProfilePromise);
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

### Load Minecraft Block Model

You can use this to load Minecraft block model and texture.

```ts
    import { ResourceManager, ModelLoader, TextureRegistry, ModelRegistry } from "@xmcl/resource-manager";
    import { BlockModel } from "@xmcl/common";

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

### Read ResourcePack Basic Info

Read ResourcePack from filePath

```ts
    import { ResourcePack } from "@xmcl/resourcepack"
    const fileFullPath = "path/to/pack/some-pack.zip";
    const pack: ResourcePack = await ResourcePack.read(fileFullPath);
    // or you want read from folder, same function call
    const dirFullPath = "path/to/pack/some-pack";
    const fromFolder: ResourcePack = await ResourcePack.read(dirFullPath);

    // if you have already read the file, don't want to reopen the file
    // the file path will be only used for resource pack name
    const fileContentBuffer: Buffer;
    const packPromise: ResourcePack = await ResourcePack.read(fileFullPath, fileContentBuffer);
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

### TextComponent

Create TextComponent from string OR Minecraft's formatted string, like '§cThis is red'

```ts
    import { TextComponent } from "@xmcl/text-component";
    const fromString: TextComponent = TextComponent.str("from string");
    const formattedString: string;
    const fromFormatted: TextComponent = TextComponent.from(formattedString);
```

Render the TextComponent to css

```ts
    import { TextComponent } from "@xmcl/text-component";
    const yourComponent: TextComponent;
    const hint: Array<{ style: string; text: string }> = TextComponent.render(yourComponent);
```

### Minecraft Version Parsing

Parse minecraft version as a resolved version, which is used for launching process. You can also read version info from it if you want.

```ts
    import { Versoin } from "@xmcl/version";
    const minecraftLocation: string;
    const minecraftVersionId: string;

    const resolvedVersion: ResolvedVersion = await Version.parse(minecraftLocation, minecraftVersionId);
```

Get the report of the version. It can also check if the version is missing assets/libraries.

```ts
    import { Versoin, VersionDiagnosis } from "@xmcl/version";
    const minecraftLocation: string;
    const minecraftVersionId: string;

    const report: VersionDiagnosis = await Version.diagnose(minecraftLocation, minecraftVersionId);
```

### Save/World Data Loading

Read the level info from a buffer.

```ts
    import { World, LevelDataFrame } from '@xmcl/world'
    const levelDatBuffer: Buffer;
    const info: LevelDataFrame = await World.parseLevelData(levelDatBuffer);
```
Read the level data & player data by save folder location string.

```ts
    import { World } from "@xmcl/world";
    const worldSaveFolder: string;
    const { level, players } = await World.load(worldSaveFolder, ["level", "player"]);
```

## Experiental Features

They might be not stable.

### Caching Request

The functions that request minecraft version manifest, forge version webpage, or liteload version manifest can have cache option.

You should save the old result from those functions and pass it as the fallback option. These function will check if your old manifest is outdated or not, and it will only request a new one when your fallback option is outdated.

For Minecraft:

```ts
    const forceGetTheVersionMeta = Installer.updateVersionMeta();
    const result = Installer.updateVersionMeta({ fallback: forceGetTheVersionMeta }); // this should not request the manifest url again, since the forceGetTheVersionMeta is not outdated.
```

Normally you will load the last version manifest from file:

```ts
    const oldManifest = JSON.parse(fs.readFileSync("manifest-whatevername-cache.json").toString());
    const result = Installer.updateVersionMeta({ fallback: oldManifest }); // the result should up-to-date.
```

For Forge, it's the same:

```ts
    const forgeGet = ForgeWebPage.getWebPage(); // force get

    const oldWebPageCache = JSON.parse(fs.readFileSync("forge-anyname-cache.json").toString());
    const updated = ForgeWebPage.getWebPage({ fallback: oldWebPageCache }); // this should be up-to-date
```

## Credit

[Yu Xuanchi](https://github.com/yuxuanchiadm), co-worker, quality control of this project.

[Haowei Wen](https://github.com/yushijinhun), the author of [JMCCC](https://github.com/to2mbn/JMCCC), [Authlib Injector](https://github.com/to2mbn/authlib-injector), and [Indexyz](https://github.com/Indexyz), help me a lot on Minecraft launching, authing.

