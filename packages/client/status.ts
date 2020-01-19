import { TextComponentFrame } from "@xmcl/text-component";
import Long from "long";
import { Channel } from "./channel";
import Coders from "./coders";
import { Packet, Field } from "./packet";

@Packet("client", 0x00, "handshake")
export class Handshake {
    @Field(Coders.VarInt)
    protocolVersion!: number;
    @Field(Coders.String)
    serverAddress!: string;
    @Field(Coders.Short)
    serverPort!: number;
    @Field(Coders.VarInt)
    nextState!: number;
}

@Packet("client", 0x00, "status")
export class ServerQuery { }

@Packet("server", 0x00, "status")
export class ServerStatus { @Field(Coders.Json) status!: ServerStatusFrame; }

@Packet("client", 0x01, "status")
export class Ping { @Field(Coders.Long) time = Long.fromNumber(Date.now()); }

@Packet("server", 0x01, "status")
export class Pong { @Field(Coders.Long) ping!: Long; }

/**
 * The json format for Minecraft server handshake status query response
 */
export interface ServerStatusFrame {
    version: {
        name: string,
        protocol: number,
    };
    players: {
        max: number,
        online: number,
        sample?: Array<GameProfile>,
    };
    /**
     * The motd of server, which might be the raw TextComponent string or structurelized TextComponent JSON
     */
    description: TextComponentFrame | string;
    favicon: string | "";
    modinfo?: {
        type: string | "FML",
        modList: Array<ForgeModIdentity>,
    };
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

export interface FetchOptions {
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
 * Fetch the server status in raw JSON format in one shot.
 *
 * @param server The server information
 * @param options The fetch options
 */
export async function fetchStatus(server: { host: string, port?: number }, options: FetchOptions = {}): Promise<ServerStatusFrame> {
    const host = server.host;
    const port = server.port || 25565;
    const timeout = options.timeout || 4000;
    const protocol = options.protocol || 210;
    const retry = typeof options.retryTimes === "number" ? options.retryTimes : 0;

    let result: ServerStatusFrame | undefined;
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

