import * as gzip from 'zlib'
import * as ByteBuffer from 'bytebuffer'
import * as Long from 'long'

export namespace NewNBT {
    export const enum TagType {
        End = 0,
        Byte = 1,
        Short = 2,
        Int = 3,
        Long = 4,
        Float = 5,
        Double = 6,
        ByteArray = 7,
        String = 8,
        List = 9,
        Compound = 10,
        IntArray = 11,
        LongArray = 12
    }

    export abstract class TagBase {
        protected constructor(readonly tagType: TagType) {}

        asTagByte(): TagByte { if (this.tagType !== TagType.Byte) throw new TypeError('Illegal tag type'); return this as any; };
        asTagShort(): TagShort { if (this.tagType !== TagType.Short) throw new TypeError('Illegal tag type'); return this as any; };
        asTagInt(): TagInt { if (this.tagType !== TagType.Int) throw new TypeError('Illegal tag type'); return this as any; };
        asTagLong(): TagLong { if (this.tagType !== TagType.Long) throw new TypeError('Illegal tag type'); return this as any; };
        asTagFloat(): TagFloat { if (this.tagType !== TagType.Float) throw new TypeError('Illegal tag type'); return this as any; };
        asTagDouble(): TagDouble { if (this.tagType !== TagType.Double) throw new TypeError('Illegal tag type'); return this as any; };
        asTagByteArray(): TagByteArray { if (this.tagType !== TagType.ByteArray) throw new TypeError('Illegal tag type'); return this as any; };
        asTagString(): TagString { if (this.tagType !== TagType.String) throw new TypeError('Illegal tag type'); return this as any; };
        asTagList(): TagAnyList { if (this.tagType !== TagType.List) throw new TypeError('Illegal tag type'); return this as any; };
        asTagCompound(): TagCompound { if (this.tagType !== TagType.Compound) throw new TypeError('Illegal tag type'); return this as any; };
        asTagIntArray(): TagIntArray { if (this.tagType !== TagType.IntArray) throw new TypeError('Illegal tag type'); return this as any; };
        asTagLongArray(): TagLongArray { if (this.tagType !== TagType.LongArray) throw new TypeError('Illegal tag type'); return this as any; };
    }

    export type ScalarTypes = number | Long | string | Buffer;
    
    export class TagScalar<T extends ScalarTypes> extends TagBase {
        protected _value: T;

        protected constructor(tagType: TagType, value: T) {
            super(tagType);
            this.value = value;
        }

        get value(): T {
            return this._value;
        }

        set value(value: T) {
            TagScalar.checkTagValue(this.tagType, value);
            this._value = value;
        }

        static newByte(value: number): TagByte { return new TagScalar(TagType.Byte, value); }
        static newShort(value: number): TagShort { return new TagScalar(TagType.Short, value); }
        static newInt(value: number): TagInt { return new TagScalar(TagType.Int, value); }
        static newLong(value: Long): TagLong { return new TagScalar(TagType.Long, value); }
        static newFloat(value: number): TagFloat { return new TagScalar(TagType.Float, value); }
        static newDouble(value: number): TagDouble { return new TagScalar(TagType.Double, value); }
        static newByteArray(value: Buffer): TagByteArray { return new TagScalar(TagType.ByteArray, value); }
        static newString(value: string): TagString { return new TagScalar(TagType.String, value); }
        static newIntArray(value: Buffer): TagIntArray { return new TagScalar(TagType.IntArray, value); }
        static newLongArray(value: Buffer): TagLongArray { return new TagScalar(TagType.LongArray, value); }

