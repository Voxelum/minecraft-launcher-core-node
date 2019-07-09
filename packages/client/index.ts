import { GameProfile, ResourceMode, ServerInfoFrame, ServerStatusFrame } from "@xmcl/common";
import NBT from "@xmcl/nbt";
import { TextComponent } from "@xmcl/text-component";
import { StatusClient } from "./net/status-client";

interface ModIndentity {
    readonly modid: string;
    readonly version: string;
}
export namespace Server {
    export class Status {
        static pinging() { return new Status(TextComponent.str("unknown"), TextComponent.str("Pinging..."), -1, -1, -1); }
        static error() { return new Status(TextComponent.str("Error"), TextComponent.str("Error"), -1, -1, -1); }
        static from(obj: ServerStatusFrame | Status): Status {
            if (obj instanceof Status) {
                return obj;
            }
            let motd: TextComponent = TextComponent.str("");
            if (obj.description) {
                motd = TextComponent.from(obj.description);
            }
            const favicon = obj.favicon;
            const version = obj.version;
            let versionText: TextComponent = TextComponent.str("");
            let protocol = -1;
            let online = -1;
            let max = -1;
            if (version) {
                if (version.name) {
                    versionText = TextComponent.from(version.name as string);
                }
                if (version.protocol) {
                    protocol = version.protocol;
                }
            }
            const players = obj.players;
            if (players) {
                online = players.online;
                max = players.max;
            }

            const sample = players.sample;
            let profiles = new Array<GameProfile>();
            if (sample) {
                profiles = new Array<GameProfile>(sample.length);
                for (let i = 0; i < sample.length; i++) {
                    profiles[i] = { id: sample[i].id, name: sample[i].name };
                }
            }

            const modInfoJson = obj.modinfo;
            let modInfo;
            if (modInfoJson) {
                let list: ModIndentity[] = [];
                const mList = modInfoJson.modList;
                if (mList && mList instanceof Array) { list = mList; }
                modInfo = {
                    type: modInfoJson.type,
                    modList: list,
                };
            }
            const status = new Status(versionText, motd, protocol, online, max, favicon, profiles, modInfo);
            status.pingToServer = obj.ping;
            return status;
        }
        pingToServer?: number;
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
                modList: ModIndentity[],
            }) { }

        toString(): string {
            return JSON.stringify(this, (k, v) => {
                if (k === "gameVersion") { return v + ""; }
                if (k === "serverMOTD") { return v + ""; }
                return v;
            });
        }
    }
    /**
     * Read the server information from the binary data of .minecraft/server.dat file, which stores the local known server host information.
     *
     * @param buff The binary data of .minecraft/server.dat
     */
    export async function readInfo(buff: Buffer): Promise<ServerInfoFrame[]> {
        const value = await NBT.Persistence.deserialize(buff);
        if (!value.servers) {
            throw {
                type: "InvalidServerSyntext",
            };
        }
        return value.servers.map((i: any) => ({
            icon: i.icon,
            host: i.ip,
            name: i.name,
            resourceMode: i.acceptTextures === undefined ? ResourceMode.PROMPT : i.acceptTextures ? ResourceMode.ENABLED : ResourceMode.DISABLED,
        }));
    }
    /**
     * Write the information to NBT format used by .minecraft/server.dat file.
     *
     * @param infos The array of server information.
     */
    export function writeInfo(infos: ServerInfoFrame[]): Promise<Buffer> {
        const object = {
            servers: infos.map((i) => ({
                ip: i.host,
                icon: i.icon,
                name: i.name,
                acceptTextures: i.resourceMode === ResourceMode.PROMPT ? undefined :
                    i.resourceMode === ResourceMode.ENABLED ? 1 : 0,
            })),
            // tslint:disable-next-line:object-literal-sort-keys
            __nbtPrototype__: {
                servers: [
                    {
                        icon: 8 as const,
                        ip: 8 as const,
                        name: 8 as const,
                        acceptTextures: 1 as const,
                    },
                ],
            },
        };
        return NBT.Persistence.serialize(object);
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
    /**
     * Fetch the server status in resolved object format.
     *
     * @param server The server information
     * @param options The fetch options
     */
    export function fetchStatus(server: { host: string, port?: number }, options: FetchOptions = {}): Promise<Status> {
        return fetchStatusFrame(server, options).then(Status.from);
    }

    export type StatusFrame = ServerStatusFrame;
    export type Info = ServerInfoFrame;
}

export * from "./net/coders";
export * from "./net/packet";
export * from "./net/status-client";
export * from "./net/client";
export * from "@xmcl/common/server";
