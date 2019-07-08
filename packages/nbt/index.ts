import * as ByteBuffer from "bytebuffer";
import * as Long from "long";
import * as zlib from "zlib";
import { readUTF8, writeUTF8 } from "./utils";

import fileType = require("file-type");
/**
 * @author yuxuanchiadm
 * @author ci010
 */
export namespace NBT {
    export enum TagType {
        End = 0, Byte = 1, Short = 2, Int = 3, Long = 4, Float = 5, Double = 6,
        ByteArray = 7, String = 8, List = 9, Compound = 10, IntArray = 11, LongArray = 12,
    }

    export type ScalarTypes = number | Long | string | Buffer;
    export type Tag = TagByte | TagShort | TagInt | TagLong | TagFloat | TagDouble | TagByteArray | TagString | TagAnyList | TagCompound | TagIntArray | TagLongArray | TagEnd;
    export type TagByte = TagScalar<number> & { tagType: TagType.Byte };
    export type TagShort = TagScalar<number> & { tagType: TagType.Short };
    export type TagInt = TagScalar<number> & { tagType: TagType.Int };
    export type TagLong = TagScalar<Long> & { tagType: TagType.Long };
    export type TagFloat = TagScalar<number> & { tagType: TagType.Float };
    export type TagDouble = TagScalar<number> & { tagType: TagType.Double };
    export type TagByteArray = TagScalar<Buffer> & { tagType: TagType.ByteArray };
    export type TagString = TagScalar<string> & { tagType: TagType.String };
    export type TagIntArray = TagScalar<Buffer> & { tagType: TagType.IntArray };
    export type TagLongArray = TagScalar<Buffer> & { tagType: TagType.LongArray };
    export type TagAnyList = TagList<TagByte> | TagList<TagShort> | TagList<TagInt> | TagList<TagLong> | TagList<TagFloat> | TagList<TagDouble> | TagList<TagByteArray> | TagList<TagString>
        | TagList<TagList<TagBase>> | TagList<TagCompound> | TagList<TagIntArray> | TagList<TagLongArray>;

    function a(tag: Tag) {
        if (tag.tagType === TagType.List) {
            if (tag.elementTagType === TagType.List) {
                tag.push();
            }
        }
    }

    export abstract class TagBase {
        abstract readonly tagType: TagType;
    }

    export class TagEnd extends TagBase {
        readonly tagType = TagType.End;
    }

    export const TAG_END = new TagEnd();

    export class TagScalar<T extends ScalarTypes> extends TagBase {
        public static newByte(value: number): TagByte { return new TagScalar(TagType.Byte, value) as TagByte; }
        public static newShort(value: number): TagShort { return new TagScalar(TagType.Short, value) as TagShort; }
        public static newInt(value: number): TagInt { return new TagScalar(TagType.Int, value) as TagInt; }
        public static newLong(value: Long): TagLong { return new TagScalar(TagType.Long, value) as TagLong; }
        public static newFloat(value: number): TagFloat { return new TagScalar(TagType.Float, value) as TagFloat; }
        public static newDouble(value: number): TagDouble { return new TagScalar(TagType.Double, value) as TagDouble; }
        public static newByteArray(value: Buffer): TagByteArray { return new TagScalar(TagType.ByteArray, value) as TagByteArray; }
        public static newString(value: string): TagString { return new TagScalar(TagType.String, value) as TagString; }
        public static newIntArray(value: Buffer): TagIntArray { return new TagScalar(TagType.IntArray, value) as TagIntArray; }
        public static newLongArray(value: Buffer): TagLongArray { return new TagScalar(TagType.LongArray, value) as TagLongArray; }
        public static newScalar<S extends ScalarTypes>(tagType: TagType, value: S): TagScalar<S> { return new TagScalar(tagType, value); }

