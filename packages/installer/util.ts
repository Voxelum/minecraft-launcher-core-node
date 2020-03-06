import { futils } from "@xmcl/core";
import Task from "@xmcl/task";
import HttpAgent, { HttpsAgent } from "agentkeepalive";
import { ExecOptions, spawn } from "child_process";
import { createReadStream, createWriteStream, ReadStream } from "fs";
import got from "got";
import { ProxyStream } from "got/dist/source/as-stream";
import { IncomingMessage } from "http";
import { cpus } from "os";
import { pipeline as pip } from "stream";
import { fileURLToPath, parse } from "url";
import { promisify } from "util";
import { MultipleError } from "./minecraft";

const { checksum, ensureFile, missing } = futils;

const pipeline = promisify(pip);

export interface UpdatedObject {
    timestamp: string;
}

export async function getRawIfUpdate(url: string, timestamp?: string): Promise<{ timestamp: string; content: string | undefined }> {
    const headers: Record<string, string> = {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36 Edg/80.0.361.48",
    };
    if (typeof timestamp === "string") {
        headers["If-Modified-Since"] = timestamp;
    }
    const resp = await got(url, {
        encoding: "utf8",
        headers,
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

export async function getIfUpdate<T extends UpdatedObject>(url: string, parser: (s: string) => any, lastObject: T | undefined): Promise<T> {
    const { content, timestamp } = await getRawIfUpdate(url, lastObject?.timestamp);
    if (content) {
        return {
            ...parser(content),
            timestamp,
        };
    }
    return lastObject!; // this cannot be undefined as the content be null only and only if the lastObject is presented.
}

export interface DownloadOption {
    url: string | string[];
    retry?: number;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "HEAD" | "DELETE" | "OPTIONS" | "TRACE" | "get" | "post" | "put" | "patch" | "head" | "delete" | "options" | "trace";
    headers?: { [key: string]: string };
    timeout?: number;
    /**
     * If user wants to know the progress, pass this in, and `Downloader` should call this when there is a progress.
     * @param chunkLength The length of just transferred chunk
     * @param written The chunk already written to the disk
     * @param total The total bytes of the download file
     * @param url The remote url of the file
     */
    progress?: (chunkLength: number, written: number, total: number, url: string) => boolean | void;
    /**
     * If user wants to pause/resume the download, pass this in, and `Downloader` should call this to tell user how to pause and resume.
     */
    pausable?: (pauseFunc: () => void, resumeFunc: () => void) => void;

    /**
     * The destination of the download on the disk
     */
    destination: string;
    /**
     * The checksum info of the file
     */
    checksum?: { algorithm: string; hash: string; };
    mode?: "checksumNotMatch" | "noChecksumProvided" | "always";
}

export interface Downloader {
    /**
     * Download file to the disk
     *
     * @returns The downloaded file full path
     */
    downloadFile(option: DownloadOption): Promise<void>;
}

/**
 * The default downloader based on gotjs
 */
export class DefaultDownloader implements Downloader {
    constructor(readonly requster = got.extend({
        agent: {
            http: new HttpAgent(),
            https: new HttpsAgent(),
        } as any,
        followRedirect: true,
    })) { }

    protected openDownloadStream(url: string, option: DownloadOption) {
        let onProgress = option.progress || (() => { });
        let stream: ReadStream | ProxyStream;

        let parsedURL = parse(url);
        if (parsedURL.protocol === "file:") {
            let path = fileURLToPath(url);
            let read = 0;
            stream = createReadStream(path).on("data", (chunk) => {
                read += chunk.length;
                if (onProgress(chunk.length, read, stream.readableLength, url)) {
                    stream.destroy();
                }
            });
        } else {
            let response: IncomingMessage;
            let lastTransferred = 0;
            stream = this.requster.stream(url, {
                method: option.method,
                headers: option.headers,
                timeout: option.timeout,
                retry: option.retry,
            }).on("response", (resp) => {
                response = resp;
            }).on("downloadProgress", (progress) => {
                let chunkLength = progress.transferred - lastTransferred;
                lastTransferred = progress.transferred;
                if (onProgress(chunkLength, progress.transferred, progress.total || -1, url)) {
                    response.destroy(new Task.CancelledError());
                }
            });
        }
        option.pausable?.(stream.pause, stream.resume);
        return stream;
    }
    /**
     * Download file by the option provided.
     */
    async downloadFile(option: DownloadOption): Promise<void> {
        await ensureFile(option.destination);

        if (typeof option.url === "string") {
            await pipeline(this.openDownloadStream(option.url, option), createWriteStream(option.destination));
            return;
        }
        let chain = option.url.map((u) => () => pipeline(this.openDownloadStream(u, option), createWriteStream(option.destination)));
        let promise = chain.shift()!();
        while (chain.length > 0) {
            const next = chain.shift();
            if (next) { promise = promise.catch(() => next()); }
        }
        await promise;
    }
}

/**
 * - If the file is not on the disk, it will return true.
 * - If the checksum is not provided, it will return true if file existed.
 * - If the checksum is provided, it will return true if the file checksum matched.
 */
async function shouldDownload(option: DownloadOption): Promise<boolean> {
    if (option.mode === "always") {
        return true;
    }
    let missed = await missing(option.destination);
    if (missed) {
        return true;
    }
    if (!option.checksum || option.checksum.hash.length === 0) {
        return option.mode === "noChecksumProvided";
    }
    const hash = await checksum(option.destination, option.checksum.algorithm);
    return hash !== option.checksum.hash;
}

/**
 * Wrapped task form of download file if absent task
 */
export function downloadFileTask(option: DownloadOption, worker: Downloader = new DefaultDownloader()) {
    return async (context: Task.Context) => {
        option.pausable = context.pausealbe;
        option.progress = (c, p, t, u) => context.update(p, t, u);
        if (await shouldDownload(option)) {
            await worker.downloadFile(option);
        }
        context.pausealbe(undefined, undefined);
    };
}

export function spawnProcess(javaPath: string, args: string[], options?: ExecOptions) {
    return new Promise<void>((resolve, reject) => {
        let process = spawn(javaPath, args, options);
        let errorMsg: string[] = [];
        process.on("error", reject);
        process.on("close", (code) => {
            if (code !== 0) { reject(errorMsg.join("")); } else { resolve(); }
        });
        process.on("exit", (code) => {
            if (code !== 0) { reject(errorMsg.join("")); } else { resolve(); }
        });
        process.stdout.setEncoding("utf-8");
        process.stdout.on("data", (buf) => { });
        process.stderr.setEncoding("utf-8");
        process.stderr.on("data", (buf) => { errorMsg.push(buf.toString()) });
    });
}

export async function batchedTask(context: Task.Context, tasks: Task<unknown>[], sizes: number[], maxConcurrency?: number, throwErrorImmediately?: boolean, getErrorMessage?: (errors: unknown[]) => string) {
    maxConcurrency = Math.max(Math.min(tasks.length, maxConcurrency ?? cpus().length * 3), 1);
    throwErrorImmediately = throwErrorImmediately ?? false;
    getErrorMessage = getErrorMessage ?? (() => "");

    async function worker(): Promise<void> {
        while (tasks.length > 0) {
            try {
                let sz = sizes.pop()!;
                await context.execute(tasks.pop()!, sz);
            } catch (e) {
                if (throwErrorImmediately || e instanceof Task.CancelledError) {
                    throw e;
                } else {
                    errors.push(e);
                }
            }
        }
    }
    let errors = [] as unknown[];
    let promises: Promise<void>[] = [];

    context.update(0, sizes.reduce((a, b) => a + b, 0));
    for (let i = 0; i < maxConcurrency; ++i) {
        promises.push(worker());
    }
    await Promise.all(promises);
    if (errors.length > 0) {
        throw new MultipleError(errors, getErrorMessage(errors));
    }
}

export function normalizeArray<T>(arr: T | T[] = []): T[] {
    return arr instanceof Array ? arr : [arr];
}

export function joinUrl(a: string, b: string) {
    if (a.endsWith("/") && b.startsWith("/")) {
        return a + b.substring(1);
    }
    if (!a.endsWith("/") && !b.startsWith("/")) {
        return a + "/" + b;
    }
    return a + b;
}

/**
 * Shared install options
 */
export interface InstallOptions {
    /**
     * When you want to install a version over another one.
     *
     * Like, you want to install liteloader over a forge version.
     * You should fill this with that forge version id.
     */
    inheritsFrom?: string;

    /**
     * Override the newly installed version id.
     *
     * If this is absent, the installed version id will be either generated or provided by installer.
     */
    versionId?: string;
}
