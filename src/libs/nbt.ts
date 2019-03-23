import * as ByteBuffer from "bytebuffer";
import * as Long from "long";
import * as gzip from "zlib";
import { readUTF8, writeUTF8 } from "./utils/utf8";

/**
 * @author yuxuanchiadm
 * @author ci010
 */
export namespace NBT {
    export enum TagType {
        End = 0, Byte = 1, Short = 2, Int = 3, Long = 4, Float = 5, Double = 6,
        ByteArray = 7, String = 8, List = 9, Compound = 10, IntArray = 11, LongArray = 12,
    }

    export type TagNormal = TagByte | TagShort | TagInt | TagLong | TagFloat | TagDouble | TagByteArray | TagString | TagAnyList | TagCompound | TagIntArray | TagLongArray;
    export type TagByte = TagScalar<number> & TagType.Byte;
    export type TagShort = TagScalar<number> & TagType.Short;
    export type TagInt = TagScalar<number> & TagType.Int;
    export type TagLong = TagScalar<Long> & TagType.Long;
    export type TagFloat = TagScalar<number> & TagType.Float;
    export type TagDouble = TagScalar<number> & TagType.Double;
    export type TagByteArray = TagScalar<Buffer> & TagType.ByteArray;
    export type TagString = TagScalar<string> & TagType.String;
    export type TagIntArray = TagScalar<Buffer> & TagType.IntArray;
    export type TagLongArray = TagScalar<Buffer> & TagType.LongArray;
    export type TagAnyList = TagList<TagBase>;

    export abstract class TagBase {
        protected constructor(readonly tagType: TagType) { }

        asTagEnd(): TagEnd { if (this.tagType !== TagType.End) { throw new TypeError("Illegal tag type"); } return this as any; }
        public asTagByte(): TagByte { if (this.tagType !== TagType.Byte) { throw new TypeError("Illegal tag type"); } return this as any; }
        public asTagShort(): TagShort { if (this.tagType !== TagType.Short) { throw new TypeError("Illegal tag type"); } return this as any; }
        public asTagInt(): TagInt { if (this.tagType !== TagType.Int) { throw new TypeError("Illegal tag type"); } return this as any; }
        public asTagLong(): TagLong { if (this.tagType !== TagType.Long) { throw new TypeError("Illegal tag type"); } return this as any; }
        public asTagFloat(): TagFloat { if (this.tagType !== TagType.Float) { throw new TypeError("Illegal tag type"); } return this as any; }
        public asTagDouble(): TagDouble { if (this.tagType !== TagType.Double) { throw new TypeError("Illegal tag type"); } return this as any; }
        public asTagByteArray(): TagByteArray { if (this.tagType !== TagType.ByteArray) { throw new TypeError("Illegal tag type"); } return this as any; }
        public asTagString(): TagString { if (this.tagType !== TagType.String) { throw new TypeError("Illegal tag type"); } return this as any; }
        public asTagList(): TagAnyList { if (this.tagType !== TagType.List) { throw new TypeError("Illegal tag type"); } return this as any; }
        public asTagCompound(): TagCompound { if (this.tagType !== TagType.Compound) { throw new TypeError("Illegal tag type"); } return this as any; }
        public asTagIntArray(): TagIntArray { if (this.tagType !== TagType.IntArray) { throw new TypeError("Illegal tag type"); } return this as any; }
        public asTagLongArray(): TagLongArray { if (this.tagType !== TagType.LongArray) { throw new TypeError("Illegal tag type"); } return this as any; }
    }

    export class TagEnd extends TagBase {

        public static newEnd(): TagEnd { return TagEnd.INSTANCE; }

        private static readonly INSTANCE = new TagEnd();
        protected constructor() {
            super(TagType.End);
        }
    }

    export type ScalarTypes = number | Long | string | Buffer;

    export class TagScalar<T extends ScalarTypes> extends TagBase {

        get value(): T {
            return this.scalarValue;
        }

        set value(value: T) {
            TagScalar.checkTagValue(this.tagType, value);
            this.scalarValue = value;
        }

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
                        if (typeof value !== "number") {
                            throw new TypeError("Illegal value");
                        }
                        break;
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

        protected constructor(tagType: TagType, value: T) {
            super(tagType);
            this.scalarValue = value;
        }
    }

    export class TagList<T extends TagBase> extends TagBase implements Iterable<T> {

