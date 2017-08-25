import { NBT } from '../index'
import * as assert from 'assert'
describe('TestEmpty', () => {
    it('should empty nbt parse and write correctly', () => {
        let nbtData: Buffer = Buffer.from([0x0A, 0x00, 0x00,
            0x00]);
        let nbtRoot: any = NBT.parse(nbtData).root;
        assert.deepEqual(nbtRoot, {});
        assert.deepEqual(NBT.write(new NBT.Compound(nbtRoot)), nbtData);
    })
})
describe('TestSignleValue', () => {
    it('should signle value nbt parse and write correctly', () => {
        let nbtData: Buffer = Buffer.from([0x0A, 0x00, 0x00,
            0x03, 0x00, 0x03, 0x62, 0x61, 0x72, 0x00, 0x00, 0x00, 0x01, // bar: Int = 1
            0x00]);
        let nbtRoot: any = NBT.parse(nbtData).root;
        assert.deepEqual(nbtRoot, { bar: 1 });
        assert.deepEqual(NBT.write(new NBT.Compound(nbtRoot)), nbtData);
    })
})