import { VersionMetaList } from '../src/download';
import * as assert from 'assert';
import { ForgeVersionMetaList } from '../src/forge_download';
describe('FetchVersionList', () => {
    it('should not fetch a list duplicatedly', (done) => {
        let r1: any
        VersionMetaList.update().then(result => {
            r1 = result
            return VersionMetaList.update({ fallback: result })
        }).then(result => {
            assert.deepEqual(result, r1)
            done()
        })
    })
})

describe('FetchForgeVersionList', () => {
    it('should not fetch a list twice', (done) => {
        let r1: any
        ForgeVersionMetaList.update().then(result => {
            r1 = result
            return ForgeVersionMetaList.update({ fallback: result })
        }).then(result => {
            assert.deepEqual(result, r1)
            done()
        })
    }).timeout(5000)
})