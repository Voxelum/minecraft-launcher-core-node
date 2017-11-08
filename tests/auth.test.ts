import { Auth } from '../index'
import * as assert from 'assert'
describe('Auth', () => {
    it('should response with invalid credit', (done) => {
        Auth.yggdrasil({ username: '18211378@163.com', password: 'asd-x' })
            .then((suc) => {
                throw "This should not happen...";
            }, (err) => {
                assert(err instanceof Error)
                assert.equal('Invalid credentials. Invalid username or password.', (err as Error).message)
                done()
            })
    }).timeout(10000)
    it('offline auth username should be correctly', () => {
        assert.equal(Auth.offline('ci010').selectedProfile.name, 'ci010')
    }).timeout(10000)
})