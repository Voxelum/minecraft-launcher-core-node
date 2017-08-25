import { NBT } from '../index'
import * as assert from 'assert'
describe('TestEmpty', () => {
    it('should empty nbt read and write correctly', () => {
        let nbtRoot: any = NBT.parse(Buffer.from([0x0A, 0x00, 0x00, 0x00])).root;
        assert.deepEqual(nbtRoot, {});
        assert.deepEqual(NBT.write(new NBT.Compound(nbtRoot)), Buffer.from([0x0A, 0x00, 0x00, 0x00]));
    })
})