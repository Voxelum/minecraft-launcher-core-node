import * as gzip from 'zlib'
import * as ByteBuffer from 'bytebuffer'

import { readString, writeString } from './alt_string'

//not finished yet...
export namespace NBT {
    export enum Type {
        End, Byte, Short, Int, Long, Float, Double, ByteArray, String, List, Compound, IntArray
    }

    let visitors: Visitor[] = [
        { read(buf) { }, write(buf, v) { } },
        { read(buf) { return buf.readByte(); }, write(buf, v) { buf.writeByte(v) } },
        { read(buf) { return buf.readShort(); }, write(buf, v) { buf.writeShort(v) } },
        { read(buf) { return buf.readInt(); }, write(buf, v) { buf.writeInt(v) } },
        { read(buf) { return buf.readLong(); }, write(buf, v) { buf.writeInt64(v) } },
        { read(buf) { return buf.readFloat(); }, write(buf, v) { buf.writeFloat(v) } },
        { read(buf) { return buf.readDouble(); }, write(buf, v) { buf.writeDouble(v) } },
        {
            read(buf) {
                let len = buf.readInt();
                let arr: number[] = new Array(length);
                for (let i = 0; i < len; i++) arr[i] = buf.readByte();
                return arr;
            },
            write(buf, arr) {
                buf.writeInt(arr.length)
                for (let i = 0; i < arr.length; i++)  buf.writeByte(arr[i])
            }
        },
        {
            read(buf) { return readString(buf); }, write(buf, v) { writeString(buf, v) }
        },
        {
            read(buf, schemaScope) {
                let id = buf.readByte();
                let len = buf.readInt();
                let arr = new Array(len);
                let visitor = visitors[id];
                if (id == Type.Compound) {
                    for (let i = 0; i < len; i++) {
                        let newScope: object = {};
                        arr[i] = visitor.read(buf, newScope);
                        schemaScope.push(newScope)
                    }
                }
                else for (let i = 0; i < len; i++) arr[i] = visitor.read(buf);
                return arr;
            },
            write(buf, v, schemaScope) {
                if (schemaScope) {
                    if (typeof (schemaScope) === 'number') {

                    }
                    else if (typeof (schemaScope) === 'string') {

                    }
                    else if (schemaScope.length) {
                        let visitor = visitors[Type.Compound]
                        for (let i = 0; i < schemaScope.length; i++) {
                            visitor.write(buf, v[i], )
                        }
                    }
                }
                else {

                }
            }
        },
        {//tag compound
            read(buf, schemaScope) {
                let object: any = {};
                for (let type = 0; (type = buf.readByte()) != 0;) {
                    let name = visitors[Type.String].read(buf);
                    let visitor = visitors[type]
                    if (!visitor)
                        throw "No such tag id " + type;
                    if (type == Type.Compound) {
                        let newScope = {};
                        schemaScope[name] = newScope;
                        object[name] = visitor.read(buf, newScope)
                    }
                    else if (type == Type.List) {
                        let newScope: any[] | number = [];
                        object[name] = visitor.read(buf, newScope)
                        if (newScope.length == 1)
                            if (typeof (newScope[0]) === 'number')
                                newScope = newScope[0]
                        schemaScope[name] = newScope;
                    }
                    else {
                        schemaScope[name] = type;
                        object[name] = visitor.read(buf)
                    }
                }
                return object;
            },
            write(buf, obj, scope) {
                for (let key in obj) {
                    visitors[Type.String].write(buf, key)
                    let value = obj[key]
                    let type = scope[key]
                    let writer = visitors[type]
                    if (!writer) throw "Unknown type " + type
                    if (type == Type.List) {

                    }
                    writer.write(buf, value)
                }
            }
        },
        {
            read(buf) {
                let len = buf.readInt();
                let arr: number[] = new Array(length);
                for (let i = 0; i < len; i++) arr[i] = buf.readInt();
                return arr;
            },
            write(buf, v) {
                buf.writeInt(v.length)
                for (let i = 0; i < v.length; i++) buf.writeInt(v[i])
            }
        }
    ];

    interface Visitor {
        read(buf: ByteBuffer, schemaObject?: any): any;
        write(buf: ByteBuffer, value: any, schemaObject?: any): void;
    }

    export function read(fileData: Buffer, compressed: boolean = false): { root: any, schema: any } {
        if (compressed) {
            let zip = gzip.gunzipSync(fileData);
            let bytebuffer = ByteBuffer.wrap(zip);
            return readRootTag(bytebuffer)
        }
        else {
            let bytebuffer = ByteBuffer.wrap(fileData);
            return readRootTag(bytebuffer)
        }
    }

    function readRootTag(buffer: ByteBuffer): { root: any, schema: any } {
        let rootType = buffer.readByte();
        if (rootType == 0) throw new Error('NBTEnd');
        if (rootType != 10) throw new Error("Root tag must be a named compound tag.");
        visitors[Type.String].read(buffer); //I think this is the nameProperty of the file...
        let scope = {}
        let obj = visitors[Type.Compound].read(buffer, scope);
        return { root: obj, schema: scope }
    }

    export function write(schema?: any, compressed: boolean = false): Buffer {
        let arr = new ArrayBuffer(4)
        ByteBuffer.wrap(arr)
        return Buffer.from('')
    }

    export abstract class Base {
        protected constructor(readonly type: NBT.Type) { }

        protected abstract _value: any
        get numberValue(): number {
            if (this.isNumber) return this._value
            else throw ''
        }
        get stringValue(): string {
            if (this.isString) return this._value
            else throw ''
        }
        get longValue(): Long {
            if (this.isLong) return this._value
            else throw ''
        }
        get compoundValue(): Compound {
            if (this.isCompound) return <Compound><any>this
            else throw ''
        }
        get listValue(): List {
            if (this.isList) return <List><any>this
            else throw ''
        }
        get numberArrayValue(): number[] {
            if (this.isNumberArray) return this._value
            else throw ''
        }
        get isNumber(): boolean {
            return this.type == NBT.Type.Int ||
                this.type == NBT.Type.Byte ||
                this.type == NBT.Type.Short ||
                this.type == NBT.Type.Float ||
                this.type == NBT.Type.Double
        }
        get isString(): boolean { return this.type == Type.String }
        get isNumberArray(): boolean {
            return this.type == Type.IntArray ||
                this.type == Type.ByteArray
        }
        get isList(): boolean {
            return this.type == Type.List
        }
        get isLong(): boolean { return this.type == Type.Long }
        get isCompound(): boolean { return this.type == Type.Compound }
    }

    export class List extends Base {
        constructor(type: Type) { super(type) }
        protected _value: any
    }
    export class Compound extends Base {
        constructor(type: Type) { super(type) }
        protected _value: any

        // [key: string]: Base
    }
    export class Primitive extends Base {
        private constructor(type: NBT.Type, protected _value: any) { super(type) }
    }
}