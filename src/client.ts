
import { Socket } from 'net'
import * as ByteBuffer from 'bytebuffer'
import { ServerStatus } from './game';
import { EventEmitter } from "events";
function writeString(buff: ByteBuffer, string: string) {
    buff.writeVarint32(string.length)
    buff.writeUTF8String(string)
}
function handshake(host: string, port: number, connection: Socket) {
    return new Promise<string>((resolve, reject) => {
        let buffer = ByteBuffer.allocate(256)
        //packet id
        buffer.writeByte(0x00)
        //protocol version
        buffer.writeVarint32(210)
        writeString(buffer, host)

        buffer.writeShort(port & 0xffff)
        buffer.writeVarint32(1)
        buffer.flip()
        let handshakeBuf = ByteBuffer.allocate(buffer.limit + 8)
        handshakeBuf.writeVarint32(buffer.limit)
        handshakeBuf.append(buffer)
        handshakeBuf.flip()
        connection.write(Buffer.from(handshakeBuf.toArrayBuffer()))
        connection.write(Buffer.from([0x01, 0x00]))
        let remain: number | undefined;
        let msg: ByteBuffer;
        const listener = (incoming: Buffer) => {
            const inbuf = ByteBuffer.wrap(incoming)
            if (remain === undefined) {
                console.log(inbuf.offset)
                remain = inbuf.readVarint32()
                console.log(inbuf.offset)
                remain -= inbuf.remaining()
                msg = inbuf.slice(inbuf.offset)
                console.log(inbuf.offset)
            }
            else {
                console.log(incoming.byteLength)
                console.log(inbuf.limit)
                msg.append(inbuf)
                remain -= inbuf.limit
                if (remain <= 0) {
                    connection.removeListener('data', listener)
                    resolve(msg.toString('utf-9'))
                }
            }
        }
        connection.on('data', listener)
        connection.once('error', (error) => {
            reject(error)
        })
    });
}
export interface Handler extends Function {
    accept(buffer: ByteBuffer): void;
}
const internalHandlers = {
    0x00: {
        accept(buffer: ByteBuffer): void {

        }
    }
}
export class MinecraftConnection extends EventEmitter {
    private cache: ByteBuffer | undefined;
    private remaining: number = -1;
    constructor(readonly host: string, readonly port: number,
        private connection: Socket, private cachedStatus: ServerStatus) {
        super();
        connection.on('data', this.handlePacket);
    }
    private handlePacket(buffer: Buffer) {
        if (!this.cache) {
            const incoming = ByteBuffer.wrap(buffer)
            this.remaining = incoming.readVarint32()
            this.cache = ByteBuffer.allocate(this.remaining)
            this.remaining -= incoming.remaining()
            this.cache.append(incoming.slice(incoming.offset))
        } else {
            this.cache.append(buffer)
            this.remaining -= buffer.byteLength
            if (this.remaining <= 0) {
                const packetId = this.cache.readByte()
                this.emit('packet', this.cache.slice(this.cache.offset))
                // handler.accept(this.cache.slice(this.cache.offset))
            }
        }
    }
    on(event: 'packet', listener: Handler): this {
        return super.on(event, listener)
    }

}