import { ProfileService, GameProfile, MojangService } from "../index";
import * as assert from 'assert';
import { readFile } from "fs-extra";

describe('ProfileService', () => {
    describe('#fetch', () => {
        let profilePromise: Promise<GameProfile>;
        before(() => {
            profilePromise = ProfileService.fetch('abf81fe99f0d4948a9097721a8198ac4');
        })
        it('should fetch the correct username and uuid', async () => {
            const s = await profilePromise;
            assert.equal(s.name, 'CI010')
            assert.equal('abf81fe99f0d4948a9097721a8198ac4', s.id);
        }).timeout(10000);
        it('the game profile properties should be correct format', async () => {
            const s = await profilePromise;
            if (s.properties !== undefined) {
                for (const key in s.properties) {
                    assert(typeof key === 'string')
                    assert(typeof s.properties[key] === 'string')
                }
            }
        })
    })

    describe('#getTextures', () => {
        const profile = {
            id: 'abf81fe99f0d4948a9097721a8198ac4',
            name: 'CI010',
            properties: { textures: 'eyJ0aW1lc3RhbXAiOjE1NDEzODY0MzI2OTksInByb2ZpbGVJZCI6ImFiZjgxZmU5OWYwZDQ5NDhhOTA5NzcyMWE4MTk4YWM0IiwicHJvZmlsZU5hbWUiOiJDSTAxMCIsInNpZ25hdHVyZVJlcXVpcmVkIjp0cnVlLCJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvZGYwMzE0NzJmYjg3MjgyNjA4MjdjMTY2NzA2ZTJiYTI0YTBmYzlhMmRhNThlM2MyZDVlNWMzMDI0ZDQxNTNlZSJ9fX0=' }
        }
        let texturesPromise: Promise<GameProfile.Textures>
        before(() => {
            texturesPromise = ProfileService.getTextures(profile);
        })
        it('the textures object format should be correct', async () => {
            const textures = await texturesPromise;
            assert(typeof textures.profileId === 'string')
            assert(typeof textures.profileName === 'string')
            assert(typeof textures.textures === 'object')
            assert(typeof textures.timestamp === 'number')
        }).timeout(10000);
        it('the texture in textures should be correct', async () => {
            const textures = (await texturesPromise).textures;
            if (textures.skin) {
                const skin = textures.skin;
                assert(typeof skin.url === 'string');
                if (skin.metadata) {
                    assert(typeof skin.metadata === 'object');
                    assert(typeof skin.metadata.model === 'string');
                    assert(skin.metadata.model === 'steve' ||
                        skin.metadata.model === 'slim');
                    for (const key in skin.metadata) {
                        assert(typeof key === 'string')
                        assert(typeof skin.metadata[key] === 'string')
                    }
                }
                if (skin.data) {
                    assert(skin.data instanceof Buffer)
                }
            }
        }).timeout(10000);
    })

    describe('#lookup', () => {
        it('should fetch profile by name', async () => {
            const s = await ProfileService.lookup('ci010')
            assert.equal(s.name, 'CI010')
            assert.equal('abf81fe99f0d4948a9097721a8198ac4', s.id);
        }).timeout(10000)
    })
})