        private static checkTagValue(tagType: TagType, value: ScalarTypes): void {
            if (tagType === TagType.End || tagType === TagType.List || tagType === TagType.Compound) {
                throw new TypeError("Illegal tagType");
            } else if (typeof value === "undefined") {
                throw new TypeError("Illegal value");
            } else if (value === null) {
                throw new TypeError("Illegal value");
            } else {
                switch (tagType) {
                    case TagType.Byte:
                        if (typeof value !== "number" || !Number.isInteger(value) || value < -0x80 || value > 0x7F) {
                            throw new TypeError("Illegal value");
                        }
                        break;
                    case TagType.Short:
                        if (typeof value !== "number" || !Number.isInteger(value) || value < -0x8000 || value > 0x7FFF) {
                            throw new TypeError("Illegal value");
                        }
                        break;
                    case TagType.Int:
                        if (typeof value !== "number" || !Number.isInteger(value) || value < -0x80000000 || value > 0x7FFFFFFF) {
                            throw new TypeError("Illegal value");
                        }
                        break;
                    case TagType.Long:
                        if (typeof value !== "object" || !(value instanceof Long) || value.unsigned) {
                            throw new TypeError("Illegal value");
                        }
                        break;
                    case TagType.Float:
                    case TagType.Double:
                        if (typeof value !== "number") {
                            throw new TypeError("Illegal value");
                        }
                        break;
                    case TagType.ByteArray:
                        if (typeof value !== "object" || !(value instanceof Buffer)) {
                            throw new TypeError("Illegal value");
                        }
                        break;
                    case TagType.String:
                        if (typeof value !== "string") {
                            throw new TypeError("Illegal value");
                        }
                        break;
                    case TagType.IntArray:
                        if (typeof value !== "object" || !(value instanceof Buffer) || value.length % 4 !== 0) {
                            throw new TypeError("Illegal value");
                        }
                        break;
                    case TagType.LongArray:
                        if (typeof value !== "object" || !(value instanceof Buffer) || value.length % 8 !== 0) {
                            throw new TypeError("Illegal value");
                        }
                        break;
                }
            }
        }
        protected scalarValue: T;

        protected constructor(readonly tagType: TagType, value: T) {
            super();
            this.scalarValue = value;
        }
        get value(): T {
            return this.scalarValue;
        }

        set value(value: T) {
            TagScalar.checkTagValue(this.tagType, value);
            this.scalarValue = value;
        }
    }

    export class TagList<T extends TagBase, E = T["tagType"]> extends TagBase implements Iterable<T> {
        public static newByteList(): TagList<TagByte> { return new TagList<any>(TagType.Byte); }
        public static newShortList(): TagList<TagShort> { return new TagList<any>(TagType.Short); }
        public static newIntList(): TagList<TagInt> { return new TagList<any>(TagType.Int); }
        public static newLongList(): TagList<TagLong> { return new TagList<any>(TagType.Long); }
        public static newFloatList(): TagList<TagFloat> { return new TagList<any>(TagType.Float); }
        public static newDoubleList(): TagList<TagDouble> { return new TagList<any>(TagType.Double); }
        public static newByteArrayList(): TagList<TagByteArray> { return new TagList<any>(TagType.ByteArray); }
        public static newStringList(): TagList<TagString> { return new TagList<any>(TagType.String); }
        public static newListList(): TagList<TagAnyList> { return new TagList<any>(TagType.List); }
        public static newListCompound(): TagList<TagCompound> { return new TagList<any>(TagType.Compound); }
        public static newIntArrayList(): TagList<TagIntArray> { return new TagList<any>(TagType.IntArray); }
        public static newLongArrayList(): TagList<TagLongArray> { return new TagList<any>(TagType.LongArray); }
        public static newAnyList(elementTagType: TagType): TagAnyList {
            if (elementTagType === TagType.End) {
                throw new TypeError("Illegal element tag type");
            }
            return new TagList<any>(elementTagType);
        }
        [index: number]: T;

        private static checkElement(element: TagBase, elementTagType: TagType): boolean {
            return element !== null && element !== undefined && element.tagType === elementTagType;
        }
        readonly tagType = TagType.List;
        protected readonly list: T[] = [];
        get length(): number {
            return this.list.length;
        }

