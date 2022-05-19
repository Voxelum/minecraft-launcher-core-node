import { O_CREAT, O_RDWR } from "constants";
import { createWriteStream, fdatasync, fstat } from "fs";
import { RequestOptions } from "http";
import { fileURLToPath, URL } from "url";
import { promisify } from "util";
import { close, copyFile, ensureFile, exists, open, pipeline, truncate, unlink } from "../utils";
import { AbortError, AbortSignal, resolveAbortSignal } from "./abort";
import { Agents, CreateAgentsOptions, resolveAgents } from "./agents";
import { DownloadError, resolveNetworkErrorType } from "./error";
import { getMetadata, ResourceMetadata } from "./metadata";
import { DefaultRetryHandlerOptions, resolveRetryHandler, RetryHandler } from "./retry";
import { DefaultSegmentPolicyOptions, resolveSegmentPolicy, Segment, SegmentPolicy } from "./segment";
import { resolveStatusController, StatusController } from "./status";
import { fetch, urlToRequestOptions } from "./utils";
import { ChecksumValidatorOptions, resolveValidator, ValidationError, Validator } from "./validator";

// @ts-ignore
const pfstat = promisify(fstat)
const pfdatasync = promisify(fdatasync)

export interface DownloadBaseOptions {
    /**
     * The agent of the request
     */
    agents?: Agents | CreateAgentsOptions;
    /**
     * The divide segment options
     */
    segmentPolicy?: SegmentPolicy | DefaultSegmentPolicyOptions;
    /**
     * The retry handler
     */
    retryHandler?: RetryHandler | DefaultRetryHandlerOptions;
    /**
     * The header of the request
     */
    headers?: Record<string, any>;
}

export interface DownloadOptions extends DownloadBaseOptions {
    /**
     * The url or urls (fallback) of the resource
     */
    url: string | string[];
    /**
     * The header of the request
     */
    headers?: Record<string, any>;
    /**
     * If the download is aborted, and want to recover, you can use this option to recover the download
     */
    segments?: Segment[];
    /**
     * If the download is aborted, and want to recover, you can use this option to recover the download
     */
    metadata?: ResourceMetadata;
    /**
     * Where the file will be downloaded to
     */
    destination: string;
    /**
     * The status controller. If you want to track download progress, you should use this.
     */
    statusController?: StatusController;
    /**
     * The validator, or the options to create a validator based on checksum.
     */
    validator?: Validator | ChecksumValidatorOptions;
}

/**
 * Download url or urls to a file path. This process is abortable, it's compatible with the dom like `AbortSignal`.
 */
export function download(options: DownloadOptions) {
    const worker = createDownload(options);
    return worker.start();
}

export function createDownload(options: DownloadOptions) {
    return new Download(
        typeof options.url === "string" ? [options.url] : options.url,
        options.headers ?? {},
        resolveAgents(options.agents),
        options.destination,
        options.segments,
        options.metadata,
        resolveSegmentPolicy(options.segmentPolicy),
        resolveStatusController(options.statusController),
        resolveRetryHandler(options.retryHandler),
        resolveValidator(options.validator),
    );
}

export class Download {
    /**
     * current fd
     */
    protected fd: number = -1;

    constructor(
        /**
         * The original request url with fallback
         */
        readonly urls: string[],
        /**
         * The headers of the request
         */
        readonly headers: Record<string, any>,
        /**
         * The agent of the request
         */
        readonly agents: Agents,
        /**
         * Where the file download to
         */
        readonly destination: string,
        /**
        * The current download status
        */
        protected segments: Segment[] = [],
        /**
         * The cached resource metadata
         */
        protected metadata: ResourceMetadata | undefined,
        protected segmentPolicy: SegmentPolicy,
        protected statusController: StatusController,
        protected retryHandler: RetryHandler,
        protected validator: Validator,
    ) { }

    protected async updateMetadata(url: URL, abortSignal: AbortSignal) {
        const metadata = await getMetadata(url, this.headers, this.agents, false, abortSignal);
        if (!metadata || metadata.eTag != this.metadata?.eTag || metadata.eTag === undefined || metadata.contentLength !== this.metadata?.contentLength) {
            this.metadata = metadata;
            const contentLength = metadata.contentLength;
            this.segments = contentLength && metadata.isAcceptRanges
                ? this.segmentPolicy.computeSegments(contentLength)
                : [{ start: 0, end: contentLength }];
            this.statusController.reset(0, metadata.contentLength);
            await truncate(this.fd, metadata.contentLength);
        } else {
            this.statusController.reset(this.segments.reduce((a, b) => a + (b.end - b.start), 0), metadata.contentLength);
        }
        return this.metadata
    }

