import { Launcher, Version } from '../index'
import * as assert from 'assert'

describe('Launch', () => {
    it('should launch minecraft', async () => {
        const option = { version: '1.12.2-forge1.12.2-14.23.2.2611', gamePath: './tests/assets/temp', javaPath: 'C:/Program Files/Java/jre1.8.0_151/bin/javaw.exe' };
        const ver = await Version.parse('./tests/assets/temp', '1.12.2-forge1.12.2-14.23.2.2611')
        const proc = await Launcher.launch(option)
        await new Promise((resol, rej) => {
            proc.stdout.on('data', (chunk) => {
                console.log(chunk.toString())
            })
            proc.stderr.on('data', (chunk) => {
                console.log(chunk.toString())
            })
            proc.on('exit', () => {
                resol();
            })
        })
    }).timeout
})