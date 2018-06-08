import { LiteLoader, MinecraftFolder, Launcher } from '..'
import * as assert from 'assert'

describe('Liteloader', () => {
    it('should be able to fetch liteloader version json', () =>
        LiteLoader.VersionMetaList.update({}).then(list => {
            assert(list)
        })
    )
    it('should not be able to read other file', async function () {
        try {
            const metadata = await LiteLoader.meta(`${this.assets}/sample-mod.jar`)
            throw new Error('Should not happen')
        } catch (e) {
            assert.equal(e.type, 'IllegalInputType')
        }
        try {
            const metadata = await LiteLoader.meta(`${this.assets}/sample-map.zip`)
            throw new Error('Should not happen')
        } catch (e) {
            assert.equal(e.type, 'IllegalInputType')
        }
        try {
            const metadata = await LiteLoader.meta(`${this.assets}/sample-resourcepack.zip`)
            throw new Error('Should not happen')
        } catch (e) {
            assert.equal(e.type, 'IllegalInputType', 'resourcepack')
        }
        try {
            const metadata = await LiteLoader.meta(`${this.assets}/not-exist`)
            throw new Error('Should not happen')
        } catch (e) {
            assert.equal(e.type, 'IllegalInputType')
        }
    })
    it('should be able to parse liteloader info', async function () {
        const metadata = await LiteLoader.meta(`${this.assets}/sample-mod.litemod`)
        if (!metadata) throw new Error('Should not happen')
        assert.equal(metadata.name, 'Autofish')
        assert.equal(metadata.mcversion, '1.7.10')
        assert.deepEqual(metadata.revision, 39)
        assert.equal(metadata.author, 'troyboy50')
        assert.equal(metadata.classTransformerClasses, 'troy.autofish.PacketEntityVelocityTransformer')
        assert.equal(metadata.version, 'Autofish:1.7.10_39')
    })
})
