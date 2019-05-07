import * as ByteBuffer from "bytebuffer";
import { EventEmitter } from "events";
import { Socket } from "net";
import { Transform, TransformCallback, Writable } from "stream";
import { Coder } from "./coders";

class PacketInBound extends Transform {
    private buffer: ByteBuffer = ByteBuffer.allocate(1024);

    _transform(chunk: Buffer, encoding: string, callback: TransformCallback) {
        this.buffer.ensureCapacity(chunk.length + this.buffer.offset);
        this.buffer.append(chunk);
        this.buffer.flip();

        let unresolvedBytes;
        do {
            const packetLength = this.buffer.readVarint32();
            unresolvedBytes = this.buffer.remaining();

            if (packetLength <= unresolvedBytes) {
                const result = Buffer.alloc(packetLength);
                this.buffer.buffer.copy(result, this.buffer.offset, this.buffer.offset, this.buffer.offset + packetLength);
                this.push(result);

                this.buffer.buffer.copyWithin(0, packetLength); // clear emitted bytes
                this.buffer.offset = 0; // reset read offset to the front
                this.buffer.limit -= packetLength; // reduce the limit by emitted bytes

                unresolvedBytes -= packetLength;
            } else {
                this.buffer.offset = this.buffer.limit;
                this.buffer.limit = this.buffer.capacity();
                break;
            }
        } while (unresolvedBytes > 0);
        callback();
    }
}

class PacketDecode extends Transform {
    constructor(private packetCoders: { [packetId: number]: Coder<any> }) {
        super();
    }

    _transform(chunk: Buffer, encoding: string, callback: TransformCallback) {
        const message = ByteBuffer.wrap(chunk);
        const packetId = message.readVarint32();
        const packetContent = message.slice();
        const coder = this.packetCoders[packetId];
        if (coder) {
            this.push(coder.decode(packetContent));
        } else {
            console.error(`Unknown packet ${packetContent}.`);
        }
        callback();
    }
}

class PacketEmitter extends Writable {
    constructor(private eventBus: EventEmitter) {
        super();
    }

    _write(inst: any, encoding: string, callback: (error?: Error | null) => void): void {
        this.eventBus.emit(Object.getPrototypeOf(inst).constructor.name, inst);
        callback();
    }
}

class PacketEncoder extends Transform {
    constructor(private client: Client) {
        super();
    }

    _transform(message: any, encoding: string, callback: TransformCallback) {
        const type = Object.getPrototypeOf(message);
        const coder = this.client.findByName(type);
        if (coder && coder.encode) {
            const buf = new ByteBuffer();
            buf.writeByte(id);
            coder.encode(buf, message);
            this.push(buf.buffer);
            callback();
        } else {
            callback(new Error(""));
        }
    }
}

class PacketOutbound extends Transform {
    _transform(packet: Buffer, encoding: string, callback: TransformCallback) {
        const buffer = new ByteBuffer();
        buffer.writeVarint32(packet.length);
        buffer.append(buffer);
        this.push(buffer);
        callback();
    }
}

class PacketCoders {
    packetIdCoders: { [packetId: number]: Coder<any> } = {};
    packetNameToId: { [name: string]: number } = {};
}

export type State = "handshake" | "login" | "status" | "play";

export class Client extends EventEmitter {
    private states: { [state: string]: PacketCoders } = {};
    private state: State = "handshake";

    private outbound: Writable = new PacketEncoder(this)
        .pipe(new PacketOutbound());
    private inbound: Writable = new PacketInBound()
        .pipe(new PacketDecode(this))
        .pipe(new PacketEmitter(this));

    constructor() {
        super();
    }

    find(packetId: number): Coder<any> {
        return this.states[this.state].packetIdCoders[packetId];
    }

    getPacketId(packetName: string): number {
        const all = this.states[this.state];
        return all.packetNameToId[packetName];
    }

    findByName(packetName: string): Coder<any> {
        const all = this.states[this.state];
        return all.packetIdCoders[all.packetNameToId[packetName]];
    }

    listen(socket: Socket) {
        socket.pipe(this.inbound);
        this.outbound.pipe(socket);
    }

    send(message: any) {
        this.outbound.write(message);
    }
}
