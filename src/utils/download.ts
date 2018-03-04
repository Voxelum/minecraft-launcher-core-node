import * as fs from 'fs-extra'
import * as http from 'http'
import * as https from 'https'
import * as urls from 'url'
import { Writable, Readable } from 'stream';
import * as ByteBuffer from "bytebuffer";
import Task from 'treelike-task'

type GET = (options: http.RequestOptions, callback?: (res: http.IncomingMessage) => void) => http.ClientRequest;

function pipeTo<T extends NodeJS.WritableStream>(readable: Readable, writable: T, total: number,
    progress?: (progress: number, total: number) => void) {
    return (context: Task.Context) => {
        return new Promise((resolve, reject) => {
            readable.on('error', (e) => { reject(e) });
            let len = 0;
            context.update(-1, total);
            readable.on('data', (buf) => { context.update(len += buf.length, total) })
            readable.pipe(writable);
            writable.on('finish', () => { resolve() })
        });
    }
}

function nodeJsDownload(options: http.RequestOptions | string): Promise<http.IncomingMessage> {
    let option: http.RequestOptions;
    if (typeof options === 'string') {
        const parsed = urls.parse(options);
        option = {
            protocol: parsed.protocol,
            host: parsed.host,
            hostname: parsed.hostname,
            port: parsed.port ? Number.parseInt(parsed.port) : undefined,
            path: parsed.path,
            auth: parsed.auth,
        };
    } else option = options;
    const get: GET = option.protocol === 'https:' ? https.get : http.get;
    return new Promise((resolve, reject) => {
        get(option, (res) => {
            if (!res.statusCode) {
                reject();
                return;
            }
            if (res.statusCode >= 200 && res.statusCode < 300)
                resolve(res);
            else if (res.headers.location)
                resolve(nodeJsDownload(res.headers.location as string))
            else reject();
        }).on('error', reject).end()
    })
}

export function downloadTask(options: http.RequestOptions | string, file?: string) {
    return async (context: Task.Context) => {
        const writable: Writable = file ? fs.createWriteStream(file) : new WriteableBuffer();
        try {
            const readable = await context.execute('fetchMessage', () => nodeJsDownload(options));
            const total = Number.parseInt(readable.headers['content-length'])
            await context.execute('fetchData', pipeTo(readable, writable, total))
        } catch {
            if (file) await fs.unlink(file);
        }
        if (!file) {
            return (writable as WriteableBuffer).toBuffer();
        }
    };
}

export function download(options: http.RequestOptions | string, file?: string) {
    return Task.create('download', downloadTask(options, file)).execute()
}

class WriteableBuffer extends Writable {
    constructor(private buffers: Buffer[] = []) {
        super();
    }
    _write(chunk: any, encoding: string, callback: Function): void {
        if (chunk instanceof Buffer) {
            this.buffers.push(chunk);
        }
        callback()
    }
    toBuffer() {
        return Buffer.concat(this.buffers);
    }
}


