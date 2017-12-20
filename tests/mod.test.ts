import { Forge, Mod } from '../index'

describe('Mod', () => {
    it('should read mod in jar', (done) => {
        Mod.parse('./tests/assets/sample-mod.jar', 'forge')
            .then((v) => {
                done()
            }).catch(done)
    })
    it('litemod reading', (done) => {
        Mod.parse('./tests/assets/sample-mod.litemod', 'liteloader')
            .then((v: any) => {
                done()
            }).catch(done)
    })
})