        private static checkTagValue(tagType: TagType, value: ScalarTypes): void {
            if (tagType === TagType.End || tagType === TagType.List || tagType === TagType.Compound)
                throw new TypeError('Illegal tagType');
            else if (typeof value === 'undefined')
                throw new TypeError('Illegal value');
            else if (value === null)
                throw new TypeError('Illegal value');
            else {
                switch (tagType) {
                case TagType.Byte:
                    if (typeof value !== 'number' || !Number.isInteger(value) || value < -0x80 || value > 0x7F)
                        throw new TypeError('Illegal value');
                    break;
                case TagType.Short:
                    if (typeof value !== 'number' || !Number.isInteger(value) || value < -0x8000 || value > 0x7FFF)
                        throw new TypeError('Illegal value');
                    break;
                case TagType.Int:
                    if (typeof value !== 'number' || !Number.isInteger(value) || value < -0x80000000 || value > 0x7FFFFFFF)
                        throw new TypeError('Illegal value');
                    break;
                case TagType.Long:
                    if (typeof value !== 'object' || !(value instanceof Long) || value.unsigned)
                        throw new TypeError('Illegal value');
                    break;
                case TagType.Float:
                    if (typeof value !== 'number')
                        throw new TypeError('Illegal value');
                    break;
                case TagType.Double:
                    if (typeof value !== 'number')
                        throw new TypeError('Illegal value');
                    break;
                case TagType.ByteArray:
                    if (typeof value !== 'object' || !(value instanceof Buffer))
                        throw new TypeError('Illegal value');
                    break;
                case TagType.String:
                    if (typeof value !== 'string')
                        throw new TypeError('Illegal value');
                    break;
                case TagType.IntArray:
                    if (typeof value !== 'object' || !(value instanceof Buffer) || value.length % 4 !== 0)
                        throw new TypeError('Illegal value');
                    break;
                case TagType.LongArray:
                    if (typeof value !== 'object' || !(value instanceof Buffer) || value.length % 8 !== 0)
                        throw new TypeError('Illegal value');
                    break;
                }
            }
        }
    }

    export type TagByte = TagScalar<number>;
    export type TagShort = TagScalar<number>;
    export type TagInt = TagScalar<number>;
    export type TagLong = TagScalar<Long>;
    export type TagFloat = TagScalar<number>;
    export type TagDouble = TagScalar<number>;
    export type TagByteArray = TagScalar<Buffer>;
    export type TagString = TagScalar<string>;
    export type TagIntArray = TagScalar<Buffer>;
    export type TagLongArray = TagScalar<Buffer>;

    export class TagList<T extends TagBase> extends TagBase implements Iterable<T> {
        protected readonly list: Array<T> = [];

        protected constructor(readonly elementTagType: TagType) {
            super(TagType.List);
            return new Proxy(this, {
                has(target: TagList<T>, p: PropertyKey): boolean {
                    if (typeof p === 'string') {
                        let n: number = Number(p);
                        if (!Number.isInteger(n) || n < 0)
                            return Reflect.has(target, p);
                        p = n;
                    } else if (typeof p !== 'number')
                        return Reflect.has(target, p);
                    return p >= 0 && p < target.list.length;
                },
                get(target: TagList<T>, p: PropertyKey, receiver: any): any {
                    if (typeof p === 'string') {
                        let n: number = Number(p);
                        if (!Number.isInteger(n) || n < 0)
                            return Reflect.get(target, p, receiver);
                        p = n;
                    } else if (typeof p !== 'number')
                        return Reflect.get(target, p, receiver);
                    if (p < 0 || p >= target.list.length)
                        return undefined;
                    return target.list[p];
                },
                set(target: TagList<T>, p: PropertyKey, value: any, receiver: any): boolean {
                    if (typeof p === 'string') {
                        let n: number = Number(p);
                        if (!Number.isInteger(n) || n < 0)
                            return Reflect.set(target, p, value, receiver);
                        p = n;
                    } else if (typeof p !== 'number')
                        return Reflect.set(target, p, value, receiver);
                    if (p < 0 || p > target.list.length)
                        return false;
                    if (typeof value !== 'object' || !(value instanceof TagBase))
                        return false;
                    if (!TagList.checkElement(value, target.elementTagType))
                        return false;
                    target.list[p] = value as T;
                    return true;
                }
            });
        }

        get length(): number {
            return this.list.length;
        }

        set length(length: number) {
            if (length < 0 || length > this.list.length)
                throw new RangeError('Illegal length');
            this.list.length = length;
        }

        push(...items: T[]): number {
            for (let i: number = 0; i < items.length; i++) {
                let value: T = items[i];
                if (typeof value !== 'object' || !(value instanceof TagBase))
                    throw new TypeError('Illegal element');
                if (!TagList.checkElement(value, this.elementTagType))
                    throw new TypeError('Illegal element');
            }
            return Array.prototype.push.apply(this.list, items);
        }

        pop(): T | undefined {
            return this.list.pop();
        }

        shift(): T | undefined {
            return this.list.shift();
        }

        unshift(...items: T[]): number {
            for (let i: number = 0; i < items.length; i++) {
                let value: T = items[i];
                if (typeof value !== 'object' || !(value instanceof TagBase))
                    throw new TypeError('Illegal element');
                if (!TagList.checkElement(value, this.elementTagType))
                    throw new TypeError('Illegal element');
            }
            return Array.prototype.unshift.apply(this.list, items);
        }

        *[Symbol.iterator](): IterableIterator<T> {
            for (let i: number = 0; i < this.list.length; i++)
                yield this.list[i];
        }

