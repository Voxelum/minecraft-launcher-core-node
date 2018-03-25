import * as assert from 'assert';
import { Version, MinecraftFolder, Launcher, WorldInfo, NBT, Forge, LiteLoader } from "../index";
import * as fs from 'fs-extra'

describe('Install', () => {
    let version: Version.MetaContainer;
    const loc = new MinecraftFolder('./tests/assets/temp');
    it('should fetch minecraft version', () => Version.updateVersionMeta()).timeout(100000)
    it('should not fetch duplicate version', async () => {
        const first = await Version.updateVersionMeta();
        const sec = await Version.updateVersionMeta({ fallback: first })
        assert.equal(first, sec);
    })
    it('should intall minecraft', () => {
        const meta = {
            id: '1.12.2',
            type: 'release',
            time: '2018-02-15T16:26:45+00:00',
            releaseTime: '2017-09-18T08:39:46+00:00',
            url: 'https://launchermeta.mojang.com/mc/game/cf72a57ff499d6d9ade870b2143ee54958bd33ef/1.12.2.json'
        };
        return Version.installTask('client', meta, loc, { checksum: true }).execute()
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
    it('should install forge version', async () => {
        const meta: Forge.VersionMeta = {
            branch: null,
            build: 2611,
            files:
                [['zip', 'mdk', 'b9175ac5d6fe2458b91913222b7c2aec'],
                ['txt', 'changelog', 'ea1aed49bc657e1205959df241744988'],
                ['jar', 'universal', '8e4cd927a804abab5c48ecedaa2834cd'],
                ['jar', 'userdev', '2912ce4d9bef6a2fde549568675ee8e6'],
                ['exe', 'installer-win', '59c6162a94600e3b983ad533f96df8e2'],
                ['jar', 'installer', '19c0683c7ba0054a66a719113aecb0d0']],
            mcversion: '1.12.2',
            modified: 1517630820,
            version: '14.23.2.2611'
        };
        const ver = await Forge.install(meta, new MinecraftFolder('./tests/assets/temp'));
        assert(fs.existsSync('./tests/assets/temp/versions/1.12.2-forge1.12.2-14.23.2.2611'), 'no such folder')
        assert(fs.existsSync('./tests/assets/temp/versions/1.12.2-forge1.12.2-14.23.2.2611/1.12.2-forge1.12.2-14.23.2.2611.json'), 'no json')
    }).timeout(10000000)

    it('should be able to install Liteloader', async () => {
        const meta: LiteLoader.VersionMeta = { "url": "http://repo.mumfrey.com/content/repositories/snapshots/", "type": "SNAPSHOT", "file": "liteloader-1.12.2-SNAPSHOT.jar", "version": "1.12.2-SNAPSHOT", "md5": "1420785ecbfed5aff4a586c5c9dd97eb", "timestamp": "1511880271", "mcversion": "1.12.2", "tweakClass": "com.mumfrey.liteloader.launch.LiteLoaderTweaker", "libraries": [{ "name": "net.minecraft:launchwrapper:1.12" }, { "name": "org.ow2.asm:asm-all:5.2" }] };
        return LiteLoader.install(meta, new MinecraftFolder('./tests/assets/temp'));
    }).timeout(1000000)
    it('should be able to install Liteloader to forge', async () => {
        const meta: LiteLoader.VersionMeta = { "url": "http://repo.mumfrey.com/content/repositories/snapshots/", "type": "SNAPSHOT", "file": "liteloader-1.12.2-SNAPSHOT.jar", "version": "1.12.2-SNAPSHOT", "md5": "1420785ecbfed5aff4a586c5c9dd97eb", "timestamp": "1511880271", "mcversion": "1.12.2", "tweakClass": "com.mumfrey.liteloader.launch.LiteLoaderTweaker", "libraries": [{ "name": "net.minecraft:launchwrapper:1.12" }, { "name": "org.ow2.asm:asm-all:5.2" }] };
        return LiteLoader.install(meta, new MinecraftFolder('./tests/assets/temp'), '1.12.2-forge1.12.2-14.23.2.2611');
    }).timeout(10000000)

    it('should install new minecraft', async () => {
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

