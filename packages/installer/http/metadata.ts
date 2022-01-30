import { Agents } from "./agents";
import { fetch, urlToRequestOptions } from "./utils"
import { AbortSignal } from "./abort";
import { URL } from "url";

export interface ResourceMetadata {
  url: URL
  isAcceptRanges: boolean
  contentLength: number
  lastModified: string | undefined
  eTag: string | undefined
}

export class FetchMetadataError extends Error {
    constructor(
    readonly error: "FetchResourceNotFound" | "BadResourceRequest" | "FetchResourceServerUnavaiable",
    readonly statusCode: number,
    readonly url: string,
    message: string,
    ) {
        super(message)
    }
}

export async function getMetadata(srcUrl: URL, _headers: Record<string, any>, agents: Agents, useGet: boolean = false, abortSignal?: AbortSignal): Promise<ResourceMetadata> {
    const { message, request } = await fetch({
        ...urlToRequestOptions(srcUrl),
        method: useGet ? "GET" : "HEAD",
        ..._headers,
    }, agents, abortSignal);

    message.resume();
    request.destroy();

    let { headers, url: resultUrl, statusCode } = message;
    if (statusCode === 405 && !useGet) {
        return getMetadata(srcUrl, _headers, agents, useGet, abortSignal);
    }
    statusCode = statusCode ?? 500;
    if (statusCode !== 200 && statusCode !== 201) {
        throw new FetchMetadataError(
            statusCode === 404 ? "FetchResourceNotFound"
                : statusCode >= 500 ? "FetchResourceServerUnavaiable"
                    : "BadResourceRequest",
            statusCode,
            resultUrl ?? srcUrl.toString(),
            `Fetch download metadata failed due to http error. Status code: ${statusCode} on ${resultUrl}`)
    }
    const url = resultUrl ? new URL(resultUrl) : srcUrl;
    const isAcceptRanges = headers["accept-ranges"] === "bytes";
    const contentLength = headers["content-length"] ? Number.parseInt(headers["content-length"]) : -1;
    const lastModified = headers["last-modified"] ?? undefined;
    const eTag = headers.etag ;

    return {
        url,
        isAcceptRanges,
        contentLength,
        lastModified,
        eTag,
    }
}