        [index: number]: T;

        asTagListByte(): TagList<TagByte> { if (this.elementTagType !== TagType.Byte) throw new TypeError('Illegal element tag type'); return this as any; };
        asTagListShort(): TagList<TagShort> { if (this.elementTagType !== TagType.Short) throw new TypeError('Illegal element tag type'); return this as any; };
        asTagListInt(): TagList<TagInt> { if (this.elementTagType !== TagType.Int) throw new TypeError('Illegal element tag type'); return this as any; };
        asTagListLong(): TagList<TagLong> { if (this.elementTagType !== TagType.Long) throw new TypeError('Illegal element tag type'); return this as any; };
        asTagListFloat(): TagList<TagFloat> { if (this.elementTagType !== TagType.Float) throw new TypeError('Illegal element tag type'); return this as any; };
        asTagListDouble(): TagList<TagDouble> { if (this.elementTagType !== TagType.Double) throw new TypeError('Illegal element tag type'); return this as any; };
        asTagListByteArray(): TagList<TagByteArray> { if (this.elementTagType !== TagType.ByteArray) throw new TypeError('Illegal element tag type'); return this as any; };
        asTagListString(): TagList<TagString> { if (this.elementTagType !== TagType.String) throw new TypeError('Illegal element tag type'); return this as any; };
        asTagListList(): TagList<TagAnyList> { if (this.elementTagType !== TagType.List) throw new TypeError('Illegal element tag type'); return this as any; };
        asTagListCompound(): TagList<TagCompound> { if (this.elementTagType !== TagType.Compound) throw new TypeError('Illegal element tag type'); return this as any; };
        asTagListIntArray(): TagList<TagIntArray> { if (this.elementTagType !== TagType.IntArray) throw new TypeError('Illegal element tag type'); return this as any; };
        asTagListLongArray(): TagList<TagLongArray> { if (this.elementTagType !== TagType.LongArray) throw new TypeError('Illegal element tag type'); return this as any; };

        static newByteList(): TagList<TagByte> { return new TagList(TagType.Byte); }
        static newShortList(): TagList<TagShort> { return new TagList(TagType.Short); }
        static newIntList(): TagList<TagInt> { return new TagList(TagType.Int); }
        static newLongList(): TagList<TagLong> { return new TagList(TagType.Long); }
        static newFloatList(): TagList<TagFloat> { return new TagList(TagType.Float); }
        static newDoubleList(): TagList<TagDouble> { return new TagList(TagType.Double); }
        static newByteArrayList(): TagList<TagByteArray> { return new TagList(TagType.ByteArray); }
        static newStringList(): TagList<TagString> { return new TagList(TagType.String); }
        static newListList(): TagList<TagAnyList> { return new TagList(TagType.List); }
        static newListCompound(): TagList<TagCompound> { return new TagList(TagType.Compound); }
        static newIntArrayList(): TagList<TagIntArray> { return new TagList(TagType.IntArray); }
        static newLongArrayList(): TagList<TagLongArray> { return new TagList(TagType.LongArray); }

        private static checkElement(element: TagBase, elementTagType: TagType): boolean {
            return element !== null && element !== undefined && element.tagType === elementTagType;
        }
    }

    export type TagAnyList = TagList<TagBase>;

    export class TagCompound extends TagBase implements Iterable<[string, TagBase]> {
        protected readonly map: { [key: string]: TagBase } = Object.create(null);
        protected _size: number = 0;

        protected constructor() {
            super(TagType.Compound);
        }

        *[Symbol.iterator](): IterableIterator<[string, TagBase]> {
            for (let key in this.map)
                yield [key, this.map[key]];
        }

        clear(): void {
            for (let key in this.map)
                delete this.map[key];
            this._size = 0;
        }

        delete(key: string): boolean {
            if (!(key in this.map))
                return false;
            delete this.map[key];
            this._size--;
            return true;
        }

        get(key: string): TagBase | undefined {
            return this.map[key];
        }

        has(key: string): boolean {
            return key in this.map;
        }

        set(key: string, value: TagBase): this {
            if (typeof value !== 'object' || !(value instanceof TagBase))
                throw new TypeError('Illegal element');
            if (value === null || value === undefined)
                throw new TypeError('Illegal element');
            if (!(key in this.map))
                this._size++;
            this.map[key] = value;
            return this;
        }

        get size(): number {
            return this._size;
        }

        static newCompound(): TagCompound { return new TagCompound(); }
    }

