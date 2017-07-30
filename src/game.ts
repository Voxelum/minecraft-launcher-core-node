import { TextComponent } from './text';
import { GameProfile } from './auth'
import { NBT } from './nbt';
import { Version } from './version'
import { MinecraftFolder, MinecraftLocation } from './file_struct';
import { endWith, READ } from './string_utils'

import * as net from 'net'
import * as buf from 'bytebuffer'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'
import * as Zip from 'adm-zip'
import * as Long from 'long'

export interface Pos2 {
    x: number, z: number
}

export interface Pos3 extends Pos2 {
    y: number
}

export interface GameSetting {
    useVBO: boolean,
    enableFBO: boolean,
    enableVsync: boolean,
    fancyGraphic: boolean,
    renderCloud: boolean,
    forceUnicode: boolean,
    autoJump: boolean,
    entityShadows: boolean,
    ao: number,
    fov: number,
    mipmap: number,
    maxFps: number,
    particles: number,
    renderDistance: number,
    resourcePacks: ResourcePack[]
}

export namespace GameSetting {
    export function readFromStringRaw(str: string): object | undefined {
        let arr = str.split(os.EOL)
        if (arr) {
            let obj: any = {}
            let pairs = arr.map(pair => pair.split(':')).forEach(pair => {
                if (pair[0] == 'lastServer' || pair[0] == 'lang' || pair[0] == 'mainHand')
                    obj[pair[0]] = pair[1]
                else if (pair[0].length != 0) obj[pair[0]] = JSON.parse(pair[1])
            })
            return obj
        }
        return undefined
    }
    export function readFromString(str: string): GameSetting | undefined {
        return readFromStringRaw(str) as GameSetting
    }
}

export enum GameType {
    NON = -1,
    SURVIVAL = 1,
    CREATIVE = 2,
    ADVENTURE = 3,
    SPECTATOR = 4
}

export namespace GameType {
    const _internal_map: { [key: number]: GameType } = {}
    _internal_map[-1] = GameType.NON
    _internal_map[1] = GameType.SURVIVAL
    _internal_map[2] = GameType.CREATIVE
    _internal_map[3] = GameType.ADVENTURE
    _internal_map[4] = GameType.SPECTATOR

    export function getByID(id: number): GameType {
        return _internal_map[id];
    }
}

export interface GameRule {
    doTileDrops: boolean,
    doFireTick: boolean,
    reducedDebugInfo: boolean,
    naturalRegeneration: boolean,
    disableElytraMovementCheck: boolean,
    doMobLoot: boolean,
    keepInventory: boolean,
    doEntityDrops: boolean,
    mobGriefing: boolean,
    randomTickSpeed: number,
    commandBlockOutput: boolean,
    spawnRadius: number,
    doMobSpawning: boolean,
    logAdminCommands: boolean,
    spectatorsGenerateChunks: boolean,
    sendCommandFeedback: boolean,
    doDaylightCycle: boolean,
    showDeathMessages: boolean
}

export class WorldInfo {
    constructor(
        // readonly filename: string,
        public displayName: string,
        readonly sizeOnDisk: Long,
        readonly lastPlayed: Long,
        readonly gameRule: GameRule,
        readonly dataVersion: number,
        readonly version: { snapshot?: number, id: number, name: string },
        readonly generatorName: string,

        public difficulty: number,
        public gameType: GameType,
        public isHardCore: boolean,
        public enabledCheat: boolean,
        public spawnPoint: Pos3,

        public borderCenter: Pos2,
        public borderDamagePerBlock: number,
        public borderWarningBlocks: number,
        public BorderSizeLerpTarget: number
    ) { }
}

