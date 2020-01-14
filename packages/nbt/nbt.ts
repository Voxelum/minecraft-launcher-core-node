import ByteBuffer from "bytebuffer";
import fileType from "file-type";
import Long from "long";
import { readUTF8, writeUTF8, zlib } from "./utils";

type Constructor<T> = new (...args: any) => T;

export const NBTPrototype = Symbol("NBTPrototype");
export const NBTConstructor = Symbol("NBTConstructor");

export type TagType =
    TagTypePrimitive |
    typeof TagType.List |
    typeof TagType.Compound;

export type TagTypePrimitive =
    typeof TagType.End |
    typeof TagType.Byte |
    typeof TagType.Short |
    typeof TagType.Int |
    typeof TagType.Long |
    typeof TagType.Float |
    typeof TagType.Double |
    typeof TagType.ByteArray |
    typeof TagType.String |
    typeof TagType.IntArray |
    typeof TagType.LongArray;

/**
 * Annotate the type of a field
 */
export function TagType<T>(type: TagType | Constructor<T> | Schema) {
    return (targetClass: any, key: string) => {
        let nbtPrototype: NBTPrototype = getPrototypeOf(targetClass);
        const parentClass = Object.getPrototypeOf(targetClass);
        if (parentClass && parentClass !== Object.getPrototypeOf({})) {
            const parentNBTPrototype = getPrototypeOf(parentClass);
            setPrototypeOf(nbtPrototype, parentNBTPrototype);
        }
        nbtPrototype[key] = type;
    };
}

function resolvePrototype(schema: CompoundSchema | Constructor<any>) {
    return typeof schema === "object" ? createPrototypeOf(schema) : getPrototypeOf(schema);
}

function constructObject(valueType: CompoundSchema | Constructor<any> | undefined) {
    if (!valueType) return Object.create(null);
    const prot = typeof valueType === "object" ? createPrototypeOf(valueType) : getPrototypeOf(valueType);;
    return prot[NBTConstructor]();
}

function createPrototypeOf(schema: CompoundSchema): NBTPrototype {
    const proto: NBTPrototype = {
        [NBTConstructor]() {
            return { [NBTPrototype]: this }
        },
        ...schema,
    };
    return proto;
}

/**
 * Get NBT schema for this object or a class.
 * 
 * If the param is a object, any modifications on this prototype will only affact this object.
 * 
 * If the param is a class, any modifications on this prototype will affact all object under this class
 * 
 * @param object The object or class
 */
export function getPrototypeOf(object: object | Function): NBTPrototype {
    const targetObject = typeof object === "function" ? object.prototype : object;
    let nbtPrototype: NBTPrototype;
    if (targetObject.hasOwnProperty(NBTPrototype)) {
        nbtPrototype = targetObject[NBTPrototype];
    } else {
        nbtPrototype = {
            [NBTConstructor]: typeof object === "function"
                ? () => new (object as Constructor<any>)()
                : () => ({ [NBTPrototype]: nbtPrototype })
        };
    }

    // link prototype to parent's nbt prototype
    // we need to do this every time since the prototype chain might change
    const parentClass = Object.getPrototypeOf(targetObject);
    if (parentClass && parentClass !== Object.getPrototypeOf({})) {
        const parentNBTPrototype = getPrototypeOf(parentClass);
        const existedParentNBTPrototype = Object.getPrototypeOf(nbtPrototype);
        if (existedParentNBTPrototype !== parentNBTPrototype) {
            Object.setPrototypeOf(nbtPrototype, parentNBTPrototype);
        }
    }

    return new Proxy(nbtPrototype, {
        set(target, key, value) {
            if (!target.hasOwnProperty(NBTPrototype)) {
                setPrototypeOf(targetObject, target)
            }
            if (typeof key === "string") {
                if (typeof value === "number" && !isTagType(value)) {
                    return false;
                }
                target[key] = value;
                return true;
            }
            return false;
        },
    });
}

/**
 * Set and change the NBT prototype of this object or class
 * @param object A object or a class function
 * @param nbtPrototype The nbt prototype
 */
