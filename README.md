# ts-minecraft(WIP)
All you need for minecraft in typescript.

# Usage
`import {NBT, ServerInfo, ...so on...} from 'ts-minecraft'`

!!!!!!!!!
Notice that this package is still WIP, no much tested yet.
Use with your own risk....
!!!!!!!!!

## NBT
    import { NBT } from 'ts-minecraft'
    const fileData: Buffer;
    const compressed: boolean;
    const readed: any = NBT.read(fileData, compressed);
Read a NBT buffer to an JSON object. 

## WorldInfo
    import { WorldInfo } from 'ts-minecraft'
    const levelDatBuffer: Buffer;
    const info: WorldInfo = WorldInfo.read(levelDatBuffer);
Read a WorldInfo from buffer.

## Server
    import { ServerStatus, ServerInfo } from 'ts-minecraft'
    const seversDatBuffer: Buffer;
    const infos: ServerInfo[] = ServerInfo.readFromNBT(seversDatBuffer);
    const info: ServerInfo = infos[0]
    const promise: Promise<ServerStatus> = ServerInfo.fetchServerStatus(info);

Read sever info and fetch its status.

## Minecraft Version
    import { VersionMeta, VersionMetaList, Version, MetaContainer, MinecraftLocation } from 'ts-minecraft'
    const minecraft: MinecraftLocation;
    const versionPromise: Promise<Version> = Version.updateVersionMeta()
        .then((metas: MetaContainer) => metas.list.versions[0])
        .then((meta: VersionMeta) => Version.install('client', meta, minecraft))

Fully install vanilla minecraft client

Supporting:
- NBT IO by `NBT` (not done)
- Yggdrasil auth
- Minecraft client Launching 
- TextComponent handling
- Ping server and fetch the ServerStatus including numbers of player, server icon.
- Other game concept model, like ForgeMod, Litloader Mod, WorldInfo.
- Minecraft config model
- WorldInfo modify
- Minecraft client download
- Sha1 check for the downloaded files (not tested)
- MinecraftForge client download (not tested)
- Liteloader client download
- Forge/Liteloader Mod parsing.

Will support in future:
- TextComponent to style string

Issue:
- Really need runtime check for parsed Forge/LiteMod data(Hopefully, more people write this correctly)