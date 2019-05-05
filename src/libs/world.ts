import fileType = require("file-type");
import * as fs from "fs";
import * as path from "path";
import { ZipFile } from "yauzl";
import { bufferEntry, Entry, open, walkEntries } from "yauzlw";
import { deflate, inflate, inflateSync, unzip, unzipSync } from "zlib";
import { GameRule, GameType, Pos2, Pos3 } from "./game";
import { NBT } from "./nbt";

export class WorldInfo {
    constructor(
        // readonly filename: string,
        readonly sizeOnDisk: Long,
        readonly lastPlayed: Long,
        readonly gameRule: GameRule,
        readonly dataVersion: number,
        readonly version: { snapshot?: number, id: number, name: string },
        readonly generatorName: string,

        public displayName: string,
        public difficulty: number,
        public gameType: GameType,
        public isHardCore: boolean,
        public enabledCheat: boolean,
        public spawnPoint: Pos3,

        public borderCenter: Pos2,
        public borderDamagePerBlock: number,
        public borderWarningBlocks: number,
        public BorderSizeLerpTarget: number,
    ) { }
}

interface PlayerDataFrame {
    "HurtByTimestamp": number;
    "SleepTimer": number;
    "SpawnForced": number;
    "Attributes": Array<{
        "Base": number,
        "Name": string,
    }>;
    "Invulnerable": number;
    "FallFlying": number;
    "PortalCooldown": number;
    "AbsorptionAmount": number;
    "abilities": {
        "invulnerable": number,
        "mayfly": number,
        "instabuild": number,
        "walkSpeed": number,
        "mayBuild": number,
        "flying": number,
        "flySpeed": number,
    };
    "FallDistance": number;
    "recipeBook": {
        "isFilteringCraftable": number,
        "isGuiOpen": number,
    };
    "DeathTime": number;
    "XpSeed": number;
    "XpTotal": number;
    "playerGameType": number;
    "seenCredits": number;
    "Motion": [
        number, number, number
    ];
    "SpawnY": number;
    "UUIDLeast": Long;
    "Health": number;
    "SpawnZ": number;
    "foodSaturationLevel": number;
    "SpawnX": number;
    "Air": number;
    "OnGround": number;
    "Dimension": number;
    "XpLevel": number;
    "Score": number;
    "UUIDMost": Long;
    "Sleeping": number;
    "Fire": number;
    "XpP": number;
    "DataVersion": number;
    "foodLevel": number;
    "foodExhaustionLevel": number;
    "HurtTime": number;
    "SelectedItemSlot": number;
    "foodTickTimer": number;
    "Rotation": [
        number, number, number
    ];
    "Pos": [
        number, number, number
    ];
}

type StringBoolean = "true" | "false";
export interface LevelDataFrame {
    "BorderCenterX": number;
    "BorderCenterZ": number;
    "BorderDamagePerBlock": number;
    "BorderSafeZone": number;
    "BorderSize": number;
    "BorderSizeLerpTarget": number;
    "BorderSizeLerpTime": Long;
    "BorderWarningBlocks": number;
    "BorderWarningTime": number;
    "DataVersion": number;
    "DayTime": Long;
    "Difficulty": number;
    "DifficultyLocked": number;
    "DimensionData": {
        "1": {
            "DragonFight": {
                "Gateways": [
                    number
                ],
                "DragonKilled": number,
                "PreviouslyKilled": number,
            },
        },
    };
    "GameRules": {
        "doTileDrops": StringBoolean,
        "doFireTick": StringBoolean,
        "gameLoopFunction": string,
        "maxCommandChainLength": string,
        "reducedDebugInfo": string,
        "naturalRegeneration": string,
        "disableElytraMovementCheck": string,
        "doMobLoot": StringBoolean,
        "announceAdvancements": string,
        "keepInventory": StringBoolean,
        "doEntityDrops": StringBoolean,
        "doLimitedCrafting": StringBoolean,
        "mobGriefing": StringBoolean,
        "randomTickSpeed": string,
        "commandBlockOutput": string,
        "spawnRadius": string,
        "doMobSpawning": StringBoolean,
        "maxEntityCramming": string,
        "logAdminCommands": string,
        "spectatorsGenerateChunks": string,
        "doWeatherCycle": StringBoolean,
        "sendCommandFeedback": string,
        "doDaylightCycle": StringBoolean,
        "showDeathMessages": StringBoolean,
    };
    "GameType": GameType;
    "LastPlayed": Long;
    "LevelName": string;
    "MapFeatures": number;
    "Player": PlayerDataFrame;
    "RandomSeed": Long;
    readonly "SizeOnDisk": Long;
    "SpawnX": number;
    "SpawnY": number;
    "SpawnZ": number;
    "Time": Long;
    "Version": {
        "Snapshot": number,
        "Id": number,
        "Name": string,
    };
    "allowCommands": number;
    "clearWeatherTime": number;
    "generatorName": "default" | "flat" | "largeBiomes" | "amplified" | "buffet" | "debug_all_block_states" | string;
    "generatorOptions": string;
    "generatorVersion": number;
    "hardcore": number;
    "initialized": number;
    "rainTime": number;
    "raining": number;
    "thunderTime": number;
    "thundering": number;
    "version": number;
}
export interface World {
    path: string;
    level: LevelDataFrame;
    players: PlayerDataFrame[];
    advancements: AdvancementDataFrame[];
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
}
export interface TileEntityDataFrame {
    x: number;
    y: number;
    z: number;
    Items: ItemStackDataFrame[];
    id: string;
    [key: string]: any;
}

