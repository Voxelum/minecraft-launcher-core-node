import { LiteLoader, MinecraftFolder } from '../index'
import * as assert from 'assert'

describe('Liteloader', () => {
    it('should be able to fetch liteloader version json', () =>
        LiteLoader.VersionMetaList.update().then(list => {
            assert(list)
        })
    )
    it('should be able to install Liteloader', async () => {
        const meta: LiteLoader.VersionMeta = { "url": "http://repo.mumfrey.com/content/repositories/snapshots/", "type": "SNAPSHOT", "file": "liteloader-1.12.2-SNAPSHOT.jar", "version": "1.12.2-SNAPSHOT", "md5": "1420785ecbfed5aff4a586c5c9dd97eb", "timestamp": "1511880271", "mcversion": "1.12.2", "tweakClass": "com.mumfrey.liteloader.launch.LiteLoaderTweaker", "libraries": [{ "name": "net.minecraft:launchwrapper:1.12" }, { "name": "org.ow2.asm:asm-all:5.2" }] };
        return LiteLoader.install(meta, new MinecraftFolder('./tests/assets/temp'));
    }).timeout(100000)
})
