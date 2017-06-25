import * as assert from 'assert'
import { GameSetting, ServerInfo, ServerStatus } from '../index'
import { TextComponent } from '../index'

import * as fs from 'fs'
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
        let s = fs.readFileSync('./options.txt')
        let set = GameSetting.readFromString(s.toString())
    })
})

describe('ServerRead', () => {
    it('should read the server.dat correctly', () => {
        let data = fs.readFileSync('./servers.dat')
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
        }, (status) => {
            console.log(JSON.stringify(status, (k, v) => {
                if (k == 'gameVersion' || k == 'serverMOTD') return v.formatted
                return v
            }))
            done()
        })
    })
})