import { ModIndentity, ResourceMode } from './game';
import { TextComponent } from "./text";
import { GameProfile } from "./auth";
import * as buf from 'bytebuffer'
import { NBT } from "./nbt";
import * as net from 'net'
import * as Long from 'long'

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