        set length(length: number) {
            if (length < 0 || length > this.list.length) {
                throw new RangeError("Illegal length");
            }
            this.list.length = length;
        }
        protected constructor(readonly elementTagType: E) {
            super();
            return new Proxy(this, {
                has(target: TagList<T, E>, p: PropertyKey): boolean {
                    if (typeof p === "string") {
                        const n: number = Number(p);
                        if (!Number.isInteger(n) || n < 0) {
                            return Reflect.has(target, p);
                        }
                        p = n;
                    } else if (typeof p !== "number") {
                        return Reflect.has(target, p);
                    }
                    return p >= 0 && p < target.list.length;
                },
                get(target: TagList<T, E>, p: PropertyKey, receiver: any): any {
                    if (typeof p === "string") {
                        const n: number = Number(p);
                        if (!Number.isInteger(n) || n < 0) {
                            return Reflect.get(target, p, receiver);
                        }
                        p = n;
                    } else if (typeof p !== "number") {
                        return Reflect.get(target, p, receiver);
                    }
                    if (p < 0 || p >= target.list.length) {
                        return undefined;
                    }
                    return target.list[p];
                },
                set(target: TagList<T, E>, p: PropertyKey, value: any, receiver: any): boolean {
                    if (typeof p === "string") {
                        const n: number = Number(p);
                        if (!Number.isInteger(n) || n < 0) {
                            return Reflect.set(target, p, value, receiver);
                        }
                        p = n;
                    } else if (typeof p !== "number") {
                        return Reflect.set(target, p, value, receiver);
                    }
                    if (p < 0 || p > target.list.length) {
                        return false;
                    }
                    if (typeof value !== "object" || !(value instanceof TagBase)) {
                        return false;
                    }
                    if (!TagList.checkElement(value, target.elementTagType)) {
                        return false;
                    }
                    target.list[p] = value as T;
                    return true;
                },
            });
        }

        public push(...items: T[]): number {
            for (let i: number = 0; i < items.length; i++) {
                const value: T = items[i];
                if (typeof value !== "object" || !(value instanceof TagBase)) {
                    throw new TypeError("Illegal element");
                }
                if (!TagList.checkElement(value, this.elementTagType)) {
                    throw new TypeError("Illegal element");
                }
            }
            return Array.prototype.push.apply(this.list, items);
        }

        public pop(): T | undefined {
            return this.list.pop();
        }

        public shift(): T | undefined {
            return this.list.shift();
        }

        public unshift(...items: T[]): number {
            for (let i: number = 0; i < items.length; i++) {
                const value: T = items[i];
                if (typeof value !== "object" || !(value instanceof TagBase)) {
                    throw new TypeError("Illegal element");
                }
                if (!TagList.checkElement(value, this.elementTagType)) {
                    throw new TypeError("Illegal element");
                }
            }
            return Array.prototype.unshift.apply(this.list, items);
        }

        public add(value: T): this {
            if (typeof value !== "object" || !(value instanceof TagBase)) {
                throw new TypeError("Illegal element");
            }
            if (!TagList.checkElement(value, this.elementTagType)) {
                throw new TypeError("Illegal element");
            }
            this.list.push(value);
            return this;
        }

        public clear(): void {
            this.list.length = 0;
        }

        public pushScalar<S extends ScalarTypes>(this: TagList<TagScalar<S>> & this, ...items: S[]): number {
            const scalars: T[] = [];
            for (let i: number = 0; i < items.length; i++) {
                const value: T = TagScalar.newScalar(this.elementTagType, items[i]);
                scalars.push(value);
            }
            return TagList.prototype.push.apply(this, scalars);
        }

        public popScalar<S extends ScalarTypes>(this: TagList<TagScalar<S>> & this): S | undefined {
            const value: TagScalar<S> | undefined = this.pop();
            if (value === undefined) {
                return undefined;
            }
            return value.value;
        }

        public shiftScalar<S extends ScalarTypes>(this: TagList<TagScalar<S>> & this): S | undefined {
            const value: TagScalar<S> | undefined = this.shift();
            if (value === undefined) {
                return undefined;
            }
            return value.value;
        }

        public unshiftScalar<S extends ScalarTypes>(this: TagList<TagScalar<S>> & this, ...items: S[]): number {
            const scalars: T[] = [];
            for (let i: number = 0; i < items.length; i++) {
                const value: T = TagScalar.newScalar(this.elementTagType, items[i]) as any;
                scalars.push(value);
            }
            return TagList.prototype.unshift.apply(this, scalars);
        }

        public addScalar<S extends ScalarTypes>(this: TagList<TagScalar<S>> & this, value: S): this {
            this.add(TagScalar.newScalar(this.elementTagType, value));
            return this;
        }

        public *[Symbol.iterator](): IterableIterator<T> {
            for (let i: number = 0; i < this.list.length; i++) {
                yield this.list[i];
            }
        }
    }

    export interface TagCompoundAccessor { [key: string]: Tag; }

    export class TagCompound extends TagBase implements Iterable<[string, Tag]> {

        get size(): number {
            return this.tagSize;
        }

        public static newCompound(): TagCompound { return new TagCompound(); }

        private static checkValue(value: Tag): boolean {
            return value !== null && value !== undefined && value.tagType !== TagType.End;
        }
        readonly tagType = TagType.Compound;

