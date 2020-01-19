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
        let nbtPrototype: NBTPrototype = getPrototypeOf(targetClass.constructor);
        nbtPrototype[key] = type;
    };
}

/**
 * Construct the object from schema or constructor.
 *
 * - If pass-in value type is a schema object, it create a prototype with constructor constructing the object with this schema as NBTPrototype.
 * - If pass-in value is a constructor, it will try to take the NBTPrototype on the constructor to create object.
 */
function constructObject(valueType: CompoundSchema | Constructor<any> | undefined) {
    if (!valueType) { return {}; }
    const prot = typeof valueType === "object" ? createPrototypeFrom(valueType) : getPrototypeOf(valueType);
    return prot[NBTConstructor]();
}

function createPrototypeFrom(schema: CompoundSchema, constructor?: Constructor<any>): NBTPrototype {
    const proto: any = {
        ...schema,
    };
    Object.defineProperty(proto, NBTConstructor, {
        value: () => {
            let object: any;
            if (constructor) {
                try {
                    object = new constructor();
                } catch {
                    object = {};
                    Object.setPrototypeOf(object, constructor.prototype);
                }
            } else {
                object = {};
            }
            Object.defineProperty(object, NBTPrototype, { value: proto });
            return object;
        },
    });
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
        nbtPrototype = createPrototypeFrom({}, typeof object === "function" ? object as Constructor<any> : undefined);
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
            if (!object.hasOwnProperty(NBTPrototype)) {
                setPrototypeOf(object, target)
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
    Object.defineProperty(target, NBTPrototype, { value: nbtPrototype });
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
    { read: (buf) => buf.readByte(), write(buf, v = 0) { buf.writeByte(v); } }, // byte
    { read: (buf) => buf.readShort(), write(buf, v = 0) { buf.writeShort(v); } }, // short
    { read: (buf) => buf.readInt(), write(buf, v = 0) { buf.writeInt(v); } }, // int
    { read: (buf) => buf.readInt64(), write(buf, v = 0) { buf.writeInt64(v); } }, // long
    { read: (buf) => buf.readFloat(), write(buf, v = 0) { buf.writeFloat(v); } }, // float
    { read: (buf) => buf.readDouble(), write(buf, v = 0) { buf.writeDouble(v); } }, // double
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
    { read: (buf) => readUTF8(buf), write: (buf, v = "") => writeUTF8(buf, v) }, // string
    { // list
        read(buf, context) {
            const listType = buf.readByte();

            assertTag(listType);

            const len = buf.readInt();
            const list = new Array(len);

            if (context.schema) {
                assertListSchema(context.schema);
            }

            if (!!context.schema && typeof context.schema === "number" && listType !== context.schema) {
                // ignore the value if we know the type mismatched
                return list;
            }

            const childContext = context.fork(context.schema ? context.schema[0] : listType);
            const shouldInspectChildType = !childContext.schema;

            for (let i = 0; i < len; i++) {
                // console.log(`[read] ${shouldInspectChildType ? 'inspecting' : ''} -> [${i}]: ${JSON.stringify(nextContext.valueType)} ${TagType.getName(listType)}`);
                list[i] = IO[listType].read(buf, childContext);
                // console.log(`[read] ${shouldInspectChildType ? 'inspecting' : ''} <- [${i}]: ${JSON.stringify(nextContext.valueType)} ${TagType.getName(listType)} ${JSON.stringify(list[i])}`);
            }

            if (shouldInspectChildType) {
                context.schema = childContext.schema;
            }

            return list;
        },
        write(buf, value: any[] = [], context) {
            assertListSchema(context.schema);

            const valueType = context.schema[0];
            const childContext = context.fork(valueType);
            const tagType = childContext.tagType;
            const writer = IO[tagType];

            assertTag(tagType);

            if ((tagType === TagType.Compound || tagType === TagType.List) && !childContext.schema) {
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
            assertCompoundSchema(context.schema);

            const object: any = constructObject(context.schema); // create from constructor
            const nbtPrototype = getPrototypeOf(object);
            const knowingType = !!context.schema;

            for (let tag = 0; (tag = buf.readByte()) !== TagType.End;) {
                const reader = IO[tag];

                const key = readUTF8(buf);
                // not reader or illegal tag type
                assertTag(tag);

                let childContext: ReadContext;
                if (knowingType) {
                    const valueType = nbtPrototype[key];
                    // skip for undefined field or type not matched!
                    if (typeof valueType === "undefined" || (typeof valueType === "number" && valueType !== tag)) {
                        continue;
                    }
                    childContext = context.fork(valueType);
                } else {
                    childContext = context.fork(tag);
                }

                const shouldInspectChildType = !childContext.schema;
                // console.log(`[read] ${shouldInspectChildType ? 'inspecting' : ''} -> ${key}: ${JSON.stringify(childContext.valueType)} ${TagType.getName(childContext.tagType)} ${TagType.getName(tag)}`);
                object[key] = reader.read(buf, childContext);
                // console.log(`[read] ${shouldInspectChildType ? 'inspecting' : ''} <- ${key}: ${JSON.stringify(childContext.valueType)} ${TagType.getName(childContext.tagType)} ${TagType.getName(tag)} ${JSON.stringify(object[key])}`);
                if (shouldInspectChildType) {
                    nbtPrototype[key] = childContext.schema || childContext.tagType;
                }
            }
            if (!knowingType) {
                context.schema = nbtPrototype;
            }

            return object;
        },
        write(buf, object = {}, context) {
            assertCompoundSchema(context.schema);

            const schema: CompoundSchema = context.schema ? context.schema instanceof Function ? getPrototypeOf(context.schema) : context.schema : getPrototypeOf(object) as CompoundSchema;

            for (const [key, value] of Object.entries(object)) {
                const valueType = schema[key];

                if (typeof valueType === "undefined") {
                    // skip for undefined property
                    continue;
                }

                const childContext = context.fork(valueType);
                const tagType = childContext.tagType;
                const writer = IO[tagType];

                assertTag(tagType);

                if (!childContext.schema && (tagType === TagType.Compound || tagType === TagType.List)) {
                    // skip for undefined property
                    continue;
                }
                // console.log(`Write ${key}: ${TagType.getName(tagType)} ${JSON.stringify(childContext.schema)} ${childContext.schema} ${childContext.schema instanceof Array}`)
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

export interface DeserializationOption<T> {
    compressed?: true | "deflate" | "gzip";
    /**
     * IO override for serialization
     */
    io?: { [tagType: number]: IO };

    type?: Constructor<T>;
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
export async function deserialize<T>(fileData: Uint8Array, option: DeserializationOption<T> = {}): Promise<T> {
    const doUnzip = normalizeCompress(fileData, option.compressed);
    const bb = ByteBuffer.wrap(doUnzip === "none"
        ? fileData
        : doUnzip === "gzip"
            ? await zlib.ungzip(fileData)
            : await zlib.inflate(fileData));

    return readRootTag(bb, Object.assign({}, IO, option.io), option.type);
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
export function deserializeSync<T>(fileData: Uint8Array, option: DeserializationOption<T> = {}): T {
    const doUnzip = normalizeCompress(fileData, option.compressed);
    const bb = ByteBuffer.wrap(doUnzip === "none"
        ? fileData
        : doUnzip === "gzip"
            ? zlib.gunzipSync(fileData)
            : zlib.inflateSync(fileData));

    return readRootTag(bb, Object.assign({}, IO, option.io), option.type);
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

function readRootTag(buffer: ByteBuffer, io: ArrayLike<IO>, type?: Constructor<any>) {
    const rootType = buffer.readByte();
    if (rootType === TagType.End) { throw new Error("NBTEnd"); }
    if (rootType !== TagType.Compound) { throw new Error("Root tag must be a named compound tag. " + rootType); }
    const name = readUTF8(buffer); // I think this is the nameProperty of the file...
    const context = new ReadContext(type, TagType.Compound);
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

function assertListSchema<T>(v: T | T[]): asserts v is T[] {
    if (!(v instanceof Array)) {
        throw new Error("IllegalState");
    }
}
function assertCompoundSchema(v: Schema | undefined): asserts v is CompoundSchema | undefined {
    if (v instanceof Array) {
        throw new Error("IllegalState");
    }
}
function assertTag(v: number): asserts v is TagType {
    if (!isTagType(v)) {
        throw new Error("Unknown type " + v);
    }
}

export class ReadContext {
    constructor(public schema: Schema | undefined, public tagType: TagType) { }

    fork(schemaOrTagType: TagType | Schema) {
        if (typeof schemaOrTagType === "number") { return new ReadContext(undefined, schemaOrTagType); }
        return new ReadContext(schemaOrTagType, typeof schemaOrTagType === "number" ? schemaOrTagType : schemaOrTagType instanceof Array ? TagType.List : TagType.Compound);
    }
}

export class WriteContext {
    constructor(readonly schema: Schema | undefined, readonly tagType: TagType) {
    }

    fork(schemaOrTagType: TagType | Schema): WriteContext {
        if (schemaOrTagType === TagType.Compound) { throw new Error("IllegalState"); }
        return new WriteContext(
            typeof schemaOrTagType === "number" ? undefined : schemaOrTagType,
            typeof schemaOrTagType === "number" ? schemaOrTagType : schemaOrTagType instanceof Array ? TagType.List : TagType.Compound
        );
    }
}