export namespace WorldInfo {
    export function read(buf: Buffer): WorldInfo {
        let nbt = NBT.read(buf, true)
        let root = nbt.root.Data
        return new WorldInfo(root.LevelName, root.SizeOnDisk, root.LastPlayed, root.GameRules,
            root.DataVersion, root.Version, root.generatorName,
            root.Difficulty, root.GameType, root.hardcore == 1, root.allowCommands == 1,
            { x: root.SpawnX, y: root.SpawnY, z: root.SpawnZ },
            { x: root.BorderCenterX, z: root.BorderCenterZ },
            root.BorderDamagePerBlock, root.BorderWarningBlocks, root.BorderSizeLerpTarget)
    }
}

export class Language {
    constructor(readonly id: string, readonly name: string, readonly region: string, readonly bidirectional: boolean) { }
}

export namespace Language {
    export async function exportLanguages(location: MinecraftLocation, version: string): Promise<Language[]> {
        const loca: MinecraftFolder = typeof location === 'string' ? new MinecraftFolder(location) : location
        let json = path.join(loca.assets, 'indexes', version + '.json')
        if (!fs.existsSync(json))
            throw (new Error('The version indexes json does not exist. Maybe the game assets are incompleted!'))
        let jsonString = await READ(json)
        let obj = JSON.parse(jsonString)
        let meta = obj.objects['pack.mcmeta']
        let hash = meta.hash
        let head = hash.substring(0, 2)
        let loc = path.join(loca.assets, 'objects', head, hash)
        if (!fs.existsSync(loc))
            throw 'The pack.mcmeta object file does not exist!' + hash
        let metaString = await READ(loc)
        let langs = JSON.parse(metaString)
        if (!langs.language)
            throw new Error('Illegal pack.mcmeta structure!')
        let arr = []
        for (let langKey in langs.language) {
            let langObj = langs.language[langKey]
            arr.push(new Language(langKey, langObj.name, langObj.region, langObj.bidirectional))
        }
        return arr
    }
}

export interface ServerInfo {
    name?: string;
    host: string;
    port?: number;
    icon?: string;
    isLanServer?: boolean;
    resourceMode?: ResourceMode;
}

export class ServerStatus {
    pingToServer: number;
    static pinging() { return new ServerStatus(TextComponent.str("unknown"), TextComponent.str("Pinging..."), -1, -1, -1); }
    static error() { return new ServerStatus(TextComponent.str('Error'), TextComponent.str("Error"), -1, -1, -1) }
    constructor(
        readonly gameVersion: TextComponent,
        readonly serverMOTD: TextComponent,
        readonly protocolVersion: number,
        readonly onlinePlayers: number,
        readonly capacity: number,
        readonly icon?: string,
        readonly playerList?: GameProfile[],
        readonly modInfos?: {
            type: string,
            modList: Array<ModIndentity>
        }) { }

    toString(): string {
        return JSON.stringify(this, (k, v) => {
            if (k == 'gameVersion') return v + ''
            if (k == 'serverMOTD') return v + ''
            return v
        })
    }
}

export enum ResourceMode {
    ENABLED,
    DISABLED,
    PROMPT
}

export class ResourcePack {
    constructor(readonly packName: string, readonly description: TextComponent, readonly format: number) { }
}

export namespace ResourcePack {
    export function exportIcon(fileName: string, location: string, callback: () => void): void {
    }

    export function readFromFile(fileName: string): Promise<ResourcePack> {
        return new Promise<ResourcePack>((resolve, reject) => {
            let zipFile = new Zip(fileName)
            zipFile.readFileAsync('pack.mcmeta', (data, err) => {
                if (err) reject(new Error(err))
                else {
                    try {
                        let obj = JSON.parse(data.toString()).pack
                        resolve(new ResourcePack(fileName, TextComponent.fromFormattedString(obj.description), obj.pack_format))
                    }
                    catch (e) { reject(e) }
                }
            })
        });

    }
}

export interface ModIndentity {
    readonly modid: string,
    readonly version: string
}

export class ModContainer<Meta> {
    constructor(readonly type: string, readonly meta: Meta) { }
}

