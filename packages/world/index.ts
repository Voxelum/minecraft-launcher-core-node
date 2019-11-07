import { LevelDataFrame, PlayerDataFrame, RegionDataFrame, System, FileSystem, AdvancementDataFrame } from "@xmcl/common";
import ByteBuffer from "bytebuffer";
import { NBT } from "@xmcl/nbt";

export abstract class WorldReader {
    public abstract readonly filePath: string;

    constructor(private fs: FileSystem) { }

    public async getRegionData(chunkX: number, chunkZ: number): Promise<RegionDataFrame> {
        const path = System.join("region", `r.${chunkX}.${chunkZ}.mca`);
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

    public async getLevelData(): Promise<LevelDataFrame> {
        return this.fs.readFile("level.dat")
            .then((b) => NBT.deserialize(b, { compressed: "gzip" }))
            .then((d: any) => d.Data);
    }

    public async getPlayerData(): Promise<PlayerDataFrame[]> {
        const files = await this.fs.listFiles("playerdata");
        return Promise.all(files
            .map((f) => this.fs.readFile(f).then((b) => NBT.deserialize<PlayerDataFrame>(b))));
    }

    public async getAdvancementsData(): Promise<AdvancementDataFrame[]> {
        const files = await this.fs.listFiles("advancements");
        return Promise.all(files
            .map((f) => this.fs.readFile(f).then((b) => NBT.deserialize<AdvancementDataFrame>(b))));
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

export * from "@xmcl/common/world";

