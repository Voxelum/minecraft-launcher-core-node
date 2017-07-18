import { VersionMetaList } from '../src/download';
import * as assert from 'assert';
import { ForgeVersionMetaList } from '../src/forge_download';
import { ForgeVersionMeta } from "../index";
import { MinecraftLocation } from '../src/file_struct';
describe('FetchVersionList', () => {
    it('should not fetch a list duplicatedly', (done) => {
        let r1: any
        VersionMetaList.update().then(result => {
            r1 = result
            return VersionMetaList.update({ fallback: result })
        }).then(result => {
            assert.equal(result, r1)
            done()
        }).catch(err => done(err))
    })
})

describe('FetchForgeVersionList', () => {
    it('should not fetch a list twice', (done) => {
        let r1: any
        ForgeVersionMetaList.update().then(result => {
            r1 = result
            return ForgeVersionMetaList.update({ fallback: result })
        }).then(result => {
            assert.equal(result, r1)
            done()
        }).catch(err => done(err))
    }).timeout(5000)
})
describe('FetchForge', () => {
    it('should download forge', (done => {
        ForgeVersionMetaList.update().then((result: { list: ForgeVersionMetaList, date: string }) => {
            return result.list.number[result.list.promos['latest'].toString()]
        }).then(meta => {
            return ForgeVersionMeta.installForge(meta, new MinecraftLocation('./forge'), false)
        }).then(v => {
            console.log(v)
            done()
        }, err => { done(err) })
    })).timeout(5000)
})