        public readonly accessor: TagCompoundAccessor;
        protected readonly map: { [key: string]: Tag } = Object.create(null);
        protected tagSize: number = 0;

        protected constructor() {
            super();
            const tagCompound: this = this;
            this.accessor = new Proxy(Object.create(null), {
                has(target: TagCompoundAccessor, p: PropertyKey): boolean {
                    if (typeof p !== "string") {
                        return Reflect.has(target, p);
                    }
                    return tagCompound.has(p);
                },
                get(target: TagCompoundAccessor, p: PropertyKey, receiver: any): any {
                    if (typeof p !== "string") {
                        return Reflect.get(target, p, receiver);
                    }
                    return tagCompound.get(p);
                },
                set(target: TagCompoundAccessor, p: PropertyKey, value: any, receiver: any): boolean {
                    if (typeof p !== "string") {
                        return Reflect.set(target, p, value, receiver);
                    }
                    if (typeof value !== "object" || !(value as Tag instanceof TagBase)) {
                        return false;
                    }
                    if (!TagCompound.checkValue(value)) {
                        return false;
                    }
                    tagCompound.set(p, value);
                    return true;
                },
                deleteProperty(target: TagCompoundAccessor, p: PropertyKey): boolean {
                    if (typeof p !== "string") {
                        return Reflect.deleteProperty(target, p);
                    }
                    tagCompound.delete(p);
                    return true;
                },
            });
        }

        public *[Symbol.iterator](): IterableIterator<[string, Tag]> {
            for (const key in this.map) {
                yield [key, this.map[key]];
            }
        }

        public clear(): void {
            for (const key in this.map) {
                delete this.map[key];
            }
            this.tagSize = 0;
        }

        public delete(key: string): boolean {
            if (!(key in this.map)) {
                return false;
            }
            delete this.map[key];
            this.tagSize--;
            return true;
        }

        public get(key: string): Tag | undefined {
            return this.map[key];
        }

        public has(key: string): boolean {
            return key in this.map;
        }

        public set(key: string, value: Tag): this {
            if (typeof value !== "object" || !(value instanceof TagBase)) {
                throw new TypeError("Illegal value");
            }
            if (!TagCompound.checkValue(value)) {
                throw new TypeError("Illegal value");
            }
            if (!(key in this.map)) {
                this.tagSize++;
            }
            this.map[key] = value;
            return this;
        }
    }

    export namespace Persistence {
        interface IOHandler<T extends TagBase> {
            read(buf: ByteBuffer): T;
            write(buf: ByteBuffer, tag: T): void;
        }

