import { GameRule, GameType, Pos3, Pos2 } from './game';
import * as fs from 'fs-extra'
import * as Zip from 'jszip'
import * as path from 'path'
import { NBT } from './nbt';

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
        public BorderSizeLerpTarget: number
    ) { }
}
export namespace WorldInfo {
    export async function valid(map: string): Promise<boolean> {
        const isDir = await new Promise((resolve, reject) => {
            fs.lstat(map, (err, status) => {
                if (err) reject(err)
                else resolve(status.isDirectory())
            })
        });
        if (isDir) return fs.existsSync(path.join(map, 'level.dat'))
        else {
            try {
                const zip = await new Zip().loadAsync(await fs.readFile(map))
                if (zip.file('level.dat'))
                    return true
                for (const key in zip.files)
                    if (key.endsWith('/level.dat'))
                        return true
                return false
            }
            catch (e) { return false; }
        }
    }
    export function parse(buf: Buffer): WorldInfo {
        let nbt = NBT.Serializer.deserialize(buf, true)
        let root = nbt.Data
        return new WorldInfo(root.LevelName, root.SizeOnDisk, root.LastPlayed, root.GameRules,
            root.DataVersion, root.Version, root.generatorName,
            root.Difficulty, root.GameType, root.hardcore == 1, root.allowCommands == 1,
            { x: root.SpawnX, y: root.SpawnY, z: root.SpawnZ },
            { x: root.BorderCenterX, z: root.BorderCenterZ },
            root.BorderDamagePerBlock, root.BorderWarningBlocks, root.BorderSizeLerpTarget);
    }
    export function manipulate(buf: Buffer, info: WorldInfo): Buffer {
        const nbt = NBT.Persistence.readRoot(buf, { compressed: true });
        let data = nbt.asTagCompound().get('Data');
        if (data) {
            data = data.asTagCompound();
            const Tag = NBT.TagScalar;
            data.set('LevelName', Tag.newString(info.displayName));
            data.set('Difficulty', Tag.newInt(info.difficulty));
        }
        return NBT.Persistence.writeRoot(nbt, { compressed: true });
    }
}

export default WorldInfo;