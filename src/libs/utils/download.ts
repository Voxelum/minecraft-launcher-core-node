import * as ByteBuffer from "bytebuffer";
import * as fs from "fs-extra";
import * as http from "http";
import * as https from "https";
import { Readable, Writable } from "stream";
import Task from "treelike-task";
import * as urls from "url";

type GET = (options: http.RequestOptions, callback?: (res: http.IncomingMessage) => void) => http.ClientRequest;

function pipeTo<T extends NodeJS.WritableStream>(context: Task.Context, readable: Readable, writable: T, total: number,
    progress?: (progress: number, total: number) => void) {
    return new Promise((resolve, reject) => {
        readable.on("error", (e) => { reject(e); });
        let len = 0;
        context.update(-1, total);
        readable.on("data", (buf) => { context.update(len += buf.length, total); });
        readable.pipe(writable);
        writable.on("finish", () => { resolve(); });
    });
}

function nodeJsDownload(options: http.RequestOptions | string): Promise<http.IncomingMessage> {
    let option: http.RequestOptions;
    if (typeof options === "string") {
        const parsed = urls.parse(options);
        option = {
            protocol: parsed.protocol,
            host: parsed.host,
            hostname: parsed.hostname,
            port: parsed.port ? Number.parseInt(parsed.port, 10) : undefined,
            path: parsed.path,
            auth: parsed.auth,
        };
    } else { option = options; }
    const get: GET = option.protocol === "https:" ? https.get : http.get;
    return new Promise((resolve, reject) => {
        get(option, (res) => {
            if (!res.statusCode) {
                reject();
                return;
            }
            if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve(res);
            } else if (res.headers.location) {
                resolve(nodeJsDownload(res.headers.location as string));
 } else { reject(); }
        }).on("error", reject).end();
    });
}

export function downloadTask(options: http.RequestOptions | string, fileOrOutStream?: string | Writable) {
    return async (context: Task.Context) => {
        const writable: Writable = typeof fileOrOutStream === "string" ? fs.createWriteStream(fileOrOutStream) :
            fileOrOutStream === undefined ? new WriteableBuffer() : fileOrOutStream;
        try {
            const readable = await nodeJsDownload(options);
            const total = Number.parseInt(readable.headers["content-length"] as string, 10);
            await pipeTo(context, readable, writable, total);
        } catch (e) {
            if (typeof fileOrOutStream === "string") {
                try {
                    await fs.unlink(fileOrOutStream);
                } catch (e) {
                }
            }
            throw { error: e, options };
        }
        if (!fileOrOutStream) {
            return (writable as WriteableBuffer).toBuffer();
        }
    };
}

export function download(options: http.RequestOptions | string, file?: string) {
    return Task.create("download", downloadTask(options, file)).execute();
}

class WriteableBuffer extends Writable {
    constructor(private buffers: Buffer[] = []) {
        super();
    }
    _write(chunk: any, encoding: string, callback: (err?: Error) => void): void {
        if (chunk instanceof Buffer) {
            this.buffers.push(chunk);
        }
        callback();
    }
    toBuffer() {
        const concat = Buffer.concat(this.buffers);
        return concat;
    }
}


