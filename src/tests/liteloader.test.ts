import { LiteLoader, MinecraftFolder, Launcher } from '..'
import * as assert from 'assert'

describe('Liteloader', () => {
    it('should be able to fetch liteloader version json', () =>
        LiteLoader.VersionMetaList.update({}).then(list => {
            assert(list)
        })
    )
    it('should be able to parse liteloader info', async function () {
        const metadata = await LiteLoader.meta(`${this.assets}/sample-mod.litemod`)
        assert.equal(metadata.name, 'Autofish')
        assert.equal(metadata.mcversion, '1.7.10')
        assert.deepEqual(metadata.revision, 39)
        assert.equal(metadata.author, 'troyboy50')
        assert.equal(metadata.classTransformerClasses, 'troy.autofish.PacketEntityVelocityTransformer')
        assert.equal(metadata.version, 'Autofish:1.7.10_39')
    })
})
