import { createHash, Hash } from "crypto";
import { createWriteStream, promises } from "fs";
import got = require("got");
import { basename, resolve } from "path";
import { finished } from "stream";
import { computeChecksum, exists } from "./common";

export interface UpdatedObject {
    timestamp: string;
}

export function getIfUpdate<T extends UpdatedObject = UpdatedObject>(url: string, parser: (s: string) => any, lastObj?: T): Promise<T> {
    const lastModified = lastObj ? lastObj.timestamp : undefined;
    return got(url, {
        encoding: "utf-8",
        headers: lastModified ? { "If-Modified-Since": lastModified } : undefined,
    }).then((resp) => {
        return resp.statusCode === 304 ? lastObj : {
            ...parser(resp.body),
            timestamp: resp.headers["last-modified"] as string,
        };
    }).catch((e) => lastObj);
}

export interface DownloadOption {
    url: string;
    destination: string;
    checksum?: {
        algorithm: string,
        hash: string,
    };
    retry?: number;
    method?: string;
    headers?: { [key: string]: string };
    timeout?: number;
    progress?: (written: number, total: number) => void;
}

export async function downloadIfAbsent(option: DownloadOption) {
    const onProgress = option.progress || (() => { });
    let onData: (chunk: any) => void = () => { };
    const checksum = option.checksum;
    const isDir = await promises.stat(option.destination).then((s) => s.isDirectory());

    async function isFileValid(file: string) {
        if (await exists(file)) {
            if (checksum) {
                const hash = await computeChecksum(file, checksum.algorithm);
                if (hash === checksum.hash) { return true; }
            } else {
                return true;
            }
        }
    }

    if (isDir) {
        let filePath: string = resolve(option.destination, "Unknown");
        const downstream = got.stream(option.url, {
            method: option.method,
            headers: option.headers,
            timeout: option.timeout,
            followRedirect: true,
            retry: option.retry,
        }).on("response", (resp) => {
            const filename = basename(resp.url as string);
            filePath = resolve(option.destination, filename);
            resp.pause();
            isFileValid(filePath).then((valid) => {
                if (valid) {
                    resp.destroy();
                    return;
                }
                downstream.pipe(createWriteStream(filePath));
                resp.resume();
            });
        }).on("data", onData).on("downloadProgress", (progress) => {
            onProgress(progress.transferred, progress.total || -1);
        });
        await finished.__promisify__(downstream);
        return filePath;
    } else {
        if (await isFileValid(option.destination)) {
            return option.destination;
        }
        let hasher: Hash | undefined;
        if (checksum) {
            hasher = createHash(checksum.algorithm);
            onData = (data) => { hasher!.update(data); };
        }
        await finished.__promisify__(got.stream(option.url, {
            method: option.method,
            headers: option.headers,
            timeout: option.timeout,
            followRedirect: true,
            retry: option.retry,
        }).on("data", onData).on("downloadProgress", (progress) => {
            onProgress(progress.transferred, progress.total || -1);
        }).pipe(createWriteStream(option.destination)));

        if (hasher && checksum) {
            const hash = hasher.digest("hex");
            if (hash !== checksum.hash) {
                throw new Error("File Corrupted!");
            }
        }
        return option.destination;
    }
}

export function createDownloadTask(option: Pick<DownloadOption, "url" | "checksum" | "method" | "headers" | "timeout">) {

}
