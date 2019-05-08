import { Channel } from "./client";
import { flush } from "./packet";
import { Handshake, Ping, Pong, ServerQuery, ServerStatus } from "./protocols/default";

export class StatusClient {
    readonly channel: Channel = new Channel();

    constructor(readonly protocol: number, readonly timeout?: number) {
        flush().forEach((r) => this.channel.registerPacket(r));
    }

    async query(host: string, port?: number) {
        port = port || 25565;
        await this.channel.listen({
            host,
            port,
            timeout: this.timeout,
        });
        const { status } = await new Promise<ServerStatus>((resolve, reject) => {
            this.channel.oncePacket(ServerStatus, (e) => {
                resolve(e);
            });
            this.channel.send(new Handshake(), {
                protocolVersion: this.protocol,
                serverAddress: host,
                serverPort: port,
                nextState: 1,
            });
            this.channel.state = "status";
            this.channel.send(new ServerQuery());
        });

        const { ping } = await new Promise<Pong>((resolve, reject) => {
            this.channel.once<Pong>("packet:Pong", (e) => {
                resolve(e);
            });
            this.channel.send(new Ping());
        });
        status.ping = Date.now() - ping.toNumber();

        this.channel.disconnect();

        return status;
    }
}


export function createStatusClient(protocol: number, timeout?: number) {
    return new StatusClient(protocol, timeout);
}
