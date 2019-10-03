# Minecraft Launcher Core

[![npm version](https://img.shields.io/npm/v/@xmcl/minecraft-launcher-core.svg)](https://www.npmjs.com/package/@xmcl/minecraft-launcher-core)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Convensional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://www.conventionalcommits.org)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Build%20Validation/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Build%20Validation/badge.svg)


Provide several useful functions for Minecraft.

This package is targeting the [Electron](https://electronjs.org) environment. Feel free to report issues related to it.

## Installation & Usage

This repo maintaining multiple mini package for specific function.

You can install all of them in a single package: `@xmcl/minecraft-launcher-core` like:

`import { NBT, ServerInfo, ...so on...} from '@xmcl/minecraft-launcher-core'`

Or you can import them seperately.

`import { NBT } from '@xmcl/nbt'`

## Getting Started

- [Minecraft Launcher Core](#minecraft-launcher-core)
  - [Installation & Usage](#installation--usage)
  - [Getting Started](#getting-started)
    - [User Login & Auth (Official/Offline)](#user-login--auth-officialoffline)
    - [NBT](#nbt)
    - [Save/World Data Loading](#saveworld-data-loading)
    - [Minecraft Client Ping Server](#minecraft-client-ping-server)
    - [Minecraft Install](#minecraft-install)
    - [GameSetting (options.txt)](#gamesetting-optionstxt)
    - [ResourcePack](#resourcepack)
    - [Game Profile](#game-profile)
    - [Mojang Account Info](#mojang-account-info)
    - [Forge Parsing](#forge-parsing)
    - [Forge Installation](#forge-installation)
    - [TextComponent](#textcomponent)
    - [Minecraft Version Parsing](#minecraft-version-parsing)
    - [Fabric](#fabric)
    - [Launch](#launch)
  - [Experiental Features](#experiental-features)
    - [Monitor download progress](#monitor-download-progress)
    - [Caching Request](#caching-request)
  - [Credit](#credit)

### User Login & Auth (Official/Offline) 

```ts
    import { Auth } from "@xmcl/auth";
    const username: string;
    const password: string;
    const authFromMojang: Auth = await Auth.Yggdrasil.login({ username, password }); // official login
    const authOffline: Auth = Auth.offline(username); // offline login

    const accessToken: string = authFromMojang.accessToken;
```

Online/offline login

```ts
    import { Auth } from "@xmcl/auth";
    const accessToken: string;
    const clientToken: string;
    const valid: boolean = await Auth.Yggdrasil.validate({ accessToken, clientToken });
    const newAuth: Auth = await Auth.Yggdrasil.refresh({ accessToken, clientToken });
    await Auth.Yggdrasil.invalidate({ accessToken, clientToken });
```

Validate/Refresh/Invalidate access token.


```ts
    import { Auth } from "@xmcl/auth";
    const username: string;
    const password: string;
    const yourAPI: Auth.Yggdrasil.API;
    const authFromMojang: Auth = await Auth.Yggdrasil.login({ username, password }, yourAPI); // official login
```

Use third party Yggdrasil API to auth.

### NBT

```ts
    import { NBT } from "@xmcl/nbt";
    const fileData: Buffer;
    const compressed: boolean;
    const readed: NBT.Persistence.TypedObject = NBT.Persistence.deserialize(fileData, compressed);

    const serial = NBT.Persistence.createSerializer()
        .register("server", {
            name: NBT.TagType.String,
            host: NBT.TagType.String,
            port: NBT.TagType.Int,
            icon: NBT.TagType.String,
        });
    const serverInfo;
    const serialized: Buffer = serial.serialize(serverInfo, "server");
```

### Save/World Data Loading

```ts
    import { World, LevelDataFrame } from '@xmcl/world'
    const levelDatBuffer: Buffer;
    const info: LevelDataFrame = await World.parseLevelData(levelDatBuffer);
```

Read the level info from a buffer.

```ts
    import { World } from "@xmcl/world";
    const worldSaveFolder: string;
    const { level, players } = await World.load(worldSaveFolder, ["level", "player"]);
```

Read the level data & player data by save folder location string.

### Minecraft Client Ping Server

```ts
    import { Server } from '@xmcl/client'
    const seversDatBuffer: Buffer;
    const infos: Server.Info[] = await Server.readInfo(seversDatBuffer);
    const info: Server.Info = infos[0]
    // fetch the server status
    const promise: Promise<Server.Status> = Server.fetchStatus(info);
    // or you want the raw json
    const rawJsonPromise: Promise<Server.StatusFrame> = Server.fetchStatusFrame(info);
```

Read sever info and fetch its status.

### Minecraft Install

```ts
    import { Installer } from "@xmcl/installer";
    import { MinecraftLocation } from "@xmcl/util";
    import { ResolvedVersion } from "@xmcl/version";

    const minecraft: MinecraftLocation;
    const versionPromise: Promise<ResolvedVersion> = Installer.updateVersionMeta()
        .then((metas: Installer.VersionMetaList) => metas.versions[0]) // i just pick the first version in list here
        .then((meta: Installer.VersionMeta) => Installer.install("client", meta, minecraft));
```

Fully install vanilla minecraft client including assets and libs.

### GameSetting (options.txt)

```ts
    import { GameSetting } from '@xmcl/gamesetting'
    const settingString;
    const setting: GameSetting = GameSetting.parse(settingString);
    const string: string = GameSetting.stringify(setting);
```

Serialize/Deserialize the minecraft game setting string.

### ResourcePack

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

Read ResourcePack from filePath

### Game Profile 

```ts
    import { ProfileService, GameProfile } from "@xmcl/profile-service"
    const userUUID: string;
    const gameProfilePromise: GameProfile = await ProfileService.fetch(userUUID);
```

Or lookup profile by name.

```ts
    const username: string;
    const gameProfilePromise: Promise<GameProfile> = ProfileService.lookup(username);
```

Fetch the user game profile by uuid. This could also be used for get skin.

```ts
    const gameProfile: GameProfile;
    const texturesPromise: Promise<GameProfile.Textures> = ProfileService.fetchProfileTexture(gameProfile);
```

### Mojang Account Info

```ts
    import { MojangService } from "@xmcl/mojang";
    const accessToken: string;
    const info: Promise<MojangAccount> = MojangService.getAccountInfo(accessToken);
```

Get personal info from mojang.

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

Validate if user have a validated IP address, and get & answer challenges to validate player's identity.

### Forge Parsing

```ts
    import { Forge } from "@xmcl/forge";
    const forgeModJarBuff: Buffer;
    const metadata: Forge.MetaData[] = Forge.readModMetaData(forgeModJarBuff);

    const modid = metadata[0].modid; // get modid of first mods
```

Read the forge mod metadata, including `@Mod` annotation and mcmods.info json data

```ts
    const modConfigString: string;
    const config: Forge.Config = Forge.Config.parse(modConfigString);
    const serializedBack = Forge.Config.stringify(config);
```

Read the forge mod config

### Forge Installation

```ts
    import { ForgeInstaller, ForgeWebPage } from "@xmcl/forge-installer";
    import { MinecraftLocation } from "@xmcl/util";
    const page: ForgeWebPage = await ForgeWebPage.getWebPage();
    const minecraftLocation: MinecraftLocation;
    const mcversion = page.mcversion; // mc version
    const firstVersionOnPage: ForgeWebPage.Version = page.versions[0];
    await ForgeInstaller.install(firstVersionOnPage, minecraftLocation);
```

Get the forge version info and install forge from it. 

Notice that this installation doesn't ensure full libraries installation.
Please run `Installer.installDependencies` afther that.

The new 1.13 forge installation process requires java to run. 
Either you have `java` executable in your environment variable PATH,
or you can assign java location by `ForgeInstaller.install(forgeVersionMeta, minecraftLocation, { java: yourJavaExecutablePath });`.

If you use this auto installation process to install forge, please checkout [Lex's Patreon](https://www.patreon.com/LexManos).
Consider support him to maintains forge.

### TextComponent

```ts
    import { TextComponent } from "@xmcl/text-component";
    const fromString: TextComponent = TextComponent.str("from string");
    const formattedString: string;
    const fromFormatted: TextComponent = TextComponent.from(formattedString);
```

Create TextComponent from string OR Minecraft's formatted string, like '§cThis is red'

### Minecraft Version Parsing

```ts
    import { Versoin } from "@xmcl/version";
    const minecraftLocation: string;
    const minecraftVersionId: string;

    const resolvedVersion: ResolvedVersion = await Version.parse(minecraftLocation, minecraftVersionId);
```

Parse minecraft version as a resolved version, which is used for launching process. You can also read version info from it if you want.

```ts
    import { Versoin, VersionDiagnosis } from "@xmcl/version";
    const minecraftLocation: string;
    const minecraftVersionId: string;

    const report: VersionDiagnosis = await Version.diagnose(minecraftLocation, minecraftVersionId);
```

Get the report of the version. It can check if version missing assets/libraries.


### Fabric 

```ts
    import { Fabric } from "@xmcl/fabric";
    const versionList: Fabric.VersionList = await Fabric.updateVersionList();
    const latestYarnVersion = versionList.yarnVersions[0]; // yarn version is combined by mcversion+yarn build number
    const latestLoaderVersion = versionList.loaderVersions[0];
```

Fetch the new fabric version list.

```ts
    import { Fabric } from "@xmcl/fabric";
    const minecraftLocation: MinecraftLocation;
    const yarnVersion: string; // e.g. "1.14.1+build.10"
    const loaderVersion: string; // e.g. "0.4.7+build.147"
    const installPromise: Promise<void> = Fabric.install(yarnVersion, loaderVersion, minecraftLocation)
```

Install fabric to the client. This installation process doesn't ensure the minecraft libraries.

Please run `Installer.installDependencies` after that to install fully.

### Launch

```ts
    import { Launcher } from "@xmcl/launch"
    const version: string;
    const javaPath: string;
    const gamePath: string;
    const proc: Promise<ChildProcess> = Launcher.launch({ gamePath, javaPath, version });
```

Launch minecraft from a version.

```ts
    const proc: Promise<ChildProcess> = Launcher.launch({ gamePath, javaPath, version, extraExecOption: { detached: true } });
```

Detach from the parent process. So your launcher's exit/crash won't affact the Minecraft running.

## Experiental Features

They might be not stable.

### Monitor download progress

```ts
    import { Installer } from "@xmcl/installer";
    import Task from "@xmcl/task";
    import { Version } from "@xmcl/version";

    const expectedVersion: string;
    const expectedMcLoc: MinecraftLocation;
    const resolvedVersion: Version.Resolved = await Version.parse(expectedMcLoc, expectedVersion);
    const task: Task<Version> = Installer.installDependenciesTask(resolvedVersion, expectedMcLoc);

    task.on('update', ({ progress, total, message }) => {
        // monitor progress / total and message here
    });

```

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

