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