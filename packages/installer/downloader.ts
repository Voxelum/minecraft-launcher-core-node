import { checksum, ensureFile, missing, stat } from "@xmcl/core/fs";
import Task from "@xmcl/task";
import { createReadStream, createWriteStream } from "fs";
import * as gotDefault from "got";
import { IncomingMessage } from "http";
import { fileURLToPath, parse } from "url";

const IS_ELECTRON = false; // process.versions.hasOwnProperty("electron");

export interface UpdatedObject {
    timestamp: string;
}

export const got = gotDefault.extend({
    useElectronNet: IS_ELECTRON,
});

export const fetchJson = gotDefault.extend({
    json: true,
    useElectronNet: IS_ELECTRON,
});

export const fetchBuffer = gotDefault.extend({
    encoding: null,
    useElectronNet: IS_ELECTRON,
});


export async function getRawIfUpdate(url: string, timestamp?: string): Promise<{ timestamp: string; content: string | undefined }> {
    const lastModified = timestamp;
    const resp = await got(url, {
        encoding: "utf-8",
        headers: lastModified ? { "If-Modified-Since": lastModified } : undefined,
    });
    const lastModifiedReturn = resp.headers["last-modified"] || resp.headers["Last-Modified"] as string || "";
    if (resp.statusCode === 304) {
        return { timestamp: lastModifiedReturn, content: undefined };
    }
    return {
        timestamp: lastModifiedReturn,
        content: resp.body,
    };
}

export async function getIfUpdate<T extends UpdatedObject = UpdatedObject>(url: string, parser: (s: string) => any, lastObj?: T): Promise<T | undefined> {
    const lastModified = lastObj ? lastObj.timestamp : undefined;
    try {
        const resp = await got(url, {
            encoding: "utf-8",
            headers: lastModified ? { "If-Modified-Since": lastModified } : undefined,
        });
        if (resp.statusCode === 304) {
            return lastObj;
        }
        return {
            timestamp: resp.headers["last-modified"] as string,
            ...parser(resp.body),
        };
    } catch (e) {
        if (lastObj) { return lastObj; }
        throw e;
    }
}

export interface DownloadOption {
    url: string | string[];
    retry?: number;
    method?: string;
    headers?: { [key: string]: string };
    timeout?: number;
    progress?: (written: number, total: number, url: string) => boolean | void;
    pausable?: (pauseFunc: () => void, resumeFunc: () => void) => void;
}

export interface DownloadToOption extends DownloadOption {
    destination: string;
}

export interface DownloadAndCheckOption extends DownloadOption {
    checksum?: {
        algorithm: string,
        hash: string,
    };
}

export class Downloader {
    protected async openDownloadStreamInternal(url: string, option: DownloadOption) {
        const onProgress = option.progress || (() => { });
        const parsedURL = parse(url);
        if (parsedURL.protocol === "file:") {
            const path = fileURLToPath(url);
            let read = 0;
            const fstat = await stat(path);
            const stream = createReadStream(path).on("data", (chunk) => {
                read += chunk.length;
                if (onProgress(read, fstat.size, url)) {
                    stream.destroy();
                }
            });
            if (option.pausable) {
                option.pausable(stream.pause, stream.resume);
            }
            return stream;
        }
        let response: IncomingMessage;
        const stream = got.stream(url, {
            method: option.method,
            headers: option.headers,
            timeout: option.timeout,
            followRedirect: true,
            retry: option.retry,
        }).on("response", (resp) => {
            response = resp;
        }).on("downloadProgress", (progress) => {
            if (onProgress(progress.transferred, progress.total || -1, url)) {
                response.destroy();
            }
        });
        if (option.pausable) {
            option.pausable(stream.pause, stream.resume);
        }
        return stream;
    }
    protected async shouldDownloadFile(destination: string, option?: DownloadAndCheckOption["checksum"]) {
        if (!option) {
            return missing(destination);
        }
        const hash = await checksum(destination, option.algorithm);
        return hash !== option.hash;
    }
    openDownloadStream(option: DownloadOption) {
        if (typeof option.url === "string") {
            return this.openDownloadStreamInternal(option.url, option);
        }
        const chain = option.url.map((u) => () => this.openDownloadStreamInternal(u, option));
        let promise = chain.shift()!();
        while (chain.length > 0) {
            const next = chain.shift();
            if (next) {
                promise = promise.catch(() => next());
            }
        }
        return promise;
    }
    async downloadFile(option: DownloadToOption): Promise<string> {
        await ensureFile(option.destination);
        const stream = await this.openDownloadStream(option);
        return new Promise<string>((resolve, reject) => {
            stream
                .on("error", reject)
                .pipe(createWriteStream(option.destination))
                .on("close", () => resolve(option.destination));
        });
    }
    async downloadFileIfAbsent(option: DownloadAndCheckOption & DownloadToOption): Promise<string> {
        if (await this.shouldDownloadFile(option.destination, option.checksum)) {
            return this.downloadFile(option);
        }
        return option.destination;
    }
}

export let downloader: Downloader;

export function setDownloader(newDownloader: Downloader) {
    downloader = newDownloader;
}

setDownloader(new Downloader());

export function downloadFileTask(option: DownloadToOption, worker: Downloader = downloader) {
    return async (context: Task.Context) => {
        option.pausable = context.pausealbe;
        option.progress = (p, t, u) => context.update(p, t, u);
        await worker.downloadFile(option);
        context.pausealbe(undefined, undefined);
    };
}

export function downloadFileIfAbsentTask(option: DownloadAndCheckOption & DownloadToOption, worker: Downloader = downloader) {
    return async (context: Task.Context) => {
        option.pausable = context.pausealbe;
        option.progress = (p, t, u) => context.update(p, t, u);
        await worker.downloadFileIfAbsent(option);
        context.pausealbe(undefined, undefined);
    };
}
