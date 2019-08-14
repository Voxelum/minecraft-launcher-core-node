import { LevelDataFrame, RegionDataFrame, World } from "@xmcl/common";
import { NBT } from "@xmcl/nbt";
import Unzip from "@xmcl/unzip";
import * as fileType from "file-type";
import * as fs from "fs";
import * as path from "path";
import { inflateSync } from "zlib";

type StringBoolean = "true" | "false";

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
    const data = await NBT.Persistence.deserialize(inflateSync(chunkData), false);
    return data as unknown as RegionDataFrame;
}

function getRegionFile(location: string, x: number, z: number) {
    return path.join(location, "region", `r.${x}.${z}.mca`);
}

async function load<K extends string & keyof World & ("players" | "advancements" | "level")>(location: string, entries: K[]): Promise<Pick<World, K | "path">> {
    const isDir = await fs.promises.stat(location).then((s) => s.isDirectory());
    const enabledFunction = entries.reduce((o, v) => { o[v] = true; return o; }, {} as { [k: string]: boolean });
    const result: Partial<World> & Pick<World, "players" | "advancements"> = {
        path: path.resolve(location),
        players: [],
        advancements: [],
    };
    if (!isDir) {
        const buffer = await fs.promises.readFile(location);
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
    } else {
        const promises: Array<Promise<any>> = [];
        if (enabledFunction.level) {
            promises.push(fs.promises.readFile(path.resolve(location, "level.dat")).then(NBT.Persistence.deserialize).then((l) => {
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
            promises.push(fs.promises.readdir(path.resolve(location, "playerdata")).then(
                (files) => Promise.all(files.map((f) => path.resolve(location, "playerdata", f))
                    .map((p) => fs.promises.readFile(p)
                        .then(NBT.Persistence.deserialize).then((r) => { result.players.push(r as any); }),
                    )),
                () => { },
            ));
        }
        if (enabledFunction.advancements) {
            promises.push(fs.promises.readdir(path.resolve(location, "advancements")).then(
                (files) => Promise.all(files.map((f) => path.resolve(location, "advancements", f))
                    .map((p) => fs.promises.readFile(p)
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
    const nbt = await NBT.Persistence.deserialize(buffer, true);
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

