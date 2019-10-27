import { LevelDataFrame, PlayerDataFrame, RegionDataFrame, World } from "@xmcl/common";
import { NBT } from "@xmcl/nbt";
import Unzip from "@xmcl/unzip";
import { vfs } from "@xmcl/util";
import fileType from "file-type";
import * as path from "path";

declare module "@xmcl/common/world" {
    namespace World {
        function loadRegionFromBuffer(buffer: Buffer, x: number, z: number): Promise<RegionDataFrame>;
        /**
         *
         * @param location The save file path. e.g .minecraft/saves/New World
         * @param x The x of the chunk
         * @param z The z of the chunk.
         */
        function getRegionFile(location: string, x: number, z: number): string;
        /**
         * Load the specific part of the save
         * @param location The save path
         * @param entries The parts you want to load
         */
        function load<K extends string & keyof World & ("players" | "advancements" | "level")>(location: string, entries: K[]): Promise<Pick<World, K | "path">>;
        function parseLevelData(buffer: Buffer): Promise<LevelDataFrame>;
    }
}

export abstract class WorldReader {
    public static async create(location: string) {
        if (await vfs.stat(location).then((s) => s.isDirectory())) {
            return new DirWorld(location);
        } else {
            const buffer = await vfs.readFile(location);
            const ft = fileType(buffer);
            if (ft && ft.ext === "zip") {
                return new ZipWorld(location, await Unzip.open(location, { lazyEntries: false }));
            }
        }
        throw new Error(`Unsupported world file! It should be either dir or zip. ${location}`);
    }

    public abstract readonly filePath: string;
    private levelData?: LevelDataFrame;
    private playerData?: PlayerDataFrame;

    private regionMap: { [k: string]: RegionDataFrame } = {};

    public async getRegionData(chunkX: number, chunkZ: number): Promise<RegionDataFrame> {
        throw new Error();
    }

    public async getPlayerData(): Promise<PlayerDataFrame> {
        if (this.playerData === null) {
            this.playerData = await this.readEntry("players.dat").then((b) => NBT.Persistence.deserialize(b) as any);
        }
        return this.playerData!;
    }

    public async getLevelData(): Promise<LevelDataFrame> {
        if (this.levelData === null) {
            this.levelData = await this.readEntry("level.dat").then((b) => NBT.Persistence.deserialize(b) as any);
        }
        return this.levelData!;
    }

    protected abstract readEntry(relativePath: string): Promise<Buffer>;
    protected abstract hasEntry(relativePath: string): Promise<boolean>;
    protected abstract listEntries(relativePath: string): Promise<string[]>;
}

function seek(bs: Long[], index: number) {
    function mask(bit: number) {
        let m = 0;
        for (let i = 0; i < bit; ++i) { m = (m << 1) + 1; }
        return m;
    }

    const bitLen = bs.length * 64 / 4096;
    const bitMask = mask(bitLen);

    const bitOff = index * bitLen;
    const tagAt = Math.floor(bitOff / 64);
    const tag = bs[tagAt];

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
            ? bs[tagAt + 1].high // use next long high
            : tag.low; // use this low
        id = ((value & partialMask) << nextBits) | (nextValue >>> (32 - nextBits));
    } else {
        id = (value >>> off) & bitMask;
    }

    return id;
}

export class RegionReader {
    constructor(readonly region: RegionDataFrame) {
    }

    public getBlockStateAt(x: number, y: number, z: number): undefined | { Name: string; properties: { [key: string]: string } } {
        const innerX = x % 16;
        const innerZ = z % 16;

        const chunkY = y << 4;

        const section = this.region.Level.Sections[chunkY];

        return this.at(section, ((innerX & 15) << 4) | (innerZ & 15));
    }

    private at(section: RegionDataFrame["Level"]["Sections"][number], index: number) {
        if ("BlockStates" in section) {
            return section.Palette[seek(section.BlockStates, index)];
        }
        return undefined;
    }
}

class DirWorld extends WorldReader {
    constructor(readonly filePath: string) {
        super();
    }

    protected hasEntry(relativePath: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    protected listEntries(relativePath: string): Promise<string[]> {
        throw new Error("Method not implemented.");
    }
    protected async readEntry(relativePath: string) {
        const entry = path.join(this.filePath, relativePath);
        if (!entry) { throw new Error(`Cannot find path ${relativePath}`); }
        const buf = await vfs.readFile(entry);
        return buf;
    }
}

class ZipWorld extends WorldReader {
    constructor(readonly filePath: string, readonly file: Unzip.CachedZipFile) {
        super();
    }

