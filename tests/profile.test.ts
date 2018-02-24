import { ProfileService, GameProfile } from "../index";
import * as assert from 'assert';

describe('ProfileService', () => {
    it('profile fetching by uuid', async () => {
        const s = await ProfileService.fetch('abf81fe99f0d4948a9097721a8198ac4');
        assert.equal(s.name, 'CI010')
        assert.equal('abf81fe99f0d4948a9097721a8198ac4', s.id);
        console.log(s)
    }).timeout(10000)
    it('profile fetching by name', async () => {
        const s = await ProfileService.lookup('ci010')
        assert.equal(s.name, 'CI010')
        assert.equal('abf81fe99f0d4948a9097721a8198ac4', s.id);
    }).timeout(10000)
})
