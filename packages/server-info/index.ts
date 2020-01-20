import { deserialize, serialize, TagType, deserializeSync, serializeSync } from "@xmcl/nbt";

export class ServerInfo {
    @TagType(TagType.String)
    icon: string = "";
    @TagType(TagType.String)
    ip: string = "";
    @TagType(TagType.String)
    name: string = "";
    @TagType(TagType.Byte)
    acceptTextures: number = 0;
}

/**
 * The servers.dat format server information, contains known host displayed in "Multipler" page.
 */
export class ServersData {
    @TagType([ServerInfo])
    servers: ServerInfo[] = [];
}

/**
 * Read the server information from the binary data of .minecraft/server.dat file, which stores the local known server host information.
 *
 * @param buff The binary data of .minecraft/server.dat
 */
export async function readInfo(buff: Uint8Array): Promise<ServerInfo[]> {
    const value = await deserialize(buff, { type: ServersData });
    return value.servers;
}

/**
 * Write the information to NBT format used by .minecraft/server.dat file.
 *
 * @param infos The array of server information.
 */
export function writeInfo(infos: ServerInfo[]): Promise<Uint8Array> {
    const tag = new ServersData();
    tag.servers = infos;
    // infos.forEach(info => Object.setPrototypeOf(info, ServerInfo.prototype));
    return serialize(tag);
}

/**
 * Read the server information from the binary data of .minecraft/server.dat file, which stores the local known server host information.
 *
 * @param buff The binary data of .minecraft/server.dat
 */
export function readInfoSync(buff: Uint8Array): ServerInfo[] {
    const value = deserializeSync(buff, { type: ServersData });
    return value.servers;
}

/**
 * Write the information to NBT format used by .minecraft/server.dat file.
 *
 * @param infos The array of server information.
 */
export function writeInfoSync(infos: ServerInfo[]): Uint8Array {
    const tag = new ServersData();
    tag.servers = infos;
    // infos.forEach(info => Object.setPrototypeOf(info, ServerInfo.prototype));
    return serializeSync(tag);
}
