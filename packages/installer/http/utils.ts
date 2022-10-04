import { createHash } from "crypto";
import { createReadStream } from "fs";
import { RequestOptions } from "http";
import { pipeline } from 'stream/promises';
import { URL } from "url";

export function isValidProtocol(protocol: string | undefined | null): protocol is "http:" | "https:" {
    return protocol === "http:" || protocol === "https:";
}

export function urlToRequestOptions(url: URL): RequestOptions {
    return {
        host: url.host,
        hostname: url.hostname,
        protocol: url.protocol,
        port: url.port,
        path: url.pathname + url.search,
    }
}

export function format(url: RequestOptions) {
    return `${url.protocol}//${url.host}${url.path}`
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

export async function checksumFromFd(fd: number, destination: string, algorithm: string) {
    let hash = createHash(algorithm).setEncoding("hex");
    await pipeline(createReadStream(destination, { fd, autoClose: false }), hash);
    return hash.read();
}
