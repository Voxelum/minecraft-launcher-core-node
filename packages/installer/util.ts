import { Task } from "@xmcl/task";
import { ExecOptions, spawn } from "child_process";
import { createHash } from "crypto";
import { access as faccess, close as fclose, constants, copyFile as fcopyFile, createReadStream, createWriteStream, ftruncate, mkdir as fmkdir, open as fopen, readFile as freadFile, stat as fstat, unlink as funlink, writeFile as fwriteFile, WriteStream } from "fs";
import { Agent as HttpAgent, AgentOptions, ClientRequest, IncomingMessage, request, RequestOptions } from "http";
import { Agent as HttpsAgent, request as requests } from "https";
import { cpus } from "os";
import { dirname } from "path";
import { pipeline as pip } from "stream";
import { fileURLToPath, format, parse, UrlWithStringQuery } from "url";
import { promisify } from "util";

const access = promisify(faccess);
const open = promisify(fopen);
const close = promisify(fclose);
const copyFile = promisify(fcopyFile);
const truncate = promisify(ftruncate);

export const pipeline = promisify(pip);
export const unlink = promisify(funlink);
export const stat = promisify(fstat);
export const readFile = promisify(freadFile);
export const writeFile = promisify(fwriteFile);
export const mkdir = promisify(fmkdir);

export interface UpdatedObject {
    timestamp: string;
}

export interface Agents {
    http?: HttpAgent;
    https?: HttpsAgent;
}

export async function fetchText(url: string, agent?: Agents) {
    let parsed = parse(url);
    if (!isValidProtocol(parsed.protocol)) {
        throw new Error(`Invalid protocol ${parsed.protocol}`);
    }
    let { message: msg } = await fetch({
        method: "GET",
        ...parsed,
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36 Edg/80.0.361.48",
        },
    }, agent);
    let buf = await new Promise<Buffer>((resolve, reject) => {
        let contents: any[] = [];
        msg.on("data", (chunk) => { contents.push(chunk); });
        msg.on("end", () => { resolve(Buffer.concat(contents)); });
        msg.on("error", reject)
    });
    return buf.toString();
}

export async function fetchJson(url: string, agent?: Agents) {
    return JSON.parse(await fetchText(url, agent));
}

export async function getIfUpdate(url: string, timestamp?: string, agent: Agents = {}): Promise<{ timestamp: string; content: string | undefined }> {
    let parsed = parse(url);
    if (!isValidProtocol(parsed.protocol)) {
        throw new Error(`Invalid protocol ${parsed.protocol}`);
    }
    let { message: msg } = await fetch({
        method: "GET",
        ...parsed,
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36 Edg/80.0.361.48",
            "If-Modified-Since": timestamp ?? "",
        },
    }, agent);
    let buf = await new Promise<Buffer>((resolve, reject) => {
        let contents: any[] = [];
        msg.on("data", (chunk) => { contents.push(chunk); });
        msg.on("end", () => { resolve(Buffer.concat(contents)); });
        msg.on("error", reject)
    })
    let { statusCode, headers } = msg;
    if (statusCode === 304) {
        return {
            timestamp: headers["last-modified"]!,
            content: undefined,
        };
    } else if (statusCode === 200 || statusCode === 204) {
        return {
            timestamp: headers["last-modified"]!,
            content: buf.toString(),
        }
    }
    throw new Error(`Failure on response status code: ${statusCode}.`);
}

export async function getAndParseIfUpdate<T extends UpdatedObject>(url: string, parser: (s: string) => any, lastObject: T | undefined): Promise<T> {
    let { content, timestamp } = await getIfUpdate(url, lastObject?.timestamp);
    if (content) { return { ...parser(content), timestamp, }; }
    return lastObject!; // this cannot be undefined as the content be null only and only if the lastObject is presented.
}