        const handlers: { readonly [key: number]: IOHandler<TagBase> | undefined } = {
            [TagType.End]: {
                read(buf) { return TAG_END; },
                write(buf, tag) { },
            } as IOHandler<TagEnd>,
            [TagType.Byte]: {
                read(buf) { return TagScalar.newByte(buf.readInt8()); },
                write(buf, tag) { buf.writeInt8(tag.value); },
            } as IOHandler<TagByte>,
            [TagType.Short]: {
                read(buf) { return TagScalar.newShort(buf.readInt16()); },
                write(buf, tag) { buf.writeInt16(tag.value); },
            } as IOHandler<TagShort>,
            [TagType.Int]: {
                read(buf) { return TagScalar.newInt(buf.readInt32()); },
                write(buf, tag) { buf.writeInt32(tag.value); },
            } as IOHandler<TagInt>,
            [TagType.Long]: {
                read(buf) { return TagScalar.newLong(buf.readInt64()); },
                write(buf, tag) { buf.writeInt64(tag.value as any); },
            } as IOHandler<TagLong>,
            [TagType.Float]: {
                read(buf) { return TagScalar.newFloat(buf.readFloat32()); },
                write(buf, tag) { buf.writeFloat32(tag.value); },
            } as IOHandler<TagFloat>,
            [TagType.Double]: {
                read(buf) { return TagScalar.newDouble(buf.readFloat64()); },
                write(buf, tag) { buf.writeFloat64(tag.value); },
            } as IOHandler<TagDouble>,
            [TagType.ByteArray]: {
                read(buf) {
                    const len: number = buf.readInt32();
                    if (len < 0) {
                        throw new RangeError("Illegal size");
                    }
                    const bytes: number = len;
                    const array: Buffer = Buffer.from(buf.slice(buf.offset, buf.offset + bytes).toArrayBuffer(true));
                    buf.skip(bytes);
                    return TagScalar.newByteArray(array);
                },
                write(buf, tag) {
                    const array: Buffer = tag.value;
                    const bytes: number = array.length;
                    const len = bytes;
                    buf.writeInt32(len);
                    buf.append(ByteBuffer.wrap(array));
                },
            } as IOHandler<TagByteArray>,
            [TagType.String]: {
                read(buf) { return TagScalar.newString(readUTF8(buf)); },
                write(buf, tag) { writeUTF8(buf, tag.value); },
            } as IOHandler<TagString>,
            [TagType.List]: {
                read(buf) {
                    const elementTagTypeByte: number = buf.readInt8();
                    const elementTagType: TagType = readTagType(elementTagTypeByte);
                    if (elementTagType === TagType.End) {
                        throw new Error("Illegal element tag type");
                    }
                    const len: number = buf.readInt32();
                    if (len < 0) {
                        throw new RangeError("Illegal size");
                    }
                    const tag: TagAnyList = TagList.newAnyList(elementTagType);
                    for (let i: number = 0; i < len; i++) {
                        const element: TagBase = ofHandler<TagBase>(elementTagType).read(buf);
                        tag[i] = element;
                    }
                    return tag;
                },
                write(buf, tag) {
                    const elementTagType: TagType = tag.elementTagType;
                    const elementTagTypeByte: number = writeTagType(elementTagType);
                    buf.writeInt8(elementTagTypeByte);
                    const len: number = tag.length;
                    buf.writeInt32(len);
                    for (let i: number = 0; i < len; i++) {
                        const element: TagBase = tag[i];
                        ofHandler<TagBase>(elementTagType).write(buf, element);
                    }
                },
            } as IOHandler<TagAnyList>,
            [TagType.Compound]: {
                read(buf) {
                    const tag: TagCompound = TagCompound.newCompound();
                    for (let tagHead: TagHead = readTagHead(buf), tagType: TagType = tagHead.tagType;
                        tagType !== TagType.End;
                        tagHead = readTagHead(buf), tagType = tagHead.tagType) {
                        const key: string = tagHead.tagName;
                        const value: Tag = ofHandler<Tag>(tagType).read(buf);
                        tag.set(key, value);
                    }
                    ofHandler<TagEnd>(TagType.End).read(buf);
                    return tag;
                },
                write(buf, tag) {
                    for (const [key, value] of tag) {
                        const tagType: TagType = value.tagType;
                        writeTagHead(buf, { tagType, tagName: key });
                        ofHandler<TagBase>(tagType).write(buf, value);
                    }
                    writeTagHead(buf, { tagType: TagType.End, tagName: "" });
                    ofHandler<TagEnd>(TagType.End).write(buf, TAG_END);
                },
            } as IOHandler<TagCompound>,
            [TagType.IntArray]: {
                read(buf) {
                    const len: number = buf.readInt32();
                    if (len < 0) {
                        throw new RangeError("Illegal size");
                    }
                    const bytes: number = len * 4;
                    const array: Buffer = Buffer.from(buf.slice(buf.offset, buf.offset + bytes).toArrayBuffer(true));
                    buf.skip(bytes);
                    return TagScalar.newIntArray(array);
                },
                write(buf, tag) {
                    const array: Buffer = tag.value;
                    const bytes: number = array.length;
                    if (bytes % 4 !== 0) {
                        throw new Error("Illegal buffer length");
                    }
                    const len: number = bytes / 4;
                    buf.writeInt32(len);
                    buf.append(ByteBuffer.wrap(array));
                },
            } as IOHandler<TagIntArray>,
            [TagType.LongArray]: {
                read(buf) {
                    const len: number = buf.readInt32();
                    if (len < 0) {
                        throw new RangeError("Illegal size");
                    }
                    const bytes: number = len * 8;
                    const array: Buffer = Buffer.from(buf.slice(buf.offset, buf.offset + bytes).toArrayBuffer(true));
                    buf.skip(bytes);
                    return TagScalar.newLongArray(array);
                },
                write(buf, tag) {
                    const array: Buffer = tag.value;
                    const bytes: number = array.length;
                    if (bytes % 8 !== 0) {
                        throw new Error("Illegal buffer length");
                    }
                    const len: number = bytes / 8;
                    buf.writeInt32(len);
                    buf.append(ByteBuffer.wrap(array));
                },
            } as IOHandler<TagLongArray>,
        };

