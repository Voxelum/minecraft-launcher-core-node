import { LiteLoader, MinecraftFolder } from '../index'
import * as assert from 'assert'

describe('Liteloader', () => {
    it('should be able to fetch liteloader version json', () =>
        LiteLoader.VersionMetaList.update().then(list => assert(list))
    )
    it('should be able to install Liteloader', async () => {
        const meta: LiteLoader.VersionMeta = {
            type: 'RELEASE',
            file: 'liteloader-1.10.2.jar',
            version: '1.10.2',
            md5: '8a7c21f32d77ee08b393dd3921ced8eb',
            timestamp: '1479473570',
            mcversion: '1.10.2'
        };
        return LiteLoader.install(meta, new MinecraftFolder('./tests/assets/temp'));
    }).timeout(100000)
})
