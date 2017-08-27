import { NewNBT } from '../index'
import * as assert from 'assert'
describe('Test', () => {
    it('just test', () => {
        let list: NewNBT.TagList<NewNBT.TagByte> = NewNBT.TagList.newByteList();
        list[0] = NewNBT.TagScalar.newByte(0);
        list[1] = NewNBT.TagScalar.newByte(1);
        console.log(list.push(NewNBT.TagScalar.newByte(2), NewNBT.TagScalar.newByte(3)));
        for (let child of list) {
            console.log(child);
        }
        let compound: NewNBT.TagCompound = NewNBT.TagCompound.newCompound();
        compound.set('foo', NewNBT.TagScalar.newString('bar'));
        compound.set('abc', NewNBT.TagScalar.newInt(12450));
        console.log(compound.get('foo'));
        console.log(compound.get('abc'));
        console.log(compound.get('123'));
        console.log(compound.has('abc'));
        console.log(compound.delete('123'));
        console.log(compound.delete('abc'));
        console.log(compound.get('abc'));
        console.log(compound.has('abc'));
    })
})
describe('TestEmpty', () => {
    it('should empty nbt parse and write correctly', () => {
        let nbtData: Buffer = Buffer.from([0x0A, 0x00, 0x00,                    //'': Compound
            0x00]);                                                             //'': End
        let rootTag: NewNBT.TagCompound = NewNBT.Persistence.readRoot(nbtData);
        let testTag: NewNBT.TagCompound = NewNBT.TagCompound.newCompound();
        assert.deepEqual(rootTag, testTag);
        assert.deepEqual(NewNBT.Persistence.writeRoot(rootTag), nbtData);
    })
})
describe('TestSignleValue', () => {
    it('should signle value nbt parse and write correctly', () => {
        let nbtData: Buffer = Buffer.from([0x0A, 0x00, 0x00,                    //'': Compound
            0x03, 0x00, 0x03, 0x62, 0x61, 0x72, 0x00, 0x00, 0x00, 0x01,         //    'bar': Int = 1
            0x00]);                                                             //'': End
        let rootTag: NewNBT.TagCompound = NewNBT.Persistence.readRoot(nbtData);
        let testTag: NewNBT.TagCompound = NewNBT.TagCompound.newCompound();
        testTag.set('bar', NewNBT.TagScalar.newInt(1))
        assert.deepEqual(rootTag, testTag);
        assert.deepEqual(NewNBT.Persistence.writeRoot(rootTag), nbtData);
    })
})