        function ofHandler<T extends TagBase>(tagType: TagType): IOHandler<T> {
            const handler: IOHandler<TagBase> | undefined = handlers[tagType];
            if (handler === undefined) {
                throw new Error("No IO handler founded");
            }
            return handler as IOHandler<T>;
        }

        export interface ReadOptions {
            compressed?: boolean;
        }

        export function readRoot(buffer: Buffer, options?: ReadOptions): TagCompound {
            if (options !== undefined) {
                if (options.compressed !== undefined && options.compressed) {
                    buffer = zlib.unzipSync(buffer);
                }
            }
            const byteBuffer = ByteBuffer.wrap(buffer);
            const rootTagHead: TagHead = readTagHead(byteBuffer);
            if (rootTagHead.tagType !== TagType.Compound) {
                throw new Error("Root tag must be compound");
            }
            if (rootTagHead.tagName !== "") {
                throw new Error("Root tag name must be empty");
            }
            const rootTag: TagCompound = ofHandler<TagCompound>(TagType.Compound).read(byteBuffer);
            return rootTag;
        }

        export interface WriteOptions {
            compressed?: boolean;
        }

        export function writeRoot(rootTag: TagCompound, options?: WriteOptions): Buffer {
            const byteBuffer: ByteBuffer = new ByteBuffer();
            const rootTagHead: TagHead = { tagType: rootTag.tagType, tagName: "" };
            writeTagHead(byteBuffer, rootTagHead);
            ofHandler<TagCompound>(TagType.Compound).write(byteBuffer, rootTag);
            let buffer: Buffer = Buffer.from(byteBuffer.flip().toArrayBuffer());
            if (options !== undefined) {
                if (options.compressed !== undefined && options.compressed) {
                    buffer = zlib.gzipSync(buffer);
                }
            }
            return buffer;
        }

        function readTagType(tagTypeByte: number): TagType {
            if (tagTypeByte < 0 || tagTypeByte > 12) {
                throw new Error("Illegal tag type");
            }
            return tagTypeByte;
        }

        function writeTagType(tagType: TagType): number {
            const tagTypeByte = tagType;
            return tagTypeByte;
        }

        interface TagHead {
            tagType: TagType;
            tagName: string;
        }

        function readTagHead(buf: ByteBuffer): TagHead {
            const tagTypeByte: number = buf.readInt8();
            const tagType: TagType = readTagType(tagTypeByte);
            if (tagType === TagType.End) {
                return { tagType, tagName: "" };
            }
            const tagNameTag: TagString = ofHandler<TagString>(TagType.String).read(buf);
            const tagName: string = tagNameTag.value;
            return { tagType, tagName };
        }

        function writeTagHead(buf: ByteBuffer, tagHead: TagHead): void {
            const tagType: TagType = tagHead.tagType;
            const tagTypeByte: number = writeTagType(tagType);
            buf.writeInt8(tagTypeByte);
            if (tagType === TagType.End) {
                return;
            }
            const tagName: string = tagHead.tagName;
            const tagNameTag: TagString = TagScalar.newString(tagName);
            ofHandler<TagString>(TagType.String).write(buf, tagNameTag);
        }
    }

    export interface Schema {
        [key: string]: NBT.TagType | string | Schema | Array<NBT.TagType | string | Schema>;
    }
    export type Type = Schema | string;
    export interface TypedObject {
        readonly __nbtPrototype__: Schema;
        [key: string]: any;
    }

    export class Serializer {
        static create() {
            return new Serializer();
        }
        static deserialize(fileData: Buffer, compressed?: boolean): NBT.TypedObject {
            let doUnzip: boolean;
            if (typeof compressed === "undefined") {
                const ft = fileType(fileData);
                doUnzip = ft !== undefined && ft.ext === "gz";
            } else {
                doUnzip = compressed;
            }
            if (doUnzip) {
                const { value, type } = readRootTag(ByteBuffer.wrap(zlib.unzipSync(fileData)));
                deepFreeze(type);
                Object.defineProperty(value, "__nbtPrototype__", { value: type });
                return value;
            } else {
                const { value, type } = readRootTag(ByteBuffer.wrap(fileData));
                deepFreeze(type);
                Object.defineProperty(value, "__nbtPrototype__", { value: type });
                return value;
            }
        }
        static serialize(object: NBT.TypedObject, compressed?: boolean): Buffer {
            return writeRootTag(object, compressed || false, object.__nbtPrototype__, () => ({}));
        }

