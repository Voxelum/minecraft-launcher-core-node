import { NEWNBT } from '../index'
import * as assert from 'assert'
describe('Test', () => {
    it('just test', () => {
        let list: NEWNBT.TagList<NEWNBT.TagInt> = NEWNBT.TagList.newIntList();
        list[0] = NEWNBT.TagScalar.newInt(0);
        list[1] = NEWNBT.TagScalar.newInt(1);
        list[2] = NEWNBT.TagScalar.newInt(2);
        list[3] = NEWNBT.TagScalar.newInt(3);
        for (let child of list) {
            console.log(child);
        }
    })
})