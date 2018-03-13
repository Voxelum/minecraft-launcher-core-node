import { ResourceMode } from './game';
import { TextComponent } from "./text";
import { GameProfile } from "./profile";
import * as buf from 'bytebuffer';
import NBT from "./nbt";
import * as net from 'net';
import * as Long from 'long';
import Forge from './forge';

function writeString(buff: ByteBuffer, string: string) {
    buff.writeVarint32(string.length)
    buff.writeUTF8String(string)
}

export namespace Server {
    export interface Info {
        name?: string;
        host: string;
        port?: number;
        icon?: string;
        isLanServer?: boolean;
        resourceMode?: ResourceMode;
    }

    export interface StatusFrame {
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
            modList: Array<Forge.ModIndentity>
        },
        ping: number,
    }


    export class Status {
        pingToServer?: number;
        static pinging() { return new Status(TextComponent.str("unknown"), TextComponent.str("Pinging..."), -1, -1, -1); }
        static error() { return new Status(TextComponent.str('Error'), TextComponent.str("Error"), -1, -1, -1) }
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
                modList: Array<Forge.ModIndentity>
            }) { }

        toString(): string {
            return JSON.stringify(this, (k, v) => {
                if (k == 'gameVersion') return v + ''
                if (k == 'serverMOTD') return v + ''
                return v
            })
        }
        static from(obj: StatusFrame | Status): Status {
            if (obj instanceof Status)
                return obj;
            let motd: TextComponent = TextComponent.str('')
            if (obj.description) {
                motd = TextComponent.from(obj.description)
            }
            let favicon = obj.favicon
            let version = obj.version
            let versionText: TextComponent = TextComponent.str('')
            let protocol = -1
            let online = -1
            let max = -1
            if (version) {
                if (version.name)
                    versionText = TextComponent.from(version.name as string)
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
                    profiles[i] = { id: sample[i].id, name: sample[i].name }
            }

            let modInfoJson = obj.modinfo
            let modInfo
            if (modInfoJson) {
                let list: Forge.ModIndentity[] = []
                let mList = modInfoJson.modList
                if (mList && mList instanceof Array) list = mList
                modInfo = {
                    type: modInfoJson.type,
                    modList: list
                }
            }
            const status = new Status(versionText, motd, protocol, online, max, favicon, profiles, modInfo);
            status.pingToServer = obj.ping;
            return status;
        }
    }
    export function parseNBT(buf: Buffer): Info[] {
        let value = NBT.Serializer.deserialize(buf);
        if (!value.servers) throw new Error('Invalid Server NBT Syntext!');
        return value.servers.map((i: any) => ({
            icon: i.icon,
            host: i.ip,
            name: i.name,
            resourceMode: i.acceptTextures === undefined ? ResourceMode.PROMPT : i.acceptTextures ? ResourceMode.ENABLED : ResourceMode.DISABLED,
        }))
    }
    export function writeNBT(infos: Info[]): Buffer {
        const object = {
            servers: infos.map(i => ({
                ip: i.host, 
                icon: i.icon, 
                name: i.name,
                acceptTextures: i.resourceMode === ResourceMode.PROMPT ? undefined :
                    i.resourceMode === ResourceMode.ENABLED ? 1 : 0,
            })),
            __nbtPrototype__: {
                servers: [
                    {
                        icon: 8,
                        ip: 8,
                        name: 8,
                        acceptTextures: 1,
                    }
                ],
            },
        }
        return NBT.Serializer.serialize(object);
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
            connection.on('timeout', () => {
                reject(new Error(`timeout`))
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

    export interface FetchOptions {
        /** 
         * see http://wiki.vg/Protocol_version_numbers
        */
        protocol?: number
        timeout?: number
        retryTimes?: number
    }

    async function fetchFrame(host: string, port: number, timeout: number, protocol: number) {
        const connection = await new Promise<net.Socket>((resolve, reject) => {
            const connection = net.createConnection(port, host, () => {
                resolve(connection)
            })
            connection.setTimeout(timeout);
            connection.once('error', (e) => { reject(e) })
            connection.once('timeout', () => { reject(new Error(`Connection timeout ${timeout}`)) })
        });

        const frame = await new Promise((resolve, reject) => {
            connection.once('end', () => {
                if (!frame) {
                    reject(new Error('Closed by server!'))
                }
            })
            handshake(host, port, protocol, connection)
                .then(JSON.parse)
                .then(f => { resolve(f); })
        }) as StatusFrame

        await new Promise((resolve, reject) => {
            connection.once('end', () => {
                (frame as any).ping = -1;
                resolve()
            });
            ping(host, port, connection)
                .then(p => {
                    (frame as any).ping = p;
                    resolve();
                }).catch(e => reject(e))
        });
        connection.end();
        return frame;
    }
    export async function fetchStatusFrame(server: Info, options: FetchOptions = {}): Promise<StatusFrame> {
        const host = server.host;
        const port = server.port || 25565;
        const timeout = options.timeout || 4000;
        const protocol = options.protocol || 210;
        const retry = (options.retryTimes || 1) + 1;

        let result: StatusFrame | undefined = undefined;
        let error: Error | undefined;
        for (let retryTimes = retry; retryTimes > 0; retryTimes--) {
            try {
                result = await fetchFrame(host, port, timeout, protocol);
                break;
            } catch (e) {
                e = error;
            }
        }
        if (result)
            return result;
        throw error;
    }
    export function fetchStatus(server: Info, options: FetchOptions = {}): Promise<Status> {
        return fetchStatusFrame(server, options).then(Status.from);
    }
}

