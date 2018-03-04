import * as Zip from 'jszip'
import * as fs from 'fs-extra'
import * as Lzma from 'lzma'

describe('decomp', () => {
    it('should decc', async () => {
        const b = await fs.readFile('./tests/assets/config-1.2.1.jar.pack.xz');
        console.log(Lzma)
        const out = Lzma.decompress(b)
        console.log(out)
        // const zi = new Zip().loadAsync()
        //     .then(z => {
        //         console.log(z.files)
        //     })
    }).timeout(10000000)
})
