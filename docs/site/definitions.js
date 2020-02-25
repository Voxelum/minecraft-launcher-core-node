module.exports['@xmcl/client/channel.d.ts'] = `/// <reference types="node" />
import { EventEmitter } from "events";
import { NetConnectOpts } from "net";
import { Coder } from "./coders";
import { PacketRegistryEntry, Side } from "./packet";
export declare type State = keyof States;
interface States {
    handshake: PacketCoders;
    login: PacketCoders;
    status: PacketCoders;
    play: PacketCoders;
}
/**
 * The channel for send and listen the Minecraft packet.
 */
export declare class Channel extends EventEmitter {
    state: State;
    private readonly states;
    private connection;
    private outbound;
    private inbound;
    private enableCompression;
    private compressionThreshold;
    constructor();
    /**
     * Is the connection ready to read and write
     */
    get ready(): boolean;
    findCoderById(packetId: number, side: Side): Coder<any>;
    getPacketId(packetInst: any, side: Side): number;
    registerPacketType(clazz: new (...args: any) => any): void;
    registerPacket(entry: PacketRegistryEntry): void;
    /**
     * Open the connection and start to listen the port.
     */
    listen(option: NetConnectOpts & {
        keepalive?: boolean | number;
    }): Promise<void>;
    disconnect(): Promise<void>;
    /**
     * Sent a packet to server.
     */
    send<T>(message: T, skeleton?: Partial<T>): void;
    /**
     * Listen for sepcific packet by its class name.
     */
    onPacket<T>(packet: new (...args: any[]) => T, listener: (event: T) => void): this;
    oncePacket<T>(packet: new (...args: any[]) => T, listener: (event: T) => void): this;
}
export interface Channel extends EventEmitter {
    on<T>(channel: string, listener: (event: T) => void): this;
    once<T>(channel: string, listener: (event: T) => void): this;
}
declare class PacketCoders {
    packetIdCoders: {
        [packetId: number]: Coder<any>;
    };
    packetNameToId: {
        [name: string]: number;
    };
}
export {};
`;
module.exports['@xmcl/client/cjs/channel.d.ts'] = `/// <reference types="node" />
import { EventEmitter } from "events";
import { NetConnectOpts } from "net";
import { Coder } from "./coders";
import { PacketRegistryEntry, Side } from "./packet";
export declare type State = keyof States;
interface States {
    handshake: PacketCoders;
    login: PacketCoders;
    status: PacketCoders;
    play: PacketCoders;
}
/**
 * The channel for send and listen the Minecraft packet.
 */
export declare class Channel extends EventEmitter {
    state: State;
    private readonly states;
    private connection;
    private outbound;
    private inbound;
    private enableCompression;
    private compressionThreshold;
    constructor();
    /**
     * Is the connection ready to read and write
     */
    get ready(): boolean;
    findCoderById(packetId: number, side: Side): Coder<any>;
    getPacketId(packetInst: any, side: Side): number;
    registerPacketType(clazz: new (...args: any) => any): void;
    registerPacket(entry: PacketRegistryEntry): void;
    /**
     * Open the connection and start to listen the port.
     */
    listen(option: NetConnectOpts & {
        keepalive?: boolean | number;
    }): Promise<void>;
    disconnect(): Promise<void>;
    /**
     * Sent a packet to server.
     */
    send<T>(message: T, skeleton?: Partial<T>): void;
    /**
     * Listen for sepcific packet by its class name.
     */
    onPacket<T>(packet: new (...args: any[]) => T, listener: (event: T) => void): this;
    oncePacket<T>(packet: new (...args: any[]) => T, listener: (event: T) => void): this;
}
export interface Channel extends EventEmitter {
    on<T>(channel: string, listener: (event: T) => void): this;
    once<T>(channel: string, listener: (event: T) => void): this;
}
declare class PacketCoders {
    packetIdCoders: {
        [packetId: number]: Coder<any>;
    };
    packetNameToId: {
        [name: string]: number;
    };
}
export {};
`;
module.exports['@xmcl/client/cjs/coders.d.ts'] = `/// <reference types="long" />
import ByteBuffer from "bytebuffer";
export interface SlotData {
    blockId: number;
    itemCount?: number;
    itemDamage?: number;
    nbt?: any;
}
/**
 * The packet encode/decode algorithm
 */
export interface Coder<T> {
    readonly encode: (buffer: ByteBuffer, data: T, context?: any) => void;
    readonly decode: (buffer: ByteBuffer, context?: any) => T;
}
export declare const VarInt: Coder<number>;
export declare const Int: Coder<number>;
export declare const Byte: Coder<number>;
export declare const UByte: Coder<number>;
export declare const Bool: Coder<boolean>;
export declare const Float: Coder<number>;
export declare const Double: Coder<number>;
export declare const UUID: Coder<string>;
export declare const Short: Coder<number>;
export declare const UShort: Coder<number>;
export declare const Long: Coder<Long>;
export declare const VarLong: Coder<Long>;
export declare const String: Coder<string>;
export declare const Json: Coder<any>;
export declare const Slot: Coder<SlotData>;
export declare const ByteArray: Coder<Int8Array>;
`;
module.exports['@xmcl/client/cjs/index.d.ts'] = `export * from "./coders";
export * from "./packet";
export * from "./channel";
export * from "./status";
`;
module.exports['@xmcl/client/cjs/packet.d.ts'] = `import { State } from "./channel";
import { Coder } from "./coders";
export declare type Side = "server" | "client";
export interface PacketRegistryEntry {
    readonly id: number;
    readonly name: string;
    readonly state: State;
    readonly side: Side;
    readonly coder: Coder<any>;
}
export declare type FieldType<T> = (type: Coder<T>) => (target: any, key: string) => void;
export declare type PacketType = (side: Side, id: number, state: State) => (constructor: Function) => void;
export declare const PacketMetadata: unique symbol;
export declare const PacketFieldsMetadata: unique symbol;
/**
 * Get a packet registry entry for a class
 * @param clazz The class object
 */
export declare function getPacketRegistryEntry(clazz: new (...args: any) => any): PacketRegistryEntry;
/**
 * Annotate the field type in your packet. Assign a coder for serialization/deserialization.
 * This will generate a list of \`FieldType\` in your class prototype.
 *
 * @param type The coder to serialize/deserialize the field.
 * @see "coders.ts"
 */
export declare function Field<T>(type: Coder<T>): (target: any, key: string) => void;
/**
 * Decoarte for you packet class.
 * This will generate a \`PacketRegistryEntry\` in your class prototype.
 *
 * @param side The side of your packet
 * @param id The id of your packet
 * @param state The state of you packet should be
 */
export declare function Packet(side: Side, id: number, state: State, name?: string): (constructor: Function) => void;
`;
module.exports['@xmcl/client/cjs/status.d.ts'] = `import { TextComponent } from "@xmcl/text-component";
import Long from "long";
import { Channel } from "./channel";
export declare class Handshake {
    protocolVersion: number;
    serverAddress: string;
    serverPort: number;
    nextState: number;
}
export declare class ServerQuery {
}
export declare class ServerStatus {
    status: Status;
}
export declare class Ping {
    time: Long;
}
export declare class Pong {
    ping: Long;
}
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
export declare function createChannel(): Channel;
/**
 * Query the server status in raw JSON format in one shot.
 *
 * @param server The server information
 * @param options The query options
 */
export declare function queryStatus(server: {
    host: string;
    port?: number;
}, options?: QueryOptions): Promise<Status>;
/**
 * Create a query client for certain protocol and timeout setting.
 * @param protocol The protocol number
 * @param timeout The timeout millisecond
 */
export declare function createClient(protocol: number, timeout?: number): {
    readonly channel: Channel;
    protocol: number;
    query(host: string, port?: number): Promise<Status>;
};
export {};
`;
module.exports['@xmcl/client/coders.d.ts'] = `/// <reference types="long" />
import ByteBuffer from "bytebuffer";
export interface SlotData {
    blockId: number;
    itemCount?: number;
    itemDamage?: number;
    nbt?: any;
}
/**
 * The packet encode/decode algorithm
 */
export interface Coder<T> {
    readonly encode: (buffer: ByteBuffer, data: T, context?: any) => void;
    readonly decode: (buffer: ByteBuffer, context?: any) => T;
}
export declare const VarInt: Coder<number>;
export declare const Int: Coder<number>;
export declare const Byte: Coder<number>;
export declare const UByte: Coder<number>;
export declare const Bool: Coder<boolean>;
export declare const Float: Coder<number>;
export declare const Double: Coder<number>;
export declare const UUID: Coder<string>;
export declare const Short: Coder<number>;
export declare const UShort: Coder<number>;
export declare const Long: Coder<Long>;
export declare const VarLong: Coder<Long>;
export declare const String: Coder<string>;
export declare const Json: Coder<any>;
export declare const Slot: Coder<SlotData>;
export declare const ByteArray: Coder<Int8Array>;
`;
module.exports['@xmcl/client/coders.test.d.ts'] = `export {};
`;
module.exports['@xmcl/client/index.d.ts'] = `export * from "./coders";
export * from "./packet";
export * from "./channel";
export * from "./status";
`;
module.exports['@xmcl/client/packet.d.ts'] = `import { State } from "./channel";
import { Coder } from "./coders";
export declare type Side = "server" | "client";
export interface PacketRegistryEntry {
    readonly id: number;
    readonly name: string;
    readonly state: State;
    readonly side: Side;
    readonly coder: Coder<any>;
}
export declare type FieldType<T> = (type: Coder<T>) => (target: any, key: string) => void;
export declare type PacketType = (side: Side, id: number, state: State) => (constructor: Function) => void;
export declare const PacketMetadata: unique symbol;
export declare const PacketFieldsMetadata: unique symbol;
/**
 * Get a packet registry entry for a class
 * @param clazz The class object
 */
export declare function getPacketRegistryEntry(clazz: new (...args: any) => any): PacketRegistryEntry;
/**
 * Annotate the field type in your packet. Assign a coder for serialization/deserialization.
 * This will generate a list of \`FieldType\` in your class prototype.
 *
 * @param type The coder to serialize/deserialize the field.
 * @see "coders.ts"
 */
export declare function Field<T>(type: Coder<T>): (target: any, key: string) => void;
/**
 * Decoarte for you packet class.
 * This will generate a \`PacketRegistryEntry\` in your class prototype.
 *
 * @param side The side of your packet
 * @param id The id of your packet
 * @param state The state of you packet should be
 */
export declare function Packet(side: Side, id: number, state: State, name?: string): (constructor: Function) => void;
`;
module.exports['@xmcl/client/status.d.ts'] = `import { TextComponent } from "@xmcl/text-component";
import Long from "long";
import { Channel } from "./channel";
export declare class Handshake {
    protocolVersion: number;
    serverAddress: string;
    serverPort: number;
    nextState: number;
}
export declare class ServerQuery {
}
export declare class ServerStatus {
    status: Status;
}
export declare class Ping {
    time: Long;
}
export declare class Pong {
    ping: Long;
}
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
export declare function createChannel(): Channel;
/**
 * Query the server status in raw JSON format in one shot.
 *
 * @param server The server information
 * @param options The query options
 */
export declare function queryStatus(server: {
    host: string;
    port?: number;
}, options?: QueryOptions): Promise<Status>;
/**
 * Create a query client for certain protocol and timeout setting.
 * @param protocol The protocol number
 * @param timeout The timeout millisecond
 */
export declare function createClient(protocol: number, timeout?: number): {
    readonly channel: Channel;
    protocol: number;
    query(host: string, port?: number): Promise<Status>;
};
export {};
`;
module.exports['@xmcl/client/test.d.ts'] = `export {};
`;
module.exports['@xmcl/core/cjs/folder.d.ts'] = `export interface MinecraftFolder {
    readonly root: string;
}
export declare class MinecraftFolder {
    readonly root: string;
    /**
     * Normal a Minecraft folder from a folder or string
     */
    static from(location: MinecraftLocation): MinecraftFolder;
    constructor(root: string);
    get mods(): string;
    get resourcepacks(): string;
    get assets(): string;
    get libraries(): string;
    get versions(): string;
    get logs(): string;
    get options(): string;
    get launcherProfile(): string;
    get lastestLog(): string;
    get maps(): string;
    get saves(): string;
    get screenshots(): string;
    getNativesRoot(version: string): string;
    getVersionRoot(version: string): string;
    getVersionJson(version: string): string;
    getVersionJar(version: string, type?: string): string;
    getVersionAll(version: string): string[];
    getResourcePack(fileName: string): string;
    getMod(fileName: string): string;
    getLog(fileName: string): string;
    getMapInfo(map: string): string;
    getMapIcon(map: string): string;
    getLibraryByPath(libraryPath: string): string;
    getAssetsIndex(versionAssets: string): string;
    getAsset(hash: string): string;
    getPath(...path: string[]): string;
}
export declare namespace MinecraftPath {
    const mods = "mods";
    const resourcepacks = "resourcepacks";
    const assets = "assets";
    const libraries = "libraries";
    const versions = "versions";
    const logs = "logs";
    const options = "options.txt";
    const launcherProfile = "launcher_profiles.json";
    const lastestLog = "logs/latest.log";
    const maps = "saves";
    const saves = "saves";
    const screenshots = "screenshots";
    function getVersionRoot(version: string): string;
    function getNativesRoot(version: string): string;
    function getVersionJson(version: string): string;
    function getVersionJar(version: string, type?: string): string;
    function getResourcePack(fileName: string): string;
    function getMod(fileName: string): string;
    function getLog(fileName: string): string;
    function getMapInfo(map: string): string;
    function getMapIcon(map: string): string;
    function getLibraryByPath(libraryPath: string): string;
    function getAssetsIndex(versionAssets: string): string;
    function getAsset(hash: string): string;
}
export declare type MinecraftLocation = MinecraftFolder | string;
`;
module.exports['@xmcl/core/cjs/fs.d.ts'] = `/// <reference types="node" />
import { promises } from "fs";
export declare const readFile: typeof promises.readFile;
export declare const writeFile: typeof promises.writeFile;
export declare const stat: typeof promises.stat;
export declare const readlink: typeof promises.readlink;
export declare const copyFile: typeof promises.copyFile;
export declare const unlink: typeof promises.unlink;
export declare const rename: typeof promises.rename;
export declare function waitStream(stream: NodeJS.ReadableStream | NodeJS.WritableStream | NodeJS.ReadWriteStream): Promise<void>;
export declare function exists(target: string): Promise<boolean>;
export declare function missing(target: string): Promise<boolean>;
export declare function validateSha1(target: string, hash?: string): Promise<boolean>;
export declare function validateMd5(target: string, hash?: string): Promise<boolean>;
export declare function copyPassively(src: string, dest: string, filter?: (name: string) => boolean): Promise<void>;
export declare function ensureDir(target: string): Promise<void>;
export declare function ensureFile(target: string): Promise<void>;
export declare function remove(f: string): Promise<void>;
export declare function checksum(path: string, algorithm?: string): Promise<string>;
export declare function checksums(path: string, algorithms: string[]): Promise<string[]>;
`;
module.exports['@xmcl/core/cjs/index.d.ts'] = `export * from "./launch";
export * from "./version";
export * from "./platform";
export * from "./folder";
`;
module.exports['@xmcl/core/cjs/launch.d.ts'] = `/// <reference types="node" />
import { ChildProcess, SpawnOptions } from "child_process";
import { MinecraftFolder } from "./folder";
import { ResolvedVersion } from "./version";
import { EventEmitter } from "events";
export declare const DEFAULT_EXTRA_JVM_ARGS: readonly string[];
export interface EnabledFeatures {
    [featureName: string]: object | boolean | undefined;
    has_custom_resolution?: {
        resolution_width: string;
        resolution_height: string;
    };
    is_demo_user?: boolean;
}
/**
 * General launch option, used to generate launch arguments.
 */
export interface LaunchOption {
    /**
     * User selected game profile. For game display name &
     */
    gameProfile?: {
        name: string;
        id: string;
    };
    accessToken?: string;
    userType?: "mojang" | "legacy";
    properties?: object;
    launcherName?: string;
    launcherBrand?: string;
    /**
     * Overwrite the version name of the current version.
     * If this is absent, it will use version name from resolved version.
     */
    versionName?: string;
    /**
     * Overwrite the version type of the current version.
     * If this is absent, it will use version type from resolved version.
     *
     * Some people use this to show fantastic message on the welcome screen.
     */
    versionType?: string;
    /**
     * The full path of launched game icon
     * Currently, this only supported on MacOS
     */
    gameIcon?: string;
    /**
     * The launched game name
     * Currently, this only supported on MacOS
     */
    gameName?: string;
    /**
     * The path of parent directory of saves/logs/configs/mods/resourcepacks
     */
    gamePath: string;
    /**
     * The path of parent directory of assets/libraries
     */
    resourcePath?: string;
    /**
     * The java executable file path. (Not the java home direcotry!)
     */
    javaPath: string;
    /**
     * Min memory, this will add a jvm flag -Xms to the command result
     */
    minMemory?: number;
    /**
     * Min memory, this will add a jvm flag -Xmx to the command result
     */
    maxMemory?: number;
    /**
     * The version of launched Minecraft. Can be either resolved version or version string
     */
    version: string | ResolvedVersion;
    /**
     * Directly launch to a server
     */
    server?: {
        ip: string;
        port?: number;
    };
    /**
     * Resolution. This will add --height & --width or --fullscreen to the java arguments
     */
    resolution?: {
        width?: number;
        height?: number;
        fullscreen?: true;
    };
    /**
     * Extra jvm options. This will append after to generated options.
     * If this is empty, the \`DEFAULT_EXTRA_JVM_ARGS\` will be used.
     */
    extraJVMArgs?: string[];
    /**
     * Extra program arguments. This will append after to generated options.
     */
    extraMCArgs?: string[];
    /**
     * Assign the spawn options to the process.
     *
     * If you try to set \`{ shell: true }\`, you might want to make all argument rounded with "".
     * The \`launch\` function will do it for you, but if you want to spawn process by yourself, remember to do that.
     */
    extraExecOption?: SpawnOptions;
    isDemo?: boolean;
    /**
     * Native directory. It's .minecraft/versions/<version>/<version>-natives by default.
     * You can replace this by your self.
     */
    nativeRoot?: string;
    /**
     * Enable features. Not really in used...
     */
    features?: EnabledFeatures;
    /**
     * Support yushi's yggdrasil agent https://github.com/to2mbn/authlib-injector/wiki
     */
    yggdrasilAgent?: {
        jar: string;
        server: string;
    };
    /**
     * Add \`-Dfml.ignoreInvalidMinecraftCertificates=true\` to jvm argument
     */
    ignoreInvalidMinecraftCertificates?: boolean;
    /**
     * Add \`-Dfml.ignorePatchDiscrepancies=true\` to jvm argument
     */
    ignorePatchDiscrepancies?: boolean;
}
export interface LaunchPrecheck {
    (resourcePath: MinecraftFolder, version: ResolvedVersion, option: LaunchOption): Promise<void>;
}
export declare namespace LaunchPrecheck {
    const Default: LaunchPrecheck[];
    /**
     * Quick check if Minecraft version jar is corrupted
     */
    function checkVersion(resource: MinecraftFolder, version: ResolvedVersion, option: LaunchOption): Promise<void>;
    /**
     * Quick check if there are missed libraries.
     */
    function checkLibraries(resource: MinecraftFolder, version: ResolvedVersion, option: LaunchOption): Promise<void>;
    /**
     * Ensure the native are correctly extracted there.
     * @param native The native directory path
     */
    function checkNatives(resource: MinecraftFolder, version: ResolvedVersion, option: LaunchOption): Promise<void>;
}
export interface ServerOptions {
    javaPath: string;
    /**
     * Minecraft location
     */
    path: string;
    /**
     * Current working directory. Default is the same with the path.
     */
    cwd?: string;
    version: string | ResolvedVersion;
    nogui?: boolean;
    minMemory?: number;
    maxMemory?: number;
    extraJVMArgs?: string[];
    extraMCArgs?: string[];
    extraExecOption?: SpawnOptions;
}
export declare function launchServer(options: ServerOptions): Promise<ChildProcess>;
/**
 * The Minecraft process watcher. You can inspect Minecraft launch state by this.
 *
 * Generally, there are several cases after you call \`launch\` and get \`ChildProcess\` object
 *
 * 1. child process fire an error, no real process start.
 *
 */
export interface MinecraftProcessWatcher extends EventEmitter {
    /**
     * Fire when the process DOESN'T start at all, like "java not found".
     *
     * The minecraft-kill or minecraft-exit will NOT fire after this fired.
     */
    on(event: "error", listener: (error: any) => void): this;
    /**
     * Fire after Minecraft process exit.
     */
    on(event: "minecraft-exit", listener: (event: {
        /**
         * The code of the process exit. This is the nodejs child process "exit" event arg.
         */
        code: number;
        /**
         * The signal of the process exit. This is the nodejs child process "exit" event arg.
         */
        signal: string;
        /**
         * The crash report content
         */
        crashReport: string;
        /**
         * The location of the crash report
         */
        crashReportLocation: string;
    }) => void): this;
    /**
     * Fire around the time when Minecraft window appeared in screen.
     *
     * Since the Minecraft window will take time to init, this event fire when it capture some keywords from stdout.
     */
    on(event: "minecraft-window-ready", listener: () => void): this;
}
/**
 * Create a process watcher for a minecraft process.
 *
 * It will watch the stdout and the error event of the process to detect error and minecraft state.
 * @param process The Minecraft process
 * @param emitter The event emitter which will emit usefule event
 */
export declare function createMinecraftProcessWatcher(process: ChildProcess, emitter?: EventEmitter): MinecraftProcessWatcher;
/**
 * Launch the minecraft as a child process. This function use spawn to create child process. To use an alternative way, see function generateArguments.
 *
 * This function will also check if the runtime libs are completed, and will extract native libs if needed.
 * This function might throw exception when the version jar is missing/checksum not matched.
 * This function might throw if the libraries/natives are missing.
 *
 * @param options The detail options for this launching.
 * @see ChildProcess
 * @see spawn
 * @see generateArguments
 * @see createMinecraftProcessWatcher
 */
export declare function launch(options: LaunchOption & {
    prechecks?: LaunchPrecheck[];
}): Promise<ChildProcess>;
/**
 * Generate the argument for server
 */
export declare function generateArgumentsServer(options: ServerOptions): Promise<string[]>;
/**
 * Generate the arguments array by options. This function is useful if you want to launch the process by yourself.
 *
 * This function will NOT check if the runtime libs are completed, and WONT'T check or extract native libs.
 *
 */
export declare function generateArguments(options: LaunchOption): Promise<string[]>;
`;
module.exports['@xmcl/core/cjs/platform.d.ts'] = `export interface Platform {
    name: "osx" | "linux" | "windows" | "unknown";
    version: string;
    arch: "x86" | "x64" | string;
}
/**
 * Get Minecraft style platform info. (Majorly used to enable/disable native dependencies)
 */
export declare function getPlatform(): Platform;
/**
 * The current platform
 */
export declare const currentPlatform: Platform;
`;
module.exports['@xmcl/core/cjs/version.d.ts'] = `import { MinecraftLocation } from "./folder";
import { Platform } from "./platform";
export interface PartialResolvedVersion extends Version {
    libraries: ResolvedLibrary[];
    arguments: {
        game: Version.LaunchArgument[];
        jvm: Version.LaunchArgument[];
    };
    minecraftDirectory: string;
}
/**
 * The resolved version for launcher.
 * It could be a combination of multiple versions as there might be some inheritions.
 */
export interface ResolvedVersion {
    /**
     * The id of the version, should be identical to the version folder.
     */
    id: string;
    arguments: {
        game: Version.LaunchArgument[];
        jvm: Version.LaunchArgument[];
    };
    /**
     * The main class full qualified name
     */
    mainClass: string;
    assetIndex: Version.AssetIndex;
    /**
     * The asset index id of this version. Should be something like \`1.14\`, \`1.12\`
     */
    assets: string;
    downloads: {
        client: Version.Download;
        server: Version.Download;
        [key: string]: Version.Download;
    };
    libraries: ResolvedLibrary[];
    minimumLauncherVersion: number;
    releaseTime: string;
    time: string;
    type: string;
    logging?: {
        [key: string]: {
            file: Version.Download;
            argument: string;
            type: string;
        };
    };
    /**
     * The minecraft version of this version
     */
    minecraftVersion: string;
    /**
     * The minecraft directory of this version
     */
    minecraftDirectory: string;
    /**
     * The version inheritances of this whole resolved version.
     *
     * The first element is this version, and the last element is the root Minecraft version.
     * The dependencies of [<a>, <b>, <c>] should be <a> -> <b> -> <c>, where c is a Minecraft version.
     */
    inheritances: string[];
    /**
     * All array of json file paths.
     *
     * It's the chain of inherits json path. The root json will be the last element of the array.
     * The first element is the user provided version.
     */
    pathChain: string[];
}
export interface LibraryInfo {
    readonly groupId: string;
    readonly artifactId: string;
    readonly version: string;
    readonly isSnapshot: boolean;
    readonly type: string;
    readonly classifier: string;
    readonly path: string;
    readonly name: string;
}
export declare namespace LibraryInfo {
    /**
     * Get the base info of the library from its name
     *
     * @param lib The name of library or the library itself
     */
    function resolve(lib: string | Version.Library | ResolvedLibrary): LibraryInfo;
}
/**
 * A resolved library for launcher. It can by parsed from \`LibraryInfo\`.
 */
export declare class ResolvedLibrary implements LibraryInfo {
    readonly name: string;
    readonly download: Version.Artifact;
    readonly checksums?: string[] | undefined;
    readonly serverreq?: boolean | undefined;
    readonly clientreq?: boolean | undefined;
    readonly groupId: string;
    readonly artifactId: string;
    readonly version: string;
    readonly isSnapshot: boolean;
    readonly type: string;
    readonly classifier: string;
    readonly path: string;
    constructor(name: string, info: LibraryInfo, download: Version.Artifact, checksums?: string[] | undefined, serverreq?: boolean | undefined, clientreq?: boolean | undefined);
}
/**
 * Represent a native libraries provided by Minecraft
 */
export declare class ResolvedNative extends ResolvedLibrary {
    readonly extractExclude?: string[] | undefined;
    constructor(name: string, info: LibraryInfo, download: Version.Artifact, extractExclude?: string[] | undefined);
}
export declare namespace Version {
    interface Download {
        readonly sha1: string;
        readonly size: number;
        url: string;
    }
    interface AssetIndex extends Download {
        readonly id: string;
        readonly totalSize: number;
    }
    interface Artifact extends Download {
        readonly path: string;
    }
    interface LoggingFile extends Download {
        readonly id: string;
    }
    interface NormalLibrary {
        name: string;
        downloads: {
            artifact: Artifact;
        };
    }
    interface Rule {
        action: "allow" | "disallow";
        os?: Partial<Platform>;
        features?: {
            [feat: string]: boolean;
        };
    }
    interface NativeLibrary {
        name: string;
        downloads: {
            artifact: Artifact;
            classifiers: {
                [os: string]: Artifact;
            };
        };
        rules: Rule[];
        extract: {
            exclude: string[];
        };
        natives: {
            [os: string]: string;
        };
    }
    interface PlatformSpecificLibrary {
        name: string;
        downloads: {
            artifact: Artifact;
        };
        rules: Rule[];
    }
    interface LegacyLibrary {
        name: string;
        url?: string;
        clientreq?: boolean;
        serverreq?: boolean;
        checksums?: string[];
    }
    type Library = NormalLibrary | NativeLibrary | PlatformSpecificLibrary | LegacyLibrary;
    type LaunchArgument = string | {
        rules: Rule[];
        value: string | string[];
    };
    /**
      * Check if all the rules in \`Rule[]\` are acceptable in certain OS \`platform\` and features.
      * @param rules The rules usually comes from \`Library\` or \`LaunchArgument\`
      * @param platform The platform, leave it absent will use the \`currentPlatform\`
      * @param features The features, used by game launch argument \`arguments.game\`
      */
    function checkAllowed(rules: Rule[], platform?: Platform, features?: string[]): boolean;
    /**
     * Recursively parse the version JSON.
     *
     * This function requires that the id in version.json is identical to the directory name of that version.
     *
     * e.g. .minecraft/<version-a>/<version-a.json> and in <version-a.json>:
     *
     * { "id": "<version-a>", ... }
     *
     * @param minecraftPath The .minecraft path
     * @param version The vesion id.
     * @return The final resolved version detail
     */
    function parse(minecraftPath: MinecraftLocation, version: string): Promise<ResolvedVersion>;
    /**
     * Simply extends the version (actaully mixin)
     *
     * The result version will have the union of two version's libs. If one lib in two versions has different version, it will take the extra version one.
     * It will also mixin the launchArgument if it could.
     *
     * This function can be used for mixin forge and liteloader version.
     *
     * This function will throw an Error if two version have different assets. It doesn't care about the detail version though.
     *
     * @beta
     * @param id The new version id
     * @param parent The parent version will be inherited
     * @param version The version info which will overlap some parent information
     * @return The raw version json could be save to the version json file
     */
    function inherits(id: string, parent: Version, version: Version): Version;
    /**
     * Mixin the string arguments
     * @beta
     * @param hi Higher priority argument
     * @param lo Lower priority argument
     */
    function mixinArgumentString(hi: string, lo: string): string;
    /**
     * Resolve the dependencies of a minecraft version
     * @param path The path of minecraft
     * @param version The version id
     * @returns All the version required to run this version, including this version
     */
    function resolveDependency(path: MinecraftLocation, version: string): Promise<PartialResolvedVersion[]>;
    /**
     * Resolve all these library and filter out os specific libs
     * @param libs All raw lib
     * @param platform The platform
     */
    function resolveLibraries(libs: Library[], platform?: Platform): ResolvedLibrary[];
    /**
     * Normalize a single version json.
     *
     * This function will force legacy version format into new format.
     * It will convert \`minecraftArguments\` into \`arguments.game\` and generate a default \`arguments.jvm\`
     *
     * This will pre-process the libraries according to the rules fields and current platform.
     * Non-matched libraries will be filtered out.
     *
     * This will also pre-process the jvm arguments according to the platform (os) info it provided.
     *
     * @param versionString The version json string
     * @param root The root of the version
     */
    function normalizeVersionJson(versionString: string, root: string): PartialResolvedVersion;
}
/**
 * The raw json format provided by Minecraft
 */
export interface Version {
    id: string;
    time: string;
    type: string;
    releaseTime: string;
    inheritsFrom?: string;
    minimumLauncherVersion: number;
    minecraftArguments?: string;
    arguments?: {
        game: Version.LaunchArgument[];
        jvm: Version.LaunchArgument[];
    };
    mainClass: string;
    libraries: Version.Library[];
    jar?: string;
    assetIndex?: Version.AssetIndex;
    assets?: string;
    downloads?: {
        client: Version.Download;
        server: Version.Download;
        [key: string]: Version.Download;
    };
    client?: string;
    server?: string;
    logging?: {
        [key: string]: {
            file: Version.Download;
            argument: string;
            type: string;
        };
    };
}
`;
module.exports['@xmcl/core/folder.d.ts'] = `export interface MinecraftFolder {
    readonly root: string;
}
export declare class MinecraftFolder {
    readonly root: string;
    /**
     * Normal a Minecraft folder from a folder or string
     */
    static from(location: MinecraftLocation): MinecraftFolder;
    constructor(root: string);
    get mods(): string;
    get resourcepacks(): string;
    get assets(): string;
    get libraries(): string;
    get versions(): string;
    get logs(): string;
    get options(): string;
    get launcherProfile(): string;
    get lastestLog(): string;
    get maps(): string;
    get saves(): string;
    get screenshots(): string;
    getNativesRoot(version: string): string;
    getVersionRoot(version: string): string;
    getVersionJson(version: string): string;
    getVersionJar(version: string, type?: string): string;
    getVersionAll(version: string): string[];
    getResourcePack(fileName: string): string;
    getMod(fileName: string): string;
    getLog(fileName: string): string;
    getMapInfo(map: string): string;
    getMapIcon(map: string): string;
    getLibraryByPath(libraryPath: string): string;
    getAssetsIndex(versionAssets: string): string;
    getAsset(hash: string): string;
    getPath(...path: string[]): string;
}
export declare namespace MinecraftPath {
    const mods = "mods";
    const resourcepacks = "resourcepacks";
    const assets = "assets";
    const libraries = "libraries";
    const versions = "versions";
    const logs = "logs";
    const options = "options.txt";
    const launcherProfile = "launcher_profiles.json";
    const lastestLog = "logs/latest.log";
    const maps = "saves";
    const saves = "saves";
    const screenshots = "screenshots";
    function getVersionRoot(version: string): string;
    function getNativesRoot(version: string): string;
    function getVersionJson(version: string): string;
    function getVersionJar(version: string, type?: string): string;
    function getResourcePack(fileName: string): string;
    function getMod(fileName: string): string;
    function getLog(fileName: string): string;
    function getMapInfo(map: string): string;
    function getMapIcon(map: string): string;
    function getLibraryByPath(libraryPath: string): string;
    function getAssetsIndex(versionAssets: string): string;
    function getAsset(hash: string): string;
}
export declare type MinecraftLocation = MinecraftFolder | string;
`;
module.exports['@xmcl/core/folder.test.d.ts'] = `export {};
`;
module.exports['@xmcl/core/fs.d.ts'] = `/// <reference types="node" />
import { promises } from "fs";
export declare const readFile: typeof promises.readFile;
export declare const writeFile: typeof promises.writeFile;
export declare const stat: typeof promises.stat;
export declare const readlink: typeof promises.readlink;
export declare const copyFile: typeof promises.copyFile;
export declare const unlink: typeof promises.unlink;
export declare const rename: typeof promises.rename;
export declare function waitStream(stream: NodeJS.ReadableStream | NodeJS.WritableStream | NodeJS.ReadWriteStream): Promise<void>;
export declare function exists(target: string): Promise<boolean>;
export declare function missing(target: string): Promise<boolean>;
export declare function validateSha1(target: string, hash?: string): Promise<boolean>;
export declare function validateMd5(target: string, hash?: string): Promise<boolean>;
export declare function copyPassively(src: string, dest: string, filter?: (name: string) => boolean): Promise<void>;
export declare function ensureDir(target: string): Promise<void>;
export declare function ensureFile(target: string): Promise<void>;
export declare function remove(f: string): Promise<void>;
export declare function checksum(path: string, algorithm?: string): Promise<string>;
export declare function checksums(path: string, algorithms: string[]): Promise<string[]>;
`;
module.exports['@xmcl/core/index.d.ts'] = `export * from "./launch";
export * from "./version";
export * from "./platform";
export * from "./folder";
`;
module.exports['@xmcl/core/launch.d.ts'] = `/// <reference types="node" />
import { ChildProcess, SpawnOptions } from "child_process";
import { MinecraftFolder } from "./folder";
import { ResolvedVersion } from "./version";
import { EventEmitter } from "events";
export declare const DEFAULT_EXTRA_JVM_ARGS: readonly string[];
export interface EnabledFeatures {
    [featureName: string]: object | boolean | undefined;
    has_custom_resolution?: {
        resolution_width: string;
        resolution_height: string;
    };
    is_demo_user?: boolean;
}
/**
 * General launch option, used to generate launch arguments.
 */
export interface LaunchOption {
    /**
     * User selected game profile. For game display name &
     */
    gameProfile?: {
        name: string;
        id: string;
    };
    accessToken?: string;
    userType?: "mojang" | "legacy";
    properties?: object;
    launcherName?: string;
    launcherBrand?: string;
    /**
     * Overwrite the version name of the current version.
     * If this is absent, it will use version name from resolved version.
     */
    versionName?: string;
    /**
     * Overwrite the version type of the current version.
     * If this is absent, it will use version type from resolved version.
     *
     * Some people use this to show fantastic message on the welcome screen.
     */
    versionType?: string;
    /**
     * The full path of launched game icon
     * Currently, this only supported on MacOS
     */
    gameIcon?: string;
    /**
     * The launched game name
     * Currently, this only supported on MacOS
     */
    gameName?: string;
    /**
     * The path of parent directory of saves/logs/configs/mods/resourcepacks
     */
    gamePath: string;
    /**
     * The path of parent directory of assets/libraries
     */
    resourcePath?: string;
    /**
     * The java executable file path. (Not the java home direcotry!)
     */
    javaPath: string;
    /**
     * Min memory, this will add a jvm flag -Xms to the command result
     */
    minMemory?: number;
    /**
     * Min memory, this will add a jvm flag -Xmx to the command result
     */
    maxMemory?: number;
    /**
     * The version of launched Minecraft. Can be either resolved version or version string
     */
    version: string | ResolvedVersion;
    /**
     * Directly launch to a server
     */
    server?: {
        ip: string;
        port?: number;
    };
    /**
     * Resolution. This will add --height & --width or --fullscreen to the java arguments
     */
    resolution?: {
        width?: number;
        height?: number;
        fullscreen?: true;
    };
    /**
     * Extra jvm options. This will append after to generated options.
     * If this is empty, the \`DEFAULT_EXTRA_JVM_ARGS\` will be used.
     */
    extraJVMArgs?: string[];
    /**
     * Extra program arguments. This will append after to generated options.
     */
    extraMCArgs?: string[];
    /**
     * Assign the spawn options to the process.
     *
     * If you try to set \`{ shell: true }\`, you might want to make all argument rounded with "".
     * The \`launch\` function will do it for you, but if you want to spawn process by yourself, remember to do that.
     */
    extraExecOption?: SpawnOptions;
    isDemo?: boolean;
    /**
     * Native directory. It's .minecraft/versions/<version>/<version>-natives by default.
     * You can replace this by your self.
     */
    nativeRoot?: string;
    /**
     * Enable features. Not really in used...
     */
    features?: EnabledFeatures;
    /**
     * Support yushi's yggdrasil agent https://github.com/to2mbn/authlib-injector/wiki
     */
    yggdrasilAgent?: {
        jar: string;
        server: string;
    };
    /**
     * Add \`-Dfml.ignoreInvalidMinecraftCertificates=true\` to jvm argument
     */
    ignoreInvalidMinecraftCertificates?: boolean;
    /**
     * Add \`-Dfml.ignorePatchDiscrepancies=true\` to jvm argument
     */
    ignorePatchDiscrepancies?: boolean;
}
export interface LaunchPrecheck {
    (resourcePath: MinecraftFolder, version: ResolvedVersion, option: LaunchOption): Promise<void>;
}
export declare namespace LaunchPrecheck {
    const Default: LaunchPrecheck[];
    /**
     * Quick check if Minecraft version jar is corrupted
     */
    function checkVersion(resource: MinecraftFolder, version: ResolvedVersion, option: LaunchOption): Promise<void>;
    /**
     * Quick check if there are missed libraries.
     */
    function checkLibraries(resource: MinecraftFolder, version: ResolvedVersion, option: LaunchOption): Promise<void>;
    /**
     * Ensure the native are correctly extracted there.
     * @param native The native directory path
     */
    function checkNatives(resource: MinecraftFolder, version: ResolvedVersion, option: LaunchOption): Promise<void>;
}
export interface ServerOptions {
    javaPath: string;
    /**
     * Minecraft location
     */
    path: string;
    /**
     * Current working directory. Default is the same with the path.
     */
    cwd?: string;
    version: string | ResolvedVersion;
    nogui?: boolean;
    minMemory?: number;
    maxMemory?: number;
    extraJVMArgs?: string[];
    extraMCArgs?: string[];
    extraExecOption?: SpawnOptions;
}
export declare function launchServer(options: ServerOptions): Promise<ChildProcess>;
/**
 * The Minecraft process watcher. You can inspect Minecraft launch state by this.
 *
 * Generally, there are several cases after you call \`launch\` and get \`ChildProcess\` object
 *
 * 1. child process fire an error, no real process start.
 *
 */
export interface MinecraftProcessWatcher extends EventEmitter {
    /**
     * Fire when the process DOESN'T start at all, like "java not found".
     *
     * The minecraft-kill or minecraft-exit will NOT fire after this fired.
     */
    on(event: "error", listener: (error: any) => void): this;
    /**
     * Fire after Minecraft process exit.
     */
    on(event: "minecraft-exit", listener: (event: {
        /**
         * The code of the process exit. This is the nodejs child process "exit" event arg.
         */
        code: number;
        /**
         * The signal of the process exit. This is the nodejs child process "exit" event arg.
         */
        signal: string;
        /**
         * The crash report content
         */
        crashReport: string;
        /**
         * The location of the crash report
         */
        crashReportLocation: string;
    }) => void): this;
    /**
     * Fire around the time when Minecraft window appeared in screen.
     *
     * Since the Minecraft window will take time to init, this event fire when it capture some keywords from stdout.
     */
    on(event: "minecraft-window-ready", listener: () => void): this;
}
/**
 * Create a process watcher for a minecraft process.
 *
 * It will watch the stdout and the error event of the process to detect error and minecraft state.
 * @param process The Minecraft process
 * @param emitter The event emitter which will emit usefule event
 */
export declare function createMinecraftProcessWatcher(process: ChildProcess, emitter?: EventEmitter): MinecraftProcessWatcher;
/**
 * Launch the minecraft as a child process. This function use spawn to create child process. To use an alternative way, see function generateArguments.
 *
 * This function will also check if the runtime libs are completed, and will extract native libs if needed.
 * This function might throw exception when the version jar is missing/checksum not matched.
 * This function might throw if the libraries/natives are missing.
 *
 * @param options The detail options for this launching.
 * @see ChildProcess
 * @see spawn
 * @see generateArguments
 * @see createMinecraftProcessWatcher
 */
export declare function launch(options: LaunchOption & {
    prechecks?: LaunchPrecheck[];
}): Promise<ChildProcess>;
/**
 * Generate the argument for server
 */
export declare function generateArgumentsServer(options: ServerOptions): Promise<string[]>;
/**
 * Generate the arguments array by options. This function is useful if you want to launch the process by yourself.
 *
 * This function will NOT check if the runtime libs are completed, and WONT'T check or extract native libs.
 *
 */
export declare function generateArguments(options: LaunchOption): Promise<string[]>;
`;
module.exports['@xmcl/core/launch.test.d.ts'] = `export {};
`;
module.exports['@xmcl/core/platform.d.ts'] = `export interface Platform {
    name: "osx" | "linux" | "windows" | "unknown";
    version: string;
    arch: "x86" | "x64" | string;
}
/**
 * Get Minecraft style platform info. (Majorly used to enable/disable native dependencies)
 */
export declare function getPlatform(): Platform;
/**
 * The current platform
 */
export declare const currentPlatform: Platform;
`;
module.exports['@xmcl/core/version.d.ts'] = `import { MinecraftLocation } from "./folder";
import { Platform } from "./platform";
export interface PartialResolvedVersion extends Version {
    libraries: ResolvedLibrary[];
    arguments: {
        game: Version.LaunchArgument[];
        jvm: Version.LaunchArgument[];
    };
    minecraftDirectory: string;
}
/**
 * The resolved version for launcher.
 * It could be a combination of multiple versions as there might be some inheritions.
 */
export interface ResolvedVersion {
    /**
     * The id of the version, should be identical to the version folder.
     */
    id: string;
    arguments: {
        game: Version.LaunchArgument[];
        jvm: Version.LaunchArgument[];
    };
    /**
     * The main class full qualified name
     */
    mainClass: string;
    assetIndex: Version.AssetIndex;
    /**
     * The asset index id of this version. Should be something like \`1.14\`, \`1.12\`
     */
    assets: string;
    downloads: {
        client: Version.Download;
        server: Version.Download;
        [key: string]: Version.Download;
    };
    libraries: ResolvedLibrary[];
    minimumLauncherVersion: number;
    releaseTime: string;
    time: string;
    type: string;
    logging?: {
        [key: string]: {
            file: Version.Download;
            argument: string;
            type: string;
        };
    };
    /**
     * The minecraft version of this version
     */
    minecraftVersion: string;
    /**
     * The minecraft directory of this version
     */
    minecraftDirectory: string;
    /**
     * The version inheritances of this whole resolved version.
     *
     * The first element is this version, and the last element is the root Minecraft version.
     * The dependencies of [<a>, <b>, <c>] should be <a> -> <b> -> <c>, where c is a Minecraft version.
     */
    inheritances: string[];
    /**
     * All array of json file paths.
     *
     * It's the chain of inherits json path. The root json will be the last element of the array.
     * The first element is the user provided version.
     */
    pathChain: string[];
}
export interface LibraryInfo {
    readonly groupId: string;
    readonly artifactId: string;
    readonly version: string;
    readonly isSnapshot: boolean;
    readonly type: string;
    readonly classifier: string;
    readonly path: string;
    readonly name: string;
}
export declare namespace LibraryInfo {
    /**
     * Get the base info of the library from its name
     *
     * @param lib The name of library or the library itself
     */
    function resolve(lib: string | Version.Library | ResolvedLibrary): LibraryInfo;
}
/**
 * A resolved library for launcher. It can by parsed from \`LibraryInfo\`.
 */
export declare class ResolvedLibrary implements LibraryInfo {
    readonly name: string;
    readonly download: Version.Artifact;
    readonly checksums?: string[] | undefined;
    readonly serverreq?: boolean | undefined;
    readonly clientreq?: boolean | undefined;
    readonly groupId: string;
    readonly artifactId: string;
    readonly version: string;
    readonly isSnapshot: boolean;
    readonly type: string;
    readonly classifier: string;
    readonly path: string;
    constructor(name: string, info: LibraryInfo, download: Version.Artifact, checksums?: string[] | undefined, serverreq?: boolean | undefined, clientreq?: boolean | undefined);
}
/**
 * Represent a native libraries provided by Minecraft
 */
export declare class ResolvedNative extends ResolvedLibrary {
    readonly extractExclude?: string[] | undefined;
    constructor(name: string, info: LibraryInfo, download: Version.Artifact, extractExclude?: string[] | undefined);
}
export declare namespace Version {
    interface Download {
        readonly sha1: string;
        readonly size: number;
        url: string;
    }
    interface AssetIndex extends Download {
        readonly id: string;
        readonly totalSize: number;
    }
    interface Artifact extends Download {
        readonly path: string;
    }
    interface LoggingFile extends Download {
        readonly id: string;
    }
    interface NormalLibrary {
        name: string;
        downloads: {
            artifact: Artifact;
        };
    }
    interface Rule {
        action: "allow" | "disallow";
        os?: Partial<Platform>;
        features?: {
            [feat: string]: boolean;
        };
    }
    interface NativeLibrary {
        name: string;
        downloads: {
            artifact: Artifact;
            classifiers: {
                [os: string]: Artifact;
            };
        };
        rules: Rule[];
        extract: {
            exclude: string[];
        };
        natives: {
            [os: string]: string;
        };
    }
    interface PlatformSpecificLibrary {
        name: string;
        downloads: {
            artifact: Artifact;
        };
        rules: Rule[];
    }
    interface LegacyLibrary {
        name: string;
        url?: string;
        clientreq?: boolean;
        serverreq?: boolean;
        checksums?: string[];
    }
    type Library = NormalLibrary | NativeLibrary | PlatformSpecificLibrary | LegacyLibrary;
    type LaunchArgument = string | {
        rules: Rule[];
        value: string | string[];
    };
    /**
      * Check if all the rules in \`Rule[]\` are acceptable in certain OS \`platform\` and features.
      * @param rules The rules usually comes from \`Library\` or \`LaunchArgument\`
      * @param platform The platform, leave it absent will use the \`currentPlatform\`
      * @param features The features, used by game launch argument \`arguments.game\`
      */
    function checkAllowed(rules: Rule[], platform?: Platform, features?: string[]): boolean;
    /**
     * Recursively parse the version JSON.
     *
     * This function requires that the id in version.json is identical to the directory name of that version.
     *
     * e.g. .minecraft/<version-a>/<version-a.json> and in <version-a.json>:
     *
     * { "id": "<version-a>", ... }
     *
     * @param minecraftPath The .minecraft path
     * @param version The vesion id.
     * @return The final resolved version detail
     */
    function parse(minecraftPath: MinecraftLocation, version: string): Promise<ResolvedVersion>;
    /**
     * Simply extends the version (actaully mixin)
     *
     * The result version will have the union of two version's libs. If one lib in two versions has different version, it will take the extra version one.
     * It will also mixin the launchArgument if it could.
     *
     * This function can be used for mixin forge and liteloader version.
     *
     * This function will throw an Error if two version have different assets. It doesn't care about the detail version though.
     *
     * @beta
     * @param id The new version id
     * @param parent The parent version will be inherited
     * @param version The version info which will overlap some parent information
     * @return The raw version json could be save to the version json file
     */
    function inherits(id: string, parent: Version, version: Version): Version;
    /**
     * Mixin the string arguments
     * @beta
     * @param hi Higher priority argument
     * @param lo Lower priority argument
     */
    function mixinArgumentString(hi: string, lo: string): string;
    /**
     * Resolve the dependencies of a minecraft version
     * @param path The path of minecraft
     * @param version The version id
     * @returns All the version required to run this version, including this version
     */
    function resolveDependency(path: MinecraftLocation, version: string): Promise<PartialResolvedVersion[]>;
    /**
     * Resolve all these library and filter out os specific libs
     * @param libs All raw lib
     * @param platform The platform
     */
    function resolveLibraries(libs: Library[], platform?: Platform): ResolvedLibrary[];
    /**
     * Normalize a single version json.
     *
     * This function will force legacy version format into new format.
     * It will convert \`minecraftArguments\` into \`arguments.game\` and generate a default \`arguments.jvm\`
     *
     * This will pre-process the libraries according to the rules fields and current platform.
     * Non-matched libraries will be filtered out.
     *
     * This will also pre-process the jvm arguments according to the platform (os) info it provided.
     *
     * @param versionString The version json string
     * @param root The root of the version
     */
    function normalizeVersionJson(versionString: string, root: string): PartialResolvedVersion;
}
/**
 * The raw json format provided by Minecraft
 */
export interface Version {
    id: string;
    time: string;
    type: string;
    releaseTime: string;
    inheritsFrom?: string;
    minimumLauncherVersion: number;
    minecraftArguments?: string;
    arguments?: {
        game: Version.LaunchArgument[];
        jvm: Version.LaunchArgument[];
    };
    mainClass: string;
    libraries: Version.Library[];
    jar?: string;
    assetIndex?: Version.AssetIndex;
    assets?: string;
    downloads?: {
        client: Version.Download;
        server: Version.Download;
        [key: string]: Version.Download;
    };
    client?: string;
    server?: string;
    logging?: {
        [key: string]: {
            file: Version.Download;
            argument: string;
            type: string;
        };
    };
}
`;
module.exports['@xmcl/core/version.test.d.ts'] = `export {};
`;
module.exports['@xmcl/forge-site-parser/cjs/index.d.ts'] = `interface Download {
    md5: string;
    sha1: string;
    path: string;
}
/**
 * Parse the html string of forge webpage
 */
export declare function parse(content: string): ForgeWebPage;
/**
 * A richer version info than forge installer required
 */
interface Version {
    /**
     * The minecraft version
     */
    mcversion: string;
    /**
     * The version of forge
     */
    version: string;
    date: string;
    /**
     * The changelog info
     */
    changelog?: Download;
    installer: Download;
    mdk?: Download;
    universal: Download;
    source?: Download;
    launcher?: Download;
    /**
     * The type of the forge release. The \`common\` means the normal release.
     */
    type: "buggy" | "recommended" | "common" | "latest";
}
export interface ForgeWebPage {
    versions: Version[];
    mcversion: string;
}
export {};
`;
module.exports['@xmcl/forge-site-parser/index.d.ts'] = `interface Download {
    md5: string;
    sha1: string;
    path: string;
}
/**
 * Parse the html string of forge webpage
 */
export declare function parse(content: string): ForgeWebPage;
/**
 * A richer version info than forge installer required
 */
interface Version {
    /**
     * The minecraft version
     */
    mcversion: string;
    /**
     * The version of forge
     */
    version: string;
    date: string;
    /**
     * The changelog info
     */
    changelog?: Download;
    installer: Download;
    mdk?: Download;
    universal: Download;
    source?: Download;
    launcher?: Download;
    /**
     * The type of the forge release. The \`common\` means the normal release.
     */
    type: "buggy" | "recommended" | "common" | "latest";
}
export interface ForgeWebPage {
    versions: Version[];
    mcversion: string;
}
export {};
`;
module.exports['@xmcl/forge-site-parser/test.d.ts'] = `export {};
`;
module.exports['@xmcl/gamesetting/cjs/index.d.ts'] = `export declare enum AmbientOcclusion {
    Off = 0,
    Minimum = 1,
    Maximum = 2
}
export declare enum Particles {
    Minimum = 2,
    Decreased = 1,
    All = 0
}
export declare enum Difficulty {
    Peaceful = 0,
    Easy = 1,
    Normal = 2,
    Hard = 3
}
export declare type MipmapLevel = 0 | 1 | 2 | 3 | 4;
export declare type RenderDistance = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32;
export declare const RenderDistance: Readonly<{
    Tiny: number;
    Short: number;
    Normal: number;
    Far: number;
    Extreme: number;
}>;
export declare const Graphic: Readonly<{
    Fast: boolean;
    Fancy: boolean;
}>;
export declare type Graphic = boolean;
export declare const RenderCloud: Readonly<{
    Off: boolean;
    Fast: string;
    Fancy: boolean;
}>;
export declare type RenderCloud = true | false | "fast";
export declare enum KeyCode {
    "Escape" = 1,
    "Digit1" = 2,
    "Digit2" = 3,
    "Digit3" = 4,
    "Digit4" = 5,
    "Digit5" = 6,
    "Digit6" = 7,
    "Digit7" = 8,
    "Digit8" = 9,
    "Digit9" = 10,
    "Digit0" = 11,
    "Minus" = 12,
    "Equal" = 13,
    "Backspace" = 14,
    "Tab" = 15,
    "KeyQ" = 16,
    "KeyW" = 17,
    "KeyE" = 18,
    "KeyR" = 19,
    "KeyT" = 20,
    "KeyY" = 21,
    "KeyU" = 22,
    "KeyI" = 23,
    "KeyO" = 24,
    "KeyP" = 25,
    "BracketLeft" = 26,
    "BracketRight" = 27,
    "Enter" = 28,
    "ControlLeft" = 29,
    "KeyA" = 30,
    "KeyS" = 31,
    "KeyD" = 32,
    "KeyF" = 33,
    "KeyG" = 34,
    "KeyH" = 35,
    "KeyJ" = 36,
    "KeyK" = 37,
    "KeyL" = 38,
    "Semicolon" = 39,
    "Quote" = 40,
    "Backquote" = 41,
    "ShiftLeft" = 42,
    "Backslash" = 43,
    "KeyZ" = 44,
    "KeyX" = 45,
    "KeyC" = 46,
    "KeyV" = 47,
    "KeyB" = 48,
    "KeyN" = 49,
    "KeyM" = 50,
    "Comma" = 51,
    "Period" = 52,
    "Slash" = 53,
    "ShiftRight" = 54,
    "Space" = 57,
    "CapsLock" = 58,
    "F1" = 59,
    "F2" = 60,
    "F3" = 61,
    "F4" = 62,
    "F5" = 63,
    "F6" = 64,
    "F7" = 65,
    "F8" = 66,
    "F9" = 67,
    "F10" = 68,
    "NumLock" = 69,
    "ScrollLock" = 70,
    "Numpad7" = 71,
    "Numpad8" = 72,
    "Numpad9" = 73,
    "NumpadSubtract" = 74,
    "Numpad4" = 75,
    "Numpad5" = 76,
    "Numpad6" = 77,
    "NumpadAdd" = 78,
    "Numpad1" = 79,
    "Numpad2" = 80,
    "Numpad3" = 81,
    "Numpad0" = 82,
    "NumpadDecimal" = 83,
    "F11" = 87,
    "F12" = 88,
    "F13" = 100,
    "F14" = 101,
    "F15" = 102,
    "F16" = 103,
    "F17" = 104,
    "F18" = 105,
    "ControlRight" = 157,
    "ArrowUp" = 200,
    "ArrowLeft" = 203,
    "ArrowRight" = 205,
    "ArrowDown" = 208,
    "MULTIPLY" = 55,
    "Left Menu/Alt" = 56,
    "NumpadEnter" = 156,
    "NumpadComma" = 179,
    "Home" = 199,
    "PageUp" = 201,
    "End" = 207,
    "PageDown" = 209,
    "Insert" = 210,
    "Delete" = 211,
    "MouseLeft" = -100,
    "MouseRight" = -99,
    "MouseMiddle" = -98
}
declare const DEFAULT_FRAME: {
    "version": number;
    "invertYMouse": boolean;
    "mouseSensitivity": number;
    "difficulty": Difficulty;
    "renderDistance": RenderDistance;
    "particles": Particles;
    "fboEnable": boolean;
    "fancyGraphics": boolean;
    "ao": AmbientOcclusion;
    "renderClouds": RenderCloud;
    "enableVsync": boolean;
    "useVbo": boolean;
    "mipmapLevels": MipmapLevel;
    "anaglyph3d": boolean;
    "fov": number;
    "gamma": number;
    "saturation": number;
    "guiScale": number;
    "bobView": boolean;
    "maxFps": number;
    "fullscreen": boolean;
    "resourcePacks": string[];
    "incompatibleResourcePacks": string[];
    "lastServer": string;
    "lang": string;
    "chatVisibility": number;
    "chatColors": boolean;
    "chatLinks": boolean;
    "chatLinksPrompt": boolean;
    "chatOpacity": number;
    "snooperEnabled": boolean;
    "hideServerAddress": boolean;
    "advancedItemTooltips": boolean;
    "pauseOnLostFocus": boolean;
    "touchscreen": boolean;
    "overrideWidth": number;
    "overrideHeight": number;
    "heldItemTooltips": boolean;
    "chatHeightFocused": number;
    "chatHeightUnfocused": number;
    "chatScale": number;
    "chatWidth": number;
    "forceUnicodeFont": boolean;
    "reducedDebugInfo": boolean;
    "useNativeTransport": boolean;
    "entityShadows": boolean;
    "mainHand": string;
    "attackIndicator": number;
    "showSubtitles": boolean;
    "realmsNotifications": boolean;
    "enableWeakAttacks": boolean;
    "autoJump": boolean;
    "narrator": number;
    "tutorialStep": string;
    "key_key.attack": KeyCode;
    "key_key.use": KeyCode;
    "key_key.forward": KeyCode;
    "key_key.left": KeyCode;
    "key_key.back": KeyCode;
    "key_key.right": KeyCode;
    "key_key.jump": KeyCode;
    "key_key.sneak": KeyCode;
    "key_key.sprint": KeyCode;
    "key_key.drop": KeyCode;
    "key_key.inventory": KeyCode;
    "key_key.chat": KeyCode;
    "key_key.playerlist": KeyCode;
    "key_key.pickItem": KeyCode;
    "key_key.command": KeyCode;
    "key_key.screenshot": KeyCode;
    "key_key.togglePerspective": KeyCode;
    "key_key.smoothCamera": KeyCode;
    "key_key.fullscreen": KeyCode;
    "key_key.spectatorOutlines": KeyCode;
    "key_key.swapHands": KeyCode;
    "key_key.saveToolbarActivator": KeyCode;
    "key_key.loadToolbarActivator": KeyCode;
    "key_key.advancements": KeyCode;
    "key_key.hotbar.1": KeyCode;
    "key_key.hotbar.2": KeyCode;
    "key_key.hotbar.3": KeyCode;
    "key_key.hotbar.4": KeyCode;
    "key_key.hotbar.5": KeyCode;
    "key_key.hotbar.6": KeyCode;
    "key_key.hotbar.7": KeyCode;
    "key_key.hotbar.8": KeyCode;
    "key_key.hotbar.9": KeyCode;
    "soundCategory_master": KeyCode;
    "soundCategory_music": KeyCode;
    "soundCategory_record": KeyCode;
    "soundCategory_weather": KeyCode;
    "soundCategory_block": KeyCode;
    "soundCategory_hostile": KeyCode;
    "soundCategory_neutral": KeyCode;
    "soundCategory_player": KeyCode;
    "soundCategory_ambient": KeyCode;
    "soundCategory_voice": KeyCode;
    "modelPart_cape": boolean;
    "modelPart_jacket": boolean;
    "modelPart_left_sleeve": boolean;
    "modelPart_right_sleeve": boolean;
    "modelPart_left_pants_leg": boolean;
    "modelPart_right_pants_leg": boolean;
    "modelPart_hat": boolean;
};
export declare type FullFrame = typeof DEFAULT_FRAME;
export declare type Frame = Partial<FullFrame>;
export declare function getDefaultFrame(): FullFrame;
export declare type ModelPart = "cape" | "jacket" | "left_sleeve" | "right_sleeve" | "left_pants_leg" | "right_pants_leg" | "hat";
export declare type SoundCategories = "master" | "music" | "record" | "weather" | "block" | "hostile" | "neutral" | "player" | "ambient" | "voice";
export declare type HotKeys = "attack" | "use" | "forward" | "left" | "back" | "right" | "jump" | "sneak" | "sprint" | "drop" | "inventory" | "chat" | "playerlist" | "pickItem" | "command" | "screenshot" | "togglePerspective" | "smoothCamera" | "fullscreen" | "spectatorOutlines" | "swapHands" | "saveToolbarActivator" | "loadToolbarActivator" | "advancements" | "hotbar.1" | "hotbar.2" | "hotbar.3" | "hotbar.4" | "hotbar.5" | "hotbar.6" | "hotbar.7" | "hotbar.8" | "hotbar.9";
/**
 * Parse raw game setting options.txt content
 *
 * @param str the options.txt content
 * @param strict strictly follow the current version of options format (outdate version might cause problem. If your options.txt is new one with new fields, don't turn on this)
 */
export declare function parse(str: string, strict?: boolean): GameSetting | Frame;
/**
 * Generate text format game setting for options.txt file.
 *
 * @param setting The game setting object
 * @param original
 * @param eol The end of line character, default is \`\n\`
 */
export declare function stringify(setting: GameSetting | Frame | any, original?: string, eol?: string): string;
export declare type GameSetting = ReturnType<typeof getDefaultFrame>;
export {};
`;
module.exports['@xmcl/gamesetting/index.d.ts'] = `export declare enum AmbientOcclusion {
    Off = 0,
    Minimum = 1,
    Maximum = 2
}
export declare enum Particles {
    Minimum = 2,
    Decreased = 1,
    All = 0
}
export declare enum Difficulty {
    Peaceful = 0,
    Easy = 1,
    Normal = 2,
    Hard = 3
}
export declare type MipmapLevel = 0 | 1 | 2 | 3 | 4;
export declare type RenderDistance = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32;
export declare const RenderDistance: Readonly<{
    Tiny: number;
    Short: number;
    Normal: number;
    Far: number;
    Extreme: number;
}>;
export declare const Graphic: Readonly<{
    Fast: boolean;
    Fancy: boolean;
}>;
export declare type Graphic = boolean;
export declare const RenderCloud: Readonly<{
    Off: boolean;
    Fast: string;
    Fancy: boolean;
}>;
export declare type RenderCloud = true | false | "fast";
export declare enum KeyCode {
    "Escape" = 1,
    "Digit1" = 2,
    "Digit2" = 3,
    "Digit3" = 4,
    "Digit4" = 5,
    "Digit5" = 6,
    "Digit6" = 7,
    "Digit7" = 8,
    "Digit8" = 9,
    "Digit9" = 10,
    "Digit0" = 11,
    "Minus" = 12,
    "Equal" = 13,
    "Backspace" = 14,
    "Tab" = 15,
    "KeyQ" = 16,
    "KeyW" = 17,
    "KeyE" = 18,
    "KeyR" = 19,
    "KeyT" = 20,
    "KeyY" = 21,
    "KeyU" = 22,
    "KeyI" = 23,
    "KeyO" = 24,
    "KeyP" = 25,
    "BracketLeft" = 26,
    "BracketRight" = 27,
    "Enter" = 28,
    "ControlLeft" = 29,
    "KeyA" = 30,
    "KeyS" = 31,
    "KeyD" = 32,
    "KeyF" = 33,
    "KeyG" = 34,
    "KeyH" = 35,
    "KeyJ" = 36,
    "KeyK" = 37,
    "KeyL" = 38,
    "Semicolon" = 39,
    "Quote" = 40,
    "Backquote" = 41,
    "ShiftLeft" = 42,
    "Backslash" = 43,
    "KeyZ" = 44,
    "KeyX" = 45,
    "KeyC" = 46,
    "KeyV" = 47,
    "KeyB" = 48,
    "KeyN" = 49,
    "KeyM" = 50,
    "Comma" = 51,
    "Period" = 52,
    "Slash" = 53,
    "ShiftRight" = 54,
    "Space" = 57,
    "CapsLock" = 58,
    "F1" = 59,
    "F2" = 60,
    "F3" = 61,
    "F4" = 62,
    "F5" = 63,
    "F6" = 64,
    "F7" = 65,
    "F8" = 66,
    "F9" = 67,
    "F10" = 68,
    "NumLock" = 69,
    "ScrollLock" = 70,
    "Numpad7" = 71,
    "Numpad8" = 72,
    "Numpad9" = 73,
    "NumpadSubtract" = 74,
    "Numpad4" = 75,
    "Numpad5" = 76,
    "Numpad6" = 77,
    "NumpadAdd" = 78,
    "Numpad1" = 79,
    "Numpad2" = 80,
    "Numpad3" = 81,
    "Numpad0" = 82,
    "NumpadDecimal" = 83,
    "F11" = 87,
    "F12" = 88,
    "F13" = 100,
    "F14" = 101,
    "F15" = 102,
    "F16" = 103,
    "F17" = 104,
    "F18" = 105,
    "ControlRight" = 157,
    "ArrowUp" = 200,
    "ArrowLeft" = 203,
    "ArrowRight" = 205,
    "ArrowDown" = 208,
    "MULTIPLY" = 55,
    "Left Menu/Alt" = 56,
    "NumpadEnter" = 156,
    "NumpadComma" = 179,
    "Home" = 199,
    "PageUp" = 201,
    "End" = 207,
    "PageDown" = 209,
    "Insert" = 210,
    "Delete" = 211,
    "MouseLeft" = -100,
    "MouseRight" = -99,
    "MouseMiddle" = -98
}
declare const DEFAULT_FRAME: {
    "version": number;
    "invertYMouse": boolean;
    "mouseSensitivity": number;
    "difficulty": Difficulty;
    "renderDistance": RenderDistance;
    "particles": Particles;
    "fboEnable": boolean;
    "fancyGraphics": boolean;
    "ao": AmbientOcclusion;
    "renderClouds": RenderCloud;
    "enableVsync": boolean;
    "useVbo": boolean;
    "mipmapLevels": MipmapLevel;
    "anaglyph3d": boolean;
    "fov": number;
    "gamma": number;
    "saturation": number;
    "guiScale": number;
    "bobView": boolean;
    "maxFps": number;
    "fullscreen": boolean;
    "resourcePacks": string[];
    "incompatibleResourcePacks": string[];
    "lastServer": string;
    "lang": string;
    "chatVisibility": number;
    "chatColors": boolean;
    "chatLinks": boolean;
    "chatLinksPrompt": boolean;
    "chatOpacity": number;
    "snooperEnabled": boolean;
    "hideServerAddress": boolean;
    "advancedItemTooltips": boolean;
    "pauseOnLostFocus": boolean;
    "touchscreen": boolean;
    "overrideWidth": number;
    "overrideHeight": number;
    "heldItemTooltips": boolean;
    "chatHeightFocused": number;
    "chatHeightUnfocused": number;
    "chatScale": number;
    "chatWidth": number;
    "forceUnicodeFont": boolean;
    "reducedDebugInfo": boolean;
    "useNativeTransport": boolean;
    "entityShadows": boolean;
    "mainHand": string;
    "attackIndicator": number;
    "showSubtitles": boolean;
    "realmsNotifications": boolean;
    "enableWeakAttacks": boolean;
    "autoJump": boolean;
    "narrator": number;
    "tutorialStep": string;
    "key_key.attack": KeyCode;
    "key_key.use": KeyCode;
    "key_key.forward": KeyCode;
    "key_key.left": KeyCode;
    "key_key.back": KeyCode;
    "key_key.right": KeyCode;
    "key_key.jump": KeyCode;
    "key_key.sneak": KeyCode;
    "key_key.sprint": KeyCode;
    "key_key.drop": KeyCode;
    "key_key.inventory": KeyCode;
    "key_key.chat": KeyCode;
    "key_key.playerlist": KeyCode;
    "key_key.pickItem": KeyCode;
    "key_key.command": KeyCode;
    "key_key.screenshot": KeyCode;
    "key_key.togglePerspective": KeyCode;
    "key_key.smoothCamera": KeyCode;
    "key_key.fullscreen": KeyCode;
    "key_key.spectatorOutlines": KeyCode;
    "key_key.swapHands": KeyCode;
    "key_key.saveToolbarActivator": KeyCode;
    "key_key.loadToolbarActivator": KeyCode;
    "key_key.advancements": KeyCode;
    "key_key.hotbar.1": KeyCode;
    "key_key.hotbar.2": KeyCode;
    "key_key.hotbar.3": KeyCode;
    "key_key.hotbar.4": KeyCode;
    "key_key.hotbar.5": KeyCode;
    "key_key.hotbar.6": KeyCode;
    "key_key.hotbar.7": KeyCode;
    "key_key.hotbar.8": KeyCode;
    "key_key.hotbar.9": KeyCode;
    "soundCategory_master": KeyCode;
    "soundCategory_music": KeyCode;
    "soundCategory_record": KeyCode;
    "soundCategory_weather": KeyCode;
    "soundCategory_block": KeyCode;
    "soundCategory_hostile": KeyCode;
    "soundCategory_neutral": KeyCode;
    "soundCategory_player": KeyCode;
    "soundCategory_ambient": KeyCode;
    "soundCategory_voice": KeyCode;
    "modelPart_cape": boolean;
    "modelPart_jacket": boolean;
    "modelPart_left_sleeve": boolean;
    "modelPart_right_sleeve": boolean;
    "modelPart_left_pants_leg": boolean;
    "modelPart_right_pants_leg": boolean;
    "modelPart_hat": boolean;
};
export declare type FullFrame = typeof DEFAULT_FRAME;
export declare type Frame = Partial<FullFrame>;
export declare function getDefaultFrame(): FullFrame;
export declare type ModelPart = "cape" | "jacket" | "left_sleeve" | "right_sleeve" | "left_pants_leg" | "right_pants_leg" | "hat";
export declare type SoundCategories = "master" | "music" | "record" | "weather" | "block" | "hostile" | "neutral" | "player" | "ambient" | "voice";
export declare type HotKeys = "attack" | "use" | "forward" | "left" | "back" | "right" | "jump" | "sneak" | "sprint" | "drop" | "inventory" | "chat" | "playerlist" | "pickItem" | "command" | "screenshot" | "togglePerspective" | "smoothCamera" | "fullscreen" | "spectatorOutlines" | "swapHands" | "saveToolbarActivator" | "loadToolbarActivator" | "advancements" | "hotbar.1" | "hotbar.2" | "hotbar.3" | "hotbar.4" | "hotbar.5" | "hotbar.6" | "hotbar.7" | "hotbar.8" | "hotbar.9";
/**
 * Parse raw game setting options.txt content
 *
 * @param str the options.txt content
 * @param strict strictly follow the current version of options format (outdate version might cause problem. If your options.txt is new one with new fields, don't turn on this)
 */
export declare function parse(str: string, strict?: boolean): GameSetting | Frame;
/**
 * Generate text format game setting for options.txt file.
 *
 * @param setting The game setting object
 * @param original
 * @param eol The end of line character, default is \`\n\`
 */
export declare function stringify(setting: GameSetting | Frame | any, original?: string, eol?: string): string;
export declare type GameSetting = ReturnType<typeof getDefaultFrame>;
export {};
`;
module.exports['@xmcl/gamesetting/test.d.ts'] = `export {};
`;
module.exports['@xmcl/installer/cjs/diagnose.d.ts'] = `import { MinecraftFolder, MinecraftLocation, Version, ResolvedLibrary } from "@xmcl/core";
import { InstallProfile } from "./forge";
import Task from "@xmcl/task";
export declare enum Status {
    /**
     * File is missing
     */
    Missing = "missing",
    /**
     * File checksum not match
     */
    Corrupted = "corrupted",
    /**
     * Not checked
     */
    Unknown = "unknown",
    /**
     * File is good
     */
    Good = ""
}
export interface StatusItem<T> {
    status: Status;
    value: T;
}
/**
 * General diagnosis of the version.
 * The missing diagnosis means either the file not existed, or the file not valid (checksum not matched)
 */
export interface Report {
    minecraftLocation: MinecraftFolder;
    version: string;
    versionJson: StatusItem<string>;
    versionJar: Status;
    assetsIndex: Status;
    libraries: StatusItem<ResolvedLibrary>[];
    assets: StatusItem<{
        file: string;
        hash: string;
    }>[];
    forge?: ForgeReport;
}
/**
 * Diagnose the version. It will check the version json/jar, libraries and assets.
 *
 * @param version The version id string
 * @param minecraft The minecraft location
 */
export declare function diagnose(version: string, minecraft: MinecraftLocation): Promise<Report>;
/**
 * Diagnose the version. It will check the version json/jar, libraries and assets.
 *
 * @param version The version id string
 * @param minecraft The minecraft location
 */
export declare function diagnoseTask(version: string, minecraftLocation: MinecraftLocation): Task<Report>;
declare type Processor = InstallProfile["processors"][number];
/**
 * The forge diagnosis report. It may have some intersection with \`Version.Diagnosis\`.
 */
export interface ForgeReport {
    /**
     * When this flag is true, please reinstall totally.
     */
    badInstall: boolean;
    /**
     * This will be true if the forge version json doesn't contain correct argument or it does not exist.
     */
    badVersionJson: boolean;
    /**
     * Determine whether the forge binary patch existed.
     */
    binpatch: Status.Missing | Status.Good | Status.Unknown;
    /**
     * When this is not empty, please use \`postProcessInstallProfile\`
     */
    libraries: StatusItem<Version.NormalLibrary>[];
    /**
     * Existed some unprocess processors or fail to process processor.
     * You can use \`postProcess\` to process these Processors.
     */
    unprocessed: Processor[];
    /**
     * Forge launch require a srg jar, but it might missing here. Missing it require a full re-install.
     */
    missingSrgJar: boolean;
    /**
     * Alt for badProcessedFiles
     */
    missingMinecraftExtraJar: boolean;
    /**
     * Alt for badProcessedFiles
     */
    missingForgePatchesJar: boolean;
}
/**
 * Diagnose for specific forge version. Majorly for the current installer forge. (mcversion >= 1.13)
 *
 * Don't use this with the version less than 1.13
 * @param versionOrProfile If the version string present, it will try to find the installer profile under version folder. Otherwise it will use presented installer profile to diagnose
 * @param minecraft The minecraft location.
 */
export declare function diagnoseForgeVersion(versionOrProfile: string | InstallProfile, minecraft: MinecraftLocation): Promise<ForgeReport>;
export {};
`;
module.exports['@xmcl/installer/cjs/fabric.d.ts'] = `import { UpdatedObject, InstallOptions } from "./util";
import { MinecraftLocation } from "@xmcl/core";
export declare const YARN_MAVEN_URL = "https://maven.fabricmc.net/net/fabricmc/yarn/maven-metadata.xml";
export declare const LOADER_MAVEN_URL = "https://maven.fabricmc.net/net/fabricmc/fabric-loader/maven-metadata.xml";
/**
 * Fabric Yarn version list
 * @see https://github.com/FabricMC/yarn
 */
export interface YarnVersionList extends UpdatedObject {
    versions: string[];
}
/**
 * Fabric mod loader version list
 * @see https://fabricmc.net/
 */
export interface LoaderVersionList extends UpdatedObject {
    versions: string[];
}
/**
 * Parse the maven xml provided by Fabric. This is pretty tricky. I don't want to include another lib to parse xml.
 * Therefore I just use RegExp here to match.
 *
 * @param content The xml string from Fabric.
 */
export declare function parseVersionMavenXML(content: string): string[];
/**
 * Get or refresh the yarn version list.
 */
export declare function getYarnVersionList(option?: {
    /**
     * If this presents, it will send request with the original list timestamp.
     *
     * If the server believes there is no modification after the original one,
     * it will directly return the orignal one.
     */
    original?: YarnVersionList;
    /**
     * remote maven xml url of this request
     */
    remote?: string;
}): Promise<YarnVersionList>;
/**
 * Get or refresh the fabric mod loader version list.
 */
export declare function getLoaderVersionList(option: {
    /**
     * If this presents, it will send request with the original list timestamp.
     *
     * If the server believes there is no modification after the original one,
     * it will directly return the orignal one.
     */
    original?: LoaderVersionList;
    /**
     * remote maven xml url of this request
     */
    remote?: string;
}): Promise<LoaderVersionList>;
/**
 * Install the fabric to the client. Notice that this will only install the json.
 * You need to call \`Installer.installDependencies\` to get a full client.
 * @param yarnVersion The yarn version
 * @param loaderVersion The fabric loader version
 * @param minecraft The minecraft location
 * @returns The installed version id
 */
export declare function install(yarnVersion: string, loaderVersion: string, minecraft: MinecraftLocation, options?: InstallOptions): Promise<string>;
`;
module.exports['@xmcl/installer/cjs/forge.d.ts'] = `import { MinecraftFolder, MinecraftLocation, Version as VersionJson } from "@xmcl/core";
import { Task } from "@xmcl/task";
import { LibraryOption } from "./minecraft";
import { JavaExecutor, UpdatedObject, InstallOptions as InstallOptionsBase } from "./util";
export interface VersionList extends UpdatedObject {
    mcversion: string;
    versions: Version[];
}
/**
 * The forge version metadata to download a forge
 */
export interface Version {
    /**
     * The installer info
     */
    installer: {
        md5: string;
        sha1: string;
        /**
         * The url path to concat with forge maven
         */
        path: string;
    };
    universal: {
        md5: string;
        sha1: string;
        /**
         * The url path to concat with forge maven
         */
        path: string;
    };
    /**
     * The minecraft version
     */
    mcversion: string;
    /**
     * The forge version (without minecraft version)
     */
    version: string;
    type?: "buggy" | "recommended" | "common" | "latest";
}
declare type MiniVersion = {
    /**
     * The installer info
     */
    installer: {
        sha1?: string;
        /**
         * The url path to concat with forge maven
         */
        path: string;
    };
    universal: {
        sha1?: string;
        /**
         * The url path to concat with forge maven
         */
        path: string;
    };
    /**
     * The minecraft version
     */
    mcversion: string;
    /**
     * The forge version (without minecraft version)
     */
    version: string;
    type?: "buggy" | "recommended" | "common" | "latest";
};
export declare const DEFAULT_FORGE_MAVEN = "http://files.minecraftforge.net";
export interface InstallProfile {
    spec: number;
    profile: string;
    version: string;
    json: string;
    path: string;
    minecraft: string;
    data: {
        [key: string]: {
            client: string;
            server: string;
        };
    };
    processors: Array<{
        jar: string;
        classpath: string[];
        args: string[];
        outputs?: {
            [key: string]: string;
        };
    }>;
    libraries: VersionJson.NormalLibrary[];
}
/**
 * Post processing function for new forge installer (mcversion >= 1.13). You can use this with \`ForgeInstaller.diagnose\`.
 *
 * @param mc The minecraft location
 * @param proc The processor
 * @param java The java executor
 */
export declare function postProcess(mc: MinecraftFolder, proc: InstallProfile["processors"][number], java: JavaExecutor): Promise<void>;
/**
 * @interal
 */
export declare function postProcessInstallProfile(mc: MinecraftFolder, installProfile: InstallProfile): InstallProfile;
/**
 * Install for forge installer step 2 and 3.
 * @param version The version string or installer profile
 * @param minecraft The minecraft location
 */
export declare function installByInstallerPartialTask(version: string | InstallProfile, minecraft: MinecraftLocation, option?: {
    java?: JavaExecutor;
} & LibraryOption): Task<void>;
/**
 * Install for forge installer step 2 and 3.
 * @param version The version string or installer profile
 * @param minecraft The minecraft location
 */
export declare function installByInstallerPartial(version: string | InstallProfile, minecraft: MinecraftLocation, option?: {
    java?: JavaExecutor;
} & LibraryOption): Promise<void>;
export interface InstallOptions extends InstallOptionsBase, LibraryOption {
    /**
     * You custom maven host url for the people have trouble to download
     */
    maven?: string;
    /**
     * The java executor to run java
     */
    java?: JavaExecutor;
}
/**
 * Install forge to target location.
 * Installation task for forge with mcversion >= 1.13 requires java installed on your pc.
 * @param version The forge version meta
 * @returns The installed version name.
 */
export declare function install(version: MiniVersion, minecraft: MinecraftLocation, option?: InstallOptions): Promise<string>;
/**
 * Install forge to target location.
 * Installation task for forge with mcversion >= 1.13 requires java installed on your pc.
 * @param version The forge version meta
 * @returns The task to install the forge
 */
export declare function installTask(version: MiniVersion, minecraft: MinecraftLocation, option?: InstallOptions): Task<string>;
/**
 * Query the webpage content from files.minecraftforge.net.
 *
 * You can put the last query result to the fallback option. It will check if your old result is up-to-date.
 * It will request a new page only when the fallback option is outdated.
 *
 * @param option The option can control querying minecraft version, and page caching.
 */
export declare function getVersionList(option?: {
    /**
     * The minecraft version you are requesting
     */
    mcversion?: string;
    /**
     * If this presents, it will send request with the original list timestamp.
     *
     * If the server believes there is no modification after the original one,
     * it will directly return the orignal one.
     */
    original?: VersionList;
}): Promise<VersionList>;
export {};
`;
module.exports['@xmcl/installer/cjs/index.d.ts'] = `import * as FabricInstaller from "./fabric";
import * as LiteLoaderInstaller from "./liteloader";
import * as ForgeInstaller from "./forge";
import * as Installer from "./minecraft";
import * as Diagnosis from "./diagnose";
export { JavaExecutor, DownloadOption, DownloadToOption, Downloader, DownloadStrategy, DefaultDownloader } from "./util";
export { Installer, ForgeInstaller, LiteLoaderInstaller, FabricInstaller, Diagnosis };
`;
module.exports['@xmcl/installer/cjs/liteloader.d.ts'] = `import { MinecraftLocation } from "@xmcl/core";
import { Task } from "@xmcl/task";
import { UpdatedObject, InstallOptions } from "./util";
export declare const DEFAULT_VERSION_MANIFEST = "http://dl.liteloader.com/versions/versions.json";
/**
 * The liteloader version list. Containing the minecraft version -> liteloader version info mapping.
 */
export interface VersionList extends UpdatedObject {
    meta: {
        description: string;
        authors: string;
        url: string;
        updated: string;
        updatedTime: number;
    };
    versions: {
        [version: string]: {
            snapshot?: Version;
            release?: Version;
        };
    };
}
export declare namespace VersionList {
    function parse(content: string): {
        meta: any;
        versions: {};
    };
}
/**
 * A liteloader remote version information
 */
export interface Version {
    version: string;
    url: string;
    file: string;
    mcversion: string;
    type: "RELEASE" | "SNAPSHOT";
    md5: string;
    timestamp: string;
    libraries: Array<{
        name: string;
        url?: string;
    }>;
    tweakClass: string;
}
/**
 * Get or update the LiteLoader version list.
 *
 * This will request liteloader offical json by default. You can replace the request by assigning the remote option.
 */
export declare function getVersionList(option?: {
    /**
     * If this presents, it will send request with the original list timestamp.
     *
     * If the server believes there is no modification after the original one,
     * it will directly return the orignal one.
     */
    original?: VersionList;
    /**
     * The optional requesting version json url.
     */
    remote?: string;
}): Promise<VersionList>;
/**
 * Install the liteloader to specific minecraft location.
 *
 * This will install the liteloader amount on the corresponded Minecraft version by default.
 * If you want to install over the forge. You should first install forge and pass the installed forge version id to the third param,
 * like \`1.12-forge-xxxx\`
 *
 * @param versionMeta The liteloader version metadata.
 * @param location The minecraft location you want to install
 * @param version The real existed version id (under the the provided minecraft location) you want to installed liteloader inherit
 */
export declare function install(versionMeta: Version, location: MinecraftLocation, options?: InstallOptions): Promise<string>;
/**
 * Install the liteloader to specific minecraft location.
 *
 * This will install the liteloader amount on the corresponded Minecraft version by default.
 * If you want to install over the forge. You should first install forge and pass the installed forge version id to the third param,
 * like \`1.12-forge-xxxx\`
 *
 * @tasks installLiteloader, installLiteloader.resolveVersionJson installLiteloader.generateLiteloaderJson
 *
 * @param versionMeta The liteloader version metadata.
 * @param location The minecraft location you want to install
 * @param version The real existed version id (under the the provided minecraft location) you want to installed liteloader inherit
 */
export declare function installTask(versionMeta: Version, location: MinecraftLocation, options?: InstallOptions): Task<string>;
`;
module.exports['@xmcl/installer/cjs/minecraft.d.ts'] = `import { MinecraftLocation, ResolvedLibrary, ResolvedVersion } from "@xmcl/core";
import Task from "@xmcl/task";
import { Downloader, UpdatedObject, DownloadStrategy } from "./util";
/**
 * The function to swap library host.
 */
export declare type LibraryHost = (library: ResolvedLibrary) => string | string[] | undefined;
/**
 * The version metadata containing the version information, like download url
 */
export interface Version {
    id: string;
    type: string;
    time: string;
    releaseTime: string;
    url: string;
}
/**
 * Minecraft version metadata list
 */
export interface VersionList extends UpdatedObject {
    latest: {
        /**
         * Snapshot version id of the Minecraft
         */
        snapshot: string;
        /**
         * Release version id of the Minecraft, like 1.14.2
         */
        release: string;
    };
    /**
     * All the vesrsion list
     */
    versions: Version[];
}
/**
 * Default minecraft version manifest url.
 */
export declare const DEFAULT_VERSION_MANIFEST_URL = "https://launchermeta.mojang.com/mc/game/version_manifest.json";
/**
 * Default resource/assets url root
 */
export declare const DEFAULT_RESOURCE_ROOT_URL = "https://resources.download.minecraft.net";
/**
 * Get and update the version list.
 * This try to send http GET request to offical Minecraft metadata endpoint by default.
 * You can swap the endpoint by passing url on \`remote\` in option.
 *
 * @returns The new list if there is
 */
export declare function getVersionList(option?: {
    /**
     * If this presents, it will send request with the original list timestamp.
     *
     * If the server believes there is no modification after the original one,
     * it will directly return the orignal one.
     */
    original?: VersionList;
    /**
     * remote url of this request
     */
    remote?: string;
}): Promise<VersionList>;
export interface DownloaderOption {
    /**
     * An external downloader.
     *
     * If this is assigned, the returned task won't be able to track progress.
     * You should track the download progress by you self.
     */
    downloader?: Downloader;
    /**
     * An hook to decide should we download a resource.
     *
     * The default strategy will check the checksum and the existence of the file to decide should we download the file.
     */
    downloadStrategy?: DownloadStrategy;
}
/**
 * Change the library host url
 */
export interface LibraryOption extends DownloaderOption {
    /**
     * Assign this to swap library host.
     */
    libraryHost?: LibraryHost;
}
/**
 * Change the host url of assets download
 */
export interface AssetsOption extends DownloaderOption {
    assetsHost?: string | string[];
}
/**
 * Replace the minecraft client or server jar download
 */
export interface JarOption extends DownloaderOption {
    /**
     * The client jar url
     */
    client?: string;
    /**
     * The server jar url
     */
    server?: string;
}
export declare type Option = AssetsOption & JarOption & LibraryOption;
declare type RequiredVersion = Pick<Version, "id" | "url">;
/**
 * Install the Minecraft game to a location by version metadata.
 *
 * This will install version json, version jar, and all dependencies (assets, libraries)
 *
 * @param type The type of game, client or server
 * @param versionMeta The version metadata
 * @param minecraft The Minecraft location
 * @param option
 */
export declare function install(type: "server" | "client", versionMeta: RequiredVersion, minecraft: MinecraftLocation, option?: Option): Promise<ResolvedVersion>;
/**
 * Install the Minecraft game to a location by version metadata
 *
 * This will install version json, version jar, and all dependencies (assets, libraries)
 *
 * Tasks emmitted:
 * - install
 *  - installVersion
 *   - json
 *   - jar
 *  - installDependencies
 *   - installAssets
 *     - assetsJson
 *     - asset
 *   - installLibraries
 *     - library
 *
 * @param type The type of game, client or server
 * @param versionMeta The version metadata
 * @param minecraft The Minecraft location
 * @param option
 */
export declare function installTask(type: "server" | "client", versionMeta: RequiredVersion, minecraft: MinecraftLocation, option?: Option): Task<ResolvedVersion>;
/**
 * Only install the json/jar. Do not install dependencies.
 *
 * @param type client or server
 * @param versionMeta the version metadata; get from updateVersionMeta
 * @param minecraft minecraft location
 */
export declare function installVersion(type: "client" | "server", versionMeta: Version, minecraft: MinecraftLocation, option?: JarOption): Promise<ResolvedVersion>;
/**
 * Only install the json/jar. Do not check dependencies;
 *
 * Task emmitted:
 * - installVersion
 *   - json
 *   - jar
 *
 * @param type client or server
 * @param versionMeta the version metadata; get from updateVersionMeta
 * @param minecraft minecraft location
 */
export declare function installVersionTask(type: "client" | "server", versionMeta: RequiredVersion, minecraft: MinecraftLocation, option?: JarOption): Task<ResolvedVersion>;
/**
 * Install the completeness of the Minecraft game assets and libraries on a existed version.
 *
 * @param version The resolved version produced by Version.parse
 * @param minecraft The minecraft location
 */
export declare function installDependencies(version: ResolvedVersion, option?: Option): Promise<ResolvedVersion>;
/**
 * Install the completeness of the Minecraft game assets and libraries.
 *
 * Tasks emitted:
 * - installDependencies
 *  - installAssets
 *   - assetsJson
 *   - asset
 *  - installLibraries
 *   - library
 *
 * @param version The resolved version produced by Version.parse
 * @param minecraft The minecraft location
 */
export declare function installDependenciesTask(version: ResolvedVersion, option?: Option): Task<ResolvedVersion>;
/**
 * Install or check the assets to resolved version
 * @param version The target version
 * @param option The option to replace assets host url
 */
export declare function installAssets(version: ResolvedVersion, option?: AssetsOption): Promise<ResolvedVersion>;
/**
 * Install or check the assets to resolved version
 *
 * Task emitted:
 * - installAssets
 *  - assetsJson
 *  - asset
 *
 * @param version The target version
 * @param option The option to replace assets host url
 */
export declare function installAssetsTask(version: ResolvedVersion, option?: AssetsOption): Task<ResolvedVersion>;
/**
 * Install all the libraries of providing version
 * @param version The target version
 * @param option The library host swap option
 */
export declare function installLibraries(version: ResolvedVersion, option?: LibraryOption): Promise<ResolvedVersion>;
/**
 * Install all the libraries of providing version
 *
 * Task emmitted:
 * - installLibraries
 *  - library
 *
 * @param version The target version
 * @param option The library host swap option
 */
export declare function installLibrariesTask<T extends Pick<ResolvedVersion, "minecraftDirectory" | "libraries">>(version: T, option?: LibraryOption): Task<T>;
/**
 * Only install several resolved libraries
 * @param libraries The resolved libraries
 * @param minecraft The minecraft location
 * @param option The install option
 */
export declare function installResolvedLibraries(libraries: ResolvedLibrary[], minecraft: MinecraftLocation, option?: LibraryOption): Promise<void>;
/**
 * Only install several resolved libraries.
 *
 * Task emmitted:
 * - installLibraries
 *  - library
 *
 * @param libraries The resolved libraries
 * @param minecraft The minecraft location
 * @param option The install option
 */
export declare function installResolvedLibrariesTask(libraries: ResolvedLibrary[], minecraft: MinecraftLocation, option?: LibraryOption): Task<void>;
export {};
`;
module.exports['@xmcl/installer/cjs/util.d.ts'] = `/// <reference types="node" />
import Task from "@xmcl/task";
import { ExecOptions } from "child_process";
import { Writable } from "stream";
export interface UpdatedObject {
    timestamp: string;
}
export declare const got: import("got/dist/source").Got;
export declare const fetchJson: import("got/dist/source").Got;
export declare const fetchBuffer: import("got/dist/source").Got;
export declare function getRawIfUpdate(url: string, timestamp?: string): Promise<{
    timestamp: string;
    content: string | undefined;
}>;
export declare function getIfUpdate<T extends UpdatedObject>(url: string, parser: (s: string) => any, lastObject: T | undefined): Promise<T>;
export interface DownloadOption {
    url: string | string[];
    retry?: number;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "HEAD" | "DELETE" | "OPTIONS" | "TRACE" | "get" | "post" | "put" | "patch" | "head" | "delete" | "options" | "trace";
    headers?: {
        [key: string]: string;
    };
    timeout?: number;
    /**
     * If user wants to know the progress, pass this in, and \`Downloader\` should call this when there is a progress.
     */
    progress?: (written: number, total: number, url: string) => boolean | void;
    /**
     * If user wants to pause/resume the download, pass this in, and \`Downloader\` should call this to tell user how to pause and resume.
     */
    pausable?: (pauseFunc: () => void, resumeFunc: () => void) => void;
}
export interface DownloadToOption extends DownloadOption {
    destination: string;
    checksum?: {
        algorithm: string;
        hash: string;
    };
}
export interface Downloader {
    /**
     * Download file to the disk
     *
     * @returns The downloaded file full path
     */
    downloadFile(option: DownloadToOption): Promise<void>;
}
export interface DownloadStrategy {
    /**
     * Determine if the \`Downloader\` should download this resource.
     *
     * @returns Should \`Downloader\` download
     */
    shouldDownload(option: DownloadToOption): Promise<boolean>;
}
export declare class DefaultDownloader implements Downloader, DownloadStrategy {
    protected openDownloadStreamInternal(url: string, option: DownloadOption): import("fs").ReadStream | import("got/dist/source").ResponseStream<unknown>;
    protected shouldDownloadFile(destination: string, option?: DownloadToOption["checksum"]): Promise<boolean>;
    /**
     * Download the file to the write stream
     */
    downloadToStream(option: DownloadOption, openWriteStream: () => Writable): Promise<void>;
    /**
     * Download file whatever the file existed or not.
     * @returns The downloaded file full path
     */
    downloadFile(option: DownloadToOption): Promise<void>;
    shouldDownload(option: DownloadToOption): Promise<boolean>;
}
/**
 * Set default downloader of the library
 */
export declare function setDownloader(newDownloader: Downloader): void;
export declare function setDownloadStrategy(newStrategy: DownloadStrategy): void;
export declare function getDownloader(): Downloader;
export declare function getDownloadStrategy(): DownloadStrategy;
/**
 * Wrapped task form of the download file task
 */
export declare function downloadFileTask(option: DownloadToOption, worker?: Downloader, stra?: DownloadStrategy): (context: Task.Context) => Promise<void>;
/**
 * Wrapped task form of download file if absent task
 */
export declare function downloadFileIfAbsentTask(option: DownloadToOption, worker?: Downloader, stra?: DownloadStrategy): (context: Task.Context) => Promise<void>;
export declare type JavaExecutor = (args: string[], option?: ExecOptions) => Promise<any>;
export declare namespace JavaExecutor {
    function createSimple(javaPath: string, defaultOptions?: ExecOptions): JavaExecutor;
}
/**
 * Shared install options
 */
export interface InstallOptions {
    /**
     * When you want to install a version over another one.
     *
     * Like, you want to install liteloader over a forge version.
     * You should fill this with that forge version id.
     */
    inheritsFrom?: string;
    /**
     * Override the newly installed version id.
     *
     * If this is absent, the installed version id will be either generated or provided by installer.
     */
    versionId?: string;
}
`;
module.exports['@xmcl/installer/diagnose.d.ts'] = `import { MinecraftFolder, MinecraftLocation, Version, ResolvedLibrary } from "@xmcl/core";
import { InstallProfile } from "./forge";
import Task from "@xmcl/task";
export declare enum Status {
    /**
     * File is missing
     */
    Missing = "missing",
    /**
     * File checksum not match
     */
    Corrupted = "corrupted",
    /**
     * Not checked
     */
    Unknown = "unknown",
    /**
     * File is good
     */
    Good = ""
}
export interface StatusItem<T> {
    status: Status;
    value: T;
}
/**
 * General diagnosis of the version.
 * The missing diagnosis means either the file not existed, or the file not valid (checksum not matched)
 */
export interface Report {
    minecraftLocation: MinecraftFolder;
    version: string;
    versionJson: StatusItem<string>;
    versionJar: Status;
    assetsIndex: Status;
    libraries: StatusItem<ResolvedLibrary>[];
    assets: StatusItem<{
        file: string;
        hash: string;
    }>[];
    forge?: ForgeReport;
}
/**
 * Diagnose the version. It will check the version json/jar, libraries and assets.
 *
 * @param version The version id string
 * @param minecraft The minecraft location
 */
export declare function diagnose(version: string, minecraft: MinecraftLocation): Promise<Report>;
/**
 * Diagnose the version. It will check the version json/jar, libraries and assets.
 *
 * @param version The version id string
 * @param minecraft The minecraft location
 */
export declare function diagnoseTask(version: string, minecraftLocation: MinecraftLocation): Task<Report>;
declare type Processor = InstallProfile["processors"][number];
/**
 * The forge diagnosis report. It may have some intersection with \`Version.Diagnosis\`.
 */
export interface ForgeReport {
    /**
     * When this flag is true, please reinstall totally.
     */
    badInstall: boolean;
    /**
     * This will be true if the forge version json doesn't contain correct argument or it does not exist.
     */
    badVersionJson: boolean;
    /**
     * Determine whether the forge binary patch existed.
     */
    binpatch: Status.Missing | Status.Good | Status.Unknown;
    /**
     * When this is not empty, please use \`postProcessInstallProfile\`
     */
    libraries: StatusItem<Version.NormalLibrary>[];
    /**
     * Existed some unprocess processors or fail to process processor.
     * You can use \`postProcess\` to process these Processors.
     */
    unprocessed: Processor[];
    /**
     * Forge launch require a srg jar, but it might missing here. Missing it require a full re-install.
     */
    missingSrgJar: boolean;
    /**
     * Alt for badProcessedFiles
     */
    missingMinecraftExtraJar: boolean;
    /**
     * Alt for badProcessedFiles
     */
    missingForgePatchesJar: boolean;
}
/**
 * Diagnose for specific forge version. Majorly for the current installer forge. (mcversion >= 1.13)
 *
 * Don't use this with the version less than 1.13
 * @param versionOrProfile If the version string present, it will try to find the installer profile under version folder. Otherwise it will use presented installer profile to diagnose
 * @param minecraft The minecraft location.
 */
export declare function diagnoseForgeVersion(versionOrProfile: string | InstallProfile, minecraft: MinecraftLocation): Promise<ForgeReport>;
export {};
`;
module.exports['@xmcl/installer/fabric.d.ts'] = `import { UpdatedObject, InstallOptions } from "./util";
import { MinecraftLocation } from "@xmcl/core";
export declare const YARN_MAVEN_URL = "https://maven.fabricmc.net/net/fabricmc/yarn/maven-metadata.xml";
export declare const LOADER_MAVEN_URL = "https://maven.fabricmc.net/net/fabricmc/fabric-loader/maven-metadata.xml";
/**
 * Fabric Yarn version list
 * @see https://github.com/FabricMC/yarn
 */
export interface YarnVersionList extends UpdatedObject {
    versions: string[];
}
/**
 * Fabric mod loader version list
 * @see https://fabricmc.net/
 */
export interface LoaderVersionList extends UpdatedObject {
    versions: string[];
}
/**
 * Parse the maven xml provided by Fabric. This is pretty tricky. I don't want to include another lib to parse xml.
 * Therefore I just use RegExp here to match.
 *
 * @param content The xml string from Fabric.
 */
export declare function parseVersionMavenXML(content: string): string[];
/**
 * Get or refresh the yarn version list.
 */
export declare function getYarnVersionList(option?: {
    /**
     * If this presents, it will send request with the original list timestamp.
     *
     * If the server believes there is no modification after the original one,
     * it will directly return the orignal one.
     */
    original?: YarnVersionList;
    /**
     * remote maven xml url of this request
     */
    remote?: string;
}): Promise<YarnVersionList>;
/**
 * Get or refresh the fabric mod loader version list.
 */
export declare function getLoaderVersionList(option: {
    /**
     * If this presents, it will send request with the original list timestamp.
     *
     * If the server believes there is no modification after the original one,
     * it will directly return the orignal one.
     */
    original?: LoaderVersionList;
    /**
     * remote maven xml url of this request
     */
    remote?: string;
}): Promise<LoaderVersionList>;
/**
 * Install the fabric to the client. Notice that this will only install the json.
 * You need to call \`Installer.installDependencies\` to get a full client.
 * @param yarnVersion The yarn version
 * @param loaderVersion The fabric loader version
 * @param minecraft The minecraft location
 * @returns The installed version id
 */
export declare function install(yarnVersion: string, loaderVersion: string, minecraft: MinecraftLocation, options?: InstallOptions): Promise<string>;
`;
module.exports['@xmcl/installer/forge.d.ts'] = `import { MinecraftFolder, MinecraftLocation, Version as VersionJson } from "@xmcl/core";
import { Task } from "@xmcl/task";
import { LibraryOption } from "./minecraft";
import { JavaExecutor, UpdatedObject, InstallOptions as InstallOptionsBase } from "./util";
export interface VersionList extends UpdatedObject {
    mcversion: string;
    versions: Version[];
}
/**
 * The forge version metadata to download a forge
 */
export interface Version {
    /**
     * The installer info
     */
    installer: {
        md5: string;
        sha1: string;
        /**
         * The url path to concat with forge maven
         */
        path: string;
    };
    universal: {
        md5: string;
        sha1: string;
        /**
         * The url path to concat with forge maven
         */
        path: string;
    };
    /**
     * The minecraft version
     */
    mcversion: string;
    /**
     * The forge version (without minecraft version)
     */
    version: string;
    type?: "buggy" | "recommended" | "common" | "latest";
}
declare type MiniVersion = {
    /**
     * The installer info
     */
    installer: {
        sha1?: string;
        /**
         * The url path to concat with forge maven
         */
        path: string;
    };
    universal: {
        sha1?: string;
        /**
         * The url path to concat with forge maven
         */
        path: string;
    };
    /**
     * The minecraft version
     */
    mcversion: string;
    /**
     * The forge version (without minecraft version)
     */
    version: string;
    type?: "buggy" | "recommended" | "common" | "latest";
};
export declare const DEFAULT_FORGE_MAVEN = "http://files.minecraftforge.net";
export interface InstallProfile {
    spec: number;
    profile: string;
    version: string;
    json: string;
    path: string;
    minecraft: string;
    data: {
        [key: string]: {
            client: string;
            server: string;
        };
    };
    processors: Array<{
        jar: string;
        classpath: string[];
        args: string[];
        outputs?: {
            [key: string]: string;
        };
    }>;
    libraries: VersionJson.NormalLibrary[];
}
/**
 * Post processing function for new forge installer (mcversion >= 1.13). You can use this with \`ForgeInstaller.diagnose\`.
 *
 * @param mc The minecraft location
 * @param proc The processor
 * @param java The java executor
 */
export declare function postProcess(mc: MinecraftFolder, proc: InstallProfile["processors"][number], java: JavaExecutor): Promise<void>;
/**
 * @interal
 */
export declare function postProcessInstallProfile(mc: MinecraftFolder, installProfile: InstallProfile): InstallProfile;
/**
 * Install for forge installer step 2 and 3.
 * @param version The version string or installer profile
 * @param minecraft The minecraft location
 */
export declare function installByInstallerPartialTask(version: string | InstallProfile, minecraft: MinecraftLocation, option?: {
    java?: JavaExecutor;
} & LibraryOption): Task<void>;
/**
 * Install for forge installer step 2 and 3.
 * @param version The version string or installer profile
 * @param minecraft The minecraft location
 */
export declare function installByInstallerPartial(version: string | InstallProfile, minecraft: MinecraftLocation, option?: {
    java?: JavaExecutor;
} & LibraryOption): Promise<void>;
export interface InstallOptions extends InstallOptionsBase, LibraryOption {
    /**
     * You custom maven host url for the people have trouble to download
     */
    maven?: string;
    /**
     * The java executor to run java
     */
    java?: JavaExecutor;
}
/**
 * Install forge to target location.
 * Installation task for forge with mcversion >= 1.13 requires java installed on your pc.
 * @param version The forge version meta
 * @returns The installed version name.
 */
export declare function install(version: MiniVersion, minecraft: MinecraftLocation, option?: InstallOptions): Promise<string>;
/**
 * Install forge to target location.
 * Installation task for forge with mcversion >= 1.13 requires java installed on your pc.
 * @param version The forge version meta
 * @returns The task to install the forge
 */
export declare function installTask(version: MiniVersion, minecraft: MinecraftLocation, option?: InstallOptions): Task<string>;
/**
 * Query the webpage content from files.minecraftforge.net.
 *
 * You can put the last query result to the fallback option. It will check if your old result is up-to-date.
 * It will request a new page only when the fallback option is outdated.
 *
 * @param option The option can control querying minecraft version, and page caching.
 */
export declare function getVersionList(option?: {
    /**
     * The minecraft version you are requesting
     */
    mcversion?: string;
    /**
     * If this presents, it will send request with the original list timestamp.
     *
     * If the server believes there is no modification after the original one,
     * it will directly return the orignal one.
     */
    original?: VersionList;
}): Promise<VersionList>;
export {};
`;
module.exports['@xmcl/installer/index.d.ts'] = `import * as FabricInstaller from "./fabric";
import * as LiteLoaderInstaller from "./liteloader";
import * as ForgeInstaller from "./forge";
import * as Installer from "./minecraft";
import * as Diagnosis from "./diagnose";
export { JavaExecutor, DownloadOption, DownloadToOption, Downloader, DownloadStrategy, DefaultDownloader } from "./util";
export { Installer, ForgeInstaller, LiteLoaderInstaller, FabricInstaller, Diagnosis };
`;
module.exports['@xmcl/installer/liteloader.d.ts'] = `import { MinecraftLocation } from "@xmcl/core";
import { Task } from "@xmcl/task";
import { UpdatedObject, InstallOptions } from "./util";
export declare const DEFAULT_VERSION_MANIFEST = "http://dl.liteloader.com/versions/versions.json";
/**
 * The liteloader version list. Containing the minecraft version -> liteloader version info mapping.
 */
export interface VersionList extends UpdatedObject {
    meta: {
        description: string;
        authors: string;
        url: string;
        updated: string;
        updatedTime: number;
    };
    versions: {
        [version: string]: {
            snapshot?: Version;
            release?: Version;
        };
    };
}
export declare namespace VersionList {
    function parse(content: string): {
        meta: any;
        versions: {};
    };
}
/**
 * A liteloader remote version information
 */
export interface Version {
    version: string;
    url: string;
    file: string;
    mcversion: string;
    type: "RELEASE" | "SNAPSHOT";
    md5: string;
    timestamp: string;
    libraries: Array<{
        name: string;
        url?: string;
    }>;
    tweakClass: string;
}
/**
 * Get or update the LiteLoader version list.
 *
 * This will request liteloader offical json by default. You can replace the request by assigning the remote option.
 */
export declare function getVersionList(option?: {
    /**
     * If this presents, it will send request with the original list timestamp.
     *
     * If the server believes there is no modification after the original one,
     * it will directly return the orignal one.
     */
    original?: VersionList;
    /**
     * The optional requesting version json url.
     */
    remote?: string;
}): Promise<VersionList>;
/**
 * Install the liteloader to specific minecraft location.
 *
 * This will install the liteloader amount on the corresponded Minecraft version by default.
 * If you want to install over the forge. You should first install forge and pass the installed forge version id to the third param,
 * like \`1.12-forge-xxxx\`
 *
 * @param versionMeta The liteloader version metadata.
 * @param location The minecraft location you want to install
 * @param version The real existed version id (under the the provided minecraft location) you want to installed liteloader inherit
 */
export declare function install(versionMeta: Version, location: MinecraftLocation, options?: InstallOptions): Promise<string>;
/**
 * Install the liteloader to specific minecraft location.
 *
 * This will install the liteloader amount on the corresponded Minecraft version by default.
 * If you want to install over the forge. You should first install forge and pass the installed forge version id to the third param,
 * like \`1.12-forge-xxxx\`
 *
 * @tasks installLiteloader, installLiteloader.resolveVersionJson installLiteloader.generateLiteloaderJson
 *
 * @param versionMeta The liteloader version metadata.
 * @param location The minecraft location you want to install
 * @param version The real existed version id (under the the provided minecraft location) you want to installed liteloader inherit
 */
export declare function installTask(versionMeta: Version, location: MinecraftLocation, options?: InstallOptions): Task<string>;
`;
module.exports['@xmcl/installer/minecraft.d.ts'] = `import { MinecraftLocation, ResolvedLibrary, ResolvedVersion } from "@xmcl/core";
import Task from "@xmcl/task";
import { Downloader, UpdatedObject, DownloadStrategy } from "./util";
/**
 * The function to swap library host.
 */
export declare type LibraryHost = (library: ResolvedLibrary) => string | string[] | undefined;
/**
 * The version metadata containing the version information, like download url
 */
export interface Version {
    id: string;
    type: string;
    time: string;
    releaseTime: string;
    url: string;
}
/**
 * Minecraft version metadata list
 */
export interface VersionList extends UpdatedObject {
    latest: {
        /**
         * Snapshot version id of the Minecraft
         */
        snapshot: string;
        /**
         * Release version id of the Minecraft, like 1.14.2
         */
        release: string;
    };
    /**
     * All the vesrsion list
     */
    versions: Version[];
}
/**
 * Default minecraft version manifest url.
 */
export declare const DEFAULT_VERSION_MANIFEST_URL = "https://launchermeta.mojang.com/mc/game/version_manifest.json";
/**
 * Default resource/assets url root
 */
export declare const DEFAULT_RESOURCE_ROOT_URL = "https://resources.download.minecraft.net";
/**
 * Get and update the version list.
 * This try to send http GET request to offical Minecraft metadata endpoint by default.
 * You can swap the endpoint by passing url on \`remote\` in option.
 *
 * @returns The new list if there is
 */
export declare function getVersionList(option?: {
    /**
     * If this presents, it will send request with the original list timestamp.
     *
     * If the server believes there is no modification after the original one,
     * it will directly return the orignal one.
     */
    original?: VersionList;
    /**
     * remote url of this request
     */
    remote?: string;
}): Promise<VersionList>;
export interface DownloaderOption {
    /**
     * An external downloader.
     *
     * If this is assigned, the returned task won't be able to track progress.
     * You should track the download progress by you self.
     */
    downloader?: Downloader;
    /**
     * An hook to decide should we download a resource.
     *
     * The default strategy will check the checksum and the existence of the file to decide should we download the file.
     */
    downloadStrategy?: DownloadStrategy;
}
/**
 * Change the library host url
 */
export interface LibraryOption extends DownloaderOption {
    /**
     * Assign this to swap library host.
     */
    libraryHost?: LibraryHost;
}
/**
 * Change the host url of assets download
 */
export interface AssetsOption extends DownloaderOption {
    assetsHost?: string | string[];
}
/**
 * Replace the minecraft client or server jar download
 */
export interface JarOption extends DownloaderOption {
    /**
     * The client jar url
     */
    client?: string;
    /**
     * The server jar url
     */
    server?: string;
}
export declare type Option = AssetsOption & JarOption & LibraryOption;
declare type RequiredVersion = Pick<Version, "id" | "url">;
/**
 * Install the Minecraft game to a location by version metadata.
 *
 * This will install version json, version jar, and all dependencies (assets, libraries)
 *
 * @param type The type of game, client or server
 * @param versionMeta The version metadata
 * @param minecraft The Minecraft location
 * @param option
 */
export declare function install(type: "server" | "client", versionMeta: RequiredVersion, minecraft: MinecraftLocation, option?: Option): Promise<ResolvedVersion>;
/**
 * Install the Minecraft game to a location by version metadata
 *
 * This will install version json, version jar, and all dependencies (assets, libraries)
 *
 * Tasks emmitted:
 * - install
 *  - installVersion
 *   - json
 *   - jar
 *  - installDependencies
 *   - installAssets
 *     - assetsJson
 *     - asset
 *   - installLibraries
 *     - library
 *
 * @param type The type of game, client or server
 * @param versionMeta The version metadata
 * @param minecraft The Minecraft location
 * @param option
 */
export declare function installTask(type: "server" | "client", versionMeta: RequiredVersion, minecraft: MinecraftLocation, option?: Option): Task<ResolvedVersion>;
/**
 * Only install the json/jar. Do not install dependencies.
 *
 * @param type client or server
 * @param versionMeta the version metadata; get from updateVersionMeta
 * @param minecraft minecraft location
 */
export declare function installVersion(type: "client" | "server", versionMeta: Version, minecraft: MinecraftLocation, option?: JarOption): Promise<ResolvedVersion>;
/**
 * Only install the json/jar. Do not check dependencies;
 *
 * Task emmitted:
 * - installVersion
 *   - json
 *   - jar
 *
 * @param type client or server
 * @param versionMeta the version metadata; get from updateVersionMeta
 * @param minecraft minecraft location
 */
export declare function installVersionTask(type: "client" | "server", versionMeta: RequiredVersion, minecraft: MinecraftLocation, option?: JarOption): Task<ResolvedVersion>;
/**
 * Install the completeness of the Minecraft game assets and libraries on a existed version.
 *
 * @param version The resolved version produced by Version.parse
 * @param minecraft The minecraft location
 */
export declare function installDependencies(version: ResolvedVersion, option?: Option): Promise<ResolvedVersion>;
/**
 * Install the completeness of the Minecraft game assets and libraries.
 *
 * Tasks emitted:
 * - installDependencies
 *  - installAssets
 *   - assetsJson
 *   - asset
 *  - installLibraries
 *   - library
 *
 * @param version The resolved version produced by Version.parse
 * @param minecraft The minecraft location
 */
export declare function installDependenciesTask(version: ResolvedVersion, option?: Option): Task<ResolvedVersion>;
/**
 * Install or check the assets to resolved version
 * @param version The target version
 * @param option The option to replace assets host url
 */
export declare function installAssets(version: ResolvedVersion, option?: AssetsOption): Promise<ResolvedVersion>;
/**
 * Install or check the assets to resolved version
 *
 * Task emitted:
 * - installAssets
 *  - assetsJson
 *  - asset
 *
 * @param version The target version
 * @param option The option to replace assets host url
 */
export declare function installAssetsTask(version: ResolvedVersion, option?: AssetsOption): Task<ResolvedVersion>;
/**
 * Install all the libraries of providing version
 * @param version The target version
 * @param option The library host swap option
 */
export declare function installLibraries(version: ResolvedVersion, option?: LibraryOption): Promise<ResolvedVersion>;
/**
 * Install all the libraries of providing version
 *
 * Task emmitted:
 * - installLibraries
 *  - library
 *
 * @param version The target version
 * @param option The library host swap option
 */
export declare function installLibrariesTask<T extends Pick<ResolvedVersion, "minecraftDirectory" | "libraries">>(version: T, option?: LibraryOption): Task<T>;
/**
 * Only install several resolved libraries
 * @param libraries The resolved libraries
 * @param minecraft The minecraft location
 * @param option The install option
 */
export declare function installResolvedLibraries(libraries: ResolvedLibrary[], minecraft: MinecraftLocation, option?: LibraryOption): Promise<void>;
/**
 * Only install several resolved libraries.
 *
 * Task emmitted:
 * - installLibraries
 *  - library
 *
 * @param libraries The resolved libraries
 * @param minecraft The minecraft location
 * @param option The install option
 */
export declare function installResolvedLibrariesTask(libraries: ResolvedLibrary[], minecraft: MinecraftLocation, option?: LibraryOption): Task<void>;
export {};
`;
module.exports['@xmcl/installer/test.d.ts'] = `export {};
`;
module.exports['@xmcl/installer/util.d.ts'] = `/// <reference types="node" />
import Task from "@xmcl/task";
import { ExecOptions } from "child_process";
import { Writable } from "stream";
export interface UpdatedObject {
    timestamp: string;
}
export declare const got: import("got/dist/source").Got;
export declare const fetchJson: import("got/dist/source").Got;
export declare const fetchBuffer: import("got/dist/source").Got;
export declare function getRawIfUpdate(url: string, timestamp?: string): Promise<{
    timestamp: string;
    content: string | undefined;
}>;
export declare function getIfUpdate<T extends UpdatedObject>(url: string, parser: (s: string) => any, lastObject: T | undefined): Promise<T>;
export interface DownloadOption {
    url: string | string[];
    retry?: number;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "HEAD" | "DELETE" | "OPTIONS" | "TRACE" | "get" | "post" | "put" | "patch" | "head" | "delete" | "options" | "trace";
    headers?: {
        [key: string]: string;
    };
    timeout?: number;
    /**
     * If user wants to know the progress, pass this in, and \`Downloader\` should call this when there is a progress.
     */
    progress?: (written: number, total: number, url: string) => boolean | void;
    /**
     * If user wants to pause/resume the download, pass this in, and \`Downloader\` should call this to tell user how to pause and resume.
     */
    pausable?: (pauseFunc: () => void, resumeFunc: () => void) => void;
}
export interface DownloadToOption extends DownloadOption {
    destination: string;
    checksum?: {
        algorithm: string;
        hash: string;
    };
}
export interface Downloader {
    /**
     * Download file to the disk
     *
     * @returns The downloaded file full path
     */
    downloadFile(option: DownloadToOption): Promise<void>;
}
export interface DownloadStrategy {
    /**
     * Determine if the \`Downloader\` should download this resource.
     *
     * @returns Should \`Downloader\` download
     */
    shouldDownload(option: DownloadToOption): Promise<boolean>;
}
export declare class DefaultDownloader implements Downloader, DownloadStrategy {
    protected openDownloadStreamInternal(url: string, option: DownloadOption): import("fs").ReadStream | import("got/dist/source").ResponseStream<unknown>;
    protected shouldDownloadFile(destination: string, option?: DownloadToOption["checksum"]): Promise<boolean>;
    /**
     * Download the file to the write stream
     */
    downloadToStream(option: DownloadOption, openWriteStream: () => Writable): Promise<void>;
    /**
     * Download file whatever the file existed or not.
     * @returns The downloaded file full path
     */
    downloadFile(option: DownloadToOption): Promise<void>;
    shouldDownload(option: DownloadToOption): Promise<boolean>;
}
/**
 * Set default downloader of the library
 */
export declare function setDownloader(newDownloader: Downloader): void;
export declare function setDownloadStrategy(newStrategy: DownloadStrategy): void;
export declare function getDownloader(): Downloader;
export declare function getDownloadStrategy(): DownloadStrategy;
/**
 * Wrapped task form of the download file task
 */
export declare function downloadFileTask(option: DownloadToOption, worker?: Downloader, stra?: DownloadStrategy): (context: Task.Context) => Promise<void>;
/**
 * Wrapped task form of download file if absent task
 */
export declare function downloadFileIfAbsentTask(option: DownloadToOption, worker?: Downloader, stra?: DownloadStrategy): (context: Task.Context) => Promise<void>;
export declare type JavaExecutor = (args: string[], option?: ExecOptions) => Promise<any>;
export declare namespace JavaExecutor {
    function createSimple(javaPath: string, defaultOptions?: ExecOptions): JavaExecutor;
}
/**
 * Shared install options
 */
export interface InstallOptions {
    /**
     * When you want to install a version over another one.
     *
     * Like, you want to install liteloader over a forge version.
     * You should fill this with that forge version id.
     */
    inheritsFrom?: string;
    /**
     * Override the newly installed version id.
     *
     * If this is absent, the installed version id will be either generated or provided by installer.
     */
    versionId?: string;
}
`;
module.exports['@xmcl/java-installer/cjs/index.d.ts'] = `import Task from "@xmcl/task";
export interface JavaInfo {
    path: string;
    version: string;
    majorVersion: number;
}
export interface InstallOption {
    /**
     * The destination of this installation
     */
    destination: string;
    /**
     * The cached directory which compressed java lzma will be download to.
     * @default os.tempdir()
     */
    cacheDir?: string;
    /**
     * Unpack lzma function. It must present, else it will not be able to unpack mojang provided LZMA.
     */
    unpackLZMA: (src: string, dest: string) => Promise<void>;
    downloader: (option: {
        url: string;
        destination: string;
        checksum: {
            algorithm: string;
            hash: string;
        };
        progress?: (written: number, total: number, url: string) => boolean | void;
        pausable?: (pauseFunc: () => void, resumeFunc: () => void) => void;
    }) => Promise<void>;
}
/**
 * Install JRE from Mojang offical resource. It should install jdk 8.
 * @param options The install options
 */
export declare function installJreFromMojangTask(options: InstallOption): Task<void>;
/**
 * Install JRE from Mojang offical resource. It should install jdk 8.
 * @param options The install options
 */
export declare function installJreFromMojang(options: InstallOption): Promise<void>;
/**
 * Try to resolve a java info at this path.
 * @param path The java exectuable path.
 */
export declare function resolveJava(path: string): Promise<JavaInfo | undefined>;
/**
 * Scan local java version on the disk.
 *
 * It will check if the passed \`locations\` are the home of java.
 * Notice that the locations should not be the executable, but the path of java installation, like JAVA_HOME.
 *
 * On mac/linux, it will perform \`which java\`. On win32, it will perform \`where java\`
 *
 * @param locations The location (like java_home) want to check if it's a
 * @param platform The providing operating system
 */
export declare function scanLocalJava(locations: string[]): Promise<JavaInfo[]>;
`;
module.exports['@xmcl/java-installer/index.d.ts'] = `import Task from "@xmcl/task";
export interface JavaInfo {
    path: string;
    version: string;
    majorVersion: number;
}
export interface InstallOption {
    /**
     * The destination of this installation
     */
    destination: string;
    /**
     * The cached directory which compressed java lzma will be download to.
     * @default os.tempdir()
     */
    cacheDir?: string;
    /**
     * Unpack lzma function. It must present, else it will not be able to unpack mojang provided LZMA.
     */
    unpackLZMA: (src: string, dest: string) => Promise<void>;
    downloader: (option: {
        url: string;
        destination: string;
        checksum: {
            algorithm: string;
            hash: string;
        };
        progress?: (written: number, total: number, url: string) => boolean | void;
        pausable?: (pauseFunc: () => void, resumeFunc: () => void) => void;
    }) => Promise<void>;
}
/**
 * Install JRE from Mojang offical resource. It should install jdk 8.
 * @param options The install options
 */
export declare function installJreFromMojangTask(options: InstallOption): Task<void>;
/**
 * Install JRE from Mojang offical resource. It should install jdk 8.
 * @param options The install options
 */
export declare function installJreFromMojang(options: InstallOption): Promise<void>;
/**
 * Try to resolve a java info at this path.
 * @param path The java exectuable path.
 */
export declare function resolveJava(path: string): Promise<JavaInfo | undefined>;
/**
 * Scan local java version on the disk.
 *
 * It will check if the passed \`locations\` are the home of java.
 * Notice that the locations should not be the executable, but the path of java installation, like JAVA_HOME.
 *
 * On mac/linux, it will perform \`which java\`. On win32, it will perform \`where java\`
 *
 * @param locations The location (like java_home) want to check if it's a
 * @param platform The providing operating system
 */
export declare function scanLocalJava(locations: string[]): Promise<JavaInfo[]>;
`;
module.exports['@xmcl/java-installer/test.d.ts'] = `export {};
`;
module.exports['@xmcl/mod-parser/cjs/fabric.d.ts'] = `import { FileSystem } from "@xmcl/system";
declare type Person = {
    /**
     * The real name, or username, of the person. Mandatory.
     */
    name: string;
    /**
     *  Person's contact information. The same as upper level contact. See above. Optional.
     */
    contact?: string;
};
declare type Environment = "client" | "server" | "*";
/**
 * The \`ModMetadata\` is extract from \`fabric.mod.json\`.
 *
 * The \`fabric.mod.json\` file is a mod metadata file used by Fabric Loader to load mods.
 * In order to be loaded, a mod must have this file with the exact name placed in the root directory of the mod JAR.
 */
export interface ModMetadata {
    /**
     * Needed for internal mechanisms. Must always be 1.
     */
    schemaVersion: number;
    /**
     * Defines the mod's identifier - a string of Latin letters, digits, underscores with length from 1 to 63.
     */
    id: string;
    /**
     * Defines the mod's version - a string value, optionally matching the Semantic Versioning 2.0.0 specification.
     */
    version: string;
    /**
     * Defines where mod runs: only on the client side (client mod), only on the server side (plugin) or on both sides (regular mod). Contains the environment identifier:
     * - \`*\` Runs everywhere. Default.
     * - \`client\` Runs on the client side.
     * - \`server\` Runs on the server side.
     */
    environment?: Environment;
    /**
     * Defines main classes of your mod, that will be loaded.
     * - There are 3 default entry points for your mod:
     *  - main Will be run first. For classes implementing ModInitializer.
     *  - client Will be run second and only on the client side. For classes implementing ClientModInitializer.
     *  - server Will be run second and only on the server side. For classes implementing DedicatedServerModInitializer.
     * - Each entry point can contain any number of classes to load. Classes (or methods or static fields) could be defined in two ways:
     *  - If you're using Java, then just list the classes (or else) full names. For example:
     * \`\`\`json
     * "main": [
     *      "net.fabricmc.example.ExampleMod",
     *      "net.fabricmc.example.ExampleMod::handle"
     *  ]
     * \`\`\`
     *  - If you're using any other language, consult the language adapter's documentation. The Kotlin one is located [here](https://github.com/FabricMC/fabric-language-kotlin/blob/master/README.md).
     */
    entrypoints?: string[];
    /**
     * A list of nested JARs inside your mod's JAR to load. Before using the field, check out [the guidelines on the usage of the nested JARs](https://fabricmc.net/wiki/tutorial:loader04x#nested_jars). Each entry is an object containing file key. That should be a path inside your mod's JAR to the nested JAR. For example:
     * \`\`\`json
     * "jars": [
     *     {
     *         "file": "nested/vendor/dependency.jar"
     *     }
     * ]
     * \`\`\`
     */
    jars?: string[];
    /**
     * A dictionary of adapters for used languages to their adapter classes full names. For example:
     * \`\`\`json
     * "languageAdapters": {
     *    "kotlin": "net.fabricmc.language.kotlin.KotlinAdapter"
     * }
     * \`\`\`
     */
    languageAdapters?: string[];
    /**
     *  A list of mixin configuration files.Each entry is the path to the mixin configuration file inside your mod's JAR or an object containing following fields:
     *  - \`config\` The path to the mixin configuration file inside your mod's JAR.
     *  - \`environment\` The same as upper level \`environment\` field.See above. For example:
     *  \`\`\`json
     *  "mixins": [
     *       "modid.mixins.json",
     *       {
     *           "config": "modid.client-mixins.json",
     *           "environment": "client"
     *       }
     *   ]
     *  \`\`\`
     */
    mixins?: (string | {
        config: string;
        environment: Environment;
    })[];
    /**
     * For dependencies required to run. Without them a game will crash.
     */
    depends?: string[] | string;
    /**
     * For dependencies not required to run. Without them a game will log a warning.
     */
    recommends?: string[] | string;
    /**
     * For dependencies not required to run. Use this as a kind of metadata.
     */
    suggests?: string[] | string;
    /**
     * For mods whose together with yours might cause a game crash. With them a game will crash.
     */
    breaks?: string[] | string;
    /**
     * For mods whose together with yours cause some kind of bugs, etc. With them a game will log a warning.
     */
    conflicts?: string[] | string;
    /**
     * Defines the user-friendly mod's name. If not present, assume it matches id.
     */
    name?: string;
    /**
     * Defines the mod's description. If not present, assume empty string.
     */
    description?: string;
    /**
     * Defines the contact information for the project. It is an object of the following fields:
     */
    contact?: {
        /**
         * Contact e-mail pertaining to the mod. Must be a valid e-mail address.
         */
        email: string;
        /**
         * IRC channel pertaining to the mod. Must be of a valid URL format - for example: irc://irc.esper.net:6667/charset for #charset at EsperNet - the port is optional, and assumed to be 6667 if not present.
         */
        irc: string;
        /**
         * Project or user homepage. Must be a valid HTTP/HTTPS address.
         */
        homepage: string;
        /**
         * Project issue tracker. Must be a valid HTTP/HTTPS address.
         */
        issues: string;
        /**
         * Project source code repository. Must be a valid URL - it can, however, be a specialized URL for a given VCS (such as Git or Mercurial).
         * The list is not exhaustive - mods may provide additional, non-standard keys (such as discord, slack, twitter, etc) - if possible, they should be valid URLs.
         */
        sources: string[];
    };
    /**
     * A list of authors of the mod. Each entry is a single name or an object containing following fields:
     */
    authors?: Person[];
    /**
     * A list of contributors to the mod. Each entry is the same as in author field. See above.
     */
    contributors?: Person[];
    /**
     * Defines the licensing information.Can either be a single license string or a list of them.
     * - This should provide the complete set of preferred licenses conveying the entire mod package.In other words, compliance with all listed licenses should be sufficient for usage, redistribution, etc.of the mod package as a whole.
     * - For cases where a part of code is dual - licensed, choose the preferred license.The list is not exhaustive, serves primarily as a kind of hint, and does not prevent you from granting additional rights / licenses on a case -by -case basis.
     * - To aid automated tools, it is recommended to use SPDX License Identifiers for open - source licenses.
     */
    license?: string | string[];
    /**
     * Defines the mod's icon. Icons are square PNG files. (Minecraft resource packs use 128×128, but that is not a hard requirement - a power of two is, however, recommended.) Can be provided in one of two forms:
     * - A path to a single PNG file.
     * - A dictionary of images widths to their files' paths.
     */
    icon?: string;
}
/**
 * Read fabric mod metadata json from a jar file or a directory
 * @param file The jar file or directory path. I can also be the binary content of the jar if you have already read the jar.
 */
export declare function readModMetaData(file: FileSystem | string | Uint8Array): Promise<ModMetadata>;
export {};
`;
module.exports['@xmcl/mod-parser/cjs/forge.d.ts'] = `import { FileSystem } from "@xmcl/system";
/**
 * Represent the forge config file
 */
export interface Config {
    [category: string]: {
        comment?: string;
        properties: Array<Config.Property<any>>;
    };
}
export declare namespace Config {
    type Type = "I" | "D" | "S" | "B";
    interface Property<T = number | boolean | string | number[] | boolean[] | string[]> {
        readonly type: Type;
        readonly name: string;
        readonly comment?: string;
        value: T;
    }
    /**
     * Convert a forge config to string
     */
    function stringify(config: Config): string;
    /**
     * Parse a forge config string into \`Config\` object
     * @param body The forge config string
     */
    function parse(body: string): Config;
}
export interface ModIndentity {
    readonly modid: string;
    readonly version: string;
}
export interface ModMetaData extends ModIndentity {
    readonly modid: string;
    readonly name: string;
    readonly description?: string;
    readonly version: string;
    readonly mcversion?: string;
    readonly acceptedMinecraftVersions?: string;
    readonly updateJSON?: string;
    readonly url?: string;
    readonly logoFile?: string;
    readonly authorList?: string[];
    readonly credits?: string;
    readonly parent?: string;
    readonly screenShots?: string[];
    readonly fingerprint?: string;
    readonly dependencies?: string;
    readonly accpetRemoteVersions?: string;
    readonly acceptSaveVersions?: string;
    readonly isClientOnly?: boolean;
    readonly isServerOnly?: boolean;
    /**
    * Only present in mods.toml
    */
    readonly modLoader?: string;
    /**
     * Only present in mods.toml
     * A version range to match for said mod loader - for regular FML @Mod it will be the minecraft version (without the 1.)
     */
    readonly loaderVersion?: string;
    /**
    * Only present in mods.toml
    */
    readonly displayName?: string;
}
/**
 * Read metadata of the input mod.
 *
 * This will scan the mcmod.info file, all class file for \`@Mod\` & coremod \`DummyModContainer\` class.
 * This will also scan the manifest file on \`META-INF/MANIFEST.MF\` for tweak mod.
 *
 * @param mod The mod path or data
 */
export declare function readModMetaData(mod: Uint8Array | string | FileSystem): Promise<ModMetaData[]>;
`;
module.exports['@xmcl/mod-parser/cjs/index.d.ts'] = `import * as Forge from "./forge";
import * as LiteLoader from "./liteloader";
import * as Fabric from "./fabric";
export { Forge, LiteLoader, Fabric };
`;
module.exports['@xmcl/mod-parser/cjs/liteloader.d.ts'] = `import { FileSystem } from "@xmcl/system";
export declare const DEFAULT_VERSION_MANIFEST = "http://dl.liteloader.com/versions/versions.json";
export interface MetaData {
    readonly mcversion: string;
    readonly name: string;
    readonly revision: number;
    readonly author?: string;
    readonly version?: string;
    readonly description?: string;
    readonly url?: string;
    readonly tweakClass?: string;
    readonly dependsOn?: string[];
    readonly injectAt?: string;
    readonly requiredAPIs?: string[];
    readonly classTransformerClasses?: string[];
}
export interface VersionMeta {
    version: string;
    url: string;
    file: string;
    mcversion: string;
    type: "RELEASE" | "SNAPSHOT";
    md5: string;
    timestamp: string;
    libraries: Array<{
        name: string;
        url?: string;
    }>;
    tweakClass: string;
}
export declare function readModMetaData(mod: string | Uint8Array | FileSystem): Promise<MetaData>;
`;
module.exports['@xmcl/mod-parser/fabric.d.ts'] = `import { FileSystem } from "@xmcl/system";
declare type Person = {
    /**
     * The real name, or username, of the person. Mandatory.
     */
    name: string;
    /**
     *  Person's contact information. The same as upper level contact. See above. Optional.
     */
    contact?: string;
};
declare type Environment = "client" | "server" | "*";
/**
 * The \`ModMetadata\` is extract from \`fabric.mod.json\`.
 *
 * The \`fabric.mod.json\` file is a mod metadata file used by Fabric Loader to load mods.
 * In order to be loaded, a mod must have this file with the exact name placed in the root directory of the mod JAR.
 */
export interface ModMetadata {
    /**
     * Needed for internal mechanisms. Must always be 1.
     */
    schemaVersion: number;
    /**
     * Defines the mod's identifier - a string of Latin letters, digits, underscores with length from 1 to 63.
     */
    id: string;
    /**
     * Defines the mod's version - a string value, optionally matching the Semantic Versioning 2.0.0 specification.
     */
    version: string;
    /**
     * Defines where mod runs: only on the client side (client mod), only on the server side (plugin) or on both sides (regular mod). Contains the environment identifier:
     * - \`*\` Runs everywhere. Default.
     * - \`client\` Runs on the client side.
     * - \`server\` Runs on the server side.
     */
    environment?: Environment;
    /**
     * Defines main classes of your mod, that will be loaded.
     * - There are 3 default entry points for your mod:
     *  - main Will be run first. For classes implementing ModInitializer.
     *  - client Will be run second and only on the client side. For classes implementing ClientModInitializer.
     *  - server Will be run second and only on the server side. For classes implementing DedicatedServerModInitializer.
     * - Each entry point can contain any number of classes to load. Classes (or methods or static fields) could be defined in two ways:
     *  - If you're using Java, then just list the classes (or else) full names. For example:
     * \`\`\`json
     * "main": [
     *      "net.fabricmc.example.ExampleMod",
     *      "net.fabricmc.example.ExampleMod::handle"
     *  ]
     * \`\`\`
     *  - If you're using any other language, consult the language adapter's documentation. The Kotlin one is located [here](https://github.com/FabricMC/fabric-language-kotlin/blob/master/README.md).
     */
    entrypoints?: string[];
    /**
     * A list of nested JARs inside your mod's JAR to load. Before using the field, check out [the guidelines on the usage of the nested JARs](https://fabricmc.net/wiki/tutorial:loader04x#nested_jars). Each entry is an object containing file key. That should be a path inside your mod's JAR to the nested JAR. For example:
     * \`\`\`json
     * "jars": [
     *     {
     *         "file": "nested/vendor/dependency.jar"
     *     }
     * ]
     * \`\`\`
     */
    jars?: string[];
    /**
     * A dictionary of adapters for used languages to their adapter classes full names. For example:
     * \`\`\`json
     * "languageAdapters": {
     *    "kotlin": "net.fabricmc.language.kotlin.KotlinAdapter"
     * }
     * \`\`\`
     */
    languageAdapters?: string[];
    /**
     *  A list of mixin configuration files.Each entry is the path to the mixin configuration file inside your mod's JAR or an object containing following fields:
     *  - \`config\` The path to the mixin configuration file inside your mod's JAR.
     *  - \`environment\` The same as upper level \`environment\` field.See above. For example:
     *  \`\`\`json
     *  "mixins": [
     *       "modid.mixins.json",
     *       {
     *           "config": "modid.client-mixins.json",
     *           "environment": "client"
     *       }
     *   ]
     *  \`\`\`
     */
    mixins?: (string | {
        config: string;
        environment: Environment;
    })[];
    /**
     * For dependencies required to run. Without them a game will crash.
     */
    depends?: string[] | string;
    /**
     * For dependencies not required to run. Without them a game will log a warning.
     */
    recommends?: string[] | string;
    /**
     * For dependencies not required to run. Use this as a kind of metadata.
     */
    suggests?: string[] | string;
    /**
     * For mods whose together with yours might cause a game crash. With them a game will crash.
     */
    breaks?: string[] | string;
    /**
     * For mods whose together with yours cause some kind of bugs, etc. With them a game will log a warning.
     */
    conflicts?: string[] | string;
    /**
     * Defines the user-friendly mod's name. If not present, assume it matches id.
     */
    name?: string;
    /**
     * Defines the mod's description. If not present, assume empty string.
     */
    description?: string;
    /**
     * Defines the contact information for the project. It is an object of the following fields:
     */
    contact?: {
        /**
         * Contact e-mail pertaining to the mod. Must be a valid e-mail address.
         */
        email: string;
        /**
         * IRC channel pertaining to the mod. Must be of a valid URL format - for example: irc://irc.esper.net:6667/charset for #charset at EsperNet - the port is optional, and assumed to be 6667 if not present.
         */
        irc: string;
        /**
         * Project or user homepage. Must be a valid HTTP/HTTPS address.
         */
        homepage: string;
        /**
         * Project issue tracker. Must be a valid HTTP/HTTPS address.
         */
        issues: string;
        /**
         * Project source code repository. Must be a valid URL - it can, however, be a specialized URL for a given VCS (such as Git or Mercurial).
         * The list is not exhaustive - mods may provide additional, non-standard keys (such as discord, slack, twitter, etc) - if possible, they should be valid URLs.
         */
        sources: string[];
    };
    /**
     * A list of authors of the mod. Each entry is a single name or an object containing following fields:
     */
    authors?: Person[];
    /**
     * A list of contributors to the mod. Each entry is the same as in author field. See above.
     */
    contributors?: Person[];
    /**
     * Defines the licensing information.Can either be a single license string or a list of them.
     * - This should provide the complete set of preferred licenses conveying the entire mod package.In other words, compliance with all listed licenses should be sufficient for usage, redistribution, etc.of the mod package as a whole.
     * - For cases where a part of code is dual - licensed, choose the preferred license.The list is not exhaustive, serves primarily as a kind of hint, and does not prevent you from granting additional rights / licenses on a case -by -case basis.
     * - To aid automated tools, it is recommended to use SPDX License Identifiers for open - source licenses.
     */
    license?: string | string[];
    /**
     * Defines the mod's icon. Icons are square PNG files. (Minecraft resource packs use 128×128, but that is not a hard requirement - a power of two is, however, recommended.) Can be provided in one of two forms:
     * - A path to a single PNG file.
     * - A dictionary of images widths to their files' paths.
     */
    icon?: string;
}
/**
 * Read fabric mod metadata json from a jar file or a directory
 * @param file The jar file or directory path. I can also be the binary content of the jar if you have already read the jar.
 */
export declare function readModMetaData(file: FileSystem | string | Uint8Array): Promise<ModMetadata>;
export {};
`;
module.exports['@xmcl/mod-parser/fabric.test.d.ts'] = `export {};
`;
module.exports['@xmcl/mod-parser/forge.d.ts'] = `import { FileSystem } from "@xmcl/system";
/**
 * Represent the forge config file
 */
export interface Config {
    [category: string]: {
        comment?: string;
        properties: Array<Config.Property<any>>;
    };
}
export declare namespace Config {
    type Type = "I" | "D" | "S" | "B";
    interface Property<T = number | boolean | string | number[] | boolean[] | string[]> {
        readonly type: Type;
        readonly name: string;
        readonly comment?: string;
        value: T;
    }
    /**
     * Convert a forge config to string
     */
    function stringify(config: Config): string;
    /**
     * Parse a forge config string into \`Config\` object
     * @param body The forge config string
     */
    function parse(body: string): Config;
}
export interface ModIndentity {
    readonly modid: string;
    readonly version: string;
}
export interface ModMetaData extends ModIndentity {
    readonly modid: string;
    readonly name: string;
    readonly description?: string;
    readonly version: string;
    readonly mcversion?: string;
    readonly acceptedMinecraftVersions?: string;
    readonly updateJSON?: string;
    readonly url?: string;
    readonly logoFile?: string;
    readonly authorList?: string[];
    readonly credits?: string;
    readonly parent?: string;
    readonly screenShots?: string[];
    readonly fingerprint?: string;
    readonly dependencies?: string;
    readonly accpetRemoteVersions?: string;
    readonly acceptSaveVersions?: string;
    readonly isClientOnly?: boolean;
    readonly isServerOnly?: boolean;
    /**
    * Only present in mods.toml
    */
    readonly modLoader?: string;
    /**
     * Only present in mods.toml
     * A version range to match for said mod loader - for regular FML @Mod it will be the minecraft version (without the 1.)
     */
    readonly loaderVersion?: string;
    /**
    * Only present in mods.toml
    */
    readonly displayName?: string;
}
/**
 * Read metadata of the input mod.
 *
 * This will scan the mcmod.info file, all class file for \`@Mod\` & coremod \`DummyModContainer\` class.
 * This will also scan the manifest file on \`META-INF/MANIFEST.MF\` for tweak mod.
 *
 * @param mod The mod path or data
 */
export declare function readModMetaData(mod: Uint8Array | string | FileSystem): Promise<ModMetaData[]>;
`;
module.exports['@xmcl/mod-parser/forge.test.d.ts'] = `export {};
`;
module.exports['@xmcl/mod-parser/index.d.ts'] = `import * as Forge from "./forge";
import * as LiteLoader from "./liteloader";
import * as Fabric from "./fabric";
export { Forge, LiteLoader, Fabric };
`;
module.exports['@xmcl/mod-parser/liteloader.d.ts'] = `import { FileSystem } from "@xmcl/system";
export declare const DEFAULT_VERSION_MANIFEST = "http://dl.liteloader.com/versions/versions.json";
export interface MetaData {
    readonly mcversion: string;
    readonly name: string;
    readonly revision: number;
    readonly author?: string;
    readonly version?: string;
    readonly description?: string;
    readonly url?: string;
    readonly tweakClass?: string;
    readonly dependsOn?: string[];
    readonly injectAt?: string;
    readonly requiredAPIs?: string[];
    readonly classTransformerClasses?: string[];
}
export interface VersionMeta {
    version: string;
    url: string;
    file: string;
    mcversion: string;
    type: "RELEASE" | "SNAPSHOT";
    md5: string;
    timestamp: string;
    libraries: Array<{
        name: string;
        url?: string;
    }>;
    tweakClass: string;
}
export declare function readModMetaData(mod: string | Uint8Array | FileSystem): Promise<MetaData>;
`;
module.exports['@xmcl/mod-parser/liteloader.test.d.ts'] = `export {};
`;
module.exports['@xmcl/model/block.d.ts'] = `import { BlockModel, PackMeta } from "@xmcl/resourcepack";
import { Object3D } from "three/src/core/Object3D";
import { Vector3 } from "three/src/math/Vector3";
interface Texture {
    url: string;
    animation?: PackMeta.Animation;
}
declare type TextureRegistry = Record<string, Texture>;
export declare const DEFAULT_TRANSFORM: BlockModel.Transform;
export declare const DEFAULT_DISPLAY: BlockModel.Display;
export declare const BUILTIN_GENERATED: BlockModel.Resolved;
export declare class BlockModelObject extends Object3D {
    animationLoop: boolean;
    displayOption: BlockModel.Display;
    applyDisplay(option: string): void;
    getCenter(): Vector3;
}
export declare class BlockModelFactory {
    readonly textureRegistry: TextureRegistry;
    readonly option: {
        clipUVs?: boolean;
        modelOnly?: boolean;
    };
    private static TRANSPARENT_MATERIAL;
    private loader;
    private cachedMaterial;
    constructor(textureRegistry: TextureRegistry, option?: {
        clipUVs?: boolean;
        modelOnly?: boolean;
    });
    /**
     * Get threejs \`Object3D\` for that block model.
     */
    getObject(model: BlockModel.Resolved): BlockModelObject;
}
export {};
`;
module.exports['@xmcl/model/cjs/block.d.ts'] = `import { BlockModel, PackMeta } from "@xmcl/resourcepack";
import { Object3D } from "three/src/core/Object3D";
import { Vector3 } from "three/src/math/Vector3";
interface Texture {
    url: string;
    animation?: PackMeta.Animation;
}
declare type TextureRegistry = Record<string, Texture>;
export declare const DEFAULT_TRANSFORM: BlockModel.Transform;
export declare const DEFAULT_DISPLAY: BlockModel.Display;
export declare const BUILTIN_GENERATED: BlockModel.Resolved;
export declare class BlockModelObject extends Object3D {
    animationLoop: boolean;
    displayOption: BlockModel.Display;
    applyDisplay(option: string): void;
    getCenter(): Vector3;
}
export declare class BlockModelFactory {
    readonly textureRegistry: TextureRegistry;
    readonly option: {
        clipUVs?: boolean;
        modelOnly?: boolean;
    };
    private static TRANSPARENT_MATERIAL;
    private loader;
    private cachedMaterial;
    constructor(textureRegistry: TextureRegistry, option?: {
        clipUVs?: boolean;
        modelOnly?: boolean;
    });
    /**
     * Get threejs \`Object3D\` for that block model.
     */
    getObject(model: BlockModel.Resolved): BlockModelObject;
}
export {};
`;
module.exports['@xmcl/model/cjs/index.d.ts'] = `export * from "./block";
export * from "./player";
`;
module.exports['@xmcl/model/cjs/player-model.d.ts'] = `export interface ModelTemplate {
    head: Part;
    rightLeg: Part;
    leftLeg: Part;
    torso: Part;
    leftArm: Part;
    rightArm: Part;
    cape: Transform & CubeUVMapping;
}
export interface Dimension {
    h: number;
    w: number;
    d: number;
}
export interface CubeUVMapping {
    top: number[];
    bottom: number[];
    right: number[];
    front: number[];
    left: number[];
    back: number[];
}
export interface Translation {
    x: number;
    y: number;
    z: number;
}
export interface Transform extends Translation, Dimension {
}
export interface Part extends Transform, CubeUVMapping {
    layer: Dimension & CubeUVMapping & Partial<Translation>;
}
declare const _default: {
    steve: ModelTemplate;
    alex: ModelTemplate;
};
export default _default;
`;
module.exports['@xmcl/model/cjs/player.d.ts'] = `import { Object3D } from "three/src/core/Object3D";
import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial";
import { CanvasTexture } from "three/src/textures/CanvasTexture";
declare type TextureSource = string | HTMLImageElement;
export declare class PlayerObject3D extends Object3D {
    private _slim;
    constructor(skin: MeshBasicMaterial, cape: MeshBasicMaterial, tranparent: MeshBasicMaterial, slim: boolean);
    get slim(): boolean;
    set slim(s: boolean);
}
export declare class PlayerModel {
    static create(): PlayerModel;
    readonly playerObject3d: PlayerObject3D;
    readonly materialPlayer: MeshBasicMaterial;
    readonly materialTransparent: MeshBasicMaterial;
    readonly materialCape: MeshBasicMaterial;
    readonly textureCape: CanvasTexture;
    readonly texturePlayer: CanvasTexture;
    constructor();
    setSkin(skin: TextureSource, isSlim?: boolean): Promise<void>;
    setCape(cape: TextureSource | undefined): Promise<void>;
}
export default PlayerModel;
`;
module.exports['@xmcl/model/index.d.ts'] = `export * from "./block";
export * from "./player";
`;
module.exports['@xmcl/model/player-model.d.ts'] = `export interface ModelTemplate {
    head: Part;
    rightLeg: Part;
    leftLeg: Part;
    torso: Part;
    leftArm: Part;
    rightArm: Part;
    cape: Transform & CubeUVMapping;
}
export interface Dimension {
    h: number;
    w: number;
    d: number;
}
export interface CubeUVMapping {
    top: number[];
    bottom: number[];
    right: number[];
    front: number[];
    left: number[];
    back: number[];
}
export interface Translation {
    x: number;
    y: number;
    z: number;
}
export interface Transform extends Translation, Dimension {
}
export interface Part extends Transform, CubeUVMapping {
    layer: Dimension & CubeUVMapping & Partial<Translation>;
}
declare const _default: {
    steve: ModelTemplate;
    alex: ModelTemplate;
};
export default _default;
`;
module.exports['@xmcl/model/player.d.ts'] = `import { Object3D } from "three/src/core/Object3D";
import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial";
import { CanvasTexture } from "three/src/textures/CanvasTexture";
declare type TextureSource = string | HTMLImageElement;
export declare class PlayerObject3D extends Object3D {
    private _slim;
    constructor(skin: MeshBasicMaterial, cape: MeshBasicMaterial, tranparent: MeshBasicMaterial, slim: boolean);
    get slim(): boolean;
    set slim(s: boolean);
}
export declare class PlayerModel {
    static create(): PlayerModel;
    readonly playerObject3d: PlayerObject3D;
    readonly materialPlayer: MeshBasicMaterial;
    readonly materialTransparent: MeshBasicMaterial;
    readonly materialCape: MeshBasicMaterial;
    readonly textureCape: CanvasTexture;
    readonly texturePlayer: CanvasTexture;
    constructor();
    setSkin(skin: TextureSource, isSlim?: boolean): Promise<void>;
    setCape(cape: TextureSource | undefined): Promise<void>;
}
export default PlayerModel;
`;
module.exports['@xmcl/nbt/cjs/index.d.ts'] = `import ByteBuffer from "bytebuffer";
declare type Constructor<T> = new (...args: any) => T;
export declare const NBTPrototype: unique symbol;
export declare const NBTConstructor: unique symbol;
export declare type TagType = TagTypePrimitive | typeof TagType.List | typeof TagType.Compound;
export declare type TagTypePrimitive = typeof TagType.End | typeof TagType.Byte | typeof TagType.Short | typeof TagType.Int | typeof TagType.Long | typeof TagType.Float | typeof TagType.Double | typeof TagType.ByteArray | typeof TagType.String | typeof TagType.IntArray | typeof TagType.LongArray;
/**
 * Annotate the type of a field
 */
export declare function TagType<T>(type: TagType | Constructor<T> | Schema): (targetClass: any, key: string) => void;
/**
 * Get NBT schema for this object or a class.
 *
 * If the param is a object, any modifications on this prototype will only affact this object.
 *
 * If the param is a class, any modifications on this prototype will affact all object under this class
 *
 * @param object The object or class
 */
export declare function getPrototypeOf(object: object | Function): NBTPrototype;
/**
 * Set and change the NBT prototype of this object or class
 * @param object A object or a class function
 * @param nbtPrototype The nbt prototype
 */
export declare function setPrototypeOf(object: object | Function, nbtPrototype: NBTPrototype): void;
export declare namespace TagType {
    const End: 0;
    const Byte: 1;
    const Short: 2;
    const Int: 3;
    const Long: 4;
    const Float: 5;
    const Double: 6;
    const ByteArray: 7;
    const String: 8;
    const List: 9;
    const Compound: 10;
    const IntArray: 11;
    const LongArray: 12;
    function getName(tagType: TagType): string;
}
export declare type Schema = ListSchema | CompoundSchema | Constructor<any>;
export declare type ListSchema = [TagType | Schema];
export declare type CompoundSchema = {
    [key: string]: TagType | Schema;
};
export interface NBTPrototype extends CompoundSchema {
    [NBTConstructor]: () => any;
}
export interface IO {
    read(buf: ByteBuffer, context: ReadContext): any;
    write(buf: ByteBuffer, value: any, context: WriteContext): void;
}
export interface SerializationOption {
    compressed?: true | "deflate" | "gzip";
    /**
     * IO override for serialization
     */
    io?: {
        [tagType: number]: IO;
    };
    /**
     * Used for serialize function. Assign the filename for it.
     */
    filename?: string;
}
export interface DeserializationOption<T> {
    compressed?: true | "deflate" | "gzip";
    /**
     * IO override for serialization
     */
    io?: {
        [tagType: number]: IO;
    };
    type?: Constructor<T>;
}
/**
 * Serialzie an nbt typed json object into NBT binary
 * @param object The json
 * @param compressed Should we compress it
 */
export declare function serialize(object: object, option?: SerializationOption): Promise<Uint8Array>;
/**
 * Deserialize the nbt binary into json
 * @param fileData The nbt binary
 */
export declare function deserialize<T>(fileData: Uint8Array, option?: DeserializationOption<T>): Promise<T>;
/**
 * Serialzie an nbt typed json object into NBT binary
 * @param object The json
 */
export declare function serializeSync(object: object, option?: SerializationOption): Uint8Array;
/**
 * Deserialize the nbt binary into json
 * @param fileData The nbt binary
 * @param compressed Should we compress it
 */
export declare function deserializeSync<T>(fileData: Uint8Array, option?: DeserializationOption<T>): T;
export declare class ReadContext {
    schema: Schema | undefined;
    tagType: TagType;
    inspect: Schema | undefined;
    constructor(schema: Schema | undefined, tagType: TagType);
    fork(schemaOrTagType: TagType | Schema): ReadContext;
}
export declare class WriteContext {
    readonly schema: Schema | undefined;
    readonly tagType: TagType;
    constructor(schema: Schema | undefined, tagType: TagType);
    fork(schemaOrTagType: TagType | Schema): WriteContext;
}
export {};
`;
module.exports['@xmcl/nbt/cjs/utils.d.ts'] = `/// <reference types="bytebuffer" />
export declare function writeUTF8(out: ByteBuffer, str: string): number;
export declare function readUTF8(buff: ByteBuffer): string;
`;
module.exports['@xmcl/nbt/index.d.ts'] = `import ByteBuffer from "bytebuffer";
declare type Constructor<T> = new (...args: any) => T;
export declare const NBTPrototype: unique symbol;
export declare const NBTConstructor: unique symbol;
export declare type TagType = TagTypePrimitive | typeof TagType.List | typeof TagType.Compound;
export declare type TagTypePrimitive = typeof TagType.End | typeof TagType.Byte | typeof TagType.Short | typeof TagType.Int | typeof TagType.Long | typeof TagType.Float | typeof TagType.Double | typeof TagType.ByteArray | typeof TagType.String | typeof TagType.IntArray | typeof TagType.LongArray;
/**
 * Annotate the type of a field
 */
export declare function TagType<T>(type: TagType | Constructor<T> | Schema): (targetClass: any, key: string) => void;
/**
 * Get NBT schema for this object or a class.
 *
 * If the param is a object, any modifications on this prototype will only affact this object.
 *
 * If the param is a class, any modifications on this prototype will affact all object under this class
 *
 * @param object The object or class
 */
export declare function getPrototypeOf(object: object | Function): NBTPrototype;
/**
 * Set and change the NBT prototype of this object or class
 * @param object A object or a class function
 * @param nbtPrototype The nbt prototype
 */
export declare function setPrototypeOf(object: object | Function, nbtPrototype: NBTPrototype): void;
export declare namespace TagType {
    const End: 0;
    const Byte: 1;
    const Short: 2;
    const Int: 3;
    const Long: 4;
    const Float: 5;
    const Double: 6;
    const ByteArray: 7;
    const String: 8;
    const List: 9;
    const Compound: 10;
    const IntArray: 11;
    const LongArray: 12;
    function getName(tagType: TagType): string;
}
export declare type Schema = ListSchema | CompoundSchema | Constructor<any>;
export declare type ListSchema = [TagType | Schema];
export declare type CompoundSchema = {
    [key: string]: TagType | Schema;
};
export interface NBTPrototype extends CompoundSchema {
    [NBTConstructor]: () => any;
}
export interface IO {
    read(buf: ByteBuffer, context: ReadContext): any;
    write(buf: ByteBuffer, value: any, context: WriteContext): void;
}
export interface SerializationOption {
    compressed?: true | "deflate" | "gzip";
    /**
     * IO override for serialization
     */
    io?: {
        [tagType: number]: IO;
    };
    /**
     * Used for serialize function. Assign the filename for it.
     */
    filename?: string;
}
export interface DeserializationOption<T> {
    compressed?: true | "deflate" | "gzip";
    /**
     * IO override for serialization
     */
    io?: {
        [tagType: number]: IO;
    };
    type?: Constructor<T>;
}
/**
 * Serialzie an nbt typed json object into NBT binary
 * @param object The json
 * @param compressed Should we compress it
 */
export declare function serialize(object: object, option?: SerializationOption): Promise<Uint8Array>;
/**
 * Deserialize the nbt binary into json
 * @param fileData The nbt binary
 */
export declare function deserialize<T>(fileData: Uint8Array, option?: DeserializationOption<T>): Promise<T>;
/**
 * Serialzie an nbt typed json object into NBT binary
 * @param object The json
 */
export declare function serializeSync(object: object, option?: SerializationOption): Uint8Array;
/**
 * Deserialize the nbt binary into json
 * @param fileData The nbt binary
 * @param compressed Should we compress it
 */
export declare function deserializeSync<T>(fileData: Uint8Array, option?: DeserializationOption<T>): T;
export declare class ReadContext {
    schema: Schema | undefined;
    tagType: TagType;
    inspect: Schema | undefined;
    constructor(schema: Schema | undefined, tagType: TagType);
    fork(schemaOrTagType: TagType | Schema): ReadContext;
}
export declare class WriteContext {
    readonly schema: Schema | undefined;
    readonly tagType: TagType;
    constructor(schema: Schema | undefined, tagType: TagType);
    fork(schemaOrTagType: TagType | Schema): WriteContext;
}
export {};
`;
module.exports['@xmcl/nbt/test.d.ts'] = `export {};
`;
module.exports['@xmcl/nbt/utils.d.ts'] = `/// <reference types="bytebuffer" />
export declare function writeUTF8(out: ByteBuffer, str: string): number;
export declare function readUTF8(buff: ByteBuffer): string;
`;
module.exports['@xmcl/nbt/zlib/cjs/index.browser.d.ts'] = `export declare function gzip(buffer: Uint8Array): Promise<Uint8Array>;
export declare function gzipSync(buffer: Uint8Array): Uint8Array;
export declare function ungzip(buffer: Uint8Array): Promise<Uint8Array>;
export declare function gunzipSync(buffer: Uint8Array): Uint8Array;
export declare function inflate(buffer: Uint8Array): Promise<Uint8Array>;
export declare function deflate(buffer: Uint8Array): Promise<Uint8Array>;
export declare function inflateSync(buffer: Uint8Array): Uint8Array;
export declare function deflateSync(buffer: Uint8Array): Uint8Array;
`;
module.exports['@xmcl/nbt/zlib/cjs/index.d.ts'] = `import { deflateSync, gunzipSync, gzipSync, inflateSync } from "zlib";
export declare const gzip: (buf: Uint8Array) => Promise<Uint8Array>;
export declare const ungzip: (buf: Uint8Array) => Promise<Uint8Array>;
export declare const inflate: (buf: Uint8Array) => Promise<Uint8Array>;
export declare const deflate: (buf: Uint8Array) => Promise<Uint8Array>;
export { gzipSync, gunzipSync, inflateSync, deflateSync };
`;
module.exports['@xmcl/nbt/zlib/index.browser.d.ts'] = `export declare function gzip(buffer: Uint8Array): Promise<Uint8Array>;
export declare function gzipSync(buffer: Uint8Array): Uint8Array;
export declare function ungzip(buffer: Uint8Array): Promise<Uint8Array>;
export declare function gunzipSync(buffer: Uint8Array): Uint8Array;
export declare function inflate(buffer: Uint8Array): Promise<Uint8Array>;
export declare function deflate(buffer: Uint8Array): Promise<Uint8Array>;
export declare function inflateSync(buffer: Uint8Array): Uint8Array;
export declare function deflateSync(buffer: Uint8Array): Uint8Array;
`;
module.exports['@xmcl/nbt/zlib/index.d.ts'] = `import { deflateSync, gunzipSync, gzipSync, inflateSync } from "zlib";
export declare const gzip: (buf: Uint8Array) => Promise<Uint8Array>;
export declare const ungzip: (buf: Uint8Array) => Promise<Uint8Array>;
export declare const inflate: (buf: Uint8Array) => Promise<Uint8Array>;
export declare const deflate: (buf: Uint8Array) => Promise<Uint8Array>;
export { gzipSync, gunzipSync, inflateSync, deflateSync };
`;
module.exports['@xmcl/resource-manager/cjs/index.d.ts'] = `import { PackMeta, ResourcePack, Resource, ResourceLocation } from "@xmcl/resourcepack";
interface ResourceSourceWrapper {
    source: ResourcePack;
    info: PackMeta.Pack;
    domains: string[];
}
/**
 * The resource manager. Design to be able to use in both nodejs and browser environment.
 * @template T The type of the resource content. If you use this in node, it's probably \`Buffer\`. If you are in browser, it might be \`string\`. Just align this with your \`ResourceSource\`
 */
export declare class ResourceManager {
    private list;
    get allResourcePacks(): PackMeta.Pack[];
    private cache;
    constructor(list?: Array<ResourceSourceWrapper>);
    /**
     * Add a new resource source to the end of the resource list.
     */
    addResourcePack(resourcePack: ResourcePack): Promise<void>;
    /**
     * Clear all cache
     */
    clearCache(): void;
    /**
     * Clear all resource source and cache
     */
    clearAll(): void;
    /**
     * Swap the resource source priority.
     */
    swap(first: number, second: number): void;
    /**
     * Invalidate the resource cache
     */
    invalidate(location: ResourceLocation): void;
    load(location: ResourceLocation): Promise<Resource | undefined>;
    load(location: ResourceLocation, urlOnly: false): Promise<Resource | undefined>;
    load(location: ResourceLocation, urlOnly: true): Promise<Resource | undefined>;
    private putCache;
}
export * from "./model-loader";
`;
module.exports['@xmcl/resource-manager/cjs/model-loader.d.ts'] = `import { BlockModel, Resource } from "@xmcl/resourcepack";
import { ResourceManager } from "./index";
/**
 * The model loader load the resource
 */
export declare class ModelLoader {
    readonly manager: ResourceManager;
    static findRealTexturePath(model: BlockModel.Resolved, variantKey: string): string | undefined;
    /**
     * All required texture raw resources
     */
    readonly textures: Record<string, Resource>;
    /**
     * All the resolved model
     */
    readonly models: Record<string, BlockModel.Resolved>;
    /**
     * @param manager The resource manager
     */
    constructor(manager: ResourceManager);
    /**
     * Load a model by search its parent. It will throw an error if the model is not found.
     */
    loadModel(modelPath: string): Promise<BlockModel.Resolved>;
}
`;
module.exports['@xmcl/resource-manager/index.d.ts'] = `import { PackMeta, ResourcePack, Resource, ResourceLocation } from "@xmcl/resourcepack";
interface ResourceSourceWrapper {
    source: ResourcePack;
    info: PackMeta.Pack;
    domains: string[];
}
/**
 * The resource manager. Design to be able to use in both nodejs and browser environment.
 * @template T The type of the resource content. If you use this in node, it's probably \`Buffer\`. If you are in browser, it might be \`string\`. Just align this with your \`ResourceSource\`
 */
export declare class ResourceManager {
    private list;
    get allResourcePacks(): PackMeta.Pack[];
    private cache;
    constructor(list?: Array<ResourceSourceWrapper>);
    /**
     * Add a new resource source to the end of the resource list.
     */
    addResourcePack(resourcePack: ResourcePack): Promise<void>;
    /**
     * Clear all cache
     */
    clearCache(): void;
    /**
     * Clear all resource source and cache
     */
    clearAll(): void;
    /**
     * Swap the resource source priority.
     */
    swap(first: number, second: number): void;
    /**
     * Invalidate the resource cache
     */
    invalidate(location: ResourceLocation): void;
    load(location: ResourceLocation): Promise<Resource | undefined>;
    load(location: ResourceLocation, urlOnly: false): Promise<Resource | undefined>;
    load(location: ResourceLocation, urlOnly: true): Promise<Resource | undefined>;
    private putCache;
}
export * from "./model-loader";
`;
module.exports['@xmcl/resource-manager/model-loader.d.ts'] = `import { BlockModel, Resource } from "@xmcl/resourcepack";
import { ResourceManager } from "./index";
/**
 * The model loader load the resource
 */
export declare class ModelLoader {
    readonly manager: ResourceManager;
    static findRealTexturePath(model: BlockModel.Resolved, variantKey: string): string | undefined;
    /**
     * All required texture raw resources
     */
    readonly textures: Record<string, Resource>;
    /**
     * All the resolved model
     */
    readonly models: Record<string, BlockModel.Resolved>;
    /**
     * @param manager The resource manager
     */
    constructor(manager: ResourceManager);
    /**
     * Load a model by search its parent. It will throw an error if the model is not found.
     */
    loadModel(modelPath: string): Promise<BlockModel.Resolved>;
}
`;
module.exports['@xmcl/resource-manager/test.d.ts'] = `export {};
`;
module.exports['@xmcl/resourcepack/cjs/format.d.ts'] = `/**
 * The pack meta json format
 */
export interface PackMeta {
    texture?: PackMeta.Texture;
    animation?: PackMeta.Animation;
    pack?: PackMeta.Pack;
    language: PackMeta.Language;
}
/**
 * The block model json format
 */
export interface BlockModel {
    /**
     * For Block:
     *
     * Loads a different model from the given path, starting in assets/minecraft/models. If both "parent" and "elements" are set, the "elements" tag overrides the "elements" tag from the previous model.
     * Can be set to "builtin/generated" to use a model that is created out of the specified icon. Note that only the first layer is supported, and rotation can only be achieved using block states files.
     *
     * For Item:
     *
     * Loads a different model from the given path, starting in assets/minecraft/models. If both "parent" and "elements" are set, the "elements" tag overrides the "elements" tag from the previous model.
     * Can be set to "builtin/generated" to use a model that is created out of the specified icon.
     * Can be set to "builtin/entity" to load a model from an entity file. As you can not specify the entity, this does not work for all items (only for chests, ender chests, mob heads, shields and banners).
     * Needs to be set to "builtin/compass" or "builtin/clock" for the compass and the clock.
     */
    parent?: string;
    ambientocclusion?: boolean;
    /**
     * Holds the different places where item models are displayed.
     */
    display?: BlockModel.Display;
    /**
     * Holds the textures of the model. Each texture starts in assets/minecraft/textures or can be another texture variable.
     */
    textures?: {
        /**
         * What texture to load particles from. This texture is used if you are in a nether portal. Note: All breaking particles from non-model blocks are hard-coded.
         */
        particle?: string;
        [variant: string]: string | undefined;
    };
    /**
     * Contains all the elements of the model. they can only have cubic forms. If both "parent" and "elements" are set, the "elements" tag overrides the "elements" tag from the previous model.
     */
    elements?: BlockModel.Element[];
    /**
     * Determines cases which a different model should be used based on item tags.
     * All cases are evaluated in order from top to bottom and last predicate that mathches will override.
     * However, overrides are ignored if it has been already overriden once, for example this avoids recursion on overriding to the same model.
     */
    overrides?: Array<{
        /**
         * predicate: Holds the cases.
         */
        prediction: {
            [attribute: string]: number;
        };
        /**
         * The path to the model to use if the case is met, starting in assets/minecraft/models/
         */
        model: string;
    }>;
}
export declare namespace PackMeta {
    interface Language {
        /**
         * Language code for a language, corresponding to a .json file with the same name in the folder assets/<namespace>/lang.
         */
        [lang: string]: {
            /**
             * The full name of the language
             */
            name: string;
            /**
             * The country or region name
             */
            region: string;
            /**
             * If true, the language reads right to left.
             */
            bidirectional: boolean;
        };
    }
    /**
     * Holds the resource pack information
     */
    interface Pack {
        /**
         * Pack version. If this number does not match the current required number, the resource pack will display an error and required additional confirmation to load the pack.
         * Requires 1 for 1.6.1–1.8.9, 2 for 1.9–1.10.2, 3 for 1.11–1.12.2, and 4 for 1.13–1.14.4.
         */
        pack_format: number;
        /**
         * Text that will be shown below the pack name in the resource pack menu.
         * The text will be shown on two lines. If the text is too long it will be cut off.
         *
         * Contains a raw JSON text object that will be shown instead as the pack description in the resource pack menu.
         * Same behavior as the string version of the description tag, but they cannot exist together.[
         */
        description: string | object;
    }
    interface Animation {
        /**
         * If true, Minecraft will generate additional frames between frames with a frame time greater than 1 between them. Defaults to false.
         */
        interpolate: boolean;
        /**
         * The width of the tile, as a direct ratio rather than in pixels. This is unused in vanilla but can be used by mods to have frames that are not perfect squares.
         */
        width: number;
        /**
         * The height of the tile in direct pixels, as a ratio rather than in pixels. This is unused in vanilla but can be used by mods to have frames that are not perfect squares.
         */
        height: number;
        /**
         * Sets the default time for each frame in increments of one game tick. Defaults to \`1\`.
         */
        frametime: number;
        frames: Array<{
            index: number;
            time: number;
        }>;
    }
    interface Texture {
        /**
         * Causes the texture to blur when viewed from close up. Defaults to \`false\`
         */
        blur: boolean;
        /**
         * Causes the texture to stretch instead of tiling in cases where it otherwise would, such as on the shadow. Defaults to \`false\`
         */
        clamp: boolean;
        /**
         * Custom mipmap values for the texture
         */
        mipmaps: string[];
    }
}
declare type Vec3 = [number, number, number];
declare type Vec4 = [number, number, number, number];
export declare namespace BlockModel {
    type Direction = "up" | "down" | "north" | "south" | "west" | "east";
    interface Display {
        thirdperson_righthand: Transform;
        thirdperson_lefthand: Transform;
        firstperson_righthand: Transform;
        firstperson_lefthand: Transform;
        gui: Transform;
        head: Transform;
        ground: Transform;
        fixed: Transform;
    }
    interface Element {
        /**
         * Start point of a cube according to the scheme [x, y, z]. Values must be between -16 and 32.
         */
        from: Vec3;
        /**
         * Stop point of a cube according to the scheme [x, y, z]. Values must be between -16 and 32.
         */
        to: Vec3;
        /**
         * Defines the rotation of an element.
         */
        rotation?: {
            /**
             * Sets the center of the rotation according to the scheme [x, y, z], defaults to [8, 8, 8].
             */
            origin: Vec3;
            /**
             * Specifies the direction of rotation, can be "x", "y" or "z".
             */
            axis: "x" | "y" | "z";
            /**
             * Specifies the angle of rotation. Can be 45 through -45 degrees in 22.5 degree increments. Defaults to 0.
             */
            angle: number;
            /**
             * Specifies whether or not to scale the faces across the whole block. Can be true or false. Defaults to false.
             */
            rescale: boolean;
        };
        /**
         * Defines if shadows are rendered (true - default), not (false).
         */
        shade?: boolean;
        faces?: {
            up?: Face;
            down?: Face;
            north?: Face;
            south?: Face;
            east?: Face;
            west?: Face;
        };
    }
    interface Face {
        /**
         * Defines the area of the texture to use according to the scheme [x1, y1, x2, y2].
         * If unset, it defaults to values equal to xyz position of the element.
         * The texture behavior will be inconsistent if UV extends below 0 or above 16.
         * If the numbers of x1 and x2 are swapped (e.g. from 0, 0, 16, 16 to 16, 0, 0, 16), the texture will be flipped. UV is optional, and if not supplied it will automatically generate based on the element's position.
         */
        uv?: Vec4;
        /**
         * Specifies the texture in form of the texture variable prepended with a #.
         */
        texture: string;
        /**
         * Specifies whether a face does not need to be rendered when there is a block touching it in the specified position.
         * The position can be: down, up, north, south, west, or east. It will also determine which side of the block to use the light level from for lighting the face,
         * and if unset, defaults to the side.
         */
        cullface?: Direction;
        /**
         * Rotates the texture by the specified number of degrees.
         * Can be 0, 90, 180, or 270. Defaults to 0. Rotation does not affect which part of the texture is used.
         * Instead, it amounts to permutation of the selected texture vertexes (selected implicitly, or explicitly though uv).
         */
        rotation?: 0 | 90 | 180 | 270;
        /**
         * Determines whether to tint the texture using a hardcoded tint index. The default is not using the tint, and any number causes it to use tint. Note that only certain blocks have a tint index, all others will be unaffected.
         */
        tintindex?: number;
    }
    interface Transform {
        /**
         * Specifies the rotation of the model according to the scheme [x, y, z].
         */
        rotation: Vec3;
        /**
         *  Specifies the position of the model according to the scheme [x, y, z]. If the value is greater than 80, it is displayed as 80. If the value is less then -80, it is displayed as -80.
         */
        translation: Vec3;
        /**
         * Specifies the scale of the model according to the scheme [x, y, z]. If the value is greater than 4, it is displayed as 4.
         */
        scale: Vec3;
    }
    type Resolved = Omit<Required<BlockModel>, "parent" | "override" | "elements"> & {
        overrides?: BlockModel["overrides"];
        elements: Array<Omit<Element, "faces"> & {
            faces: {
                up?: Face;
                down?: Face;
                north?: Face;
                south?: Face;
                east?: Face;
                west?: Face;
            };
        }>;
    };
}
export {};
`;
module.exports['@xmcl/resourcepack/cjs/index.d.ts'] = `import { FileSystem } from "@xmcl/system";
import { PackMeta } from "./format";
export declare class ResourceLocation {
    readonly domain: string;
    readonly path: string;
    /**
     * build from texture path
     */
    static ofTexturePath(path: string): ResourceLocation;
    /**
     * build from model path
     */
    static ofModelPath(path: string): ResourceLocation;
    /**
     * from absoluted path
     */
    static fromPath(path: string): ResourceLocation;
    static getAssetsPath(location: ResourceLocation): string;
    constructor(domain: string, path: string);
    toString(): string;
}
export interface Resource<T = Uint8Array> {
    /**
     * the absolute location of the resource
     */
    location: ResourceLocation;
    /**
     * The real resource url;
     */
    url: string;
    /**
     * The resource content
     */
    content: T;
    /**
     * The metadata of the resource
     */
    metadata: PackMeta;
}
export declare class ResourcePack {
    private fs;
    constructor(fs: FileSystem);
    /**
     * Load the resource
     * @param location The resource location
     * @param urlOnly Should only provide the url, no content
     */
    load(location: ResourceLocation, urlOnly: boolean): Promise<Resource | void>;
    /**
     * Does the resource source has the resource
     */
    has(location: ResourceLocation): Promise<boolean>;
    /**
     * The owned domain. You can think about the modids.
     */
    domains(): Promise<string[]>;
    /**
     * The pack info, just like resource pack
     */
    info(): Promise<PackMeta.Pack>;
    /**
     * The icon of the resource pack
     */
    icon(): Promise<Uint8Array>;
    private getPath;
    static open(resourcePack: string | Uint8Array | FileSystem): Promise<ResourcePack>;
}
export * from "./format";
/**
 * Read the resource pack metadata from zip file or directory.
 *
 * If you have already read the data of the zip file, you can pass it as the second parameter. The second parameter will be ignored on reading directory.
 *
 * @param resourcePack The absolute path of the resource pack file, or a buffer, or a opened resource pack.
 */
export declare function readPackMeta(resourcePack: string | Uint8Array | FileSystem): Promise<PackMeta.Pack>;
/**
 * Read the resource pack icon png binary.
 * @param resourcePack The absolute path of the resource pack file, or a buffer, or a opened resource pack.
 */
export declare function readIcon(resourcePack: string | Uint8Array | FileSystem): Promise<Uint8Array>;
/**
 * Read both metadata and icon
 */
export declare function readPackMetaAndIcon(resourcePack: string | Uint8Array | FileSystem): Promise<{
    metadata: PackMeta.Pack;
    icon: Uint8Array | undefined;
}>;
`;
module.exports['@xmcl/resourcepack/format.d.ts'] = `/**
 * The pack meta json format
 */
export interface PackMeta {
    texture?: PackMeta.Texture;
    animation?: PackMeta.Animation;
    pack?: PackMeta.Pack;
    language: PackMeta.Language;
}
/**
 * The block model json format
 */
export interface BlockModel {
    /**
     * For Block:
     *
     * Loads a different model from the given path, starting in assets/minecraft/models. If both "parent" and "elements" are set, the "elements" tag overrides the "elements" tag from the previous model.
     * Can be set to "builtin/generated" to use a model that is created out of the specified icon. Note that only the first layer is supported, and rotation can only be achieved using block states files.
     *
     * For Item:
     *
     * Loads a different model from the given path, starting in assets/minecraft/models. If both "parent" and "elements" are set, the "elements" tag overrides the "elements" tag from the previous model.
     * Can be set to "builtin/generated" to use a model that is created out of the specified icon.
     * Can be set to "builtin/entity" to load a model from an entity file. As you can not specify the entity, this does not work for all items (only for chests, ender chests, mob heads, shields and banners).
     * Needs to be set to "builtin/compass" or "builtin/clock" for the compass and the clock.
     */
    parent?: string;
    ambientocclusion?: boolean;
    /**
     * Holds the different places where item models are displayed.
     */
    display?: BlockModel.Display;
    /**
     * Holds the textures of the model. Each texture starts in assets/minecraft/textures or can be another texture variable.
     */
    textures?: {
        /**
         * What texture to load particles from. This texture is used if you are in a nether portal. Note: All breaking particles from non-model blocks are hard-coded.
         */
        particle?: string;
        [variant: string]: string | undefined;
    };
    /**
     * Contains all the elements of the model. they can only have cubic forms. If both "parent" and "elements" are set, the "elements" tag overrides the "elements" tag from the previous model.
     */
    elements?: BlockModel.Element[];
    /**
     * Determines cases which a different model should be used based on item tags.
     * All cases are evaluated in order from top to bottom and last predicate that mathches will override.
     * However, overrides are ignored if it has been already overriden once, for example this avoids recursion on overriding to the same model.
     */
    overrides?: Array<{
        /**
         * predicate: Holds the cases.
         */
        prediction: {
            [attribute: string]: number;
        };
        /**
         * The path to the model to use if the case is met, starting in assets/minecraft/models/
         */
        model: string;
    }>;
}
export declare namespace PackMeta {
    interface Language {
        /**
         * Language code for a language, corresponding to a .json file with the same name in the folder assets/<namespace>/lang.
         */
        [lang: string]: {
            /**
             * The full name of the language
             */
            name: string;
            /**
             * The country or region name
             */
            region: string;
            /**
             * If true, the language reads right to left.
             */
            bidirectional: boolean;
        };
    }
    /**
     * Holds the resource pack information
     */
    interface Pack {
        /**
         * Pack version. If this number does not match the current required number, the resource pack will display an error and required additional confirmation to load the pack.
         * Requires 1 for 1.6.1–1.8.9, 2 for 1.9–1.10.2, 3 for 1.11–1.12.2, and 4 for 1.13–1.14.4.
         */
        pack_format: number;
        /**
         * Text that will be shown below the pack name in the resource pack menu.
         * The text will be shown on two lines. If the text is too long it will be cut off.
         *
         * Contains a raw JSON text object that will be shown instead as the pack description in the resource pack menu.
         * Same behavior as the string version of the description tag, but they cannot exist together.[
         */
        description: string | object;
    }
    interface Animation {
        /**
         * If true, Minecraft will generate additional frames between frames with a frame time greater than 1 between them. Defaults to false.
         */
        interpolate: boolean;
        /**
         * The width of the tile, as a direct ratio rather than in pixels. This is unused in vanilla but can be used by mods to have frames that are not perfect squares.
         */
        width: number;
        /**
         * The height of the tile in direct pixels, as a ratio rather than in pixels. This is unused in vanilla but can be used by mods to have frames that are not perfect squares.
         */
        height: number;
        /**
         * Sets the default time for each frame in increments of one game tick. Defaults to \`1\`.
         */
        frametime: number;
        frames: Array<{
            index: number;
            time: number;
        }>;
    }
    interface Texture {
        /**
         * Causes the texture to blur when viewed from close up. Defaults to \`false\`
         */
        blur: boolean;
        /**
         * Causes the texture to stretch instead of tiling in cases where it otherwise would, such as on the shadow. Defaults to \`false\`
         */
        clamp: boolean;
        /**
         * Custom mipmap values for the texture
         */
        mipmaps: string[];
    }
}
declare type Vec3 = [number, number, number];
declare type Vec4 = [number, number, number, number];
export declare namespace BlockModel {
    type Direction = "up" | "down" | "north" | "south" | "west" | "east";
    interface Display {
        thirdperson_righthand: Transform;
        thirdperson_lefthand: Transform;
        firstperson_righthand: Transform;
        firstperson_lefthand: Transform;
        gui: Transform;
        head: Transform;
        ground: Transform;
        fixed: Transform;
    }
    interface Element {
        /**
         * Start point of a cube according to the scheme [x, y, z]. Values must be between -16 and 32.
         */
        from: Vec3;
        /**
         * Stop point of a cube according to the scheme [x, y, z]. Values must be between -16 and 32.
         */
        to: Vec3;
        /**
         * Defines the rotation of an element.
         */
        rotation?: {
            /**
             * Sets the center of the rotation according to the scheme [x, y, z], defaults to [8, 8, 8].
             */
            origin: Vec3;
            /**
             * Specifies the direction of rotation, can be "x", "y" or "z".
             */
            axis: "x" | "y" | "z";
            /**
             * Specifies the angle of rotation. Can be 45 through -45 degrees in 22.5 degree increments. Defaults to 0.
             */
            angle: number;
            /**
             * Specifies whether or not to scale the faces across the whole block. Can be true or false. Defaults to false.
             */
            rescale: boolean;
        };
        /**
         * Defines if shadows are rendered (true - default), not (false).
         */
        shade?: boolean;
        faces?: {
            up?: Face;
            down?: Face;
            north?: Face;
            south?: Face;
            east?: Face;
            west?: Face;
        };
    }
    interface Face {
        /**
         * Defines the area of the texture to use according to the scheme [x1, y1, x2, y2].
         * If unset, it defaults to values equal to xyz position of the element.
         * The texture behavior will be inconsistent if UV extends below 0 or above 16.
         * If the numbers of x1 and x2 are swapped (e.g. from 0, 0, 16, 16 to 16, 0, 0, 16), the texture will be flipped. UV is optional, and if not supplied it will automatically generate based on the element's position.
         */
        uv?: Vec4;
        /**
         * Specifies the texture in form of the texture variable prepended with a #.
         */
        texture: string;
        /**
         * Specifies whether a face does not need to be rendered when there is a block touching it in the specified position.
         * The position can be: down, up, north, south, west, or east. It will also determine which side of the block to use the light level from for lighting the face,
         * and if unset, defaults to the side.
         */
        cullface?: Direction;
        /**
         * Rotates the texture by the specified number of degrees.
         * Can be 0, 90, 180, or 270. Defaults to 0. Rotation does not affect which part of the texture is used.
         * Instead, it amounts to permutation of the selected texture vertexes (selected implicitly, or explicitly though uv).
         */
        rotation?: 0 | 90 | 180 | 270;
        /**
         * Determines whether to tint the texture using a hardcoded tint index. The default is not using the tint, and any number causes it to use tint. Note that only certain blocks have a tint index, all others will be unaffected.
         */
        tintindex?: number;
    }
    interface Transform {
        /**
         * Specifies the rotation of the model according to the scheme [x, y, z].
         */
        rotation: Vec3;
        /**
         *  Specifies the position of the model according to the scheme [x, y, z]. If the value is greater than 80, it is displayed as 80. If the value is less then -80, it is displayed as -80.
         */
        translation: Vec3;
        /**
         * Specifies the scale of the model according to the scheme [x, y, z]. If the value is greater than 4, it is displayed as 4.
         */
        scale: Vec3;
    }
    type Resolved = Omit<Required<BlockModel>, "parent" | "override" | "elements"> & {
        overrides?: BlockModel["overrides"];
        elements: Array<Omit<Element, "faces"> & {
            faces: {
                up?: Face;
                down?: Face;
                north?: Face;
                south?: Face;
                east?: Face;
                west?: Face;
            };
        }>;
    };
}
export {};
`;
module.exports['@xmcl/resourcepack/index.d.ts'] = `import { FileSystem } from "@xmcl/system";
import { PackMeta } from "./format";
export declare class ResourceLocation {
    readonly domain: string;
    readonly path: string;
    /**
     * build from texture path
     */
    static ofTexturePath(path: string): ResourceLocation;
    /**
     * build from model path
     */
    static ofModelPath(path: string): ResourceLocation;
    /**
     * from absoluted path
     */
    static fromPath(path: string): ResourceLocation;
    static getAssetsPath(location: ResourceLocation): string;
    constructor(domain: string, path: string);
    toString(): string;
}
export interface Resource<T = Uint8Array> {
    /**
     * the absolute location of the resource
     */
    location: ResourceLocation;
    /**
     * The real resource url;
     */
    url: string;
    /**
     * The resource content
     */
    content: T;
    /**
     * The metadata of the resource
     */
    metadata: PackMeta;
}
export declare class ResourcePack {
    private fs;
    constructor(fs: FileSystem);
    /**
     * Load the resource
     * @param location The resource location
     * @param urlOnly Should only provide the url, no content
     */
    load(location: ResourceLocation, urlOnly: boolean): Promise<Resource | void>;
    /**
     * Does the resource source has the resource
     */
    has(location: ResourceLocation): Promise<boolean>;
    /**
     * The owned domain. You can think about the modids.
     */
    domains(): Promise<string[]>;
    /**
     * The pack info, just like resource pack
     */
    info(): Promise<PackMeta.Pack>;
    /**
     * The icon of the resource pack
     */
    icon(): Promise<Uint8Array>;
    private getPath;
    static open(resourcePack: string | Uint8Array | FileSystem): Promise<ResourcePack>;
}
export * from "./format";
/**
 * Read the resource pack metadata from zip file or directory.
 *
 * If you have already read the data of the zip file, you can pass it as the second parameter. The second parameter will be ignored on reading directory.
 *
 * @param resourcePack The absolute path of the resource pack file, or a buffer, or a opened resource pack.
 */
export declare function readPackMeta(resourcePack: string | Uint8Array | FileSystem): Promise<PackMeta.Pack>;
/**
 * Read the resource pack icon png binary.
 * @param resourcePack The absolute path of the resource pack file, or a buffer, or a opened resource pack.
 */
export declare function readIcon(resourcePack: string | Uint8Array | FileSystem): Promise<Uint8Array>;
/**
 * Read both metadata and icon
 */
export declare function readPackMetaAndIcon(resourcePack: string | Uint8Array | FileSystem): Promise<{
    metadata: PackMeta.Pack;
    icon: Uint8Array | undefined;
}>;
`;
module.exports['@xmcl/resourcepack/test.d.ts'] = `export {};
`;
module.exports['@xmcl/server-info/cjs/index.d.ts'] = `export declare class ServerInfo {
    icon: string;
    ip: string;
    name: string;
    acceptTextures: number;
}
/**
 * The servers.dat format server information, contains known host displayed in "Multipler" page.
 */
export declare class ServersData {
    servers: ServerInfo[];
}
/**
 * Read the server information from the binary data of .minecraft/server.dat file, which stores the local known server host information.
 *
 * @param buff The binary data of .minecraft/server.dat
 */
export declare function readInfo(buff: Uint8Array): Promise<ServerInfo[]>;
/**
 * Write the information to NBT format used by .minecraft/server.dat file.
 *
 * @param infos The array of server information.
 */
export declare function writeInfo(infos: ServerInfo[]): Promise<Uint8Array>;
/**
 * Read the server information from the binary data of .minecraft/server.dat file, which stores the local known server host information.
 *
 * @param buff The binary data of .minecraft/server.dat
 */
export declare function readInfoSync(buff: Uint8Array): ServerInfo[];
/**
 * Write the information to NBT format used by .minecraft/server.dat file.
 *
 * @param infos The array of server information.
 */
export declare function writeInfoSync(infos: ServerInfo[]): Uint8Array;
`;
module.exports['@xmcl/server-info/index.d.ts'] = `export declare class ServerInfo {
    icon: string;
    ip: string;
    name: string;
    acceptTextures: number;
}
/**
 * The servers.dat format server information, contains known host displayed in "Multipler" page.
 */
export declare class ServersData {
    servers: ServerInfo[];
}
/**
 * Read the server information from the binary data of .minecraft/server.dat file, which stores the local known server host information.
 *
 * @param buff The binary data of .minecraft/server.dat
 */
export declare function readInfo(buff: Uint8Array): Promise<ServerInfo[]>;
/**
 * Write the information to NBT format used by .minecraft/server.dat file.
 *
 * @param infos The array of server information.
 */
export declare function writeInfo(infos: ServerInfo[]): Promise<Uint8Array>;
/**
 * Read the server information from the binary data of .minecraft/server.dat file, which stores the local known server host information.
 *
 * @param buff The binary data of .minecraft/server.dat
 */
export declare function readInfoSync(buff: Uint8Array): ServerInfo[];
/**
 * Write the information to NBT format used by .minecraft/server.dat file.
 *
 * @param infos The array of server information.
 */
export declare function writeInfoSync(infos: ServerInfo[]): Uint8Array;
`;
module.exports['@xmcl/server-info/test.d.ts'] = `export {};
`;
module.exports['@xmcl/system/cjs/index.browser.d.ts'] = `export * from "./system";
`;
module.exports['@xmcl/system/cjs/index.d.ts'] = `export * from "./system";
`;
module.exports['@xmcl/system/cjs/system.d.ts'] = `export interface System {
    fs: FileSystem;
    openFileSystem(basePath: string | Uint8Array): Promise<FileSystem>;
    resolveFileSystem(base: string | Uint8Array | FileSystem): Promise<FileSystem>;
    decodeBase64(input: string): string;
    encodeBase64(input: string): string;
    bufferToText(buff: Uint8Array): string;
    bufferToBase64(buff: Uint8Array): string;
}
export declare abstract class FileSystem {
    abstract readonly root: string;
    abstract readonly sep: string;
    abstract readonly type: "zip" | "path";
    abstract readonly writeable: boolean;
    abstract join(...paths: string[]): string;
    abstract isDirectory(name: string): Promise<boolean>;
    abstract existsFile(name: string): Promise<boolean>;
    abstract readFile(name: string, encoding: "utf-8" | "base64"): Promise<string>;
    abstract readFile(name: string): Promise<Uint8Array>;
    abstract readFile(name: string, encoding?: "utf-8" | "base64"): Promise<Uint8Array | string>;
    abstract listFiles(name: string): Promise<string[]>;
    missingFile(name: string): Promise<boolean>;
    walkFiles(target: string, walker: (path: string) => void | Promise<void>): Promise<void>;
}
export declare let System: System;
export declare function setSystem(sys: System): void;
`;
module.exports['@xmcl/system/cjs/test.d.ts'] = `export {};
`;
module.exports['@xmcl/system/index.browser.d.ts'] = `export * from "./system";
`;
module.exports['@xmcl/system/index.d.ts'] = `export * from "./system";
`;
module.exports['@xmcl/system/system.d.ts'] = `export interface System {
    fs: FileSystem;
    openFileSystem(basePath: string | Uint8Array): Promise<FileSystem>;
    resolveFileSystem(base: string | Uint8Array | FileSystem): Promise<FileSystem>;
    decodeBase64(input: string): string;
    encodeBase64(input: string): string;
    bufferToText(buff: Uint8Array): string;
    bufferToBase64(buff: Uint8Array): string;
}
export declare abstract class FileSystem {
    abstract readonly root: string;
    abstract readonly sep: string;
    abstract readonly type: "zip" | "path";
    abstract readonly writeable: boolean;
    abstract join(...paths: string[]): string;
    abstract isDirectory(name: string): Promise<boolean>;
    abstract existsFile(name: string): Promise<boolean>;
    abstract readFile(name: string, encoding: "utf-8" | "base64"): Promise<string>;
    abstract readFile(name: string): Promise<Uint8Array>;
    abstract readFile(name: string, encoding?: "utf-8" | "base64"): Promise<Uint8Array | string>;
    abstract listFiles(name: string): Promise<string[]>;
    missingFile(name: string): Promise<boolean>;
    walkFiles(target: string, walker: (path: string) => void | Promise<void>): Promise<void>;
}
export declare let System: System;
export declare function setSystem(sys: System): void;
`;
module.exports['@xmcl/system/test.d.ts'] = `export {};
`;
module.exports['@xmcl/task/cjs/index.d.ts'] = `/// <reference types="node" />
import { EventEmitter } from "events";
export declare type TaskNode = Task.State;
export interface TaskListener<N extends Task.State = Task.State> extends EventEmitter {
    /**
     * Emitted when the some task starts to execute. The listener will get both this task state and parent task state.
     *
     * If there is no parent, it will be undefined.
     */
    on(event: "execute", listener: (node: N, parent?: N) => void): this;
    /**
     * Emitted when the some task failed.
     */
    on(event: "fail", listener: (error: any, node: N) => void): this;
    /**
     * Emitted when the task has update.
     *
     * The progress and total are arbitary number which designed by task creator.
     * You might want to convert them to percentage by yourself by directly dividing them.
     *
     * The message is a totally optional and arbitary string for hint.
     */
    on(event: "update", listener: (update: {
        progress: number;
        total?: number;
        message?: string;
    }, node: N) => void): this;
    /**
     * Emitted the when some task is finished
     */
    on(event: "finish", listener: (result: any, node: N) => void): this;
    /**
     * Emitted the pause event after user toggle the \`pause\` in handle
     */
    on(event: "pause", listener: (node: N) => void): this;
    /**
     * Emitted the resume event after use toggle the \`resume\` in handle
     */
    on(event: "resume", listener: (node: N) => void): this;
    /**
     * Emitted the cancel event after some task is cancelled.
     */
    on(event: "cancel", listener: (node: N) => void): this;
    once(event: "execute", listener: (node: N, parent?: N) => void): this;
    once(event: "fail", listener: (error: any, node: N) => void): this;
    once(event: "update", listener: (update: {
        progress: number;
        total?: number;
        message?: string;
    }, node: N) => void): this;
    once(event: "finish", listener: (result: any, node: N) => void): this;
    once(event: "pause", listener: (node: N) => void): this;
    once(event: "resume", listener: (node: N) => void): this;
    once(event: "cancel", listener: (node: N) => void): this;
}
/**
 * An intergrated environment to run the task. If you want to manage all your tasks together, you should use this.
 */
export declare class TaskRuntime<N extends Task.State = Task.State> extends EventEmitter implements TaskListener<N> {
    readonly factory: Task.StateFactory<N>;
    protected bridge: TaskBridge<N>;
    constructor(factory: Task.StateFactory<N>, schedular: Task.Schedualer);
    on(event: string, listener: (...args: any[]) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
    submit<T>(task: Task<T>): TaskHandle<T, N>;
}
export declare class TaskSignal {
    _paused: boolean;
    _cancelled: boolean;
    _started: boolean;
    _resumePauseCallback: null | (() => void);
    _onPause: null | (() => void);
    _onResume: null | (() => void);
}
export declare class TaskBridge<X extends Task.State = Task.State> {
    readonly emitter: EventEmitter;
    readonly factory: Task.StateFactory<X>;
    readonly scheduler: <N>(r: () => Promise<N>) => Promise<N>;
    constructor(emitter: EventEmitter, factory: Task.StateFactory<X>, scheduler: <N>(r: () => Promise<N>) => Promise<N>);
    submit<T>(task: Task<T>): TaskHandle<T, X>;
    protected enqueueTask<T>(signal: TaskSignal, task: Task<T>, parent?: X): {
        node: X;
        promise: Promise<T>;
    };
}
export interface TaskHandle<T, N extends Task.State> {
    /**
     * Wait the task to complete
     */
    wait(): Promise<T>;
    /**
     * Cancel the task.
     */
    cancel(): void;
    /**
     * Pause the task if possible.
     */
    pause(): void;
    resume(): void;
    readonly root: N;
    readonly isCancelled: boolean;
    readonly isPaused: boolean;
    readonly isStarted: boolean;
}
export declare class Task<T> {
    readonly name: string;
    readonly parameters: object | undefined;
    readonly run: (context: Task.Context) => (Promise<T> | T);
    constructor(name: string, parameters: object | undefined, run: (context: Task.Context) => (Promise<T> | T));
    /**
     * Execute this task immediately (not in runtime).
     * This will have the same behavior like \`Task.execute\`.
     *
     * @see Task.execute
     */
    execute(): TaskHandle<T, Task.State> & TaskListener<Task.State>;
}
export declare namespace Task {
    interface Function<T> {
        (context: Task.Context): (Promise<T> | T);
    }
    interface Object<T> {
        readonly name: string;
        readonly parameters?: object;
        readonly run: (context: Task.Context) => (Promise<T> | T);
    }
    /**
     * You'll recive this if the task is cancelled.
     */
    class CancelledError extends Error {
        constructor();
    }
    type Schedualer = <N>(r: () => Promise<N>) => Promise<N>;
    interface Context {
        pausealbe(onPause?: () => void, onResume?: () => void): void;
        update(progres: number, total?: number, message?: string): void | boolean;
        execute<T>(task: Task<T>): Promise<T>;
    }
    type StateFactory<X extends Task.State = Task.State> = (node: Task.State, parent?: X) => X;
    const DEFAULT_STATE_FACTORY: StateFactory;
    /**
     * Run the task immediately without a integrated runtime
     * @param task The task will be run
     */
    function execute<T>(task: Task<T>): TaskHandle<T, Task.State> & TaskListener;
    /**
     * Create a central managed runtime for task execution. You can listen the tasks status at one place.
     * @param factory The state factory. It's used to customize your task state.
     * @param schedular The task schedular provided
     */
    function createRuntime<X extends Task.State = Task.State>(factory?: StateFactory<X>, schedular?: Schedualer): TaskRuntime<X>;
    interface State {
        name: string;
        arguments?: {
            [key: string]: any;
        };
        path: string;
    }
    function create<T>(name: string, task: Task.Function<T>, parameters?: any): Task<T>;
}
export declare function newTask<T>(name: string, task: Task.Function<T>, parameters?: any): Task<T>;
export default Task;
`;
module.exports['@xmcl/task/index.d.ts'] = `/// <reference types="node" />
import { EventEmitter } from "events";
export declare type TaskNode = Task.State;
export interface TaskListener<N extends Task.State = Task.State> extends EventEmitter {
    /**
     * Emitted when the some task starts to execute. The listener will get both this task state and parent task state.
     *
     * If there is no parent, it will be undefined.
     */
    on(event: "execute", listener: (node: N, parent?: N) => void): this;
    /**
     * Emitted when the some task failed.
     */
    on(event: "fail", listener: (error: any, node: N) => void): this;
    /**
     * Emitted when the task has update.
     *
     * The progress and total are arbitary number which designed by task creator.
     * You might want to convert them to percentage by yourself by directly dividing them.
     *
     * The message is a totally optional and arbitary string for hint.
     */
    on(event: "update", listener: (update: {
        progress: number;
        total?: number;
        message?: string;
    }, node: N) => void): this;
    /**
     * Emitted the when some task is finished
     */
    on(event: "finish", listener: (result: any, node: N) => void): this;
    /**
     * Emitted the pause event after user toggle the \`pause\` in handle
     */
    on(event: "pause", listener: (node: N) => void): this;
    /**
     * Emitted the resume event after use toggle the \`resume\` in handle
     */
    on(event: "resume", listener: (node: N) => void): this;
    /**
     * Emitted the cancel event after some task is cancelled.
     */
    on(event: "cancel", listener: (node: N) => void): this;
    once(event: "execute", listener: (node: N, parent?: N) => void): this;
    once(event: "fail", listener: (error: any, node: N) => void): this;
    once(event: "update", listener: (update: {
        progress: number;
        total?: number;
        message?: string;
    }, node: N) => void): this;
    once(event: "finish", listener: (result: any, node: N) => void): this;
    once(event: "pause", listener: (node: N) => void): this;
    once(event: "resume", listener: (node: N) => void): this;
    once(event: "cancel", listener: (node: N) => void): this;
}
/**
 * An intergrated environment to run the task. If you want to manage all your tasks together, you should use this.
 */
export declare class TaskRuntime<N extends Task.State = Task.State> extends EventEmitter implements TaskListener<N> {
    readonly factory: Task.StateFactory<N>;
    protected bridge: TaskBridge<N>;
    constructor(factory: Task.StateFactory<N>, schedular: Task.Schedualer);
    on(event: string, listener: (...args: any[]) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
    submit<T>(task: Task<T>): TaskHandle<T, N>;
}
export declare class TaskSignal {
    _paused: boolean;
    _cancelled: boolean;
    _started: boolean;
    _resumePauseCallback: null | (() => void);
    _onPause: null | (() => void);
    _onResume: null | (() => void);
}
export declare class TaskBridge<X extends Task.State = Task.State> {
    readonly emitter: EventEmitter;
    readonly factory: Task.StateFactory<X>;
    readonly scheduler: <N>(r: () => Promise<N>) => Promise<N>;
    constructor(emitter: EventEmitter, factory: Task.StateFactory<X>, scheduler: <N>(r: () => Promise<N>) => Promise<N>);
    submit<T>(task: Task<T>): TaskHandle<T, X>;
    protected enqueueTask<T>(signal: TaskSignal, task: Task<T>, parent?: X): {
        node: X;
        promise: Promise<T>;
    };
}
export interface TaskHandle<T, N extends Task.State> {
    /**
     * Wait the task to complete
     */
    wait(): Promise<T>;
    /**
     * Cancel the task.
     */
    cancel(): void;
    /**
     * Pause the task if possible.
     */
    pause(): void;
    resume(): void;
    readonly root: N;
    readonly isCancelled: boolean;
    readonly isPaused: boolean;
    readonly isStarted: boolean;
}
export declare class Task<T> {
    readonly name: string;
    readonly parameters: object | undefined;
    readonly run: (context: Task.Context) => (Promise<T> | T);
    constructor(name: string, parameters: object | undefined, run: (context: Task.Context) => (Promise<T> | T));
    /**
     * Execute this task immediately (not in runtime).
     * This will have the same behavior like \`Task.execute\`.
     *
     * @see Task.execute
     */
    execute(): TaskHandle<T, Task.State> & TaskListener<Task.State>;
}
export declare namespace Task {
    interface Function<T> {
        (context: Task.Context): (Promise<T> | T);
    }
    interface Object<T> {
        readonly name: string;
        readonly parameters?: object;
        readonly run: (context: Task.Context) => (Promise<T> | T);
    }
    /**
     * You'll recive this if the task is cancelled.
     */
    class CancelledError extends Error {
        constructor();
    }
    type Schedualer = <N>(r: () => Promise<N>) => Promise<N>;
    interface Context {
        pausealbe(onPause?: () => void, onResume?: () => void): void;
        update(progres: number, total?: number, message?: string): void | boolean;
        execute<T>(task: Task<T>): Promise<T>;
    }
    type StateFactory<X extends Task.State = Task.State> = (node: Task.State, parent?: X) => X;
    const DEFAULT_STATE_FACTORY: StateFactory;
    /**
     * Run the task immediately without a integrated runtime
     * @param task The task will be run
     */
    function execute<T>(task: Task<T>): TaskHandle<T, Task.State> & TaskListener;
    /**
     * Create a central managed runtime for task execution. You can listen the tasks status at one place.
     * @param factory The state factory. It's used to customize your task state.
     * @param schedular The task schedular provided
     */
    function createRuntime<X extends Task.State = Task.State>(factory?: StateFactory<X>, schedular?: Schedualer): TaskRuntime<X>;
    interface State {
        name: string;
        arguments?: {
            [key: string]: any;
        };
        path: string;
    }
    function create<T>(name: string, task: Task.Function<T>, parameters?: any): Task<T>;
}
export declare function newTask<T>(name: string, task: Task.Function<T>, parameters?: any): Task<T>;
export default Task;
`;
module.exports['@xmcl/task/test.d.ts'] = `export {};
`;
module.exports['@xmcl/text-component/cjs/index.d.ts'] = `/**
 * @see https://minecraft.gamepedia.com/Raw_JSON_text_format
 */
export interface TextComponent {
    /**
     * A string representing raw text to display directly in chat. Note that selectors such as "@a" and "@p" are not translated into player names; use selector instead. Can use escape characters, such as \n for newline (enter), \t for tab, etc.
     */
    text: string;
    /**
     * The translation identifier of text to be displayed using the player's selected language. This identifier is the same as the identifiers found in lang files from assets or resource packs. Ignored when  text exist in the root object.
     */
    translate?: string;
    /**
     * A list of chat component arguments and/or string arguments to be used by translate. Useless otherwise.
     *
     * The arguments are text corresponding to the arguments used by the translation string in the current language, in order (for example, the first list element corresponds to "%1\$s" in a translation string). Argument structure repeats this raw JSON text structure.
     */
    with?: string[];
    /**
     * A player's score in an objective. Displays nothing if the player is not tracked in the given objective.
     * Ignored when any of the previous fields exist in the root object.
     */
    score?: {
        name: string;
        objective: string;
        value: string;
    };
    /**
     * A string containing a selector (@p,@a,@r,@e or @s) and, optionally, selector arguments.
     *
     * Unlike text, the selector is translated into the correct player/entity names.
     * If more than one player/entity is detected by the selector, it is displayed in a form such as 'Name1 and Name2' or 'Name1, Name2, Name3, and Name4'.
     * Ignored when any of the previous fields exist in the root object.
     *
     * - Clicking a player's name inserted into a /tellraw command this way suggests a command to whisper to that player.
     * - Shift-clicking a player's name inserts that name into chat.
     * - Shift-clicking a non-player entity's name inserts its UUID into chat.
     */
    selector?: string;
    /**
     * A string that can be used to display the key needed to preform a certain action.
     * An example is \`key.inventory\` which always displays "E" unless the player has set a different key for opening their inventory.
     *
     * Ignored when any of the previous fields exist in the root object.
     */
    keybind?: string;
    /**
     *  A string indicating the NBT path used for looking up NBT values from an entity or a block entity. Ignored when any of the previous fields exist in the root object.
     */
    nbt?: string;
    /**
     * A string specifying the coordinates of the block entity from which the NBT value is obtained. The coordinates can be absolute or relative. Useless if  nbt is absent.
     */
    block?: string;
    /**
     * A string specifying the target selector for the entity from which the NBT value is obtained. Useless if  nbt is absent.
     */
    entity?: string;
    /**
     * A list element whose structure repeats this raw JSON text structure. Note that all properties of this object are inherited by children except for text, extra, translate, with, and score.
     *
     * This means that children retain the same formatting and events as this object unless they explicitly override them.
     */
    extra?: TextComponent[];
    /**
     * The color to render this text in. Valid values are "black", "dark_blue", "dark_green", "dark_aqua", "dark_red", "dark_purple", "gold", "gray", "dark_gray", "blue", "green", "aqua", "red", "light_purple", "yellow", "white", and "reset" (cancels out the effects of colors used by parent objects). Technically, "bold", "italic", "underlined", "strikethrough", and "obfuscated" are also accepted, but it may be better practice to use the tags below for such formats.
     */
    color?: string;
    bold?: boolean;
    italic?: boolean;
    underlined?: boolean;
    strikethrough?: boolean;
    obfuscated?: boolean;
    /**
     * When the text is shift-clicked by a player, this string is inserted in their chat input. It does not overwrite any existing text the player was writing.
     */
    insertion?: string;
    /**
     *  Allows for events to occur when the player clicks on text.
     */
    clickEvent?: {
        /**
         * The action to perform when clicked.
         * Valid values are
         * - "open_url" (opens value as a URL in the player's default web browser),
         * - "open_file" (opens the value file on the user's computer),
         * - "run_command" (has value entered in chat as though the player typed it themselves. This can be used to run commands, provided the player has the required permissions),
         * - "change_page" (can be used only in written books) changes to page value if that page exists,
         * - "suggest_command" (similar to "run_command" but it cannot be used in a written book, the text appears only in the player's chat input and it is not automatically entered. Unlike insertion, this replaces the existing contents of the chat input),
         * - "copy_to_clipboard"‌[upcoming: 1.15] (copy the value to the clipboard). "open_file" is used in messages automatically generated by the game (e.g. on taking a screenshot) and cannot be used in commands or signs.
         */
        action: ClickEventAction;
        /**
         * The URL, file, chat, command or book page used by the specified action. Note that commands must be prefixed with the usual "/" slash.
         */
        value: string;
    };
    hoverEvent?: {
        /**
         * The type of tooltip to show. Valid values are
         * - "show_text" (shows raw JSON text),
         * - "show_item" (shows the tooltip of an item that can have NBT tags),
         * - "show_entity" (shows an entity's name, possibly its type, and its UUID).
         */
        action: HoverEventAction;
        /**
         * The formatting of this tag varies depending on the action. Note that "show_text" is the only action to support an Object as the value; all other action values are Strings and should thus be wrapped in quotes.
         *
         * - "show_text" can be either a raw string of text or an object with the same formatting as this base object. Note that clickEvent and hoverEvent do not function within the tooltip, but the formatting and extra tags still work.
         * - "show_item" can be a string formatted like item NBT data. Contains the "id" tag, and optionally the "Damage" tag and "tag" tag (which is the same compound used as "dataTag" in the /give command).
         * - "show_entity" can be string formatted like a compound with the string values "type" (such as "Zombie"), "name", and "id" (should be an entity UUID, but can actually be any string).
         */
        value: string | TextComponent;
    };
}
export declare type ClickEventAction = "open_file" | "open_url" | "run_command" | "suggest_command";
export declare type HoverEventAction = "show_text" | "show_item" | "show_entity";
export interface Style {
    /**
     * The friendly name of the color, like \`light_purple\` or \`red\`
     */
    color?: string;
    bold?: boolean;
    italic?: boolean;
    underlined?: boolean;
    strikethrough?: boolean;
    obfuscated?: boolean;
}
/**
 * Get Minecraft style code for the style
 */
export declare function getStyleCode(style: TextComponent): string;
/**
 * The renderable node
 */
export declare type RenderNode = {
    /**
     * The css style string
     */
    style: object;
    /**
     * The text component backed by
     */
    component: TextComponent;
    /**
     * Children
     */
    children: RenderNode[];
};
/**
 * Get suggest css style object for input style
 */
export declare function getSuggestedStyle(style: TextComponent | Style): object;
/**
 * Render a text component into html style object
 * @returns the render node hint for html/css info
 */
export declare function render(src: TextComponent): RenderNode;
/**
 * Flat all components (this component and its children) in this component by DFS into a list.
 * @param component The root component
 */
export declare function flat(component: TextComponent): TextComponent[];
/**
 * Convert a text component to Minecraft specific formatted string like \`§1colored§r\`
 */
export declare function toFormattedString(comp: TextComponent): string;
/**
 * Convert a formatted string to text component json
 * @param formatted The formatted string
 */
export declare function fromFormattedString(formatted: string): TextComponent;
`;
module.exports['@xmcl/text-component/index.d.ts'] = `/**
 * @see https://minecraft.gamepedia.com/Raw_JSON_text_format
 */
export interface TextComponent {
    /**
     * A string representing raw text to display directly in chat. Note that selectors such as "@a" and "@p" are not translated into player names; use selector instead. Can use escape characters, such as \n for newline (enter), \t for tab, etc.
     */
    text: string;
    /**
     * The translation identifier of text to be displayed using the player's selected language. This identifier is the same as the identifiers found in lang files from assets or resource packs. Ignored when  text exist in the root object.
     */
    translate?: string;
    /**
     * A list of chat component arguments and/or string arguments to be used by translate. Useless otherwise.
     *
     * The arguments are text corresponding to the arguments used by the translation string in the current language, in order (for example, the first list element corresponds to "%1\$s" in a translation string). Argument structure repeats this raw JSON text structure.
     */
    with?: string[];
    /**
     * A player's score in an objective. Displays nothing if the player is not tracked in the given objective.
     * Ignored when any of the previous fields exist in the root object.
     */
    score?: {
        name: string;
        objective: string;
        value: string;
    };
    /**
     * A string containing a selector (@p,@a,@r,@e or @s) and, optionally, selector arguments.
     *
     * Unlike text, the selector is translated into the correct player/entity names.
     * If more than one player/entity is detected by the selector, it is displayed in a form such as 'Name1 and Name2' or 'Name1, Name2, Name3, and Name4'.
     * Ignored when any of the previous fields exist in the root object.
     *
     * - Clicking a player's name inserted into a /tellraw command this way suggests a command to whisper to that player.
     * - Shift-clicking a player's name inserts that name into chat.
     * - Shift-clicking a non-player entity's name inserts its UUID into chat.
     */
    selector?: string;
    /**
     * A string that can be used to display the key needed to preform a certain action.
     * An example is \`key.inventory\` which always displays "E" unless the player has set a different key for opening their inventory.
     *
     * Ignored when any of the previous fields exist in the root object.
     */
    keybind?: string;
    /**
     *  A string indicating the NBT path used for looking up NBT values from an entity or a block entity. Ignored when any of the previous fields exist in the root object.
     */
    nbt?: string;
    /**
     * A string specifying the coordinates of the block entity from which the NBT value is obtained. The coordinates can be absolute or relative. Useless if  nbt is absent.
     */
    block?: string;
    /**
     * A string specifying the target selector for the entity from which the NBT value is obtained. Useless if  nbt is absent.
     */
    entity?: string;
    /**
     * A list element whose structure repeats this raw JSON text structure. Note that all properties of this object are inherited by children except for text, extra, translate, with, and score.
     *
     * This means that children retain the same formatting and events as this object unless they explicitly override them.
     */
    extra?: TextComponent[];
    /**
     * The color to render this text in. Valid values are "black", "dark_blue", "dark_green", "dark_aqua", "dark_red", "dark_purple", "gold", "gray", "dark_gray", "blue", "green", "aqua", "red", "light_purple", "yellow", "white", and "reset" (cancels out the effects of colors used by parent objects). Technically, "bold", "italic", "underlined", "strikethrough", and "obfuscated" are also accepted, but it may be better practice to use the tags below for such formats.
     */
    color?: string;
    bold?: boolean;
    italic?: boolean;
    underlined?: boolean;
    strikethrough?: boolean;
    obfuscated?: boolean;
    /**
     * When the text is shift-clicked by a player, this string is inserted in their chat input. It does not overwrite any existing text the player was writing.
     */
    insertion?: string;
    /**
     *  Allows for events to occur when the player clicks on text.
     */
    clickEvent?: {
        /**
         * The action to perform when clicked.
         * Valid values are
         * - "open_url" (opens value as a URL in the player's default web browser),
         * - "open_file" (opens the value file on the user's computer),
         * - "run_command" (has value entered in chat as though the player typed it themselves. This can be used to run commands, provided the player has the required permissions),
         * - "change_page" (can be used only in written books) changes to page value if that page exists,
         * - "suggest_command" (similar to "run_command" but it cannot be used in a written book, the text appears only in the player's chat input and it is not automatically entered. Unlike insertion, this replaces the existing contents of the chat input),
         * - "copy_to_clipboard"‌[upcoming: 1.15] (copy the value to the clipboard). "open_file" is used in messages automatically generated by the game (e.g. on taking a screenshot) and cannot be used in commands or signs.
         */
        action: ClickEventAction;
        /**
         * The URL, file, chat, command or book page used by the specified action. Note that commands must be prefixed with the usual "/" slash.
         */
        value: string;
    };
    hoverEvent?: {
        /**
         * The type of tooltip to show. Valid values are
         * - "show_text" (shows raw JSON text),
         * - "show_item" (shows the tooltip of an item that can have NBT tags),
         * - "show_entity" (shows an entity's name, possibly its type, and its UUID).
         */
        action: HoverEventAction;
        /**
         * The formatting of this tag varies depending on the action. Note that "show_text" is the only action to support an Object as the value; all other action values are Strings and should thus be wrapped in quotes.
         *
         * - "show_text" can be either a raw string of text or an object with the same formatting as this base object. Note that clickEvent and hoverEvent do not function within the tooltip, but the formatting and extra tags still work.
         * - "show_item" can be a string formatted like item NBT data. Contains the "id" tag, and optionally the "Damage" tag and "tag" tag (which is the same compound used as "dataTag" in the /give command).
         * - "show_entity" can be string formatted like a compound with the string values "type" (such as "Zombie"), "name", and "id" (should be an entity UUID, but can actually be any string).
         */
        value: string | TextComponent;
    };
}
export declare type ClickEventAction = "open_file" | "open_url" | "run_command" | "suggest_command";
export declare type HoverEventAction = "show_text" | "show_item" | "show_entity";
export interface Style {
    /**
     * The friendly name of the color, like \`light_purple\` or \`red\`
     */
    color?: string;
    bold?: boolean;
    italic?: boolean;
    underlined?: boolean;
    strikethrough?: boolean;
    obfuscated?: boolean;
}
/**
 * Get Minecraft style code for the style
 */
export declare function getStyleCode(style: TextComponent): string;
/**
 * The renderable node
 */
export declare type RenderNode = {
    /**
     * The css style string
     */
    style: object;
    /**
     * The text component backed by
     */
    component: TextComponent;
    /**
     * Children
     */
    children: RenderNode[];
};
/**
 * Get suggest css style object for input style
 */
export declare function getSuggestedStyle(style: TextComponent | Style): object;
/**
 * Render a text component into html style object
 * @returns the render node hint for html/css info
 */
export declare function render(src: TextComponent): RenderNode;
/**
 * Flat all components (this component and its children) in this component by DFS into a list.
 * @param component The root component
 */
export declare function flat(component: TextComponent): TextComponent[];
/**
 * Convert a text component to Minecraft specific formatted string like \`§1colored§r\`
 */
export declare function toFormattedString(comp: TextComponent): string;
/**
 * Convert a formatted string to text component json
 * @param formatted The formatted string
 */
export declare function fromFormattedString(formatted: string): TextComponent;
`;
module.exports['@xmcl/text-component/test.d.ts'] = `export {};
`;
module.exports['@xmcl/unzip/cjs/index.d.ts'] = `/// <reference types="node" />
import { Readable, Writable } from "stream";
export declare type OpenTarget = string | Buffer | number;
export interface ZipFileOptions {
    decompress?: boolean | null;
    decrypt?: boolean | null;
    start?: number | null;
    end?: number | null;
}
export interface Entry {
    readonly comment: string;
    readonly compressedSize: number;
    readonly compressionMethod: number;
    readonly crc32: number;
    readonly externalFileAttributes: number;
    readonly extraFieldLength: number;
    readonly extraFields: Array<{
        id: number;
        data: Buffer;
    }>;
    readonly fileCommentLength: number;
    readonly fileName: string;
    readonly fileNameLength: number;
    readonly generalPurposeBitFlag: number;
    readonly internalFileAttributes: number;
    readonly lastModFileDate: number;
    readonly lastModFileTime: number;
    readonly relativeOffsetOfLocalHeader: number;
    readonly uncompressedSize: number;
    readonly versionMadeBy: number;
    readonly versionNeededToExtract: number;
    getLastModDate(): Date;
    isEncrypted(): boolean;
    isCompressed(): boolean;
}
export interface Options {
    lazyEntries?: boolean;
    decodeStrings?: boolean;
    validateEntrySizes?: boolean;
    strictFileNames?: boolean;
}
interface LazyOptions extends Options {
    lazyEntries: true;
}
interface CacheOptions extends Options {
    lazyEntries?: false;
}
export interface ZipFile {
    readonly comment: string;
    readonly decodeStrings: boolean;
    readonly entryCount: number;
    readonly fileSize: number;
    readonly isOpen: boolean;
    readonly validateEntrySizes: boolean;
    readEntry(entry: Entry, options?: ZipFileOptions): Promise<Buffer>;
    openEntry(entry: Entry, options?: ZipFileOptions): Promise<Readable>;
    extractEntries(dest: string, mapper?: (e: Entry) => undefined | string): Promise<void>;
    close(): void;
}
export interface CachedZipFile extends ZipFile {
    readonly entries: {
        [name: string]: Entry | undefined;
    };
    filterEntries(filter: (e: Entry) => boolean): Entry[];
}
export interface LazyZipFile extends ZipFile {
    readonly entriesRead: number;
    readonly readEntryCursor: boolean;
    nextEntry(): Promise<Entry>;
    /**
     * When you know which entries you want, you can use this function to get the entries you want at once.
     *
     * For more complex requirement, please use walkEntries.
     *
     * @param entries The entries' names you want
     */
    filterEntries(entries: string[]): Promise<Entry[]>;
    walkEntries(onEntry: (entry: Entry) => Promise<any> | boolean | void): Promise<void>;
}
export interface ParseStream extends Writable {
    wait(): Promise<LazyZipFile>;
}
export interface ParseEntriesStream extends Writable {
    wait(): Promise<CachedZipFile>;
}
export interface ExtractStream extends Writable {
    wait(): Promise<void>;
}
export interface WalkEntriesStream extends Writable {
    wait(): Promise<void>;
}
export declare function open(target: OpenTarget, options: CacheOptions): Promise<CachedZipFile>;
export declare function open(target: OpenTarget, options: LazyOptions): Promise<LazyZipFile>;
export declare function open(target: OpenTarget, options: CacheOptions | LazyOptions): Promise<LazyZipFile | CachedZipFile>;
export declare function open(target: OpenTarget): Promise<CachedZipFile>;
export declare function createParseStream(options?: CacheOptions): ParseEntriesStream;
export declare function createParseStream(options?: LazyOptions): ParseStream;
export declare function createParseEntriesStream(entries: string[]): ParseEntriesStream;
export declare function createExtractStream(destination: string, entries?: string[] | ((entry: Entry) => string | undefined)): ExtractStream;
export declare function createWalkEntriesStream(onEntry: (entry: Entry) => Promise<any> | boolean | undefined): WalkEntriesStream;
/**
 * Extract the zip file with a filter into a folder. The default filter is filter nothing, which will unzip all the content in zip.
 *
 * @param zipfile The zip file
 * @param dest The destination folder
 * @param filter The entry filter
 */
export declare function extract(openFile: OpenTarget, dest: string, filter?: (entry: Entry) => string | undefined): Promise<void>;
/**
 * Extract the zipfile's entries into destiation folder. This will close the zip file finally.
 *
 * @param zipfile The zip file
 * @param dest The destination folder
 * @param entries The querying entries
 */
export declare function extractEntries(openFile: OpenTarget, dest: string, entries: string[]): Promise<void>;
export {};
`;
module.exports['@xmcl/unzip/index.d.ts'] = `/// <reference types="node" />
import { Readable, Writable } from "stream";
export declare type OpenTarget = string | Buffer | number;
export interface ZipFileOptions {
    decompress?: boolean | null;
    decrypt?: boolean | null;
    start?: number | null;
    end?: number | null;
}
export interface Entry {
    readonly comment: string;
    readonly compressedSize: number;
    readonly compressionMethod: number;
    readonly crc32: number;
    readonly externalFileAttributes: number;
    readonly extraFieldLength: number;
    readonly extraFields: Array<{
        id: number;
        data: Buffer;
    }>;
    readonly fileCommentLength: number;
    readonly fileName: string;
    readonly fileNameLength: number;
    readonly generalPurposeBitFlag: number;
    readonly internalFileAttributes: number;
    readonly lastModFileDate: number;
    readonly lastModFileTime: number;
    readonly relativeOffsetOfLocalHeader: number;
    readonly uncompressedSize: number;
    readonly versionMadeBy: number;
    readonly versionNeededToExtract: number;
    getLastModDate(): Date;
    isEncrypted(): boolean;
    isCompressed(): boolean;
}
export interface Options {
    lazyEntries?: boolean;
    decodeStrings?: boolean;
    validateEntrySizes?: boolean;
    strictFileNames?: boolean;
}
interface LazyOptions extends Options {
    lazyEntries: true;
}
interface CacheOptions extends Options {
    lazyEntries?: false;
}
export interface ZipFile {
    readonly comment: string;
    readonly decodeStrings: boolean;
    readonly entryCount: number;
    readonly fileSize: number;
    readonly isOpen: boolean;
    readonly validateEntrySizes: boolean;
    readEntry(entry: Entry, options?: ZipFileOptions): Promise<Buffer>;
    openEntry(entry: Entry, options?: ZipFileOptions): Promise<Readable>;
    extractEntries(dest: string, mapper?: (e: Entry) => undefined | string): Promise<void>;
    close(): void;
}
export interface CachedZipFile extends ZipFile {
    readonly entries: {
        [name: string]: Entry | undefined;
    };
    filterEntries(filter: (e: Entry) => boolean): Entry[];
}
export interface LazyZipFile extends ZipFile {
    readonly entriesRead: number;
    readonly readEntryCursor: boolean;
    nextEntry(): Promise<Entry>;
    /**
     * When you know which entries you want, you can use this function to get the entries you want at once.
     *
     * For more complex requirement, please use walkEntries.
     *
     * @param entries The entries' names you want
     */
    filterEntries(entries: string[]): Promise<Entry[]>;
    walkEntries(onEntry: (entry: Entry) => Promise<any> | boolean | void): Promise<void>;
}
export interface ParseStream extends Writable {
    wait(): Promise<LazyZipFile>;
}
export interface ParseEntriesStream extends Writable {
    wait(): Promise<CachedZipFile>;
}
export interface ExtractStream extends Writable {
    wait(): Promise<void>;
}
export interface WalkEntriesStream extends Writable {
    wait(): Promise<void>;
}
export declare function open(target: OpenTarget, options: CacheOptions): Promise<CachedZipFile>;
export declare function open(target: OpenTarget, options: LazyOptions): Promise<LazyZipFile>;
export declare function open(target: OpenTarget, options: CacheOptions | LazyOptions): Promise<LazyZipFile | CachedZipFile>;
export declare function open(target: OpenTarget): Promise<CachedZipFile>;
export declare function createParseStream(options?: CacheOptions): ParseEntriesStream;
export declare function createParseStream(options?: LazyOptions): ParseStream;
export declare function createParseEntriesStream(entries: string[]): ParseEntriesStream;
export declare function createExtractStream(destination: string, entries?: string[] | ((entry: Entry) => string | undefined)): ExtractStream;
export declare function createWalkEntriesStream(onEntry: (entry: Entry) => Promise<any> | boolean | undefined): WalkEntriesStream;
/**
 * Extract the zip file with a filter into a folder. The default filter is filter nothing, which will unzip all the content in zip.
 *
 * @param zipfile The zip file
 * @param dest The destination folder
 * @param filter The entry filter
 */
export declare function extract(openFile: OpenTarget, dest: string, filter?: (entry: Entry) => string | undefined): Promise<void>;
/**
 * Extract the zipfile's entries into destiation folder. This will close the zip file finally.
 *
 * @param zipfile The zip file
 * @param dest The destination folder
 * @param entries The querying entries
 */
export declare function extractEntries(openFile: OpenTarget, dest: string, entries: string[]): Promise<void>;
export {};
`;
module.exports['@xmcl/unzip/test.d.ts'] = `export {};
`;
module.exports['@xmcl/user/auth.d.ts'] = `import { GameProfile } from "./base";
declare type LoginWithUser = {
    username: string;
    password: string;
    requestUser: true;
} | {
    username: string;
    password: string;
};
declare type LoginWithoutUser = {
    username: string;
    password: string;
    requestUser: false;
};
declare type LoginOption = LoginWithUser | LoginWithoutUser;
/**
 * The auth response format.
 *
 * Please refer https://wiki.vg/Authentication
 */
export interface Authentication {
    /**
     * hexadecimal or JSON-Web-Token (unconfirmed) [The normal accessToken can be found in the payload of the JWT (second by '.' separated part as Base64 encoded JSON object), in key "yggt"]
     */
    accessToken: string;
    /**
     * identical to the one received
     */
    clientToken: string;
    /**
     * only present if the agent field was received
     */
    availableProfiles: GameProfile[];
    /**
     * only present if the agent field was received
     */
    selectedProfile: GameProfile;
    /**
     * only present if requestUser was true in the request payload
     */
    user?: {
        id: string;
        username: string;
        email?: string;
        registerIp?: string;
        migratedFrom?: string;
        migratedAt?: number;
        registeredAt?: number;
        passwordChangedAt?: number;
        dateOfBirth?: number;
        suspended?: boolean;
        blocked?: boolean;
        secured?: boolean;
        migrated?: boolean;
        emailVerified?: boolean;
        legacyUser?: boolean;
        verifiedByParent?: boolean;
        properties?: object[];
    };
}
/**
 * Random generate a new token by uuid v4. It can be client or auth token.
 * @returns a new token
 */
export declare function newToken(): string;
export interface AuthException {
    error: "Method Not Allowed" | "Not Not Found" | "ForbiddenOperationException" | "IllegalArgumentException" | "Unsupported Media Type";
    errorMessage: string;
}
export declare class Authenticator {
    readonly clientToken: string;
    readonly api: YggdrasilAuthAPI;
    /**
     * Create a client for \`Yggdrasil\` service, given API and clientToken.
     * @param clientToken The client token uuid. It will generate a new one if it's absent.
     * @param api The api for this client.
     */
    constructor(clientToken: string, api: YggdrasilAuthAPI);
    protected post(endpoint: string, payload: object): Promise<object | undefined>;
    /**
     * Login to the server by username and password. Notice that the auth server usually have the cooldown time for login.
     * You have to wait for about a minute after one approch of login, to login again.
     *
     * @param option The login options, contains the username, password
     * @throws This may throw the error object with \`statusCode\`, \`statusMessage\`, \`type\` (error type), and \`message\`
     */
    login(option: LoginOption): Promise<Authentication>;
    /**
     * Determine whether the access/client token pair is valid.
     *
     * @param option The access token
     */
    validate(option: {
        accessToken: string;
    }): Promise<boolean>;
    /**
     * Invalidate an access token and client token
     *
     * @param option The tokens
     */
    invalidate(option: {
        accessToken: string;
    }): Promise<void>;
    /**
     * Refresh the current access token with specific client token.
     * Notice that the client token and access token must match.
     *
     * You can use this function to get a new token when your old token is expired.
     *
     * @param option The access token
     */
    refresh(option: {
        accessToken: string;
        requestUser?: boolean;
    }): Promise<Pick<Authentication, "accessToken" | "clientToken">>;
    signout(option: {
        username: string;
        password: string;
    }): Promise<void>;
}
export interface YggdrasilAuthAPI {
    /**
     * The host url, like https://xxx.xxx.com
     */
    readonly hostName: string;
    /**
     * Authenticate path, in the form of \`/your-endpoint\`.
     * Use to login
     */
    readonly authenticate: string;
    /**
     * Use to refresh access token
     */
    readonly refresh: string;
    /**
     * Use to validate the user access token
     */
    readonly validate: string;
    /**
     * Use to logout user (invalidate user access token)
     */
    readonly invalidate: string;
    /**
     * Use to logout user (by username and password)
     */
    readonly signout: string;
}
/**
 * The default Mojang API
 */
export declare const AUTH_API_MOJANG: YggdrasilAuthAPI;
/**
 * Login to the server by username and password. Notice that the auth server usually have the cooldown time for login.
 * You have to wait for about a minute after one approch of login, to login again.
 *
 * @param option The login options, contains the username, password and clientToken
 * @param api The API of the auth server
 * @throws This may throw the error object with \`statusCode\`, \`statusMessage\`, \`type\` (error type), and \`message\`
 */
export declare function login(option: LoginOption & {
    clientToken?: string;
}, api?: YggdrasilAuthAPI): Promise<Authentication>;
/**
 * Refresh the current access token with specific client token.
 * Notice that the client token and access token must match.
 *
 * You can use this function to get a new token when your old token is expired.
 *
 * @param option The tokens
 * @param api The API of the auth server
 */
export declare function refresh(option: {
    clientToken: string;
    accessToken: string;
    requestUser?: boolean;
}, api?: YggdrasilAuthAPI): Promise<Pick<Authentication, "accessToken" | "clientToken">>;
/**
 * Determine whether the access/client token pair is valid.
 *
 * @param option The tokens
 * @param api The API of the auth server
 */
export declare function validate(option: {
    accessToken: string;
    clientToken?: string;
}, api?: YggdrasilAuthAPI): Promise<boolean>;
/**
 * Invalidate an access/client token pair
 *
 * @param option The tokens
 * @param api The API of the auth server
 */
export declare function invalidate(option: {
    accessToken: string;
    clientToken: string;
}, api?: YggdrasilAuthAPI): Promise<void>;
/**
 * Signout user by username and password
 *
 * @param option The username and password
 * @param api The API of the auth server
 */
export declare function signout(option: {
    username: string;
    password: string;
}, api?: YggdrasilAuthAPI): Promise<void>;
/**
 * Create an offline auth. It'll ensure the user game profile's \`uuid\` is the same for the same \`username\`.
 *
 * @param username The username you want to have in-game.
 */
export declare function offline(username: string): Authentication;
export {};
`;
module.exports['@xmcl/user/auth.test.d.ts'] = `export {};
`;
module.exports['@xmcl/user/base.d.ts'] = `/**
 * The game profile of the user.
 *
 * In auth response, it will usually carry the \`userId\`, \`createdAt\` properties.
 *
 * In \`lookup\` function, it will carry the \`properties\` property.
 */
export interface GameProfile {
    /**
     * game profile unique id
     */
    id: string;
    /**
     * This is in game displayed name
     */
    name: string;
    properties?: {
        [name: string]: string;
    };
    userId?: string;
    createdAt?: number;
    legacyProfile?: boolean;
    suspended?: boolean;
    paid?: boolean;
    migrated?: boolean;
    legacy?: boolean;
}
export interface GameProfileWithProperties extends GameProfile {
    properties: {
        [name: string]: string;
    };
}
export declare namespace GameProfile {
    interface TexturesInfo {
        /**
         * java time in ms
         */
        timestamp: number;
        /**
         * player name
         */
        profileName: string;
        /**
         * player id
         */
        profileId: string;
        textures: {
            SKIN?: Texture;
            CAPE?: Texture;
            ELYTRA?: Texture;
        };
    }
    /**
     * The data structure that hold the texture
     */
    interface Texture {
        url: string;
        metadata?: {
            model?: "slim" | "steve";
            [key: string]: any;
        };
    }
    namespace Texture {
        function isSlim(o: Texture): boolean;
        function getModelType(o: Texture): "slim" | "steve";
    }
}
/**
 * Abstract layer for http requester.
 */
export declare type HttpRequester = (option: {
    url: string;
    method: string;
    headers: {
        [key: string]: string;
    };
    /**
     * Search string
     */
    search?: {
        [key: string]: string | string[] | undefined;
    };
    /**
     * Either form multi part or json. Default is json.
     */
    bodyType?: "formMultiPart" | "json" | "search";
    body?: FormItems | object | Record<string, string>;
}) => Promise<{
    body: string;
    statusMessage: string;
    statusCode: number;
}>;
export declare type Verify = (value: string, signature: string, pemKey: string) => Promise<boolean>;
export interface ItemBlob {
    type: string;
    value: Uint8Array;
}
export interface FormItems {
    [name: string]: ItemBlob | string;
}
`;
module.exports['@xmcl/user/cjs/auth.d.ts'] = `import { GameProfile } from "./base";
declare type LoginWithUser = {
    username: string;
    password: string;
    requestUser: true;
} | {
    username: string;
    password: string;
};
declare type LoginWithoutUser = {
    username: string;
    password: string;
    requestUser: false;
};
declare type LoginOption = LoginWithUser | LoginWithoutUser;
/**
 * The auth response format.
 *
 * Please refer https://wiki.vg/Authentication
 */
export interface Authentication {
    /**
     * hexadecimal or JSON-Web-Token (unconfirmed) [The normal accessToken can be found in the payload of the JWT (second by '.' separated part as Base64 encoded JSON object), in key "yggt"]
     */
    accessToken: string;
    /**
     * identical to the one received
     */
    clientToken: string;
    /**
     * only present if the agent field was received
     */
    availableProfiles: GameProfile[];
    /**
     * only present if the agent field was received
     */
    selectedProfile: GameProfile;
    /**
     * only present if requestUser was true in the request payload
     */
    user?: {
        id: string;
        username: string;
        email?: string;
        registerIp?: string;
        migratedFrom?: string;
        migratedAt?: number;
        registeredAt?: number;
        passwordChangedAt?: number;
        dateOfBirth?: number;
        suspended?: boolean;
        blocked?: boolean;
        secured?: boolean;
        migrated?: boolean;
        emailVerified?: boolean;
        legacyUser?: boolean;
        verifiedByParent?: boolean;
        properties?: object[];
    };
}
/**
 * Random generate a new token by uuid v4. It can be client or auth token.
 * @returns a new token
 */
export declare function newToken(): string;
export interface AuthException {
    error: "Method Not Allowed" | "Not Not Found" | "ForbiddenOperationException" | "IllegalArgumentException" | "Unsupported Media Type";
    errorMessage: string;
}
export declare class Authenticator {
    readonly clientToken: string;
    readonly api: YggdrasilAuthAPI;
    /**
     * Create a client for \`Yggdrasil\` service, given API and clientToken.
     * @param clientToken The client token uuid. It will generate a new one if it's absent.
     * @param api The api for this client.
     */
    constructor(clientToken: string, api: YggdrasilAuthAPI);
    protected post(endpoint: string, payload: object): Promise<object | undefined>;
    /**
     * Login to the server by username and password. Notice that the auth server usually have the cooldown time for login.
     * You have to wait for about a minute after one approch of login, to login again.
     *
     * @param option The login options, contains the username, password
     * @throws This may throw the error object with \`statusCode\`, \`statusMessage\`, \`type\` (error type), and \`message\`
     */
    login(option: LoginOption): Promise<Authentication>;
    /**
     * Determine whether the access/client token pair is valid.
     *
     * @param option The access token
     */
    validate(option: {
        accessToken: string;
    }): Promise<boolean>;
    /**
     * Invalidate an access token and client token
     *
     * @param option The tokens
     */
    invalidate(option: {
        accessToken: string;
    }): Promise<void>;
    /**
     * Refresh the current access token with specific client token.
     * Notice that the client token and access token must match.
     *
     * You can use this function to get a new token when your old token is expired.
     *
     * @param option The access token
     */
    refresh(option: {
        accessToken: string;
        requestUser?: boolean;
    }): Promise<Pick<Authentication, "accessToken" | "clientToken">>;
    signout(option: {
        username: string;
        password: string;
    }): Promise<void>;
}
export interface YggdrasilAuthAPI {
    /**
     * The host url, like https://xxx.xxx.com
     */
    readonly hostName: string;
    /**
     * Authenticate path, in the form of \`/your-endpoint\`.
     * Use to login
     */
    readonly authenticate: string;
    /**
     * Use to refresh access token
     */
    readonly refresh: string;
    /**
     * Use to validate the user access token
     */
    readonly validate: string;
    /**
     * Use to logout user (invalidate user access token)
     */
    readonly invalidate: string;
    /**
     * Use to logout user (by username and password)
     */
    readonly signout: string;
}
/**
 * The default Mojang API
 */
export declare const AUTH_API_MOJANG: YggdrasilAuthAPI;
/**
 * Login to the server by username and password. Notice that the auth server usually have the cooldown time for login.
 * You have to wait for about a minute after one approch of login, to login again.
 *
 * @param option The login options, contains the username, password and clientToken
 * @param api The API of the auth server
 * @throws This may throw the error object with \`statusCode\`, \`statusMessage\`, \`type\` (error type), and \`message\`
 */
export declare function login(option: LoginOption & {
    clientToken?: string;
}, api?: YggdrasilAuthAPI): Promise<Authentication>;
/**
 * Refresh the current access token with specific client token.
 * Notice that the client token and access token must match.
 *
 * You can use this function to get a new token when your old token is expired.
 *
 * @param option The tokens
 * @param api The API of the auth server
 */
export declare function refresh(option: {
    clientToken: string;
    accessToken: string;
    requestUser?: boolean;
}, api?: YggdrasilAuthAPI): Promise<Pick<Authentication, "accessToken" | "clientToken">>;
/**
 * Determine whether the access/client token pair is valid.
 *
 * @param option The tokens
 * @param api The API of the auth server
 */
export declare function validate(option: {
    accessToken: string;
    clientToken?: string;
}, api?: YggdrasilAuthAPI): Promise<boolean>;
/**
 * Invalidate an access/client token pair
 *
 * @param option The tokens
 * @param api The API of the auth server
 */
export declare function invalidate(option: {
    accessToken: string;
    clientToken: string;
}, api?: YggdrasilAuthAPI): Promise<void>;
/**
 * Signout user by username and password
 *
 * @param option The username and password
 * @param api The API of the auth server
 */
export declare function signout(option: {
    username: string;
    password: string;
}, api?: YggdrasilAuthAPI): Promise<void>;
/**
 * Create an offline auth. It'll ensure the user game profile's \`uuid\` is the same for the same \`username\`.
 *
 * @param username The username you want to have in-game.
 */
export declare function offline(username: string): Authentication;
export {};
`;
module.exports['@xmcl/user/cjs/base.d.ts'] = `/**
 * The game profile of the user.
 *
 * In auth response, it will usually carry the \`userId\`, \`createdAt\` properties.
 *
 * In \`lookup\` function, it will carry the \`properties\` property.
 */
export interface GameProfile {
    /**
     * game profile unique id
     */
    id: string;
    /**
     * This is in game displayed name
     */
    name: string;
    properties?: {
        [name: string]: string;
    };
    userId?: string;
    createdAt?: number;
    legacyProfile?: boolean;
    suspended?: boolean;
    paid?: boolean;
    migrated?: boolean;
    legacy?: boolean;
}
export interface GameProfileWithProperties extends GameProfile {
    properties: {
        [name: string]: string;
    };
}
export declare namespace GameProfile {
    interface TexturesInfo {
        /**
         * java time in ms
         */
        timestamp: number;
        /**
         * player name
         */
        profileName: string;
        /**
         * player id
         */
        profileId: string;
        textures: {
            SKIN?: Texture;
            CAPE?: Texture;
            ELYTRA?: Texture;
        };
    }
    /**
     * The data structure that hold the texture
     */
    interface Texture {
        url: string;
        metadata?: {
            model?: "slim" | "steve";
            [key: string]: any;
        };
    }
    namespace Texture {
        function isSlim(o: Texture): boolean;
        function getModelType(o: Texture): "slim" | "steve";
    }
}
/**
 * Abstract layer for http requester.
 */
export declare type HttpRequester = (option: {
    url: string;
    method: string;
    headers: {
        [key: string]: string;
    };
    /**
     * Search string
     */
    search?: {
        [key: string]: string | string[] | undefined;
    };
    /**
     * Either form multi part or json. Default is json.
     */
    bodyType?: "formMultiPart" | "json" | "search";
    body?: FormItems | object | Record<string, string>;
}) => Promise<{
    body: string;
    statusMessage: string;
    statusCode: number;
}>;
export declare type Verify = (value: string, signature: string, pemKey: string) => Promise<boolean>;
export interface ItemBlob {
    type: string;
    value: Uint8Array;
}
export interface FormItems {
    [name: string]: ItemBlob | string;
}
`;
module.exports['@xmcl/user/cjs/index.d.ts'] = `export * from "./auth";
export { GameProfile, GameProfileWithProperties } from "./base";
export * from "./mojang";
export * from "./service";
`;
module.exports['@xmcl/user/cjs/mojang.d.ts'] = `/**
 * Users defined question when they register this account
 *
 * The question id, content mapping is:
 *
 * 1. What is your favorite pet's name?
 * 2. What is your favorite movie?
 * 3. What is your favorite author's last name?
 * 4. What is your favorite artist's last name?
 * 5. What is your favorite actor's last name?
 * 6. What is your favorite activity?
 * 7. What is your favorite restaurant?
 * 8. What is the name of your favorite cartoon?
 * 9. What is the name of the first school you attended?
 * 10. What is the last name of your favorite teacher?
 * 11. What is your best friend's first name?
 * 12. What is your favorite cousin's name?
 * 13. What was the first name of your first girl/boyfriend?
 * 14. What was the name of your first stuffed animal?
 * 15. What is your mother's middle name?
 * 16. What is your father's middle name?
 * 17. What is your oldest sibling's middle name?
 * 18. In what city did your parents meet?
 * 19. In what hospital were you born?
 * 20. What is your favorite team?
 * 21. How old were you when you got your first computer?
 * 22. How old were you when you got your first gaming console?
 * 23. What was your first video game?
 * 24. What is your favorite card game?
 * 25. What is your favorite board game?
 * 26. What was your first gaming console?
 * 27. What was the first book you ever read?
 * 28. Where did you go on your first holiday?
 * 29. In what city does your grandmother live?
 * 30. In what city does your grandfather live?
 * 31. What is your grandmother's first name?
 * 32. What is your grandfather's first name?
 * 33. What is your least favorite food?
 * 34. What is your favorite ice cream flavor?
 * 35. What is your favorite ice cream flavor?
 * 36. What is your favorite place to visit?
 * 37. What is your dream job?
 * 38. What color was your first pet?
 * 39. What is your lucky number?s
 *
 */
export interface MojangChallenge {
    readonly answer: {
        id: number;
    };
    readonly question: {
        id: number;
        question: string;
    };
}
export interface MojangChallengeResponse {
    id: number;
    answer: string;
}
/**
 * Check if user need to verify its identity. If this return false, should perform such operations:
 * 1. call \`getChallenges\` get all questions
 * 2. let user response questions
 * 3. call \`responseChallenges\` to send user responsed questions, if false, redo \`2\` step.
 *
 * If you don't let user response challenges when this return false. You won't be able to get/set user texture from Mojang server.
 *
 * *(This only work for Mojang account. Third party definitly doesn't have such thing)*
 * @param accessToken You user access token.
 */
export declare function checkLocation(accessToken: string): Promise<boolean>;
/**
 * Get the user set challenge to response.
 *
 * @param accessToken The user access token
 * @returns User pre-defined questions
 */
export declare function getChallenges(accessToken: string): Promise<MojangChallenge[]>;
/**
 * Response the challeges from \`getChallenges\`.
 *
 * @param accessToken The access token
 * @param responses Your responses
 * @returns True for correctly responsed all questions
 */
export declare function responseChallenges(accessToken: string, responses: MojangChallengeResponse[]): Promise<boolean>;
`;
module.exports['@xmcl/user/cjs/service.d.ts'] = `import { GameProfile, GameProfileWithProperties } from "./base";
export interface ProfileLookupException {
    /**
     * - statusCode=204 -> error="NoPlayerFound"
     * - statusCode=400 -> error="IllegalArgumentException" (parsed from body)
     * - statusCode=other -> error=statusCode.toString()
     */
    error: "NoPlayerFoundException" | "IllegalArgumentException" | "GeneralException";
    errorMessage?: string | "Invalid timestamp.";
    statusCode?: number;
    statusMessage?: string;
}
export interface ProfileServiceAPI {
    /**
     * The PEM public key
     */
    publicKey?: string;
    /**
     * Full url to query profile by uuid. Place the uuid as \`\${uuid}\` in this url
     */
    profile: string;
    /**
     * Full url to query profile by name. Place the name as \`\${name}\` in this url
     */
    profileByName: string;
    /**
     * Full url to set texture by profile uuid and texture type. Place uuid as \`\${uuid}\` and type as \`\${type}\`
     */
    texture: string;
}
export declare namespace ProfileServiceAPI {
    /**
     * Replace \`\${uuid}\` string into uuid param
     * @param api The api
     * @param uuid The uuid will be replaced
     */
    function getProfileUrl(api: ProfileServiceAPI, uuid: string): string;
    /**
     * Replace \`\${name}\` string into name param
     * @param api The api
     * @param name The name will be replaced
     */
    function getProfileByNameUrl(api: ProfileServiceAPI, name: string): string;
    /**
     * Replace uuid string into \`\${uuid}\`, and type string into \`\${type}\`
     * @param api The api
     * @param uuid The uuid string
     * @param type The type string
     */
    function getTextureUrl(api: ProfileServiceAPI, uuid: string, type: string): string;
}
/**
 * The default Mojang API
 */
export declare const PROFILE_API_MOJANG: ProfileServiceAPI;
/**
 * Get all the textures of this GameProfile and cache them.
 *
 * @param profile The game profile from the profile service
 * @param cache Should we cache the texture into url? Default is \`true\`.
 */
export declare function getTextures(profile: GameProfile): GameProfile.TexturesInfo | undefined;
/**
 * Fetch the GameProfile by uuid.
 *
 * @param uuid The unique id of user/player
 * @param option the options for this function
 */
export declare function lookup(uuid: string, option?: {
    api?: ProfileServiceAPI;
    unsigned?: boolean;
}): Promise<GameProfileWithProperties>;
/**
 * Look up the GameProfile by username in game.
 * This will return the UUID of the name at the timestamp provided.
 * \`?at=0\` can be used to get the UUID of the original user of that username, but, it only works if the name was changed at least once, or if the account is legacy.

 * The timestamp is a UNIX timestamp (without milliseconds)
 * When the at parameter is not sent, the current time is used
 * @param name The username in game.
 * @param option the options of this function
 * @throws ProfileLookupException
 */
export declare function lookupByName(name: string, option?: {
    api?: ProfileServiceAPI;
    timestamp?: number;
}): Promise<GameProfile>;
export interface SetTextureOption {
    accessToken: string;
    uuid: string;
    type: "skin" | "cape" | "elytra";
    texture?: {
        url: string;
        metadata?: {
            model?: "slim" | "steve";
            [key: string]: any;
        };
    } | {
        data: Uint8Array;
        metadata?: {
            model?: "slim" | "steve";
            [key: string]: any;
        };
    };
}
/**
 * Set texture by access token and uuid.
 * If the texture is undefined, it will clear the texture to default steve.
 */
export declare function setTexture(option: SetTextureOption, api?: ProfileServiceAPI): Promise<void>;
/**
 * A lookuper will maintain your last time of lookup. It will prevent the lookup frequency exceed the rate limit
 */
export declare class ProfileLookuper {
    readonly api: ProfileServiceAPI;
    /**
     * The rate limit of this lookuper
     */
    readonly rateLimit: number;
    protected lookupRecord: Record<string, {
        lastLookupTime: number;
        deferredLookup: Promise<any> | undefined;
    }>;
    constructor(api: ProfileServiceAPI, 
    /**
     * The rate limit of this lookuper
     */
    rateLimit?: number);
    lookup(uuid: string): Promise<GameProfileWithProperties>;
}
`;
module.exports['@xmcl/user/index.d.ts'] = `export * from "./auth";
export { GameProfile, GameProfileWithProperties } from "./base";
export * from "./mojang";
export * from "./service";
`;
module.exports['@xmcl/user/mojang.d.ts'] = `/**
 * Users defined question when they register this account
 *
 * The question id, content mapping is:
 *
 * 1. What is your favorite pet's name?
 * 2. What is your favorite movie?
 * 3. What is your favorite author's last name?
 * 4. What is your favorite artist's last name?
 * 5. What is your favorite actor's last name?
 * 6. What is your favorite activity?
 * 7. What is your favorite restaurant?
 * 8. What is the name of your favorite cartoon?
 * 9. What is the name of the first school you attended?
 * 10. What is the last name of your favorite teacher?
 * 11. What is your best friend's first name?
 * 12. What is your favorite cousin's name?
 * 13. What was the first name of your first girl/boyfriend?
 * 14. What was the name of your first stuffed animal?
 * 15. What is your mother's middle name?
 * 16. What is your father's middle name?
 * 17. What is your oldest sibling's middle name?
 * 18. In what city did your parents meet?
 * 19. In what hospital were you born?
 * 20. What is your favorite team?
 * 21. How old were you when you got your first computer?
 * 22. How old were you when you got your first gaming console?
 * 23. What was your first video game?
 * 24. What is your favorite card game?
 * 25. What is your favorite board game?
 * 26. What was your first gaming console?
 * 27. What was the first book you ever read?
 * 28. Where did you go on your first holiday?
 * 29. In what city does your grandmother live?
 * 30. In what city does your grandfather live?
 * 31. What is your grandmother's first name?
 * 32. What is your grandfather's first name?
 * 33. What is your least favorite food?
 * 34. What is your favorite ice cream flavor?
 * 35. What is your favorite ice cream flavor?
 * 36. What is your favorite place to visit?
 * 37. What is your dream job?
 * 38. What color was your first pet?
 * 39. What is your lucky number?s
 *
 */
export interface MojangChallenge {
    readonly answer: {
        id: number;
    };
    readonly question: {
        id: number;
        question: string;
    };
}
export interface MojangChallengeResponse {
    id: number;
    answer: string;
}
/**
 * Check if user need to verify its identity. If this return false, should perform such operations:
 * 1. call \`getChallenges\` get all questions
 * 2. let user response questions
 * 3. call \`responseChallenges\` to send user responsed questions, if false, redo \`2\` step.
 *
 * If you don't let user response challenges when this return false. You won't be able to get/set user texture from Mojang server.
 *
 * *(This only work for Mojang account. Third party definitly doesn't have such thing)*
 * @param accessToken You user access token.
 */
export declare function checkLocation(accessToken: string): Promise<boolean>;
/**
 * Get the user set challenge to response.
 *
 * @param accessToken The user access token
 * @returns User pre-defined questions
 */
export declare function getChallenges(accessToken: string): Promise<MojangChallenge[]>;
/**
 * Response the challeges from \`getChallenges\`.
 *
 * @param accessToken The access token
 * @param responses Your responses
 * @returns True for correctly responsed all questions
 */
export declare function responseChallenges(accessToken: string, responses: MojangChallengeResponse[]): Promise<boolean>;
`;
module.exports['@xmcl/user/mojang.test.d.ts'] = `export {};
`;
module.exports['@xmcl/user/service.d.ts'] = `import { GameProfile, GameProfileWithProperties } from "./base";
export interface ProfileLookupException {
    /**
     * - statusCode=204 -> error="NoPlayerFound"
     * - statusCode=400 -> error="IllegalArgumentException" (parsed from body)
     * - statusCode=other -> error=statusCode.toString()
     */
    error: "NoPlayerFoundException" | "IllegalArgumentException" | "GeneralException";
    errorMessage?: string | "Invalid timestamp.";
    statusCode?: number;
    statusMessage?: string;
}
export interface ProfileServiceAPI {
    /**
     * The PEM public key
     */
    publicKey?: string;
    /**
     * Full url to query profile by uuid. Place the uuid as \`\${uuid}\` in this url
     */
    profile: string;
    /**
     * Full url to query profile by name. Place the name as \`\${name}\` in this url
     */
    profileByName: string;
    /**
     * Full url to set texture by profile uuid and texture type. Place uuid as \`\${uuid}\` and type as \`\${type}\`
     */
    texture: string;
}
export declare namespace ProfileServiceAPI {
    /**
     * Replace \`\${uuid}\` string into uuid param
     * @param api The api
     * @param uuid The uuid will be replaced
     */
    function getProfileUrl(api: ProfileServiceAPI, uuid: string): string;
    /**
     * Replace \`\${name}\` string into name param
     * @param api The api
     * @param name The name will be replaced
     */
    function getProfileByNameUrl(api: ProfileServiceAPI, name: string): string;
    /**
     * Replace uuid string into \`\${uuid}\`, and type string into \`\${type}\`
     * @param api The api
     * @param uuid The uuid string
     * @param type The type string
     */
    function getTextureUrl(api: ProfileServiceAPI, uuid: string, type: string): string;
}
/**
 * The default Mojang API
 */
export declare const PROFILE_API_MOJANG: ProfileServiceAPI;
/**
 * Get all the textures of this GameProfile and cache them.
 *
 * @param profile The game profile from the profile service
 * @param cache Should we cache the texture into url? Default is \`true\`.
 */
export declare function getTextures(profile: GameProfile): GameProfile.TexturesInfo | undefined;
/**
 * Fetch the GameProfile by uuid.
 *
 * @param uuid The unique id of user/player
 * @param option the options for this function
 */
export declare function lookup(uuid: string, option?: {
    api?: ProfileServiceAPI;
    unsigned?: boolean;
}): Promise<GameProfileWithProperties>;
/**
 * Look up the GameProfile by username in game.
 * This will return the UUID of the name at the timestamp provided.
 * \`?at=0\` can be used to get the UUID of the original user of that username, but, it only works if the name was changed at least once, or if the account is legacy.

 * The timestamp is a UNIX timestamp (without milliseconds)
 * When the at parameter is not sent, the current time is used
 * @param name The username in game.
 * @param option the options of this function
 * @throws ProfileLookupException
 */
export declare function lookupByName(name: string, option?: {
    api?: ProfileServiceAPI;
    timestamp?: number;
}): Promise<GameProfile>;
export interface SetTextureOption {
    accessToken: string;
    uuid: string;
    type: "skin" | "cape" | "elytra";
    texture?: {
        url: string;
        metadata?: {
            model?: "slim" | "steve";
            [key: string]: any;
        };
    } | {
        data: Uint8Array;
        metadata?: {
            model?: "slim" | "steve";
            [key: string]: any;
        };
    };
}
/**
 * Set texture by access token and uuid.
 * If the texture is undefined, it will clear the texture to default steve.
 */
export declare function setTexture(option: SetTextureOption, api?: ProfileServiceAPI): Promise<void>;
/**
 * A lookuper will maintain your last time of lookup. It will prevent the lookup frequency exceed the rate limit
 */
export declare class ProfileLookuper {
    readonly api: ProfileServiceAPI;
    /**
     * The rate limit of this lookuper
     */
    readonly rateLimit: number;
    protected lookupRecord: Record<string, {
        lastLookupTime: number;
        deferredLookup: Promise<any> | undefined;
    }>;
    constructor(api: ProfileServiceAPI, 
    /**
     * The rate limit of this lookuper
     */
    rateLimit?: number);
    lookup(uuid: string): Promise<GameProfileWithProperties>;
}
`;
module.exports['@xmcl/user/service.test.d.ts'] = `export {};
`;
module.exports['@xmcl/user/util/base.d.ts'] = `/**
 * Abstract layer for http requester.
 */
export declare type HttpRequester = (option: {
    url: string;
    method: string;
    headers: {
        [key: string]: string;
    };
    /**
     * Search string
     */
    search?: {
        [key: string]: string | string[] | undefined;
    };
    /**
     * Either form multi part or json. Default is json.
     */
    bodyType?: "formMultiPart" | "json" | "search";
    body?: FormItems | object | Record<string, string>;
}) => Promise<{
    body: string;
    statusMessage: string;
    statusCode: number;
}>;
export interface ItemBlob {
    type: string;
    value: Uint8Array;
}
export interface FormItems {
    [name: string]: ItemBlob | string;
}
`;
module.exports['@xmcl/user/util/cjs/base.d.ts'] = `/**
 * Abstract layer for http requester.
 */
export declare type HttpRequester = (option: {
    url: string;
    method: string;
    headers: {
        [key: string]: string;
    };
    /**
     * Search string
     */
    search?: {
        [key: string]: string | string[] | undefined;
    };
    /**
     * Either form multi part or json. Default is json.
     */
    bodyType?: "formMultiPart" | "json" | "search";
    body?: FormItems | object | Record<string, string>;
}) => Promise<{
    body: string;
    statusMessage: string;
    statusCode: number;
}>;
export interface ItemBlob {
    type: string;
    value: Uint8Array;
}
export interface FormItems {
    [name: string]: ItemBlob | string;
}
`;
module.exports['@xmcl/user/util/cjs/index.browser.d.ts'] = `import { HttpRequester } from "./base";
export declare const httpRequester: HttpRequester;
export declare function verify(data: string, signature: string, pemKey: string | Uint8Array): Promise<boolean>;
export declare function decodeBase64(b: string): string;
`;
module.exports['@xmcl/user/util/cjs/index.d.ts'] = `import { HttpRequester } from "./base";
export declare const httpRequester: HttpRequester;
export declare function verify(data: string, signature: string, pemKey: string | Uint8Array): Promise<boolean>;
export declare function decodeBase64(s: string): string;
`;
module.exports['@xmcl/user/util/index.browser.d.ts'] = `import { HttpRequester } from "./base";
export declare const httpRequester: HttpRequester;
export declare function verify(data: string, signature: string, pemKey: string | Uint8Array): Promise<boolean>;
export declare function decodeBase64(b: string): string;
`;
module.exports['@xmcl/user/util/index.d.ts'] = `import { HttpRequester } from "./base";
export declare const httpRequester: HttpRequester;
export declare function verify(data: string, signature: string, pemKey: string | Uint8Array): Promise<boolean>;
export declare function decodeBase64(s: string): string;
`;
module.exports['@xmcl/world/cjs/index.d.ts'] = `import { FileSystem } from "@xmcl/system";
export declare class WorldReader {
    private fs;
    static create(path: string | Uint8Array): Promise<WorldReader>;
    constructor(fs: FileSystem);
    /**
     * Get region data frame
     * @param chunkX The x value of chunk coord
     * @param chunkZ The z value of chunk coord
     */
    getRegionData(chunkX: number, chunkZ: number): Promise<RegionDataFrame>;
    /**
     * Read the level data
     */
    getLevelData(): Promise<LevelDataFrame>;
    getPlayerData(): Promise<PlayerDataFrame[]>;
    getAdvancementsData(): Promise<AdvancementDataFrame[]>;
}
export interface BlockState {
    name: string;
    properties: {
        [key: string]: string;
    };
}
export declare namespace RegionReader {
    function getSection(region: RegionDataFrame, chunkY: number): RegionSectionDataFrame;
    function readBlockState(section: RegionSectionDataFrame, reader: (x: number, y: number, z: number, id: number) => void): void;
    function seekBlockId(section: RegionDataFrame["Level"]["Sections"][number], index: number): number | undefined;
    function seekBlockState(section: RegionDataFrame["Level"]["Sections"][number], index: number): {
        Name: string;
        Properties: {
            [key: string]: string;
        };
    } | undefined;
}
import Long from "long";
export declare enum GameType {
    NON = -1,
    SURVIVAL = 0,
    CREATIVE = 1,
    ADVENTURE = 2,
    SPECTATOR = 3
}
export interface PlayerDataFrame {
    UUIDLeast: Long;
    UUIDMost: Long;
    DataVersion: number;
    Pos: [number, number, number];
    Rotation: [number, number, number];
    Motion: [number, number, number];
    Dimension: number;
    SpawnX: number;
    SpawnY: number;
    SpawnZ: number;
    playerGameType: number;
    Attributes: Array<{
        Base: number;
        Name: string;
    }>;
    HurtTime: number;
    DeathTime: number;
    HurtByTimestamp: number;
    SleepTimer: number;
    SpawnForced: number;
    FallDistance: number;
    SelectedItemSlot: number;
    seenCredits: number;
    Air: number;
    AbsorptionAmount: number;
    Invulnerable: number;
    FallFlying: number;
    PortalCooldown: number;
    Health: number;
    OnGround: number;
    XpLevel: number;
    Score: number;
    Sleeping: number;
    Fire: number;
    XpP: number;
    XpSeed: number;
    XpTotal: number;
    foodLevel: number;
    foodExhaustionLevel: number;
    foodTickTimer: number;
    foodSaturationLevel: number;
    recipeBook: {
        isFilteringCraftable: number;
        isGuiOpen: number;
    };
    abilities: {
        invulnerable: number;
        mayfly: number;
        instabuild: number;
        walkSpeed: number;
        mayBuild: number;
        flying: number;
        flySpeed: number;
    };
}
declare type StringBoolean = "true" | "false";
export interface LevelDataFrame {
    BorderCenterX: number;
    BorderCenterZ: number;
    BorderDamagePerBlock: number;
    BorderSafeZone: number;
    BorderSize: number;
    BorderSizeLerpTarget: number;
    BorderSizeLerpTime: Long;
    BorderWarningBlocks: number;
    BorderWarningTime: number;
    DataVersion: number;
    DayTime: Long;
    Difficulty: number;
    DifficultyLocked: number;
    DimensionData: {
        [dimension: number]: {
            DragonFight: {
                Gateways: number[];
                DragonKilled: number;
                PreviouslyKilled: number;
                ExitPortalLocation?: [number, number, number];
            };
        };
    };
    GameRules: {
        doTileDrops: StringBoolean;
        doFireTick: StringBoolean;
        gameLoopFunction: string;
        maxCommandChainLength: string;
        reducedDebugInfo: string;
        naturalRegeneration: string;
        disableElytraMovementCheck: string;
        doMobLoot: StringBoolean;
        announceAdvancements: string;
        keepInventory: StringBoolean;
        doEntityDrops: StringBoolean;
        doLimitedCrafting: StringBoolean;
        mobGriefing: StringBoolean;
        randomTickSpeed: string;
        commandBlockOutput: string;
        spawnRadius: string;
        doMobSpawning: StringBoolean;
        maxEntityCramming: string;
        logAdminCommands: string;
        spectatorsGenerateChunks: string;
        doWeatherCycle: StringBoolean;
        sendCommandFeedback: string;
        doDaylightCycle: StringBoolean;
        showDeathMessages: StringBoolean;
    };
    GameType: GameType;
    LastPlayed: Long;
    LevelName: string;
    MapFeatures: number;
    Player: PlayerDataFrame;
    RandomSeed: Long;
    readonly SizeOnDisk: Long;
    SpawnX: number;
    SpawnY: number;
    SpawnZ: number;
    Time: Long;
    Version: {
        Snapshot: number;
        Id: number;
        Name: string;
    };
    allowCommands: number;
    clearWeatherTime: number;
    generatorName: "default" | "flat" | "largeBiomes" | "amplified" | "buffet" | "debug_all_block_states" | string;
    generatorOptions: string;
    generatorVersion: number;
    hardcore: number;
    initialized: number;
    rainTime: number;
    raining: number;
    thunderTime: number;
    thundering: number;
    version: number;
}
export interface AdvancementDataFrame {
    display?: {
        background?: string;
        description: object | string;
        show_toast: boolean;
        announce_to_chat: boolean;
        hidden: boolean;
    };
    parent?: string;
    criteria: {
        [name: string]: {
            trigger: string;
            conditions: {};
        };
    };
    requirements: string[];
    rewards: {
        recipes: string[];
        loot: string[];
        experience: number;
        function: string;
    };
}
export interface ItemStackDataFrame {
    Slot: number;
    id: string;
    Count: number;
    Damage: number;
    tag?: {
        Unbreakable: number;
        CanDestroy: string[];
        CanPlaceOn: string[];
        BlockEntityTag: {};
        ench: Array<{
            id: number;
            lvl: number;
        }>;
        StoredEnchantments: Array<{
            id: number;
            lvl: number;
        }>;
        RepairCost: number;
        AttributeModifiers: Array<{
            AttributeName: string;
            Name: string;
            Slot: string;
            Operation: number;
            Amount: number;
            UUIDMost: Long;
            UUIDLeast: Long;
        }>;
        CustomPotionEffects: Array<{
            Id: number;
            Amplifier: number;
            Duration: number;
            Ambient: number;
            ShowParticles: number;
        }>;
        Potion: string;
        CustomPotionColor: number;
        display: Array<{
            color: number;
            Name: string;
            LocName: string;
            Lore: string[];
        }>;
        HideFlags: number;
        resolved: number;
        /**
         * The copy tier of the book. 0 = original, number = copy of original, number = copy of copy, number = tattered.
         * If the value is greater than number, the book cannot be copied. Does not exist for original books.
         * If this tag is missing, it is assumed the book is an original. 'Tattered' is unused in normal gameplay, and functions identically to the 'copy of copy' tier.
         */
        generation: number;
        author: string;
        title: string;
        /**
         * A single page in the book. If generated by writing in a book and quill in-game, each page is a string in double quotes and uses the escape sequences \" for a double quote,
         * for a line break and \\ for a backslash. If created by commands or external tools, a page can be a serialized JSON object or an array of strings and/or objects (see Commands#Raw JSON text) or an unescaped string.
         */
        pages: string[];
    };
}
export interface TileEntityDataFrame {
    x: number;
    y: number;
    z: number;
    Items: ItemStackDataFrame[];
    id: string;
    [key: string]: any;
}
export declare type LegacyRegionSectionDataFrame = {
    Blocks: Array<number>;
    Data: Array<number>;
    Add: Array<number>;
    BlockLight: number[];
    SkyLight: number[];
    Y: number;
};
export declare type NewRegionSectionDataFrame = {
    BlockStates: Long[];
    Palette: Array<{
        Name: string;
        Properties: {
            [key: string]: string;
        };
    }>;
    Data: number[];
    BlockLight: number[];
    SkyLight: number[];
    Y: number;
};
export declare type RegionSectionDataFrame = {
    BlockStates: Long[];
    Palette: Array<{
        Name: string;
        Properties: {
            [key: string]: string;
        };
    }>;
    Data: number[];
    BlockLight: number[];
    SkyLight: number[];
    Y: number;
} | {
    Blocks: Array<number>;
    Data: Array<number>;
    Add: Array<number>;
    BlockLight: number[];
    SkyLight: number[];
    Y: number;
};
export interface RegionDataFrame {
    Level: {
        xPos: number;
        zPos: number;
        LightPopulated: number;
        LastUpdate: Long;
        InhabitedTime: Long;
        HeightMap: number[];
        Biomes: number[];
        Entities: object[];
        TileEntities: TileEntityDataFrame[];
        Sections: RegionSectionDataFrame[];
    };
    DataVersion: number;
}
export {};
`;
module.exports['@xmcl/world/index.d.ts'] = `import { FileSystem } from "@xmcl/system";
export declare class WorldReader {
    private fs;
    static create(path: string | Uint8Array): Promise<WorldReader>;
    constructor(fs: FileSystem);
    /**
     * Get region data frame
     * @param chunkX The x value of chunk coord
     * @param chunkZ The z value of chunk coord
     */
    getRegionData(chunkX: number, chunkZ: number): Promise<RegionDataFrame>;
    /**
     * Read the level data
     */
    getLevelData(): Promise<LevelDataFrame>;
    getPlayerData(): Promise<PlayerDataFrame[]>;
    getAdvancementsData(): Promise<AdvancementDataFrame[]>;
}
export interface BlockState {
    name: string;
    properties: {
        [key: string]: string;
    };
}
export declare namespace RegionReader {
    function getSection(region: RegionDataFrame, chunkY: number): RegionSectionDataFrame;
    function readBlockState(section: RegionSectionDataFrame, reader: (x: number, y: number, z: number, id: number) => void): void;
    function seekBlockId(section: RegionDataFrame["Level"]["Sections"][number], index: number): number | undefined;
    function seekBlockState(section: RegionDataFrame["Level"]["Sections"][number], index: number): {
        Name: string;
        Properties: {
            [key: string]: string;
        };
    } | undefined;
}
import Long from "long";
export declare enum GameType {
    NON = -1,
    SURVIVAL = 0,
    CREATIVE = 1,
    ADVENTURE = 2,
    SPECTATOR = 3
}
export interface PlayerDataFrame {
    UUIDLeast: Long;
    UUIDMost: Long;
    DataVersion: number;
    Pos: [number, number, number];
    Rotation: [number, number, number];
    Motion: [number, number, number];
    Dimension: number;
    SpawnX: number;
    SpawnY: number;
    SpawnZ: number;
    playerGameType: number;
    Attributes: Array<{
        Base: number;
        Name: string;
    }>;
    HurtTime: number;
    DeathTime: number;
    HurtByTimestamp: number;
    SleepTimer: number;
    SpawnForced: number;
    FallDistance: number;
    SelectedItemSlot: number;
    seenCredits: number;
    Air: number;
    AbsorptionAmount: number;
    Invulnerable: number;
    FallFlying: number;
    PortalCooldown: number;
    Health: number;
    OnGround: number;
    XpLevel: number;
    Score: number;
    Sleeping: number;
    Fire: number;
    XpP: number;
    XpSeed: number;
    XpTotal: number;
    foodLevel: number;
    foodExhaustionLevel: number;
    foodTickTimer: number;
    foodSaturationLevel: number;
    recipeBook: {
        isFilteringCraftable: number;
        isGuiOpen: number;
    };
    abilities: {
        invulnerable: number;
        mayfly: number;
        instabuild: number;
        walkSpeed: number;
        mayBuild: number;
        flying: number;
        flySpeed: number;
    };
}
declare type StringBoolean = "true" | "false";
export interface LevelDataFrame {
    BorderCenterX: number;
    BorderCenterZ: number;
    BorderDamagePerBlock: number;
    BorderSafeZone: number;
    BorderSize: number;
    BorderSizeLerpTarget: number;
    BorderSizeLerpTime: Long;
    BorderWarningBlocks: number;
    BorderWarningTime: number;
    DataVersion: number;
    DayTime: Long;
    Difficulty: number;
    DifficultyLocked: number;
    DimensionData: {
        [dimension: number]: {
            DragonFight: {
                Gateways: number[];
                DragonKilled: number;
                PreviouslyKilled: number;
                ExitPortalLocation?: [number, number, number];
            };
        };
    };
    GameRules: {
        doTileDrops: StringBoolean;
        doFireTick: StringBoolean;
        gameLoopFunction: string;
        maxCommandChainLength: string;
        reducedDebugInfo: string;
        naturalRegeneration: string;
        disableElytraMovementCheck: string;
        doMobLoot: StringBoolean;
        announceAdvancements: string;
        keepInventory: StringBoolean;
        doEntityDrops: StringBoolean;
        doLimitedCrafting: StringBoolean;
        mobGriefing: StringBoolean;
        randomTickSpeed: string;
        commandBlockOutput: string;
        spawnRadius: string;
        doMobSpawning: StringBoolean;
        maxEntityCramming: string;
        logAdminCommands: string;
        spectatorsGenerateChunks: string;
        doWeatherCycle: StringBoolean;
        sendCommandFeedback: string;
        doDaylightCycle: StringBoolean;
        showDeathMessages: StringBoolean;
    };
    GameType: GameType;
    LastPlayed: Long;
    LevelName: string;
    MapFeatures: number;
    Player: PlayerDataFrame;
    RandomSeed: Long;
    readonly SizeOnDisk: Long;
    SpawnX: number;
    SpawnY: number;
    SpawnZ: number;
    Time: Long;
    Version: {
        Snapshot: number;
        Id: number;
        Name: string;
    };
    allowCommands: number;
    clearWeatherTime: number;
    generatorName: "default" | "flat" | "largeBiomes" | "amplified" | "buffet" | "debug_all_block_states" | string;
    generatorOptions: string;
    generatorVersion: number;
    hardcore: number;
    initialized: number;
    rainTime: number;
    raining: number;
    thunderTime: number;
    thundering: number;
    version: number;
}
export interface AdvancementDataFrame {
    display?: {
        background?: string;
        description: object | string;
        show_toast: boolean;
        announce_to_chat: boolean;
        hidden: boolean;
    };
    parent?: string;
    criteria: {
        [name: string]: {
            trigger: string;
            conditions: {};
        };
    };
    requirements: string[];
    rewards: {
        recipes: string[];
        loot: string[];
        experience: number;
        function: string;
    };
}
export interface ItemStackDataFrame {
    Slot: number;
    id: string;
    Count: number;
    Damage: number;
    tag?: {
        Unbreakable: number;
        CanDestroy: string[];
        CanPlaceOn: string[];
        BlockEntityTag: {};
        ench: Array<{
            id: number;
            lvl: number;
        }>;
        StoredEnchantments: Array<{
            id: number;
            lvl: number;
        }>;
        RepairCost: number;
        AttributeModifiers: Array<{
            AttributeName: string;
            Name: string;
            Slot: string;
            Operation: number;
            Amount: number;
            UUIDMost: Long;
            UUIDLeast: Long;
        }>;
        CustomPotionEffects: Array<{
            Id: number;
            Amplifier: number;
            Duration: number;
            Ambient: number;
            ShowParticles: number;
        }>;
        Potion: string;
        CustomPotionColor: number;
        display: Array<{
            color: number;
            Name: string;
            LocName: string;
            Lore: string[];
        }>;
        HideFlags: number;
        resolved: number;
        /**
         * The copy tier of the book. 0 = original, number = copy of original, number = copy of copy, number = tattered.
         * If the value is greater than number, the book cannot be copied. Does not exist for original books.
         * If this tag is missing, it is assumed the book is an original. 'Tattered' is unused in normal gameplay, and functions identically to the 'copy of copy' tier.
         */
        generation: number;
        author: string;
        title: string;
        /**
         * A single page in the book. If generated by writing in a book and quill in-game, each page is a string in double quotes and uses the escape sequences \" for a double quote,
         * for a line break and \\ for a backslash. If created by commands or external tools, a page can be a serialized JSON object or an array of strings and/or objects (see Commands#Raw JSON text) or an unescaped string.
         */
        pages: string[];
    };
}
export interface TileEntityDataFrame {
    x: number;
    y: number;
    z: number;
    Items: ItemStackDataFrame[];
    id: string;
    [key: string]: any;
}
export declare type LegacyRegionSectionDataFrame = {
    Blocks: Array<number>;
    Data: Array<number>;
    Add: Array<number>;
    BlockLight: number[];
    SkyLight: number[];
    Y: number;
};
export declare type NewRegionSectionDataFrame = {
    BlockStates: Long[];
    Palette: Array<{
        Name: string;
        Properties: {
            [key: string]: string;
        };
    }>;
    Data: number[];
    BlockLight: number[];
    SkyLight: number[];
    Y: number;
};
export declare type RegionSectionDataFrame = {
    BlockStates: Long[];
    Palette: Array<{
        Name: string;
        Properties: {
            [key: string]: string;
        };
    }>;
    Data: number[];
    BlockLight: number[];
    SkyLight: number[];
    Y: number;
} | {
    Blocks: Array<number>;
    Data: Array<number>;
    Add: Array<number>;
    BlockLight: number[];
    SkyLight: number[];
    Y: number;
};
export interface RegionDataFrame {
    Level: {
        xPos: number;
        zPos: number;
        LightPopulated: number;
        LastUpdate: Long;
        InhabitedTime: Long;
        HeightMap: number[];
        Biomes: number[];
        Entities: object[];
        TileEntities: TileEntityDataFrame[];
        Sections: RegionSectionDataFrame[];
    };
    DataVersion: number;
}
export {};
`;
module.exports['@xmcl/world/test.d.ts'] = `export {};
`;