import { createHash, Hash } from "crypto";
import { createWriteStream, promises } from "fs";
import * as gotDefault from "got";
import { basename, resolve } from "path";
import Task from "treelike-task";
import { computeChecksum, ensureFile, exists } from "./common";

const IS_ELECTRON = process.versions.hasOwnProperty("electron");

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
    await ensureFile(option.destination);
    const isDir = await promises.stat(option.destination).then((s) => s.isDirectory(), (_) => false);

    async function isFileValid(file: string) {
        if (checksum !== undefined) {
            return await exists(file) && checksum.hash === await computeChecksum(file, checksum.algorithm);
        } else {
            return false;
        }
    }

    if (isDir) {
        const tempFilePath: string = resolve(option.destination, decodeURI(basename(option.url)));
        let realFilePath = tempFilePath;
        let valid: boolean = false;
        await new Promise((resolv, reject) => {
            const downstream = got.stream(option.url, {
                method: option.method,
                headers: option.headers,
                timeout: option.timeout,
                followRedirect: true,
                retry: option.retry,
            }).on("response", (resp) => {
                realFilePath = resolve(option.destination, decodeURI(basename(resp.url as string)));
                isFileValid(realFilePath).then((v) => {
                    valid = v;
                    if (v) {
                        resp.destroy();
                        downstream.close();
                        return;
                    }
                });
            }).on("downloadProgress", (progress) => {
                onProgress(progress.transferred, progress.total || -1);
            }).pipe(createWriteStream(tempFilePath))
                .on("close", () => resolv())
                .on("error", reject);
        });
        if (valid) {
            await promises.unlink(tempFilePath);
        } else {
            await promises.rename(tempFilePath, realFilePath);
            if (!isFileValid(realFilePath) && checksum !== undefined) {
                throw new Error(`Correpted download! The chunksum mismatched! Expected: ${checksum.hash}.`);
            }
        }
        return realFilePath;
    } else {
        if (await isFileValid(option.destination)) {
            return option.destination;
        }
        let hasher: Hash | undefined;
        if (checksum) {
            hasher = createHash(checksum.algorithm);
            onData = (data) => { hasher!.update(data); };
        }
        await new Promise((resolv, rej) => {
            got.stream(option.url, {
                method: option.method,
                headers: option.headers,
                timeout: option.timeout,
                followRedirect: true,
                retry: option.retry,
            }).on("error", (error) => {
                console.error(`Unable to download ${option.url}.`);
                rej(error);
            }).on("data", onData).on("downloadProgress", (progress) => {
                onProgress(progress.transferred, progress.total || -1);
            }).pipe(createWriteStream(option.destination))
                .on("close", () => resolv());
        });

        if (hasher && checksum) {
            const hash = hasher.digest("hex");
            if (hash !== checksum.hash) {
                throw new Error("File Corrupted!");
            }
        }
        return option.destination;
    }
}

export function createDownloadWork(url: string, destination: string, option: Pick<DownloadOption, "checksum" | "method" | "headers" | "timeout" | "retry"> = {}): Task.Work<string> {
    return (context) => downloadIfAbsent({ url, destination, ...option, progress: context.update });
}
