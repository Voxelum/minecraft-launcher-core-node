import { TextComponent } from './text';
import { GameProfile } from './auth'
import { NBT } from './nbt';
import { Version } from './version';
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
    fboEnable: boolean,
    enableVsync: boolean,
    fancyGraphics: boolean,
    renderClouds: boolean | 'fast',
    forceUnicodeFont: boolean,
    autoJump: boolean,
    entityShadows: boolean,
    ao: GameSetting.AmbientOcclusion.Off |
    GameSetting.AmbientOcclusion.Minimum |
    GameSetting.AmbientOcclusion.Maximum,
    fov: number,
    mipmapLevels: 0 | 1 | 2 | 3 | 4,
    maxFps: number,
    particles: GameSetting.Particles.All |
    GameSetting.Particles.Decreased |
    GameSetting.Particles.Minimum,
    renderDistance: number,
    resourcePacks: ResourcePack[]
}

export namespace GameSetting {
    export namespace AmbientOcclusion {
        export type Off = 0
        export type Minimum = 1
        export type Maximum = 2
    }
    export namespace Particles {
        export type Minimum = 2
        export type Decreased = 1
        export type All = 0
    }
    export function readFromStringRaw(str: string): object | undefined {
        let lines = str.split('\n')
        const intPattern = /^\d+$/
        const floatPattern = /[-+]?[0-9]*\.[0-9]+/
        const booleanPattern = /(true)|(false)/
        if (lines) {
            let setting = lines.map(line => line.trim().split(':'))
                .filter(pair => pair[0].length != 0)
                .map(pair => {
                    let value: any = pair[1]
                    if (intPattern.test(value))
                        value = Number.parseInt(value)
                    else if (floatPattern.test(value))
                        value = Number.parseFloat(value)
                    else if (value === 'true') value = true
                    else if (value === 'false') value = false
                    else try {
                        value = JSON.parse(value)
                    } catch (e) { }

                    return { [pair[0]]: value }
                })
                .reduce((prev, current) => Object.assign(prev, current))
            return setting
        }
        return undefined
    }
    export function readFromString(str: string): GameSetting | undefined {
        return readFromStringRaw(str) as GameSetting
    }
    export function writeToStringSafe(setting: GameSetting | any, original: string): string {
        const model = readFromStringRaw(original) as any
        for (const key in model) {
            if (model.hasOwnProperty(key) && setting.hasOwnProperty(key)) {
                model[key] = setting[key]
            }
        }
        return writeToString(model)
    }
    export function writeToString(setting: GameSetting | any): string {
        return Object.keys(setting).map(key => {
            const val = (setting as any)[key];
            if (typeof val !== 'string')
                return `${key}:${JSON.stringify(val)}`
            else return `${key}:${val}`
        }).join(os.EOL)
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

export interface ServerStatusFrame {
    version: {
        name: string,
        protocol: number,
    },
    players: {
        max: number,
        online: number,
        sample?: Array<{ id: string, name: string }>,
    },
    description: object | string,
    favicon: string | '',
    modinfo?: {
        type: string | 'FML',
        modList: Array<ModIndentity>
    },
    ping: number,
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
    constructor(readonly packName: string, readonly description: string, readonly format: number, readonly icon?: string) { }
}

export namespace ResourcePack {
    async function readZip(fileName: string, zipFile: Zip, readIcon?: boolean) {
        const metas = await new Promise<any>((resolve, reject) => {
            zipFile.readFileAsync('pack.mcmeta', (data, err) => {
                if (err) reject(new Error(err))
                else {
                    try {
                        let obj = JSON.parse(data.toString()).pack
                        resolve({ fileName, description: obj.description, format: obj.pack_format })
                    }
                    catch (e) { reject(e) }
                }
            })
        });
        let icon = ''
        if (readIcon)
            icon = await new Promise<string>((resolve, reject) => {
                zipFile.readFileAsync('pack.png', (data, err) => {
                    if (err) resolve('')
                    else resolve('data:image/png;base64, ' + data.toString('base64'))
                })
            });
        return new ResourcePack(metas.fileName, metas.description, metas.format, icon)
    }
    export function readFromFile(fileName: string, readIcon: boolean = false): Promise<ResourcePack> {
        return readZip(fileName, new Zip(fileName), readIcon);
    }
    export function readFromBuffer(fileName: string, buffer: Buffer, readIcon: boolean = false): Promise<ResourcePack> {
        return readZip(fileName, new Zip(buffer), readIcon);
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
    function startConnection(host: string, port: number, timeout?: number) {
        return new Promise<net.Socket>((resolve, reject) => {
            const connection = net.createConnection(port, host, () => {
                resolve(connection)
            })
            if (timeout) connection.setTimeout(timeout)
            connection.once('error', reject)
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
    function handshake(host: string, port: number, protocol: number, connection: net.Socket) {
        return new Promise<string>((resolve, reject) => {
            let buffer = buf.allocate(256)
            //packet id
            buffer.writeByte(0x00)
            //protocol version
            buffer.writeVarint32(protocol)
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
    export function parseFrame(obj: ServerStatusFrame) {
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
        return new ServerStatus(versionText, motd, protocol, online, max, favicon, profiles, modInfo)
    }
    export async function fetchServerStatusFrame(server: ServerInfo, options?: { protocol?: number, timeout?: number }): Promise<ServerStatusFrame> {
        const port = server.port ? server.port : 25565;
        const protocol = options ? options.protocol ? options.protocol : 210 : 210;
        const host = server.host;
        const timeout = options ? options.timeout : undefined;
        const connection = await startConnection(host, port, timeout);
        const frame = JSON.parse(await handshake(host, port, protocol, connection)) as ServerStatusFrame;
        frame.ping = await ping(host, port, connection);
        connection.end();
        return frame;
    }
    export function fetchServerStatus(server: ServerInfo, options?: { protocol: number, timeout: number }): Promise<ServerStatus> {
        return fetchServerStatusFrame(server, options).then(parseFrame)
    }
}
