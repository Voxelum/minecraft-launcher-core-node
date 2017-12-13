import { Forge } from "../src/forge";
import * as assert from 'assert'
import { MinecraftFolder, Launcher } from "../index";

describe('ForgeRemote', () => {
    let meta: Forge.VersionMeta;
    it('should fetch the forge remote json list', (done) => {
        Forge.VersionMetaList.update()
            .then((list) => {
                assert(list)
                meta = list.list.number[list.list.promos['recommended']]
                assert(meta);
                done()
            })
            .catch(e => done(e))
    })
    it('should install Forge version', (done) => {
        Forge.install(meta, new MinecraftFolder('./tests/assets/temp'))
            .then(v => {
                assert(v);
                done()
            })
            .catch(e => {
                done(e)
            })
    })
})