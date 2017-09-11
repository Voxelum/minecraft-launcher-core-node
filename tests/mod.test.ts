import { Forge, Mod } from '../index'

describe('ForgeMod', () => {
    it('should read mod correctly', (done) => {
        Forge.meta('./tests/assets/sample-mod.jar')
            .then(v => {
                done()
            }).catch(done)
    })
})
describe('Mod', () => {
    it('should read mod correctly', (done) => {
        Mod.parse('./tests/assets/sample-mod.jar')
            .then((v: any) => {
                done()
            }).catch(done)
    })
    it('should read litemod correctly', (done) => {
        Mod.parse('./tests/assets/sample-mod.litemod')
            .then((v: any) => {
                done()
            }).catch(done)
    })
})