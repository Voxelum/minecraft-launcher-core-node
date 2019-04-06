import { createHash, Hash } from "crypto";
import * as fs from "fs-extra";
import * as http from "http";
import * as https from "https";
import { Readable, Writable } from "stream";
import Task from "treelike-task";
import * as urls from "url";
import { DownloadService } from "../services";

type GET = (options: http.RequestOptions, callback?: (res: http.IncomingMessage) => void) => http.ClientRequest;

function pipeTo<T extends NodeJS.WritableStream>(progressCallback: (written: number, total: number) => void, readable: Readable, writable: T, total: number, checksum?: {
    algorithm: string, hash: string,
}) {
    return new Promise((resolve, reject) => {
        let written = 0;
        progressCallback(0, total);
        let hasher: Hash;
        if (checksum) {
            hasher = createHash(checksum.algorithm);
        }
        readable
            .on("error", (e) => {
                resolve(written);
            })
            .on("data", (buf) => {
                progressCallback(written += buf.length, total);
                if (hasher) {
                    hasher.update(buf);
                }
            })
            .pipe(writable);
        writable.on("finish", () => {
            if (checksum) {
                resolve(hasher.digest("hex") === checksum.hash ? written : 0);
            }
            resolve(written);
        });
    });
}

function nodeJsRequest(url: string, option: DownloadService.Option): Promise<{ message: http.IncomingMessage, url: string }> {
    const parsed = urls.parse(url);
    const httpOption: http.RequestOptions = {
        protocol: parsed.protocol,
        host: parsed.host,
        hostname: parsed.hostname,
        port: parsed.port ? Number.parseInt(parsed.port, 10) : undefined,
        path: parsed.path,
        auth: parsed.auth,
        headers: option.headers,
        method: option.method,
        timeout: option.timeout,
    };
    const get: GET = httpOption.protocol === "https:" ? https.get : http.get;
    return new Promise((resolve, reject) => {
        get(httpOption, (message) => {
            if (!message.statusCode) {
                reject("Illegal Status Code");
            } else {
                if (message.statusCode >= 200 && message.statusCode < 300) {
                    resolve({ message, url });
                } else if (message.headers.location) {
                    nodeJsRequest(message.headers.location as string, option)
                        .then(resolve);
                } else {
                    reject(`${message.statusCode}: ${message.statusMessage}`);
                }
            }
        }).on("error", reject).end();
    });
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

async function download(option: DownloadService.Option | string, destination?: string) {
    const realOption = typeof option === "string" ? { url: option } : option;
    const callback = realOption.progress || (() => { });
    const writable: Writable = typeof destination === "string" ? fs.createWriteStream(destination) :
        destination === undefined ? new WriteableBuffer() : destination;
    try {
        const { message, url } = await nodeJsRequest(realOption.url, realOption);

        const total = Number.parseInt(message.headers["content-length"] as string, 10);

        const written = await pipeTo(callback, message, writable, total, realOption.checksum);
        if (written !== total) {
            throw {
                message: "Fail to download the url, please retry",
                url,
                written,
                total,
            };
        }
    } catch (e) {
        if (typeof destination === "string") {
            await fs.unlink(destination).catch((_) => _);
        }
        throw { error: e, option };
    }
    if (!destination) {
        return (writable as WriteableBuffer).toBuffer();
    }
}

export function apply() {
    DownloadService.set({
        download(option: DownloadService.Option | string, destination?: string) {
            return download(option, destination);
        },
    } as DownloadService);
}

apply();
