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

    export type ScalarTypes = number | Long | string | Buffer;

    export abstract class TagBase {
        protected constructor(readonly tagType: TagType) {}
    }

    export class TagScalar<T extends ScalarTypes> extends TagBase {
        protected constructor(tagType: TagType, protected value: T) {
            super(tagType);
            TagScalar.checkTagValue(tagType, value);
        }

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
                    if (typeof value !== 'object' || !(value instanceof Buffer) || value.length % 4 != 0)
                        throw 'Illegal value';
                    break;
                case TagType.LongArray:
                    if (typeof value !== 'object' || !(value instanceof Buffer) || value.length % 8 != 0)
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
}