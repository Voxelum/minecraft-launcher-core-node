import * as fs from 'fs-extra'
import * as http from 'http'
import * as https from 'https'
import * as urls from 'url'
import { Writable, Readable } from 'stream';
import * as ByteBuffer from "bytebuffer";
import { monitor, TaskImpl } from './monitor';
type Requestor = {
    get(options: http.RequestOptions | string, callback?: (res: http.IncomingMessage) => void): http.ClientRequest;
};

interface IncomingMessage extends Readable {
    headers: any;
    statusCode: number;
    statusMessage: string;
}

function handleResponse(response: IncomingMessage, reject: (any?: any) => void, resolve: (any?: any) => void, file?: string, cb?: (progress: number, total: number) => void) {
    if (response.statusCode !== 200) {
        reject(new Error(response.statusCode.toString()))
    }
    let stream = file ? fs.createWriteStream(file) : new WriteableBuffer()
    response.on('error', (e: Error) => {
        if (file) fs.unlink(file, err => {
            reject(e);
        });
        else reject(e)
    })
    if (cb) {
        let len = 0;
        const total = Number.parseInt(response.headers['content-length'])
        cb(-1, total)
        response.on('data', (buf: Buffer) => {
            len += buf.length;
            cb(len, total)
        })
    }
    response.pipe(stream)
    stream.on('finish', () => {
        if (file) {
            (stream as any).close();
            resolve()
        } else {
            resolve((stream as WriteableBuffer).toBuffer())
        }
    })
}
let download: (url: string, file?: string, cb?: (progress: number, total: number) => void) => Promise<Buffer | void>;
try {
    const electron = require('electron');
    let net = electron.net ? electron.net : electron.remote.require('net')
    if (!net) throw new Error()
    download = (url: string, file?: string, cb?: (progress: number, total: number) => void) => {
        const req = net.request(url);
        return new Promise<Buffer | void>((resolve, reject) => {
            req.on('response', (response: any) => {
                handleResponse(response, reject, resolve, file, cb);
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
                        resolve(findSource(res.headers['location'] as string))
                    }
                    else resolve(res)
                })
            req.on('error', reject)
            req.end()
        })
    }
    download = (url: string, file?: string, cb?: (progress: number, total: number) => void): Promise<void | Buffer> => {
        return findSource(url).then(res => {
            return new Promise<void | Buffer>((resolve, reject) => {
                handleResponse(res as IncomingMessage, reject, resolve, file, cb);
            });
        })
    }
}

import Task, { AbstractTask } from './task'

export class DownloadTask extends AbstractTask<void | Buffer> {
    constructor(id: string, readonly url: string, readonly file?: string) { super(id); }
    execute(context: Task.Context): Promise<void | Buffer> {
        return download(this.url, this.file, (progress, total) => {
            this.emit('update', progress, total);
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