export namespace ModContainer {
    export function tryParse(fileName: string): Promise<ModContainer<object>[]> {
        if (endWith(fileName, '.litemod')) return parseLiteLoader(fileName).then(v => [v])
        else return parseForge(fileName)
    }

    export function parseForge(filePath: string): Promise<ModContainer<ForgeMetaData>[]> {
        return new Promise<ModContainer<ForgeMetaData>[]>((resolve, reject) => {
            let zip = new Zip(filePath)
            zip.readFileAsync('mcmod.info', (data, err) => {
                if (err) reject(new Error(err))
                else try {
                    let meta = JSON.parse(data.toString())
                    let mods: any[]
                    if (meta instanceof Array) mods = meta
                    else if (meta.modListVersion) mods = meta.modList
                    else mods = [meta]
                    resolve(mods.map(m => new ModContainer<ForgeMetaData>('forge', m)))
                }
                catch (e) {
                    reject(e)
                }
            })
        });
    }

    export function parseLiteLoader(filePath: string): Promise<ModContainer<LiteModMetaData>> {
        return new Promise<ModContainer<LiteModMetaData>>((resolve, reject) => {
            let zip = new Zip(filePath)
            zip.readFileAsync('litemod.json', (data, err) => {
                if (err) reject(err)
                else try {
                    resolve(new ModContainer<LiteModMetaData>('liteloader', JSON.parse(data.toString())))
                } catch (e) {
                    reject(e)
                }
            })
        });
    }
}

export interface ForgeMetaData extends ModIndentity {
    readonly modid: string,
    readonly name: string,
    readonly description?: string,
    readonly version: string,
    readonly mcVersion?: string,
    readonly acceptMinecraftVersion?: string,
    readonly updateJSON?: string,
    readonly url?: string,
    readonly logoFile?: string,
    readonly authorList?: string[],
    readonly credit?: string,
    readonly parent?: string,
    readonly screenShots?: string[],
    readonly fingerprint?: string,
    readonly dependencies?: string,
    readonly accpetRemoteVersions?: string,
    readonly acceptSaveVersions?: string,
    readonly isClientOnly?: boolean,
    readonly isServerOnly?: boolean
}

export interface LiteModMetaData {
    readonly mcversion: string,
    readonly name: string,
    readonly revision: number,

    readonly author?: string,
    readonly version?: string,
    readonly description?: string,
    readonly url?: string,

    readonly tweakClass?: string,
    readonly dependsOn?: string[],
    readonly injectAt?: string,
    readonly requiredAPIs?: string[],
    readonly classTransformerClasses?: string[]
}

function writeString(buff: ByteBuffer, string: string) {
    buff.writeVarint32(string.length)
    buff.writeUTF8String(string)
}

