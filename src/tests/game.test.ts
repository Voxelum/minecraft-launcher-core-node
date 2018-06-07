import * as assert from 'assert';
import * as fs from 'fs';
import {
    GameSetting, TextComponent,
    Language, Mod, ResourcePack, WorldInfo,
} from '../index';

describe('TextComponent', () => {
    it('normal text converting', () => {
        const raw = 'testCommon tesxt'
        assert.equal(TextComponent.from(raw).unformatted, raw)
    })
    it('string to TextComponent and reverse convention', () => {
        const raw = '§1colored§r'
        assert.equal(TextComponent.from(raw).formatted, raw)
    })
})

describe('Resourcepack', function () {
    it('should read resource pack correctly', async function () {
        const buff = fs.readFileSync(`${this.assets}/sample-resourcepack.zip`)
        const pack = await ResourcePack.read(`${this.assets}/sample-resourcepack.zip`, buff)
        if (!pack) throw new Error('Pack cannot be null');
        assert.equal(pack.description, 'Vattic\u0027s Faithful 32x32 pack');
        assert.equal(pack.format, 1);
    })
    it('should read resource pack folder', async function () {
        const pack = await ResourcePack.readFolder(`${this.assets}/sample-resourcepack`);
        if (!pack) throw new Error('Pack cannot be null');
        assert.equal(pack.description, 'Vattic\u0027s Faithful 32x32 pack');
        assert.equal(pack.format, 1);
    })
})
describe('Language', () => {
    it('no successful version reading', (done) => {
        Language.read('./', '1.12').catch(e => {
            assert.equal(e.type, 'MissingVersionIndex')
            done()
        })
    })
})