export async function getLastModified(url: string, timestamp: string | undefined, agent: Agents = {}) {
    let parsed = parse(url);
    if (!isValidProtocol(parsed.protocol)) {
        throw new Error(`Invalid protocol ${parsed.protocol}`);
    }
    let { message: msg } = await fetch({
        method: "HEAD",
        ...parsed,
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36 Edg/80.0.361.48",
            "If-Modified-Since": timestamp ?? "",
        },
    }, agent);
    msg.resume();
    let { headers, statusCode } = msg;
    if (statusCode === 304) {
        return [true, headers["last-modified"]] as const;
    } else if (statusCode === 200 || statusCode === 204) {
        return [false, headers["last-modified"]] as const;
    }
    throw new Error(`Failure on response status code: ${statusCode}.`);
}

export interface DownloadOption {
    url: string | string[];
    headers?: { [key: string]: string };

    /**
     * The minimum bytes a segment should have.
     * @default 2MB
     */
    segmentThreshold?: number;
    /**
     * If user wants to know the progress, pass this in, and `Downloader` should call this when there is a progress.
     * @param chunkLength The length of just transferred chunk
     * @param written The chunk already written to the disk
     * @param total The total bytes of the download file
     * @param url The remote url of the file
     */
    progress?: (chunkLength: number, written: number, total: number, url: string) => boolean | void;
    /**
     * If user wants to pause/resume/cancel the download, pass this in, and `Downloader` should call this to tell user how to pause and resume.
     */
    handlers?: (pauseFunc: () => void, resumeFunc: () => void, cancelFunc: () => void) => void;
    /**
     * The destination of the download on the disk
     */
    destination: string;
    /**
     * The checksum info of the file
     */
    checksum?: { algorithm: string; hash: string; };
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
 * The options pass into the {@link Downloader}.
 */
export interface DownloaderOptions {
    /**
     * An customized downloader to swap default downloader.
     */
    downloader?: Downloader;
    /**
     * Decide should downloader redownload and overwrite existed file.
     *
     * It has such options:
     *
     * - `checksumNotMatch`: Only the file with checksum provided and not matched will be redownload.
     * - `checksumNotMatchOrEmpty`: Not only when the file checksum is not matched, but also when the file has no checksum, the file will be redownloaded.
     * - `always`: Always redownload files.
     *
     * @default "checksumNotMatch"
     */
    overwriteWhen?: "checksumNotMatchOrEmpty" | "checksumNotMatch" | "always";
    /**
     * Should hault the donwload process immediately after ANY resource download failed.
     */
    throwErrorImmediately?: boolean;
    /**
     * The suggested max concurrency of the download. This is not a strict criteria.
     */
    maxConcurrency?: number;
    /**
     * The suggested minimum bytes a segment should have.
     * @default 2MB
     */
    segmentThreshold?: number;
}

function computeSegmenets(total: number, chunkSize: number, concurrency: number) {
    let partSize = Math.max(chunkSize, Math.floor(total / concurrency));
    let segments: Segment[] = [];
    for (let cur = 0, chunkSize = 0; cur < total; cur += chunkSize) {
        let remain = total - cur;
        if (remain >= partSize) {
            chunkSize = partSize;
            segments.push({ start: cur, end: cur + chunkSize - 1 });
        } else {
            let last = segments[segments.length - 1];
            if (!last) {
                segments.push({ start: 0, end: remain - 1 });
            } else {
                last.end = last.end! + remain;
            }
            cur = total;
        }
    }
    return segments;
}

export interface Segment {
    start: number;
    end?: number;
}

function isValidProtocol(protocol: string | undefined | null): protocol is "http:" | "https:" {
    return protocol === "http:" || protocol === "https:";
}

function mergeRequestOptions(original: RequestOptions, newOptions: RequestOptions) {
    let options = { ...original } as any;
    for (let [key, value] of Object.entries(newOptions)) {
        if (value !== null) {
            options[key] = value;
        }
    }
    return options as RequestOptions;
}

function fetch(options: RequestOptions, agents: { http?: HttpAgent, https?: HttpsAgent } = {}) {
    return new Promise<{ request: ClientRequest, message: IncomingMessage }>((resolve, reject) => {
        function follow(options: RequestOptions) {
            if (!isValidProtocol(options.protocol)) {
                reject(new Error(`Invalid URL: ${format(options)}`));
            } else {
                let [req, agent] = options.protocol === "http:" ? [request, agents.http] : [requests, agents.https];
                let clientReq = req({ ...options, agent }, (m) => {
                    if (m.statusCode === 302 || m.statusCode === 301 || m.statusCode === 303) {
                        m.resume();
                        follow(mergeRequestOptions(options, parse(m.headers.location!)));
                    } else {
                        m.url = m.url || format(options);
                        clientReq.removeListener("error", reject);
                        resolve({ request: clientReq, message: m });
                    }
                });
                clientReq.addListener("error", reject);
                clientReq.end();
            }
        }
        follow(options);
    });
}

interface DownloadMetadata {
    url: string;
    acceptRanges: boolean;
    contentLength: number;
    lastModified?: string;
    eTag?: string;
}

/**
 * The default downloader based on nodejs http/https which support range (segment) download
 * and optimized for many small files downloading.
 * @beta
 */
export class HttpDownloader implements Downloader {
    constructor(readonly agents: Agents = {
        http: new HttpAgent({
            maxSockets: cpus().length * 4,
            maxFreeSockets: 64,
            keepAlive: true,
        }),
        https: new HttpsAgent({
            maxSockets: cpus().length * 4,
            maxFreeSockets: 64,
            keepAlive: true,
        }),
    }, readonly headers: Record<string, string | string[] | null> = {}) { }

