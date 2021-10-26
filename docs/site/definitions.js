const definitions = {};
definitions['@xmcl/client/channel.d.ts'] = `\/\// <reference types="node" /> import ByteBuffer from "bytebuffer";
import { EventEmitter } from "events";
import { NetConnectOpts } from "net";
import { Transform, TransformCallback, Writable } from "stream";
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
export declare abstract class PacketInBound extends Transform {
    private buffer;
    protected abstract readPacketLength(bb: ByteBuffer): number;
    _transform(chunk: Buffer, encoding: string, callback: TransformCallback): void;
}
export interface PacketRegistry {
    findCoderById(packetId: number, side: "client" | "server"): Coder<any>;
    getPacketId(message: any, side: "client" | "server"): number;
}
export declare abstract class PacketDecoder extends Transform {
    private client;
    constructor(client: PacketRegistry);
    abstract readPacketId(message: ByteBuffer): number;
    _transform(chunk: Buffer, encoding: string, callback: TransformCallback): void;
}
export declare class PacketEmitter extends Writable {
    private eventBus;
    constructor(eventBus: EventEmitter);
    _write(inst: any, encoding: string, callback: (error?: Error | null) => void): void;
}
export declare abstract class PacketEncoder extends Transform {
    private client;
    constructor(client: PacketRegistry);
    protected abstract writePacketId(bb: ByteBuffer, id: number): void;
    _transform(message: any, encoding: string, callback: TransformCallback): void;
}
export declare abstract class PacketOutbound extends Transform {
    protected abstract writePacketLength(bb: ByteBuffer, len: number): void;
    _transform(packet: Buffer, encoding: string, callback: TransformCallback): void;
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
\/\/# sourceMappingURL=channel.d.ts.map`;
definitions['@xmcl/client/coders.d.ts'] = `\/\// <reference types="long" /> import ByteBuffer from "bytebuffer";
import type { PacketRegistry } from "./channel";
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
    readonly encode: (buffer: ByteBuffer, data: T, context?: PacketRegistry) => void;
    readonly decode: (buffer: ByteBuffer, context?: PacketRegistry) => T;
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
\/\/# sourceMappingURL=coders.d.ts.map`;
definitions['@xmcl/client/index.d.ts'] = `/**  * The client for Minecraft protocol. I can create the connection with Minecraft server and ping the server status.
 *
 * You can use {@link queryStatus} with {@link QueryOptions} to ping a {@link Status} of a server
 *
 * @packageDocumentation
 * @module @xmcl/client
 */
export * from "./coders";
export * from "./packet";
export * from "./channel";
export * from "./status";
export * from "./lan";
\/\/# sourceMappingURL=index.d.ts.map`;
definitions['@xmcl/client/lan.d.ts'] = `\/\// <reference types="node" /> import { RemoteInfo } from "dgram";
import { EventEmitter } from "events";
export declare const LAN_MULTICAST_ADDR = "224.0.2.60";
export declare const LAN_MULTICAST_PORT = 4445;
export interface MinecraftLanDiscover {
    on(channel: "discover", listener: (event: LanServerInfo & {
        remote: RemoteInfo;
    }) => void): this;
    once(channel: "discover", listener: (event: LanServerInfo & {
        remote: RemoteInfo;
    }) => void): this;
    addListener(channel: "discover", listener: (event: LanServerInfo & {
        remote: RemoteInfo;
    }) => void): this;
    removeListener(channel: "discover", listener: (event: LanServerInfo & {
        remote: RemoteInfo;
    }) => void): this;
}
export declare class MinecraftLanDiscover extends EventEmitter {
    private sock;
    constructor();
    bind(): Promise<void>;
    destroy(): Promise<void>;
}
export interface LanServerInfo {
    motd: string;
    port: number;
}
export declare class MinecraftLanBroadcaster {
    readonly servers: LanServerInfo[];
    readonly interval: number;
    private intervalHandle;
    private sock;
    constructor(servers: LanServerInfo[], interval: number);
    boradcast(): void;
    bind(): void;
    destroy(): Promise<void>;
}
\/\/# sourceMappingURL=lan.d.ts.map`;
definitions['@xmcl/client/packet.d.ts'] = `import { State } from "./channel"; import { Coder } from "./coders";
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
\/\/# sourceMappingURL=packet.d.ts.map`;
definitions['@xmcl/client/status.d.ts'] = `import { TextComponent } from "@xmcl/text-component"; import Long from "long";
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
    time: Long.Long;
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
     * see http:\/\/wiki.vg/Protocol_version_numbers
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
 * @see {@link Channel}
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
\/\/# sourceMappingURL=status.d.ts.map`;
definitions['@xmcl/core/diagnose.d.ts'] = `import { ResolvedLibrary, ResolvedVersion } from "./version"; import { MinecraftFolder, MinecraftLocation } from "./folder";
/**
 * Represent a issue for your diagnosed minecraft client.
 */
export interface Issue {
    /**
     * The type of the issue.
     */
    type: "missing" | "corrupted";
    /**
     * The role of the file in Minecraft.
     */
    role: string;
    /**
     * The path of the problematic file.
     */
    file: string;
    /**
     * The useful hint to fix this issue. This should be a human readable string.
     */
    hint: string;
    /**
     * The expected checksum of the file. Can be an empty string if this file is missing or not check checksum at all!
     */
    expectedChecksum: string;
    /**
     * The actual checksum of the file. Can be an empty string if this file is missing or not check checksum at all!
     */
    receivedChecksum: string;
}
export declare type MinecraftIssues = LibraryIssue | MinecraftJarIssue | VersionJsonIssue | AssetIssue | AssetIndexIssue;
/**
 * The library issue represents a corrupted or missing lib.
 * You can use \`Installer.installResolvedLibraries\` to fix this.
 */
export interface LibraryIssue extends Issue {
    role: "library";
    /**
     * The problematic library
     */
    library: ResolvedLibrary;
}
/**
 * The minecraft jar issue represents a corrupted or missing minecraft jar.
 * You can use \`Installer.installVersion\` to fix this.
 */
export interface MinecraftJarIssue extends Issue {
    role: "minecraftJar";
    /**
     * The minecraft version for that jar
     */
    version: string;
}
/**
 * The minecraft jar issue represents a corrupted or missing version jar.
 *
 * This means your version is totally broken, and you should reinstall this version.
 *
 * - If this is just a Minecraft version, you will need to use \`Installer.install\` to re-install Minecraft.
 * - If this is a Forge version, you will need to use \`ForgeInstaller.install\` to re-install.
 * - Others are the same, just re-install
 */
export interface VersionJsonIssue extends Issue {
    role: "versionJson";
    /**
     * The version of version json that has problem.
     */
    version: string;
}
/**
 * The asset issue represents a corrupted or missing minecraft asset file.
 * You can use \`Installer.installResolvedAssets\` to fix this.
 */
export interface AssetIssue extends Issue {
    role: "asset";
    /**
     * The problematic asset
     */
    asset: {
        name: string;
        hash: string;
        size: number;
    };
}
/**
 * The asset index issue represents a corrupted or missing minecraft asset index file.
 * You can use \`Installer.installAssets\` to fix this.
 */
export interface AssetIndexIssue extends Issue {
    role: "assetIndex";
    /**
     * The minecraft version of the asset index
     */
    version: string;
}
export interface MinecraftIssueReport {
    minecraftLocation: MinecraftFolder;
    version: string;
    issues: MinecraftIssues[];
}
/**
 * Diagnose a single file by a certain checksum algorithm. By default, this use sha1
 */
export declare function diagnoseFile<T extends string>({ file, expectedChecksum, role, hint, algorithm }: {
    file: string;
    expectedChecksum: string;
    role: T;
    hint: string;
    algorithm?: string;
}): Promise<{
    readonly type: "missing" | "corrupted";
    readonly role: T;
    readonly file: string;
    readonly expectedChecksum: string;
    readonly receivedChecksum: string;
    readonly hint: string;
} | undefined>;
/**
 * Diagnose the version. It will check the version json/jar, libraries and assets.
 *
 * @param version The version id string
 * @param minecraft The minecraft location
 * @beta
 */
export declare function diagnose(version: string, minecraftLocation: MinecraftLocation): Promise<MinecraftIssueReport>;
/**
 * Diagnose assets currently installed.
 * @param assetObjects The assets object metadata to check
 * @param minecraft The minecraft location
 * @returns The diagnose report
 */
export declare function diagnoseAssets(assetObjects: Record<string, {
    hash: string;
    size: number;
}>, minecraft: MinecraftFolder): Promise<Array<AssetIssue>>;
/**
 * Diagnose all libraries presented in this resolved version.
 *
 * @param resolvedVersion The resolved version to check
 * @param minecraft The minecraft location
 * @returns List of libraries issue
 * @see {@link ResolvedVersion}
 */
export declare function diagnoseLibraries(resolvedVersion: ResolvedVersion, minecraft: MinecraftFolder): Promise<Array<LibraryIssue>>;
export declare function diagnoseAssetIndex(resolvedVersion: ResolvedVersion, minecraft: MinecraftFolder): Promise<AssetIndexIssue | undefined>;
export declare function diagnoseJar(resolvedVersion: ResolvedVersion, minecraft: MinecraftFolder): Promise<MinecraftJarIssue | undefined>;
\/\/# sourceMappingURL=diagnose.d.ts.map`;
definitions['@xmcl/core/folder.d.ts'] = `export interface MinecraftFolder {     readonly root: string;
}
/**
 * The Minecraft folder structure. All method will return the path related to a minecraft root like \`.minecraft\`.
 */
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
\/\/# sourceMappingURL=folder.d.ts.map`;
definitions['@xmcl/core/index.d.ts'] = `/**  * The core package for launching Minecraft.
 * It provides the {@link Version.parse} function to parse Minecraft version,
 * and the {@link launch} function to launch the game.
 *
 * @packageDocumentation
 * @module @xmcl/core
 */
export * from "./launch";
export * from "./version";
export * from "./platform";
export * from "./folder";
export * from "./diagnose";
export { access as _access, exists as _exists, mkdir as _mkdir, readFile as _readFile, writeFile as _writeFile, pipeline as _pipeline, checksum } from "./utils";
\/\/# sourceMappingURL=index.d.ts.map`;
definitions['@xmcl/core/launch.d.ts'] = `\/\// <reference types="node" /> import { ChildProcess, SpawnOptions } from "child_process";
import { EventEmitter } from "events";
import { MinecraftFolder } from "./folder";
import { Platform } from "./platform";
import { ResolvedLibrary, ResolvedVersion } from "./version";
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
 * @see {@link generateArguments}
 * @see {@link launch}
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
     * Support yushi's yggdrasil agent https:\/\/github.com/to2mbn/authlib-injector/wiki
     */
    yggdrasilAgent?: {
        /**
         * The jar file path of the authlib-injector
         */
        jar: string;
        /**
         * The auth server host
         */
        server: string;
        /**
         * The prefetched base64
         */
        prefetched?: string;
    };
    /**
     * Add \`-Dfml.ignoreInvalidMinecraftCertificates=true\` to jvm argument
     */
    ignoreInvalidMinecraftCertificates?: boolean;
    /**
     * Add \`-Dfml.ignorePatchDiscrepancies=true\` to jvm argument
     */
    ignorePatchDiscrepancies?: boolean;
    /**
     * Add extra classpaths
     */
    extraClassPaths?: string[];
    /**
     * The platform of this launch will run. By default, it will fetch the current machine info if this is absent.
     */
    platform?: Platform;
    /**
     * The launcher precheck functions. These will run before it run.
     *
     * This property is only used for \`launch\` function. The \`generateArguments\` function won't use this!
     * @see {@link launch}
     * @see {@link generateArguments}
     */
    prechecks?: LaunchPrecheck[];
}
/**
 * The function to check the game status before the game launched. Will be used in \`launch\` function.
 * @see {@link launch}
 */
export interface LaunchPrecheck {
    (resourcePath: MinecraftFolder, version: ResolvedVersion, option: LaunchOption): Promise<void>;
}
/**
 * Thrown when the version jar is corrupted. This interface only used in \`LaunchPrecheck.checkVersion\`
 * @see {@link LaunchPrecheck.checkVersion}
 */
export interface CorruptedVersionJarError {
    error: "CorruptedVersionJar";
    version: string;
}
/**
 * Thrown when the libraries jar is corrupted. This interface only used in \`LaunchPrecheck.checkLibraries\`
 * @see {@link LaunchPrecheck.checkLibraries}
 */
export interface MissingLibrariesError {
    error: "MissingLibraries";
    libraries: ResolvedLibrary[];
    version: ResolvedVersion;
}
export declare namespace LaunchPrecheck {
    /**
     * The default launch precheck. It will check version jar, libraries and natives.
     */
    const DEFAULT_PRECHECKS: readonly LaunchPrecheck[];
    /**
     * @deprecated
     */
    const Default: readonly LaunchPrecheck[];
    /**
     * Link assets to the assets/virtual/legacy.
     */
    function linkAssets(resource: MinecraftFolder, version: ResolvedVersion, option: LaunchOption): Promise<void>;
    /**
     * Quick check if Minecraft version jar is corrupted
     * @throws {@link CorruptedVersionJarError}
     */
    function checkVersion(resource: MinecraftFolder, version: ResolvedVersion, option: LaunchOption): Promise<void>;
    /**
     * Quick check if there are missed libraries.
     * @throws {@link MissingLibrariesError}
     */
    function checkLibraries(resource: MinecraftFolder, version: ResolvedVersion, option: LaunchOption): Promise<void>;
    /**
     * Ensure the native are correctly extracted in place.
     *
     * It will check native root located in {@link LaunchOption.nativeRoot} if it's presented.
     * Or, it will use the \`<version-id>-native\` under version folder as native root to check.
     *
     * This will automatically extract native if there is not native extracted.
     *
     * @param resource The minecraft directory to extract native
     * @param option If the native root presented here, it will use the root here.
     */
    function checkNatives(resource: MinecraftFolder, version: ResolvedVersion, option: LaunchOption): Promise<void>;
}
export interface BaseServerOptions {
    /**
     * Java executable.
     */
    javaPath: string;
    /**
     * Current working directory. Default is the same with the path.
     */
    cwd?: string;
    /**
     * No gui for the server launch
     */
    nogui?: boolean;
    minMemory?: number;
    maxMemory?: number;
    extraJVMArgs?: string[];
    extraMCArgs?: string[];
    extraExecOption?: SpawnOptions;
}
export interface MinecraftServerOptions extends BaseServerOptions {
    /**
     * Minecraft location.
     */
    path: string;
    /**
     * The version id.
     */
    version: string | ResolvedVersion;
}
/**
 * This is the case you provide the server jar execution path.
 */
export interface ServerOptions extends BaseServerOptions {
    /**
     * The minecraft server exectuable jar file.
     *
     * This is the case like you are launching forge server.
     */
    serverExectuableJarPath: string;
}
export declare function launchServer(options: MinecraftServerOptions | ServerOptions): Promise<ChildProcess>;
/**
 * The Minecraft process watcher. You can inspect Minecraft launch state by this.
 *
 * Generally, there are several cases after you call \`launch\` and get \`ChildProcess\` object
 *
 * 1. child process fire an error, no real process start.
 * 2. child process started, but game crash (code is not 0).
 * 3. cihld process started, game normally exit (code is 0).
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
 * By default, it will use the \`LauncherPrecheck.Default\` to pre-check:
 * - It will also check if the runtime libs are completed, and will extract native libs if needed.
 * - It might throw exception when the version jar is missing/checksum not matched.
 * - It might throw if the libraries/natives are missing.
 *
 * If you DON'T want such precheck, and you want to change it. You can assign the \`prechecks\` property in launch
 *
 * \`\`\`ts
 * launch({ ...otherOptions, prechecks: yourPrechecks });
 * \`\`\`
 *
 * @param options The detail options for this launching.
 * @see [ChildProcess](https:\/\/nodejs.org/api/child_process.html)
 * @see [spawn](https:\/\/nodejs.org/api/spawn.html)
 * @see {@link generateArguments}
 * @see {@link createMinecraftProcessWatcher}
 * @throws {@link CorruptedVersionJarError}
 * @throws {@link MissingLibrariesError}
 */
export declare function launch(options: LaunchOption): Promise<ChildProcess>;
/**
 * Generate the argument for server
 */
export declare function generateArgumentsServer(options: MinecraftServerOptions | ServerOptions): Promise<string[]>;
/**
 * Generate the arguments array by options. This function is useful if you want to launch the process by yourself.
 *
 * This function will **NOT** check if the runtime libs are completed, and **WONT'T** check or extract native libs.
 *
 * If you want to ensure native. Please see {@link LaunchPrecheck.checkNatives}.
 *
 * @param options The launch options.
 * @throws TypeError if options does not fully fulfill the requirement
 */
export declare function generateArguments(options: LaunchOption): Promise<string[]>;
\/\/# sourceMappingURL=launch.d.ts.map`;
definitions['@xmcl/core/platform.d.ts'] = `/**  * The platform information related to current operating system.
 */
export interface Platform {
    /**
     * The system name of the platform. This name is majorly used for download.
     */
    name: "osx" | "linux" | "windows" | "unknown";
    /**
     * The version of the os. It should be the value of \`os.release()\`.
     */
    version: string;
    /**
     * The direct output of \`os.arch()\`. Should look like x86 or x64.
     */
    arch: "x86" | "x64" | string;
}
/**
 * Get Minecraft style platform info. (Majorly used to enable/disable native dependencies)
 */
export declare function getPlatform(): Platform;
\/\/# sourceMappingURL=platform.d.ts.map`;
definitions['@xmcl/core/utils.d.ts'] = `/**  * @ignore
 */
\/\// <reference types="node" />
import { readFile as freadFile, writeFile as fwriteFile, access as faccess, mkdir as fmkdir, link as flink } from "fs";
import { pipeline as pip } from "stream";
/** @internal */
export declare const pipeline: typeof pip.__promisify__;
/** @internal */
export declare const access: typeof faccess.__promisify__;
/** @internal */
export declare const link: typeof flink.__promisify__;
/** @internal */
export declare const readFile: typeof freadFile.__promisify__;
/** @internal */
export declare const writeFile: typeof fwriteFile.__promisify__;
/** @internal */
export declare const mkdir: typeof fmkdir.__promisify__;
/** @internal */
export declare function exists(file: string): Promise<boolean>;
/**
 * Validate the sha1 value of the file
 * @internal
 */
export declare function validateSha1(target: string, hash?: string, strict?: boolean): Promise<boolean>;
/**
 * Return the sha1 of a file
 * @internal
 */
export declare function checksum(target: string, algorithm: string): Promise<any>;
/**
 * @internal
 */
export declare function isNotNull<T>(v: T | undefined): v is T;
\/\/# sourceMappingURL=utils.d.ts.map`;
definitions['@xmcl/core/version.d.ts'] = `import { MinecraftLocation } from "./folder"; import { Platform } from "./platform";
interface PartialResolvedVersion extends Version {
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
 *
 * You can get resolved version of a Minecraft by calling {@link Version.parse}.
 *
 * @see {@link Version.parse}
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
/**
 * The full library info. I can be resolved from path or maven library name.
 *
 * @see {@link LibraryInfo.resolveFromPath} {@link LibraryInfo.resolve}
 */
export interface LibraryInfo {
    readonly groupId: string;
    readonly artifactId: string;
    readonly version: string;
    readonly isSnapshot: boolean;
    /**
     * The file extension. Default is \`jar\`. Some files in forge are \`zip\`.
     */
    readonly type: string;
    /**
     * The classifier. Normally, this is empty. For forge, it can be like \`universal\`, \`installer\`.
     */
    readonly classifier: string;
    /**
     * The maven path.
     */
    readonly path: string;
    /**
     * The original maven name of this library
     */
    readonly name: string;
}
export interface BadVersionJsonError {
    error: "BadVersionJson";
    missing: "MainClass" | "AssetIndex" | "Downloads";
    version: string;
}
export interface CorruptedVersionJsonError {
    error: "CorruptedVersionJson";
    version: string;
    json: string;
}
export interface MissingVersionJsonError {
    error: "MissingVersionJson";
    version: string;
    path: string;
}
export declare type VersionParseError = ((BadVersionJsonError | CorruptedVersionJsonError | MissingVersionJsonError) & Error) | Error;
export declare namespace LibraryInfo {
    /**
     * Resolve the library info from the maven path.
     * @param path The library path. It should look like \`net/minecraftforge/forge/1.0/forge-1.0.jar\`
     */
    function resolveFromPath(path: string): LibraryInfo;
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
     *\`\`\`
     * { "id": "<version-a>", ... }
     * \`\`\`
     * The function might throw multiple parsing errors. You can handle them with type by this:
     * \`\`\`ts
     * try {
     *   await Version.parse(mcPath, version);
     * } catch (e) {
     *   let err = e as VersionParseError;
     *   switch (err.error) {
     *     case "BadVersionJson": \/\/ do things...
     *     \/\/ handle other cases
     *     default: \/\/ this means this is not a VersionParseError, handle error normally.
     *   }
     * }
     * \`\`\`
     *
     * @param minecraftPath The .minecraft path
     * @param version The vesion id.
     * @return The final resolved version detail
     * @throws {@link CorruptedVersionJsonError}
     * @throws {@link MissingVersionJsonError}
     * @throws {@link BadVersionJsonError}
     * @see {@link VersionParseError}
     */
    function parse(minecraftPath: MinecraftLocation, version: string, platofrm?: Platform): Promise<ResolvedVersion>;
    /**
     * Resolve the given version hierarchy into \`ResolvedVersion\`.
     *
     * Some launcher has non-standard version json format to handle hierarchy,
     * and if you want to handle them, you can use this function to parse.
     *
     * @param minecraftPath The path of the Minecraft folder
     * @param hierarchy The version hierarchy, which can be produced by \`normalizeVersionJson\`
     * @throws {@link BadVersionJsonError}
     * @see {@link VersionParseError}
     * @see {@link normalizeVersionJson}
     * @see {@link parse}
     */
    function resolve(minecraftPath: MinecraftLocation, hierarchy: PartialResolvedVersion[]): ResolvedVersion;
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
     * @throws {@link CorruptedVersionJsonError}
     * @throws {@link MissingVersionJsonError}
     */
    function resolveDependency(path: MinecraftLocation, version: string, platform?: Platform): Promise<PartialResolvedVersion[]>;
    function resolveLibrary(lib: Library, platform?: Platform): ResolvedLibrary | undefined;
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
    function normalizeVersionJson(versionString: string, root: string, platform?: Platform): PartialResolvedVersion;
}
/**
 * The raw json format provided by Minecraft. Also the namespace of version operation.
 *
 * Use \`parse\` to parse a Minecraft version json on the disk, and see the detail info of the version.
 *
 * With \`ResolvedVersion\`, you can use the resolved version to launch the game.
 *
 * @see {@link Version.parse}
 * @see {@link launch}
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
export {};
\/\/# sourceMappingURL=version.d.ts.map`;
definitions['@xmcl/curseforge/http/base.d.ts'] = `\/\// <reference types="node" /> import { Agent } from "https";
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
    body?: object;
    userAgent?: Agent;
}) => Promise<{
    body: string;
    statusMessage: string;
    statusCode: number;
}>;
\/\/# sourceMappingURL=base.d.ts.map`;
definitions['@xmcl/curseforge/http/index.browser.d.ts'] = `import { HttpRequester } from "./base"; export declare const httpRequester: HttpRequester;
\/\/# sourceMappingURL=index.browser.d.ts.map`;
definitions['@xmcl/curseforge/http/index.d.ts'] = `import { HttpRequester } from "./base"; export declare const httpRequester: HttpRequester;
\/\/# sourceMappingURL=index.d.ts.map`;
definitions['@xmcl/curseforge/index.d.ts'] = `\/\// <reference types="node" /> import { Agent } from "https";
export interface AddonInfo {
    /**
     * The addon id. You can use this in many functions required the \`addonID\`
     */
    id: number;
    /**
     * The display name of the addon
     */
    name: string;
    /**
     * The list of authors
     */
    authors: Author[];
    /**
     * The attachments. Usually include the project icon and the exmaple images.
     */
    attachments: Attachment[];
    websiteUrl: string;
    /**
     * Game id. Minecraft is 432.
     */
    gameId: number;
    /**
     * One line summery
     */
    summary: string;
    /**
     * The default download file id
     */
    defaultFileId: number;
    downloadCount: number;
    latestFiles: File[];
    /**
     * The category of the project
     */
    categories: ProjectCategory[];
    status: number;
    primaryCategoryId: number;
    /**
     * The big category section
     */
    categorySection: CategorySection;
    slug: string;
    gameVersionLatestFiles: GameVersionLatestFile[];
    isFeatured: boolean;
    popularityScore: number;
    gamePopularityRank: number;
    primaryLanguage: string;
    gameSlug: string;
    gameName: string;
    portalName: string;
    dateModified: string;
    dateCreated: string;
    dateReleased: string;
    isAvailable: boolean;
    isExperiemental: boolean;
}
export interface GameVersionLatestFile {
    gameVersion: string;
    projectFileId: number;
    projectFileName: string;
    fileType: number;
}
export interface CategorySection {
    id: number;
    gameId: number;
    name: string;
    packageType: number;
    path: string;
    initialInclusionPattern: string;
    extraIncludePattern?: any;
    gameCategoryId: number;
}
export interface File {
    /**
     * The fileID
     */
    id: number;
    /**
     * Display name
     */
    displayName: string;
    /**
     * File name. Might be the same with \`displayName\`
     */
    fileName: string;
    /**
     * The date of this file uploaded
     */
    fileDate: string;
    /**
     * # bytes of this file.
     */
    fileLength: number;
    /**
     * Release or type.
     * - \`1\` is the release
     * - \`\`
     */
    releaseType: number;
    fileStatus: number;
    /**
     * Url to download
     */
    downloadUrl: string;
    isAlternate: boolean;
    alternateFileId: number;
    dependencies: any[];
    isAvailable: boolean;
    /**
     * What files inside?
     */
    modules: Module[];
    packageFingerprint: number;
    /**
     * Game version string array, like \`["1.12.2"]\`
     */
    gameVersion: string[];
    sortableGameVersion?: SortableGameVersion[];
    installMetadata?: any;
    changelog?: any;
    hasInstallScript: boolean;
    isCompatibleWithClient: boolean;
    categorySectionPackageType: number;
    restrictProjectFileAccess: number;
    projectStatus: number;
    renderCacheId: number;
    fileLegacyMappingId?: any;
    /**
     * The projectId (addonId)
     */
    projectId: number;
    parentProjectFileId?: any;
    parentFileLegacyMappingId?: any;
    fileTypeId?: any;
    exposeAsAlternative?: any;
    packageFingerprintId: number;
    gameVersionDateReleased: string;
    gameVersionMappingId: number;
    /**
     * A number represents the game version id from curseforge (Not the same with Minecraft version string id).
     */
    gameVersionId: number;
    gameId: number;
    isServerPack: boolean;
    serverPackFileId?: any;
}
export interface SortableGameVersion {
    gameVersionPadded: string;
    gameVersion: string;
    gameVersionReleaseDate: string;
    gameVersionName: string;
}
/**
 * Represent a file in a \`File\`.
 */
export interface Module {
    /**
     * Actually the file name, not the folder
     */
    foldername: string;
    /**
     * A number represent fingerprint
     */
    fingerprint: number;
    type: number;
}
export interface Attachment {
    id: number;
    projectId: number;
    description: string;
    isDefault: boolean;
    /**
     * Small icon
     */
    thumbnailUrl: string;
    /**
     * The title of this attachment
     */
    title: string;
    /**
     * The url. Usually the image url.
     */
    url: string;
    status: number;
}
/**
 * The author info
 */
export interface Author {
    /**
     * The project id of this query
     */
    projectId: number;
    projectTitleId?: any;
    projectTitleTitle?: any;
    /**
     * Display name of the author
     */
    name: string;
    /**
     * The full url of author homepage in curseforge
     */
    url: string;
    /**
     * The id of this author
     */
    id: number;
    userId: number;
    twitchId: number;
}
export interface ProjectCategory {
    categoryId: number;
    name: string;
    url: string;
    avatarUrl: string;
    parentId: number;
    rootId: number;
    projectId: number;
    avatarId: number;
    gameId: number;
}
/**
 * The category in curseforge. For example, "World", "Resource Packs", "Modpacks", "Mods"... and so on..
 */
export interface Category {
    /**
     * The number id of the category. e.g. \`4471\`
     */
    id: number;
    /**
     * The display name of the category. For example, "Resource Packs", "Modpacks", "Mods"...
     */
    name: string;
    /**
     * The slug is used on url path. It should looks like, "modpacks", "texture-packs", "mc-mods"...
     */
    slug: string;
    /**
     * The display icon of the category
     */
    avatarUrl: string;
    /**
     * Last modified date. The string of \`Date\`.
     */
    dateModified: string;
    /**
     * The parent category id (\`Category.id\`)
     */
    parentGameCategoryId: number;
    /**
     * The root category id. Which will be used for \`sectionId\` in search
     *
     * @see {@link SearchOptions.sectionId}
     */
    rootGameCategoryId: number;
    /**
     * The game id. Minecraft is 432.
     */
    gameId: number;
}
/**
 * The search options of the search API.
 *
 * @see {@link searchAddons}
 */
export interface SearchOptions {
    /**
     * The category section id, which is also a category id.
     * You can fetch if from \`getCategories\`.
     *
     * To get availiable categories, you can:
     *
     * \`\`\`ts
     * const cat = await getCategories();
     * const sectionIds = cat
     *  .filter(c => c.gameId === 432) \/\/ 432 is minecraft game id
     *  .filter(c => c.rootGameCategoryId === null).map(c => c.id);
     * \/\/ the sectionIds is all normal sections here
     * \`\`\`
     *
     * @see {@link getCategories}
     */
    sectionId?: number;
    /**
     * This is actually the sub category id of the \`sectionId\`. All the numbers for this should also be fetch by \`getCategories\`.
     *
     * To get availiable values, you can:
     *
     * \`\`\`ts
     * const cat = await getCategories();
     * const sectionId = 6; \/\/ the mods
     * const categoryIds = cat
     *  .filter(c => c.gameId === 432) \/\/ 432 is minecraft game id
     *  .filter(c => c.rootGameCategoryId === sectionId) \/\/ only under the section id
     *  .map(c => c.id);
     * \/\/ Use categoryIds' id to search under the corresponding section id.
     * \`\`\`
     *
     * @see {@link getCategories}
     */
    categoryId?: number;
    /**
     * The game id. The Minecraft is 432.
     *
     * @default 432
     */
    gameId?: number;
    /**
     * The game version. For Minecraft, it should looks lile 1.12.2.
     */
    gameVersion?: string;
    /**
     * The index of the addon, NOT the page!
     *
     * When your page size is 25, if you want to get next page contents, you should have index = 25 to gext 2nd page content.
     *
     * @default 0
     */
    index?: number;
    /**
     * The page size, or the number of the addons in a page.
     *
     * @default 25
     */
    pageSize?: number;
    /**
     * The keyword of search. If this is absent, it just list out the avaiable addons by \`sectionId\` and \`categoryId\`.
     */
    searchFilter?: string;
    /**
     * The way to sort the result. These are commonly used values:
     *
     * - \`1\`, sort by popularity
     * - \`2\`, sort by last updated date
     * - \`3\`, sort by name of the project
     * - \`5\`, sort by total download counts
     *
     * @default 0
     */
    sort?: number;
}
export interface GetFeaturedAddonOptions {
    /**
     * The game id. The Minecraft is 432.
     * @default 432
     */
    gameId?: number;
    /**
     * The # of featured
     */
    featuredCount?: number;
    popularCount?: number;
    updatedCount?: number;
}
/**
 * The options to query
 */
export interface QueryOption {
    /**
     * Additional header
     */
    headers?: Record<string, any>;
    /**
     * The user agent in nodejs of https
     */
    userAgent?: Agent;
}
/**
 * Get the addon by addon Id.
 * @param addonID The id of addon
 * @param options The query options
 */
export declare function getAddonInfo(addonID: number, options?: QueryOption): Promise<AddonInfo>;
/**
 * Get the list of addon by addon ids.
 */
export declare function getAddons(addonIDs: number[], options?: QueryOption): Promise<AddonInfo[]>;
/**
 * List the addons by category/section or search addons by keyword.
 */
export declare function searchAddons(searchOptions: SearchOptions, options?: QueryOption): Promise<AddonInfo[]>;
/**
 * Get the addon project description HTML string.
 *
 * @returns The string of description HTML.
 */
export declare function getAddonDescription(addonID: number, options?: QueryOption): Promise<string>;
/**
 * Get the content of the changelog of a addon's file
 */
export declare function getAddonFileChangelog(addonID: number, fileID: number, options?: QueryOption): Promise<string>;
export declare function getAddonFileInfo(addonID: number, fileID: number, options?: QueryOption): Promise<File[]>;
/**
 * Return the addon file download url string.
 */
export declare function getAddonFileDownloadURL(addonID: number, fileID: number, options?: QueryOption): Promise<string>;
/**
 * Get the file list of the addon.
 */
export declare function getAddonFiles(addonID: number, options?: QueryOption): Promise<File[]>;
/**
 * Get the addon data base timestamp in string of \`Date\`, like "2019-06-09T23:34:29.103Z".
 */
export declare function getAddonDatabaseTimestamp(options?: QueryOption): Promise<string>;
/**
 * Select several addons for the game.
 */
export declare function getFeaturedAddons(getOptions?: GetFeaturedAddonOptions, options?: QueryOption): Promise<AddonInfo[]>;
/**
 * Get the list of category. You can use the \`category.id\` in params of \`searchAddon\` function.
 */
export declare function getCategories(options?: QueryOption): Promise<Category[]>;
/**
 * Get the timestamp of the categories data base.
 * It should return the \`Date\` string like "2019-06-09T23:34:29.103Z"
 */
export declare function getCategoryTimestamp(options?: QueryOption): Promise<any>;
\/\/# sourceMappingURL=index.d.ts.map`;
definitions['@xmcl/forge-site-parser/index.d.ts'] = `/**  * One forge version download info
 */
interface Download {
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
    installer?: Download;
    mdk?: Download;
    universal?: Download;
    source?: Download;
    launcher?: Download;
    ["installer-win"]: Download | undefined;
    /**
     * The type of the forge release. The \`common\` means the normal release.
     */
    type: "buggy" | "recommended" | "common" | "latest";
}
/**
 * Forge webpack contains the forge versions for a Minecraft version.
 */
export interface ForgeWebPage {
    versions: Version[];
    mcversion: string;
}
export {};
\/\/# sourceMappingURL=index.d.ts.map`;
definitions['@xmcl/gamesetting/index.d.ts'] = `/**  * Provide function to {@link parse} the options.txt and also {@link stringify} it into the string.
 *
 * @packageDocumentation
 * @module @xmcl/gamesetting
 */
/**
 * The AmbientOcclusion enum value in options.txt
 */
export declare enum AmbientOcclusion {
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
    version: number;
    invertYMouse: boolean;
    mouseSensitivity: number;
    difficulty: Difficulty;
    renderDistance: RenderDistance;
    particles: Particles;
    fboEnable: boolean;
    fancyGraphics: boolean;
    ao: AmbientOcclusion;
    renderClouds: RenderCloud;
    enableVsync: boolean;
    useVbo: boolean;
    mipmapLevels: MipmapLevel;
    anaglyph3d: boolean;
    fov: number;
    gamma: number;
    saturation: number;
    guiScale: number;
    bobView: boolean;
    maxFps: number;
    fullscreen: boolean;
    resourcePacks: string[];
    incompatibleResourcePacks: string[];
    lastServer: string;
    lang: string;
    chatVisibility: number;
    chatColors: boolean;
    chatLinks: boolean;
    chatLinksPrompt: boolean;
    chatOpacity: number;
    snooperEnabled: boolean;
    hideServerAddress: boolean;
    advancedItemTooltips: boolean;
    pauseOnLostFocus: boolean;
    touchscreen: boolean;
    overrideWidth: number;
    overrideHeight: number;
    heldItemTooltips: boolean;
    chatHeightFocused: number;
    chatHeightUnfocused: number;
    chatScale: number;
    chatWidth: number;
    forceUnicodeFont: boolean;
    reducedDebugInfo: boolean;
    useNativeTransport: boolean;
    entityShadows: boolean;
    mainHand: string;
    attackIndicator: number;
    showSubtitles: boolean;
    realmsNotifications: boolean;
    enableWeakAttacks: boolean;
    autoJump: boolean;
    narrator: number;
    tutorialStep: string;
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
    soundCategory_master: KeyCode;
    soundCategory_music: KeyCode;
    soundCategory_record: KeyCode;
    soundCategory_weather: KeyCode;
    soundCategory_block: KeyCode;
    soundCategory_hostile: KeyCode;
    soundCategory_neutral: KeyCode;
    soundCategory_player: KeyCode;
    soundCategory_ambient: KeyCode;
    soundCategory_voice: KeyCode;
    modelPart_cape: boolean;
    modelPart_jacket: boolean;
    modelPart_left_sleeve: boolean;
    modelPart_right_sleeve: boolean;
    modelPart_left_pants_leg: boolean;
    modelPart_right_pants_leg: boolean;
    modelPart_hat: boolean;
};
export declare type FullFrame = typeof DEFAULT_FRAME;
export declare type Frame = Partial<FullFrame>;
/**
 * Get the default values in options.txt.
 */
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
\/\/# sourceMappingURL=index.d.ts.map`;
definitions['@xmcl/installer/curseforge.d.ts'] = `\/\// <reference types="node" /> import { MinecraftFolder, MinecraftLocation } from "@xmcl/core";
import { Task, TaskGroup } from "@xmcl/task";
import { Entry, ZipFile } from "yauzl";
import { DownloadBaseOptions } from "./http/download";
import { ParallelTaskOptions } from "./utils";
export interface CurseforgeOptions extends DownloadBaseOptions, ParallelTaskOptions {
    /**
     * The function to query a curseforge project downloadable url.
     */
    queryFileUrl?: CurseforgeURLQuery;
    /**
     * Should it replace the override files if the file is existed.
     */
    replaceExisted?: boolean;
    /**
     * Overload the manifest for this installation.
     * It will use this manifest instead of the read manifest from modpack zip to install.
     */
    manifest?: Manifest;
    /**
     * The function to resolve the file path from url and other.
     *
     * By default this will install all the file
     */
    filePathResolver?: FilePathResolver;
}
export interface InstallFileOptions extends DownloadBaseOptions {
    /**
     * The function to query a curseforge project downloadable url.
     */
    queryFileUrl?: CurseforgeURLQuery;
}
declare type InputType = string | Buffer | {
    zip: ZipFile;
    entries: Entry[];
};
export interface Manifest {
    manifestType: string;
    manifestVersion: number;
    minecraft: {
        /**
         * Minecraft version
         */
        version: string;
        libraries?: string;
        /**
         * Can be forge
         */
        modLoaders: {
            id: string;
            primary: boolean;
        }[];
    };
    name: string;
    version: string;
    author: string;
    files: {
        projectID: number;
        fileID: number;
        required: boolean;
    }[];
    overrides: string;
}
export interface File {
    projectID: number;
    fileID: number;
}
export declare class BadCurseforgeModpackError extends Error {
    modpack: InputType;
    /**
     * What required entry is missing in modpack.
     */
    entry: string;
    error: string;
    constructor(modpack: InputType, 
    /**
     * What required entry is missing in modpack.
     */
    entry: string);
}
/**
 * Read the mainifest data from modpack
 * @throws {@link BadCurseforgeModpackError}
 */
export declare function readManifestTask(input: InputType): Task<Manifest>;
/**
 * Read the mainifest data from modpack
 * @throws {@link BadCurseforgeModpackError}
 */
export declare function readManifest(zip: InputType): Promise<Manifest>;
export declare type FilePathResolver = (projectId: number, fileId: number, minecraft: MinecraftFolder, url: string) => string | Promise<string>;
export declare type CurseforgeURLQuery = (projectId: number, fileId: number) => Promise<string>;
export declare type CurseforgeFileTypeQuery = (projectId: number) => Promise<"mods" | "resourcepacks">;
export declare function createDefaultCurseforgeQuery(): CurseforgeURLQuery;
/**
 * Install curseforge modpack to a specific Minecraft location.
 *
 * @param zip The curseforge modpack zip buffer or file path
 * @param minecraft The minecraft location
 * @param options The options for query curseforge
 */
export declare function installCurseforgeModpack(zip: InputType, minecraft: MinecraftLocation, options?: CurseforgeOptions): Promise<Manifest>;
export declare class DownloadCurseforgeFilesTask extends TaskGroup<void> {
    readonly manifest: Manifest;
    readonly minecraft: MinecraftFolder;
    readonly options: CurseforgeOptions;
    constructor(manifest: Manifest, minecraft: MinecraftFolder, options: CurseforgeOptions);
    protected runTask(): Promise<void>;
}
/**
 * Install curseforge modpack to a specific Minecraft location.
 *
 * This will NOT install the Minecraft version in the modpack, and will NOT install the forge or other modload listed in modpack!
 * Please resolve them by yourself.
 *
 * @param input The curseforge modpack zip buffer or file path
 * @param minecraft The minecraft location
 * @param options The options for query curseforge
 * @throws {@link BadCurseforgeModpackError}
 */
export declare function installCurseforgeModpackTask(input: InputType, minecraft: MinecraftLocation, options?: CurseforgeOptions): import("@xmcl/task").TaskRoutine<Manifest>;
/**
 * Install a cureseforge xml file to a specific locations
 */
export declare function installCurseforgeFile(file: File, destination: string, options?: InstallFileOptions): Promise<void>;
/**
 * Install a cureseforge xml file to a specific locations
 */
export declare function installCurseforgeFileTask(file: File, destination: string, options?: InstallFileOptions): import("@xmcl/task").TaskRoutine<void>;
export {};
\/\/# sourceMappingURL=curseforge.d.ts.map`;
definitions['@xmcl/installer/diagnose.d.ts'] = `import { Issue, LibraryIssue, MinecraftFolder, MinecraftLocation } from "@xmcl/core"; import { InstallProfile, PostProcessor } from "./profile";
export declare type InstallIssues = ProcessorIssue | LibraryIssue;
/**
 * The processor issue
 */
export interface ProcessorIssue extends Issue {
    role: "processor";
    /**
     * The processor
     */
    processor: PostProcessor;
}
export interface InstallProfileIssueReport {
    minecraftLocation: MinecraftFolder;
    installProfile: InstallProfile;
    issues: InstallIssues[];
}
/**
 * Diagnose a install profile status. Check if it processor output correctly processed.
 *
 * This can be used for check if forge correctly installed when minecraft >= 1.13
 * @beta
 *
 * @param installProfile The install profile.
 * @param minecraftLocation The minecraft location
 */
export declare function diagnoseInstall(installProfile: InstallProfile, minecraftLocation: MinecraftLocation): Promise<InstallProfileIssueReport>;
\/\/# sourceMappingURL=diagnose.d.ts.map`;
definitions['@xmcl/installer/downloadTask.d.ts'] = `import { AbortableTask } from "@xmcl/task"; import { Download, DownloadOptions } from "./http/download";
import { StatusController } from "./http/status";
export declare class DownloadTask extends AbortableTask<void> implements StatusController {
    readonly download: Download;
    protected abort: (isCancelled: boolean) => void;
    constructor(options: DownloadOptions);
    reset(progress: number, total: number): void;
    onProgress(chunkSize: number, progress: number): void;
    protected process(): Promise<void>;
    protected isAbortedError(e: any): boolean;
}
\/\/# sourceMappingURL=downloadTask.d.ts.map`;
definitions['@xmcl/installer/fabric.d.ts'] = `import { MinecraftLocation } from "@xmcl/core"; import { Timestamped } from "./http/fetch";
import { InstallOptions } from "./utils";
export declare const YARN_MAVEN_URL = "https:\/\/maven.fabricmc.net/net/fabricmc/yarn/maven-metadata.xml";
export declare const LOADER_MAVEN_URL = "https:\/\/maven.fabricmc.net/net/fabricmc/fabric-loader/maven-metadata.xml";
/**
 * Fabric Yarn version list
 * @see https:\/\/github.com/FabricMC/yarn
 */
export interface FabricYarnVersionList extends Timestamped {
    versions: FabricArtifactVersion[];
}
/**
 * Fabric mod loader version list
 * @see https:\/\/fabricmc.net/
 */
export interface FabricLoaderVersionList extends Timestamped {
    versions: FabricArtifactVersion[];
}
export interface FabricArtifactVersion {
    gameVersion?: string;
    separator?: string;
    build?: number;
    maven: string;
    version: string;
    stable: boolean;
}
export interface FabricArtifacts {
    mappings: FabricArtifactVersion[];
    loader: FabricArtifactVersion[];
}
export interface FabricLoaderArtifact {
    loader: FabricArtifactVersion;
    intermediary: FabricArtifactVersion;
    launcherMeta: {
        version: number;
        libraries: {
            client: {
                name: string;
                url: string;
            }[];
            common: {
                name: string;
                url: string;
            }[];
            server: {
                name: string;
                url: string;
            }[];
        };
        mainClass: {
            client: string;
            server: string;
        };
    };
}
export declare const DEFAULT_FABRIC_API = "https:\/\/meta.fabricmc.net/v2";
/**
 * Get all the artifacts provided by fabric
 * @param remote The fabric API host
 * @beta
 */
export declare function getFabricArtifacts(remote?: string): Promise<FabricArtifacts>;
/**
 * Get fabric-yarn artifact list
 * @param remote The fabric API host
 * @beta
 */
export declare function getYarnArtifactList(remote?: string): Promise<FabricArtifactVersion[]>;
/**
 * Get fabric-yarn artifact list by Minecraft version
 * @param minecraft The Minecraft version
 * @param remote The fabric API host
 * @beta
 */
export declare function getYarnArtifactListFor(minecraft: string, remote?: string): Promise<FabricArtifactVersion[]>;
/**
 * Get fabric-loader artifact list
 * @param remote The fabric API host
 * @beta
 */
export declare function getLoaderArtifactList(remote?: string): Promise<FabricArtifactVersion[]>;
/**
 * Get fabric-loader artifact list by Minecraft version
 * @param minecraft The minecraft version
 * @param remote The fabric API host
 * @beta
 */
export declare function getLoaderArtifactListFor(minecraft: string, remote?: string): Promise<FabricLoaderArtifact[]>;
/**
 * Get fabric-loader artifact list by Minecraft version
 * @param minecraft The minecraft version
 * @param loader The yarn-loader version
 * @param remote The fabric API host
 * @beta
 */
export declare function getFabricLoaderArtifact(minecraft: string, loader: string, remote?: string): Promise<FabricLoaderArtifact>;
/**
 * Get or refresh the yarn version list.
 * @beta
 */
export declare function getYarnVersionListFromXML(option?: {
    /**
     * If this presents, it will send request with the original list timestamp.
     *
     * If the server believes there is no modification after the original one,
     * it will directly return the orignal one.
     */
    original?: FabricYarnVersionList;
    /**
     * remote maven xml url of this request
     */
    remote?: string;
}): Promise<FabricYarnVersionList>;
/**
 * Get or refresh the fabric mod loader version list.
 * @beta
 */
export declare function getLoaderVersionListFromXML(option: {
    /**
     * If this presents, it will send request with the original list timestamp.
     *
     * If the server believes there is no modification after the original one,
     * it will directly return the orignal one.
     */
    original?: FabricLoaderVersionList;
    /**
     * remote maven xml url of this request
     */
    remote?: string;
}): Promise<FabricLoaderVersionList>;
/**
 * Install the fabric to the client. Notice that this will only install the json.
 * You need to call \`Installer.installDependencies\` to get a full client.
 * @param yarnVersion The yarn version
 * @param loaderVersion The fabric loader version
 * @param minecraft The minecraft location
 * @returns The installed version id
 */
export declare function installFabricYarnAndLoader(yarnVersion: string, loaderVersion: string, minecraft: MinecraftLocation, options?: InstallOptions): Promise<string>;
export interface FabricInstallOptions extends InstallOptions {
    side?: "client" | "server";
    yarnVersion?: string | FabricArtifactVersion;
}
/**
 * Generate fabric version json to the disk according to yarn and loader
 * @param side Client or server
 * @param yarnVersion The yarn version string or artifact
 * @param loader The loader artifact
 * @param minecraft The Minecraft Location
 * @param options The options
 * @beta
 */
export declare function installFabric(loader: FabricLoaderArtifact, minecraft: MinecraftLocation, options?: FabricInstallOptions): Promise<string>;
\/\/# sourceMappingURL=fabric.d.ts.map`;
definitions['@xmcl/installer/forge.d.ts'] = `import { MinecraftFolder, MinecraftLocation } from "@xmcl/core"; import { Task } from "@xmcl/task";
import { Entry, ZipFile } from "yauzl";
import { DownloadTask } from "./downloadTask";
import { Timestamped } from "./http/fetch";
import { LibraryOptions } from "./minecraft";
import { InstallProfileOption } from "./profile";
import { InstallOptions as InstallOptionsBase } from "./utils";
export interface ForgeVersionList extends Timestamped {
    mcversion: string;
    versions: ForgeVersion[];
}
/**
 * The forge version metadata to download a forge
 */
export interface ForgeVersion {
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
    type: "buggy" | "recommended" | "common" | "latest";
}
/**
 * All the useful entries in forge installer jar
 */
export interface ForgeInstallerEntries {
    /**
     *  maven/net/minecraftforge/forge/\${forgeVersion}/forge-\${forgeVersion}.jar
     */
    forgeJar?: Entry;
    /**
     *  maven/net/minecraftforge/forge/\${forgeVersion}/forge-\${forgeVersion}-universal.jar
     */
    forgeUniversalJar?: Entry;
    /**
     * data/client.lzma
     */
    clientLzma?: Entry;
    /**
     * data/server.lzma
     */
    serverLzma?: Entry;
    /**
     * install_profile.json
     */
    installProfileJson?: Entry;
    /**
     * version.json
     */
    versionJson?: Entry;
    /**
     * forge-\${forgeVersion}-universal.jar
     */
    legacyUniversalJar?: Entry;
    /**
     * data/run.sh
     */
    runSh?: Entry;
    /**
     * data/run.bat
     */
    runBat?: Entry;
    /**
     * data/unix_args.txt
     */
    unixArgs?: Entry;
    /**
     * data/user_jvm_args.txt
     */
    userJvmArgs?: Entry;
    /**
     * data/win_args.txt
     */
    winArgs?: Entry;
}
export declare type ForgeInstallerEntriesPattern = ForgeInstallerEntries & Required<Pick<ForgeInstallerEntries, "versionJson" | "installProfileJson">>;
export declare type ForgeLegacyInstallerEntriesPattern = Required<Pick<ForgeInstallerEntries, "installProfileJson" | "legacyUniversalJar">>;
declare type RequiredVersion = {
    /**
     * The installer info.
     *
     * If this is not presented, it will genreate from mcversion and forge version.
     */
    installer?: {
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
};
export declare const DEFAULT_FORGE_MAVEN = "http:\/\/files.minecraftforge.net/maven";
/**
 * The options to install forge.
 */
export interface InstallForgeOptions extends LibraryOptions, InstallOptionsBase, InstallProfileOption {
}
export declare class DownloadForgeInstallerTask extends DownloadTask {
    readonly installJarPath: string;
    constructor(forgeVersion: string, installer: RequiredVersion["installer"], minecraft: MinecraftFolder, options: InstallForgeOptions);
}
export declare function isLegacyForgeInstallerEntries(entries: ForgeInstallerEntries): entries is ForgeLegacyInstallerEntriesPattern;
export declare function isForgeInstallerEntries(entries: ForgeInstallerEntries): entries is ForgeInstallerEntriesPattern;
/**
 * Walk the forge installer file to find key entries
 * @param zip THe forge instal
 * @param forgeVersion Forge version to install
 */
export declare function walkForgeInstallerEntries(zip: ZipFile, forgeVersion: string): Promise<ForgeInstallerEntries>;
export declare class BadForgeInstallerJarError extends Error {
    jarPath: string;
    /**
     * What entry in jar is missing
     */
    entry?: string | undefined;
    error: string;
    constructor(jarPath: string, 
    /**
     * What entry in jar is missing
     */
    entry?: string | undefined);
}
/**
 * Install forge to target location.
 * Installation task for forge with mcversion >= 1.13 requires java installed on your pc.
 * @param version The forge version meta
 * @returns The installed version name.
 * @throws {@link BadForgeInstallerJarError}
 */
export declare function installForge(version: RequiredVersion, minecraft: MinecraftLocation, options?: InstallForgeOptions): Promise<string>;
/**
 * Install forge to target location.
 * Installation task for forge with mcversion >= 1.13 requires java installed on your pc.
 * @param version The forge version meta
 * @returns The task to install the forge
 * @throws {@link BadForgeInstallerJarError}
 */
export declare function installForgeTask(version: RequiredVersion, minecraft: MinecraftLocation, options?: InstallForgeOptions): Task<string>;
/**
 * Query the webpage content from files.minecraftforge.net.
 *
 * You can put the last query result to the fallback option. It will check if your old result is up-to-date.
 * It will request a new page only when the fallback option is outdated.
 *
 * @param option The option can control querying minecraft version, and page caching.
 */
export declare function getForgeVersionList(option?: {
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
    original?: ForgeVersionList;
}): Promise<ForgeVersionList>;
export {};
\/\/# sourceMappingURL=forge.d.ts.map`;
definitions['@xmcl/installer/http/abort.d.ts'] = `export interface AbortSignal {     readonly aborted: boolean;
    addEventListener(event: string, handler: () => void): this;
    removeEventListener(event: string, handler: () => void): this;
}
export declare function resolveAbortSignal(signal?: AbortSignal): AbortSignal;
\/\/# sourceMappingURL=abort.d.ts.map`;
definitions['@xmcl/installer/http/agents.d.ts'] = `\/\// <reference types="node" /> import { Agent as HttpAgent } from "http";
import { Agent as HttpsAgent } from "https";
/**
 * The http(s) agents object for requesting
 */
export interface Agents {
    http?: HttpAgent;
    https?: HttpsAgent;
}
export interface CreateAgentsOptions {
    /**
     * The suggested max concurrency of the download. This is not a strict criteria.
     *
     * This is used to generate the \`agents\` maxSocket.
     * If \`agents\` is assigned, this will be ignore.
     */
    maxSocket?: number;
    /**
     * The suggested max concurrency of the download. This is not a strict criteria.
     *
     * This is used to generate the \`agents\` maxFreeSocket.
     * If \`agents\` is assigned, this will be ignore.
     */
    maxFreeSocket?: number;
}
export declare function isAgents(agents?: Agents | CreateAgentsOptions): agents is Agents;
export declare function resolveAgents(agents?: Agents | CreateAgentsOptions): Agents;
/**
 * Default create agents object
 */
export declare function createAgents(options?: CreateAgentsOptions): {
    http: HttpAgent;
    https: HttpsAgent;
};
export declare function withAgents<T extends {
    agents?: Agents | CreateAgentsOptions;
}, R>(options: T, scope: (options: T) => R): Promise<R>;
\/\/# sourceMappingURL=agents.d.ts.map`;
definitions['@xmcl/installer/http/download.d.ts'] = `\/\// <reference types="node" /> import { URL } from "url";
import { AbortSignal } from "./abort";
import { Agents, CreateAgentsOptions } from "./agents";
import { ResourceMetadata } from "./metadata";
import { DefaultRetryHandlerOptions, RetryHandler } from "./retry";
import { DefaultSegmentPolicyOptions, Segment, SegmentPolicy } from "./segment";
import { StatusController } from "./status";
import { ChecksumValidatorOptions, Validator } from "./validator";
export interface DownloadBaseOptions {
    /**
     * The agent of the request
     */
    agents?: Agents | CreateAgentsOptions;
    /**
     * The divide segment options
     */
    segmentPolicy?: SegmentPolicy | DefaultSegmentPolicyOptions;
    /**
     * The retry handler
     */
    retryHandler?: RetryHandler | DefaultRetryHandlerOptions;
    /**
     * The header of the request
     */
    headers?: Record<string, any>;
}
export interface DownloadOptions extends DownloadBaseOptions {
    /**
     * The url or urls (fallback) of the resource
     */
    url: string | string[];
    /**
     * The header of the request
     */
    headers?: Record<string, any>;
    /**
     * If the download is aborted, and want to recover, you can use this option to recover the download
     */
    segments?: Segment[];
    /**
     * If the download is aborted, and want to recover, you can use this option to recover the download
     */
    metadata?: ResourceMetadata;
    /**
     * Where the file will be downloaded to
     */
    destination: string;
    /**
     * The status controller. If you want to track download progress, you should use this.
     */
    statusController?: StatusController;
    /**
     * The validator, or the options to create a validator based on checksum.
     */
    validator?: Validator | ChecksumValidatorOptions;
}
/**
 * Download url or urls to a file path. This process is abortable, it's compatible with the dom like \`AbortSignal\`.
 */
export declare function download(options: DownloadOptions): Promise<void>;
export declare function createDownload(options: DownloadOptions): Download;
export declare class Download {
    /**
     * The original request url with fallback
     */
    readonly urls: string[];
    /**
     * The headers of the request
     */
    readonly headers: Record<string, any>;
    /**
     * The agent of the request
     */
    readonly agents: Agents;
    /**
     * Where the file download to
     */
    readonly destination: string;
    /**
    * The current download status
    */
    protected segments: Segment[];
    /**
     * The cached resource metadata
     */
    protected metadata: ResourceMetadata | undefined;
    protected segmentPolicy: SegmentPolicy;
    protected statusController: StatusController;
    protected retryHandler: RetryHandler;
    protected validator: Validator;
    /**
     * current fd
     */
    protected fd: number;
    constructor(
    /**
     * The original request url with fallback
     */
    urls: string[], 
    /**
     * The headers of the request
     */
    headers: Record<string, any>, 
    /**
     * The agent of the request
     */
    agents: Agents, 
    /**
     * Where the file download to
     */
    destination: string, 
    /**
    * The current download status
    */
    segments: Segment[], 
    /**
     * The cached resource metadata
     */
    metadata: ResourceMetadata | undefined, segmentPolicy: SegmentPolicy, statusController: StatusController, retryHandler: RetryHandler, validator: Validator);
    protected updateMetadata(url: URL): Promise<ResourceMetadata>;
    protected processDownload(metadata: ResourceMetadata, abortSignal: AbortSignal): Promise<void>;
    protected downloadUrl(url: string, abortSignal: AbortSignal): Promise<void>;
    /**
     * Start to download
     */
    start(abortSignal?: AbortSignal): Promise<void>;
}
\/\/# sourceMappingURL=download.d.ts.map`;
definitions['@xmcl/installer/http/error.d.ts'] = `import { ResourceMetadata } from "./metadata"; import { Segment } from "./segment";
export declare type DownloadFailedReason = "DownloadAborted" | "DownloadValidationFailed" | "GeneralDownloadException" | NetworkErrorType;
/**
 * Download
 */
export declare class DownloadError extends Error {
    readonly error: DownloadFailedReason;
    readonly metadata: ResourceMetadata | undefined;
    readonly headers: Record<string, any>;
    readonly destination: string;
    readonly segments: Segment[];
    readonly segmentErrors: any[];
    constructor(error: DownloadFailedReason, metadata: ResourceMetadata | undefined, headers: Record<string, any>, destination: string, segments: Segment[], segmentErrors: any[]);
}
export declare type NetworkErrorType = "ConnectionReset" | "ConnectionTimeout" | "OperationCancelled" | "ProtocolError";
export declare function resolveNetworkErrorType(e: any): NetworkErrorType | undefined;
/**
 * A simple util function to determine if this is a common network condition error.
 * @param e Error object
 */
export declare function isCommonNetworkError(e: any): boolean;
\/\/# sourceMappingURL=error.d.ts.map`;
definitions['@xmcl/installer/http/fetch.d.ts'] = `import { Agents } from "./agents"; export interface Timestamped {
    timestamp: string;
}
export interface FetchOptions {
    method: "GET";
    headers: Record<string, string | string[]>;
}
export declare function fetchText(url: string, agent?: Agents): Promise<string>;
export declare function fetchJson(url: string, agent?: Agents): Promise<any>;
export declare function getIfUpdate(url: string, timestamp?: string, agent?: Agents): Promise<{
    timestamp: string;
    content: string | undefined;
}>;
export declare function getAndParseIfUpdate<T extends Timestamped>(url: string, parser: (s: string) => any, lastObject: T | undefined): Promise<T>;
export declare function getLastModified(url: string, timestamp: string | undefined, agent?: Agents): Promise<readonly [true, string | undefined] | readonly [false, string | undefined]>;
\/\/# sourceMappingURL=fetch.d.ts.map`;
definitions['@xmcl/installer/http/metadata.d.ts'] = `\/\// <reference types="node" /> import { Agents } from "./agents";
import { URL } from "url";
export interface ResourceMetadata {
    url: URL;
    isAcceptRanges: boolean;
    contentLength: number;
    lastModified: string | undefined;
    eTag: string | undefined;
}
export declare class FetchMetadataError extends Error {
    readonly error: "FetchResourceNotFound" | "BadResourceRequest" | "FetchResourceServerUnavaiable";
    readonly statusCode: number;
    readonly url: string;
    constructor(error: "FetchResourceNotFound" | "BadResourceRequest" | "FetchResourceServerUnavaiable", statusCode: number, url: string, message: string);
}
export declare function getMetadata(srcUrl: URL, _headers: Record<string, any>, agents: Agents, useGet?: boolean): Promise<ResourceMetadata>;
\/\/# sourceMappingURL=metadata.d.ts.map`;
definitions['@xmcl/installer/http/retry.d.ts'] = `import { DownloadError } from "./error"; import { ValidationError } from "./validator";
/**
 * The handler that decide whether
 */
export interface RetryHandler {
    retry(url: string, attempt: number, error: ValidationError): boolean | Promise<boolean>;
    retry(url: string, attempt: number, error: DownloadError): boolean | Promise<boolean>;
    /**
     * You should decide whether we should retry the download again?
     *
     * @param url The current downloading url
     * @param attempt How many time it try to retry download? The first retry will be \`1\`.
     * @param error The error object thrown during this download. It can be {@link DownloadError} or \${@link ValidationError}.
     * @returns If we should retry and download it again.
     */
    retry(url: string, attempt: number, error: any): boolean | Promise<boolean>;
}
export interface DefaultRetryHandlerOptions {
    /**
     * The max retry count
     */
    maxRetryCount?: number;
    /**
     * Should we retry on the error
     */
    shouldRetry?: (e: any) => boolean;
}
export declare function isRetryHandler(options?: DefaultRetryHandlerOptions | RetryHandler): options is RetryHandler;
export declare function resolveRetryHandler(options?: DefaultRetryHandlerOptions | RetryHandler): RetryHandler;
/**
 * Create a simple count based retry handler
 * @param maxRetryCount The max count we should try
 * @param shouldRetry Should the error be retry
 */
export declare function createRetryHandler(maxRetryCount: number, shouldRetry: (e: any) => boolean): RetryHandler;
\/\/# sourceMappingURL=retry.d.ts.map`;
definitions['@xmcl/installer/http/segment.d.ts'] = `export interface Segment {     start: number;
    end: number;
}
export interface SegmentPolicy {
    computeSegments(contentLength: number): Segment[];
}
export declare function isSegmentPolicy(segmentOptions?: SegmentPolicy | DefaultSegmentPolicyOptions): segmentOptions is SegmentPolicy;
export declare function resolveSegmentPolicy(segmentOptions?: SegmentPolicy | DefaultSegmentPolicyOptions): SegmentPolicy;
export interface DefaultSegmentPolicyOptions {
    /**
     * The minimum bytes a segment should have.
     * @default 2MB
     */
    segmentThreshold?: number;
}
export declare class DefaultSegmentPolicy implements SegmentPolicy {
    readonly segmentThreshold: number;
    readonly concurrency: number;
    constructor(segmentThreshold: number, concurrency: number);
    computeSegments(total: number): Segment[];
}
\/\/# sourceMappingURL=segment.d.ts.map`;
definitions['@xmcl/installer/http/status.d.ts'] = `/**  * The controller that maintain the download status
 */
export interface StatusController {
    readonly total: number;
    readonly progress: number;
    reset(progress: number, total: number): void;
    onProgress(chunkSize: number, progress: number): void;
}
export declare function createStatusController(): StatusController;
export declare function resolveStatusController(controller?: StatusController): StatusController;
\/\/# sourceMappingURL=status.d.ts.map`;
definitions['@xmcl/installer/http/utils.d.ts'] = `\/\// <reference types="node" /> import { Agent as HttpAgent, ClientRequest, IncomingMessage, RequestOptions } from "http";
import { Agent as HttpsAgent } from "https";
import { URL } from "url";
export declare function isValidProtocol(protocol: string | undefined | null): protocol is "http:" | "https:";
export declare function urlToRequestOptions(url: URL): RequestOptions;
export declare function format(url: RequestOptions): string;
export declare function fetch(options: RequestOptions, agents?: {
    http?: HttpAgent;
    https?: HttpsAgent;
}): Promise<{
    request: ClientRequest;
    message: IncomingMessage;
}>;
/**
 * Join two urls
 */
export declare function joinUrl(a: string, b: string): string;
export declare function checksumFromFd(fd: number, destination: string, algorithm: string): Promise<any>;
\/\/# sourceMappingURL=utils.d.ts.map`;
definitions['@xmcl/installer/http/validator.d.ts'] = `export interface Validator {     /**
     * Validate the download result. It should throw \`ValidationError\` if validation failed.
     *
     * @param fd The file desciprtor
     * @param destination The result file
     * @param url The url where the file downloaded from
     */
    validate(fd: number, destination: string, url: string): Promise<void>;
}
export declare class ChecksumValidator implements Validator {
    protected checksum?: ChecksumValidatorOptions | undefined;
    constructor(checksum?: ChecksumValidatorOptions | undefined);
    validate(fd: number, destination: string, url: string): Promise<void>;
}
export declare function isValidator(options?: Validator | ChecksumValidatorOptions): options is Validator;
export declare function resolveValidator(options?: ChecksumValidatorOptions | Validator): Validator;
export interface ChecksumValidatorOptions {
    algorithm: string;
    hash: string;
}
export declare class ZipValidator implements Validator {
    validate(fd: number, destination: string, url: string): Promise<void>;
}
export declare class JsonValidator implements Validator {
    validate(fd: number, destination: string, url: string): Promise<void>;
}
export declare class ValidationError extends Error {
    readonly error: string;
    constructor(error: string, message?: string);
}
export declare class ChecksumNotMatchError extends ValidationError {
    readonly algorithm: string;
    readonly expect: string;
    readonly actual: string;
    readonly file: string;
    readonly source?: string | undefined;
    constructor(algorithm: string, expect: string, actual: string, file: string, source?: string | undefined);
}
\/\/# sourceMappingURL=validator.d.ts.map`;
definitions['@xmcl/installer/http.d.ts'] = `\/\// <reference types="node" /> import { TaskLooped } from "@xmcl/task";
import { WriteStream } from "fs";
import { Agent as HttpAgent, ClientRequest, IncomingMessage } from "http";
import { Agent as HttpsAgent } from "https";
/**
 * The http(s) agents object for requesting
 */
export interface Agents {
    http?: HttpAgent;
    https?: HttpsAgent;
}
export interface Timestamped {
    timestamp: string;
}
export declare class ChecksumNotMatchError extends Error {
    readonly algorithm: string;
    readonly expect: string;
    readonly actual: string;
    readonly file: string;
    constructor(algorithm: string, expect: string, actual: string, file: string);
}
export declare function isValidProtocol(protocol: string | undefined | null): protocol is "http:" | "https:";
/**
 * Join two urls
 */
export declare function joinUrl(a: string, b: string): string;
export declare function fetchText(url: string, agent?: Agents): Promise<string>;
export declare function fetchJson(url: string, agent?: Agents): Promise<any>;
export declare function getIfUpdate(url: string, timestamp?: string, agent?: Agents): Promise<{
    timestamp: string;
    content: string | undefined;
}>;
export declare function getAndParseIfUpdate<T extends Timestamped>(url: string, parser: (s: string) => any, lastObject: T | undefined): Promise<T>;
export declare function getLastModified(url: string, timestamp: string | undefined, agent?: Agents): Promise<readonly [true, string | undefined] | readonly [false, string | undefined]>;
export interface Segment {
    start: number;
    end?: number;
}
export interface DownloadBaseOptions {
    /**
     * The header of the request
     */
    headers?: Record<string, any>;
    /**
     * The agent of the request
     */
    agents?: Agents;
    /**
     * The minimum bytes a segment should have.
     * @default 2MB
     */
    segmentThreshold?: number;
    /**
     * Decide should downloader redownload and overwrite existed file.
     *
     * It has such options:
     *
     * - \`checksumNotMatch\`: Only the file with checksum provided and not matched will be redownload.
     * - \`checksumNotMatchOrEmpty\`: Not only when the file checksum is not matched, but also when the file has no checksum, the file will be redownloaded.
     * - \`always\`: Always redownload files.
     *
     * @default "checksumNotMatch"
     */
    overwriteWhen?: "checksumNotMatchOrEmpty" | "checksumNotMatch" | "always";
    /**
     * The amount of time to retry if failed
     */
    retry?: number;
}
export interface DownloadSingleUrlOptions extends DownloadBaseOptions {
    destination: string;
    url: string;
    /**
    * The checksum info of the file
    */
    checksum?: {
        algorithm: string;
        hash: string;
    };
}
export interface DownloadMultiUrlOptions extends DownloadBaseOptions {
    destination: string;
    urls: string[];
    /**
    * The checksum info of the file
    */
    checksum?: {
        algorithm: string;
        hash: string;
    };
}
export interface DownloadFromPathOptions extends DownloadBaseOptions {
    destination: string;
    path: string;
    /**
    * The checksum info of the file
    */
    checksum?: {
        algorithm: string;
        hash: string;
    };
}
/**
 */
export interface DownloadCommonOptions extends DownloadBaseOptions {
    /**
     * Should throw the donwload process immediately after ANY resource download failed.
     */
    throwErrorImmediately?: boolean;
    /**
     * The suggested max concurrency of the download. This is not a strict criteria.
     *
     * This is used to generate the \`agents\` maxSocket.
     * If \`agents\` is assigned, this will be ignore.
     */
    maxSocket?: number;
    /**
     * The suggested max concurrency of the download. This is not a strict criteria.
     *
     * This is used to generate the \`agents\` maxFreeSocket.
     * If \`agents\` is assigned, this will be ignore.
     */
    maxFreeSocket?: number;
    /**
     * Number of retry count if download failed
     */
    retry?: number;
}
interface Connections {
    request: ClientRequest;
    response: IncomingMessage;
}
export declare class DownloadTask extends TaskLooped<Segment[]> {
    protected segments: Segment[];
    protected outputs: WriteStream[];
    protected connections: Connections[];
    protected retry: number;
    /**
     * The original request url
     */
    protected originalUrl: string;
    /**
    * The checksum info of the file
    */
    protected checksum?: {
        algorithm: string;
        hash: string;
    };
    /**
     * The header of the request
     */
    protected headers: Record<string, any>;
    /**
     * The agent of the request
     */
    protected agents: Agents;
    /**
     * The minimum bytes a segment should have.
     * @default 2MB
     */
    protected segmentThreshold: number;
    /**
     * Decide should downloader redownload and overwrite existed file.
     *
     * It has such options:
     *
     * - \`checksumNotMatch\`: Only the file with checksum provided and not matched will be redownload.
     * - \`checksumNotMatchOrEmpty\`: Not only when the file checksum is not matched, but also when the file has no checksum, the file will be redownloaded.
     * - \`always\`: Always redownload files.
     *
     * @default "checksumNotMatch"
     */
    protected overwriteWhen?: "checksumNotMatchOrEmpty" | "checksumNotMatch" | "always";
    protected acceptRanges: boolean;
    protected contentLength: number;
    protected lastModified?: string;
    protected eTag?: string;
    get url(): string;
    set url(url: string);
    get destination(): string;
    set destination(destination: string);
    /**
     * current fd
     */
    protected fd: number;
    constructor(options: DownloadSingleUrlOptions);
    protected updateMetadata(): Promise<void>;
    protected startSegmentDownload(seg: Segment, output: WriteStream): Promise<readonly [Promise<boolean>] | readonly [Promise<boolean>, ClientRequest, IncomingMessage]>;
    protected download(): Promise<boolean>;
    protected computeSegmenets(total: number, chunkSize: number, concurrency: number): Segment[];
    protected shouldProcess(): Promise<boolean>;
    protected process(): Promise<[boolean, Segment[]]>;
    protected abort(): Promise<void>;
    protected shouldTolerant(e: any): boolean;
    protected validate(): Promise<void>;
    protected reset(): Promise<void>;
}
export declare class DownloadFallbackTask extends DownloadTask {
    protected urls: string[];
    constructor(options: DownloadMultiUrlOptions);
    run(): Promise<Segment[]>;
}
export declare function createAgents(options: DownloadCommonOptions): {
    http: HttpAgent;
    https: HttpsAgent;
};
export declare function withAgents<T extends DownloadCommonOptions, R>(options: T, scope: (options: T) => R): Promise<R>;
export {};
\/\/# sourceMappingURL=http.d.ts.map`;
definitions['@xmcl/installer/index.d.ts'] = `/**  * The installer module provides commonly used installation functions for Minecraft.
 * @packageDocumentation
 * @module @xmcl/installer
 */
export * from "./fabric";
export * from "./liteloader";
export * from "./forge";
export * from "./minecraft";
export * from "./profile";
export * from "./curseforge";
export * from "./optifine";
export * from "./java";
export * from "./java-runtime";
export * from "./diagnose";
export { InstallOptions } from "./utils";
export * from "./http/download";
export * from "./http/agents";
export * from "./http/segment";
export * from "./http/abort";
export * from "./http/fetch";
export * from "./http/metadata";
export * from "./http/retry";
export * from "./http/status";
export * from "./http/validator";
export * from "./downloadTask";
export * from "./unzip";
\/\/# sourceMappingURL=index.d.ts.map`;
definitions['@xmcl/installer/java-runtime.d.ts'] = `import { Platform } from "@xmcl/core"; import { Task } from "@xmcl/task";
import { DownloadBaseOptions } from "./http/download";
import { ParallelTaskOptions } from "./utils";
/**
 * Contain all java runtimes basic info
 */
export interface JavaRuntimes {
    linux: JavaRuntimeTargets;
    "linux-i386": JavaRuntimeTargets;
    "mac-os": JavaRuntimeTargets;
    "windows-x64": JavaRuntimeTargets;
    "windows-x86": JavaRuntimeTargets;
}
export interface JavaRuntimeTargets {
    "java-runtime-alpha": JavaRuntimeTarget[];
    "jre-legacy": JavaRuntimeTarget[];
    "minecraft-java-exe": JavaRuntimeTarget[];
}
export declare enum JavaRuntimeTargetType {
    /**
     * The legacy java version
     */
    Legacy = "jre-legacy",
    /**
     * The new java environment, which is the java 16
     */
    Next = "java-runtime-alpha",
    JavaExe = "minecraft-java-exe"
}
/**
 * Represent a java runtime
 */
export interface JavaRuntimeTarget {
    /**
     * Guessing this is the flight of this java runtime
     */
    availability: {
        group: number;
        progress: number;
    };
    /**
     * The manifest detail of the resource
     */
    manifest: DownloadInfo;
    /**
     * The basic version info of the manifest
     */
    version: {
        /**
         * The name of the version. e.g. \`8u51\`, \`12\`, \`16.0.1.9.1\`
         */
        name: string;
        /**
         * The date string (UTC)
         */
        released: string;
    };
}
export interface Entry {
    type: "file" | "link" | "directory";
}
export interface LinkEntry extends Entry {
    type: "link";
    /**
     * The link target
     */
    target: string;
}
export interface DirectoryEntry extends Entry {
    type: "directory";
}
export interface DownloadInfo {
    /**
     * The sha info of the resource
     */
    sha1: string;
    /**
     * The size of the resource
     */
    size: number;
    /**
     * The url to download resource
     */
    url: string;
}
export interface FileEntry extends Entry {
    type: "file";
    executable: boolean;
    downloads: {
        /**
         * The raw format of the file
         */
        raw: DownloadInfo;
        /**
         * The lzma format of the file
         */
        lzma?: DownloadInfo;
    };
}
export declare type AnyEntry = FileEntry | DirectoryEntry | LinkEntry;
/**
 * Contains info about every files in this java runtime
 */
export interface JavaRuntimeManifest {
    target: JavaRuntimeTargetType;
    /**
     * The files of the java runtime
     */
    files: Record<string, AnyEntry>;
    version: JavaRuntimeTarget["version"];
}
export declare const DEFAULT_RUNTIME_ALL_URL = "https:\/\/launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json";
export interface FetchJavaRuntimeManifestOptions extends DownloadBaseOptions {
    /**
     * The alternative download host for the file
     */
    apiHost?: string | string[];
    /**
     * The url of the all runtime json
     */
    url?: string;
    /**
     * The platform to install. It will be auto-resolved by default.
     * @default getPlatform()
     */
    platform?: Platform;
    /**
     * The install java runtime type
     * @default InstallJavaRuntimeTarget.Next
     */
    target?: JavaRuntimeTargetType;
    /**
     * The index manifest of the java runtime. If this is not presented, it will fetch by platform and all platform url.
     */
    manfiestIndex?: JavaRuntimes;
}
/**
 * Fetch java runtime manifest. It should be able to resolve to your platform, or you can assign the platform.
 *
 * Also, you should assign the target to download, or it will use the latest java 16.
 * @param options The options of fetch runtime manifest
 */
export declare function fetchJavaRuntimeManifest(options?: FetchJavaRuntimeManifestOptions): Promise<JavaRuntimeManifest>;
export interface InstallJavaRuntimeOptions extends DownloadBaseOptions, ParallelTaskOptions {
    /**
     * The alternative download host for the file
     */
    apiHost?: string | string[];
    /**
     * The destination of this installation
     */
    destination: string;
    /**
     * The actual manfiest to install.
     */
    manifest: JavaRuntimeManifest;
    /**
     * Download lzma compressed version instead of raw version.
     * - If \`true\`, it will just download lzma file version, you need to decompress by youself!
     * - If \`Function\`, it will use that function to decompress the file!
     */
    lzma?: boolean | ((compressedFilePath: string, targetPath: string) => Promise<void>);
}
/**
 * Install java runtime from java runtime manifest
 * @param options The options to install java runtime
 */
export declare function installJavaRuntimesTask(options: InstallJavaRuntimeOptions): Task<void>;
\/\/# sourceMappingURL=java-runtime.d.ts.map`;
definitions['@xmcl/installer/java.d.ts'] = `import { Platform } from "@xmcl/core"; import { Task } from "@xmcl/task";
import { DownloadTask } from "./downloadTask";
import { DownloadBaseOptions } from "./http/download";
export interface JavaInfo {
    /**
     * Full java executable path
     */
    path: string;
    /**
     * Java version string
     */
    version: string;
    /**
     * Major version of java
     */
    majorVersion: number;
}
export interface InstallJavaOptions extends DownloadBaseOptions {
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
     * The platform to install. It will be auto-resolved by default.
     * @default currentPlatform
     */
    platform?: Platform;
    /**
     * Unpack lzma function. It must present, else it will not be able to unpack mojang provided LZMA.
     */
    unpackLZMA: UnpackLZMAFunction;
}
export declare type UnpackLZMAFunction = ((src: string, dest: string) => Promise<void>) | ((src: string, dest: string) => Task<void>);
export declare class DownloadJRETask extends DownloadTask {
    constructor(jre: DownloadInfo, dir: string, options: InstallJavaOptions);
}
interface DownloadInfo {
    sha1: string;
    url: string;
    version: string;
}
/**
 * Install JRE from Mojang offical resource. It should install jdk 8.
 * @param options The install options
 */
export declare function installJreFromMojangTask(options: InstallJavaOptions): import("@xmcl/task").TaskRoutine<void>;
/**
 * Install JRE from Mojang offical resource. It should install jdk 8.
 * @param options The install options
 */
export declare function installJreFromMojang(options: InstallJavaOptions): Promise<void>;
/**
 * Try to resolve a java info at this path. This will call \`java -version\`
 * @param path The java exectuable path.
 */
export declare function resolveJava(path: string): Promise<JavaInfo | undefined>;
/**
 * Parse version string and major version number from stderr of java process.
 *
 * @param versionText The stderr for \`java -version\`
 */
export declare function parseJavaVersion(versionText: string): {
    version: string;
    majorVersion: number;
} | undefined;
/**
 * Get all potential java locations for Minecraft.
 *
 * On mac/linux, it will perform \`which java\`. On win32, it will perform \`where java\`
 *
 * @returns The absolute java locations path
 */
export declare function getPotentialJavaLocations(): Promise<string[]>;
/**
 * Scan local java version on the disk.
 *
 * It will check if the passed \`locations\` are the home of java.
 * Notice that the locations should not be the executable, but the path of java installation, like JAVA_HOME.
 *
 * This will call \`getPotentialJavaLocations\` and then \`resolveJava\`
 *
 * @param locations The location (like java_home) want to check.
 * @returns All validate java info
 */
export declare function scanLocalJava(locations: string[]): Promise<JavaInfo[]>;
export {};
\/\/# sourceMappingURL=java.d.ts.map`;
definitions['@xmcl/installer/liteloader.d.ts'] = `import { MinecraftLocation } from "@xmcl/core"; import { Task } from "@xmcl/task";
import { Timestamped } from "./http/fetch";
import { InstallOptions } from "./utils";
export declare const DEFAULT_VERSION_MANIFEST = "http:\/\/dl.liteloader.com/versions/versions.json";
/**
 * The liteloader version list. Containing the minecraft version -> liteloader version info mapping.
 */
export interface LiteloaderVersionList extends Timestamped {
    meta: {
        description: string;
        authors: string;
        url: string;
        updated: string;
        updatedTime: number;
    };
    versions: {
        [version: string]: {
            snapshot?: LiteloaderVersion;
            release?: LiteloaderVersion;
        };
    };
}
export declare namespace LiteloaderVersionList {
    function parse(content: string): {
        meta: any;
        versions: {};
    };
}
/**
 * A liteloader remote version information
 */
export interface LiteloaderVersion {
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
 * This error is only thrown from liteloader install currently.
 */
export declare class MissingVersionJsonError extends Error {
    version: string;
    /**
     * The path of version json
     */
    path: string;
    constructor(version: string, 
    /**
     * The path of version json
     */
    path: string);
    error: "MissingVersionJson";
}
/**
 * Get or update the LiteLoader version list.
 *
 * This will request liteloader offical json by default. You can replace the request by assigning the remote option.
 */
export declare function getLiteloaderVersionList(option?: {
    /**
     * If this presents, it will send request with the original list timestamp.
     *
     * If the server believes there is no modification after the original one,
     * it will directly return the orignal one.
     */
    original?: LiteloaderVersionList;
    /**
     * The optional requesting version json url.
     */
    remote?: string;
}): Promise<LiteloaderVersionList>;
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
 * @throws {@link MissingVersionJsonError}
 */
export declare function installLiteloader(versionMeta: LiteloaderVersion, location: MinecraftLocation, options?: InstallOptions): Promise<string>;
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
export declare function installLiteloaderTask(versionMeta: LiteloaderVersion, location: MinecraftLocation, options?: InstallOptions): Task<string>;
\/\/# sourceMappingURL=liteloader.d.ts.map`;
definitions['@xmcl/installer/minecraft.d.ts'] = `import { MinecraftFolder, MinecraftLocation, ResolvedLibrary, ResolvedVersion } from "@xmcl/core"; import { Task } from "@xmcl/task";
import { DownloadTask } from "./downloadTask";
import { DownloadBaseOptions } from "./http/download";
import { Timestamped } from "./http/fetch";
import { ParallelTaskOptions } from "./utils";
/**
 * The function to swap library host.
 */
export declare type LibraryHost = (library: ResolvedLibrary) => string | string[] | undefined;
export interface MinecraftVersionBaseInfo {
    /**
     * The version id, like 1.14.4
     */
    id: string;
    /**
     * The version json download url
     */
    url: string;
}
/**
 * The version metadata containing the version information, like download url
 */
export interface MinecraftVersion extends MinecraftVersionBaseInfo {
    /**
     * The version id, like 1.14.4
     */
    id: string;
    type: string;
    time: string;
    releaseTime: string;
    /**
     * The version json download url
     */
    url: string;
}
export interface AssetInfo {
    name: string;
    hash: string;
    size: number;
}
/**
 * Minecraft version metadata list
 */
export interface MinecraftVersionList extends Timestamped {
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
    versions: MinecraftVersion[];
}
/**
 * Default minecraft version manifest url.
 */
export declare const DEFAULT_VERSION_MANIFEST_URL = "https:\/\/launchermeta.mojang.com/mc/game/version_manifest.json";
/**
 * Default resource/assets url root
 */
export declare const DEFAULT_RESOURCE_ROOT_URL = "https:\/\/resources.download.minecraft.net";
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
    original?: MinecraftVersionList;
    /**
     * remote url of this request
     */
    remote?: string;
}): Promise<MinecraftVersionList>;
/**
 * Change the library host url
 */
export interface LibraryOptions extends DownloadBaseOptions, ParallelTaskOptions {
    /**
     * A more flexiable way to control library download url.
     * @see mavenHost
     */
    libraryHost?: LibraryHost;
    /**
     * The alterative maven host to download library. It will try to use these host from the \`[0]\` to the \`[maven.length - 1]\`
     */
    mavenHost?: string | string[];
    /**
     * Control how many libraries download task should run at the same time.
     * It will override the \`maxConcurrencyOption\` if this is presented.
     *
     * This will be ignored if you have your own downloader assigned.
     */
    librariesDownloadConcurrency?: number;
}
/**
 * Change the host url of assets download
 */
export interface AssetsOptions extends DownloadBaseOptions, ParallelTaskOptions {
    /**
     * The alternative assets host to download asset. It will try to use these host from the \`[0]\` to the \`[assetsHost.length - 1]\`
     */
    assetsHost?: string | string[];
    /**
     * Control how many assets download task should run at the same time.
     * It will override the \`maxConcurrencyOption\` if this is presented.
     *
     * This will be ignored if you have your own downloader assigned.
     */
    assetsDownloadConcurrency?: number;
    /**
     * The assets index download or url replacement
     */
    assetsIndexUrl?: string | string[] | ((version: ResolvedVersion) => string | string[]);
}
export declare type InstallLibraryVersion = Pick<ResolvedVersion, "libraries" | "minecraftDirectory">;
/**
 * Replace the minecraft client or server jar download
 */
export interface JarOption extends DownloadBaseOptions, ParallelTaskOptions {
    /**
     * The version json url replacement
     */
    json?: string | string[] | ((version: MinecraftVersionBaseInfo) => string | string[]);
    /**
     * The client jar url replacement
     */
    client?: string | string[] | ((version: ResolvedVersion) => string | string[]);
    /**
     * The server jar url replacement
     */
    server?: string | string[] | ((version: ResolvedVersion) => string | string[]);
}
export interface InstallSideOption {
    /**
     * The installation side
     */
    side?: "client" | "server";
}
export declare type Options = DownloadBaseOptions & ParallelTaskOptions & AssetsOptions & JarOption & LibraryOptions & InstallSideOption;
/**
 * Install the Minecraft game to a location by version metadata.
 *
 * This will install version json, version jar, and all dependencies (assets, libraries)
 *
 * @param versionMeta The version metadata
 * @param minecraft The Minecraft location
 * @param option
 */
export declare function install(versionMeta: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, option?: Options): Promise<ResolvedVersion>;
/**
 * Only install the json/jar. Do not install dependencies.
 *
 * @param versionMeta the version metadata; get from updateVersionMeta
 * @param minecraft minecraft location
 */
export declare function installVersion(versionMeta: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, options?: JarOption): Promise<ResolvedVersion>;
/**
 * Install the completeness of the Minecraft game assets and libraries on a existed version.
 *
 * @param version The resolved version produced by Version.parse
 * @param minecraft The minecraft location
 */
export declare function installDependencies(version: ResolvedVersion, options?: Options): Promise<ResolvedVersion>;
/**
 * Install or check the assets to resolved version
 *
 * @param version The target version
 * @param options The option to replace assets host url
 */
export declare function installAssets(version: ResolvedVersion, options?: AssetsOptions): Promise<ResolvedVersion>;
/**
 * Install all the libraries of providing version
 * @param version The target version
 * @param options The library host swap option
 */
export declare function installLibraries(version: ResolvedVersion, options?: LibraryOptions): Promise<void>;
/**
 * Only install several resolved libraries
 * @param libraries The resolved libraries
 * @param minecraft The minecraft location
 * @param option The install option
 */
export declare function installResolvedLibraries(libraries: ResolvedLibrary[], minecraft: MinecraftLocation, option?: LibraryOptions): Promise<void>;
/**
 * Install the Minecraft game to a location by version metadata.
 *
 * This will install version json, version jar, and all dependencies (assets, libraries)
 *
 * @param type The type of game, client or server
 * @param versionMeta The version metadata
 * @param minecraft The Minecraft location
 * @param options
 */
export declare function installTask(versionMeta: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, options?: Options): Task<ResolvedVersion>;
/**
 * Only install the json/jar. Do not install dependencies.
 *
 * @param type client or server
 * @param versionMeta the version metadata; get from updateVersionMeta
 * @param minecraft minecraft location
 */
export declare function installVersionTask(versionMeta: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, options?: JarOption): Task<ResolvedVersion>;
/**
 * Install the completeness of the Minecraft game assets and libraries on a existed version.
 *
 * @param version The resolved version produced by Version.parse
 * @param minecraft The minecraft location
 */
export declare function installDependenciesTask(version: ResolvedVersion, options?: Options): Task<ResolvedVersion>;
/**
 * Install or check the assets to resolved version
 *
 * @param version The target version
 * @param options The option to replace assets host url
 */
export declare function installAssetsTask(version: ResolvedVersion, options?: AssetsOptions): Task<ResolvedVersion>;
/**
 * Install all the libraries of providing version
 * @param version The target version
 * @param options The library host swap option
 */
export declare function installLibrariesTask(version: InstallLibraryVersion, options?: LibraryOptions): Task<void>;
/**
 * Only install several resolved libraries
 * @param libraries The resolved libraries
 * @param minecraft The minecraft location
 * @param option The install option
 */
export declare function installResolvedLibrariesTask(libraries: ResolvedLibrary[], minecraft: MinecraftLocation, option?: LibraryOptions): Task<void>;
/**
 * Only install several resolved assets.
 * @param assets The assets to install
 * @param folder The minecraft folder
 * @param options The asset option
 */
export declare function installResolvedAssetsTask(assets: AssetInfo[], folder: MinecraftFolder, options?: AssetsOptions): import("@xmcl/task").TaskRoutine<void>;
export declare class InstallJsonTask extends DownloadTask {
    constructor(version: MinecraftVersionBaseInfo, minecraft: MinecraftLocation, options: Options);
}
export declare class InstallJarTask extends DownloadTask {
    constructor(version: ResolvedVersion, minecraft: MinecraftLocation, options: Options);
}
export declare class InstallAssetIndexTask extends DownloadTask {
    constructor(version: ResolvedVersion, options?: AssetsOptions);
}
export declare class InstallLibraryTask extends DownloadTask {
    constructor(lib: ResolvedLibrary, folder: MinecraftFolder, options: LibraryOptions);
}
export declare class InstallAssetTask extends DownloadTask {
    constructor(asset: AssetInfo, folder: MinecraftFolder, options: AssetsOptions);
}
/**
 * Resolve a library download urls with fallback.
 *
 * @param library The resolved library
 * @param libraryOptions The library install options
 */
export declare function resolveLibraryDownloadUrls(library: ResolvedLibrary, libraryOptions: LibraryOptions): string[];
\/\/# sourceMappingURL=minecraft.d.ts.map`;
definitions['@xmcl/installer/optifine.d.ts'] = `import { MinecraftLocation, Version } from "@xmcl/core"; import { InstallOptions } from "./utils";
export interface InstallOptifineOptions extends InstallOptions {
    /**
     * Use "optifine.OptiFineForgeTweaker" instead of "optifine.OptiFineTweaker" for tweakClass.
     *
     * If you want to install upon forge, you should use this.
     */
    useForgeTweaker?: boolean;
}
/**
 * Generate the optifine version json from provided info.
 * @param editionRelease The edition + release with _
 * @param minecraftVersion The minecraft version
 * @param launchWrapperVersion The launch wrapper version
 * @param options The install options
 * @beta Might be changed and don't break the major version
 */
export declare function generateOptifineVersion(editionRelease: string, minecraftVersion: string, launchWrapperVersion?: string, options?: InstallOptifineOptions): Version;
export interface InstallOptifineOptions extends InstallOptions {
    /**
     * The java exectable path. It will use \`java\` by default.
     */
    java?: string;
}
/**
 * Install optifine by optifine installer
 *
 * @param installer The installer jar file path
 * @param minecraft The minecraft location
 * @param options The option to install
 * @beta Might be changed and don't break the major version
 * @throws {@link BadOptifineJarError}
 */
export declare function installOptifine(installer: string, minecraft: MinecraftLocation, options?: InstallOptifineOptions): Promise<string>;
export declare class BadOptifineJarError extends Error {
    optifine: string;
    /**
     * What entry in jar is missing
     */
    entry: string;
    constructor(optifine: string, 
    /**
     * What entry in jar is missing
     */
    entry: string);
    error: string;
}
/**
 * Install optifine by optifine installer task
 *
 * @param installer The installer jar file path
 * @param minecraft The minecraft location
 * @param options The option to install
 * @beta Might be changed and don't break the major version
 * @throws {@link BadOptifineJarError}
 */
export declare function installOptifineTask(installer: string, minecraft: MinecraftLocation, options?: InstallOptifineOptions): import("@xmcl/task").TaskRoutine<string>;
\/\/# sourceMappingURL=optifine.d.ts.map`;
definitions['@xmcl/installer/profile.d.ts'] = `import { MinecraftFolder, MinecraftLocation, Version as VersionJson } from "@xmcl/core"; import { AbortableTask } from "@xmcl/task";
import { InstallSideOption, LibraryOptions } from "./minecraft";
export interface PostProcessor {
    /**
     * The executable jar path
     */
    jar: string;
    /**
     * The classpath to run
     */
    classpath: string[];
    args: string[];
    outputs?: {
        [key: string]: string;
    };
}
export interface InstallProfile {
    spec?: number;
    /**
     * The type of this installation, like "forge"
     */
    profile: string;
    /**
     * The version of this installation
     */
    version: string;
    /**
     * The version json path
     */
    json: string;
    /**
     * The maven artifact name: <org>:<artifact-id>:<version>
     */
    path: string;
    /**
     * The minecraft version
     */
    minecraft: string;
    /**
     * The processor shared variables. The key is the name of variable to replace.
     *
     * The value of client/server is the value of the variable.
     */
    data?: {
        [key: string]: {
            client: string;
            server: string;
        };
    };
    /**
     * The post processor. Which require java to run.
     */
    processors?: Array<PostProcessor>;
    /**
     * The required install profile libraries
     */
    libraries: VersionJson.NormalLibrary[];
    /**
     * Legacy format
     */
    versionInfo?: VersionJson;
}
export interface InstallProfileOption extends LibraryOptions, InstallSideOption {
    /**
     * New forge (>=1.13) require java to install. Can be a executor or java executable path.
     */
    java?: string;
}
/**
 * Resolve processors in install profile
 */
export declare function resolveProcessors(side: "client" | "server", installProfile: InstallProfile, minecraft: MinecraftFolder): {
    args: string[];
    outputs: {
        [x: string]: string;
    } | undefined;
    /**
     * The executable jar path
     */
    jar: string;
    /**
     * The classpath to run
     */
    classpath: string[];
}[];
/**
 * Post process the post processors from \`InstallProfile\`.
 *
 * @param processors The processor info
 * @param minecraft The minecraft location
 * @param java The java executable path
 * @throws {@link PostProcessError}
 */
export declare function postProcess(processors: PostProcessor[], minecraft: MinecraftFolder, java: string): Promise<void>;
/**
 * Install by install profile. The install profile usually contains some preprocess should run before installing dependencies.
 *
 * @param installProfile The install profile
 * @param minecraft The minecraft location
 * @param options The options to install
 * @throws {@link PostProcessError}
 */
export declare function installByProfile(installProfile: InstallProfile, minecraft: MinecraftLocation, options?: InstallProfileOption): Promise<void>;
/**
 * Install by install profile. The install profile usually contains some preprocess should run before installing dependencies.
 *
 * @param installProfile The install profile
 * @param minecraft The minecraft location
 * @param options The options to install
 */
export declare function installByProfileTask(installProfile: InstallProfile, minecraft: MinecraftLocation, options?: InstallProfileOption): import("@xmcl/task").TaskRoutine<void>;
export declare class PostProcessBadJarError extends Error {
    jarPath: string;
    causeBy: Error;
    constructor(jarPath: string, causeBy: Error);
    error: string;
}
export declare class PostProcessNoMainClassError extends Error {
    jarPath: string;
    constructor(jarPath: string);
    error: string;
}
export declare class PostProcessFailedError extends Error {
    jarPath: string;
    commands: string[];
    constructor(jarPath: string, commands: string[], message: string);
    error: string;
}
/**
 * Post process the post processors from \`InstallProfile\`.
 *
 * @param processors The processor info
 * @param minecraft The minecraft location
 * @param java The java executable path
 * @throws {@link PostProcessError}
 */
export declare class PostProcessingTask extends AbortableTask<void> {
    private processors;
    private minecraft;
    private java;
    readonly name: string;
    private pointer;
    private activeProcess;
    constructor(processors: PostProcessor[], minecraft: MinecraftFolder, java: string);
    protected findMainClass(lib: string): Promise<string>;
    protected isInvalid(outputs: Required<PostProcessor>["outputs"]): Promise<boolean>;
    protected postProcess(mc: MinecraftFolder, proc: PostProcessor, java: string): Promise<void>;
    protected process(): Promise<void>;
    protected abort(isCancelled: boolean): Promise<void>;
    protected isAbortedError(e: any): boolean;
}
\/\/# sourceMappingURL=profile.d.ts.map`;
definitions['@xmcl/installer/unzip.d.ts'] = `import { BaseTask } from "@xmcl/task"; import { Entry, ZipFile } from "yauzl";
export interface EntryResolver {
    (entry: Entry): Promise<string> | string;
}
export declare function getDefaultEntryResolver(): EntryResolver;
export declare class UnzipTask extends BaseTask<void> {
    readonly zipFile: ZipFile;
    readonly entries: Entry[];
    readonly resolver: EntryResolver;
    private streams;
    private _onCancelled;
    constructor(zipFile: ZipFile, entries: Entry[], destination: string, resolver?: EntryResolver);
    protected handleEntry(entry: Entry, relativePath: string): Promise<void>;
    protected runTask(): Promise<void>;
    protected cancelTask(): Promise<void>;
    protected pauseTask(): Promise<void>;
    protected resumeTask(): Promise<void>;
}
\/\/# sourceMappingURL=unzip.d.ts.map`;
definitions['@xmcl/installer/utils.d.ts'] = `\/\// <reference types="node" /> import { _exists as exists, _mkdir as mkdir, _pipeline as pipeline, _readFile as readFile, _writeFile as writeFile } from "@xmcl/core";
import { ChildProcessWithoutNullStreams, ExecOptions } from "child_process";
import { close as fclose, copyFile as fcopyFile, ftruncate, link as fslink, open as fopen, stat as fstat, unlink as funlink } from "fs";
export declare const unlink: typeof funlink.__promisify__;
export declare const stat: typeof fstat.__promisify__;
export declare const link: typeof fslink.__promisify__;
export declare const open: typeof fopen.__promisify__;
export declare const close: typeof fclose.__promisify__;
export declare const copyFile: typeof fcopyFile.__promisify__;
export declare const truncate: typeof ftruncate.__promisify__;
export { checksum } from "@xmcl/core";
export { readFile, writeFile, mkdir, exists, pipeline };
export declare function missing(target: string): Promise<boolean>;
export declare function ensureDir(target: string): Promise<void>;
export declare function ensureFile(target: string): Promise<void>;
export declare function normalizeArray<T>(arr?: T | T[]): T[];
export declare function spawnProcess(javaPath: string, args: string[], options?: ExecOptions): Promise<void>;
export declare function waitProcess(process: ChildProcessWithoutNullStreams): Promise<void>;
export interface ParallelTaskOptions {
    throwErrorImmediately?: boolean;
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
export declare function errorToString(e: any): any;
\/\/# sourceMappingURL=utils.d.ts.map`;
definitions['@xmcl/mod-parser/fabric.d.ts'] = `import { FileSystem } from "@xmcl/system"; declare type Person = {
    /**
     * The real name, or username, of the person. Mandatory.
     */
    name: string;
    /**
     *  Person's contact information. The same as upper level contact. See above. Optional.
     */
    contact?: string;
} | string;
declare type Environment = "client" | "server" | "*";
/**
 * The \`ModMetadata\` is extract from \`fabric.mod.json\`.
 *
 * The \`fabric.mod.json\` file is a mod metadata file used by Fabric Loader to load mods.
 * In order to be loaded, a mod must have this file with the exact name placed in the root directory of the mod JAR.
 */
export interface FabricModMetadata {
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
     *  - If you're using any other language, consult the language adapter's documentation. The Kotlin one is located [here](https:\/\/github.com/FabricMC/fabric-language-kotlin/blob/master/README.md).
     */
    entrypoints?: string[];
    /**
     * A list of nested JARs inside your mod's JAR to load. Before using the field, check out [the guidelines on the usage of the nested JARs](https:\/\/fabricmc.net/wiki/tutorial:loader04x#nested_jars). Each entry is an object containing file key. That should be a path inside your mod's JAR to the nested JAR. For example:
     * \`\`\`json
     * "jars": [
     *     {
     *         "file": "nested/vendor/dependency.jar"
     *     }
     * ]
     * \`\`\`
     */
    jars?: {
        file: string;
    }[];
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
    depends?: Record<string, string | string[]>;
    /**
     * For dependencies not required to run. Without them a game will log a warning.
     */
    recommends?: Record<string, string | string[]>;
    /**
     * For dependencies not required to run. Use this as a kind of metadata.
     */
    suggests?: Record<string, string | string[]>;
    /**
     * For mods whose together with yours might cause a game crash. With them a game will crash.
     */
    breaks?: Record<string, string | string[]>;
    /**
     * For mods whose together with yours cause some kind of bugs, etc. With them a game will log a warning.
     */
    conflicts?: Record<string, string | string[]>;
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
         * IRC channel pertaining to the mod. Must be of a valid URL format - for example: irc:\/\/irc.esper.net:6667/charset for #charset at EsperNet - the port is optional, and assumed to be 6667 if not present.
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
export declare function readFabricMod(file: FileSystem | string | Uint8Array): Promise<FabricModMetadata>;
export {};
\/\/# sourceMappingURL=fabric.d.ts.map`;
definitions['@xmcl/mod-parser/forge.d.ts'] = `import { FileSystem } from "@xmcl/system"; /**
 * The @Mod data from class file
 */
export interface ForgeModAnnotationData {
    [key: string]: any;
    value: string;
    modid: string;
    name: string;
    version: string;
    /**
     * A dependency string for this mod, which specifies which mod(s) it depends on in order to run.
     *
     * A dependency string must start with a combination of these prefixes, separated by "-":
     *     [before, after], [required], [client, server]
     *     At least one "before", "after", or "required" must be specified.
     * Then ":" and the mod id.
     * Then a version range should be specified for the mod by adding "@" and the version range.
     *     The version range format is described in the javadoc here:
     *     {@link VersionRange#createFromVersionSpec(java.lang.String)}
     * Then a ";".
     *
     * If a "required" mod is missing, or a mod exists with a version outside the specified range,
     * the game will not start and an error screen will tell the player which versions are required.
     *
     * Example:
     *     Our example mod:
     *      * depends on Forge and uses new features that were introduced in Forge version 14.21.1.2395
     *         "required:forge@[14.21.1.2395,);"
     *
     *          1.12.2 Note: for compatibility with Forge older than 14.23.0.2501 the syntax must follow this older format:
     *          "required-after:forge@[14.21.1.2395,);"
     *          For more explanation see https:\/\/github.com/MinecraftForge/MinecraftForge/issues/4918
     *
     *      * is a dedicated addon to mod1 and has to have its event handlers run after mod1's are run,
     *         "required-after:mod1;"
     *      * has optional integration with mod2 which depends on features introduced in mod2 version 4.7.0,
     *         "after:mod2@[4.7.0,);"
     *      * depends on a client-side-only rendering library called rendermod
     *         "required-client:rendermod;"
     *
     *     The full dependencies string is all of those combined:
     *         "required:forge@[14.21.1.2395,);required-after:mod1;after:mod2@[4.7.0,);required-client:rendermod;"
     *
     *     This will stop the game and display an error message if any of these is true:
     *         The installed forge is too old,
     *         mod1 is missing,
     *         an old version of mod2 is present,
     *         rendermod is missing on the client.
     */
    dependencies: string;
    useMetadata: boolean;
    acceptedMinecraftVersions: string;
    acceptableRemoteVersions: string;
    acceptableSaveVersions: string;
    modLanguage: string;
    modLanguageAdapter: string;
    clientSideOnly: boolean;
    serverSideOnly: boolean;
}
/**
 * Represent the forge \`mcmod.info\` format.
 */
export interface ForgeModMcmodInfo {
    /**
     * The modid this description is linked to. If the mod is not loaded, the description is ignored.
     */
    modid: string;
    /**
     * The user-friendly name of this mod.
     */
    name: string;
    /**
     * A description of this mod in 1-2 paragraphs.
     */
    description: string;
    /**
     * The version of the mod.
     */
    version: string;
    /**
     * The Minecraft version.
     */
    mcversion: string;
    /**
     * A link to the mod’s homepage.
     */
    url: string;
    /**
     * Defined but unused. Superseded by updateJSON.
     */
    updateUrl: string;
    /**
     * The URL to a version JSON.
     */
    updateJSON: string;
    /**
     * A list of authors to this mod.
     */
    authorList: string[];
    /**
     * A string that contains any acknowledgements you want to mention.
     */
    credits: string;
    /**
     * The path to the mod’s logo. It is resolved on top of the classpath, so you should put it in a location where the name will not conflict, maybe under your own assets folder.
     */
    logoFile: string;
    /**
     * A list of images to be shown on the info page. Currently unimplemented.
     */
    screenshots: string[];
    /**
     * The modid of a parent mod, if applicable. Using this allows modules of another mod to be listed under it in the info page, like BuildCraft.
     */
    parent: string;
    /**
     * If true and \`Mod.useMetadata\`, the below 3 lists of dependencies will be used. If not, they do nothing.
     */
    useDependencyInformation: boolean;
    /**
     * A list of modids. If one is missing, the game will crash. This does not affect the ordering of mod loading! To specify ordering as well as requirement, have a coupled entry in dependencies.
     */
    requiredMods: string[];
    /**
     * A list of modids. All of the listed mods will load before this one. If one is not present, nothing happens.
     */
    dependencies: string[];
    /**
     * A list of modids. All of the listed mods will load after this one. If one is not present, nothing happens.
     */
    dependants: string[];
}
/**
 * This file defines the metadata of your mod. Its information may be viewed by users from the main screen of the game through the Mods button. A single info file can describe several mods.
 *
 * The mods.toml file is formatted as TOML, the example mods.toml file in the MDK provides comments explaining the contents of the file. It should be stored as src/main/resources/META-INF/mods.toml. A basic mods.toml, describing one mod, may look like this:
 */
export interface ForgeModTOMLData {
    /**
     * The modid this file is linked to
     */
    modid: string;
    /**
     * The version of the mod.It should be just numbers seperated by dots, ideally conforming to Semantic Versioning
     */
    version: string;
    /**
     * The user - friendly name of this mod
     */
    displayName: string;
    /**
     * The URL to a version JSON
     */
    updateJSONURL: string;
    /**
     * A link to the mod’s homepage
     */
    displayURL: string;
    /**
     * The filename of the mod’s logo.It must be placed in the root resource folder, not in a subfolder
     */
    logoFile: string;
    /**
     * A string that contains any acknowledgements you want to mention
     */
    credits: string;
    /**
     * The authors to this mod
     */
    authors: string;
    /**
     * A description of this mod
     */
    description: string;
    /**
     * A list of dependencies of this mod
     */
    dependencies: {
        modId: string;
        mandatory: boolean;
        versionRange: string;
        ordering: "NONE" | "BEFORE" | "AFTER";
        side: "BOTH" | "CLIENT" | "SERVER";
    }[];
    /**
     * The name of the mod loader type to load - for regular FML @Mod mods it should be javafml
     */
    modLoader: string;
    /**
     * A version range to match for said mod loader - for regular FML @Mod it will be the forge version
     */
    loaderVersion: string;
    /**
     * A URL to refer people to when problems occur with this mod
     */
    issueTrackerURL: string;
}
export interface ForgeModASMData {
    /**
     * Does class files contain cpw package
     */
    usedLegacyFMLPackage: boolean;
    /**
     * Does class files contain forge package
     */
    usedForgePackage: boolean;
    /**
     * Does class files contain minecraft package
     */
    usedMinecraftPackage: boolean;
    /**
     * Does class files contain minecraft.client package
     */
    usedMinecraftClientPackage: boolean;
    modAnnotations: ForgeModAnnotationData[];
}
/**
 * The metadata inferred from manifest
 */
export interface ManifestMetadata {
    modid: string;
    name: string;
    authors: string[];
    version: string;
    description: string;
    url: string;
}
/**
 * Read the mod info from \`META-INF/MANIFEST.MF\`
 * @returns The manifest directionary
 */
export declare function readForgeModManifest(mod: ForgeModInput, manifestStore?: Record<string, any>): Promise<ManifestMetadata | undefined>;
/**
 * Read mod metadata from new toml metadata file.
 */
export declare function readForgeModToml(mod: ForgeModInput, manifest?: Record<string, string>): Promise<ForgeModTOMLData[]>;
/**
 * Use asm to scan all the class files of the mod. This might take long time to read.
 */
export declare function readForgeModAsm(mod: ForgeModInput, manifest?: Record<string, string>): Promise<ForgeModASMData>;
/**
 * Read \`mcmod.info\`, \`cccmod.info\`, and \`neimod.info\` json file
 * @param mod The mod path or buffer or opened file system.
 */
export declare function readForgeModJson(mod: ForgeModInput): Promise<ForgeModMcmodInfo[]>;
declare type ForgeModInput = Uint8Array | string | FileSystem;
/**
 * Represnet a full scan of a mod file data.
 */
export interface ForgeModMetadata extends ForgeModASMData {
    /**
     * The mcmod.info file metadata. If no mcmod.info file, it will be an empty array
     */
    mcmodInfo: ForgeModMcmodInfo[];
    /**
     * The java manifest file data. If no metadata, it will be an empty object
     */
    manifest: Record<string, any>;
    /**
     * The mod info extract from manfiest. If no manifest, it will be undefined!
     */
    manifestMetadata?: ManifestMetadata;
    /**
     * The toml mod metadata
     */
    modsToml: ForgeModTOMLData[];
}
/**
 * Read metadata of the input mod.
 *
 * This will scan the mcmod.info file, all class file for \`@Mod\` & coremod \`DummyModContainer\` class.
 * This will also scan the manifest file on \`META-INF/MANIFEST.MF\` for tweak mod.
 *
 * If the input is totally not a mod. It will throw {@link NonForgeModFileError}.
 *
 * @throws {@link NonForgeModFileError}
 * @param mod The mod path or data
 * @returns The mod metadata
 */
export declare function readForgeMod(mod: ForgeModInput): Promise<ForgeModMetadata>;
export declare class ForgeModParseFailedError extends Error {
    readonly mod: ForgeModInput;
    readonly asm: Omit<ForgeModASMData, "modAnnotations">;
    readonly manifest: Record<string, any>;
    constructor(mod: ForgeModInput, asm: Omit<ForgeModASMData, "modAnnotations">, manifest: Record<string, any>);
}
export {};
\/\/# sourceMappingURL=forge.d.ts.map`;
definitions['@xmcl/mod-parser/forgeConfig.d.ts'] = `/**  * Represent the forge config file
 */
export interface ForgeConfig {
    [category: string]: {
        comment?: string;
        properties: Array<ForgeConfig.Property<any>>;
    };
}
export declare namespace ForgeConfig {
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
    function stringify(config: ForgeConfig): string;
    /**
     * Parse a forge config string into \`Config\` object
     * @param body The forge config string
     */
    function parse(body: string): ForgeConfig;
}
\/\/# sourceMappingURL=forgeConfig.d.ts.map`;
definitions['@xmcl/mod-parser/index.d.ts'] = `/**  * @module @xmcl/mod-parser
 */
export * from "./forge";
export * from "./forgeConfig";
export * from "./liteloader";
export * from "./fabric";
\/\/# sourceMappingURL=index.d.ts.map`;
definitions['@xmcl/mod-parser/liteloader.d.ts'] = `import { FileSystem } from "@xmcl/system"; export interface LiteloaderModMetadata {
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
export declare function readLiteloaderMod(mod: string | Uint8Array | FileSystem): Promise<LiteloaderModMetadata>;
\/\/# sourceMappingURL=liteloader.d.ts.map`;
definitions['@xmcl/model/block.d.ts'] = `import { BlockModel, PackMeta } from "@xmcl/resourcepack"; import { Object3D } from "three/src/core/Object3D";
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
    getObject(model: BlockModel.Resolved, options?: {
        uvlock?: boolean;
        y?: number;
        x?: number;
    }): BlockModelObject;
}
export {};
\/\/# sourceMappingURL=block.d.ts.map`;
definitions['@xmcl/model/index.d.ts'] = `/**  * @module @xmcl/model
 */
export * from "./block";
export * from "./player";
\/\/# sourceMappingURL=index.d.ts.map`;
definitions['@xmcl/model/player-model.d.ts'] = `export interface ModelTemplate {     head: Part;
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
\/\/# sourceMappingURL=player-model.d.ts.map`;
definitions['@xmcl/model/player.d.ts'] = `import { Object3D } from "three/src/core/Object3D"; import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial";
import { CanvasTexture } from "three/src/textures/CanvasTexture";
declare type TextureSource = string | HTMLImageElement | URL;
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
    /**
     * @param skin The skin texture source. Should be url string, URL object, or a Image HTML element
     * @param isSlim Is this skin slim
     */
    setSkin(skin: TextureSource, isSlim?: boolean): Promise<void>;
    setCape(cape: TextureSource | undefined): Promise<void>;
}
export default PlayerModel;
\/\/# sourceMappingURL=player.d.ts.map`;
definitions['@xmcl/nbt/index.d.ts'] = `/**  * The nbt module provides nbt {@link serialize} and {@link deserialize} functions.
 *
 * @packageDocumentation
 * @module @xmcl/nbt
 */
import ByteBuffer from "bytebuffer";
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
\/\/# sourceMappingURL=index.d.ts.map`;
definitions['@xmcl/nbt/utils.d.ts'] = `\/\// <reference types="bytebuffer" /> export declare function writeUTF8(out: ByteBuffer, str: string): number;
export declare function readUTF8(buff: ByteBuffer): string;
\/\/# sourceMappingURL=utils.d.ts.map`;
definitions['@xmcl/nbt/zlib/index.browser.d.ts'] = `export declare function gzip(buffer: Uint8Array): Promise<Uint8Array>; export declare function gzipSync(buffer: Uint8Array): Uint8Array;
export declare function ungzip(buffer: Uint8Array): Promise<Uint8Array>;
export declare function gunzipSync(buffer: Uint8Array): Uint8Array;
export declare function inflate(buffer: Uint8Array): Promise<Uint8Array>;
export declare function deflate(buffer: Uint8Array): Promise<Uint8Array>;
export declare function inflateSync(buffer: Uint8Array): Uint8Array;
export declare function deflateSync(buffer: Uint8Array): Uint8Array;
\/\/# sourceMappingURL=index.browser.d.ts.map`;
definitions['@xmcl/nbt/zlib/index.d.ts'] = `import { deflateSync, gunzipSync, gzipSync, inflateSync } from "zlib"; export declare const gzip: (buf: Uint8Array) => Promise<Uint8Array>;
export declare const ungzip: (buf: Uint8Array) => Promise<Uint8Array>;
export declare const inflate: (buf: Uint8Array) => Promise<Uint8Array>;
export declare const deflate: (buf: Uint8Array) => Promise<Uint8Array>;
export { gzipSync, gunzipSync, inflateSync, deflateSync };
\/\/# sourceMappingURL=index.d.ts.map`;
definitions['@xmcl/resourcepack/format.d.ts'] = `/**  * The pack meta json format
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
\/\/# sourceMappingURL=format.d.ts.map`;
definitions['@xmcl/resourcepack/index.d.ts'] = `/**  * The resource pack module to read Minecraft resource pack just like Minecraft in-game.
 *
 * You can open the ResourcePack by {@link ResourcePack.open} and get resource by {@link ResourcePack.get}.
 *
 * Or you can just load resource pack metadata by {@link readPackMetaAndIcon}.
 *
 * @packageDocumentation
 * @module @xmcl/resourcepack
 */
import { FileSystem } from "@xmcl/system";
import { PackMeta } from "./format";
export * from "./resourceManager";
export * from "./resourcePack";
export * from "./modelLoader";
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
 *
 * @see {@link readIcon}
 * @see {@link readPackMeta}
 */
export declare function readPackMetaAndIcon(resourcePack: string | Uint8Array | FileSystem): Promise<{
    metadata: PackMeta.Pack;
    icon: Uint8Array | undefined;
}>;
\/\/# sourceMappingURL=index.d.ts.map`;
definitions['@xmcl/resourcepack/modelLoader.d.ts'] = `import { Resource } from "./resourcePack"; import { ResourceLoader } from "./resourceManager";
import { BlockModel } from "./format";
/**
 * The model loader load the resource
 */
export declare class ModelLoader {
    readonly loader: ResourceLoader;
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
     * @param loader The resource loader
     */
    constructor(loader: ResourceLoader);
    /**
     * Load a model by search its parent. It will throw an error if the model is not found.
     */
    loadModel(modelPath: string): Promise<BlockModel.Resolved>;
}
\/\/# sourceMappingURL=modelLoader.d.ts.map`;
definitions['@xmcl/resourcepack/resourceManager.d.ts'] = `import { PackMeta } from "./format"; import { ResourcePack, Resource, ResourceLocation } from "./resourcePack";
export interface ResourcePackWrapper {
    source: ResourcePack;
    info: PackMeta.Pack;
    domains: string[];
}
export interface ResourceLoader {
    /**
    * Get the resource in that location. This will walk through current resource source list to load the resource.
    * @param location The resource location
    */
    get(location: ResourceLocation): Promise<Resource | undefined>;
}
/**
 * The resource manager just like Minecraft. Design to be able to use in both nodejs and browser environment.
 */
export declare class ResourceManager implements ResourceLoader {
    /**
     * The list order is just like the order in options.txt. The last element is the highest priority one.
     * The resource will load from the last one to the first one.
     */
    list: Array<ResourcePackWrapper>;
    constructor(
    /**
     * The list order is just like the order in options.txt. The last element is the highest priority one.
     * The resource will load from the last one to the first one.
     */
    list?: Array<ResourcePackWrapper>);
    get allResourcePacks(): PackMeta.Pack[];
    /**
     * Add a new resource source as the first priority of the resource list.
     */
    addResourcePack(resourcePack: ResourcePack): Promise<{
        info: PackMeta.Pack;
        source: ResourcePack;
        domains: string[];
    }>;
    remove(index: number): ResourcePackWrapper;
    /**
     * Clear all resource packs in this manager
     */
    clear(): ResourcePackWrapper[];
    /**
     * Swap the resource source priority.
     */
    swap(first: number, second: number): void;
    /**
    * Get the resource in that location. This will walk through current resource source list to load the resource.
    * @param location The resource location
    */
    get(location: ResourceLocation): Promise<Resource | undefined>;
}
\/\/# sourceMappingURL=resourceManager.d.ts.map`;
definitions['@xmcl/resourcepack/resourcePack.d.ts'] = `/**  * The resource pack module to read Minecraft resource pack just like Minecraft in-game.
 *
 * You can open the ResourcePack by {@link ResourcePack.open} and get resource by {@link ResourcePack.get}.
 *
 * Or you can just load resource pack metadata by {@link readPackMetaAndIcon}.
 *
 * @packageDocumentation
 */
import { FileSystem } from "@xmcl/system";
import { PackMeta } from "./format";
/**
 * The Minecraft used object to map the game resource location.
 */
export declare class ResourceLocation {
    readonly domain: string;
    readonly path: string;
    /**
     * build from texture path
     */
    static ofTexturePath(path: string): ResourceLocation;
    static ofBlockModelPath(path: string): ResourceLocation;
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
/**
 * The resource in the resource pack on a \`ResourceLocation\`
 * @see {@link ResourceLocation}
 */
export interface Resource {
    /**
     * The absolute location of the resource
     */
    readonly location: ResourceLocation;
    /**
     * The real resource url which is used for reading the content of it.
     */
    readonly url: string;
    /**
     * Read the resource content
     */
    read(): Promise<Uint8Array>;
    read(encoding: undefined): Promise<Uint8Array>;
    read(encoding: "utf-8" | "base64"): Promise<string>;
    read(encoding?: "utf-8" | "base64"): Promise<Uint8Array | string>;
    /**
     * Read the metadata of the resource
     */
    readMetadata(): Promise<PackMeta>;
}
/**
 * The Minecraft resource pack. Providing the loading resource from \`ResourceLocation\` function.
 * It's a wrap of \`FileSystem\` which provides cross node/browser accssing.
 *
 * @see {@link ResourceLocation}
 * @see {@link FileSystem}
 */
export declare class ResourcePack {
    readonly fs: FileSystem;
    constructor(fs: FileSystem);
    /**
     * Load the resource content
     * @param location The resource location
     * @param type The output type of the resource
     */
    load(location: ResourceLocation, type?: "utf-8" | "base64"): Promise<Uint8Array | string | undefined>;
    /**
     * Load the resource metadata which is localted at <resource-path>.mcmeta
     */
    loadMetadata(location: ResourceLocation): Promise<any>;
    /**
     * Get the url of the resource location.
     * Please notice that this is depended on \`FileSystem\` implementation of the \`getUrl\`.
     *
     * @returns The absolute url like \`file:\/\/\` or \`http:\/\/\` depending on underlaying \`FileSystem\`.
     * @see {@link FileSystem}
     */
    getUrl(location: ResourceLocation): string;
    /**
     * Get the resource on the resource location.
     *
     * It can be undefined if there is no resource at that location.
     * @param location THe resource location
     */
    get(location: ResourceLocation): Promise<Resource | undefined>;
    /**
     * Does the resource pack has the resource
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
\/\/# sourceMappingURL=resourcePack.d.ts.map`;
definitions['@xmcl/server-info/index.d.ts'] = `export declare class ServerInfo {     icon: string;
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
\/\/# sourceMappingURL=index.d.ts.map`;
definitions['@xmcl/system/index.browser.d.ts'] = `import { FileSystem } from "./system"; export declare function openFileSystem(basePath: string | Uint8Array): Promise<FileSystem>;
export declare function resolveFileSystem(base: string | Uint8Array | FileSystem): Promise<FileSystem>;
export * from "./system";
\/\/# sourceMappingURL=index.browser.d.ts.map`;
definitions['@xmcl/system/index.d.ts'] = `import { FileSystem } from "./system"; export declare function openFileSystem(basePath: string | Uint8Array): Promise<FileSystem>;
export declare function resolveFileSystem(base: string | Uint8Array | FileSystem): Promise<FileSystem>;
export * from "./system";
\/\/# sourceMappingURL=index.d.ts.map`;
definitions['@xmcl/system/system.d.ts'] = `export declare abstract class FileSystem {     abstract readonly root: string;
    abstract readonly sep: string;
    abstract readonly type: "zip" | "path";
    abstract readonly writeable: boolean;
    abstract join(...paths: string[]): string;
    abstract isDirectory(name: string): Promise<boolean>;
    abstract existsFile(name: string): Promise<boolean>;
    abstract readFile(name: string, encoding: "utf-8" | "base64"): Promise<string>;
    abstract readFile(name: string, encoding: undefined): Promise<Uint8Array>;
    abstract readFile(name: string): Promise<Uint8Array>;
    abstract readFile(name: string, encoding?: "utf-8" | "base64"): Promise<Uint8Array | string>;
    /**
     * Get the url for a file entry. If the system does not support get url. This should return an empty string.
     */
    getUrl(name: string): string;
    abstract listFiles(name: string): Promise<string[]>;
    abstract cd(name: string): void;
    close(): void;
    missingFile(name: string): Promise<boolean>;
    walkFiles(target: string, walker: (path: string) => void | Promise<void>): Promise<void>;
}
\/\/# sourceMappingURL=system.d.ts.map`;
definitions['@xmcl/task/index.d.ts'] = `/**  * @module @xmcl/task
 */
export declare class CancelledError extends Error {
    constructor();
}
/**
 * The collection of errors happened during a parallel process
 */
export declare class MultipleError extends Error {
    readonly errors: unknown[];
    constructor(errors: unknown[], message?: string);
}
export declare enum TaskState {
    Idel = 0,
    Running = 1,
    Cancelled = 2,
    Paused = 3,
    Successed = 4,
    Failed = 5
}
export interface Task<T = any> {
    readonly name: string;
    readonly param: Record<string, any>;
    readonly progress: number;
    readonly total: number;
    readonly from: string | undefined;
    readonly to: string | undefined;
    readonly path: string;
    readonly isCancelled: boolean;
    readonly isPaused: boolean;
    readonly isDone: boolean;
    readonly isRunning: boolean;
    readonly state: TaskState;
    readonly context: TaskContext | undefined;
    readonly parent: Task<any> | undefined;
    pause(): Promise<void>;
    resume(): Promise<void>;
    cancel(): Promise<void>;
    start(context?: TaskContext, parent?: Task<any>): void;
    wait(): Promise<T>;
    startAndWait(context?: TaskContext, parent?: Task<any>): Promise<T>;
    onChildUpdate(chunkSize: number): void;
    map<N>(transform: Transform<this, N>): Task<N>;
    setName(name: string, param?: Record<string, any>): this;
}
export interface Transform<T, N> {
    (this: T, value: T): N;
}
export interface TaskContext {
    fork?(task: Task<any>): number;
    onStart?(task: Task<any>): void;
    onUpdate?(task: Task<any>, chunkSize: number): void;
    onFailed?(task: Task<any>, error: any): void;
    onSuccessed?(task: Task<any>, result: any): void;
    onPaused?(task: Task<any>): void;
    onResumed?(task: Task<any>): void;
    onCancelled?(task: Task<any>): void;
}
export declare function createFork(): TaskContext["fork"];
export declare abstract class BaseTask<T> implements Task<T> {
    protected _state: TaskState;
    protected _promise: Promise<T>;
    protected resolve: (value: T) => void;
    protected reject: (err: any) => void;
    protected _from: string | undefined;
    protected _to: string | undefined;
    protected _progress: number;
    protected _total: number;
    protected _path: string;
    protected _id: number;
    parent: Task<any> | undefined;
    context: TaskContext;
    name: string;
    param: object;
    protected resultOrError: T | any;
    setName(name: string, param?: object): this;
    get(): T | void;
    get id(): number;
    get path(): string;
    get progress(): number;
    get total(): number;
    get to(): string | undefined;
    get from(): string | undefined;
    get state(): TaskState;
    get isCancelled(): boolean;
    get isPaused(): boolean;
    get isDone(): boolean;
    get isRunning(): boolean;
    pause(): Promise<void>;
    resume(): Promise<void>;
    cancel(): Promise<void>;
    wait(): Promise<T>;
    start(context?: TaskContext, parent?: Task<any>): void;
    startAndWait(context?: TaskContext, parent?: Task<any>): Promise<T>;
    protected update(chunkSize: number): void;
    onChildUpdate(chunkSize: number): void;
    protected abstract runTask(): Promise<T>;
    protected abstract cancelTask(): Promise<void>;
    protected abstract pauseTask(): Promise<void>;
    protected abstract resumeTask(): Promise<void>;
    map<N>(transform: Transform<this, N>): Task<N>;
}
export declare abstract class AbortableTask<T> extends BaseTask<T> {
    protected _pausing: Promise<void>;
    protected _unpause: () => void;
    protected _onAborted: () => void;
    protected _onResume: () => void;
    protected abstract process(): Promise<T>;
    protected abstract abort(isCancelled: boolean): void;
    protected abstract isAbortedError(e: any): boolean;
    protected cancelTask(): Promise<void>;
    protected pauseTask(): Promise<void>;
    protected resumeTask(): Promise<void>;
    protected runTask(): Promise<T>;
}
export declare abstract class TaskGroup<T> extends BaseTask<T> {
    protected children: Task<any>[];
    onChildUpdate(chunkSize: number): void;
    protected cancelTask(): Promise<void>;
    protected pauseTask(): Promise<void>;
    protected resumeTask(): Promise<void>;
    all<Z, T extends Task<Z>>(tasks: Iterable<T>, { throwErrorImmediately, getErrorMessage }?: {
        throwErrorImmediately?: boolean;
        getErrorMessage?: (errors: any[]) => string;
    }): Promise<Z[]>;
}
export declare type TaskExecutor<T> = (this: TaskRoutine<any>) => Promise<T> | T;
export declare class TaskRoutine<T> extends TaskGroup<T> {
    readonly executor: TaskExecutor<T>;
    constructor(name: string, executor: TaskExecutor<T>, param?: object);
    concat<T>(task: TaskRoutine<T>): Promise<T>;
    /**
     * Yield a new child task to this routine
     */
    yield<T>(task: Task<T>): Promise<T>;
    protected runTask(): Promise<T>;
}
export declare function task<T>(name: string, executor: TaskExecutor<T>, param?: object): TaskRoutine<T>;
\/\/# sourceMappingURL=index.d.ts.map`;
definitions['@xmcl/text-component/index.d.ts'] = `/**  * @module @xmcl/text-component
 */
/**
 * @see https:\/\/minecraft.gamepedia.com/Raw_JSON_text_format
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
\/\/# sourceMappingURL=index.d.ts.map`;
definitions['@xmcl/unzip/index.d.ts'] = `\/\// <reference types="node" /> /**
 * @module @xmcl/unzip
 */
import { Readable } from "stream";
import { Entry, ZipFile, ZipFileOptions, Options } from "yauzl";
export declare type OpenTarget = string | Buffer | number;
/**
 * Open a yauzl zip
 * @param target The zip path or buffer or file descriptor
 * @param options The option to open
 */
export declare function open(target: OpenTarget, options?: Options): Promise<ZipFile>;
/**
 * Open the entry readstream for the zip file
 * @param zip The zip file object
 * @param entry The entry to open
 * @param options The options to open stream
 */
export declare function openEntryReadStream(zip: ZipFile, entry: Entry, options?: ZipFileOptions): Promise<Readable>;
/**
 * Read the entry to buffer
 * @param zip The zip file object
 * @param entry The entry to open
 * @param options The options to open stream
 */
export declare function readEntry(zip: ZipFile, entry: Entry, options?: ZipFileOptions): Promise<Buffer>;
/**
 * Get the async entry generator for the zip file
 * @param zip The zip file
 */
export declare function walkEntriesGenerator(zip: ZipFile): AsyncGenerator<Entry, void, boolean | undefined>;
/**
 * Walk all the entries of the zip and once provided entries are all found, then terminate the walk process
 * @param zip The zip file
 * @param entries The entry to read
 */
export declare function filterEntries(zip: ZipFile, entries: string[]): Promise<(Entry | undefined)[]>;
/**
 * Walk all the entries of a unread zip file
 * @param zip The unread zip file
 * @param entryHandler The handler to recieve entries. Return true or Promise<true> to stop the walk
 */
export declare function walkEntries(zip: ZipFile, entryHandler: (entry: Entry) => Promise<boolean> | boolean | void): Promise<void>;
export declare function getEntriesRecord(entries: Entry[]): Record<string, Entry>;
/**
 * Walk all entries of the zip file
 * @param zipFile The zip file object
 */
export declare function readAllEntries(zipFile: ZipFile): Promise<Entry[]>;
\/\/# sourceMappingURL=index.d.ts.map`;
definitions['@xmcl/user/auth.d.ts'] = `import { GameProfile } from "./base"; export declare const v5: (s: string) => any;
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
 * Please refer https:\/\/wiki.vg/Authentication
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
     * The host url, like https:\/\/xxx.xxx.com
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
\/\/# sourceMappingURL=auth.d.ts.map`;
definitions['@xmcl/user/base.d.ts'] = `/**  * The game profile of the user.
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
\/\/# sourceMappingURL=base.d.ts.map`;
definitions['@xmcl/user/index.d.ts'] = `/**  * @module @xmcl/user
 */
export * from "./auth";
export { GameProfile, GameProfileWithProperties } from "./base";
export * from "./mojang";
export * from "./service";
\/\/# sourceMappingURL=index.d.ts.map`;
definitions['@xmcl/user/mojang.d.ts'] = `/**  * Users defined question when they register this account
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
\/\/# sourceMappingURL=mojang.d.ts.map`;
definitions['@xmcl/user/service.d.ts'] = `import { GameProfile, GameProfileWithProperties } from "./base"; export interface ProfileLookupException {
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
\/\/# sourceMappingURL=service.d.ts.map`;
definitions['@xmcl/user/util/base.d.ts'] = `/**  * Abstract layer for http requester.
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
\/\/# sourceMappingURL=base.d.ts.map`;
definitions['@xmcl/user/util/index.browser.d.ts'] = `import { HttpRequester } from "./base"; export declare const httpRequester: HttpRequester;
export declare function verify(data: string, signature: string, pemKey: string | Uint8Array): Promise<boolean>;
export declare function decodeBase64(b: string): string;
\/\/# sourceMappingURL=index.browser.d.ts.map`;
definitions['@xmcl/user/util/index.d.ts'] = `import { HttpRequester } from "./base"; export declare const httpRequester: HttpRequester;
export declare function verify(data: string, signature: string, pemKey: string | Uint8Array): Promise<boolean>;
export declare function decodeBase64(s: string): string;
\/\/# sourceMappingURL=index.d.ts.map`;
definitions['@xmcl/user/v5/esm.browser.d.ts'] = `export { default as sha1 } from "uuid/dist/esm-browser/sha1"; export { default as v35 } from "uuid/dist/esm-browser/v35";
\/\/# sourceMappingURL=esm.browser.d.ts.map`;
definitions['@xmcl/user/v5/esm.d.ts'] = `export { default as sha1 } from "uuid/dist/esm-node/sha1"; export { default as v35 } from "uuid/dist/esm-node/v35";
\/\/# sourceMappingURL=esm.d.ts.map`;
definitions['@xmcl/user/v5/index.browser.d.ts'] = `export { default as sha1 } from "uuid/dist/sha1-browser"; export { default as v35 } from "uuid/dist/esm-browser/v35";
\/\/# sourceMappingURL=index.browser.d.ts.map`;
definitions['@xmcl/user/v5/index.d.ts'] = `import sha1 from "uuid/dist/sha1"; import v35 from "uuid/dist/v35";
export { v35, sha1 };
\/\/# sourceMappingURL=index.d.ts.map`;
definitions['@xmcl/world/index.d.ts'] = `import { FileSystem } from "@xmcl/system"; import Long from "long";
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
/**
 * The chunk index is a number in range [0, 4096), which is mapped position from (0,0,0) to (16,16,16) inside the chunk.
 */
export declare type ChunkIndex = number;
/**
 * Get chunk index from position.
 * All x, y, z should be in range [0, 16)
 *
 * @param x The position x. Should be in range [0, 16)
 * @param y The position y. Should be in range [0, 16)
 * @param z The position z. Should be in range [0, 16)
 */
export declare function getIndexInChunk(x: number, y: number, z: number): ChunkIndex;
/**
 * Get in-chunk coordination from chunk index
 * @param index The index number in chunk
 */
export declare function getCoordFromIndex(index: ChunkIndex): {
    x: number;
    y: number;
    z: number;
};
export declare namespace RegionReader {
    /**
     * Get a chunk section in a region by chunk Y value.
     * @param region The region
     * @param chunkY The y value of the chunk. It should be from [0, 16)
     */
    function getSection(region: RegionDataFrame, chunkY: number): RegionSectionDataFrame;
    /**
     * Walk through all the position in this chunk and emit all the id in every position.
     * @param section The chunk section
     * @param reader The callback which will receive the position + state id.
     */
    function walkBlockStateId(section: RegionSectionDataFrame, reader: (x: number, y: number, z: number, id: number) => void): void;
    /**
     * Seek the section and get the block state id from the section.
     * @param section The section
     * @param index The chunk index
     */
    function seekBlockStateId(section: NewRegionSectionDataFrame | LegacyRegionSectionDataFrame, index: ChunkIndex): number;
    /**
     * Seek the block state data from new region format.
     * @param section The new region section
     * @param index The chunk index, which is a number in range [0, 4096)
     */
    function seekBlockState(section: NewRegionSectionDataFrame, index: ChunkIndex): BlockStateData;
}
/**
 * The Minecraft provided block state info. Only presented in the version >= 1.13 chunk data.
 */
export interface BlockStateData {
    Name: string;
    Properties: {
        [key: string]: string;
    };
}
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
    Pos: [
        number,
        number,
        number
    ];
    Rotation: [
        number,
        number,
        number
    ];
    Motion: [
        number,
        number,
        number
    ];
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
    Palette: Array<BlockStateData>;
    Data: number[];
    BlockLight: number[];
    SkyLight: number[];
    Y: number;
};
export declare type RegionSectionDataFrame = LegacyRegionSectionDataFrame | NewRegionSectionDataFrame;
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
    ForgeDataVersion?: number;
}
export {};
\/\/# sourceMappingURL=index.d.ts.map`;
definitions['assert.d.ts'] = `declare module 'assert' {
    /** An alias of \`assert.ok()\`. */
    function assert(value: any, message?: string | Error): asserts value;
    namespace assert {
        class AssertionError extends Error {
            actual: any;
            expected: any;
            operator: string;
            generatedMessage: boolean;
            code: 'ERR_ASSERTION';

            constructor(options?: {
                /** If provided, the error message is set to this value. */
                message?: string | undefined;
                /** The \`actual\` property on the error instance. */
                actual?: any;
                /** The \`expected\` property on the error instance. */
                expected?: any;
                /** The \`operator\` property on the error instance. */
                operator?: string | undefined;
                /** If provided, the generated stack trace omits frames before this function. */
                \/\/ tslint:disable-next-line:ban-types
                stackStartFn?: Function | undefined;
            });
        }

        class CallTracker {
            calls(exact?: number): () => void;
            calls<Func extends (...args: any[]) => any>(fn?: Func, exact?: number): Func;
            report(): CallTrackerReportInformation[];
            verify(): void;
        }
        interface CallTrackerReportInformation {
            message: string;
            /** The actual number of times the function was called. */
            actual: number;
            /** The number of times the function was expected to be called. */
            expected: number;
            /** The name of the function that is wrapped. */
            operator: string;
            /** A stack trace of the function. */
            stack: object;
        }

        type AssertPredicate = RegExp | (new () => object) | ((thrown: any) => boolean) | object | Error;

        function fail(message?: string | Error): never;
        /** @deprecated since v10.0.0 - use fail([message]) or other assert functions instead. */
        function fail(
            actual: any,
            expected: any,
            message?: string | Error,
            operator?: string,
            \/\/ tslint:disable-next-line:ban-types
            stackStartFn?: Function,
        ): never;
        function ok(value: any, message?: string | Error): asserts value;
        /** @deprecated since v9.9.0 - use strictEqual() instead. */
        function equal(actual: any, expected: any, message?: string | Error): void;
        /** @deprecated since v9.9.0 - use notStrictEqual() instead. */
        function notEqual(actual: any, expected: any, message?: string | Error): void;
        /** @deprecated since v9.9.0 - use deepStrictEqual() instead. */
        function deepEqual(actual: any, expected: any, message?: string | Error): void;
        /** @deprecated since v9.9.0 - use notDeepStrictEqual() instead. */
        function notDeepEqual(actual: any, expected: any, message?: string | Error): void;
        function strictEqual<T>(actual: any, expected: T, message?: string | Error): asserts actual is T;
        function notStrictEqual(actual: any, expected: any, message?: string | Error): void;
        function deepStrictEqual<T>(actual: any, expected: T, message?: string | Error): asserts actual is T;
        function notDeepStrictEqual(actual: any, expected: any, message?: string | Error): void;

        function throws(block: () => any, message?: string | Error): void;
        function throws(block: () => any, error: AssertPredicate, message?: string | Error): void;
        function doesNotThrow(block: () => any, message?: string | Error): void;
        function doesNotThrow(block: () => any, error: AssertPredicate, message?: string | Error): void;

        function ifError(value: any): asserts value is null | undefined;

        function rejects(block: (() => Promise<any>) | Promise<any>, message?: string | Error): Promise<void>;
        function rejects(
            block: (() => Promise<any>) | Promise<any>,
            error: AssertPredicate,
            message?: string | Error,
        ): Promise<void>;
        function doesNotReject(block: (() => Promise<any>) | Promise<any>, message?: string | Error): Promise<void>;
        function doesNotReject(
            block: (() => Promise<any>) | Promise<any>,
            error: AssertPredicate,
            message?: string | Error,
        ): Promise<void>;

        function match(value: string, regExp: RegExp, message?: string | Error): void;
        function doesNotMatch(value: string, regExp: RegExp, message?: string | Error): void;

        const strict: Omit<
            typeof assert,
            | 'equal'
            | 'notEqual'
            | 'deepEqual'
            | 'notDeepEqual'
            | 'ok'
            | 'strictEqual'
            | 'deepStrictEqual'
            | 'ifError'
            | 'strict'
        > & {
            (value: any, message?: string | Error): asserts value;
            equal: typeof strictEqual;
            notEqual: typeof notStrictEqual;
            deepEqual: typeof deepStrictEqual;
            notDeepEqual: typeof notDeepStrictEqual;

            \/\/ Mapped types and assertion functions are incompatible?
            \/\/ TS2775: Assertions require every name in the call target
            \/\/ to be declared with an explicit type annotation.
            ok: typeof ok;
            strictEqual: typeof strictEqual;
            deepStrictEqual: typeof deepStrictEqual;
            ifError: typeof ifError;
            strict: typeof strict;
        };
    }

    export = assert;
}
`;
definitions['async_hooks.d.ts'] = `/**
 * Async Hooks module: https:\/\/nodejs.org/api/async_hooks.html
 */
declare module 'async_hooks' {
    /**
     * Returns the asyncId of the current execution context.
     */
    function executionAsyncId(): number;

    /**
     * The resource representing the current execution.
     *  Useful to store data within the resource.
     *
     * Resource objects returned by \`executionAsyncResource()\` are most often internal
     * Node.js handle objects with undocumented APIs. Using any functions or properties
     * on the object is likely to crash your application and should be avoided.
     *
     * Using \`executionAsyncResource()\` in the top-level execution context will
     * return an empty object as there is no handle or request object to use,
     * but having an object representing the top-level can be helpful.
     */
    function executionAsyncResource(): object;

    /**
     * Returns the ID of the resource responsible for calling the callback that is currently being executed.
     */
    function triggerAsyncId(): number;

    interface HookCallbacks {
        /**
         * Called when a class is constructed that has the possibility to emit an asynchronous event.
         * @param asyncId a unique ID for the async resource
         * @param type the type of the async resource
         * @param triggerAsyncId the unique ID of the async resource in whose execution context this async resource was created
         * @param resource reference to the resource representing the async operation, needs to be released during destroy
         */
        init?(asyncId: number, type: string, triggerAsyncId: number, resource: object): void;

        /**
         * When an asynchronous operation is initiated or completes a callback is called to notify the user.
         * The before callback is called just before said callback is executed.
         * @param asyncId the unique identifier assigned to the resource about to execute the callback.
         */
        before?(asyncId: number): void;

        /**
         * Called immediately after the callback specified in before is completed.
         * @param asyncId the unique identifier assigned to the resource which has executed the callback.
         */
        after?(asyncId: number): void;

        /**
         * Called when a promise has resolve() called. This may not be in the same execution id
         * as the promise itself.
         * @param asyncId the unique id for the promise that was resolve()d.
         */
        promiseResolve?(asyncId: number): void;

        /**
         * Called after the resource corresponding to asyncId is destroyed
         * @param asyncId a unique ID for the async resource
         */
        destroy?(asyncId: number): void;
    }

    interface AsyncHook {
        /**
         * Enable the callbacks for a given AsyncHook instance. If no callbacks are provided enabling is a noop.
         */
        enable(): this;

        /**
         * Disable the callbacks for a given AsyncHook instance from the global pool of AsyncHook callbacks to be executed. Once a hook has been disabled it will not be called again until enabled.
         */
        disable(): this;
    }

    /**
     * Registers functions to be called for different lifetime events of each async operation.
     * @param options the callbacks to register
     * @return an AsyncHooks instance used for disabling and enabling hooks
     */
    function createHook(options: HookCallbacks): AsyncHook;

    interface AsyncResourceOptions {
      /**
       * The ID of the execution context that created this async event.
       * @default executionAsyncId()
       */
      triggerAsyncId?: number | undefined;

      /**
       * Disables automatic \`emitDestroy\` when the object is garbage collected.
       * This usually does not need to be set (even if \`emitDestroy\` is called
       * manually), unless the resource's \`asyncId\` is retrieved and the
       * sensitive API's \`emitDestroy\` is called with it.
       * @default false
       */
      requireManualDestroy?: boolean | undefined;
    }

    /**
     * The class AsyncResource was designed to be extended by the embedder's async resources.
     * Using this users can easily trigger the lifetime events of their own resources.
     */
    class AsyncResource {
        /**
         * AsyncResource() is meant to be extended. Instantiating a
         * new AsyncResource() also triggers init. If triggerAsyncId is omitted then
         * async_hook.executionAsyncId() is used.
         * @param type The type of async event.
         * @param triggerAsyncId The ID of the execution context that created
         *   this async event (default: \`executionAsyncId()\`), or an
         *   AsyncResourceOptions object (since 9.3)
         */
        constructor(type: string, triggerAsyncId?: number|AsyncResourceOptions);

        /**
         * Binds the given function to the current execution context.
         * @param fn The function to bind to the current execution context.
         * @param type An optional name to associate with the underlying \`AsyncResource\`.
         */
        static bind<Func extends (...args: any[]) => any>(fn: Func, type?: string): Func & { asyncResource: AsyncResource };

        /**
         * Binds the given function to execute to this \`AsyncResource\`'s scope.
         * @param fn The function to bind to the current \`AsyncResource\`.
         */
        bind<Func extends (...args: any[]) => any>(fn: Func): Func & { asyncResource: AsyncResource };

        /**
         * Call the provided function with the provided arguments in the
         * execution context of the async resource. This will establish the
         * context, trigger the AsyncHooks before callbacks, call the function,
         * trigger the AsyncHooks after callbacks, and then restore the original
         * execution context.
         * @param fn The function to call in the execution context of this
         *   async resource.
         * @param thisArg The receiver to be used for the function call.
         * @param args Optional arguments to pass to the function.
         */
        runInAsyncScope<This, Result>(fn: (this: This, ...args: any[]) => Result, thisArg?: This, ...args: any[]): Result;

        /**
         * Call AsyncHooks destroy callbacks.
         */
        emitDestroy(): this;

        /**
         * @return the unique ID assigned to this AsyncResource instance.
         */
        asyncId(): number;

        /**
         * @return the trigger ID for this AsyncResource instance.
         */
        triggerAsyncId(): number;
    }

    /**
     * When having multiple instances of \`AsyncLocalStorage\`, they are independent
     * from each other. It is safe to instantiate this class multiple times.
     */
    class AsyncLocalStorage<T> {
        /**
         * This method disables the instance of \`AsyncLocalStorage\`. All subsequent calls
         * to \`asyncLocalStorage.getStore()\` will return \`undefined\` until
         * \`asyncLocalStorage.run()\` is called again.
         *
         * When calling \`asyncLocalStorage.disable()\`, all current contexts linked to the
         * instance will be exited.
         *
         * Calling \`asyncLocalStorage.disable()\` is required before the
         * \`asyncLocalStorage\` can be garbage collected. This does not apply to stores
         * provided by the \`asyncLocalStorage\`, as those objects are garbage collected
         * along with the corresponding async resources.
         *
         * This method is to be used when the \`asyncLocalStorage\` is not in use anymore
         * in the current process.
         */
        disable(): void;

        /**
         * This method returns the current store. If this method is called outside of an
         * asynchronous context initialized by calling \`asyncLocalStorage.run\`, it will
         * return \`undefined\`.
         */
        getStore(): T | undefined;

        /**
         * This methods runs a function synchronously within a context and return its
         * return value. The store is not accessible outside of the callback function or
         * the asynchronous operations created within the callback.
         *
         * Optionally, arguments can be passed to the function. They will be passed to the
         * callback function.
         *
         * I the callback function throws an error, it will be thrown by \`run\` too. The
         * stacktrace will not be impacted by this call and the context will be exited.
         */
        \/\/ TODO: Apply generic vararg once available
        run<R>(store: T, callback: (...args: any[]) => R, ...args: any[]): R;

        /**
         * This methods runs a function synchronously outside of a context and return its
         * return value. The store is not accessible within the callback function or the
         * asynchronous operations created within the callback.
         *
         * Optionally, arguments can be passed to the function. They will be passed to the
         * callback function.
         *
         * If the callback function throws an error, it will be thrown by \`exit\` too. The
         * stacktrace will not be impacted by this call and the context will be
         * re-entered.
         */
        \/\/ TODO: Apply generic vararg once available
        exit<R>(callback: (...args: any[]) => R, ...args: any[]): R;

        /**
         * Calling \`asyncLocalStorage.enterWith(store)\` will transition into the context
         * for the remainder of the current synchronous execution and will persist
         * through any following asynchronous calls.
         */
        enterWith(store: T): void;
    }
}
`;
definitions['buffer.d.ts'] = `declare module 'buffer' {
    export const INSPECT_MAX_BYTES: number;
    export const kMaxLength: number;
    export const kStringMaxLength: number;
    export const constants: {
        MAX_LENGTH: number;
        MAX_STRING_LENGTH: number;
    };
    const BuffType: typeof Buffer;

    export type TranscodeEncoding = "ascii" | "utf8" | "utf16le" | "ucs2" | "latin1" | "binary";

    export function transcode(source: Uint8Array, fromEnc: TranscodeEncoding, toEnc: TranscodeEncoding): Buffer;

    export const SlowBuffer: {
        /** @deprecated since v6.0.0, use \`Buffer.allocUnsafeSlow()\` */
        new(size: number): Buffer;
        prototype: Buffer;
    };

    export { BuffType as Buffer };
}
`;
definitions['child_process.d.ts'] = `declare module 'child_process' {
    import { BaseEncodingOptions } from 'fs';
    import * as events from 'events';
    import * as net from 'net';
    import { Writable, Readable, Stream, Pipe } from 'stream';

    type Serializable = string | object | number | boolean;
    type SendHandle = net.Socket | net.Server;

    interface ChildProcess extends events.EventEmitter {
        stdin: Writable | null;
        stdout: Readable | null;
        stderr: Readable | null;
        readonly channel?: Pipe | null | undefined;
        readonly stdio: [
            Writable | null, \/\/ stdin
            Readable | null, \/\/ stdout
            Readable | null, \/\/ stderr
            Readable | Writable | null | undefined, \/\/ extra
            Readable | Writable | null | undefined \/\/ extra
        ];
        readonly killed: boolean;
        readonly pid: number;
        readonly connected: boolean;
        readonly exitCode: number | null;
        readonly signalCode: NodeJS.Signals | null;
        readonly spawnargs: string[];
        readonly spawnfile: string;
        kill(signal?: NodeJS.Signals | number): boolean;
        send(message: Serializable, callback?: (error: Error | null) => void): boolean;
        send(message: Serializable, sendHandle?: SendHandle, callback?: (error: Error | null) => void): boolean;
        send(message: Serializable, sendHandle?: SendHandle, options?: MessageOptions, callback?: (error: Error | null) => void): boolean;
        disconnect(): void;
        unref(): void;
        ref(): void;

        /**
         * events.EventEmitter
         * 1. close
         * 2. disconnect
         * 3. error
         * 4. exit
         * 5. message
         */

        addListener(event: string, listener: (...args: any[]) => void): this;
        addListener(event: "close", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
        addListener(event: "disconnect", listener: () => void): this;
        addListener(event: "error", listener: (err: Error) => void): this;
        addListener(event: "exit", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
        addListener(event: "message", listener: (message: Serializable, sendHandle: SendHandle) => void): this;

        emit(event: string | symbol, ...args: any[]): boolean;
        emit(event: "close", code: number | null, signal: NodeJS.Signals | null): boolean;
        emit(event: "disconnect"): boolean;
        emit(event: "error", err: Error): boolean;
        emit(event: "exit", code: number | null, signal: NodeJS.Signals | null): boolean;
        emit(event: "message", message: Serializable, sendHandle: SendHandle): boolean;

        on(event: string, listener: (...args: any[]) => void): this;
        on(event: "close", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
        on(event: "disconnect", listener: () => void): this;
        on(event: "error", listener: (err: Error) => void): this;
        on(event: "exit", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
        on(event: "message", listener: (message: Serializable, sendHandle: SendHandle) => void): this;

        once(event: string, listener: (...args: any[]) => void): this;
        once(event: "close", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
        once(event: "disconnect", listener: () => void): this;
        once(event: "error", listener: (err: Error) => void): this;
        once(event: "exit", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
        once(event: "message", listener: (message: Serializable, sendHandle: SendHandle) => void): this;

        prependListener(event: string, listener: (...args: any[]) => void): this;
        prependListener(event: "close", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
        prependListener(event: "disconnect", listener: () => void): this;
        prependListener(event: "error", listener: (err: Error) => void): this;
        prependListener(event: "exit", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
        prependListener(event: "message", listener: (message: Serializable, sendHandle: SendHandle) => void): this;

        prependOnceListener(event: string, listener: (...args: any[]) => void): this;
        prependOnceListener(event: "close", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
        prependOnceListener(event: "disconnect", listener: () => void): this;
        prependOnceListener(event: "error", listener: (err: Error) => void): this;
        prependOnceListener(event: "exit", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
        prependOnceListener(event: "message", listener: (message: Serializable, sendHandle: SendHandle) => void): this;
    }

    \/\/ return this object when stdio option is undefined or not specified
    interface ChildProcessWithoutNullStreams extends ChildProcess {
        stdin: Writable;
        stdout: Readable;
        stderr: Readable;
        readonly stdio: [
            Writable, \/\/ stdin
            Readable, \/\/ stdout
            Readable, \/\/ stderr
            Readable | Writable | null | undefined, \/\/ extra, no modification
            Readable | Writable | null | undefined \/\/ extra, no modification
        ];
    }

    \/\/ return this object when stdio option is a tuple of 3
    interface ChildProcessByStdio<
        I extends null | Writable,
        O extends null | Readable,
        E extends null | Readable,
    > extends ChildProcess {
        stdin: I;
        stdout: O;
        stderr: E;
        readonly stdio: [
            I,
            O,
            E,
            Readable | Writable | null | undefined, \/\/ extra, no modification
            Readable | Writable | null | undefined \/\/ extra, no modification
        ];
    }

    interface MessageOptions {
        keepOpen?: boolean | undefined;
    }

    type StdioOptions = "pipe" | "ignore" | "inherit" | Array<("pipe" | "ipc" | "ignore" | "inherit" | Stream | number | null | undefined)>;

    type SerializationType = 'json' | 'advanced';

    interface MessagingOptions {
        /**
         * Specify the kind of serialization used for sending messages between processes.
         * @default 'json'
         */
        serialization?: SerializationType | undefined;
    }

    interface ProcessEnvOptions {
        uid?: number | undefined;
        gid?: number | undefined;
        cwd?: string | undefined;
        env?: NodeJS.ProcessEnv | undefined;
    }

    interface CommonOptions extends ProcessEnvOptions {
        /**
         * @default true
         */
        windowsHide?: boolean | undefined;
        /**
         * @default 0
         */
        timeout?: number | undefined;
    }

    interface CommonSpawnOptions extends CommonOptions, MessagingOptions {
        argv0?: string | undefined;
        stdio?: StdioOptions | undefined;
        shell?: boolean | string | undefined;
        windowsVerbatimArguments?: boolean | undefined;
    }

    interface SpawnOptions extends CommonSpawnOptions {
        detached?: boolean | undefined;
    }

    interface SpawnOptionsWithoutStdio extends SpawnOptions {
        stdio?: 'pipe' | Array<null | undefined | 'pipe'> | undefined;
    }

    type StdioNull = 'inherit' | 'ignore' | Stream;
    type StdioPipe = undefined | null | 'pipe';

    interface SpawnOptionsWithStdioTuple<
        Stdin extends StdioNull | StdioPipe,
        Stdout extends StdioNull | StdioPipe,
        Stderr extends StdioNull | StdioPipe,
    > extends SpawnOptions {
        stdio: [Stdin, Stdout, Stderr];
    }

    \/\/ overloads of spawn without 'args'
    function spawn(command: string, options?: SpawnOptionsWithoutStdio): ChildProcessWithoutNullStreams;

    function spawn(
        command: string,
        options: SpawnOptionsWithStdioTuple<StdioPipe, StdioPipe, StdioPipe>,
    ): ChildProcessByStdio<Writable, Readable, Readable>;
    function spawn(
        command: string,
        options: SpawnOptionsWithStdioTuple<StdioPipe, StdioPipe, StdioNull>,
    ): ChildProcessByStdio<Writable, Readable, null>;
    function spawn(
        command: string,
        options: SpawnOptionsWithStdioTuple<StdioPipe, StdioNull, StdioPipe>,
    ): ChildProcessByStdio<Writable, null, Readable>;
    function spawn(
        command: string,
        options: SpawnOptionsWithStdioTuple<StdioNull, StdioPipe, StdioPipe>,
    ): ChildProcessByStdio<null, Readable, Readable>;
    function spawn(
        command: string,
        options: SpawnOptionsWithStdioTuple<StdioPipe, StdioNull, StdioNull>,
    ): ChildProcessByStdio<Writable, null, null>;
    function spawn(
        command: string,
        options: SpawnOptionsWithStdioTuple<StdioNull, StdioPipe, StdioNull>,
    ): ChildProcessByStdio<null, Readable, null>;
    function spawn(
        command: string,
        options: SpawnOptionsWithStdioTuple<StdioNull, StdioNull, StdioPipe>,
    ): ChildProcessByStdio<null, null, Readable>;
    function spawn(
        command: string,
        options: SpawnOptionsWithStdioTuple<StdioNull, StdioNull, StdioNull>,
    ): ChildProcessByStdio<null, null, null>;

    function spawn(command: string, options: SpawnOptions): ChildProcess;

    \/\/ overloads of spawn with 'args'
    function spawn(command: string, args?: ReadonlyArray<string>, options?: SpawnOptionsWithoutStdio): ChildProcessWithoutNullStreams;

    function spawn(
        command: string,
        args: ReadonlyArray<string>,
        options: SpawnOptionsWithStdioTuple<StdioPipe, StdioPipe, StdioPipe>,
    ): ChildProcessByStdio<Writable, Readable, Readable>;
    function spawn(
        command: string,
        args: ReadonlyArray<string>,
        options: SpawnOptionsWithStdioTuple<StdioPipe, StdioPipe, StdioNull>,
    ): ChildProcessByStdio<Writable, Readable, null>;
    function spawn(
        command: string,
        args: ReadonlyArray<string>,
        options: SpawnOptionsWithStdioTuple<StdioPipe, StdioNull, StdioPipe>,
    ): ChildProcessByStdio<Writable, null, Readable>;
    function spawn(
        command: string,
        args: ReadonlyArray<string>,
        options: SpawnOptionsWithStdioTuple<StdioNull, StdioPipe, StdioPipe>,
    ): ChildProcessByStdio<null, Readable, Readable>;
    function spawn(
        command: string,
        args: ReadonlyArray<string>,
        options: SpawnOptionsWithStdioTuple<StdioPipe, StdioNull, StdioNull>,
    ): ChildProcessByStdio<Writable, null, null>;
    function spawn(
        command: string,
        args: ReadonlyArray<string>,
        options: SpawnOptionsWithStdioTuple<StdioNull, StdioPipe, StdioNull>,
    ): ChildProcessByStdio<null, Readable, null>;
    function spawn(
        command: string,
        args: ReadonlyArray<string>,
        options: SpawnOptionsWithStdioTuple<StdioNull, StdioNull, StdioPipe>,
    ): ChildProcessByStdio<null, null, Readable>;
    function spawn(
        command: string,
        args: ReadonlyArray<string>,
        options: SpawnOptionsWithStdioTuple<StdioNull, StdioNull, StdioNull>,
    ): ChildProcessByStdio<null, null, null>;

    function spawn(command: string, args: ReadonlyArray<string>, options: SpawnOptions): ChildProcess;

    interface ExecOptions extends CommonOptions {
        shell?: string | undefined;
        maxBuffer?: number | undefined;
        killSignal?: NodeJS.Signals | number | undefined;
    }

    interface ExecOptionsWithStringEncoding extends ExecOptions {
        encoding: BufferEncoding;
    }

    interface ExecOptionsWithBufferEncoding extends ExecOptions {
        encoding: BufferEncoding | null; \/\/ specify \`null\`.
    }

    interface ExecException extends Error {
        cmd?: string | undefined;
        killed?: boolean | undefined;
        code?: number | undefined;
        signal?: NodeJS.Signals | undefined;
    }

    \/\/ no \`options\` definitely means stdout/stderr are \`string\`.
    function exec(command: string, callback?: (error: ExecException | null, stdout: string, stderr: string) => void): ChildProcess;

    \/\/ \`options\` with \`"buffer"\` or \`null\` for \`encoding\` means stdout/stderr are definitely \`Buffer\`.
    function exec(command: string, options: { encoding: "buffer" | null } & ExecOptions, callback?: (error: ExecException | null, stdout: Buffer, stderr: Buffer) => void): ChildProcess;

    \/\/ \`options\` with well known \`encoding\` means stdout/stderr are definitely \`string\`.
    function exec(command: string, options: { encoding: BufferEncoding } & ExecOptions, callback?: (error: ExecException | null, stdout: string, stderr: string) => void): ChildProcess;

    \/\/ \`options\` with an \`encoding\` whose type is \`string\` means stdout/stderr could either be \`Buffer\` or \`string\`.
    \/\/ There is no guarantee the \`encoding\` is unknown as \`string\` is a superset of \`BufferEncoding\`.
    function exec(
        command: string,
        options: { encoding: BufferEncoding } & ExecOptions,
        callback?: (error: ExecException | null, stdout: string | Buffer, stderr: string | Buffer) => void,
    ): ChildProcess;

    \/\/ \`options\` without an \`encoding\` means stdout/stderr are definitely \`string\`.
    function exec(command: string, options: ExecOptions, callback?: (error: ExecException | null, stdout: string, stderr: string) => void): ChildProcess;

    \/\/ fallback if nothing else matches. Worst case is always \`string | Buffer\`.
    function exec(
        command: string,
        options: (BaseEncodingOptions & ExecOptions) | undefined | null,
        callback?: (error: ExecException | null, stdout: string | Buffer, stderr: string | Buffer) => void,
    ): ChildProcess;

    interface PromiseWithChild<T> extends Promise<T> {
        child: ChildProcess;
    }

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    namespace exec {
        function __promisify__(command: string): PromiseWithChild<{ stdout: string, stderr: string }>;
        function __promisify__(command: string, options: { encoding: "buffer" | null } & ExecOptions): PromiseWithChild<{ stdout: Buffer, stderr: Buffer }>;
        function __promisify__(command: string, options: { encoding: BufferEncoding } & ExecOptions): PromiseWithChild<{ stdout: string, stderr: string }>;
        function __promisify__(command: string, options: ExecOptions): PromiseWithChild<{ stdout: string, stderr: string }>;
        function __promisify__(command: string, options?: (BaseEncodingOptions & ExecOptions) | null): PromiseWithChild<{ stdout: string | Buffer, stderr: string | Buffer }>;
    }

    interface ExecFileOptions extends CommonOptions {
        maxBuffer?: number | undefined;
        killSignal?: NodeJS.Signals | number | undefined;
        windowsVerbatimArguments?: boolean | undefined;
        shell?: boolean | string | undefined;
    }
    interface ExecFileOptionsWithStringEncoding extends ExecFileOptions {
        encoding: BufferEncoding;
    }
    interface ExecFileOptionsWithBufferEncoding extends ExecFileOptions {
        encoding: 'buffer' | null;
    }
    interface ExecFileOptionsWithOtherEncoding extends ExecFileOptions {
        encoding: BufferEncoding;
    }
    type ExecFileException = ExecException & NodeJS.ErrnoException;

    function execFile(file: string): ChildProcess;
    function execFile(file: string, options: (BaseEncodingOptions & ExecFileOptions) | undefined | null): ChildProcess;
    function execFile(file: string, args?: ReadonlyArray<string> | null): ChildProcess;
    function execFile(file: string, args: ReadonlyArray<string> | undefined | null, options: (BaseEncodingOptions & ExecFileOptions) | undefined | null): ChildProcess;

    \/\/ no \`options\` definitely means stdout/stderr are \`string\`.
    function execFile(file: string, callback: (error: ExecFileException | null, stdout: string, stderr: string) => void): ChildProcess;
    function execFile(file: string, args: ReadonlyArray<string> | undefined | null, callback: (error: ExecFileException | null, stdout: string, stderr: string) => void): ChildProcess;

    \/\/ \`options\` with \`"buffer"\` or \`null\` for \`encoding\` means stdout/stderr are definitely \`Buffer\`.
    function execFile(file: string, options: ExecFileOptionsWithBufferEncoding, callback: (error: ExecFileException | null, stdout: Buffer, stderr: Buffer) => void): ChildProcess;
    function execFile(
        file: string,
        args: ReadonlyArray<string> | undefined | null,
        options: ExecFileOptionsWithBufferEncoding,
        callback: (error: ExecFileException | null, stdout: Buffer, stderr: Buffer) => void,
    ): ChildProcess;

    \/\/ \`options\` with well known \`encoding\` means stdout/stderr are definitely \`string\`.
    function execFile(file: string, options: ExecFileOptionsWithStringEncoding, callback: (error: ExecFileException | null, stdout: string, stderr: string) => void): ChildProcess;
    function execFile(
        file: string,
        args: ReadonlyArray<string> | undefined | null,
        options: ExecFileOptionsWithStringEncoding,
        callback: (error: ExecFileException | null, stdout: string, stderr: string) => void,
    ): ChildProcess;

    \/\/ \`options\` with an \`encoding\` whose type is \`string\` means stdout/stderr could either be \`Buffer\` or \`string\`.
    \/\/ There is no guarantee the \`encoding\` is unknown as \`string\` is a superset of \`BufferEncoding\`.
    function execFile(
        file: string,
        options: ExecFileOptionsWithOtherEncoding,
        callback: (error: ExecFileException | null, stdout: string | Buffer, stderr: string | Buffer) => void,
    ): ChildProcess;
    function execFile(
        file: string,
        args: ReadonlyArray<string> | undefined | null,
        options: ExecFileOptionsWithOtherEncoding,
        callback: (error: ExecFileException | null, stdout: string | Buffer, stderr: string | Buffer) => void,
    ): ChildProcess;

    \/\/ \`options\` without an \`encoding\` means stdout/stderr are definitely \`string\`.
    function execFile(file: string, options: ExecFileOptions, callback: (error: ExecFileException | null, stdout: string, stderr: string) => void): ChildProcess;
    function execFile(
        file: string,
        args: ReadonlyArray<string> | undefined | null,
        options: ExecFileOptions,
        callback: (error: ExecFileException | null, stdout: string, stderr: string) => void
    ): ChildProcess;

    \/\/ fallback if nothing else matches. Worst case is always \`string | Buffer\`.
    function execFile(
        file: string,
        options: (BaseEncodingOptions & ExecFileOptions) | undefined | null,
        callback: ((error: ExecFileException | null, stdout: string | Buffer, stderr: string | Buffer) => void) | undefined | null,
    ): ChildProcess;
    function execFile(
        file: string,
        args: ReadonlyArray<string> | undefined | null,
        options: (BaseEncodingOptions & ExecFileOptions) | undefined | null,
        callback: ((error: ExecFileException | null, stdout: string | Buffer, stderr: string | Buffer) => void) | undefined | null,
    ): ChildProcess;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    namespace execFile {
        function __promisify__(file: string): PromiseWithChild<{ stdout: string, stderr: string }>;
        function __promisify__(file: string, args: ReadonlyArray<string> | undefined | null): PromiseWithChild<{ stdout: string, stderr: string }>;
        function __promisify__(file: string, options: ExecFileOptionsWithBufferEncoding): PromiseWithChild<{ stdout: Buffer, stderr: Buffer }>;
        function __promisify__(file: string, args: ReadonlyArray<string> | undefined | null, options: ExecFileOptionsWithBufferEncoding): PromiseWithChild<{ stdout: Buffer, stderr: Buffer }>;
        function __promisify__(file: string, options: ExecFileOptionsWithStringEncoding): PromiseWithChild<{ stdout: string, stderr: string }>;
        function __promisify__(file: string, args: ReadonlyArray<string> | undefined | null, options: ExecFileOptionsWithStringEncoding): PromiseWithChild<{ stdout: string, stderr: string }>;
        function __promisify__(file: string, options: ExecFileOptionsWithOtherEncoding): PromiseWithChild<{ stdout: string | Buffer, stderr: string | Buffer }>;
        function __promisify__(
            file: string,
            args: ReadonlyArray<string> | undefined | null,
            options: ExecFileOptionsWithOtherEncoding,
        ): PromiseWithChild<{ stdout: string | Buffer, stderr: string | Buffer }>;
        function __promisify__(file: string, options: ExecFileOptions): PromiseWithChild<{ stdout: string, stderr: string }>;
        function __promisify__(file: string, args: ReadonlyArray<string> | undefined | null, options: ExecFileOptions): PromiseWithChild<{ stdout: string, stderr: string }>;
        function __promisify__(file: string, options: (BaseEncodingOptions & ExecFileOptions) | undefined | null): PromiseWithChild<{ stdout: string | Buffer, stderr: string | Buffer }>;
        function __promisify__(
            file: string,
            args: ReadonlyArray<string> | undefined | null,
            options: (BaseEncodingOptions & ExecFileOptions) | undefined | null,
        ): PromiseWithChild<{ stdout: string | Buffer, stderr: string | Buffer }>;
    }

    interface ForkOptions extends ProcessEnvOptions, MessagingOptions {
        execPath?: string | undefined;
        execArgv?: string[] | undefined;
        silent?: boolean | undefined;
        stdio?: StdioOptions | undefined;
        detached?: boolean | undefined;
        windowsVerbatimArguments?: boolean | undefined;
    }
    function fork(modulePath: string, options?: ForkOptions): ChildProcess;
    function fork(modulePath: string, args?: ReadonlyArray<string>, options?: ForkOptions): ChildProcess;

    interface SpawnSyncOptions extends CommonSpawnOptions {
        input?: string | NodeJS.ArrayBufferView | undefined;
        killSignal?: NodeJS.Signals | number | undefined;
        maxBuffer?: number | undefined;
        encoding?: BufferEncoding | 'buffer' | null | undefined;
    }
    interface SpawnSyncOptionsWithStringEncoding extends SpawnSyncOptions {
        encoding: BufferEncoding;
    }
    interface SpawnSyncOptionsWithBufferEncoding extends SpawnSyncOptions {
        encoding?: 'buffer' | null | undefined;
    }
    interface SpawnSyncReturns<T> {
        pid: number;
        output: Array<T | null>;
        stdout: T;
        stderr: T;
        status: number | null;
        signal: NodeJS.Signals | null;
        error?: Error | undefined;
    }
    function spawnSync(command: string): SpawnSyncReturns<Buffer>;
    function spawnSync(command: string, options?: SpawnSyncOptionsWithStringEncoding): SpawnSyncReturns<string>;
    function spawnSync(command: string, options?: SpawnSyncOptionsWithBufferEncoding): SpawnSyncReturns<Buffer>;
    function spawnSync(command: string, options?: SpawnSyncOptions): SpawnSyncReturns<string | Buffer>;
    function spawnSync(command: string, args?: ReadonlyArray<string>, options?: SpawnSyncOptionsWithStringEncoding): SpawnSyncReturns<string>;
    function spawnSync(command: string, args?: ReadonlyArray<string>, options?: SpawnSyncOptionsWithBufferEncoding): SpawnSyncReturns<Buffer>;
    function spawnSync(command: string, args?: ReadonlyArray<string>, options?: SpawnSyncOptions): SpawnSyncReturns<string | Buffer>;

    interface ExecSyncOptions extends CommonOptions {
        input?: string | Uint8Array | undefined;
        stdio?: StdioOptions | undefined;
        shell?: string | undefined;
        killSignal?: NodeJS.Signals | number | undefined;
        maxBuffer?: number | undefined;
        encoding?: BufferEncoding | 'buffer' | null | undefined;
    }
    interface ExecSyncOptionsWithStringEncoding extends ExecSyncOptions {
        encoding: BufferEncoding;
    }
    interface ExecSyncOptionsWithBufferEncoding extends ExecSyncOptions {
        encoding?: 'buffer' | null | undefined;
    }
    function execSync(command: string): Buffer;
    function execSync(command: string, options: ExecSyncOptionsWithStringEncoding): string;
    function execSync(command: string, options: ExecSyncOptionsWithBufferEncoding): Buffer;
    function execSync(command: string, options?: ExecSyncOptions): string | Buffer;

    interface ExecFileSyncOptions extends CommonOptions {
        input?: string | NodeJS.ArrayBufferView | undefined;
        stdio?: StdioOptions | undefined;
        killSignal?: NodeJS.Signals | number | undefined;
        maxBuffer?: number | undefined;
        encoding?: BufferEncoding | undefined;
        shell?: boolean | string | undefined;
    }
    interface ExecFileSyncOptionsWithStringEncoding extends ExecFileSyncOptions {
        encoding: BufferEncoding;
    }
    interface ExecFileSyncOptionsWithBufferEncoding extends ExecFileSyncOptions {
        encoding: BufferEncoding; \/\/ specify \`null\`.
    }
    function execFileSync(command: string): Buffer;
    function execFileSync(command: string, options: ExecFileSyncOptionsWithStringEncoding): string;
    function execFileSync(command: string, options: ExecFileSyncOptionsWithBufferEncoding): Buffer;
    function execFileSync(command: string, options?: ExecFileSyncOptions): string | Buffer;
    function execFileSync(command: string, args: ReadonlyArray<string>): Buffer;
    function execFileSync(command: string, args: ReadonlyArray<string>, options: ExecFileSyncOptionsWithStringEncoding): string;
    function execFileSync(command: string, args: ReadonlyArray<string>, options: ExecFileSyncOptionsWithBufferEncoding): Buffer;
    function execFileSync(command: string, args?: ReadonlyArray<string>, options?: ExecFileSyncOptions): string | Buffer;
}
`;
definitions['cluster.d.ts'] = `declare module 'cluster' {
    import * as child from 'child_process';
    import EventEmitter = require('events');
    import * as net from 'net';

    \/\/ interfaces
    interface ClusterSettings {
        execArgv?: string[] | undefined; \/\/ default: process.execArgv
        exec?: string | undefined;
        args?: string[] | undefined;
        silent?: boolean | undefined;
        stdio?: any[] | undefined;
        uid?: number | undefined;
        gid?: number | undefined;
        inspectPort?: number | (() => number) | undefined;
    }

    interface Address {
        address: string;
        port: number;
        addressType: number | "udp4" | "udp6";  \/\/ 4, 6, -1, "udp4", "udp6"
    }

    class Worker extends EventEmitter {
        id: number;
        process: child.ChildProcess;
        send(message: child.Serializable, sendHandle?: child.SendHandle, callback?: (error: Error | null) => void): boolean;
        kill(signal?: string): void;
        destroy(signal?: string): void;
        disconnect(): void;
        isConnected(): boolean;
        isDead(): boolean;
        exitedAfterDisconnect: boolean;

        /**
         * events.EventEmitter
         *   1. disconnect
         *   2. error
         *   3. exit
         *   4. listening
         *   5. message
         *   6. online
         */
        addListener(event: string, listener: (...args: any[]) => void): this;
        addListener(event: "disconnect", listener: () => void): this;
        addListener(event: "error", listener: (error: Error) => void): this;
        addListener(event: "exit", listener: (code: number, signal: string) => void): this;
        addListener(event: "listening", listener: (address: Address) => void): this;
        addListener(event: "message", listener: (message: any, handle: net.Socket | net.Server) => void): this;  \/\/ the handle is a net.Socket or net.Server object, or undefined.
        addListener(event: "online", listener: () => void): this;

        emit(event: string | symbol, ...args: any[]): boolean;
        emit(event: "disconnect"): boolean;
        emit(event: "error", error: Error): boolean;
        emit(event: "exit", code: number, signal: string): boolean;
        emit(event: "listening", address: Address): boolean;
        emit(event: "message", message: any, handle: net.Socket | net.Server): boolean;
        emit(event: "online"): boolean;

        on(event: string, listener: (...args: any[]) => void): this;
        on(event: "disconnect", listener: () => void): this;
        on(event: "error", listener: (error: Error) => void): this;
        on(event: "exit", listener: (code: number, signal: string) => void): this;
        on(event: "listening", listener: (address: Address) => void): this;
        on(event: "message", listener: (message: any, handle: net.Socket | net.Server) => void): this;  \/\/ the handle is a net.Socket or net.Server object, or undefined.
        on(event: "online", listener: () => void): this;

        once(event: string, listener: (...args: any[]) => void): this;
        once(event: "disconnect", listener: () => void): this;
        once(event: "error", listener: (error: Error) => void): this;
        once(event: "exit", listener: (code: number, signal: string) => void): this;
        once(event: "listening", listener: (address: Address) => void): this;
        once(event: "message", listener: (message: any, handle: net.Socket | net.Server) => void): this;  \/\/ the handle is a net.Socket or net.Server object, or undefined.
        once(event: "online", listener: () => void): this;

        prependListener(event: string, listener: (...args: any[]) => void): this;
        prependListener(event: "disconnect", listener: () => void): this;
        prependListener(event: "error", listener: (error: Error) => void): this;
        prependListener(event: "exit", listener: (code: number, signal: string) => void): this;
        prependListener(event: "listening", listener: (address: Address) => void): this;
        prependListener(event: "message", listener: (message: any, handle: net.Socket | net.Server) => void): this;  \/\/ the handle is a net.Socket or net.Server object, or undefined.
        prependListener(event: "online", listener: () => void): this;

        prependOnceListener(event: string, listener: (...args: any[]) => void): this;
        prependOnceListener(event: "disconnect", listener: () => void): this;
        prependOnceListener(event: "error", listener: (error: Error) => void): this;
        prependOnceListener(event: "exit", listener: (code: number, signal: string) => void): this;
        prependOnceListener(event: "listening", listener: (address: Address) => void): this;
        prependOnceListener(event: "message", listener: (message: any, handle: net.Socket | net.Server) => void): this;  \/\/ the handle is a net.Socket or net.Server object, or undefined.
        prependOnceListener(event: "online", listener: () => void): this;
    }

    interface Cluster extends EventEmitter {
        Worker: Worker;
        disconnect(callback?: () => void): void;
        fork(env?: any): Worker;
        isMaster: boolean;
        isWorker: boolean;
        schedulingPolicy: number;
        settings: ClusterSettings;
        setupMaster(settings?: ClusterSettings): void;
        worker?: Worker | undefined;
        workers?: NodeJS.Dict<Worker> | undefined;

        readonly SCHED_NONE: number;
        readonly SCHED_RR: number;

        /**
         * events.EventEmitter
         *   1. disconnect
         *   2. exit
         *   3. fork
         *   4. listening
         *   5. message
         *   6. online
         *   7. setup
         */
        addListener(event: string, listener: (...args: any[]) => void): this;
        addListener(event: "disconnect", listener: (worker: Worker) => void): this;
        addListener(event: "exit", listener: (worker: Worker, code: number, signal: string) => void): this;
        addListener(event: "fork", listener: (worker: Worker) => void): this;
        addListener(event: "listening", listener: (worker: Worker, address: Address) => void): this;
        addListener(event: "message", listener: (worker: Worker, message: any, handle: net.Socket | net.Server) => void): this;  \/\/ the handle is a net.Socket or net.Server object, or undefined.
        addListener(event: "online", listener: (worker: Worker) => void): this;
        addListener(event: "setup", listener: (settings: ClusterSettings) => void): this;

        emit(event: string | symbol, ...args: any[]): boolean;
        emit(event: "disconnect", worker: Worker): boolean;
        emit(event: "exit", worker: Worker, code: number, signal: string): boolean;
        emit(event: "fork", worker: Worker): boolean;
        emit(event: "listening", worker: Worker, address: Address): boolean;
        emit(event: "message", worker: Worker, message: any, handle: net.Socket | net.Server): boolean;
        emit(event: "online", worker: Worker): boolean;
        emit(event: "setup", settings: ClusterSettings): boolean;

        on(event: string, listener: (...args: any[]) => void): this;
        on(event: "disconnect", listener: (worker: Worker) => void): this;
        on(event: "exit", listener: (worker: Worker, code: number, signal: string) => void): this;
        on(event: "fork", listener: (worker: Worker) => void): this;
        on(event: "listening", listener: (worker: Worker, address: Address) => void): this;
        on(event: "message", listener: (worker: Worker, message: any, handle: net.Socket | net.Server) => void): this;  \/\/ the handle is a net.Socket or net.Server object, or undefined.
        on(event: "online", listener: (worker: Worker) => void): this;
        on(event: "setup", listener: (settings: ClusterSettings) => void): this;

        once(event: string, listener: (...args: any[]) => void): this;
        once(event: "disconnect", listener: (worker: Worker) => void): this;
        once(event: "exit", listener: (worker: Worker, code: number, signal: string) => void): this;
        once(event: "fork", listener: (worker: Worker) => void): this;
        once(event: "listening", listener: (worker: Worker, address: Address) => void): this;
        once(event: "message", listener: (worker: Worker, message: any, handle: net.Socket | net.Server) => void): this;  \/\/ the handle is a net.Socket or net.Server object, or undefined.
        once(event: "online", listener: (worker: Worker) => void): this;
        once(event: "setup", listener: (settings: ClusterSettings) => void): this;

        prependListener(event: string, listener: (...args: any[]) => void): this;
        prependListener(event: "disconnect", listener: (worker: Worker) => void): this;
        prependListener(event: "exit", listener: (worker: Worker, code: number, signal: string) => void): this;
        prependListener(event: "fork", listener: (worker: Worker) => void): this;
        prependListener(event: "listening", listener: (worker: Worker, address: Address) => void): this;
        prependListener(event: "message", listener: (worker: Worker, message: any, handle: net.Socket | net.Server) => void): this;  \/\/ the handle is a net.Socket or net.Server object, or undefined.
        prependListener(event: "online", listener: (worker: Worker) => void): this;
        prependListener(event: "setup", listener: (settings: ClusterSettings) => void): this;

        prependOnceListener(event: string, listener: (...args: any[]) => void): this;
        prependOnceListener(event: "disconnect", listener: (worker: Worker) => void): this;
        prependOnceListener(event: "exit", listener: (worker: Worker, code: number, signal: string) => void): this;
        prependOnceListener(event: "fork", listener: (worker: Worker) => void): this;
        prependOnceListener(event: "listening", listener: (worker: Worker, address: Address) => void): this;
        \/\/ the handle is a net.Socket or net.Server object, or undefined.
        prependOnceListener(event: "message", listener: (worker: Worker, message: any, handle: net.Socket | net.Server) => void): this;
        prependOnceListener(event: "online", listener: (worker: Worker) => void): this;
        prependOnceListener(event: "setup", listener: (settings: ClusterSettings) => void): this;
    }

    const SCHED_NONE: number;
    const SCHED_RR: number;

    function disconnect(callback?: () => void): void;
    function fork(env?: any): Worker;
    const isMaster: boolean;
    const isWorker: boolean;
    let schedulingPolicy: number;
    const settings: ClusterSettings;
    function setupMaster(settings?: ClusterSettings): void;
    const worker: Worker;
    const workers: NodeJS.Dict<Worker>;

    /**
     * events.EventEmitter
     *   1. disconnect
     *   2. exit
     *   3. fork
     *   4. listening
     *   5. message
     *   6. online
     *   7. setup
     */
    function addListener(event: string, listener: (...args: any[]) => void): Cluster;
    function addListener(event: "disconnect", listener: (worker: Worker) => void): Cluster;
    function addListener(event: "exit", listener: (worker: Worker, code: number, signal: string) => void): Cluster;
    function addListener(event: "fork", listener: (worker: Worker) => void): Cluster;
    function addListener(event: "listening", listener: (worker: Worker, address: Address) => void): Cluster;
     \/\/ the handle is a net.Socket or net.Server object, or undefined.
    function addListener(event: "message", listener: (worker: Worker, message: any, handle: net.Socket | net.Server) => void): Cluster;
    function addListener(event: "online", listener: (worker: Worker) => void): Cluster;
    function addListener(event: "setup", listener: (settings: ClusterSettings) => void): Cluster;

    function emit(event: string | symbol, ...args: any[]): boolean;
    function emit(event: "disconnect", worker: Worker): boolean;
    function emit(event: "exit", worker: Worker, code: number, signal: string): boolean;
    function emit(event: "fork", worker: Worker): boolean;
    function emit(event: "listening", worker: Worker, address: Address): boolean;
    function emit(event: "message", worker: Worker, message: any, handle: net.Socket | net.Server): boolean;
    function emit(event: "online", worker: Worker): boolean;
    function emit(event: "setup", settings: ClusterSettings): boolean;

    function on(event: string, listener: (...args: any[]) => void): Cluster;
    function on(event: "disconnect", listener: (worker: Worker) => void): Cluster;
    function on(event: "exit", listener: (worker: Worker, code: number, signal: string) => void): Cluster;
    function on(event: "fork", listener: (worker: Worker) => void): Cluster;
    function on(event: "listening", listener: (worker: Worker, address: Address) => void): Cluster;
    function on(event: "message", listener: (worker: Worker, message: any, handle: net.Socket | net.Server) => void): Cluster;  \/\/ the handle is a net.Socket or net.Server object, or undefined.
    function on(event: "online", listener: (worker: Worker) => void): Cluster;
    function on(event: "setup", listener: (settings: ClusterSettings) => void): Cluster;

    function once(event: string, listener: (...args: any[]) => void): Cluster;
    function once(event: "disconnect", listener: (worker: Worker) => void): Cluster;
    function once(event: "exit", listener: (worker: Worker, code: number, signal: string) => void): Cluster;
    function once(event: "fork", listener: (worker: Worker) => void): Cluster;
    function once(event: "listening", listener: (worker: Worker, address: Address) => void): Cluster;
    function once(event: "message", listener: (worker: Worker, message: any, handle: net.Socket | net.Server) => void): Cluster;  \/\/ the handle is a net.Socket or net.Server object, or undefined.
    function once(event: "online", listener: (worker: Worker) => void): Cluster;
    function once(event: "setup", listener: (settings: ClusterSettings) => void): Cluster;

    function removeListener(event: string, listener: (...args: any[]) => void): Cluster;
    function removeAllListeners(event?: string): Cluster;
    function setMaxListeners(n: number): Cluster;
    function getMaxListeners(): number;
    function listeners(event: string): Function[];
    function listenerCount(type: string): number;

    function prependListener(event: string, listener: (...args: any[]) => void): Cluster;
    function prependListener(event: "disconnect", listener: (worker: Worker) => void): Cluster;
    function prependListener(event: "exit", listener: (worker: Worker, code: number, signal: string) => void): Cluster;
    function prependListener(event: "fork", listener: (worker: Worker) => void): Cluster;
    function prependListener(event: "listening", listener: (worker: Worker, address: Address) => void): Cluster;
     \/\/ the handle is a net.Socket or net.Server object, or undefined.
    function prependListener(event: "message", listener: (worker: Worker, message: any, handle: net.Socket | net.Server) => void): Cluster;
    function prependListener(event: "online", listener: (worker: Worker) => void): Cluster;
    function prependListener(event: "setup", listener: (settings: ClusterSettings) => void): Cluster;

    function prependOnceListener(event: string, listener: (...args: any[]) => void): Cluster;
    function prependOnceListener(event: "disconnect", listener: (worker: Worker) => void): Cluster;
    function prependOnceListener(event: "exit", listener: (worker: Worker, code: number, signal: string) => void): Cluster;
    function prependOnceListener(event: "fork", listener: (worker: Worker) => void): Cluster;
    function prependOnceListener(event: "listening", listener: (worker: Worker, address: Address) => void): Cluster;
     \/\/ the handle is a net.Socket or net.Server object, or undefined.
    function prependOnceListener(event: "message", listener: (worker: Worker, message: any, handle: net.Socket | net.Server) => void): Cluster;
    function prependOnceListener(event: "online", listener: (worker: Worker) => void): Cluster;
    function prependOnceListener(event: "setup", listener: (settings: ClusterSettings) => void): Cluster;

    function eventNames(): string[];
}
`;
definitions['console.d.ts'] = `declare module 'console' {
    import { InspectOptions } from 'util';

    global {
        \/\/ This needs to be global to avoid TS2403 in case lib.dom.d.ts is present in the same build
        interface Console {
            Console: NodeJS.ConsoleConstructor;
            /**
             * A simple assertion test that verifies whether \`value\` is truthy.
             * If it is not, an \`AssertionError\` is thrown.
             * If provided, the error \`message\` is formatted using \`util.format()\` and used as the error message.
             */
            assert(value: any, message?: string, ...optionalParams: any[]): void;
            /**
             * When \`stdout\` is a TTY, calling \`console.clear()\` will attempt to clear the TTY.
             * When \`stdout\` is not a TTY, this method does nothing.
             */
            clear(): void;
            /**
             * Maintains an internal counter specific to \`label\` and outputs to \`stdout\` the number of times \`console.count()\` has been called with the given \`label\`.
             */
            count(label?: string): void;
            /**
             * Resets the internal counter specific to \`label\`.
             */
            countReset(label?: string): void;
            /**
             * The \`console.debug()\` function is an alias for {@link console.log}.
             */
            debug(message?: any, ...optionalParams: any[]): void;
            /**
             * Uses {@link util.inspect} on \`obj\` and prints the resulting string to \`stdout\`.
             * This function bypasses any custom \`inspect()\` function defined on \`obj\`.
             */
            dir(obj: any, options?: InspectOptions): void;
            /**
             * This method calls {@link console.log} passing it the arguments received. Please note that this method does not produce any XML formatting
             */
            dirxml(...data: any[]): void;
            /**
             * Prints to \`stderr\` with newline.
             */
            error(message?: any, ...optionalParams: any[]): void;
            /**
             * Increases indentation of subsequent lines by two spaces.
             * If one or more \`label\`s are provided, those are printed first without the additional indentation.
             */
            group(...label: any[]): void;
            /**
             * The \`console.groupCollapsed()\` function is an alias for {@link console.group}.
             */
            groupCollapsed(...label: any[]): void;
            /**
             * Decreases indentation of subsequent lines by two spaces.
             */
            groupEnd(): void;
            /**
             * The {@link console.info} function is an alias for {@link console.log}.
             */
            info(message?: any, ...optionalParams: any[]): void;
            /**
             * Prints to \`stdout\` with newline.
             */
            log(message?: any, ...optionalParams: any[]): void;
            /**
             * This method does not display anything unless used in the inspector.
             *  Prints to \`stdout\` the array \`array\` formatted as a table.
             */
            table(tabularData: any, properties?: ReadonlyArray<string>): void;
            /**
             * Starts a timer that can be used to compute the duration of an operation. Timers are identified by a unique \`label\`.
             */
            time(label?: string): void;
            /**
             * Stops a timer that was previously started by calling {@link console.time} and prints the result to \`stdout\`.
             */
            timeEnd(label?: string): void;
            /**
             * For a timer that was previously started by calling {@link console.time}, prints the elapsed time and other \`data\` arguments to \`stdout\`.
             */
            timeLog(label?: string, ...data: any[]): void;
            /**
             * Prints to \`stderr\` the string 'Trace :', followed by the {@link util.format} formatted message and stack trace to the current position in the code.
             */
            trace(message?: any, ...optionalParams: any[]): void;
            /**
             * The {@link console.warn} function is an alias for {@link console.error}.
             */
            warn(message?: any, ...optionalParams: any[]): void;

            \/\/ --- Inspector mode only ---
            /**
             * This method does not display anything unless used in the inspector.
             *  Starts a JavaScript CPU profile with an optional label.
             */
            profile(label?: string): void;
            /**
             * This method does not display anything unless used in the inspector.
             *  Stops the current JavaScript CPU profiling session if one has been started and prints the report to the Profiles panel of the inspector.
             */
            profileEnd(label?: string): void;
            /**
             * This method does not display anything unless used in the inspector.
             *  Adds an event with the label \`label\` to the Timeline panel of the inspector.
             */
            timeStamp(label?: string): void;
        }

        var console: Console;

        namespace NodeJS {
            interface ConsoleConstructorOptions {
                stdout: WritableStream;
                stderr?: WritableStream | undefined;
                ignoreErrors?: boolean | undefined;
                colorMode?: boolean | 'auto' | undefined;
                inspectOptions?: InspectOptions | undefined;
                /**
                 * Set group indentation
                 * @default 2
                 */
                 groupIndentation?: number | undefined;
            }

            interface ConsoleConstructor {
                prototype: Console;
                new(stdout: WritableStream, stderr?: WritableStream, ignoreErrors?: boolean): Console;
                new(options: ConsoleConstructorOptions): Console;
            }

            interface Global {
                console: typeof console;
            }
        }
    }

    export = console;
}
`;
definitions['constants.d.ts'] = `/** @deprecated since v6.3.0 - use constants property exposed by the relevant module instead. */
declare module 'constants' {
    import { constants as osConstants, SignalConstants } from 'os';
    import { constants as cryptoConstants } from 'crypto';
    import { constants as fsConstants } from 'fs';

    const exp: typeof osConstants.errno &
        typeof osConstants.priority &
        SignalConstants &
        typeof cryptoConstants &
        typeof fsConstants;
    export = exp;
}
`;
definitions['crypto.d.ts'] = `declare module 'crypto' {
    import * as stream from 'stream';

    interface Certificate {
        /**
         * @param spkac
         * @returns The challenge component of the \`spkac\` data structure,
         * which includes a public key and a challenge.
         */
        exportChallenge(spkac: BinaryLike): Buffer;
        /**
         * @param spkac
         * @param encoding The encoding of the spkac string.
         * @returns The public key component of the \`spkac\` data structure,
         * which includes a public key and a challenge.
         */
        exportPublicKey(spkac: BinaryLike, encoding?: string): Buffer;
        /**
         * @param spkac
         * @returns \`true\` if the given \`spkac\` data structure is valid,
         * \`false\` otherwise.
         */
        verifySpkac(spkac: NodeJS.ArrayBufferView): boolean;
    }
    const Certificate: Certificate & {
        /** @deprecated since v14.9.0 - Use static methods of \`crypto.Certificate\` instead. */
        new (): Certificate;
        /** @deprecated since v14.9.0 - Use static methods of \`crypto.Certificate\` instead. */
        (): Certificate;
    };

    namespace constants {
        \/\/ https:\/\/nodejs.org/dist/latest-v10.x/docs/api/crypto.html#crypto_crypto_constants
        const OPENSSL_VERSION_NUMBER: number;

        /** Applies multiple bug workarounds within OpenSSL. See https:\/\/www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html for detail. */
        const SSL_OP_ALL: number;
        /** Allows legacy insecure renegotiation between OpenSSL and unpatched clients or servers. See https:\/\/www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html. */
        const SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION: number;
        /** Attempts to use the server's preferences instead of the client's when selecting a cipher. See https:\/\/www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html. */
        const SSL_OP_CIPHER_SERVER_PREFERENCE: number;
        /** Instructs OpenSSL to use Cisco's "speshul" version of DTLS_BAD_VER. */
        const SSL_OP_CISCO_ANYCONNECT: number;
        /** Instructs OpenSSL to turn on cookie exchange. */
        const SSL_OP_COOKIE_EXCHANGE: number;
        /** Instructs OpenSSL to add server-hello extension from an early version of the cryptopro draft. */
        const SSL_OP_CRYPTOPRO_TLSEXT_BUG: number;
        /** Instructs OpenSSL to disable a SSL 3.0/TLS 1.0 vulnerability workaround added in OpenSSL 0.9.6d. */
        const SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS: number;
        /** Instructs OpenSSL to always use the tmp_rsa key when performing RSA operations. */
        const SSL_OP_EPHEMERAL_RSA: number;
        /** Allows initial connection to servers that do not support RI. */
        const SSL_OP_LEGACY_SERVER_CONNECT: number;
        const SSL_OP_MICROSOFT_BIG_SSLV3_BUFFER: number;
        const SSL_OP_MICROSOFT_SESS_ID_BUG: number;
        /** Instructs OpenSSL to disable the workaround for a man-in-the-middle protocol-version vulnerability in the SSL 2.0 server implementation. */
        const SSL_OP_MSIE_SSLV2_RSA_PADDING: number;
        const SSL_OP_NETSCAPE_CA_DN_BUG: number;
        const SSL_OP_NETSCAPE_CHALLENGE_BUG: number;
        const SSL_OP_NETSCAPE_DEMO_CIPHER_CHANGE_BUG: number;
        const SSL_OP_NETSCAPE_REUSE_CIPHER_CHANGE_BUG: number;
        /** Instructs OpenSSL to disable support for SSL/TLS compression. */
        const SSL_OP_NO_COMPRESSION: number;
        const SSL_OP_NO_QUERY_MTU: number;
        /** Instructs OpenSSL to always start a new session when performing renegotiation. */
        const SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION: number;
        const SSL_OP_NO_SSLv2: number;
        const SSL_OP_NO_SSLv3: number;
        const SSL_OP_NO_TICKET: number;
        const SSL_OP_NO_TLSv1: number;
        const SSL_OP_NO_TLSv1_1: number;
        const SSL_OP_NO_TLSv1_2: number;
        const SSL_OP_PKCS1_CHECK_1: number;
        const SSL_OP_PKCS1_CHECK_2: number;
        /** Instructs OpenSSL to always create a new key when using temporary/ephemeral DH parameters. */
        const SSL_OP_SINGLE_DH_USE: number;
        /** Instructs OpenSSL to always create a new key when using temporary/ephemeral ECDH parameters. */
        const SSL_OP_SINGLE_ECDH_USE: number;
        const SSL_OP_SSLEAY_080_CLIENT_DH_BUG: number;
        const SSL_OP_SSLREF2_REUSE_CERT_TYPE_BUG: number;
        const SSL_OP_TLS_BLOCK_PADDING_BUG: number;
        const SSL_OP_TLS_D5_BUG: number;
        /** Instructs OpenSSL to disable version rollback attack detection. */
        const SSL_OP_TLS_ROLLBACK_BUG: number;

        const ENGINE_METHOD_RSA: number;
        const ENGINE_METHOD_DSA: number;
        const ENGINE_METHOD_DH: number;
        const ENGINE_METHOD_RAND: number;
        const ENGINE_METHOD_EC: number;
        const ENGINE_METHOD_CIPHERS: number;
        const ENGINE_METHOD_DIGESTS: number;
        const ENGINE_METHOD_PKEY_METHS: number;
        const ENGINE_METHOD_PKEY_ASN1_METHS: number;
        const ENGINE_METHOD_ALL: number;
        const ENGINE_METHOD_NONE: number;

        const DH_CHECK_P_NOT_SAFE_PRIME: number;
        const DH_CHECK_P_NOT_PRIME: number;
        const DH_UNABLE_TO_CHECK_GENERATOR: number;
        const DH_NOT_SUITABLE_GENERATOR: number;

        const ALPN_ENABLED: number;

        const RSA_PKCS1_PADDING: number;
        const RSA_SSLV23_PADDING: number;
        const RSA_NO_PADDING: number;
        const RSA_PKCS1_OAEP_PADDING: number;
        const RSA_X931_PADDING: number;
        const RSA_PKCS1_PSS_PADDING: number;
        /** Sets the salt length for RSA_PKCS1_PSS_PADDING to the digest size when signing or verifying. */
        const RSA_PSS_SALTLEN_DIGEST: number;
        /** Sets the salt length for RSA_PKCS1_PSS_PADDING to the maximum permissible value when signing data. */
        const RSA_PSS_SALTLEN_MAX_SIGN: number;
        /** Causes the salt length for RSA_PKCS1_PSS_PADDING to be determined automatically when verifying a signature. */
        const RSA_PSS_SALTLEN_AUTO: number;

        const POINT_CONVERSION_COMPRESSED: number;
        const POINT_CONVERSION_UNCOMPRESSED: number;
        const POINT_CONVERSION_HYBRID: number;

        /** Specifies the built-in default cipher list used by Node.js (colon-separated values). */
        const defaultCoreCipherList: string;
        /** Specifies the active default cipher list used by the current Node.js process  (colon-separated values). */
        const defaultCipherList: string;
    }

    interface HashOptions extends stream.TransformOptions {
        /**
         * For XOF hash functions such as \`shake256\`, the
         * outputLength option can be used to specify the desired output length in bytes.
         */
        outputLength?: number | undefined;
    }

    /** @deprecated since v10.0.0 */
    const fips: boolean;

    function createHash(algorithm: string, options?: HashOptions): Hash;
    function createHmac(algorithm: string, key: BinaryLike | KeyObject, options?: stream.TransformOptions): Hmac;

    \/\/ https:\/\/nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings
    type BinaryToTextEncoding = 'base64' | 'base64url' | 'hex';
    type CharacterEncoding = 'utf8' | 'utf-8' | 'utf16le' | 'latin1';
    type LegacyCharacterEncoding = 'ascii' | 'binary' | 'ucs2' | 'ucs-2';

    type Encoding = BinaryToTextEncoding | CharacterEncoding | LegacyCharacterEncoding;

    type ECDHKeyFormat = 'compressed' | 'uncompressed' | 'hybrid';

    class Hash extends stream.Transform {
        private constructor();
        copy(): Hash;
        update(data: BinaryLike): Hash;
        update(data: string, input_encoding: Encoding): Hash;
        digest(): Buffer;
        digest(encoding: BinaryToTextEncoding): string;
    }
    class Hmac extends stream.Transform {
        private constructor();
        update(data: BinaryLike): Hmac;
        update(data: string, input_encoding: Encoding): Hmac;
        digest(): Buffer;
        digest(encoding: BinaryToTextEncoding): string;
    }

    type KeyObjectType = 'secret' | 'public' | 'private';

    interface KeyExportOptions<T extends KeyFormat> {
        type: 'pkcs1' | 'spki' | 'pkcs8' | 'sec1';
        format: T;
        cipher?: string | undefined;
        passphrase?: string | Buffer | undefined;
    }

    class KeyObject {
        private constructor();
        asymmetricKeyType?: KeyType | undefined;
        /**
         * For asymmetric keys, this property represents the size of the embedded key in
         * bytes. This property is \`undefined\` for symmetric keys.
         */
        asymmetricKeySize?: number | undefined;
        export(options: KeyExportOptions<'pem'>): string | Buffer;
        export(options?: KeyExportOptions<'der'>): Buffer;
        symmetricKeySize?: number | undefined;
        type: KeyObjectType;
    }

    type CipherCCMTypes = 'aes-128-ccm' | 'aes-192-ccm' | 'aes-256-ccm' | 'chacha20-poly1305';
    type CipherGCMTypes = 'aes-128-gcm' | 'aes-192-gcm' | 'aes-256-gcm';

    type BinaryLike = string | NodeJS.ArrayBufferView;

    type CipherKey = BinaryLike | KeyObject;

    interface CipherCCMOptions extends stream.TransformOptions {
        authTagLength: number;
    }
    interface CipherGCMOptions extends stream.TransformOptions {
        authTagLength?: number | undefined;
    }
    /** @deprecated since v10.0.0 use \`createCipheriv()\` */
    function createCipher(algorithm: CipherCCMTypes, password: BinaryLike, options: CipherCCMOptions): CipherCCM;
    /** @deprecated since v10.0.0 use \`createCipheriv()\` */
    function createCipher(algorithm: CipherGCMTypes, password: BinaryLike, options?: CipherGCMOptions): CipherGCM;
    /** @deprecated since v10.0.0 use \`createCipheriv()\` */
    function createCipher(algorithm: string, password: BinaryLike, options?: stream.TransformOptions): Cipher;

    function createCipheriv(
        algorithm: CipherCCMTypes,
        key: CipherKey,
        iv: BinaryLike | null,
        options: CipherCCMOptions,
    ): CipherCCM;
    function createCipheriv(
        algorithm: CipherGCMTypes,
        key: CipherKey,
        iv: BinaryLike | null,
        options?: CipherGCMOptions,
    ): CipherGCM;
    function createCipheriv(
        algorithm: string,
        key: CipherKey,
        iv: BinaryLike | null,
        options?: stream.TransformOptions,
    ): Cipher;

    class Cipher extends stream.Transform {
        private constructor();
        update(data: BinaryLike): Buffer;
        update(data: string, input_encoding: Encoding): Buffer;
        update(data: NodeJS.ArrayBufferView, input_encoding: undefined, output_encoding: Encoding): string;
        update(data: string, input_encoding: Encoding | undefined, output_encoding: Encoding): string;
        final(): Buffer;
        final(output_encoding: BufferEncoding): string;
        setAutoPadding(auto_padding?: boolean): this;
        \/\/ getAuthTag(): Buffer;
        \/\/ setAAD(buffer: NodeJS.ArrayBufferView): this;
    }
    interface CipherCCM extends Cipher {
        setAAD(buffer: NodeJS.ArrayBufferView, options: { plaintextLength: number }): this;
        getAuthTag(): Buffer;
    }
    interface CipherGCM extends Cipher {
        setAAD(buffer: NodeJS.ArrayBufferView, options?: { plaintextLength: number }): this;
        getAuthTag(): Buffer;
    }
    /** @deprecated since v10.0.0 use \`createDecipheriv()\` */
    function createDecipher(algorithm: CipherCCMTypes, password: BinaryLike, options: CipherCCMOptions): DecipherCCM;
    /** @deprecated since v10.0.0 use \`createDecipheriv()\` */
    function createDecipher(algorithm: CipherGCMTypes, password: BinaryLike, options?: CipherGCMOptions): DecipherGCM;
    /** @deprecated since v10.0.0 use \`createDecipheriv()\` */
    function createDecipher(algorithm: string, password: BinaryLike, options?: stream.TransformOptions): Decipher;

    function createDecipheriv(
        algorithm: CipherCCMTypes,
        key: CipherKey,
        iv: BinaryLike | null,
        options: CipherCCMOptions,
    ): DecipherCCM;
    function createDecipheriv(
        algorithm: CipherGCMTypes,
        key: CipherKey,
        iv: BinaryLike | null,
        options?: CipherGCMOptions,
    ): DecipherGCM;
    function createDecipheriv(
        algorithm: string,
        key: CipherKey,
        iv: BinaryLike | null,
        options?: stream.TransformOptions,
    ): Decipher;

    class Decipher extends stream.Transform {
        private constructor();
        update(data: NodeJS.ArrayBufferView): Buffer;
        update(data: string, input_encoding: Encoding): Buffer;
        update(data: NodeJS.ArrayBufferView, input_encoding: undefined, output_encoding: Encoding): string;
        update(data: string, input_encoding: Encoding | undefined, output_encoding: Encoding): string;
        final(): Buffer;
        final(output_encoding: BufferEncoding): string;
        setAutoPadding(auto_padding?: boolean): this;
        \/\/ setAuthTag(tag: NodeJS.ArrayBufferView): this;
        \/\/ setAAD(buffer: NodeJS.ArrayBufferView): this;
    }
    interface DecipherCCM extends Decipher {
        setAuthTag(buffer: NodeJS.ArrayBufferView): this;
        setAAD(buffer: NodeJS.ArrayBufferView, options: { plaintextLength: number }): this;
    }
    interface DecipherGCM extends Decipher {
        setAuthTag(buffer: NodeJS.ArrayBufferView): this;
        setAAD(buffer: NodeJS.ArrayBufferView, options?: { plaintextLength: number }): this;
    }

    interface PrivateKeyInput {
        key: string | Buffer;
        format?: KeyFormat | undefined;
        type?: 'pkcs1' | 'pkcs8' | 'sec1' | undefined;
        passphrase?: string | Buffer | undefined;
    }

    interface PublicKeyInput {
        key: string | Buffer;
        format?: KeyFormat | undefined;
        type?: 'pkcs1' | 'spki' | undefined;
    }

    function createPrivateKey(key: PrivateKeyInput | string | Buffer): KeyObject;
    function createPublicKey(key: PublicKeyInput | string | Buffer | KeyObject): KeyObject;
    function createSecretKey(key: NodeJS.ArrayBufferView): KeyObject;

    function createSign(algorithm: string, options?: stream.WritableOptions): Signer;

    type DSAEncoding = 'der' | 'ieee-p1363';

    interface SigningOptions {
        /**
         * @See crypto.constants.RSA_PKCS1_PADDING
         */
        padding?: number | undefined;
        saltLength?: number | undefined;
        dsaEncoding?: DSAEncoding | undefined;
    }

    interface SignPrivateKeyInput extends PrivateKeyInput, SigningOptions {}
    interface SignKeyObjectInput extends SigningOptions {
        key: KeyObject;
    }
    interface VerifyPublicKeyInput extends PublicKeyInput, SigningOptions {}
    interface VerifyKeyObjectInput extends SigningOptions {
        key: KeyObject;
    }

    type KeyLike = string | Buffer | KeyObject;

    class Signer extends stream.Writable {
        private constructor();

        update(data: BinaryLike): Signer;
        update(data: string, input_encoding: Encoding): Signer;
        sign(private_key: KeyLike | SignKeyObjectInput | SignPrivateKeyInput): Buffer;
        sign(
            private_key: KeyLike | SignKeyObjectInput | SignPrivateKeyInput,
            output_format: BinaryToTextEncoding,
        ): string;
    }

    function createVerify(algorithm: string, options?: stream.WritableOptions): Verify;
    class Verify extends stream.Writable {
        private constructor();

        update(data: BinaryLike): Verify;
        update(data: string, input_encoding: Encoding): Verify;
        verify(
            object: KeyLike | VerifyKeyObjectInput | VerifyPublicKeyInput,
            signature: NodeJS.ArrayBufferView,
        ): boolean;
        verify(
            object: KeyLike | VerifyKeyObjectInput | VerifyPublicKeyInput,
            signature: string,
            signature_format?: BinaryToTextEncoding,
        ): boolean;
        \/\/ https:\/\/nodejs.org/api/crypto.html#crypto_verifier_verify_object_signature_signature_format
        \/\/ The signature field accepts a TypedArray type, but it is only available starting ES2017
    }
    function createDiffieHellman(prime_length: number, generator?: number | NodeJS.ArrayBufferView): DiffieHellman;
    function createDiffieHellman(prime: NodeJS.ArrayBufferView): DiffieHellman;
    function createDiffieHellman(prime: string, prime_encoding: BinaryToTextEncoding): DiffieHellman;
    function createDiffieHellman(
        prime: string,
        prime_encoding: BinaryToTextEncoding,
        generator: number | NodeJS.ArrayBufferView,
    ): DiffieHellman;
    function createDiffieHellman(
        prime: string,
        prime_encoding: BinaryToTextEncoding,
        generator: string,
        generator_encoding: BinaryToTextEncoding,
    ): DiffieHellman;
    class DiffieHellman {
        private constructor();
        generateKeys(): Buffer;
        generateKeys(encoding: BinaryToTextEncoding): string;
        computeSecret(other_public_key: NodeJS.ArrayBufferView): Buffer;
        computeSecret(other_public_key: string, input_encoding: BinaryToTextEncoding): Buffer;
        computeSecret(other_public_key: NodeJS.ArrayBufferView, output_encoding: BinaryToTextEncoding): string;
        computeSecret(
            other_public_key: string,
            input_encoding: BinaryToTextEncoding,
            output_encoding: BinaryToTextEncoding,
        ): string;
        getPrime(): Buffer;
        getPrime(encoding: BinaryToTextEncoding): string;
        getGenerator(): Buffer;
        getGenerator(encoding: BinaryToTextEncoding): string;
        getPublicKey(): Buffer;
        getPublicKey(encoding: BinaryToTextEncoding): string;
        getPrivateKey(): Buffer;
        getPrivateKey(encoding: BinaryToTextEncoding): string;
        setPublicKey(public_key: NodeJS.ArrayBufferView): void;
        setPublicKey(public_key: string, encoding: BufferEncoding): void;
        setPrivateKey(private_key: NodeJS.ArrayBufferView): void;
        setPrivateKey(private_key: string, encoding: BufferEncoding): void;
        verifyError: number;
    }
    function getDiffieHellman(group_name: string): DiffieHellman;
    function pbkdf2(
        password: BinaryLike,
        salt: BinaryLike,
        iterations: number,
        keylen: number,
        digest: string,
        callback: (err: Error | null, derivedKey: Buffer) => any,
    ): void;
    function pbkdf2Sync(
        password: BinaryLike,
        salt: BinaryLike,
        iterations: number,
        keylen: number,
        digest: string,
    ): Buffer;

    function randomBytes(size: number): Buffer;
    function randomBytes(size: number, callback: (err: Error | null, buf: Buffer) => void): void;
    function pseudoRandomBytes(size: number): Buffer;
    function pseudoRandomBytes(size: number, callback: (err: Error | null, buf: Buffer) => void): void;

    function randomInt(max: number): number;
    function randomInt(min: number, max: number): number;
    function randomInt(max: number, callback: (err: Error | null, value: number) => void): void;
    function randomInt(min: number, max: number, callback: (err: Error | null, value: number) => void): void;

    function randomFillSync<T extends NodeJS.ArrayBufferView>(buffer: T, offset?: number, size?: number): T;
    function randomFill<T extends NodeJS.ArrayBufferView>(
        buffer: T,
        callback: (err: Error | null, buf: T) => void,
    ): void;
    function randomFill<T extends NodeJS.ArrayBufferView>(
        buffer: T,
        offset: number,
        callback: (err: Error | null, buf: T) => void,
    ): void;
    function randomFill<T extends NodeJS.ArrayBufferView>(
        buffer: T,
        offset: number,
        size: number,
        callback: (err: Error | null, buf: T) => void,
    ): void;

    interface RandomUUIDOptions {
        /**
         * By default, to improve performance,
         * Node.js will pre-emptively generate and persistently cache enough
         * random data to generate up to 128 random UUIDs. To generate a UUID
         * without using the cache, set \`disableEntropyCache\` to \`true\`.
         *
         * @default \`false\`
         */
        disableEntropyCache?: boolean | undefined;
    }

    function randomUUID(options?: RandomUUIDOptions): string;

    interface ScryptOptions {
        cost?: number | undefined;
        blockSize?: number | undefined;
        parallelization?: number | undefined;
        N?: number | undefined;
        r?: number | undefined;
        p?: number | undefined;
        maxmem?: number | undefined;
    }
    function scrypt(
        password: BinaryLike,
        salt: BinaryLike,
        keylen: number,
        callback: (err: Error | null, derivedKey: Buffer) => void,
    ): void;
    function scrypt(
        password: BinaryLike,
        salt: BinaryLike,
        keylen: number,
        options: ScryptOptions,
        callback: (err: Error | null, derivedKey: Buffer) => void,
    ): void;
    function scryptSync(password: BinaryLike, salt: BinaryLike, keylen: number, options?: ScryptOptions): Buffer;

    interface RsaPublicKey {
        key: KeyLike;
        padding?: number | undefined;
    }
    interface RsaPrivateKey {
        key: KeyLike;
        passphrase?: string | undefined;
        /**
         * @default 'sha1'
         */
        oaepHash?: string | undefined;
        oaepLabel?: NodeJS.TypedArray | undefined;
        padding?: number | undefined;
    }
    function publicEncrypt(key: RsaPublicKey | RsaPrivateKey | KeyLike, buffer: NodeJS.ArrayBufferView): Buffer;
    function publicDecrypt(key: RsaPublicKey | RsaPrivateKey | KeyLike, buffer: NodeJS.ArrayBufferView): Buffer;
    function privateDecrypt(private_key: RsaPrivateKey | KeyLike, buffer: NodeJS.ArrayBufferView): Buffer;
    function privateEncrypt(private_key: RsaPrivateKey | KeyLike, buffer: NodeJS.ArrayBufferView): Buffer;
    function getCiphers(): string[];
    function getCurves(): string[];
    function getFips(): 1 | 0;
    function getHashes(): string[];
    class ECDH {
        private constructor();
        static convertKey(
            key: BinaryLike,
            curve: string,
            inputEncoding?: BinaryToTextEncoding,
            outputEncoding?: 'latin1' | 'hex' | 'base64' | 'base64url',
            format?: 'uncompressed' | 'compressed' | 'hybrid',
        ): Buffer | string;
        generateKeys(): Buffer;
        generateKeys(encoding: BinaryToTextEncoding, format?: ECDHKeyFormat): string;
        computeSecret(other_public_key: NodeJS.ArrayBufferView): Buffer;
        computeSecret(other_public_key: string, input_encoding: BinaryToTextEncoding): Buffer;
        computeSecret(other_public_key: NodeJS.ArrayBufferView, output_encoding: BinaryToTextEncoding): string;
        computeSecret(
            other_public_key: string,
            input_encoding: BinaryToTextEncoding,
            output_encoding: BinaryToTextEncoding,
        ): string;
        getPrivateKey(): Buffer;
        getPrivateKey(encoding: BinaryToTextEncoding): string;
        getPublicKey(): Buffer;
        getPublicKey(encoding: BinaryToTextEncoding, format?: ECDHKeyFormat): string;
        setPrivateKey(private_key: NodeJS.ArrayBufferView): void;
        setPrivateKey(private_key: string, encoding: BinaryToTextEncoding): void;
    }
    function createECDH(curve_name: string): ECDH;
    function timingSafeEqual(a: NodeJS.ArrayBufferView, b: NodeJS.ArrayBufferView): boolean;
    /** @deprecated since v10.0.0 */
    const DEFAULT_ENCODING: BufferEncoding;

    type KeyType = 'rsa' | 'dsa' | 'ec' | 'ed25519' | 'ed448' | 'x25519' | 'x448';
    type KeyFormat = 'pem' | 'der';

    interface BasePrivateKeyEncodingOptions<T extends KeyFormat> {
        format: T;
        cipher?: string | undefined;
        passphrase?: string | undefined;
    }

    interface KeyPairKeyObjectResult {
        publicKey: KeyObject;
        privateKey: KeyObject;
    }

    interface ED25519KeyPairKeyObjectOptions {
        /**
         * No options.
         */
    }

    interface ED448KeyPairKeyObjectOptions {
        /**
         * No options.
         */
    }

    interface X25519KeyPairKeyObjectOptions {
        /**
         * No options.
         */
    }

    interface X448KeyPairKeyObjectOptions {
        /**
         * No options.
         */
    }

    interface ECKeyPairKeyObjectOptions {
        /**
         * Name of the curve to use.
         */
        namedCurve: string;
    }

    interface RSAKeyPairKeyObjectOptions {
        /**
         * Key size in bits
         */
        modulusLength: number;

        /**
         * @default 0x10001
         */
        publicExponent?: number | undefined;
    }

    interface DSAKeyPairKeyObjectOptions {
        /**
         * Key size in bits
         */
        modulusLength: number;

        /**
         * Size of q in bits
         */
        divisorLength: number;
    }

    interface RSAKeyPairOptions<PubF extends KeyFormat, PrivF extends KeyFormat> {
        /**
         * Key size in bits
         */
        modulusLength: number;
        /**
         * @default 0x10001
         */
        publicExponent?: number | undefined;

        publicKeyEncoding: {
            type: 'pkcs1' | 'spki';
            format: PubF;
        };
        privateKeyEncoding: BasePrivateKeyEncodingOptions<PrivF> & {
            type: 'pkcs1' | 'pkcs8';
        };
    }

    interface DSAKeyPairOptions<PubF extends KeyFormat, PrivF extends KeyFormat> {
        /**
         * Key size in bits
         */
        modulusLength: number;
        /**
         * Size of q in bits
         */
        divisorLength: number;

        publicKeyEncoding: {
            type: 'spki';
            format: PubF;
        };
        privateKeyEncoding: BasePrivateKeyEncodingOptions<PrivF> & {
            type: 'pkcs8';
        };
    }

    interface ECKeyPairOptions<PubF extends KeyFormat, PrivF extends KeyFormat> {
        /**
         * Name of the curve to use.
         */
        namedCurve: string;

        publicKeyEncoding: {
            type: 'pkcs1' | 'spki';
            format: PubF;
        };
        privateKeyEncoding: BasePrivateKeyEncodingOptions<PrivF> & {
            type: 'sec1' | 'pkcs8';
        };
    }

    interface ED25519KeyPairOptions<PubF extends KeyFormat, PrivF extends KeyFormat> {
        publicKeyEncoding: {
            type: 'spki';
            format: PubF;
        };
        privateKeyEncoding: BasePrivateKeyEncodingOptions<PrivF> & {
            type: 'pkcs8';
        };
    }

    interface ED448KeyPairOptions<PubF extends KeyFormat, PrivF extends KeyFormat> {
        publicKeyEncoding: {
            type: 'spki';
            format: PubF;
        };
        privateKeyEncoding: BasePrivateKeyEncodingOptions<PrivF> & {
            type: 'pkcs8';
        };
    }

    interface X25519KeyPairOptions<PubF extends KeyFormat, PrivF extends KeyFormat> {
        publicKeyEncoding: {
            type: 'spki';
            format: PubF;
        };
        privateKeyEncoding: BasePrivateKeyEncodingOptions<PrivF> & {
            type: 'pkcs8';
        };
    }

    interface X448KeyPairOptions<PubF extends KeyFormat, PrivF extends KeyFormat> {
        publicKeyEncoding: {
            type: 'spki';
            format: PubF;
        };
        privateKeyEncoding: BasePrivateKeyEncodingOptions<PrivF> & {
            type: 'pkcs8';
        };
    }

    interface KeyPairSyncResult<T1 extends string | Buffer, T2 extends string | Buffer> {
        publicKey: T1;
        privateKey: T2;
    }

    function generateKeyPairSync(
        type: 'rsa',
        options: RSAKeyPairOptions<'pem', 'pem'>,
    ): KeyPairSyncResult<string, string>;
    function generateKeyPairSync(
        type: 'rsa',
        options: RSAKeyPairOptions<'pem', 'der'>,
    ): KeyPairSyncResult<string, Buffer>;
    function generateKeyPairSync(
        type: 'rsa',
        options: RSAKeyPairOptions<'der', 'pem'>,
    ): KeyPairSyncResult<Buffer, string>;
    function generateKeyPairSync(
        type: 'rsa',
        options: RSAKeyPairOptions<'der', 'der'>,
    ): KeyPairSyncResult<Buffer, Buffer>;
    function generateKeyPairSync(type: 'rsa', options: RSAKeyPairKeyObjectOptions): KeyPairKeyObjectResult;

    function generateKeyPairSync(
        type: 'dsa',
        options: DSAKeyPairOptions<'pem', 'pem'>,
    ): KeyPairSyncResult<string, string>;
    function generateKeyPairSync(
        type: 'dsa',
        options: DSAKeyPairOptions<'pem', 'der'>,
    ): KeyPairSyncResult<string, Buffer>;
    function generateKeyPairSync(
        type: 'dsa',
        options: DSAKeyPairOptions<'der', 'pem'>,
    ): KeyPairSyncResult<Buffer, string>;
    function generateKeyPairSync(
        type: 'dsa',
        options: DSAKeyPairOptions<'der', 'der'>,
    ): KeyPairSyncResult<Buffer, Buffer>;
    function generateKeyPairSync(type: 'dsa', options: DSAKeyPairKeyObjectOptions): KeyPairKeyObjectResult;

    function generateKeyPairSync(
        type: 'ec',
        options: ECKeyPairOptions<'pem', 'pem'>,
    ): KeyPairSyncResult<string, string>;
    function generateKeyPairSync(
        type: 'ec',
        options: ECKeyPairOptions<'pem', 'der'>,
    ): KeyPairSyncResult<string, Buffer>;
    function generateKeyPairSync(
        type: 'ec',
        options: ECKeyPairOptions<'der', 'pem'>,
    ): KeyPairSyncResult<Buffer, string>;
    function generateKeyPairSync(
        type: 'ec',
        options: ECKeyPairOptions<'der', 'der'>,
    ): KeyPairSyncResult<Buffer, Buffer>;
    function generateKeyPairSync(type: 'ec', options: ECKeyPairKeyObjectOptions): KeyPairKeyObjectResult;

    function generateKeyPairSync(
        type: 'ed25519',
        options: ED25519KeyPairOptions<'pem', 'pem'>,
    ): KeyPairSyncResult<string, string>;
    function generateKeyPairSync(
        type: 'ed25519',
        options: ED25519KeyPairOptions<'pem', 'der'>,
    ): KeyPairSyncResult<string, Buffer>;
    function generateKeyPairSync(
        type: 'ed25519',
        options: ED25519KeyPairOptions<'der', 'pem'>,
    ): KeyPairSyncResult<Buffer, string>;
    function generateKeyPairSync(
        type: 'ed25519',
        options: ED25519KeyPairOptions<'der', 'der'>,
    ): KeyPairSyncResult<Buffer, Buffer>;
    function generateKeyPairSync(type: 'ed25519', options?: ED25519KeyPairKeyObjectOptions): KeyPairKeyObjectResult;

    function generateKeyPairSync(
        type: 'ed448',
        options: ED448KeyPairOptions<'pem', 'pem'>,
    ): KeyPairSyncResult<string, string>;
    function generateKeyPairSync(
        type: 'ed448',
        options: ED448KeyPairOptions<'pem', 'der'>,
    ): KeyPairSyncResult<string, Buffer>;
    function generateKeyPairSync(
        type: 'ed448',
        options: ED448KeyPairOptions<'der', 'pem'>,
    ): KeyPairSyncResult<Buffer, string>;
    function generateKeyPairSync(
        type: 'ed448',
        options: ED448KeyPairOptions<'der', 'der'>,
    ): KeyPairSyncResult<Buffer, Buffer>;
    function generateKeyPairSync(type: 'ed448', options?: ED448KeyPairKeyObjectOptions): KeyPairKeyObjectResult;

    function generateKeyPairSync(
        type: 'x25519',
        options: X25519KeyPairOptions<'pem', 'pem'>,
    ): KeyPairSyncResult<string, string>;
    function generateKeyPairSync(
        type: 'x25519',
        options: X25519KeyPairOptions<'pem', 'der'>,
    ): KeyPairSyncResult<string, Buffer>;
    function generateKeyPairSync(
        type: 'x25519',
        options: X25519KeyPairOptions<'der', 'pem'>,
    ): KeyPairSyncResult<Buffer, string>;
    function generateKeyPairSync(
        type: 'x25519',
        options: X25519KeyPairOptions<'der', 'der'>,
    ): KeyPairSyncResult<Buffer, Buffer>;
    function generateKeyPairSync(type: 'x25519', options?: X25519KeyPairKeyObjectOptions): KeyPairKeyObjectResult;

    function generateKeyPairSync(
        type: 'x448',
        options: X448KeyPairOptions<'pem', 'pem'>,
    ): KeyPairSyncResult<string, string>;
    function generateKeyPairSync(
        type: 'x448',
        options: X448KeyPairOptions<'pem', 'der'>,
    ): KeyPairSyncResult<string, Buffer>;
    function generateKeyPairSync(
        type: 'x448',
        options: X448KeyPairOptions<'der', 'pem'>,
    ): KeyPairSyncResult<Buffer, string>;
    function generateKeyPairSync(
        type: 'x448',
        options: X448KeyPairOptions<'der', 'der'>,
    ): KeyPairSyncResult<Buffer, Buffer>;
    function generateKeyPairSync(type: 'x448', options?: X448KeyPairKeyObjectOptions): KeyPairKeyObjectResult;

    function generateKeyPair(
        type: 'rsa',
        options: RSAKeyPairOptions<'pem', 'pem'>,
        callback: (err: Error | null, publicKey: string, privateKey: string) => void,
    ): void;
    function generateKeyPair(
        type: 'rsa',
        options: RSAKeyPairOptions<'pem', 'der'>,
        callback: (err: Error | null, publicKey: string, privateKey: Buffer) => void,
    ): void;
    function generateKeyPair(
        type: 'rsa',
        options: RSAKeyPairOptions<'der', 'pem'>,
        callback: (err: Error | null, publicKey: Buffer, privateKey: string) => void,
    ): void;
    function generateKeyPair(
        type: 'rsa',
        options: RSAKeyPairOptions<'der', 'der'>,
        callback: (err: Error | null, publicKey: Buffer, privateKey: Buffer) => void,
    ): void;
    function generateKeyPair(
        type: 'rsa',
        options: RSAKeyPairKeyObjectOptions,
        callback: (err: Error | null, publicKey: KeyObject, privateKey: KeyObject) => void,
    ): void;

    function generateKeyPair(
        type: 'dsa',
        options: DSAKeyPairOptions<'pem', 'pem'>,
        callback: (err: Error | null, publicKey: string, privateKey: string) => void,
    ): void;
    function generateKeyPair(
        type: 'dsa',
        options: DSAKeyPairOptions<'pem', 'der'>,
        callback: (err: Error | null, publicKey: string, privateKey: Buffer) => void,
    ): void;
    function generateKeyPair(
        type: 'dsa',
        options: DSAKeyPairOptions<'der', 'pem'>,
        callback: (err: Error | null, publicKey: Buffer, privateKey: string) => void,
    ): void;
    function generateKeyPair(
        type: 'dsa',
        options: DSAKeyPairOptions<'der', 'der'>,
        callback: (err: Error | null, publicKey: Buffer, privateKey: Buffer) => void,
    ): void;
    function generateKeyPair(
        type: 'dsa',
        options: DSAKeyPairKeyObjectOptions,
        callback: (err: Error | null, publicKey: KeyObject, privateKey: KeyObject) => void,
    ): void;

    function generateKeyPair(
        type: 'ec',
        options: ECKeyPairOptions<'pem', 'pem'>,
        callback: (err: Error | null, publicKey: string, privateKey: string) => void,
    ): void;
    function generateKeyPair(
        type: 'ec',
        options: ECKeyPairOptions<'pem', 'der'>,
        callback: (err: Error | null, publicKey: string, privateKey: Buffer) => void,
    ): void;
    function generateKeyPair(
        type: 'ec',
        options: ECKeyPairOptions<'der', 'pem'>,
        callback: (err: Error | null, publicKey: Buffer, privateKey: string) => void,
    ): void;
    function generateKeyPair(
        type: 'ec',
        options: ECKeyPairOptions<'der', 'der'>,
        callback: (err: Error | null, publicKey: Buffer, privateKey: Buffer) => void,
    ): void;
    function generateKeyPair(
        type: 'ec',
        options: ECKeyPairKeyObjectOptions,
        callback: (err: Error | null, publicKey: KeyObject, privateKey: KeyObject) => void,
    ): void;

    function generateKeyPair(
        type: 'ed25519',
        options: ED25519KeyPairOptions<'pem', 'pem'>,
        callback: (err: Error | null, publicKey: string, privateKey: string) => void,
    ): void;
    function generateKeyPair(
        type: 'ed25519',
        options: ED25519KeyPairOptions<'pem', 'der'>,
        callback: (err: Error | null, publicKey: string, privateKey: Buffer) => void,
    ): void;
    function generateKeyPair(
        type: 'ed25519',
        options: ED25519KeyPairOptions<'der', 'pem'>,
        callback: (err: Error | null, publicKey: Buffer, privateKey: string) => void,
    ): void;
    function generateKeyPair(
        type: 'ed25519',
        options: ED25519KeyPairOptions<'der', 'der'>,
        callback: (err: Error | null, publicKey: Buffer, privateKey: Buffer) => void,
    ): void;
    function generateKeyPair(
        type: 'ed25519',
        options: ED25519KeyPairKeyObjectOptions | undefined,
        callback: (err: Error | null, publicKey: KeyObject, privateKey: KeyObject) => void,
    ): void;

    function generateKeyPair(
        type: 'ed448',
        options: ED448KeyPairOptions<'pem', 'pem'>,
        callback: (err: Error | null, publicKey: string, privateKey: string) => void,
    ): void;
    function generateKeyPair(
        type: 'ed448',
        options: ED448KeyPairOptions<'pem', 'der'>,
        callback: (err: Error | null, publicKey: string, privateKey: Buffer) => void,
    ): void;
    function generateKeyPair(
        type: 'ed448',
        options: ED448KeyPairOptions<'der', 'pem'>,
        callback: (err: Error | null, publicKey: Buffer, privateKey: string) => void,
    ): void;
    function generateKeyPair(
        type: 'ed448',
        options: ED448KeyPairOptions<'der', 'der'>,
        callback: (err: Error | null, publicKey: Buffer, privateKey: Buffer) => void,
    ): void;
    function generateKeyPair(
        type: 'ed448',
        options: ED448KeyPairKeyObjectOptions | undefined,
        callback: (err: Error | null, publicKey: KeyObject, privateKey: KeyObject) => void,
    ): void;

    function generateKeyPair(
        type: 'x25519',
        options: X25519KeyPairOptions<'pem', 'pem'>,
        callback: (err: Error | null, publicKey: string, privateKey: string) => void,
    ): void;
    function generateKeyPair(
        type: 'x25519',
        options: X25519KeyPairOptions<'pem', 'der'>,
        callback: (err: Error | null, publicKey: string, privateKey: Buffer) => void,
    ): void;
    function generateKeyPair(
        type: 'x25519',
        options: X25519KeyPairOptions<'der', 'pem'>,
        callback: (err: Error | null, publicKey: Buffer, privateKey: string) => void,
    ): void;
    function generateKeyPair(
        type: 'x25519',
        options: X25519KeyPairOptions<'der', 'der'>,
        callback: (err: Error | null, publicKey: Buffer, privateKey: Buffer) => void,
    ): void;
    function generateKeyPair(
        type: 'x25519',
        options: X25519KeyPairKeyObjectOptions | undefined,
        callback: (err: Error | null, publicKey: KeyObject, privateKey: KeyObject) => void,
    ): void;

    function generateKeyPair(
        type: 'x448',
        options: X448KeyPairOptions<'pem', 'pem'>,
        callback: (err: Error | null, publicKey: string, privateKey: string) => void,
    ): void;
    function generateKeyPair(
        type: 'x448',
        options: X448KeyPairOptions<'pem', 'der'>,
        callback: (err: Error | null, publicKey: string, privateKey: Buffer) => void,
    ): void;
    function generateKeyPair(
        type: 'x448',
        options: X448KeyPairOptions<'der', 'pem'>,
        callback: (err: Error | null, publicKey: Buffer, privateKey: string) => void,
    ): void;
    function generateKeyPair(
        type: 'x448',
        options: X448KeyPairOptions<'der', 'der'>,
        callback: (err: Error | null, publicKey: Buffer, privateKey: Buffer) => void,
    ): void;
    function generateKeyPair(
        type: 'x448',
        options: X448KeyPairKeyObjectOptions | undefined,
        callback: (err: Error | null, publicKey: KeyObject, privateKey: KeyObject) => void,
    ): void;

    namespace generateKeyPair {
        function __promisify__(
            type: 'rsa',
            options: RSAKeyPairOptions<'pem', 'pem'>,
        ): Promise<{ publicKey: string; privateKey: string }>;
        function __promisify__(
            type: 'rsa',
            options: RSAKeyPairOptions<'pem', 'der'>,
        ): Promise<{ publicKey: string; privateKey: Buffer }>;
        function __promisify__(
            type: 'rsa',
            options: RSAKeyPairOptions<'der', 'pem'>,
        ): Promise<{ publicKey: Buffer; privateKey: string }>;
        function __promisify__(
            type: 'rsa',
            options: RSAKeyPairOptions<'der', 'der'>,
        ): Promise<{ publicKey: Buffer; privateKey: Buffer }>;
        function __promisify__(type: 'rsa', options: RSAKeyPairKeyObjectOptions): Promise<KeyPairKeyObjectResult>;

        function __promisify__(
            type: 'dsa',
            options: DSAKeyPairOptions<'pem', 'pem'>,
        ): Promise<{ publicKey: string; privateKey: string }>;
        function __promisify__(
            type: 'dsa',
            options: DSAKeyPairOptions<'pem', 'der'>,
        ): Promise<{ publicKey: string; privateKey: Buffer }>;
        function __promisify__(
            type: 'dsa',
            options: DSAKeyPairOptions<'der', 'pem'>,
        ): Promise<{ publicKey: Buffer; privateKey: string }>;
        function __promisify__(
            type: 'dsa',
            options: DSAKeyPairOptions<'der', 'der'>,
        ): Promise<{ publicKey: Buffer; privateKey: Buffer }>;
        function __promisify__(type: 'dsa', options: DSAKeyPairKeyObjectOptions): Promise<KeyPairKeyObjectResult>;

        function __promisify__(
            type: 'ec',
            options: ECKeyPairOptions<'pem', 'pem'>,
        ): Promise<{ publicKey: string; privateKey: string }>;
        function __promisify__(
            type: 'ec',
            options: ECKeyPairOptions<'pem', 'der'>,
        ): Promise<{ publicKey: string; privateKey: Buffer }>;
        function __promisify__(
            type: 'ec',
            options: ECKeyPairOptions<'der', 'pem'>,
        ): Promise<{ publicKey: Buffer; privateKey: string }>;
        function __promisify__(
            type: 'ec',
            options: ECKeyPairOptions<'der', 'der'>,
        ): Promise<{ publicKey: Buffer; privateKey: Buffer }>;
        function __promisify__(type: 'ec', options: ECKeyPairKeyObjectOptions): Promise<KeyPairKeyObjectResult>;

        function __promisify__(
            type: 'ed25519',
            options: ED25519KeyPairOptions<'pem', 'pem'>,
        ): Promise<{ publicKey: string; privateKey: string }>;
        function __promisify__(
            type: 'ed25519',
            options: ED25519KeyPairOptions<'pem', 'der'>,
        ): Promise<{ publicKey: string; privateKey: Buffer }>;
        function __promisify__(
            type: 'ed25519',
            options: ED25519KeyPairOptions<'der', 'pem'>,
        ): Promise<{ publicKey: Buffer; privateKey: string }>;
        function __promisify__(
            type: 'ed25519',
            options: ED25519KeyPairOptions<'der', 'der'>,
        ): Promise<{ publicKey: Buffer; privateKey: Buffer }>;
        function __promisify__(
            type: 'ed25519',
            options?: ED25519KeyPairKeyObjectOptions,
        ): Promise<KeyPairKeyObjectResult>;

        function __promisify__(
            type: 'ed448',
            options: ED448KeyPairOptions<'pem', 'pem'>,
        ): Promise<{ publicKey: string; privateKey: string }>;
        function __promisify__(
            type: 'ed448',
            options: ED448KeyPairOptions<'pem', 'der'>,
        ): Promise<{ publicKey: string; privateKey: Buffer }>;
        function __promisify__(
            type: 'ed448',
            options: ED448KeyPairOptions<'der', 'pem'>,
        ): Promise<{ publicKey: Buffer; privateKey: string }>;
        function __promisify__(
            type: 'ed448',
            options: ED448KeyPairOptions<'der', 'der'>,
        ): Promise<{ publicKey: Buffer; privateKey: Buffer }>;
        function __promisify__(type: 'ed448', options?: ED448KeyPairKeyObjectOptions): Promise<KeyPairKeyObjectResult>;

        function __promisify__(
            type: 'x25519',
            options: X25519KeyPairOptions<'pem', 'pem'>,
        ): Promise<{ publicKey: string; privateKey: string }>;
        function __promisify__(
            type: 'x25519',
            options: X25519KeyPairOptions<'pem', 'der'>,
        ): Promise<{ publicKey: string; privateKey: Buffer }>;
        function __promisify__(
            type: 'x25519',
            options: X25519KeyPairOptions<'der', 'pem'>,
        ): Promise<{ publicKey: Buffer; privateKey: string }>;
        function __promisify__(
            type: 'x25519',
            options: X25519KeyPairOptions<'der', 'der'>,
        ): Promise<{ publicKey: Buffer; privateKey: Buffer }>;
        function __promisify__(
            type: 'x25519',
            options?: X25519KeyPairKeyObjectOptions,
        ): Promise<KeyPairKeyObjectResult>;

        function __promisify__(
            type: 'x448',
            options: X448KeyPairOptions<'pem', 'pem'>,
        ): Promise<{ publicKey: string; privateKey: string }>;
        function __promisify__(
            type: 'x448',
            options: X448KeyPairOptions<'pem', 'der'>,
        ): Promise<{ publicKey: string; privateKey: Buffer }>;
        function __promisify__(
            type: 'x448',
            options: X448KeyPairOptions<'der', 'pem'>,
        ): Promise<{ publicKey: Buffer; privateKey: string }>;
        function __promisify__(
            type: 'x448',
            options: X448KeyPairOptions<'der', 'der'>,
        ): Promise<{ publicKey: Buffer; privateKey: Buffer }>;
        function __promisify__(type: 'x448', options?: X448KeyPairKeyObjectOptions): Promise<KeyPairKeyObjectResult>;
    }

    /**
     * Calculates and returns the signature for \`data\` using the given private key and
     * algorithm. If \`algorithm\` is \`null\` or \`undefined\`, then the algorithm is
     * dependent upon the key type (especially Ed25519 and Ed448).
     *
     * If \`key\` is not a [\`KeyObject\`][], this function behaves as if \`key\` had been
     * passed to [\`crypto.createPrivateKey()\`][].
     */
    function sign(
        algorithm: string | null | undefined,
        data: NodeJS.ArrayBufferView,
        key: KeyLike | SignKeyObjectInput | SignPrivateKeyInput,
    ): Buffer;

    /**
     * Calculates and returns the signature for \`data\` using the given private key and
     * algorithm. If \`algorithm\` is \`null\` or \`undefined\`, then the algorithm is
     * dependent upon the key type (especially Ed25519 and Ed448).
     *
     * If \`key\` is not a [\`KeyObject\`][], this function behaves as if \`key\` had been
     * passed to [\`crypto.createPublicKey()\`][].
     */
    function verify(
        algorithm: string | null | undefined,
        data: NodeJS.ArrayBufferView,
        key: KeyLike | VerifyKeyObjectInput | VerifyPublicKeyInput,
        signature: NodeJS.ArrayBufferView,
    ): boolean;

    /**
     * Computes the Diffie-Hellman secret based on a privateKey and a publicKey.
     * Both keys must have the same asymmetricKeyType, which must be one of
     * 'dh' (for Diffie-Hellman), 'ec' (for ECDH), 'x448', or 'x25519' (for ECDH-ES).
     */
    function diffieHellman(options: { privateKey: KeyObject; publicKey: KeyObject }): Buffer;
}
`;
definitions['dgram.d.ts'] = `declare module 'dgram' {
    import { AddressInfo } from 'net';
    import * as dns from 'dns';
    import EventEmitter = require('events');

    interface RemoteInfo {
        address: string;
        family: 'IPv4' | 'IPv6';
        port: number;
        size: number;
    }

    interface BindOptions {
        port?: number | undefined;
        address?: string | undefined;
        exclusive?: boolean | undefined;
        fd?: number | undefined;
    }

    type SocketType = "udp4" | "udp6";

    interface SocketOptions {
        type: SocketType;
        reuseAddr?: boolean | undefined;
        /**
         * @default false
         */
        ipv6Only?: boolean | undefined;
        recvBufferSize?: number | undefined;
        sendBufferSize?: number | undefined;
        lookup?: ((hostname: string, options: dns.LookupOneOptions, callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void) => void) | undefined;
    }

    function createSocket(type: SocketType, callback?: (msg: Buffer, rinfo: RemoteInfo) => void): Socket;
    function createSocket(options: SocketOptions, callback?: (msg: Buffer, rinfo: RemoteInfo) => void): Socket;

    class Socket extends EventEmitter {
        addMembership(multicastAddress: string, multicastInterface?: string): void;
        address(): AddressInfo;
        bind(port?: number, address?: string, callback?: () => void): void;
        bind(port?: number, callback?: () => void): void;
        bind(callback?: () => void): void;
        bind(options: BindOptions, callback?: () => void): void;
        close(callback?: () => void): void;
        connect(port: number, address?: string, callback?: () => void): void;
        connect(port: number, callback: () => void): void;
        disconnect(): void;
        dropMembership(multicastAddress: string, multicastInterface?: string): void;
        getRecvBufferSize(): number;
        getSendBufferSize(): number;
        ref(): this;
        remoteAddress(): AddressInfo;
        send(msg: string | Uint8Array | ReadonlyArray<any>, port?: number, address?: string, callback?: (error: Error | null, bytes: number) => void): void;
        send(msg: string | Uint8Array | ReadonlyArray<any>, port?: number, callback?: (error: Error | null, bytes: number) => void): void;
        send(msg: string | Uint8Array | ReadonlyArray<any>, callback?: (error: Error | null, bytes: number) => void): void;
        send(msg: string | Uint8Array, offset: number, length: number, port?: number, address?: string, callback?: (error: Error | null, bytes: number) => void): void;
        send(msg: string | Uint8Array, offset: number, length: number, port?: number, callback?: (error: Error | null, bytes: number) => void): void;
        send(msg: string | Uint8Array, offset: number, length: number, callback?: (error: Error | null, bytes: number) => void): void;
        setBroadcast(flag: boolean): void;
        setMulticastInterface(multicastInterface: string): void;
        setMulticastLoopback(flag: boolean): void;
        setMulticastTTL(ttl: number): void;
        setRecvBufferSize(size: number): void;
        setSendBufferSize(size: number): void;
        setTTL(ttl: number): void;
        unref(): this;
        /**
         * Tells the kernel to join a source-specific multicast channel at the given
         * \`sourceAddress\` and \`groupAddress\`, using the \`multicastInterface\` with the
         * \`IP_ADD_SOURCE_MEMBERSHIP\` socket option.
         * If the \`multicastInterface\` argument
         * is not specified, the operating system will choose one interface and will add
         * membership to it.
         * To add membership to every available interface, call
         * \`socket.addSourceSpecificMembership()\` multiple times, once per interface.
         */
        addSourceSpecificMembership(sourceAddress: string, groupAddress: string, multicastInterface?: string): void;

        /**
         * Instructs the kernel to leave a source-specific multicast channel at the given
         * \`sourceAddress\` and \`groupAddress\` using the \`IP_DROP_SOURCE_MEMBERSHIP\`
         * socket option. This method is automatically called by the kernel when the
         * socket is closed or the process terminates, so most apps will never have
         * reason to call this.
         *
         * If \`multicastInterface\` is not specified, the operating system will attempt to
         * drop membership on all valid interfaces.
         */
        dropSourceSpecificMembership(sourceAddress: string, groupAddress: string, multicastInterface?: string): void;

        /**
         * events.EventEmitter
         * 1. close
         * 2. connect
         * 3. error
         * 4. listening
         * 5. message
         */
        addListener(event: string, listener: (...args: any[]) => void): this;
        addListener(event: "close", listener: () => void): this;
        addListener(event: "connect", listener: () => void): this;
        addListener(event: "error", listener: (err: Error) => void): this;
        addListener(event: "listening", listener: () => void): this;
        addListener(event: "message", listener: (msg: Buffer, rinfo: RemoteInfo) => void): this;

        emit(event: string | symbol, ...args: any[]): boolean;
        emit(event: "close"): boolean;
        emit(event: "connect"): boolean;
        emit(event: "error", err: Error): boolean;
        emit(event: "listening"): boolean;
        emit(event: "message", msg: Buffer, rinfo: RemoteInfo): boolean;

        on(event: string, listener: (...args: any[]) => void): this;
        on(event: "close", listener: () => void): this;
        on(event: "connect", listener: () => void): this;
        on(event: "error", listener: (err: Error) => void): this;
        on(event: "listening", listener: () => void): this;
        on(event: "message", listener: (msg: Buffer, rinfo: RemoteInfo) => void): this;

        once(event: string, listener: (...args: any[]) => void): this;
        once(event: "close", listener: () => void): this;
        once(event: "connect", listener: () => void): this;
        once(event: "error", listener: (err: Error) => void): this;
        once(event: "listening", listener: () => void): this;
        once(event: "message", listener: (msg: Buffer, rinfo: RemoteInfo) => void): this;

        prependListener(event: string, listener: (...args: any[]) => void): this;
        prependListener(event: "close", listener: () => void): this;
        prependListener(event: "connect", listener: () => void): this;
        prependListener(event: "error", listener: (err: Error) => void): this;
        prependListener(event: "listening", listener: () => void): this;
        prependListener(event: "message", listener: (msg: Buffer, rinfo: RemoteInfo) => void): this;

        prependOnceListener(event: string, listener: (...args: any[]) => void): this;
        prependOnceListener(event: "close", listener: () => void): this;
        prependOnceListener(event: "connect", listener: () => void): this;
        prependOnceListener(event: "error", listener: (err: Error) => void): this;
        prependOnceListener(event: "listening", listener: () => void): this;
        prependOnceListener(event: "message", listener: (msg: Buffer, rinfo: RemoteInfo) => void): this;
    }
}
`;
definitions['dns.d.ts'] = `declare module 'dns' {
    \/\/ Supported getaddrinfo flags.
    const ADDRCONFIG: number;
    const V4MAPPED: number;
    /**
     * If \`dns.V4MAPPED\` is specified, return resolved IPv6 addresses as
     * well as IPv4 mapped IPv6 addresses.
     */
    const ALL: number;

    interface LookupOptions {
        family?: number | undefined;
        hints?: number | undefined;
        all?: boolean | undefined;
        verbatim?: boolean | undefined;
    }

    interface LookupOneOptions extends LookupOptions {
        all?: false | undefined;
    }

    interface LookupAllOptions extends LookupOptions {
        all: true;
    }

    interface LookupAddress {
        address: string;
        family: number;
    }

    function lookup(hostname: string, family: number, callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void): void;
    function lookup(hostname: string, options: LookupOneOptions, callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void): void;
    function lookup(hostname: string, options: LookupAllOptions, callback: (err: NodeJS.ErrnoException | null, addresses: LookupAddress[]) => void): void;
    function lookup(hostname: string, options: LookupOptions, callback: (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family: number) => void): void;
    function lookup(hostname: string, callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    namespace lookup {
        function __promisify__(hostname: string, options: LookupAllOptions): Promise<LookupAddress[]>;
        function __promisify__(hostname: string, options?: LookupOneOptions | number): Promise<LookupAddress>;
        function __promisify__(hostname: string, options: LookupOptions): Promise<LookupAddress | LookupAddress[]>;
    }

    function lookupService(address: string, port: number, callback: (err: NodeJS.ErrnoException | null, hostname: string, service: string) => void): void;

    namespace lookupService {
        function __promisify__(address: string, port: number): Promise<{ hostname: string, service: string }>;
    }

    interface ResolveOptions {
        ttl: boolean;
    }

    interface ResolveWithTtlOptions extends ResolveOptions {
        ttl: true;
    }

    interface RecordWithTtl {
        address: string;
        ttl: number;
    }

    /** @deprecated Use \`AnyARecord\` or \`AnyAaaaRecord\` instead. */
    type AnyRecordWithTtl = AnyARecord | AnyAaaaRecord;

    interface AnyARecord extends RecordWithTtl {
        type: "A";
    }

    interface AnyAaaaRecord extends RecordWithTtl {
        type: "AAAA";
    }

    interface MxRecord {
        priority: number;
        exchange: string;
    }

    interface AnyMxRecord extends MxRecord {
        type: "MX";
    }

    interface NaptrRecord {
        flags: string;
        service: string;
        regexp: string;
        replacement: string;
        order: number;
        preference: number;
    }

    interface AnyNaptrRecord extends NaptrRecord {
        type: "NAPTR";
    }

    interface SoaRecord {
        nsname: string;
        hostmaster: string;
        serial: number;
        refresh: number;
        retry: number;
        expire: number;
        minttl: number;
    }

    interface AnySoaRecord extends SoaRecord {
        type: "SOA";
    }

    interface SrvRecord {
        priority: number;
        weight: number;
        port: number;
        name: string;
    }

    interface AnySrvRecord extends SrvRecord {
        type: "SRV";
    }

    interface AnyTxtRecord {
        type: "TXT";
        entries: string[];
    }

    interface AnyNsRecord {
        type: "NS";
        value: string;
    }

    interface AnyPtrRecord {
        type: "PTR";
        value: string;
    }

    interface AnyCnameRecord {
        type: "CNAME";
        value: string;
    }

    type AnyRecord = AnyARecord |
        AnyAaaaRecord |
        AnyCnameRecord |
        AnyMxRecord |
        AnyNaptrRecord |
        AnyNsRecord |
        AnyPtrRecord |
        AnySoaRecord |
        AnySrvRecord |
        AnyTxtRecord;

    function resolve(hostname: string, callback: (err: NodeJS.ErrnoException | null, addresses: string[]) => void): void;
    function resolve(hostname: string, rrtype: "A", callback: (err: NodeJS.ErrnoException | null, addresses: string[]) => void): void;
    function resolve(hostname: string, rrtype: "AAAA", callback: (err: NodeJS.ErrnoException | null, addresses: string[]) => void): void;
    function resolve(hostname: string, rrtype: "ANY", callback: (err: NodeJS.ErrnoException | null, addresses: AnyRecord[]) => void): void;
    function resolve(hostname: string, rrtype: "CNAME", callback: (err: NodeJS.ErrnoException | null, addresses: string[]) => void): void;
    function resolve(hostname: string, rrtype: "MX", callback: (err: NodeJS.ErrnoException | null, addresses: MxRecord[]) => void): void;
    function resolve(hostname: string, rrtype: "NAPTR", callback: (err: NodeJS.ErrnoException | null, addresses: NaptrRecord[]) => void): void;
    function resolve(hostname: string, rrtype: "NS", callback: (err: NodeJS.ErrnoException | null, addresses: string[]) => void): void;
    function resolve(hostname: string, rrtype: "PTR", callback: (err: NodeJS.ErrnoException | null, addresses: string[]) => void): void;
    function resolve(hostname: string, rrtype: "SOA", callback: (err: NodeJS.ErrnoException | null, addresses: SoaRecord) => void): void;
    function resolve(hostname: string, rrtype: "SRV", callback: (err: NodeJS.ErrnoException | null, addresses: SrvRecord[]) => void): void;
    function resolve(hostname: string, rrtype: "TXT", callback: (err: NodeJS.ErrnoException | null, addresses: string[][]) => void): void;
    function resolve(
        hostname: string,
        rrtype: string,
        callback: (err: NodeJS.ErrnoException | null, addresses: string[] | MxRecord[] | NaptrRecord[] | SoaRecord | SrvRecord[] | string[][] | AnyRecord[]) => void,
    ): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    namespace resolve {
        function __promisify__(hostname: string, rrtype?: "A" | "AAAA" | "CNAME" | "NS" | "PTR"): Promise<string[]>;
        function __promisify__(hostname: string, rrtype: "ANY"): Promise<AnyRecord[]>;
        function __promisify__(hostname: string, rrtype: "MX"): Promise<MxRecord[]>;
        function __promisify__(hostname: string, rrtype: "NAPTR"): Promise<NaptrRecord[]>;
        function __promisify__(hostname: string, rrtype: "SOA"): Promise<SoaRecord>;
        function __promisify__(hostname: string, rrtype: "SRV"): Promise<SrvRecord[]>;
        function __promisify__(hostname: string, rrtype: "TXT"): Promise<string[][]>;
        function __promisify__(hostname: string, rrtype: string): Promise<string[] | MxRecord[] | NaptrRecord[] | SoaRecord | SrvRecord[] | string[][] | AnyRecord[]>;
    }

    function resolve4(hostname: string, callback: (err: NodeJS.ErrnoException | null, addresses: string[]) => void): void;
    function resolve4(hostname: string, options: ResolveWithTtlOptions, callback: (err: NodeJS.ErrnoException | null, addresses: RecordWithTtl[]) => void): void;
    function resolve4(hostname: string, options: ResolveOptions, callback: (err: NodeJS.ErrnoException | null, addresses: string[] | RecordWithTtl[]) => void): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    namespace resolve4 {
        function __promisify__(hostname: string): Promise<string[]>;
        function __promisify__(hostname: string, options: ResolveWithTtlOptions): Promise<RecordWithTtl[]>;
        function __promisify__(hostname: string, options?: ResolveOptions): Promise<string[] | RecordWithTtl[]>;
    }

    function resolve6(hostname: string, callback: (err: NodeJS.ErrnoException | null, addresses: string[]) => void): void;
    function resolve6(hostname: string, options: ResolveWithTtlOptions, callback: (err: NodeJS.ErrnoException | null, addresses: RecordWithTtl[]) => void): void;
    function resolve6(hostname: string, options: ResolveOptions, callback: (err: NodeJS.ErrnoException | null, addresses: string[] | RecordWithTtl[]) => void): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    namespace resolve6 {
        function __promisify__(hostname: string): Promise<string[]>;
        function __promisify__(hostname: string, options: ResolveWithTtlOptions): Promise<RecordWithTtl[]>;
        function __promisify__(hostname: string, options?: ResolveOptions): Promise<string[] | RecordWithTtl[]>;
    }

    function resolveCname(hostname: string, callback: (err: NodeJS.ErrnoException | null, addresses: string[]) => void): void;
    namespace resolveCname {
        function __promisify__(hostname: string): Promise<string[]>;
    }

    function resolveMx(hostname: string, callback: (err: NodeJS.ErrnoException | null, addresses: MxRecord[]) => void): void;
    namespace resolveMx {
        function __promisify__(hostname: string): Promise<MxRecord[]>;
    }

    function resolveNaptr(hostname: string, callback: (err: NodeJS.ErrnoException | null, addresses: NaptrRecord[]) => void): void;
    namespace resolveNaptr {
        function __promisify__(hostname: string): Promise<NaptrRecord[]>;
    }

    function resolveNs(hostname: string, callback: (err: NodeJS.ErrnoException | null, addresses: string[]) => void): void;
    namespace resolveNs {
        function __promisify__(hostname: string): Promise<string[]>;
    }

    function resolvePtr(hostname: string, callback: (err: NodeJS.ErrnoException | null, addresses: string[]) => void): void;
    namespace resolvePtr {
        function __promisify__(hostname: string): Promise<string[]>;
    }

    function resolveSoa(hostname: string, callback: (err: NodeJS.ErrnoException | null, address: SoaRecord) => void): void;
    namespace resolveSoa {
        function __promisify__(hostname: string): Promise<SoaRecord>;
    }

    function resolveSrv(hostname: string, callback: (err: NodeJS.ErrnoException | null, addresses: SrvRecord[]) => void): void;
    namespace resolveSrv {
        function __promisify__(hostname: string): Promise<SrvRecord[]>;
    }

    function resolveTxt(hostname: string, callback: (err: NodeJS.ErrnoException | null, addresses: string[][]) => void): void;
    namespace resolveTxt {
        function __promisify__(hostname: string): Promise<string[][]>;
    }

    function resolveAny(hostname: string, callback: (err: NodeJS.ErrnoException | null, addresses: AnyRecord[]) => void): void;
    namespace resolveAny {
        function __promisify__(hostname: string): Promise<AnyRecord[]>;
    }

    function reverse(ip: string, callback: (err: NodeJS.ErrnoException | null, hostnames: string[]) => void): void;
    function setServers(servers: ReadonlyArray<string>): void;
    function getServers(): string[];

    \/\/ Error codes
    const NODATA: string;
    const FORMERR: string;
    const SERVFAIL: string;
    const NOTFOUND: string;
    const NOTIMP: string;
    const REFUSED: string;
    const BADQUERY: string;
    const BADNAME: string;
    const BADFAMILY: string;
    const BADRESP: string;
    const CONNREFUSED: string;
    const TIMEOUT: string;
    const EOF: string;
    const FILE: string;
    const NOMEM: string;
    const DESTRUCTION: string;
    const BADSTR: string;
    const BADFLAGS: string;
    const NONAME: string;
    const BADHINTS: string;
    const NOTINITIALIZED: string;
    const LOADIPHLPAPI: string;
    const ADDRGETNETWORKPARAMS: string;
    const CANCELLED: string;

    interface ResolverOptions {
        timeout?: number | undefined;
    }

    class Resolver {
        constructor(options?: ResolverOptions);
        cancel(): void;
        getServers: typeof getServers;
        resolve: typeof resolve;
        resolve4: typeof resolve4;
        resolve6: typeof resolve6;
        resolveAny: typeof resolveAny;
        resolveCname: typeof resolveCname;
        resolveMx: typeof resolveMx;
        resolveNaptr: typeof resolveNaptr;
        resolveNs: typeof resolveNs;
        resolvePtr: typeof resolvePtr;
        resolveSoa: typeof resolveSoa;
        resolveSrv: typeof resolveSrv;
        resolveTxt: typeof resolveTxt;
        reverse: typeof reverse;
        setLocalAddress(ipv4?: string, ipv6?: string): void;
        setServers: typeof setServers;
    }

    namespace promises {
        function getServers(): string[];

        function lookup(hostname: string, family: number): Promise<LookupAddress>;
        function lookup(hostname: string, options: LookupOneOptions): Promise<LookupAddress>;
        function lookup(hostname: string, options: LookupAllOptions): Promise<LookupAddress[]>;
        function lookup(hostname: string, options: LookupOptions): Promise<LookupAddress | LookupAddress[]>;
        function lookup(hostname: string): Promise<LookupAddress>;

        function lookupService(address: string, port: number): Promise<{ hostname: string, service: string }>;

        function resolve(hostname: string): Promise<string[]>;
        function resolve(hostname: string, rrtype: "A"): Promise<string[]>;
        function resolve(hostname: string, rrtype: "AAAA"): Promise<string[]>;
        function resolve(hostname: string, rrtype: "ANY"): Promise<AnyRecord[]>;
        function resolve(hostname: string, rrtype: "CNAME"): Promise<string[]>;
        function resolve(hostname: string, rrtype: "MX"): Promise<MxRecord[]>;
        function resolve(hostname: string, rrtype: "NAPTR"): Promise<NaptrRecord[]>;
        function resolve(hostname: string, rrtype: "NS"): Promise<string[]>;
        function resolve(hostname: string, rrtype: "PTR"): Promise<string[]>;
        function resolve(hostname: string, rrtype: "SOA"): Promise<SoaRecord>;
        function resolve(hostname: string, rrtype: "SRV"): Promise<SrvRecord[]>;
        function resolve(hostname: string, rrtype: "TXT"): Promise<string[][]>;
        function resolve(hostname: string, rrtype: string): Promise<string[] | MxRecord[] | NaptrRecord[] | SoaRecord | SrvRecord[] | string[][] | AnyRecord[]>;

        function resolve4(hostname: string): Promise<string[]>;
        function resolve4(hostname: string, options: ResolveWithTtlOptions): Promise<RecordWithTtl[]>;
        function resolve4(hostname: string, options: ResolveOptions): Promise<string[] | RecordWithTtl[]>;

        function resolve6(hostname: string): Promise<string[]>;
        function resolve6(hostname: string, options: ResolveWithTtlOptions): Promise<RecordWithTtl[]>;
        function resolve6(hostname: string, options: ResolveOptions): Promise<string[] | RecordWithTtl[]>;

        function resolveAny(hostname: string): Promise<AnyRecord[]>;

        function resolveCname(hostname: string): Promise<string[]>;

        function resolveMx(hostname: string): Promise<MxRecord[]>;

        function resolveNaptr(hostname: string): Promise<NaptrRecord[]>;

        function resolveNs(hostname: string): Promise<string[]>;

        function resolvePtr(hostname: string): Promise<string[]>;

        function resolveSoa(hostname: string): Promise<SoaRecord>;

        function resolveSrv(hostname: string): Promise<SrvRecord[]>;

        function resolveTxt(hostname: string): Promise<string[][]>;

        function reverse(ip: string): Promise<string[]>;

        function setServers(servers: ReadonlyArray<string>): void;

        class Resolver {
            constructor(options?: ResolverOptions);
            cancel(): void;
            getServers: typeof getServers;
            resolve: typeof resolve;
            resolve4: typeof resolve4;
            resolve6: typeof resolve6;
            resolveAny: typeof resolveAny;
            resolveCname: typeof resolveCname;
            resolveMx: typeof resolveMx;
            resolveNaptr: typeof resolveNaptr;
            resolveNs: typeof resolveNs;
            resolvePtr: typeof resolvePtr;
            resolveSoa: typeof resolveSoa;
            resolveSrv: typeof resolveSrv;
            resolveTxt: typeof resolveTxt;
            reverse: typeof reverse;
            setLocalAddress(ipv4?: string, ipv6?: string): void;
            setServers: typeof setServers;
        }
    }
}
`;
definitions['domain.d.ts'] = `declare module 'domain' {
    import EventEmitter = require('events');

    global {
        namespace NodeJS {
            interface Domain extends EventEmitter {
                run<T>(fn: (...args: any[]) => T, ...args: any[]): T;
                add(emitter: EventEmitter | Timer): void;
                remove(emitter: EventEmitter | Timer): void;
                bind<T extends Function>(cb: T): T;
                intercept<T extends Function>(cb: T): T;
            }
        }
    }

    interface Domain extends NodeJS.Domain {}
    class Domain extends EventEmitter {
        members: Array<EventEmitter | NodeJS.Timer>;
        enter(): void;
        exit(): void;
    }

    function create(): Domain;
}
`;
definitions['events.d.ts'] = `declare module 'events' {
    interface EventEmitterOptions {
        /**
         * Enables automatic capturing of promise rejection.
         */
        captureRejections?: boolean | undefined;
    }

    interface NodeEventTarget {
        once(event: string | symbol, listener: (...args: any[]) => void): this;
    }

    interface DOMEventTarget {
        addEventListener(event: string, listener: (...args: any[]) => void, opts?: { once: boolean }): any;
    }

    interface EventEmitter extends NodeJS.EventEmitter {}
    class EventEmitter {
        constructor(options?: EventEmitterOptions);

        static once(emitter: NodeEventTarget, event: string | symbol): Promise<any[]>;
        static once(emitter: DOMEventTarget, event: string): Promise<any[]>;
        static on(emitter: NodeJS.EventEmitter, event: string): AsyncIterableIterator<any>;

        /** @deprecated since v4.0.0 */
        static listenerCount(emitter: NodeJS.EventEmitter, event: string | symbol): number;

        /**
         * This symbol shall be used to install a listener for only monitoring \`'error'\`
         * events. Listeners installed using this symbol are called before the regular
         * \`'error'\` listeners are called.
         *
         * Installing a listener using this symbol does not change the behavior once an
         * \`'error'\` event is emitted, therefore the process will still crash if no
         * regular \`'error'\` listener is installed.
         */
        static readonly errorMonitor: unique symbol;
        static readonly captureRejectionSymbol: unique symbol;

        /**
         * Sets or gets the default captureRejection value for all emitters.
         */
        \/\/ TODO: These should be described using static getter/setter pairs:
        static captureRejections: boolean;
        static defaultMaxListeners: number;
    }

    import internal = require('events');
    namespace EventEmitter {
        \/\/ Should just be \`export { EventEmitter }\`, but that doesn't work in TypeScript 3.4
        export { internal as EventEmitter };
    }

    global {
        namespace NodeJS {
            interface EventEmitter {
                addListener(event: string | symbol, listener: (...args: any[]) => void): this;
                on(event: string | symbol, listener: (...args: any[]) => void): this;
                once(event: string | symbol, listener: (...args: any[]) => void): this;
                removeListener(event: string | symbol, listener: (...args: any[]) => void): this;
                off(event: string | symbol, listener: (...args: any[]) => void): this;
                removeAllListeners(event?: string | symbol): this;
                setMaxListeners(n: number): this;
                getMaxListeners(): number;
                listeners(event: string | symbol): Function[];
                rawListeners(event: string | symbol): Function[];
                emit(event: string | symbol, ...args: any[]): boolean;
                listenerCount(event: string | symbol): number;
                \/\/ Added in Node 6...
                prependListener(event: string | symbol, listener: (...args: any[]) => void): this;
                prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
                eventNames(): Array<string | symbol>;
            }
        }
    }

    export = EventEmitter;
}
`;
definitions['fs.d.ts'] = `declare module 'fs' {
    import * as stream from 'stream';
    import EventEmitter = require('events');
    import { URL } from 'url';
    import * as promises from 'fs/promises';

    export { promises };
    /**
     * Valid types for path values in "fs".
     */
    export type PathLike = string | Buffer | URL;

    export type NoParamCallback = (err: NodeJS.ErrnoException | null) => void;

    export type BufferEncodingOption = 'buffer' | { encoding: 'buffer' };

    export interface BaseEncodingOptions {
        encoding?: BufferEncoding | null | undefined;
    }

    export type OpenMode = number | string;

    export type Mode = number | string;

    export interface StatsBase<T> {
        isFile(): boolean;
        isDirectory(): boolean;
        isBlockDevice(): boolean;
        isCharacterDevice(): boolean;
        isSymbolicLink(): boolean;
        isFIFO(): boolean;
        isSocket(): boolean;

        dev: T;
        ino: T;
        mode: T;
        nlink: T;
        uid: T;
        gid: T;
        rdev: T;
        size: T;
        blksize: T;
        blocks: T;
        atimeMs: T;
        mtimeMs: T;
        ctimeMs: T;
        birthtimeMs: T;
        atime: Date;
        mtime: Date;
        ctime: Date;
        birthtime: Date;
    }

    export interface Stats extends StatsBase<number> {
    }

    export class Stats {
    }

    export class Dirent {
        isFile(): boolean;
        isDirectory(): boolean;
        isBlockDevice(): boolean;
        isCharacterDevice(): boolean;
        isSymbolicLink(): boolean;
        isFIFO(): boolean;
        isSocket(): boolean;
        name: string;
    }

    /**
     * A class representing a directory stream.
     */
    export class Dir {
        readonly path: string;

        /**
         * Asynchronously iterates over the directory via \`readdir(3)\` until all entries have been read.
         */
        [Symbol.asyncIterator](): AsyncIterableIterator<Dirent>;

        /**
         * Asynchronously close the directory's underlying resource handle.
         * Subsequent reads will result in errors.
         */
        close(): Promise<void>;
        close(cb: NoParamCallback): void;

        /**
         * Synchronously close the directory's underlying resource handle.
         * Subsequent reads will result in errors.
         */
        closeSync(): void;

        /**
         * Asynchronously read the next directory entry via \`readdir(3)\` as an \`Dirent\`.
         * After the read is completed, a value is returned that will be resolved with an \`Dirent\`, or \`null\` if there are no more directory entries to read.
         * Directory entries returned by this function are in no particular order as provided by the operating system's underlying directory mechanisms.
         */
        read(): Promise<Dirent | null>;
        read(cb: (err: NodeJS.ErrnoException | null, dirEnt: Dirent | null) => void): void;

        /**
         * Synchronously read the next directory entry via \`readdir(3)\` as a \`Dirent\`.
         * If there are no more directory entries to read, null will be returned.
         * Directory entries returned by this function are in no particular order as provided by the operating system's underlying directory mechanisms.
         */
        readSync(): Dirent | null;
    }

    export interface FSWatcher extends EventEmitter {
        close(): void;

        /**
         * events.EventEmitter
         *   1. change
         *   2. error
         */
        addListener(event: string, listener: (...args: any[]) => void): this;
        addListener(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
        addListener(event: "error", listener: (error: Error) => void): this;
        addListener(event: "close", listener: () => void): this;

        on(event: string, listener: (...args: any[]) => void): this;
        on(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
        on(event: "error", listener: (error: Error) => void): this;
        on(event: "close", listener: () => void): this;

        once(event: string, listener: (...args: any[]) => void): this;
        once(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
        once(event: "error", listener: (error: Error) => void): this;
        once(event: "close", listener: () => void): this;

        prependListener(event: string, listener: (...args: any[]) => void): this;
        prependListener(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
        prependListener(event: "error", listener: (error: Error) => void): this;
        prependListener(event: "close", listener: () => void): this;

        prependOnceListener(event: string, listener: (...args: any[]) => void): this;
        prependOnceListener(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
        prependOnceListener(event: "error", listener: (error: Error) => void): this;
        prependOnceListener(event: "close", listener: () => void): this;
    }

    export class ReadStream extends stream.Readable {
        close(): void;
        bytesRead: number;
        path: string | Buffer;
        pending: boolean;

        /**
         * events.EventEmitter
         *   1. open
         *   2. close
         *   3. ready
         */
        addListener(event: "close", listener: () => void): this;
        addListener(event: "data", listener: (chunk: Buffer | string) => void): this;
        addListener(event: "end", listener: () => void): this;
        addListener(event: "error", listener: (err: Error) => void): this;
        addListener(event: "open", listener: (fd: number) => void): this;
        addListener(event: "pause", listener: () => void): this;
        addListener(event: "readable", listener: () => void): this;
        addListener(event: "ready", listener: () => void): this;
        addListener(event: "resume", listener: () => void): this;
        addListener(event: string | symbol, listener: (...args: any[]) => void): this;

        on(event: "close", listener: () => void): this;
        on(event: "data", listener: (chunk: Buffer | string) => void): this;
        on(event: "end", listener: () => void): this;
        on(event: "error", listener: (err: Error) => void): this;
        on(event: "open", listener: (fd: number) => void): this;
        on(event: "pause", listener: () => void): this;
        on(event: "readable", listener: () => void): this;
        on(event: "ready", listener: () => void): this;
        on(event: "resume", listener: () => void): this;
        on(event: string | symbol, listener: (...args: any[]) => void): this;

        once(event: "close", listener: () => void): this;
        once(event: "data", listener: (chunk: Buffer | string) => void): this;
        once(event: "end", listener: () => void): this;
        once(event: "error", listener: (err: Error) => void): this;
        once(event: "open", listener: (fd: number) => void): this;
        once(event: "pause", listener: () => void): this;
        once(event: "readable", listener: () => void): this;
        once(event: "ready", listener: () => void): this;
        once(event: "resume", listener: () => void): this;
        once(event: string | symbol, listener: (...args: any[]) => void): this;

        prependListener(event: "close", listener: () => void): this;
        prependListener(event: "data", listener: (chunk: Buffer | string) => void): this;
        prependListener(event: "end", listener: () => void): this;
        prependListener(event: "error", listener: (err: Error) => void): this;
        prependListener(event: "open", listener: (fd: number) => void): this;
        prependListener(event: "pause", listener: () => void): this;
        prependListener(event: "readable", listener: () => void): this;
        prependListener(event: "ready", listener: () => void): this;
        prependListener(event: "resume", listener: () => void): this;
        prependListener(event: string | symbol, listener: (...args: any[]) => void): this;

        prependOnceListener(event: "close", listener: () => void): this;
        prependOnceListener(event: "data", listener: (chunk: Buffer | string) => void): this;
        prependOnceListener(event: "end", listener: () => void): this;
        prependOnceListener(event: "error", listener: (err: Error) => void): this;
        prependOnceListener(event: "open", listener: (fd: number) => void): this;
        prependOnceListener(event: "pause", listener: () => void): this;
        prependOnceListener(event: "readable", listener: () => void): this;
        prependOnceListener(event: "ready", listener: () => void): this;
        prependOnceListener(event: "resume", listener: () => void): this;
        prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
    }

    export class WriteStream extends stream.Writable {
        close(): void;
        bytesWritten: number;
        path: string | Buffer;
        pending: boolean;

        /**
         * events.EventEmitter
         *   1. open
         *   2. close
         *   3. ready
         */
        addListener(event: "close", listener: () => void): this;
        addListener(event: "drain", listener: () => void): this;
        addListener(event: "error", listener: (err: Error) => void): this;
        addListener(event: "finish", listener: () => void): this;
        addListener(event: "open", listener: (fd: number) => void): this;
        addListener(event: "pipe", listener: (src: stream.Readable) => void): this;
        addListener(event: "ready", listener: () => void): this;
        addListener(event: "unpipe", listener: (src: stream.Readable) => void): this;
        addListener(event: string | symbol, listener: (...args: any[]) => void): this;

        on(event: "close", listener: () => void): this;
        on(event: "drain", listener: () => void): this;
        on(event: "error", listener: (err: Error) => void): this;
        on(event: "finish", listener: () => void): this;
        on(event: "open", listener: (fd: number) => void): this;
        on(event: "pipe", listener: (src: stream.Readable) => void): this;
        on(event: "ready", listener: () => void): this;
        on(event: "unpipe", listener: (src: stream.Readable) => void): this;
        on(event: string | symbol, listener: (...args: any[]) => void): this;

        once(event: "close", listener: () => void): this;
        once(event: "drain", listener: () => void): this;
        once(event: "error", listener: (err: Error) => void): this;
        once(event: "finish", listener: () => void): this;
        once(event: "open", listener: (fd: number) => void): this;
        once(event: "pipe", listener: (src: stream.Readable) => void): this;
        once(event: "ready", listener: () => void): this;
        once(event: "unpipe", listener: (src: stream.Readable) => void): this;
        once(event: string | symbol, listener: (...args: any[]) => void): this;

        prependListener(event: "close", listener: () => void): this;
        prependListener(event: "drain", listener: () => void): this;
        prependListener(event: "error", listener: (err: Error) => void): this;
        prependListener(event: "finish", listener: () => void): this;
        prependListener(event: "open", listener: (fd: number) => void): this;
        prependListener(event: "pipe", listener: (src: stream.Readable) => void): this;
        prependListener(event: "ready", listener: () => void): this;
        prependListener(event: "unpipe", listener: (src: stream.Readable) => void): this;
        prependListener(event: string | symbol, listener: (...args: any[]) => void): this;

        prependOnceListener(event: "close", listener: () => void): this;
        prependOnceListener(event: "drain", listener: () => void): this;
        prependOnceListener(event: "error", listener: (err: Error) => void): this;
        prependOnceListener(event: "finish", listener: () => void): this;
        prependOnceListener(event: "open", listener: (fd: number) => void): this;
        prependOnceListener(event: "pipe", listener: (src: stream.Readable) => void): this;
        prependOnceListener(event: "ready", listener: () => void): this;
        prependOnceListener(event: "unpipe", listener: (src: stream.Readable) => void): this;
        prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
    }

    /**
     * Asynchronous rename(2) - Change the name or location of a file or directory.
     * @param oldPath A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     * @param newPath A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     */
    export function rename(oldPath: PathLike, newPath: PathLike, callback: NoParamCallback): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace rename {
        /**
         * Asynchronous rename(2) - Change the name or location of a file or directory.
         * @param oldPath A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * URL support is _experimental_.
         * @param newPath A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * URL support is _experimental_.
         */
        function __promisify__(oldPath: PathLike, newPath: PathLike): Promise<void>;
    }

    /**
     * Synchronous rename(2) - Change the name or location of a file or directory.
     * @param oldPath A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     * @param newPath A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     */
    export function renameSync(oldPath: PathLike, newPath: PathLike): void;

    /**
     * Asynchronous truncate(2) - Truncate a file to a specified length.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param len If not specified, defaults to \`0\`.
     */
    export function truncate(path: PathLike, len: number | undefined | null, callback: NoParamCallback): void;

    /**
     * Asynchronous truncate(2) - Truncate a file to a specified length.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     */
    export function truncate(path: PathLike, callback: NoParamCallback): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace truncate {
        /**
         * Asynchronous truncate(2) - Truncate a file to a specified length.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * @param len If not specified, defaults to \`0\`.
         */
        function __promisify__(path: PathLike, len?: number | null): Promise<void>;
    }

    /**
     * Synchronous truncate(2) - Truncate a file to a specified length.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param len If not specified, defaults to \`0\`.
     */
    export function truncateSync(path: PathLike, len?: number | null): void;

    /**
     * Asynchronous ftruncate(2) - Truncate a file to a specified length.
     * @param fd A file descriptor.
     * @param len If not specified, defaults to \`0\`.
     */
    export function ftruncate(fd: number, len: number | undefined | null, callback: NoParamCallback): void;

    /**
     * Asynchronous ftruncate(2) - Truncate a file to a specified length.
     * @param fd A file descriptor.
     */
    export function ftruncate(fd: number, callback: NoParamCallback): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace ftruncate {
        /**
         * Asynchronous ftruncate(2) - Truncate a file to a specified length.
         * @param fd A file descriptor.
         * @param len If not specified, defaults to \`0\`.
         */
        function __promisify__(fd: number, len?: number | null): Promise<void>;
    }

    /**
     * Synchronous ftruncate(2) - Truncate a file to a specified length.
     * @param fd A file descriptor.
     * @param len If not specified, defaults to \`0\`.
     */
    export function ftruncateSync(fd: number, len?: number | null): void;

    /**
     * Asynchronous chown(2) - Change ownership of a file.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     */
    export function chown(path: PathLike, uid: number, gid: number, callback: NoParamCallback): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace chown {
        /**
         * Asynchronous chown(2) - Change ownership of a file.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         */
        function __promisify__(path: PathLike, uid: number, gid: number): Promise<void>;
    }

    /**
     * Synchronous chown(2) - Change ownership of a file.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     */
    export function chownSync(path: PathLike, uid: number, gid: number): void;

    /**
     * Asynchronous fchown(2) - Change ownership of a file.
     * @param fd A file descriptor.
     */
    export function fchown(fd: number, uid: number, gid: number, callback: NoParamCallback): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace fchown {
        /**
         * Asynchronous fchown(2) - Change ownership of a file.
         * @param fd A file descriptor.
         */
        function __promisify__(fd: number, uid: number, gid: number): Promise<void>;
    }

    /**
     * Synchronous fchown(2) - Change ownership of a file.
     * @param fd A file descriptor.
     */
    export function fchownSync(fd: number, uid: number, gid: number): void;

    /**
     * Asynchronous lchown(2) - Change ownership of a file. Does not dereference symbolic links.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     */
    export function lchown(path: PathLike, uid: number, gid: number, callback: NoParamCallback): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace lchown {
        /**
         * Asynchronous lchown(2) - Change ownership of a file. Does not dereference symbolic links.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         */
        function __promisify__(path: PathLike, uid: number, gid: number): Promise<void>;
    }

    /**
     * Synchronous lchown(2) - Change ownership of a file. Does not dereference symbolic links.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     */
    export function lchownSync(path: PathLike, uid: number, gid: number): void;

    /**
     * Changes the access and modification times of a file in the same way as \`fs.utimes()\`,
     * with the difference that if the path refers to a symbolic link, then the link is not
     * dereferenced: instead, the timestamps of the symbolic link itself are changed.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param atime The last access time. If a string is provided, it will be coerced to number.
     * @param mtime The last modified time. If a string is provided, it will be coerced to number.
     */
    export function lutimes(path: PathLike, atime: string | number | Date, mtime: string | number | Date, callback: NoParamCallback): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace lutimes {
        /**
         * Changes the access and modification times of a file in the same way as \`fsPromises.utimes()\`,
         * with the difference that if the path refers to a symbolic link, then the link is not
         * dereferenced: instead, the timestamps of the symbolic link itself are changed.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * @param atime The last access time. If a string is provided, it will be coerced to number.
         * @param mtime The last modified time. If a string is provided, it will be coerced to number.
         */
        function __promisify__(path: PathLike, atime: string | number | Date, mtime: string | number | Date): Promise<void>;
    }

    /**
     * Change the file system timestamps of the symbolic link referenced by \`path\`. Returns \`undefined\`,
     * or throws an exception when parameters are incorrect or the operation fails.
     * This is the synchronous version of \`fs.lutimes()\`.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param atime The last access time. If a string is provided, it will be coerced to number.
     * @param mtime The last modified time. If a string is provided, it will be coerced to number.
     */
    export function lutimesSync(path: PathLike, atime: string | number | Date, mtime: string | number | Date): void;

    /**
     * Asynchronous chmod(2) - Change permissions of a file.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
     */
    export function chmod(path: PathLike, mode: Mode, callback: NoParamCallback): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace chmod {
        /**
         * Asynchronous chmod(2) - Change permissions of a file.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
         */
        function __promisify__(path: PathLike, mode: Mode): Promise<void>;
    }

    /**
     * Synchronous chmod(2) - Change permissions of a file.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
     */
    export function chmodSync(path: PathLike, mode: Mode): void;

    /**
     * Asynchronous fchmod(2) - Change permissions of a file.
     * @param fd A file descriptor.
     * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
     */
    export function fchmod(fd: number, mode: Mode, callback: NoParamCallback): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace fchmod {
        /**
         * Asynchronous fchmod(2) - Change permissions of a file.
         * @param fd A file descriptor.
         * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
         */
        function __promisify__(fd: number, mode: Mode): Promise<void>;
    }

    /**
     * Synchronous fchmod(2) - Change permissions of a file.
     * @param fd A file descriptor.
     * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
     */
    export function fchmodSync(fd: number, mode: Mode): void;

    /**
     * Asynchronous lchmod(2) - Change permissions of a file. Does not dereference symbolic links.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
     */
    export function lchmod(path: PathLike, mode: Mode, callback: NoParamCallback): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace lchmod {
        /**
         * Asynchronous lchmod(2) - Change permissions of a file. Does not dereference symbolic links.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
         */
        function __promisify__(path: PathLike, mode: Mode): Promise<void>;
    }

    /**
     * Synchronous lchmod(2) - Change permissions of a file. Does not dereference symbolic links.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
     */
    export function lchmodSync(path: PathLike, mode: Mode): void;

    /**
     * Asynchronous stat(2) - Get file status.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     */
    export function stat(path: PathLike, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void): void;
    export function stat(path: PathLike, options: StatOptions & { bigint?: false | undefined } | undefined, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void): void;
    export function stat(path: PathLike, options: StatOptions & { bigint: true }, callback: (err: NodeJS.ErrnoException | null, stats: BigIntStats) => void): void;
    export function stat(path: PathLike, options: StatOptions | undefined, callback: (err: NodeJS.ErrnoException | null, stats: Stats | BigIntStats) => void): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace stat {
        /**
         * Asynchronous stat(2) - Get file status.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         */
        function __promisify__(path: PathLike, options?: StatOptions & { bigint?: false | undefined }): Promise<Stats>;
        function __promisify__(path: PathLike, options: StatOptions & { bigint: true }): Promise<BigIntStats>;
        function __promisify__(path: PathLike, options?: StatOptions): Promise<Stats | BigIntStats>;
    }

    /**
     * Synchronous stat(2) - Get file status.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     */
    export function statSync(path: PathLike, options?: StatOptions & { bigint?: false | undefined }): Stats;
    export function statSync(path: PathLike, options: StatOptions & { bigint: true }): BigIntStats;
    export function statSync(path: PathLike, options?: StatOptions): Stats | BigIntStats;

    /**
     * Asynchronous fstat(2) - Get file status.
     * @param fd A file descriptor.
     */
    export function fstat(fd: number, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void): void;
    export function fstat(fd: number, options: StatOptions & { bigint?: false | undefined } | undefined, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void): void;
    export function fstat(fd: number, options: StatOptions & { bigint: true }, callback: (err: NodeJS.ErrnoException | null, stats: BigIntStats) => void): void;
    export function fstat(fd: number, options: StatOptions | undefined, callback: (err: NodeJS.ErrnoException | null, stats: Stats | BigIntStats) => void): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace fstat {
        /**
         * Asynchronous fstat(2) - Get file status.
         * @param fd A file descriptor.
         */
        function __promisify__(fd: number, options?: StatOptions & { bigint?: false | undefined }): Promise<Stats>;
        function __promisify__(fd: number, options: StatOptions & { bigint: true }): Promise<BigIntStats>;
        function __promisify__(fd: number, options?: StatOptions): Promise<Stats | BigIntStats>;
    }

    /**
     * Synchronous fstat(2) - Get file status.
     * @param fd A file descriptor.
     */
    export function fstatSync(fd: number, options?: StatOptions & { bigint?: false | undefined }): Stats;
    export function fstatSync(fd: number, options: StatOptions & { bigint: true }): BigIntStats;
    export function fstatSync(fd: number, options?: StatOptions): Stats | BigIntStats;

    /**
     * Asynchronous lstat(2) - Get file status. Does not dereference symbolic links.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     */
    export function lstat(path: PathLike, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void): void;
    export function lstat(path: PathLike, options: StatOptions & { bigint?: false | undefined } | undefined, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void): void;
    export function lstat(path: PathLike, options: StatOptions & { bigint: true }, callback: (err: NodeJS.ErrnoException | null, stats: BigIntStats) => void): void;
    export function lstat(path: PathLike, options: StatOptions | undefined, callback: (err: NodeJS.ErrnoException | null, stats: Stats | BigIntStats) => void): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace lstat {
        /**
         * Asynchronous lstat(2) - Get file status. Does not dereference symbolic links.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         */
        function __promisify__(path: PathLike, options?: StatOptions & { bigint?: false | undefined }): Promise<Stats>;
        function __promisify__(path: PathLike, options: StatOptions & { bigint: true }): Promise<BigIntStats>;
        function __promisify__(path: PathLike, options?: StatOptions): Promise<Stats | BigIntStats>;
    }

    /**
     * Synchronous lstat(2) - Get file status. Does not dereference symbolic links.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     */
    export function lstatSync(path: PathLike, options?: StatOptions & { bigint?: false | undefined }): Stats;
    export function lstatSync(path: PathLike, options: StatOptions & { bigint: true }): BigIntStats;
    export function lstatSync(path: PathLike, options?: StatOptions): Stats | BigIntStats;

    /**
     * Asynchronous link(2) - Create a new link (also known as a hard link) to an existing file.
     * @param existingPath A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param newPath A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     */
    export function link(existingPath: PathLike, newPath: PathLike, callback: NoParamCallback): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace link {
        /**
         * Asynchronous link(2) - Create a new link (also known as a hard link) to an existing file.
         * @param existingPath A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * @param newPath A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         */
        function __promisify__(existingPath: PathLike, newPath: PathLike): Promise<void>;
    }

    /**
     * Synchronous link(2) - Create a new link (also known as a hard link) to an existing file.
     * @param existingPath A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param newPath A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     */
    export function linkSync(existingPath: PathLike, newPath: PathLike): void;

    /**
     * Asynchronous symlink(2) - Create a new symbolic link to an existing file.
     * @param target A path to an existing file. If a URL is provided, it must use the \`file:\` protocol.
     * @param path A path to the new symlink. If a URL is provided, it must use the \`file:\` protocol.
     * @param type May be set to \`'dir'\`, \`'file'\`, or \`'junction'\` (default is \`'file'\`) and is only available on Windows (ignored on other platforms).
     * When using \`'junction'\`, the \`target\` argument will automatically be normalized to an absolute path.
     */
    export function symlink(target: PathLike, path: PathLike, type: symlink.Type | undefined | null, callback: NoParamCallback): void;

    /**
     * Asynchronous symlink(2) - Create a new symbolic link to an existing file.
     * @param target A path to an existing file. If a URL is provided, it must use the \`file:\` protocol.
     * @param path A path to the new symlink. If a URL is provided, it must use the \`file:\` protocol.
     */
    export function symlink(target: PathLike, path: PathLike, callback: NoParamCallback): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace symlink {
        /**
         * Asynchronous symlink(2) - Create a new symbolic link to an existing file.
         * @param target A path to an existing file. If a URL is provided, it must use the \`file:\` protocol.
         * @param path A path to the new symlink. If a URL is provided, it must use the \`file:\` protocol.
         * @param type May be set to \`'dir'\`, \`'file'\`, or \`'junction'\` (default is \`'file'\`) and is only available on Windows (ignored on other platforms).
         * When using \`'junction'\`, the \`target\` argument will automatically be normalized to an absolute path.
         */
        function __promisify__(target: PathLike, path: PathLike, type?: string | null): Promise<void>;

        type Type = "dir" | "file" | "junction";
    }

    /**
     * Synchronous symlink(2) - Create a new symbolic link to an existing file.
     * @param target A path to an existing file. If a URL is provided, it must use the \`file:\` protocol.
     * @param path A path to the new symlink. If a URL is provided, it must use the \`file:\` protocol.
     * @param type May be set to \`'dir'\`, \`'file'\`, or \`'junction'\` (default is \`'file'\`) and is only available on Windows (ignored on other platforms).
     * When using \`'junction'\`, the \`target\` argument will automatically be normalized to an absolute path.
     */
    export function symlinkSync(target: PathLike, path: PathLike, type?: symlink.Type | null): void;

    /**
     * Asynchronous readlink(2) - read value of a symbolic link.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
     */
    export function readlink(
        path: PathLike,
        options: BaseEncodingOptions | BufferEncoding | undefined | null,
        callback: (err: NodeJS.ErrnoException | null, linkString: string) => void
    ): void;

    /**
     * Asynchronous readlink(2) - read value of a symbolic link.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
     */
    export function readlink(path: PathLike, options: BufferEncodingOption, callback: (err: NodeJS.ErrnoException | null, linkString: Buffer) => void): void;

    /**
     * Asynchronous readlink(2) - read value of a symbolic link.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
     */
    export function readlink(path: PathLike, options: BaseEncodingOptions | string | undefined | null, callback: (err: NodeJS.ErrnoException | null, linkString: string | Buffer) => void): void;

    /**
     * Asynchronous readlink(2) - read value of a symbolic link.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     */
    export function readlink(path: PathLike, callback: (err: NodeJS.ErrnoException | null, linkString: string) => void): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace readlink {
        /**
         * Asynchronous readlink(2) - read value of a symbolic link.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
         */
        function __promisify__(path: PathLike, options?: BaseEncodingOptions | BufferEncoding | null): Promise<string>;

        /**
         * Asynchronous readlink(2) - read value of a symbolic link.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
         */
        function __promisify__(path: PathLike, options: BufferEncodingOption): Promise<Buffer>;

        /**
         * Asynchronous readlink(2) - read value of a symbolic link.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
         */
        function __promisify__(path: PathLike, options?: BaseEncodingOptions | string | null): Promise<string | Buffer>;
    }

    /**
     * Synchronous readlink(2) - read value of a symbolic link.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
     */
    export function readlinkSync(path: PathLike, options?: BaseEncodingOptions | BufferEncoding | null): string;

    /**
     * Synchronous readlink(2) - read value of a symbolic link.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
     */
    export function readlinkSync(path: PathLike, options: BufferEncodingOption): Buffer;

    /**
     * Synchronous readlink(2) - read value of a symbolic link.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
     */
    export function readlinkSync(path: PathLike, options?: BaseEncodingOptions | string | null): string | Buffer;

    /**
     * Asynchronous realpath(3) - return the canonicalized absolute pathname.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
     */
    export function realpath(
        path: PathLike,
        options: BaseEncodingOptions | BufferEncoding | undefined | null,
        callback: (err: NodeJS.ErrnoException | null, resolvedPath: string) => void
    ): void;

    /**
     * Asynchronous realpath(3) - return the canonicalized absolute pathname.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
     */
    export function realpath(path: PathLike, options: BufferEncodingOption, callback: (err: NodeJS.ErrnoException | null, resolvedPath: Buffer) => void): void;

    /**
     * Asynchronous realpath(3) - return the canonicalized absolute pathname.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
     */
    export function realpath(path: PathLike, options: BaseEncodingOptions | string | undefined | null, callback: (err: NodeJS.ErrnoException | null, resolvedPath: string | Buffer) => void): void;

    /**
     * Asynchronous realpath(3) - return the canonicalized absolute pathname.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     */
    export function realpath(path: PathLike, callback: (err: NodeJS.ErrnoException | null, resolvedPath: string) => void): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace realpath {
        /**
         * Asynchronous realpath(3) - return the canonicalized absolute pathname.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
         */
        function __promisify__(path: PathLike, options?: BaseEncodingOptions | BufferEncoding | null): Promise<string>;

        /**
         * Asynchronous realpath(3) - return the canonicalized absolute pathname.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
         */
        function __promisify__(path: PathLike, options: BufferEncodingOption): Promise<Buffer>;

        /**
         * Asynchronous realpath(3) - return the canonicalized absolute pathname.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
         */
        function __promisify__(path: PathLike, options?: BaseEncodingOptions | string | null): Promise<string | Buffer>;

        function native(
            path: PathLike,
            options: BaseEncodingOptions | BufferEncoding | undefined | null,
            callback: (err: NodeJS.ErrnoException | null, resolvedPath: string) => void
        ): void;
        function native(path: PathLike, options: BufferEncodingOption, callback: (err: NodeJS.ErrnoException | null, resolvedPath: Buffer) => void): void;
        function native(path: PathLike, options: BaseEncodingOptions | string | undefined | null, callback: (err: NodeJS.ErrnoException | null, resolvedPath: string | Buffer) => void): void;
        function native(path: PathLike, callback: (err: NodeJS.ErrnoException | null, resolvedPath: string) => void): void;
    }

    /**
     * Synchronous realpath(3) - return the canonicalized absolute pathname.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
     */
    export function realpathSync(path: PathLike, options?: BaseEncodingOptions | BufferEncoding | null): string;

    /**
     * Synchronous realpath(3) - return the canonicalized absolute pathname.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
     */
    export function realpathSync(path: PathLike, options: BufferEncodingOption): Buffer;

    /**
     * Synchronous realpath(3) - return the canonicalized absolute pathname.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
     */
    export function realpathSync(path: PathLike, options?: BaseEncodingOptions | string | null): string | Buffer;

    export namespace realpathSync {
        function native(path: PathLike, options?: BaseEncodingOptions | BufferEncoding | null): string;
        function native(path: PathLike, options: BufferEncodingOption): Buffer;
        function native(path: PathLike, options?: BaseEncodingOptions | string | null): string | Buffer;
    }

    /**
     * Asynchronous unlink(2) - delete a name and possibly the file it refers to.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     */
    export function unlink(path: PathLike, callback: NoParamCallback): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace unlink {
        /**
         * Asynchronous unlink(2) - delete a name and possibly the file it refers to.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         */
        function __promisify__(path: PathLike): Promise<void>;
    }

    /**
     * Synchronous unlink(2) - delete a name and possibly the file it refers to.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     */
    export function unlinkSync(path: PathLike): void;

    export interface RmDirOptions {
        /**
         * If an \`EBUSY\`, \`EMFILE\`, \`ENFILE\`, \`ENOTEMPTY\`, or
         * \`EPERM\` error is encountered, Node.js will retry the operation with a linear
         * backoff wait of \`retryDelay\` ms longer on each try. This option represents the
         * number of retries. This option is ignored if the \`recursive\` option is not
         * \`true\`.
         * @default 0
         */
        maxRetries?: number | undefined;
        /**
         * @deprecated since v14.14.0 In future versions of Node.js,
         * \`fs.rmdir(path, { recursive: true })\` will throw on nonexistent
         * paths, or when given a file as a target.
         * Use \`fs.rm(path, { recursive: true, force: true })\` instead.
         *
         * If \`true\`, perform a recursive directory removal. In
         * recursive mode, errors are not reported if \`path\` does not exist, and
         * operations are retried on failure.
         * @default false
         */
        recursive?: boolean | undefined;
        /**
         * The amount of time in milliseconds to wait between retries.
         * This option is ignored if the \`recursive\` option is not \`true\`.
         * @default 100
         */
        retryDelay?: number | undefined;
    }

    /**
     * Asynchronous rmdir(2) - delete a directory.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     */
    export function rmdir(path: PathLike, callback: NoParamCallback): void;
    export function rmdir(path: PathLike, options: RmDirOptions, callback: NoParamCallback): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace rmdir {
        /**
         * Asynchronous rmdir(2) - delete a directory.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         */
        function __promisify__(path: PathLike, options?: RmDirOptions): Promise<void>;
    }

    /**
     * Synchronous rmdir(2) - delete a directory.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     */
    export function rmdirSync(path: PathLike, options?: RmDirOptions): void;

    export interface RmOptions {
        /**
         * When \`true\`, exceptions will be ignored if \`path\` does not exist.
         * @default false
         */
        force?: boolean | undefined;
        /**
         * If an \`EBUSY\`, \`EMFILE\`, \`ENFILE\`, \`ENOTEMPTY\`, or
         * \`EPERM\` error is encountered, Node.js will retry the operation with a linear
         * backoff wait of \`retryDelay\` ms longer on each try. This option represents the
         * number of retries. This option is ignored if the \`recursive\` option is not
         * \`true\`.
         * @default 0
         */
        maxRetries?: number | undefined;
        /**
         * If \`true\`, perform a recursive directory removal. In
         * recursive mode, errors are not reported if \`path\` does not exist, and
         * operations are retried on failure.
         * @default false
         */
        recursive?: boolean | undefined;
        /**
         * The amount of time in milliseconds to wait between retries.
         * This option is ignored if the \`recursive\` option is not \`true\`.
         * @default 100
         */
        retryDelay?: number | undefined;
    }

    /**
     * Asynchronously removes files and directories (modeled on the standard POSIX \`rm\` utility).
     */
    export function rm(path: PathLike, callback: NoParamCallback): void;
    export function rm(path: PathLike, options: RmOptions, callback: NoParamCallback): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace rm {
        /**
         * Asynchronously removes files and directories (modeled on the standard POSIX \`rm\` utility).
         */
        function __promisify__(path: PathLike, options?: RmOptions): Promise<void>;
    }

    /**
     * Synchronously removes files and directories (modeled on the standard POSIX \`rm\` utility).
     */
    export function rmSync(path: PathLike, options?: RmOptions): void;

    export interface MakeDirectoryOptions {
        /**
         * Indicates whether parent folders should be created.
         * If a folder was created, the path to the first created folder will be returned.
         * @default false
         */
        recursive?: boolean | undefined;
        /**
         * A file mode. If a string is passed, it is parsed as an octal integer. If not specified
         * @default 0o777
         */
        mode?: Mode | undefined;
    }

    /**
     * Asynchronous mkdir(2) - create a directory.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options Either the file mode, or an object optionally specifying the file mode and whether parent folders
     * should be created. If a string is passed, it is parsed as an octal integer. If not specified, defaults to \`0o777\`.
     */
    export function mkdir(path: PathLike, options: MakeDirectoryOptions & { recursive: true }, callback: (err: NodeJS.ErrnoException | null, path?: string) => void): void;

    /**
     * Asynchronous mkdir(2) - create a directory.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options Either the file mode, or an object optionally specifying the file mode and whether parent folders
     * should be created. If a string is passed, it is parsed as an octal integer. If not specified, defaults to \`0o777\`.
     */
    export function mkdir(path: PathLike, options: Mode | (MakeDirectoryOptions & { recursive?: false | undefined; }) | null | undefined, callback: NoParamCallback): void;

    /**
     * Asynchronous mkdir(2) - create a directory.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options Either the file mode, or an object optionally specifying the file mode and whether parent folders
     * should be created. If a string is passed, it is parsed as an octal integer. If not specified, defaults to \`0o777\`.
     */
    export function mkdir(path: PathLike, options: Mode | MakeDirectoryOptions | null | undefined, callback: (err: NodeJS.ErrnoException | null, path?: string) => void): void;

    /**
     * Asynchronous mkdir(2) - create a directory with a mode of \`0o777\`.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     */
    export function mkdir(path: PathLike, callback: NoParamCallback): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace mkdir {
        /**
         * Asynchronous mkdir(2) - create a directory.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * @param options Either the file mode, or an object optionally specifying the file mode and whether parent folders
         * should be created. If a string is passed, it is parsed as an octal integer. If not specified, defaults to \`0o777\`.
         */
        function __promisify__(path: PathLike, options: MakeDirectoryOptions & { recursive: true; }): Promise<string | undefined>;

        /**
         * Asynchronous mkdir(2) - create a directory.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * @param options Either the file mode, or an object optionally specifying the file mode and whether parent folders
         * should be created. If a string is passed, it is parsed as an octal integer. If not specified, defaults to \`0o777\`.
         */
        function __promisify__(path: PathLike, options?: Mode | (MakeDirectoryOptions & { recursive?: false | undefined; }) | null): Promise<void>;

        /**
         * Asynchronous mkdir(2) - create a directory.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * @param options Either the file mode, or an object optionally specifying the file mode and whether parent folders
         * should be created. If a string is passed, it is parsed as an octal integer. If not specified, defaults to \`0o777\`.
         */
        function __promisify__(path: PathLike, options?: Mode | MakeDirectoryOptions | null): Promise<string | undefined>;
    }

    /**
     * Synchronous mkdir(2) - create a directory.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options Either the file mode, or an object optionally specifying the file mode and whether parent folders
     * should be created. If a string is passed, it is parsed as an octal integer. If not specified, defaults to \`0o777\`.
     */
    export function mkdirSync(path: PathLike, options: MakeDirectoryOptions & { recursive: true; }): string | undefined;

    /**
     * Synchronous mkdir(2) - create a directory.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options Either the file mode, or an object optionally specifying the file mode and whether parent folders
     * should be created. If a string is passed, it is parsed as an octal integer. If not specified, defaults to \`0o777\`.
     */
    export function mkdirSync(path: PathLike, options?: Mode | (MakeDirectoryOptions & { recursive?: false | undefined; }) | null): void;

    /**
     * Synchronous mkdir(2) - create a directory.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options Either the file mode, or an object optionally specifying the file mode and whether parent folders
     * should be created. If a string is passed, it is parsed as an octal integer. If not specified, defaults to \`0o777\`.
     */
    export function mkdirSync(path: PathLike, options?: Mode | MakeDirectoryOptions | null): string | undefined;

    /**
     * Asynchronously creates a unique temporary directory.
     * Generates six random characters to be appended behind a required prefix to create a unique temporary directory.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
     */
    export function mkdtemp(prefix: string, options: BaseEncodingOptions | BufferEncoding | undefined | null, callback: (err: NodeJS.ErrnoException | null, folder: string) => void): void;

    /**
     * Asynchronously creates a unique temporary directory.
     * Generates six random characters to be appended behind a required prefix to create a unique temporary directory.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
     */
    export function mkdtemp(prefix: string, options: "buffer" | { encoding: "buffer" }, callback: (err: NodeJS.ErrnoException | null, folder: Buffer) => void): void;

    /**
     * Asynchronously creates a unique temporary directory.
     * Generates six random characters to be appended behind a required prefix to create a unique temporary directory.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
     */
    export function mkdtemp(prefix: string, options: BaseEncodingOptions | string | undefined | null, callback: (err: NodeJS.ErrnoException | null, folder: string | Buffer) => void): void;

    /**
     * Asynchronously creates a unique temporary directory.
     * Generates six random characters to be appended behind a required prefix to create a unique temporary directory.
     */
    export function mkdtemp(prefix: string, callback: (err: NodeJS.ErrnoException | null, folder: string) => void): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace mkdtemp {
        /**
         * Asynchronously creates a unique temporary directory.
         * Generates six random characters to be appended behind a required prefix to create a unique temporary directory.
         * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
         */
        function __promisify__(prefix: string, options?: BaseEncodingOptions | BufferEncoding | null): Promise<string>;

        /**
         * Asynchronously creates a unique temporary directory.
         * Generates six random characters to be appended behind a required prefix to create a unique temporary directory.
         * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
         */
        function __promisify__(prefix: string, options: BufferEncodingOption): Promise<Buffer>;

        /**
         * Asynchronously creates a unique temporary directory.
         * Generates six random characters to be appended behind a required prefix to create a unique temporary directory.
         * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
         */
        function __promisify__(prefix: string, options?: BaseEncodingOptions | string | null): Promise<string | Buffer>;
    }

    /**
     * Synchronously creates a unique temporary directory.
     * Generates six random characters to be appended behind a required prefix to create a unique temporary directory.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
     */
    export function mkdtempSync(prefix: string, options?: BaseEncodingOptions | BufferEncoding | null): string;

    /**
     * Synchronously creates a unique temporary directory.
     * Generates six random characters to be appended behind a required prefix to create a unique temporary directory.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
     */
    export function mkdtempSync(prefix: string, options: BufferEncodingOption): Buffer;

    /**
     * Synchronously creates a unique temporary directory.
     * Generates six random characters to be appended behind a required prefix to create a unique temporary directory.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
     */
    export function mkdtempSync(prefix: string, options?: BaseEncodingOptions | string | null): string | Buffer;

    /**
     * Asynchronous readdir(3) - read a directory.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
     */
    export function readdir(
        path: PathLike,
        options: { encoding: BufferEncoding | null; withFileTypes?: false | undefined } | BufferEncoding | undefined | null,
        callback: (err: NodeJS.ErrnoException | null, files: string[]) => void,
    ): void;

    /**
     * Asynchronous readdir(3) - read a directory.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
     */
    export function readdir(
        path: PathLike,
        options: { encoding: "buffer"; withFileTypes?: false | undefined } | "buffer",
        callback: (err: NodeJS.ErrnoException | null, files: Buffer[]) => void
    ): void;

    /**
     * Asynchronous readdir(3) - read a directory.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
     */
    export function readdir(
        path: PathLike,
        options: BaseEncodingOptions & { withFileTypes?: false | undefined } | BufferEncoding | undefined | null,
        callback: (err: NodeJS.ErrnoException | null, files: string[] | Buffer[]) => void,
    ): void;

    /**
     * Asynchronous readdir(3) - read a directory.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     */
    export function readdir(path: PathLike, callback: (err: NodeJS.ErrnoException | null, files: string[]) => void): void;

    /**
     * Asynchronous readdir(3) - read a directory.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options If called with \`withFileTypes: true\` the result data will be an array of Dirent.
     */
    export function readdir(path: PathLike, options: BaseEncodingOptions & { withFileTypes: true }, callback: (err: NodeJS.ErrnoException | null, files: Dirent[]) => void): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace readdir {
        /**
         * Asynchronous readdir(3) - read a directory.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
         */
        function __promisify__(path: PathLike, options?: { encoding: BufferEncoding | null; withFileTypes?: false | undefined } | BufferEncoding | null): Promise<string[]>;

        /**
         * Asynchronous readdir(3) - read a directory.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
         */
        function __promisify__(path: PathLike, options: "buffer" | { encoding: "buffer"; withFileTypes?: false | undefined }): Promise<Buffer[]>;

        /**
         * Asynchronous readdir(3) - read a directory.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
         */
        function __promisify__(path: PathLike, options?: BaseEncodingOptions & { withFileTypes?: false | undefined } | BufferEncoding | null): Promise<string[] | Buffer[]>;

        /**
         * Asynchronous readdir(3) - read a directory.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * @param options If called with \`withFileTypes: true\` the result data will be an array of Dirent
         */
        function __promisify__(path: PathLike, options: BaseEncodingOptions & { withFileTypes: true }): Promise<Dirent[]>;
    }

    /**
     * Synchronous readdir(3) - read a directory.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
     */
    export function readdirSync(path: PathLike, options?: { encoding: BufferEncoding | null; withFileTypes?: false | undefined } | BufferEncoding | null): string[];

    /**
     * Synchronous readdir(3) - read a directory.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
     */
    export function readdirSync(path: PathLike, options: { encoding: "buffer"; withFileTypes?: false | undefined } | "buffer"): Buffer[];

    /**
     * Synchronous readdir(3) - read a directory.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, \`'utf8'\` is used.
     */
    export function readdirSync(path: PathLike, options?: BaseEncodingOptions & { withFileTypes?: false | undefined } | BufferEncoding | null): string[] | Buffer[];

    /**
     * Synchronous readdir(3) - read a directory.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param options If called with \`withFileTypes: true\` the result data will be an array of Dirent.
     */
    export function readdirSync(path: PathLike, options: BaseEncodingOptions & { withFileTypes: true }): Dirent[];

    /**
     * Asynchronous close(2) - close a file descriptor.
     * @param fd A file descriptor.
     */
    export function close(fd: number, callback: NoParamCallback): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace close {
        /**
         * Asynchronous close(2) - close a file descriptor.
         * @param fd A file descriptor.
         */
        function __promisify__(fd: number): Promise<void>;
    }

    /**
     * Synchronous close(2) - close a file descriptor.
     * @param fd A file descriptor.
     */
    export function closeSync(fd: number): void;

    /**
     * Asynchronous open(2) - open and possibly create a file.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param mode A file mode. If a string is passed, it is parsed as an octal integer. If not supplied, defaults to \`0o666\`.
     */
    export function open(path: PathLike, flags: OpenMode, mode: Mode | undefined | null, callback: (err: NodeJS.ErrnoException | null, fd: number) => void): void;

    /**
     * Asynchronous open(2) - open and possibly create a file. If the file is created, its mode will be \`0o666\`.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     */
    export function open(path: PathLike, flags: OpenMode, callback: (err: NodeJS.ErrnoException | null, fd: number) => void): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace open {
        /**
         * Asynchronous open(2) - open and possibly create a file.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * @param mode A file mode. If a string is passed, it is parsed as an octal integer. If not supplied, defaults to \`0o666\`.
         */
        function __promisify__(path: PathLike, flags: OpenMode, mode?: Mode | null): Promise<number>;
    }

    /**
     * Synchronous open(2) - open and possibly create a file, returning a file descriptor..
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param mode A file mode. If a string is passed, it is parsed as an octal integer. If not supplied, defaults to \`0o666\`.
     */
    export function openSync(path: PathLike, flags: OpenMode, mode?: Mode | null): number;

    /**
     * Asynchronously change file timestamps of the file referenced by the supplied path.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param atime The last access time. If a string is provided, it will be coerced to number.
     * @param mtime The last modified time. If a string is provided, it will be coerced to number.
     */
    export function utimes(path: PathLike, atime: string | number | Date, mtime: string | number | Date, callback: NoParamCallback): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace utimes {
        /**
         * Asynchronously change file timestamps of the file referenced by the supplied path.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * @param atime The last access time. If a string is provided, it will be coerced to number.
         * @param mtime The last modified time. If a string is provided, it will be coerced to number.
         */
        function __promisify__(path: PathLike, atime: string | number | Date, mtime: string | number | Date): Promise<void>;
    }

    /**
     * Synchronously change file timestamps of the file referenced by the supplied path.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * @param atime The last access time. If a string is provided, it will be coerced to number.
     * @param mtime The last modified time. If a string is provided, it will be coerced to number.
     */
    export function utimesSync(path: PathLike, atime: string | number | Date, mtime: string | number | Date): void;

    /**
     * Asynchronously change file timestamps of the file referenced by the supplied file descriptor.
     * @param fd A file descriptor.
     * @param atime The last access time. If a string is provided, it will be coerced to number.
     * @param mtime The last modified time. If a string is provided, it will be coerced to number.
     */
    export function futimes(fd: number, atime: string | number | Date, mtime: string | number | Date, callback: NoParamCallback): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace futimes {
        /**
         * Asynchronously change file timestamps of the file referenced by the supplied file descriptor.
         * @param fd A file descriptor.
         * @param atime The last access time. If a string is provided, it will be coerced to number.
         * @param mtime The last modified time. If a string is provided, it will be coerced to number.
         */
        function __promisify__(fd: number, atime: string | number | Date, mtime: string | number | Date): Promise<void>;
    }

    /**
     * Synchronously change file timestamps of the file referenced by the supplied file descriptor.
     * @param fd A file descriptor.
     * @param atime The last access time. If a string is provided, it will be coerced to number.
     * @param mtime The last modified time. If a string is provided, it will be coerced to number.
     */
    export function futimesSync(fd: number, atime: string | number | Date, mtime: string | number | Date): void;

    /**
     * Asynchronous fsync(2) - synchronize a file's in-core state with the underlying storage device.
     * @param fd A file descriptor.
     */
    export function fsync(fd: number, callback: NoParamCallback): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace fsync {
        /**
         * Asynchronous fsync(2) - synchronize a file's in-core state with the underlying storage device.
         * @param fd A file descriptor.
         */
        function __promisify__(fd: number): Promise<void>;
    }

    /**
     * Synchronous fsync(2) - synchronize a file's in-core state with the underlying storage device.
     * @param fd A file descriptor.
     */
    export function fsyncSync(fd: number): void;

    /**
     * Asynchronously writes \`buffer\` to the file referenced by the supplied file descriptor.
     * @param fd A file descriptor.
     * @param offset The part of the buffer to be written. If not supplied, defaults to \`0\`.
     * @param length The number of bytes to write. If not supplied, defaults to \`buffer.length - offset\`.
     * @param position The offset from the beginning of the file where this data should be written. If not supplied, defaults to the current position.
     */
    export function write<TBuffer extends NodeJS.ArrayBufferView>(
        fd: number,
        buffer: TBuffer,
        offset: number | undefined | null,
        length: number | undefined | null,
        position: number | undefined | null,
        callback: (err: NodeJS.ErrnoException | null, written: number, buffer: TBuffer) => void,
    ): void;

    /**
     * Asynchronously writes \`buffer\` to the file referenced by the supplied file descriptor.
     * @param fd A file descriptor.
     * @param offset The part of the buffer to be written. If not supplied, defaults to \`0\`.
     * @param length The number of bytes to write. If not supplied, defaults to \`buffer.length - offset\`.
     */
    export function write<TBuffer extends NodeJS.ArrayBufferView>(
        fd: number,
        buffer: TBuffer,
        offset: number | undefined | null,
        length: number | undefined | null,
        callback: (err: NodeJS.ErrnoException | null, written: number, buffer: TBuffer) => void,
    ): void;

    /**
     * Asynchronously writes \`buffer\` to the file referenced by the supplied file descriptor.
     * @param fd A file descriptor.
     * @param offset The part of the buffer to be written. If not supplied, defaults to \`0\`.
     */
    export function write<TBuffer extends NodeJS.ArrayBufferView>(
        fd: number,
        buffer: TBuffer,
        offset: number | undefined | null,
        callback: (err: NodeJS.ErrnoException | null, written: number, buffer: TBuffer) => void
    ): void;

    /**
     * Asynchronously writes \`buffer\` to the file referenced by the supplied file descriptor.
     * @param fd A file descriptor.
     */
    export function write<TBuffer extends NodeJS.ArrayBufferView>(fd: number, buffer: TBuffer, callback: (err: NodeJS.ErrnoException | null, written: number, buffer: TBuffer) => void): void;

    /**
     * Asynchronously writes \`string\` to the file referenced by the supplied file descriptor.
     * @param fd A file descriptor.
     * @param string A string to write.
     * @param position The offset from the beginning of the file where this data should be written. If not supplied, defaults to the current position.
     * @param encoding The expected string encoding.
     */
    export function write(
        fd: number,
        string: string,
        position: number | undefined | null,
        encoding: BufferEncoding | undefined | null,
        callback: (err: NodeJS.ErrnoException | null, written: number, str: string) => void,
    ): void;

    /**
     * Asynchronously writes \`string\` to the file referenced by the supplied file descriptor.
     * @param fd A file descriptor.
     * @param string A string to write.
     * @param position The offset from the beginning of the file where this data should be written. If not supplied, defaults to the current position.
     */
    export function write(fd: number, string: string, position: number | undefined | null, callback: (err: NodeJS.ErrnoException | null, written: number, str: string) => void): void;

    /**
     * Asynchronously writes \`string\` to the file referenced by the supplied file descriptor.
     * @param fd A file descriptor.
     * @param string A string to write.
     */
    export function write(fd: number, string: string, callback: (err: NodeJS.ErrnoException | null, written: number, str: string) => void): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace write {
        /**
         * Asynchronously writes \`buffer\` to the file referenced by the supplied file descriptor.
         * @param fd A file descriptor.
         * @param offset The part of the buffer to be written. If not supplied, defaults to \`0\`.
         * @param length The number of bytes to write. If not supplied, defaults to \`buffer.length - offset\`.
         * @param position The offset from the beginning of the file where this data should be written. If not supplied, defaults to the current position.
         */
        function __promisify__<TBuffer extends NodeJS.ArrayBufferView>(
            fd: number,
            buffer?: TBuffer,
            offset?: number,
            length?: number,
            position?: number | null,
        ): Promise<{ bytesWritten: number, buffer: TBuffer }>;

        /**
         * Asynchronously writes \`string\` to the file referenced by the supplied file descriptor.
         * @param fd A file descriptor.
         * @param string A string to write.
         * @param position The offset from the beginning of the file where this data should be written. If not supplied, defaults to the current position.
         * @param encoding The expected string encoding.
         */
        function __promisify__(fd: number, string: string, position?: number | null, encoding?: BufferEncoding | null): Promise<{ bytesWritten: number, buffer: string }>;
    }

    /**
     * Synchronously writes \`buffer\` to the file referenced by the supplied file descriptor, returning the number of bytes written.
     * @param fd A file descriptor.
     * @param offset The part of the buffer to be written. If not supplied, defaults to \`0\`.
     * @param length The number of bytes to write. If not supplied, defaults to \`buffer.length - offset\`.
     * @param position The offset from the beginning of the file where this data should be written. If not supplied, defaults to the current position.
     */
    export function writeSync(fd: number, buffer: NodeJS.ArrayBufferView, offset?: number | null, length?: number | null, position?: number | null): number;

    /**
     * Synchronously writes \`string\` to the file referenced by the supplied file descriptor, returning the number of bytes written.
     * @param fd A file descriptor.
     * @param string A string to write.
     * @param position The offset from the beginning of the file where this data should be written. If not supplied, defaults to the current position.
     * @param encoding The expected string encoding.
     */
    export function writeSync(fd: number, string: string, position?: number | null, encoding?: BufferEncoding | null): number;

    /**
     * Asynchronously reads data from the file referenced by the supplied file descriptor.
     * @param fd A file descriptor.
     * @param buffer The buffer that the data will be written to.
     * @param offset The offset in the buffer at which to start writing.
     * @param length The number of bytes to read.
     * @param position The offset from the beginning of the file from which data should be read. If \`null\`, data will be read from the current position.
     */
    export function read<TBuffer extends NodeJS.ArrayBufferView>(
        fd: number,
        buffer: TBuffer,
        offset: number,
        length: number,
        position: number | null,
        callback: (err: NodeJS.ErrnoException | null, bytesRead: number, buffer: TBuffer) => void,
    ): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace read {
        /**
         * @param fd A file descriptor.
         * @param buffer The buffer that the data will be written to.
         * @param offset The offset in the buffer at which to start writing.
         * @param length The number of bytes to read.
         * @param position The offset from the beginning of the file from which data should be read. If \`null\`, data will be read from the current position.
         */
        function __promisify__<TBuffer extends NodeJS.ArrayBufferView>(
            fd: number,
            buffer: TBuffer,
            offset: number,
            length: number,
            position: number | null
        ): Promise<{ bytesRead: number, buffer: TBuffer }>;
    }

    export interface ReadSyncOptions {
        /**
         * @default 0
         */
        offset?: number | undefined;
        /**
         * @default \`length of buffer\`
         */
        length?: number | undefined;
        /**
         * @default null
         */
        position?: number | null | undefined;
    }

    /**
     * Synchronously reads data from the file referenced by the supplied file descriptor, returning the number of bytes read.
     * @param fd A file descriptor.
     * @param buffer The buffer that the data will be written to.
     * @param offset The offset in the buffer at which to start writing.
     * @param length The number of bytes to read.
     * @param position The offset from the beginning of the file from which data should be read. If \`null\`, data will be read from the current position.
     */
    export function readSync(fd: number, buffer: NodeJS.ArrayBufferView, offset: number, length: number, position: number | null): number;

    /**
     * Similar to the above \`fs.readSync\` function, this version takes an optional \`options\` object.
     * If no \`options\` object is specified, it will default with the above values.
     */
    export function readSync(fd: number, buffer: NodeJS.ArrayBufferView, opts?: ReadSyncOptions): number;

    /**
     * Asynchronously reads the entire contents of a file.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     * @param options An object that may contain an optional flag.
     * If a flag is not provided, it defaults to \`'r'\`.
     */
    export function readFile(
        path: PathLike | number,
        options: { encoding?: null | undefined; flag?: string | undefined; } | undefined | null,
        callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void
    ): void;

    /**
     * Asynchronously reads the entire contents of a file.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     * @param options Either the encoding for the result, or an object that contains the encoding and an optional flag.
     * If a flag is not provided, it defaults to \`'r'\`.
     */
    export function readFile(
        path: PathLike | number,
        options: { encoding: BufferEncoding; flag?: string | undefined; } | BufferEncoding,
        callback: (err: NodeJS.ErrnoException | null, data: string) => void
    ): void;

    /**
     * Asynchronously reads the entire contents of a file.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     * @param options Either the encoding for the result, or an object that contains the encoding and an optional flag.
     * If a flag is not provided, it defaults to \`'r'\`.
     */
    export function readFile(
        path: PathLike | number,
        options: BaseEncodingOptions & { flag?: string | undefined; } | BufferEncoding | undefined | null,
        callback: (err: NodeJS.ErrnoException | null, data: string | Buffer) => void,
    ): void;

    /**
     * Asynchronously reads the entire contents of a file.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     */
    export function readFile(path: PathLike | number, callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace readFile {
        /**
         * Asynchronously reads the entire contents of a file.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
         * @param options An object that may contain an optional flag.
         * If a flag is not provided, it defaults to \`'r'\`.
         */
        function __promisify__(path: PathLike | number, options?: { encoding?: null | undefined; flag?: string | undefined; } | null): Promise<Buffer>;

        /**
         * Asynchronously reads the entire contents of a file.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * URL support is _experimental_.
         * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
         * @param options Either the encoding for the result, or an object that contains the encoding and an optional flag.
         * If a flag is not provided, it defaults to \`'r'\`.
         */
        function __promisify__(path: PathLike | number, options: { encoding: BufferEncoding; flag?: string | undefined; } | BufferEncoding): Promise<string>;

        /**
         * Asynchronously reads the entire contents of a file.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * URL support is _experimental_.
         * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
         * @param options Either the encoding for the result, or an object that contains the encoding and an optional flag.
         * If a flag is not provided, it defaults to \`'r'\`.
         */
        function __promisify__(path: PathLike | number, options?: BaseEncodingOptions & { flag?: string | undefined; } | BufferEncoding | null): Promise<string | Buffer>;
    }

    /**
     * Synchronously reads the entire contents of a file.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     * @param options An object that may contain an optional flag. If a flag is not provided, it defaults to \`'r'\`.
     */
    export function readFileSync(path: PathLike | number, options?: { encoding?: null | undefined; flag?: string | undefined; } | null): Buffer;

    /**
     * Synchronously reads the entire contents of a file.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     * @param options Either the encoding for the result, or an object that contains the encoding and an optional flag.
     * If a flag is not provided, it defaults to \`'r'\`.
     */
    export function readFileSync(path: PathLike | number, options: { encoding: BufferEncoding; flag?: string | undefined; } | BufferEncoding): string;

    /**
     * Synchronously reads the entire contents of a file.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     * @param options Either the encoding for the result, or an object that contains the encoding and an optional flag.
     * If a flag is not provided, it defaults to \`'r'\`.
     */
    export function readFileSync(path: PathLike | number, options?: BaseEncodingOptions & { flag?: string | undefined; } | BufferEncoding | null): string | Buffer;

    export type WriteFileOptions = BaseEncodingOptions & { mode?: Mode | undefined; flag?: string | undefined; } | BufferEncoding | null;

    /**
     * Asynchronously writes data to a file, replacing the file if it already exists.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     * @param data The data to write. If something other than a Buffer or Uint8Array is provided, the value is coerced to a string.
     * @param options Either the encoding for the file, or an object optionally specifying the encoding, file mode, and flag.
     * If \`encoding\` is not supplied, the default of \`'utf8'\` is used.
     * If \`mode\` is not supplied, the default of \`0o666\` is used.
     * If \`mode\` is a string, it is parsed as an octal integer.
     * If \`flag\` is not supplied, the default of \`'w'\` is used.
     */
    export function writeFile(path: PathLike | number, data: string | NodeJS.ArrayBufferView, options: WriteFileOptions, callback: NoParamCallback): void;

    /**
     * Asynchronously writes data to a file, replacing the file if it already exists.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     * @param data The data to write. If something other than a Buffer or Uint8Array is provided, the value is coerced to a string.
     */
    export function writeFile(path: PathLike | number, data: string | NodeJS.ArrayBufferView, callback: NoParamCallback): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace writeFile {
        /**
         * Asynchronously writes data to a file, replacing the file if it already exists.
         * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * URL support is _experimental_.
         * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
         * @param data The data to write. If something other than a Buffer or Uint8Array is provided, the value is coerced to a string.
         * @param options Either the encoding for the file, or an object optionally specifying the encoding, file mode, and flag.
         * If \`encoding\` is not supplied, the default of \`'utf8'\` is used.
         * If \`mode\` is not supplied, the default of \`0o666\` is used.
         * If \`mode\` is a string, it is parsed as an octal integer.
         * If \`flag\` is not supplied, the default of \`'w'\` is used.
         */
        function __promisify__(path: PathLike | number, data: string | NodeJS.ArrayBufferView, options?: WriteFileOptions): Promise<void>;
    }

    /**
     * Synchronously writes data to a file, replacing the file if it already exists.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     * @param data The data to write. If something other than a Buffer or Uint8Array is provided, the value is coerced to a string.
     * @param options Either the encoding for the file, or an object optionally specifying the encoding, file mode, and flag.
     * If \`encoding\` is not supplied, the default of \`'utf8'\` is used.
     * If \`mode\` is not supplied, the default of \`0o666\` is used.
     * If \`mode\` is a string, it is parsed as an octal integer.
     * If \`flag\` is not supplied, the default of \`'w'\` is used.
     */
    export function writeFileSync(path: PathLike | number, data: string | NodeJS.ArrayBufferView, options?: WriteFileOptions): void;

    /**
     * Asynchronously append data to a file, creating the file if it does not exist.
     * @param file A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     * @param data The data to write. If something other than a Buffer or Uint8Array is provided, the value is coerced to a string.
     * @param options Either the encoding for the file, or an object optionally specifying the encoding, file mode, and flag.
     * If \`encoding\` is not supplied, the default of \`'utf8'\` is used.
     * If \`mode\` is not supplied, the default of \`0o666\` is used.
     * If \`mode\` is a string, it is parsed as an octal integer.
     * If \`flag\` is not supplied, the default of \`'a'\` is used.
     */
    export function appendFile(file: PathLike | number, data: string | Uint8Array, options: WriteFileOptions, callback: NoParamCallback): void;

    /**
     * Asynchronously append data to a file, creating the file if it does not exist.
     * @param file A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     * @param data The data to write. If something other than a Buffer or Uint8Array is provided, the value is coerced to a string.
     */
    export function appendFile(file: PathLike | number, data: string | Uint8Array, callback: NoParamCallback): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace appendFile {
        /**
         * Asynchronously append data to a file, creating the file if it does not exist.
         * @param file A path to a file. If a URL is provided, it must use the \`file:\` protocol.
         * URL support is _experimental_.
         * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
         * @param data The data to write. If something other than a Buffer or Uint8Array is provided, the value is coerced to a string.
         * @param options Either the encoding for the file, or an object optionally specifying the encoding, file mode, and flag.
         * If \`encoding\` is not supplied, the default of \`'utf8'\` is used.
         * If \`mode\` is not supplied, the default of \`0o666\` is used.
         * If \`mode\` is a string, it is parsed as an octal integer.
         * If \`flag\` is not supplied, the default of \`'a'\` is used.
         */
        function __promisify__(file: PathLike | number, data: string | Uint8Array, options?: WriteFileOptions): Promise<void>;
    }

    /**
     * Synchronously append data to a file, creating the file if it does not exist.
     * @param file A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
     * @param data The data to write. If something other than a Buffer or Uint8Array is provided, the value is coerced to a string.
     * @param options Either the encoding for the file, or an object optionally specifying the encoding, file mode, and flag.
     * If \`encoding\` is not supplied, the default of \`'utf8'\` is used.
     * If \`mode\` is not supplied, the default of \`0o666\` is used.
     * If \`mode\` is a string, it is parsed as an octal integer.
     * If \`flag\` is not supplied, the default of \`'a'\` is used.
     */
    export function appendFileSync(file: PathLike | number, data: string | Uint8Array, options?: WriteFileOptions): void;

    /**
     * Watch for changes on \`filename\`. The callback \`listener\` will be called each time the file is accessed.
     */
    export function watchFile(filename: PathLike, options: { persistent?: boolean | undefined; interval?: number | undefined; } | undefined, listener: (curr: Stats, prev: Stats) => void): void;

    /**
     * Watch for changes on \`filename\`. The callback \`listener\` will be called each time the file is accessed.
     * @param filename A path to a file or directory. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     */
    export function watchFile(filename: PathLike, listener: (curr: Stats, prev: Stats) => void): void;

    /**
     * Stop watching for changes on \`filename\`.
     * @param filename A path to a file or directory. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     */
    export function unwatchFile(filename: PathLike, listener?: (curr: Stats, prev: Stats) => void): void;

    /**
     * Watch for changes on \`filename\`, where \`filename\` is either a file or a directory, returning an \`FSWatcher\`.
     * @param filename A path to a file or directory. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     * @param options Either the encoding for the filename provided to the listener, or an object optionally specifying encoding, persistent, and recursive options.
     * If \`encoding\` is not supplied, the default of \`'utf8'\` is used.
     * If \`persistent\` is not supplied, the default of \`true\` is used.
     * If \`recursive\` is not supplied, the default of \`false\` is used.
     */
    export function watch(
        filename: PathLike,
        options: { encoding?: BufferEncoding | null | undefined, persistent?: boolean | undefined, recursive?: boolean | undefined } | BufferEncoding | undefined | null,
        listener?: (event: "rename" | "change", filename: string) => void,
    ): FSWatcher;

    /**
     * Watch for changes on \`filename\`, where \`filename\` is either a file or a directory, returning an \`FSWatcher\`.
     * @param filename A path to a file or directory. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     * @param options Either the encoding for the filename provided to the listener, or an object optionally specifying encoding, persistent, and recursive options.
     * If \`encoding\` is not supplied, the default of \`'utf8'\` is used.
     * If \`persistent\` is not supplied, the default of \`true\` is used.
     * If \`recursive\` is not supplied, the default of \`false\` is used.
     */
    export function watch(
        filename: PathLike,
        options: { encoding: "buffer", persistent?: boolean | undefined, recursive?: boolean | undefined; } | "buffer",
        listener?: (event: "rename" | "change", filename: Buffer) => void
    ): FSWatcher;

    /**
     * Watch for changes on \`filename\`, where \`filename\` is either a file or a directory, returning an \`FSWatcher\`.
     * @param filename A path to a file or directory. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     * @param options Either the encoding for the filename provided to the listener, or an object optionally specifying encoding, persistent, and recursive options.
     * If \`encoding\` is not supplied, the default of \`'utf8'\` is used.
     * If \`persistent\` is not supplied, the default of \`true\` is used.
     * If \`recursive\` is not supplied, the default of \`false\` is used.
     */
    export function watch(
        filename: PathLike,
        options: { encoding?: BufferEncoding | null | undefined, persistent?: boolean | undefined, recursive?: boolean | undefined } | string | null,
        listener?: (event: "rename" | "change", filename: string | Buffer) => void,
    ): FSWatcher;

    /**
     * Watch for changes on \`filename\`, where \`filename\` is either a file or a directory, returning an \`FSWatcher\`.
     * @param filename A path to a file or directory. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     */
    export function watch(filename: PathLike, listener?: (event: "rename" | "change", filename: string) => any): FSWatcher;

    /**
     * Asynchronously tests whether or not the given path exists by checking with the file system.
     * @deprecated since v1.0.0 Use \`fs.stat()\` or \`fs.access()\` instead
     * @param path A path to a file or directory. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     */
    export function exists(path: PathLike, callback: (exists: boolean) => void): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace exists {
        /**
         * @param path A path to a file or directory. If a URL is provided, it must use the \`file:\` protocol.
         * URL support is _experimental_.
         */
        function __promisify__(path: PathLike): Promise<boolean>;
    }

    /**
     * Synchronously tests whether or not the given path exists by checking with the file system.
     * @param path A path to a file or directory. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     */
    export function existsSync(path: PathLike): boolean;

    export namespace constants {
        \/\/ File Access Constants

        /** Constant for fs.access(). File is visible to the calling process. */
        const F_OK: number;

        /** Constant for fs.access(). File can be read by the calling process. */
        const R_OK: number;

        /** Constant for fs.access(). File can be written by the calling process. */
        const W_OK: number;

        /** Constant for fs.access(). File can be executed by the calling process. */
        const X_OK: number;

        \/\/ File Copy Constants

        /** Constant for fs.copyFile. Flag indicating the destination file should not be overwritten if it already exists. */
        const COPYFILE_EXCL: number;

        /**
         * Constant for fs.copyFile. copy operation will attempt to create a copy-on-write reflink.
         * If the underlying platform does not support copy-on-write, then a fallback copy mechanism is used.
         */
        const COPYFILE_FICLONE: number;

        /**
         * Constant for fs.copyFile. Copy operation will attempt to create a copy-on-write reflink.
         * If the underlying platform does not support copy-on-write, then the operation will fail with an error.
         */
        const COPYFILE_FICLONE_FORCE: number;

        \/\/ File Open Constants

        /** Constant for fs.open(). Flag indicating to open a file for read-only access. */
        const O_RDONLY: number;

        /** Constant for fs.open(). Flag indicating to open a file for write-only access. */
        const O_WRONLY: number;

        /** Constant for fs.open(). Flag indicating to open a file for read-write access. */
        const O_RDWR: number;

        /** Constant for fs.open(). Flag indicating to create the file if it does not already exist. */
        const O_CREAT: number;

        /** Constant for fs.open(). Flag indicating that opening a file should fail if the O_CREAT flag is set and the file already exists. */
        const O_EXCL: number;

        /**
         * Constant for fs.open(). Flag indicating that if path identifies a terminal device,
         * opening the path shall not cause that terminal to become the controlling terminal for the process
         * (if the process does not already have one).
         */
        const O_NOCTTY: number;

        /** Constant for fs.open(). Flag indicating that if the file exists and is a regular file, and the file is opened successfully for write access, its length shall be truncated to zero. */
        const O_TRUNC: number;

        /** Constant for fs.open(). Flag indicating that data will be appended to the end of the file. */
        const O_APPEND: number;

        /** Constant for fs.open(). Flag indicating that the open should fail if the path is not a directory. */
        const O_DIRECTORY: number;

        /**
         * constant for fs.open().
         * Flag indicating reading accesses to the file system will no longer result in
         * an update to the atime information associated with the file.
         * This flag is available on Linux operating systems only.
         */
        const O_NOATIME: number;

        /** Constant for fs.open(). Flag indicating that the open should fail if the path is a symbolic link. */
        const O_NOFOLLOW: number;

        /** Constant for fs.open(). Flag indicating that the file is opened for synchronous I/O. */
        const O_SYNC: number;

        /** Constant for fs.open(). Flag indicating that the file is opened for synchronous I/O with write operations waiting for data integrity. */
        const O_DSYNC: number;

        /** Constant for fs.open(). Flag indicating to open the symbolic link itself rather than the resource it is pointing to. */
        const O_SYMLINK: number;

        /** Constant for fs.open(). When set, an attempt will be made to minimize caching effects of file I/O. */
        const O_DIRECT: number;

        /** Constant for fs.open(). Flag indicating to open the file in nonblocking mode when possible. */
        const O_NONBLOCK: number;

        \/\/ File Type Constants

        /** Constant for fs.Stats mode property for determining a file's type. Bit mask used to extract the file type code. */
        const S_IFMT: number;

        /** Constant for fs.Stats mode property for determining a file's type. File type constant for a regular file. */
        const S_IFREG: number;

        /** Constant for fs.Stats mode property for determining a file's type. File type constant for a directory. */
        const S_IFDIR: number;

        /** Constant for fs.Stats mode property for determining a file's type. File type constant for a character-oriented device file. */
        const S_IFCHR: number;

        /** Constant for fs.Stats mode property for determining a file's type. File type constant for a block-oriented device file. */
        const S_IFBLK: number;

        /** Constant for fs.Stats mode property for determining a file's type. File type constant for a FIFO/pipe. */
        const S_IFIFO: number;

        /** Constant for fs.Stats mode property for determining a file's type. File type constant for a symbolic link. */
        const S_IFLNK: number;

        /** Constant for fs.Stats mode property for determining a file's type. File type constant for a socket. */
        const S_IFSOCK: number;

        \/\/ File Mode Constants

        /** Constant for fs.Stats mode property for determining access permissions for a file. File mode indicating readable, writable and executable by owner. */
        const S_IRWXU: number;

        /** Constant for fs.Stats mode property for determining access permissions for a file. File mode indicating readable by owner. */
        const S_IRUSR: number;

        /** Constant for fs.Stats mode property for determining access permissions for a file. File mode indicating writable by owner. */
        const S_IWUSR: number;

        /** Constant for fs.Stats mode property for determining access permissions for a file. File mode indicating executable by owner. */
        const S_IXUSR: number;

        /** Constant for fs.Stats mode property for determining access permissions for a file. File mode indicating readable, writable and executable by group. */
        const S_IRWXG: number;

        /** Constant for fs.Stats mode property for determining access permissions for a file. File mode indicating readable by group. */
        const S_IRGRP: number;

        /** Constant for fs.Stats mode property for determining access permissions for a file. File mode indicating writable by group. */
        const S_IWGRP: number;

        /** Constant for fs.Stats mode property for determining access permissions for a file. File mode indicating executable by group. */
        const S_IXGRP: number;

        /** Constant for fs.Stats mode property for determining access permissions for a file. File mode indicating readable, writable and executable by others. */
        const S_IRWXO: number;

        /** Constant for fs.Stats mode property for determining access permissions for a file. File mode indicating readable by others. */
        const S_IROTH: number;

        /** Constant for fs.Stats mode property for determining access permissions for a file. File mode indicating writable by others. */
        const S_IWOTH: number;

        /** Constant for fs.Stats mode property for determining access permissions for a file. File mode indicating executable by others. */
        const S_IXOTH: number;

        /**
         * When set, a memory file mapping is used to access the file. This flag
         * is available on Windows operating systems only. On other operating systems,
         * this flag is ignored.
         */
        const UV_FS_O_FILEMAP: number;
    }

    /**
     * Asynchronously tests a user's permissions for the file specified by path.
     * @param path A path to a file or directory. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     */
    export function access(path: PathLike, mode: number | undefined, callback: NoParamCallback): void;

    /**
     * Asynchronously tests a user's permissions for the file specified by path.
     * @param path A path to a file or directory. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     */
    export function access(path: PathLike, callback: NoParamCallback): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace access {
        /**
         * Asynchronously tests a user's permissions for the file specified by path.
         * @param path A path to a file or directory. If a URL is provided, it must use the \`file:\` protocol.
         * URL support is _experimental_.
         */
        function __promisify__(path: PathLike, mode?: number): Promise<void>;
    }

    /**
     * Synchronously tests a user's permissions for the file specified by path.
     * @param path A path to a file or directory. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     */
    export function accessSync(path: PathLike, mode?: number): void;

    /**
     * Returns a new \`ReadStream\` object.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     */
    export function createReadStream(path: PathLike, options?: BufferEncoding | {
        flags?: string | undefined;
        encoding?: BufferEncoding | undefined;
        fd?: number | undefined;
        mode?: number | undefined;
        autoClose?: boolean | undefined;
        /**
         * @default false
         */
        emitClose?: boolean | undefined;
        start?: number | undefined;
        end?: number | undefined;
        highWaterMark?: number | undefined;
    }): ReadStream;

    /**
     * Returns a new \`WriteStream\` object.
     * @param path A path to a file. If a URL is provided, it must use the \`file:\` protocol.
     * URL support is _experimental_.
     */
    export function createWriteStream(path: PathLike, options?: BufferEncoding | {
        flags?: string | undefined;
        encoding?: BufferEncoding | undefined;
        fd?: number | undefined;
        mode?: number | undefined;
        autoClose?: boolean | undefined;
        emitClose?: boolean | undefined;
        start?: number | undefined;
        highWaterMark?: number | undefined;
    }): WriteStream;

    /**
     * Asynchronous fdatasync(2) - synchronize a file's in-core state with storage device.
     * @param fd A file descriptor.
     */
    export function fdatasync(fd: number, callback: NoParamCallback): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace fdatasync {
        /**
         * Asynchronous fdatasync(2) - synchronize a file's in-core state with storage device.
         * @param fd A file descriptor.
         */
        function __promisify__(fd: number): Promise<void>;
    }

    /**
     * Synchronous fdatasync(2) - synchronize a file's in-core state with storage device.
     * @param fd A file descriptor.
     */
    export function fdatasyncSync(fd: number): void;

    /**
     * Asynchronously copies src to dest. By default, dest is overwritten if it already exists.
     * No arguments other than a possible exception are given to the callback function.
     * Node.js makes no guarantees about the atomicity of the copy operation.
     * If an error occurs after the destination file has been opened for writing, Node.js will attempt
     * to remove the destination.
     * @param src A path to the source file.
     * @param dest A path to the destination file.
     */
    export function copyFile(src: PathLike, dest: PathLike, callback: NoParamCallback): void;
    /**
     * Asynchronously copies src to dest. By default, dest is overwritten if it already exists.
     * No arguments other than a possible exception are given to the callback function.
     * Node.js makes no guarantees about the atomicity of the copy operation.
     * If an error occurs after the destination file has been opened for writing, Node.js will attempt
     * to remove the destination.
     * @param src A path to the source file.
     * @param dest A path to the destination file.
     * @param flags An integer that specifies the behavior of the copy operation. The only supported flag is fs.constants.COPYFILE_EXCL, which causes the copy operation to fail if dest already exists.
     */
    export function copyFile(src: PathLike, dest: PathLike, flags: number, callback: NoParamCallback): void;

    \/\/ NOTE: This namespace provides design-time support for util.promisify. Exported members do not exist at runtime.
    export namespace copyFile {
        /**
         * Asynchronously copies src to dest. By default, dest is overwritten if it already exists.
         * No arguments other than a possible exception are given to the callback function.
         * Node.js makes no guarantees about the atomicity of the copy operation.
         * If an error occurs after the destination file has been opened for writing, Node.js will attempt
         * to remove the destination.
         * @param src A path to the source file.
         * @param dest A path to the destination file.
         * @param flags An optional integer that specifies the behavior of the copy operation.
         * The only supported flag is fs.constants.COPYFILE_EXCL,
         * which causes the copy operation to fail if dest already exists.
         */
        function __promisify__(src: PathLike, dst: PathLike, flags?: number): Promise<void>;
    }

    /**
     * Synchronously copies src to dest. By default, dest is overwritten if it already exists.
     * Node.js makes no guarantees about the atomicity of the copy operation.
     * If an error occurs after the destination file has been opened for writing, Node.js will attempt
     * to remove the destination.
     * @param src A path to the source file.
     * @param dest A path to the destination file.
     * @param flags An optional integer that specifies the behavior of the copy operation.
     * The only supported flag is fs.constants.COPYFILE_EXCL, which causes the copy operation to fail if dest already exists.
     */
    export function copyFileSync(src: PathLike, dest: PathLike, flags?: number): void;

    /**
     * Write an array of ArrayBufferViews to the file specified by fd using writev().
     * position is the offset from the beginning of the file where this data should be written.
     * It is unsafe to use fs.writev() multiple times on the same file without waiting for the callback. For this scenario, use fs.createWriteStream().
     * On Linux, positional writes don't work when the file is opened in append mode.
     * The kernel ignores the position argument and always appends the data to the end of the file.
     */
    export function writev(
        fd: number,
        buffers: ReadonlyArray<NodeJS.ArrayBufferView>,
        cb: (err: NodeJS.ErrnoException | null, bytesWritten: number, buffers: NodeJS.ArrayBufferView[]) => void
    ): void;
    export function writev(
        fd: number,
        buffers: ReadonlyArray<NodeJS.ArrayBufferView>,
        position: number,
        cb: (err: NodeJS.ErrnoException | null, bytesWritten: number, buffers: NodeJS.ArrayBufferView[]) => void
    ): void;

    export interface WriteVResult {
        bytesWritten: number;
        buffers: NodeJS.ArrayBufferView[];
    }

    export namespace writev {
        function __promisify__(fd: number, buffers: ReadonlyArray<NodeJS.ArrayBufferView>, position?: number): Promise<WriteVResult>;
    }

    /**
     * See \`writev\`.
     */
    export function writevSync(fd: number, buffers: ReadonlyArray<NodeJS.ArrayBufferView>, position?: number): number;

    export function readv(
        fd: number,
        buffers: ReadonlyArray<NodeJS.ArrayBufferView>,
        cb: (err: NodeJS.ErrnoException | null, bytesRead: number, buffers: NodeJS.ArrayBufferView[]) => void
    ): void;
    export function readv(
        fd: number,
        buffers: ReadonlyArray<NodeJS.ArrayBufferView>,
        position: number,
        cb: (err: NodeJS.ErrnoException | null, bytesRead: number, buffers: NodeJS.ArrayBufferView[]) => void
    ): void;

    export interface ReadVResult {
        bytesRead: number;
        buffers: NodeJS.ArrayBufferView[];
    }

    export namespace readv {
        function __promisify__(fd: number, buffers: ReadonlyArray<NodeJS.ArrayBufferView>, position?: number): Promise<ReadVResult>;
    }

    /**
     * See \`readv\`.
     */
    export function readvSync(fd: number, buffers: ReadonlyArray<NodeJS.ArrayBufferView>, position?: number): number;

    export interface OpenDirOptions {
        encoding?: BufferEncoding | undefined;
        /**
         * Number of directory entries that are buffered
         * internally when reading from the directory. Higher values lead to better
         * performance but higher memory usage.
         * @default 32
         */
        bufferSize?: number | undefined;
    }

    export function opendirSync(path: string, options?: OpenDirOptions): Dir;

    export function opendir(path: string, cb: (err: NodeJS.ErrnoException | null, dir: Dir) => void): void;
    export function opendir(path: string, options: OpenDirOptions, cb: (err: NodeJS.ErrnoException | null, dir: Dir) => void): void;

    export namespace opendir {
        function __promisify__(path: string, options?: OpenDirOptions): Promise<Dir>;
    }

    export interface BigIntStats extends StatsBase<bigint> {
    }

    export class BigIntStats {
        atimeNs: bigint;
        mtimeNs: bigint;
        ctimeNs: bigint;
        birthtimeNs: bigint;
    }

    export interface BigIntOptions {
        bigint: true;
    }

    export interface StatOptions {
        bigint?: boolean | undefined;
    }
}
`;
definitions['globals.d.ts'] = `\/\/ Declare "static" methods in Error
interface ErrorConstructor {
    /** Create .stack property on a target object */
    captureStackTrace(targetObject: object, constructorOpt?: Function): void;

    /**
     * Optional override for formatting stack traces
     *
     * @see https:\/\/v8.dev/docs/stack-trace-api#customizing-stack-traces
     */
    prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;

    stackTraceLimit: number;
}

\/\/ Node.js ESNEXT support
interface String {
    /** Removes whitespace from the left end of a string. */
    trimLeft(): string;
    /** Removes whitespace from the right end of a string. */
    trimRight(): string;

    /** Returns a copy with leading whitespace removed. */
    trimStart(): string;
    /** Returns a copy with trailing whitespace removed. */
    trimEnd(): string;
}

interface ImportMeta {
    url: string;
}

/*-----------------------------------------------*
 *                                               *
 *                   GLOBAL                      *
 *                                               *
 ------------------------------------------------*/

\/\/ For backwards compability
interface NodeRequire extends NodeJS.Require {}
interface RequireResolve extends NodeJS.RequireResolve {}
interface NodeModule extends NodeJS.Module {}

declare var process: NodeJS.Process;
declare var console: Console;

declare var __filename: string;
declare var __dirname: string;

declare function setTimeout(callback: (...args: any[]) => void, ms?: number, ...args: any[]): NodeJS.Timeout;
declare namespace setTimeout {
    function __promisify__(ms: number): Promise<void>;
    function __promisify__<T>(ms: number, value: T): Promise<T>;
}
declare function clearTimeout(timeoutId: NodeJS.Timeout): void;
declare function setInterval(callback: (...args: any[]) => void, ms?: number, ...args: any[]): NodeJS.Timeout;
declare function clearInterval(intervalId: NodeJS.Timeout): void;
declare function setImmediate(callback: (...args: any[]) => void, ...args: any[]): NodeJS.Immediate;
declare namespace setImmediate {
    function __promisify__(): Promise<void>;
    function __promisify__<T>(value: T): Promise<T>;
}
declare function clearImmediate(immediateId: NodeJS.Immediate): void;

declare function queueMicrotask(callback: () => void): void;

declare var require: NodeRequire;
declare var module: NodeModule;

\/\/ Same as module.exports
declare var exports: any;

\/\/ Buffer class
type BufferEncoding = "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "base64url" | "latin1" | "binary" | "hex";

type WithImplicitCoercion<T> = T | { valueOf(): T };

/**
 * Raw data is stored in instances of the Buffer class.
 * A Buffer is similar to an array of integers but corresponds to a raw memory allocation outside the V8 heap.  A Buffer cannot be resized.
 * Valid string encodings: 'ascii'|'utf8'|'utf16le'|'ucs2'(alias of 'utf16le')|'base64'|'base64url'|'binary'(deprecated)|'hex'
 */
declare class Buffer extends Uint8Array {
    /**
     * Allocates a new buffer containing the given {str}.
     *
     * @param str String to store in buffer.
     * @param encoding encoding to use, optional.  Default is 'utf8'
     * @deprecated since v10.0.0 - Use \`Buffer.from(string[, encoding])\` instead.
     */
    constructor(str: string, encoding?: BufferEncoding);
    /**
     * Allocates a new buffer of {size} octets.
     *
     * @param size count of octets to allocate.
     * @deprecated since v10.0.0 - Use \`Buffer.alloc()\` instead (also see \`Buffer.allocUnsafe()\`).
     */
    constructor(size: number);
    /**
     * Allocates a new buffer containing the given {array} of octets.
     *
     * @param array The octets to store.
     * @deprecated since v10.0.0 - Use \`Buffer.from(array)\` instead.
     */
    constructor(array: Uint8Array);
    /**
     * Produces a Buffer backed by the same allocated memory as
     * the given {ArrayBuffer}/{SharedArrayBuffer}.
     *
     *
     * @param arrayBuffer The ArrayBuffer with which to share memory.
     * @deprecated since v10.0.0 - Use \`Buffer.from(arrayBuffer[, byteOffset[, length]])\` instead.
     */
    constructor(arrayBuffer: ArrayBuffer | SharedArrayBuffer);
    /**
     * Allocates a new buffer containing the given {array} of octets.
     *
     * @param array The octets to store.
     * @deprecated since v10.0.0 - Use \`Buffer.from(array)\` instead.
     */
    constructor(array: ReadonlyArray<any>);
    /**
     * Copies the passed {buffer} data onto a new {Buffer} instance.
     *
     * @param buffer The buffer to copy.
     * @deprecated since v10.0.0 - Use \`Buffer.from(buffer)\` instead.
     */
    constructor(buffer: Buffer);
    /**
     * When passed a reference to the .buffer property of a TypedArray instance,
     * the newly created Buffer will share the same allocated memory as the TypedArray.
     * The optional {byteOffset} and {length} arguments specify a memory range
     * within the {arrayBuffer} that will be shared by the Buffer.
     *
     * @param arrayBuffer The .buffer property of any TypedArray or a new ArrayBuffer()
     */
    static from(arrayBuffer: WithImplicitCoercion<ArrayBuffer | SharedArrayBuffer>, byteOffset?: number, length?: number): Buffer;
    /**
     * Creates a new Buffer using the passed {data}
     * @param data data to create a new Buffer
     */
    static from(data: Uint8Array | ReadonlyArray<number>): Buffer;
    static from(data: WithImplicitCoercion<Uint8Array | ReadonlyArray<number> | string>): Buffer;
    /**
     * Creates a new Buffer containing the given JavaScript string {str}.
     * If provided, the {encoding} parameter identifies the character encoding.
     * If not provided, {encoding} defaults to 'utf8'.
     */
    static from(str: WithImplicitCoercion<string> | { [Symbol.toPrimitive](hint: 'string'): string }, encoding?: BufferEncoding): Buffer;
    /**
     * Creates a new Buffer using the passed {data}
     * @param values to create a new Buffer
     */
    static of(...items: number[]): Buffer;
    /**
     * Returns true if {obj} is a Buffer
     *
     * @param obj object to test.
     */
    static isBuffer(obj: any): obj is Buffer;
    /**
     * Returns true if {encoding} is a valid encoding argument.
     * Valid string encodings in Node 0.12: 'ascii'|'utf8'|'utf16le'|'ucs2'(alias of 'utf16le')|'base64'|'base64url'|'binary'(deprecated)|'hex'
     *
     * @param encoding string to test.
     */
    static isEncoding(encoding: string): encoding is BufferEncoding;
    /**
     * Gives the actual byte length of a string. encoding defaults to 'utf8'.
     * This is not the same as String.prototype.length since that returns the number of characters in a string.
     *
     * @param string string to test.
     * @param encoding encoding used to evaluate (defaults to 'utf8')
     */
    static byteLength(
        string: string | NodeJS.ArrayBufferView | ArrayBuffer | SharedArrayBuffer,
        encoding?: BufferEncoding
    ): number;
    /**
     * Returns a buffer which is the result of concatenating all the buffers in the list together.
     *
     * If the list has no items, or if the totalLength is 0, then it returns a zero-length buffer.
     * If the list has exactly one item, then the first item of the list is returned.
     * If the list has more than one item, then a new Buffer is created.
     *
     * @param list An array of Buffer objects to concatenate
     * @param totalLength Total length of the buffers when concatenated.
     *   If totalLength is not provided, it is read from the buffers in the list. However, this adds an additional loop to the function, so it is faster to provide the length explicitly.
     */
    static concat(list: ReadonlyArray<Uint8Array>, totalLength?: number): Buffer;
    /**
     * The same as buf1.compare(buf2).
     */
    static compare(buf1: Uint8Array, buf2: Uint8Array): number;
    /**
     * Allocates a new buffer of {size} octets.
     *
     * @param size count of octets to allocate.
     * @param fill if specified, buffer will be initialized by calling buf.fill(fill).
     *    If parameter is omitted, buffer will be filled with zeros.
     * @param encoding encoding used for call to buf.fill while initalizing
     */
    static alloc(size: number, fill?: string | Buffer | number, encoding?: BufferEncoding): Buffer;
    /**
     * Allocates a new buffer of {size} octets, leaving memory not initialized, so the contents
     * of the newly created Buffer are unknown and may contain sensitive data.
     *
     * @param size count of octets to allocate
     */
    static allocUnsafe(size: number): Buffer;
    /**
     * Allocates a new non-pooled buffer of {size} octets, leaving memory not initialized, so the contents
     * of the newly created Buffer are unknown and may contain sensitive data.
     *
     * @param size count of octets to allocate
     */
    static allocUnsafeSlow(size: number): Buffer;
    /**
     * This is the number of bytes used to determine the size of pre-allocated, internal Buffer instances used for pooling. This value may be modified.
     */
    static poolSize: number;

    write(string: string, encoding?: BufferEncoding): number;
    write(string: string, offset: number, encoding?: BufferEncoding): number;
    write(string: string, offset: number, length: number, encoding?: BufferEncoding): number;
    toString(encoding?: BufferEncoding, start?: number, end?: number): string;
    toJSON(): { type: 'Buffer'; data: number[] };
    equals(otherBuffer: Uint8Array): boolean;
    compare(
        otherBuffer: Uint8Array,
        targetStart?: number,
        targetEnd?: number,
        sourceStart?: number,
        sourceEnd?: number
    ): number;
    copy(targetBuffer: Uint8Array, targetStart?: number, sourceStart?: number, sourceEnd?: number): number;
    /**
     * Returns a new \`Buffer\` that references **the same memory as the original**, but offset and cropped by the start and end indices.
     *
     * This method is incompatible with \`Uint8Array#slice()\`, which returns a copy of the original memory.
     *
     * @param begin Where the new \`Buffer\` will start. Default: \`0\`.
     * @param end Where the new \`Buffer\` will end (not inclusive). Default: \`buf.length\`.
     */
    slice(begin?: number, end?: number): Buffer;
    /**
     * Returns a new \`Buffer\` that references **the same memory as the original**, but offset and cropped by the start and end indices.
     *
     * This method is compatible with \`Uint8Array#subarray()\`.
     *
     * @param begin Where the new \`Buffer\` will start. Default: \`0\`.
     * @param end Where the new \`Buffer\` will end (not inclusive). Default: \`buf.length\`.
     */
    subarray(begin?: number, end?: number): Buffer;
    writeBigInt64BE(value: bigint, offset?: number): number;
    writeBigInt64LE(value: bigint, offset?: number): number;
    writeBigUInt64BE(value: bigint, offset?: number): number;
    writeBigUInt64LE(value: bigint, offset?: number): number;
    writeUIntLE(value: number, offset: number, byteLength: number): number;
    writeUIntBE(value: number, offset: number, byteLength: number): number;
    writeIntLE(value: number, offset: number, byteLength: number): number;
    writeIntBE(value: number, offset: number, byteLength: number): number;
    readBigUInt64BE(offset?: number): bigint;
    readBigUInt64LE(offset?: number): bigint;
    readBigInt64BE(offset?: number): bigint;
    readBigInt64LE(offset?: number): bigint;
    readUIntLE(offset: number, byteLength: number): number;
    readUIntBE(offset: number, byteLength: number): number;
    readIntLE(offset: number, byteLength: number): number;
    readIntBE(offset: number, byteLength: number): number;
    readUInt8(offset?: number): number;
    readUInt16LE(offset?: number): number;
    readUInt16BE(offset?: number): number;
    readUInt32LE(offset?: number): number;
    readUInt32BE(offset?: number): number;
    readInt8(offset?: number): number;
    readInt16LE(offset?: number): number;
    readInt16BE(offset?: number): number;
    readInt32LE(offset?: number): number;
    readInt32BE(offset?: number): number;
    readFloatLE(offset?: number): number;
    readFloatBE(offset?: number): number;
    readDoubleLE(offset?: number): number;
    readDoubleBE(offset?: number): number;
    reverse(): this;
    swap16(): Buffer;
    swap32(): Buffer;
    swap64(): Buffer;
    writeUInt8(value: number, offset?: number): number;
    writeUInt16LE(value: number, offset?: number): number;
    writeUInt16BE(value: number, offset?: number): number;
    writeUInt32LE(value: number, offset?: number): number;
    writeUInt32BE(value: number, offset?: number): number;
    writeInt8(value: number, offset?: number): number;
    writeInt16LE(value: number, offset?: number): number;
    writeInt16BE(value: number, offset?: number): number;
    writeInt32LE(value: number, offset?: number): number;
    writeInt32BE(value: number, offset?: number): number;
    writeFloatLE(value: number, offset?: number): number;
    writeFloatBE(value: number, offset?: number): number;
    writeDoubleLE(value: number, offset?: number): number;
    writeDoubleBE(value: number, offset?: number): number;

    fill(value: string | Uint8Array | number, offset?: number, end?: number, encoding?: BufferEncoding): this;

    indexOf(value: string | number | Uint8Array, byteOffset?: number, encoding?: BufferEncoding): number;
    lastIndexOf(value: string | number | Uint8Array, byteOffset?: number, encoding?: BufferEncoding): number;
    entries(): IterableIterator<[number, number]>;
    includes(value: string | number | Buffer, byteOffset?: number, encoding?: BufferEncoding): boolean;
    keys(): IterableIterator<number>;
    values(): IterableIterator<number>;
}

/*----------------------------------------------*
*                                               *
*               GLOBAL INTERFACES               *
*                                               *
*-----------------------------------------------*/
declare namespace NodeJS {
    interface InspectOptions {
        /**
         * If set to \`true\`, getters are going to be
         * inspected as well. If set to \`'get'\` only getters without setter are going
         * to be inspected. If set to \`'set'\` only getters having a corresponding
         * setter are going to be inspected. This might cause side effects depending on
         * the getter function.
         * @default \`false\`
         */
        getters?: 'get' | 'set' | boolean | undefined;
        showHidden?: boolean | undefined;
        /**
         * @default 2
         */
        depth?: number | null | undefined;
        colors?: boolean | undefined;
        customInspect?: boolean | undefined;
        showProxy?: boolean | undefined;
        maxArrayLength?: number | null | undefined;
        /**
         * Specifies the maximum number of characters to
         * include when formatting. Set to \`null\` or \`Infinity\` to show all elements.
         * Set to \`0\` or negative to show no characters.
         * @default Infinity
         */
        maxStringLength?: number | null | undefined;
        breakLength?: number | undefined;
        /**
         * Setting this to \`false\` causes each object key
         * to be displayed on a new line. It will also add new lines to text that is
         * longer than \`breakLength\`. If set to a number, the most \`n\` inner elements
         * are united on a single line as long as all properties fit into
         * \`breakLength\`. Short array elements are also grouped together. Note that no
         * text will be reduced below 16 characters, no matter the \`breakLength\` size.
         * For more information, see the example below.
         * @default \`true\`
         */
        compact?: boolean | number | undefined;
        sorted?: boolean | ((a: string, b: string) => number) | undefined;
    }

    interface CallSite {
        /**
         * Value of "this"
         */
        getThis(): any;

        /**
         * Type of "this" as a string.
         * This is the name of the function stored in the constructor field of
         * "this", if available.  Otherwise the object's [[Class]] internal
         * property.
         */
        getTypeName(): string | null;

        /**
         * Current function
         */
        getFunction(): Function | undefined;

        /**
         * Name of the current function, typically its name property.
         * If a name property is not available an attempt will be made to try
         * to infer a name from the function's context.
         */
        getFunctionName(): string | null;

        /**
         * Name of the property [of "this" or one of its prototypes] that holds
         * the current function
         */
        getMethodName(): string | null;

        /**
         * Name of the script [if this function was defined in a script]
         */
        getFileName(): string | null;

        /**
         * Current line number [if this function was defined in a script]
         */
        getLineNumber(): number | null;

        /**
         * Current column number [if this function was defined in a script]
         */
        getColumnNumber(): number | null;

        /**
         * A call site object representing the location where eval was called
         * [if this function was created using a call to eval]
         */
        getEvalOrigin(): string | undefined;

        /**
         * Is this a toplevel invocation, that is, is "this" the global object?
         */
        isToplevel(): boolean;

        /**
         * Does this call take place in code defined by a call to eval?
         */
        isEval(): boolean;

        /**
         * Is this call in native V8 code?
         */
        isNative(): boolean;

        /**
         * Is this a constructor call?
         */
        isConstructor(): boolean;
    }

    interface ErrnoException extends Error {
        errno?: number | undefined;
        code?: string | undefined;
        path?: string | undefined;
        syscall?: string | undefined;
    }

    interface ReadableStream extends EventEmitter {
        readable: boolean;
        read(size?: number): string | Buffer;
        setEncoding(encoding: BufferEncoding): this;
        pause(): this;
        resume(): this;
        isPaused(): boolean;
        pipe<T extends WritableStream>(destination: T, options?: { end?: boolean | undefined; }): T;
        unpipe(destination?: WritableStream): this;
        unshift(chunk: string | Uint8Array, encoding?: BufferEncoding): void;
        wrap(oldStream: ReadableStream): this;
        [Symbol.asyncIterator](): AsyncIterableIterator<string | Buffer>;
    }

    interface WritableStream extends EventEmitter {
        writable: boolean;
        write(buffer: Uint8Array | string, cb?: (err?: Error | null) => void): boolean;
        write(str: string, encoding?: BufferEncoding, cb?: (err?: Error | null) => void): boolean;
        end(cb?: () => void): void;
        end(data: string | Uint8Array, cb?: () => void): void;
        end(str: string, encoding?: BufferEncoding, cb?: () => void): void;
    }

    interface ReadWriteStream extends ReadableStream, WritableStream { }

    interface Global {
        Array: typeof Array;
        ArrayBuffer: typeof ArrayBuffer;
        Boolean: typeof Boolean;
        Buffer: typeof Buffer;
        DataView: typeof DataView;
        Date: typeof Date;
        Error: typeof Error;
        EvalError: typeof EvalError;
        Float32Array: typeof Float32Array;
        Float64Array: typeof Float64Array;
        Function: typeof Function;
        Infinity: typeof Infinity;
        Int16Array: typeof Int16Array;
        Int32Array: typeof Int32Array;
        Int8Array: typeof Int8Array;
        Intl: typeof Intl;
        JSON: typeof JSON;
        Map: MapConstructor;
        Math: typeof Math;
        NaN: typeof NaN;
        Number: typeof Number;
        Object: typeof Object;
        Promise: typeof Promise;
        RangeError: typeof RangeError;
        ReferenceError: typeof ReferenceError;
        RegExp: typeof RegExp;
        Set: SetConstructor;
        String: typeof String;
        Symbol: Function;
        SyntaxError: typeof SyntaxError;
        TypeError: typeof TypeError;
        URIError: typeof URIError;
        Uint16Array: typeof Uint16Array;
        Uint32Array: typeof Uint32Array;
        Uint8Array: typeof Uint8Array;
        Uint8ClampedArray: typeof Uint8ClampedArray;
        WeakMap: WeakMapConstructor;
        WeakSet: WeakSetConstructor;
        clearImmediate: (immediateId: Immediate) => void;
        clearInterval: (intervalId: Timeout) => void;
        clearTimeout: (timeoutId: Timeout) => void;
        decodeURI: typeof decodeURI;
        decodeURIComponent: typeof decodeURIComponent;
        encodeURI: typeof encodeURI;
        encodeURIComponent: typeof encodeURIComponent;
        escape: (str: string) => string;
        eval: typeof eval;
        global: Global;
        isFinite: typeof isFinite;
        isNaN: typeof isNaN;
        parseFloat: typeof parseFloat;
        parseInt: typeof parseInt;
        setImmediate: (callback: (...args: any[]) => void, ...args: any[]) => Immediate;
        setInterval: (callback: (...args: any[]) => void, ms?: number, ...args: any[]) => Timeout;
        setTimeout: (callback: (...args: any[]) => void, ms?: number, ...args: any[]) => Timeout;
        queueMicrotask: typeof queueMicrotask;
        undefined: typeof undefined;
        unescape: (str: string) => string;
        gc: () => void;
        v8debug?: any;
    }

    interface RefCounted {
        ref(): this;
        unref(): this;
    }

    \/\/ compatibility with older typings
    interface Timer extends RefCounted {
        hasRef(): boolean;
        refresh(): this;
        [Symbol.toPrimitive](): number;
    }

    interface Immediate extends RefCounted {
        hasRef(): boolean;
        _onImmediate: Function; \/\/ to distinguish it from the Timeout class
    }

    interface Timeout extends Timer {
        hasRef(): boolean;
        refresh(): this;
        [Symbol.toPrimitive](): number;
    }

    type TypedArray =
        | Uint8Array
        | Uint8ClampedArray
        | Uint16Array
        | Uint32Array
        | Int8Array
        | Int16Array
        | Int32Array
        | BigUint64Array
        | BigInt64Array
        | Float32Array
        | Float64Array;
    type ArrayBufferView = TypedArray | DataView;

    interface Require {
        (id: string): any;
        resolve: RequireResolve;
        cache: Dict<NodeModule>;
        /**
         * @deprecated
         */
        extensions: RequireExtensions;
        main: Module | undefined;
    }

    interface RequireResolve {
        (id: string, options?: { paths?: string[] | undefined; }): string;
        paths(request: string): string[] | null;
    }

    interface RequireExtensions extends Dict<(m: Module, filename: string) => any> {
        '.js': (m: Module, filename: string) => any;
        '.json': (m: Module, filename: string) => any;
        '.node': (m: Module, filename: string) => any;
    }
    interface Module {
        exports: any;
        require: Require;
        id: string;
        filename: string;
        loaded: boolean;
        /** @deprecated since 14.6.0 Please use \`require.main\` and \`module.children\` instead. */
        parent: Module | null | undefined;
        children: Module[];
        /**
         * @since 11.14.0
         *
         * The directory name of the module. This is usually the same as the path.dirname() of the module.id.
         */
        path: string;
        paths: string[];
    }

    interface Dict<T> {
        [key: string]: T | undefined;
    }

    interface ReadOnlyDict<T> {
        readonly [key: string]: T | undefined;
    }
}
`;
definitions['globals.global.d.ts'] = `declare var global: NodeJS.Global & typeof globalThis;
`;
definitions['http.d.ts'] = `declare module 'http' {
    import * as stream from 'stream';
    import { URL } from 'url';
    import { Socket, Server as NetServer } from 'net';

    \/\/ incoming headers will never contain number
    interface IncomingHttpHeaders extends NodeJS.Dict<string | string[]> {
        'accept'?: string | undefined;
        'accept-language'?: string | undefined;
        'accept-patch'?: string | undefined;
        'accept-ranges'?: string | undefined;
        'access-control-allow-credentials'?: string | undefined;
        'access-control-allow-headers'?: string | undefined;
        'access-control-allow-methods'?: string | undefined;
        'access-control-allow-origin'?: string | undefined;
        'access-control-expose-headers'?: string | undefined;
        'access-control-max-age'?: string | undefined;
        'access-control-request-headers'?: string | undefined;
        'access-control-request-method'?: string | undefined;
        'age'?: string | undefined;
        'allow'?: string | undefined;
        'alt-svc'?: string | undefined;
        'authorization'?: string | undefined;
        'cache-control'?: string | undefined;
        'connection'?: string | undefined;
        'content-disposition'?: string | undefined;
        'content-encoding'?: string | undefined;
        'content-language'?: string | undefined;
        'content-length'?: string | undefined;
        'content-location'?: string | undefined;
        'content-range'?: string | undefined;
        'content-type'?: string | undefined;
        'cookie'?: string | undefined;
        'date'?: string | undefined;
        'etag'?: string | undefined;
        'expect'?: string | undefined;
        'expires'?: string | undefined;
        'forwarded'?: string | undefined;
        'from'?: string | undefined;
        'host'?: string | undefined;
        'if-match'?: string | undefined;
        'if-modified-since'?: string | undefined;
        'if-none-match'?: string | undefined;
        'if-unmodified-since'?: string | undefined;
        'last-modified'?: string | undefined;
        'location'?: string | undefined;
        'origin'?: string | undefined;
        'pragma'?: string | undefined;
        'proxy-authenticate'?: string | undefined;
        'proxy-authorization'?: string | undefined;
        'public-key-pins'?: string | undefined;
        'range'?: string | undefined;
        'referer'?: string | undefined;
        'retry-after'?: string | undefined;
        'sec-websocket-accept'?: string | undefined;
        'sec-websocket-extensions'?: string | undefined;
        'sec-websocket-key'?: string | undefined;
        'sec-websocket-protocol'?: string | undefined;
        'sec-websocket-version'?: string | undefined;
        'set-cookie'?: string[] | undefined;
        'strict-transport-security'?: string | undefined;
        'tk'?: string | undefined;
        'trailer'?: string | undefined;
        'transfer-encoding'?: string | undefined;
        'upgrade'?: string | undefined;
        'user-agent'?: string | undefined;
        'vary'?: string | undefined;
        'via'?: string | undefined;
        'warning'?: string | undefined;
        'www-authenticate'?: string | undefined;
    }

    \/\/ outgoing headers allows numbers (as they are converted internally to strings)
    type OutgoingHttpHeader = number | string | string[];

    interface OutgoingHttpHeaders extends NodeJS.Dict<OutgoingHttpHeader> {
    }

    interface ClientRequestArgs {
        protocol?: string | null | undefined;
        host?: string | null | undefined;
        hostname?: string | null | undefined;
        family?: number | undefined;
        port?: number | string | null | undefined;
        defaultPort?: number | string | undefined;
        localAddress?: string | undefined;
        socketPath?: string | undefined;
        /**
         * @default 8192
         */
        maxHeaderSize?: number | undefined;
        method?: string | undefined;
        path?: string | null | undefined;
        headers?: OutgoingHttpHeaders | undefined;
        auth?: string | null | undefined;
        agent?: Agent | boolean | undefined;
        _defaultAgent?: Agent | undefined;
        timeout?: number | undefined;
        setHost?: boolean | undefined;
        \/\/ https:\/\/github.com/nodejs/node/blob/master/lib/_http_client.js#L278
        createConnection?: ((options: ClientRequestArgs, oncreate: (err: Error, socket: Socket) => void) => Socket) | undefined;
    }

    interface ServerOptions {
        IncomingMessage?: typeof IncomingMessage | undefined;
        ServerResponse?: typeof ServerResponse | undefined;
        /**
         * Optionally overrides the value of
         * [\`--max-http-header-size\`][] for requests received by this server, i.e.
         * the maximum length of request headers in bytes.
         * @default 8192
         */
        maxHeaderSize?: number | undefined;
        /**
         * Use an insecure HTTP parser that accepts invalid HTTP headers when true.
         * Using the insecure parser should be avoided.
         * See --insecure-http-parser for more information.
         * @default false
         */
        insecureHTTPParser?: boolean | undefined;
    }

    type RequestListener = (req: IncomingMessage, res: ServerResponse) => void;

    class Server extends NetServer {
        constructor(requestListener?: RequestListener);
        constructor(options: ServerOptions, requestListener?: RequestListener);
        setTimeout(msecs?: number, callback?: () => void): this;
        setTimeout(callback: () => void): this;
        /**
         * Limits maximum incoming headers count. If set to 0, no limit will be applied.
         * @default 2000
         * {@link https:\/\/nodejs.org/api/http.html#http_server_maxheaderscount}
         */
        maxHeadersCount: number | null;
        timeout: number;
        /**
         * Limit the amount of time the parser will wait to receive the complete HTTP headers.
         * @default 60000
         * {@link https:\/\/nodejs.org/api/http.html#http_server_headerstimeout}
         */
        headersTimeout: number;
        keepAliveTimeout: number;
        /**
         * Sets the timeout value in milliseconds for receiving the entire request from the client.
         * @default 0
         * {@link https:\/\/nodejs.org/api/http.html#http_server_requesttimeout}
         */
        requestTimeout: number;
        addListener(event: string, listener: (...args: any[]) => void): this;
        addListener(event: 'close', listener: () => void): this;
        addListener(event: 'connection', listener: (socket: Socket) => void): this;
        addListener(event: 'error', listener: (err: Error) => void): this;
        addListener(event: 'listening', listener: () => void): this;
        addListener(event: 'checkContinue', listener: RequestListener): this;
        addListener(event: 'checkExpectation', listener: RequestListener): this;
        addListener(event: 'clientError', listener: (err: Error, socket: stream.Duplex) => void): this;
        addListener(event: 'connect', listener: (req: IncomingMessage, socket: stream.Duplex, head: Buffer) => void): this;
        addListener(event: 'request', listener: RequestListener): this;
        addListener(event: 'upgrade', listener: (req: IncomingMessage, socket: stream.Duplex, head: Buffer) => void): this;
        emit(event: string, ...args: any[]): boolean;
        emit(event: 'close'): boolean;
        emit(event: 'connection', socket: Socket): boolean;
        emit(event: 'error', err: Error): boolean;
        emit(event: 'listening'): boolean;
        emit(event: 'checkContinue', req: IncomingMessage, res: ServerResponse): boolean;
        emit(event: 'checkExpectation', req: IncomingMessage, res: ServerResponse): boolean;
        emit(event: 'clientError', err: Error, socket: stream.Duplex): boolean;
        emit(event: 'connect', req: IncomingMessage, socket: stream.Duplex, head: Buffer): boolean;
        emit(event: 'request', req: IncomingMessage, res: ServerResponse): boolean;
        emit(event: 'upgrade', req: IncomingMessage, socket: stream.Duplex, head: Buffer): boolean;
        on(event: string, listener: (...args: any[]) => void): this;
        on(event: 'close', listener: () => void): this;
        on(event: 'connection', listener: (socket: Socket) => void): this;
        on(event: 'error', listener: (err: Error) => void): this;
        on(event: 'listening', listener: () => void): this;
        on(event: 'checkContinue', listener: RequestListener): this;
        on(event: 'checkExpectation', listener: RequestListener): this;
        on(event: 'clientError', listener: (err: Error, socket: stream.Duplex) => void): this;
        on(event: 'connect', listener: (req: IncomingMessage, socket: stream.Duplex, head: Buffer) => void): this;
        on(event: 'request', listener: RequestListener): this;
        on(event: 'upgrade', listener: (req: IncomingMessage, socket: stream.Duplex, head: Buffer) => void): this;
        once(event: string, listener: (...args: any[]) => void): this;
        once(event: 'close', listener: () => void): this;
        once(event: 'connection', listener: (socket: Socket) => void): this;
        once(event: 'error', listener: (err: Error) => void): this;
        once(event: 'listening', listener: () => void): this;
        once(event: 'checkContinue', listener: RequestListener): this;
        once(event: 'checkExpectation', listener: RequestListener): this;
        once(event: 'clientError', listener: (err: Error, socket: stream.Duplex) => void): this;
        once(event: 'connect', listener: (req: IncomingMessage, socket: stream.Duplex, head: Buffer) => void): this;
        once(event: 'request', listener: RequestListener): this;
        once(event: 'upgrade', listener: (req: IncomingMessage, socket: stream.Duplex, head: Buffer) => void): this;
        prependListener(event: string, listener: (...args: any[]) => void): this;
        prependListener(event: 'close', listener: () => void): this;
        prependListener(event: 'connection', listener: (socket: Socket) => void): this;
        prependListener(event: 'error', listener: (err: Error) => void): this;
        prependListener(event: 'listening', listener: () => void): this;
        prependListener(event: 'checkContinue', listener: RequestListener): this;
        prependListener(event: 'checkExpectation', listener: RequestListener): this;
        prependListener(event: 'clientError', listener: (err: Error, socket: stream.Duplex) => void): this;
        prependListener(event: 'connect', listener: (req: IncomingMessage, socket: stream.Duplex, head: Buffer) => void): this;
        prependListener(event: 'request', listener: RequestListener): this;
        prependListener(event: 'upgrade', listener: (req: IncomingMessage, socket: stream.Duplex, head: Buffer) => void): this;
        prependOnceListener(event: string, listener: (...args: any[]) => void): this;
        prependOnceListener(event: 'close', listener: () => void): this;
        prependOnceListener(event: 'connection', listener: (socket: Socket) => void): this;
        prependOnceListener(event: 'error', listener: (err: Error) => void): this;
        prependOnceListener(event: 'listening', listener: () => void): this;
        prependOnceListener(event: 'checkContinue', listener: RequestListener): this;
        prependOnceListener(event: 'checkExpectation', listener: RequestListener): this;
        prependOnceListener(event: 'clientError', listener: (err: Error, socket: stream.Duplex) => void): this;
        prependOnceListener(event: 'connect', listener: (req: IncomingMessage, socket: stream.Duplex, head: Buffer) => void): this;
        prependOnceListener(event: 'request', listener: RequestListener): this;
        prependOnceListener(event: 'upgrade', listener: (req: IncomingMessage, socket: stream.Duplex, head: Buffer) => void): this;
    }

    \/\/ https:\/\/github.com/nodejs/node/blob/master/lib/_http_outgoing.js
    class OutgoingMessage extends stream.Writable {
        upgrading: boolean;
        chunkedEncoding: boolean;
        shouldKeepAlive: boolean;
        useChunkedEncodingByDefault: boolean;
        sendDate: boolean;
        /**
         * @deprecated Use \`writableEnded\` instead.
         */
        finished: boolean;
        headersSent: boolean;
        /**
         * @deprecated Use \`socket\` instead.
         */
        connection: Socket | null;
        socket: Socket | null;

        constructor();

        setTimeout(msecs: number, callback?: () => void): this;
        setHeader(name: string, value: number | string | ReadonlyArray<string>): void;
        getHeader(name: string): number | string | string[] | undefined;
        getHeaders(): OutgoingHttpHeaders;
        getHeaderNames(): string[];
        hasHeader(name: string): boolean;
        removeHeader(name: string): void;
        addTrailers(headers: OutgoingHttpHeaders | ReadonlyArray<[string, string]>): void;
        flushHeaders(): void;
    }

    \/\/ https:\/\/github.com/nodejs/node/blob/master/lib/_http_server.js#L108-L256
    class ServerResponse extends OutgoingMessage {
        statusCode: number;
        statusMessage: string;

        constructor(req: IncomingMessage);

        assignSocket(socket: Socket): void;
        detachSocket(socket: Socket): void;
        \/\/ https:\/\/github.com/nodejs/node/blob/master/test/parallel/test-http-write-callbacks.js#L53
        \/\/ no args in writeContinue callback
        writeContinue(callback?: () => void): void;
        writeHead(statusCode: number, statusMessage?: string, headers?: OutgoingHttpHeaders | OutgoingHttpHeader[]): this;
        writeHead(statusCode: number, headers?: OutgoingHttpHeaders | OutgoingHttpHeader[]): this;
        writeProcessing(): void;
    }

    interface InformationEvent {
        statusCode: number;
        statusMessage: string;
        httpVersion: string;
        httpVersionMajor: number;
        httpVersionMinor: number;
        headers: IncomingHttpHeaders;
        rawHeaders: string[];
    }

    \/\/ https:\/\/github.com/nodejs/node/blob/master/lib/_http_client.js#L77
    class ClientRequest extends OutgoingMessage {
        aborted: boolean;
        host: string;
        protocol: string;

        constructor(url: string | URL | ClientRequestArgs, cb?: (res: IncomingMessage) => void);

        method: string;
        path: string;
        /** @deprecated since v14.1.0 Use \`request.destroy()\` instead. */
        abort(): void;
        onSocket(socket: Socket): void;
        setTimeout(timeout: number, callback?: () => void): this;
        setNoDelay(noDelay?: boolean): void;
        setSocketKeepAlive(enable?: boolean, initialDelay?: number): void;

        addListener(event: 'abort', listener: () => void): this;
        addListener(event: 'connect', listener: (response: IncomingMessage, socket: Socket, head: Buffer) => void): this;
        addListener(event: 'continue', listener: () => void): this;
        addListener(event: 'information', listener: (info: InformationEvent) => void): this;
        addListener(event: 'response', listener: (response: IncomingMessage) => void): this;
        addListener(event: 'socket', listener: (socket: Socket) => void): this;
        addListener(event: 'timeout', listener: () => void): this;
        addListener(event: 'upgrade', listener: (response: IncomingMessage, socket: Socket, head: Buffer) => void): this;
        addListener(event: 'close', listener: () => void): this;
        addListener(event: 'drain', listener: () => void): this;
        addListener(event: 'error', listener: (err: Error) => void): this;
        addListener(event: 'finish', listener: () => void): this;
        addListener(event: 'pipe', listener: (src: stream.Readable) => void): this;
        addListener(event: 'unpipe', listener: (src: stream.Readable) => void): this;
        addListener(event: string | symbol, listener: (...args: any[]) => void): this;

        on(event: 'abort', listener: () => void): this;
        on(event: 'connect', listener: (response: IncomingMessage, socket: Socket, head: Buffer) => void): this;
        on(event: 'continue', listener: () => void): this;
        on(event: 'information', listener: (info: InformationEvent) => void): this;
        on(event: 'response', listener: (response: IncomingMessage) => void): this;
        on(event: 'socket', listener: (socket: Socket) => void): this;
        on(event: 'timeout', listener: () => void): this;
        on(event: 'upgrade', listener: (response: IncomingMessage, socket: Socket, head: Buffer) => void): this;
        on(event: 'close', listener: () => void): this;
        on(event: 'drain', listener: () => void): this;
        on(event: 'error', listener: (err: Error) => void): this;
        on(event: 'finish', listener: () => void): this;
        on(event: 'pipe', listener: (src: stream.Readable) => void): this;
        on(event: 'unpipe', listener: (src: stream.Readable) => void): this;
        on(event: string | symbol, listener: (...args: any[]) => void): this;

        once(event: 'abort', listener: () => void): this;
        once(event: 'connect', listener: (response: IncomingMessage, socket: Socket, head: Buffer) => void): this;
        once(event: 'continue', listener: () => void): this;
        once(event: 'information', listener: (info: InformationEvent) => void): this;
        once(event: 'response', listener: (response: IncomingMessage) => void): this;
        once(event: 'socket', listener: (socket: Socket) => void): this;
        once(event: 'timeout', listener: () => void): this;
        once(event: 'upgrade', listener: (response: IncomingMessage, socket: Socket, head: Buffer) => void): this;
        once(event: 'close', listener: () => void): this;
        once(event: 'drain', listener: () => void): this;
        once(event: 'error', listener: (err: Error) => void): this;
        once(event: 'finish', listener: () => void): this;
        once(event: 'pipe', listener: (src: stream.Readable) => void): this;
        once(event: 'unpipe', listener: (src: stream.Readable) => void): this;
        once(event: string | symbol, listener: (...args: any[]) => void): this;

        prependListener(event: 'abort', listener: () => void): this;
        prependListener(event: 'connect', listener: (response: IncomingMessage, socket: Socket, head: Buffer) => void): this;
        prependListener(event: 'continue', listener: () => void): this;
        prependListener(event: 'information', listener: (info: InformationEvent) => void): this;
        prependListener(event: 'response', listener: (response: IncomingMessage) => void): this;
        prependListener(event: 'socket', listener: (socket: Socket) => void): this;
        prependListener(event: 'timeout', listener: () => void): this;
        prependListener(event: 'upgrade', listener: (response: IncomingMessage, socket: Socket, head: Buffer) => void): this;
        prependListener(event: 'close', listener: () => void): this;
        prependListener(event: 'drain', listener: () => void): this;
        prependListener(event: 'error', listener: (err: Error) => void): this;
        prependListener(event: 'finish', listener: () => void): this;
        prependListener(event: 'pipe', listener: (src: stream.Readable) => void): this;
        prependListener(event: 'unpipe', listener: (src: stream.Readable) => void): this;
        prependListener(event: string | symbol, listener: (...args: any[]) => void): this;

        prependOnceListener(event: 'abort', listener: () => void): this;
        prependOnceListener(event: 'connect', listener: (response: IncomingMessage, socket: Socket, head: Buffer) => void): this;
        prependOnceListener(event: 'continue', listener: () => void): this;
        prependOnceListener(event: 'information', listener: (info: InformationEvent) => void): this;
        prependOnceListener(event: 'response', listener: (response: IncomingMessage) => void): this;
        prependOnceListener(event: 'socket', listener: (socket: Socket) => void): this;
        prependOnceListener(event: 'timeout', listener: () => void): this;
        prependOnceListener(event: 'upgrade', listener: (response: IncomingMessage, socket: Socket, head: Buffer) => void): this;
        prependOnceListener(event: 'close', listener: () => void): this;
        prependOnceListener(event: 'drain', listener: () => void): this;
        prependOnceListener(event: 'error', listener: (err: Error) => void): this;
        prependOnceListener(event: 'finish', listener: () => void): this;
        prependOnceListener(event: 'pipe', listener: (src: stream.Readable) => void): this;
        prependOnceListener(event: 'unpipe', listener: (src: stream.Readable) => void): this;
        prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
    }

    class IncomingMessage extends stream.Readable {
        constructor(socket: Socket);

        aborted: boolean;
        httpVersion: string;
        httpVersionMajor: number;
        httpVersionMinor: number;
        complete: boolean;
        /**
         * @deprecated since v13.0.0 - Use \`socket\` instead.
         */
        connection: Socket;
        socket: Socket;
        headers: IncomingHttpHeaders;
        rawHeaders: string[];
        trailers: NodeJS.Dict<string>;
        rawTrailers: string[];
        setTimeout(msecs: number, callback?: () => void): this;
        /**
         * Only valid for request obtained from http.Server.
         */
        method?: string | undefined;
        /**
         * Only valid for request obtained from http.Server.
         */
        url?: string | undefined;
        /**
         * Only valid for response obtained from http.ClientRequest.
         */
        statusCode?: number | undefined;
        /**
         * Only valid for response obtained from http.ClientRequest.
         */
        statusMessage?: string | undefined;
        destroy(error?: Error): void;
    }

    interface AgentOptions {
        /**
         * Keep sockets around in a pool to be used by other requests in the future. Default = false
         */
        keepAlive?: boolean | undefined;
        /**
         * When using HTTP KeepAlive, how often to send TCP KeepAlive packets over sockets being kept alive. Default = 1000.
         * Only relevant if keepAlive is set to true.
         */
        keepAliveMsecs?: number | undefined;
        /**
         * Maximum number of sockets to allow per host. Default for Node 0.10 is 5, default for Node 0.12 is Infinity
         */
        maxSockets?: number | undefined;
        /**
         * Maximum number of sockets allowed for all hosts in total. Each request will use a new socket until the maximum is reached. Default: Infinity.
         */
        maxTotalSockets?: number | undefined;
        /**
         * Maximum number of sockets to leave open in a free state. Only relevant if keepAlive is set to true. Default = 256.
         */
        maxFreeSockets?: number | undefined;
        /**
         * Socket timeout in milliseconds. This will set the timeout after the socket is connected.
         */
        timeout?: number | undefined;
        /**
         * Scheduling strategy to apply when picking the next free socket to use. Default: 'fifo'.
         */
        scheduling?: 'fifo' | 'lifo' | undefined;
    }

    class Agent {
        maxFreeSockets: number;
        maxSockets: number;
        maxTotalSockets: number;
        readonly freeSockets: NodeJS.ReadOnlyDict<Socket[]>;
        readonly sockets: NodeJS.ReadOnlyDict<Socket[]>;
        readonly requests: NodeJS.ReadOnlyDict<IncomingMessage[]>;

        constructor(opts?: AgentOptions);

        /**
         * Destroy any sockets that are currently in use by the agent.
         * It is usually not necessary to do this. However, if you are using an agent with KeepAlive enabled,
         * then it is best to explicitly shut down the agent when you know that it will no longer be used. Otherwise,
         * sockets may hang open for quite a long time before the server terminates them.
         */
        destroy(): void;
    }

    const METHODS: string[];

    const STATUS_CODES: {
        [errorCode: number]: string | undefined;
        [errorCode: string]: string | undefined;
    };

    function createServer(requestListener?: RequestListener): Server;
    function createServer(options: ServerOptions, requestListener?: RequestListener): Server;

    \/\/ although RequestOptions are passed as ClientRequestArgs to ClientRequest directly,
    \/\/ create interface RequestOptions would make the naming more clear to developers
    interface RequestOptions extends ClientRequestArgs { }
    function request(options: RequestOptions | string | URL, callback?: (res: IncomingMessage) => void): ClientRequest;
    function request(url: string | URL, options: RequestOptions, callback?: (res: IncomingMessage) => void): ClientRequest;
    function get(options: RequestOptions | string | URL, callback?: (res: IncomingMessage) => void): ClientRequest;
    function get(url: string | URL, options: RequestOptions, callback?: (res: IncomingMessage) => void): ClientRequest;
    let globalAgent: Agent;

    /**
     * Read-only property specifying the maximum allowed size of HTTP headers in bytes.
     * Defaults to 16KB. Configurable using the [\`--max-http-header-size\`][] CLI option.
     */
    const maxHeaderSize: number;
}
`;
definitions['http2.d.ts'] = `declare module 'http2' {
    import EventEmitter = require('events');
    import * as fs from 'fs';
    import * as net from 'net';
    import * as stream from 'stream';
    import * as tls from 'tls';
    import * as url from 'url';

    import {
        IncomingHttpHeaders as Http1IncomingHttpHeaders,
        OutgoingHttpHeaders,
        IncomingMessage,
        ServerResponse,
    } from 'http';
    export { OutgoingHttpHeaders } from 'http';

    export interface IncomingHttpStatusHeader {
        ":status"?: number | undefined;
    }

    export interface IncomingHttpHeaders extends Http1IncomingHttpHeaders {
        ":path"?: string | undefined;
        ":method"?: string | undefined;
        ":authority"?: string | undefined;
        ":scheme"?: string | undefined;
    }

    \/\/ Http2Stream

    export interface StreamPriorityOptions {
        exclusive?: boolean | undefined;
        parent?: number | undefined;
        weight?: number | undefined;
        silent?: boolean | undefined;
    }

    export interface StreamState {
        localWindowSize?: number | undefined;
        state?: number | undefined;
        localClose?: number | undefined;
        remoteClose?: number | undefined;
        sumDependencyWeight?: number | undefined;
        weight?: number | undefined;
    }

    export interface ServerStreamResponseOptions {
        endStream?: boolean | undefined;
        waitForTrailers?: boolean | undefined;
    }

    export interface StatOptions {
        offset: number;
        length: number;
    }

    export interface ServerStreamFileResponseOptions {
        statCheck?(stats: fs.Stats, headers: OutgoingHttpHeaders, statOptions: StatOptions): void | boolean;
        waitForTrailers?: boolean | undefined;
        offset?: number | undefined;
        length?: number | undefined;
    }

    export interface ServerStreamFileResponseOptionsWithError extends ServerStreamFileResponseOptions {
        onError?(err: NodeJS.ErrnoException): void;
    }

    export interface Http2Stream extends stream.Duplex {
        readonly aborted: boolean;
        readonly bufferSize: number;
        readonly closed: boolean;
        readonly destroyed: boolean;
        /**
         * Set the true if the END_STREAM flag was set in the request or response HEADERS frame received,
         * indicating that no additional data should be received and the readable side of the Http2Stream will be closed.
         */
        readonly endAfterHeaders: boolean;
        readonly id?: number | undefined;
        readonly pending: boolean;
        readonly rstCode: number;
        readonly sentHeaders: OutgoingHttpHeaders;
        readonly sentInfoHeaders?: OutgoingHttpHeaders[] | undefined;
        readonly sentTrailers?: OutgoingHttpHeaders | undefined;
        readonly session: Http2Session;
        readonly state: StreamState;

        close(code?: number, callback?: () => void): void;
        priority(options: StreamPriorityOptions): void;
        setTimeout(msecs: number, callback?: () => void): void;
        sendTrailers(headers: OutgoingHttpHeaders): void;

        addListener(event: "aborted", listener: () => void): this;
        addListener(event: "close", listener: () => void): this;
        addListener(event: "data", listener: (chunk: Buffer | string) => void): this;
        addListener(event: "drain", listener: () => void): this;
        addListener(event: "end", listener: () => void): this;
        addListener(event: "error", listener: (err: Error) => void): this;
        addListener(event: "finish", listener: () => void): this;
        addListener(event: "frameError", listener: (frameType: number, errorCode: number) => void): this;
        addListener(event: "pipe", listener: (src: stream.Readable) => void): this;
        addListener(event: "unpipe", listener: (src: stream.Readable) => void): this;
        addListener(event: "streamClosed", listener: (code: number) => void): this;
        addListener(event: "timeout", listener: () => void): this;
        addListener(event: "trailers", listener: (trailers: IncomingHttpHeaders, flags: number) => void): this;
        addListener(event: "wantTrailers", listener: () => void): this;
        addListener(event: string | symbol, listener: (...args: any[]) => void): this;

        emit(event: "aborted"): boolean;
        emit(event: "close"): boolean;
        emit(event: "data", chunk: Buffer | string): boolean;
        emit(event: "drain"): boolean;
        emit(event: "end"): boolean;
        emit(event: "error", err: Error): boolean;
        emit(event: "finish"): boolean;
        emit(event: "frameError", frameType: number, errorCode: number): boolean;
        emit(event: "pipe", src: stream.Readable): boolean;
        emit(event: "unpipe", src: stream.Readable): boolean;
        emit(event: "streamClosed", code: number): boolean;
        emit(event: "timeout"): boolean;
        emit(event: "trailers", trailers: IncomingHttpHeaders, flags: number): boolean;
        emit(event: "wantTrailers"): boolean;
        emit(event: string | symbol, ...args: any[]): boolean;

        on(event: "aborted", listener: () => void): this;
        on(event: "close", listener: () => void): this;
        on(event: "data", listener: (chunk: Buffer | string) => void): this;
        on(event: "drain", listener: () => void): this;
        on(event: "end", listener: () => void): this;
        on(event: "error", listener: (err: Error) => void): this;
        on(event: "finish", listener: () => void): this;
        on(event: "frameError", listener: (frameType: number, errorCode: number) => void): this;
        on(event: "pipe", listener: (src: stream.Readable) => void): this;
        on(event: "unpipe", listener: (src: stream.Readable) => void): this;
        on(event: "streamClosed", listener: (code: number) => void): this;
        on(event: "timeout", listener: () => void): this;
        on(event: "trailers", listener: (trailers: IncomingHttpHeaders, flags: number) => void): this;
        on(event: "wantTrailers", listener: () => void): this;
        on(event: string | symbol, listener: (...args: any[]) => void): this;

        once(event: "aborted", listener: () => void): this;
        once(event: "close", listener: () => void): this;
        once(event: "data", listener: (chunk: Buffer | string) => void): this;
        once(event: "drain", listener: () => void): this;
        once(event: "end", listener: () => void): this;
        once(event: "error", listener: (err: Error) => void): this;
        once(event: "finish", listener: () => void): this;
        once(event: "frameError", listener: (frameType: number, errorCode: number) => void): this;
        once(event: "pipe", listener: (src: stream.Readable) => void): this;
        once(event: "unpipe", listener: (src: stream.Readable) => void): this;
        once(event: "streamClosed", listener: (code: number) => void): this;
        once(event: "timeout", listener: () => void): this;
        once(event: "trailers", listener: (trailers: IncomingHttpHeaders, flags: number) => void): this;
        once(event: "wantTrailers", listener: () => void): this;
        once(event: string | symbol, listener: (...args: any[]) => void): this;

        prependListener(event: "aborted", listener: () => void): this;
        prependListener(event: "close", listener: () => void): this;
        prependListener(event: "data", listener: (chunk: Buffer | string) => void): this;
        prependListener(event: "drain", listener: () => void): this;
        prependListener(event: "end", listener: () => void): this;
        prependListener(event: "error", listener: (err: Error) => void): this;
        prependListener(event: "finish", listener: () => void): this;
        prependListener(event: "frameError", listener: (frameType: number, errorCode: number) => void): this;
        prependListener(event: "pipe", listener: (src: stream.Readable) => void): this;
        prependListener(event: "unpipe", listener: (src: stream.Readable) => void): this;
        prependListener(event: "streamClosed", listener: (code: number) => void): this;
        prependListener(event: "timeout", listener: () => void): this;
        prependListener(event: "trailers", listener: (trailers: IncomingHttpHeaders, flags: number) => void): this;
        prependListener(event: "wantTrailers", listener: () => void): this;
        prependListener(event: string | symbol, listener: (...args: any[]) => void): this;

        prependOnceListener(event: "aborted", listener: () => void): this;
        prependOnceListener(event: "close", listener: () => void): this;
        prependOnceListener(event: "data", listener: (chunk: Buffer | string) => void): this;
        prependOnceListener(event: "drain", listener: () => void): this;
        prependOnceListener(event: "end", listener: () => void): this;
        prependOnceListener(event: "error", listener: (err: Error) => void): this;
        prependOnceListener(event: "finish", listener: () => void): this;
        prependOnceListener(event: "frameError", listener: (frameType: number, errorCode: number) => void): this;
        prependOnceListener(event: "pipe", listener: (src: stream.Readable) => void): this;
        prependOnceListener(event: "unpipe", listener: (src: stream.Readable) => void): this;
        prependOnceListener(event: "streamClosed", listener: (code: number) => void): this;
        prependOnceListener(event: "timeout", listener: () => void): this;
        prependOnceListener(event: "trailers", listener: (trailers: IncomingHttpHeaders, flags: number) => void): this;
        prependOnceListener(event: "wantTrailers", listener: () => void): this;
        prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
    }

    export interface ClientHttp2Stream extends Http2Stream {
        addListener(event: "continue", listener: () => {}): this;
        addListener(event: "headers", listener: (headers: IncomingHttpHeaders & IncomingHttpStatusHeader, flags: number) => void): this;
        addListener(event: "push", listener: (headers: IncomingHttpHeaders, flags: number) => void): this;
        addListener(event: "response", listener: (headers: IncomingHttpHeaders & IncomingHttpStatusHeader, flags: number) => void): this;
        addListener(event: string | symbol, listener: (...args: any[]) => void): this;

        emit(event: "continue"): boolean;
        emit(event: "headers", headers: IncomingHttpHeaders & IncomingHttpStatusHeader, flags: number): boolean;
        emit(event: "push", headers: IncomingHttpHeaders, flags: number): boolean;
        emit(event: "response", headers: IncomingHttpHeaders & IncomingHttpStatusHeader, flags: number): boolean;
        emit(event: string | symbol, ...args: any[]): boolean;

        on(event: "continue", listener: () => {}): this;
        on(event: "headers", listener: (headers: IncomingHttpHeaders & IncomingHttpStatusHeader, flags: number) => void): this;
        on(event: "push", listener: (headers: IncomingHttpHeaders, flags: number) => void): this;
        on(event: "response", listener: (headers: IncomingHttpHeaders & IncomingHttpStatusHeader, flags: number) => void): this;
        on(event: string | symbol, listener: (...args: any[]) => void): this;

        once(event: "continue", listener: () => {}): this;
        once(event: "headers", listener: (headers: IncomingHttpHeaders & IncomingHttpStatusHeader, flags: number) => void): this;
        once(event: "push", listener: (headers: IncomingHttpHeaders, flags: number) => void): this;
        once(event: "response", listener: (headers: IncomingHttpHeaders & IncomingHttpStatusHeader, flags: number) => void): this;
        once(event: string | symbol, listener: (...args: any[]) => void): this;

        prependListener(event: "continue", listener: () => {}): this;
        prependListener(event: "headers", listener: (headers: IncomingHttpHeaders & IncomingHttpStatusHeader, flags: number) => void): this;
        prependListener(event: "push", listener: (headers: IncomingHttpHeaders, flags: number) => void): this;
        prependListener(event: "response", listener: (headers: IncomingHttpHeaders & IncomingHttpStatusHeader, flags: number) => void): this;
        prependListener(event: string | symbol, listener: (...args: any[]) => void): this;

        prependOnceListener(event: "continue", listener: () => {}): this;
        prependOnceListener(event: "headers", listener: (headers: IncomingHttpHeaders & IncomingHttpStatusHeader, flags: number) => void): this;
        prependOnceListener(event: "push", listener: (headers: IncomingHttpHeaders, flags: number) => void): this;
        prependOnceListener(event: "response", listener: (headers: IncomingHttpHeaders & IncomingHttpStatusHeader, flags: number) => void): this;
        prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
    }

    export interface ServerHttp2Stream extends Http2Stream {
        readonly headersSent: boolean;
        readonly pushAllowed: boolean;
        additionalHeaders(headers: OutgoingHttpHeaders): void;
        pushStream(headers: OutgoingHttpHeaders, callback?: (err: Error | null, pushStream: ServerHttp2Stream, headers: OutgoingHttpHeaders) => void): void;
        pushStream(headers: OutgoingHttpHeaders, options?: StreamPriorityOptions, callback?: (err: Error | null, pushStream: ServerHttp2Stream, headers: OutgoingHttpHeaders) => void): void;
        respond(headers?: OutgoingHttpHeaders, options?: ServerStreamResponseOptions): void;
        respondWithFD(fd: number | fs.promises.FileHandle, headers?: OutgoingHttpHeaders, options?: ServerStreamFileResponseOptions): void;
        respondWithFile(path: string, headers?: OutgoingHttpHeaders, options?: ServerStreamFileResponseOptionsWithError): void;
    }

    \/\/ Http2Session

    export interface Settings {
        headerTableSize?: number | undefined;
        enablePush?: boolean | undefined;
        initialWindowSize?: number | undefined;
        maxFrameSize?: number | undefined;
        maxConcurrentStreams?: number | undefined;
        maxHeaderListSize?: number | undefined;
        enableConnectProtocol?: boolean | undefined;
    }

    export interface ClientSessionRequestOptions {
        endStream?: boolean | undefined;
        exclusive?: boolean | undefined;
        parent?: number | undefined;
        weight?: number | undefined;
        waitForTrailers?: boolean | undefined;
    }

    export interface SessionState {
        effectiveLocalWindowSize?: number | undefined;
        effectiveRecvDataLength?: number | undefined;
        nextStreamID?: number | undefined;
        localWindowSize?: number | undefined;
        lastProcStreamID?: number | undefined;
        remoteWindowSize?: number | undefined;
        outboundQueueSize?: number | undefined;
        deflateDynamicTableSize?: number | undefined;
        inflateDynamicTableSize?: number | undefined;
    }

    export interface Http2Session extends EventEmitter {
        readonly alpnProtocol?: string | undefined;
        readonly closed: boolean;
        readonly connecting: boolean;
        readonly destroyed: boolean;
        readonly encrypted?: boolean | undefined;
        readonly localSettings: Settings;
        readonly originSet?: string[] | undefined;
        readonly pendingSettingsAck: boolean;
        readonly remoteSettings: Settings;
        readonly socket: net.Socket | tls.TLSSocket;
        readonly state: SessionState;
        readonly type: number;

        close(callback?: () => void): void;
        destroy(error?: Error, code?: number): void;
        goaway(code?: number, lastStreamID?: number, opaqueData?: NodeJS.ArrayBufferView): void;
        ping(callback: (err: Error | null, duration: number, payload: Buffer) => void): boolean;
        ping(payload: NodeJS.ArrayBufferView, callback: (err: Error | null, duration: number, payload: Buffer) => void): boolean;
        ref(): void;
        setLocalWindowSize(windowSize: number): void;
        setTimeout(msecs: number, callback?: () => void): void;
        settings(settings: Settings): void;
        unref(): void;

        addListener(event: "close", listener: () => void): this;
        addListener(event: "error", listener: (err: Error) => void): this;
        addListener(event: "frameError", listener: (frameType: number, errorCode: number, streamID: number) => void): this;
        addListener(event: "goaway", listener: (errorCode: number, lastStreamID: number, opaqueData: Buffer) => void): this;
        addListener(event: "localSettings", listener: (settings: Settings) => void): this;
        addListener(event: "ping", listener: () => void): this;
        addListener(event: "remoteSettings", listener: (settings: Settings) => void): this;
        addListener(event: "timeout", listener: () => void): this;
        addListener(event: string | symbol, listener: (...args: any[]) => void): this;

        emit(event: "close"): boolean;
        emit(event: "error", err: Error): boolean;
        emit(event: "frameError", frameType: number, errorCode: number, streamID: number): boolean;
        emit(event: "goaway", errorCode: number, lastStreamID: number, opaqueData: Buffer): boolean;
        emit(event: "localSettings", settings: Settings): boolean;
        emit(event: "ping"): boolean;
        emit(event: "remoteSettings", settings: Settings): boolean;
        emit(event: "timeout"): boolean;
        emit(event: string | symbol, ...args: any[]): boolean;

        on(event: "close", listener: () => void): this;
        on(event: "error", listener: (err: Error) => void): this;
        on(event: "frameError", listener: (frameType: number, errorCode: number, streamID: number) => void): this;
        on(event: "goaway", listener: (errorCode: number, lastStreamID: number, opaqueData: Buffer) => void): this;
        on(event: "localSettings", listener: (settings: Settings) => void): this;
        on(event: "ping", listener: () => void): this;
        on(event: "remoteSettings", listener: (settings: Settings) => void): this;
        on(event: "timeout", listener: () => void): this;
        on(event: string | symbol, listener: (...args: any[]) => void): this;

        once(event: "close", listener: () => void): this;
        once(event: "error", listener: (err: Error) => void): this;
        once(event: "frameError", listener: (frameType: number, errorCode: number, streamID: number) => void): this;
        once(event: "goaway", listener: (errorCode: number, lastStreamID: number, opaqueData: Buffer) => void): this;
        once(event: "localSettings", listener: (settings: Settings) => void): this;
        once(event: "ping", listener: () => void): this;
        once(event: "remoteSettings", listener: (settings: Settings) => void): this;
        once(event: "timeout", listener: () => void): this;
        once(event: string | symbol, listener: (...args: any[]) => void): this;

        prependListener(event: "close", listener: () => void): this;
        prependListener(event: "error", listener: (err: Error) => void): this;
        prependListener(event: "frameError", listener: (frameType: number, errorCode: number, streamID: number) => void): this;
        prependListener(event: "goaway", listener: (errorCode: number, lastStreamID: number, opaqueData: Buffer) => void): this;
        prependListener(event: "localSettings", listener: (settings: Settings) => void): this;
        prependListener(event: "ping", listener: () => void): this;
        prependListener(event: "remoteSettings", listener: (settings: Settings) => void): this;
        prependListener(event: "timeout", listener: () => void): this;
        prependListener(event: string | symbol, listener: (...args: any[]) => void): this;

        prependOnceListener(event: "close", listener: () => void): this;
        prependOnceListener(event: "error", listener: (err: Error) => void): this;
        prependOnceListener(event: "frameError", listener: (frameType: number, errorCode: number, streamID: number) => void): this;
        prependOnceListener(event: "goaway", listener: (errorCode: number, lastStreamID: number, opaqueData: Buffer) => void): this;
        prependOnceListener(event: "localSettings", listener: (settings: Settings) => void): this;
        prependOnceListener(event: "ping", listener: () => void): this;
        prependOnceListener(event: "remoteSettings", listener: (settings: Settings) => void): this;
        prependOnceListener(event: "timeout", listener: () => void): this;
        prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
    }

    export interface ClientHttp2Session extends Http2Session {
        request(headers?: OutgoingHttpHeaders, options?: ClientSessionRequestOptions): ClientHttp2Stream;

        addListener(event: "altsvc", listener: (alt: string, origin: string, stream: number) => void): this;
        addListener(event: "origin", listener: (origins: string[]) => void): this;
        addListener(event: "connect", listener: (session: ClientHttp2Session, socket: net.Socket | tls.TLSSocket) => void): this;
        addListener(event: "stream", listener: (stream: ClientHttp2Stream, headers: IncomingHttpHeaders & IncomingHttpStatusHeader, flags: number) => void): this;
        addListener(event: string | symbol, listener: (...args: any[]) => void): this;

        emit(event: "altsvc", alt: string, origin: string, stream: number): boolean;
        emit(event: "origin", origins: ReadonlyArray<string>): boolean;
        emit(event: "connect", session: ClientHttp2Session, socket: net.Socket | tls.TLSSocket): boolean;
        emit(event: "stream", stream: ClientHttp2Stream, headers: IncomingHttpHeaders & IncomingHttpStatusHeader, flags: number): boolean;
        emit(event: string | symbol, ...args: any[]): boolean;

        on(event: "altsvc", listener: (alt: string, origin: string, stream: number) => void): this;
        on(event: "origin", listener: (origins: string[]) => void): this;
        on(event: "connect", listener: (session: ClientHttp2Session, socket: net.Socket | tls.TLSSocket) => void): this;
        on(event: "stream", listener: (stream: ClientHttp2Stream, headers: IncomingHttpHeaders & IncomingHttpStatusHeader, flags: number) => void): this;
        on(event: string | symbol, listener: (...args: any[]) => void): this;

        once(event: "altsvc", listener: (alt: string, origin: string, stream: number) => void): this;
        once(event: "origin", listener: (origins: string[]) => void): this;
        once(event: "connect", listener: (session: ClientHttp2Session, socket: net.Socket | tls.TLSSocket) => void): this;
        once(event: "stream", listener: (stream: ClientHttp2Stream, headers: IncomingHttpHeaders & IncomingHttpStatusHeader, flags: number) => void): this;
        once(event: string | symbol, listener: (...args: any[]) => void): this;

        prependListener(event: "altsvc", listener: (alt: string, origin: string, stream: number) => void): this;
        prependListener(event: "origin", listener: (origins: string[]) => void): this;
        prependListener(event: "connect", listener: (session: ClientHttp2Session, socket: net.Socket | tls.TLSSocket) => void): this;
        prependListener(event: "stream", listener: (stream: ClientHttp2Stream, headers: IncomingHttpHeaders & IncomingHttpStatusHeader, flags: number) => void): this;
        prependListener(event: string | symbol, listener: (...args: any[]) => void): this;

        prependOnceListener(event: "altsvc", listener: (alt: string, origin: string, stream: number) => void): this;
        prependOnceListener(event: "origin", listener: (origins: string[]) => void): this;
        prependOnceListener(event: "connect", listener: (session: ClientHttp2Session, socket: net.Socket | tls.TLSSocket) => void): this;
        prependOnceListener(event: "stream", listener: (stream: ClientHttp2Stream, headers: IncomingHttpHeaders & IncomingHttpStatusHeader, flags: number) => void): this;
        prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
    }

    export interface AlternativeServiceOptions {
        origin: number | string | url.URL;
    }

    export interface ServerHttp2Session extends Http2Session {
        readonly server: Http2Server | Http2SecureServer;

        altsvc(alt: string, originOrStream: number | string | url.URL | AlternativeServiceOptions): void;
        origin(...args: Array<string | url.URL | { origin: string }>): void;

        addListener(event: "connect", listener: (session: ServerHttp2Session, socket: net.Socket | tls.TLSSocket) => void): this;
        addListener(event: "stream", listener: (stream: ServerHttp2Stream, headers: IncomingHttpHeaders, flags: number) => void): this;
        addListener(event: string | symbol, listener: (...args: any[]) => void): this;

        emit(event: "connect", session: ServerHttp2Session, socket: net.Socket | tls.TLSSocket): boolean;
        emit(event: "stream", stream: ServerHttp2Stream, headers: IncomingHttpHeaders, flags: number): boolean;
        emit(event: string | symbol, ...args: any[]): boolean;

        on(event: "connect", listener: (session: ServerHttp2Session, socket: net.Socket | tls.TLSSocket) => void): this;
        on(event: "stream", listener: (stream: ServerHttp2Stream, headers: IncomingHttpHeaders, flags: number) => void): this;
        on(event: string | symbol, listener: (...args: any[]) => void): this;

        once(event: "connect", listener: (session: ServerHttp2Session, socket: net.Socket | tls.TLSSocket) => void): this;
        once(event: "stream", listener: (stream: ServerHttp2Stream, headers: IncomingHttpHeaders, flags: number) => void): this;
        once(event: string | symbol, listener: (...args: any[]) => void): this;

        prependListener(event: "connect", listener: (session: ServerHttp2Session, socket: net.Socket | tls.TLSSocket) => void): this;
        prependListener(event: "stream", listener: (stream: ServerHttp2Stream, headers: IncomingHttpHeaders, flags: number) => void): this;
        prependListener(event: string | symbol, listener: (...args: any[]) => void): this;

        prependOnceListener(event: "connect", listener: (session: ServerHttp2Session, socket: net.Socket | tls.TLSSocket) => void): this;
        prependOnceListener(event: "stream", listener: (stream: ServerHttp2Stream, headers: IncomingHttpHeaders, flags: number) => void): this;
        prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
    }

    \/\/ Http2Server

    export interface SessionOptions {
        maxDeflateDynamicTableSize?: number | undefined;
        maxSessionMemory?: number | undefined;
        maxHeaderListPairs?: number | undefined;
        maxOutstandingPings?: number | undefined;
        maxSendHeaderBlockLength?: number | undefined;
        paddingStrategy?: number | undefined;
        peerMaxConcurrentStreams?: number | undefined;
        settings?: Settings | undefined;

        selectPadding?(frameLen: number, maxFrameLen: number): number;
        createConnection?(authority: url.URL, option: SessionOptions): stream.Duplex;
    }

    export interface ClientSessionOptions extends SessionOptions {
        maxReservedRemoteStreams?: number | undefined;
        createConnection?: ((authority: url.URL, option: SessionOptions) => stream.Duplex) | undefined;
        protocol?: 'http:' | 'https:' | undefined;
    }

    export interface ServerSessionOptions extends SessionOptions {
        Http1IncomingMessage?: typeof IncomingMessage | undefined;
        Http1ServerResponse?: typeof ServerResponse | undefined;
        Http2ServerRequest?: typeof Http2ServerRequest | undefined;
        Http2ServerResponse?: typeof Http2ServerResponse | undefined;
    }

    export interface SecureClientSessionOptions extends ClientSessionOptions, tls.ConnectionOptions { }
    export interface SecureServerSessionOptions extends ServerSessionOptions, tls.TlsOptions { }

    export interface ServerOptions extends ServerSessionOptions { }

    export interface SecureServerOptions extends SecureServerSessionOptions {
        allowHTTP1?: boolean | undefined;
        origins?: string[] | undefined;
    }

    export interface Http2Server extends net.Server {
        addListener(event: "checkContinue", listener: (request: Http2ServerRequest, response: Http2ServerResponse) => void): this;
        addListener(event: "request", listener: (request: Http2ServerRequest, response: Http2ServerResponse) => void): this;
        addListener(event: "session", listener: (session: ServerHttp2Session) => void): this;
        addListener(event: "sessionError", listener: (err: Error) => void): this;
        addListener(event: "stream", listener: (stream: ServerHttp2Stream, headers: IncomingHttpHeaders, flags: number) => void): this;
        addListener(event: "timeout", listener: () => void): this;
        addListener(event: string | symbol, listener: (...args: any[]) => void): this;

        emit(event: "checkContinue", request: Http2ServerRequest, response: Http2ServerResponse): boolean;
        emit(event: "request", request: Http2ServerRequest, response: Http2ServerResponse): boolean;
        emit(event: "session", session: ServerHttp2Session): boolean;
        emit(event: "sessionError", err: Error): boolean;
        emit(event: "stream", stream: ServerHttp2Stream, headers: IncomingHttpHeaders, flags: number): boolean;
        emit(event: "timeout"): boolean;
        emit(event: string | symbol, ...args: any[]): boolean;

        on(event: "checkContinue", listener: (request: Http2ServerRequest, response: Http2ServerResponse) => void): this;
        on(event: "request", listener: (request: Http2ServerRequest, response: Http2ServerResponse) => void): this;
        on(event: "session", listener: (session: ServerHttp2Session) => void): this;
        on(event: "sessionError", listener: (err: Error) => void): this;
        on(event: "stream", listener: (stream: ServerHttp2Stream, headers: IncomingHttpHeaders, flags: number) => void): this;
        on(event: "timeout", listener: () => void): this;
        on(event: string | symbol, listener: (...args: any[]) => void): this;

        once(event: "checkContinue", listener: (request: Http2ServerRequest, response: Http2ServerResponse) => void): this;
        once(event: "request", listener: (request: Http2ServerRequest, response: Http2ServerResponse) => void): this;
        once(event: "session", listener: (session: ServerHttp2Session) => void): this;
        once(event: "sessionError", listener: (err: Error) => void): this;
        once(event: "stream", listener: (stream: ServerHttp2Stream, headers: IncomingHttpHeaders, flags: number) => void): this;
        once(event: "timeout", listener: () => void): this;
        once(event: string | symbol, listener: (...args: any[]) => void): this;

        prependListener(event: "checkContinue", listener: (request: Http2ServerRequest, response: Http2ServerResponse) => void): this;
        prependListener(event: "request", listener: (request: Http2ServerRequest, response: Http2ServerResponse) => void): this;
        prependListener(event: "session", listener: (session: ServerHttp2Session) => void): this;
        prependListener(event: "sessionError", listener: (err: Error) => void): this;
        prependListener(event: "stream", listener: (stream: ServerHttp2Stream, headers: IncomingHttpHeaders, flags: number) => void): this;
        prependListener(event: "timeout", listener: () => void): this;
        prependListener(event: string | symbol, listener: (...args: any[]) => void): this;

        prependOnceListener(event: "checkContinue", listener: (request: Http2ServerRequest, response: Http2ServerResponse) => void): this;
        prependOnceListener(event: "request", listener: (request: Http2ServerRequest, response: Http2ServerResponse) => void): this;
        prependOnceListener(event: "session", listener: (session: ServerHttp2Session) => void): this;
        prependOnceListener(event: "sessionError", listener: (err: Error) => void): this;
        prependOnceListener(event: "stream", listener: (stream: ServerHttp2Stream, headers: IncomingHttpHeaders, flags: number) => void): this;
        prependOnceListener(event: "timeout", listener: () => void): this;
        prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;

        setTimeout(msec?: number, callback?: () => void): this;
    }

    export interface Http2SecureServer extends tls.Server {
        addListener(event: "checkContinue", listener: (request: Http2ServerRequest, response: Http2ServerResponse) => void): this;
        addListener(event: "request", listener: (request: Http2ServerRequest, response: Http2ServerResponse) => void): this;
        addListener(event: "session", listener: (session: ServerHttp2Session) => void): this;
        addListener(event: "sessionError", listener: (err: Error) => void): this;
        addListener(event: "stream", listener: (stream: ServerHttp2Stream, headers: IncomingHttpHeaders, flags: number) => void): this;
        addListener(event: "timeout", listener: () => void): this;
        addListener(event: "unknownProtocol", listener: (socket: tls.TLSSocket) => void): this;
        addListener(event: string | symbol, listener: (...args: any[]) => void): this;

        emit(event: "checkContinue", request: Http2ServerRequest, response: Http2ServerResponse): boolean;
        emit(event: "request", request: Http2ServerRequest, response: Http2ServerResponse): boolean;
        emit(event: "session", session: ServerHttp2Session): boolean;
        emit(event: "sessionError", err: Error): boolean;
        emit(event: "stream", stream: ServerHttp2Stream, headers: IncomingHttpHeaders, flags: number): boolean;
        emit(event: "timeout"): boolean;
        emit(event: "unknownProtocol", socket: tls.TLSSocket): boolean;
        emit(event: string | symbol, ...args: any[]): boolean;

        on(event: "checkContinue", listener: (request: Http2ServerRequest, response: Http2ServerResponse) => void): this;
        on(event: "request", listener: (request: Http2ServerRequest, response: Http2ServerResponse) => void): this;
        on(event: "session", listener: (session: ServerHttp2Session) => void): this;
        on(event: "sessionError", listener: (err: Error) => void): this;
        on(event: "stream", listener: (stream: ServerHttp2Stream, headers: IncomingHttpHeaders, flags: number) => void): this;
        on(event: "timeout", listener: () => void): this;
        on(event: "unknownProtocol", listener: (socket: tls.TLSSocket) => void): this;
        on(event: string | symbol, listener: (...args: any[]) => void): this;

        once(event: "checkContinue", listener: (request: Http2ServerRequest, response: Http2ServerResponse) => void): this;
        once(event: "request", listener: (request: Http2ServerRequest, response: Http2ServerResponse) => void): this;
        once(event: "session", listener: (session: ServerHttp2Session) => void): this;
        once(event: "sessionError", listener: (err: Error) => void): this;
        once(event: "stream", listener: (stream: ServerHttp2Stream, headers: IncomingHttpHeaders, flags: number) => void): this;
        once(event: "timeout", listener: () => void): this;
        once(event: "unknownProtocol", listener: (socket: tls.TLSSocket) => void): this;
        once(event: string | symbol, listener: (...args: any[]) => void): this;

        prependListener(event: "checkContinue", listener: (request: Http2ServerRequest, response: Http2ServerResponse) => void): this;
        prependListener(event: "request", listener: (request: Http2ServerRequest, response: Http2ServerResponse) => void): this;
        prependListener(event: "session", listener: (session: ServerHttp2Session) => void): this;
        prependListener(event: "sessionError", listener: (err: Error) => void): this;
        prependListener(event: "stream", listener: (stream: ServerHttp2Stream, headers: IncomingHttpHeaders, flags: number) => void): this;
        prependListener(event: "timeout", listener: () => void): this;
        prependListener(event: "unknownProtocol", listener: (socket: tls.TLSSocket) => void): this;
        prependListener(event: string | symbol, listener: (...args: any[]) => void): this;

        prependOnceListener(event: "checkContinue", listener: (request: Http2ServerRequest, response: Http2ServerResponse) => void): this;
        prependOnceListener(event: "request", listener: (request: Http2ServerRequest, response: Http2ServerResponse) => void): this;
        prependOnceListener(event: "session", listener: (session: ServerHttp2Session) => void): this;
        prependOnceListener(event: "sessionError", listener: (err: Error) => void): this;
        prependOnceListener(event: "stream", listener: (stream: ServerHttp2Stream, headers: IncomingHttpHeaders, flags: number) => void): this;
        prependOnceListener(event: "timeout", listener: () => void): this;
        prependOnceListener(event: "unknownProtocol", listener: (socket: tls.TLSSocket) => void): this;
        prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;

        setTimeout(msec?: number, callback?: () => void): this;
    }

    export class Http2ServerRequest extends stream.Readable {
        constructor(stream: ServerHttp2Stream, headers: IncomingHttpHeaders, options: stream.ReadableOptions, rawHeaders: ReadonlyArray<string>);

        readonly aborted: boolean;
        readonly authority: string;
        readonly connection: net.Socket | tls.TLSSocket;
        readonly complete: boolean;
        readonly headers: IncomingHttpHeaders;
        readonly httpVersion: string;
        readonly httpVersionMinor: number;
        readonly httpVersionMajor: number;
        readonly method: string;
        readonly rawHeaders: string[];
        readonly rawTrailers: string[];
        readonly scheme: string;
        readonly socket: net.Socket | tls.TLSSocket;
        readonly stream: ServerHttp2Stream;
        readonly trailers: IncomingHttpHeaders;
        readonly url: string;

        setTimeout(msecs: number, callback?: () => void): void;
        read(size?: number): Buffer | string | null;

        addListener(event: "aborted", listener: (hadError: boolean, code: number) => void): this;
        addListener(event: "close", listener: () => void): this;
        addListener(event: "data", listener: (chunk: Buffer | string) => void): this;
        addListener(event: "end", listener: () => void): this;
        addListener(event: "readable", listener: () => void): this;
        addListener(event: "error", listener: (err: Error) => void): this;
        addListener(event: string | symbol, listener: (...args: any[]) => void): this;

        emit(event: "aborted", hadError: boolean, code: number): boolean;
        emit(event: "close"): boolean;
        emit(event: "data", chunk: Buffer | string): boolean;
        emit(event: "end"): boolean;
        emit(event: "readable"): boolean;
        emit(event: "error", err: Error): boolean;
        emit(event: string | symbol, ...args: any[]): boolean;

        on(event: "aborted", listener: (hadError: boolean, code: number) => void): this;
        on(event: "close", listener: () => void): this;
        on(event: "data", listener: (chunk: Buffer | string) => void): this;
        on(event: "end", listener: () => void): this;
        on(event: "readable", listener: () => void): this;
        on(event: "error", listener: (err: Error) => void): this;
        on(event: string | symbol, listener: (...args: any[]) => void): this;

        once(event: "aborted", listener: (hadError: boolean, code: number) => void): this;
        once(event: "close", listener: () => void): this;
        once(event: "data", listener: (chunk: Buffer | string) => void): this;
        once(event: "end", listener: () => void): this;
        once(event: "readable", listener: () => void): this;
        once(event: "error", listener: (err: Error) => void): this;
        once(event: string | symbol, listener: (...args: any[]) => void): this;

        prependListener(event: "aborted", listener: (hadError: boolean, code: number) => void): this;
        prependListener(event: "close", listener: () => void): this;
        prependListener(event: "data", listener: (chunk: Buffer | string) => void): this;
        prependListener(event: "end", listener: () => void): this;
        prependListener(event: "readable", listener: () => void): this;
        prependListener(event: "error", listener: (err: Error) => void): this;
        prependListener(event: string | symbol, listener: (...args: any[]) => void): this;

        prependOnceListener(event: "aborted", listener: (hadError: boolean, code: number) => void): this;
        prependOnceListener(event: "close", listener: () => void): this;
        prependOnceListener(event: "data", listener: (chunk: Buffer | string) => void): this;
        prependOnceListener(event: "end", listener: () => void): this;
        prependOnceListener(event: "readable", listener: () => void): this;
        prependOnceListener(event: "error", listener: (err: Error) => void): this;
        prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
    }

    export class Http2ServerResponse extends stream.Writable {
        constructor(stream: ServerHttp2Stream);

        readonly connection: net.Socket | tls.TLSSocket;
        readonly finished: boolean;
        readonly headersSent: boolean;
        readonly socket: net.Socket | tls.TLSSocket;
        readonly stream: ServerHttp2Stream;
        sendDate: boolean;
        statusCode: number;
        statusMessage: '';
        addTrailers(trailers: OutgoingHttpHeaders): void;
        end(callback?: () => void): void;
        end(data: string | Uint8Array, callback?: () => void): void;
        end(data: string | Uint8Array, encoding: BufferEncoding, callback?: () => void): void;
        getHeader(name: string): string;
        getHeaderNames(): string[];
        getHeaders(): OutgoingHttpHeaders;
        hasHeader(name: string): boolean;
        removeHeader(name: string): void;
        setHeader(name: string, value: number | string | ReadonlyArray<string>): void;
        setTimeout(msecs: number, callback?: () => void): void;
        write(chunk: string | Uint8Array, callback?: (err: Error) => void): boolean;
        write(chunk: string | Uint8Array, encoding: BufferEncoding, callback?: (err: Error) => void): boolean;
        writeContinue(): void;
        writeHead(statusCode: number, headers?: OutgoingHttpHeaders): this;
        writeHead(statusCode: number, statusMessage: string, headers?: OutgoingHttpHeaders): this;
        createPushResponse(headers: OutgoingHttpHeaders, callback: (err: Error | null, res: Http2ServerResponse) => void): void;

        addListener(event: "close", listener: () => void): this;
        addListener(event: "drain", listener: () => void): this;
        addListener(event: "error", listener: (error: Error) => void): this;
        addListener(event: "finish", listener: () => void): this;
        addListener(event: "pipe", listener: (src: stream.Readable) => void): this;
        addListener(event: "unpipe", listener: (src: stream.Readable) => void): this;
        addListener(event: string | symbol, listener: (...args: any[]) => void): this;

        emit(event: "close"): boolean;
        emit(event: "drain"): boolean;
        emit(event: "error", error: Error): boolean;
        emit(event: "finish"): boolean;
        emit(event: "pipe", src: stream.Readable): boolean;
        emit(event: "unpipe", src: stream.Readable): boolean;
        emit(event: string | symbol, ...args: any[]): boolean;

        on(event: "close", listener: () => void): this;
        on(event: "drain", listener: () => void): this;
        on(event: "error", listener: (error: Error) => void): this;
        on(event: "finish", listener: () => void): this;
        on(event: "pipe", listener: (src: stream.Readable) => void): this;
        on(event: "unpipe", listener: (src: stream.Readable) => void): this;
        on(event: string | symbol, listener: (...args: any[]) => void): this;

        once(event: "close", listener: () => void): this;
        once(event: "drain", listener: () => void): this;
        once(event: "error", listener: (error: Error) => void): this;
        once(event: "finish", listener: () => void): this;
        once(event: "pipe", listener: (src: stream.Readable) => void): this;
        once(event: "unpipe", listener: (src: stream.Readable) => void): this;
        once(event: string | symbol, listener: (...args: any[]) => void): this;

        prependListener(event: "close", listener: () => void): this;
        prependListener(event: "drain", listener: () => void): this;
        prependListener(event: "error", listener: (error: Error) => void): this;
        prependListener(event: "finish", listener: () => void): this;
        prependListener(event: "pipe", listener: (src: stream.Readable) => void): this;
        prependListener(event: "unpipe", listener: (src: stream.Readable) => void): this;
        prependListener(event: string | symbol, listener: (...args: any[]) => void): this;

        prependOnceListener(event: "close", listener: () => void): this;
        prependOnceListener(event: "drain", listener: () => void): this;
        prependOnceListener(event: "error", listener: (error: Error) => void): this;
        prependOnceListener(event: "finish", listener: () => void): this;
        prependOnceListener(event: "pipe", listener: (src: stream.Readable) => void): this;
        prependOnceListener(event: "unpipe", listener: (src: stream.Readable) => void): this;
        prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
    }

    \/\/ Public API

    export namespace constants {
        const NGHTTP2_SESSION_SERVER: number;
        const NGHTTP2_SESSION_CLIENT: number;
        const NGHTTP2_STREAM_STATE_IDLE: number;
        const NGHTTP2_STREAM_STATE_OPEN: number;
        const NGHTTP2_STREAM_STATE_RESERVED_LOCAL: number;
        const NGHTTP2_STREAM_STATE_RESERVED_REMOTE: number;
        const NGHTTP2_STREAM_STATE_HALF_CLOSED_LOCAL: number;
        const NGHTTP2_STREAM_STATE_HALF_CLOSED_REMOTE: number;
        const NGHTTP2_STREAM_STATE_CLOSED: number;
        const NGHTTP2_NO_ERROR: number;
        const NGHTTP2_PROTOCOL_ERROR: number;
        const NGHTTP2_INTERNAL_ERROR: number;
        const NGHTTP2_FLOW_CONTROL_ERROR: number;
        const NGHTTP2_SETTINGS_TIMEOUT: number;
        const NGHTTP2_STREAM_CLOSED: number;
        const NGHTTP2_FRAME_SIZE_ERROR: number;
        const NGHTTP2_REFUSED_STREAM: number;
        const NGHTTP2_CANCEL: number;
        const NGHTTP2_COMPRESSION_ERROR: number;
        const NGHTTP2_CONNECT_ERROR: number;
        const NGHTTP2_ENHANCE_YOUR_CALM: number;
        const NGHTTP2_INADEQUATE_SECURITY: number;
        const NGHTTP2_HTTP_1_1_REQUIRED: number;
        const NGHTTP2_ERR_FRAME_SIZE_ERROR: number;
        const NGHTTP2_FLAG_NONE: number;
        const NGHTTP2_FLAG_END_STREAM: number;
        const NGHTTP2_FLAG_END_HEADERS: number;
        const NGHTTP2_FLAG_ACK: number;
        const NGHTTP2_FLAG_PADDED: number;
        const NGHTTP2_FLAG_PRIORITY: number;
        const DEFAULT_SETTINGS_HEADER_TABLE_SIZE: number;
        const DEFAULT_SETTINGS_ENABLE_PUSH: number;
        const DEFAULT_SETTINGS_INITIAL_WINDOW_SIZE: number;
        const DEFAULT_SETTINGS_MAX_FRAME_SIZE: number;
        const MAX_MAX_FRAME_SIZE: number;
        const MIN_MAX_FRAME_SIZE: number;
        const MAX_INITIAL_WINDOW_SIZE: number;
        const NGHTTP2_DEFAULT_WEIGHT: number;
        const NGHTTP2_SETTINGS_HEADER_TABLE_SIZE: number;
        const NGHTTP2_SETTINGS_ENABLE_PUSH: number;
        const NGHTTP2_SETTINGS_MAX_CONCURRENT_STREAMS: number;
        const NGHTTP2_SETTINGS_INITIAL_WINDOW_SIZE: number;
        const NGHTTP2_SETTINGS_MAX_FRAME_SIZE: number;
        const NGHTTP2_SETTINGS_MAX_HEADER_LIST_SIZE: number;
        const PADDING_STRATEGY_NONE: number;
        const PADDING_STRATEGY_MAX: number;
        const PADDING_STRATEGY_CALLBACK: number;
        const HTTP2_HEADER_STATUS: string;
        const HTTP2_HEADER_METHOD: string;
        const HTTP2_HEADER_AUTHORITY: string;
        const HTTP2_HEADER_SCHEME: string;
        const HTTP2_HEADER_PATH: string;
        const HTTP2_HEADER_ACCEPT_CHARSET: string;
        const HTTP2_HEADER_ACCEPT_ENCODING: string;
        const HTTP2_HEADER_ACCEPT_LANGUAGE: string;
        const HTTP2_HEADER_ACCEPT_RANGES: string;
        const HTTP2_HEADER_ACCEPT: string;
        const HTTP2_HEADER_ACCESS_CONTROL_ALLOW_ORIGIN: string;
        const HTTP2_HEADER_AGE: string;
        const HTTP2_HEADER_ALLOW: string;
        const HTTP2_HEADER_AUTHORIZATION: string;
        const HTTP2_HEADER_CACHE_CONTROL: string;
        const HTTP2_HEADER_CONNECTION: string;
        const HTTP2_HEADER_CONTENT_DISPOSITION: string;
        const HTTP2_HEADER_CONTENT_ENCODING: string;
        const HTTP2_HEADER_CONTENT_LANGUAGE: string;
        const HTTP2_HEADER_CONTENT_LENGTH: string;
        const HTTP2_HEADER_CONTENT_LOCATION: string;
        const HTTP2_HEADER_CONTENT_MD5: string;
        const HTTP2_HEADER_CONTENT_RANGE: string;
        const HTTP2_HEADER_CONTENT_TYPE: string;
        const HTTP2_HEADER_COOKIE: string;
        const HTTP2_HEADER_DATE: string;
        const HTTP2_HEADER_ETAG: string;
        const HTTP2_HEADER_EXPECT: string;
        const HTTP2_HEADER_EXPIRES: string;
        const HTTP2_HEADER_FROM: string;
        const HTTP2_HEADER_HOST: string;
        const HTTP2_HEADER_IF_MATCH: string;
        const HTTP2_HEADER_IF_MODIFIED_SINCE: string;
        const HTTP2_HEADER_IF_NONE_MATCH: string;
        const HTTP2_HEADER_IF_RANGE: string;
        const HTTP2_HEADER_IF_UNMODIFIED_SINCE: string;
        const HTTP2_HEADER_LAST_MODIFIED: string;
        const HTTP2_HEADER_LINK: string;
        const HTTP2_HEADER_LOCATION: string;
        const HTTP2_HEADER_MAX_FORWARDS: string;
        const HTTP2_HEADER_PREFER: string;
        const HTTP2_HEADER_PROXY_AUTHENTICATE: string;
        const HTTP2_HEADER_PROXY_AUTHORIZATION: string;
        const HTTP2_HEADER_RANGE: string;
        const HTTP2_HEADER_REFERER: string;
        const HTTP2_HEADER_REFRESH: string;
        const HTTP2_HEADER_RETRY_AFTER: string;
        const HTTP2_HEADER_SERVER: string;
        const HTTP2_HEADER_SET_COOKIE: string;
        const HTTP2_HEADER_STRICT_TRANSPORT_SECURITY: string;
        const HTTP2_HEADER_TRANSFER_ENCODING: string;
        const HTTP2_HEADER_TE: string;
        const HTTP2_HEADER_UPGRADE: string;
        const HTTP2_HEADER_USER_AGENT: string;
        const HTTP2_HEADER_VARY: string;
        const HTTP2_HEADER_VIA: string;
        const HTTP2_HEADER_WWW_AUTHENTICATE: string;
        const HTTP2_HEADER_HTTP2_SETTINGS: string;
        const HTTP2_HEADER_KEEP_ALIVE: string;
        const HTTP2_HEADER_PROXY_CONNECTION: string;
        const HTTP2_METHOD_ACL: string;
        const HTTP2_METHOD_BASELINE_CONTROL: string;
        const HTTP2_METHOD_BIND: string;
        const HTTP2_METHOD_CHECKIN: string;
        const HTTP2_METHOD_CHECKOUT: string;
        const HTTP2_METHOD_CONNECT: string;
        const HTTP2_METHOD_COPY: string;
        const HTTP2_METHOD_DELETE: string;
        const HTTP2_METHOD_GET: string;
        const HTTP2_METHOD_HEAD: string;
        const HTTP2_METHOD_LABEL: string;
        const HTTP2_METHOD_LINK: string;
        const HTTP2_METHOD_LOCK: string;
        const HTTP2_METHOD_MERGE: string;
        const HTTP2_METHOD_MKACTIVITY: string;
        const HTTP2_METHOD_MKCALENDAR: string;
        const HTTP2_METHOD_MKCOL: string;
        const HTTP2_METHOD_MKREDIRECTREF: string;
        const HTTP2_METHOD_MKWORKSPACE: string;
        const HTTP2_METHOD_MOVE: string;
        const HTTP2_METHOD_OPTIONS: string;
        const HTTP2_METHOD_ORDERPATCH: string;
        const HTTP2_METHOD_PATCH: string;
        const HTTP2_METHOD_POST: string;
        const HTTP2_METHOD_PRI: string;
        const HTTP2_METHOD_PROPFIND: string;
        const HTTP2_METHOD_PROPPATCH: string;
        const HTTP2_METHOD_PUT: string;
        const HTTP2_METHOD_REBIND: string;
        const HTTP2_METHOD_REPORT: string;
        const HTTP2_METHOD_SEARCH: string;
        const HTTP2_METHOD_TRACE: string;
        const HTTP2_METHOD_UNBIND: string;
        const HTTP2_METHOD_UNCHECKOUT: string;
        const HTTP2_METHOD_UNLINK: string;
        const HTTP2_METHOD_UNLOCK: string;
        const HTTP2_METHOD_UPDATE: string;
        const HTTP2_METHOD_UPDATEREDIRECTREF: string;
        const HTTP2_METHOD_VERSION_CONTROL: string;
        const HTTP_STATUS_CONTINUE: number;
        const HTTP_STATUS_SWITCHING_PROTOCOLS: number;
        const HTTP_STATUS_PROCESSING: number;
        const HTTP_STATUS_OK: number;
        const HTTP_STATUS_CREATED: number;
        const HTTP_STATUS_ACCEPTED: number;
        const HTTP_STATUS_NON_AUTHORITATIVE_INFORMATION: number;
        const HTTP_STATUS_NO_CONTENT: number;
        const HTTP_STATUS_RESET_CONTENT: number;
        const HTTP_STATUS_PARTIAL_CONTENT: number;
        const HTTP_STATUS_MULTI_STATUS: number;
        const HTTP_STATUS_ALREADY_REPORTED: number;
        const HTTP_STATUS_IM_USED: number;
        const HTTP_STATUS_MULTIPLE_CHOICES: number;
        const HTTP_STATUS_MOVED_PERMANENTLY: number;
        const HTTP_STATUS_FOUND: number;
        const HTTP_STATUS_SEE_OTHER: number;
        const HTTP_STATUS_NOT_MODIFIED: number;
        const HTTP_STATUS_USE_PROXY: number;
        const HTTP_STATUS_TEMPORARY_REDIRECT: number;
        const HTTP_STATUS_PERMANENT_REDIRECT: number;
        const HTTP_STATUS_BAD_REQUEST: number;
        const HTTP_STATUS_UNAUTHORIZED: number;
        const HTTP_STATUS_PAYMENT_REQUIRED: number;
        const HTTP_STATUS_FORBIDDEN: number;
        const HTTP_STATUS_NOT_FOUND: number;
        const HTTP_STATUS_METHOD_NOT_ALLOWED: number;
        const HTTP_STATUS_NOT_ACCEPTABLE: number;
        const HTTP_STATUS_PROXY_AUTHENTICATION_REQUIRED: number;
        const HTTP_STATUS_REQUEST_TIMEOUT: number;
        const HTTP_STATUS_CONFLICT: number;
        const HTTP_STATUS_GONE: number;
        const HTTP_STATUS_LENGTH_REQUIRED: number;
        const HTTP_STATUS_PRECONDITION_FAILED: number;
        const HTTP_STATUS_PAYLOAD_TOO_LARGE: number;
        const HTTP_STATUS_URI_TOO_LONG: number;
        const HTTP_STATUS_UNSUPPORTED_MEDIA_TYPE: number;
        const HTTP_STATUS_RANGE_NOT_SATISFIABLE: number;
        const HTTP_STATUS_EXPECTATION_FAILED: number;
        const HTTP_STATUS_TEAPOT: number;
        const HTTP_STATUS_MISDIRECTED_REQUEST: number;
        const HTTP_STATUS_UNPROCESSABLE_ENTITY: number;
        const HTTP_STATUS_LOCKED: number;
        const HTTP_STATUS_FAILED_DEPENDENCY: number;
        const HTTP_STATUS_UNORDERED_COLLECTION: number;
        const HTTP_STATUS_UPGRADE_REQUIRED: number;
        const HTTP_STATUS_PRECONDITION_REQUIRED: number;
        const HTTP_STATUS_TOO_MANY_REQUESTS: number;
        const HTTP_STATUS_REQUEST_HEADER_FIELDS_TOO_LARGE: number;
        const HTTP_STATUS_UNAVAILABLE_FOR_LEGAL_REASONS: number;
        const HTTP_STATUS_INTERNAL_SERVER_ERROR: number;
        const HTTP_STATUS_NOT_IMPLEMENTED: number;
        const HTTP_STATUS_BAD_GATEWAY: number;
        const HTTP_STATUS_SERVICE_UNAVAILABLE: number;
        const HTTP_STATUS_GATEWAY_TIMEOUT: number;
        const HTTP_STATUS_HTTP_VERSION_NOT_SUPPORTED: number;
        const HTTP_STATUS_VARIANT_ALSO_NEGOTIATES: number;
        const HTTP_STATUS_INSUFFICIENT_STORAGE: number;
        const HTTP_STATUS_LOOP_DETECTED: number;
        const HTTP_STATUS_BANDWIDTH_LIMIT_EXCEEDED: number;
        const HTTP_STATUS_NOT_EXTENDED: number;
        const HTTP_STATUS_NETWORK_AUTHENTICATION_REQUIRED: number;
    }

    export function getDefaultSettings(): Settings;
    export function getPackedSettings(settings: Settings): Buffer;
    export function getUnpackedSettings(buf: Uint8Array): Settings;

    export function createServer(onRequestHandler?: (request: Http2ServerRequest, response: Http2ServerResponse) => void): Http2Server;
    export function createServer(options: ServerOptions, onRequestHandler?: (request: Http2ServerRequest, response: Http2ServerResponse) => void): Http2Server;

    export function createSecureServer(onRequestHandler?: (request: Http2ServerRequest, response: Http2ServerResponse) => void): Http2SecureServer;
    export function createSecureServer(options: SecureServerOptions, onRequestHandler?: (request: Http2ServerRequest, response: Http2ServerResponse) => void): Http2SecureServer;

    export function connect(authority: string | url.URL, listener: (session: ClientHttp2Session, socket: net.Socket | tls.TLSSocket) => void): ClientHttp2Session;
    export function connect(
        authority: string | url.URL,
        options?: ClientSessionOptions | SecureClientSessionOptions,
        listener?: (session: ClientHttp2Session, socket: net.Socket | tls.TLSSocket) => void
    ): ClientHttp2Session;
}
`;
definitions['https.d.ts'] = `declare module 'https' {
    import { Duplex } from 'stream';
    import * as tls from 'tls';
    import * as http from 'http';
    import { URL } from 'url';

    type ServerOptions = tls.SecureContextOptions & tls.TlsOptions & http.ServerOptions;

    type RequestOptions = http.RequestOptions & tls.SecureContextOptions & {
        rejectUnauthorized?: boolean | undefined; \/\/ Defaults to true
        servername?: string | undefined; \/\/ SNI TLS Extension
    };

    interface AgentOptions extends http.AgentOptions, tls.ConnectionOptions {
        rejectUnauthorized?: boolean | undefined;
        maxCachedSessions?: number | undefined;
    }

    class Agent extends http.Agent {
        constructor(options?: AgentOptions);
        options: AgentOptions;
    }

    interface Server extends http.Server {}
    class Server extends tls.Server {
        constructor(requestListener?: http.RequestListener);
        constructor(options: ServerOptions, requestListener?: http.RequestListener);
        addListener(event: string, listener: (...args: any[]) => void): this;
        addListener(event: 'keylog', listener: (line: Buffer, tlsSocket: tls.TLSSocket) => void): this;
        addListener(event: 'newSession', listener: (sessionId: Buffer, sessionData: Buffer, callback: (err: Error, resp: Buffer) => void) => void): this;
        addListener(event: 'OCSPRequest', listener: (certificate: Buffer, issuer: Buffer, callback: (err: Error | null, resp: Buffer) => void) => void): this;
        addListener(event: 'resumeSession', listener: (sessionId: Buffer, callback: (err: Error, sessionData: Buffer) => void) => void): this;
        addListener(event: 'secureConnection', listener: (tlsSocket: tls.TLSSocket) => void): this;
        addListener(event: 'tlsClientError', listener: (err: Error, tlsSocket: tls.TLSSocket) => void): this;
        addListener(event: 'close', listener: () => void): this;
        addListener(event: 'connection', listener: (socket: Duplex) => void): this;
        addListener(event: 'error', listener: (err: Error) => void): this;
        addListener(event: 'listening', listener: () => void): this;
        addListener(event: 'checkContinue', listener: http.RequestListener): this;
        addListener(event: 'checkExpectation', listener: http.RequestListener): this;
        addListener(event: 'clientError', listener: (err: Error, socket: Duplex) => void): this;
        addListener(event: 'connect', listener: (req: http.IncomingMessage, socket: Duplex, head: Buffer) => void): this;
        addListener(event: 'request', listener: http.RequestListener): this;
        addListener(event: 'upgrade', listener: (req: http.IncomingMessage, socket: Duplex, head: Buffer) => void): this;
        emit(event: string, ...args: any[]): boolean;
        emit(event: 'keylog', line: Buffer, tlsSocket: tls.TLSSocket): boolean;
        emit(event: 'newSession', sessionId: Buffer, sessionData: Buffer, callback: (err: Error, resp: Buffer) => void): boolean;
        emit(event: 'OCSPRequest', certificate: Buffer, issuer: Buffer, callback: (err: Error | null, resp: Buffer) => void): boolean;
        emit(event: 'resumeSession', sessionId: Buffer, callback: (err: Error, sessionData: Buffer) => void): boolean;
        emit(event: 'secureConnection', tlsSocket: tls.TLSSocket): boolean;
        emit(event: 'tlsClientError', err: Error, tlsSocket: tls.TLSSocket): boolean;
        emit(event: 'close'): boolean;
        emit(event: 'connection', socket: Duplex): boolean;
        emit(event: 'error', err: Error): boolean;
        emit(event: 'listening'): boolean;
        emit(event: 'checkContinue', req: http.IncomingMessage, res: http.ServerResponse): boolean;
        emit(event: 'checkExpectation', req: http.IncomingMessage, res: http.ServerResponse): boolean;
        emit(event: 'clientError', err: Error, socket: Duplex): boolean;
        emit(event: 'connect', req: http.IncomingMessage, socket: Duplex, head: Buffer): boolean;
        emit(event: 'request', req: http.IncomingMessage, res: http.ServerResponse): boolean;
        emit(event: 'upgrade', req: http.IncomingMessage, socket: Duplex, head: Buffer): boolean;
        on(event: string, listener: (...args: any[]) => void): this;
        on(event: 'keylog', listener: (line: Buffer, tlsSocket: tls.TLSSocket) => void): this;
        on(event: 'newSession', listener: (sessionId: Buffer, sessionData: Buffer, callback: (err: Error, resp: Buffer) => void) => void): this;
        on(event: 'OCSPRequest', listener: (certificate: Buffer, issuer: Buffer, callback: (err: Error | null, resp: Buffer) => void) => void): this;
        on(event: 'resumeSession', listener: (sessionId: Buffer, callback: (err: Error, sessionData: Buffer) => void) => void): this;
        on(event: 'secureConnection', listener: (tlsSocket: tls.TLSSocket) => void): this;
        on(event: 'tlsClientError', listener: (err: Error, tlsSocket: tls.TLSSocket) => void): this;
        on(event: 'close', listener: () => void): this;
        on(event: 'connection', listener: (socket: Duplex) => void): this;
        on(event: 'error', listener: (err: Error) => void): this;
        on(event: 'listening', listener: () => void): this;
        on(event: 'checkContinue', listener: http.RequestListener): this;
        on(event: 'checkExpectation', listener: http.RequestListener): this;
        on(event: 'clientError', listener: (err: Error, socket: Duplex) => void): this;
        on(event: 'connect', listener: (req: http.IncomingMessage, socket: Duplex, head: Buffer) => void): this;
        on(event: 'request', listener: http.RequestListener): this;
        on(event: 'upgrade', listener: (req: http.IncomingMessage, socket: Duplex, head: Buffer) => void): this;
        once(event: string, listener: (...args: any[]) => void): this;
        once(event: 'keylog', listener: (line: Buffer, tlsSocket: tls.TLSSocket) => void): this;
        once(event: 'newSession', listener: (sessionId: Buffer, sessionData: Buffer, callback: (err: Error, resp: Buffer) => void) => void): this;
        once(event: 'OCSPRequest', listener: (certificate: Buffer, issuer: Buffer, callback: (err: Error | null, resp: Buffer) => void) => void): this;
        once(event: 'resumeSession', listener: (sessionId: Buffer, callback: (err: Error, sessionData: Buffer) => void) => void): this;
        once(event: 'secureConnection', listener: (tlsSocket: tls.TLSSocket) => void): this;
        once(event: 'tlsClientError', listener: (err: Error, tlsSocket: tls.TLSSocket) => void): this;
        once(event: 'close', listener: () => void): this;
        once(event: 'connection', listener: (socket: Duplex) => void): this;
        once(event: 'error', listener: (err: Error) => void): this;
        once(event: 'listening', listener: () => void): this;
        once(event: 'checkContinue', listener: http.RequestListener): this;
        once(event: 'checkExpectation', listener: http.RequestListener): this;
        once(event: 'clientError', listener: (err: Error, socket: Duplex) => void): this;
        once(event: 'connect', listener: (req: http.IncomingMessage, socket: Duplex, head: Buffer) => void): this;
        once(event: 'request', listener: http.RequestListener): this;
        once(event: 'upgrade', listener: (req: http.IncomingMessage, socket: Duplex, head: Buffer) => void): this;
        prependListener(event: string, listener: (...args: any[]) => void): this;
        prependListener(event: 'keylog', listener: (line: Buffer, tlsSocket: tls.TLSSocket) => void): this;
        prependListener(event: 'newSession', listener: (sessionId: Buffer, sessionData: Buffer, callback: (err: Error, resp: Buffer) => void) => void): this;
        prependListener(event: 'OCSPRequest', listener: (certificate: Buffer, issuer: Buffer, callback: (err: Error | null, resp: Buffer) => void) => void): this;
        prependListener(event: 'resumeSession', listener: (sessionId: Buffer, callback: (err: Error, sessionData: Buffer) => void) => void): this;
        prependListener(event: 'secureConnection', listener: (tlsSocket: tls.TLSSocket) => void): this;
        prependListener(event: 'tlsClientError', listener: (err: Error, tlsSocket: tls.TLSSocket) => void): this;
        prependListener(event: 'close', listener: () => void): this;
        prependListener(event: 'connection', listener: (socket: Duplex) => void): this;
        prependListener(event: 'error', listener: (err: Error) => void): this;
        prependListener(event: 'listening', listener: () => void): this;
        prependListener(event: 'checkContinue', listener: http.RequestListener): this;
        prependListener(event: 'checkExpectation', listener: http.RequestListener): this;
        prependListener(event: 'clientError', listener: (err: Error, socket: Duplex) => void): this;
        prependListener(event: 'connect', listener: (req: http.IncomingMessage, socket: Duplex, head: Buffer) => void): this;
        prependListener(event: 'request', listener: http.RequestListener): this;
        prependListener(event: 'upgrade', listener: (req: http.IncomingMessage, socket: Duplex, head: Buffer) => void): this;
        prependOnceListener(event: string, listener: (...args: any[]) => void): this;
        prependOnceListener(event: 'keylog', listener: (line: Buffer, tlsSocket: tls.TLSSocket) => void): this;
        prependOnceListener(event: 'newSession', listener: (sessionId: Buffer, sessionData: Buffer, callback: (err: Error, resp: Buffer) => void) => void): this;
        prependOnceListener(event: 'OCSPRequest', listener: (certificate: Buffer, issuer: Buffer, callback: (err: Error | null, resp: Buffer) => void) => void): this;
        prependOnceListener(event: 'resumeSession', listener: (sessionId: Buffer, callback: (err: Error, sessionData: Buffer) => void) => void): this;
        prependOnceListener(event: 'secureConnection', listener: (tlsSocket: tls.TLSSocket) => void): this;
        prependOnceListener(event: 'tlsClientError', listener: (err: Error, tlsSocket: tls.TLSSocket) => void): this;
        prependOnceListener(event: 'close', listener: () => void): this;
        prependOnceListener(event: 'connection', listener: (socket: Duplex) => void): this;
        prependOnceListener(event: 'error', listener: (err: Error) => void): this;
        prependOnceListener(event: 'listening', listener: () => void): this;
        prependOnceListener(event: 'checkContinue', listener: http.RequestListener): this;
        prependOnceListener(event: 'checkExpectation', listener: http.RequestListener): this;
        prependOnceListener(event: 'clientError', listener: (err: Error, socket: Duplex) => void): this;
        prependOnceListener(event: 'connect', listener: (req: http.IncomingMessage, socket: Duplex, head: Buffer) => void): this;
        prependOnceListener(event: 'request', listener: http.RequestListener): this;
        prependOnceListener(event: 'upgrade', listener: (req: http.IncomingMessage, socket: Duplex, head: Buffer) => void): this;
    }

    function createServer(requestListener?: http.RequestListener): Server;
    function createServer(options: ServerOptions, requestListener?: http.RequestListener): Server;
    function request(options: RequestOptions | string | URL, callback?: (res: http.IncomingMessage) => void): http.ClientRequest;
    function request(url: string | URL, options: RequestOptions, callback?: (res: http.IncomingMessage) => void): http.ClientRequest;
    function get(options: RequestOptions | string | URL, callback?: (res: http.IncomingMessage) => void): http.ClientRequest;
    function get(url: string | URL, options: RequestOptions, callback?: (res: http.IncomingMessage) => void): http.ClientRequest;
    let globalAgent: Agent;
}
`;
definitions['index.d.ts'] = `\/\/ Type definitions for non-npm package Node.js 14.17
\/\/ Project: https:\/\/nodejs.org/
\/\/ Definitions by: Microsoft TypeScript <https:\/\/github.com/Microsoft>
\/\/                 DefinitelyTyped <https:\/\/github.com/DefinitelyTyped>
\/\/                 Alberto Schiabel <https:\/\/github.com/jkomyno>
\/\/                 Alvis HT Tang <https:\/\/github.com/alvis>
\/\/                 Andrew Makarov <https:\/\/github.com/r3nya>
\/\/                 Benjamin Toueg <https:\/\/github.com/btoueg>
\/\/                 Chigozirim C. <https:\/\/github.com/smac89>
\/\/                 David Junger <https:\/\/github.com/touffy>
\/\/                 Deividas Bakanas <https:\/\/github.com/DeividasBakanas>
\/\/                 Eugene Y. Q. Shen <https:\/\/github.com/eyqs>
\/\/                 Hannes Magnusson <https:\/\/github.com/Hannes-Magnusson-CK>
\/\/                 Hoàng Văn Khải <https:\/\/github.com/KSXGitHub>
\/\/                 Huw <https:\/\/github.com/hoo29>
\/\/                 Kelvin Jin <https:\/\/github.com/kjin>
\/\/                 Klaus Meinhardt <https:\/\/github.com/ajafff>
\/\/                 Lishude <https:\/\/github.com/islishude>
\/\/                 Mariusz Wiktorczyk <https:\/\/github.com/mwiktorczyk>
\/\/                 Mohsen Azimi <https:\/\/github.com/mohsen1>
\/\/                 Nicolas Even <https:\/\/github.com/n-e>
\/\/                 Nikita Galkin <https:\/\/github.com/galkin>
\/\/                 Parambir Singh <https:\/\/github.com/parambirs>
\/\/                 Sebastian Silbermann <https:\/\/github.com/eps1lon>
\/\/                 Simon Schick <https:\/\/github.com/SimonSchick>
\/\/                 Thomas den Hollander <https:\/\/github.com/ThomasdenH>
\/\/                 Wilco Bakker <https:\/\/github.com/WilcoBakker>
\/\/                 wwwy3y3 <https:\/\/github.com/wwwy3y3>
\/\/                 Samuel Ainsworth <https:\/\/github.com/samuela>
\/\/                 Kyle Uehlein <https:\/\/github.com/kuehlein>
\/\/                 Thanik Bhongbhibhat <https:\/\/github.com/bhongy>
\/\/                 Marcin Kopacz <https:\/\/github.com/chyzwar>
\/\/                 Trivikram Kamat <https:\/\/github.com/trivikr>
\/\/                 Minh Son Nguyen <https:\/\/github.com/nguymin4>
\/\/                 Junxiao Shi <https:\/\/github.com/yoursunny>
\/\/                 Ilia Baryshnikov <https:\/\/github.com/qwelias>
\/\/                 ExE Boss <https:\/\/github.com/ExE-Boss>
\/\/                 Surasak Chaisurin <https:\/\/github.com/Ryan-Willpower>
\/\/                 Piotr Błażejewicz <https:\/\/github.com/peterblazejewicz>
\/\/                 Anna Henningsen <https:\/\/github.com/addaleax>
\/\/                 Victor Perin <https:\/\/github.com/victorperin>
\/\/                 Yongsheng Zhang <https:\/\/github.com/ZYSzys>
\/\/                 Bond <https:\/\/github.com/bondz>
\/\/ Definitions: https:\/\/github.com/DefinitelyTyped/DefinitelyTyped

\/\/ NOTE: These definitions support NodeJS and TypeScript 3.7+

\/\/ Reference required types from the default lib:
\/\// <reference lib="es2018" />
\/\// <reference lib="esnext.asynciterable" />
\/\// <reference lib="esnext.intl" />
\/\// <reference lib="esnext.bigint" />

\/\/ Base definitions for all NodeJS modules that are not specific to any version of TypeScript:
\/\// <reference path="assert.d.ts" />
\/\// <reference path="globals.d.ts" />
\/\// <reference path="async_hooks.d.ts" />
\/\// <reference path="buffer.d.ts" />
\/\// <reference path="child_process.d.ts" />
\/\// <reference path="cluster.d.ts" />
\/\// <reference path="console.d.ts" />
\/\// <reference path="constants.d.ts" />
\/\// <reference path="crypto.d.ts" />
\/\// <reference path="dgram.d.ts" />
\/\// <reference path="dns.d.ts" />
\/\// <reference path="domain.d.ts" />
\/\// <reference path="events.d.ts" />
\/\// <reference path="fs.d.ts" />
\/\// <reference path="fs/promises.d.ts" />
\/\// <reference path="http.d.ts" />
\/\// <reference path="http2.d.ts" />
\/\// <reference path="https.d.ts" />
\/\// <reference path="inspector.d.ts" />
\/\// <reference path="module.d.ts" />
\/\// <reference path="net.d.ts" />
\/\// <reference path="os.d.ts" />
\/\// <reference path="path.d.ts" />
\/\// <reference path="perf_hooks.d.ts" />
\/\// <reference path="process.d.ts" />
\/\// <reference path="punycode.d.ts" />
\/\// <reference path="querystring.d.ts" />
\/\// <reference path="readline.d.ts" />
\/\// <reference path="repl.d.ts" />
\/\// <reference path="stream.d.ts" />
\/\// <reference path="string_decoder.d.ts" />
\/\// <reference path="timers.d.ts" />
\/\// <reference path="tls.d.ts" />
\/\// <reference path="trace_events.d.ts" />
\/\// <reference path="tty.d.ts" />
\/\// <reference path="url.d.ts" />
\/\// <reference path="util.d.ts" />
\/\// <reference path="v8.d.ts" />
\/\// <reference path="vm.d.ts" />
\/\// <reference path="wasi.d.ts" />
\/\// <reference path="worker_threads.d.ts" />
\/\// <reference path="zlib.d.ts" />

\/\// <reference path="globals.global.d.ts" />
`;
definitions['inspector.d.ts'] = `\/\/ tslint:disable-next-line:dt-header
\/\/ Type definitions for inspector

\/\/ These definitions are auto-generated.
\/\/ Please see https:\/\/github.com/DefinitelyTyped/DefinitelyTyped/pull/19330
\/\/ for more information.

\/\/ tslint:disable:max-line-length

/**
 * The inspector module provides an API for interacting with the V8 inspector.
 */
declare module 'inspector' {
    import EventEmitter = require('events');

    interface InspectorNotification<T> {
        method: string;
        params: T;
    }

    namespace Schema {
        /**
         * Description of the protocol domain.
         */
        interface Domain {
            /**
             * Domain name.
             */
            name: string;
            /**
             * Domain version.
             */
            version: string;
        }

        interface GetDomainsReturnType {
            /**
             * List of supported domains.
             */
            domains: Domain[];
        }
    }

    namespace Runtime {
        /**
         * Unique script identifier.
         */
        type ScriptId = string;

        /**
         * Unique object identifier.
         */
        type RemoteObjectId = string;

        /**
         * Primitive value which cannot be JSON-stringified.
         */
        type UnserializableValue = string;

        /**
         * Mirror object referencing original JavaScript object.
         */
        interface RemoteObject {
            /**
             * Object type.
             */
            type: string;
            /**
             * Object subtype hint. Specified for <code>object</code> type values only.
             */
            subtype?: string | undefined;
            /**
             * Object class (constructor) name. Specified for <code>object</code> type values only.
             */
            className?: string | undefined;
            /**
             * Remote object value in case of primitive values or JSON values (if it was requested).
             */
            value?: any;
            /**
             * Primitive value which can not be JSON-stringified does not have <code>value</code>, but gets this property.
             */
            unserializableValue?: UnserializableValue | undefined;
            /**
             * String representation of the object.
             */
            description?: string | undefined;
            /**
             * Unique object identifier (for non-primitive values).
             */
            objectId?: RemoteObjectId | undefined;
            /**
             * Preview containing abbreviated property values. Specified for <code>object</code> type values only.
             * @experimental
             */
            preview?: ObjectPreview | undefined;
            /**
             * @experimental
             */
            customPreview?: CustomPreview | undefined;
        }

        /**
         * @experimental
         */
        interface CustomPreview {
            header: string;
            hasBody: boolean;
            formatterObjectId: RemoteObjectId;
            bindRemoteObjectFunctionId: RemoteObjectId;
            configObjectId?: RemoteObjectId | undefined;
        }

        /**
         * Object containing abbreviated remote object value.
         * @experimental
         */
        interface ObjectPreview {
            /**
             * Object type.
             */
            type: string;
            /**
             * Object subtype hint. Specified for <code>object</code> type values only.
             */
            subtype?: string | undefined;
            /**
             * String representation of the object.
             */
            description?: string | undefined;
            /**
             * True iff some of the properties or entries of the original object did not fit.
             */
            overflow: boolean;
            /**
             * List of the properties.
             */
            properties: PropertyPreview[];
            /**
             * List of the entries. Specified for <code>map</code> and <code>set</code> subtype values only.
             */
            entries?: EntryPreview[] | undefined;
        }

        /**
         * @experimental
         */
        interface PropertyPreview {
            /**
             * Property name.
             */
            name: string;
            /**
             * Object type. Accessor means that the property itself is an accessor property.
             */
            type: string;
            /**
             * User-friendly property value string.
             */
            value?: string | undefined;
            /**
             * Nested value preview.
             */
            valuePreview?: ObjectPreview | undefined;
            /**
             * Object subtype hint. Specified for <code>object</code> type values only.
             */
            subtype?: string | undefined;
        }

        /**
         * @experimental
         */
        interface EntryPreview {
            /**
             * Preview of the key. Specified for map-like collection entries.
             */
            key?: ObjectPreview | undefined;
            /**
             * Preview of the value.
             */
            value: ObjectPreview;
        }

        /**
         * Object property descriptor.
         */
        interface PropertyDescriptor {
            /**
             * Property name or symbol description.
             */
            name: string;
            /**
             * The value associated with the property.
             */
            value?: RemoteObject | undefined;
            /**
             * True if the value associated with the property may be changed (data descriptors only).
             */
            writable?: boolean | undefined;
            /**
             * A function which serves as a getter for the property, or <code>undefined</code> if there is no getter (accessor descriptors only).
             */
            get?: RemoteObject | undefined;
            /**
             * A function which serves as a setter for the property, or <code>undefined</code> if there is no setter (accessor descriptors only).
             */
            set?: RemoteObject | undefined;
            /**
             * True if the type of this property descriptor may be changed and if the property may be deleted from the corresponding object.
             */
            configurable: boolean;
            /**
             * True if this property shows up during enumeration of the properties on the corresponding object.
             */
            enumerable: boolean;
            /**
             * True if the result was thrown during the evaluation.
             */
            wasThrown?: boolean | undefined;
            /**
             * True if the property is owned for the object.
             */
            isOwn?: boolean | undefined;
            /**
             * Property symbol object, if the property is of the <code>symbol</code> type.
             */
            symbol?: RemoteObject | undefined;
        }

        /**
         * Object internal property descriptor. This property isn't normally visible in JavaScript code.
         */
        interface InternalPropertyDescriptor {
            /**
             * Conventional property name.
             */
            name: string;
            /**
             * The value associated with the property.
             */
            value?: RemoteObject | undefined;
        }

        /**
         * Represents function call argument. Either remote object id <code>objectId</code>, primitive <code>value</code>, unserializable primitive value or neither of (for undefined) them should be specified.
         */
        interface CallArgument {
            /**
             * Primitive value or serializable javascript object.
             */
            value?: any;
            /**
             * Primitive value which can not be JSON-stringified.
             */
            unserializableValue?: UnserializableValue | undefined;
            /**
             * Remote object handle.
             */
            objectId?: RemoteObjectId | undefined;
        }

        /**
         * Id of an execution context.
         */
        type ExecutionContextId = number;

        /**
         * Description of an isolated world.
         */
        interface ExecutionContextDescription {
            /**
             * Unique id of the execution context. It can be used to specify in which execution context script evaluation should be performed.
             */
            id: ExecutionContextId;
            /**
             * Execution context origin.
             */
            origin: string;
            /**
             * Human readable name describing given context.
             */
            name: string;
            /**
             * Embedder-specific auxiliary data.
             */
            auxData?: {} | undefined;
        }

        /**
         * Detailed information about exception (or error) that was thrown during script compilation or execution.
         */
        interface ExceptionDetails {
            /**
             * Exception id.
             */
            exceptionId: number;
            /**
             * Exception text, which should be used together with exception object when available.
             */
            text: string;
            /**
             * Line number of the exception location (0-based).
             */
            lineNumber: number;
            /**
             * Column number of the exception location (0-based).
             */
            columnNumber: number;
            /**
             * Script ID of the exception location.
             */
            scriptId?: ScriptId | undefined;
            /**
             * URL of the exception location, to be used when the script was not reported.
             */
            url?: string | undefined;
            /**
             * JavaScript stack trace if available.
             */
            stackTrace?: StackTrace | undefined;
            /**
             * Exception object if available.
             */
            exception?: RemoteObject | undefined;
            /**
             * Identifier of the context where exception happened.
             */
            executionContextId?: ExecutionContextId | undefined;
        }

        /**
         * Number of milliseconds since epoch.
         */
        type Timestamp = number;

        /**
         * Stack entry for runtime errors and assertions.
         */
        interface CallFrame {
            /**
             * JavaScript function name.
             */
            functionName: string;
            /**
             * JavaScript script id.
             */
            scriptId: ScriptId;
            /**
             * JavaScript script name or url.
             */
            url: string;
            /**
             * JavaScript script line number (0-based).
             */
            lineNumber: number;
            /**
             * JavaScript script column number (0-based).
             */
            columnNumber: number;
        }

        /**
         * Call frames for assertions or error messages.
         */
        interface StackTrace {
            /**
             * String label of this stack trace. For async traces this may be a name of the function that initiated the async call.
             */
            description?: string | undefined;
            /**
             * JavaScript function name.
             */
            callFrames: CallFrame[];
            /**
             * Asynchronous JavaScript stack trace that preceded this stack, if available.
             */
            parent?: StackTrace | undefined;
            /**
             * Asynchronous JavaScript stack trace that preceded this stack, if available.
             * @experimental
             */
            parentId?: StackTraceId | undefined;
        }

        /**
         * Unique identifier of current debugger.
         * @experimental
         */
        type UniqueDebuggerId = string;

        /**
         * If <code>debuggerId</code> is set stack trace comes from another debugger and can be resolved there. This allows to track cross-debugger calls. See <code>Runtime.StackTrace</code> and <code>Debugger.paused</code> for usages.
         * @experimental
         */
        interface StackTraceId {
            id: string;
            debuggerId?: UniqueDebuggerId | undefined;
        }

        interface EvaluateParameterType {
            /**
             * Expression to evaluate.
             */
            expression: string;
            /**
             * Symbolic group name that can be used to release multiple objects.
             */
            objectGroup?: string | undefined;
            /**
             * Determines whether Command Line API should be available during the evaluation.
             */
            includeCommandLineAPI?: boolean | undefined;
            /**
             * In silent mode exceptions thrown during evaluation are not reported and do not pause execution. Overrides <code>setPauseOnException</code> state.
             */
            silent?: boolean | undefined;
            /**
             * Specifies in which execution context to perform evaluation. If the parameter is omitted the evaluation will be performed in the context of the inspected page.
             */
            contextId?: ExecutionContextId | undefined;
            /**
             * Whether the result is expected to be a JSON object that should be sent by value.
             */
            returnByValue?: boolean | undefined;
            /**
             * Whether preview should be generated for the result.
             * @experimental
             */
            generatePreview?: boolean | undefined;
            /**
             * Whether execution should be treated as initiated by user in the UI.
             */
            userGesture?: boolean | undefined;
            /**
             * Whether execution should <code>await</code> for resulting value and return once awaited promise is resolved.
             */
            awaitPromise?: boolean | undefined;
        }

        interface AwaitPromiseParameterType {
            /**
             * Identifier of the promise.
             */
            promiseObjectId: RemoteObjectId;
            /**
             * Whether the result is expected to be a JSON object that should be sent by value.
             */
            returnByValue?: boolean | undefined;
            /**
             * Whether preview should be generated for the result.
             */
            generatePreview?: boolean | undefined;
        }

        interface CallFunctionOnParameterType {
            /**
             * Declaration of the function to call.
             */
            functionDeclaration: string;
            /**
             * Identifier of the object to call function on. Either objectId or executionContextId should be specified.
             */
            objectId?: RemoteObjectId | undefined;
            /**
             * Call arguments. All call arguments must belong to the same JavaScript world as the target object.
             */
            arguments?: CallArgument[] | undefined;
            /**
             * In silent mode exceptions thrown during evaluation are not reported and do not pause execution. Overrides <code>setPauseOnException</code> state.
             */
            silent?: boolean | undefined;
            /**
             * Whether the result is expected to be a JSON object which should be sent by value.
             */
            returnByValue?: boolean | undefined;
            /**
             * Whether preview should be generated for the result.
             * @experimental
             */
            generatePreview?: boolean | undefined;
            /**
             * Whether execution should be treated as initiated by user in the UI.
             */
            userGesture?: boolean | undefined;
            /**
             * Whether execution should <code>await</code> for resulting value and return once awaited promise is resolved.
             */
            awaitPromise?: boolean | undefined;
            /**
             * Specifies execution context which global object will be used to call function on. Either executionContextId or objectId should be specified.
             */
            executionContextId?: ExecutionContextId | undefined;
            /**
             * Symbolic group name that can be used to release multiple objects. If objectGroup is not specified and objectId is, objectGroup will be inherited from object.
             */
            objectGroup?: string | undefined;
        }

        interface GetPropertiesParameterType {
            /**
             * Identifier of the object to return properties for.
             */
            objectId: RemoteObjectId;
            /**
             * If true, returns properties belonging only to the element itself, not to its prototype chain.
             */
            ownProperties?: boolean | undefined;
            /**
             * If true, returns accessor properties (with getter/setter) only; internal properties are not returned either.
             * @experimental
             */
            accessorPropertiesOnly?: boolean | undefined;
            /**
             * Whether preview should be generated for the results.
             * @experimental
             */
            generatePreview?: boolean | undefined;
        }

        interface ReleaseObjectParameterType {
            /**
             * Identifier of the object to release.
             */
            objectId: RemoteObjectId;
        }

        interface ReleaseObjectGroupParameterType {
            /**
             * Symbolic object group name.
             */
            objectGroup: string;
        }

        interface SetCustomObjectFormatterEnabledParameterType {
            enabled: boolean;
        }

        interface CompileScriptParameterType {
            /**
             * Expression to compile.
             */
            expression: string;
            /**
             * Source url to be set for the script.
             */
            sourceURL: string;
            /**
             * Specifies whether the compiled script should be persisted.
             */
            persistScript: boolean;
            /**
             * Specifies in which execution context to perform script run. If the parameter is omitted the evaluation will be performed in the context of the inspected page.
             */
            executionContextId?: ExecutionContextId | undefined;
        }

        interface RunScriptParameterType {
            /**
             * Id of the script to run.
             */
            scriptId: ScriptId;
            /**
             * Specifies in which execution context to perform script run. If the parameter is omitted the evaluation will be performed in the context of the inspected page.
             */
            executionContextId?: ExecutionContextId | undefined;
            /**
             * Symbolic group name that can be used to release multiple objects.
             */
            objectGroup?: string | undefined;
            /**
             * In silent mode exceptions thrown during evaluation are not reported and do not pause execution. Overrides <code>setPauseOnException</code> state.
             */
            silent?: boolean | undefined;
            /**
             * Determines whether Command Line API should be available during the evaluation.
             */
            includeCommandLineAPI?: boolean | undefined;
            /**
             * Whether the result is expected to be a JSON object which should be sent by value.
             */
            returnByValue?: boolean | undefined;
            /**
             * Whether preview should be generated for the result.
             */
            generatePreview?: boolean | undefined;
            /**
             * Whether execution should <code>await</code> for resulting value and return once awaited promise is resolved.
             */
            awaitPromise?: boolean | undefined;
        }

        interface QueryObjectsParameterType {
            /**
             * Identifier of the prototype to return objects for.
             */
            prototypeObjectId: RemoteObjectId;
        }

        interface GlobalLexicalScopeNamesParameterType {
            /**
             * Specifies in which execution context to lookup global scope variables.
             */
            executionContextId?: ExecutionContextId | undefined;
        }

        interface EvaluateReturnType {
            /**
             * Evaluation result.
             */
            result: RemoteObject;
            /**
             * Exception details.
             */
            exceptionDetails?: ExceptionDetails | undefined;
        }

        interface AwaitPromiseReturnType {
            /**
             * Promise result. Will contain rejected value if promise was rejected.
             */
            result: RemoteObject;
            /**
             * Exception details if stack strace is available.
             */
            exceptionDetails?: ExceptionDetails | undefined;
        }

        interface CallFunctionOnReturnType {
            /**
             * Call result.
             */
            result: RemoteObject;
            /**
             * Exception details.
             */
            exceptionDetails?: ExceptionDetails | undefined;
        }

        interface GetPropertiesReturnType {
            /**
             * Object properties.
             */
            result: PropertyDescriptor[];
            /**
             * Internal object properties (only of the element itself).
             */
            internalProperties?: InternalPropertyDescriptor[] | undefined;
            /**
             * Exception details.
             */
            exceptionDetails?: ExceptionDetails | undefined;
        }

        interface CompileScriptReturnType {
            /**
             * Id of the script.
             */
            scriptId?: ScriptId | undefined;
            /**
             * Exception details.
             */
            exceptionDetails?: ExceptionDetails | undefined;
        }

        interface RunScriptReturnType {
            /**
             * Run result.
             */
            result: RemoteObject;
            /**
             * Exception details.
             */
            exceptionDetails?: ExceptionDetails | undefined;
        }

        interface QueryObjectsReturnType {
            /**
             * Array with objects.
             */
            objects: RemoteObject;
        }

        interface GlobalLexicalScopeNamesReturnType {
            names: string[];
        }

        interface ExecutionContextCreatedEventDataType {
            /**
             * A newly created execution context.
             */
            context: ExecutionContextDescription;
        }

        interface ExecutionContextDestroyedEventDataType {
            /**
             * Id of the destroyed context
             */
            executionContextId: ExecutionContextId;
        }

        interface ExceptionThrownEventDataType {
            /**
             * Timestamp of the exception.
             */
            timestamp: Timestamp;
            exceptionDetails: ExceptionDetails;
        }

        interface ExceptionRevokedEventDataType {
            /**
             * Reason describing why exception was revoked.
             */
            reason: string;
            /**
             * The id of revoked exception, as reported in <code>exceptionThrown</code>.
             */
            exceptionId: number;
        }

        interface ConsoleAPICalledEventDataType {
            /**
             * Type of the call.
             */
            type: string;
            /**
             * Call arguments.
             */
            args: RemoteObject[];
            /**
             * Identifier of the context where the call was made.
             */
            executionContextId: ExecutionContextId;
            /**
             * Call timestamp.
             */
            timestamp: Timestamp;
            /**
             * Stack trace captured when the call was made.
             */
            stackTrace?: StackTrace | undefined;
            /**
             * Console context descriptor for calls on non-default console context (not console.*): 'anonymous#unique-logger-id' for call on unnamed context, 'name#unique-logger-id' for call on named context.
             * @experimental
             */
            context?: string | undefined;
        }

        interface InspectRequestedEventDataType {
            object: RemoteObject;
            hints: {};
        }
    }

    namespace Debugger {
        /**
         * Breakpoint identifier.
         */
        type BreakpointId = string;

        /**
         * Call frame identifier.
         */
        type CallFrameId = string;

        /**
         * Location in the source code.
         */
        interface Location {
            /**
             * Script identifier as reported in the <code>Debugger.scriptParsed</code>.
             */
            scriptId: Runtime.ScriptId;
            /**
             * Line number in the script (0-based).
             */
            lineNumber: number;
            /**
             * Column number in the script (0-based).
             */
            columnNumber?: number | undefined;
        }

        /**
         * Location in the source code.
         * @experimental
         */
        interface ScriptPosition {
            lineNumber: number;
            columnNumber: number;
        }

        /**
         * JavaScript call frame. Array of call frames form the call stack.
         */
        interface CallFrame {
            /**
             * Call frame identifier. This identifier is only valid while the virtual machine is paused.
             */
            callFrameId: CallFrameId;
            /**
             * Name of the JavaScript function called on this call frame.
             */
            functionName: string;
            /**
             * Location in the source code.
             */
            functionLocation?: Location | undefined;
            /**
             * Location in the source code.
             */
            location: Location;
            /**
             * JavaScript script name or url.
             */
            url: string;
            /**
             * Scope chain for this call frame.
             */
            scopeChain: Scope[];
            /**
             * <code>this</code> object for this call frame.
             */
            this: Runtime.RemoteObject;
            /**
             * The value being returned, if the function is at return point.
             */
            returnValue?: Runtime.RemoteObject | undefined;
        }

        /**
         * Scope description.
         */
        interface Scope {
            /**
             * Scope type.
             */
            type: string;
            /**
             * Object representing the scope. For <code>global</code> and <code>with</code> scopes it represents the actual object; for the rest of the scopes, it is artificial transient object enumerating scope variables as its properties.
             */
            object: Runtime.RemoteObject;
            name?: string | undefined;
            /**
             * Location in the source code where scope starts
             */
            startLocation?: Location | undefined;
            /**
             * Location in the source code where scope ends
             */
            endLocation?: Location | undefined;
        }

        /**
         * Search match for resource.
         */
        interface SearchMatch {
            /**
             * Line number in resource content.
             */
            lineNumber: number;
            /**
             * Line with match content.
             */
            lineContent: string;
        }

        interface BreakLocation {
            /**
             * Script identifier as reported in the <code>Debugger.scriptParsed</code>.
             */
            scriptId: Runtime.ScriptId;
            /**
             * Line number in the script (0-based).
             */
            lineNumber: number;
            /**
             * Column number in the script (0-based).
             */
            columnNumber?: number | undefined;
            type?: string | undefined;
        }

        interface SetBreakpointsActiveParameterType {
            /**
             * New value for breakpoints active state.
             */
            active: boolean;
        }

        interface SetSkipAllPausesParameterType {
            /**
             * New value for skip pauses state.
             */
            skip: boolean;
        }

        interface SetBreakpointByUrlParameterType {
            /**
             * Line number to set breakpoint at.
             */
            lineNumber: number;
            /**
             * URL of the resources to set breakpoint on.
             */
            url?: string | undefined;
            /**
             * Regex pattern for the URLs of the resources to set breakpoints on. Either <code>url</code> or <code>urlRegex</code> must be specified.
             */
            urlRegex?: string | undefined;
            /**
             * Script hash of the resources to set breakpoint on.
             */
            scriptHash?: string | undefined;
            /**
             * Offset in the line to set breakpoint at.
             */
            columnNumber?: number | undefined;
            /**
             * Expression to use as a breakpoint condition. When specified, debugger will only stop on the breakpoint if this expression evaluates to true.
             */
            condition?: string | undefined;
        }

        interface SetBreakpointParameterType {
            /**
             * Location to set breakpoint in.
             */
            location: Location;
            /**
             * Expression to use as a breakpoint condition. When specified, debugger will only stop on the breakpoint if this expression evaluates to true.
             */
            condition?: string | undefined;
        }

        interface RemoveBreakpointParameterType {
            breakpointId: BreakpointId;
        }

        interface GetPossibleBreakpointsParameterType {
            /**
             * Start of range to search possible breakpoint locations in.
             */
            start: Location;
            /**
             * End of range to search possible breakpoint locations in (excluding). When not specified, end of scripts is used as end of range.
             */
            end?: Location | undefined;
            /**
             * Only consider locations which are in the same (non-nested) function as start.
             */
            restrictToFunction?: boolean | undefined;
        }

        interface ContinueToLocationParameterType {
            /**
             * Location to continue to.
             */
            location: Location;
            targetCallFrames?: string | undefined;
        }

        interface PauseOnAsyncCallParameterType {
            /**
             * Debugger will pause when async call with given stack trace is started.
             */
            parentStackTraceId: Runtime.StackTraceId;
        }

        interface StepIntoParameterType {
            /**
             * Debugger will issue additional Debugger.paused notification if any async task is scheduled before next pause.
             * @experimental
             */
            breakOnAsyncCall?: boolean | undefined;
        }

        interface GetStackTraceParameterType {
            stackTraceId: Runtime.StackTraceId;
        }

        interface SearchInContentParameterType {
            /**
             * Id of the script to search in.
             */
            scriptId: Runtime.ScriptId;
            /**
             * String to search for.
             */
            query: string;
            /**
             * If true, search is case sensitive.
             */
            caseSensitive?: boolean | undefined;
            /**
             * If true, treats string parameter as regex.
             */
            isRegex?: boolean | undefined;
        }

        interface SetScriptSourceParameterType {
            /**
             * Id of the script to edit.
             */
            scriptId: Runtime.ScriptId;
            /**
             * New content of the script.
             */
            scriptSource: string;
            /**
             *  If true the change will not actually be applied. Dry run may be used to get result description without actually modifying the code.
             */
            dryRun?: boolean | undefined;
        }

        interface RestartFrameParameterType {
            /**
             * Call frame identifier to evaluate on.
             */
            callFrameId: CallFrameId;
        }

        interface GetScriptSourceParameterType {
            /**
             * Id of the script to get source for.
             */
            scriptId: Runtime.ScriptId;
        }

        interface SetPauseOnExceptionsParameterType {
            /**
             * Pause on exceptions mode.
             */
            state: string;
        }

        interface EvaluateOnCallFrameParameterType {
            /**
             * Call frame identifier to evaluate on.
             */
            callFrameId: CallFrameId;
            /**
             * Expression to evaluate.
             */
            expression: string;
            /**
             * String object group name to put result into (allows rapid releasing resulting object handles using <code>releaseObjectGroup</code>).
             */
            objectGroup?: string | undefined;
            /**
             * Specifies whether command line API should be available to the evaluated expression, defaults to false.
             */
            includeCommandLineAPI?: boolean | undefined;
            /**
             * In silent mode exceptions thrown during evaluation are not reported and do not pause execution. Overrides <code>setPauseOnException</code> state.
             */
            silent?: boolean | undefined;
            /**
             * Whether the result is expected to be a JSON object that should be sent by value.
             */
            returnByValue?: boolean | undefined;
            /**
             * Whether preview should be generated for the result.
             * @experimental
             */
            generatePreview?: boolean | undefined;
            /**
             * Whether to throw an exception if side effect cannot be ruled out during evaluation.
             */
            throwOnSideEffect?: boolean | undefined;
        }

        interface SetVariableValueParameterType {
            /**
             * 0-based number of scope as was listed in scope chain. Only 'local', 'closure' and 'catch' scope types are allowed. Other scopes could be manipulated manually.
             */
            scopeNumber: number;
            /**
             * Variable name.
             */
            variableName: string;
            /**
             * New variable value.
             */
            newValue: Runtime.CallArgument;
            /**
             * Id of callframe that holds variable.
             */
            callFrameId: CallFrameId;
        }

        interface SetReturnValueParameterType {
            /**
             * New return value.
             */
            newValue: Runtime.CallArgument;
        }

        interface SetAsyncCallStackDepthParameterType {
            /**
             * Maximum depth of async call stacks. Setting to <code>0</code> will effectively disable collecting async call stacks (default).
             */
            maxDepth: number;
        }

        interface SetBlackboxPatternsParameterType {
            /**
             * Array of regexps that will be used to check script url for blackbox state.
             */
            patterns: string[];
        }

        interface SetBlackboxedRangesParameterType {
            /**
             * Id of the script.
             */
            scriptId: Runtime.ScriptId;
            positions: ScriptPosition[];
        }

        interface EnableReturnType {
            /**
             * Unique identifier of the debugger.
             * @experimental
             */
            debuggerId: Runtime.UniqueDebuggerId;
        }

        interface SetBreakpointByUrlReturnType {
            /**
             * Id of the created breakpoint for further reference.
             */
            breakpointId: BreakpointId;
            /**
             * List of the locations this breakpoint resolved into upon addition.
             */
            locations: Location[];
        }

        interface SetBreakpointReturnType {
            /**
             * Id of the created breakpoint for further reference.
             */
            breakpointId: BreakpointId;
            /**
             * Location this breakpoint resolved into.
             */
            actualLocation: Location;
        }

        interface GetPossibleBreakpointsReturnType {
            /**
             * List of the possible breakpoint locations.
             */
            locations: BreakLocation[];
        }

        interface GetStackTraceReturnType {
            stackTrace: Runtime.StackTrace;
        }

        interface SearchInContentReturnType {
            /**
             * List of search matches.
             */
            result: SearchMatch[];
        }

        interface SetScriptSourceReturnType {
            /**
             * New stack trace in case editing has happened while VM was stopped.
             */
            callFrames?: CallFrame[] | undefined;
            /**
             * Whether current call stack  was modified after applying the changes.
             */
            stackChanged?: boolean | undefined;
            /**
             * Async stack trace, if any.
             */
            asyncStackTrace?: Runtime.StackTrace | undefined;
            /**
             * Async stack trace, if any.
             * @experimental
             */
            asyncStackTraceId?: Runtime.StackTraceId | undefined;
            /**
             * Exception details if any.
             */
            exceptionDetails?: Runtime.ExceptionDetails | undefined;
        }

        interface RestartFrameReturnType {
            /**
             * New stack trace.
             */
            callFrames: CallFrame[];
            /**
             * Async stack trace, if any.
             */
            asyncStackTrace?: Runtime.StackTrace | undefined;
            /**
             * Async stack trace, if any.
             * @experimental
             */
            asyncStackTraceId?: Runtime.StackTraceId | undefined;
        }

        interface GetScriptSourceReturnType {
            /**
             * Script source.
             */
            scriptSource: string;
        }

        interface EvaluateOnCallFrameReturnType {
            /**
             * Object wrapper for the evaluation result.
             */
            result: Runtime.RemoteObject;
            /**
             * Exception details.
             */
            exceptionDetails?: Runtime.ExceptionDetails | undefined;
        }

        interface ScriptParsedEventDataType {
            /**
             * Identifier of the script parsed.
             */
            scriptId: Runtime.ScriptId;
            /**
             * URL or name of the script parsed (if any).
             */
            url: string;
            /**
             * Line offset of the script within the resource with given URL (for script tags).
             */
            startLine: number;
            /**
             * Column offset of the script within the resource with given URL.
             */
            startColumn: number;
            /**
             * Last line of the script.
             */
            endLine: number;
            /**
             * Length of the last line of the script.
             */
            endColumn: number;
            /**
             * Specifies script creation context.
             */
            executionContextId: Runtime.ExecutionContextId;
            /**
             * Content hash of the script.
             */
            hash: string;
            /**
             * Embedder-specific auxiliary data.
             */
            executionContextAuxData?: {} | undefined;
            /**
             * True, if this script is generated as a result of the live edit operation.
             * @experimental
             */
            isLiveEdit?: boolean | undefined;
            /**
             * URL of source map associated with script (if any).
             */
            sourceMapURL?: string | undefined;
            /**
             * True, if this script has sourceURL.
             */
            hasSourceURL?: boolean | undefined;
            /**
             * True, if this script is ES6 module.
             */
            isModule?: boolean | undefined;
            /**
             * This script length.
             */
            length?: number | undefined;
            /**
             * JavaScript top stack frame of where the script parsed event was triggered if available.
             * @experimental
             */
            stackTrace?: Runtime.StackTrace | undefined;
        }

        interface ScriptFailedToParseEventDataType {
            /**
             * Identifier of the script parsed.
             */
            scriptId: Runtime.ScriptId;
            /**
             * URL or name of the script parsed (if any).
             */
            url: string;
            /**
             * Line offset of the script within the resource with given URL (for script tags).
             */
            startLine: number;
            /**
             * Column offset of the script within the resource with given URL.
             */
            startColumn: number;
            /**
             * Last line of the script.
             */
            endLine: number;
            /**
             * Length of the last line of the script.
             */
            endColumn: number;
            /**
             * Specifies script creation context.
             */
            executionContextId: Runtime.ExecutionContextId;
            /**
             * Content hash of the script.
             */
            hash: string;
            /**
             * Embedder-specific auxiliary data.
             */
            executionContextAuxData?: {} | undefined;
            /**
             * URL of source map associated with script (if any).
             */
            sourceMapURL?: string | undefined;
            /**
             * True, if this script has sourceURL.
             */
            hasSourceURL?: boolean | undefined;
            /**
             * True, if this script is ES6 module.
             */
            isModule?: boolean | undefined;
            /**
             * This script length.
             */
            length?: number | undefined;
            /**
             * JavaScript top stack frame of where the script parsed event was triggered if available.
             * @experimental
             */
            stackTrace?: Runtime.StackTrace | undefined;
        }

        interface BreakpointResolvedEventDataType {
            /**
             * Breakpoint unique identifier.
             */
            breakpointId: BreakpointId;
            /**
             * Actual breakpoint location.
             */
            location: Location;
        }

        interface PausedEventDataType {
            /**
             * Call stack the virtual machine stopped on.
             */
            callFrames: CallFrame[];
            /**
             * Pause reason.
             */
            reason: string;
            /**
             * Object containing break-specific auxiliary properties.
             */
            data?: {} | undefined;
            /**
             * Hit breakpoints IDs
             */
            hitBreakpoints?: string[] | undefined;
            /**
             * Async stack trace, if any.
             */
            asyncStackTrace?: Runtime.StackTrace | undefined;
            /**
             * Async stack trace, if any.
             * @experimental
             */
            asyncStackTraceId?: Runtime.StackTraceId | undefined;
            /**
             * Just scheduled async call will have this stack trace as parent stack during async execution. This field is available only after <code>Debugger.stepInto</code> call with <code>breakOnAsynCall</code> flag.
             * @experimental
             */
            asyncCallStackTraceId?: Runtime.StackTraceId | undefined;
        }
    }

    namespace Console {
        /**
         * Console message.
         */
        interface ConsoleMessage {
            /**
             * Message source.
             */
            source: string;
            /**
             * Message severity.
             */
            level: string;
            /**
             * Message text.
             */
            text: string;
            /**
             * URL of the message origin.
             */
            url?: string | undefined;
            /**
             * Line number in the resource that generated this message (1-based).
             */
            line?: number | undefined;
            /**
             * Column number in the resource that generated this message (1-based).
             */
            column?: number | undefined;
        }

        interface MessageAddedEventDataType {
            /**
             * Console message that has been added.
             */
            message: ConsoleMessage;
        }
    }

    namespace Profiler {
        /**
         * Profile node. Holds callsite information, execution statistics and child nodes.
         */
        interface ProfileNode {
            /**
             * Unique id of the node.
             */
            id: number;
            /**
             * Function location.
             */
            callFrame: Runtime.CallFrame;
            /**
             * Number of samples where this node was on top of the call stack.
             */
            hitCount?: number | undefined;
            /**
             * Child node ids.
             */
            children?: number[] | undefined;
            /**
             * The reason of being not optimized. The function may be deoptimized or marked as don't optimize.
             */
            deoptReason?: string | undefined;
            /**
             * An array of source position ticks.
             */
            positionTicks?: PositionTickInfo[] | undefined;
        }

        /**
         * Profile.
         */
        interface Profile {
            /**
             * The list of profile nodes. First item is the root node.
             */
            nodes: ProfileNode[];
            /**
             * Profiling start timestamp in microseconds.
             */
            startTime: number;
            /**
             * Profiling end timestamp in microseconds.
             */
            endTime: number;
            /**
             * Ids of samples top nodes.
             */
            samples?: number[] | undefined;
            /**
             * Time intervals between adjacent samples in microseconds. The first delta is relative to the profile startTime.
             */
            timeDeltas?: number[] | undefined;
        }

        /**
         * Specifies a number of samples attributed to a certain source position.
         */
        interface PositionTickInfo {
            /**
             * Source line number (1-based).
             */
            line: number;
            /**
             * Number of samples attributed to the source line.
             */
            ticks: number;
        }

        /**
         * Coverage data for a source range.
         */
        interface CoverageRange {
            /**
             * JavaScript script source offset for the range start.
             */
            startOffset: number;
            /**
             * JavaScript script source offset for the range end.
             */
            endOffset: number;
            /**
             * Collected execution count of the source range.
             */
            count: number;
        }

        /**
         * Coverage data for a JavaScript function.
         */
        interface FunctionCoverage {
            /**
             * JavaScript function name.
             */
            functionName: string;
            /**
             * Source ranges inside the function with coverage data.
             */
            ranges: CoverageRange[];
            /**
             * Whether coverage data for this function has block granularity.
             */
            isBlockCoverage: boolean;
        }

        /**
         * Coverage data for a JavaScript script.
         */
        interface ScriptCoverage {
            /**
             * JavaScript script id.
             */
            scriptId: Runtime.ScriptId;
            /**
             * JavaScript script name or url.
             */
            url: string;
            /**
             * Functions contained in the script that has coverage data.
             */
            functions: FunctionCoverage[];
        }

        /**
         * Describes a type collected during runtime.
         * @experimental
         */
        interface TypeObject {
            /**
             * Name of a type collected with type profiling.
             */
            name: string;
        }

        /**
         * Source offset and types for a parameter or return value.
         * @experimental
         */
        interface TypeProfileEntry {
            /**
             * Source offset of the parameter or end of function for return values.
             */
            offset: number;
            /**
             * The types for this parameter or return value.
             */
            types: TypeObject[];
        }

        /**
         * Type profile data collected during runtime for a JavaScript script.
         * @experimental
         */
        interface ScriptTypeProfile {
            /**
             * JavaScript script id.
             */
            scriptId: Runtime.ScriptId;
            /**
             * JavaScript script name or url.
             */
            url: string;
            /**
             * Type profile entries for parameters and return values of the functions in the script.
             */
            entries: TypeProfileEntry[];
        }

        interface SetSamplingIntervalParameterType {
            /**
             * New sampling interval in microseconds.
             */
            interval: number;
        }

        interface StartPreciseCoverageParameterType {
            /**
             * Collect accurate call counts beyond simple 'covered' or 'not covered'.
             */
            callCount?: boolean | undefined;
            /**
             * Collect block-based coverage.
             */
            detailed?: boolean | undefined;
        }

        interface StopReturnType {
            /**
             * Recorded profile.
             */
            profile: Profile;
        }

        interface TakePreciseCoverageReturnType {
            /**
             * Coverage data for the current isolate.
             */
            result: ScriptCoverage[];
        }

        interface GetBestEffortCoverageReturnType {
            /**
             * Coverage data for the current isolate.
             */
            result: ScriptCoverage[];
        }

        interface TakeTypeProfileReturnType {
            /**
             * Type profile for all scripts since startTypeProfile() was turned on.
             */
            result: ScriptTypeProfile[];
        }

        interface ConsoleProfileStartedEventDataType {
            id: string;
            /**
             * Location of console.profile().
             */
            location: Debugger.Location;
            /**
             * Profile title passed as an argument to console.profile().
             */
            title?: string | undefined;
        }

        interface ConsoleProfileFinishedEventDataType {
            id: string;
            /**
             * Location of console.profileEnd().
             */
            location: Debugger.Location;
            profile: Profile;
            /**
             * Profile title passed as an argument to console.profile().
             */
            title?: string | undefined;
        }
    }

    namespace HeapProfiler {
        /**
         * Heap snapshot object id.
         */
        type HeapSnapshotObjectId = string;

        /**
         * Sampling Heap Profile node. Holds callsite information, allocation statistics and child nodes.
         */
        interface SamplingHeapProfileNode {
            /**
             * Function location.
             */
            callFrame: Runtime.CallFrame;
            /**
             * Allocations size in bytes for the node excluding children.
             */
            selfSize: number;
            /**
             * Child nodes.
             */
            children: SamplingHeapProfileNode[];
        }

        /**
         * Profile.
         */
        interface SamplingHeapProfile {
            head: SamplingHeapProfileNode;
        }

        interface StartTrackingHeapObjectsParameterType {
            trackAllocations?: boolean | undefined;
        }

        interface StopTrackingHeapObjectsParameterType {
            /**
             * If true 'reportHeapSnapshotProgress' events will be generated while snapshot is being taken when the tracking is stopped.
             */
            reportProgress?: boolean | undefined;
        }

        interface TakeHeapSnapshotParameterType {
            /**
             * If true 'reportHeapSnapshotProgress' events will be generated while snapshot is being taken.
             */
            reportProgress?: boolean | undefined;
        }

        interface GetObjectByHeapObjectIdParameterType {
            objectId: HeapSnapshotObjectId;
            /**
             * Symbolic group name that can be used to release multiple objects.
             */
            objectGroup?: string | undefined;
        }

        interface AddInspectedHeapObjectParameterType {
            /**
             * Heap snapshot object id to be accessible by means of \$x command line API.
             */
            heapObjectId: HeapSnapshotObjectId;
        }

        interface GetHeapObjectIdParameterType {
            /**
             * Identifier of the object to get heap object id for.
             */
            objectId: Runtime.RemoteObjectId;
        }

        interface StartSamplingParameterType {
            /**
             * Average sample interval in bytes. Poisson distribution is used for the intervals. The default value is 32768 bytes.
             */
            samplingInterval?: number | undefined;
        }

        interface GetObjectByHeapObjectIdReturnType {
            /**
             * Evaluation result.
             */
            result: Runtime.RemoteObject;
        }

        interface GetHeapObjectIdReturnType {
            /**
             * Id of the heap snapshot object corresponding to the passed remote object id.
             */
            heapSnapshotObjectId: HeapSnapshotObjectId;
        }

        interface StopSamplingReturnType {
            /**
             * Recorded sampling heap profile.
             */
            profile: SamplingHeapProfile;
        }

        interface GetSamplingProfileReturnType {
            /**
             * Return the sampling profile being collected.
             */
            profile: SamplingHeapProfile;
        }

        interface AddHeapSnapshotChunkEventDataType {
            chunk: string;
        }

        interface ReportHeapSnapshotProgressEventDataType {
            done: number;
            total: number;
            finished?: boolean | undefined;
        }

        interface LastSeenObjectIdEventDataType {
            lastSeenObjectId: number;
            timestamp: number;
        }

        interface HeapStatsUpdateEventDataType {
            /**
             * An array of triplets. Each triplet describes a fragment. The first integer is the fragment index, the second integer is a total count of objects for the fragment, the third integer is a total size of the objects for the fragment.
             */
            statsUpdate: number[];
        }
    }

    namespace NodeTracing {
        interface TraceConfig {
            /**
             * Controls how the trace buffer stores data.
             */
            recordMode?: string | undefined;
            /**
             * Included category filters.
             */
            includedCategories: string[];
        }

        interface StartParameterType {
            traceConfig: TraceConfig;
        }

        interface GetCategoriesReturnType {
            /**
             * A list of supported tracing categories.
             */
            categories: string[];
        }

        interface DataCollectedEventDataType {
            value: Array<{}>;
        }
    }

    namespace NodeWorker {
        type WorkerID = string;

        /**
         * Unique identifier of attached debugging session.
         */
        type SessionID = string;

        interface WorkerInfo {
            workerId: WorkerID;
            type: string;
            title: string;
            url: string;
        }

        interface SendMessageToWorkerParameterType {
            message: string;
            /**
             * Identifier of the session.
             */
            sessionId: SessionID;
        }

        interface EnableParameterType {
            /**
             * Whether to new workers should be paused until the frontend sends \`Runtime.runIfWaitingForDebugger\`
             * message to run them.
             */
            waitForDebuggerOnStart: boolean;
        }

        interface DetachParameterType {
            sessionId: SessionID;
        }

        interface AttachedToWorkerEventDataType {
            /**
             * Identifier assigned to the session used to send/receive messages.
             */
            sessionId: SessionID;
            workerInfo: WorkerInfo;
            waitingForDebugger: boolean;
        }

        interface DetachedFromWorkerEventDataType {
            /**
             * Detached session identifier.
             */
            sessionId: SessionID;
        }

        interface ReceivedMessageFromWorkerEventDataType {
            /**
             * Identifier of a session which sends a message.
             */
            sessionId: SessionID;
            message: string;
        }
    }

    namespace NodeRuntime {
        interface NotifyWhenWaitingForDisconnectParameterType {
            enabled: boolean;
        }
    }

    /**
     * The inspector.Session is used for dispatching messages to the V8 inspector back-end and receiving message responses and notifications.
     */
    class Session extends EventEmitter {
        /**
         * Create a new instance of the inspector.Session class.
         * The inspector session needs to be connected through session.connect() before the messages can be dispatched to the inspector backend.
         */
        constructor();

        /**
         * Connects a session to the inspector back-end.
         */
        connect(): void;

        /**
         * Connects a session to the main thread inspector back-end.
         * An exception will be thrown if this API was not called on a Worker
         * thread.
         * @since 12.11.0
         */
        connectToMainThread(): void;

        /**
         * Immediately close the session. All pending message callbacks will be called with an error.
         * session.connect() will need to be called to be able to send messages again.
         * Reconnected session will lose all inspector state, such as enabled agents or configured breakpoints.
         */
        disconnect(): void;

        /**
         * Posts a message to the inspector back-end. callback will be notified when a response is received.
         * callback is a function that accepts two optional arguments - error and message-specific result.
         */
        post(method: string, params?: {}, callback?: (err: Error | null, params?: {}) => void): void;
        post(method: string, callback?: (err: Error | null, params?: {}) => void): void;

        /**
         * Returns supported domains.
         */
        post(method: "Schema.getDomains", callback?: (err: Error | null, params: Schema.GetDomainsReturnType) => void): void;

        /**
         * Evaluates expression on global object.
         */
        post(method: "Runtime.evaluate", params?: Runtime.EvaluateParameterType, callback?: (err: Error | null, params: Runtime.EvaluateReturnType) => void): void;
        post(method: "Runtime.evaluate", callback?: (err: Error | null, params: Runtime.EvaluateReturnType) => void): void;

        /**
         * Add handler to promise with given promise object id.
         */
        post(method: "Runtime.awaitPromise", params?: Runtime.AwaitPromiseParameterType, callback?: (err: Error | null, params: Runtime.AwaitPromiseReturnType) => void): void;
        post(method: "Runtime.awaitPromise", callback?: (err: Error | null, params: Runtime.AwaitPromiseReturnType) => void): void;

        /**
         * Calls function with given declaration on the given object. Object group of the result is inherited from the target object.
         */
        post(method: "Runtime.callFunctionOn", params?: Runtime.CallFunctionOnParameterType, callback?: (err: Error | null, params: Runtime.CallFunctionOnReturnType) => void): void;
        post(method: "Runtime.callFunctionOn", callback?: (err: Error | null, params: Runtime.CallFunctionOnReturnType) => void): void;

        /**
         * Returns properties of a given object. Object group of the result is inherited from the target object.
         */
        post(method: "Runtime.getProperties", params?: Runtime.GetPropertiesParameterType, callback?: (err: Error | null, params: Runtime.GetPropertiesReturnType) => void): void;
        post(method: "Runtime.getProperties", callback?: (err: Error | null, params: Runtime.GetPropertiesReturnType) => void): void;

        /**
         * Releases remote object with given id.
         */
        post(method: "Runtime.releaseObject", params?: Runtime.ReleaseObjectParameterType, callback?: (err: Error | null) => void): void;
        post(method: "Runtime.releaseObject", callback?: (err: Error | null) => void): void;

        /**
         * Releases all remote objects that belong to a given group.
         */
        post(method: "Runtime.releaseObjectGroup", params?: Runtime.ReleaseObjectGroupParameterType, callback?: (err: Error | null) => void): void;
        post(method: "Runtime.releaseObjectGroup", callback?: (err: Error | null) => void): void;

        /**
         * Tells inspected instance to run if it was waiting for debugger to attach.
         */
        post(method: "Runtime.runIfWaitingForDebugger", callback?: (err: Error | null) => void): void;

        /**
         * Enables reporting of execution contexts creation by means of <code>executionContextCreated</code> event. When the reporting gets enabled the event will be sent immediately for each existing execution context.
         */
        post(method: "Runtime.enable", callback?: (err: Error | null) => void): void;

        /**
         * Disables reporting of execution contexts creation.
         */
        post(method: "Runtime.disable", callback?: (err: Error | null) => void): void;

        /**
         * Discards collected exceptions and console API calls.
         */
        post(method: "Runtime.discardConsoleEntries", callback?: (err: Error | null) => void): void;

        /**
         * @experimental
         */
        post(method: "Runtime.setCustomObjectFormatterEnabled", params?: Runtime.SetCustomObjectFormatterEnabledParameterType, callback?: (err: Error | null) => void): void;
        post(method: "Runtime.setCustomObjectFormatterEnabled", callback?: (err: Error | null) => void): void;

        /**
         * Compiles expression.
         */
        post(method: "Runtime.compileScript", params?: Runtime.CompileScriptParameterType, callback?: (err: Error | null, params: Runtime.CompileScriptReturnType) => void): void;
        post(method: "Runtime.compileScript", callback?: (err: Error | null, params: Runtime.CompileScriptReturnType) => void): void;

        /**
         * Runs script with given id in a given context.
         */
        post(method: "Runtime.runScript", params?: Runtime.RunScriptParameterType, callback?: (err: Error | null, params: Runtime.RunScriptReturnType) => void): void;
        post(method: "Runtime.runScript", callback?: (err: Error | null, params: Runtime.RunScriptReturnType) => void): void;

        post(method: "Runtime.queryObjects", params?: Runtime.QueryObjectsParameterType, callback?: (err: Error | null, params: Runtime.QueryObjectsReturnType) => void): void;
        post(method: "Runtime.queryObjects", callback?: (err: Error | null, params: Runtime.QueryObjectsReturnType) => void): void;

        /**
         * Returns all let, const and class variables from global scope.
         */
        post(
            method: "Runtime.globalLexicalScopeNames",
            params?: Runtime.GlobalLexicalScopeNamesParameterType,
            callback?: (err: Error | null, params: Runtime.GlobalLexicalScopeNamesReturnType) => void
        ): void;
        post(method: "Runtime.globalLexicalScopeNames", callback?: (err: Error | null, params: Runtime.GlobalLexicalScopeNamesReturnType) => void): void;

        /**
         * Enables debugger for the given page. Clients should not assume that the debugging has been enabled until the result for this command is received.
         */
        post(method: "Debugger.enable", callback?: (err: Error | null, params: Debugger.EnableReturnType) => void): void;

        /**
         * Disables debugger for given page.
         */
        post(method: "Debugger.disable", callback?: (err: Error | null) => void): void;

        /**
         * Activates / deactivates all breakpoints on the page.
         */
        post(method: "Debugger.setBreakpointsActive", params?: Debugger.SetBreakpointsActiveParameterType, callback?: (err: Error | null) => void): void;
        post(method: "Debugger.setBreakpointsActive", callback?: (err: Error | null) => void): void;

        /**
         * Makes page not interrupt on any pauses (breakpoint, exception, dom exception etc).
         */
        post(method: "Debugger.setSkipAllPauses", params?: Debugger.SetSkipAllPausesParameterType, callback?: (err: Error | null) => void): void;
        post(method: "Debugger.setSkipAllPauses", callback?: (err: Error | null) => void): void;

        /**
         * Sets JavaScript breakpoint at given location specified either by URL or URL regex. Once this command is issued, all existing parsed scripts will have breakpoints resolved and returned in <code>locations</code> property. Further matching script parsing will result in subsequent <code>breakpointResolved</code> events issued. This logical breakpoint will survive page reloads.
         */
        post(method: "Debugger.setBreakpointByUrl", params?: Debugger.SetBreakpointByUrlParameterType, callback?: (err: Error | null, params: Debugger.SetBreakpointByUrlReturnType) => void): void;
        post(method: "Debugger.setBreakpointByUrl", callback?: (err: Error | null, params: Debugger.SetBreakpointByUrlReturnType) => void): void;

        /**
         * Sets JavaScript breakpoint at a given location.
         */
        post(method: "Debugger.setBreakpoint", params?: Debugger.SetBreakpointParameterType, callback?: (err: Error | null, params: Debugger.SetBreakpointReturnType) => void): void;
        post(method: "Debugger.setBreakpoint", callback?: (err: Error | null, params: Debugger.SetBreakpointReturnType) => void): void;

        /**
         * Removes JavaScript breakpoint.
         */
        post(method: "Debugger.removeBreakpoint", params?: Debugger.RemoveBreakpointParameterType, callback?: (err: Error | null) => void): void;
        post(method: "Debugger.removeBreakpoint", callback?: (err: Error | null) => void): void;

        /**
         * Returns possible locations for breakpoint. scriptId in start and end range locations should be the same.
         */
        post(
            method: "Debugger.getPossibleBreakpoints",
            params?: Debugger.GetPossibleBreakpointsParameterType,
            callback?: (err: Error | null, params: Debugger.GetPossibleBreakpointsReturnType) => void
        ): void;
        post(method: "Debugger.getPossibleBreakpoints", callback?: (err: Error | null, params: Debugger.GetPossibleBreakpointsReturnType) => void): void;

        /**
         * Continues execution until specific location is reached.
         */
        post(method: "Debugger.continueToLocation", params?: Debugger.ContinueToLocationParameterType, callback?: (err: Error | null) => void): void;
        post(method: "Debugger.continueToLocation", callback?: (err: Error | null) => void): void;

        /**
         * @experimental
         */
        post(method: "Debugger.pauseOnAsyncCall", params?: Debugger.PauseOnAsyncCallParameterType, callback?: (err: Error | null) => void): void;
        post(method: "Debugger.pauseOnAsyncCall", callback?: (err: Error | null) => void): void;

        /**
         * Steps over the statement.
         */
        post(method: "Debugger.stepOver", callback?: (err: Error | null) => void): void;

        /**
         * Steps into the function call.
         */
        post(method: "Debugger.stepInto", params?: Debugger.StepIntoParameterType, callback?: (err: Error | null) => void): void;
        post(method: "Debugger.stepInto", callback?: (err: Error | null) => void): void;

        /**
         * Steps out of the function call.
         */
        post(method: "Debugger.stepOut", callback?: (err: Error | null) => void): void;

        /**
         * Stops on the next JavaScript statement.
         */
        post(method: "Debugger.pause", callback?: (err: Error | null) => void): void;

        /**
         * This method is deprecated - use Debugger.stepInto with breakOnAsyncCall and Debugger.pauseOnAsyncTask instead. Steps into next scheduled async task if any is scheduled before next pause. Returns success when async task is actually scheduled, returns error if no task were scheduled or another scheduleStepIntoAsync was called.
         * @experimental
         */
        post(method: "Debugger.scheduleStepIntoAsync", callback?: (err: Error | null) => void): void;

        /**
         * Resumes JavaScript execution.
         */
        post(method: "Debugger.resume", callback?: (err: Error | null) => void): void;

        /**
         * Returns stack trace with given <code>stackTraceId</code>.
         * @experimental
         */
        post(method: "Debugger.getStackTrace", params?: Debugger.GetStackTraceParameterType, callback?: (err: Error | null, params: Debugger.GetStackTraceReturnType) => void): void;
        post(method: "Debugger.getStackTrace", callback?: (err: Error | null, params: Debugger.GetStackTraceReturnType) => void): void;

        /**
         * Searches for given string in script content.
         */
        post(method: "Debugger.searchInContent", params?: Debugger.SearchInContentParameterType, callback?: (err: Error | null, params: Debugger.SearchInContentReturnType) => void): void;
        post(method: "Debugger.searchInContent", callback?: (err: Error | null, params: Debugger.SearchInContentReturnType) => void): void;

        /**
         * Edits JavaScript source live.
         */
        post(method: "Debugger.setScriptSource", params?: Debugger.SetScriptSourceParameterType, callback?: (err: Error | null, params: Debugger.SetScriptSourceReturnType) => void): void;
        post(method: "Debugger.setScriptSource", callback?: (err: Error | null, params: Debugger.SetScriptSourceReturnType) => void): void;

        /**
         * Restarts particular call frame from the beginning.
         */
        post(method: "Debugger.restartFrame", params?: Debugger.RestartFrameParameterType, callback?: (err: Error | null, params: Debugger.RestartFrameReturnType) => void): void;
        post(method: "Debugger.restartFrame", callback?: (err: Error | null, params: Debugger.RestartFrameReturnType) => void): void;

        /**
         * Returns source for the script with given id.
         */
        post(method: "Debugger.getScriptSource", params?: Debugger.GetScriptSourceParameterType, callback?: (err: Error | null, params: Debugger.GetScriptSourceReturnType) => void): void;
        post(method: "Debugger.getScriptSource", callback?: (err: Error | null, params: Debugger.GetScriptSourceReturnType) => void): void;

        /**
         * Defines pause on exceptions state. Can be set to stop on all exceptions, uncaught exceptions or no exceptions. Initial pause on exceptions state is <code>none</code>.
         */
        post(method: "Debugger.setPauseOnExceptions", params?: Debugger.SetPauseOnExceptionsParameterType, callback?: (err: Error | null) => void): void;
        post(method: "Debugger.setPauseOnExceptions", callback?: (err: Error | null) => void): void;

        /**
         * Evaluates expression on a given call frame.
         */
        post(method: "Debugger.evaluateOnCallFrame", params?: Debugger.EvaluateOnCallFrameParameterType, callback?: (err: Error | null, params: Debugger.EvaluateOnCallFrameReturnType) => void): void;
        post(method: "Debugger.evaluateOnCallFrame", callback?: (err: Error | null, params: Debugger.EvaluateOnCallFrameReturnType) => void): void;

        /**
         * Changes value of variable in a callframe. Object-based scopes are not supported and must be mutated manually.
         */
        post(method: "Debugger.setVariableValue", params?: Debugger.SetVariableValueParameterType, callback?: (err: Error | null) => void): void;
        post(method: "Debugger.setVariableValue", callback?: (err: Error | null) => void): void;

        /**
         * Changes return value in top frame. Available only at return break position.
         * @experimental
         */
        post(method: "Debugger.setReturnValue", params?: Debugger.SetReturnValueParameterType, callback?: (err: Error | null) => void): void;
        post(method: "Debugger.setReturnValue", callback?: (err: Error | null) => void): void;

        /**
         * Enables or disables async call stacks tracking.
         */
        post(method: "Debugger.setAsyncCallStackDepth", params?: Debugger.SetAsyncCallStackDepthParameterType, callback?: (err: Error | null) => void): void;
        post(method: "Debugger.setAsyncCallStackDepth", callback?: (err: Error | null) => void): void;

        /**
         * Replace previous blackbox patterns with passed ones. Forces backend to skip stepping/pausing in scripts with url matching one of the patterns. VM will try to leave blackboxed script by performing 'step in' several times, finally resorting to 'step out' if unsuccessful.
         * @experimental
         */
        post(method: "Debugger.setBlackboxPatterns", params?: Debugger.SetBlackboxPatternsParameterType, callback?: (err: Error | null) => void): void;
        post(method: "Debugger.setBlackboxPatterns", callback?: (err: Error | null) => void): void;

        /**
         * Makes backend skip steps in the script in blackboxed ranges. VM will try leave blacklisted scripts by performing 'step in' several times, finally resorting to 'step out' if unsuccessful. Positions array contains positions where blackbox state is changed. First interval isn't blackboxed. Array should be sorted.
         * @experimental
         */
        post(method: "Debugger.setBlackboxedRanges", params?: Debugger.SetBlackboxedRangesParameterType, callback?: (err: Error | null) => void): void;
        post(method: "Debugger.setBlackboxedRanges", callback?: (err: Error | null) => void): void;

        /**
         * Enables console domain, sends the messages collected so far to the client by means of the <code>messageAdded</code> notification.
         */
        post(method: "Console.enable", callback?: (err: Error | null) => void): void;

        /**
         * Disables console domain, prevents further console messages from being reported to the client.
         */
        post(method: "Console.disable", callback?: (err: Error | null) => void): void;

        /**
         * Does nothing.
         */
        post(method: "Console.clearMessages", callback?: (err: Error | null) => void): void;

        post(method: "Profiler.enable", callback?: (err: Error | null) => void): void;

        post(method: "Profiler.disable", callback?: (err: Error | null) => void): void;

        /**
         * Changes CPU profiler sampling interval. Must be called before CPU profiles recording started.
         */
        post(method: "Profiler.setSamplingInterval", params?: Profiler.SetSamplingIntervalParameterType, callback?: (err: Error | null) => void): void;
        post(method: "Profiler.setSamplingInterval", callback?: (err: Error | null) => void): void;

        post(method: "Profiler.start", callback?: (err: Error | null) => void): void;

        post(method: "Profiler.stop", callback?: (err: Error | null, params: Profiler.StopReturnType) => void): void;

        /**
         * Enable precise code coverage. Coverage data for JavaScript executed before enabling precise code coverage may be incomplete. Enabling prevents running optimized code and resets execution counters.
         */
        post(method: "Profiler.startPreciseCoverage", params?: Profiler.StartPreciseCoverageParameterType, callback?: (err: Error | null) => void): void;
        post(method: "Profiler.startPreciseCoverage", callback?: (err: Error | null) => void): void;

        /**
         * Disable precise code coverage. Disabling releases unnecessary execution count records and allows executing optimized code.
         */
        post(method: "Profiler.stopPreciseCoverage", callback?: (err: Error | null) => void): void;

        /**
         * Collect coverage data for the current isolate, and resets execution counters. Precise code coverage needs to have started.
         */
        post(method: "Profiler.takePreciseCoverage", callback?: (err: Error | null, params: Profiler.TakePreciseCoverageReturnType) => void): void;

        /**
         * Collect coverage data for the current isolate. The coverage data may be incomplete due to garbage collection.
         */
        post(method: "Profiler.getBestEffortCoverage", callback?: (err: Error | null, params: Profiler.GetBestEffortCoverageReturnType) => void): void;

        /**
         * Enable type profile.
         * @experimental
         */
        post(method: "Profiler.startTypeProfile", callback?: (err: Error | null) => void): void;

        /**
         * Disable type profile. Disabling releases type profile data collected so far.
         * @experimental
         */
        post(method: "Profiler.stopTypeProfile", callback?: (err: Error | null) => void): void;

        /**
         * Collect type profile.
         * @experimental
         */
        post(method: "Profiler.takeTypeProfile", callback?: (err: Error | null, params: Profiler.TakeTypeProfileReturnType) => void): void;

        post(method: "HeapProfiler.enable", callback?: (err: Error | null) => void): void;

        post(method: "HeapProfiler.disable", callback?: (err: Error | null) => void): void;

        post(method: "HeapProfiler.startTrackingHeapObjects", params?: HeapProfiler.StartTrackingHeapObjectsParameterType, callback?: (err: Error | null) => void): void;
        post(method: "HeapProfiler.startTrackingHeapObjects", callback?: (err: Error | null) => void): void;

        post(method: "HeapProfiler.stopTrackingHeapObjects", params?: HeapProfiler.StopTrackingHeapObjectsParameterType, callback?: (err: Error | null) => void): void;
        post(method: "HeapProfiler.stopTrackingHeapObjects", callback?: (err: Error | null) => void): void;

        post(method: "HeapProfiler.takeHeapSnapshot", params?: HeapProfiler.TakeHeapSnapshotParameterType, callback?: (err: Error | null) => void): void;
        post(method: "HeapProfiler.takeHeapSnapshot", callback?: (err: Error | null) => void): void;

        post(method: "HeapProfiler.collectGarbage", callback?: (err: Error | null) => void): void;

        post(
            method: "HeapProfiler.getObjectByHeapObjectId",
            params?: HeapProfiler.GetObjectByHeapObjectIdParameterType,
            callback?: (err: Error | null, params: HeapProfiler.GetObjectByHeapObjectIdReturnType) => void
        ): void;
        post(method: "HeapProfiler.getObjectByHeapObjectId", callback?: (err: Error | null, params: HeapProfiler.GetObjectByHeapObjectIdReturnType) => void): void;

        /**
         * Enables console to refer to the node with given id via \$x (see Command Line API for more details \$x functions).
         */
        post(method: "HeapProfiler.addInspectedHeapObject", params?: HeapProfiler.AddInspectedHeapObjectParameterType, callback?: (err: Error | null) => void): void;
        post(method: "HeapProfiler.addInspectedHeapObject", callback?: (err: Error | null) => void): void;

        post(method: "HeapProfiler.getHeapObjectId", params?: HeapProfiler.GetHeapObjectIdParameterType, callback?: (err: Error | null, params: HeapProfiler.GetHeapObjectIdReturnType) => void): void;
        post(method: "HeapProfiler.getHeapObjectId", callback?: (err: Error | null, params: HeapProfiler.GetHeapObjectIdReturnType) => void): void;

        post(method: "HeapProfiler.startSampling", params?: HeapProfiler.StartSamplingParameterType, callback?: (err: Error | null) => void): void;
        post(method: "HeapProfiler.startSampling", callback?: (err: Error | null) => void): void;

        post(method: "HeapProfiler.stopSampling", callback?: (err: Error | null, params: HeapProfiler.StopSamplingReturnType) => void): void;

        post(method: "HeapProfiler.getSamplingProfile", callback?: (err: Error | null, params: HeapProfiler.GetSamplingProfileReturnType) => void): void;

        /**
         * Gets supported tracing categories.
         */
        post(method: "NodeTracing.getCategories", callback?: (err: Error | null, params: NodeTracing.GetCategoriesReturnType) => void): void;

        /**
         * Start trace events collection.
         */
        post(method: "NodeTracing.start", params?: NodeTracing.StartParameterType, callback?: (err: Error | null) => void): void;
        post(method: "NodeTracing.start", callback?: (err: Error | null) => void): void;

        /**
         * Stop trace events collection. Remaining collected events will be sent as a sequence of
         * dataCollected events followed by tracingComplete event.
         */
        post(method: "NodeTracing.stop", callback?: (err: Error | null) => void): void;

        /**
         * Sends protocol message over session with given id.
         */
        post(method: "NodeWorker.sendMessageToWorker", params?: NodeWorker.SendMessageToWorkerParameterType, callback?: (err: Error | null) => void): void;
        post(method: "NodeWorker.sendMessageToWorker", callback?: (err: Error | null) => void): void;

        /**
         * Instructs the inspector to attach to running workers. Will also attach to new workers
         * as they start
         */
        post(method: "NodeWorker.enable", params?: NodeWorker.EnableParameterType, callback?: (err: Error | null) => void): void;
        post(method: "NodeWorker.enable", callback?: (err: Error | null) => void): void;

        /**
         * Detaches from all running workers and disables attaching to new workers as they are started.
         */
        post(method: "NodeWorker.disable", callback?: (err: Error | null) => void): void;

        /**
         * Detached from the worker with given sessionId.
         */
        post(method: "NodeWorker.detach", params?: NodeWorker.DetachParameterType, callback?: (err: Error | null) => void): void;
        post(method: "NodeWorker.detach", callback?: (err: Error | null) => void): void;

        /**
         * Enable the \`NodeRuntime.waitingForDisconnect\`.
         */
        post(method: "NodeRuntime.notifyWhenWaitingForDisconnect", params?: NodeRuntime.NotifyWhenWaitingForDisconnectParameterType, callback?: (err: Error | null) => void): void;
        post(method: "NodeRuntime.notifyWhenWaitingForDisconnect", callback?: (err: Error | null) => void): void;

        \/\/ Events

        addListener(event: string, listener: (...args: any[]) => void): this;

        /**
         * Emitted when any notification from the V8 Inspector is received.
         */
        addListener(event: "inspectorNotification", listener: (message: InspectorNotification<{}>) => void): this;

        /**
         * Issued when new execution context is created.
         */
        addListener(event: "Runtime.executionContextCreated", listener: (message: InspectorNotification<Runtime.ExecutionContextCreatedEventDataType>) => void): this;

        /**
         * Issued when execution context is destroyed.
         */
        addListener(event: "Runtime.executionContextDestroyed", listener: (message: InspectorNotification<Runtime.ExecutionContextDestroyedEventDataType>) => void): this;

        /**
         * Issued when all executionContexts were cleared in browser
         */
        addListener(event: "Runtime.executionContextsCleared", listener: () => void): this;

        /**
         * Issued when exception was thrown and unhandled.
         */
        addListener(event: "Runtime.exceptionThrown", listener: (message: InspectorNotification<Runtime.ExceptionThrownEventDataType>) => void): this;

        /**
         * Issued when unhandled exception was revoked.
         */
        addListener(event: "Runtime.exceptionRevoked", listener: (message: InspectorNotification<Runtime.ExceptionRevokedEventDataType>) => void): this;

        /**
         * Issued when console API was called.
         */
        addListener(event: "Runtime.consoleAPICalled", listener: (message: InspectorNotification<Runtime.ConsoleAPICalledEventDataType>) => void): this;

        /**
         * Issued when object should be inspected (for example, as a result of inspect() command line API call).
         */
        addListener(event: "Runtime.inspectRequested", listener: (message: InspectorNotification<Runtime.InspectRequestedEventDataType>) => void): this;

        /**
         * Fired when virtual machine parses script. This event is also fired for all known and uncollected scripts upon enabling debugger.
         */
        addListener(event: "Debugger.scriptParsed", listener: (message: InspectorNotification<Debugger.ScriptParsedEventDataType>) => void): this;

        /**
         * Fired when virtual machine fails to parse the script.
         */
        addListener(event: "Debugger.scriptFailedToParse", listener: (message: InspectorNotification<Debugger.ScriptFailedToParseEventDataType>) => void): this;

        /**
         * Fired when breakpoint is resolved to an actual script and location.
         */
        addListener(event: "Debugger.breakpointResolved", listener: (message: InspectorNotification<Debugger.BreakpointResolvedEventDataType>) => void): this;

        /**
         * Fired when the virtual machine stopped on breakpoint or exception or any other stop criteria.
         */
        addListener(event: "Debugger.paused", listener: (message: InspectorNotification<Debugger.PausedEventDataType>) => void): this;

        /**
         * Fired when the virtual machine resumed execution.
         */
        addListener(event: "Debugger.resumed", listener: () => void): this;

        /**
         * Issued when new console message is added.
         */
        addListener(event: "Console.messageAdded", listener: (message: InspectorNotification<Console.MessageAddedEventDataType>) => void): this;

        /**
         * Sent when new profile recording is started using console.profile() call.
         */
        addListener(event: "Profiler.consoleProfileStarted", listener: (message: InspectorNotification<Profiler.ConsoleProfileStartedEventDataType>) => void): this;

        addListener(event: "Profiler.consoleProfileFinished", listener: (message: InspectorNotification<Profiler.ConsoleProfileFinishedEventDataType>) => void): this;
        addListener(event: "HeapProfiler.addHeapSnapshotChunk", listener: (message: InspectorNotification<HeapProfiler.AddHeapSnapshotChunkEventDataType>) => void): this;
        addListener(event: "HeapProfiler.resetProfiles", listener: () => void): this;
        addListener(event: "HeapProfiler.reportHeapSnapshotProgress", listener: (message: InspectorNotification<HeapProfiler.ReportHeapSnapshotProgressEventDataType>) => void): this;

        /**
         * If heap objects tracking has been started then backend regularly sends a current value for last seen object id and corresponding timestamp. If the were changes in the heap since last event then one or more heapStatsUpdate events will be sent before a new lastSeenObjectId event.
         */
        addListener(event: "HeapProfiler.lastSeenObjectId", listener: (message: InspectorNotification<HeapProfiler.LastSeenObjectIdEventDataType>) => void): this;

        /**
         * If heap objects tracking has been started then backend may send update for one or more fragments
         */
        addListener(event: "HeapProfiler.heapStatsUpdate", listener: (message: InspectorNotification<HeapProfiler.HeapStatsUpdateEventDataType>) => void): this;

        /**
         * Contains an bucket of collected trace events.
         */
        addListener(event: "NodeTracing.dataCollected", listener: (message: InspectorNotification<NodeTracing.DataCollectedEventDataType>) => void): this;

        /**
         * Signals that tracing is stopped and there is no trace buffers pending flush, all data were
         * delivered via dataCollected events.
         */
        addListener(event: "NodeTracing.tracingComplete", listener: () => void): this;

        /**
         * Issued when attached to a worker.
         */
        addListener(event: "NodeWorker.attachedToWorker", listener: (message: InspectorNotification<NodeWorker.AttachedToWorkerEventDataType>) => void): this;

        /**
         * Issued when detached from the worker.
         */
        addListener(event: "NodeWorker.detachedFromWorker", listener: (message: InspectorNotification<NodeWorker.DetachedFromWorkerEventDataType>) => void): this;

        /**
         * Notifies about a new protocol message received from the session
         * (session ID is provided in attachedToWorker notification).
         */
        addListener(event: "NodeWorker.receivedMessageFromWorker", listener: (message: InspectorNotification<NodeWorker.ReceivedMessageFromWorkerEventDataType>) => void): this;

        /**
         * This event is fired instead of \`Runtime.executionContextDestroyed\` when
         * enabled.
         * It is fired when the Node process finished all code execution and is
         * waiting for all frontends to disconnect.
         */
        addListener(event: "NodeRuntime.waitingForDisconnect", listener: () => void): this;

        emit(event: string | symbol, ...args: any[]): boolean;
        emit(event: "inspectorNotification", message: InspectorNotification<{}>): boolean;
        emit(event: "Runtime.executionContextCreated", message: InspectorNotification<Runtime.ExecutionContextCreatedEventDataType>): boolean;
        emit(event: "Runtime.executionContextDestroyed", message: InspectorNotification<Runtime.ExecutionContextDestroyedEventDataType>): boolean;
        emit(event: "Runtime.executionContextsCleared"): boolean;
        emit(event: "Runtime.exceptionThrown", message: InspectorNotification<Runtime.ExceptionThrownEventDataType>): boolean;
        emit(event: "Runtime.exceptionRevoked", message: InspectorNotification<Runtime.ExceptionRevokedEventDataType>): boolean;
        emit(event: "Runtime.consoleAPICalled", message: InspectorNotification<Runtime.ConsoleAPICalledEventDataType>): boolean;
        emit(event: "Runtime.inspectRequested", message: InspectorNotification<Runtime.InspectRequestedEventDataType>): boolean;
        emit(event: "Debugger.scriptParsed", message: InspectorNotification<Debugger.ScriptParsedEventDataType>): boolean;
        emit(event: "Debugger.scriptFailedToParse", message: InspectorNotification<Debugger.ScriptFailedToParseEventDataType>): boolean;
        emit(event: "Debugger.breakpointResolved", message: InspectorNotification<Debugger.BreakpointResolvedEventDataType>): boolean;
        emit(event: "Debugger.paused", message: InspectorNotification<Debugger.PausedEventDataType>): boolean;
        emit(event: "Debugger.resumed"): boolean;
        emit(event: "Console.messageAdded", message: InspectorNotification<Console.MessageAddedEventDataType>): boolean;
        emit(event: "Profiler.consoleProfileStarted", message: InspectorNotification<Profiler.ConsoleProfileStartedEventDataType>): boolean;
        emit(event: "Profiler.consoleProfileFinished", message: InspectorNotification<Profiler.ConsoleProfileFinishedEventDataType>): boolean;
        emit(event: "HeapProfiler.addHeapSnapshotChunk", message: InspectorNotification<HeapProfiler.AddHeapSnapshotChunkEventDataType>): boolean;
        emit(event: "HeapProfiler.resetProfiles"): boolean;
        emit(event: "HeapProfiler.reportHeapSnapshotProgress", message: InspectorNotification<HeapProfiler.ReportHeapSnapshotProgressEventDataType>): boolean;
        emit(event: "HeapProfiler.lastSeenObjectId", message: InspectorNotification<HeapProfiler.LastSeenObjectIdEventDataType>): boolean;
        emit(event: "HeapProfiler.heapStatsUpdate", message: InspectorNotification<HeapProfiler.HeapStatsUpdateEventDataType>): boolean;
        emit(event: "NodeTracing.dataCollected", message: InspectorNotification<NodeTracing.DataCollectedEventDataType>): boolean;
        emit(event: "NodeTracing.tracingComplete"): boolean;
        emit(event: "NodeWorker.attachedToWorker", message: InspectorNotification<NodeWorker.AttachedToWorkerEventDataType>): boolean;
        emit(event: "NodeWorker.detachedFromWorker", message: InspectorNotification<NodeWorker.DetachedFromWorkerEventDataType>): boolean;
        emit(event: "NodeWorker.receivedMessageFromWorker", message: InspectorNotification<NodeWorker.ReceivedMessageFromWorkerEventDataType>): boolean;
        emit(event: "NodeRuntime.waitingForDisconnect"): boolean;

        on(event: string, listener: (...args: any[]) => void): this;

        /**
         * Emitted when any notification from the V8 Inspector is received.
         */
        on(event: "inspectorNotification", listener: (message: InspectorNotification<{}>) => void): this;

        /**
         * Issued when new execution context is created.
         */
        on(event: "Runtime.executionContextCreated", listener: (message: InspectorNotification<Runtime.ExecutionContextCreatedEventDataType>) => void): this;

        /**
         * Issued when execution context is destroyed.
         */
        on(event: "Runtime.executionContextDestroyed", listener: (message: InspectorNotification<Runtime.ExecutionContextDestroyedEventDataType>) => void): this;

        /**
         * Issued when all executionContexts were cleared in browser
         */
        on(event: "Runtime.executionContextsCleared", listener: () => void): this;

        /**
         * Issued when exception was thrown and unhandled.
         */
        on(event: "Runtime.exceptionThrown", listener: (message: InspectorNotification<Runtime.ExceptionThrownEventDataType>) => void): this;

        /**
         * Issued when unhandled exception was revoked.
         */
        on(event: "Runtime.exceptionRevoked", listener: (message: InspectorNotification<Runtime.ExceptionRevokedEventDataType>) => void): this;

        /**
         * Issued when console API was called.
         */
        on(event: "Runtime.consoleAPICalled", listener: (message: InspectorNotification<Runtime.ConsoleAPICalledEventDataType>) => void): this;

        /**
         * Issued when object should be inspected (for example, as a result of inspect() command line API call).
         */
        on(event: "Runtime.inspectRequested", listener: (message: InspectorNotification<Runtime.InspectRequestedEventDataType>) => void): this;

        /**
         * Fired when virtual machine parses script. This event is also fired for all known and uncollected scripts upon enabling debugger.
         */
        on(event: "Debugger.scriptParsed", listener: (message: InspectorNotification<Debugger.ScriptParsedEventDataType>) => void): this;

        /**
         * Fired when virtual machine fails to parse the script.
         */
        on(event: "Debugger.scriptFailedToParse", listener: (message: InspectorNotification<Debugger.ScriptFailedToParseEventDataType>) => void): this;

        /**
         * Fired when breakpoint is resolved to an actual script and location.
         */
        on(event: "Debugger.breakpointResolved", listener: (message: InspectorNotification<Debugger.BreakpointResolvedEventDataType>) => void): this;

        /**
         * Fired when the virtual machine stopped on breakpoint or exception or any other stop criteria.
         */
        on(event: "Debugger.paused", listener: (message: InspectorNotification<Debugger.PausedEventDataType>) => void): this;

        /**
         * Fired when the virtual machine resumed execution.
         */
        on(event: "Debugger.resumed", listener: () => void): this;

        /**
         * Issued when new console message is added.
         */
        on(event: "Console.messageAdded", listener: (message: InspectorNotification<Console.MessageAddedEventDataType>) => void): this;

        /**
         * Sent when new profile recording is started using console.profile() call.
         */
        on(event: "Profiler.consoleProfileStarted", listener: (message: InspectorNotification<Profiler.ConsoleProfileStartedEventDataType>) => void): this;

        on(event: "Profiler.consoleProfileFinished", listener: (message: InspectorNotification<Profiler.ConsoleProfileFinishedEventDataType>) => void): this;
        on(event: "HeapProfiler.addHeapSnapshotChunk", listener: (message: InspectorNotification<HeapProfiler.AddHeapSnapshotChunkEventDataType>) => void): this;
        on(event: "HeapProfiler.resetProfiles", listener: () => void): this;
        on(event: "HeapProfiler.reportHeapSnapshotProgress", listener: (message: InspectorNotification<HeapProfiler.ReportHeapSnapshotProgressEventDataType>) => void): this;

        /**
         * If heap objects tracking has been started then backend regularly sends a current value for last seen object id and corresponding timestamp. If the were changes in the heap since last event then one or more heapStatsUpdate events will be sent before a new lastSeenObjectId event.
         */
        on(event: "HeapProfiler.lastSeenObjectId", listener: (message: InspectorNotification<HeapProfiler.LastSeenObjectIdEventDataType>) => void): this;

        /**
         * If heap objects tracking has been started then backend may send update for one or more fragments
         */
        on(event: "HeapProfiler.heapStatsUpdate", listener: (message: InspectorNotification<HeapProfiler.HeapStatsUpdateEventDataType>) => void): this;

        /**
         * Contains an bucket of collected trace events.
         */
        on(event: "NodeTracing.dataCollected", listener: (message: InspectorNotification<NodeTracing.DataCollectedEventDataType>) => void): this;

        /**
         * Signals that tracing is stopped and there is no trace buffers pending flush, all data were
         * delivered via dataCollected events.
         */
        on(event: "NodeTracing.tracingComplete", listener: () => void): this;

        /**
         * Issued when attached to a worker.
         */
        on(event: "NodeWorker.attachedToWorker", listener: (message: InspectorNotification<NodeWorker.AttachedToWorkerEventDataType>) => void): this;

        /**
         * Issued when detached from the worker.
         */
        on(event: "NodeWorker.detachedFromWorker", listener: (message: InspectorNotification<NodeWorker.DetachedFromWorkerEventDataType>) => void): this;

        /**
         * Notifies about a new protocol message received from the session
         * (session ID is provided in attachedToWorker notification).
         */
        on(event: "NodeWorker.receivedMessageFromWorker", listener: (message: InspectorNotification<NodeWorker.ReceivedMessageFromWorkerEventDataType>) => void): this;

        /**
         * This event is fired instead of \`Runtime.executionContextDestroyed\` when
         * enabled.
         * It is fired when the Node process finished all code execution and is
         * waiting for all frontends to disconnect.
         */
        on(event: "NodeRuntime.waitingForDisconnect", listener: () => void): this;

        once(event: string, listener: (...args: any[]) => void): this;

        /**
         * Emitted when any notification from the V8 Inspector is received.
         */
        once(event: "inspectorNotification", listener: (message: InspectorNotification<{}>) => void): this;

        /**
         * Issued when new execution context is created.
         */
        once(event: "Runtime.executionContextCreated", listener: (message: InspectorNotification<Runtime.ExecutionContextCreatedEventDataType>) => void): this;

        /**
         * Issued when execution context is destroyed.
         */
        once(event: "Runtime.executionContextDestroyed", listener: (message: InspectorNotification<Runtime.ExecutionContextDestroyedEventDataType>) => void): this;

        /**
         * Issued when all executionContexts were cleared in browser
         */
        once(event: "Runtime.executionContextsCleared", listener: () => void): this;

        /**
         * Issued when exception was thrown and unhandled.
         */
        once(event: "Runtime.exceptionThrown", listener: (message: InspectorNotification<Runtime.ExceptionThrownEventDataType>) => void): this;

        /**
         * Issued when unhandled exception was revoked.
         */
        once(event: "Runtime.exceptionRevoked", listener: (message: InspectorNotification<Runtime.ExceptionRevokedEventDataType>) => void): this;

        /**
         * Issued when console API was called.
         */
        once(event: "Runtime.consoleAPICalled", listener: (message: InspectorNotification<Runtime.ConsoleAPICalledEventDataType>) => void): this;

        /**
         * Issued when object should be inspected (for example, as a result of inspect() command line API call).
         */
        once(event: "Runtime.inspectRequested", listener: (message: InspectorNotification<Runtime.InspectRequestedEventDataType>) => void): this;

        /**
         * Fired when virtual machine parses script. This event is also fired for all known and uncollected scripts upon enabling debugger.
         */
        once(event: "Debugger.scriptParsed", listener: (message: InspectorNotification<Debugger.ScriptParsedEventDataType>) => void): this;

        /**
         * Fired when virtual machine fails to parse the script.
         */
        once(event: "Debugger.scriptFailedToParse", listener: (message: InspectorNotification<Debugger.ScriptFailedToParseEventDataType>) => void): this;

        /**
         * Fired when breakpoint is resolved to an actual script and location.
         */
        once(event: "Debugger.breakpointResolved", listener: (message: InspectorNotification<Debugger.BreakpointResolvedEventDataType>) => void): this;

        /**
         * Fired when the virtual machine stopped on breakpoint or exception or any other stop criteria.
         */
        once(event: "Debugger.paused", listener: (message: InspectorNotification<Debugger.PausedEventDataType>) => void): this;

        /**
         * Fired when the virtual machine resumed execution.
         */
        once(event: "Debugger.resumed", listener: () => void): this;

        /**
         * Issued when new console message is added.
         */
        once(event: "Console.messageAdded", listener: (message: InspectorNotification<Console.MessageAddedEventDataType>) => void): this;

        /**
         * Sent when new profile recording is started using console.profile() call.
         */
        once(event: "Profiler.consoleProfileStarted", listener: (message: InspectorNotification<Profiler.ConsoleProfileStartedEventDataType>) => void): this;

        once(event: "Profiler.consoleProfileFinished", listener: (message: InspectorNotification<Profiler.ConsoleProfileFinishedEventDataType>) => void): this;
        once(event: "HeapProfiler.addHeapSnapshotChunk", listener: (message: InspectorNotification<HeapProfiler.AddHeapSnapshotChunkEventDataType>) => void): this;
        once(event: "HeapProfiler.resetProfiles", listener: () => void): this;
        once(event: "HeapProfiler.reportHeapSnapshotProgress", listener: (message: InspectorNotification<HeapProfiler.ReportHeapSnapshotProgressEventDataType>) => void): this;

        /**
         * If heap objects tracking has been started then backend regularly sends a current value for last seen object id and corresponding timestamp. If the were changes in the heap since last event then one or more heapStatsUpdate events will be sent before a new lastSeenObjectId event.
         */
        once(event: "HeapProfiler.lastSeenObjectId", listener: (message: InspectorNotification<HeapProfiler.LastSeenObjectIdEventDataType>) => void): this;

        /**
         * If heap objects tracking has been started then backend may send update for one or more fragments
         */
        once(event: "HeapProfiler.heapStatsUpdate", listener: (message: InspectorNotification<HeapProfiler.HeapStatsUpdateEventDataType>) => void): this;

        /**
         * Contains an bucket of collected trace events.
         */
        once(event: "NodeTracing.dataCollected", listener: (message: InspectorNotification<NodeTracing.DataCollectedEventDataType>) => void): this;

        /**
         * Signals that tracing is stopped and there is no trace buffers pending flush, all data were
         * delivered via dataCollected events.
         */
        once(event: "NodeTracing.tracingComplete", listener: () => void): this;

        /**
         * Issued when attached to a worker.
         */
        once(event: "NodeWorker.attachedToWorker", listener: (message: InspectorNotification<NodeWorker.AttachedToWorkerEventDataType>) => void): this;

        /**
         * Issued when detached from the worker.
         */
        once(event: "NodeWorker.detachedFromWorker", listener: (message: InspectorNotification<NodeWorker.DetachedFromWorkerEventDataType>) => void): this;

        /**
         * Notifies about a new protocol message received from the session
         * (session ID is provided in attachedToWorker notification).
         */
        once(event: "NodeWorker.receivedMessageFromWorker", listener: (message: InspectorNotification<NodeWorker.ReceivedMessageFromWorkerEventDataType>) => void): this;

        /**
         * This event is fired instead of \`Runtime.executionContextDestroyed\` when
         * enabled.
         * It is fired when the Node process finished all code execution and is
         * waiting for all frontends to disconnect.
         */
        once(event: "NodeRuntime.waitingForDisconnect", listener: () => void): this;

        prependListener(event: string, listener: (...args: any[]) => void): this;

        /**
         * Emitted when any notification from the V8 Inspector is received.
         */
        prependListener(event: "inspectorNotification", listener: (message: InspectorNotification<{}>) => void): this;

        /**
         * Issued when new execution context is created.
         */
        prependListener(event: "Runtime.executionContextCreated", listener: (message: InspectorNotification<Runtime.ExecutionContextCreatedEventDataType>) => void): this;

        /**
         * Issued when execution context is destroyed.
         */
        prependListener(event: "Runtime.executionContextDestroyed", listener: (message: InspectorNotification<Runtime.ExecutionContextDestroyedEventDataType>) => void): this;

        /**
         * Issued when all executionContexts were cleared in browser
         */
        prependListener(event: "Runtime.executionContextsCleared", listener: () => void): this;

        /**
         * Issued when exception was thrown and unhandled.
         */
        prependListener(event: "Runtime.exceptionThrown", listener: (message: InspectorNotification<Runtime.ExceptionThrownEventDataType>) => void): this;

        /**
         * Issued when unhandled exception was revoked.
         */
        prependListener(event: "Runtime.exceptionRevoked", listener: (message: InspectorNotification<Runtime.ExceptionRevokedEventDataType>) => void): this;

        /**
         * Issued when console API was called.
         */
        prependListener(event: "Runtime.consoleAPICalled", listener: (message: InspectorNotification<Runtime.ConsoleAPICalledEventDataType>) => void): this;

        /**
         * Issued when object should be inspected (for example, as a result of inspect() command line API call).
         */
        prependListener(event: "Runtime.inspectRequested", listener: (message: InspectorNotification<Runtime.InspectRequestedEventDataType>) => void): this;

        /**
         * Fired when virtual machine parses script. This event is also fired for all known and uncollected scripts upon enabling debugger.
         */
        prependListener(event: "Debugger.scriptParsed", listener: (message: InspectorNotification<Debugger.ScriptParsedEventDataType>) => void): this;

        /**
         * Fired when virtual machine fails to parse the script.
         */
        prependListener(event: "Debugger.scriptFailedToParse", listener: (message: InspectorNotification<Debugger.ScriptFailedToParseEventDataType>) => void): this;

        /**
         * Fired when breakpoint is resolved to an actual script and location.
         */
        prependListener(event: "Debugger.breakpointResolved", listener: (message: InspectorNotification<Debugger.BreakpointResolvedEventDataType>) => void): this;

        /**
         * Fired when the virtual machine stopped on breakpoint or exception or any other stop criteria.
         */
        prependListener(event: "Debugger.paused", listener: (message: InspectorNotification<Debugger.PausedEventDataType>) => void): this;

        /**
         * Fired when the virtual machine resumed execution.
         */
        prependListener(event: "Debugger.resumed", listener: () => void): this;

        /**
         * Issued when new console message is added.
         */
        prependListener(event: "Console.messageAdded", listener: (message: InspectorNotification<Console.MessageAddedEventDataType>) => void): this;

        /**
         * Sent when new profile recording is started using console.profile() call.
         */
        prependListener(event: "Profiler.consoleProfileStarted", listener: (message: InspectorNotification<Profiler.ConsoleProfileStartedEventDataType>) => void): this;

        prependListener(event: "Profiler.consoleProfileFinished", listener: (message: InspectorNotification<Profiler.ConsoleProfileFinishedEventDataType>) => void): this;
        prependListener(event: "HeapProfiler.addHeapSnapshotChunk", listener: (message: InspectorNotification<HeapProfiler.AddHeapSnapshotChunkEventDataType>) => void): this;
        prependListener(event: "HeapProfiler.resetProfiles", listener: () => void): this;
        prependListener(event: "HeapProfiler.reportHeapSnapshotProgress", listener: (message: InspectorNotification<HeapProfiler.ReportHeapSnapshotProgressEventDataType>) => void): this;

        /**
         * If heap objects tracking has been started then backend regularly sends a current value for last seen object id and corresponding timestamp. If the were changes in the heap since last event then one or more heapStatsUpdate events will be sent before a new lastSeenObjectId event.
         */
        prependListener(event: "HeapProfiler.lastSeenObjectId", listener: (message: InspectorNotification<HeapProfiler.LastSeenObjectIdEventDataType>) => void): this;

        /**
         * If heap objects tracking has been started then backend may send update for one or more fragments
         */
        prependListener(event: "HeapProfiler.heapStatsUpdate", listener: (message: InspectorNotification<HeapProfiler.HeapStatsUpdateEventDataType>) => void): this;

        /**
         * Contains an bucket of collected trace events.
         */
        prependListener(event: "NodeTracing.dataCollected", listener: (message: InspectorNotification<NodeTracing.DataCollectedEventDataType>) => void): this;

        /**
         * Signals that tracing is stopped and there is no trace buffers pending flush, all data were
         * delivered via dataCollected events.
         */
        prependListener(event: "NodeTracing.tracingComplete", listener: () => void): this;

        /**
         * Issued when attached to a worker.
         */
        prependListener(event: "NodeWorker.attachedToWorker", listener: (message: InspectorNotification<NodeWorker.AttachedToWorkerEventDataType>) => void): this;

        /**
         * Issued when detached from the worker.
         */
        prependListener(event: "NodeWorker.detachedFromWorker", listener: (message: InspectorNotification<NodeWorker.DetachedFromWorkerEventDataType>) => void): this;

        /**
         * Notifies about a new protocol message received from the session
         * (session ID is provided in attachedToWorker notification).
         */
        prependListener(event: "NodeWorker.receivedMessageFromWorker", listener: (message: InspectorNotification<NodeWorker.ReceivedMessageFromWorkerEventDataType>) => void): this;

        /**
         * This event is fired instead of \`Runtime.executionContextDestroyed\` when
         * enabled.
         * It is fired when the Node process finished all code execution and is
         * waiting for all frontends to disconnect.
         */
        prependListener(event: "NodeRuntime.waitingForDisconnect", listener: () => void): this;

        prependOnceListener(event: string, listener: (...args: any[]) => void): this;

        /**
         * Emitted when any notification from the V8 Inspector is received.
         */
        prependOnceListener(event: "inspectorNotification", listener: (message: InspectorNotification<{}>) => void): this;

        /**
         * Issued when new execution context is created.
         */
        prependOnceListener(event: "Runtime.executionContextCreated", listener: (message: InspectorNotification<Runtime.ExecutionContextCreatedEventDataType>) => void): this;

        /**
         * Issued when execution context is destroyed.
         */
        prependOnceListener(event: "Runtime.executionContextDestroyed", listener: (message: InspectorNotification<Runtime.ExecutionContextDestroyedEventDataType>) => void): this;

        /**
         * Issued when all executionContexts were cleared in browser
         */
        prependOnceListener(event: "Runtime.executionContextsCleared", listener: () => void): this;

        /**
         * Issued when exception was thrown and unhandled.
         */
        prependOnceListener(event: "Runtime.exceptionThrown", listener: (message: InspectorNotification<Runtime.ExceptionThrownEventDataType>) => void): this;

        /**
         * Issued when unhandled exception was revoked.
         */
        prependOnceListener(event: "Runtime.exceptionRevoked", listener: (message: InspectorNotification<Runtime.ExceptionRevokedEventDataType>) => void): this;

        /**
         * Issued when console API was called.
         */
        prependOnceListener(event: "Runtime.consoleAPICalled", listener: (message: InspectorNotification<Runtime.ConsoleAPICalledEventDataType>) => void): this;

        /**
         * Issued when object should be inspected (for example, as a result of inspect() command line API call).
         */
        prependOnceListener(event: "Runtime.inspectRequested", listener: (message: InspectorNotification<Runtime.InspectRequestedEventDataType>) => void): this;

        /**
         * Fired when virtual machine parses script. This event is also fired for all known and uncollected scripts upon enabling debugger.
         */
        prependOnceListener(event: "Debugger.scriptParsed", listener: (message: InspectorNotification<Debugger.ScriptParsedEventDataType>) => void): this;

        /**
         * Fired when virtual machine fails to parse the script.
         */
        prependOnceListener(event: "Debugger.scriptFailedToParse", listener: (message: InspectorNotification<Debugger.ScriptFailedToParseEventDataType>) => void): this;

        /**
         * Fired when breakpoint is resolved to an actual script and location.
         */
        prependOnceListener(event: "Debugger.breakpointResolved", listener: (message: InspectorNotification<Debugger.BreakpointResolvedEventDataType>) => void): this;

        /**
         * Fired when the virtual machine stopped on breakpoint or exception or any other stop criteria.
         */
        prependOnceListener(event: "Debugger.paused", listener: (message: InspectorNotification<Debugger.PausedEventDataType>) => void): this;

        /**
         * Fired when the virtual machine resumed execution.
         */
        prependOnceListener(event: "Debugger.resumed", listener: () => void): this;

        /**
         * Issued when new console message is added.
         */
        prependOnceListener(event: "Console.messageAdded", listener: (message: InspectorNotification<Console.MessageAddedEventDataType>) => void): this;

        /**
         * Sent when new profile recording is started using console.profile() call.
         */
        prependOnceListener(event: "Profiler.consoleProfileStarted", listener: (message: InspectorNotification<Profiler.ConsoleProfileStartedEventDataType>) => void): this;

        prependOnceListener(event: "Profiler.consoleProfileFinished", listener: (message: InspectorNotification<Profiler.ConsoleProfileFinishedEventDataType>) => void): this;
        prependOnceListener(event: "HeapProfiler.addHeapSnapshotChunk", listener: (message: InspectorNotification<HeapProfiler.AddHeapSnapshotChunkEventDataType>) => void): this;
        prependOnceListener(event: "HeapProfiler.resetProfiles", listener: () => void): this;
        prependOnceListener(event: "HeapProfiler.reportHeapSnapshotProgress", listener: (message: InspectorNotification<HeapProfiler.ReportHeapSnapshotProgressEventDataType>) => void): this;

        /**
         * If heap objects tracking has been started then backend regularly sends a current value for last seen object id and corresponding timestamp. If the were changes in the heap since last event then one or more heapStatsUpdate events will be sent before a new lastSeenObjectId event.
         */
        prependOnceListener(event: "HeapProfiler.lastSeenObjectId", listener: (message: InspectorNotification<HeapProfiler.LastSeenObjectIdEventDataType>) => void): this;

        /**
         * If heap objects tracking has been started then backend may send update for one or more fragments
         */
        prependOnceListener(event: "HeapProfiler.heapStatsUpdate", listener: (message: InspectorNotification<HeapProfiler.HeapStatsUpdateEventDataType>) => void): this;

        /**
         * Contains an bucket of collected trace events.
         */
        prependOnceListener(event: "NodeTracing.dataCollected", listener: (message: InspectorNotification<NodeTracing.DataCollectedEventDataType>) => void): this;

        /**
         * Signals that tracing is stopped and there is no trace buffers pending flush, all data were
         * delivered via dataCollected events.
         */
        prependOnceListener(event: "NodeTracing.tracingComplete", listener: () => void): this;

        /**
         * Issued when attached to a worker.
         */
        prependOnceListener(event: "NodeWorker.attachedToWorker", listener: (message: InspectorNotification<NodeWorker.AttachedToWorkerEventDataType>) => void): this;

        /**
         * Issued when detached from the worker.
         */
        prependOnceListener(event: "NodeWorker.detachedFromWorker", listener: (message: InspectorNotification<NodeWorker.DetachedFromWorkerEventDataType>) => void): this;

        /**
         * Notifies about a new protocol message received from the session
         * (session ID is provided in attachedToWorker notification).
         */
        prependOnceListener(event: "NodeWorker.receivedMessageFromWorker", listener: (message: InspectorNotification<NodeWorker.ReceivedMessageFromWorkerEventDataType>) => void): this;

        /**
         * This event is fired instead of \`Runtime.executionContextDestroyed\` when
         * enabled.
         * It is fired when the Node process finished all code execution and is
         * waiting for all frontends to disconnect.
         */
        prependOnceListener(event: "NodeRuntime.waitingForDisconnect", listener: () => void): this;
    }

    \/\/ Top Level API

    /**
     * Activate inspector on host and port. Equivalent to node --inspect=[[host:]port], but can be done programatically after node has started.
     * If wait is true, will block until a client has connected to the inspect port and flow control has been passed to the debugger client.
     * @param port Port to listen on for inspector connections. Optional, defaults to what was specified on the CLI.
     * @param host Host to listen on for inspector connections. Optional, defaults to what was specified on the CLI.
     * @param wait Block until a client has connected. Optional, defaults to false.
     */
    function open(port?: number, host?: string, wait?: boolean): void;

    /**
     * Deactivate the inspector. Blocks until there are no active connections.
     */
    function close(): void;

    /**
     * Return the URL of the active inspector, or \`undefined\` if there is none.
     */
    function url(): string | undefined;

    /**
     * Blocks until a client (existing or connected later) has sent
     * \`Runtime.runIfWaitingForDebugger\` command.
     * An exception will be thrown if there is no active inspector.
     */
    function waitForDebugger(): void;
}
`;
definitions['module.d.ts'] = `declare module 'module' {
    import { URL } from 'url';
    namespace Module {
        /**
         * Updates all the live bindings for builtin ES Modules to match the properties of the CommonJS exports.
         * It does not add or remove exported names from the ES Modules.
         */
        function syncBuiltinESMExports(): void;

        function findSourceMap(path: string, error?: Error): SourceMap;
        interface SourceMapPayload {
            file: string;
            version: number;
            sources: string[];
            sourcesContent: string[];
            names: string[];
            mappings: string;
            sourceRoot: string;
        }

        interface SourceMapping {
            generatedLine: number;
            generatedColumn: number;
            originalSource: string;
            originalLine: number;
            originalColumn: number;
        }

        class SourceMap {
            readonly payload: SourceMapPayload;
            constructor(payload: SourceMapPayload);
            findEntry(line: number, column: number): SourceMapping;
        }
    }
    interface Module extends NodeModule {}
    class Module {
        static runMain(): void;
        static wrap(code: string): string;

        /**
         * @deprecated Deprecated since: v12.2.0. Please use createRequire() instead.
         */
        static createRequireFromPath(path: string): NodeRequire;
        static createRequire(path: string | URL): NodeRequire;
        static builtinModules: string[];

        static Module: typeof Module;

        constructor(id: string, parent?: Module);
    }
    export = Module;
}
`;
definitions['net.d.ts'] = `declare module 'net' {
    import * as stream from 'stream';
    import EventEmitter = require('events');
    import * as dns from 'dns';

    type LookupFunction = (
        hostname: string,
        options: dns.LookupOneOptions,
        callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void,
    ) => void;

    interface AddressInfo {
        address: string;
        family: string;
        port: number;
    }

    interface SocketConstructorOpts {
        fd?: number | undefined;
        allowHalfOpen?: boolean | undefined;
        readable?: boolean | undefined;
        writable?: boolean | undefined;
    }

    interface OnReadOpts {
        buffer: Uint8Array | (() => Uint8Array);
        /**
         * This function is called for every chunk of incoming data.
         * Two arguments are passed to it: the number of bytes written to buffer and a reference to buffer.
         * Return false from this function to implicitly pause() the socket.
         */
        callback(bytesWritten: number, buf: Uint8Array): boolean;
    }

    interface ConnectOpts {
        /**
         * If specified, incoming data is stored in a single buffer and passed to the supplied callback when data arrives on the socket.
         * Note: this will cause the streaming functionality to not provide any data, however events like 'error', 'end', and 'close' will
         * still be emitted as normal and methods like pause() and resume() will also behave as expected.
         */
        onread?: OnReadOpts | undefined;
    }

    interface TcpSocketConnectOpts extends ConnectOpts {
        port: number;
        host?: string | undefined;
        localAddress?: string | undefined;
        localPort?: number | undefined;
        hints?: number | undefined;
        family?: number | undefined;
        lookup?: LookupFunction | undefined;
    }

    interface IpcSocketConnectOpts extends ConnectOpts {
        path: string;
    }

    type SocketConnectOpts = TcpSocketConnectOpts | IpcSocketConnectOpts;

    class Socket extends stream.Duplex {
        constructor(options?: SocketConstructorOpts);

        \/\/ Extended base methods
        write(buffer: Uint8Array | string, cb?: (err?: Error) => void): boolean;
        write(str: Uint8Array | string, encoding?: BufferEncoding, cb?: (err?: Error) => void): boolean;

        connect(options: SocketConnectOpts, connectionListener?: () => void): this;
        connect(port: number, host: string, connectionListener?: () => void): this;
        connect(port: number, connectionListener?: () => void): this;
        connect(path: string, connectionListener?: () => void): this;

        setEncoding(encoding?: BufferEncoding): this;
        pause(): this;
        resume(): this;
        setTimeout(timeout: number, callback?: () => void): this;
        setNoDelay(noDelay?: boolean): this;
        setKeepAlive(enable?: boolean, initialDelay?: number): this;
        address(): AddressInfo | {};
        unref(): this;
        ref(): this;

        /** @deprecated since v14.6.0 - Use \`writableLength\` instead. */
        readonly bufferSize: number;
        readonly bytesRead: number;
        readonly bytesWritten: number;
        readonly connecting: boolean;
        readonly destroyed: boolean;
        readonly localAddress: string;
        readonly localPort: number;
        readonly remoteAddress?: string | undefined;
        readonly remoteFamily?: string | undefined;
        readonly remotePort?: number | undefined;

        \/\/ Extended base methods
        end(cb?: () => void): void;
        end(buffer: Uint8Array | string, cb?: () => void): void;
        end(str: Uint8Array | string, encoding?: BufferEncoding, cb?: () => void): void;

        /**
         * events.EventEmitter
         *   1. close
         *   2. connect
         *   3. data
         *   4. drain
         *   5. end
         *   6. error
         *   7. lookup
         *   8. timeout
         */
        addListener(event: string, listener: (...args: any[]) => void): this;
        addListener(event: "close", listener: (had_error: boolean) => void): this;
        addListener(event: "connect", listener: () => void): this;
        addListener(event: "data", listener: (data: Buffer) => void): this;
        addListener(event: "drain", listener: () => void): this;
        addListener(event: "end", listener: () => void): this;
        addListener(event: "error", listener: (err: Error) => void): this;
        addListener(event: "lookup", listener: (err: Error, address: string, family: string | number, host: string) => void): this;
        addListener(event: "ready", listener: () => void): this;
        addListener(event: "timeout", listener: () => void): this;

        emit(event: string | symbol, ...args: any[]): boolean;
        emit(event: "close", had_error: boolean): boolean;
        emit(event: "connect"): boolean;
        emit(event: "data", data: Buffer): boolean;
        emit(event: "drain"): boolean;
        emit(event: "end"): boolean;
        emit(event: "error", err: Error): boolean;
        emit(event: "lookup", err: Error, address: string, family: string | number, host: string): boolean;
        emit(event: "ready"): boolean;
        emit(event: "timeout"): boolean;

        on(event: string, listener: (...args: any[]) => void): this;
        on(event: "close", listener: (had_error: boolean) => void): this;
        on(event: "connect", listener: () => void): this;
        on(event: "data", listener: (data: Buffer) => void): this;
        on(event: "drain", listener: () => void): this;
        on(event: "end", listener: () => void): this;
        on(event: "error", listener: (err: Error) => void): this;
        on(event: "lookup", listener: (err: Error, address: string, family: string | number, host: string) => void): this;
        on(event: "ready", listener: () => void): this;
        on(event: "timeout", listener: () => void): this;

        once(event: string, listener: (...args: any[]) => void): this;
        once(event: "close", listener: (had_error: boolean) => void): this;
        once(event: "connect", listener: () => void): this;
        once(event: "data", listener: (data: Buffer) => void): this;
        once(event: "drain", listener: () => void): this;
        once(event: "end", listener: () => void): this;
        once(event: "error", listener: (err: Error) => void): this;
        once(event: "lookup", listener: (err: Error, address: string, family: string | number, host: string) => void): this;
        once(event: "ready", listener: () => void): this;
        once(event: "timeout", listener: () => void): this;

        prependListener(event: string, listener: (...args: any[]) => void): this;
        prependListener(event: "close", listener: (had_error: boolean) => void): this;
        prependListener(event: "connect", listener: () => void): this;
        prependListener(event: "data", listener: (data: Buffer) => void): this;
        prependListener(event: "drain", listener: () => void): this;
        prependListener(event: "end", listener: () => void): this;
        prependListener(event: "error", listener: (err: Error) => void): this;
        prependListener(event: "lookup", listener: (err: Error, address: string, family: string | number, host: string) => void): this;
        prependListener(event: "ready", listener: () => void): this;
        prependListener(event: "timeout", listener: () => void): this;

        prependOnceListener(event: string, listener: (...args: any[]) => void): this;
        prependOnceListener(event: "close", listener: (had_error: boolean) => void): this;
        prependOnceListener(event: "connect", listener: () => void): this;
        prependOnceListener(event: "data", listener: (data: Buffer) => void): this;
        prependOnceListener(event: "drain", listener: () => void): this;
        prependOnceListener(event: "end", listener: () => void): this;
        prependOnceListener(event: "error", listener: (err: Error) => void): this;
        prependOnceListener(event: "lookup", listener: (err: Error, address: string, family: string | number, host: string) => void): this;
        prependOnceListener(event: "ready", listener: () => void): this;
        prependOnceListener(event: "timeout", listener: () => void): this;
    }

    interface ListenOptions {
        port?: number | undefined;
        host?: string | undefined;
        backlog?: number | undefined;
        path?: string | undefined;
        exclusive?: boolean | undefined;
        readableAll?: boolean | undefined;
        writableAll?: boolean | undefined;
        /**
         * @default false
         */
        ipv6Only?: boolean | undefined;
    }

    interface ServerOpts {
        /**
         * Indicates whether half-opened TCP connections are allowed.
         * @default false
         */
        allowHalfOpen?: boolean | undefined;

        /**
         * Indicates whether the socket should be paused on incoming connections.
         * @default false
         */
        pauseOnConnect?: boolean | undefined;
    }

    \/\/ https:\/\/github.com/nodejs/node/blob/master/lib/net.js
    class Server extends EventEmitter {
        constructor(connectionListener?: (socket: Socket) => void);
        constructor(options?: ServerOpts, connectionListener?: (socket: Socket) => void);

        listen(port?: number, hostname?: string, backlog?: number, listeningListener?: () => void): this;
        listen(port?: number, hostname?: string, listeningListener?: () => void): this;
        listen(port?: number, backlog?: number, listeningListener?: () => void): this;
        listen(port?: number, listeningListener?: () => void): this;
        listen(path: string, backlog?: number, listeningListener?: () => void): this;
        listen(path: string, listeningListener?: () => void): this;
        listen(options: ListenOptions, listeningListener?: () => void): this;
        listen(handle: any, backlog?: number, listeningListener?: () => void): this;
        listen(handle: any, listeningListener?: () => void): this;
        close(callback?: (err?: Error) => void): this;
        address(): AddressInfo | string | null;
        getConnections(cb: (error: Error | null, count: number) => void): void;
        ref(): this;
        unref(): this;
        maxConnections: number;
        connections: number;
        listening: boolean;

        /**
         * events.EventEmitter
         *   1. close
         *   2. connection
         *   3. error
         *   4. listening
         */
        addListener(event: string, listener: (...args: any[]) => void): this;
        addListener(event: "close", listener: () => void): this;
        addListener(event: "connection", listener: (socket: Socket) => void): this;
        addListener(event: "error", listener: (err: Error) => void): this;
        addListener(event: "listening", listener: () => void): this;

        emit(event: string | symbol, ...args: any[]): boolean;
        emit(event: "close"): boolean;
        emit(event: "connection", socket: Socket): boolean;
        emit(event: "error", err: Error): boolean;
        emit(event: "listening"): boolean;

        on(event: string, listener: (...args: any[]) => void): this;
        on(event: "close", listener: () => void): this;
        on(event: "connection", listener: (socket: Socket) => void): this;
        on(event: "error", listener: (err: Error) => void): this;
        on(event: "listening", listener: () => void): this;

        once(event: string, listener: (...args: any[]) => void): this;
        once(event: "close", listener: () => void): this;
        once(event: "connection", listener: (socket: Socket) => void): this;
        once(event: "error", listener: (err: Error) => void): this;
        once(event: "listening", listener: () => void): this;

        prependListener(event: string, listener: (...args: any[]) => void): this;
        prependListener(event: "close", listener: () => void): this;
        prependListener(event: "connection", listener: (socket: Socket) => void): this;
        prependListener(event: "error", listener: (err: Error) => void): this;
        prependListener(event: "listening", listener: () => void): this;

        prependOnceListener(event: string, listener: (...args: any[]) => void): this;
        prependOnceListener(event: "close", listener: () => void): this;
        prependOnceListener(event: "connection", listener: (socket: Socket) => void): this;
        prependOnceListener(event: "error", listener: (err: Error) => void): this;
        prependOnceListener(event: "listening", listener: () => void): this;
    }

    interface TcpNetConnectOpts extends TcpSocketConnectOpts, SocketConstructorOpts {
        timeout?: number | undefined;
    }

    interface IpcNetConnectOpts extends IpcSocketConnectOpts, SocketConstructorOpts {
        timeout?: number | undefined;
    }

    type NetConnectOpts = TcpNetConnectOpts | IpcNetConnectOpts;

    function createServer(connectionListener?: (socket: Socket) => void): Server;
    function createServer(options?: ServerOpts, connectionListener?: (socket: Socket) => void): Server;
    function connect(options: NetConnectOpts, connectionListener?: () => void): Socket;
    function connect(port: number, host?: string, connectionListener?: () => void): Socket;
    function connect(path: string, connectionListener?: () => void): Socket;
    function createConnection(options: NetConnectOpts, connectionListener?: () => void): Socket;
    function createConnection(port: number, host?: string, connectionListener?: () => void): Socket;
    function createConnection(path: string, connectionListener?: () => void): Socket;
    function isIP(input: string): number;
    function isIPv4(input: string): boolean;
    function isIPv6(input: string): boolean;
}
`;
definitions['os.d.ts'] = `declare module 'os' {
    interface CpuInfo {
        model: string;
        speed: number;
        times: {
            user: number;
            nice: number;
            sys: number;
            idle: number;
            irq: number;
        };
    }

    interface NetworkInterfaceBase {
        address: string;
        netmask: string;
        mac: string;
        internal: boolean;
        cidr: string | null;
    }

    interface NetworkInterfaceInfoIPv4 extends NetworkInterfaceBase {
        family: "IPv4";
    }

    interface NetworkInterfaceInfoIPv6 extends NetworkInterfaceBase {
        family: "IPv6";
        scopeid: number;
    }

    interface UserInfo<T> {
        username: T;
        uid: number;
        gid: number;
        shell: T;
        homedir: T;
    }

    type NetworkInterfaceInfo = NetworkInterfaceInfoIPv4 | NetworkInterfaceInfoIPv6;

    function hostname(): string;
    function loadavg(): number[];
    function uptime(): number;
    function freemem(): number;
    function totalmem(): number;
    function cpus(): CpuInfo[];
    function type(): string;
    function release(): string;
    function networkInterfaces(): NodeJS.Dict<NetworkInterfaceInfo[]>;
    function homedir(): string;
    function userInfo(options: { encoding: 'buffer' }): UserInfo<Buffer>;
    function userInfo(options?: { encoding: BufferEncoding }): UserInfo<string>;

    type SignalConstants = {
        [key in NodeJS.Signals]: number;
    };

    namespace constants {
        const UV_UDP_REUSEADDR: number;
        namespace signals {}
        const signals: SignalConstants;
        namespace errno {
            const E2BIG: number;
            const EACCES: number;
            const EADDRINUSE: number;
            const EADDRNOTAVAIL: number;
            const EAFNOSUPPORT: number;
            const EAGAIN: number;
            const EALREADY: number;
            const EBADF: number;
            const EBADMSG: number;
            const EBUSY: number;
            const ECANCELED: number;
            const ECHILD: number;
            const ECONNABORTED: number;
            const ECONNREFUSED: number;
            const ECONNRESET: number;
            const EDEADLK: number;
            const EDESTADDRREQ: number;
            const EDOM: number;
            const EDQUOT: number;
            const EEXIST: number;
            const EFAULT: number;
            const EFBIG: number;
            const EHOSTUNREACH: number;
            const EIDRM: number;
            const EILSEQ: number;
            const EINPROGRESS: number;
            const EINTR: number;
            const EINVAL: number;
            const EIO: number;
            const EISCONN: number;
            const EISDIR: number;
            const ELOOP: number;
            const EMFILE: number;
            const EMLINK: number;
            const EMSGSIZE: number;
            const EMULTIHOP: number;
            const ENAMETOOLONG: number;
            const ENETDOWN: number;
            const ENETRESET: number;
            const ENETUNREACH: number;
            const ENFILE: number;
            const ENOBUFS: number;
            const ENODATA: number;
            const ENODEV: number;
            const ENOENT: number;
            const ENOEXEC: number;
            const ENOLCK: number;
            const ENOLINK: number;
            const ENOMEM: number;
            const ENOMSG: number;
            const ENOPROTOOPT: number;
            const ENOSPC: number;
            const ENOSR: number;
            const ENOSTR: number;
            const ENOSYS: number;
            const ENOTCONN: number;
            const ENOTDIR: number;
            const ENOTEMPTY: number;
            const ENOTSOCK: number;
            const ENOTSUP: number;
            const ENOTTY: number;
            const ENXIO: number;
            const EOPNOTSUPP: number;
            const EOVERFLOW: number;
            const EPERM: number;
            const EPIPE: number;
            const EPROTO: number;
            const EPROTONOSUPPORT: number;
            const EPROTOTYPE: number;
            const ERANGE: number;
            const EROFS: number;
            const ESPIPE: number;
            const ESRCH: number;
            const ESTALE: number;
            const ETIME: number;
            const ETIMEDOUT: number;
            const ETXTBSY: number;
            const EWOULDBLOCK: number;
            const EXDEV: number;
            const WSAEINTR: number;
            const WSAEBADF: number;
            const WSAEACCES: number;
            const WSAEFAULT: number;
            const WSAEINVAL: number;
            const WSAEMFILE: number;
            const WSAEWOULDBLOCK: number;
            const WSAEINPROGRESS: number;
            const WSAEALREADY: number;
            const WSAENOTSOCK: number;
            const WSAEDESTADDRREQ: number;
            const WSAEMSGSIZE: number;
            const WSAEPROTOTYPE: number;
            const WSAENOPROTOOPT: number;
            const WSAEPROTONOSUPPORT: number;
            const WSAESOCKTNOSUPPORT: number;
            const WSAEOPNOTSUPP: number;
            const WSAEPFNOSUPPORT: number;
            const WSAEAFNOSUPPORT: number;
            const WSAEADDRINUSE: number;
            const WSAEADDRNOTAVAIL: number;
            const WSAENETDOWN: number;
            const WSAENETUNREACH: number;
            const WSAENETRESET: number;
            const WSAECONNABORTED: number;
            const WSAECONNRESET: number;
            const WSAENOBUFS: number;
            const WSAEISCONN: number;
            const WSAENOTCONN: number;
            const WSAESHUTDOWN: number;
            const WSAETOOMANYREFS: number;
            const WSAETIMEDOUT: number;
            const WSAECONNREFUSED: number;
            const WSAELOOP: number;
            const WSAENAMETOOLONG: number;
            const WSAEHOSTDOWN: number;
            const WSAEHOSTUNREACH: number;
            const WSAENOTEMPTY: number;
            const WSAEPROCLIM: number;
            const WSAEUSERS: number;
            const WSAEDQUOT: number;
            const WSAESTALE: number;
            const WSAEREMOTE: number;
            const WSASYSNOTREADY: number;
            const WSAVERNOTSUPPORTED: number;
            const WSANOTINITIALISED: number;
            const WSAEDISCON: number;
            const WSAENOMORE: number;
            const WSAECANCELLED: number;
            const WSAEINVALIDPROCTABLE: number;
            const WSAEINVALIDPROVIDER: number;
            const WSAEPROVIDERFAILEDINIT: number;
            const WSASYSCALLFAILURE: number;
            const WSASERVICE_NOT_FOUND: number;
            const WSATYPE_NOT_FOUND: number;
            const WSA_E_NO_MORE: number;
            const WSA_E_CANCELLED: number;
            const WSAEREFUSED: number;
        }
        namespace priority {
            const PRIORITY_LOW: number;
            const PRIORITY_BELOW_NORMAL: number;
            const PRIORITY_NORMAL: number;
            const PRIORITY_ABOVE_NORMAL: number;
            const PRIORITY_HIGH: number;
            const PRIORITY_HIGHEST: number;
        }
    }

    function arch(): string;
    /**
     * Returns a string identifying the kernel version.
     * On POSIX systems, the operating system release is determined by calling
     * [uname(3)][]. On Windows, \`pRtlGetVersion\` is used, and if it is not available,
     * \`GetVersionExW()\` will be used. See
     * https:\/\/en.wikipedia.org/wiki/Uname#Examples for more information.
     */
    function version(): string;
    function platform(): NodeJS.Platform;
    function tmpdir(): string;
    const EOL: string;
    function endianness(): "BE" | "LE";
    /**
     * Gets the priority of a process.
     * Defaults to current process.
     */
    function getPriority(pid?: number): number;
    /**
     * Sets the priority of the current process.
     * @param priority Must be in range of -20 to 19
     */
    function setPriority(priority: number): void;
    /**
     * Sets the priority of the process specified process.
     * @param priority Must be in range of -20 to 19
     */
    function setPriority(pid: number, priority: number): void;
}
`;
definitions['path.d.ts'] = `declare module 'path' {
    namespace path {
        /**
         * A parsed path object generated by path.parse() or consumed by path.format().
         */
        interface ParsedPath {
            /**
             * The root of the path such as '/' or 'c:\'
             */
            root: string;
            /**
             * The full directory path such as '/home/user/dir' or 'c:\path\dir'
             */
            dir: string;
            /**
             * The file name including extension (if any) such as 'index.html'
             */
            base: string;
            /**
             * The file extension (if any) such as '.html'
             */
            ext: string;
            /**
             * The file name without extension (if any) such as 'index'
             */
            name: string;
        }

        interface FormatInputPathObject {
            /**
             * The root of the path such as '/' or 'c:\'
             */
            root?: string | undefined;
            /**
             * The full directory path such as '/home/user/dir' or 'c:\path\dir'
             */
            dir?: string | undefined;
            /**
             * The file name including extension (if any) such as 'index.html'
             */
            base?: string | undefined;
            /**
             * The file extension (if any) such as '.html'
             */
            ext?: string | undefined;
            /**
             * The file name without extension (if any) such as 'index'
             */
            name?: string | undefined;
        }

        interface PlatformPath {
            /**
             * Normalize a string path, reducing '..' and '.' parts.
             * When multiple slashes are found, they're replaced by a single one; when the path contains a trailing slash, it is preserved. On Windows backslashes are used.
             *
             * @param p string path to normalize.
             */
            normalize(p: string): string;
            /**
             * Join all arguments together and normalize the resulting path.
             * Arguments must be strings. In v0.8, non-string arguments were silently ignored. In v0.10 and up, an exception is thrown.
             *
             * @param paths paths to join.
             */
            join(...paths: string[]): string;
            /**
             * The right-most parameter is considered {to}.  Other parameters are considered an array of {from}.
             *
             * Starting from leftmost {from} parameter, resolves {to} to an absolute path.
             *
             * If {to} isn't already absolute, {from} arguments are prepended in right to left order,
             * until an absolute path is found. If after using all {from} paths still no absolute path is found,
             * the current working directory is used as well. The resulting path is normalized,
             * and trailing slashes are removed unless the path gets resolved to the root directory.
             *
             * @param pathSegments string paths to join.  Non-string arguments are ignored.
             */
            resolve(...pathSegments: string[]): string;
            /**
             * Determines whether {path} is an absolute path. An absolute path will always resolve to the same location, regardless of the working directory.
             *
             * @param path path to test.
             */
            isAbsolute(p: string): boolean;
            /**
             * Solve the relative path from {from} to {to}.
             * At times we have two absolute paths, and we need to derive the relative path from one to the other. This is actually the reverse transform of path.resolve.
             */
            relative(from: string, to: string): string;
            /**
             * Return the directory name of a path. Similar to the Unix dirname command.
             *
             * @param p the path to evaluate.
             */
            dirname(p: string): string;
            /**
             * Return the last portion of a path. Similar to the Unix basename command.
             * Often used to extract the file name from a fully qualified path.
             *
             * @param p the path to evaluate.
             * @param ext optionally, an extension to remove from the result.
             */
            basename(p: string, ext?: string): string;
            /**
             * Return the extension of the path, from the last '.' to end of string in the last portion of the path.
             * If there is no '.' in the last portion of the path or the first character of it is '.', then it returns an empty string
             *
             * @param p the path to evaluate.
             */
            extname(p: string): string;
            /**
             * The platform-specific file separator. '\\' or '/'.
             */
            readonly sep: string;
            /**
             * The platform-specific file delimiter. ';' or ':'.
             */
            readonly delimiter: string;
            /**
             * Returns an object from a path string - the opposite of format().
             *
             * @param pathString path to evaluate.
             */
            parse(p: string): ParsedPath;
            /**
             * Returns a path string from an object - the opposite of parse().
             *
             * @param pathString path to evaluate.
             */
            format(pP: FormatInputPathObject): string;
            /**
             * On Windows systems only, returns an equivalent namespace-prefixed path for the given path.
             * If path is not a string, path will be returned without modifications.
             * This method is meaningful only on Windows system.
             * On POSIX systems, the method is non-operational and always returns path without modifications.
             */
            toNamespacedPath(path: string): string;
            /**
             * Posix specific pathing.
             * Same as parent object on posix.
             */
            readonly posix: PlatformPath;
            /**
             * Windows specific pathing.
             * Same as parent object on windows
             */
            readonly win32: PlatformPath;
        }
    }
    const path: path.PlatformPath;
    export = path;
}
`;
definitions['perf_hooks.d.ts'] = `declare module 'perf_hooks' {
    import { AsyncResource } from 'async_hooks';

    type EntryType = 'node' | 'mark' | 'measure' | 'gc' | 'function' | 'http2' | 'http';

    interface PerformanceEntry {
        /**
         * The total number of milliseconds elapsed for this entry.
         * This value will not be meaningful for all Performance Entry types.
         */
        readonly duration: number;

        /**
         * The name of the performance entry.
         */
        readonly name: string;

        /**
         * The high resolution millisecond timestamp marking the starting time of the Performance Entry.
         */
        readonly startTime: number;

        /**
         * The type of the performance entry.
         * Currently it may be one of: 'node', 'mark', 'measure', 'gc', or 'function'.
         */
        readonly entryType: EntryType;

        /**
         * When \`performanceEntry.entryType\` is equal to 'gc', \`the performance.kind\` property identifies
         * the type of garbage collection operation that occurred.
         * See perf_hooks.constants for valid values.
         */
        readonly kind?: number | undefined;

        /**
         * When \`performanceEntry.entryType\` is equal to 'gc', the \`performance.flags\`
         * property contains additional information about garbage collection operation.
         * See perf_hooks.constants for valid values.
         */
        readonly flags?: number | undefined;
    }

    interface PerformanceNodeTiming extends PerformanceEntry {
        /**
         * The high resolution millisecond timestamp at which the Node.js process completed bootstrap.
         */
        readonly bootstrapComplete: number;

        /**
         * The high resolution millisecond timestamp at which the Node.js process completed bootstrapping.
         * If bootstrapping has not yet finished, the property has the value of -1.
         */
        readonly environment: number;

        /**
         * The high resolution millisecond timestamp at which the Node.js environment was initialized.
         */
        readonly idleTime: number;

        /**
         * The high resolution millisecond timestamp of the amount of time the event loop has been idle
         *  within the event loop's event provider (e.g. \`epoll_wait\`). This does not take CPU usage
         * into consideration. If the event loop has not yet started (e.g., in the first tick of the main script),
         *  the property has the value of 0.
         */
        readonly loopExit: number;

        /**
         * The high resolution millisecond timestamp at which the Node.js event loop started.
         * If the event loop has not yet started (e.g., in the first tick of the main script), the property has the value of -1.
         */
        readonly loopStart: number;

        /**
         * The high resolution millisecond timestamp at which the V8 platform was initialized.
         */
        readonly v8Start: number;
    }

    interface EventLoopUtilization {
        idle: number;
        active: number;
        utilization: number;
    }

    interface Performance {
        /**
         * If name is not provided, removes all PerformanceMark objects from the Performance Timeline.
         * If name is provided, removes only the named mark.
         * @param name
         */
        clearMarks(name?: string): void;

        /**
         * Creates a new PerformanceMark entry in the Performance Timeline.
         * A PerformanceMark is a subclass of PerformanceEntry whose performanceEntry.entryType is always 'mark',
         * and whose performanceEntry.duration is always 0.
         * Performance marks are used to mark specific significant moments in the Performance Timeline.
         * @param name
         */
        mark(name?: string): void;

        /**
         * Creates a new PerformanceMeasure entry in the Performance Timeline.
         * A PerformanceMeasure is a subclass of PerformanceEntry whose performanceEntry.entryType is always 'measure',
         * and whose performanceEntry.duration measures the number of milliseconds elapsed since startMark and endMark.
         *
         * The startMark argument may identify any existing PerformanceMark in the the Performance Timeline, or may identify
         * any of the timestamp properties provided by the PerformanceNodeTiming class. If the named startMark does not exist,
         * then startMark is set to timeOrigin by default.
         *
         * The endMark argument must identify any existing PerformanceMark in the the Performance Timeline or any of the timestamp
         * properties provided by the PerformanceNodeTiming class. If the named endMark does not exist, an error will be thrown.
         * @param name
         * @param startMark
         * @param endMark
         */
        measure(name: string, startMark?: string, endMark?: string): void;

        /**
         * An instance of the PerformanceNodeTiming class that provides performance metrics for specific Node.js operational milestones.
         */
        readonly nodeTiming: PerformanceNodeTiming;

        /**
         * @return the current high resolution millisecond timestamp
         */
        now(): number;

        /**
         * The timeOrigin specifies the high resolution millisecond timestamp from which all performance metric durations are measured.
         */
        readonly timeOrigin: number;

        /**
         * Wraps a function within a new function that measures the running time of the wrapped function.
         * A PerformanceObserver must be subscribed to the 'function' event type in order for the timing details to be accessed.
         * @param fn
         */
        timerify<T extends (...optionalParams: any[]) => any>(fn: T): T;

        /**
         * eventLoopUtilization is similar to CPU utilization except that it is calculated using high precision wall-clock time.
         * It represents the percentage of time the event loop has spent outside the event loop's event provider (e.g. epoll_wait).
         * No other CPU idle time is taken into consideration.
         *
         * @param util1 The result of a previous call to eventLoopUtilization()
         * @param util2 The result of a previous call to eventLoopUtilization() prior to util1
         */
        eventLoopUtilization(util1?: EventLoopUtilization, util2?: EventLoopUtilization): EventLoopUtilization;
    }

    interface PerformanceObserverEntryList {
        /**
         * @return a list of PerformanceEntry objects in chronological order with respect to performanceEntry.startTime.
         */
        getEntries(): PerformanceEntry[];

        /**
         * @return a list of PerformanceEntry objects in chronological order with respect to performanceEntry.startTime
         * whose performanceEntry.name is equal to name, and optionally, whose performanceEntry.entryType is equal to type.
         */
        getEntriesByName(name: string, type?: EntryType): PerformanceEntry[];

        /**
         * @return Returns a list of PerformanceEntry objects in chronological order with respect to performanceEntry.startTime
         * whose performanceEntry.entryType is equal to type.
         */
        getEntriesByType(type: EntryType): PerformanceEntry[];
    }

    type PerformanceObserverCallback = (list: PerformanceObserverEntryList, observer: PerformanceObserver) => void;

    class PerformanceObserver extends AsyncResource {
        constructor(callback: PerformanceObserverCallback);

        /**
         * Disconnects the PerformanceObserver instance from all notifications.
         */
        disconnect(): void;

        /**
         * Subscribes the PerformanceObserver instance to notifications of new PerformanceEntry instances identified by options.entryTypes.
         * When options.buffered is false, the callback will be invoked once for every PerformanceEntry instance.
         * Property buffered defaults to false.
         * @param options
         */
        observe(options: { entryTypes: ReadonlyArray<EntryType>; buffered?: boolean | undefined }): void;
    }

    namespace constants {
        const NODE_PERFORMANCE_GC_MAJOR: number;
        const NODE_PERFORMANCE_GC_MINOR: number;
        const NODE_PERFORMANCE_GC_INCREMENTAL: number;
        const NODE_PERFORMANCE_GC_WEAKCB: number;

        const NODE_PERFORMANCE_GC_FLAGS_NO: number;
        const NODE_PERFORMANCE_GC_FLAGS_CONSTRUCT_RETAINED: number;
        const NODE_PERFORMANCE_GC_FLAGS_FORCED: number;
        const NODE_PERFORMANCE_GC_FLAGS_SYNCHRONOUS_PHANTOM_PROCESSING: number;
        const NODE_PERFORMANCE_GC_FLAGS_ALL_AVAILABLE_GARBAGE: number;
        const NODE_PERFORMANCE_GC_FLAGS_ALL_EXTERNAL_MEMORY: number;
        const NODE_PERFORMANCE_GC_FLAGS_SCHEDULE_IDLE: number;
    }

    const performance: Performance;

    interface EventLoopMonitorOptions {
        /**
         * The sampling rate in milliseconds.
         * Must be greater than zero.
         * @default 10
         */
        resolution?: number | undefined;
    }

    interface EventLoopDelayMonitor {
        /**
         * Enables the event loop delay sample timer. Returns \`true\` if the timer was started, \`false\` if it was already started.
         */
        enable(): boolean;
        /**
         * Disables the event loop delay sample timer. Returns \`true\` if the timer was stopped, \`false\` if it was already stopped.
         */
        disable(): boolean;

        /**
         * Resets the collected histogram data.
         */
        reset(): void;

        /**
         * Returns the value at the given percentile.
         * @param percentile A percentile value between 1 and 100.
         */
        percentile(percentile: number): number;

        /**
         * A \`Map\` object detailing the accumulated percentile distribution.
         */
        readonly percentiles: Map<number, number>;

        /**
         * The number of times the event loop delay exceeded the maximum 1 hour eventloop delay threshold.
         */
        readonly exceeds: number;

        /**
         * The minimum recorded event loop delay.
         */
        readonly min: number;

        /**
         * The maximum recorded event loop delay.
         */
        readonly max: number;

        /**
         * The mean of the recorded event loop delays.
         */
        readonly mean: number;

        /**
         * The standard deviation of the recorded event loop delays.
         */
        readonly stddev: number;
    }

    function monitorEventLoopDelay(options?: EventLoopMonitorOptions): EventLoopDelayMonitor;
}
`;
definitions['process.d.ts'] = `declare module 'process' {
    import * as tty from 'tty';

    global {
        var process: NodeJS.Process;

        namespace NodeJS {
            \/\/ this namespace merge is here because these are specifically used
            \/\/ as the type for process.stdin, process.stdout, and process.stderr.
            \/\/ they can't live in tty.d.ts because we need to disambiguate the imported name.
            interface ReadStream extends tty.ReadStream {}
            interface WriteStream extends tty.WriteStream {}

            interface MemoryUsage {
                rss: number;
                heapTotal: number;
                heapUsed: number;
                external: number;
                arrayBuffers: number;
            }

            interface CpuUsage {
                user: number;
                system: number;
            }

            interface ProcessRelease {
                name: string;
                sourceUrl?: string | undefined;
                headersUrl?: string | undefined;
                libUrl?: string | undefined;
                lts?: string | undefined;
            }

            interface ProcessVersions extends Dict<string> {
                http_parser: string;
                node: string;
                v8: string;
                ares: string;
                uv: string;
                zlib: string;
                modules: string;
                openssl: string;
            }

            type Platform = 'aix'
                | 'android'
                | 'darwin'
                | 'freebsd'
                | 'linux'
                | 'openbsd'
                | 'sunos'
                | 'win32'
                | 'cygwin'
                | 'netbsd';

            type Signals =
                "SIGABRT" | "SIGALRM" | "SIGBUS" | "SIGCHLD" | "SIGCONT" | "SIGFPE" | "SIGHUP" | "SIGILL" | "SIGINT" | "SIGIO" |
                "SIGIOT" | "SIGKILL" | "SIGPIPE" | "SIGPOLL" | "SIGPROF" | "SIGPWR" | "SIGQUIT" | "SIGSEGV" | "SIGSTKFLT" |
                "SIGSTOP" | "SIGSYS" | "SIGTERM" | "SIGTRAP" | "SIGTSTP" | "SIGTTIN" | "SIGTTOU" | "SIGUNUSED" | "SIGURG" |
                "SIGUSR1" | "SIGUSR2" | "SIGVTALRM" | "SIGWINCH" | "SIGXCPU" | "SIGXFSZ" | "SIGBREAK" | "SIGLOST" | "SIGINFO";

            type UncaughtExceptionOrigin = 'uncaughtException' | 'unhandledRejection';
            type MultipleResolveType = 'resolve' | 'reject';

            type BeforeExitListener = (code: number) => void;
            type DisconnectListener = () => void;
            type ExitListener = (code: number) => void;
            type RejectionHandledListener = (promise: Promise<any>) => void;
            type UncaughtExceptionListener = (error: Error, origin: UncaughtExceptionOrigin) => void;
            type UnhandledRejectionListener = (reason: {} | null | undefined, promise: Promise<any>) => void;
            type WarningListener = (warning: Error) => void;
            type MessageListener = (message: any, sendHandle: any) => void;
            type SignalsListener = (signal: Signals) => void;
            type NewListenerListener = (type: string | symbol, listener: (...args: any[]) => void) => void;
            type RemoveListenerListener = (type: string | symbol, listener: (...args: any[]) => void) => void;
            type MultipleResolveListener = (type: MultipleResolveType, promise: Promise<any>, value: any) => void;

            interface Socket extends ReadWriteStream {
                isTTY?: true | undefined;
            }

            \/\/ Alias for compatibility
            interface ProcessEnv extends Dict<string> {}

            interface HRTime {
                (time?: [number, number]): [number, number];
                bigint(): bigint;
            }

            interface ProcessReport {
                /**
                 * Directory where the report is written.
                 * working directory of the Node.js process.
                 * @default '' indicating that reports are written to the current
                 */
                directory: string;

                /**
                 * Filename where the report is written.
                 * The default value is the empty string.
                 * @default '' the output filename will be comprised of a timestamp,
                 * PID, and sequence number.
                 */
                filename: string;

                /**
                 * Returns a JSON-formatted diagnostic report for the running process.
                 * The report's JavaScript stack trace is taken from err, if present.
                 */
                getReport(err?: Error): string;

                /**
                 * If true, a diagnostic report is generated on fatal errors,
                 * such as out of memory errors or failed C++ assertions.
                 * @default false
                 */
                reportOnFatalError: boolean;

                /**
                 * If true, a diagnostic report is generated when the process
                 * receives the signal specified by process.report.signal.
                 * @defaul false
                 */
                reportOnSignal: boolean;

                /**
                 * If true, a diagnostic report is generated on uncaught exception.
                 * @default false
                 */
                reportOnUncaughtException: boolean;

                /**
                 * The signal used to trigger the creation of a diagnostic report.
                 * @default 'SIGUSR2'
                 */
                signal: Signals;

                /**
                 * Writes a diagnostic report to a file. If filename is not provided, the default filename
                 * includes the date, time, PID, and a sequence number.
                 * The report's JavaScript stack trace is taken from err, if present.
                 *
                 * @param fileName Name of the file where the report is written.
                 * This should be a relative path, that will be appended to the directory specified in
                 * \`process.report.directory\`, or the current working directory of the Node.js process,
                 * if unspecified.
                 * @param error A custom error used for reporting the JavaScript stack.
                 * @return Filename of the generated report.
                 */
                writeReport(fileName?: string): string;
                writeReport(error?: Error): string;
                writeReport(fileName?: string, err?: Error): string;
            }

            interface ResourceUsage {
                fsRead: number;
                fsWrite: number;
                involuntaryContextSwitches: number;
                ipcReceived: number;
                ipcSent: number;
                majorPageFault: number;
                maxRSS: number;
                minorPageFault: number;
                sharedMemorySize: number;
                signalsCount: number;
                swappedOut: number;
                systemCPUTime: number;
                unsharedDataSize: number;
                unsharedStackSize: number;
                userCPUTime: number;
                voluntaryContextSwitches: number;
            }

            interface Process extends EventEmitter {
                /**
                 * Can also be a tty.WriteStream, not typed due to limitations.
                 */
                stdout: WriteStream & {
                    fd: 1;
                };
                /**
                 * Can also be a tty.WriteStream, not typed due to limitations.
                 */
                stderr: WriteStream & {
                    fd: 2;
                };
                stdin: ReadStream & {
                    fd: 0;
                };
                openStdin(): Socket;
                argv: string[];
                argv0: string;
                execArgv: string[];
                execPath: string;
                abort(): never;
                chdir(directory: string): void;
                cwd(): string;
                debugPort: number;
                emitWarning(warning: string | Error, name?: string, ctor?: Function): void;
                env: ProcessEnv;
                exit(code?: number): never;
                exitCode?: number | undefined;
                getgid(): number;
                setgid(id: number | string): void;
                getuid(): number;
                setuid(id: number | string): void;
                geteuid(): number;
                seteuid(id: number | string): void;
                getegid(): number;
                setegid(id: number | string): void;
                getgroups(): number[];
                setgroups(groups: ReadonlyArray<string | number>): void;
                setUncaughtExceptionCaptureCallback(cb: ((err: Error) => void) | null): void;
                hasUncaughtExceptionCaptureCallback(): boolean;
                version: string;
                versions: ProcessVersions;
                config: {
                    target_defaults: {
                        cflags: any[];
                        default_configuration: string;
                        defines: string[];
                        include_dirs: string[];
                        libraries: string[];
                    };
                    variables: {
                        clang: number;
                        host_arch: string;
                        node_install_npm: boolean;
                        node_install_waf: boolean;
                        node_prefix: string;
                        node_shared_openssl: boolean;
                        node_shared_v8: boolean;
                        node_shared_zlib: boolean;
                        node_use_dtrace: boolean;
                        node_use_etw: boolean;
                        node_use_openssl: boolean;
                        target_arch: string;
                        v8_no_strict_aliasing: number;
                        v8_use_snapshot: boolean;
                        visibility: string;
                    };
                };
                kill(pid: number, signal?: string | number): true;
                pid: number;
                ppid: number;
                title: string;
                arch: string;
                platform: Platform;
                /** @deprecated since v14.0.0 - use \`require.main\` instead. */
                mainModule?: Module | undefined;
                memoryUsage(): MemoryUsage;
                cpuUsage(previousValue?: CpuUsage): CpuUsage;
                nextTick(callback: Function, ...args: any[]): void;
                release: ProcessRelease;
                features: {
                    inspector: boolean;
                    debug: boolean;
                    uv: boolean;
                    ipv6: boolean;
                    tls_alpn: boolean;
                    tls_sni: boolean;
                    tls_ocsp: boolean;
                    tls: boolean;
                };
                /**
                 * @deprecated since v14.0.0 - Calling process.umask() with no argument causes
                 * the process-wide umask to be written twice. This introduces a race condition between threads,
                 * and is a potential security vulnerability. There is no safe, cross-platform alternative API.
                 */
                umask(): number;
                /**
                 * Can only be set if not in worker thread.
                 */
                umask(mask: string | number): number;
                uptime(): number;
                hrtime: HRTime;
                domain: Domain;

                \/\/ Worker
                send?(message: any, sendHandle?: any, options?: { swallowErrors?: boolean | undefined}, callback?: (error: Error | null) => void): boolean;
                disconnect(): void;
                connected: boolean;

                /**
                 * The \`process.allowedNodeEnvironmentFlags\` property is a special,
                 * read-only \`Set\` of flags allowable within the [\`NODE_OPTIONS\`][]
                 * environment variable.
                 */
                allowedNodeEnvironmentFlags: ReadonlySet<string>;

                /**
                 * Only available with \`--experimental-report\`
                 */
                report?: ProcessReport | undefined;

                resourceUsage(): ResourceUsage;

                traceDeprecation: boolean;

                /* EventEmitter */
                addListener(event: "beforeExit", listener: BeforeExitListener): this;
                addListener(event: "disconnect", listener: DisconnectListener): this;
                addListener(event: "exit", listener: ExitListener): this;
                addListener(event: "rejectionHandled", listener: RejectionHandledListener): this;
                addListener(event: "uncaughtException", listener: UncaughtExceptionListener): this;
                addListener(event: "uncaughtExceptionMonitor", listener: UncaughtExceptionListener): this;
                addListener(event: "unhandledRejection", listener: UnhandledRejectionListener): this;
                addListener(event: "warning", listener: WarningListener): this;
                addListener(event: "message", listener: MessageListener): this;
                addListener(event: Signals, listener: SignalsListener): this;
                addListener(event: "newListener", listener: NewListenerListener): this;
                addListener(event: "removeListener", listener: RemoveListenerListener): this;
                addListener(event: "multipleResolves", listener: MultipleResolveListener): this;

                emit(event: "beforeExit", code: number): boolean;
                emit(event: "disconnect"): boolean;
                emit(event: "exit", code: number): boolean;
                emit(event: "rejectionHandled", promise: Promise<any>): boolean;
                emit(event: "uncaughtException", error: Error): boolean;
                emit(event: "uncaughtExceptionMonitor", error: Error): boolean;
                emit(event: "unhandledRejection", reason: any, promise: Promise<any>): boolean;
                emit(event: "warning", warning: Error): boolean;
                emit(event: "message", message: any, sendHandle: any): this;
                emit(event: Signals, signal: Signals): boolean;
                emit(event: "newListener", eventName: string | symbol, listener: (...args: any[]) => void): this;
                emit(event: "removeListener", eventName: string, listener: (...args: any[]) => void): this;
                emit(event: "multipleResolves", listener: MultipleResolveListener): this;

                on(event: "beforeExit", listener: BeforeExitListener): this;
                on(event: "disconnect", listener: DisconnectListener): this;
                on(event: "exit", listener: ExitListener): this;
                on(event: "rejectionHandled", listener: RejectionHandledListener): this;
                on(event: "uncaughtException", listener: UncaughtExceptionListener): this;
                on(event: "uncaughtExceptionMonitor", listener: UncaughtExceptionListener): this;
                on(event: "unhandledRejection", listener: UnhandledRejectionListener): this;
                on(event: "warning", listener: WarningListener): this;
                on(event: "message", listener: MessageListener): this;
                on(event: Signals, listener: SignalsListener): this;
                on(event: "newListener", listener: NewListenerListener): this;
                on(event: "removeListener", listener: RemoveListenerListener): this;
                on(event: "multipleResolves", listener: MultipleResolveListener): this;
                on(event: string | symbol, listener: (...args: any[]) => void): this;

                once(event: "beforeExit", listener: BeforeExitListener): this;
                once(event: "disconnect", listener: DisconnectListener): this;
                once(event: "exit", listener: ExitListener): this;
                once(event: "rejectionHandled", listener: RejectionHandledListener): this;
                once(event: "uncaughtException", listener: UncaughtExceptionListener): this;
                once(event: "uncaughtExceptionMonitor", listener: UncaughtExceptionListener): this;
                once(event: "unhandledRejection", listener: UnhandledRejectionListener): this;
                once(event: "warning", listener: WarningListener): this;
                once(event: "message", listener: MessageListener): this;
                once(event: Signals, listener: SignalsListener): this;
                once(event: "newListener", listener: NewListenerListener): this;
                once(event: "removeListener", listener: RemoveListenerListener): this;
                once(event: "multipleResolves", listener: MultipleResolveListener): this;

                prependListener(event: "beforeExit", listener: BeforeExitListener): this;
                prependListener(event: "disconnect", listener: DisconnectListener): this;
                prependListener(event: "exit", listener: ExitListener): this;
                prependListener(event: "rejectionHandled", listener: RejectionHandledListener): this;
                prependListener(event: "uncaughtException", listener: UncaughtExceptionListener): this;
                prependListener(event: "uncaughtExceptionMonitor", listener: UncaughtExceptionListener): this;
                prependListener(event: "unhandledRejection", listener: UnhandledRejectionListener): this;
                prependListener(event: "warning", listener: WarningListener): this;
                prependListener(event: "message", listener: MessageListener): this;
                prependListener(event: Signals, listener: SignalsListener): this;
                prependListener(event: "newListener", listener: NewListenerListener): this;
                prependListener(event: "removeListener", listener: RemoveListenerListener): this;
                prependListener(event: "multipleResolves", listener: MultipleResolveListener): this;

                prependOnceListener(event: "beforeExit", listener: BeforeExitListener): this;
                prependOnceListener(event: "disconnect", listener: DisconnectListener): this;
                prependOnceListener(event: "exit", listener: ExitListener): this;
                prependOnceListener(event: "rejectionHandled", listener: RejectionHandledListener): this;
                prependOnceListener(event: "uncaughtException", listener: UncaughtExceptionListener): this;
                prependOnceListener(event: "uncaughtExceptionMonitor", listener: UncaughtExceptionListener): this;
                prependOnceListener(event: "unhandledRejection", listener: UnhandledRejectionListener): this;
                prependOnceListener(event: "warning", listener: WarningListener): this;
                prependOnceListener(event: "message", listener: MessageListener): this;
                prependOnceListener(event: Signals, listener: SignalsListener): this;
                prependOnceListener(event: "newListener", listener: NewListenerListener): this;
                prependOnceListener(event: "removeListener", listener: RemoveListenerListener): this;
                prependOnceListener(event: "multipleResolves", listener: MultipleResolveListener): this;

                listeners(event: "beforeExit"): BeforeExitListener[];
                listeners(event: "disconnect"): DisconnectListener[];
                listeners(event: "exit"): ExitListener[];
                listeners(event: "rejectionHandled"): RejectionHandledListener[];
                listeners(event: "uncaughtException"): UncaughtExceptionListener[];
                listeners(event: "uncaughtExceptionMonitor"): UncaughtExceptionListener[];
                listeners(event: "unhandledRejection"): UnhandledRejectionListener[];
                listeners(event: "warning"): WarningListener[];
                listeners(event: "message"): MessageListener[];
                listeners(event: Signals): SignalsListener[];
                listeners(event: "newListener"): NewListenerListener[];
                listeners(event: "removeListener"): RemoveListenerListener[];
                listeners(event: "multipleResolves"): MultipleResolveListener[];
            }

            interface Global {
                process: Process;
            }
        }
    }

    export = process;
}
`;
definitions['punycode.d.ts'] = `/**
 * @deprecated since v7.0.0
 * The version of the punycode module bundled in Node.js is being deprecated.
 * In a future major version of Node.js this module will be removed.
 * Users currently depending on the punycode module should switch to using
 * the userland-provided Punycode.js module instead.
 */
declare module 'punycode' {
    /**
     * @deprecated since v7.0.0
     * The version of the punycode module bundled in Node.js is being deprecated.
     * In a future major version of Node.js this module will be removed.
     * Users currently depending on the punycode module should switch to using
     * the userland-provided Punycode.js module instead.
     */
    function decode(string: string): string;
    /**
     * @deprecated since v7.0.0
     * The version of the punycode module bundled in Node.js is being deprecated.
     * In a future major version of Node.js this module will be removed.
     * Users currently depending on the punycode module should switch to using
     * the userland-provided Punycode.js module instead.
     */
    function encode(string: string): string;
    /**
     * @deprecated since v7.0.0
     * The version of the punycode module bundled in Node.js is being deprecated.
     * In a future major version of Node.js this module will be removed.
     * Users currently depending on the punycode module should switch to using
     * the userland-provided Punycode.js module instead.
     */
    function toUnicode(domain: string): string;
    /**
     * @deprecated since v7.0.0
     * The version of the punycode module bundled in Node.js is being deprecated.
     * In a future major version of Node.js this module will be removed.
     * Users currently depending on the punycode module should switch to using
     * the userland-provided Punycode.js module instead.
     */
    function toASCII(domain: string): string;
    /**
     * @deprecated since v7.0.0
     * The version of the punycode module bundled in Node.js is being deprecated.
     * In a future major version of Node.js this module will be removed.
     * Users currently depending on the punycode module should switch to using
     * the userland-provided Punycode.js module instead.
     */
    const ucs2: ucs2;
    interface ucs2 {
        /**
         * @deprecated since v7.0.0
         * The version of the punycode module bundled in Node.js is being deprecated.
         * In a future major version of Node.js this module will be removed.
         * Users currently depending on the punycode module should switch to using
         * the userland-provided Punycode.js module instead.
         */
        decode(string: string): number[];
        /**
         * @deprecated since v7.0.0
         * The version of the punycode module bundled in Node.js is being deprecated.
         * In a future major version of Node.js this module will be removed.
         * Users currently depending on the punycode module should switch to using
         * the userland-provided Punycode.js module instead.
         */
        encode(codePoints: ReadonlyArray<number>): string;
    }
    /**
     * @deprecated since v7.0.0
     * The version of the punycode module bundled in Node.js is being deprecated.
     * In a future major version of Node.js this module will be removed.
     * Users currently depending on the punycode module should switch to using
     * the userland-provided Punycode.js module instead.
     */
    const version: string;
}
`;
definitions['querystring.d.ts'] = `declare module 'querystring' {
    interface StringifyOptions {
        encodeURIComponent?: ((str: string) => string) | undefined;
    }

    interface ParseOptions {
        maxKeys?: number | undefined;
        decodeURIComponent?: ((str: string) => string) | undefined;
    }

    interface ParsedUrlQuery extends NodeJS.Dict<string | string[]> { }

    interface ParsedUrlQueryInput extends NodeJS.Dict<string | number | boolean | ReadonlyArray<string> | ReadonlyArray<number> | ReadonlyArray<boolean> | null> {
    }

    function stringify(obj?: ParsedUrlQueryInput, sep?: string, eq?: string, options?: StringifyOptions): string;
    function parse(str: string, sep?: string, eq?: string, options?: ParseOptions): ParsedUrlQuery;
    /**
     * The querystring.encode() function is an alias for querystring.stringify().
     */
    const encode: typeof stringify;
    /**
     * The querystring.decode() function is an alias for querystring.parse().
     */
    const decode: typeof parse;
    function escape(str: string): string;
    function unescape(str: string): string;
}
`;
definitions['readline.d.ts'] = `declare module 'readline' {
    import EventEmitter = require('events');

    interface Key {
        sequence?: string | undefined;
        name?: string | undefined;
        ctrl?: boolean | undefined;
        meta?: boolean | undefined;
        shift?: boolean | undefined;
    }

    class Interface extends EventEmitter {
        readonly terminal: boolean;

        \/\/ Need direct access to line/cursor data, for use in external processes
        \/\/ see: https:\/\/github.com/nodejs/node/issues/30347
        /** The current input data */
        readonly line: string;
        /** The current cursor position in the input line */
        readonly cursor: number;

        /**
         * NOTE: According to the documentation:
         *
         * > Instances of the \`readline.Interface\` class are constructed using the
         * > \`readline.createInterface()\` method.
         *
         * @see https:\/\/nodejs.org/dist/latest-v10.x/docs/api/readline.html#readline_class_interface
         */
        protected constructor(input: NodeJS.ReadableStream, output?: NodeJS.WritableStream, completer?: Completer | AsyncCompleter, terminal?: boolean);
        /**
         * NOTE: According to the documentation:
         *
         * > Instances of the \`readline.Interface\` class are constructed using the
         * > \`readline.createInterface()\` method.
         *
         * @see https:\/\/nodejs.org/dist/latest-v10.x/docs/api/readline.html#readline_class_interface
         */
        protected constructor(options: ReadLineOptions);

        setPrompt(prompt: string): void;
        prompt(preserveCursor?: boolean): void;
        question(query: string, callback: (answer: string) => void): void;
        pause(): this;
        resume(): this;
        close(): void;
        write(data: string | Buffer, key?: Key): void;

        /**
         * Returns the real position of the cursor in relation to the input
         * prompt + string.  Long input (wrapping) strings, as well as multiple
         * line prompts are included in the calculations.
         */
        getCursorPos(): CursorPos;

        /**
         * events.EventEmitter
         * 1. close
         * 2. line
         * 3. pause
         * 4. resume
         * 5. SIGCONT
         * 6. SIGINT
         * 7. SIGTSTP
         */

        addListener(event: string, listener: (...args: any[]) => void): this;
        addListener(event: "close", listener: () => void): this;
        addListener(event: "line", listener: (input: string) => void): this;
        addListener(event: "pause", listener: () => void): this;
        addListener(event: "resume", listener: () => void): this;
        addListener(event: "SIGCONT", listener: () => void): this;
        addListener(event: "SIGINT", listener: () => void): this;
        addListener(event: "SIGTSTP", listener: () => void): this;

        emit(event: string | symbol, ...args: any[]): boolean;
        emit(event: "close"): boolean;
        emit(event: "line", input: string): boolean;
        emit(event: "pause"): boolean;
        emit(event: "resume"): boolean;
        emit(event: "SIGCONT"): boolean;
        emit(event: "SIGINT"): boolean;
        emit(event: "SIGTSTP"): boolean;

        on(event: string, listener: (...args: any[]) => void): this;
        on(event: "close", listener: () => void): this;
        on(event: "line", listener: (input: string) => void): this;
        on(event: "pause", listener: () => void): this;
        on(event: "resume", listener: () => void): this;
        on(event: "SIGCONT", listener: () => void): this;
        on(event: "SIGINT", listener: () => void): this;
        on(event: "SIGTSTP", listener: () => void): this;

        once(event: string, listener: (...args: any[]) => void): this;
        once(event: "close", listener: () => void): this;
        once(event: "line", listener: (input: string) => void): this;
        once(event: "pause", listener: () => void): this;
        once(event: "resume", listener: () => void): this;
        once(event: "SIGCONT", listener: () => void): this;
        once(event: "SIGINT", listener: () => void): this;
        once(event: "SIGTSTP", listener: () => void): this;

        prependListener(event: string, listener: (...args: any[]) => void): this;
        prependListener(event: "close", listener: () => void): this;
        prependListener(event: "line", listener: (input: string) => void): this;
        prependListener(event: "pause", listener: () => void): this;
        prependListener(event: "resume", listener: () => void): this;
        prependListener(event: "SIGCONT", listener: () => void): this;
        prependListener(event: "SIGINT", listener: () => void): this;
        prependListener(event: "SIGTSTP", listener: () => void): this;

        prependOnceListener(event: string, listener: (...args: any[]) => void): this;
        prependOnceListener(event: "close", listener: () => void): this;
        prependOnceListener(event: "line", listener: (input: string) => void): this;
        prependOnceListener(event: "pause", listener: () => void): this;
        prependOnceListener(event: "resume", listener: () => void): this;
        prependOnceListener(event: "SIGCONT", listener: () => void): this;
        prependOnceListener(event: "SIGINT", listener: () => void): this;
        prependOnceListener(event: "SIGTSTP", listener: () => void): this;
        [Symbol.asyncIterator](): AsyncIterableIterator<string>;
    }

    type ReadLine = Interface; \/\/ type forwarded for backwards compatibility

    type Completer = (line: string) => CompleterResult;
    type AsyncCompleter = (line: string, callback: (err?: null | Error, result?: CompleterResult) => void) => any;

    type CompleterResult = [string[], string];

    interface ReadLineOptions {
        input: NodeJS.ReadableStream;
        output?: NodeJS.WritableStream | undefined;
        completer?: Completer | AsyncCompleter | undefined;
        terminal?: boolean | undefined;
        historySize?: number | undefined;
        prompt?: string | undefined;
        crlfDelay?: number | undefined;
        removeHistoryDuplicates?: boolean | undefined;
        escapeCodeTimeout?: number | undefined;
        tabSize?: number | undefined;
    }

    function createInterface(input: NodeJS.ReadableStream, output?: NodeJS.WritableStream, completer?: Completer | AsyncCompleter, terminal?: boolean): Interface;
    function createInterface(options: ReadLineOptions): Interface;
    function emitKeypressEvents(stream: NodeJS.ReadableStream, readlineInterface?: Interface): void;

    type Direction = -1 | 0 | 1;

    interface CursorPos {
        rows: number;
        cols: number;
    }

    /**
     * Clears the current line of this WriteStream in a direction identified by \`dir\`.
     */
    function clearLine(stream: NodeJS.WritableStream, dir: Direction, callback?: () => void): boolean;
    /**
     * Clears this \`WriteStream\` from the current cursor down.
     */
    function clearScreenDown(stream: NodeJS.WritableStream, callback?: () => void): boolean;
    /**
     * Moves this WriteStream's cursor to the specified position.
     */
    function cursorTo(stream: NodeJS.WritableStream, x: number, y?: number, callback?: () => void): boolean;
    /**
     * Moves this WriteStream's cursor relative to its current position.
     */
    function moveCursor(stream: NodeJS.WritableStream, dx: number, dy: number, callback?: () => void): boolean;
}
`;
definitions['repl.d.ts'] = `declare module 'repl' {
    import { Interface, Completer, AsyncCompleter } from 'readline';
    import { Context } from 'vm';
    import { InspectOptions } from 'util';

    interface ReplOptions {
        /**
         * The input prompt to display.
         * @default "> "
         */
        prompt?: string | undefined;
        /**
         * The \`Readable\` stream from which REPL input will be read.
         * @default process.stdin
         */
        input?: NodeJS.ReadableStream | undefined;
        /**
         * The \`Writable\` stream to which REPL output will be written.
         * @default process.stdout
         */
        output?: NodeJS.WritableStream | undefined;
        /**
         * If \`true\`, specifies that the output should be treated as a TTY terminal, and have
         * ANSI/VT100 escape codes written to it.
         * Default: checking the value of the \`isTTY\` property on the output stream upon
         * instantiation.
         */
        terminal?: boolean | undefined;
        /**
         * The function to be used when evaluating each given line of input.
         * Default: an async wrapper for the JavaScript \`eval()\` function. An \`eval\` function can
         * error with \`repl.Recoverable\` to indicate the input was incomplete and prompt for
         * additional lines.
         *
         * @see https:\/\/nodejs.org/dist/latest-v10.x/docs/api/repl.html#repl_default_evaluation
         * @see https:\/\/nodejs.org/dist/latest-v10.x/docs/api/repl.html#repl_custom_evaluation_functions
         */
        eval?: REPLEval | undefined;
        /**
         * Defines if the repl prints output previews or not.
         * @default \`true\` Always \`false\` in case \`terminal\` is falsy.
         */
        preview?: boolean | undefined;
        /**
         * If \`true\`, specifies that the default \`writer\` function should include ANSI color
         * styling to REPL output. If a custom \`writer\` function is provided then this has no
         * effect.
         * Default: the REPL instance's \`terminal\` value.
         */
        useColors?: boolean | undefined;
        /**
         * If \`true\`, specifies that the default evaluation function will use the JavaScript
         * \`global\` as the context as opposed to creating a new separate context for the REPL
         * instance. The node CLI REPL sets this value to \`true\`.
         * Default: \`false\`.
         */
        useGlobal?: boolean | undefined;
        /**
         * If \`true\`, specifies that the default writer will not output the return value of a
         * command if it evaluates to \`undefined\`.
         * Default: \`false\`.
         */
        ignoreUndefined?: boolean | undefined;
        /**
         * The function to invoke to format the output of each command before writing to \`output\`.
         * Default: a wrapper for \`util.inspect\`.
         *
         * @see https:\/\/nodejs.org/dist/latest-v10.x/docs/api/repl.html#repl_customizing_repl_output
         */
        writer?: REPLWriter | undefined;
        /**
         * An optional function used for custom Tab auto completion.
         *
         * @see https:\/\/nodejs.org/dist/latest-v11.x/docs/api/readline.html#readline_use_of_the_completer_function
         */
        completer?: Completer | AsyncCompleter | undefined;
        /**
         * A flag that specifies whether the default evaluator executes all JavaScript commands in
         * strict mode or default (sloppy) mode.
         * Accepted values are:
         * - \`repl.REPL_MODE_SLOPPY\` - evaluates expressions in sloppy mode.
         * - \`repl.REPL_MODE_STRICT\` - evaluates expressions in strict mode. This is equivalent to
         *   prefacing every repl statement with \`'use strict'\`.
         */
        replMode?: typeof REPL_MODE_SLOPPY | typeof REPL_MODE_STRICT | undefined;
        /**
         * Stop evaluating the current piece of code when \`SIGINT\` is received, i.e. \`Ctrl+C\` is
         * pressed. This cannot be used together with a custom \`eval\` function.
         * Default: \`false\`.
         */
        breakEvalOnSigint?: boolean | undefined;
    }

    type REPLEval = (this: REPLServer, evalCmd: string, context: Context, file: string, cb: (err: Error | null, result: any) => void) => void;
    type REPLWriter = (this: REPLServer, obj: any) => string;

    /**
     * This is the default "writer" value, if none is passed in the REPL options,
     * and it can be overridden by custom print functions.
     */
    const writer: REPLWriter & { options: InspectOptions };

    type REPLCommandAction = (this: REPLServer, text: string) => void;

    interface REPLCommand {
        /**
         * Help text to be displayed when \`.help\` is entered.
         */
        help?: string | undefined;
        /**
         * The function to execute, optionally accepting a single string argument.
         */
        action: REPLCommandAction;
    }

    /**
     * Provides a customizable Read-Eval-Print-Loop (REPL).
     *
     * Instances of \`repl.REPLServer\` will accept individual lines of user input, evaluate those
     * according to a user-defined evaluation function, then output the result. Input and output
     * may be from \`stdin\` and \`stdout\`, respectively, or may be connected to any Node.js \`stream\`.
     *
     * Instances of \`repl.REPLServer\` support automatic completion of inputs, simplistic Emacs-style
     * line editing, multi-line inputs, ANSI-styled output, saving and restoring current REPL session
     * state, error recovery, and customizable evaluation functions.
     *
     * Instances of \`repl.REPLServer\` are created using the \`repl.start()\` method and _should not_
     * be created directly using the JavaScript \`new\` keyword.
     *
     * @see https:\/\/nodejs.org/dist/latest-v10.x/docs/api/repl.html#repl_repl
     */
    class REPLServer extends Interface {
        /**
         * The \`vm.Context\` provided to the \`eval\` function to be used for JavaScript
         * evaluation.
         */
        readonly context: Context;
        /**
         * @deprecated since v14.3.0 - Use \`input\` instead.
         */
        readonly inputStream: NodeJS.ReadableStream;
        /**
         * @deprecated since v14.3.0 - Use \`output\` instead.
         */
        readonly outputStream: NodeJS.WritableStream;
        /**
         * The \`Readable\` stream from which REPL input will be read.
         */
        readonly input: NodeJS.ReadableStream;
        /**
         * The \`Writable\` stream to which REPL output will be written.
         */
        readonly output: NodeJS.WritableStream;
        /**
         * The commands registered via \`replServer.defineCommand()\`.
         */
        readonly commands: NodeJS.ReadOnlyDict<REPLCommand>;
        /**
         * A value indicating whether the REPL is currently in "editor mode".
         *
         * @see https:\/\/nodejs.org/dist/latest-v10.x/docs/api/repl.html#repl_commands_and_special_keys
         */
        readonly editorMode: boolean;
        /**
         * A value indicating whether the \`_\` variable has been assigned.
         *
         * @see https:\/\/nodejs.org/dist/latest-v10.x/docs/api/repl.html#repl_assignment_of_the_underscore_variable
         */
        readonly underscoreAssigned: boolean;
        /**
         * The last evaluation result from the REPL (assigned to the \`_\` variable inside of the REPL).
         *
         * @see https:\/\/nodejs.org/dist/latest-v10.x/docs/api/repl.html#repl_assignment_of_the_underscore_variable
         */
        readonly last: any;
        /**
         * A value indicating whether the \`_error\` variable has been assigned.
         *
         * @since v9.8.0
         * @see https:\/\/nodejs.org/dist/latest-v10.x/docs/api/repl.html#repl_assignment_of_the_underscore_variable
         */
        readonly underscoreErrAssigned: boolean;
        /**
         * The last error raised inside the REPL (assigned to the \`_error\` variable inside of the REPL).
         *
         * @since v9.8.0
         * @see https:\/\/nodejs.org/dist/latest-v10.x/docs/api/repl.html#repl_assignment_of_the_underscore_variable
         */
        readonly lastError: any;
        /**
         * Specified in the REPL options, this is the function to be used when evaluating each
         * given line of input. If not specified in the REPL options, this is an async wrapper
         * for the JavaScript \`eval()\` function.
         */
        readonly eval: REPLEval;
        /**
         * Specified in the REPL options, this is a value indicating whether the default
         * \`writer\` function should include ANSI color styling to REPL output.
         */
        readonly useColors: boolean;
        /**
         * Specified in the REPL options, this is a value indicating whether the default \`eval\`
         * function will use the JavaScript \`global\` as the context as opposed to creating a new
         * separate context for the REPL instance.
         */
        readonly useGlobal: boolean;
        /**
         * Specified in the REPL options, this is a value indicating whether the default \`writer\`
         * function should output the result of a command if it evaluates to \`undefined\`.
         */
        readonly ignoreUndefined: boolean;
        /**
         * Specified in the REPL options, this is the function to invoke to format the output of
         * each command before writing to \`outputStream\`. If not specified in the REPL options,
         * this will be a wrapper for \`util.inspect\`.
         */
        readonly writer: REPLWriter;
        /**
         * Specified in the REPL options, this is the function to use for custom Tab auto-completion.
         */
        readonly completer: Completer | AsyncCompleter;
        /**
         * Specified in the REPL options, this is a flag that specifies whether the default \`eval\`
         * function should execute all JavaScript commands in strict mode or default (sloppy) mode.
         * Possible values are:
         * - \`repl.REPL_MODE_SLOPPY\` - evaluates expressions in sloppy mode.
         * - \`repl.REPL_MODE_STRICT\` - evaluates expressions in strict mode. This is equivalent to
         *    prefacing every repl statement with \`'use strict'\`.
         */
        readonly replMode: typeof REPL_MODE_SLOPPY | typeof REPL_MODE_STRICT;

        /**
         * NOTE: According to the documentation:
         *
         * > Instances of \`repl.REPLServer\` are created using the \`repl.start()\` method and
         * > _should not_ be created directly using the JavaScript \`new\` keyword.
         *
         * \`REPLServer\` cannot be subclassed due to implementation specifics in NodeJS.
         *
         * @see https:\/\/nodejs.org/dist/latest-v10.x/docs/api/repl.html#repl_class_replserver
         */
        private constructor();

        /**
         * Used to add new \`.\`-prefixed commands to the REPL instance. Such commands are invoked
         * by typing a \`.\` followed by the \`keyword\`.
         *
         * @param keyword The command keyword (_without_ a leading \`.\` character).
         * @param cmd The function to invoke when the command is processed.
         *
         * @see https:\/\/nodejs.org/dist/latest-v10.x/docs/api/repl.html#repl_replserver_definecommand_keyword_cmd
         */
        defineCommand(keyword: string, cmd: REPLCommandAction | REPLCommand): void;
        /**
         * Readies the REPL instance for input from the user, printing the configured \`prompt\` to a
         * new line in the \`output\` and resuming the \`input\` to accept new input.
         *
         * When multi-line input is being entered, an ellipsis is printed rather than the 'prompt'.
         *
         * This method is primarily intended to be called from within the action function for
         * commands registered using the \`replServer.defineCommand()\` method.
         *
         * @param preserveCursor When \`true\`, the cursor placement will not be reset to \`0\`.
         */
        displayPrompt(preserveCursor?: boolean): void;
        /**
         * Clears any command that has been buffered but not yet executed.
         *
         * This method is primarily intended to be called from within the action function for
         * commands registered using the \`replServer.defineCommand()\` method.
         *
         * @since v9.0.0
         */
        clearBufferedCommand(): void;

        /**
         * Initializes a history log file for the REPL instance. When executing the
         * Node.js binary and using the command line REPL, a history file is initialized
         * by default. However, this is not the case when creating a REPL
         * programmatically. Use this method to initialize a history log file when working
         * with REPL instances programmatically.
         * @param path The path to the history file
         */
        setupHistory(path: string, cb: (err: Error | null, repl: this) => void): void;

        /**
         * events.EventEmitter
         * 1. close - inherited from \`readline.Interface\`
         * 2. line - inherited from \`readline.Interface\`
         * 3. pause - inherited from \`readline.Interface\`
         * 4. resume - inherited from \`readline.Interface\`
         * 5. SIGCONT - inherited from \`readline.Interface\`
         * 6. SIGINT - inherited from \`readline.Interface\`
         * 7. SIGTSTP - inherited from \`readline.Interface\`
         * 8. exit
         * 9. reset
         */

        addListener(event: string, listener: (...args: any[]) => void): this;
        addListener(event: "close", listener: () => void): this;
        addListener(event: "line", listener: (input: string) => void): this;
        addListener(event: "pause", listener: () => void): this;
        addListener(event: "resume", listener: () => void): this;
        addListener(event: "SIGCONT", listener: () => void): this;
        addListener(event: "SIGINT", listener: () => void): this;
        addListener(event: "SIGTSTP", listener: () => void): this;
        addListener(event: "exit", listener: () => void): this;
        addListener(event: "reset", listener: (context: Context) => void): this;

        emit(event: string | symbol, ...args: any[]): boolean;
        emit(event: "close"): boolean;
        emit(event: "line", input: string): boolean;
        emit(event: "pause"): boolean;
        emit(event: "resume"): boolean;
        emit(event: "SIGCONT"): boolean;
        emit(event: "SIGINT"): boolean;
        emit(event: "SIGTSTP"): boolean;
        emit(event: "exit"): boolean;
        emit(event: "reset", context: Context): boolean;

        on(event: string, listener: (...args: any[]) => void): this;
        on(event: "close", listener: () => void): this;
        on(event: "line", listener: (input: string) => void): this;
        on(event: "pause", listener: () => void): this;
        on(event: "resume", listener: () => void): this;
        on(event: "SIGCONT", listener: () => void): this;
        on(event: "SIGINT", listener: () => void): this;
        on(event: "SIGTSTP", listener: () => void): this;
        on(event: "exit", listener: () => void): this;
        on(event: "reset", listener: (context: Context) => void): this;

        once(event: string, listener: (...args: any[]) => void): this;
        once(event: "close", listener: () => void): this;
        once(event: "line", listener: (input: string) => void): this;
        once(event: "pause", listener: () => void): this;
        once(event: "resume", listener: () => void): this;
        once(event: "SIGCONT", listener: () => void): this;
        once(event: "SIGINT", listener: () => void): this;
        once(event: "SIGTSTP", listener: () => void): this;
        once(event: "exit", listener: () => void): this;
        once(event: "reset", listener: (context: Context) => void): this;

        prependListener(event: string, listener: (...args: any[]) => void): this;
        prependListener(event: "close", listener: () => void): this;
        prependListener(event: "line", listener: (input: string) => void): this;
        prependListener(event: "pause", listener: () => void): this;
        prependListener(event: "resume", listener: () => void): this;
        prependListener(event: "SIGCONT", listener: () => void): this;
        prependListener(event: "SIGINT", listener: () => void): this;
        prependListener(event: "SIGTSTP", listener: () => void): this;
        prependListener(event: "exit", listener: () => void): this;
        prependListener(event: "reset", listener: (context: Context) => void): this;

        prependOnceListener(event: string, listener: (...args: any[]) => void): this;
        prependOnceListener(event: "close", listener: () => void): this;
        prependOnceListener(event: "line", listener: (input: string) => void): this;
        prependOnceListener(event: "pause", listener: () => void): this;
        prependOnceListener(event: "resume", listener: () => void): this;
        prependOnceListener(event: "SIGCONT", listener: () => void): this;
        prependOnceListener(event: "SIGINT", listener: () => void): this;
        prependOnceListener(event: "SIGTSTP", listener: () => void): this;
        prependOnceListener(event: "exit", listener: () => void): this;
        prependOnceListener(event: "reset", listener: (context: Context) => void): this;
    }

    /**
     * A flag passed in the REPL options. Evaluates expressions in sloppy mode.
     */
    const REPL_MODE_SLOPPY: unique symbol;

    /**
     * A flag passed in the REPL options. Evaluates expressions in strict mode.
     * This is equivalent to prefacing every repl statement with \`'use strict'\`.
     */
    const REPL_MODE_STRICT: unique symbol;

    /**
     * Creates and starts a \`repl.REPLServer\` instance.
     *
     * @param options The options for the \`REPLServer\`. If \`options\` is a string, then it specifies
     * the input prompt.
     */
    function start(options?: string | ReplOptions): REPLServer;

    /**
     * Indicates a recoverable error that a \`REPLServer\` can use to support multi-line input.
     *
     * @see https:\/\/nodejs.org/dist/latest-v10.x/docs/api/repl.html#repl_recoverable_errors
     */
    class Recoverable extends SyntaxError {
        err: Error;

        constructor(err: Error);
    }
}
`;
definitions['stream.d.ts'] = `declare module 'stream' {
    import EventEmitter = require('events');

    class internal extends EventEmitter {
        pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean | undefined; }): T;
    }

    namespace internal {
        class Stream extends internal {
            constructor(opts?: ReadableOptions);
        }

        interface ReadableOptions {
            highWaterMark?: number | undefined;
            encoding?: BufferEncoding | undefined;
            objectMode?: boolean | undefined;
            read?(this: Readable, size: number): void;
            destroy?(this: Readable, error: Error | null, callback: (error: Error | null) => void): void;
            autoDestroy?: boolean | undefined;
        }

        class Readable extends Stream implements NodeJS.ReadableStream {
            /**
             * A utility method for creating Readable Streams out of iterators.
             */
            static from(iterable: Iterable<any> | AsyncIterable<any>, options?: ReadableOptions): Readable;

            readable: boolean;
            readonly readableEncoding: BufferEncoding | null;
            readonly readableEnded: boolean;
            readonly readableFlowing: boolean | null;
            readonly readableHighWaterMark: number;
            readonly readableLength: number;
            readonly readableObjectMode: boolean;
            destroyed: boolean;
            constructor(opts?: ReadableOptions);
            _read(size: number): void;
            read(size?: number): any;
            setEncoding(encoding: BufferEncoding): this;
            pause(): this;
            resume(): this;
            isPaused(): boolean;
            unpipe(destination?: NodeJS.WritableStream): this;
            unshift(chunk: any, encoding?: BufferEncoding): void;
            wrap(oldStream: NodeJS.ReadableStream): this;
            push(chunk: any, encoding?: BufferEncoding): boolean;
            _destroy(error: Error | null, callback: (error?: Error | null) => void): void;
            destroy(error?: Error): void;

            /**
             * Event emitter
             * The defined events on documents including:
             * 1. close
             * 2. data
             * 3. end
             * 4. error
             * 5. pause
             * 6. readable
             * 7. resume
             */
            addListener(event: "close", listener: () => void): this;
            addListener(event: "data", listener: (chunk: any) => void): this;
            addListener(event: "end", listener: () => void): this;
            addListener(event: "error", listener: (err: Error) => void): this;
            addListener(event: "pause", listener: () => void): this;
            addListener(event: "readable", listener: () => void): this;
            addListener(event: "resume", listener: () => void): this;
            addListener(event: string | symbol, listener: (...args: any[]) => void): this;

            emit(event: "close"): boolean;
            emit(event: "data", chunk: any): boolean;
            emit(event: "end"): boolean;
            emit(event: "error", err: Error): boolean;
            emit(event: "pause"): boolean;
            emit(event: "readable"): boolean;
            emit(event: "resume"): boolean;
            emit(event: string | symbol, ...args: any[]): boolean;

            on(event: "close", listener: () => void): this;
            on(event: "data", listener: (chunk: any) => void): this;
            on(event: "end", listener: () => void): this;
            on(event: "error", listener: (err: Error) => void): this;
            on(event: "pause", listener: () => void): this;
            on(event: "readable", listener: () => void): this;
            on(event: "resume", listener: () => void): this;
            on(event: string | symbol, listener: (...args: any[]) => void): this;

            once(event: "close", listener: () => void): this;
            once(event: "data", listener: (chunk: any) => void): this;
            once(event: "end", listener: () => void): this;
            once(event: "error", listener: (err: Error) => void): this;
            once(event: "pause", listener: () => void): this;
            once(event: "readable", listener: () => void): this;
            once(event: "resume", listener: () => void): this;
            once(event: string | symbol, listener: (...args: any[]) => void): this;

            prependListener(event: "close", listener: () => void): this;
            prependListener(event: "data", listener: (chunk: any) => void): this;
            prependListener(event: "end", listener: () => void): this;
            prependListener(event: "error", listener: (err: Error) => void): this;
            prependListener(event: "pause", listener: () => void): this;
            prependListener(event: "readable", listener: () => void): this;
            prependListener(event: "resume", listener: () => void): this;
            prependListener(event: string | symbol, listener: (...args: any[]) => void): this;

            prependOnceListener(event: "close", listener: () => void): this;
            prependOnceListener(event: "data", listener: (chunk: any) => void): this;
            prependOnceListener(event: "end", listener: () => void): this;
            prependOnceListener(event: "error", listener: (err: Error) => void): this;
            prependOnceListener(event: "pause", listener: () => void): this;
            prependOnceListener(event: "readable", listener: () => void): this;
            prependOnceListener(event: "resume", listener: () => void): this;
            prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;

            removeListener(event: "close", listener: () => void): this;
            removeListener(event: "data", listener: (chunk: any) => void): this;
            removeListener(event: "end", listener: () => void): this;
            removeListener(event: "error", listener: (err: Error) => void): this;
            removeListener(event: "pause", listener: () => void): this;
            removeListener(event: "readable", listener: () => void): this;
            removeListener(event: "resume", listener: () => void): this;
            removeListener(event: string | symbol, listener: (...args: any[]) => void): this;

            [Symbol.asyncIterator](): AsyncIterableIterator<any>;
        }

        interface WritableOptions {
            highWaterMark?: number | undefined;
            decodeStrings?: boolean | undefined;
            defaultEncoding?: BufferEncoding | undefined;
            objectMode?: boolean | undefined;
            emitClose?: boolean | undefined;
            write?(this: Writable, chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void;
            writev?(this: Writable, chunks: Array<{ chunk: any, encoding: BufferEncoding }>, callback: (error?: Error | null) => void): void;
            destroy?(this: Writable, error: Error | null, callback: (error: Error | null) => void): void;
            final?(this: Writable, callback: (error?: Error | null) => void): void;
            autoDestroy?: boolean | undefined;
        }

        class Writable extends Stream implements NodeJS.WritableStream {
            readonly writable: boolean;
            readonly writableEnded: boolean;
            readonly writableFinished: boolean;
            readonly writableHighWaterMark: number;
            readonly writableLength: number;
            readonly writableObjectMode: boolean;
            readonly writableCorked: number;
            destroyed: boolean;
            constructor(opts?: WritableOptions);
            _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void;
            _writev?(chunks: Array<{ chunk: any, encoding: BufferEncoding }>, callback: (error?: Error | null) => void): void;
            _destroy(error: Error | null, callback: (error?: Error | null) => void): void;
            _final(callback: (error?: Error | null) => void): void;
            write(chunk: any, cb?: (error: Error | null | undefined) => void): boolean;
            write(chunk: any, encoding: BufferEncoding, cb?: (error: Error | null | undefined) => void): boolean;
            setDefaultEncoding(encoding: BufferEncoding): this;
            end(cb?: () => void): void;
            end(chunk: any, cb?: () => void): void;
            end(chunk: any, encoding: BufferEncoding, cb?: () => void): void;
            cork(): void;
            uncork(): void;
            destroy(error?: Error): void;

            /**
             * Event emitter
             * The defined events on documents including:
             * 1. close
             * 2. drain
             * 3. error
             * 4. finish
             * 5. pipe
             * 6. unpipe
             */
            addListener(event: "close", listener: () => void): this;
            addListener(event: "drain", listener: () => void): this;
            addListener(event: "error", listener: (err: Error) => void): this;
            addListener(event: "finish", listener: () => void): this;
            addListener(event: "pipe", listener: (src: Readable) => void): this;
            addListener(event: "unpipe", listener: (src: Readable) => void): this;
            addListener(event: string | symbol, listener: (...args: any[]) => void): this;

            emit(event: "close"): boolean;
            emit(event: "drain"): boolean;
            emit(event: "error", err: Error): boolean;
            emit(event: "finish"): boolean;
            emit(event: "pipe", src: Readable): boolean;
            emit(event: "unpipe", src: Readable): boolean;
            emit(event: string | symbol, ...args: any[]): boolean;

            on(event: "close", listener: () => void): this;
            on(event: "drain", listener: () => void): this;
            on(event: "error", listener: (err: Error) => void): this;
            on(event: "finish", listener: () => void): this;
            on(event: "pipe", listener: (src: Readable) => void): this;
            on(event: "unpipe", listener: (src: Readable) => void): this;
            on(event: string | symbol, listener: (...args: any[]) => void): this;

            once(event: "close", listener: () => void): this;
            once(event: "drain", listener: () => void): this;
            once(event: "error", listener: (err: Error) => void): this;
            once(event: "finish", listener: () => void): this;
            once(event: "pipe", listener: (src: Readable) => void): this;
            once(event: "unpipe", listener: (src: Readable) => void): this;
            once(event: string | symbol, listener: (...args: any[]) => void): this;

            prependListener(event: "close", listener: () => void): this;
            prependListener(event: "drain", listener: () => void): this;
            prependListener(event: "error", listener: (err: Error) => void): this;
            prependListener(event: "finish", listener: () => void): this;
            prependListener(event: "pipe", listener: (src: Readable) => void): this;
            prependListener(event: "unpipe", listener: (src: Readable) => void): this;
            prependListener(event: string | symbol, listener: (...args: any[]) => void): this;

            prependOnceListener(event: "close", listener: () => void): this;
            prependOnceListener(event: "drain", listener: () => void): this;
            prependOnceListener(event: "error", listener: (err: Error) => void): this;
            prependOnceListener(event: "finish", listener: () => void): this;
            prependOnceListener(event: "pipe", listener: (src: Readable) => void): this;
            prependOnceListener(event: "unpipe", listener: (src: Readable) => void): this;
            prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;

            removeListener(event: "close", listener: () => void): this;
            removeListener(event: "drain", listener: () => void): this;
            removeListener(event: "error", listener: (err: Error) => void): this;
            removeListener(event: "finish", listener: () => void): this;
            removeListener(event: "pipe", listener: (src: Readable) => void): this;
            removeListener(event: "unpipe", listener: (src: Readable) => void): this;
            removeListener(event: string | symbol, listener: (...args: any[]) => void): this;
        }

        interface DuplexOptions extends ReadableOptions, WritableOptions {
            allowHalfOpen?: boolean | undefined;
            readableObjectMode?: boolean | undefined;
            writableObjectMode?: boolean | undefined;
            readableHighWaterMark?: number | undefined;
            writableHighWaterMark?: number | undefined;
            writableCorked?: number | undefined;
            read?(this: Duplex, size: number): void;
            write?(this: Duplex, chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void;
            writev?(this: Duplex, chunks: Array<{ chunk: any, encoding: BufferEncoding }>, callback: (error?: Error | null) => void): void;
            final?(this: Duplex, callback: (error?: Error | null) => void): void;
            destroy?(this: Duplex, error: Error | null, callback: (error: Error | null) => void): void;
        }

        \/\/ Note: Duplex extends both Readable and Writable.
        class Duplex extends Readable implements Writable {
            readonly writable: boolean;
            readonly writableEnded: boolean;
            readonly writableFinished: boolean;
            readonly writableHighWaterMark: number;
            readonly writableLength: number;
            readonly writableObjectMode: boolean;
            readonly writableCorked: number;
            allowHalfOpen: boolean;
            constructor(opts?: DuplexOptions);
            _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void;
            _writev?(chunks: Array<{ chunk: any, encoding: BufferEncoding }>, callback: (error?: Error | null) => void): void;
            _destroy(error: Error | null, callback: (error: Error | null) => void): void;
            _final(callback: (error?: Error | null) => void): void;
            write(chunk: any, encoding?: BufferEncoding, cb?: (error: Error | null | undefined) => void): boolean;
            write(chunk: any, cb?: (error: Error | null | undefined) => void): boolean;
            setDefaultEncoding(encoding: BufferEncoding): this;
            end(cb?: () => void): void;
            end(chunk: any, cb?: () => void): void;
            end(chunk: any, encoding?: BufferEncoding, cb?: () => void): void;
            cork(): void;
            uncork(): void;
        }

        type TransformCallback = (error?: Error | null, data?: any) => void;

        interface TransformOptions extends DuplexOptions {
            read?(this: Transform, size: number): void;
            write?(this: Transform, chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void;
            writev?(this: Transform, chunks: Array<{ chunk: any, encoding: BufferEncoding }>, callback: (error?: Error | null) => void): void;
            final?(this: Transform, callback: (error?: Error | null) => void): void;
            destroy?(this: Transform, error: Error | null, callback: (error: Error | null) => void): void;
            transform?(this: Transform, chunk: any, encoding: BufferEncoding, callback: TransformCallback): void;
            flush?(this: Transform, callback: TransformCallback): void;
        }

        class Transform extends Duplex {
            constructor(opts?: TransformOptions);
            _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback): void;
            _flush(callback: TransformCallback): void;
        }

        class PassThrough extends Transform { }

        interface FinishedOptions {
            error?: boolean | undefined;
            readable?: boolean | undefined;
            writable?: boolean | undefined;
        }
        function finished(stream: NodeJS.ReadableStream | NodeJS.WritableStream | NodeJS.ReadWriteStream, options: FinishedOptions, callback: (err?: NodeJS.ErrnoException | null) => void): () => void;
        function finished(stream: NodeJS.ReadableStream | NodeJS.WritableStream | NodeJS.ReadWriteStream, callback: (err?: NodeJS.ErrnoException | null) => void): () => void;
        namespace finished {
            function __promisify__(stream: NodeJS.ReadableStream | NodeJS.WritableStream | NodeJS.ReadWriteStream, options?: FinishedOptions): Promise<void>;
        }

        function pipeline<T extends NodeJS.WritableStream>(stream1: NodeJS.ReadableStream, stream2: T, callback?: (err: NodeJS.ErrnoException | null) => void): T;
        function pipeline<T extends NodeJS.WritableStream>(stream1: NodeJS.ReadableStream, stream2: NodeJS.ReadWriteStream, stream3: T, callback?: (err: NodeJS.ErrnoException | null) => void): T;
        function pipeline<T extends NodeJS.WritableStream>(
            stream1: NodeJS.ReadableStream,
            stream2: NodeJS.ReadWriteStream,
            stream3: NodeJS.ReadWriteStream,
            stream4: T,
            callback?: (err: NodeJS.ErrnoException | null) => void,
        ): T;
        function pipeline<T extends NodeJS.WritableStream>(
            stream1: NodeJS.ReadableStream,
            stream2: NodeJS.ReadWriteStream,
            stream3: NodeJS.ReadWriteStream,
            stream4: NodeJS.ReadWriteStream,
            stream5: T,
            callback?: (err: NodeJS.ErrnoException | null) => void,
        ): T;
        function pipeline(
            streams: ReadonlyArray<NodeJS.ReadableStream | NodeJS.WritableStream | NodeJS.ReadWriteStream>,
            callback?: (err: NodeJS.ErrnoException | null) => void,
        ): NodeJS.WritableStream;
        function pipeline(
            stream1: NodeJS.ReadableStream,
            stream2: NodeJS.ReadWriteStream | NodeJS.WritableStream,
            ...streams: Array<NodeJS.ReadWriteStream | NodeJS.WritableStream | ((err: NodeJS.ErrnoException | null) => void)>,
        ): NodeJS.WritableStream;
        namespace pipeline {
            function __promisify__(stream1: NodeJS.ReadableStream, stream2: NodeJS.WritableStream): Promise<void>;
            function __promisify__(stream1: NodeJS.ReadableStream, stream2: NodeJS.ReadWriteStream, stream3: NodeJS.WritableStream): Promise<void>;
            function __promisify__(stream1: NodeJS.ReadableStream, stream2: NodeJS.ReadWriteStream, stream3: NodeJS.ReadWriteStream, stream4: NodeJS.WritableStream): Promise<void>;
            function __promisify__(
                stream1: NodeJS.ReadableStream,
                stream2: NodeJS.ReadWriteStream,
                stream3: NodeJS.ReadWriteStream,
                stream4: NodeJS.ReadWriteStream,
                stream5: NodeJS.WritableStream,
            ): Promise<void>;
            function __promisify__(streams: ReadonlyArray<NodeJS.ReadableStream | NodeJS.WritableStream | NodeJS.ReadWriteStream>): Promise<void>;
            function __promisify__(
                stream1: NodeJS.ReadableStream,
                stream2: NodeJS.ReadWriteStream | NodeJS.WritableStream,
                ...streams: Array<NodeJS.ReadWriteStream | NodeJS.WritableStream>,
            ): Promise<void>;
        }

        interface Pipe {
            close(): void;
            hasRef(): boolean;
            ref(): void;
            unref(): void;
        }
    }

    export = internal;
}
`;
definitions['string_decoder.d.ts'] = `declare module 'string_decoder' {
    class StringDecoder {
        constructor(encoding?: BufferEncoding);
        write(buffer: Buffer): string;
        end(buffer?: Buffer): string;
    }
}
`;
definitions['timers.d.ts'] = `declare module 'timers' {
    function setTimeout(callback: (...args: any[]) => void, ms?: number, ...args: any[]): NodeJS.Timeout;
    namespace setTimeout {
        function __promisify__(ms: number): Promise<void>;
        function __promisify__<T>(ms: number, value: T): Promise<T>;
    }
    function clearTimeout(timeoutId: NodeJS.Timeout): void;
    function setInterval(callback: (...args: any[]) => void, ms?: number, ...args: any[]): NodeJS.Timeout;
    function clearInterval(intervalId: NodeJS.Timeout): void;
    function setImmediate(callback: (...args: any[]) => void, ...args: any[]): NodeJS.Immediate;
    namespace setImmediate {
        function __promisify__(): Promise<void>;
        function __promisify__<T>(value: T): Promise<T>;
    }
    function clearImmediate(immediateId: NodeJS.Immediate): void;
}
`;
definitions['tls.d.ts'] = `declare module 'tls' {
    import * as net from 'net';

    const CLIENT_RENEG_LIMIT: number;
    const CLIENT_RENEG_WINDOW: number;

    interface Certificate {
        /**
         * Country code.
         */
        C: string;
        /**
         * Street.
         */
        ST: string;
        /**
         * Locality.
         */
        L: string;
        /**
         * Organization.
         */
        O: string;
        /**
         * Organizational unit.
         */
        OU: string;
        /**
         * Common name.
         */
        CN: string;
    }

    interface PeerCertificate {
        subject: Certificate;
        issuer: Certificate;
        subjectaltname: string;
        infoAccess: NodeJS.Dict<string[]>;
        modulus: string;
        exponent: string;
        valid_from: string;
        valid_to: string;
        fingerprint: string;
        fingerprint256: string;
        ext_key_usage: string[];
        serialNumber: string;
        raw: Buffer;
    }

    interface DetailedPeerCertificate extends PeerCertificate {
        issuerCertificate: DetailedPeerCertificate;
    }

    interface CipherNameAndProtocol {
        /**
         * The cipher name.
         */
        name: string;
        /**
         * SSL/TLS protocol version.
         */
        version: string;

        /**
         * IETF name for the cipher suite.
         */
        standardName: string;
    }

    interface EphemeralKeyInfo {
        /**
         * The supported types are 'DH' and 'ECDH'.
         */
        type: string;
        /**
         * The name property is available only when type is 'ECDH'.
         */
        name?: string | undefined;
        /**
         * The size of parameter of an ephemeral key exchange.
         */
        size: number;
    }

    interface KeyObject {
        /**
         * Private keys in PEM format.
         */
        pem: string | Buffer;
        /**
         * Optional passphrase.
         */
        passphrase?: string | undefined;
    }

    interface PxfObject {
        /**
         * PFX or PKCS12 encoded private key and certificate chain.
         */
        buf: string | Buffer;
        /**
         * Optional passphrase.
         */
        passphrase?: string | undefined;
    }

    interface TLSSocketOptions extends SecureContextOptions, CommonConnectionOptions {
        /**
         * If true the TLS socket will be instantiated in server-mode.
         * Defaults to false.
         */
        isServer?: boolean | undefined;
        /**
         * An optional net.Server instance.
         */
        server?: net.Server | undefined;

        /**
         * An optional Buffer instance containing a TLS session.
         */
        session?: Buffer | undefined;
        /**
         * If true, specifies that the OCSP status request extension will be
         * added to the client hello and an 'OCSPResponse' event will be
         * emitted on the socket before establishing a secure communication
         */
        requestOCSP?: boolean | undefined;
    }

    class TLSSocket extends net.Socket {
        /**
         * Construct a new tls.TLSSocket object from an existing TCP socket.
         */
        constructor(socket: net.Socket, options?: TLSSocketOptions);

        /**
         * A boolean that is true if the peer certificate was signed by one of the specified CAs, otherwise false.
         */
        authorized: boolean;
        /**
         * The reason why the peer's certificate has not been verified.
         * This property becomes available only when tlsSocket.authorized === false.
         */
        authorizationError: Error;
        /**
         * Static boolean value, always true.
         * May be used to distinguish TLS sockets from regular ones.
         */
        encrypted: boolean;

        /**
         * String containing the selected ALPN protocol.
         * Before a handshake has completed, this value is always null.
         * When a handshake is completed but not ALPN protocol was selected, tlsSocket.alpnProtocol equals false.
         */
        alpnProtocol: string | false | null;

        /**
         * Returns an object representing the local certificate. The returned
         * object has some properties corresponding to the fields of the
         * certificate.
         *
         * See tls.TLSSocket.getPeerCertificate() for an example of the
         * certificate structure.
         *
         * If there is no local certificate, an empty object will be returned.
         * If the socket has been destroyed, null will be returned.
         */
        getCertificate(): PeerCertificate | object | null;
        /**
         * Returns an object representing the cipher name and the SSL/TLS protocol version of the current connection.
         * @returns Returns an object representing the cipher name
         * and the SSL/TLS protocol version of the current connection.
         */
        getCipher(): CipherNameAndProtocol;
        /**
         * Returns an object representing the type, name, and size of parameter
         * of an ephemeral key exchange in Perfect Forward Secrecy on a client
         * connection. It returns an empty object when the key exchange is not
         * ephemeral. As this is only supported on a client socket; null is
         * returned if called on a server socket. The supported types are 'DH'
         * and 'ECDH'. The name property is available only when type is 'ECDH'.
         *
         * For example: { type: 'ECDH', name: 'prime256v1', size: 256 }.
         */
        getEphemeralKeyInfo(): EphemeralKeyInfo | object | null;
        /**
         * Returns the latest Finished message that has
         * been sent to the socket as part of a SSL/TLS handshake, or undefined
         * if no Finished message has been sent yet.
         *
         * As the Finished messages are message digests of the complete
         * handshake (with a total of 192 bits for TLS 1.0 and more for SSL
         * 3.0), they can be used for external authentication procedures when
         * the authentication provided by SSL/TLS is not desired or is not
         * enough.
         *
         * Corresponds to the SSL_get_finished routine in OpenSSL and may be
         * used to implement the tls-unique channel binding from RFC 5929.
         */
        getFinished(): Buffer | undefined;
        /**
         * Returns an object representing the peer's certificate.
         * The returned object has some properties corresponding to the field of the certificate.
         * If detailed argument is true the full chain with issuer property will be returned,
         * if false only the top certificate without issuer property.
         * If the peer does not provide a certificate, it returns null or an empty object.
         * @param detailed - If true; the full chain with issuer property will be returned.
         * @returns An object representing the peer's certificate.
         */
        getPeerCertificate(detailed: true): DetailedPeerCertificate;
        getPeerCertificate(detailed?: false): PeerCertificate;
        getPeerCertificate(detailed?: boolean): PeerCertificate | DetailedPeerCertificate;
        /**
         * Returns the latest Finished message that is expected or has actually
         * been received from the socket as part of a SSL/TLS handshake, or
         * undefined if there is no Finished message so far.
         *
         * As the Finished messages are message digests of the complete
         * handshake (with a total of 192 bits for TLS 1.0 and more for SSL
         * 3.0), they can be used for external authentication procedures when
         * the authentication provided by SSL/TLS is not desired or is not
         * enough.
         *
         * Corresponds to the SSL_get_peer_finished routine in OpenSSL and may
         * be used to implement the tls-unique channel binding from RFC 5929.
         */
        getPeerFinished(): Buffer | undefined;
        /**
         * Returns a string containing the negotiated SSL/TLS protocol version of the current connection.
         * The value \`'unknown'\` will be returned for connected sockets that have not completed the handshaking process.
         * The value \`null\` will be returned for server sockets or disconnected client sockets.
         * See https:\/\/www.openssl.org/docs/man1.0.2/ssl/SSL_get_version.html for more information.
         * @returns negotiated SSL/TLS protocol version of the current connection
         */
        getProtocol(): string | null;
        /**
         * Could be used to speed up handshake establishment when reconnecting to the server.
         * @returns ASN.1 encoded TLS session or undefined if none was negotiated.
         */
        getSession(): Buffer | undefined;
        /**
         * Returns a list of signature algorithms shared between the server and
         * the client in the order of decreasing preference.
         */
        getSharedSigalgs(): string[];
        /**
         * NOTE: Works only with client TLS sockets.
         * Useful only for debugging, for session reuse provide session option to tls.connect().
         * @returns TLS session ticket or undefined if none was negotiated.
         */
        getTLSTicket(): Buffer | undefined;
        /**
         * Returns true if the session was reused, false otherwise.
         */
        isSessionReused(): boolean;
        /**
         * Initiate TLS renegotiation process.
         *
         * NOTE: Can be used to request peer's certificate after the secure connection has been established.
         * ANOTHER NOTE: When running as the server, socket will be destroyed with an error after handshakeTimeout timeout.
         * @param options - The options may contain the following fields: rejectUnauthorized,
         * requestCert (See tls.createServer() for details).
         * @param callback - callback(err) will be executed with null as err, once the renegotiation
         * is successfully completed.
         * @return \`undefined\` when socket is destroy, \`false\` if negotiaion can't be initiated.
         */
        renegotiate(options: { rejectUnauthorized?: boolean | undefined, requestCert?: boolean | undefined }, callback: (err: Error | null) => void): undefined | boolean;
        /**
         * Set maximum TLS fragment size (default and maximum value is: 16384, minimum is: 512).
         * Smaller fragment size decreases buffering latency on the client: large fragments are buffered by
         * the TLS layer until the entire fragment is received and its integrity is verified;
         * large fragments can span multiple roundtrips, and their processing can be delayed due to packet
         * loss or reordering. However, smaller fragments add extra TLS framing bytes and CPU overhead,
         * which may decrease overall server throughput.
         * @param size - TLS fragment size (default and maximum value is: 16384, minimum is: 512).
         * @returns Returns true on success, false otherwise.
         */
        setMaxSendFragment(size: number): boolean;

        /**
         * Disables TLS renegotiation for this TLSSocket instance. Once called,
         * attempts to renegotiate will trigger an 'error' event on the
         * TLSSocket.
         */
        disableRenegotiation(): void;

        /**
         * When enabled, TLS packet trace information is written to \`stderr\`. This can be
         * used to debug TLS connection problems.
         *
         * Note: The format of the output is identical to the output of \`openssl s_client
         * -trace\` or \`openssl s_server -trace\`. While it is produced by OpenSSL's
         * \`SSL_trace()\` function, the format is undocumented, can change without notice,
         * and should not be relied on.
         */
        enableTrace(): void;

        /**
         * @param length number of bytes to retrieve from keying material
         * @param label an application specific label, typically this will be a value from the
         * [IANA Exporter Label Registry](https:\/\/www.iana.org/assignments/tls-parameters/tls-parameters.xhtml#exporter-labels).
         * @param context optionally provide a context.
         */
        exportKeyingMaterial(length: number, label: string, context: Buffer): Buffer;

        addListener(event: string, listener: (...args: any[]) => void): this;
        addListener(event: "OCSPResponse", listener: (response: Buffer) => void): this;
        addListener(event: "secureConnect", listener: () => void): this;
        addListener(event: "session", listener: (session: Buffer) => void): this;
        addListener(event: "keylog", listener: (line: Buffer) => void): this;

        emit(event: string | symbol, ...args: any[]): boolean;
        emit(event: "OCSPResponse", response: Buffer): boolean;
        emit(event: "secureConnect"): boolean;
        emit(event: "session", session: Buffer): boolean;
        emit(event: "keylog", line: Buffer): boolean;

        on(event: string, listener: (...args: any[]) => void): this;
        on(event: "OCSPResponse", listener: (response: Buffer) => void): this;
        on(event: "secureConnect", listener: () => void): this;
        on(event: "session", listener: (session: Buffer) => void): this;
        on(event: "keylog", listener: (line: Buffer) => void): this;

        once(event: string, listener: (...args: any[]) => void): this;
        once(event: "OCSPResponse", listener: (response: Buffer) => void): this;
        once(event: "secureConnect", listener: () => void): this;
        once(event: "session", listener: (session: Buffer) => void): this;
        once(event: "keylog", listener: (line: Buffer) => void): this;

        prependListener(event: string, listener: (...args: any[]) => void): this;
        prependListener(event: "OCSPResponse", listener: (response: Buffer) => void): this;
        prependListener(event: "secureConnect", listener: () => void): this;
        prependListener(event: "session", listener: (session: Buffer) => void): this;
        prependListener(event: "keylog", listener: (line: Buffer) => void): this;

        prependOnceListener(event: string, listener: (...args: any[]) => void): this;
        prependOnceListener(event: "OCSPResponse", listener: (response: Buffer) => void): this;
        prependOnceListener(event: "secureConnect", listener: () => void): this;
        prependOnceListener(event: "session", listener: (session: Buffer) => void): this;
        prependOnceListener(event: "keylog", listener: (line: Buffer) => void): this;
    }

    interface CommonConnectionOptions {
        /**
         * An optional TLS context object from tls.createSecureContext()
         */
        secureContext?: SecureContext | undefined;

        /**
         * When enabled, TLS packet trace information is written to \`stderr\`. This can be
         * used to debug TLS connection problems.
         * @default false
         */
        enableTrace?: boolean | undefined;
        /**
         * If true the server will request a certificate from clients that
         * connect and attempt to verify that certificate. Defaults to
         * false.
         */
        requestCert?: boolean | undefined;
        /**
         * An array of strings or a Buffer naming possible ALPN protocols.
         * (Protocols should be ordered by their priority.)
         */
        ALPNProtocols?: string[] | Uint8Array[] | Uint8Array | undefined;
        /**
         * SNICallback(servername, cb) <Function> A function that will be
         * called if the client supports SNI TLS extension. Two arguments
         * will be passed when called: servername and cb. SNICallback should
         * invoke cb(null, ctx), where ctx is a SecureContext instance.
         * (tls.createSecureContext(...) can be used to get a proper
         * SecureContext.) If SNICallback wasn't provided the default callback
         * with high-level API will be used (see below).
         */
        SNICallback?: ((servername: string, cb: (err: Error | null, ctx: SecureContext) => void) => void) | undefined;
        /**
         * If true the server will reject any connection which is not
         * authorized with the list of supplied CAs. This option only has an
         * effect if requestCert is true.
         * @default true
         */
        rejectUnauthorized?: boolean | undefined;
    }

    interface TlsOptions extends SecureContextOptions, CommonConnectionOptions, net.ServerOpts {
        /**
         * Abort the connection if the SSL/TLS handshake does not finish in the
         * specified number of milliseconds. A 'tlsClientError' is emitted on
         * the tls.Server object whenever a handshake times out. Default:
         * 120000 (120 seconds).
         */
        handshakeTimeout?: number | undefined;
        /**
         * The number of seconds after which a TLS session created by the
         * server will no longer be resumable. See Session Resumption for more
         * information. Default: 300.
         */
        sessionTimeout?: number | undefined;
        /**
         * 48-bytes of cryptographically strong pseudo-random data.
         */
        ticketKeys?: Buffer | undefined;

        /**
         *
         * @param socket
         * @param identity identity parameter sent from the client.
         * @return pre-shared key that must either be
         * a buffer or \`null\` to stop the negotiation process. Returned PSK must be
         * compatible with the selected cipher's digest.
         *
         * When negotiating TLS-PSK (pre-shared keys), this function is called
         * with the identity provided by the client.
         * If the return value is \`null\` the negotiation process will stop and an
         * "unknown_psk_identity" alert message will be sent to the other party.
         * If the server wishes to hide the fact that the PSK identity was not known,
         * the callback must provide some random data as \`psk\` to make the connection
         * fail with "decrypt_error" before negotiation is finished.
         * PSK ciphers are disabled by default, and using TLS-PSK thus
         * requires explicitly specifying a cipher suite with the \`ciphers\` option.
         * More information can be found in the RFC 4279.
         */

        pskCallback?(socket: TLSSocket, identity: string): DataView | NodeJS.TypedArray | null;
        /**
         * hint to send to a client to help
         * with selecting the identity during TLS-PSK negotiation. Will be ignored
         * in TLS 1.3. Upon failing to set pskIdentityHint \`tlsClientError\` will be
         * emitted with \`ERR_TLS_PSK_SET_IDENTIY_HINT_FAILED\` code.
         */
        pskIdentityHint?: string | undefined;
    }

    interface PSKCallbackNegotation {
        psk: DataView | NodeJS.TypedArray;
        identity: string;
    }

    interface ConnectionOptions extends SecureContextOptions, CommonConnectionOptions {
        host?: string | undefined;
        port?: number | undefined;
        path?: string | undefined; \/\/ Creates unix socket connection to path. If this option is specified, \`host\` and \`port\` are ignored.
        socket?: net.Socket | undefined; \/\/ Establish secure connection on a given socket rather than creating a new socket
        checkServerIdentity?: typeof checkServerIdentity | undefined;
        servername?: string | undefined; \/\/ SNI TLS Extension
        session?: Buffer | undefined;
        minDHSize?: number | undefined;
        lookup?: net.LookupFunction | undefined;
        timeout?: number | undefined;
        /**
         * When negotiating TLS-PSK (pre-shared keys), this function is called
         * with optional identity \`hint\` provided by the server or \`null\`
         * in case of TLS 1.3 where \`hint\` was removed.
         * It will be necessary to provide a custom \`tls.checkServerIdentity()\`
         * for the connection as the default one will try to check hostname/IP
         * of the server against the certificate but that's not applicable for PSK
         * because there won't be a certificate present.
         * More information can be found in the RFC 4279.
         *
         * @param hint message sent from the server to help client
         * decide which identity to use during negotiation.
         * Always \`null\` if TLS 1.3 is used.
         * @returns Return \`null\` to stop the negotiation process. \`psk\` must be
         * compatible with the selected cipher's digest.
         * \`identity\` must use UTF-8 encoding.
         */
        pskCallback?(hint: string | null): PSKCallbackNegotation | null;
    }

    class Server extends net.Server {
        constructor(secureConnectionListener?: (socket: TLSSocket) => void);
        constructor(options: TlsOptions, secureConnectionListener?: (socket: TLSSocket) => void);

        /**
         * The server.addContext() method adds a secure context that will be
         * used if the client request's SNI name matches the supplied hostname
         * (or wildcard).
         */
        addContext(hostName: string, credentials: SecureContextOptions): void;
        /**
         * Returns the session ticket keys.
         */
        getTicketKeys(): Buffer;
        /**
         *
         * The server.setSecureContext() method replaces the
         * secure context of an existing server. Existing connections to the
         * server are not interrupted.
         */
        setSecureContext(details: SecureContextOptions): void;
        /**
         * The server.setSecureContext() method replaces the secure context of
         * an existing server. Existing connections to the server are not
         * interrupted.
         */
        setTicketKeys(keys: Buffer): void;

        /**
         * events.EventEmitter
         * 1. tlsClientError
         * 2. newSession
         * 3. OCSPRequest
         * 4. resumeSession
         * 5. secureConnection
         * 6. keylog
         */
        addListener(event: string, listener: (...args: any[]) => void): this;
        addListener(event: "tlsClientError", listener: (err: Error, tlsSocket: TLSSocket) => void): this;
        addListener(event: "newSession", listener: (sessionId: Buffer, sessionData: Buffer, callback: (err: Error, resp: Buffer) => void) => void): this;
        addListener(event: "OCSPRequest", listener: (certificate: Buffer, issuer: Buffer, callback: (err: Error | null, resp: Buffer) => void) => void): this;
        addListener(event: "resumeSession", listener: (sessionId: Buffer, callback: (err: Error, sessionData: Buffer) => void) => void): this;
        addListener(event: "secureConnection", listener: (tlsSocket: TLSSocket) => void): this;
        addListener(event: "keylog", listener: (line: Buffer, tlsSocket: TLSSocket) => void): this;

        emit(event: string | symbol, ...args: any[]): boolean;
        emit(event: "tlsClientError", err: Error, tlsSocket: TLSSocket): boolean;
        emit(event: "newSession", sessionId: Buffer, sessionData: Buffer, callback: (err: Error, resp: Buffer) => void): boolean;
        emit(event: "OCSPRequest", certificate: Buffer, issuer: Buffer, callback: (err: Error | null, resp: Buffer) => void): boolean;
        emit(event: "resumeSession", sessionId: Buffer, callback: (err: Error, sessionData: Buffer) => void): boolean;
        emit(event: "secureConnection", tlsSocket: TLSSocket): boolean;
        emit(event: "keylog", line: Buffer, tlsSocket: TLSSocket): boolean;

        on(event: string, listener: (...args: any[]) => void): this;
        on(event: "tlsClientError", listener: (err: Error, tlsSocket: TLSSocket) => void): this;
        on(event: "newSession", listener: (sessionId: Buffer, sessionData: Buffer, callback: (err: Error, resp: Buffer) => void) => void): this;
        on(event: "OCSPRequest", listener: (certificate: Buffer, issuer: Buffer, callback: (err: Error | null, resp: Buffer) => void) => void): this;
        on(event: "resumeSession", listener: (sessionId: Buffer, callback: (err: Error, sessionData: Buffer) => void) => void): this;
        on(event: "secureConnection", listener: (tlsSocket: TLSSocket) => void): this;
        on(event: "keylog", listener: (line: Buffer, tlsSocket: TLSSocket) => void): this;

        once(event: string, listener: (...args: any[]) => void): this;
        once(event: "tlsClientError", listener: (err: Error, tlsSocket: TLSSocket) => void): this;
        once(event: "newSession", listener: (sessionId: Buffer, sessionData: Buffer, callback: (err: Error, resp: Buffer) => void) => void): this;
        once(event: "OCSPRequest", listener: (certificate: Buffer, issuer: Buffer, callback: (err: Error | null, resp: Buffer) => void) => void): this;
        once(event: "resumeSession", listener: (sessionId: Buffer, callback: (err: Error, sessionData: Buffer) => void) => void): this;
        once(event: "secureConnection", listener: (tlsSocket: TLSSocket) => void): this;
        once(event: "keylog", listener: (line: Buffer, tlsSocket: TLSSocket) => void): this;

        prependListener(event: string, listener: (...args: any[]) => void): this;
        prependListener(event: "tlsClientError", listener: (err: Error, tlsSocket: TLSSocket) => void): this;
        prependListener(event: "newSession", listener: (sessionId: Buffer, sessionData: Buffer, callback: (err: Error, resp: Buffer) => void) => void): this;
        prependListener(event: "OCSPRequest", listener: (certificate: Buffer, issuer: Buffer, callback: (err: Error | null, resp: Buffer) => void) => void): this;
        prependListener(event: "resumeSession", listener: (sessionId: Buffer, callback: (err: Error, sessionData: Buffer) => void) => void): this;
        prependListener(event: "secureConnection", listener: (tlsSocket: TLSSocket) => void): this;
        prependListener(event: "keylog", listener: (line: Buffer, tlsSocket: TLSSocket) => void): this;

        prependOnceListener(event: string, listener: (...args: any[]) => void): this;
        prependOnceListener(event: "tlsClientError", listener: (err: Error, tlsSocket: TLSSocket) => void): this;
        prependOnceListener(event: "newSession", listener: (sessionId: Buffer, sessionData: Buffer, callback: (err: Error, resp: Buffer) => void) => void): this;
        prependOnceListener(event: "OCSPRequest", listener: (certificate: Buffer, issuer: Buffer, callback: (err: Error | null, resp: Buffer) => void) => void): this;
        prependOnceListener(event: "resumeSession", listener: (sessionId: Buffer, callback: (err: Error, sessionData: Buffer) => void) => void): this;
        prependOnceListener(event: "secureConnection", listener: (tlsSocket: TLSSocket) => void): this;
        prependOnceListener(event: "keylog", listener: (line: Buffer, tlsSocket: TLSSocket) => void): this;
    }

    interface SecurePair {
        encrypted: TLSSocket;
        cleartext: TLSSocket;
    }

    type SecureVersion = 'TLSv1.3' | 'TLSv1.2' | 'TLSv1.1' | 'TLSv1';

    interface SecureContextOptions {
        /**
         * Optionally override the trusted CA certificates. Default is to trust
         * the well-known CAs curated by Mozilla. Mozilla's CAs are completely
         * replaced when CAs are explicitly specified using this option.
         */
        ca?: string | Buffer | Array<string | Buffer> | undefined;
        /**
         *  Cert chains in PEM format. One cert chain should be provided per
         *  private key. Each cert chain should consist of the PEM formatted
         *  certificate for a provided private key, followed by the PEM
         *  formatted intermediate certificates (if any), in order, and not
         *  including the root CA (the root CA must be pre-known to the peer,
         *  see ca). When providing multiple cert chains, they do not have to
         *  be in the same order as their private keys in key. If the
         *  intermediate certificates are not provided, the peer will not be
         *  able to validate the certificate, and the handshake will fail.
         */
        cert?: string | Buffer | Array<string | Buffer> | undefined;
        /**
         *  Colon-separated list of supported signature algorithms. The list
         *  can contain digest algorithms (SHA256, MD5 etc.), public key
         *  algorithms (RSA-PSS, ECDSA etc.), combination of both (e.g
         *  'RSA+SHA384') or TLS v1.3 scheme names (e.g. rsa_pss_pss_sha512).
         */
        sigalgs?: string | undefined;
        /**
         * Cipher suite specification, replacing the default. For more
         * information, see modifying the default cipher suite. Permitted
         * ciphers can be obtained via tls.getCiphers(). Cipher names must be
         * uppercased in order for OpenSSL to accept them.
         */
        ciphers?: string | undefined;
        /**
         * Name of an OpenSSL engine which can provide the client certificate.
         */
        clientCertEngine?: string | undefined;
        /**
         * PEM formatted CRLs (Certificate Revocation Lists).
         */
        crl?: string | Buffer | Array<string | Buffer> | undefined;
        /**
         * Diffie Hellman parameters, required for Perfect Forward Secrecy. Use
         * openssl dhparam to create the parameters. The key length must be
         * greater than or equal to 1024 bits or else an error will be thrown.
         * Although 1024 bits is permissible, use 2048 bits or larger for
         * stronger security. If omitted or invalid, the parameters are
         * silently discarded and DHE ciphers will not be available.
         */
        dhparam?: string | Buffer | undefined;
        /**
         * A string describing a named curve or a colon separated list of curve
         * NIDs or names, for example P-521:P-384:P-256, to use for ECDH key
         * agreement. Set to auto to select the curve automatically. Use
         * crypto.getCurves() to obtain a list of available curve names. On
         * recent releases, openssl ecparam -list_curves will also display the
         * name and description of each available elliptic curve. Default:
         * tls.DEFAULT_ECDH_CURVE.
         */
        ecdhCurve?: string | undefined;
        /**
         * Attempt to use the server's cipher suite preferences instead of the
         * client's. When true, causes SSL_OP_CIPHER_SERVER_PREFERENCE to be
         * set in secureOptions
         */
        honorCipherOrder?: boolean | undefined;
        /**
         * Private keys in PEM format. PEM allows the option of private keys
         * being encrypted. Encrypted keys will be decrypted with
         * options.passphrase. Multiple keys using different algorithms can be
         * provided either as an array of unencrypted key strings or buffers,
         * or an array of objects in the form {pem: <string|buffer>[,
         * passphrase: <string>]}. The object form can only occur in an array.
         * object.passphrase is optional. Encrypted keys will be decrypted with
         * object.passphrase if provided, or options.passphrase if it is not.
         */
        key?: string | Buffer | Array<Buffer | KeyObject> | undefined;
        /**
         * Name of an OpenSSL engine to get private key from. Should be used
         * together with privateKeyIdentifier.
         */
        privateKeyEngine?: string | undefined;
        /**
         * Identifier of a private key managed by an OpenSSL engine. Should be
         * used together with privateKeyEngine. Should not be set together with
         * key, because both options define a private key in different ways.
         */
        privateKeyIdentifier?: string | undefined;
        /**
         * Optionally set the maximum TLS version to allow. One
         * of \`'TLSv1.3'\`, \`'TLSv1.2'\`, \`'TLSv1.1'\`, or \`'TLSv1'\`. Cannot be specified along with the
         * \`secureProtocol\` option, use one or the other.
         * **Default:** \`'TLSv1.3'\`, unless changed using CLI options. Using
         * \`--tls-max-v1.2\` sets the default to \`'TLSv1.2'\`. Using \`--tls-max-v1.3\` sets the default to
         * \`'TLSv1.3'\`. If multiple of the options are provided, the highest maximum is used.
         */
        maxVersion?: SecureVersion | undefined;
        /**
         * Optionally set the minimum TLS version to allow. One
         * of \`'TLSv1.3'\`, \`'TLSv1.2'\`, \`'TLSv1.1'\`, or \`'TLSv1'\`. Cannot be specified along with the
         * \`secureProtocol\` option, use one or the other.  It is not recommended to use
         * less than TLSv1.2, but it may be required for interoperability.
         * **Default:** \`'TLSv1.2'\`, unless changed using CLI options. Using
         * \`--tls-v1.0\` sets the default to \`'TLSv1'\`. Using \`--tls-v1.1\` sets the default to
         * \`'TLSv1.1'\`. Using \`--tls-min-v1.3\` sets the default to
         * 'TLSv1.3'. If multiple of the options are provided, the lowest minimum is used.
         */
        minVersion?: SecureVersion | undefined;
        /**
         * Shared passphrase used for a single private key and/or a PFX.
         */
        passphrase?: string | undefined;
        /**
         * PFX or PKCS12 encoded private key and certificate chain. pfx is an
         * alternative to providing key and cert individually. PFX is usually
         * encrypted, if it is, passphrase will be used to decrypt it. Multiple
         * PFX can be provided either as an array of unencrypted PFX buffers,
         * or an array of objects in the form {buf: <string|buffer>[,
         * passphrase: <string>]}. The object form can only occur in an array.
         * object.passphrase is optional. Encrypted PFX will be decrypted with
         * object.passphrase if provided, or options.passphrase if it is not.
         */
        pfx?: string | Buffer | Array<string | Buffer | PxfObject> | undefined;
        /**
         * Optionally affect the OpenSSL protocol behavior, which is not
         * usually necessary. This should be used carefully if at all! Value is
         * a numeric bitmask of the SSL_OP_* options from OpenSSL Options
         */
        secureOptions?: number | undefined; \/\/ Value is a numeric bitmask of the \`SSL_OP_*\` options
        /**
         * Legacy mechanism to select the TLS protocol version to use, it does
         * not support independent control of the minimum and maximum version,
         * and does not support limiting the protocol to TLSv1.3. Use
         * minVersion and maxVersion instead. The possible values are listed as
         * SSL_METHODS, use the function names as strings. For example, use
         * 'TLSv1_1_method' to force TLS version 1.1, or 'TLS_method' to allow
         * any TLS protocol version up to TLSv1.3. It is not recommended to use
         * TLS versions less than 1.2, but it may be required for
         * interoperability. Default: none, see minVersion.
         */
        secureProtocol?: string | undefined;
        /**
         * Opaque identifier used by servers to ensure session state is not
         * shared between applications. Unused by clients.
         */
        sessionIdContext?: string | undefined;
        /**
         * 48-bytes of cryptographically strong pseudo-random data.
         * See Session Resumption for more information.
         */
        ticketKeys?: Buffer | undefined;
        /**
         * The number of seconds after which a TLS session created by the
         * server will no longer be resumable. See Session Resumption for more
         * information. Default: 300.
         */
        sessionTimeout?: number | undefined;
    }

    interface SecureContext {
        context: any;
    }

    /*
     * Verifies the certificate \`cert\` is issued to host \`host\`.
     * @host The hostname to verify the certificate against
     * @cert PeerCertificate representing the peer's certificate
     *
     * Returns Error object, populating it with the reason, host and cert on failure.  On success, returns undefined.
     */
    function checkServerIdentity(host: string, cert: PeerCertificate): Error | undefined;
    function createServer(secureConnectionListener?: (socket: TLSSocket) => void): Server;
    function createServer(options: TlsOptions, secureConnectionListener?: (socket: TLSSocket) => void): Server;
    function connect(options: ConnectionOptions, secureConnectListener?: () => void): TLSSocket;
    function connect(port: number, host?: string, options?: ConnectionOptions, secureConnectListener?: () => void): TLSSocket;
    function connect(port: number, options?: ConnectionOptions, secureConnectListener?: () => void): TLSSocket;
    /**
     * @deprecated since v0.11.3 Use \`tls.TLSSocket\` instead.
     */
    function createSecurePair(credentials?: SecureContext, isServer?: boolean, requestCert?: boolean, rejectUnauthorized?: boolean): SecurePair;
    function createSecureContext(options?: SecureContextOptions): SecureContext;
    function getCiphers(): string[];

    /**
     * The default curve name to use for ECDH key agreement in a tls server.
     * The default value is 'auto'. See tls.createSecureContext() for further
     * information.
     */
    let DEFAULT_ECDH_CURVE: string;
    /**
     * The default value of the maxVersion option of
     * tls.createSecureContext(). It can be assigned any of the supported TLS
     * protocol versions, 'TLSv1.3', 'TLSv1.2', 'TLSv1.1', or 'TLSv1'. Default:
     * 'TLSv1.3', unless changed using CLI options. Using --tls-max-v1.2 sets
     * the default to 'TLSv1.2'. Using --tls-max-v1.3 sets the default to
     * 'TLSv1.3'. If multiple of the options are provided, the highest maximum
     * is used.
     */
    let DEFAULT_MAX_VERSION: SecureVersion;
    /**
     * The default value of the minVersion option of tls.createSecureContext().
     * It can be assigned any of the supported TLS protocol versions,
     * 'TLSv1.3', 'TLSv1.2', 'TLSv1.1', or 'TLSv1'. Default: 'TLSv1.2', unless
     * changed using CLI options. Using --tls-min-v1.0 sets the default to
     * 'TLSv1'. Using --tls-min-v1.1 sets the default to 'TLSv1.1'. Using
     * --tls-min-v1.3 sets the default to 'TLSv1.3'. If multiple of the options
     * are provided, the lowest minimum is used.
     */
    let DEFAULT_MIN_VERSION: SecureVersion;

    /**
     * An immutable array of strings representing the root certificates (in PEM
     * format) used for verifying peer certificates. This is the default value
     * of the ca option to tls.createSecureContext().
     */
    const rootCertificates: ReadonlyArray<string>;
}
`;
definitions['trace_events.d.ts'] = `declare module 'trace_events' {
    /**
     * The \`Tracing\` object is used to enable or disable tracing for sets of
     * categories. Instances are created using the
     * \`trace_events.createTracing()\` method.
     *
     * When created, the \`Tracing\` object is disabled. Calling the
     * \`tracing.enable()\` method adds the categories to the set of enabled trace
     * event categories. Calling \`tracing.disable()\` will remove the categories
     * from the set of enabled trace event categories.
     */
    interface Tracing {
        /**
         * A comma-separated list of the trace event categories covered by this
         * \`Tracing\` object.
         */
        readonly categories: string;

        /**
         * Disables this \`Tracing\` object.
         *
         * Only trace event categories _not_ covered by other enabled \`Tracing\`
         * objects and _not_ specified by the \`--trace-event-categories\` flag
         * will be disabled.
         */
        disable(): void;

        /**
         * Enables this \`Tracing\` object for the set of categories covered by
         * the \`Tracing\` object.
         */
        enable(): void;

        /**
         * \`true\` only if the \`Tracing\` object has been enabled.
         */
        readonly enabled: boolean;
    }

    interface CreateTracingOptions {
        /**
         * An array of trace category names. Values included in the array are
         * coerced to a string when possible. An error will be thrown if the
         * value cannot be coerced.
         */
        categories: string[];
    }

    /**
     * Creates and returns a Tracing object for the given set of categories.
     */
    function createTracing(options: CreateTracingOptions): Tracing;

    /**
     * Returns a comma-separated list of all currently-enabled trace event
     * categories. The current set of enabled trace event categories is
     * determined by the union of all currently-enabled \`Tracing\` objects and
     * any categories enabled using the \`--trace-event-categories\` flag.
     */
    function getEnabledCategories(): string | undefined;
}
`;
definitions['tty.d.ts'] = `declare module 'tty' {
    import * as net from 'net';

    function isatty(fd: number): boolean;
    class ReadStream extends net.Socket {
        constructor(fd: number, options?: net.SocketConstructorOpts);
        isRaw: boolean;
        setRawMode(mode: boolean): this;
        isTTY: boolean;
    }
    /**
     * -1 - to the left from cursor
     *  0 - the entire line
     *  1 - to the right from cursor
     */
    type Direction = -1 | 0 | 1;
    class WriteStream extends net.Socket {
        constructor(fd: number);
        addListener(event: string, listener: (...args: any[]) => void): this;
        addListener(event: "resize", listener: () => void): this;

        emit(event: string | symbol, ...args: any[]): boolean;
        emit(event: "resize"): boolean;

        on(event: string, listener: (...args: any[]) => void): this;
        on(event: "resize", listener: () => void): this;

        once(event: string, listener: (...args: any[]) => void): this;
        once(event: "resize", listener: () => void): this;

        prependListener(event: string, listener: (...args: any[]) => void): this;
        prependListener(event: "resize", listener: () => void): this;

        prependOnceListener(event: string, listener: (...args: any[]) => void): this;
        prependOnceListener(event: "resize", listener: () => void): this;

        /**
         * Clears the current line of this WriteStream in a direction identified by \`dir\`.
         */
        clearLine(dir: Direction, callback?: () => void): boolean;
        /**
         * Clears this \`WriteStream\` from the current cursor down.
         */
        clearScreenDown(callback?: () => void): boolean;
        /**
         * Moves this WriteStream's cursor to the specified position.
         */
        cursorTo(x: number, y?: number, callback?: () => void): boolean;
        cursorTo(x: number, callback: () => void): boolean;
        /**
         * Moves this WriteStream's cursor relative to its current position.
         */
        moveCursor(dx: number, dy: number, callback?: () => void): boolean;
        /**
         * @default \`process.env\`
         */
        getColorDepth(env?: {}): number;
        hasColors(depth?: number): boolean;
        hasColors(env?: {}): boolean;
        hasColors(depth: number, env?: {}): boolean;
        getWindowSize(): [number, number];
        columns: number;
        rows: number;
        isTTY: boolean;
    }
}
`;
definitions['url.d.ts'] = `declare module 'url' {
    import { ParsedUrlQuery, ParsedUrlQueryInput } from 'querystring';

    \/\/ Input to \`url.format\`
    interface UrlObject {
        auth?: string | null | undefined;
        hash?: string | null | undefined;
        host?: string | null | undefined;
        hostname?: string | null | undefined;
        href?: string | null | undefined;
        pathname?: string | null | undefined;
        protocol?: string | null | undefined;
        search?: string | null | undefined;
        slashes?: boolean | null | undefined;
        port?: string | number | null | undefined;
        query?: string | null | ParsedUrlQueryInput | undefined;
    }

    \/\/ Output of \`url.parse\`
    interface Url {
        auth: string | null;
        hash: string | null;
        host: string | null;
        hostname: string | null;
        href: string;
        path: string | null;
        pathname: string | null;
        protocol: string | null;
        search: string | null;
        slashes: boolean | null;
        port: string | null;
        query: string | null | ParsedUrlQuery;
    }

    interface UrlWithParsedQuery extends Url {
        query: ParsedUrlQuery;
    }

    interface UrlWithStringQuery extends Url {
        query: string | null;
    }

    /** @deprecated since v11.0.0 - Use the WHATWG URL API. */
    function parse(urlStr: string): UrlWithStringQuery;
    /** @deprecated since v11.0.0 - Use the WHATWG URL API. */
    function parse(urlStr: string, parseQueryString: false | undefined, slashesDenoteHost?: boolean): UrlWithStringQuery;
    /** @deprecated since v11.0.0 - Use the WHATWG URL API. */
    function parse(urlStr: string, parseQueryString: true, slashesDenoteHost?: boolean): UrlWithParsedQuery;
    /** @deprecated since v11.0.0 - Use the WHATWG URL API. */
    function parse(urlStr: string, parseQueryString: boolean, slashesDenoteHost?: boolean): Url;

    function format(URL: URL, options?: URLFormatOptions): string;
    /** @deprecated since v11.0.0 - Use the WHATWG URL API. */
    function format(urlObject: UrlObject | string): string;
    /** @deprecated since v11.0.0 - Use the WHATWG URL API. */
    function resolve(from: string, to: string): string;

    function domainToASCII(domain: string): string;
    function domainToUnicode(domain: string): string;

    /**
     * This function ensures the correct decodings of percent-encoded characters as
     * well as ensuring a cross-platform valid absolute path string.
     * @param url The file URL string or URL object to convert to a path.
     */
    function fileURLToPath(url: string | URL): string;

    /**
     * This function ensures that path is resolved absolutely, and that the URL
     * control characters are correctly encoded when converting into a File URL.
     * @param url The path to convert to a File URL.
     */
    function pathToFileURL(url: string): URL;

    interface URLFormatOptions {
        auth?: boolean | undefined;
        fragment?: boolean | undefined;
        search?: boolean | undefined;
        unicode?: boolean | undefined;
    }

    class URL {
        constructor(input: string, base?: string | URL);
        hash: string;
        host: string;
        hostname: string;
        href: string;
        readonly origin: string;
        password: string;
        pathname: string;
        port: string;
        protocol: string;
        search: string;
        readonly searchParams: URLSearchParams;
        username: string;
        toString(): string;
        toJSON(): string;
    }

    class URLSearchParams implements Iterable<[string, string]> {
        constructor(init?: URLSearchParams | string | Record<string, string | ReadonlyArray<string>> | Iterable<[string, string]> | ReadonlyArray<[string, string]>);
        append(name: string, value: string): void;
        delete(name: string): void;
        entries(): IterableIterator<[string, string]>;
        forEach(callback: (value: string, name: string, searchParams: this) => void): void;
        get(name: string): string | null;
        getAll(name: string): string[];
        has(name: string): boolean;
        keys(): IterableIterator<string>;
        set(name: string, value: string): void;
        sort(): void;
        toString(): string;
        values(): IterableIterator<string>;
        [Symbol.iterator](): IterableIterator<[string, string]>;
    }
}
`;
definitions['util.d.ts'] = `declare module 'util' {
    interface InspectOptions extends NodeJS.InspectOptions { }
    type Style = 'special' | 'number' | 'bigint' | 'boolean' | 'undefined' | 'null' | 'string' | 'symbol' | 'date' | 'regexp' | 'module';
    type CustomInspectFunction = (depth: number, options: InspectOptionsStylized) => string;
    interface InspectOptionsStylized extends InspectOptions {
        stylize(text: string, styleType: Style): string;
    }
    function format(format?: any, ...param: any[]): string;
    function formatWithOptions(inspectOptions: InspectOptions, format?: any, ...param: any[]): string;
    /** @deprecated since v0.11.3 - use a third party module instead. */
    function log(string: string): void;
    function inspect(object: any, showHidden?: boolean, depth?: number | null, color?: boolean): string;
    function inspect(object: any, options: InspectOptions): string;
    namespace inspect {
        let colors: NodeJS.Dict<[number, number]>;
        let styles: {
            [K in Style]: string
        };
        let defaultOptions: InspectOptions;
        /**
         * Allows changing inspect settings from the repl.
         */
        let replDefaults: InspectOptions;
        const custom: unique symbol;
    }
    /** @deprecated since v4.0.0 - use \`Array.isArray()\` instead. */
    function isArray(object: any): object is any[];
    /** @deprecated since v4.0.0 - use \`util.types.isRegExp()\` instead. */
    function isRegExp(object: any): object is RegExp;
    /** @deprecated since v4.0.0 - use \`util.types.isDate()\` instead. */
    function isDate(object: any): object is Date;
    /** @deprecated since v4.0.0 - use \`util.types.isNativeError()\` instead. */
    function isError(object: any): object is Error;
    function inherits(constructor: any, superConstructor: any): void;
    function debuglog(key: string): (msg: string, ...param: any[]) => void;
    /** @deprecated since v4.0.0 - use \`typeof value === 'boolean'\` instead. */
    function isBoolean(object: any): object is boolean;
    /** @deprecated since v4.0.0 - use \`Buffer.isBuffer()\` instead. */
    function isBuffer(object: any): object is Buffer;
    /** @deprecated since v4.0.0 - use \`typeof value === 'function'\` instead. */
    function isFunction(object: any): boolean;
    /** @deprecated since v4.0.0 - use \`value === null\` instead. */
    function isNull(object: any): object is null;
    /** @deprecated since v4.0.0 - use \`value === null || value === undefined\` instead. */
    function isNullOrUndefined(object: any): object is null | undefined;
    /** @deprecated since v4.0.0 - use \`typeof value === 'number'\` instead. */
    function isNumber(object: any): object is number;
    /** @deprecated since v4.0.0 - use \`value !== null && typeof value === 'object'\` instead. */
    function isObject(object: any): boolean;
    /** @deprecated since v4.0.0 - use \`(typeof value !== 'object' && typeof value !== 'function') || value === null\` instead. */
    function isPrimitive(object: any): boolean;
    /** @deprecated since v4.0.0 - use \`typeof value === 'string'\` instead. */
    function isString(object: any): object is string;
    /** @deprecated since v4.0.0 - use \`typeof value === 'symbol'\` instead. */
    function isSymbol(object: any): object is symbol;
    /** @deprecated since v4.0.0 - use \`value === undefined\` instead. */
    function isUndefined(object: any): object is undefined;
    function deprecate<T extends Function>(fn: T, message: string, code?: string): T;
    function isDeepStrictEqual(val1: any, val2: any): boolean;

    function callbackify(fn: () => Promise<void>): (callback: (err: NodeJS.ErrnoException) => void) => void;
    function callbackify<TResult>(fn: () => Promise<TResult>): (callback: (err: NodeJS.ErrnoException, result: TResult) => void) => void;
    function callbackify<T1>(fn: (arg1: T1) => Promise<void>): (arg1: T1, callback: (err: NodeJS.ErrnoException) => void) => void;
    function callbackify<T1, TResult>(fn: (arg1: T1) => Promise<TResult>): (arg1: T1, callback: (err: NodeJS.ErrnoException, result: TResult) => void) => void;
    function callbackify<T1, T2>(fn: (arg1: T1, arg2: T2) => Promise<void>): (arg1: T1, arg2: T2, callback: (err: NodeJS.ErrnoException) => void) => void;
    function callbackify<T1, T2, TResult>(fn: (arg1: T1, arg2: T2) => Promise<TResult>): (arg1: T1, arg2: T2, callback: (err: NodeJS.ErrnoException | null, result: TResult) => void) => void;
    function callbackify<T1, T2, T3>(fn: (arg1: T1, arg2: T2, arg3: T3) => Promise<void>): (arg1: T1, arg2: T2, arg3: T3, callback: (err: NodeJS.ErrnoException) => void) => void;
    function callbackify<T1, T2, T3, TResult>(
        fn: (arg1: T1, arg2: T2, arg3: T3) => Promise<TResult>): (arg1: T1, arg2: T2, arg3: T3, callback: (err: NodeJS.ErrnoException | null, result: TResult) => void) => void;
    function callbackify<T1, T2, T3, T4>(
        fn: (arg1: T1, arg2: T2, arg3: T3, arg4: T4) => Promise<void>): (arg1: T1, arg2: T2, arg3: T3, arg4: T4, callback: (err: NodeJS.ErrnoException) => void) => void;
    function callbackify<T1, T2, T3, T4, TResult>(
        fn: (arg1: T1, arg2: T2, arg3: T3, arg4: T4) => Promise<TResult>): (arg1: T1, arg2: T2, arg3: T3, arg4: T4, callback: (err: NodeJS.ErrnoException | null, result: TResult) => void) => void;
    function callbackify<T1, T2, T3, T4, T5>(
        fn: (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5) => Promise<void>): (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, callback: (err: NodeJS.ErrnoException) => void) => void;
    function callbackify<T1, T2, T3, T4, T5, TResult>(
        fn: (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5) => Promise<TResult>,
    ): (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, callback: (err: NodeJS.ErrnoException | null, result: TResult) => void) => void;
    function callbackify<T1, T2, T3, T4, T5, T6>(
        fn: (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6) => Promise<void>,
    ): (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6, callback: (err: NodeJS.ErrnoException) => void) => void;
    function callbackify<T1, T2, T3, T4, T5, T6, TResult>(
        fn: (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6) => Promise<TResult>
    ): (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6, callback: (err: NodeJS.ErrnoException | null, result: TResult) => void) => void;

    interface CustomPromisifyLegacy<TCustom extends Function> extends Function {
        __promisify__: TCustom;
    }

    interface CustomPromisifySymbol<TCustom extends Function> extends Function {
        [promisify.custom]: TCustom;
    }

    type CustomPromisify<TCustom extends Function> = CustomPromisifySymbol<TCustom> | CustomPromisifyLegacy<TCustom>;

    function promisify<TCustom extends Function>(fn: CustomPromisify<TCustom>): TCustom;
    function promisify<TResult>(fn: (callback: (err: any, result: TResult) => void) => void): () => Promise<TResult>;
    function promisify(fn: (callback: (err?: any) => void) => void): () => Promise<void>;
    function promisify<T1, TResult>(fn: (arg1: T1, callback: (err: any, result: TResult) => void) => void): (arg1: T1) => Promise<TResult>;
    function promisify<T1>(fn: (arg1: T1, callback: (err?: any) => void) => void): (arg1: T1) => Promise<void>;
    function promisify<T1, T2, TResult>(fn: (arg1: T1, arg2: T2, callback: (err: any, result: TResult) => void) => void): (arg1: T1, arg2: T2) => Promise<TResult>;
    function promisify<T1, T2>(fn: (arg1: T1, arg2: T2, callback: (err?: any) => void) => void): (arg1: T1, arg2: T2) => Promise<void>;
    function promisify<T1, T2, T3, TResult>(fn: (arg1: T1, arg2: T2, arg3: T3, callback: (err: any, result: TResult) => void) => void):
        (arg1: T1, arg2: T2, arg3: T3) => Promise<TResult>;
    function promisify<T1, T2, T3>(fn: (arg1: T1, arg2: T2, arg3: T3, callback: (err?: any) => void) => void): (arg1: T1, arg2: T2, arg3: T3) => Promise<void>;
    function promisify<T1, T2, T3, T4, TResult>(
        fn: (arg1: T1, arg2: T2, arg3: T3, arg4: T4, callback: (err: any, result: TResult) => void) => void,
    ): (arg1: T1, arg2: T2, arg3: T3, arg4: T4) => Promise<TResult>;
    function promisify<T1, T2, T3, T4>(fn: (arg1: T1, arg2: T2, arg3: T3, arg4: T4, callback: (err?: any) => void) => void):
        (arg1: T1, arg2: T2, arg3: T3, arg4: T4) => Promise<void>;
    function promisify<T1, T2, T3, T4, T5, TResult>(
        fn: (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, callback: (err: any, result: TResult) => void) => void,
    ): (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5) => Promise<TResult>;
    function promisify<T1, T2, T3, T4, T5>(
        fn: (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, callback: (err?: any) => void) => void,
    ): (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5) => Promise<void>;
    function promisify(fn: Function): Function;
    namespace promisify {
        const custom: unique symbol;
    }

    namespace types {
        function isAnyArrayBuffer(object: any): object is ArrayBufferLike;
        function isArgumentsObject(object: any): object is IArguments;
        function isArrayBuffer(object: any): object is ArrayBuffer;
        function isArrayBufferView(object: any): object is NodeJS.ArrayBufferView;
        function isAsyncFunction(object: any): boolean;
        function isBigInt64Array(value: any): value is BigInt64Array;
        function isBigUint64Array(value: any): value is BigUint64Array;
        function isBooleanObject(object: any): object is Boolean;
        function isBoxedPrimitive(object: any): object is String | Number | BigInt | Boolean | Symbol;
        function isDataView(object: any): object is DataView;
        function isDate(object: any): object is Date;
        function isExternal(object: any): boolean;
        function isFloat32Array(object: any): object is Float32Array;
        function isFloat64Array(object: any): object is Float64Array;
        function isGeneratorFunction(object: any): object is GeneratorFunction;
        function isGeneratorObject(object: any): object is Generator;
        function isInt8Array(object: any): object is Int8Array;
        function isInt16Array(object: any): object is Int16Array;
        function isInt32Array(object: any): object is Int32Array;
        function isMap<T>(
            object: T | {},
        ): object is T extends ReadonlyMap<any, any>
            ? unknown extends T
                ? never
                : ReadonlyMap<any, any>
            : Map<any, any>;
        function isMapIterator(object: any): boolean;
        function isModuleNamespaceObject(value: any): boolean;
        function isNativeError(object: any): object is Error;
        function isNumberObject(object: any): object is Number;
        function isPromise(object: any): object is Promise<any>;
        function isProxy(object: any): boolean;
        function isRegExp(object: any): object is RegExp;
        function isSet<T>(
            object: T | {},
        ): object is T extends ReadonlySet<any>
            ? unknown extends T
                ? never
                : ReadonlySet<any>
            : Set<any>;
        function isSetIterator(object: any): boolean;
        function isSharedArrayBuffer(object: any): object is SharedArrayBuffer;
        function isStringObject(object: any): object is String;
        function isSymbolObject(object: any): object is Symbol;
        function isTypedArray(object: any): object is NodeJS.TypedArray;
        function isUint8Array(object: any): object is Uint8Array;
        function isUint8ClampedArray(object: any): object is Uint8ClampedArray;
        function isUint16Array(object: any): object is Uint16Array;
        function isUint32Array(object: any): object is Uint32Array;
        function isWeakMap(object: any): object is WeakMap<any, any>;
        function isWeakSet(object: any): object is WeakSet<any>;
    }

    class TextDecoder {
        readonly encoding: string;
        readonly fatal: boolean;
        readonly ignoreBOM: boolean;
        constructor(
          encoding?: string,
          options?: { fatal?: boolean | undefined; ignoreBOM?: boolean | undefined }
        );
        decode(
          input?: NodeJS.ArrayBufferView | ArrayBuffer | null,
          options?: { stream?: boolean | undefined }
        ): string;
    }

    interface EncodeIntoResult {
        /**
         * The read Unicode code units of input.
         */

        read: number;
        /**
         * The written UTF-8 bytes of output.
         */
        written: number;
    }

    class TextEncoder {
        readonly encoding: string;
        encode(input?: string): Uint8Array;
        encodeInto(input: string, output: Uint8Array): EncodeIntoResult;
    }
}
`;
definitions['v8.d.ts'] = `declare module 'v8' {
    import { Readable } from 'stream';

    interface HeapSpaceInfo {
        space_name: string;
        space_size: number;
        space_used_size: number;
        space_available_size: number;
        physical_space_size: number;
    }

    \/\/ ** Signifies if the --zap_code_space option is enabled or not.  1 == enabled, 0 == disabled. */
    type DoesZapCodeSpaceFlag = 0 | 1;

    interface HeapInfo {
        total_heap_size: number;
        total_heap_size_executable: number;
        total_physical_size: number;
        total_available_size: number;
        used_heap_size: number;
        heap_size_limit: number;
        malloced_memory: number;
        peak_malloced_memory: number;
        does_zap_garbage: DoesZapCodeSpaceFlag;
        number_of_native_contexts: number;
        number_of_detached_contexts: number;
    }

    interface HeapCodeStatistics {
        code_and_metadata_size: number;
        bytecode_and_metadata_size: number;
        external_script_source_size: number;
    }

    /**
     * Returns an integer representing a "version tag" derived from the V8 version, command line flags and detected CPU features.
     * This is useful for determining whether a vm.Script cachedData buffer is compatible with this instance of V8.
     */
    function cachedDataVersionTag(): number;

    function getHeapStatistics(): HeapInfo;
    function getHeapSpaceStatistics(): HeapSpaceInfo[];
    function setFlagsFromString(flags: string): void;
    /**
     * Generates a snapshot of the current V8 heap and returns a Readable
     * Stream that may be used to read the JSON serialized representation.
     * This conversation was marked as resolved by joyeecheung
     * This JSON stream format is intended to be used with tools such as
     * Chrome DevTools. The JSON schema is undocumented and specific to the
     * V8 engine, and may change from one version of V8 to the next.
     */
    function getHeapSnapshot(): Readable;

    /**
     *
     * @param fileName The file path where the V8 heap snapshot is to be
     * saved. If not specified, a file name with the pattern
     * \`'Heap-\${yyyymmdd}-\${hhmmss}-\${pid}-\${thread_id}.heapsnapshot'\` will be
     * generated, where \`{pid}\` will be the PID of the Node.js process,
     * \`{thread_id}\` will be \`0\` when \`writeHeapSnapshot()\` is called from
     * the main Node.js thread or the id of a worker thread.
     */
    function writeHeapSnapshot(fileName?: string): string;

    function getHeapCodeStatistics(): HeapCodeStatistics;

    class Serializer {
        /**
         * Writes out a header, which includes the serialization format version.
         */
        writeHeader(): void;

        /**
         * Serializes a JavaScript value and adds the serialized representation to the internal buffer.
         * This throws an error if value cannot be serialized.
         */
        writeValue(val: any): boolean;

        /**
         * Returns the stored internal buffer.
         * This serializer should not be used once the buffer is released.
         * Calling this method results in undefined behavior if a previous write has failed.
         */
        releaseBuffer(): Buffer;

        /**
         * Marks an ArrayBuffer as having its contents transferred out of band.\
         * Pass the corresponding ArrayBuffer in the deserializing context to deserializer.transferArrayBuffer().
         */
        transferArrayBuffer(id: number, arrayBuffer: ArrayBuffer): void;

        /**
         * Write a raw 32-bit unsigned integer.
         */
        writeUint32(value: number): void;

        /**
         * Write a raw 64-bit unsigned integer, split into high and low 32-bit parts.
         */
        writeUint64(hi: number, lo: number): void;

        /**
         * Write a JS number value.
         */
        writeDouble(value: number): void;

        /**
         * Write raw bytes into the serializer’s internal buffer.
         * The deserializer will require a way to compute the length of the buffer.
         */
        writeRawBytes(buffer: NodeJS.TypedArray): void;
    }

    /**
     * A subclass of \`Serializer\` that serializes \`TypedArray\` (in particular \`Buffer\`) and \`DataView\` objects as host objects,
     * and only stores the part of their underlying \`ArrayBuffers\` that they are referring to.
     */
    class DefaultSerializer extends Serializer {
    }

    class Deserializer {
        constructor(data: NodeJS.TypedArray);
        /**
         * Reads and validates a header (including the format version).
         * May, for example, reject an invalid or unsupported wire format.
         * In that case, an Error is thrown.
         */
        readHeader(): boolean;

        /**
         * Deserializes a JavaScript value from the buffer and returns it.
         */
        readValue(): any;

        /**
         * Marks an ArrayBuffer as having its contents transferred out of band.
         * Pass the corresponding \`ArrayBuffer\` in the serializing context to serializer.transferArrayBuffer()
         * (or return the id from serializer._getSharedArrayBufferId() in the case of SharedArrayBuffers).
         */
        transferArrayBuffer(id: number, arrayBuffer: ArrayBuffer): void;

        /**
         * Reads the underlying wire format version.
         * Likely mostly to be useful to legacy code reading old wire format versions.
         * May not be called before .readHeader().
         */
        getWireFormatVersion(): number;

        /**
         * Read a raw 32-bit unsigned integer and return it.
         */
        readUint32(): number;

        /**
         * Read a raw 64-bit unsigned integer and return it as an array [hi, lo] with two 32-bit unsigned integer entries.
         */
        readUint64(): [number, number];

        /**
         * Read a JS number value.
         */
        readDouble(): number;

        /**
         * Read raw bytes from the deserializer’s internal buffer.
         * The length parameter must correspond to the length of the buffer that was passed to serializer.writeRawBytes().
         */
        readRawBytes(length: number): Buffer;
    }

    /**
     * A subclass of \`Serializer\` that serializes \`TypedArray\` (in particular \`Buffer\`) and \`DataView\` objects as host objects,
     * and only stores the part of their underlying \`ArrayBuffers\` that they are referring to.
     */
    class DefaultDeserializer extends Deserializer {
    }

    /**
     * Uses a \`DefaultSerializer\` to serialize value into a buffer.
     */
    function serialize(value: any): Buffer;

    /**
     * Uses a \`DefaultDeserializer\` with default options to read a JS value from a buffer.
     */
    function deserialize(data: NodeJS.TypedArray): any;
}
`;
definitions['vm.d.ts'] = `declare module 'vm' {
    interface Context extends NodeJS.Dict<any> { }
    interface BaseOptions {
        /**
         * Specifies the filename used in stack traces produced by this script.
         * Default: \`''\`.
         */
        filename?: string | undefined;
        /**
         * Specifies the line number offset that is displayed in stack traces produced by this script.
         * Default: \`0\`.
         */
        lineOffset?: number | undefined;
        /**
         * Specifies the column number offset that is displayed in stack traces produced by this script.
         * @default 0
         */
        columnOffset?: number | undefined;
    }
    interface ScriptOptions extends BaseOptions {
        displayErrors?: boolean | undefined;
        timeout?: number | undefined;
        cachedData?: Buffer | undefined;
        /** @deprecated in favor of \`script.createCachedData()\` */
        produceCachedData?: boolean | undefined;
    }
    interface RunningScriptOptions extends BaseOptions {
        /**
         * When \`true\`, if an \`Error\` occurs while compiling the \`code\`, the line of code causing the error is attached to the stack trace.
         * Default: \`true\`.
         */
        displayErrors?: boolean | undefined;
        /**
         * Specifies the number of milliseconds to execute code before terminating execution.
         * If execution is terminated, an \`Error\` will be thrown. This value must be a strictly positive integer.
         */
        timeout?: number | undefined;
        /**
         * If \`true\`, the execution will be terminated when \`SIGINT\` (Ctrl+C) is received.
         * Existing handlers for the event that have been attached via \`process.on('SIGINT')\` will be disabled during script execution, but will continue to work after that.
         * If execution is terminated, an \`Error\` will be thrown.
         * Default: \`false\`.
         */
        breakOnSigint?: boolean | undefined;
        /**
         * If set to \`afterEvaluate\`, microtasks will be run immediately after the script has run.
         */
        microtaskMode?: 'afterEvaluate' | undefined;
    }
    interface CompileFunctionOptions extends BaseOptions {
        /**
         * Provides an optional data with V8's code cache data for the supplied source.
         */
        cachedData?: Buffer | undefined;
        /**
         * Specifies whether to produce new cache data.
         * Default: \`false\`,
         */
        produceCachedData?: boolean | undefined;
        /**
         * The sandbox/context in which the said function should be compiled in.
         */
        parsingContext?: Context | undefined;

        /**
         * An array containing a collection of context extensions (objects wrapping the current scope) to be applied while compiling
         */
        contextExtensions?: Object[] | undefined;
    }

    interface CreateContextOptions {
        /**
         * Human-readable name of the newly created context.
         * @default 'VM Context i' Where i is an ascending numerical index of the created context.
         */
        name?: string | undefined;
        /**
         * Corresponds to the newly created context for display purposes.
         * The origin should be formatted like a \`URL\`, but with only the scheme, host, and port (if necessary),
         * like the value of the \`url.origin\` property of a URL object.
         * Most notably, this string should omit the trailing slash, as that denotes a path.
         * @default ''
         */
        origin?: string | undefined;
        codeGeneration?: {
            /**
             * If set to false any calls to eval or function constructors (Function, GeneratorFunction, etc)
             * will throw an EvalError.
             * @default true
             */
            strings?: boolean | undefined;
            /**
             * If set to false any attempt to compile a WebAssembly module will throw a WebAssembly.CompileError.
             * @default true
             */
            wasm?: boolean | undefined;
        } | undefined;
        /**
         * If set to \`afterEvaluate\`, microtasks will be run immediately after the script has run.
         */
        microtaskMode?: 'afterEvaluate' | undefined;
    }

    type MeasureMemoryMode = 'summary' | 'detailed';

    interface MeasureMemoryOptions {
        /**
         * @default 'summary'
         */
        mode?: MeasureMemoryMode | undefined;
        context?: Context | undefined;
    }

    interface MemoryMeasurement {
        total: {
            jsMemoryEstimate: number;
            jsMemoryRange: [number, number];
        };
    }

    class Script {
        constructor(code: string, options?: ScriptOptions);
        runInContext(contextifiedSandbox: Context, options?: RunningScriptOptions): any;
        runInNewContext(sandbox?: Context, options?: RunningScriptOptions): any;
        runInThisContext(options?: RunningScriptOptions): any;
        createCachedData(): Buffer;
        cachedDataRejected?: boolean | undefined;
    }
    function createContext(sandbox?: Context, options?: CreateContextOptions): Context;
    function isContext(sandbox: Context): boolean;
    function runInContext(code: string, contextifiedSandbox: Context, options?: RunningScriptOptions | string): any;
    function runInNewContext(code: string, sandbox?: Context, options?: RunningScriptOptions | string): any;
    function runInThisContext(code: string, options?: RunningScriptOptions | string): any;
    function compileFunction(code: string, params?: ReadonlyArray<string>, options?: CompileFunctionOptions): Function;

    /**
     * Measure the memory known to V8 and used by the current execution context or a specified context.
     *
     * The format of the object that the returned Promise may resolve with is
     * specific to the V8 engine and may change from one version of V8 to the next.
     *
     * The returned result is different from the statistics returned by
     * \`v8.getHeapSpaceStatistics()\` in that \`vm.measureMemory()\` measures
     * the memory reachable by V8 from a specific context, while
     * \`v8.getHeapSpaceStatistics()\` measures the memory used by an instance
     * of V8 engine, which can switch among multiple contexts that reference
     * objects in the heap of one engine.
     *
     * @experimental
     */
    function measureMemory(options?: MeasureMemoryOptions): Promise<MemoryMeasurement>;
}
`;
definitions['wasi.d.ts'] = `declare module 'wasi' {
    interface WASIOptions {
        /**
         * An array of strings that the WebAssembly application will
         * see as command line arguments. The first argument is the virtual path to the
         * WASI command itself.
         */
        args?: string[] | undefined;

        /**
         * An object similar to \`process.env\` that the WebAssembly
         * application will see as its environment.
         */
        env?: object | undefined;

        /**
         * This object represents the WebAssembly application's
         * sandbox directory structure. The string keys of \`preopens\` are treated as
         * directories within the sandbox. The corresponding values in \`preopens\` are
         * the real paths to those directories on the host machine.
         */
        preopens?: NodeJS.Dict<string> | undefined;

        /**
         * By default, WASI applications terminate the Node.js
         * process via the \`__wasi_proc_exit()\` function. Setting this option to \`true\`
         * causes \`wasi.start()\` to return the exit code rather than terminate the
         * process.
         * @default false
         */
        returnOnExit?: boolean | undefined;

        /**
         * The file descriptor used as standard input in the WebAssembly application.
         * @default 0
         */
        stdin?: number | undefined;

        /**
         * The file descriptor used as standard output in the WebAssembly application.
         * @default 1
         */
        stdout?: number | undefined;

        /**
         * The file descriptor used as standard error in the WebAssembly application.
         * @default 2
         */
        stderr?: number | undefined;
    }

    class WASI {
        constructor(options?: WASIOptions);
        /**
         *
         * Attempt to begin execution of \`instance\` by invoking its \`_start()\` export.
         * If \`instance\` does not contain a \`_start()\` export, then \`start()\` attempts to
         * invoke the \`__wasi_unstable_reactor_start()\` export. If neither of those exports
         * is present on \`instance\`, then \`start()\` does nothing.
         *
         * \`start()\` requires that \`instance\` exports a [\`WebAssembly.Memory\`][] named
         * \`memory\`. If \`instance\` does not have a \`memory\` export an exception is thrown.
         *
         * If \`start()\` is called more than once, an exception is thrown.
         */
        start(instance: object): void; \/\/ TODO: avoid DOM dependency until WASM moved to own lib.

        /**
         * Attempt to initialize \`instance\` as a WASI reactor by invoking its \`_initialize()\` export, if it is present.
         * If \`instance\` contains a \`_start()\` export, then an exception is thrown.
         *
         * \`start()\` requires that \`instance\` exports a [\`WebAssembly.Memory\`][] named
         * \`memory\`. If \`instance\` does not have a \`memory\` export an exception is thrown.
         *
         * If \`initialize()\` is called more than once, an exception is thrown.
         */
        initialize(instance: object): void; \/\/ TODO: avoid DOM dependency until WASM moved to own lib.

        /**
         * Is an object that implements the WASI system call API. This object
         * should be passed as the \`wasi_snapshot_preview1\` import during the instantiation of a
         * [\`WebAssembly.Instance\`][].
         */
        readonly wasiImport: NodeJS.Dict<any>; \/\/ TODO: Narrow to DOM types
    }
}
`;
definitions['worker_threads.d.ts'] = `declare module 'worker_threads' {
    import { Context } from 'vm';
    import EventEmitter = require('events');
    import { Readable, Writable } from 'stream';
    import { URL } from 'url';
    import { FileHandle } from 'fs/promises';

    const isMainThread: boolean;
    const parentPort: null | MessagePort;
    const resourceLimits: ResourceLimits;
    const SHARE_ENV: unique symbol;
    const threadId: number;
    const workerData: any;

    class MessageChannel {
        readonly port1: MessagePort;
        readonly port2: MessagePort;
    }

    type TransferListItem = ArrayBuffer | MessagePort | FileHandle;

    class MessagePort extends EventEmitter {
        close(): void;
        postMessage(value: any, transferList?: ReadonlyArray<TransferListItem>): void;
        ref(): void;
        unref(): void;
        start(): void;

        addListener(event: "close", listener: () => void): this;
        addListener(event: "message", listener: (value: any) => void): this;
        addListener(event: "messageerror", listener: (error: Error) => void): this;
        addListener(event: string | symbol, listener: (...args: any[]) => void): this;

        emit(event: "close"): boolean;
        emit(event: "message", value: any): boolean;
        emit(event: "messageerror", error: Error): boolean;
        emit(event: string | symbol, ...args: any[]): boolean;

        on(event: "close", listener: () => void): this;
        on(event: "message", listener: (value: any) => void): this;
        on(event: "messageerror", listener: (error: Error) => void): this;
        on(event: string | symbol, listener: (...args: any[]) => void): this;

        once(event: "close", listener: () => void): this;
        once(event: "message", listener: (value: any) => void): this;
        once(event: "messageerror", listener: (error: Error) => void): this;
        once(event: string | symbol, listener: (...args: any[]) => void): this;

        prependListener(event: "close", listener: () => void): this;
        prependListener(event: "message", listener: (value: any) => void): this;
        prependListener(event: "messageerror", listener: (error: Error) => void): this;
        prependListener(event: string | symbol, listener: (...args: any[]) => void): this;

        prependOnceListener(event: "close", listener: () => void): this;
        prependOnceListener(event: "message", listener: (value: any) => void): this;
        prependOnceListener(event: "messageerror", listener: (error: Error) => void): this;
        prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;

        removeListener(event: "close", listener: () => void): this;
        removeListener(event: "message", listener: (value: any) => void): this;
        removeListener(event: "messageerror", listener: (error: Error) => void): this;
        removeListener(event: string | symbol, listener: (...args: any[]) => void): this;

        off(event: "close", listener: () => void): this;
        off(event: "message", listener: (value: any) => void): this;
        off(event: "messageerror", listener: (error: Error) => void): this;
        off(event: string | symbol, listener: (...args: any[]) => void): this;
    }

    interface WorkerOptions {
        /**
         * List of arguments which would be stringified and appended to
         * \`process.argv\` in the worker. This is mostly similar to the \`workerData\`
         * but the values will be available on the global \`process.argv\` as if they
         * were passed as CLI options to the script.
         */
        argv?: any[] | undefined;
        env?: NodeJS.Dict<string> | typeof SHARE_ENV | undefined;
        eval?: boolean | undefined;
        workerData?: any;
        stdin?: boolean | undefined;
        stdout?: boolean | undefined;
        stderr?: boolean | undefined;
        execArgv?: string[] | undefined;
        resourceLimits?: ResourceLimits | undefined;
        /**
         * Additional data to send in the first worker message.
         */
        transferList?: TransferListItem[] | undefined;
        trackUnmanagedFds?: boolean | undefined;
    }

    interface ResourceLimits {
        /**
         * The maximum size of a heap space for recently created objects.
         */
        maxYoungGenerationSizeMb?: number | undefined;
        /**
         * The maximum size of the main heap in MB.
         */
        maxOldGenerationSizeMb?: number | undefined;
        /**
         * The size of a pre-allocated memory range used for generated code.
         */
        codeRangeSizeMb?: number | undefined;
        /**
         * The default maximum stack size for the thread. Small values may lead to unusable Worker instances.
         * @default 4
         */
        stackSizeMb?: number | undefined;
    }

    class Worker extends EventEmitter {
        readonly stdin: Writable | null;
        readonly stdout: Readable;
        readonly stderr: Readable;
        readonly threadId: number;
        readonly resourceLimits?: ResourceLimits | undefined;

        /**
         * @param filename  The path to the Worker’s main script or module.
         *                  Must be either an absolute path or a relative path (i.e. relative to the current working directory) starting with ./ or ../,
         *                  or a WHATWG URL object using file: protocol. If options.eval is true, this is a string containing JavaScript code rather than a path.
         */
        constructor(filename: string | URL, options?: WorkerOptions);

        postMessage(value: any, transferList?: ReadonlyArray<TransferListItem>): void;
        ref(): void;
        unref(): void;
        /**
         * Stop all JavaScript execution in the worker thread as soon as possible.
         * Returns a Promise for the exit code that is fulfilled when the \`exit\` event is emitted.
         */
        terminate(): Promise<number>;

        /**
         * Returns a readable stream for a V8 snapshot of the current state of the Worker.
         * See [\`v8.getHeapSnapshot()\`][] for more details.
         *
         * If the Worker thread is no longer running, which may occur before the
         * [\`'exit'\` event][] is emitted, the returned \`Promise\` will be rejected
         * immediately with an [\`ERR_WORKER_NOT_RUNNING\`][] error
         */
        getHeapSnapshot(): Promise<Readable>;

        addListener(event: "error", listener: (err: Error) => void): this;
        addListener(event: "exit", listener: (exitCode: number) => void): this;
        addListener(event: "message", listener: (value: any) => void): this;
        addListener(event: "messageerror", listener: (error: Error) => void): this;
        addListener(event: "online", listener: () => void): this;
        addListener(event: string | symbol, listener: (...args: any[]) => void): this;

        emit(event: "error", err: Error): boolean;
        emit(event: "exit", exitCode: number): boolean;
        emit(event: "message", value: any): boolean;
        emit(event: "messageerror", error: Error): boolean;
        emit(event: "online"): boolean;
        emit(event: string | symbol, ...args: any[]): boolean;

        on(event: "error", listener: (err: Error) => void): this;
        on(event: "exit", listener: (exitCode: number) => void): this;
        on(event: "message", listener: (value: any) => void): this;
        on(event: "messageerror", listener: (error: Error) => void): this;
        on(event: "online", listener: () => void): this;
        on(event: string | symbol, listener: (...args: any[]) => void): this;

        once(event: "error", listener: (err: Error) => void): this;
        once(event: "exit", listener: (exitCode: number) => void): this;
        once(event: "message", listener: (value: any) => void): this;
        once(event: "messageerror", listener: (error: Error) => void): this;
        once(event: "online", listener: () => void): this;
        once(event: string | symbol, listener: (...args: any[]) => void): this;

        prependListener(event: "error", listener: (err: Error) => void): this;
        prependListener(event: "exit", listener: (exitCode: number) => void): this;
        prependListener(event: "message", listener: (value: any) => void): this;
        prependListener(event: "messageerror", listener: (error: Error) => void): this;
        prependListener(event: "online", listener: () => void): this;
        prependListener(event: string | symbol, listener: (...args: any[]) => void): this;

        prependOnceListener(event: "error", listener: (err: Error) => void): this;
        prependOnceListener(event: "exit", listener: (exitCode: number) => void): this;
        prependOnceListener(event: "message", listener: (value: any) => void): this;
        prependOnceListener(event: "messageerror", listener: (error: Error) => void): this;
        prependOnceListener(event: "online", listener: () => void): this;
        prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;

        removeListener(event: "error", listener: (err: Error) => void): this;
        removeListener(event: "exit", listener: (exitCode: number) => void): this;
        removeListener(event: "message", listener: (value: any) => void): this;
        removeListener(event: "messageerror", listener: (error: Error) => void): this;
        removeListener(event: "online", listener: () => void): this;
        removeListener(event: string | symbol, listener: (...args: any[]) => void): this;

        off(event: "error", listener: (err: Error) => void): this;
        off(event: "exit", listener: (exitCode: number) => void): this;
        off(event: "message", listener: (value: any) => void): this;
        off(event: "messageerror", listener: (error: Error) => void): this;
        off(event: "online", listener: () => void): this;
        off(event: string | symbol, listener: (...args: any[]) => void): this;
    }

    /**
     * Mark an object as not transferable.
     * If \`object\` occurs in the transfer list of a \`port.postMessage()\` call, it will be ignored.
     *
     * In particular, this makes sense for objects that can be cloned, rather than transferred,
     * and which are used by other objects on the sending side. For example, Node.js marks
     * the \`ArrayBuffer\`s it uses for its Buffer pool with this.
     *
     * This operation cannot be undone.
     */
    function markAsUntransferable(object: object): void;

    /**
     * Transfer a \`MessagePort\` to a different \`vm\` Context. The original \`port\`
     * object will be rendered unusable, and the returned \`MessagePort\` instance will
     * take its place.
     *
     * The returned \`MessagePort\` will be an object in the target context, and will
     * inherit from its global \`Object\` class. Objects passed to the
     * \`port.onmessage()\` listener will also be created in the target context
     * and inherit from its global \`Object\` class.
     *
     * However, the created \`MessagePort\` will no longer inherit from
     * \`EventEmitter\`, and only \`port.onmessage()\` can be used to receive
     * events using it.
     */
    function moveMessagePortToContext(port: MessagePort, context: Context): MessagePort;

    /**
     * Receive a single message from a given \`MessagePort\`. If no message is available,
     * \`undefined\` is returned, otherwise an object with a single \`message\` property
     * that contains the message payload, corresponding to the oldest message in the
     * \`MessagePort\`’s queue.
     */
    function receiveMessageOnPort(port: MessagePort): { message: any } | undefined;
}
`;
definitions['zlib.d.ts'] = `declare module 'zlib' {
    import * as stream from 'stream';

    interface ZlibOptions {
        /**
         * @default constants.Z_NO_FLUSH
         */
        flush?: number | undefined;
        /**
         * @default constants.Z_FINISH
         */
        finishFlush?: number | undefined;
        /**
         * @default 16*1024
         */
        chunkSize?: number | undefined;
        windowBits?: number | undefined;
        level?: number | undefined; \/\/ compression only
        memLevel?: number | undefined; \/\/ compression only
        strategy?: number | undefined; \/\/ compression only
        dictionary?: NodeJS.ArrayBufferView | ArrayBuffer | undefined; \/\/ deflate/inflate only, empty dictionary by default
        info?: boolean | undefined;
        maxOutputLength?: number | undefined;
    }

    interface BrotliOptions {
        /**
         * @default constants.BROTLI_OPERATION_PROCESS
         */
        flush?: number | undefined;
        /**
         * @default constants.BROTLI_OPERATION_FINISH
         */
        finishFlush?: number | undefined;
        /**
         * @default 16*1024
         */
        chunkSize?: number | undefined;
        params?: {
            /**
             * Each key is a \`constants.BROTLI_*\` constant.
             */
            [key: number]: boolean | number;
        } | undefined;
        maxOutputLength?: number | undefined;
    }

    interface Zlib {
        /** @deprecated Use bytesWritten instead. */
        readonly bytesRead: number;
        readonly bytesWritten: number;
        shell?: boolean | string | undefined;
        close(callback?: () => void): void;
        flush(kind?: number, callback?: () => void): void;
        flush(callback?: () => void): void;
    }

    interface ZlibParams {
        params(level: number, strategy: number, callback: () => void): void;
    }

    interface ZlibReset {
        reset(): void;
    }

    interface BrotliCompress extends stream.Transform, Zlib { }
    interface BrotliDecompress extends stream.Transform, Zlib { }
    interface Gzip extends stream.Transform, Zlib { }
    interface Gunzip extends stream.Transform, Zlib { }
    interface Deflate extends stream.Transform, Zlib, ZlibReset, ZlibParams { }
    interface Inflate extends stream.Transform, Zlib, ZlibReset { }
    interface DeflateRaw extends stream.Transform, Zlib, ZlibReset, ZlibParams { }
    interface InflateRaw extends stream.Transform, Zlib, ZlibReset { }
    interface Unzip extends stream.Transform, Zlib { }

    function createBrotliCompress(options?: BrotliOptions): BrotliCompress;
    function createBrotliDecompress(options?: BrotliOptions): BrotliDecompress;
    function createGzip(options?: ZlibOptions): Gzip;
    function createGunzip(options?: ZlibOptions): Gunzip;
    function createDeflate(options?: ZlibOptions): Deflate;
    function createInflate(options?: ZlibOptions): Inflate;
    function createDeflateRaw(options?: ZlibOptions): DeflateRaw;
    function createInflateRaw(options?: ZlibOptions): InflateRaw;
    function createUnzip(options?: ZlibOptions): Unzip;

    type InputType = string | ArrayBuffer | NodeJS.ArrayBufferView;

    type CompressCallback = (error: Error | null, result: Buffer) => void;

    function brotliCompress(buf: InputType, options: BrotliOptions, callback: CompressCallback): void;
    function brotliCompress(buf: InputType, callback: CompressCallback): void;
    namespace brotliCompress {
        function __promisify__(buffer: InputType, options?: BrotliOptions): Promise<Buffer>;
    }

    function brotliCompressSync(buf: InputType, options?: BrotliOptions): Buffer;

    function brotliDecompress(buf: InputType, options: BrotliOptions, callback: CompressCallback): void;
    function brotliDecompress(buf: InputType, callback: CompressCallback): void;
    namespace brotliDecompress {
        function __promisify__(buffer: InputType, options?: BrotliOptions): Promise<Buffer>;
    }

    function brotliDecompressSync(buf: InputType, options?: BrotliOptions): Buffer;

    function deflate(buf: InputType, callback: CompressCallback): void;
    function deflate(buf: InputType, options: ZlibOptions, callback: CompressCallback): void;
    namespace deflate {
        function __promisify__(buffer: InputType, options?: ZlibOptions): Promise<Buffer>;
    }

    function deflateSync(buf: InputType, options?: ZlibOptions): Buffer;

    function deflateRaw(buf: InputType, callback: CompressCallback): void;
    function deflateRaw(buf: InputType, options: ZlibOptions, callback: CompressCallback): void;
    namespace deflateRaw {
        function __promisify__(buffer: InputType, options?: ZlibOptions): Promise<Buffer>;
    }

    function deflateRawSync(buf: InputType, options?: ZlibOptions): Buffer;

    function gzip(buf: InputType, callback: CompressCallback): void;
    function gzip(buf: InputType, options: ZlibOptions, callback: CompressCallback): void;
    namespace gzip {
        function __promisify__(buffer: InputType, options?: ZlibOptions): Promise<Buffer>;
    }

    function gzipSync(buf: InputType, options?: ZlibOptions): Buffer;

    function gunzip(buf: InputType, callback: CompressCallback): void;
    function gunzip(buf: InputType, options: ZlibOptions, callback: CompressCallback): void;
    namespace gunzip {
        function __promisify__(buffer: InputType, options?: ZlibOptions): Promise<Buffer>;
    }

    function gunzipSync(buf: InputType, options?: ZlibOptions): Buffer;

    function inflate(buf: InputType, callback: CompressCallback): void;
    function inflate(buf: InputType, options: ZlibOptions, callback: CompressCallback): void;
    namespace inflate {
        function __promisify__(buffer: InputType, options?: ZlibOptions): Promise<Buffer>;
    }

    function inflateSync(buf: InputType, options?: ZlibOptions): Buffer;

    function inflateRaw(buf: InputType, callback: CompressCallback): void;
    function inflateRaw(buf: InputType, options: ZlibOptions, callback: CompressCallback): void;
    namespace inflateRaw {
        function __promisify__(buffer: InputType, options?: ZlibOptions): Promise<Buffer>;
    }

    function inflateRawSync(buf: InputType, options?: ZlibOptions): Buffer;

    function unzip(buf: InputType, callback: CompressCallback): void;
    function unzip(buf: InputType, options: ZlibOptions, callback: CompressCallback): void;
    namespace unzip {
        function __promisify__(buffer: InputType, options?: ZlibOptions): Promise<Buffer>;
    }

    function unzipSync(buf: InputType, options?: ZlibOptions): Buffer;

    namespace constants {
        const BROTLI_DECODE: number;
        const BROTLI_DECODER_ERROR_ALLOC_BLOCK_TYPE_TREES: number;
        const BROTLI_DECODER_ERROR_ALLOC_CONTEXT_MAP: number;
        const BROTLI_DECODER_ERROR_ALLOC_CONTEXT_MODES: number;
        const BROTLI_DECODER_ERROR_ALLOC_RING_BUFFER_1: number;
        const BROTLI_DECODER_ERROR_ALLOC_RING_BUFFER_2: number;
        const BROTLI_DECODER_ERROR_ALLOC_TREE_GROUPS: number;
        const BROTLI_DECODER_ERROR_DICTIONARY_NOT_SET: number;
        const BROTLI_DECODER_ERROR_FORMAT_BLOCK_LENGTH_1: number;
        const BROTLI_DECODER_ERROR_FORMAT_BLOCK_LENGTH_2: number;
        const BROTLI_DECODER_ERROR_FORMAT_CL_SPACE: number;
        const BROTLI_DECODER_ERROR_FORMAT_CONTEXT_MAP_REPEAT: number;
        const BROTLI_DECODER_ERROR_FORMAT_DICTIONARY: number;
        const BROTLI_DECODER_ERROR_FORMAT_DISTANCE: number;
        const BROTLI_DECODER_ERROR_FORMAT_EXUBERANT_META_NIBBLE: number;
        const BROTLI_DECODER_ERROR_FORMAT_EXUBERANT_NIBBLE: number;
        const BROTLI_DECODER_ERROR_FORMAT_HUFFMAN_SPACE: number;
        const BROTLI_DECODER_ERROR_FORMAT_PADDING_1: number;
        const BROTLI_DECODER_ERROR_FORMAT_PADDING_2: number;
        const BROTLI_DECODER_ERROR_FORMAT_RESERVED: number;
        const BROTLI_DECODER_ERROR_FORMAT_SIMPLE_HUFFMAN_ALPHABET: number;
        const BROTLI_DECODER_ERROR_FORMAT_SIMPLE_HUFFMAN_SAME: number;
        const BROTLI_DECODER_ERROR_FORMAT_TRANSFORM: number;
        const BROTLI_DECODER_ERROR_FORMAT_WINDOW_BITS: number;
        const BROTLI_DECODER_ERROR_INVALID_ARGUMENTS: number;
        const BROTLI_DECODER_ERROR_UNREACHABLE: number;
        const BROTLI_DECODER_NEEDS_MORE_INPUT: number;
        const BROTLI_DECODER_NEEDS_MORE_OUTPUT: number;
        const BROTLI_DECODER_NO_ERROR: number;
        const BROTLI_DECODER_PARAM_DISABLE_RING_BUFFER_REALLOCATION: number;
        const BROTLI_DECODER_PARAM_LARGE_WINDOW: number;
        const BROTLI_DECODER_RESULT_ERROR: number;
        const BROTLI_DECODER_RESULT_NEEDS_MORE_INPUT: number;
        const BROTLI_DECODER_RESULT_NEEDS_MORE_OUTPUT: number;
        const BROTLI_DECODER_RESULT_SUCCESS: number;
        const BROTLI_DECODER_SUCCESS: number;

        const BROTLI_DEFAULT_MODE: number;
        const BROTLI_DEFAULT_QUALITY: number;
        const BROTLI_DEFAULT_WINDOW: number;
        const BROTLI_ENCODE: number;
        const BROTLI_LARGE_MAX_WINDOW_BITS: number;
        const BROTLI_MAX_INPUT_BLOCK_BITS: number;
        const BROTLI_MAX_QUALITY: number;
        const BROTLI_MAX_WINDOW_BITS: number;
        const BROTLI_MIN_INPUT_BLOCK_BITS: number;
        const BROTLI_MIN_QUALITY: number;
        const BROTLI_MIN_WINDOW_BITS: number;

        const BROTLI_MODE_FONT: number;
        const BROTLI_MODE_GENERIC: number;
        const BROTLI_MODE_TEXT: number;

        const BROTLI_OPERATION_EMIT_METADATA: number;
        const BROTLI_OPERATION_FINISH: number;
        const BROTLI_OPERATION_FLUSH: number;
        const BROTLI_OPERATION_PROCESS: number;

        const BROTLI_PARAM_DISABLE_LITERAL_CONTEXT_MODELING: number;
        const BROTLI_PARAM_LARGE_WINDOW: number;
        const BROTLI_PARAM_LGBLOCK: number;
        const BROTLI_PARAM_LGWIN: number;
        const BROTLI_PARAM_MODE: number;
        const BROTLI_PARAM_NDIRECT: number;
        const BROTLI_PARAM_NPOSTFIX: number;
        const BROTLI_PARAM_QUALITY: number;
        const BROTLI_PARAM_SIZE_HINT: number;

        const DEFLATE: number;
        const DEFLATERAW: number;
        const GUNZIP: number;
        const GZIP: number;
        const INFLATE: number;
        const INFLATERAW: number;
        const UNZIP: number;

        \/\/ Allowed flush values.
        const Z_NO_FLUSH: number;
        const Z_PARTIAL_FLUSH: number;
        const Z_SYNC_FLUSH: number;
        const Z_FULL_FLUSH: number;
        const Z_FINISH: number;
        const Z_BLOCK: number;
        const Z_TREES: number;

        \/\/ Return codes for the compression/decompression functions.
        \/\/ Negative values are errors, positive values are used for special but normal events.
        const Z_OK: number;
        const Z_STREAM_END: number;
        const Z_NEED_DICT: number;
        const Z_ERRNO: number;
        const Z_STREAM_ERROR: number;
        const Z_DATA_ERROR: number;
        const Z_MEM_ERROR: number;
        const Z_BUF_ERROR: number;
        const Z_VERSION_ERROR: number;

        \/\/ Compression levels.
        const Z_NO_COMPRESSION: number;
        const Z_BEST_SPEED: number;
        const Z_BEST_COMPRESSION: number;
        const Z_DEFAULT_COMPRESSION: number;

        \/\/ Compression strategy.
        const Z_FILTERED: number;
        const Z_HUFFMAN_ONLY: number;
        const Z_RLE: number;
        const Z_FIXED: number;
        const Z_DEFAULT_STRATEGY: number;

        const Z_DEFAULT_WINDOWBITS: number;
        const Z_MIN_WINDOWBITS: number;
        const Z_MAX_WINDOWBITS: number;

        const Z_MIN_CHUNK: number;
        const Z_MAX_CHUNK: number;
        const Z_DEFAULT_CHUNK: number;

        const Z_MIN_MEMLEVEL: number;
        const Z_MAX_MEMLEVEL: number;
        const Z_DEFAULT_MEMLEVEL: number;

        const Z_MIN_LEVEL: number;
        const Z_MAX_LEVEL: number;
        const Z_DEFAULT_LEVEL: number;

        const ZLIB_VERNUM: number;
    }

    \/\/ Allowed flush values.
    /** @deprecated Use \`constants.Z_NO_FLUSH\` */
    const Z_NO_FLUSH: number;
    /** @deprecated Use \`constants.Z_PARTIAL_FLUSH\` */
    const Z_PARTIAL_FLUSH: number;
    /** @deprecated Use \`constants.Z_SYNC_FLUSH\` */
    const Z_SYNC_FLUSH: number;
    /** @deprecated Use \`constants.Z_FULL_FLUSH\` */
    const Z_FULL_FLUSH: number;
    /** @deprecated Use \`constants.Z_FINISH\` */
    const Z_FINISH: number;
    /** @deprecated Use \`constants.Z_BLOCK\` */
    const Z_BLOCK: number;
    /** @deprecated Use \`constants.Z_TREES\` */
    const Z_TREES: number;

    \/\/ Return codes for the compression/decompression functions.
    \/\/ Negative values are errors, positive values are used for special but normal events.
    /** @deprecated Use \`constants.Z_OK\` */
    const Z_OK: number;
    /** @deprecated Use \`constants.Z_STREAM_END\` */
    const Z_STREAM_END: number;
    /** @deprecated Use \`constants.Z_NEED_DICT\` */
    const Z_NEED_DICT: number;
    /** @deprecated Use \`constants.Z_ERRNO\` */
    const Z_ERRNO: number;
    /** @deprecated Use \`constants.Z_STREAM_ERROR\` */
    const Z_STREAM_ERROR: number;
    /** @deprecated Use \`constants.Z_DATA_ERROR\` */
    const Z_DATA_ERROR: number;
    /** @deprecated Use \`constants.Z_MEM_ERROR\` */
    const Z_MEM_ERROR: number;
    /** @deprecated Use \`constants.Z_BUF_ERROR\` */
    const Z_BUF_ERROR: number;
    /** @deprecated Use \`constants.Z_VERSION_ERROR\` */
    const Z_VERSION_ERROR: number;

    \/\/ Compression levels.
    /** @deprecated Use \`constants.Z_NO_COMPRESSION\` */
    const Z_NO_COMPRESSION: number;
    /** @deprecated Use \`constants.Z_BEST_SPEED\` */
    const Z_BEST_SPEED: number;
    /** @deprecated Use \`constants.Z_BEST_COMPRESSION\` */
    const Z_BEST_COMPRESSION: number;
    /** @deprecated Use \`constants.Z_DEFAULT_COMPRESSION\` */
    const Z_DEFAULT_COMPRESSION: number;

    \/\/ Compression strategy.
    /** @deprecated Use \`constants.Z_FILTERED\` */
    const Z_FILTERED: number;
    /** @deprecated Use \`constants.Z_HUFFMAN_ONLY\` */
    const Z_HUFFMAN_ONLY: number;
    /** @deprecated Use \`constants.Z_RLE\` */
    const Z_RLE: number;
    /** @deprecated Use \`constants.Z_FIXED\` */
    const Z_FIXED: number;
    /** @deprecated Use \`constants.Z_DEFAULT_STRATEGY\` */
    const Z_DEFAULT_STRATEGY: number;

    /** @deprecated */
    const Z_BINARY: number;
    /** @deprecated */
    const Z_TEXT: number;
    /** @deprecated */
    const Z_ASCII: number;
    /** @deprecated  */
    const Z_UNKNOWN: number;
    /** @deprecated */
    const Z_DEFLATED: number;
}
`;export default definitions;