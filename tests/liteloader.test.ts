import { LiteLoader, MinecraftFolder, Launcher } from '../index'
import * as assert from 'assert'

describe('Liteloader', () => {
    it('should be able to fetch liteloader version json', () =>
        LiteLoader.VersionMetaList.update({}).then(list => {
            console.log(list)
            assert(list)
        })
    )
})
