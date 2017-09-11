import { AuthService } from '../index'
import * as assert from 'assert'
describe('Auth', () => {
    it('should response with invalid credit', (done) => {
        AuthService.newYggdrasilAuthService().login('18211378@163.com', 'asd-x', 'cc')
            .then((suc) => {
                throw "This should not happen...";
            }, (err) => {
                assert(err instanceof Error)
                assert.equal('Invalid credentials. Invalid username or password.', (err as Error).message)
                done()
            })
    }).timeout(10000)
    it('offline auth username should be correctly', () => {
        assert.equal(AuthService.offlineAuth('ci010').selectedProfile.name, 'ci010')
    }).timeout(10000)
})