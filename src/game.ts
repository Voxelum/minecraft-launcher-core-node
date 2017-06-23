import { TextComponent } from './text';
import { GameProfile } from './auth'
import { NBT } from './nbt'
import { Version } from './version'
import { MinecraftLocation } from './file_struct'
import { endWith } from './string_utils'

import * as net from 'net'
import * as buf from 'bytebuffer'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'
import * as Zip from 'adm-zip'

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
                if (pair[0] == 'lastServer' || pair[0] == 'lang' || pair[0] == 'mainHand') {
                    obj[pair[0]] = pair[1]
                }
                else {
                    if (pair[0].length != 0) obj[pair[0]] = JSON.parse(pair[1])
                }
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
    export function exportLanguages(location: MinecraftLocation, version: string, callback: (languages: Language[], error?: Error) => void): void {
        let json = path.join(location.assets, 'indexes', version + '.json')
        if (fs.existsSync(json))
            fs.readFile(json, (e, d) => {
                if (e) callback([], e)
                else {
                    let obj
                    try {
                        obj = JSON.parse(d.toString())
                    }
                    catch (e) {
                        callback([], e)
                        return
                    }
                    let meta = obj.objects['pack.mcmeta']
                    let hash = meta.hash
                    let head = hash.substring(0, 2)

                    let loc = path.join(location.assets, 'objects', head, hash)
                    if (fs.existsSync(loc)) {
                        try {
                            let langs = JSON.parse(fs.readFileSync(loc).toString())
                            if (langs.language) {
                                let arr = []
                                for (let langKey in langs.language) {
                                    let langObj = langs.language[langKey]
                                    arr.push(new Language(langKey, langObj.name, langObj.region, langObj.bidirectional))
                                }
                                callback(arr)
                            }
                            else { callback([], new Error('Illegal pack.mcmeta structure!')) }

                        }
                        catch (e) {
                            callback([], e)
                        }
                    }
                    else callback([], new Error('The pack.mcmeta object file does not exist!' + hash))
                }
            })
        else callback([], new Error('The version indexes json does not exist. Maybe the game assets are incompleted!'))
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
    constructor(
        readonly gameVersion: TextComponent,
        readonly serverMOTD: TextComponent,
        readonly protocolVersion: number,
        readonly onlinePlayers: number,
        readonly capacity: number,
        readonly playerList?: GameProfile[],
        readonly modInfos?: {
            type: string,
            modList: Array<ModIndentity>
        }) { }
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

    export function readFromFile(fileName: string, callback: (resourcePack?: ResourcePack, error?: Error) => void): void {
        let zipFile = new Zip(fileName)
        zipFile.readFileAsync('pack.mcmeta', (data, err) => {
            if (err)
                callback(undefined, new Error(err))
            else {
                try {
                    let obj = JSON.parse(data.toString()).pack
                    return new ResourcePack(fileName, TextComponent.fromFormattedString(obj.description), obj.pack_format)
                }
                catch (e) {
                    callback(e)
                }
            }
        })
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
    export function tryParse(fileName: string, callback: (mod?: ModContainer<object>[], err?: Error) => void) {
        if (endWith(fileName, '.litemod'))
            parseLiteLoader(fileName, (m, e) => {
                if (m) callback([m])
                else callback(undefined, e)
            })
        else { parseForge(fileName, callback) }
    }
    export function parseForge(filePath: string, callback: (mod?: ModContainer<ForModMetaData>[], err?: Error) => void) {
        let zip = new Zip(filePath)
        zip.readFileAsync('mcmod.info', (data, err) => {
            if (err) callback(undefined, new Error(err))
            else {
                try {
                    let meta = JSON.parse(data.toString())
                    let mods: any[]
                    if (meta instanceof Array) mods = meta
                    else if (meta.modListVersion) mods = meta.modList
                    else mods = [meta]
                    callback(mods.map(m => { return new ModContainer<ForModMetaData>('forge', new ForModMetaData(m.modid, m)) }))
                }
                catch (e) {
                    callback(undefined, e)
                }
            }

        })
    }

    export function parseLiteLoader(filePath: string, callback: (mod?: ModContainer<LitModeMetaData>, err?: Error) => void) {
        let zip = new Zip(filePath)
        zip.readFileAsync('mcmod.info', (data, err) => {
            let meta = JSON.parse(data.toString())
        })
    }
}

export class ForModMetaData implements ModIndentity {
    constructor(
        readonly modid: string,
        readonly name: string,
        readonly description: string = '',
        readonly version: string = '',
        readonly mcVersion: string = '',
        readonly acceptMinecraftVersion: string = '',
        readonly updateJSON: string = '',
        readonly url: string = '',
        readonly logoFile: string = '',
        readonly authorList: string[] = [],
        readonly credit: string = '',
        readonly parent: string = '',
        readonly screenShots: string[] = [],
        readonly fingerprint: string = '',
        readonly dependencies: string = '',
        readonly accpetRemoteVersions: string = '',
        readonly acceptSaveVersions: string = '',
        readonly isClientOnly: boolean = false,
        readonly isServerOnly: boolean = false
    ) { }
}

export class LitModeMetaData {
    constructor(
        readonly mcVersion: string,
        readonly name: string,
        readonly author: string,
        readonly version: string,
        readonly description: string,
        readonly url: string = '',
        readonly revision: number = 0,
        readonly tweakClass: string = '',
        readonly dependsOn: string[] = [],
        readonly requiredAPIs: string[] = [],
        readonly classTransformerClasses: string[] = []
    ) { }
}

function writeString(buff: ByteBuffer, string: string) {
    buff.writeVarint32(string.length)
    buff.writeUTF8String(string)
}

function parseText(obj: any): TextComponent {
    let component: TextComponent | undefined = undefined
    if (obj.text) component = TextComponent.str(obj.text)
    if (!component) component = TextComponent.str('')
    if (obj.extra && obj.extra instanceof Array)
        for (let element of obj.extra)
            component.append(parseText(element))
    return component
}

export namespace ServerInfo {
    export function readFromNBT(buf: Buffer): ServerInfo[] {
        let data = NBT.read(buf)
        if (data.root.servers)
            return data.root.servers
        return []
    }

    export function fetchServerStatus(server: ServerInfo, callback: (status: ServerStatus) => void, ping: boolean = true) {
        let port = server.port ? server.port : 25565
        let connection = net.createConnection(port, server.host, () => {
            let buffer = buf.allocate(256)
            //packet id
            buffer.writeByte(0x00)
            //protocol version
            buffer.writeVarint32(210)
            writeString(buffer, server.host)

            buffer.writeShort(port & 0xffff)
            buffer.writeVarint32(1)
            buffer.flip()

            let handshakeBuf = buf.allocate(buffer.limit + 8)
            handshakeBuf.writeVarint32(buffer.limit)
            handshakeBuf.append(buffer)
            handshakeBuf.flip()

            connection.write(Buffer.from(handshakeBuf.toArrayBuffer()))
            connection.write(Buffer.from([0x01, 0x00]))
            connection.end()
        })
        let recived = ''
        connection.on('data', (data) => {
            recived += data.toString('utf-8')
        })
        connection.on('end', () => {
            let start = recived.indexOf('{')
            recived = recived.slice(start)
            let obj = JSON.parse(recived)
            let motd: TextComponent = TextComponent.str('')
            if (obj.description) {
                if (typeof (obj.description) === 'object')
                    motd = parseText(obj.description)
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
                    versionText = TextComponent.fromFormattedString(obj.version.name as string)
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
            if (favicon.startsWith("data:image/png;base64,"))
                server.icon = favicon.substring("data:image/png;base64,".length);

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
            callback(new ServerStatus(versionText, motd, protocol, online, max, profiles, modInfo))
        })
    }
}
