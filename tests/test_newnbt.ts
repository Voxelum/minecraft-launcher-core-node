import { NewNBT } from '../index'
import * as Long from 'long'
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
    it('should empty nbt read and write correctly', () => {
        let nbtData: Buffer = Buffer.from([0x0A, 0x00, 0x00,                    //'': Compound
            0x00]);                                                             //'': End
        let rootTag: NewNBT.TagCompound = NewNBT.Persistence.readRoot(nbtData);
        let testTag: NewNBT.TagCompound = NewNBT.TagCompound.newCompound();
        assert.deepEqual(rootTag, testTag);
        assert.deepEqual(NewNBT.Persistence.writeRoot(rootTag), nbtData);
    })
})
describe('TestSignleValue', () => {
    it('should signle value nbt read and write correctly', () => {
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
describe('TestAllTags', () => {
    it('should all tags read and write correctly', () => {
        let nbtData: Buffer = Buffer.from([0x0A, 0x00, 0x00,                    //'': Compound
            0x01, 0x00, 0x04, 0x62, 0x61, 0x72, 0x31, 0x01,                     //    'bar1': Byte = 1
            0x02, 0x00, 0x04, 0x62, 0x61, 0x72, 0x32, 0x00, 0x01,               //    'bar2': Short = 1
            0x03, 0x00, 0x04, 0x62, 0x61, 0x72, 0x33, 0x00, 0x00, 0x00, 0x01,   //    'bar3': Int = 1
            0x04, 0x00, 0x04, 0x62, 0x61, 0x72, 0x34, 0x00, 0x00, 0x00, 0x00,   //    'bar4': Long = 1
                  0x00, 0x00, 0x00, 0x01,                                       //
            0x05, 0x00, 0x04, 0x62, 0x61, 0x72, 0x35, 0x3F, 0x80, 0x00, 0x00,   //    'bar5': Float = 1
            0x06, 0x00, 0x04, 0x62, 0x61, 0x72, 0x36, 0x3F, 0xF0, 0x00, 0x00,   //    'bar6': Double = 1
                  0x00, 0x00, 0x00, 0x00,                                       //
            0x07, 0x00, 0x04, 0x62, 0x61, 0x72, 0x37, 0x00, 0x00, 0x00, 0x02,   //    'bar7': ByteArray = [ 0x01, 0x02 ]
                  0x01, 0x02,                                                   //
            0x08, 0x00, 0x04, 0x62, 0x61, 0x72, 0x38, 0x00, 0x03, 0x66, 0x6F,   //    'bar8': String = 'foo'
                  0x6F,                                                         //
            0x09, 0x00, 0x04, 0x62, 0x61, 0x72, 0x39, 0x08, 0x00, 0x00, 0x00,   //    'bar9': List<String> = [ 'foo', 'bar' ]
                  0x02, 0x00, 0x03, 0x66, 0x6F, 0x6F, 0x00, 0x03, 0x62, 0x61,   //
                  0x72,                                                         //
            0x0A, 0x00, 0x04, 0x62, 0x61, 0x72, 0x41,                           //    'barA': Compound
                  0x01, 0x00, 0x04, 0x62, 0x61, 0x72, 0x31, 0x01,               //        'bar1': Byte = 1
                  0x02, 0x00, 0x04, 0x62, 0x61, 0x72, 0x32, 0x00, 0x01,         //        'bar2': Short = 1
                  0x00,                                                         //    '': End
            0x0B, 0x00, 0x04, 0x62, 0x61, 0x72, 0x42, 0x00, 0x00, 0x00, 0x02,   //    'barB': IntArray = [ 0x00000001, 0x00000002 ]
                  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x02,               //
            0x0C, 0x00, 0x04, 0x62, 0x61, 0x72, 0x43, 0x00, 0x00, 0x00, 0x02,   //    'barC': LongArray = [ 0x0000000000000001, 0x0000000000000002 ]
                  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00,   //
                  0x00, 0x00, 0x00, 0x00, 0x00, 0x02,                           //
            0x00]);                                                             //'': End
        let rootTag: NewNBT.TagCompound = NewNBT.Persistence.readRoot(nbtData);
        let testTag: NewNBT.TagCompound = NewNBT.TagCompound.newCompound();
        testTag.set('bar1', NewNBT.TagScalar.newByte(1));
        testTag.set('bar2', NewNBT.TagScalar.newShort(1));
        testTag.set('bar3', NewNBT.TagScalar.newInt(1));
        testTag.set('bar4', NewNBT.TagScalar.newLong(Long.fromInt(1)));
        testTag.set('bar5', NewNBT.TagScalar.newFloat(1));
        testTag.set('bar6', NewNBT.TagScalar.newDouble(1));
        testTag.set('bar7', NewNBT.TagScalar.newByteArray(Buffer.from([0x01, 0x02])));
        testTag.set('bar8', NewNBT.TagScalar.newString('foo'));
        let listTag: NewNBT.TagList<NewNBT.TagString> = NewNBT.TagList.newStringList();
        listTag.push(NewNBT.TagScalar.newString('foo'));
        listTag.push(NewNBT.TagScalar.newString('bar'));
        testTag.set('bar9', listTag);
        let compoundTag: NewNBT.TagCompound = NewNBT.TagCompound.newCompound();
        compoundTag.set('bar1', NewNBT.TagScalar.newByte(1));
        compoundTag.set('bar2', NewNBT.TagScalar.newShort(1));
        testTag.set('barA', compoundTag);
        testTag.set('barB', NewNBT.TagScalar.newIntArray(Buffer.from([0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x02])));
        testTag.set('barC', NewNBT.TagScalar.newLongArray(Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02])));
        assert.deepEqual(rootTag, testTag);
        assert.deepEqual(NewNBT.Persistence.writeRoot(rootTag), nbtData);
    })
})