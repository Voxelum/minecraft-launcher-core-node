import * as assert from 'assert';
import { Version, MinecraftFolder, Forge, LiteLoader, Launcher } from "../index";
import { monitor } from '../src/utils/monitor';
import * as fs from 'fs-extra'


describe('InstallMinecraft', () => {
    let version: Version.MetaContainer;
    const loc = new MinecraftFolder('./tests/assets/temp');
    it('minecraft version fetching', (done) => {
        Version.updateVersionMeta().then(result => {
            version = result;
            done();
        }).catch(e => done(e))
    }).timeout(100000)
    it('no duplicate version fetching', (done) => {
        Version.updateVersionMeta({ fallback: version }).then(result => {
            assert.equal(result, version)
            done()
        }).catch(err => done(err))
    })
    it('minecraft installing', (done) => {
        const meta = version.list.versions.filter((val) => val.id === '1.12.2')[0];
        Version.install('client', meta, loc, { checksum: true }).then(v => {
            assert(fs.existsSync('./tests/assets/temp/versions/1.12.2/1.12.2.jar'));
            assert(fs.existsSync('./tests/assets/temp/versions/1.12.2/1.12.2.json'));
            Version.parse(new MinecraftFolder('./tests/assets/temp'), '1.12.2')
                .then(ver => {
                    const missing = ver.libraries.filter(lib => !fs.existsSync(loc.getLibraryByPath(lib.download.path)));
                    if (missing.length !== 0) {
                        console.error(missing);
                        throw new Error('Missing Libs')
                    }
                    done()
                })
                .catch(e => done(e));
        });
    }).timeout(1000000)
    it('new minecraft installing', (done) => {
        const nMc = version.list.versions.filter((val) => val.id === '17w43b')[0];
        Version.install('client', nMc, loc, { checksum: true }).then(v => {
            assert(fs.existsSync('./tests/assets/temp/versions/17w43b/17w43b.jar'));
            assert(fs.existsSync('./tests/assets/temp/versions/17w43b/17w43b.json'));
            Version.parse(new MinecraftFolder('./tests/assets/temp'), '17w43b')
                .then(ver => {
                    const missing = ver.libraries.filter(lib => !fs.existsSync(loc.getLibraryByPath(lib.download.path)));
                    if (missing.length !== 0) {
                        console.error(missing);
                        throw new Error('Missing Libs')
                    }
                    done()
                })
                .catch(e => done(e));
        });
    })
    // it('should launch minecraft correctly', (done) => {
    //     Launcher.launch({
    //         gamePath: loc.root,
    //         javaPath: '/Library/Internet\ Plug-Ins/JavaAppletPlugin.plugin/Contents/Home/bin/java',
    //         version: '1.12.2'
    //     }).then((p) => {
    //         p.stderr.on('data', (data) => {
    //             console.error(data)
    //         })
    //         p.stdout.on('data', (data) => {
    //             console.log(data)
    //         })
    //         p.on('close', () => {
    //             done()
    //         })
    //     }).catch((e) => done(e));
    // }).timeout(1000000)
    // it('should launch new minecraft correctly', (done) => {
    //     Launcher.launch({
    //         gamePath: loc.root,
    //         javaPath: '/Library/Internet\ Plug-Ins/JavaAppletPlugin.plugin/Contents/Home/bin/java',
    //         version: '17w43b'
    //     }).then((p) => {
    //         p.stderr.on('data', (data) => {
    //             console.error(data)
    //         })
    //         p.stdout.on('data', (data) => {
    //             console.log(data)
    //         })
    //         p.on('close', () => {
    //             done()
    //         })
    //     }).catch((e) => done(e));
    // }).timeout(1000000)
})

describe('FetchForge', () => {
    let r1: any
    it('no duplicate forge version fetching', (done) => {
        Forge.VersionMetaList.update().then(result => {
            r1 = result
            return Forge.VersionMetaList.update({ fallback: result })
        }).then(result => {
            assert.equal(result, r1)
            done()
        }).catch(err => done(err))
    }).timeout(5000)
    it('forge downloading', done => {
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
    it('liteloader downloading', done => {
        LiteLoader.VersionMetaList.update()
            .then((result: { list: LiteLoader.VersionMetaList, date: string }) => {
                let meta = result.list.versions['1.10.2'].release
                if (meta) return LiteLoader.install(meta, new MinecraftFolder('./tests/assets/temp'))
            }).then((r: any) => { done() }, (e: any) => done(e))
    }).timeout(100000)
})
