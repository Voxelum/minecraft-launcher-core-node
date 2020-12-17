import { CancelledError, TaskLooped } from "@xmcl/task";
import { createWriteStream, WriteStream } from "fs";
import { Agent as HttpAgent, ClientRequest, IncomingMessage, request, RequestOptions } from "http";
import { Agent as HttpsAgent, request as requests } from "https";
import { cpus } from "os";
import { fileURLToPath, format, parse } from "url";
import { checksum, close, copyFile, ensureFile, missing, open, truncate, unlink } from "./utils";

/**
 * The http(s) agents object for requesting
 */
export interface Agents {
    http?: HttpAgent;
    https?: HttpsAgent;
}
export interface Timestamped {
    timestamp: string;
}

export class ChecksumNotMatchError extends Error {
    constructor(readonly algorithm: string, readonly expect: string, readonly actual: string, readonly file: string) {
        super(`File ${file} ${algorithm} checksum not match. Expect: ${expect}. Actual: ${actual}`);
    }
}

export function isValidProtocol(protocol: string | undefined | null): protocol is "http:" | "https:" {
    return protocol === "http:" || protocol === "https:";
}
/**
 * Join two urls
 */
export function joinUrl(a: string, b: string) {
    if (a.endsWith("/") && b.startsWith("/")) {
        return a + b.substring(1);
    }
    if (!a.endsWith("/") && !b.startsWith("/")) {
        return a + "/" + b;
    }
    return a + b;
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

export async function getAndParseIfUpdate<T extends Timestamped>(url: string, parser: (s: string) => any, lastObject: T | undefined): Promise<T> {
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

export interface Segment {
    start: number;
    end?: number;
}
export interface DownloadBaseOptions {
    /**
     * The header of the request
     */
    headers?: Record<string, any>;
    /**
     * The agent of the request
     */
    agents?: Agents;
    /**
     * The minimum bytes a segment should have.
     * @default 2MB
     */
    segmentThreshold?: number;
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
}

export interface DownloadSingleUrlOptions extends DownloadBaseOptions {
    destination: string;
    url: string;
    /**
    * The checksum info of the file
    */
    checksum?: { algorithm: string; hash: string; };
}

export interface DownloadMultiUrlOptions extends DownloadBaseOptions {
    destination: string;
    urls: string[];
    /**
    * The checksum info of the file
    */
    checksum?: { algorithm: string; hash: string; };
}

export interface DownloadFromPathOptions extends DownloadBaseOptions {
    destination: string;
    path: string;
    /**
    * The checksum info of the file
    */
    checksum?: { algorithm: string; hash: string; };
}

/**
 */
export interface DownloadCommonOptions extends DownloadBaseOptions {
    /**
     * Should throw the donwload process immediately after ANY resource download failed.
     */
    throwErrorImmediately?: boolean;
    /**
     * The suggested max concurrency of the download. This is not a strict criteria.
     *
     * This is used to generate the `agents` maxSocket.
     * If `agents` is assigned, this will be ignore.
     */
    maxSocket?: number;
    /**
  * The suggested max concurrency of the download. This is not a strict criteria.
  *
  * This is used to generate the `agents` maxFreeSocket.
  * If `agents` is assigned, this will be ignore.
  */
    maxFreeSocket?: number;
}
interface Connections {
    request: ClientRequest;
    response: IncomingMessage;
}
export class DownloadTask extends TaskLooped<Segment[]> {
    protected segments: Segment[] = [];
    protected outputs: WriteStream[] = [];
    protected connections: Connections[] = [];

    /**
     * The original request url
     */
    protected originalUrl: string;
    /**
    * The checksum info of the file
    */
    protected checksum?: { algorithm: string; hash: string; };
    /**
     * The header of the request
     */
    protected headers: Record<string, any>;
    /**
     * The agent of the request
     */
    protected agents: Agents;
    /**
     * The minimum bytes a segment should have.
     * @default 2MB
     */
    protected segmentThreshold: number;
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
    protected overwriteWhen?: "checksumNotMatchOrEmpty" | "checksumNotMatch" | "always";

    protected acceptRanges: boolean = false;
    protected contentLength: number = -1;
    protected lastModified?: string;
    protected eTag?: string;

    get url() {
        return this._from ?? "";
    }

    set url(url: string) {
        this._from = url;
    }

    get destination() {
        return this._to ?? "";
    }

    set destination(destination: string) {
        this._to = destination;
    }

    /**
     * current fd
     */
    protected fd: number = -1;

    constructor(options: DownloadSingleUrlOptions) {
        super();
        this.agents = options.agents ?? createAgents(options);
        this.headers = options.headers ?? {};
        this.checksum = options.checksum;
        this.segmentThreshold = options.segmentThreshold ?? 2 * 1024 * 1024;
        this.originalUrl = options.url;
        this._from = options.url;
        this._to = options.destination;
        this.overwriteWhen = options.overwriteWhen;
    }

    protected async updateMetadata() {
        const parsedUrl = parse(this.originalUrl);
        const { message, request } = await fetch({ ...parsedUrl, method: "GET", ...this.headers }, this.agents);

        message.resume();
        request.abort();

        const { headers, url: resultUrl, statusCode } = message;
        if (statusCode !== 200 && statusCode !== 201) {
            throw new Error(`HTTP Error: Status code ${statusCode} on ${resultUrl}`);
        }
        const url = resultUrl ?? this.originalUrl;
        const acceptRanges = headers["accept-ranges"] === "bytes";
        const contentLength = headers["content-length"] ? Number.parseInt(headers["content-length"]) : -1;
        const lastModified = headers["last-modified"];
        const eTag = headers.etag as string | undefined;

        let unmatched = eTag !== this.eTag;
        if (unmatched || eTag === undefined) {
            this.url = url;
            this.acceptRanges = acceptRanges;
            this.contentLength = contentLength;
            this.lastModified = lastModified;
            this.eTag = eTag;

            await truncate(this.fd, this.contentLength);
            await this.reset();
        }
    }
    protected async startSegmentDownload(seg: Segment, output: WriteStream) {
        if (seg.end && seg.start >= seg.end) {
            return [Promise.resolve(true)] as const;
        }
        const options: RequestOptions = {
            ...parse(this.url),
            method: "GET",
            headers: {
                ...this.headers,
                Range: `bytes=${seg.start}-${seg.end ?? ""}`,
            },
        };

        const { message: input, request } = await fetch(options, this.agents);
        input.on("data", (chunk) => {
            seg.start += chunk.length;
            this._progress += chunk.length;
            this.update(chunk.length);
        });
        input.pipe(output);

        const requestPromise = new Promise<boolean>((resolve, reject) => {
            request.on("error", reject);
            request.on("abort", () => resolve(false));
            input.on("end", () => resolve(true));
        });
        const outputFinishPromise = new Promise<void>((resolve, reject) => {
            output.on("error", reject);
            output.on("finish", () => resolve());
        });
        const done = Promise.all([requestPromise, outputFinishPromise]).then(([done]) => done);
        return [done, request, input] as const;
    }
    protected async download() {
        this._total = this.contentLength;
        const results = await Promise.all(this.segments.map(async (seg, index) => {
            const [done, req, res] = await this.startSegmentDownload(seg, this.outputs[index]);
            if (req && res) {
                this.connections[index] = { request: req, response: res };
            }
            return done;
        }));
        return results.every((r) => r);
    }
    protected computeSegmenets(total: number, chunkSize: number, concurrency: number) {
        const partSize = Math.max(chunkSize, Math.floor(total / concurrency));
        const segments: Segment[] = [];
        for (let cur = 0, chunkSize = 0; cur < total; cur += chunkSize) {
            const remain = total - cur;
            if (remain >= partSize) {
                chunkSize = partSize;
                segments.push({ start: cur, end: cur + chunkSize - 1 });
            } else {
                const last = segments[segments.length - 1];
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
    protected async shouldProcess() {
        if (this.overwriteWhen === "always") {
            return true;
        }
        const missed = await missing(this.destination);
        if (missed) {
            return true;
        }
        if (!this.checksum || this.checksum.hash.length === 0) {
            return this.overwriteWhen === "checksumNotMatchOrEmpty";
        }
        const hash = await checksum(this.destination, this.checksum.algorithm);
        return hash !== this.checksum.hash;
    }

    protected async process(): Promise<[boolean, Segment[]]> {
        if (!await this.shouldProcess()) {
            return [true, []];
        }
        if (this.fd === -1) {
            await ensureFile(this.destination);
            this.fd = await open(this.destination, "w");
        }
        try {
            await this.updateMetadata();
            const done = await this.download();
            if (done) {
                await close(this.fd).catch(() => { });
            }
            return [done, this.segments];
        } catch (e) {
            await close(this.fd).catch(() => { });
            await unlink(this.destination).catch(() => { });
            throw e;
        }
    }
    protected async abort() {
        const promise = Promise.all(this.connections.map((c) => new Promise((resolve) => {
            c.request.once("abort", () => resolve);
            c.response.unpipe();
            c.request.abort();
        })));
        this.connections = [];
        await promise;
    }
    protected shouldTolerant(e: any): boolean {
        return e.code === "ECONNRESET"
            || e.code === "ETIMEDOUT"
            || e.code === "EPROTO"
            || e.code === "ECANCELED"
            || e instanceof ChecksumNotMatchError;
    }
    protected async validate() {
        if (this.checksum) {
            const actual = await checksum(this.destination, this.checksum.algorithm)
            const expect = this.checksum.hash;
            if (actual !== expect) {
                throw new ChecksumNotMatchError(this.checksum.algorithm, this.checksum.hash, actual, this.destination);
            }
        }
    }
    protected async reset() {
        const contentLength = this.contentLength;
        this.segments = contentLength && this.acceptRanges
            ? this.computeSegmenets(contentLength, this.segmentThreshold, 4)
            : [{ start: 0, end: contentLength }];
        this.outputs = this.segments.map((seg) => createWriteStream(this.destination, {
            fd: this.fd,
            start: seg.start,
            autoClose: false,
        }));
        this._progress = 0;
    }
}

export class DownloadFallbackTask extends DownloadTask {
    protected urls: string[]

    constructor(options: DownloadMultiUrlOptions) {
        super({
            ...options,
            url: options.urls[0],
        });
        this.urls = options.urls;
    }

    async run() {
        const errors: unknown[] = [];
        try {
            let segments: Segment[] = [];
            await this.urls.reduce(async (memo, url) => memo.catch(async (e: unknown) => {
                if (e instanceof CancelledError) {
                    throw e;
                } else if (e) {
                    errors.push(e);
                }
                const parsedURL = parse(url);
                this.originalUrl = url;
                if (parsedURL.protocol === "file:") {
                    await copyFile(fileURLToPath(url), this.destination);
                } else {
                    segments = await super.run();
                }
            }), Promise.reject<void>());
            return segments;
        } catch (e) {
            await unlink(this.destination).catch(() => { });
            e.errors = errors;
            throw e;
        }
    }
}

export function createAgents(options: DownloadCommonOptions) {
    return {
        http: new HttpAgent({
            maxSockets: options.maxSocket ?? cpus().length * 4,
            maxFreeSockets: options.maxFreeSocket ?? 64,
            keepAlive: true,
        }),
        https: new HttpsAgent({
            maxSockets: options.maxSocket ?? cpus().length * 4,
            maxFreeSockets: options.maxFreeSocket ?? 64,
            keepAlive: true,
        })
    };
}

export async function withAgents<T extends DownloadCommonOptions, R>(options: T, scope: (options: T) => R) {
    if (!options.agents) {
        const agents = createAgents(options);
        try {
            const r = await scope({ ...options, agents });
            return r;
        } finally {
            agents.http.destroy();
            agents.https.destroy();
        }
    } else {
        return scope(options);
    }
}
