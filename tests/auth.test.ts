import { Auth } from '../index'
import * as assert from 'assert'
describe('Auth', () => {
    it('online credit responding', (done) => {
        Auth.yggdrasil({ username: '18211378@163.com', password: 'asd-x' })
            .then((suc) => {
                throw "Credit shouldn't have succeed";
            }, (err) => {
                assert(err instanceof Error)
                assert.equal('Invalid credentials. Invalid username or password.', (err as Error).message)
                done()
            })
    }).timeout(10000)
    it('offline auth profiling', () => {
        assert.equal(Auth.offline('ci010').selectedProfile.name, 'ci010')
    }).timeout(10000)
})