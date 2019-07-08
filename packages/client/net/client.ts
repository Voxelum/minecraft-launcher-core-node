import * as ByteBuffer from "bytebuffer";
import { EventEmitter } from "events";
import { NetConnectOpts, Socket } from "net";
import { Transform, TransformCallback, Writable } from "stream";
import { unzip } from "zlib";
import { Coder } from "./coders";
import { PacketRegistryEntry, Side } from "./packet";

class PacketInBound extends Transform {
    private buffer: ByteBuffer = ByteBuffer.allocate(1024);

    _transform(chunk: Buffer, encoding: string, callback: TransformCallback) {

        // console.log("INBOUND");
        // console.log(chunk);
        this.buffer.ensureCapacity(chunk.length + this.buffer.offset);
        this.buffer.append(chunk);
        this.buffer.flip();

        let unresolvedBytes;
        do {
            const packetLength = this.buffer.readVarint32();
            unresolvedBytes = this.buffer.remaining();

            if (packetLength <= unresolvedBytes) {
                const result = Buffer.alloc(packetLength);
                this.buffer.buffer.copy(result, 0, this.buffer.offset, this.buffer.offset + packetLength);
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

class PacketDecompress extends Transform {
    constructor(private option: { readonly enableCompression: boolean, readonly compressionThreshold: number }) {
        super();
    }

    _transform(chunk: Buffer, encoding: string, callback: TransformCallback) {
        if (!this.option.enableCompression) {
            this.push(chunk);
            callback();
            return;
        }
        const message = ByteBuffer.wrap(chunk);
        const dataLength = message.readVarint32();
        if (dataLength === 0 || dataLength < this.option.compressionThreshold) {
            this.push(message.buffer.slice(message.offset));
            callback();
        } else {
            const compressedContent = message.buffer.slice(message.offset);
            unzip(compressedContent, (err, result) => {
                if (err) {
                    callback(err);
                } else {
                    this.push(result);
                    callback();
                }
            });
        }
    }
}

class PacketDecode extends Transform {
    constructor(private client: Channel) {
        super({ writableObjectMode: true, readableObjectMode: true });
    }

    _transform(chunk: Buffer, encoding: string, callback: TransformCallback) {
        const message = ByteBuffer.wrap(chunk);
        const packetId = message.readVarint32();
        const packetContent = message.slice();
        const coder = this.client.findCoderById(packetId, "server");
        if (coder) {
            this.push(coder.decode(packetContent));
        } else {
            console.error(`Unknown packet ${packetId} : ${packetContent.buffer}.`);
        }
        callback();
    }
}

class PacketEmitter extends Writable {
    constructor(private eventBus: EventEmitter) {
        super({ objectMode: true });
    }

    _write(inst: any, encoding: string, callback: (error?: Error | null) => void): void {
        this.eventBus.emit(`packet:${Object.getPrototypeOf(inst).constructor.name}`, inst);
        callback();
    }
}

class PacketEncoder extends Transform {
    constructor(private client: Channel) {
        super({ writableObjectMode: true, readableObjectMode: true });
    }

    _transform(message: any, encoding: string, callback: TransformCallback) {
        const id = this.client.getPacketId(message, "client");
        const coder = this.client.findCoderById(id, "client");
        if (coder && coder.encode) {
            const buf = new ByteBuffer();
            buf.writeByte(id);
            coder.encode(buf, message);
            buf.flip();
            this.push(buf.buffer.slice(0, buf.limit));
            callback();
        } else {
            callback(new Error(`Cannot find coder for message. ${JSON.stringify(message)}`));
        }
    }
}

class PacketOutbound extends Transform {
    _transform(packet: Buffer, encoding: string, callback: TransformCallback) {
        const buffer = new ByteBuffer();

        buffer.writeVarint32(packet.length);
        buffer.append(packet);
        buffer.flip();

        // console.log("OUTBOUND");
        // console.log(buffer.buffer.slice(0, buffer.limit));

        this.push(buffer.buffer.slice(0, buffer.limit));
        callback();
    }
}

class PacketCoders {
    packetIdCoders: { [packetId: number]: Coder<any> } = {};
    packetNameToId: { [name: string]: number } = {};
}

export type State = keyof States;
interface States {
    handshake: PacketCoders;
    login: PacketCoders;
    status: PacketCoders;
    play: PacketCoders;
}

export class Channel extends EventEmitter {
    state: State = "handshake";

    private readonly states = {
        client: {
            handshake: new PacketCoders(),
            login: new PacketCoders(),
            status: new PacketCoders(),
            play: new PacketCoders(),
        },
        server: {
            handshake: new PacketCoders(),
            login: new PacketCoders(),
            status: new PacketCoders(),
            play: new PacketCoders(),
        },
    };
    private connection: Socket = new Socket({ allowHalfOpen: false });

    private outbound: Writable;
    private inbound: Writable;

    private enableCompression: boolean = false;
    private compressionThreshold: number = -1;

    constructor() {
        super();
        const self = this;

        this.outbound = new PacketEncoder(this);
        this.outbound.pipe(new PacketOutbound()).pipe(this.connection);

        this.inbound = new PacketInBound();
        this.inbound
            .pipe(new PacketDecompress({
                get enableCompression() {
                    return self.enableCompression;
                },
                get compressionThreshold() {
                    return self.compressionThreshold;
                },
            }))
            .pipe(new PacketDecode(this))
            .pipe(new PacketEmitter(this));

        this.connection.pipe(this.inbound);
    }

    get ready() {
        return this.connection.readable && this.connection.writable;
    }

    findCoderById(packetId: number, side: Side): Coder<any> {
        const all = this.states[side][this.state];
        return all.packetIdCoders[packetId];
    }

    getPacketId(packetInst: any, side: Side): number {
        const packetName = Object.getPrototypeOf(packetInst).constructor.name;
        const all = this.states[side][this.state];
        return all.packetNameToId[packetName];
    }

    registerPacket(entry: PacketRegistryEntry) {
        const { state, side, id, name, coder } = entry;
        const coders = this.states[side][state];
        coders.packetIdCoders[id] = coder;
        coders.packetNameToId[name] = id;
    }

    async listen(option: NetConnectOpts & { keepalive?: boolean | number }) {
        if (this.ready) {
            this.connection.destroy();
        }
        await new Promise<void>((resolve, reject) => {
            this.connection.connect(option, () => {
                resolve();
            });
            if (option.timeout) {
                this.connection.setTimeout(option.timeout);
            }
            if (option.keepalive) {
                this.connection.setKeepAlive(true, typeof option.keepalive === "boolean" ? 3500 : option.keepalive);
            }
            this.connection.once("error", (e) => { reject(e); });
            this.connection.once("timeout", () => { reject(new Error(`Connection timeout.`)); });
        });

        this.emit("listen");
    }

    disconnect() {
        if (!this.ready) {
            return Promise.resolve();
        }
        return new Promise<void>((resolve, reject) => {
            this.connection.once("close", (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
            this.connection.end();
        });
    }

    send<T>(message: T, skeleton?: Partial<T>) {
        if (!this.connection.writable) { throw new Error("Cannot write if the connection isn't writable!"); }
        if (skeleton) { Object.assign(message, skeleton); }
        this.outbound.write(message);
        this.emit("send", message);
    }

    onPacket<T>(packet: new (...args: any[]) => T, listener: (event: T) => void): this {
        return this.on(`packet:${packet.name}`, listener);
    }

    oncePacket<T>(packet: new (...args: any[]) => T, listener: (event: T) => void): this {
        return this.once(`packet:${packet.name}`, listener);
    }
}

export interface Channel extends EventEmitter {
    on<T>(channel: string, listener: (event: T) => void): this;
    once<T>(channel: string, listener: (event: T) => void): this;
}
