
import { Server } from "../index";
import * as fs from 'fs-extra';
import * as assert from 'assert';

describe('ServerRead', () => {
    it('server.dat reading', () => {
        let data = fs.readFileSync('./tests/assets/servers.dat')
        let infos = Server.parseNBT(data)
        assert.equal(infos[0].name, 'nyaacat')
        assert.equal(infos[1].name, 'himajin')
        assert.equal(infos[2].name, 'mcJp')
        assert.equal(infos[3].name, 'Minecraft Server')
    })
})

describe('ServerPing', () => {
    it('frame fetching', (done) => {
        Server.fetchStatusFrame({ host: 'mc.hypixel.net' })
            .then((frame) => {
                assert(frame);
                done();
            })
            .catch((err) => {
                done(err)
            })
    }).timeout(100000)
    it('should control the port', (done) => {
        Server.fetchStatusFrame({ host: 'mc.hypixel.net', port: 138 })
            .then(() => done('This should not happen'))
            .catch((err) => { done(err) })
    }).timeout(100000)
    it('frame to status converting', (done) => {
        Server.fetchStatusFrame({ host: 'mc.hypixel.net' })
            .then(frame => new Promise((resolve, reject) => {
                Server.fetchStatus({ host: 'mc.hypixel.net' })
                    .then((status) => {
                        assert.deepEqual(Server.Status.from(frame), status);
                        done()
                    })
                    .catch((err) => { done(err) })
            }))
            .catch((err) => { done(err) })
    }).timeout(100000)
    it('timeout exception catching', (done) => {
        Server.fetchStatus({
            host: 'crafterr.me',
        }, { timeout: 100 }).then(status => {
            done(new Error('this should not happend'))
        }, (err) => {
            done()
        })
    }).timeout(100000)
    it('server pinging and info fetching', (done) => {
        Server.fetchStatus({
            host: 'mc.hypixel.net',
        }, { timeout: 10000 }).then(status => {
            done()
        }).catch(e => { done(e) })
    }).timeout(100000);
})