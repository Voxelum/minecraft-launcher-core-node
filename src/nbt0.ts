import * as gzip from 'zlib'
import * as ByteBuffer from 'bytebuffer'
import * as Long from 'long'
import { readUTF8, writeUTF8 } from './utils/utf8'

import { NBT } from './nbt';

type Finder = (schema: CompoundSchema) => string | undefined;

declare module './nbt' {
    namespace NBT {
        interface Schema {
            [string: string]: NBT.TagType | string | Schema | Array<NBT.TagType | string | Schema>;
        }
        type Type = Schema | string;
        interface TypedObject {
            readonly __nbtPrototype__: Schema;
            [key: string]: any;
        }
        class Serializer {
            static create(): Serializer;
            static serialize(object: TypedObject, compressed?: boolean): Buffer;
            static deserialize(fileData: Buffer, compressed?: boolean, find?: (schema: Schema) => string | undefined): TypedObject;
            register(type: string, schema: Schema): this;
            serialize(object: object, type: Type, compressed?: boolean): Buffer;
            deserialize<T>(fileData: Buffer, compressed?: boolean): { value: T, type: Type };
        }
    }
}

type CompoundSchema = NBT.Schema;
type ArraySchema = Array<NBT.TagType | string | CompoundSchema>;
type Scope = ArraySchema | CompoundSchema;


// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
function deepFreeze(obj: any) {
    // Retrieve the property names defined on obj
    var propNames = Object.getOwnPropertyNames(obj);
    // Freeze properties before freezing self
    propNames.forEach(function (name) {
        var prop = obj[name];
        // Freeze prop if it is an object
        if (typeof prop == 'object' && prop !== null)
            deepFreeze(prop);
    });
    // Freeze self (no-op if already frozen)
    return Object.freeze(obj);
}

NBT.Serializer = class Serializer {
    static create() {
        return new Serializer();
    }
    static deserialize(fileData: Buffer, compressed?: boolean): NBT.TypedObject {
        if (compressed) {
            const { value, type } = readRootTag(ByteBuffer.wrap(gzip.gunzipSync(fileData)));
            deepFreeze(type);
            Object.defineProperty(value, '__nbtPrototype__', { value: type })
            return value;
        }
        else {
            const { value, type } = readRootTag(ByteBuffer.wrap(fileData));
            deepFreeze(type);
            Object.defineProperty(value, '__nbtPrototype__', { value: type })
            return value;
        }
    }
    static serialize(object: NBT.TypedObject, compressed?: boolean): Buffer {
        return writeRootTag(object, compressed || false, object.__nbtPrototype__);
    }

    private registry: { [id: string]: CompoundSchema } = {};
    private reversedRegistry: { [shape: string]: string } = {};
    register(type: string, schema: CompoundSchema): this {
        if (schema === undefined) throw new Error();
        this.registry[type] = schema;
        this.reversedRegistry[JSON.stringify(schema)] = type;
        return this;
    }
    serialize(object: object, type: string, compressed: boolean = false) {
        const schema = this.registry[type]
        if (!schema) throw `Unknown type [${schema}]`

        return writeRootTag(object, compressed, schema, (id) => this.registry[id]);
    }
    deserialize(fileData: Buffer, compressed: boolean = false): { value: any, type: any | string } {
        if (compressed) {
            let zip = gzip.gunzipSync(fileData);
            let bytebuffer = ByteBuffer.wrap(zip);
            return readRootTag(bytebuffer, (shape) => this.reversedRegistry[JSON.stringify(shape)])
        }
        else {
            let bytebuffer = ByteBuffer.wrap(fileData);
            return readRootTag(bytebuffer, (shape) => this.reversedRegistry[JSON.stringify(shape)])
        }
    }
}

function writeRootTag(value: any, compressed: boolean, scope?: Scope, find?: (id: string) => CompoundSchema) {
    const buffer = new ByteBuffer();
    buffer.writeByte(NBT.TagType.Compound);
    writeUTF8(buffer, '');
    visitors[NBT.TagType.Compound].write(buffer, value, scope, find);

    if (compressed) {
        return gzip.gzipSync(Buffer.from(buffer.flip().toArrayBuffer()));
    } else {
        return Buffer.from(buffer.flip().toArrayBuffer());
    }
}

function readRootTag(buffer: ByteBuffer, find?: Finder) {
    let rootType = buffer.readByte();
    if (rootType == 0) throw new Error('NBTEnd');
    if (rootType != 10) throw new Error("Root tag must be a named compound tag.");
    readUTF8(buffer); //I think this is the nameProperty of the file...
    return visitors[NBT.TagType.Compound].read(buffer, find) as { type: CompoundSchema | string, value: any };
}

function val(type: any, value: any) { return { type, value } }

