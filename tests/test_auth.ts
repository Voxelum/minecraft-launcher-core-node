import { AuthService } from '../index'
import * as assert from 'assert'
describe('ygg-auth', () => {
    it('should response with invalid credit', (done) => {
        AuthService.newYggdrasilAuthService().login('18211182378@163.com', 'asd-x', 'cc')
            .then((suc) => {
                throw "This should not happen...";
            }, (err) => {
                assert(err instanceof Error)
                assert.equal('Invalid credentials. Invalid username or password.', (err as Error).message)
                done()
            })
    })
})