export function setPrototypeOf(object: object | Function, nbtPrototype: NBTPrototype) {
    const target = typeof object === "function" ? object.prototype : object;
    Object.defineProperty(target, NBTPrototype, { value: nbtPrototype, writable: true });
}

function isTagType(n: number): n is TagType {
    return n >= 0 && n <= 12;
}

export namespace TagType {
    export const End = 0 as const;
    export const Byte = 1 as const;
    export const Short = 2 as const;
    export const Int = 3 as const;
    export const Long = 4 as const;
    export const Float = 5 as const;
    export const Double = 6 as const;
    export const ByteArray = 7 as const;
    export const String = 8 as const;
    export const List = 9 as const;
    export const Compound = 10 as const;
    export const IntArray = 11 as const;
    export const LongArray = 12 as const;

    export function getName(tagType: TagType) {
        return [
            "End",
            "Byte",
            "Short",
            "Int",
            "Long",
            "Float",
            "Double",
            "ByteArray",
            "String",
            "List",
            "Compound",
            "IntArray",
            "LongArray",
        ][tagType];
    }
}


export type Schema = ListSchema | CompoundSchema | Constructor<any>;
export type ListSchema = [TagType | Schema];
export type CompoundSchema = { [key: string]: TagType | Schema; };

export interface NBTPrototype extends CompoundSchema {
    [NBTConstructor]: () => any;
}

export interface IO {
    read(buf: ByteBuffer, context: ReadContext): any;
    write(buf: ByteBuffer, value: any, context: WriteContext): void;
}

