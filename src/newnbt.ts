import * as gzip from 'zlib'
import * as ByteBuffer from 'bytebuffer'
import * as Long from 'long'

export namespace NEWNBT {
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

        asTagByte(): TagByte { if (this.tagType !== TagType.Byte) throw 'Illegal tag type'; return this as any; };
        asTagShort(): TagShort { if (this.tagType !== TagType.Short) throw 'Illegal tag type'; return this as any; };
        asTagInt(): TagInt { if (this.tagType !== TagType.Int) throw 'Illegal tag type'; return this as any; };
        asTagLong(): TagLong { if (this.tagType !== TagType.Long) throw 'Illegal tag type'; return this as any; };
        asTagFloat(): TagFloat { if (this.tagType !== TagType.Float) throw 'Illegal tag type'; return this as any; };
        asTagDouble(): TagDouble { if (this.tagType !== TagType.Double) throw 'Illegal tag type'; return this as any; };
        asTagByteArray(): TagByteArray { if (this.tagType !== TagType.ByteArray) throw 'Illegal tag type'; return this as any; };
        asTagString(): TagString { if (this.tagType !== TagType.String) throw 'Illegal tag type'; return this as any; };
        asTagList(): TagAnyList { if (this.tagType !== TagType.List) throw 'Illegal tag type'; return this as any; };
        asTagCompound(): TagCompound { if (this.tagType !== TagType.Compound) throw 'Illegal tag type'; return this as any; };
        asTagIntArray(): TagIntArray { if (this.tagType !== TagType.IntArray) throw 'Illegal tag type'; return this as any; };
        asTagLongArray(): TagLongArray { if (this.tagType !== TagType.LongArray) throw 'Illegal tag type'; return this as any; };
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
                throw 'Illegal tagType';
            else if (typeof value === 'undefined')
                throw 'Illegal value';
            else if (value === null)
                throw 'Illegal value';
            else {
                switch (tagType) {
                case TagType.Byte:
                    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 0xFF)
                        throw 'Illegal value';
                    break;
                case TagType.Short:
                    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 0xFFFF)
                        throw 'Illegal value';
                    break;
                case TagType.Int:
                    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 0xFFFFFFFF)
                        throw 'Illegal value';
                    break;
                case TagType.Long:
                    if (typeof value !== 'object' || !(value instanceof Long))
                        throw 'Illegal value';
                    break;
                case TagType.Float:
                    if (typeof value !== 'number')
                        throw 'Illegal value';
                    break;
                case TagType.Double:
                    if (typeof value !== 'number')
                        throw 'Illegal value';
                    break;
                case TagType.ByteArray:
                    if (typeof value !== 'object' || !(value instanceof Buffer))
                        throw 'Illegal value';
                    break;
                case TagType.String:
                    if (typeof value !== 'string')
                        throw 'Illegal value';
                    break;
                case TagType.IntArray:
                    if (typeof value !== 'object' || !(value instanceof Buffer) || value.length % 4 !== 0)
                        throw 'Illegal value';
                    break;
                case TagType.LongArray:
                    if (typeof value !== 'object' || !(value instanceof Buffer) || value.length % 8 !== 0)
                        throw 'Illegal value';
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
                throw 'Illegal length';
            this.list.length = length;
        }

        push(...items: T[]): number {
            for (let i: number = 0; i < items.length; i++) {
                let value: T = items[i];
                if (typeof value !== 'object' || !(value instanceof TagBase))
                    throw 'Illegal element';
                if (!TagList.checkElement(value, this.elementTagType))
                    throw 'Illegal element';
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
                    throw 'Illegal element';
                if (!TagList.checkElement(value, this.elementTagType))
                    throw 'Illegal element';
            }
            return Array.prototype.unshift.apply(this.list, items);
        }

        *[Symbol.iterator](): IterableIterator<T> {
            for (let i: number = 0; i < this.list.length; i++)
                yield this.list[i];
        }

        [index: number]: T;

        asTagListByte(): TagList<TagByte> { if (this.elementTagType !== TagType.Byte) throw 'Illegal element tag type'; return this as any; };
        asTagListShort(): TagList<TagShort> { if (this.elementTagType !== TagType.Short) throw 'Illegal element tag type'; return this as any; };
        asTagListInt(): TagList<TagInt> { if (this.elementTagType !== TagType.Int) throw 'Illegal element tag type'; return this as any; };
        asTagListLong(): TagList<TagLong> { if (this.elementTagType !== TagType.Long) throw 'Illegal element tag type'; return this as any; };
        asTagListFloat(): TagList<TagFloat> { if (this.elementTagType !== TagType.Float) throw 'Illegal element tag type'; return this as any; };
        asTagListDouble(): TagList<TagDouble> { if (this.elementTagType !== TagType.Double) throw 'Illegal element tag type'; return this as any; };
        asTagListByteArray(): TagList<TagByteArray> { if (this.elementTagType !== TagType.ByteArray) throw 'Illegal element tag type'; return this as any; };
        asTagListString(): TagList<TagString> { if (this.elementTagType !== TagType.String) throw 'Illegal element tag type'; return this as any; };
        asTagListList(): TagList<TagAnyList> { if (this.elementTagType !== TagType.List) throw 'Illegal element tag type'; return this as any; };
        asTagListCompound(): TagList<TagCompound> { if (this.elementTagType !== TagType.Compound) throw 'Illegal element tag type'; return this as any; };
        asTagListIntArray(): TagList<TagIntArray> { if (this.elementTagType !== TagType.IntArray) throw 'Illegal element tag type'; return this as any; };
        asTagListLongArray(): TagList<TagLongArray> { if (this.elementTagType !== TagType.LongArray) throw 'Illegal element tag type'; return this as any; };

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
                throw 'Illegal element';
            if (value === null || value === undefined)
                throw 'Illegal element';
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
}
