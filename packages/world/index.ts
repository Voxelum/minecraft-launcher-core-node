/**
 * @module @xmcl/world
 */
import { deserialize } from "@xmcl/nbt";
import { FileSystem, openFileSystem } from "@xmcl/system";
import Long from "long";

/**
 * Compute the bit length from new region section
 */
function computeBitLen(palette: NewRegionSectionDataFrame["Palette"], blockStates: Long[]) {
    let computedBitLen = log2DeBruijn(palette.length);
    let avgBitLen = blockStates.length * 64 / 4096;
    return computedBitLen >= 9 ? computedBitLen : avgBitLen;
}

/**
 * Create bit vector from a long array
 */
function createBitVector(arr: Long[], bitLen: number): number[] {
    let maxEntryValue = Long.fromNumber(1).shiftLeft(bitLen).sub(1);
    let result = new Array<number>(4096);
    for (let i = 0; i < 4096; ++i) {
        result[i] = seek(arr, bitLen, i, maxEntryValue);
    }
    return result;
}

/**
 * Seek block id from a long array (new chunk format)
 * @param data The block state id long array
 * @param bitLen The bit length
 * @param index The index (composition of xyz) in chunk
 * @param maxEntryValue The max entry value
 */
function seek(data: Long[], bitLen: number, index: number, maxEntryValue = Long.fromNumber(1).shiftLeft(bitLen).sub(1)) {
    let offset = index * bitLen;
    let j = offset >> 6;
    let k = ((index + 1) * bitLen - 1) >>> 6;
    let l = offset ^ j << 6;

    if (j == k) {
        return data[j].shiftRightUnsigned(l).and(maxEntryValue).toInt();
    } else {
        let shiftLeft = 64 - l;
        const v = data[j].shiftRightUnsigned(l).or(data[k].shiftLeft(shiftLeft));
        return v.and(maxEntryValue).toInt();
    }
}

/**
 * Legacy algorithm to seek block state from chunk
 */
function seekLegacy(blocks: number[], data: number[], add: number[] | null, i: number) {
    function getFromNibbleArray(arr: number[], index: number) {
        const nibbled = index >>> 1;
        if ((index & 1) === 0) {
            return arr[nibbled] & 15;
        } else {
            return arr[nibbled] >>> 4 & 15;
        }
    }
    let additional = !add ? 0 : getFromNibbleArray(add, i);
    return (additional << 12) | ((blocks[i] & 255) << 4) | getFromNibbleArray(data, i);
}

const MULTIPLY_DE_BRUIJN_BIT_POSITION = [0, 1, 28, 2, 29, 14, 24, 3, 30, 22, 20, 15, 25, 17, 4, 8, 31, 27, 13, 23, 21, 19, 16, 7, 26, 12, 18, 6, 11, 5, 10, 9];

function log2DeBruijn(value: number) {
    function isPowerOfTwo(v: number) {
        return v !== 0 && (v & v - 1) === 0;
    }
    function smallestEncompassingPowerOfTwo(value: number) {
        let i = value - 1;
        i = i | i >> 1;
        i = i | i >> 2;
        i = i | i >> 4;
        i = i | i >> 8;
        i = i | i >> 16;
        return i + 1;
    }
    value = isPowerOfTwo(value) ? value : smallestEncompassingPowerOfTwo(value);
    return MULTIPLY_DE_BRUIJN_BIT_POSITION[Long.fromInt(value).multiply(125613361).shiftRight(27).and(31).low];
}

function getChunkOffset(buffer: Uint8Array, x: number, z: number) {
    // get internal chunk offset should be in the rest of 5 bits (from >> 5)
    x &= 31;
    z &= 31;
    // the offset index stored at the begining
    // each offset takes 4 bytes
    let offsetBytesLocation = (x + z * 32) * 4;
    let offsetBytes = buffer.slice(offsetBytesLocation, offsetBytesLocation + 4);
    // chunk offset
    let offset = offsetBytes[0] << 16 | offsetBytes[1] << 8 | offsetBytes[2];
    // chunk sections should be last 8 bits (1 byte)
    let sectors = offsetBytes[3];
    if (offset === 0) {
        return 0;
    } else {
        return offset * 4096;
    }
}

export class WorldReader {
    static async create(path: string | Uint8Array) {
        return new WorldReader(await openFileSystem(path));
    }
    constructor(private fs: FileSystem) { }
    /**
     * Get region data frame
     * @param chunkX The x value of chunk coord
     * @param chunkZ The z value of chunk coord
     */
    public async getRegionData(chunkX: number, chunkZ: number): Promise<RegionDataFrame> {
        let data: RegionDataFrame = await this.getMCAData("region", chunkX, chunkZ);
        return data;

    }

    /**
     * Get entity data frame
     * @param chunkX The x value of chunk coord
     * @param chunkZ The z value of chunk coord
     */
    public async getEntityData(chunkX: number, chunkZ: number): Promise<RegionDataFrame> {
        /* To do: Add EntityRegionDataFrame to mirror getRegionData */
        let data = await this.getMCAData("entities", chunkX, chunkZ);
        return data;
    }

