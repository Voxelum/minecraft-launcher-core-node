import { TextComponent } from "@xmcl/text-component";
import Long from "long";
import { Channel } from "./channel";
import { VarInt, String, Long as CLong, Short } from "./coders";
import { Packet, Field } from "./packet";

@Packet("client", 0x00, "handshake")
export class Handshake {
    @Field(VarInt)
    protocolVersion!: number;
    @Field(String)
    serverAddress!: string;
    @Field(Short)
    serverPort!: number;
    @Field(VarInt)
    nextState!: number;
}

@Packet("client", 0x00, "status")
export class ServerQuery { }

@Packet("server", 0x00, "status")
export class ServerStatus { @Field(CLong) status!: Status; }

@Packet("client", 0x01, "status")
export class Ping { @Field(CLong) time = Long.fromNumber(Date.now()); }

@Packet("server", 0x01, "status")
export class Pong { @Field(CLong) ping!: Long; }

/**
 * The json format for Minecraft server handshake status query response
 */
export interface Status {
    /**
     * The version info of the server
     */
    version: {
        /**
         * The name of the version, might be standard version, like 1.14.4.
         * Or it can be modified content, just be any string the server hoster like.
         */
        name: string;
        /**
         * The protocol version
         */
        protocol: number;
    };
    /**
     * The player info in server
     */
    players: {
        /**
         * The server max player capacity
         */
        max: number;
        /**
         * The current online player number
         */
        online: number;
        /**
         * The online player info
         */
        sample?: Array<GameProfile>;
    };
    /**
     * The motd of server, which might be the raw TextComponent string or structurelized TextComponent JSON
     */
    description: TextComponent | string;
    /**
     * The base 64 favicon data
     */
    favicon: string | "";
    modinfo?: {
        type: string | "FML";
        modList: Array<ForgeModIdentity>;
    };
    /**
     * The ping from server
     */
    ping: number;
}
interface GameProfile {
    name: string;
    id: string;
}
interface ForgeModIdentity {
    readonly modid: string;
    readonly version: string;
}

export interface QueryOptions {
    /**
     * see http://wiki.vg/Protocol_version_numbers
     */
    protocol?: number;
    /**
     * timeout milliseconds
     */
    timeout?: number;
    retryTimes?: number;
}

/**
 * Create a channel with Handleshake, ServerQuery, ServerStatus, Ping, Pong packets are registered.
 *
 * This is a lower level function for the case that you want to use channel directly
 *
 * @see Channel
 */
export function createChannel() {
    const channel: Channel = new Channel();
    channel.registerPacketType(Handshake);
    channel.registerPacketType(ServerQuery);
    channel.registerPacketType(ServerStatus);
    channel.registerPacketType(Ping);
    channel.registerPacketType(Pong);
    return channel;
}

/**
 * Query the server status in raw JSON format in one shot.
 *
 * @param server The server information
 * @param options The query options
 */
export async function queryStatus(server: { host: string, port?: number }, options: QueryOptions = {}): Promise<Status> {
    const host = server.host;
    const port = server.port || 25565;
    const timeout = options.timeout || 4000;
    const protocol = options.protocol || 210;
    const retry = typeof options.retryTimes === "number" ? options.retryTimes : 0;

    let result: Status | undefined;
    let error: Error | undefined;

    const channel: Channel = createChannel();

    for (let retryTimes = retry + 1; retryTimes > 0; retryTimes--) {
        try {
            result = await query(channel, host, port, timeout, protocol);
            break;
        } catch (e) {
            error = e;
        }
    }
    if (result) {
        return result;
    }
    throw error;
}

/**
 * Create a query client for certain protocol and timeout setting.
 * @param protocol The protocol number
 * @param timeout The timeout millisecond
 */
export function createClient(protocol: number, timeout?: number) {
    const channel: Channel = createChannel();
    return {
        get channel() { return channel },
        set protocol(v: number) { protocol = v },
        get protocol() { return protocol },
        query(host: string, port: number = 25565) {
            return query(channel, host, port, timeout || 4000, protocol);
        }
    };
}

async function query(channel: Channel, host: string, port: number, timeout: number, protocol: number) {
    await channel.listen({
        host,
        port,
        timeout: timeout,
    });
    const { status } = await new Promise<ServerStatus>((resolve, reject) => {
        channel.oncePacket(ServerStatus, (e) => {
            resolve(e);
        });
        channel.send(new Handshake(), {
            protocolVersion: protocol,
            serverAddress: host,
            serverPort: port,
            nextState: 1,
        });
        channel.state = "status";
        channel.send(new ServerQuery());
    });

    const { ping } = await new Promise<Pong>((resolve, reject) => {
        channel.once<Pong>("packet:Pong", (e) => {
            resolve(e);
        });
        channel.send(new Ping());
    });
    status.ping = Date.now() - ping.toNumber();

    await channel.disconnect();

    return status;
}