    export namespace Persistence {
        interface IOHandler<T extends TagBase> {
            read(buf: ByteBuffer): T;
            write(buf: ByteBuffer, tag: T): void;
        }

        let handlers: { [key: number]: IOHandler<TagBase> | undefined } = {
            [TagType.End]: undefined,
            [TagType.Byte]: {
               read(buf) { return TagScalar.newByte(buf.readInt8()); },
               write(buf, tag) { buf.writeInt8(tag.value); }
            } as IOHandler<TagByte>,
            [TagType.Short]: {
                read(buf) { return TagScalar.newShort(buf.readInt16()); },
                write(buf, tag) { buf.writeInt16(tag.value); }
            } as IOHandler<TagShort>,
            [TagType.Int]: {
                read(buf) { return TagScalar.newInt(buf.readInt32()); },
                write(buf, tag) { buf.writeInt32(tag.value); }
            } as IOHandler<TagInt>,
            [TagType.Long]: {
                read(buf) { return TagScalar.newLong(buf.readInt64()); },
                write(buf, tag) { buf.writeInt64(tag.value); }
            } as IOHandler<TagLong>,
            [TagType.Float]: {
                read(buf) { return TagScalar.newFloat(buf.readFloat32()); },
                write(buf, tag) { buf.writeFloat32(tag.value); }
            } as IOHandler<TagFloat>,
            [TagType.Double]: {
                read(buf) { return TagScalar.newDouble(buf.readFloat64()); },
                write(buf, tag) { buf.writeFloat64(tag.value); }
            } as IOHandler<TagDouble>,
            [TagType.ByteArray]: {
                read(buf) {
                    let len: number = buf.readInt32();
                    if (len < 0)
                        throw new RangeError('Illegal size');
                    let bytes: number = len;
                    let array: Buffer = Buffer.from(buf.slice(buf.offset, buf.offset + bytes).toArrayBuffer(true));
                    buf.skip(bytes);
                    return TagScalar.newByteArray(array);
                },
                write(buf, tag) {
                    let array: Buffer = tag.value;
                    let bytes: number = array.length;
                    let len = bytes;
                    buf.writeInt32(len);
                    buf.append(ByteBuffer.wrap(array))
                }
            } as IOHandler<TagByteArray>,
            [TagType.String]: {
                read(buf) { return TagScalar.newString(readJavaModifiedUTF8(buf)); },
                write(buf, tag) { writeJavaModifiedUTF8(buf, tag.value); }
            } as IOHandler<TagString>,
            [TagType.List]: undefined,
            [TagType.Compound]: undefined,
            [TagType.IntArray]: {
                read(buf) {
                    let len: number = buf.readInt32();
                    if (len < 0)
                        throw new RangeError('Illegal size');
                    let bytes: number = len * 4;
                    let array: Buffer = Buffer.from(buf.slice(buf.offset, buf.offset + bytes).toArrayBuffer(true));
                    buf.skip(bytes);
                    return TagScalar.newByteArray(array);
                },
                write(buf, tag) {
                    let array: Buffer = tag.value;
                    let bytes: number = array.length;
                    if (bytes % 4 !== 0)
                        throw new Error('Illegal buffer length');
                    let len: number = bytes / 4;
                    buf.writeInt32(len);
                    buf.append(ByteBuffer.wrap(array))
                }
            } as IOHandler<TagIntArray>,
            [TagType.LongArray]: {
                read(buf) {
                    let len: number = buf.readInt32();
                    if (len < 0)
                        throw new RangeError('Illegal size');
                    let bytes: number = len * 8;
                    let array: Buffer = Buffer.from(buf.slice(buf.offset, buf.offset + bytes).toArrayBuffer(true));
                    buf.skip(bytes);
                    return TagScalar.newByteArray(array);
                },
                write(buf, tag) {
                    let array: Buffer = tag.value;
                    let bytes: number = array.length;
                    if (bytes % 8 !== 0)
                        throw new Error('Illegal buffer length');
                    let len: number = bytes / 8;
                    buf.writeInt32(len);
                    buf.append(ByteBuffer.wrap(array))
                }
            } as IOHandler<TagLongArray>
        };

        export interface ReadOptions {
            compressed?: boolean;
        }

        export function readRoot(buffer: Buffer, options?: ReadOptions): TagCompound {
            if (options !== undefined) {
                if (options.compressed !== undefined && options.compressed)
                    buffer = gzip.gunzipSync(buffer);
            }
            const byteBuffer = ByteBuffer.wrap(buffer);
            // TODO: NYI
            throw new Error('NYI');
        }

        export interface WriteOptions {
            compressed?: boolean;
        }

