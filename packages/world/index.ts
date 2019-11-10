import { System, FileSystem } from "@xmcl/common";
import ByteBuffer from "bytebuffer";
import { NBT } from "@xmcl/nbt";

export class WorldReader {
    static async create(path: string) {
        return new WorldReader(await System.openFileSystem(path));
    }
    constructor(private fs: FileSystem) { }
    /**
     * Get region data frame
     * @param chunkX The x value of chunk coord
     * @param chunkZ The z value of chunk coord
     */
    public async getRegionData(chunkX: number, chunkZ: number): Promise<RegionDataFrame> {
        const path = System.fs.join("region", `r.${chunkX}.${chunkZ}.mca`);
        const buffer = await this.fs.readFile(path);
        const bb = ByteBuffer.wrap(buffer);
        const off = getChunkOffset(buffer, chunkX, chunkZ);

        bb.offset = off;
        const length = bb.readInt32();
        const format = bb.readUint8();
        if (format !== 2) { throw new Error(`Cannot resolve chunk with format ${format}.`); }

        const chunkData = buffer.slice(off + 5, off + 5 + length);
        const data: RegionDataFrame = await NBT.deserialize(chunkData, { compressed: "deflate" });
        return data;
    }

    /**
     * Read the level data
     */
    public async getLevelData(): Promise<LevelDataFrame> {
        return this.fs.readFile("level.dat")
            .then((b) => NBT.deserialize(b, { compressed: "gzip" }))
            .then((d: any) => d.Data);
    }

    public async getPlayerData(): Promise<PlayerDataFrame[]> {
        const files = await this.fs.listFiles("playerdata");
        return Promise.all(files
            .map((f) => this.fs.readFile(this.fs.join("playerdata", f)).then((b) => NBT.deserialize<PlayerDataFrame>(b))));
    }

    public async getAdvancementsData(): Promise<AdvancementDataFrame[]> {
        const files = await this.fs.listFiles("advancements");
        return Promise.all(files
            .map((f) => this.fs.readFile(this.fs.join("advancements", f)).then((b) => NBT.deserialize<AdvancementDataFrame>(b))));
    }
}

function getChunkOffset(buffer: Uint8Array, x: number, z: number) {
    x = Math.abs(((x % 32) + 32) % 32);
    z = Math.abs(((z % 32) + 32) % 32);
    const locationOffset = 4 * (x + z * 32);
    const bytes = buffer.slice(locationOffset, locationOffset + 4);
    const sectors = bytes[3];
    const offset = bytes[0] << 16 | bytes[1] << 8 | bytes[2];
    if (offset === 0) {
        return 0;
    } else {
        return offset * 4096;
    }
}

function getFromNibbleArray(arr: number[], index: number) {
    const nibbled = index >> 1;
    if ((nibbled & 1) === 0) {
        return arr[nibbled] & 15;
    } else {
        return (arr[nibbled] >> 4) & 15;
    }
}

function seekLegacy(blocks: number[], data: number[], add: number[] | null, i: number) {
    // i = i & 0xFFF;
    let additional = add == null ? 0 : getFromNibbleArray(add, i);
    return (additional << 12) | ((blocks[i] & 255) << 4) | getFromNibbleArray(data, i);
}

function mask(bit: number) {
    let m = 0;
    for (let i = 0; i < bit; ++i) { m = (m << 1) + 1; }
    return m;
}

function seek(streams: Long[], bitLen: number, bitMask: number, index: number) {
    const bitOff = index * bitLen;
    const tagAt = Math.floor(bitOff / 64);
    const tag = streams[tagAt];

    let bitStart = bitOff % 64;
    const onLowBit = bitStart >= 32;
    if (onLowBit) {
        bitStart = bitStart - 32;
    }
    const value = onLowBit ? tag.low : tag.high;

    const off = 32 - (bitStart + bitLen);
    const overflow = off < 0;

    let id: number;
    if (overflow) {
        const curBits = 32 - bitStart;
        const nextBits = bitLen - curBits;
        const partialMask = mask(curBits);
        const nextValue = onLowBit
            ? streams[tagAt + 1].high // use next long high
            : tag.low; // use this low
        id = ((value & partialMask) << nextBits) | (nextValue >>> (32 - nextBits));
    } else {
        id = (value >>> off) & bitMask;
    }

    return id;
}

export interface BlockState {
    name: string;
    properties: { [key: string]: string };
}

export namespace RegionReader {
    export function getSection(region: RegionDataFrame, chunkY: number) {
        return region.Level.Sections[chunkY];
    }

    export function readBlockState(section: RegionSectionDataFrame, reader: (x: number, y: number, z: number, id: number) => void): void {
        let seekFunc: (index: number) => number;
        if ("Blocks" in section) {
            const add = section.Add;
            const data = section.Data;
            const blocks = section.Blocks;
            seekFunc = (i) => seekLegacy(blocks, data, add, i);
        } else {
            const blockStates = section.BlockStates;
            const bitLen = blockStates.length * 64 / 4096;
            const bitMask = mask(bitLen);
            seekFunc = (i) => seek(blockStates, bitLen, bitMask, i);
        }
        for (let i = 0; i < 4096; ++i) {
            const x = i & 15;
            const y = (i >> 8) & 15;
            const z = (i >> 4) & 15;
            const id = seekFunc(i);
            reader(x, y, z, id);
        }
    }

