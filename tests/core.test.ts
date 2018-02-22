import * as assert from 'assert';
import { Version, MinecraftFolder, Launcher } from "../index";
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
            // let indent = '';
            // for (let i = 0; i < path.length - 1; ++i)
            //     indent += '\t';
            // console.log(`${indent}[${path[path.length - 1]}] create child ${child}`)
        }).onFinish((path, result) => {
            // let indent = '';
            // for (let i = 0; i < path.length - 1; ++i)
            //     indent += '\t';
            // console.log(`${indent}[${path[path.length - 1]}] finished`)
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
    it('new minecraft installing', async () => {
        const nMc = {
            id: '17w43b',
            type: 'snapshot',
            time: '2018-01-15T11:09:31+00:00',
            releaseTime: '2017-10-26T13:36:22+00:00',
            url: 'https://launchermeta.mojang.com/mc/game/0383e8585ef976baa88e2dc3357e6b9899bf263e/17w43b.json'
        }
        const v = await Version.install('client', nMc, loc, { checksum: true })
        assert(fs.existsSync('./tests/assets/temp/versions/17w43b/17w43b.jar'));
        assert(fs.existsSync('./tests/assets/temp/versions/17w43b/17w43b.json'));
        const ver = await Version.parse(new MinecraftFolder('./tests/assets/temp'), '17w43b')
        const missing = ver.libraries.filter(lib => !fs.existsSync(loc.getLibraryByPath(lib.download.path)));
        if (missing.length !== 0) {
            console.error(missing);
            throw new Error('Missing Libs')
        }
    }).timeout(1000000)
})

