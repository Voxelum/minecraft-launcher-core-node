import { Forge, Mod } from '../index'

describe('ForgeMod', () => {
    it('mod reading', (done) => {
        Forge.meta('./tests/assets/sample-mod.jar')
            .then(v => {
                done()
            }).catch(done)
    })
})
describe('Mod', () => {
    it('mod reading', (done) => {
        Mod.parse('./tests/assets/sample-mod.jar')
            .then((v: any) => {
                done()
            }).catch(done)
    })
    it('litemod reading', (done) => {
        Mod.parse('./tests/assets/sample-mod.litemod')
            .then((v: any) => {
                done()
            }).catch(done)
    })
})