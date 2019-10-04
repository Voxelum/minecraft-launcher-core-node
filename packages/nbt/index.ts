import ByteBuffer from "bytebuffer";
import fileType = require("file-type");
import Long from "long";
import { Optional } from "typescript-optional";
import * as zlib from "zlib";
import { readUTF8, writeUTF8 } from "./utils";

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
    export interface Tag<T extends TagType, V> {
        readonly type: T;
        readonly value: V;
    }
    export type TagEnd = Tag<typeof TagType.End, null>;
    export type TagByte = Tag<typeof TagType.Byte, number>;
    export type TagShort = Tag<typeof TagType.Short, number>;
    export type TagInt = Tag<typeof TagType.Int, number>;
    export type TagLong = Tag<typeof TagType.Long, Long>;
    export type TagFloat = Tag<typeof TagType.Float, number>;
    export type TagDouble = Tag<typeof TagType.Double, number>;
    export type TagByteArray = Tag<typeof TagType.ByteArray, Uint8Array>;
    export type TagString = Tag<typeof TagType.String, string>;
    export type TagIntArray = Tag<typeof TagType.IntArray, Int32Array>;
    export type TagLongArray = Tag<typeof TagType.LongArray, Long[]>;
    export type Tags =
        TagPrimitive |
        TagCompound |
        TagLists;
    export type TagPrimitive =
        TagEnd |
        TagByte |
        TagShort |
        TagInt |
        TagLong |
        TagFloat |
        TagDouble |
        TagByteArray |
        TagString |
        TagIntArray |
        TagLongArray;
    export type TagLists =
        TagList<TagByte> |
        TagList<TagShort> |
        TagList<TagInt> |
        TagList<TagLong> |
        TagList<TagFloat> |
        TagList<TagDouble> |
        TagList<TagByteArray> |
        TagList<TagString> |
        TagList<TagIntArray> |
        TagList<TagLongArray> |
        TagList<TagCompound> |
        TagListList |
        TagListTag;

    export interface TagListList extends TagList<TagLists> { }
    export interface TagListTag extends TagList<Tags> { }

    export interface TagList<T extends Tags> extends Tag<typeof TagType.List, void>, Array<T> {
        elementType: T["type"];
    }

    export interface TagCompound<T = any> extends Tag<typeof TagType.Compound, { [P in keyof T]: Tags }> {
        get(key: string): Tags;
        set(key: string, tag: Tags): boolean;
        has(key: string): boolean;

        setByte(key: string, value: number): this;
        setShort(key: string, value: number): this;
        setInt(key: string, value: number): this;
        setLong(key: string, value: Long): this;
        setFloat(key: string, value: number): this;
        setDouble(key: string, value: number): this;
        setByteArray(key: string, value: Uint8Array): this;
        setString(key: string, value: string): this;
        setIntArray(key: string, value: Int32Array): this;
        setLongArray(key: string, value: Long[]): this;

        getByte(key: string): Optional<number>;
        getShort(key: string): Optional<number>;
        getInt(key: string): Optional<number>;
        getLong(key: string): Optional<Long>;
        getFloat(key: string): Optional<number>;
        getDouble(key: string): Optional<number>;
        getByteArray(key: string): Optional<Uint8Array>;
        getString(key: string): Optional<string>;
        getIntArray(key: string): Optional<Int32Array>;
        getLongArray(key: string): Optional<Long[]>;
    }

    function badTag(tag: any): boolean {
        if (typeof tag.type !== "number") { return false; }
        if (!Number.isInteger(tag.type) || tag.type > 12 || tag.type < 0) { return false; }
        const tagType = tag.type;
        const value = tag.value;
        switch (tagType) {
            case TagType.Byte:
                return typeof value !== "number" || !Number.isInteger(value) || value < -0x80 || value > 0x7F;
            case TagType.Short:
                return typeof value !== "number" || !Number.isInteger(value) || value < -0x8000 || value > 0x7FFF;
            case TagType.Int:
                return typeof value !== "number" || !Number.isInteger(value) || value < -0x80000000 || value > 0x7FFFFFFF;
            case TagType.Long:
                return typeof value !== "object" || !(value instanceof Long) || value.unsigned;
            case TagType.Float:
            case TagType.Double:
                return typeof value !== "number";
            case TagType.ByteArray:
                return typeof value !== "object" || !(value instanceof Buffer);
            case TagType.String:
                return typeof value !== "string";
            case TagType.IntArray:
                return typeof value !== "object" || !(value instanceof Buffer) || value.length % 4 !== 0;
            case TagType.LongArray:
                return typeof value !== "object" || !(value instanceof Buffer) || value.length % 8 !== 0;
        }
        return true;
    }

    function badElementTag(v: any, etype: TagType) {
        if (badTag(v)) { return true; }
        if (v.type !== etype) { return true; }
        return false;
    }

    class TagListImpl<T extends Tags> extends Array<T> implements TagList<T> {
        type: 9 = 9;
        value: void;
        constructor(readonly elementType: T["type"], items: T[]) {
            super(...items);
            return new Proxy(this, {
                set(target, k, v) {
                    if (badElementTag(v, target.elementType)) { return false; }
                    return Reflect.set(target, k, v);
                },
            });
        }
        push(...items: T[]) {
            if (items.some((v) => badElementTag(v, this.elementType))) { return this.length; }
            return super.push(...items);
        }
        unshift(...items: T[]) {
            if (items.some((v) => badElementTag(v, this.elementType))) { return this.length; }
            return super.unshift(...items);
        }
    }

    class TagCompoundImpl<T extends { [key: string]: Tags; }> implements TagCompound<T> {
        type: 10 = 10;
        readonly value: T;
        constructor(value: T) {
            this.value = new Proxy(value, {
                set(target, k, v) {
                    if (badTag(v)) { return false; }
                    Reflect.set(target, k, v);
                    return true;
                },
            });
        }
        getByte(key: string): Optional<number> {
            return Optional.ofNullable(this.value[key])
                .filter((v) => v.type === TagType.Byte)
                .map((v) => v.value as number);
        }
        getShort(key: string): Optional<number> {
            return Optional.ofNullable(this.value[key])
                .filter((v) => v.type === TagType.Short)
                .map((v) => v.value as number);
        }
        getInt(key: string): Optional<number> {
            return Optional.ofNullable(this.value[key])
                .filter((v) => v.type === TagType.Int)
                .map((v) => v.value as number);
        }
        getLong(key: string): Optional<Long> {
            return Optional.ofNullable(this.value[key])
                .filter((v) => v.type === TagType.Long)
                .map((v) => v.value as Long);
        }
        getFloat(key: string): Optional<number> {
            return Optional.ofNullable(this.value[key])
                .filter((v) => v.type === TagType.Float)
                .map((v) => v.value as number);
        }
        getDouble(key: string): Optional<number> {
            return Optional.ofNullable(this.value[key])
                .filter((v) => v.type === TagType.Double)
                .map((v) => v.value as number);
        }
        getByteArray(key: string): Optional<Uint8Array> {
            return Optional.ofNullable(this.value[key])
                .filter((v) => v.type === TagType.ByteArray)
                .map((v) => v.value as Uint8Array);
        }
        getString(key: string): Optional<string> {
            return Optional.ofNullable(this.value[key])
                .filter((v) => v.type === TagType.String)
                .map((v) => v.value as string);
        }
        getIntArray(key: string): Optional<Int32Array> {
            return Optional.ofNullable(this.value[key])
                .filter((v) => v.type === TagType.IntArray)
                .map((v) => v.value as Int32Array);
        }
        getLongArray(key: string): Optional<Long[]> {
            return Optional.ofNullable(this.value[key])
                .filter((v) => v.type === TagType.LongArray)
                .map((v) => v.value as Long[]);
        }

        get(key: string): Tags { return Reflect.get(this.value, key); }
        set(key: string, tag: Tags): boolean { return Reflect.set(this.value, key, tag); }
        has(key: string): boolean { return Reflect.has(this.value, key); }

        setByte(key: string, value: number): this { this.set(key, tagByte(value)); return this; }
        setShort(key: string, value: number): this { this.set(key, tagShort(value)); return this; }
        setInt(key: string, value: number): this { this.set(key, tagInt(value)); return this; }
        setLong(key: string, value: Long): this { this.set(key, tagLong(value)); return this; }
        setFloat(key: string, value: number): this { this.set(key, tagFloat(value)); return this; }
        setDouble(key: string, value: number): this { this.set(key, tagDouble(value)); return this; }
        setByteArray(key: string, value: Uint8Array): this { this.set(key, tagByteArray(value)); return this; }
        setString(key: string, value: string): this { this.set(key, tagString(value)); return this; }
        setIntArray(key: string, value: Int32Array): this { this.set(key, tagIntArray(value)); return this; }
        setLongArray(key: string, value: Long[]): this { this.set(key, tagLongArray(value)); return this; }
    }

    export function tagPrimitive(type: TagTypePrimitive, value: any): TagPrimitive {
        return { type, value } as any;
    }
    export function tagCompound<T extends { [key: string]: Tags; }>(v: T): TagCompound<T> { return new TagCompoundImpl<T>(v); }
    export function tagList<T extends Tags>(elementType: T["type"], items: T[]): TagList<T> { return new TagListImpl<T>(elementType, items); }
    export function tagByte(value: number): TagByte { return { type: 1, value }; }
    export function tagShort(value: number): TagShort { return { type: 2, value }; }
    export function tagInt(value: number): TagInt { return { type: 3, value }; }
    export function tagLong(value: Long): TagLong { return { type: 4, value }; }
    export function tagFloat(value: number): TagFloat { return { type: 5, value }; }
    export function tagDouble(value: number): TagDouble { return { type: 6, value }; }
    export function tagByteArray(value: Uint8Array): TagByteArray { return { type: 7, value }; }
    export function tagString(value: string): TagString { return { type: 8, value }; }
    export function tagIntArray(value: Int32Array): TagIntArray { return { type: 11, value }; }
    export function tagLongArray(value: Long[]): TagLongArray { return { type: 12, value }; }


    export namespace Persistence {
        export interface ReadOptions {
            compressed?: boolean;
        }

        interface TypedObject {
            readonly __nbtPrototype__: CompoundSchema;
            [key: string]: any;
        }

        type Schema = ListSchema | CompoundSchema;
        interface CompoundSchema { [key: string]: TagType | string | Schema; }
        interface ListSchema extends Array<TagType | string | Schema> { }

        type TypeIdentity = Schema | string | TagType;

        class ReadContext {
            constructor(private scopeType: TypeIdentity, private reg: { [name: string]: string }) { }
            set type(s: TypeIdentity) { this.scopeType = s; }
            get type(): TypeIdentity { return this.scopeType; }
            findSchemaId(schema: Schema): string | undefined { return this.reg[JSON.stringify(schema)]; }
            fork(tagType: number): ReadContext {
                if (tagType < TagType.End || tagType > TagType.LongArray) { throw new Error(`Illegal Tag Type ${tagType}`); }
                return new ReadContext(tagType as TagType, this.reg);
            }
        }
        class WriteContext {
            constructor(readonly type: Schema, private reg: { [id: string]: Schema }) { }
            findSchema(id: string): Schema | undefined { return this.reg[id]; }
            fork(type: Schema = {}): WriteContext { return new WriteContext(type, this.reg); }
        }

        interface IO {
            read(buf: ByteBuffer, context: ReadContext): any;
            write(buf: ByteBuffer, value: any, context: WriteContext): void;

            readTag?(buf: ByteBuffer): Tags;
            writeTag?(buf: ByteBuffer, tags: Tags): void;
        }

        const handlers: IO[] = [
            { read: (buf) => undefined, write(buf, v) { } }, // end
            { read: (buf) => buf.readByte(), write(buf, v) { buf.writeByte(v ? v : 0); } }, // byte
            { read: (buf) => buf.readShort(), write(buf, v) { buf.writeShort(v ? v : 0); } }, // short
            { read: (buf) => buf.readInt(), write(buf, v) { buf.writeInt(v ? v : 0); } }, // int
            { read: (buf) => buf.readLong(), write(buf, v) { buf.writeInt64(v ? v : 0); } }, // long
            { read: (buf) => buf.readFloat(), write(buf, v) { buf.writeFloat(v ? v : 0); } }, // float
            { read: (buf) => buf.readDouble(), write(buf, v) { buf.writeDouble(v ? v : 0); } }, // double
            { // byte array
                read(buf) {
                    const arr = new Int8Array(buf.readInt());
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
                            nextScope = type as ListSchema;
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
                    const arr = new Int32Array(buf.readInt());
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
                    for (let i = 0; i < len; i++) { arr[i] = buf.readLong(); }
                    return arr;
                },
                write(buf, v = []) {
                    buf.writeInt(v.length);
                    for (let i = 0; i < v.length; i++) { buf.writeInt64(v[i]); }
                },
            },
        ];

        /**
         * Serialzie an nbt typed json object into NBT binary
         * @param object The json
         * @param compressed Should we compress it
         */
        export async function serialize(object: TypedObject, compressed?: boolean): Promise<Buffer> {
            return writeRootTag(object, object.__nbtPrototype__, {}, "", compressed || false);
        }

        /**
         * Deserialize the nbt binary into json
         * @param fileData The nbt binary
         * @param compressed Should we compress it
         */
        export async function deserialize(fileData: Buffer, compressed?: boolean): Promise<TypedObject> {
            const { value, type } = await readBuffer(fileData, compressed);
            deepFreeze(type);
            Object.defineProperty(value, "__nbtPrototype__", { value: type });
            return value;
        }

        export function readTagSync(fileData: Buffer): NBT.TagCompound<any> | undefined {
            return undefined;
        }

        async function readBuffer(fileData: Buffer, compressed?: boolean) {
            let doUnzip: boolean;
            if (typeof compressed === "undefined") {
                const ft = fileType(fileData);
                doUnzip = ft !== undefined && ft.ext === "gz";
            } else {
                doUnzip = compressed;
            }
            const bb = ByteBuffer.wrap(doUnzip ? await new Promise((resolve, reject) => {
                zlib.unzip(fileData, (err, r) => {
                    if (err) { reject(err); } else { resolve(r); }
                });
            }) : fileData);
            return readRootTag(bb);
        }

        function readRootTag(buffer: ByteBuffer, reg: { [id: string]: string } = {}) {
            const rootType = buffer.readByte();
            if (rootType === TagType.End) { throw new Error("NBTEnd"); }
            if (rootType !== TagType.Compound) { throw new Error("Root tag must be a named compound tag. " + rootType); }
            const name = readUTF8(buffer); // I think this is the nameProperty of the file...
            const context = new ReadContext(TagType.Compound, reg);
            const value = handlers[TagType.Compound].read(buffer, context);
            return { type: context.type, value, name };
        }

        async function writeRootTag(value: any, type: Schema, reg: { [id: string]: Schema }, filename?: string, compressed?: boolean): Promise<Buffer> {
            const buffer = new ByteBuffer();
            buffer.writeByte(NBT.TagType.Compound);
            writeUTF8(buffer, filename || "");

            const context = new WriteContext(type, reg);
            handlers[NBT.TagType.Compound].write(buffer, value, context);

            if (compressed) {
                return new Promise((resolve, reject) => {
                    zlib.gzip(buffer.flip().buffer.slice(0, buffer.limit), (e, r) => {
                        if (e) { reject(e); } else { resolve(r); }
                    });
                });
            } else {
                return buffer.flip().buffer.slice(0, buffer.limit);
            }
        }

        export function createSerializer() {
            return new Serializer();
        }

        export class Serializer {
            private registry: { [id: string]: CompoundSchema } = {};
            private reversedRegistry: { [shape: string]: string } = {};
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
             * @param compressed Should compress this nbt
             */
            serialize(object: object, type: string, compressed: boolean = false) {
                const schema = this.registry[type];
                if (!schema) { throw new Error(`Unknown type [${schema}]`); }

                return writeRootTag(object, schema, this.registry, "", compressed);
            }
            /**
             * Deserialize the nbt to json object directly
             * @param fileData The nbt data
             * @param compressed Does the data compressed
             */
            deserialize(fileData: Buffer, compressed: boolean = false): { value: any, type: any | string } {
                let doUnzip: boolean;
                if (typeof compressed === "undefined") {
                    const ft = fileType(fileData);
                    doUnzip = ft !== undefined && ft.ext === "gz";
                } else {
                    doUnzip = compressed;
                }
                if (doUnzip) {
                    const zip = zlib.unzipSync(fileData);
                    const bytebuffer = ByteBuffer.wrap(zip);
                    return readRootTag(bytebuffer, this.reversedRegistry);
                } else {
                    const bytebuffer = ByteBuffer.wrap(fileData);
                    return readRootTag(bytebuffer, this.reversedRegistry);
                }
            }
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
