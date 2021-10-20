## Getting Started

- [Getting Started](#getting-started)
  - [Build THREE.js model for block and player](#build-threejs-model-for-block-and-player)
  - [Diagnose](#diagnose)
  - [Find Curseforge Mods by search keyword](#find-curseforge-mods-by-search-keyword)
  - [Install Fabric](#install-fabric)
  - [Install Forge](#install-forge)
  - [Install Library/Assets with Customized Host](#install-libraryassets-with-customized-host)
  - [Install Minecraft](#install-minecraft)
  - [Launch Game](#launch-game)
  - [Load Minecraft Block Model](#load-minecraft-block-model)
  - [Load Minecraft Resource](#load-minecraft-resource)
  - [Mojang Security API](#mojang-security-api)
  - [Parse Fabric Mod Metadata](#parse-fabric-mod-metadata)
  - [Parse Forge Mod/Config](#parse-forge-modconfig)
  - [Parse GameSetting (options.txt)](#parse-gamesetting-optionstxt)
  - [Parse Liteloader Mod](#parse-liteloader-mod)
  - [Parse ResourcePack Basic Info](#parse-resourcepack-basic-info)
  - [Parse Version JSON](#parse-version-json)
  - [Ping Minecraft Server](#ping-minecraft-server)
  - [Ping Minecraft Server](#ping-minecraft-server-1)
  - [Progress Moniting](#progress-moniting)
  - [Progress Moniting on Installation](#progress-moniting-on-installation)
  - [Read and Write NBT](#read-and-write-nbt)
  - [Read and Write Server Info](#read-and-write-server-info)
  - [Read ResourcePack Content](#read-resourcepack-content)
  - [Save/World Data Loading](#saveworld-data-loading)
  - [TextComponent](#textcomponent)
  - [User Login (Official/Offline)](#user-login-officialoffline)
  - [User Skin Operation](#user-skin-operation)
- [Caching Request](#caching-request)

### Build THREE.js model for block and player

*Please read how to use [resourcepacks](https://github.com/Voxelum/minecraft-launcher-core-node/tree/master/packages/resourcepack/README.md) before this*

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



### Find Curseforge Mods by search keyword

You can use keyword to search

```ts
    import { searchAddons, SearchOptions } from '@xmcl/curseforge'
    const searchOptions: SearchOptions = {
        categoryId: 6, // 6 is mod,
    };
    const setting: GameSetting = searchAddons(settingString);
    const string: string = GameSetting.stringify(setting);
```

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

### Load Minecraft Block Model

You can use this to load Minecraft block model and texture just like Minecraft.

```ts
    import { ResourcePack, Resource, BlockModel,ResourceManager, ModelLoader } from "@xmcl/resourcepack"; 
    import { openFileSystem } from "@xmcl/system";

    const man = new ResourceManager();
    const resourcePack = new ResourcePack(await openFileSystem("/path/to/resource-pack.zip"));
    // setup resource pack
    man.addResourcePack(resourcePack);

    const loader = new ModelLoader(man);

    await loader.loadModel("block/grass"); // load grass model
    await loader.loadModel("block/stone"); // load stone model
    // ... load whatever you want model

    const textures: Record<string, Resource> = loader.textures;
    const models: Record<string, BlockModel.Resolved> = loader.models;

    const resolvedModel: BlockModel.Resolved = models["block/grass"];
```


### Load Minecraft Resource

You can use this module in nodejs/electron:

```ts
import { openFileSystem } from "@xmcl/system"; 
import { ResourcePack, Resource, ResourceManager, ResourceLocation  } from "@xmcl/resourcepack"; 
const manager: ResourceManager = new ResourceManager();

// add a resource source which load resource from file
await manager.addResourcePack(new ResourcePack(await openFileSystem('/base/path')));

// load grass block model resource; it will load file at `assets/${location.domain}/${location.path}`
// which is '/base/path/assets/minecraft/models/block/grass.json'
// same logic with minecraft
const resource = await manager.get(ResourceLocation.ofModelPath('block/grass'));

const content: string = await resource.read("utf-8"); // your resource content
const modelJSON = JSON.parse(content);
```

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
    import { readFabricMod, FabricModMetadata } from "@xmcl/mods";
    const modJarBinary = fs.readFileSync("your-fabric.jar");
    const metadata: FabricModMetadata = await readFabricMod(modJarBinary);

    // or directly read from path
    const sameMetadata: FabricModMetadata = await readFabricMod("your-fabric.jar");
```


### Parse Forge Mod/Config

Read the forge mod metadata, including `@Mod` annotation, mcmods.info, and toml metadata.

```ts
    import { readForgeMod, ForgeModMetadata } from "@xmcl/mods";
    const forgeModJarBuff: Buffer;
    const metadata: ForgeModMetadata[] = await readForgeMod(forgeModJarBuff);
    const modid = metadata[0].modid; // get modid of first mods
```

If you don't want to read that much (as it will transver all the file in jar), you can try to use them separately:

```ts
    import { resolveFileSystem } from "@xmcl/system";
    import { readForgeModJson, readForgeModManifest, readForgeModToml, ForgeModMetadata, readForgeModAsm } from "@xmcl/mods";
    const forgeModJarBuff: Buffer;
    const fs = await resolveFileSystem(forgeModJarBuff);
    // read json
    // if this is new mod, this will be empty record {}
    const metadata: Record<string, ForgeModMetadata> = await readForgeModJson(fs);
    // or read `META-INF/MANIFEST.MF`
    const manifest: Record<string, string> = await readForgeModManifest(fs, metadata /* this is optional, to fill the modmetadata if found */);
    // read new toml
    await readForgeModToml(fs, metadata /* it will fill mods into this param & return it */, manifest /* this is optional */);
    // optional step, if the mod is really unstandard, not have mcmod.info and toml, you can use this
    // this can identify optifine and in some case, might detect some coremod
    // this will go over all file in your jar, it might hit your perf.
    await readForgeModAsm(fs, metadata, { manifest });
```


Read the forge mod config file (.cfg)

```ts
    import { ForgeConfig } from "@xmcl/mods";
    const modConfigString: string;
    const config: ForgeConfig = ForgeConfig.parse(modConfigString);
    const serializedBack: string = ForgeConfig.stringify(config);
```


### Parse GameSetting (options.txt)

Serialize/Deserialize the minecraft game setting string.

```ts
    import { GameSetting } from '@xmcl/gamesetting'
    const settingString;
    const setting: GameSetting = GameSetting.parse(settingString);
    const string: string = GameSetting.stringify(setting);
```

### Parse Liteloader Mod

Read .litemod metadata:

```ts
    import { LiteloaderModMetadata, readLiteloaderMod } from "@xmcl/mods";
    const metadata: LiteloaderModMetadata = await readLiteloaderMod(`${mock}/mods/sample-mod.litemod`);
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
    import { Version } from "@xmcl/core";
    const minecraftLocation: string;
    const minecraftVersionId: string;

    const resolvedVersion: ResolvedVersion = await Version.parse(minecraftLocation, minecraftVersionId);
```


### Ping Minecraft Server  

The usage is just like asm library in java:

```ts
    import { AnnotationVisitor, ClassReader, ClassVisitor, MethodVisitor, Opcodes } from '@xmcl/asm'


    class CustomClassVisitor extends ClassVisitor {
        public constructor() {
            super(Opcodes.ASM5);
        }

        // visit the class 
        visit(version: number, access: number, name: string, signature: string, superName: string, interfaces: string[]): void {
        }

        // visit method
        public visitMethod(access: number, name: string, desc: string, signature: string, exceptions: string[]) {
            return null;
        }

        // visit field
        public visitField(access: number, name: string, desc: string, signature: string, value: any) {
            return null;
        }
    }

    const visitor = new CustomClassVisitor();
    const classData: Buffer = await fs.readFile("path/to/some.class");
    new ClassReader(classData).accept(visitor);
```

### Ping Minecraft Server  

Read sever info (server ip, port) and fetch its status (ping, server motd):

```ts
    import { queryStatus, Status, QueryOptions } from '@xmcl/client'
    const serverInfo = {
        host: 'your host',
        port: 25565, // be default
    };
    const options: QueryOptions = {
        /**
         * see http://wiki.vg/Protocol_version_numbers
         */
        protocol: 203,
    };
    const rawStatusJson: Status = await fetchStatus(info, options);
```

### Progress Moniting

You can use `@xmcl/task` model to track the progress of a task. *In the launcher, they are majorly download task.*

This module implements a basic object model for task with progress. The task can be paused or cancelled.

```ts
    import { Task, TaskBase, task } from "@xmcl/task";

    class ATask extends TaskBase {
        // implement a task
    }

    class BTask extends TaskBase {
        // implement a task
    }

    // suppose you have such task
    const myTask = task("hello", function() {
        await this.yield(new ATask().setName("world"));
        await this.yield(new BTask().setName("xmcl"));
    });

    // start a task
    const result = await task.startAndWait({
        onStart(task: Task<any>) {
            // the task path is the task name joined by dot (.)
            const path = task.path;
            console.log(`${path} started!`);
        },
        onUpdate(task: Task<any>, chunkSize: number) {
            // a task update
        },
        onFailed(task: Task<any>, error: any) {
            // on a task fail
        },
        onSuccessed(task: Task<any>, result: any) {
            // on task success
            const path = task.path;
            console.log(`${path} ended!`);
        },
        // on task is paused/resumed/cancelled
        onPaused(task: Task<any>) { },
        onResumed(task: Task<any>) { },
        onCancelled(task: Task<any>) { },
    });
    // the result will print like
    // hello started!
    // hello.world started!
    // hello.world ended!
    // hello.xmcl started!
    // hello.xmcl ended!
    // hello ended!
```

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
    onSuccessed(task: Task<any>, result: any) {
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


### Read and Write NBT

You can simply deserialize/serialize nbt.

```ts
    import { serialize, deserialize } from "@xmcl/nbt";
    const fileData: Buffer;
    // compressed = undefined will not perform compress algorithm
    // compressed = true will use gzip algorithm
    const compressed: true | "gzip" | "deflate" | undefined;
    const readed: any = await deserialize(fileData, { compressed });
    // The deserialize return object contain NBTPrototype property which define its nbt type
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

    const resource: Resource | undefined = await pack.get(resLocation);
    if (resource) {
        const binaryContent: Uint8Array = await resource.read();
        // this is the metadata for resource, like animated texture metadata.
        const metadata: PackMeta = await resource.readMetadata();
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