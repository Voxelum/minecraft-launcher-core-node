import * as fs from 'fs-extra'
import * as http from 'http'
import * as https from 'https'
import * as urls from 'url'
import { Writable } from 'stream';
import * as ByteBuffer from "bytebuffer";

type Requestor = {
    get(options: http.RequestOptions | string, callback?: (res: http.IncomingMessage) => void): http.ClientRequest;
};

let download: (url: string, file?: string) => Promise<Buffer | void>;
try {
    const electron = require('electron')
    const net = electron.net
    download = (url: string, file?: string) => {
        const req = net.request(url);
        return new Promise<Buffer | void>((resolve, reject) => {
            req.on('response', (response: any) => {
                if (response.statusCode !== 200) {
                    reject(new Error(response.statusCode))
                }
                let stream = file ? fs.createWriteStream(file) : new WriteableBuffer()
                response.on('error', (e: Error) => {
                    if (file) fs.unlink(file, err => {
                        reject(e);
                    });
                })
                response.pipe(stream)
                stream.on('finish', () => {
                    if (file) {
                        (stream as any).close();
                        resolve()
                    } else {
                        resolve((stream as WriteableBuffer).toBuffer())
                    }
                })
            })
            req.on('error', (err: any) => {
                if (file) fs.unlink(file, e => {
                    reject(err);
                });
                else reject(err)
            })
            req.end()
        });
    }
}
catch (e) {
    const findSource = (url: string): Promise<http.IncomingMessage> => {
        const target = urls.parse(url);
        let requester: Requestor = target.protocol === 'https:' ? https : http
        return new Promise((resolve, reject) => {
            let path = target.path;
            if (!path) { reject(); return }
            if (target.search !== null && target.search !== undefined)
                path += target.search;
            let req = requester.get({
                path,
                protocol: target.protocol,
                host: target.host,
            },
                res => {
                    if (res.statusCode == 304 || res.statusCode == 302)
                        resolve(findSource(res.headers['location'] as string))
                    else if (res.statusCode === 301) {
                        console.log(res.headers)
                        // resolve(findSource(requester, res.headers['location'] as string))
                    }
                    else resolve(res)
                })
            req.on('error', reject)
            req.end()
        })
    }
    download = (url: string, file?: string): Promise<void | Buffer> => {
        return findSource(url)
            .then(res => {
                if (res.statusCode !== 200)
                    throw new Error(`Error ${res.statusCode}`)
                else {
                    let stream = file ? fs.createWriteStream(file) : new WriteableBuffer()
                    return new Promise<void | Buffer>((resolve, reject) => {
                        res.pipe(stream)
                        res.on('error', (err) => {
                            if (file) {
                                (stream as any).close();
                                fs.unlink(file, e => {
                                    reject(err);
                                });
                            } else reject(err);
                        })
                        stream.on('finish', () => {
                            if (file) {
                                (stream as any).close(); resolve();
                            } else {
                                resolve((stream as WriteableBuffer).toBuffer())
                            }
                        })
                    });
                }
            })
    }
}

class WriteableBuffer extends Writable {
    constructor(public buffer: ByteBuffer = new ByteBuffer()) {
        super();
    }
    _write(chunk: any, encoding: string, callback: Function): void {
        if (chunk instanceof Buffer) {
            this.buffer.append(chunk)
        }
        callback()
    }
    toBuffer() {
        return Buffer.from(this.buffer.flip().toArrayBuffer())
    }
}
export default download;

