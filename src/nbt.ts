import * as gzip from 'zlib'
import * as ByteBuffer from 'bytebuffer'

//not finished yet...
export namespace NBT {
    export enum Type {
        End = 0, Byte = 1, Short = 2, Int = 3, Long = 4, Float = 5, Double = 6,
        ByteArray = 7, String = 8, List = 9, Compound = 10, IntArray = 11
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
            read(buf) { return readUTF8(buf); },
            write(buf, v) { writeUTF8(buf, v) }
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

    export function compound(original?: Compound | { [key: string]: Base } | Map<string, Base>, deepcopy: boolean = false) {
        return new NBT.Compound(original, deepcopy);
    }
    export function list(list: Base[]): List { return new List(list) }
    export function boolean(value: boolean): Primitive { return new Primitive(Type.Byte, value); }
    export function byte(value: number): Primitive { return new Primitive(Type.Byte, value);; }
    export function short(value: number): Primitive { return new Primitive(Type.Short, value);; }
    export function int(value: number): Primitive { return new Primitive(Type.Int, value);; }
    export function long(value: number | Long): Primitive { return new Primitive(Type.Long, value);; }
    export function float(value: number): Primitive { return new Primitive(Type.Float, value);; }
    export function double(value: number): Primitive { return new Primitive(Type.Double, value);; }
    export function string(value: string): Primitive { return new Primitive(Type.String, value); }
    export function bytes(value: number[]): Primitive { return new Primitive(Type.ByteArray, value);; }
    export function ints(value: number[]): Primitive { return new Primitive(Type.IntArray, value);; }

    export function parse(fileData: Buffer, compressed: boolean = false): { root: any, schema: any } {
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

    export function write(tag: Compound, compressed: boolean = false): Buffer {
        const buffer = new ByteBuffer();
        buffer.writeByte(Type.Compound);
        writeUTF8(buffer, '');
        writeTag(tag, buffer);
        if (compressed) {
            return gzip.gzipSync(Buffer.from(buffer.flip().toArrayBuffer()));
        } else {
            return Buffer.from(buffer.flip().toArrayBuffer());
        }
    }

    function writeTag(tag: Base, buffer: ByteBuffer) {
        if (tag.type === Type.Compound) {
            const compound = <Compound><any>tag
            for (const key of compound.keys()) {
                const val = compound.value[key]
                buffer.writeByte(val.type)
                writeUTF8(buffer, key)
                writeTag(val, buffer);
            }
            buffer.writeByte(0);
        }
        else if (tag.type === Type.List) {
            const list = <List><any>tag;
            const type = list.length === 0 ? 1 : list.value[0].type;
            buffer.writeByte(type)
            buffer.writeInt(list.length)
            for (const val of list.value) {
                if (val.type === type)
                    writeTag(val, buffer)
                else throw new Error(`Invalid type [${val.type}] for list with type [${type}]`)
            }
        } else
            visitors[tag.type].write(buffer, tag.value, { find() { } })
    }

    export abstract class Base {
        protected constructor(readonly type: NBT.Type, readonly value: any) { }
        abstract toJSON(): object;
    }

    class Empty extends Base {
        constructor() { super(Type.End, null) }
        toJSON() { return {} }
    }

    export const EMPTY: Base = new Empty()

    export class List extends Base {
        constructor(list?: Base[]) {
            super(Type.List, list ? list : []);
        }
        get length() { return this.value.length; }
        readonly value: Array<Base>;
        toJSON() {
            return this.value.map(v => v.toJSON());
        }
    }

    export class Compound extends Base {
        constructor(original?: Compound | { [key: string]: Base } | Map<string, Base>, deepcopy: boolean = false) {
            super(Type.Compound, {})
            let val: any;
            if (original instanceof Compound) {
                val = deepcopy ? JSON.parse(JSON.stringify(original.value)) : { ...original.value }
            } else if (original instanceof Map) {
                val = {}
                original.forEach((v, k) => { val[k] = v; })
            } else {
                val = deepcopy ? JSON.parse(JSON.stringify(original)) : { ...original }
            }
            (this as any).value = val;
        }

        boolean(name: string, value: boolean): this { this.value[name] = new Primitive(Type.Byte, value); return this }
        byte(name: string, value: number): this { this.value[name] = new Primitive(Type.Byte, value); return this; }
        short(name: string, value: number): this { this.value[name] = new Primitive(Type.Short, value); return this; }
        int(name: string, value: number): this { this.value[name] = new Primitive(Type.Int, value); return this; }
        long(name: string, value: number | Long): this { this.value[name] = new Primitive(Type.Long, value); return this; }
        float(name: string, value: number): this { this.value[name] = new Primitive(Type.Float, value); return this; }
        double(name: string, value: number): this { this.value[name] = new Primitive(Type.Double, value); return this; }
        string(name: string, value: string): this { this.value[name] = new Primitive(Type.String, value); return this }
        compound(name: string, value: Compound): this { this.value[name] = value; return this }

        bytes(name: string, value: number[]): this { this.value[name] = new Primitive(Type.ByteArray, value); return this; }
        ints(name: string, value: number[]): this { this.value[name] = new Primitive(Type.IntArray, value); return this; }
        shorts(name: string, value: number[]): this { this.value[name] = new List(value.map(v => new Primitive(Type.Short, v))); return this; }
        longs(name: string, value: number[] | Long[]): this { this.value[name] = new List((value as any[]).map((v) => new Primitive(Type.Long, v))); return this; }
        floats(name: string, value: number[]): this { this.value[name] = new List(value.map(v => new Primitive(Type.Float, v))); return this; }
        doubles(name: string, value: number[]): this { this.value[name] = new List(value.map(v => new Primitive(Type.Double, v))); return this; }
        strings(name: string, value: string[]): this { this.value[name] = new List(value.map(v => new Primitive(Type.String, v))); return this }
        compounds(name: string, value: Compound[]): this { this.value[name] = new List(value); return this; }

        list(name: string, value: Base[]): this {
            if (value.length == 0) return this;
            this.value[name] = new List(value)
            return this;
        }

        nbt(name: string, value: Base): this { this.value[name] = value; return this }
        get(name: string, fallback?: Base): Base | undefined {
            const val = this.value[name];
            return val ? val : fallback;
        }
        has(name: string): boolean { return this.value[name] !== undefined }
        keys() { return Object.keys(this.value) }
        [Symbol.iterator]() { return this.keys().map(k => this.value[k]) }
        values() { return this.keys().map(k => this.value[k]) }
        readonly value: { [key: string]: Base };
        toJSON() {
            return this.keys().map(k => Object.create({ [k]: this.value[k].toJSON() }))
                .reduce((prev, cur) => Object.assign(cur, prev));
        }
    }
    export class Primitive extends Base {
        constructor(type: NBT.Type, value: string | number | boolean | number[] | Long) { super(type, value) }
        toJSON() {
            return (this.value instanceof Array) ? [...this.value] : this.value;
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
