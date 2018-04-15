import { Launcher, Version } from '../index'
import * as assert from 'assert'
import { spawn } from 'child_process'

describe('Launch', () => {
    let javaPath: string;
    before(function () {
        if (process.env.JAVA_HOME) {
            javaPath = `${process.env.JAVA_HOME}/bin/java`
        } else {
            this.skip()
        }
    })

    it('should launch normal minecraft', async () => {
        const option = { version: '1.12.2', gamePath: './tests/assets/temp', javaPath };
        const proc = await Launcher.launch(option)
        await new Promise((resol, rej) => {
            proc.stdout.on('data', (chunk) => {
                const str = chunk.toString();
                if (str.indexOf('[Client thread/INFO]: Created: 1024x512 textures-atlas') !== -1) {
                    proc.kill('SIGINT');
                }
                // console.log(chunk.toString())
            })
            proc.stderr.on('data', (chunk) => {
                console.log(chunk.toString())
            })
            proc.on('exit', (code, signal) => {
                if (signal === 'SIGINT')
                    resol();
                else rej({ code, signal })
            })
        })
    }).timeout(100000)
    it('should launch server', async () => {
        const option: Launcher.Option = {
            version: '1.12.2', gamePath: './tests/assets/temp', javaPath, server: {
                ip: '127.0.0.1',
                port: 25565,
            }
        };
        const proc = await Launcher.launch(option)
        await new Promise((resol, rej) => {
            proc.stdout.on('data', (chunk) => {
                const str = chunk.toString();
                if (str.indexOf('[Client thread/INFO]: Connecting to 127.0.0.1, 25565') !== -1) {
                    proc.kill('SIGINT');
                }
            })
            proc.stderr.on('data', (chunk) => {
                console.log(chunk.toString())
            })
            proc.on('exit', (code, signal) => {
                if (signal === 'SIGINT')
                    resol();
                else rej({ code, signal })
            })
        })
    }).timeout(100000)
    it('should launch forge minecraft', async () => {
        const option = { version: '1.12.2-forge1.12.2-14.23.2.2611', gamePath: './tests/assets/temp', javaPath };
        const proc = await Launcher.launch(option)
        await new Promise((resol, rej) => {
            proc.stdout.on('data', (chunk) => {
                const str = chunk.toString();
                if (str.indexOf('[main/INFO] [FML]: Itemstack injection complete') !== -1) {
                    proc.kill('SIGINT');
                }
                // console.log(chunk.toString())
            })
            proc.stderr.on('data', (chunk) => {
                console.log(chunk.toString())
            })
            proc.on('exit', (code, signal) => {
                if (signal === 'SIGINT')
                    resol();
                else rej({ code, signal })
            })
        })
    }).timeout(100000)
    it('should launch liteloader minecraft', async () => {
        const option = { version: '1.12.2-Liteloader1.12.2-1.12.2-SNAPSHOT', gamePath: './tests/assets/temp', javaPath };
        const proc = await Launcher.launch(option)
        await new Promise((resol, rej) => {
            const out: string[] = []
            proc.stdout.on('data', (chunk) => {
                const str = chunk.toString();
                out.push(str)
                if (str.indexOf('LiteLoader begin POSTINIT') !== -1) {
                    proc.kill('SIGINT');
                }
            })
            proc.stderr.on('data', (chunk) => {
                out.push(chunk.toString())
            })
            proc.on('exit', (code, signal) => {
                if (signal === 'SIGINT')
                    resol();
                else rej({ code, signal })
            })
        })
    }).timeout(100000)

    it('should launch forge liteloader minecraft', async () => {
        const option = { version: '1.12.2-forge1.12.2-14.23.2.2611-Liteloader1.12.2-1.12.2-SNAPSHOT', gamePath: './tests/assets/temp', javaPath };
        const proc = await Launcher.launch(option)
        await new Promise((resol, rej) => {
            let foundLite = false;
            let foundForge = false;
            const out: string[] = []
            proc.stdout.on('data', (chunk) => {
                const str = chunk.toString();
                out.push(str)
                if (str.indexOf('LiteLoader begin POSTINIT') !== -1) foundLite = true;
                if (str.indexOf('[main/INFO] [FML]: Itemstack injection complete') !== -1) foundForge = true;
                if (foundForge && foundLite)
                    proc.kill('SIGINT');
            })
            proc.stderr.on('data', (chunk) => {
                out.push(chunk.toString())
            })
            proc.on('exit', (code, signal) => {
                if (signal === 'SIGINT')
                    resol();
                else rej({ code, signal, log: out })
            })
        })
    }).timeout(100000)
})