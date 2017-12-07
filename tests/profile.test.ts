import { ProfileService, GameProfile } from "../index";
import * as assert from 'assert';

describe('ProfileService', () => {
    it('profile fetching by uuid', (done) => {
        ProfileService.fetch('abf81fe99f0d4948a9097721a8198ac4').then(s => {
            assert.equal(s.name, 'CI010')
            assert.equal('abf81fe99f0d4948a9097721a8198ac4', s.id)
            done()
        }).catch(done)
    }).timeout(10000)
    it('profile fetching by name', (done) => {
        ProfileService.lookup('ci010').then(s => {
            assert.equal(s.name, 'CI010')
            assert.equal('abf81fe99f0d4948a9097721a8198ac4', s.id)
            done()
        }).catch(done)
    }).timeout(10000)
})