interface IO {
    read(buf: ByteBuffer, find?: Finder): { type: Scope | NBT.TagType, value: any };
    write(buf: ByteBuffer, value: any, scope?: Scope, find?: (id: string) => CompoundSchema): void;
}
const visitors: IO[] = [
    { read: (buf) => val(NBT.TagType.End, undefined), write(buf, v) { } }, //end
    { read: (buf) => val(NBT.TagType.Byte, buf.readByte()), write(buf, v) { buf.writeByte(v) } }, //byte
    { read: (buf) => val(NBT.TagType.Short, buf.readShort()), write(buf, v) { buf.writeShort(v) } }, //short
    { read: (buf) => val(NBT.TagType.Int, buf.readInt()), write(buf, v) { buf.writeInt(v) } }, //int
    { read: (buf) => val(NBT.TagType.Long, buf.readLong()), write(buf, v) { buf.writeInt64(v) } }, //long
    { read: (buf) => val(NBT.TagType.Float, buf.readFloat()), write(buf, v) { buf.writeFloat(v) } }, //float
    { read: (buf) => val(NBT.TagType.Double, buf.readDouble()), write(buf, v) { buf.writeDouble(v) } }, //double
    { //byte array
        read(buf) {
            const arr = new Array<number>(buf.readInt());
            for (let i = 0; i < arr.length; i++) arr[i] = buf.readByte();
            return val(NBT.TagType.ByteArray, arr);
        },
        write(buf, arr) {
            buf.writeInt(arr.length);
            for (let i = 0; i < arr.length; i++)  buf.writeByte(arr[i]);
        }
    },
    { //string
        read(buf) { return val(NBT.TagType.String, readUTF8(buf)); },
        write(buf, v) { writeUTF8(buf, v) }
    },
    { //list
        read(buf, find) {
            const listType = buf.readByte();
            const len = buf.readInt();
            let list = new Array(len);
            let scope: any = undefined;
            for (let i = 0; i < len; i++) {
                const { type, value } = visitors[listType].read(buf, find);
                list[i] = value;
                scope = [type];
            }
            return val(scope, list);
        },
        write(buf, value: Array<any>, scope, find) {
            if (!scope || !find) throw new Error();
            const type = (scope as ArraySchema)[0];
            switch (typeof type) {
                case 'number':
                    buf.writeByte(type as number);
                    buf.writeInt(value.length);
                    for (const v of value) visitors[type as number].write(buf, v);
                    break;
                case 'string':
                    const customScope = find(type as string);
                    if (!customScope) throw `Unknown custom type [${type}]`
                    buf.writeByte(NBT.TagType.Compound);
                    buf.writeInt(value.length);
                    for (const v of value) visitors[NBT.TagType.Compound].write(buf, v, customScope, find)
                    break;
                case 'object':
                    buf.writeByte(NBT.TagType.Compound);
                    buf.writeInt(value.length);
                    for (const v of value) visitors[NBT.TagType.Compound].write(buf, v, type as CompoundSchema, find)
                    break;
                default:
                    if (value.length !== 0)
                        throw new Error(`Unknown list type [${type}].`);
                    buf.writeByte(NBT.TagType.End);
                    buf.writeInt(0);
            }
        }
    },
    {//tag compound
        read(buf, find) {
            const object: any = {};
            const scope: CompoundSchema = {};
            const a: ArraySchema = [2];
            for (let tag = 0; (tag = buf.readByte()) != 0;) {
                const name = readUTF8(buf);
                const visitor = visitors[tag];
                if (!visitor) throw "No such tag id: " + tag;
                const { type, value } = visitor.read(buf, find);
                object[name] = value;
                scope[name] = type;
            }
            const id = find ? find(scope) : undefined;
            return val(id ? id : scope, object);
        },
        write(buf, object, scope, find) {
            if (!scope || !find) throw new Error();
            Object.keys(object).forEach(key => {
                const value = object[key];
                const type = (scope as CompoundSchema)[key];
                let nextScope: Scope | undefined = undefined;
                let a: ArraySchema;
                let nextType = type;

                if (typeof type === 'number') {
                    nextType = type;
                } else if (type instanceof Array) {
                    nextScope = type as ArraySchema;
                    nextType = NBT.TagType.List;
                } else if (typeof type === 'string') {
                    nextType = NBT.TagType.Compound;
                    nextScope = find(type);  //support custom type
                    if (!nextScope) throw `Unknown custom type [${type}]`
                } else if (typeof type === 'object') {
                    nextType = NBT.TagType.Compound
                    nextScope = type;
                } else {
                    return; // just ignore it if it's not on definition
                }

                const writer = visitors[nextType];
                if (!writer) throw "Unknown type " + type;
                buf.writeByte(nextType);
                writeUTF8(buf, key);
                writer.write(buf, value, nextScope, find);
            })
            buf.writeByte(0);
        }
    },
    { //int array
        read(buf) {
            const arr: number[] = new Array(buf.readInt());
            for (let i = 0; i < arr.length; i++) arr[i] = buf.readInt();
            return val(NBT.TagType.IntArray, arr);
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
            return val(NBT.TagType.LongArray, arr);
        },
        write(buf, v) {
            buf.writeInt(v.length)
            for (let i = 0; i < v.length; i++) buf.writeInt64(v[i])
        }
    }
];