    protected async processDownload(url: string, metadata: ResourceMetadata, abortSignal: AbortSignal): Promise<void> {
        let flag = 0;
        const abortHandlers: Array<() => void> = [];
        const errors: any[] = []
        await Promise.all(this.segments.map(async (segment, index) => {
            if (segment.start > segment.end) {
                // the segment is finished, just ignore it
                return;
            }
            const options: RequestOptions = {
                ...urlToRequestOptions(metadata.url),
                method: "GET",
                headers: {
                    ...this.headers,
                    Range: `bytes=${segment.start}-${(segment.end) ?? ""}`,
                },
            };
            try {
                if (abortSignal.aborted || flag) { throw new AbortError(); }
                const { message: response, request } = await fetch(options, this.agents, abortSignal);
                if (abortSignal.aborted || flag) {
                    // ensure we correctly release the message
                    response.resume();
                    throw new AbortError();
                }
                const fileStream = createWriteStream(this.destination, {
                    fd: this.fd,
                    start: segment.start,
                    // we should not close the file stream, as it will close the fd as the same time!
                    autoClose: false,
                });
                // track the progress
                response.on("data", (chunk) => {
                    segment.start += chunk.length;
                    this.statusController.onProgress(url, chunk.length, this.statusController.progress + chunk.length);
                });
                // create abort handler
                const abortHandler = () => {
                    request.destroy(new AbortError());
                    response.unpipe();
                }
                abortHandlers.push(abortHandler)
                // add abort handler to abort signal
                abortSignal.addEventListener("abort", abortHandler);
                await pipeline(response, fileStream);
                abortSignal.removeEventListener("abort", abortHandler);
            } catch (e) {
                if (e instanceof AbortError || (e as any).message === "aborted") {
                    // user abort the operation, or abort by other sibling error
                    if (flag === 0) { flag = 1; }
                } else {
                    // true error thrown.
                    flag = 2;
                    // all other sibling requests should be aborted
                    abortHandlers.forEach((f) => f());
                    errors.push(e);
                }
            }
        }))
        // use local aborted flag instead of signal.aborted
        // as local aborted flag means the request is TRULY aborted
        if (flag) {
            throw new DownloadError(flag === 1 ? "DownloadAborted" : resolveNetworkErrorType(errors[0]) ?? "GeneralDownloadException",
                this.metadata,
                this.headers,
                this.destination,
                1,
                this.segments,
                errors,
            );
        }
    }

    protected async downloadUrl(url: string, abortSignal: AbortSignal) {
        let attempt = 0;
        const parsedUrl = new URL(url);
        if (parsedUrl.protocol === "file:") {
            const filePath = fileURLToPath(url);
            if (await exists(filePath)) {
                // properly handle the file protocol. we just copy the file
                // lucky, opening file won't affect file copy 😀
                await copyFile(fileURLToPath(url), this.destination);
                return;
            }
        }
        while (true) {
            try {
                attempt += 1;
                const metadata = await this.updateMetadata(parsedUrl, abortSignal);
                await this.processDownload(url, metadata, abortSignal);
                return;
            } catch (e) {
                // user abort should throw anyway
                if (e instanceof DownloadError && e.error === "DownloadAborted") {
                    throw e;
                }
                // some common error we want to retry
                if (await this.retryHandler.retry(url, attempt, e)) {
                    continue;
                }

                const networkError = resolveNetworkErrorType(e);
                if (networkError) {
                    throw new DownloadError(networkError,
                        this.metadata,
                        this.headers,
                        this.destination,
                        attempt,
                        this.segments,
                        [e],
                    );
                }

                throw e;
            }
        }
    }

    /**
     * Start to download
     */
    async start(abortSignal: AbortSignal = resolveAbortSignal()) {
        try {
            if (this.fd === -1) {
                await ensureFile(this.destination);
                // use O_RDWR for read write which won't be truncated
                this.fd = await open(this.destination, O_RDWR | O_CREAT);
            }

            // prevalidate the file
            const size = (await pfstat(this.fd)).size
            if (size !== 0) {
                const error = await this.validator.validate(this.fd, this.destination, this.urls[0]).catch((e) => e);
                // if the file size is not 0 and checksum matched, we just don't process the file
                if (!error) {
                    return;
                }
            }

            let succeed = false
            const aggregatedErrors: any[] = [];
            for (const url of this.urls) {
                try {
                    await this.downloadUrl(url, abortSignal);
                    await pfdatasync(this.fd);
                    await this.validator.validate(this.fd, this.destination, url)
                    succeed = true
                    break;
                } catch (e) {
                    if (e instanceof DownloadError && e.error === "DownloadAborted") {
                        throw e;
                    }
                    aggregatedErrors.push(e)
                }
            }
            if (!succeed && aggregatedErrors.length > 0) {
                throw aggregatedErrors;
            }
        } catch (e) {
            const errs: any[] = e instanceof Array ? e : [e]

            const lastError = errs[0];
            if (!(lastError instanceof DownloadError) && !(lastError instanceof ValidationError)) {
                await unlink(this.destination).catch(() => { });
            }

            throw e;
        } finally {
            if (this.fd !== -1) { await close(this.fd).catch(() => { }); }
            this.fd = -1;
        }
    }
}