export interface ChunkDataFrame {
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
        Sections: Array<{
            Blocks: number[],
            Data: number[],
            BlockLight: number[],
            SkyLight: number[],
            Y: number,
        }>;
    }; DataVersion: number;
}

export namespace WorldInfo {
    /**
     * Validate the map. (if the level.dat exist)
     *
     * This Promise will not reject but always get true or false to determine if the map is valid
     *
     * @param map the file path or the zip data of the map
     */
    export async function valid(map: string | ZipFile): Promise<boolean> {
        return findEntry(map).then(() => true).catch(() => false);
    }

    async function findEntryZip(zip: ZipFile) {
        let result: Entry | undefined;
        await walkEntries(zip, (entry) => {
            if (entry.fileName.endsWith("level.dat")) {
                result = entry;
                return true;
            }
        });
        return result;
    }

    function findEntryFolder(map: string) {
        if (fs.existsSync(path.join(map, "level.dat"))) {
            return path.resolve(map, "level.dat");
        }
        return undefined;
    }
    /**
     * Find the entry (level.dat) of the map.
     * The map could be file or zip.
     * The promise will reject when the map is invalid!
     *
     * @param map the file path or the zip data of the map
     */
    async function findEntry(map: string | ZipFile): Promise<string | Entry> {
        if (typeof map === "string") {
            const entry = findEntryFolder(map);
            if (entry) { return entry; } else { throw new Error("Illegal Map"); }
        }
        const zip = typeof map === "string" ? await open(map) : map;
        const zipEntry = await findEntryZip(zip);
        zip.close();
        if (zipEntry) {
            return zipEntry;
        } else {
            throw new Error("Illegal Map");
        }
    }
    /**
     * Read the map file to worldinfo
     *
     * @param map the file path or the zip data of the map
     */
    export async function read(map: string | ZipFile): Promise<WorldInfo> {
        if (typeof map === "string") {
            const entry = findEntryFolder(map);
            if (entry) {
                return fs.promises.readFile(entry).then(parse);
            } else {
                throw new Error("Illegal Map");
            }
        }
        const zip = typeof map === "string" ? await open(map) : map;
        const zipEntry = await findEntryZip(zip);
        zip.close();
        if (zipEntry) {
            return bufferEntry(zip, zipEntry).then(parse);
        } else {
            throw new Error("Illegal Map");
        }
    }

    /**
     * Parse the buf as world info
     *
     * @param buf
     */
    export function parse(buf: Buffer): WorldInfo {
        const nbt = NBT.Serializer.deserialize(buf, true);
        const root = nbt.Data;
        return new WorldInfo(root.LevelName, root.SizeOnDisk, root.LastPlayed, root.GameRules,
            root.DataVersion, root.Version, root.generatorName,
            root.Difficulty, root.GameType, root.hardcore === 1, root.allowCommands === 1,
            { x: root.SpawnX, y: root.SpawnY, z: root.SpawnZ },
            { x: root.BorderCenterX, z: root.BorderCenterZ },
            root.BorderDamagePerBlock, root.BorderWarningBlocks, root.BorderSizeLerpTarget);
    }
    // export function manipulate(buf: Buffer, info: WorldInfo): Buffer {
    //     const nbt = NBT.Persistence.readRoot(buf, { compressed: true });
    //     let data = nbt.asTagCompound().get('Data');
    //     if (data) {
    //         data = data.asTagCompound();
    //         const Tag = NBT.TagScalar;
    //         data.set('LevelName', Tag.newString(info.displayName));
    //         data.set('Difficulty', Tag.newInt(info.difficulty));
    //     }
    //     return NBT.Persistence.writeRoot(nbt, { compressed: true });
    // }