        get length(): number {
            return this.list.length;
        }

        set length(length: number) {
            if (length < 0 || length > this.list.length) {
                throw new RangeError("Illegal length");
            }
            this.list.length = length;
        }

        [index: number]: T;













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

        private static checkElement(element: TagBase, elementTagType: TagType): boolean {
            return element !== null && element !== undefined && element.tagType === elementTagType;
        }
        protected readonly list: T[] = [];

        protected constructor(readonly elementTagType: TagType) {
            super(TagType.List);
            return new Proxy(this, {
                has(target: TagList<T>, p: PropertyKey): boolean {
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
                get(target: TagList<T>, p: PropertyKey, receiver: any): any {
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
                set(target: TagList<T>, p: PropertyKey, value: any, receiver: any): boolean {
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
                const value: T = TagScalar.newScalar(this.elementTagType, items[i]) as any;
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

        public asTagListByte(): TagList<TagByte> { if (this.elementTagType !== TagType.Byte) { throw new TypeError("Illegal element tag type"); } return this as any; }
        public asTagListShort(): TagList<TagShort> { if (this.elementTagType !== TagType.Short) { throw new TypeError("Illegal element tag type"); } return this as any; }
        public asTagListInt(): TagList<TagInt> { if (this.elementTagType !== TagType.Int) { throw new TypeError("Illegal element tag type"); } return this as any; }
        public asTagListLong(): TagList<TagLong> { if (this.elementTagType !== TagType.Long) { throw new TypeError("Illegal element tag type"); } return this as any; }
        public asTagListFloat(): TagList<TagFloat> { if (this.elementTagType !== TagType.Float) { throw new TypeError("Illegal element tag type"); } return this as any; }
        public asTagListDouble(): TagList<TagDouble> { if (this.elementTagType !== TagType.Double) { throw new TypeError("Illegal element tag type"); } return this as any; }
        public asTagListByteArray(): TagList<TagByteArray> { if (this.elementTagType !== TagType.ByteArray) { throw new TypeError("Illegal element tag type"); } return this as any; }
        public asTagListString(): TagList<TagString> { if (this.elementTagType !== TagType.String) { throw new TypeError("Illegal element tag type"); } return this as any; }
        public asTagListList(): TagList<TagAnyList> { if (this.elementTagType !== TagType.List) { throw new TypeError("Illegal element tag type"); } return this as any; }
        public asTagListCompound(): TagList<TagCompound> { if (this.elementTagType !== TagType.Compound) { throw new TypeError("Illegal element tag type"); } return this as any; }
        public asTagListIntArray(): TagList<TagIntArray> { if (this.elementTagType !== TagType.IntArray) { throw new TypeError("Illegal element tag type"); } return this as any; }
        public asTagListLongArray(): TagList<TagLongArray> { if (this.elementTagType !== TagType.LongArray) { throw new TypeError("Illegal element tag type"); } return this as any; }
    }

    export interface TagCompoundAccessor { [key: string]: TagNormal; }

    export class TagCompound extends TagBase implements Iterable<[string, TagNormal]> {

        get size(): number {
            return this.tagSize;
        }

        public static newCompound(): TagCompound { return new TagCompound(); }

        private static checkValue(value: TagNormal): boolean {
            return value !== null && value !== undefined && value.tagType !== TagType.End;
        }

        public readonly accessor: TagCompoundAccessor;
        protected readonly map: { [key: string]: TagNormal } = Object.create(null);
        protected tagSize: number = 0;

        protected constructor() {
            super(TagType.Compound);
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
                    if (typeof value !== "object" || !(value as TagNormal instanceof TagBase)) {
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

        public *[Symbol.iterator](): IterableIterator<[string, TagNormal]> {
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

        public get(key: string): TagNormal | undefined {
            return this.map[key];
        }

        public has(key: string): boolean {
            return key in this.map;
        }

        public set(key: string, value: TagNormal): this {
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
                read(buf) { return TagEnd.newEnd(); },
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
                        const value: TagNormal = ofHandler<TagNormal>(tagType).read(buf);
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
                    ofHandler<TagEnd>(TagType.End).write(buf, TagEnd.newEnd());
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
                    buffer = gzip.gunzipSync(buffer);
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
                    buffer = gzip.gzipSync(buffer);
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
}

export default NBT;
