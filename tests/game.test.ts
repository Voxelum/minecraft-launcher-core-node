import * as assert from 'assert';
import * as fs from 'fs';
import {
    GameSetting, TextComponent,
    Language, Mod, ResourcePack, WorldInfo,
} from '../index';

describe('TextComponent', () => {
    it('normal text converting', () => {
        let raw = 'testCommon tesxt'
        assert.equal(TextComponent.from(raw).unformatted, raw)
    })
    it('string to TextComponent and reverse convention', () => {
        let raw = '§1colored§r'
        assert.equal(TextComponent.from(raw).formatted, raw)
    })
})
describe("GameSetting", () => {
    it('all options parsing', () => {
        let s = fs.readFileSync('./tests/assets/options.txt')
        let set = GameSetting.parse(s.toString())
        // console.log(set)
    })
    it('option writing', () => {
        let s = fs.readFileSync('./tests/assets/options.txt').toString()
        let set = GameSetting.stringify(s)
        if (set) GameSetting.stringify(set)
    })
})
describe('Resourcepack', () => {
    it('shold read res pack correctly', (done) => {
        const buff = fs.readFileSync('./tests/assets/sample-resourcepack.zip')
        ResourcePack.read('sample', buff)
            .then(v => { done() })
            .catch(done)
    })
})
describe('Language', () => {
    it('no successful version reading', (done) => {
        Language.read('./', '1.12').catch(e => {
            assert.equal((e as Error).message, 'The version indexes json does not exist. Maybe the game assets are incompleted!')
            done()
        })
    })
})
describe('WorldInfo', () => {
    it('simple map validating', (done) => {
        WorldInfo.valid('./tests/assets/sample-map')
            .then(valid => { assert(valid, 'dir fail'); done() })
            .catch(e => done(e))
    })
    it('zip map validating', (done) => {
        WorldInfo.valid('./tests/assets/sample-map.zip')
            .then(valid => { assert(valid, 'zip fail'); done() })
            .catch(e => done(e))
    })
})