    protected async resolveMetadata(parsedURL: UrlWithStringQuery): Promise<DownloadMetadata> {
        let { message: msg } = await fetch({ ...parsedURL, method: "HEAD", ...this.headers }, this.agents);

        msg.resume();
        let { headers, url: resultUrl, statusCode } = msg;
        if (statusCode !== 200 && statusCode !== 201) {
            throw new Error(`HTTP Error: Status code ${statusCode} on ${resultUrl}`);
        }
        return {
            url: resultUrl ?? format(parsedURL),
            acceptRanges: headers["accept-ranges"] === "bytes",
            contentLength: headers["content-length"] ? Number.parseInt(headers["content-length"]) : -1,
            lastModified: headers["last-modified"],
            eTag: headers.etag as string | undefined,
        };
    }

    protected async downloads(fd: number, originalUrl: UrlWithStringQuery, option: DownloadOption) {
        let dest = option.destination;
        let transferredTotal = 0;
        let progress = option.progress ?? (() => { });
        let headers = option.headers || {};

        // metadata
        let url: string = "";
        let total: number = 0;
        let eTag: string | undefined;
        let acceptRanges: boolean = false;
        let resolvedUrl: UrlWithStringQuery;
        let segments: Segment[] = [];

        // states
        let paused = false;
        let done = false;
        let cancelled = false;
        let _unpause: () => void;
        let pausing: Promise<void> = Promise.resolve();
        let abortRequests: Function[] = [];
        let states: Segment[] = segments.map((s) => ({ ...s }));
        let outputs: WriteStream[] = [];

        let validate = async () => {
            if (option.checksum) {
                let actual = await checksum(option.destination, option.checksum.algorithm)
                let expect = option.checksum.hash;
                return actual === expect;
            }
            return true;
        }

        let reset = () => {
            states = total && acceptRanges
                ? computeSegmenets(total, option.segmentThreshold ?? 2 * 1024 * 1024, 4)
                : [{ start: 0, end: total }];
            outputs = states.map((seg) => createWriteStream(dest, {
                fd,
                start: seg.start,
                autoClose: false,
            }));
        }

        let update = async () => {
            let newMetadata = await this.resolveMetadata(originalUrl);
            let unmatched = newMetadata.eTag !== eTag;
            if (unmatched || newMetadata.eTag === undefined) {
                url = newMetadata.url;
                eTag = newMetadata.eTag;
                acceptRanges = newMetadata.acceptRanges;
                total = newMetadata.contentLength;
                await truncate(fd, total);
                resolvedUrl = parse(url);
                reset();
            }
        }

        let download = async () => {
            let results = await Promise.all(states.map(async (seg, index) => {
                if (seg.end && seg.start >= seg.end) {
                    return true;
                }
                let options: RequestOptions = {
                    ...resolvedUrl,
                    method: "GET",
                    headers: {
                        ...this.headers,
                        ...headers,
                        Range: `bytes=${seg.start}-${seg.end ?? ""}`,
                    },
                };
                let { message: input, request } = await fetch(options, this.agents);
                input.on("data", (chunk) => {
                    transferredTotal += chunk.length;
                    seg.start += chunk.length;
                    if (progress(chunk.length, transferredTotal, total, url)) {
                        input.destroy(new Task.CancelledError());
                    }
                });
                let output = outputs[index];
                abortRequests[index] = () => {
                    input.unpipe();
                    request.abort();
                };
                return new Promise<boolean>((resolve, reject) => {
                    input.pipe(output);
                    output.on("finish", () => resolve(true));
                    request.on("abort", () => resolve(false));
                    request.on("error", reject);
                });
            }));
            done = results.every((r) => r);
        }

        let pause = () => {
            if (!paused) {
                paused = true;
                // update the pause handle
                pausing = new Promise((resolve) => {
                    _unpause = resolve;
                });

                // notify each request to abort
                abortRequests.forEach((f) => f());
                abortRequests.fill(() => { });
            }
        }
        let resume = () => {
            if (paused) {
                paused = false;
                _unpause();
                _unpause = () => { };
                pausing = Promise.resolve();
            }
        }
        let cancel = () => {
            if (!cancelled) {
                cancelled = true;
                // notify each request to abort
                abortRequests.forEach((f) => f());
                abortRequests.fill(() => { });
            }
        };
        let shouldTolerateError = (e: any) => {
            if (e.code === "ECONNRESET") {
                return true;
            }
            if (e.code === "ETIMEDOUT") {
                return true;
            }
            if (e.code === "EPROTO") {
                return true;
            }
            if (e.code === "ECANCELED") {
                return true;
            }
            return false;
        }
        option.handlers?.(pause, resume, cancel);

        let retry = 2;
        while (!done && retry > 0) {
            try {
                await update();
                await download();
                if (cancelled) {
                    return states;
                }
                await pausing;
                if (!done) {
                    continue;
                }
                if (await validate()) {
                    break;
                } else {
                    done = false;
                    reset();
                }
            } catch (e) {
                if (!shouldTolerateError(e)) {
                    throw e;
                }
            }
            retry -= 1;
        }

        return states;
    }

