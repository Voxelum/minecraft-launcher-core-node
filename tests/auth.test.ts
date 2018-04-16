import { Auth, MojangService } from '../index'
import * as assert from 'assert'
describe('Auth', () => {
    it('should reject invalid username password', (done) => {
        Auth.Yggdrasil.login({ username: '18211378@163.com', password: 'asd-x' })
            .then((suc) => {
                throw "Credit shouldn't have succeed";
            }, (err) => {
                assert.equal('Invalid credentials. Invalid username or password.', (err as any).errorMessage)
                done()
            })
    }).timeout(100000);
    it('should return false when validate an invalid access token', async () => {
        const valid = await Auth.Yggdrasil.validate({ accessToken: 'abc', clientToken: 'bvd' })
        assert(valid === false);
    }).timeout(10000);
    it('should throw error when refresh an invalid access token', async () => {
        try {
            const auth = await Auth.Yggdrasil.refresh({ accessToken: 'abc', clientToken: 'bvd' })
        } catch (e) {
            assert(e);
        }
    }).timeout(10000);
    it('should offline auth', () => {
        assert.equal(Auth.offline('ci010').selectedProfile.name, 'ci010')
    }).timeout(10000);
})