        private registry: { [id: string]: CompoundSchema } = {};
        private reversedRegistry: { [shape: string]: string } = {};
        register(type: string, schema: CompoundSchema): this {
            if (typeof schema !== "object" || schema === null) { throw new Error(); }
            this.registry[type] = schema;
            this.reversedRegistry[JSON.stringify(schema)] = type;
            return this;
        }
        serialize(object: object, type: string, compressed: boolean = false) {
            const schema = this.registry[type];
            if (!schema) { throw new Error(`Unknown type [${schema}]`); }

            return writeRootTag(object, compressed, schema, (id) => this.registry[id]);
        }
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
                return readRootTag(bytebuffer, (shape) => this.reversedRegistry[JSON.stringify(shape)]);
            } else {
                const bytebuffer = ByteBuffer.wrap(fileData);
                return readRootTag(bytebuffer, (shape) => this.reversedRegistry[JSON.stringify(shape)]);
            }
        }
    }
}
type Finder = (schema: CompoundSchema) => string | undefined;

type CompoundSchema = NBT.Schema;
type ArraySchema = Array<NBT.TagType | string | CompoundSchema>;
type Scope = ArraySchema | CompoundSchema;

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

function writeRootTag(value: any, compressed: boolean, scope?: Scope, find?: (id: string) => CompoundSchema) {
    const buffer = new ByteBuffer();
    buffer.writeByte(NBT.TagType.Compound);
    writeUTF8(buffer, "");
    visitors[NBT.TagType.Compound].write(buffer, value, scope, find);

    if (compressed) {
        return zlib.gzipSync(Buffer.from(buffer.flip().toArrayBuffer()));
    } else {
        return Buffer.from(buffer.flip().toArrayBuffer());
    }
}

function readRootTag(buffer: ByteBuffer, find?: Finder) {
    const rootType = buffer.readByte();
    if (rootType === 0) { throw new Error("NBTEnd"); }
    if (rootType !== 10) { throw new Error("Root tag must be a named compound tag. " + rootType); }
    readUTF8(buffer); // I think this is the nameProperty of the file...
    return visitors[NBT.TagType.Compound].read(buffer, find) as { type: CompoundSchema | string, value: any };
}

function val(type: any, value: any) { return { type, value }; }

interface IO {
    read(buf: ByteBuffer, find?: Finder): { type: Scope | NBT.TagType, value: any };
    write(buf: ByteBuffer, value: any, scope?: Scope, find?: (id: string) => CompoundSchema): void;
}
function ensureType(type: string, v: any) {
    if (typeof v !== type) {
        throw {
            type: "IllegalInputFormat",
        };
    }
}