    /**
     * Download file by the option provided.
     */
    async downloadFile(option: DownloadOption): Promise<void> {
        await ensureFile(option.destination);
        let errors: unknown[] = [];
        try {
            let fd = await open(option.destination, "w");
            await normalizeArray(option.url).reduce(async (memo, u) => memo.catch(async (e) => {
                if (e instanceof Task.CancelledError) { throw e; }
                try {
                    let parsedURL = parse(u);
                    if (parsedURL.protocol === "file:") {
                        await close(fd);
                        await copyFile(fileURLToPath(u), option.destination);
                    } else {
                        await this.downloads(fd, parsedURL, option);
                        await close(fd);
                    }
                } catch (err) {
                    errors.push(err);
                    throw err;
                }
            }), Promise.reject<void>());
        } catch (e) {
            errors.pop();
            e.errors = errors;
            await unlink(option.destination).catch(() => { });
            throw e;
        }
    }

    destroy() {
        this.agents.http?.destroy();
        this.agents.https?.destroy();
    }
}

/**
 * - If the file is not on the disk, it will return true.
 * - If the checksum is not provided, it will return true if file existed.
 * - If the checksum is provided, it will return true if the file checksum matched.
 */
async function shouldDownload(option: DownloadOption, downloaderOptions: DownloaderOptions): Promise<boolean> {
    if (downloaderOptions.overwriteWhen === "always") {
        return true;
    }
    let missed = await missing(option.destination);
    if (missed) {
        return true;
    }
    if (!option.checksum || option.checksum.hash.length === 0) {
        return downloaderOptions.overwriteWhen === "checksumNotMatchOrEmpty";
    }
    const hash = await checksum(option.destination, option.checksum.algorithm);
    return hash !== option.checksum.hash;
}

/**
 * Wrapped task function of download file if absent task
 */
export function downloadFileTask(option: DownloadOption, downloaderOptions: HasDownloader<DownloaderOptions>): Task.Function<void> {
    return async (context: Task.Context) => {
        option.handlers = context.setup;
        option.progress = (c, p, t, u) => context.update(p, t, u);
        if (await shouldDownload(option, downloaderOptions)) {
            await downloaderOptions.downloader.downloadFile(option);
        }
    };
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

function hasDownloader(options: DownloaderOptions): options is HasDownloader<DownloaderOptions> {
    return !!options.downloader;
}
export function resolveDownloader<O extends DownloaderOptions, T>(options: O, closure: (options: HasDownloader<O>) => Promise<T>) {
    if (hasDownloader(options)) {
        return closure(options);
    }
    let maxSockets = options.maxConcurrency ?? cpus().length * 4;
    let agentOptions: AgentOptions = {
        maxSockets,
        maxFreeSockets: 64,
        keepAlive: true,
    };
    let downloader = new HttpDownloader({
        http: new HttpAgent(agentOptions),
        https: new HttpsAgent(agentOptions),
    });
    return closure({
        ...options,
        downloader,
    }).finally(() => downloader.destroy());
}

export type HasDownloader<T> = T & { downloader: Downloader, dispose?: () => void }

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
    throwErrorImmediately = throwErrorImmediately ?? false;
    getErrorMessage = getErrorMessage ?? (() => "");

    let errors = [] as unknown[];
    context.update(0, sizes.reduce((a, b) => a + b, 0));
    await Promise.all(tasks.map((task, index) => context.execute(task, sizes[index]).catch((e) => {
        if (throwErrorImmediately || e instanceof Task.CancelledError) {
            throw e;
        } else {
            errors.push(e);
        }
    })));
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
 * The collection of errors happened during a parallel process
 */
export class MultipleError extends Error {
    constructor(public errors: unknown[], message?: string) { super(message); };
}

export function createErr<T>(error: T, message?: string): T & Error {
    let err = new Error(message);
    return Object.assign(err, error);
}

export function exists(target: string) {
    return access(target, constants.F_OK).then(() => true).catch(() => false);
}
export function missing(target: string) {
    return access(target, constants.F_OK).then(() => false).catch(() => true);
}
export async function ensureDir(target: string) {
    try {
        await mkdir(target);
    } catch (e) {
        if (await stat(target).then((s) => s.isDirectory()).catch((e) => false)) { return; }
        if (e.code === "EEXIST") { return; }
        if (e.code === "ENOENT") {
            if (dirname(target) === target) {
                throw e;
            }
            try {
                await ensureDir(dirname(target));
                await mkdir(target);
            } catch {
                if (await stat(target).then((s) => s.isDirectory()).catch((e) => false)) { return; }
                throw e;
            }
            return;
        }
        throw e;
    }
}
export function ensureFile(target: string) {
    return ensureDir(dirname(target));
}
export async function checksum(path: string, algorithm: string = "sha1"): Promise<string> {
    let hash = createHash(algorithm).setEncoding("hex");
    await pipeline(createReadStream(path), hash);
    return hash.read();
}
