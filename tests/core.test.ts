import * as assert from 'assert';
import { Version, MinecraftFolder, Forge, LiteLoader, Launcher } from "../index";
import * as fs from 'fs-extra'


describe('InstallMinecraft', () => {
    let version: Version.MetaContainer;
    const loc = new MinecraftFolder('./tests/assets/temp');
    it('minecraft version fetching', () => Version.updateVersionMeta()).timeout(100000)
    it('no duplicate version fetching', async () => {
        const first = await Version.updateVersionMeta();
        const sec = await Version.updateVersionMeta({ fallback: first })
        assert.equal(first, sec);
    })
    it('minecraft installing', () => {
        const meta = {
            id: '1.12.2',
            type: 'release',
            time: '2018-02-15T16:26:45+00:00',
            releaseTime: '2017-09-18T08:39:46+00:00',
            url: 'https://launchermeta.mojang.com/mc/game/cf72a57ff499d6d9ade870b2143ee54958bd33ef/1.12.2.json'
        };
        return Version.installTask('client', meta, loc, { checksum: true }).onChild((path, child) => {
            let indent = '';
            for (let i = 0; i < path.length - 1; ++i)
                indent += '\t';
            console.log(`${indent}[${path[path.length - 1]}] create child ${child}`)
        }).onFinish((path, result) => {
            let indent = '';
            for (let i = 0; i < path.length - 1; ++i)
                indent += '\t';
            console.log(`${indent}[${path[path.length - 1]}] finished`)
        }).execute()
            .then(v => {
                assert(fs.existsSync('./tests/assets/temp/versions/1.12.2/1.12.2.jar'));
                assert(fs.existsSync('./tests/assets/temp/versions/1.12.2/1.12.2.json'));
                Version.parse(new MinecraftFolder('./tests/assets/temp'), '1.12.2')
                    .then(ver => {
                        const missing = ver.libraries.filter(lib => !fs.existsSync(loc.getLibraryByPath(lib.download.path)));
                        if (missing.length !== 0) {
                            console.error(missing);
                            throw new Error('Missing Libs')
                        }
                    })
            });
    }).timeout(1000000)
    it('new minecraft installing', () => {
        const nMc = {
            id: '17w43b',
            type: 'snapshot',
            time: '2018-01-15T11:09:31+00:00',
            releaseTime: '2017-10-26T13:36:22+00:00',
            url: 'https://launchermeta.mojang.com/mc/game/0383e8585ef976baa88e2dc3357e6b9899bf263e/17w43b.json'
        }
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
                })
        });
    })
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
