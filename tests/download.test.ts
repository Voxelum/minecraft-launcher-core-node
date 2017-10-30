import * as assert from 'assert';
import { Version, MinecraftFolder, Forge, LiteLoader, Launcher, AuthService } from "../index";
import { monitor } from '../src/utils/monitor';

describe('FetchMinecraft', () => {
    let r1: Version.MetaContainer;
    it('should not fetch a list duplicatedly', (done) => {
        Version.updateVersionMeta().then(result => {
            r1 = result
            return Version.updateVersionMeta({ fallback: result })
        }).then(result => {
            assert.equal(result, r1)
            done()
        }).catch(err => done(err))
    })
    it('should install minecraft correctly', (done) => {
        Version.install('client', r1.list.versions.filter((val) => val.id === '1.10.2')[0], './tests/assets/temp')
            .then(v => Launcher.launch(AuthService.offlineAuth('ci010'), {
                version: v,
                gamePath: './tests/assets/temp',
                javaPath: '/Library/Internet\ Plug-Ins/JavaAppletPlugin.plugin/Contents/Home/bin/java',
                minMemory: 1024,
            }))
            .then((p) => {
                p.stderr.on('data', (data) => {
                    console.error(data)
                })
                p.stdout.on('data', (data) => {
                    console.log(data)
                })
                p.on('close', () => {
                    done()
                })
            })
            .catch((e) => done(e));
    }).timeout(1000000)
})

describe('FetchForge', () => {
    let r1: any
    it('should not fetch a list twice', (done) => {
        Forge.VersionMetaList.update().then(result => {
            r1 = result
            return Forge.VersionMetaList.update({ fallback: result })
        }).then(result => {
            assert.equal(result, r1)
            done()
        }).catch(err => done(err))
    }).timeout(5000)
    it('should download forge', done => {
        Forge.VersionMetaList.update().then(
            (result: { list: Forge.VersionMetaList, date: string }) => {
                return result.list.number[result.list.promos['latest'].toString()]
            }).then(meta => {
                return Forge.install(meta, new MinecraftFolder('./tests/assets/temp'), false)
            }).then(v => {
                done()
            }, err => { done() })
    }).timeout(100000)
})
describe('FetchLite', () => {
    it('should download liteloader', done => {
        LiteLoader.VersionMetaList.update()
            .then((result: { list: LiteLoader.VersionMetaList, date: string }) => {
                let meta = result.list.versions['1.10.2'].release
                if (meta) return LiteLoader.install(meta, new MinecraftFolder('./tests/assets/temp'))
            }).then((r: any) => { done() }, (e: any) => done(e))
    }).timeout(100000)
})
