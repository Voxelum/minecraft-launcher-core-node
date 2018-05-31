import { ProfileService, GameProfile, MojangService } from "../index";
import * as assert from 'assert';
import { readFile } from "fs-extra";

describe('ProfileService', () => {
    it('should fetch profile by uuid', async () => {
        const s = await ProfileService.fetch('abf81fe99f0d4948a9097721a8198ac4');
        assert.equal(s.name, 'CI010')
        assert.equal('abf81fe99f0d4948a9097721a8198ac4', s.id);
        const textures = await ProfileService.getTextures(s);
        assert(textures.textures)
    }).timeout(10000);
    it('should fetch profile by name', async () => {
        const s = await ProfileService.lookup('ci010')
        assert.equal(s.name, 'CI010')
        assert.equal('abf81fe99f0d4948a9097721a8198ac4', s.id);
    }).timeout(10000)
})
