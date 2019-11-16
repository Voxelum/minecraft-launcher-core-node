import NBT from "@xmcl/nbt";
import { TextComponent, TextComponentFrame } from "@xmcl/text-component";
import { StatusClient } from "./net/status-client";

export enum ResourceMode {
    ENABLED,
    DISABLED,
    PROMPT,
}

/**
 * The servers.dat format server information, contains known host displayed in "Multipler" page.
 */
export interface ServerInfoFrame {
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
    };
    players: {
        max: number,
        online: number,
        sample?: Array<{ id: string, name: string }>,
    };
    /**
     * The motd of server, which might be the raw TextComponent string or structurelized TextComponent JSON
     */
    description: TextComponentFrame | string;
    favicon: string | "";
    modinfo?: {
        type: string | "FML",
        modList: Array<{
            readonly modid: string;
            readonly version: string;
        }>,
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
export namespace Server {
    export class Status {
        static pinging() { return new Status(TextComponent.from("unknown"), TextComponent.from("Pinging..."), -1, -1, -1); }
        static error() { return new Status(TextComponent.from("Error"), TextComponent.from("Error"), -1, -1, -1); }
        static from(obj: ServerStatusFrame | Status): Status {
            if (obj instanceof Status) {
                return obj;
            }
            let motd: TextComponent = TextComponent.from("");
            if (obj.description) {
                motd = TextComponent.from(obj.description);
            }
            const favicon = obj.favicon;
            const version = obj.version;
            let versionText: TextComponent = TextComponent.from("");
            let protocol = -1;
            let online = -1;
            let max = -1;
            if (version) {
                if (version.name) {
                    versionText = TextComponent.from(version.name);
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
                let list: ForgeModIdentity[] = [];
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
                modList: ForgeModIdentity[],
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
    export async function readInfo(buff: Uint8Array): Promise<ServerInfoFrame[]> {
        const value = await NBT.deserialize<any>(buff);
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
    export function writeInfo(infos: ServerInfoFrame[]): Promise<Uint8Array> {
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
        return NBT.serialize(object);
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
