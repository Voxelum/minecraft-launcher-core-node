import { createHash, Hash } from "crypto";
import * as fs from "fs";
import got = require("got");
import * as http from "http";
import * as https from "https";
import { Readable, Writable } from "stream";
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

function nodeJsRequest(url: string, option: DownloadService.Option | DownloadService.CacheOption): Promise<{ message: http.IncomingMessage, url: string }> {
    const parsed = urls.parse(url);
    interface Full { timestamp: string; eTag: string; }
    const asCache = (option as DownloadService.CacheOption);
    const headers = { ...(option.headers || {}) };
    if (asCache.cache) {
        const cache = asCache.cache as Full;
        if (cache.timestamp) {
            headers["If-Modified-Since"] = cache.timestamp;
        } else if (cache.eTag) {
            headers["If-None-Match"] = cache.eTag;
        }
    }
    const httpOption: http.RequestOptions = {
        protocol: parsed.protocol,
        host: parsed.host,
        hostname: parsed.hostname,
        port: parsed.port ? Number.parseInt(parsed.port, 10) : undefined,
        path: parsed.path,
        auth: parsed.auth,
        headers,
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
                } else if (message.statusCode === 304) {
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

async function download(option: DownloadService.Option | DownloadService.CacheOption | string, destination?: string) {
    const realOption = typeof option === "string" ? { url: option } : option;
    const callback = realOption.progress || (() => { });
    const writable: Writable = typeof destination === "string" ? fs.createWriteStream(destination) :
        destination === undefined ? new WriteableBuffer() : destination;
    try {
        const { message, url } = await nodeJsRequest(realOption.url, realOption);

        const stream = got.stream(realOption.url, {
            method: realOption.method,
            headers: realOption.headers,
            timeout: realOption.timeout,
            followRedirect: true,
        }).on("response", (resp) => {

        }).on("redirect", (res, next) => {

        }).on("data", (data) => {

        }).on("downloadProgress", (progress) => {

        });
        const total = Number.parseInt(message.headers["content-length"] as string, 10);

        if (message.statusCode === 304) {
            if (!destination) {
                return {
                    timestamp: message.headers["last-modified"],
                    eTag: message.headers.ETag,
                    value: undefined,
                };
            }
            return {
                timestamp: message.headers["last-modified"],
                eTag: message.headers.ETag,
            };
        } else {
            const written = await pipeTo(callback, message, writable, total, realOption.checksum);
            if (written !== total) {
                throw {
                    message: "Fail to download the url, please retry",
                    url,
                    written,
                    total,
                };
            }
            if (!destination) {
                return (writable as WriteableBuffer).toBuffer();
            }
        }
    } catch (e) {
        if (typeof destination === "string") {
            await fs.promises.unlink(destination).catch((_) => _);
        }
        throw { error: e, option };
    }
}

export function apply() {
    DownloadService.set({
        download(option: DownloadService.Option | DownloadService.CacheOption | string, destination?: string) {
            return download(option, destination);
        },
    } as DownloadService);
}

apply();