    /**
     * Get mca data frame
     * @param prefix The folder to load the .mca file from
     * @param chunkX The x value of chunk coord
     * @param chunkZ The z value of chunk coord
     */
    public async getMCAData(prefix: string, chunkX: number, chunkZ: number): Promise<RegionDataFrame> {
        // The region file coord with chunk is chunk coord shift by 5
        let path = this.fs.join(prefix, `r.${chunkX >> 5}.${chunkZ >> 5}.mca`);

        let buffer = await this.fs.readFile(path);
        let off = getChunkOffset(buffer, chunkX, chunkZ);

        let lengthBuf = buffer.slice(off, off + 4);
        let length = lengthBuf[0] << 24 | lengthBuf[1] << 16 | lengthBuf[2] << 8 | lengthBuf[3];
        let format = buffer[off + 4];
        if (format !== 1 && format !== 2) {
            throw new Error(`Illegal Chunk format ${format} on (${prefix} | ${chunkX}, ${chunkZ})!`)
        }
        let compressed = format === 1 ? "gzip" as const : "deflate" as const;
        let chunkData = buffer.slice(off + 5, off + 5 + length);
        return deserialize(chunkData, { compressed });;
    }

    /**
     * Read the level data
     */
    public async getLevelData(): Promise<LevelDataFrame> {
        return this.fs.readFile("level.dat")
            .then((b) => deserialize(b, { compressed: "gzip" }))
            .then((d: any) => d.Data);
    }

    public async getPlayerData(): Promise<PlayerDataFrame[]> {
        const files = await this.fs.listFiles("playerdata");
        return Promise.all(files
            .map((f) => this.fs.readFile(this.fs.join("playerdata", f)).then((b) => deserialize<PlayerDataFrame>(b))));
    }

    public async getAdvancementsData(): Promise<AdvancementDataFrame[]> {
        const files = await this.fs.listFiles("advancements");
        return Promise.all(files
            .map((f) => this.fs.readFile(this.fs.join("advancements", f)).then((b) => deserialize<AdvancementDataFrame>(b))));
    }
}

/**
 * The chunk index is a number in range [0, 4096), which is mapped position from (0,0,0) to (16,16,16) inside the chunk.
 */
export type ChunkIndex = number;

/**
 * Get chunk index from position.
 * All x, y, z should be in range [0, 16)
 *
 * @param x The position x. Should be in range [0, 16)
 * @param y The position y. Should be in range [0, 16)
 * @param z The position z. Should be in range [0, 16)
 */
export function getIndexInChunk(x: number, y: number, z: number): ChunkIndex {
    return (y & 15) << 8 | (z & 15) << 4 | (x & 15);
}

/**
 * Get in-chunk coordination from chunk index
 * @param index The index number in chunk
 */
export function getCoordFromIndex(index: ChunkIndex) {
    let x = index & 15;
    let y = (index >>> 8) & 15;
    let z = (index >>> 4) & 15;
    return {
        x, y, z
    }
}

export namespace RegionReader {
    /**
     * Get a chunk section in a region by chunk Y value.
     * @param region The region
     * @param chunkY The y value of the chunk. It should be from [0, 16)
     */
    export function getSection(region: RegionDataFrame, chunkY: number) {
        // the new region has a section.Y === -1
        return region.Level.Sections[0].Y === 0 ? region.Level.Sections[chunkY] : region.Level.Sections[chunkY + 1];
    }

    /**
     * Walk through all the position in this chunk and emit all the id in every position.
     * @param section The chunk section
     * @param reader The callback which will receive the position + state id.
     */
    export function walkBlockStateId(section: RegionSectionDataFrame, reader: (x: number, y: number, z: number, id: number) => void): void {
        let seekFunc: (index: number) => number;
        if ("Blocks" in section) {
            let add = section.Add;
            let data = section.Data;
            let blocks = section.Blocks;
            seekFunc = (i) => seekLegacy(blocks, data, add, i);
        } else {
            let blockStates = section.BlockStates;
            let vector = createBitVector(blockStates, computeBitLen(section.Palette, blockStates));
            seekFunc = (i) => vector[i];
        }
        for (let i = 0; i < 4096; ++i) {
            let x = i & 15;
            let y = (i >>> 8) & 15;
            let z = (i >>> 4) & 15;
            let id = seekFunc(i);
            reader(x, y, z, id);
        }
    }

    /**
     * Seek the section and get the block state id from the section.
     * @param section The section
     * @param index The chunk index
     */
    export function seekBlockStateId(section: NewRegionSectionDataFrame | LegacyRegionSectionDataFrame, index: ChunkIndex) {
        if ("BlockStates" in section) {
            const blockStates = section.BlockStates;
            const bitLen = computeBitLen(section.Palette, blockStates);
            return seek(blockStates, bitLen, index);
        }
        return seekLegacy(section.Blocks, section.Data, section.Add, index);
    }

    /**
     * Seek the block state data from new region format.
     * @param section The new region section
     * @param index The chunk index, which is a number in range [0, 4096)
     */
    export function seekBlockState(section: NewRegionSectionDataFrame, index: ChunkIndex): BlockStateData {
        const blockStates = section.BlockStates;
        const bitLen = computeBitLen(section.Palette, blockStates);
        return section.Palette[seek(section.BlockStates, bitLen, index)];
    }
}

/**
 * The Minecraft provided block state info. Only presented in the version >= 1.13 chunk data.
 */
export interface BlockStateData {
    Name: string;
    Properties: { [key: string]: string }
}

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
    Palette: Array<BlockStateData>;
    Data: number[];
    BlockLight: number[];
    SkyLight: number[];
    Y: number;
}
export type RegionSectionDataFrame = LegacyRegionSectionDataFrame | NewRegionSectionDataFrame;
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

