import * as gzip from 'zlib'
import * as ByteBuffer from 'bytebuffer'
import * as Long from 'long'

/**
 * @author yuxuanchiadm
 * @author ci010
 */

export namespace NBT {
    interface IO {
        read(buf: ByteBuffer, find: (shape: string) => string | undefined): { type: any, value: any };
        write(buf: ByteBuffer, value: any, scope: any, find: (id: string) => any): void;
    }

    export class Serializer {
        static create() {
            return new Serializer();
        }
        static deserialize(fileData: Buffer, compressed: boolean = false, find: (shape: string) => string | undefined = () => undefined) {
            if (compressed) {
                let zip = gzip.gunzipSync(fileData);
                let bytebuffer = ByteBuffer.wrap(zip);
                return readRootTag(bytebuffer, find)
            }
            else {
                let bytebuffer = ByteBuffer.wrap(fileData);
                return readRootTag(bytebuffer, find)
            }
        }
        private registry: { [id: string]: any } = {};
        private reversedRegistry: { [shape: string]: any } = {};
        register(type: string, schema: any): this {
            this.registry[type] = schema;
            this.reversedRegistry[JSON.stringify(schema)] = type;
            return this;
        }
        serialize(object: object, type: string, compressed: boolean = false) {
            let template;
            const schema = this.registry[type]
            if (!schema) throw `Unknown type [${schema}]`

            const buffer = new ByteBuffer();
            buffer.writeByte(TagType.Compound);
            writeUTF8(buffer, '');
            visitors[TagType.Compound].write(buffer, object, schema, (id) => this.registry[id])

            if (compressed) {
                return gzip.gzipSync(Buffer.from(buffer.flip().toArrayBuffer()));
            } else {
                return Buffer.from(buffer.flip().toArrayBuffer());
            }
        }
        deserialize(fileData: Buffer, compressed: boolean = false): { value: any, type: any | string } {
            if (compressed) {
                let zip = gzip.gunzipSync(fileData);
                let bytebuffer = ByteBuffer.wrap(zip);
                return readRootTag(bytebuffer, (shape) => this.reversedRegistry[shape])
            }
            else {
                let bytebuffer = ByteBuffer.wrap(fileData);
                return readRootTag(bytebuffer, (shape) => this.reversedRegistry[shape])
            }
        }
    }

    function readRootTag(buffer: ByteBuffer, find: (shape: string) => string | undefined) {
        let rootType = buffer.readByte();
        if (rootType == 0) throw new Error('NBTEnd');
        if (rootType != 10) throw new Error("Root tag must be a named compound tag.");
        readUTF8(buffer); //I think this is the nameProperty of the file...
        return visitors[TagType.Compound].read(buffer, find);
    }

