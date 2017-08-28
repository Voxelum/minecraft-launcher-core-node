import { NBT } from '../index'
import * as assert from 'assert';

describe('NBT', () => {
    let ser: NBT.Serializer;
    let buf: Buffer;
    let from = {
        name: 'ci010', type: 'author', byte: 10, short: 10, int: 10, nested: {
            name: 'indexyz', type: 'author', value: 'ilauncher',
        }
    };
    let to: any;
    it('should create and register serializer', () => {
        ser = NBT.serializer().register('test', {
            name: NBT.Type.String,
            type: NBT.Type.String,
            short: NBT.Type.Short,
            int: NBT.Type.Int,
            value: NBT.Type.String,
            byte: NBT.Type.Byte,
            nested: 'test',
        });
    })
    it('should serialize object', () => {
        buf = ser.serialize(from, 'test')
    })
    it('should deserialize object', () => {
        to = ser.deserialize(buf).value
    })
    it('should produce same object from deserializing', () => {
        assert.deepEqual(from, to);
    })
})