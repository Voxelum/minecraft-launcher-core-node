import * as assert from 'assert'
import { GameSetting, ServerInfo, ServerStatus } from '../index'
import { TextComponent } from '../index'

import * as fs from 'fs'
import { Language, Mod, ResourcePack, WorldInfo, Forge } from '../index';
describe('TextComponent', () => {
    it('should convert normal text', () => {
        let raw = 'testCommon tesxt'
        assert.equal(TextComponent.fromFormattedString(raw).unformatted, raw)
    })
    it('should convert the string to TextComponent correctly and convert it back', () => {
        let raw = '§1colored§r'
        assert.equal(TextComponent.fromFormattedString(raw).formatted, raw)
    })
})

describe("GameSetting", () => {
    it('should print all the options', () => {
        let s = fs.readFileSync('./tests/assets/options.txt')
        let set = GameSetting.readFromString(s.toString())
        // console.log(set)
    })
    it('should write to string correctly', () => {
        let s = fs.readFileSync('./tests/assets/options.txt').toString()
        let set = GameSetting.readFromString(s)
        if (set)
            GameSetting.writeToString(set)
    })
})

describe('ServerRead', () => {
    it('should read the server.dat correctly', () => {
        let data = fs.readFileSync('./tests/assets/servers.dat')
        let infos = ServerInfo.readFromNBT(data)
        console.log(JSON.stringify(infos, (k, v) => {
            if (k == 'icon') return ''
            return v
        }))
    })
})

describe('ServerPing', () => {
    it('should ping the server and return info correctly', (done) => {
        ServerInfo.fetchServerStatus({
            host: 'mc.crafter.me',
        }).then(status => {
            done()
        })
    });
    it('should catch the timeout exception', (done) => {
        ServerInfo.fetchServerStatus({
            host: 'crafter.me',
        }).then(status => {
            done(new Error('this should not happend'))
        }, (err) => {
            done()
        })
    }).timeout(100000)
})
describe('ForgeMod', () => {
    it('should read mod correctly', (done) => {
        Mod.parse('./tests/assets/sample-mod.jar')
            .then(v => {
                console.log(v)
                done()
            })
    })
})

describe('Resoucepack', () => {
    it('shold read res pack correctly', (done) => {
        const buff = fs.readFileSync('./tests/assets/sample-resourcepack.zip')
        ResourcePack.readFromBuffer('sample', buff, true)
            .then(v => {
                done()
            })
    })
})
describe('Language', () => {
    it('should throw exception', (done) => {
        Language.exportLanguages('./', '1.12').catch(e => {
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