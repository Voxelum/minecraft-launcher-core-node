import ByteBuffer from "bytebuffer";
import fileType from "file-type";
import Long from "long";
import { readUTF8, writeUTF8, zlib } from "./utils";

type Constructor<T> = new (...args: any) => T;

export const NBTAlias = Symbol("NBTAlias");
export const NBTPrototype = Symbol("NBTPrototype");

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

export function TagType<T>(type: TagType | string | Constructor<T>) {
    return (target: any, key: string) => {
        const prototype = target.constructor;
        if (!prototype[NBTPrototype]) {
            prototype[NBTPrototype] = {};
        }
        prototype[NBTPrototype][key] = type;
    };
}

export function TagTypeAlias(alias: string) {
    return (constructor: Function) => {
        const prototype = constructor.prototype;
        if (!prototype[NBTAlias]) {
            prototype[NBTAlias] = [];
        }
        prototype[NBTAlias].push(alias);
    };
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

    export function name(tagType: TagType) {
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

export interface TypedObject {
    readonly [NBTPrototype]: CompoundSchema;
    [key: string]: any;
}

export type Schema = ListSchema | CompoundSchema;
export interface CompoundSchema { [key: string]: TagType | string | Schema; }
export interface ListSchema extends Array<TagType | string | Schema> { }

export type TypeIdentity = Schema | string | TagType;


export interface IO {
    read(buf: ByteBuffer, context: InspectContext | KnownReadContext): any;
    write(buf: ByteBuffer, value: any, context: WriteContext): void;
}

const handlers: IO[] = [
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
            const len = buf.readInt();
            const list = new Array(len);
            const child = context.fork(listType);
            for (let i = 0; i < len; i++) {
                const value = handlers[listType].read(buf, child);
                list[i] = value;
            }
            context.type = [child.type];
            return list;
        },
        write(buf, value: any[] = [], context) {
            const type = (context.type as ListSchema)[0];
            switch (typeof type) {
                case "number": // type enum
                    buf.writeByte(type);
                    buf.writeInt(value.length);
                    for (const v of value) { handlers[type as number].write(buf, v, context); }
                    break;
                case "string": // custom registered type
                    const customScope = context.findSchema(type);
                    if (!customScope) { throw new Error(`Unknown custom type [${type}]`); }
                    buf.writeByte(customScope instanceof Array ? TagType.List : TagType.Compound);
                    buf.writeInt(value.length);
                    value.forEach((v) => handlers[TagType.Compound].write(buf, v, context.fork(customScope)));
                    break;
                case "object": // custom type
                    buf.writeByte(TagType.Compound);
                    buf.writeInt(value.length);
                    value.forEach((v) => handlers[TagType.Compound].write(buf, v, context.fork(type)));
                    break;
                default:
                    if (value.length !== 0) { throw new Error(`Unknown list type [${type}].`); }
                    buf.writeByte(TagType.End);
                    buf.writeInt(0);
            }
        },
    },
    {// tag compound
        read(buf, context) {
            if (context instanceof KnownReadContext) {
                const schema = context.reg.schema;
                const constructor = context.reg.construct;
                const object: any = new constructor(); // create from constructor

                const realSchema = { ...schema };

                for (let tag = 0; (tag = buf.readByte()) !== TagType.End;) {
                    const name = readUTF8(buf);
                    const reader = handlers[tag];
                    const expectedType = schema[name]
                    if (!reader) { throw new Error("No such tag id: " + tag); }

                    if (!expectedType) {
                        continue; // skip for undefined field in this mode!
                    }
                    if (typeof expectedType === "number") {
                        if (expectedType !== tag) {
                            continue; // skip for type not matched
                        }

                        const nextContext = new InspectContext(expectedType);
                        // wildcard
                        object[name] = reader.read(buf, nextContext);

                        realSchema[name] = nextContext.type;
                    } else {
                        const nextReg = context.getRegistry(expectedType);

                        if (!nextReg) {
                            throw new Error();
                        }
                        // create next level
                        const childContext = context.fork(nextReg);

                        object[name] = reader.read(buf, childContext);
                    }
                }

                Object.defineProperty(object, NBTPrototype, realSchema);
                return object;
            } else {
                const inspectSchema: CompoundSchema = {};

                const object: any = Object.create(null);
                for (let tag = 0; (tag = buf.readByte()) !== TagType.End;) {
                    const name = readUTF8(buf);
                    const reader = handlers[tag];
                    if (!reader) { throw new Error("No such tag id: " + tag); }

                    // create next level
                    const childContext = context.fork(tag);

                    const value = reader.read(buf, childContext);
                    object[name] = value;

                    inspectSchema[name] = childContext.type;
                }

                Object.defineProperty(object, NBTPrototype, inspectSchema);
                context.type = inspectSchema;
                return object;
            }
        },
        write(buf, object = {}, context) {
            const selfSchema = getPrototypeOf(object) || {};
            const schema: CompoundSchema = Object.assign({}, selfSchema, context.type);

            for (const [key, value] of Object.entries(object)) {
                const valueType = schema[key];
                let tagType: TagType;
                let nextScope: Schema | undefined;

                if (typeof valueType === "number") { // common enum type
                    tagType = valueType;
                } else if (valueType instanceof Array) { // array type
                    tagType = TagType.List;
                    nextScope = valueType;
                } else if (typeof valueType === "string") { // custom type
                    tagType = TagType.Compound;
                    nextScope = context.findSchema(valueType);
                    if (!nextScope) { throw new Error(`Unknown custom type [${valueType}]`); }
                } else if (typeof valueType === "object") { // tagged compund type
                    tagType = TagType.Compound;
                    nextScope = valueType;
                } else if (typeof valueType === "function") { // constuctor
                    if (value instanceof valueType) {
                        tagType = TagType.Compound;
                        nextScope = context.findSchema(valueType);
                    } else {
                        throw new Error(`Type mismatched! Expect ${Object.getPrototypeOf(valueType).constructor}. Got ${value}.`)
                    }
                } else {
                    continue; // just ignore it if it's not on definition
                }

                const writer = handlers[tagType];
                if (!writer) { throw new Error("Unknown type " + valueType); }
                buf.writeByte(tagType);
                writeUTF8(buf, key);
                try {
                    writer.write(buf, value, context.fork(nextScope));
                } catch (e) {
                    if (e instanceof TypeError) {
                        throw {
                            type: "IllegalInputType",
                            message: `Require ${TagType.name(tagType)} but found ${typeof value}`,
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
}

/**
 * Serialzie an nbt typed json object into NBT binary
 * @param object The json
 * @param compressed Should we compress it
 */
export async function serialize(object: TypedObject, option: SerializationOption = {}): Promise<Uint8Array> {
    const buff = writeRootTag(object, object.__nbtPrototype__, {}, "", Object.assign({}, handlers, option.io));
    return normalizeBuffer(buff, option.compressed);
}

/**
 * Deserialize the nbt binary into json
 * @param fileData The nbt binary
 */
export async function deserialize<T>(fileData: Uint8Array, option: SerializationOption = {}): Promise<T> {
    const doUnzip = normalizeCompress(fileData, option.compressed);
    const bb = ByteBuffer.wrap(doUnzip === "none"
        ? fileData
        : doUnzip === "gzip"
            ? await zlib.ungzip(fileData)
            : await zlib.inflate(fileData));

    const { value, type } = readRootTag(bb, undefined, Object.assign({}, handlers, option.io));
    deepFreeze(type);
    Object.defineProperty(value, "__nbtPrototype__", { value: type });
    return value;
}

/**
 * Serialzie an nbt typed json object into NBT binary
 * @param object The json
 */
export function serializeSync(object: TypedObject, option: SerializationOption = {}): Uint8Array {
    const buff = writeRootTag(object, object.__nbtPrototype__, {}, "", Object.assign({}, handlers, option.io));
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

    const { value, type } = readRootTag(bb, undefined, Object.assign({}, handlers, option.io));
    deepFreeze(type);
    Object.defineProperty(value, "__nbtPrototype__", { value: type });
    return value;
}

export function getPrototypeOf(object: object): CompoundSchema | undefined {
    return Reflect.get(object, NBTPrototype);
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

function readRootTag(buffer: ByteBuffer, io: IO[], preset?: { type: Constructor<any>, idToReg: { [id: string]: Registry }; typeToReg: Map<Constructor<any>, Registry>; }) {
    const rootType = buffer.readByte();
    if (rootType === TagType.End) { throw new Error("NBTEnd"); }
    if (rootType !== TagType.Compound) { throw new Error("Root tag must be a named compound tag. " + rootType); }
    const name = readUTF8(buffer); // I think this is the nameProperty of the file...
    const context = preset ? new KnownReadContext() : new InspectContext(TagType.Compound);
    const value = io[TagType.Compound].read(buffer, context);
    return { type: context.type, value, name };
}

function writeRootTag(value: any, type: Schema, reg: { [id: string]: Schema }, filename: string, io: IO[]): Uint8Array {
    const buffer = new ByteBuffer();
    buffer.writeByte(TagType.Compound);
    writeUTF8(buffer, filename || "");

    const context = new WriteContext(type, reg);
    io[TagType.Compound].write(buffer, value, context);

    return buffer.flip().buffer.slice(0, buffer.limit);
}

interface Registry {
    schema: CompoundSchema;
    construct: Constructor<any>;
}


export class InspectContext {
    constructor(public type: TypeIdentity) { }

    fork(tagType: number): InspectContext {
        if (tagType < TagType.End || tagType > TagType.LongArray) { throw new Error(`Illegal Tag Type ${tagType}`); }
        return new InspectContext(tagType as TagType);
    }
}

export class KnownReadContext {
    constructor(readonly reg: Registry, private properties: Record<string, Registry>, private conToReg: Map<Function, Registry>) {
    }

    getRegistry(type: TypeIdentity): Registry | undefined {
        if (typeof type === "string") {
            return this.properties[type];
        }
    }

    fork(reg: Registry) {
        return new KnownReadContext(reg, this.properties, this.conToReg);
    }
}

export class WriteContext {
    constructor(readonly type: Schema, private reg: { [id: string]: Schema }) { }
    findSchema(id: string): Schema | undefined {
        return this.reg[id];
    }
    fork(type: Schema = {}): WriteContext {
        return new WriteContext(type, this.reg);
    }
}
export class Serializer {
    private idToReg: { [id: string]: Registry } = {};
    private typeToReg: Map<Constructor<any>, Registry> = new Map();

    getSchema(type: string) {
        return this.idToReg[type];
    }

    register<T>(type: Constructor<T>): this {
        if (this.typeToReg.has(type)) {
            return this;
        }
        const schema = Reflect.get(type, NBTPrototype);
        const typeDefinition: Record<string, any> = {};
        for (const f of schema) {
            const type = f.type;
            if (typeof type === "number" || typeof type === "string") {
                typeDefinition[f.name] = type;
            } else if (typeof type === "function") {
                this.register(type);
                typeDefinition[f.name] = type.name;
            }
        }
        const newReg = {
            schema: typeDefinition,
            construct: type,
        };
        this.idToReg[type.name] = newReg;
        const alias = Reflect.get(type, NBTAlias) || [];
        for (const a of alias) {
            this.idToReg[a as string] = newReg;
        }
        this.typeToReg.set(type, newReg);
        return this;
    }

    /**
     * Serialize the object into the specific type
     * @param object The json object
     * @param type The registered nbt type
     * @param option The serialize option
     */
    async serialize<T>(object: T, option: SerializationOption & { type?: string | Constructor<T> } = {}) {
        const type = option.type || Object.getPrototypeOf(object).name;
        const schema = this.idToReg[type];
        if (!schema) { throw new Error(`Unknown type [${type}]`); }

        const buff = writeRootTag(object, schema.schema, this.idToReg, "", Object.assign({}, handlers, option.io));
        return normalizeBuffer(buff, option.compressed);
    }
    /**
     * Serialize the object into the specific type
     * @param object The json object
     * @param type The registered nbt type
     * @param compressed Should compress this nbt
     */
    serializeSync<T>(object: T, option: SerializationOption & { type?: string | Constructor<T> } = {}) {
        const type = option.type || Object.getPrototypeOf(object).name;
        const schema = this.idToReg[type];
        if (!schema) { throw new Error(`Unknown type [${type}]`); }

        const buff = writeRootTag(object, schema, this.idToReg, "", Object.assign({}, handlers, option.io));
        return normalizeBufferSync(buff, option.compressed);
    }
    /**
     * Deserialize the nbt to json object directly
     * @param fileData The nbt data
     * @param compressed Does the data compressed
     */
    async deserialize<T>(fileData: Uint8Array, type: Constructor<T> | string, option: SerializationOption = {}): Promise<T> {
        const doUnzip = normalizeCompress(fileData, option.compressed);
        let bytebuffer: ByteBuffer;
        if (doUnzip !== "none") {
            bytebuffer = ByteBuffer.wrap(doUnzip === "gzip" ? await zlib.ungzip(fileData) : await zlib.inflate(fileData));
        } else {
            bytebuffer = ByteBuffer.wrap(fileData);
        }

        const { value } = readRootTag(bytebuffer, Object.assign({}, handlers, option.io));
    }
    /**
     * Deserialize the nbt to json object directly
     * @param fileData The nbt data
     * @param compressed Does the data compressed
     */
    deserializeSync(fileData: Uint8Array, option: SerializationOption = {}): { value: any, type: any | string } {
        const doUnzip = normalizeCompress(fileData, option.compressed);
        let bytebuffer: ByteBuffer;
        if (doUnzip !== "none") {
            bytebuffer = ByteBuffer.wrap(doUnzip === "gzip" ? zlib.gunzipSync(fileData) : zlib.inflateSync(fileData));
        } else {
            bytebuffer = ByteBuffer.wrap(fileData);
        }

        return readRootTag(bytebuffer, this.reversedRegistry, Object.assign({}, handlers, option.io));
    }
}

class Nested {
    @TagType(TagType.Int)
    oneInt: number = 0;
}

@TagTypeAlias("abc")
class MyNBTType {
    @TagType(TagType.String)
    oneString: string = "";

    @TagType(Nested)
    oneNested: Nested | undefined;
}

const serializer = new Serializer().register(MyNBTType);

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
function deepFreeze(obj: any) {
    // Retrieve the property names defined on obj
    const propNames = Object.getOwnPropertyNames(obj);
    // Freeze properties before freezing self
    propNames.forEach((name) => {
        const prop = obj[name];
        // Freeze prop if it is an object
        if (typeof prop === "object" && prop !== null) {
            deepFreeze(prop);
        }
    });
    // Freeze self (no-op if already frozen)
    return Object.freeze(obj);
}
