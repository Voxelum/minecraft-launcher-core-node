import * as fs from "fs-extra";
import * as Zip from "jszip";
import * as path from "path";
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
export namespace WorldInfo {
    /**
     * Validate the map. (if the level.dat exist)
     *
     * This Promise will not reject but always get true or false to determine if the map is valid
     *
     * @param map the file path or the zip data of the map
     */
    export async function valid(map: string | Zip): Promise<boolean> {
        return findEntry(map).then(() => true).catch(() => false);
    }
    async function findEntryZip(zip: Zip) {
        if (zip.file("level.dat")) {
            return "level.dat";
        }
        for (const key in zip.files) {
            if (key.endsWith("/level.dat")) {
                return key;
            }
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
    export async function findEntry(map: string | Zip): Promise<string> {
        if (typeof map === "string") {
            if (!(await fs.stat(map)).isDirectory()) {
                const zip = await new Zip().loadAsync(await fs.readFile(map));
                const entry = await findEntryZip(zip);
                if (entry) { return entry; }
            } else if (fs.existsSync(path.join(map, "level.dat"))) {
                return "level.dat";
 }
        } else {
            const entry = await findEntryZip(map);
            if (entry) { return entry; }
        }
        throw {
            type: "InvalidWorldEntry",
            world: map,
        };
    }
    /**
     * Read the map file to worldinfo
     *
     * @param map the file path or the zip data of the map
     */
    export async function read(map: string | Zip): Promise<WorldInfo> {
        const entry = await findEntry(map);
        const buf = await fs.readFile(entry);
        return parse(buf);
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
}

export default WorldInfo;