const IO: IO[] = [
    { read: (buf) => undefined, write(buf, v) { } }, // end
    { read: (buf) => buf.readByte(), write(buf, v) { buf.writeByte(v ? v : 0); } }, // byte
    { read: (buf) => buf.readShort(), write(buf, v) { buf.writeShort(v ? v : 0); } }, // short
    { read: (buf) => buf.readInt(), write(buf, v) { buf.writeInt(v ? v : 0); } }, // int
    { read: (buf) => buf.readInt64(), write(buf, v) { buf.writeInt64(v ? v : 0); } }, // long
    { read: (buf) => buf.readFloat(), write(buf, v) { buf.writeFloat(v ? v : 0); } }, // float
    { read: (buf) => buf.readDouble(), write(buf, v) { buf.writeDouble(v ? v : 0); } }, // double
    { // byte array
        read(buf) {
            const arr = new Array(buf.readInt());
            for (let i = 0; i < arr.length; i++) { arr[i] = buf.readByte(); }
            return arr;
        },
        write(buf, arr = []) {
            buf.writeInt(arr.length);
            for (let i = 0; i < arr.length; i++) { buf.writeByte(arr[i]); }
        },
    },
    { read: (buf) => readUTF8(buf), write: (buf, v) => writeUTF8(buf, v ? v : "") }, // string
    { // list
        read(buf, context) {
            const listType = buf.readByte();
            if (!isTagType(listType)) {
                throw new Error("IllegalState");
            }

            const len = buf.readInt();
            const list = new Array(len);

            if (!!context.valueType && !(context.valueType instanceof Array)) {
                throw new Error("IllegalState");
            }

            if (!!context.valueType && typeof context.valueType === "number" && listType !== context.valueType) {
                // ignore the value if we know the type mismatched
                return list;
            }

            const nextContext = context.fork(context.valueType ? context.valueType[0] : listType);

            const shouldInspectChildType = !nextContext.valueType;
            for (let i = 0; i < len; i++) {
                const value = IO[listType].read(buf, nextContext);
                list[i] = value;
            }
            if (shouldInspectChildType) {
                context.valueType = nextContext.valueType!;
            }

            return list;
        },
        write(buf, value: any[] = [], context) {
            if (!(context.type instanceof Array)) {
                throw new Error("IllegalState")
            }
            const valueType = context.type[0];
            const childContext = context.fork(valueType);
            const tagType = childContext.tagType;
            const writer = IO[tagType];

            if (!writer) {
                throw new Error("Unknown type " + tagType);
            }
            if ((tagType === TagType.Compound || tagType === TagType.List) && !childContext.type) {
                // skip for undefined property
                return;
            }

            try {
                buf.writeByte(tagType);
                buf.writeInt(value.length);
                for (const v of value) {
                    writer.write(buf, v, childContext);
                }
            } catch (e) {
                if (e instanceof TypeError) {
                    throw {
                        type: "IllegalInputType",
                        message: `Require ${TagType.getName(tagType)} but found ${typeof value}`,
                    };
                }
            }
        },
    },
    {// tag compound
        read(buf, context) {
            if (context.valueType instanceof Array) {
                throw new Error();
            }
            const object: any = constructObject(context.valueType); // create from constructor
            const nbtPrototype = getPrototypeOf(object);
            const knowingType = !context.valueType;

            for (let tag = 0; (tag = buf.readByte()) !== TagType.End;) {
                const reader = IO[tag];

                let key = readUTF8(buf);
                // not reader or illegal tag type
                if (!reader || !isTagType(tag)) {
                    throw new Error("No such tag id: " + tag);
                }

                let childContext: ReadContext;
                if (knowingType) {
                    let valueType = nbtPrototype[key];
                    // skip for undefined field or type not matchedin this mode !
                    if (!valueType || typeof valueType === "number" && valueType !== tag) {
                        continue;
                    }
                    childContext = context.fork(valueType);
                } else {
                    childContext = context.fork(tag);
                }

                const shouldInspectChildType = !childContext.valueType;
                object[key] = reader.read(buf, childContext);
                if (shouldInspectChildType) {
                    nbtPrototype[key] = childContext.valueType!;
                }
            }
            if (!knowingType) {
                context.valueType = nbtPrototype;
            }

            return object;
        },
        write(buf, object = {}, context) {
            const schema = getPrototypeOf(object);

            for (const [key, value] of Object.entries(object)) {
                const valueType = schema[key];
                const childContext = context.fork(valueType);
                const tagType = childContext.tagType;
                const writer = IO[tagType];

                if (!writer) {
                    throw new Error("Unknown type " + tagType);
                }
                if (!childContext.type && (tagType === TagType.Compound || tagType === TagType.List)) {
                    // skip for undefined property
                    continue;
                }
                try {
                    buf.writeByte(tagType);
                    writeUTF8(buf, key);
                    writer.write(buf, value, childContext);
                } catch (e) {
                    if (e instanceof TypeError) {
                        throw {
                            type: "IllegalInputType",
                            message: `Require ${TagType.getName(tagType)} but found ${typeof value}`,
                        };
                    }
                }
            }
            buf.writeByte(TagType.End);
        },
    },
    { // int array
        read(buf) {
            const arr = new Array(buf.readInt());
            for (let i = 0; i < arr.length; i++) { arr[i] = buf.readInt(); }
            return arr;
        },
        write(buf, v = []) {
            buf.writeInt(v.length);
            for (let i = 0; i < v.length; i++) { buf.writeInt(v[i]); }
        },
    },
    { // long array
        read(buf) {
            const len = buf.readInt();
            const arr: Long[] = new Array(len);
            for (let i = 0; i < len; i++) { arr[i] = buf.readInt64(); }
            return arr;
        },
        write(buf, v = []) {
            buf.writeInt(v.length);
            for (let i = 0; i < v.length; i++) { buf.writeInt64(v[i]); }
        },
    },
];

export interface SerializationOption {
    compressed?: true | "deflate" | "gzip";
    /**
     * IO override for serialization
     */
    io?: { [tagType: number]: IO };

    /**
     * Used for serialize function. Assign the filename for it.
     */
    filename?: string;
}

/**
 * Serialzie an nbt typed json object into NBT binary
 * @param object The json
 * @param compressed Should we compress it
 */
export async function serialize(object: object, option: SerializationOption = {}): Promise<Uint8Array> {
    const buff = writeRootTag(object, undefined, option.filename || "", Object.assign({}, IO, option.io));
    return normalizeBuffer(buff, option.compressed);
}

/**
 * Deserialize the nbt binary into json
 * @param fileData The nbt binary
 */