        export function writeRoot(rootTag: TagCompound, options?: WriteOptions): Buffer {
            const byteBuffer: ByteBuffer = new ByteBuffer();
            // TODO: NYI
            let buffer: Buffer = Buffer.from(byteBuffer.flip().toArrayBuffer());
            if (options !== undefined) {
                if (options.compressed !== undefined && options.compressed)
                    buffer = gzip.gzipSync(buffer);
            }
            return buffer;
        }

        // Java Modified UTF-8 Encoding
        function writeJavaModifiedUTF8(out: ByteBuffer, str: string) {
            let strlen = str.length;
            let utflen = 0;
            let c: number;
            let count: number = 0;
        
            /* use charAt instead of copying String to char array */
            for (let i = 0; i < strlen; i++) {
                c = str.charCodeAt(i);
                if ((c >= 0x0001) && (c <= 0x007F)) {
                    utflen++;
                } else if (c > 0x07FF) {
                    utflen += 3;
                } else {
                    utflen += 2;
                }
            }
        
            if (utflen > 65535)
                throw new Error(
                    'encoded string too long: ' + utflen + ' bytes');
        
            let bytearr = new Uint8Array(utflen + 2);
        
            bytearr[count++] = ((utflen >>> 8) & 0xFF);
            bytearr[count++] = ((utflen >>> 0) & 0xFF);
        
            let i = 0;
            for (i = 0; i < strlen; i++) {
                c = str.charCodeAt(i);
                if (!((c >= 0x0001) && (c <= 0x007F))) break;
                bytearr[count++] = c;
            }
        
            for (; i < strlen; i++) {
                c = str.charCodeAt(i);
                if ((c >= 0x0001) && (c <= 0x007F)) {
                    bytearr[count++] = c;
        
                } else if (c > 0x07FF) {
                    bytearr[count++] = (0xE0 | ((c >> 12) & 0x0F));
                    bytearr[count++] = (0x80 | ((c >> 6) & 0x3F));
                    bytearr[count++] = (0x80 | ((c >> 0) & 0x3F));
                } else {
                    bytearr[count++] = (0xC0 | ((c >> 6) & 0x1F));
                    bytearr[count++] = (0x80 | ((c >> 0) & 0x3F));
                }
            }
            out.append(bytearr)
            // out.write(bytearr, 0, utflen + 2);
            return utflen + 2;
        }

        function readJavaModifiedUTF8(buff: ByteBuffer) {
            let utflen = buff.readUint16()
            let bytearr: number[] = new Array<number>(utflen);
            let chararr = new Array<number>(utflen);
        
            let c, char2, char3;
            let count = 0;
            let chararr_count = 0;
        
            for (let i = 0; i < utflen; i++)
                bytearr[i] = (buff.readByte())
        
            while (count < utflen) {
                c = bytearr[count] & 0xff;
                if (c > 127) break;
                count++;
                chararr[chararr_count++] = c;
            }
        
            while (count < utflen) {
                c = bytearr[count] & 0xff;
                switch (c >> 4) {
                    case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
                        /* 0xxxxxxx*/
                        count++;
                        chararr[chararr_count++] = c;
                        break;
                    case 12: case 13:
                        /* 110x xxxx   10xx xxxx*/
                        count += 2;
                        if (count > utflen)
                            throw new Error(
                                'malformed input: partial character at end');
                        char2 = bytearr[count - 1];
                        if ((char2 & 0xC0) != 0x80)
                            throw new Error(
                                'malformed input around byte ' + count);
                        chararr[chararr_count++] = (((c & 0x1F) << 6) |
                            (char2 & 0x3F));
                        break;
                    case 14:
                        /* 1110 xxxx  10xx xxxx  10xx xxxx */
                        count += 3;
                        if (count > utflen)
                            throw new Error(
                                'malformed input: partial character at end');
                        char2 = bytearr[count - 2];
                        char3 = bytearr[count - 1];
                        if (((char2 & 0xC0) != 0x80) || ((char3 & 0xC0) != 0x80))
                            throw new Error(
                                'malformed input around byte ' + (count - 1));
                        chararr[chararr_count++] = (((c & 0x0F) << 12) |
                            ((char2 & 0x3F) << 6) |
                            ((char3 & 0x3F) << 0));
                        break;
                    default:
                        /* 10xx xxxx,  1111 xxxx */
                        throw new Error(
                            'malformed input around byte ' + count);
                }
            }
            // The number of chars produced may be less than utflen
            return chararr.map(i => String.fromCharCode(i)).join('')
        }
    }
}
export default NewNBT;
