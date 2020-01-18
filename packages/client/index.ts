import { TextComponentFrame } from "@xmcl/text-component";
import { StatusClient } from "./status-client";

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
    timeout?: number;
    retryTimes?: number;
}

/**
 * Fetch the server status in raw JSON format.
 *
 * @param server The server information
 * @param options The fetch options
 */
export async function fetchStatusFrame(server: { host: string, port?: number }, options: FetchOptions = {}): Promise<ServerStatusFrame> {
    const host = server.host;
    const port = server.port || 25565;
    const timeout = options.timeout || 4000;
    const protocol = options.protocol || 210;
    const retry = typeof options.retryTimes === "number" ? options.retryTimes : 0;

    let result: ServerStatusFrame | undefined;
    let error: Error | undefined;

    const client = StatusClient.create(protocol, timeout);
    for (let retryTimes = retry + 1; retryTimes > 0; retryTimes--) {
        try {
            result = await client.query(host, port);
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

export type StatusFrame = ServerStatusFrame;

export * from "./coders";
export * from "./packet";
export * from "./status-client";
export * from "./client";