export async function deserialize<T>(fileData: Uint8Array, option: SerializationOption & { type?: Constructor<T> } = {}): Promise<T> {
    const doUnzip = normalizeCompress(fileData, option.compressed);
    const bb = ByteBuffer.wrap(doUnzip === "none"
        ? fileData
        : doUnzip === "gzip"
            ? await zlib.ungzip(fileData)
            : await zlib.inflate(fileData));

    return readRootTag(bb, Object.assign({}, IO, option.io));
}

/**
 * Serialzie an nbt typed json object into NBT binary
 * @param object The json
 */
export function serializeSync(object: object, option: SerializationOption = {}): Uint8Array {
    const buff = writeRootTag(object, undefined, option.filename || "", Object.assign({}, IO, option.io));
    return normalizeBufferSync(buff, option.compressed);
}

/**
 * Deserialize the nbt binary into json
 * @param fileData The nbt binary
 * @param compressed Should we compress it
 */
export function deserializeSync<T>(fileData: Uint8Array, option: SerializationOption = {}): T {
    const doUnzip = normalizeCompress(fileData, option.compressed);
    const bb = ByteBuffer.wrap(doUnzip === "none"
        ? fileData
        : doUnzip === "gzip"
            ? zlib.gunzipSync(fileData)
            : zlib.inflateSync(fileData));

    return readRootTag(bb, Object.assign({}, IO, option.io));
}

function normalizeCompress(fileData: Uint8Array, compressed?: true | "deflate" | "gzip"): "none" | "gzip" | "deflate" {
    let doUnzip: "none" | "gzip" | "deflate";
    if (typeof compressed === "undefined") {
        const ft = fileType(fileData);
        doUnzip = ft !== undefined && ft.ext === "gz" ? "gzip" : "none";
    } else if (typeof compressed === "boolean" && compressed) {
        doUnzip = "gzip";
    } else {
        doUnzip = compressed;
    }
    return doUnzip;
}

function normalizeBuffer(buff: Uint8Array, compressed?: true | "deflate" | "gzip") {
    if (!compressed) { return buff; }
    if (compressed === "deflate") { return zlib.deflate(buff); }
    return zlib.gzip(buff);
}
function normalizeBufferSync(buff: Uint8Array, compressed?: true | "deflate" | "gzip") {
    if (!compressed) { return buff; }
    if (compressed === "deflate") { return zlib.deflateSync(buff); }
    return zlib.gzipSync(buff);
}

function readRootTag(buffer: ByteBuffer, io: ArrayLike<IO>) {
    const rootType = buffer.readByte();
    if (rootType === TagType.End) { throw new Error("NBTEnd"); }
    if (rootType !== TagType.Compound) { throw new Error("Root tag must be a named compound tag. " + rootType); }
    const name = readUTF8(buffer); // I think this is the nameProperty of the file...
    const context = new ReadContext(undefined);
    const value = io[TagType.Compound].read(buffer, context);
    return value;
}

function writeRootTag(value: any, type: Schema | undefined, filename: string, io: IO[]): Uint8Array {
    const buffer = new ByteBuffer();
    buffer.writeByte(TagType.Compound);
    writeUTF8(buffer, filename || "");

    const context = new WriteContext(type, 10);
    io[TagType.Compound].write(buffer, value, context);

    return buffer.flip().buffer.slice(0, buffer.limit);
}

interface Registry { getNBTPrototype(id: string | Constructor<any>): NBTPrototype | undefined }

export interface ContextTypeMetadata {
    schema: Schema;
    construct: Constructor<any>;
}

export class ReadContext {
    constructor(public valueType: Schema | undefined) { }

    fork(valueType: TagType | Schema) {
        if (typeof valueType === "number") { return new ReadContext(undefined); }
        return new ReadContext(valueType);
    }
}

export class WriteContext {
    constructor(readonly type: Schema | undefined, readonly tagType: TagType) {
    }

    fork(type: TagType | Schema): WriteContext {
        if (type === TagType.Compound) throw new Error("IllegalState");
        return new WriteContext(typeof type === "number" ? undefined : type, typeof type === "number" ? type : type instanceof Array ? TagType.List : TagType.Compound);
    }
}
