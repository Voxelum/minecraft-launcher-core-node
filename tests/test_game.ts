import * as assert from 'assert';
import * as fs from 'fs';
import {
    GameSetting, ServerInfo, ServerStatus, TextComponent,
    Language, Mod, ResourcePack, WorldInfo, Forge
} from '../index';

describe('TextComponent', () => {
    it('should convert normal text', () => {
        let raw = 'testCommon tesxt'
        assert.equal(TextComponent.from(raw).unformatted, raw)
    })
    it('should convert the string to TextComponent correctly and convert it back', () => {
        let raw = '§1colored§r'
        assert.equal(TextComponent.from(raw).formatted, raw)
    })
})

describe("GameSetting", () => {
    it('should print all the options', () => {
        let s = fs.readFileSync('./tests/assets/options.txt')
        let set = GameSetting.parse(s.toString())
        // console.log(set)
    })
    it('should write to string correctly', () => {
        let s = fs.readFileSync('./tests/assets/options.txt').toString()
        let set = GameSetting.stringify(s)
        if (set)
            GameSetting.stringify(set)
    })
})

describe('ServerRead', () => {
    it('should read the server.dat correctly', () => {
        let data = fs.readFileSync('./tests/assets/servers.dat')
        let infos = ServerInfo.parseNBT(data)
        console.log(JSON.stringify(infos, (k, v) => {
            if (k == 'icon') return ''
            return v
        }))
    })
})

describe('ServerPing', () => {
    it('should ping the server and return info correctly', (done) => {
        ServerInfo.fetchStatus({
            host: 'mc.crafter.me',
        }).then(status => {
            done()
        })
            .catch(done)
    }).timeout(100000);
    it('should catch the timeout exception', (done) => {
        ServerInfo.fetchStatus({
            host: 'crafterr.me',
        }).then(status => {
            done(new Error('this should not happend'))
        }, (err) => {
            done()
        })
    }).timeout(100000)
})
describe('ForgeMod', () => {
    it('should read mod correctly', (done) => {
        Forge.meta('./tests/assets/sample-mod.jar')
            .then(v => {
                console.log(v)
                done()
            })
    })
})

describe('Resoucepack', () => {
    it('shold read res pack correctly', (done) => {
        const buff = fs.readFileSync('./tests/assets/sample-resourcepack.zip')
        ResourcePack.read('sample', buff)
            .then(v => { done() })
            .catch(done)
    })
})
describe('Language', () => {
    it('should throw exception', (done) => {
        Language.read('./', '1.12').catch(e => {
            assert.equal((e as Error).message, 'The version indexes json does not exist. Maybe the game assets are incompleted!')
            done()
        })
    })
})

describe('WorldInfo', () => {
    it('should validate a simple map', (done) => {
        WorldInfo.valid('./tests/assets/sample-map')
            .then(valid => { assert(valid, 'dir fail'); done() })
            .catch(e => done(e))
    })
    it('should validate a zip map', (done) => {
        WorldInfo.valid('./tests/assets/sample-map.zip')
            .then(valid => { assert(valid, 'zip fail'); done() })
            .catch(e => done(e))
    })
})