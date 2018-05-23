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
describe("GameSetting", () => {
    it('should parse all options', () => {
        const s = fs.readFileSync('./tests/assets/options.txt')
        const set = GameSetting.parse(s.toString())
        assert(set);
        assert.equal(set.ao, 1)
        assert.equal(set.fov, 0)
        assert.equal(set.mipmapLevels, 4)
        assert.deepEqual(set.resourcePacks, ['Xray Ultimate 1.12 v2.2.1.zip'])
        assert.equal(set.lang, 'en_US')
    })
    it('should not parse illegal option', () => {
        const set = GameSetting.parse('undefined:undefined\n')
        assert(set);
        assert.equal((set as any)['undefined'], undefined)
    })
    it('should parse output even if input string is empty', () => {
        const set = GameSetting.parse('')
        assert(set);
        assert.equal(set.ao, 2)
        assert.equal(set.fov, 0)
        assert.equal(set.mipmapLevels, 4)
        assert.deepEqual(set.resourcePacks, [])
        assert.equal(set.lang, 'en_us')
    })
    it('should write all options from frame', () => {
        const setting: GameSetting.Frame = {
            useVbo: false,
            fboEnable: false,
            enableVsync: false,
            fancyGraphics: false,
            renderClouds: false,
            forceUnicodeFont: false,
            autoJump: false,
            entityShadows: false,
            ao: 0,
            fov: 0,
            mipmapLevels: 0,
            maxFps: 0,
            particles: 0,
            renderDistance: 0,
            resourcePacks: ['asb']
        }
        const string = GameSetting.stringify(setting);
        assert.notEqual(string.indexOf('maxFps:0'), -1);
        assert.notEqual(string.indexOf('fboEnable:false'), -1);
        assert.notEqual(string.indexOf('enableVsync:false'), - 1);
        assert.notEqual(string.indexOf('fancyGraphics:false'), - 1);
        assert.notEqual(string.indexOf('resourcePacks:["asb"]'), -1);
    })
    it('should write all options from instance', () => {
        const setting: GameSetting.Frame = {
            useVbo: false,
            fboEnable: false,
            enableVsync: false,
            fancyGraphics: false,
            renderClouds: false,
            forceUnicodeFont: false,
            autoJump: false,
            entityShadows: false,
            ao: 0,
            fov: 0,
            mipmapLevels: 0,
            maxFps: 0,
            particles: 0,
            renderDistance: 0,
            resourcePacks: []
        }
        const inst = new GameSetting(setting);
        const string = GameSetting.stringify(inst);
        assert.notEqual(string.indexOf('maxFps:0'), -1);
        assert.notEqual(string.indexOf('fboEnable:false'), -1);
        assert.notEqual(string.indexOf('enableVsync:false'), - 1);
        assert.notEqual(string.indexOf('fancyGraphics:false'), - 1);
        assert.notEqual(string.indexOf('resourcePacks:[]'), -1);
    })
    it('should not write undefined', () => {
        const setting = {
            undefined: undefined,
        }
        const string = GameSetting.stringify(setting);
        assert.equal(string.indexOf('undefined:undefined'), -1);
    })
})
describe('Resourcepack', () => {
    it('should read resource pack correctly', async () => {
        const buff = fs.readFileSync('./tests/assets/sample-resourcepack.zip')
        const pack = await ResourcePack.read('./tests/assets/sample-resourcepack.zip', buff)
        if (!pack) throw new Error('Pack cannot be null');
        assert.equal(pack.description, 'Vattic\u0027s Faithful 32x32 pack');
        assert.equal(pack.format, 1);
    })
    it('should read resource pack folder', async () => {
        const pack = await ResourcePack.readFolder('./tests/assets/sample-resourcepack');
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