    function getChunkOffset(buffer: Buffer, x: number, z: number) {
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

    export function loadChunkFromBuffer(buffer: Buffer, x: number, z: number): ChunkDataFrame {
        const off = getChunkOffset(buffer, x, z);
        const length = buffer.readInt32BE(off);
        const format = buffer.readUInt8(off + 4);
        if (format !== 2) {
            throw new Error(`Cannot resolve chunk with format ${format}.`);
        }
        const chunkData = buffer.slice(off + 5, off + 5 + length);
        return NBT.Serializer.deserialize(inflateSync(chunkData), false) as any as ChunkDataFrame;
    }

    export function getRegionFile(location: string, x: number, z: number) {
        return path.join(location, "region", `r.${x}.${z}.mca`);
    }

    export async function load<K extends string & keyof World & ("players" | "advancements" | "level")>(location: string, entries: K[]): Promise<Pick<World, K | "path">> {
        const isDir = await fs.stat(location).then((s) => s.isDirectory());
        const enabledFunction = entries.reduce((o, v) => { o[v] = true; return o; }, {} as { [k: string]: boolean });
        const result: Partial<World> & Pick<World, "players" | "advancements"> = {
            path: path.resolve(location),
            players: [],
            advancements: [],
        };
        if (!isDir) {
            const buffer = await fs.readFile(location);
            const ft = fileType(buffer);
            if (!ft || ft.ext !== "zip") { throw new Error("IllgalMapFormat"); }

            const zip = await yauzl.open(buffer);
            await yauzl.walkEntries(zip, (e) => {
                if (enabledFunction.level && e.fileName === "level.dat") {
                    return yauzl.bufferEntry(zip, e).then(NBT.Serializer.deserialize).then((l) => { result.level = l as any; });
                }
                if (enabledFunction.players && e.fileName.match(/^playerdata\/[0-9a-z\-]+\.dat$/)) {
                    return yauzl.bufferEntry(zip, e).then(NBT.Serializer.deserialize).then((r) => { result.players.push(r as any); });
                }
                if (enabledFunction.advancements && e.fileName.match(/^advancements\/[0-9a-z\-]+\.json$/)) {
                    return yauzl.bufferEntry(zip, e).then((b) => b.toString()).then(JSON.parse).then((r) => { result.advancements.push(r as any); });
                }
                return undefined;
            });
        } else {
            const promises: Array<Promise<any>> = [];
            if (enabledFunction.level) {
                promises.push(fs.readFile("level.dat").then(NBT.Serializer.deserialize).then((l) => { result.level = l as any; }));
            }
            if (enabledFunction.players) {
                promises.push(fs.readdir(path.resolve(location, "playerdata")).then(
                    (files) => Promise.all(files.map((f) => path.resolve(location, "playerdata", f))
                        .map((p) => fs.readFile(p)
                            .then(NBT.Serializer.deserialize).then((r) => { result.players.push(r as any); }),
                        )),
                    () => { },
                ));
            }
            if (enabledFunction.advancements) {
                promises.push(fs.readdir(path.resolve(location, "advancements")).then(
                    (files) => Promise.all(files.map((f) => path.resolve(location, "advancements", f))
                        .map((p) => fs.readFile(p)
                            .then((b) => b.toString()).then(JSON.parse).then((r) => { result.advancements.push(r as any); }),
                        )),
                    () => { },
                ));
            }
            await Promise.all(promises);
        }
        return result as any;

    }

    export function parseLevelData(buffer: Buffer) {
        const nbt = NBT.Serializer.deserialize(buffer, true);
        const data = nbt.Data;
        if (!data) { throw new Error("Illegal Level Data Content"); }
        return Object.keys(data).sort().reduce((r: any, k: any) => (r[k] = data[k], r), {});
    }
}

export default WorldInfo;
