import { NEWNBT } from '../index'
import * as assert from 'assert'
describe('Test', () => {
    it('just test', () => {
        let list: NEWNBT.TagList<NEWNBT.TagByte> = NEWNBT.TagList.newByteList();
        list[0] = NEWNBT.TagScalar.newByte(0);
        list[1] = NEWNBT.TagScalar.newByte(1);
        console.log(list.push(NEWNBT.TagScalar.newByte(2), NEWNBT.TagScalar.newByte(3)));
        for (let child of list) {
            console.log(child);
        }
    })
})