import * as gzip from 'zlib'
import * as ByteBuffer from 'bytebuffer'

//not finished yet...
export namespace NBT {
    interface IO {
        read(buf: ByteBuffer, find: (shape: string) => string | undefined): { type: any, value: any };
        write(buf: ByteBuffer, value: any, scope: any, find: (id: string) => any): void;
    }
    export enum Type {
        End = 0, Byte = 1, Short = 2, Int = 3, Long = 4, Float = 5, Double = 6,
        ByteArray = 7, String = 8, List = 9, Compound = 10, IntArray = 11
    }

    export function parse(fileData: Buffer, compressed: boolean = false, find: (shape: string) => string | undefined = () => undefined): { value: any, type: any | string } {
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

    export function serializer() {
        return new Serializer()
    }

    export class Serializer {
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
            buffer.writeByte(Type.Compound);
            writeUTF8(buffer, '');
            visitors[Type.Compound].write(buffer, object, schema, (id) => this.registry[id])

            if (compressed) {
                return gzip.gzipSync(Buffer.from(buffer.flip().toArrayBuffer()));
            } else {
                return Buffer.from(buffer.flip().toArrayBuffer());
            }
        }
        deserialize(buf: Buffer, compressed: boolean = false): { value: any, type: any | string } {
            return parse(buf, compressed, (shape) => this.reversedRegistry[shape]);
        }
    }

    function readRootTag(buffer: ByteBuffer, find: (shape: string) => string | undefined) {
        let rootType = buffer.readByte();
        if (rootType == 0) throw new Error('NBTEnd');
        if (rootType != 10) throw new Error("Root tag must be a named compound tag.");
        readUTF8(buffer); //I think this is the nameProperty of the file...
        return visitors[Type.Compound].read(buffer, find);
    }

    function val(type: any, value: any) { return { type, value } }
    const visitors: IO[] = [
        { read: (buf) => val(NBT.Type.End, undefined), write(buf, v) { } }, //end
        { read: (buf) => val(NBT.Type.Byte, buf.readByte()), write(buf, v) { buf.writeByte(v) } }, //byte
        { read: (buf) => val(NBT.Type.Short, buf.readShort()), write(buf, v) { buf.writeShort(v) } }, //short
        { read: (buf) => val(NBT.Type.Int, buf.readInt()), write(buf, v) { buf.writeInt(v) } }, //int
        { read: (buf) => val(NBT.Type.Long, buf.readLong()), write(buf, v) { buf.writeInt64(v) } }, //long
        { read: (buf) => val(NBT.Type.Float, buf.readFloat()), write(buf, v) { buf.writeFloat(v) } }, //float
        { read: (buf) => val(NBT.Type.Double, buf.readDouble()), write(buf, v) { buf.writeDouble(v) } }, //double
        { //byte array
            read(buf) {
                let len = buf.readInt();
                let arr: number[] = new Array(len);
                for (let i = 0; i < len; i++) arr[i] = buf.readByte();
                return val(NBT.Type.ByteArray, arr);
            },
            write(buf, arr) {
                buf.writeInt(arr.length)
                for (let i = 0; i < arr.length; i++)  buf.writeByte(arr[i])
            }
        },
        { //string
            read(buf) { return val(NBT.Type.String, readUTF8(buf)); },
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
                    buf.writeByte(NBT.Type.Compound);
                    buf.writeInt(value.length);
                    let writer = visitors[NBT.Type.Compound];
                    for (let v of value) writer.write(buf, v, customScope, find)
                }
                else if (typeof type === 'object') {
                    let writer = visitors[NBT.Type.Compound];
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
                        nextType = NBT.Type.List
                    } else if (typeof type === 'string') {
                        nextType = NBT.Type.Compound;
                        nextScope = find(type);  //support custom type
                        if (!nextScope) throw `Unknown custom type [${type}]`
                    } else if (typeof type === 'object') {
                        nextType = NBT.Type.Compound
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
                return val(NBT.Type.IntArray, arr);
            },
            write(buf, v) {
                buf.writeInt(v.length)
                for (let i = 0; i < v.length; i++) buf.writeInt(v[i])
            }
        }
    ];

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
