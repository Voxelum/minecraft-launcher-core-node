import { AuthService } from '../src/minecraft'
import * as assert from 'assert'
describe('ygg-auth', () => {
    it('should response with invalid credit', (done) => {
        AuthService.newYggdrasilAuthService().login('18211182378@163.com', 'asd-x', 'cc', (resp) => {
            assert(resp instanceof Error)
            assert.equal('Invalid credentials. Invalid username or password.', (resp as Error).message)
            done()
        })
    })
})