export namespace ServerInfo {
    export function readFromNBT(buf: Buffer): ServerInfo[] {
        let data = NBT.read(buf)
        if (data.root.servers) return data.root.servers
        return []
    }
    function startConnection(host: string, port: number) {
        return new Promise<net.Socket>((resolve, reject) => {
            const connection = net.createConnection(port, host, () => {
                resolve(connection)
            })
        });
    }
    function ping(ip: string, port: number, connection: net.Socket): Promise<number> {
        return new Promise((resolve, reject) => {
            if (!ip || ip === '') throw new Error("The server info's host name is empty!");
            const byteBuffer = buf.allocate(16);
            byteBuffer.writeByte(9);
            byteBuffer.writeByte(0x01);
            let time = process.hrtime()
            let l = Long.fromNumber(time[0]).mul(1000000).add(time[1] / 1000)
            byteBuffer.writeInt64(l);
            byteBuffer.flip();
            connection.write(Buffer.from(byteBuffer.toArrayBuffer()))
            connection.on('data', (data) => {
                time = process.hrtime()
                l = Long.fromNumber(time[0]).mul(1000000).add(time[1] / 1000)
                const incoming = buf.wrap(data)
                incoming.readByte() //length
                incoming.readByte() //id
                resolve(l.sub(incoming.readLong()).toNumber() / 1000)
            })
            connection.once('error', (err) => {
                reject(err)
            })
        });
    }
    function handshake(host: string, port: number, connection: net.Socket) {
        return new Promise<string>((resolve, reject) => {
            let buffer = buf.allocate(256)
            //packet id
            buffer.writeByte(0x00)
            //protocol version
            buffer.writeVarint32(210)
            writeString(buffer, host)

            buffer.writeShort(port & 0xffff)
            buffer.writeVarint32(1)
            buffer.flip()
            let handshakeBuf = buf.allocate(buffer.limit + 8)
            handshakeBuf.writeVarint32(buffer.limit)
            handshakeBuf.append(buffer)
            handshakeBuf.flip()
            connection.write(Buffer.from(handshakeBuf.toArrayBuffer()))
            connection.write(Buffer.from([0x01, 0x00]))
            let remain: number | undefined;
            let msg: buf;
            const listener = (incoming: Buffer) => {
                const inbuf = buf.wrap(incoming)
                if (remain === undefined) {
                    remain = inbuf.readVarint32()
                    msg = buf.allocate(remain)
                    remain -= inbuf.remaining()
                    msg.append(inbuf.slice(inbuf.offset))
                }
                else {
                    msg.append(inbuf)
                    remain -= inbuf.limit
                    if (remain <= 0) {
                        connection.removeListener('data', listener)
                        msg.flip()
                        const id = msg.readVarint32()
                        const length = msg.readVarint32()
                        const u8 = msg.slice(msg.offset).toUTF8()
                        resolve(u8)
                    }
                }
            }
            connection.on('data', listener)
            connection.once('error', (error) => {
                reject(error)
            })
        });
    }
    function parseHandshake(recived: string) {
        let obj = JSON.parse(recived)
        let motd: TextComponent = TextComponent.str('')
        if (obj.description) {
            if (typeof (obj.description) === 'object')
                motd = TextComponent.fromObject(obj.description)
            else if (typeof (obj.description) === 'string')
                motd = TextComponent.str(obj.description)
        }
        let favicon = obj.favicon
        let version = obj.version
        let versionText: TextComponent = TextComponent.str('')
        let protocol = -1
        let online = -1
        let max = -1
        if (version) {
            if (version.name)
                versionText = TextComponent.fromFormattedString(version.name as string)
            if (version.protocol)
                protocol = version.protocol
        }
        let players = obj.players
        if (players) {
            online = players.online
            max = players.max
        }

        let sample = players.sample
        let profiles = new Array<GameProfile>()
        if (sample) {
            profiles = new Array<GameProfile>(sample.length)
            for (let i = 0; i < sample.length; i++)
                profiles[i] = { uuid: sample[i].id, name: sample[i].name }
        }
        let icon
        if (favicon.startsWith("data:image/png;base64,"))
            icon = favicon.substring("data:image/png;base64,".length);

        let modInfoJson = obj.modinfo
        let modInfo
        if (modInfoJson) {
            let list: ModIndentity[] = []
            let mList = modInfoJson.modList
            if (mList && mList instanceof Array) list = mList
            modInfo = {
                type: modInfoJson.type,
                modList: list
            }
        }
        return new ServerStatus(versionText, motd, protocol, online, max, icon, profiles, modInfo)
    }
    export async function fetchServerStatus(server: ServerInfo, doPing: boolean = true): Promise<ServerStatus> {
        const port = server.port ? server.port : 25565;
        const host = server.host;
        const connection = await startConnection(host, port);
        const handshakeResponse = await handshake(host, port, connection);
        const status = parseHandshake(handshakeResponse);
        if (!doPing) {
            connection.end();
            return status;
        }
        status.pingToServer = await ping(host, port, connection);
        connection.end();
        return status;
    }
}
