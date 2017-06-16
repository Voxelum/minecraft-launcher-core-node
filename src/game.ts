import { TextComponent } from './text';
import { GameProfile } from './auth'
import { NBT } from './nbt'
import * as net from 'net'
import * as buf from 'bytebuffer'

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

export class WorldInfo {
    constructor(
        readonly filename: string,
        public displayName: string,
        readonly size: number,
        readonly lastPlayed: number,
        public gameType: GameType,
        public isHardCore: boolean,
        public enabledCheat: boolean,
        public spawnPoint: [number, number, number]
    ) { }
}

export class Language {
    constructor(readonly id: string, readonly name: string, readonly region: string, readonly bidirectional: boolean) { }
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

export interface ModIndentity {
    readonly modid: string,
    readonly version: string
}

export class ModContainer<Meta> {
    constructor(readonly type: string, readonly meta: Meta) { }
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