    function val(type: any, value: any) { return { type, value } }
    const visitors: IO[] = [
        { read: (buf) => val(TagType.End, undefined), write(buf, v) { } }, //end
        { read: (buf) => val(TagType.Byte, buf.readByte()), write(buf, v) { buf.writeByte(v) } }, //byte
        { read: (buf) => val(TagType.Short, buf.readShort()), write(buf, v) { buf.writeShort(v) } }, //short
        { read: (buf) => val(TagType.Int, buf.readInt()), write(buf, v) { buf.writeInt(v) } }, //int
        { read: (buf) => val(TagType.Long, buf.readLong()), write(buf, v) { buf.writeInt64(v) } }, //long
        { read: (buf) => val(TagType.Float, buf.readFloat()), write(buf, v) { buf.writeFloat(v) } }, //float
        { read: (buf) => val(TagType.Double, buf.readDouble()), write(buf, v) { buf.writeDouble(v) } }, //double
        { //byte array
            read(buf) {
                let len = buf.readInt();
                let arr: number[] = new Array(len);
                for (let i = 0; i < len; i++) arr[i] = buf.readByte();
                return val(TagType.ByteArray, arr);
            },
            write(buf, arr) {
                buf.writeInt(arr.length)
                for (let i = 0; i < arr.length; i++)  buf.writeByte(arr[i])
            }
        },
        { //string
            read(buf) { return val(TagType.String, readUTF8(buf)); },
            write(buf, v) { writeUTF8(buf, v) }
        },
        { //list
            read(buf, find) {
                let listType = buf.readByte();
                let len = buf.readInt();
                let arr = new Array(len);
                let visitor = visitors[listType];
                let scope: any[] = []
                for (let i = 0; i < len; i++) {
                    let newScope: object = {};
                    const { type, value } = visitor.read(buf, find);
                    arr[i] = value;
                    scope.push(type)
                }
                if (scope.every(val => val === scope[0]))
                    scope = [scope[0]]
                return val(scope, arr);
            },
            write(buf, value, scope, find) {
                const type = scope[0]
                if (typeof type === 'number') {
                    buf.writeByte(type);
                    buf.writeInt(value.length);
                    let writer = visitors[type]
                    for (let v of value) writer.write(buf, v, type, find)
                }
                else if (typeof type === 'string') {
                    let customScope = find(type)
                    if (!customScope) throw `Unknown custom type [${type}]`
                    buf.writeByte(TagType.Compound);
                    buf.writeInt(value.length);
                    let writer = visitors[TagType.Compound];
                    for (let v of value) writer.write(buf, v, customScope, find)
                }
                else if (typeof type === 'object') {
                    let writer = visitors[TagType.Compound];
                    for (let v of value) writer.write(buf, v, type, find)
                }
                else throw new Error("WTH")
            }
        },
        {//tag compound
            read(buf, find) {
                const object: any = {};
                let scope: any = {};
                for (let tagType = 0; (tagType = buf.readByte()) != 0;) {
                    const name = readUTF8(buf);
                    const visitor = visitors[tagType];
                    if (!visitor) throw "No such tag id " + tagType;
                    const { type, value } = visitor.read(buf, find);
                    object[name] = value;
                    scope[name] = type;
                }
                const shape = JSON.stringify(scope);
                const id = find(shape);
                if (id) scope = id;
                return val(scope, object);
            },
            write(buf, object, scope, find) {
                for (const key in object) {
                    let value = object[key]
                    const type = scope[key]
                    let nextScope = undefined;
                    let nextType = type;
                    let writer;

                    if (typeof type === 'number') {
                        nextType = type
                    } else if (type instanceof Array) {
                        nextScope = type;
                        nextType = TagType.List
                    } else if (typeof type === 'string') {
                        nextType = TagType.Compound;
                        nextScope = find(type);  //support custom type
                        if (!nextScope) throw `Unknown custom type [${type}]`
                    } else if (typeof type === 'object') {
                        nextType = TagType.Compound
                        nextScope = type;
                    } else throw `Invalid type [${type}]`

                    writer = visitors[nextType];
                    buf.writeByte(nextType)
                    writeUTF8(buf, key)
                    if (!writer) throw "Unknown type " + type;
                    writer.write(buf, value, nextScope, find)
                }
                buf.writeByte(0)
            }
        },
        { //int array
            read(buf) {
                let len = buf.readInt();
                let arr: number[] = new Array(len);
                for (let i = 0; i < len; i++) arr[i] = buf.readInt();
                return val(TagType.IntArray, arr);
            },
            write(buf, v) {
                buf.writeInt(v.length)
                for (let i = 0; i < v.length; i++) buf.writeInt(v[i])
            }
        },
        { //long array
            read(buf) {
                let len = buf.readInt();
                let arr: Long[] = new Array(len);
                for (let i = 0; i < len; i++) arr[i] = buf.readLong();
                return val(TagType.LongArray, arr);
            },
            write(buf, v) {
                buf.writeInt(v.length)
                for (let i = 0; i < v.length; i++) buf.writeInt64(v[i])
            }
        }
    ];
    
