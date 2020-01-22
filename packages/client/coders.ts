import { deserializeSync, serializeSync } from "@xmcl/nbt";
import ByteBuffer from "bytebuffer";
import long from "long";
import "uuid";

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

export const VarInt: Coder<number> = {
    decode: (buffer, inst) => buffer.readVarint32(),
    encode: (buffer, inst) => { buffer.writeVarint32(inst); },
};

export const Int: Coder<number> = {
    decode: (buffer, inst) => buffer.readInt(),
    encode: (buffer, inst) => { buffer.writeInt(inst); },
};

export const Byte: Coder<number> = {
    decode: (buffer, inst) => buffer.readByte(),
    encode: (buffer, inst) => { buffer.writeByte(inst); },
};

export const UByte: Coder<number> = {
    decode: (buffer, inst) => buffer.readUint8(),
    encode: (buffer, inst) => { buffer.writeUint8(inst); },
};

export const Bool: Coder<boolean> = {
    decode: (buffer, inst) => buffer.readByte() === 1,
    encode: (buffer, inst) => { buffer.writeByte(inst ? 1 : 0); },
};

export const Float: Coder<number> = {
    decode: (buffer, inst) => buffer.readFloat(),
    encode: (buffer, inst) => { buffer.writeFloat(inst); },
};

export const Double: Coder<number> = {
    decode: (buffer, inst) => buffer.readDouble(),
    encode: (buffer, inst) => { buffer.writeDouble(inst); },
};

// const _Position: Coder<Position> = {
//     decode: (buffer, inst) => {
//         const val = buffer.readLong();
//         inst.x = val.getHighBits() >> 6;
//         inst.y = (val.getHighBits() << 26 >> 20) | val.getLowBits() >> 26;
//         inst.z = val.getLowBits() << 6 >> 6;
//         return inst;
//     },
//     encode: (buffer, inst) => {
//         const high = inst.x >> 6 | ((inst.y >> 6) & 0x3F);
//         const low = (inst.y & 0x3F) | inst.z << 6 >> 6;
//         return new Long(low, high);
//     },
// };

export const UUID: Coder<string> = {
    decode: (buffer, inst) => {
        const makeDigit = (hex: string, digit: number) => {
            if (hex.length < digit) {
                let d = "";
                for (let i = 0; i < digit - hex.length; i += 1) {
                    d += 0;
                }
                return `${d}${hex}`;
            }
            return hex;
        };
        const hi = buffer.readUint64();
        const lo = buffer.readUint64();
        const a = makeDigit(hi.shiftRight(32).toString(16), 8);
        const b = makeDigit(hi.shiftRight(16).and(0xFFFF).toString(16), 4);
        const c = makeDigit(hi.and(0xFFFF).toString(16), 4);
        const d = makeDigit(lo.shiftRight(48).and(0xFFFF).toString(16), 4);
        const e = makeDigit(lo.and(0xFFFFFFFFFFFF).toString(16), 12);

        return `${a}-${b}-${c}-${d}-${e}`;
    },
    encode: (buffer, inst) => {
        const components = inst.split("-");
        if (components.length !== 5) { throw new Error("Invalid UUID"); }
        let hi = long.fromString(components[0], false, 16);
        hi = hi.shiftLeft(16);
        hi = hi.or(long.fromString(components[1], false, 16));
        hi = hi.shiftLeft(16);
        hi = hi.or(long.fromString(components[2], false, 16));

        let lo = long.fromString(components[3], false, 16);
        lo = lo.shiftLeft(48);
        lo = lo.or(long.fromString(components[4], false, 16));

        buffer.writeUint64(hi);
        buffer.writeUint64(lo);
    },
};

export const Short: Coder<number> = {
    decode: (buffer, inst) => buffer.readShort(),
    encode: (buffer, inst) => { buffer.writeShort(inst); },
};

export const UShort: Coder<number> = {
    decode: (buffer, inst) => buffer.readUint16(),
    encode: (buffer, inst) => { buffer.writeUint16(inst); },
};

export const Long: Coder<Long> = {
    decode: (buffer, inst) => buffer.readLong(),
    encode: (buffer, inst) => { buffer.writeInt64(inst); },
};

export const VarLong: Coder<Long> = {
    decode: (buffer, inst) => buffer.readVarint64(),
    encode: (buffer, inst) => { buffer.writeVarint64(inst); },
};

export const String: Coder<string> = {
    decode: (buffer) => {
        const length = buffer.readVarint32();
        const u8 = buffer.slice(buffer.offset, buffer.offset + length).toUTF8();
        return u8;
    },
    encode: (buffer, inst) => {
        buffer.writeByte(inst.length);
        buffer.writeUTF8String(inst);
    },
};

export const Json: Coder<any> = {
    decode: (buffer, inst) => {
        return JSON.parse(String.decode(buffer, ""));
    },
    encode: (buffer, inst) => {
        String.encode(buffer, JSON.stringify(inst));
    },
};


export const Slot: Coder<SlotData> = {
    decode: (buffer, inst) => {
        const blockId = Short.decode(buffer, 0);
        if (blockId === -1) { return { blockId }; }
        const itemCount = Byte.decode(buffer) || undefined;
        const itemDamage = Short.decode(buffer) || undefined;
        if (Byte.decode(buffer, 0) === 0) {
            return {
                blockId,
                itemCount,
                itemDamage,
            };
        }
        return {
            blockId,
            itemCount,
            itemDamage,
            nbt: deserializeSync(Buffer.from(buffer.buffer)),
        };
    },
    encode: (buffer, inst) => {
        Short.encode(buffer, inst.blockId);
        Byte.encode(buffer, inst.itemCount || 0);
        Byte.encode(buffer, inst.itemDamage || 0);
        if (inst.nbt) {
            Byte.encode(buffer, 1);
            buffer.writeBytes(serializeSync(inst.nbt));
        } else {
            Byte.encode(buffer, 0);
        }
    },
};

export const ByteArray: Coder<Int8Array> = {
    decode: (buffer, inst) => {
        const len = buffer.readVarint32();
        const arr = new Int8Array(len);
        for (let i = 0; i < len; i += 1) {
            arr[i] = buffer.readByte();
        }
        return arr;
    },
    encode: (buffer, inst) => {
        const len = inst.length;
        buffer.writeVarint32(len);
        for (let i = 0; i < len; i += 1) {
            buffer.writeByte(inst[i]);
        }
    },
};
