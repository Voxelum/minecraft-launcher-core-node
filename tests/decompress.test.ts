import * as Zip from 'jszip'
import * as fs from 'fs-extra'
import * as lz from 'lzma-native'
import { createDecompressor } from 'lzma-native'
import unpack from 'unpack200'

describe('decomp', () => {
    it('should decc', async () => {

        // const b = await fs.readFile('./tests/assets/config-1.2.1.jar.pack.xz');
        // const inStrea = fs.createReadStream('./tests/assets/config-1.2.1.jar.pack.xz')
        // const dec = createDecompressor()
        // const out = fs.createWriteStream('./tests/assets/config-1.2.1.jar.pack')
        // await new Promise((resolve, reject) => {
        //     dec.on('data', () => {
        //         console.log('data')
        //     })
        //     dec.on('end', () => {
        //         console.log('end')
        //         resolve()
        //     })
        //     inStrea.pipe(dec).pipe(out);
        // })
        await unpack('C:/Users/cijhn/Desktop/jre/config-1.2.1.jar.pack', { outfile: 'C:/Users/cijhn/Desktop/jre/config-1.2.1.jar' })

        // await unpack('./tests/assets/config-1.2.1.jar.pack')

    }).timeout(10000000)
})
