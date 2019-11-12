import ByteBuffer from "bytebuffer";
import fileType from "file-type";
import Long from "long";
import { readUTF8, writeUTF8 } from "./utils";

interface Zlib {
    gzip(buffer: Uint8Array): Promise<Uint8Array>;
    gzipSync(buffer: Uint8Array): Uint8Array;
    ungzip(buffer: Uint8Array): Promise<Uint8Array>;
    gunzipSync(buffer: Uint8Array): Uint8Array;
    deflate(buffer: Uint8Array): Promise<Uint8Array>;
    deflateSync(buffer: Uint8Array): Uint8Array;
    inflate(buffer: Uint8Array): Promise<Uint8Array>;
    inflateSync(buffer: Uint8Array): Uint8Array;
}

let zlib: Zlib;

export function setZlib(lib: Zlib) {
    zlib = lib;
}

export namespace NBT {
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
        readonly __nbtPrototype__: CompoundSchema;
        [key: string]: any;
    }

    export type Schema = ListSchema | CompoundSchema;
    export interface CompoundSchema { [key: string]: TagType | string | Schema; }
    export interface ListSchema extends Array<TagType | string | Schema> { }

    export type TypeIdentity = Schema | string | TagType;

    export class ReadContext {
        constructor(private scopeType: TypeIdentity, private reg: { [name: string]: string }) { }
        set type(s: TypeIdentity) { this.scopeType = s; }
        get type(): TypeIdentity { return this.scopeType; }
        findSchemaId(schema: Schema): string | undefined { return this.reg[JSON.stringify(schema)]; }
        fork(tagType: number): ReadContext {
            if (tagType < TagType.End || tagType > TagType.LongArray) { throw new Error(`Illegal Tag Type ${tagType}`); }
            return new ReadContext(tagType as TagType, this.reg);
        }
    }
    export class WriteContext {
        constructor(readonly type: Schema, private reg: { [id: string]: Schema }) { }
        findSchema(id: string): Schema | undefined { return this.reg[id]; }
        fork(type: Schema = {}): WriteContext { return new WriteContext(type, this.reg); }
    }

    export interface IO {
        read(buf: ByteBuffer, context: ReadContext): any;
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
                const object: any = {};
                const scope: CompoundSchema = {};
                for (let tag = 0; (tag = buf.readByte()) !== TagType.End;) {
                    const name = readUTF8(buf);
                    const visitor = handlers[tag];
                    if (!visitor) { throw new Error("No such tag id: " + tag); }
                    const child = context.fork(tag);
                    const value = visitor.read(buf, child);
                    object[name] = value;
                    scope[name] = child.type;
                }
                const existedType = context.findSchemaId(scope);
                context.type = existedType ? existedType : scope;
                return object;
            },
            write(buf, object = {}, context) {
                for (const [key, value] of Object.entries(object)) {
                    if (key === "___nbtPrototype___") { continue; }
                    const type = (context.type as CompoundSchema)[key];
                    let tagType: TagType;
                    let nextScope: Schema | undefined;

                    if (typeof type === "number") { // common enum type
                        tagType = type;
                    } else if (type instanceof Array) { // array type
                        tagType = TagType.List;
                        nextScope = type;
                    } else if (typeof type === "string") { // custom type
                        tagType = TagType.Compound;
                        nextScope = context.findSchema(type);
                        if (!nextScope) { throw new Error(`Unknown custom type [${type}]`); }
                    } else if (typeof type === "object") { // tagged compund type
                        tagType = TagType.Compound;
                        nextScope = type;
                    } else {
                        continue; // just ignore it if it's not on definition
                    }

                    const writer = handlers[tagType];
                    if (!writer) { throw new Error("Unknown type " + type); }
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

    function readRootTag(buffer: ByteBuffer, reg: { [id: string]: string } = {}, io: IO[] = handlers) {
        const rootType = buffer.readByte();
        if (rootType === TagType.End) { throw new Error("NBTEnd"); }
        if (rootType !== TagType.Compound) { throw new Error("Root tag must be a named compound tag. " + rootType); }
        const name = readUTF8(buffer); // I think this is the nameProperty of the file...
        const context = new ReadContext(TagType.Compound, reg);
        const value = io[TagType.Compound].read(buffer, context);
        return { type: context.type, value, name };
    }

    function writeRootTag(value: any, type: Schema, reg: { [id: string]: Schema }, filename: string, io: IO[]): Uint8Array {
        const buffer = new ByteBuffer();
        buffer.writeByte(NBT.TagType.Compound);
        writeUTF8(buffer, filename || "");

        const context = new WriteContext(type, reg);
        io[NBT.TagType.Compound].write(buffer, value, context);

        return buffer.flip().buffer.slice(0, buffer.limit);
    }

    export function createSerializer() {
        return new Serializer();
    }

    export class Serializer {
        private registry: { [id: string]: CompoundSchema } = {};
        private reversedRegistry: { [shape: string]: string } = {};

        getSchema(type: string) {
            return this.registry[type];
        }

        getType(schema: CompoundSchema) {
            return this.reversedRegistry[JSON.stringify(schema)];
        }
        /**
         * Register a new type nbt schema to the serializer
         * @param type The type name
         * @param schema The schema
         */
        register(type: string, schema: CompoundSchema): this {
            if (typeof schema !== "object" || schema === null) { throw new Error(); }
            this.registry[type] = schema;
            this.reversedRegistry[JSON.stringify(schema)] = type;
            return this;
        }
        /**
         * Serialize the object into the specific type
         * @param object The json object
         * @param type The registered nbt type
         * @param option The serialize option
         */
        async serialize(object: object, type: string, option: SerializationOption = {}) {
            const schema = this.registry[type];
            if (!schema) { throw new Error(`Unknown type [${type}]`); }

            const buff = writeRootTag(object, schema, this.registry, "", Object.assign({}, handlers, option.io));
            return normalizeBuffer(buff, option.compressed);
        }
        /**
         * Serialize the object into the specific type
         * @param object The json object
         * @param type The registered nbt type
         * @param compressed Should compress this nbt
         */
        serializeSync(object: object, type: string, option: SerializationOption = {}) {
            const schema = this.registry[type];
            if (!schema) { throw new Error(`Unknown type [${type}]`); }

            const buff = writeRootTag(object, schema, this.registry, "", Object.assign({}, handlers, option.io));
            return normalizeBufferSync(buff, option.compressed);
        }
        /**
         * Deserialize the nbt to json object directly
         * @param fileData The nbt data
         * @param compressed Does the data compressed
         */
        async deserialize(fileData: Uint8Array, option: SerializationOption = {}): Promise<{ value: any, type: any | string }> {
            const doUnzip = normalizeCompress(fileData, option.compressed);
            let bytebuffer: ByteBuffer;
            if (doUnzip !== "none") {
                bytebuffer = ByteBuffer.wrap(doUnzip === "gzip" ? await zlib.ungzip(fileData) : await zlib.inflate(fileData));
            } else {
                bytebuffer = ByteBuffer.wrap(fileData);
            }

            return readRootTag(bytebuffer, this.reversedRegistry, Object.assign({}, handlers, option.io));
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
}


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

export default NBT;
