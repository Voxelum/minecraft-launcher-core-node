import * as gzip from 'zlib'
import * as ByteBuffer from 'bytebuffer'

import { readString, writeString } from './utils'

//not finished yet...
export namespace NBT {
    export enum Type {
        End = 0, Byte = 1, Short = 2, Int = 3, Long = 4, Float = 5, Double = 6,
        ByteArray = 7, String = 8, List = 9, Compound = 10, IntArray = 11
    }

    class Scheme {
        constructor(private scheme: any) {
        }

        getType(...paths: string[]): NBT.Type | any {
            if (!paths) return NBT.Type.Compound;
            let current = this.scheme;
            for (let path of paths) {
                current = current[path];
                if (!current)
                    return NBT.Type.End;
            }
            return current;
        }
    }

    let visitors: Visitor[] = [
        { read(buf) { }, write(buf, v) { } }, //end
        { read: (buf) => buf.readByte(), write(buf, v) { buf.writeByte(v) } }, //byte
        { read: (buf) => buf.readShort(), write(buf, v) { buf.writeShort(v) } }, //short
        { read: (buf) => buf.readInt(), write(buf, v) { buf.writeInt(v) } }, //int
        { read: (buf) => buf.readLong(), write(buf, v) { buf.writeInt64(v) } }, //long
        { read: (buf) => buf.readFloat(), write(buf, v) { buf.writeFloat(v) } }, //float
        { read: (buf) => buf.readDouble(), write(buf, v) { buf.writeDouble(v) } }, //double
        { //byte array
            read(buf) {
                let len = buf.readInt();
                let arr: number[] = new Array(len);
                for (let i = 0; i < len; i++) arr[i] = buf.readByte();
                return arr;
            },
            write(buf, arr) {
                buf.writeInt(arr.length)
                for (let i = 0; i < arr.length; i++)  buf.writeByte(arr[i])
            }
        },
        { //string
            read(buf) { return readString(buf); }, write(buf, v) { writeString(buf, v) }
        },
        { //list
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
            write(buf, value, context) {
                const { scope, find } = context
                const type = scope[0]
                if (typeof (type) === 'number') {
                    let writer = visitors[type]
                    for (let v of value)
                        writer.write(buf, v, { scope: type, find })
                }
                else if (typeof (type) === 'string') {
                    let found = find(type)
                    if (!found) throw new Error(`Cannot find type ${type}!`)
                    buf.writeByte(NBT.Type.Compound);
                    buf.writeInt(value.length);
                    let writer = visitors[NBT.Type.Compound];
                    for (let v of value)
                        writer.write(buf, v, { scope: found, find })
                }
                else if (typeof (type) === 'object') {
                    let writer = visitors[NBT.Type.Compound];
                    for (let v of value)
                        writer.write(buf, v, { scope: type, find })
                }
                else throw new Error("WTH")
            }
        },
        {//tag compound
            read(buf, scope) {
                let object: any = {};
                for (let type = 0; (type = buf.readByte()) != 0;) {
                    let name = visitors[Type.String].read(buf);
                    let visitor = visitors[type]
                    if (!visitor)
                        throw "No such tag id " + type;
                    if (type == Type.Compound) {
                        let newScope = {};
                        scope[name] = newScope;
                        object[name] = visitor.read(buf, newScope)
                    } else if (type == Type.List) {
                        let newScope: any[] | number = [];
                        object[name] = visitor.read(buf, newScope)
                        if (newScope.length == 1)
                            if (typeof (newScope[0]) === 'number')
                                newScope = newScope[0]
                        scope[name] = newScope;
                    } else {
                        scope[name] = type;
                        object[name] = visitor.read(buf)
                    }
                }
                return object;
            },
            write(buf, obj, context) {
                const { scope, find } = context
                for (let key in obj) {
                    visitors[Type.String].write(buf, key, context)
                    let value = obj[key]
                    const scopeValue = scope[key]
                    const $type = typeof scopeValue;
                    if ($type === 'number') {
                        let writer = visitors[scopeValue]
                        if (!writer) throw "Unknown type " + scopeValue;
                        writer.write(buf, value, context)
                    } else if ($type === 'string') {
                        let writer = visitors[NBT.Type.Compound]
                        //support custom type
                        writer.write(buf, value, { scope: find(scopeValue), find })
                    } else if (scopeValue instanceof Array) {
                        let writer = visitors[NBT.Type.List]
                        writer.write(buf, value, { scope: scopeValue, find })
                    } else if ($type === 'object') {
                        let writer = visitors[NBT.Type.Compound]
                        writer.write(buf, value, { scope: scopeValue, find })
                    } else throw new Error("WTF")
                }
            }
        },
        { //int array
            read(buf) {
                let len = buf.readInt();
                let arr: number[] = new Array(len);
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
        write(buf: ByteBuffer, value: any, context: { scope?: any, find: (id: string) => any }): void;
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
        protected constructor(readonly type: NBT.Type, protected _value: any) { }

        get numberValue(): number {
            if (this.isNumber) return this._value
            else throw 'Wrong Type'
        }
        get stringValue(): string {
            if (this.isString) return this._value
            else throw 'Wrong Type'
        }
        get longValue(): Long {
            if (this.isLong) return this._value
            else throw 'Wrong Type'
        }
        get compoundValue(): Compound {
            if (this.isCompound) return <Compound><any>this
            else throw 'Wrong Type'
        }
        get listValue(): List {
            if (this.isList) return <List><any>this
            else throw 'Wrong Type'
        }
        get numberArrayValue(): number[] {
            if (this.isNumberArray) return this._value
            else throw 'Wrong Type'
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

        abstract toJSON(): object;
    }

    class Empty extends Base {
        constructor() { super(Type.End, null) }
        toJSON() { return {} }
    }

    export const EMPTY: Base = new Empty()
    export class List extends Base {
        constructor(type: Type) { super(type, []) }

        toJSON() {
            return {}
        }
    }

    export class Compound extends Base {
        constructor(original?: Compound | { [key: string]: Base } | Map<string, Base>) { super(Type.Compound, {}) }
        boolean(name: string, value: boolean): this { this._value[name] = new Primitive(Type.Byte, value); return this }
        byte(name: string, value: number): this { this._value[name] = new Primitive(Type.Byte, value); return this; }
        short(name: string, value: number): this { this._value[name] = new Primitive(Type.Short, value); return this; }
        int(name: string, value: number): this { this._value[name] = new Primitive(Type.Int, value); return this; }
        long(name: string, value: number | Long): this { this._value[name] = new Primitive(Type.Long, value); return this; }
        float(name: string, value: number): this { this._value[name] = new Primitive(Type.Float, value); return this; }
        double(name: string, value: number): this { this._value[name] = new Primitive(Type.Double, value); return this; }
        string(name: string, value: string): this { this._value[name] = new Primitive(Type.String, value); return this }
        bytes(name: string, value: number[]): this { this._value[name] = new Primitive(Type.ByteArray, value); return this; }
        ints(name: string, value: number[]): this { this._value[name] = new Primitive(Type.IntArray, value); return this; }
        nbt(name: string, value: Base): this { this._value[name] = value; return this }

        get(name: string, fallback?: Base): Base | undefined {
            const val = this._value[name];
            return val ? val : fallback;
        }
        has(name: string): boolean { return this._value[name] !== undefined }
        toJSON() {
            return {}
        }
    }
    export class Primitive extends Base {
        constructor(type: NBT.Type, _value: string | number | boolean | number[] | Long) { super(type, _value) }
        toJSON() {
            return {}
        }
    }
}

export default NBT;