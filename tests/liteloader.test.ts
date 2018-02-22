import { LiteLoader, MinecraftFolder } from '../index'

describe('Liteloader', () => {
    it('liteloader downloading', done => {
        LiteLoader.VersionMetaList.update()
            .then((result: { list: LiteLoader.VersionMetaList, date: string }) => {
                let meta = result.list.versions['1.10.2'].release
                if (meta) return LiteLoader.install(meta, new MinecraftFolder('./tests/assets/temp'))
            }).then((r: any) => { done() }, (e: any) => done(e))
    }).timeout(100000)
})