    protected hasEntry(relativePath: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    protected listEntries(relativePath: string): Promise<string[]> {
        throw new Error("Method not implemented.");
    }

    protected async readEntry(relativePath: string) {
        const entry = this.file.entries[relativePath];
        if (!entry) { throw new Error(`Cannot find path ${relativePath}`); }
        const buf = await this.file.readEntry(entry);
        return buf;
    }
}

World.getRegionFile = getRegionFile;
World.load = load;
World.loadRegionFromBuffer = loadRegionFromBuffer;
World.parseLevelData = parseLevelData;

async function loadRegionFromBuffer(buffer: Buffer, x: number, z: number) {
    const off = getChunkOffset(buffer, x, z);
    const length = buffer.readInt32BE(off);
    const format = buffer.readUInt8(off + 4);
    if (format !== 2) {
        throw new Error(`Cannot resolve chunk with format ${format}.`);
    }

    const chunkData = buffer.slice(off + 5, off + 5 + length);
    // const inflatedData = await new Promise<Buffer>((resolve, reject) => {
    //     inflate(chunkData, (e, r) => {
    //         if (e) {
    //             reject(e);
    //         } else {
    //             resolve(r);
    //         }
    //     });
    // });
    const data = await NBT.Persistence.deserialize(chunkData, { compressed: true });
    return data as unknown as RegionDataFrame;
}

function getRegionFile(location: string, x: number, z: number) {
    return path.join(location, "region", `r.${x}.${z}.mca`);
}

async function load<K extends string & keyof World & ("players" | "advancements" | "level")>(location: string, entries: K[]): Promise<Pick<World, K | "path">> {
    const isDir = await vfs.stat(location).then((s) => s.isDirectory());
    const enabledFunction = entries.reduce((o, v) => { o[v] = true; return o; }, {} as { [k: string]: boolean });
    const result: Partial<World> & Pick<World, "players" | "advancements"> = {
        path: path.resolve(location),
        players: [],
        advancements: [],
    };
    if (!isDir) {
        const buffer = await vfs.readFile(location);
        const ft = fileType(buffer);
        if (!ft || ft.ext !== "zip") { throw new Error("IllgalMapFormat"); }

        const zip = await Unzip.open(buffer, { lazyEntries: true });
        await zip.walkEntries((e) => {
            if (enabledFunction.level && e.fileName.endsWith("/level.dat")) {
                return zip.readEntry(e).then(NBT.Persistence.deserialize).then((l) => {
                    result.level = l.Data as any;
                    if (result.level === undefined || result.level === null) {
                        throw {
                            error: "Corrupted Map",
                            entry: path.resolve(location, "level.dat"),
                            enabledFunctions: enabledFunction,
                            params: {
                                entries,
                            },
                            result: l,
                        };
                    }
                });
            }
            if (enabledFunction.players && e.fileName.match(/\/playerdata\/[0-9a-z\-]+\.dat$/)) {
                return zip.readEntry(e).then(NBT.Persistence.deserialize).then((r) => { result.players.push(r as any); });
            }
            if (enabledFunction.advancements && e.fileName.match(/\/advancements\/[0-9a-z\-]+\.json$/)) {
                return zip.readEntry(e).then((b) => b.toString()).then(JSON.parse).then((r) => { result.advancements.push(r as any); });
            }
            return undefined;
        });
        if (!result.level) {
            throw new Error("Cannot find level.dat");
        }
    } else {
        const promises: Array<Promise<any>> = [];
        if (enabledFunction.level) {
            promises.push(vfs.readFile(path.resolve(location, "level.dat")).then(NBT.Persistence.deserialize).then((l) => {
                result.level = l.Data as any;
                if (result.level === undefined || result.level === null) {
                    throw {
                        error: "Corrupted Map",
                        entry: path.resolve(location, "level.dat"),
                        enabledFunctions: enabledFunction,
                        params: {
                            entries,
                        },
                        result: l,
                    };
                }
            }));
        }
        if (enabledFunction.players) {
            promises.push(vfs.readdir(path.resolve(location, "playerdata")).then(
                (files) => Promise.all(files.map((f) => path.resolve(location, "playerdata", f))
                    .map((p) => vfs.readFile(p)
                        .then(NBT.Persistence.deserialize).then((r) => { result.players.push(r as any); }),
                    )),
                () => { },
            ));
        }
        if (enabledFunction.advancements) {
            promises.push(vfs.readdir(path.resolve(location, "advancements")).then(
                (files) => Promise.all(files.map((f) => path.resolve(location, "advancements", f))
                    .map((p) => vfs.readFile(p)
                        .then((b) => b.toString()).then(JSON.parse).then((r) => { result.advancements.push(r as any); }),
                    )),
                () => { },
            ));
        }
        await Promise.all(promises);
    }
    return result as any;
}

async function parseLevelData(buffer: Buffer): Promise<LevelDataFrame> {
    const nbt = await NBT.Persistence.deserialize(buffer, { compressed: true });
    const data = nbt.Data;
    if (!data) { throw new Error("Illegal Level Data Content"); }
    return Object.keys(data).sort().reduce((r: any, k: any) => (r[k] = data[k], r), {});
}

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

export * from "@xmcl/common/world";