    export const enum TagType {
        End = 0, Byte = 1, Short = 2, Int = 3, Long = 4, Float = 5, Double = 6,
        ByteArray = 7, String = 8, List = 9, Compound = 10, IntArray = 11, LongArray = 12
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

        asTagEnd(): TagEnd { if (this.tagType !== TagType.End) throw new TypeError('Illegal tag type'); return this as any; };
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

    export class TagEnd extends TagBase {
        protected constructor() {
            super(TagType.End);
        }

        private static readonly INSTANCE = new TagEnd();

        static newEnd(): TagEnd { return TagEnd.INSTANCE; }
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

        static newByte(value: number): TagByte { return new TagScalar(TagType.Byte, value) as TagByte; }
        static newShort(value: number): TagShort { return new TagScalar(TagType.Short, value) as TagShort; }
        static newInt(value: number): TagInt { return new TagScalar(TagType.Int, value) as TagInt; }
        static newLong(value: Long): TagLong { return new TagScalar(TagType.Long, value) as TagLong; }
        static newFloat(value: number): TagFloat { return new TagScalar(TagType.Float, value) as TagFloat; }
        static newDouble(value: number): TagDouble { return new TagScalar(TagType.Double, value) as TagDouble; }
        static newByteArray(value: Buffer): TagByteArray { return new TagScalar(TagType.ByteArray, value) as TagByteArray; }
        static newString(value: string): TagString { return new TagScalar(TagType.String, value) as TagString; }
        static newIntArray(value: Buffer): TagIntArray { return new TagScalar(TagType.IntArray, value) as TagIntArray; }
        static newLongArray(value: Buffer): TagLongArray { return new TagScalar(TagType.LongArray, value) as TagLongArray; }
        static newScalar<S extends ScalarTypes>(tagType: TagType, value: S): TagScalar<S> { return new TagScalar(tagType, value); }

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

        add(value: T): this {
            if (typeof value !== 'object' || !(value instanceof TagBase))
                throw new TypeError('Illegal element');
            if (!TagList.checkElement(value, this.elementTagType))
                throw new TypeError('Illegal element');
            this.list.push(value);
            return this;
        }

        clear(): void {
            this.list.length = 0;
        }

        pushScalar<S extends ScalarTypes>(this: TagList<TagScalar<S>> & this, ...items: S[]): number {
            let scalars: T[] = [];
            for (let i: number = 0; i < items.length; i++) {
                let value: T = TagScalar.newScalar(this.elementTagType, items[i]) as any;
                scalars.push(value);
            }
            return TagList.prototype.push.apply(this, scalars);
        }

        popScalar<S extends ScalarTypes>(this: TagList<TagScalar<S>> & this): S | undefined {
            let value: TagScalar<S> | undefined = this.pop();
            if (value === undefined)
                return undefined;
            return value.value;
        }

        shiftScalar<S extends ScalarTypes>(this: TagList<TagScalar<S>> & this): S | undefined {
            let value: TagScalar<S> | undefined = this.shift();
            if (value === undefined)
                return undefined;
            return value.value;
        }

        unshiftScalar<S extends ScalarTypes>(this: TagList<TagScalar<S>> & this, ...items: S[]): number {
            let scalars: T[] = [];
            for (let i: number = 0; i < items.length; i++) {
                let value: T = TagScalar.newScalar(this.elementTagType, items[i]) as any;
                scalars.push(value);
            }
            return TagList.prototype.unshift.apply(this, scalars);
        }

        addScalar<S extends ScalarTypes>(this: TagList<TagScalar<S>> & this, value: S): this {
            this.add(TagScalar.newScalar(this.elementTagType, value));
            return this;
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
        static newAnyList(elementTagType: TagType): TagAnyList {
            if (elementTagType === TagType.End)
                throw new TypeError('Illegal element tag type');
            return new TagList(elementTagType);
        }

        private static checkElement(element: TagBase, elementTagType: TagType): boolean {
            return element !== null && element !== undefined && element.tagType === elementTagType;
        }
    }

    export class TagCompound extends TagBase implements Iterable<[string, TagNormal]> {
        protected readonly map: { [key: string]: TagNormal } = Object.create(null);
        protected _size: number = 0;

        protected constructor() {
            super(TagType.Compound);
        }

        *[Symbol.iterator](): IterableIterator<[string, TagNormal]> {
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

        get(key: string): TagNormal | undefined {
            return this.map[key];
        }

        has(key: string): boolean {
            return key in this.map;
        }

        set(key: string, value: TagNormal): this {
            if (typeof value !== 'object' || !(value instanceof TagBase))
                throw new TypeError('Illegal value');
            if (!TagCompound.checkValue(value))
                throw new TypeError('Illegal value');
            if (!(key in this.map))
                this._size++;
            this.map[key] = value;
            return this;
        }

        get size(): number {
            return this._size;
        }

        static newCompound(): TagCompound { return new TagCompound(); }

        private static checkValue(value: TagNormal): boolean {
            return value !== null && value !== undefined && value.tagType !== TagType.End;
        }
    }

    export namespace Persistence {
        interface IOHandler<T extends TagBase> {
            read(buf: ByteBuffer): T;
            write(buf: ByteBuffer, tag: T): void;
        }

        let handlers: { [key: number]: IOHandler<TagBase> | undefined } = {
            [TagType.End]: {
                read(buf) { return TagEnd.newEnd(); },
                write(buf, tag) { }
            } as IOHandler<TagEnd>,
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
                    buf.append(ByteBuffer.wrap(array));
                }
            } as IOHandler<TagByteArray>,
            [TagType.String]: {
                read(buf) { return TagScalar.newString(readUTF8(buf)); },
                write(buf, tag) { writeUTF8(buf, tag.value); }
            } as IOHandler<TagString>,
            [TagType.List]: {
                read(buf) {
                    let elementTagTypeByte: number = buf.readInt8();
                    let elementTagType: TagType = readTagType(elementTagTypeByte);
                    if (elementTagType === TagType.End)
                        throw new Error('Illegal element tag type');
                    let len: number = buf.readInt32();
                    if (len < 0)
                        throw new RangeError('Illegal size');
                    let tag: TagAnyList = TagList.newAnyList(elementTagType);
                    for (let i: number = 0; i < len; i++) {
                        let element: TagBase = ofHandler<TagBase>(elementTagType).read(buf);
                        tag[i] = element;
                    }
                    return tag;
                },
                write(buf, tag) {
                    let elementTagType: TagType = tag.elementTagType;
                    let elementTagTypeByte: number = writeTagType(elementTagType);
                    buf.writeInt8(elementTagTypeByte);
                    let len: number = tag.length;
                    buf.writeInt32(len);
                    for (let i: number = 0; i < len; i++) {
                        let element: TagBase = tag[i];
                        ofHandler<TagBase>(elementTagType).write(buf, element);
                    }
                }
            } as IOHandler<TagAnyList>,
            [TagType.Compound]: {
                read(buf) {
                    let tag: TagCompound = TagCompound.newCompound();
                    for (let tagHead: TagHead = readTagHead(buf), tagType: TagType = tagHead.tagType;
                        tagType !== TagType.End;
                        tagHead = readTagHead(buf), tagType = tagHead.tagType) {
                        let key: string = tagHead.tagName;
                        let value: TagNormal = ofHandler<TagNormal>(tagType).read(buf);
                        tag.set(key, value);
                    }
                    ofHandler<TagEnd>(TagType.End).read(buf);
                    return tag;
                },
                write(buf, tag) {
                    for (let [key, value] of tag) {
                        let tagType: TagType = value.tagType;
                        writeTagHead(buf, { tagType: tagType, tagName: key });
                        ofHandler<TagBase>(tagType).write(buf, value);
                    }
                    writeTagHead(buf, { tagType: TagType.End, tagName: '' });
                    ofHandler<TagEnd>(TagType.End).write(buf, TagEnd.newEnd());
                }
            } as IOHandler<TagCompound>,
            [TagType.IntArray]: {
                read(buf) {
                    let len: number = buf.readInt32();
                    if (len < 0)
                        throw new RangeError('Illegal size');
                    let bytes: number = len * 4;
                    let array: Buffer = Buffer.from(buf.slice(buf.offset, buf.offset + bytes).toArrayBuffer(true));
                    buf.skip(bytes);
                    return TagScalar.newIntArray(array);
                },
                write(buf, tag) {
                    let array: Buffer = tag.value;
                    let bytes: number = array.length;
                    if (bytes % 4 !== 0)
                        throw new Error('Illegal buffer length');
                    let len: number = bytes / 4;
                    buf.writeInt32(len);
                    buf.append(ByteBuffer.wrap(array));
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
                    return TagScalar.newLongArray(array);
                },
                write(buf, tag) {
                    let array: Buffer = tag.value;
                    let bytes: number = array.length;
                    if (bytes % 8 !== 0)
                        throw new Error('Illegal buffer length');
                    let len: number = bytes / 8;
                    buf.writeInt32(len);
                    buf.append(ByteBuffer.wrap(array));
                }
            } as IOHandler<TagLongArray>
        };

        function ofHandler<T extends TagBase>(tagType: TagType): IOHandler<T> {
            let handler: IOHandler<TagBase> | undefined = handlers[tagType];
            if (handler === undefined)
                throw new Error('No IO handler founded');
            return handler as IOHandler<T>;
        }

        export interface ReadOptions {
            compressed?: boolean;
        }

        export function readRoot(buffer: Buffer, options?: ReadOptions): TagCompound {
            if (options !== undefined) {
                if (options.compressed !== undefined && options.compressed)
                    buffer = gzip.gunzipSync(buffer);
            }
            const byteBuffer = ByteBuffer.wrap(buffer);
            let rootTagHead: TagHead = readTagHead(byteBuffer);
            if (rootTagHead.tagType !== TagType.Compound)
                throw new Error('Root tag must be compound');
            if (rootTagHead.tagName !== '')
                throw new Error('Root tag name must be empty');
            let rootTag: TagCompound = ofHandler<TagCompound>(TagType.Compound).read(byteBuffer);
            return rootTag;
        }

        export interface WriteOptions {
            compressed?: boolean;
        }

        export function writeRoot(rootTag: TagCompound, options?: WriteOptions): Buffer {
            const byteBuffer: ByteBuffer = new ByteBuffer();
            let rootTagHead: TagHead = { tagType: rootTag.tagType, tagName: '' };
            writeTagHead(byteBuffer, rootTagHead);
            ofHandler<TagCompound>(TagType.Compound).write(byteBuffer, rootTag);
            let buffer: Buffer = Buffer.from(byteBuffer.flip().toArrayBuffer());
            if (options !== undefined) {
                if (options.compressed !== undefined && options.compressed)
                    buffer = gzip.gzipSync(buffer);
            }
            return buffer;
        }

        function readTagType(tagTypeByte: number): TagType {
            if (tagTypeByte < 0 || tagTypeByte > 12)
                throw new Error('Illegal tag type');
            return tagTypeByte;
        }

        function writeTagType(tagType: TagType): number {
            let tagTypeByte = tagType;
            return tagTypeByte;
        }

        interface TagHead {
            tagType: TagType;
            tagName: string;
        }

        function readTagHead(buf: ByteBuffer): TagHead {
            let tagTypeByte: number = buf.readInt8();
            let tagType: TagType = readTagType(tagTypeByte);
            if (tagType === TagType.End)
                return { tagType: tagType, tagName: '' };
            let tagNameTag: TagString = ofHandler<TagString>(TagType.String).read(buf);
            let tagName: string = tagNameTag.value;
            return { tagType: tagType, tagName: tagName };
        }

        function writeTagHead(buf: ByteBuffer, tagHead: TagHead): void {
            let tagType: TagType = tagHead.tagType;
            let tagTypeByte: number = writeTagType(tagType);
            buf.writeInt8(tagTypeByte);
            if (tagType === TagType.End)
                return;
            let tagName: string = tagHead.tagName;
            let tagNameTag: TagString = TagScalar.newString(tagName);
            ofHandler<TagString>(TagType.String).write(buf, tagNameTag);
        }
    }
}

export default NBT;

function writeUTF8(out: ByteBuffer, str: string) {
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
            "encoded string too long: " + utflen + " bytes");

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

function readUTF8(buff: ByteBuffer) {
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
                        "malformed input: partial character at end");
                char2 = bytearr[count - 1];
                if ((char2 & 0xC0) != 0x80)
                    throw new Error(
                        "malformed input around byte " + count);
                chararr[chararr_count++] = (((c & 0x1F) << 6) |
                    (char2 & 0x3F));
                break;
            case 14:
                /* 1110 xxxx  10xx xxxx  10xx xxxx */
                count += 3;
                if (count > utflen)
                    throw new Error(
                        "malformed input: partial character at end");
                char2 = bytearr[count - 2];
                char3 = bytearr[count - 1];
                if (((char2 & 0xC0) != 0x80) || ((char3 & 0xC0) != 0x80))
                    throw new Error(
                        "malformed input around byte " + (count - 1));
                chararr[chararr_count++] = (((c & 0x0F) << 12) |
                    ((char2 & 0x3F) << 6) |
                    ((char3 & 0x3F) << 0));
                break;
            default:
                /* 10xx xxxx,  1111 xxxx */
                throw new Error(
                    "malformed input around byte " + count);
        }
    }
    // The number of chars produced may be less than utflen
    return chararr.map(i => String.fromCharCode(i)).join('')
}
