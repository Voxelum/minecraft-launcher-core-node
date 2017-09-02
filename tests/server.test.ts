
import { ServerInfo } from "../index";
import * as fs from 'fs-extra';

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
        }, { timeout: 10000 }).then(status => {
            done()
        }).catch(done)
    }).timeout(100000);
    it('should catch the timeout exception', (done) => {
        ServerInfo.fetchStatus({
            host: 'crafterr.me',
        }, { timeout: 100 }).then(status => {
            done(new Error('this should not happend'))
        }, (err) => {
            done()
        })
    }).timeout(100000)
})