
import { Server } from "../index";
import * as fs from 'fs-extra';
import * as assert from 'assert';

describe('Server', () => {
    describe('Read', () => {
        it('server.dat reading', () => {
            let data = fs.readFileSync('./tests/assets/servers.dat')
            let infos = Server.parseNBT(data)
            assert.equal(infos[0].name, 'nyaacat')
            assert.equal(infos[1].name, 'himajin')
            assert.equal(infos[2].name, 'mcJp')
            assert.equal(infos[3].name, 'Minecraft Server')
        })
    })
    describe('Ping', () => {
        it('frame fetching', async () => {
            const frame = Server.fetchStatusFrame({ host: 'mc.hypixel.net' })
            assert(frame);
        }).timeout(100000)
        it('should control the port', (done) => {
            Server.fetchStatusFrame({ host: 'mc.hypixel.net', port: 138 }, { timeout: 500, retryTimes: 0 })
                .then(() => done('This should not happen'))
                .catch((err) => { done() })
        }).timeout(100000)
        it('frame to status converting', async () => {
            const frame: Server.StatusFrame = {
                version: { name: 'test-version', protocol: 1 },
                players: { max: 1, online: 1 },
                description: 'abc',
                favicon: '',
                ping: 5,
            }
            const status = Server.Status.from(frame);
            assert.equal(status.capacity, 1, 'capacity')
            assert.equal(status.pingToServer, 5, 'ping')
            assert.equal(status.onlinePlayers, 1, 'online')
            assert.equal(status.serverMOTD.text, 'abc', 'motd');
            assert.equal(status.icon, '', 'icon');
            assert.equal(status.protocolVersion, 1, 'protocol');
        })
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
})