const visitors: IO[] = [
    { read: (buf) => val(NBT.TagType.End, undefined), write(buf, v) { } }, // end
    { read: (buf) => val(NBT.TagType.Byte, buf.readByte()), write(buf, v) { buf.writeByte(v ? v : 0); } }, // byte
    { read: (buf) => val(NBT.TagType.Short, buf.readShort()), write(buf, v) { buf.writeShort(v ? v : 0); } }, // short
    { read: (buf) => val(NBT.TagType.Int, buf.readInt()), write(buf, v) { buf.writeInt(v ? v : 0); } }, // int
    { read: (buf) => val(NBT.TagType.Long, buf.readLong()), write(buf, v) { buf.writeInt64(v ? v : 0); } }, // long
    { read: (buf) => val(NBT.TagType.Float, buf.readFloat()), write(buf, v) { buf.writeFloat(v ? v : 0); } }, // float
    { read: (buf) => val(NBT.TagType.Double, buf.readDouble()), write(buf, v) { buf.writeDouble(v ? v : 0); } }, // double
    { // byte array
        read(buf) {
            const arr = new Int8Array(buf.readInt());
            for (let i = 0; i < arr.length; i++) { arr[i] = buf.readByte(); }
            return val(NBT.TagType.ByteArray, arr);
        },
        write(buf, arr) {
            if (arr === null || arr === undefined) {
                arr = [];
            }
            buf.writeInt(arr.length);
            for (let i = 0; i < arr.length; i++) { buf.writeByte(arr[i]); }
        },
    },
    { // string
        read(buf) { return val(NBT.TagType.String, readUTF8(buf)); },
        write(buf, v) { writeUTF8(buf, v ? v : ""); },
    },
    { // list
        read(buf, find) {
            const listType = buf.readByte();
            const len = buf.readInt();
            const list = new Array(len);
            let scope: any;
            for (let i = 0; i < len; i++) {
                const { type, value } = visitors[listType].read(buf, find);
                list[i] = value;
                scope = [type];
            }
            return val(scope, list);
        },
        write(buf, value: any[], scope, find) {
            if (!scope || !find) { throw new Error("Missing list scope!"); }
            if (value === null || value === undefined) {
                value = [];
            }
            const type = (scope as ArraySchema)[0];
            switch (typeof type) {
                case "number": // type enum
                    buf.writeByte(type as number);
                    buf.writeInt(value.length);
                    for (const v of value) { visitors[type as number].write(buf, v); }
                    break;
                case "string": // custom registered type
                    const customScope = find(type as string);
                    if (!customScope) { throw new Error(`Unknown custom type [${type}]`); }
                    buf.writeByte(NBT.TagType.Compound);
                    buf.writeInt(value.length);
                    for (const v of value) { visitors[NBT.TagType.Compound].write(buf, v, customScope, find); }
                    break;
                case "object": // custom type
                    buf.writeByte(NBT.TagType.Compound);
                    buf.writeInt(value.length);
                    for (const v of value) { visitors[NBT.TagType.Compound].write(buf, v, type as CompoundSchema, find); }
                    break;
                default:
                    if (value.length !== 0) {
                        throw new Error(`Unknown list type [${type}].`);
                    }
                    buf.writeByte(NBT.TagType.End);
                    buf.writeInt(0);
            }
        },
    },
    {// tag compound
        read(buf, find) {
            const object: any = {};
            const scope: CompoundSchema = {};
            for (let tag = 0; (tag = buf.readByte()) !== 0;) {
                const name = readUTF8(buf);
                const visitor = visitors[tag];
                if (!visitor) { throw new Error("No such tag id: " + tag); }
                const { type, value } = visitor.read(buf, find);
                object[name] = value;
                scope[name] = type;
            }
            const id = find ? find(scope) : undefined;
            return val(id ? id : scope, object);
        },
        write(buf, object, scope, find) {
            if (!scope || !find) { throw new Error(); }
            if (object === null || object === undefined) {
                object = {};
            }
            Object.keys(object).forEach((key) => {
                const value = object[key];
                const type = (scope as CompoundSchema)[key];
                let nextScope: Scope | undefined;
                let nextType = type;

                if (typeof type === "number") { // common enum type
                    nextType = type;
                } else if (type instanceof Array) { // array type
                    nextType = NBT.TagType.List;
                    nextScope = type as ArraySchema;
                } else if (typeof type === "string") { // custom type
                    nextType = NBT.TagType.Compound;
                    nextScope = find(type);
                    if (!nextScope) { throw new Error(`Unknown custom type [${type}]`); }
                } else if (typeof type === "object") { // tagged compund type
                    nextType = NBT.TagType.Compound;
                    nextScope = type;
                } else {
                    return; // just ignore it if it's not on definition
                }

                const writer = visitors[nextType];
                if (!writer) { throw new Error("Unknown type " + type); }
                buf.writeByte(nextType);
                writeUTF8(buf, key);
                try {
                    writer.write(buf, value, nextScope, find);
                } catch (e) {
                    if (e instanceof TypeError) {
                        throw {
                            type: "IllegalInputType",
                            message: `Require ${Object.keys(NBT.TagType)[13 + nextType]} but found ${typeof value}`,
                        };
                    }
                }
            });
            buf.writeByte(0);
        },
    },
    { // int array
        read(buf) {
            const arr = new Int32Array(buf.readInt());
            for (let i = 0; i < arr.length; i++) { arr[i] = buf.readInt(); }
            return val(NBT.TagType.IntArray, arr);
        },
        write(buf, v) {
            if (v === null || v === undefined) {
                v = [];
            }
            buf.writeInt(v.length);
            for (let i = 0; i < v.length; i++) { buf.writeInt(v[i]); }
        },
    },
    { // long array
        read(buf) {
            const len = buf.readInt();
            const arr: Long[] = new Array(len);
            for (let i = 0; i < len; i++) { arr[i] = buf.readLong(); }
            return val(NBT.TagType.LongArray, arr);
        },
        write(buf, v) {
            if (v === null || v === undefined) {
                v = [];
            }
            buf.writeInt(v.length);
            for (let i = 0; i < v.length; i++) { buf.writeInt64(v[i]); }
        },
    },
];


export default NBT;
