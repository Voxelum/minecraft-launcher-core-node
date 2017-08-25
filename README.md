# ts-minecraft
Provide several useful function for Minecraft in typescript
## Usage
`import { NBT, ServerInfo, ...so on...} from 'ts-minecraft'`

!!!!!!!!!
Notice that this package is still WIP, no much tested yet.
Use with your own risk....
!!!!!!!!!

## Getting Started
- **[NBT](#nbt)**
- **[World](#worldinfo)**<br>
- **[Server](#server)**<br>
- **[Minecraft Install](#minecraft-install)**<br>
- **[GameSetting](#gamesetting)**<br>
- **[Language](#language)**<br>
- **[ResourcePack](#resourcepack)**<br>
- **[TextComponent](#textcomponent)**<br>
- **[Auth](#auth)**<br>
- **[Launch](#launch)**<br>

### NBT
    import { NBT } from 'ts-minecraft'
    const fileData: Buffer;
    const compressed: boolean;
    const readed: any = NBT.parse(fileData, compressed);

Read a NBT buffer to an JSON object. 

### WorldInfo
    import { WorldInfo } from 'ts-minecraft'
    const levelDatBuffer: Buffer;
    const info: WorldInfo = WorldInfo.parse(levelDatBuffer);
Read a WorldInfo from buffer.

### Server
    import { ServerStatus, ServerInfo } from 'ts-minecraft'
    const seversDatBuffer: Buffer;
    const infos: ServerInfo[] = ServerInfo.parseNBT(seversDatBuffer);
    const info: ServerInfo = infos[0]
    const promise: Promise<ServerStatus> = ServerInfo.fetchStatus(info);

Read sever info and fetch its status.

### Minecraft Install
    import { VersionMeta, VersionMetaList, Version, MetaContainer, MinecraftLocation } from 'ts-minecraft'
    const minecraft: MinecraftLocation;
    const versionPromise: Promise<Version> = Version.updateVersionMeta()
        .then((metas: MetaContainer) => metas.list.versions[0])
        .then((meta: VersionMeta) => Version.install('client', meta, minecraft))

Fully install vanilla minecraft client including assets and libs.

### GameSetting
    import { GameSetting } from 'ts-minecraft'
    const settingString;
    const setting: GameSetting = GameSetting.parse(settingString);
    const string: string = GameSetting.stringify(setting);

Serialize/Deserialize the minecraft game setting string.

### Language
    import { Language, MinecraftLocation } from 'ts-minecraft'
    const location: MinecraftLocation;
    const version: string;
    const langs: Promise<Language[]> = Language.read(location, version)

Read language info from version

### ResourcePack
    import { ResourcePack } from 'ts-minecraft'
    const fileFullPath;
    Promise<ResourcePack> packPromise = ResourcePack.read(fileFullPath);

Read ResourcePack from filePath

### TextComponent
    import { TextComponent } from 'ts-minecraft'
    const fromString: TextComponent = TextComponent.str('from string');
    const formattedString: string;
    const fromFormatted: TextComponent = TextComponent.from(formattedString);

Create TextComponent from string OR Minecraft's formatted string, like '§cThis is red'

### Auth
    import { Auth, AuthService } from 'ts-minecraft'
    const username: string;
    const password: string;
    const authFromMojang: Promise<Auth> = AuthService.yggdrasilAuth({username, password});
    const authOffline = AuthService.offlineAuth(username);

Using AuthService to online/offline auth

### Launch
    import { Launcher, Auth, AuthService } from 'ts-minecraft'
    const version: string;
    const javaPath: string;
    const gamePath: string;
    const auth: Auth = AuthService.offlineAuth('username');
    const proc: Promise<ChildProcess> = Launcher.launch(auth, {gamePath, javaPath, minMemory, version});

Launch minecraft from a version

## Future Works
- TextComponent to style string

## Issue
- Really need runtime check for parsed Forge/LiteMod data(Hopefully, more people write this correctly)

## Credit
[Haowei Wen](https://github.com/yushijinhun), the author of [JMCCC](https://github.com/to2mbn/JMCCC), [Authlib Injector](https://github.com/to2mbn/authlib-injector), and [Indexyz](https://github.com/Indexyz), help me a lot on Minecraft launching, authing.

[Yu Xuanchi](https://github.com/yuxuanchiadm), co-worker, quality control of this project.