    export function seekBlockId(section: RegionDataFrame["Level"]["Sections"][number], index: number) {
        if ("BlockStates" in section) {
            const blockStates = section.BlockStates;
            const bitLen = blockStates.length * 64 / 4096;
            const bitMask = mask(bitLen);
            return seek(blockStates, bitLen, bitMask, index);
        }
        if ("Blocks" in section) {
            return seekLegacy(section.Blocks, section.Data, section.Add, index);
        }
        return undefined;
    }

    export function seekBlockState(section: RegionDataFrame["Level"]["Sections"][number], index: number) {
        if ("BlockStates" in section) {
            const blockStates = section.BlockStates;
            const bitLen = blockStates.length * 64 / 4096;
            const bitMask = mask(bitLen);
            return section.Palette[seek(section.BlockStates, bitLen, bitMask, index)];
        }
        return undefined;
    }
}

import Long from "long";

export enum GameType {
    NON = -1,
    SURVIVAL = 0,
    CREATIVE = 1,
    ADVENTURE = 2,
    SPECTATOR = 3,
}
export interface PlayerDataFrame {
    UUIDLeast: Long;
    UUIDMost: Long;
    DataVersion: number;

    Pos: [
        number, number, number
    ];
    Rotation: [
        number, number, number
    ];
    Motion: [
        number, number, number
    ];
    Dimension: number;

    SpawnX: number;
    SpawnY: number;
    SpawnZ: number;

    playerGameType: number;

    Attributes: Array<{
        Base: number,
        Name: string,
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
        isFilteringCraftable: number,
        isGuiOpen: number,
    };
    abilities: {
        invulnerable: number,
        mayfly: number,
        instabuild: number,
        walkSpeed: number,
        mayBuild: number,
        flying: number,
        flySpeed: number,
    };
}

type StringBoolean = "true" | "false";
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
                Gateways: number[],
                DragonKilled: number,
                PreviouslyKilled: number,
                ExitPortalLocation?: [number, number, number],
            },
        },
    };
    GameRules: {
        doTileDrops: StringBoolean,
        doFireTick: StringBoolean,
        gameLoopFunction: string,
        maxCommandChainLength: string,
        reducedDebugInfo: string,
        naturalRegeneration: string,
        disableElytraMovementCheck: string,
        doMobLoot: StringBoolean,
        announceAdvancements: string,
        keepInventory: StringBoolean,
        doEntityDrops: StringBoolean,
        doLimitedCrafting: StringBoolean,
        mobGriefing: StringBoolean,
        randomTickSpeed: string,
        commandBlockOutput: string,
        spawnRadius: string,
        doMobSpawning: StringBoolean,
        maxEntityCramming: string,
        logAdminCommands: string,
        spectatorsGenerateChunks: string,
        doWeatherCycle: StringBoolean,
        sendCommandFeedback: string,
        doDaylightCycle: StringBoolean,
        showDeathMessages: StringBoolean,
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
        Snapshot: number,
        Id: number,
        Name: string,
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
        background?: string,
        description: object | string,
        show_toast: boolean,
        announce_to_chat: boolean,
        hidden: boolean,
    };
    parent?: string;
    criteria: { [name: string]: { trigger: string, conditions: {} } };
    requirements: string[];
    rewards: { recipes: string[], loot: string[], experience: number, function: string };
}

export interface ItemStackDataFrame {
    Slot: number;
    id: string;
    Count: number;
    Damage: number;
    tag?: {
        // general tags
        Unbreakable: number,
        CanDestroy: string[],

        // block tags
        CanPlaceOn: string[],
        BlockEntityTag: {
            // entity format
        },

        // enchantments
        ench: Array<{ id: number, lvl: number }>,
        StoredEnchantments: Array<{ id: number, lvl: number }>,
        RepairCost: number,

        // attribute modifiers
        AttributeModifiers: Array<{ AttributeName: string, Name: string, Slot: string, Operation: number, Amount: number, UUIDMost: Long, UUIDLeast: Long }>,

        // potion effects
        CustomPotionEffects: Array<{ Id: number, Amplifier: number, Duration: number, Ambient: number, ShowParticles: number }>,
        Potion: string,
        CustomPotionColor: number,

        // display properties
        display: Array<{ color: number, Name: string, LocName: string, Lore: string[] }>,
        HideFlags: number,

        // written books
        resolved: number,
        /**
         * The copy tier of the book. 0 = original, number = copy of original, number = copy of copy, number = tattered.
         * If the value is greater than number, the book cannot be copied. Does not exist for original books.
         * If this tag is missing, it is assumed the book is an original. 'Tattered' is unused in normal gameplay, and functions identically to the 'copy of copy' tier.
         */
        generation: number,
        author: string,
        title: string,
        /**
         * A single page in the book. If generated by writing in a book and quill in-game, each page is a string in double quotes and uses the escape sequences \" for a double quote,
         * for a line break and \\ for a backslash. If created by commands or external tools, a page can be a serialized JSON object or an array of strings and/or objects (see Commands#Raw JSON text) or an unescaped string.
         */
        pages: string[],

        // player heads
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
export type LegacyRegionSectionDataFrame = {
    Blocks: Array<number>;
    Data: Array<number>;
    Add: Array<number>;
    BlockLight: number[];
    SkyLight: number[];
    Y: number;
}
export type NewRegionSectionDataFrame = {
    BlockStates: Long[],
    Palette: Array<{ Name: string; Properties: { [key: string]: string } }>;
    Data: number[];
    BlockLight: number[];
    SkyLight: number[];
    Y: number;
}
export type RegionSectionDataFrame = {
    BlockStates: Long[],
    Palette: Array<{ Name: string; Properties: { [key: string]: string } }>;
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

