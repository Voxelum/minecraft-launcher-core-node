
import { Server } from "../index";
import * as fs from 'fs-extra';
import * as assert from 'assert';

describe('ServerRead', () => {
    it('should read the server.dat correctly', () => {
        let data = fs.readFileSync('./tests/assets/servers.dat')
        let infos = Server.parseNBT(data)
        assert.equal(infos[0].name, 'nyaacat')
        assert.equal(infos[1].name, 'himajin')
        assert.equal(infos[2].name, 'mcJp')
        assert.equal(infos[3].name, 'Minecraft Server')
    })
})

describe('ServerPing', () => {
    it('should catch the timeout exception', (done) => {
        Server.fetchStatus({
            host: 'crafterr.me',
        }, { timeout: 100 }).then(status => {
            done(new Error('this should not happend'))
        }, (err) => {
            done()
        })
    }).timeout(100000)
    it('should ping the server and return info correctly', (done) => {
        Server.fetchStatus({
            host: 'mc.crafter.me',
        }, { timeout: 10000 }).then(status => {
            done()
        }).catch(e => { done(e) })
    }).timeout(100000);
})