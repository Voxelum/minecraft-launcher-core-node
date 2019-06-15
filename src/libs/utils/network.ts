import { createReadStream, createWriteStream, promises } from "fs";
import * as gotDefault from "got";
import { basename, resolve as pathResolve } from "path";
import Task from "treelike-task";
import { fileURLToPath, parse } from "url";
import { ensureFile, validate } from "./common";

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
    }).catch((e) => {
        if (lastObj) { return lastObj; }
        throw e;
    });
}

export interface DownloadOption {
    url: string;
    retry?: number;
    method?: string;
    headers?: { [key: string]: string };
    timeout?: number;
    progress?: (written: number, total: number) => void;
}

export interface DownloadToOption extends DownloadOption {
    destination: string;
}

export interface DownloadAndCheckOption extends DownloadOption {
    checksum: {
        algorithm: string,
        hash: string,
    };
}

export function openDownloadStream(option: DownloadOption) {
    const onProgress = option.progress || (() => { });
    return got.stream(option.url, {
        method: option.method,
        headers: option.headers,
        timeout: option.timeout,
        followRedirect: true,
        retry: option.retry,
    }).on("error", () => {
        console.error(`Unable to download ${option.url}`);
    }).on("downloadProgress", (progress) => {
        onProgress(progress.transferred, progress.total || -1);
    });
}

export async function downloadBuffer(option: DownloadOption) {
    return fetchBuffer(option.url, {
        method: option.method,
        headers: option.headers,
        timeout: option.timeout,
        followRedirect: true,
        retry: option.retry,
    }).then((r) => r.body);
}

export async function downloadFile(option: DownloadToOption) {
    await ensureFile(option.destination);
    const url = parse(option.url);
    if (url.protocol === "file:") {
        return new Promise<string>((resolve, reject) => {
            createReadStream(fileURLToPath(option.url))
                .pipe(createWriteStream(option.destination))
                .on("close", () => resolve(option.destination));
        });
    }
    return new Promise<string>((resolve, reject) => {
        openDownloadStream(option)
            .on("error", reject)
            .pipe(createWriteStream(option.destination))
            .on("error", reject)
            .on("close", () => resolve(option.destination));
    });
}

export async function downloadFileIfAbsent(option: DownloadAndCheckOption & DownloadToOption) {
    if (await validate(option.destination, option.checksum.hash, option.checksum.algorithm)) {
        return option.destination;
    }
    return downloadFile(option);
}

function wrapToWork<T, O extends DownloadOption>(f: (option: O) => Promise<T>): (option: O) => (ctx: Task.Context) => Promise<T> {
    return (o) => (ctx) => f({
        ...o,
        progress: (p, t) => { ctx.update(p, t, o.url); },
    });
}

export const downloadFileWork = wrapToWork(downloadFile);
export const downloadFileIfAbsentWork = wrapToWork(downloadFileIfAbsent);

export async function downloadToFolder(option: DownloadToOption) {
    const isDir = await promises.stat(option.destination).then((s) => s.isDirectory(), (_) => false);
    if (!isDir) { throw new Error("Require destination is a directory!"); }
    const tempFilePath: string = pathResolve(option.destination, decodeURI(basename(option.url)));
    let realFilePath = tempFilePath;
    await new Promise((resolve, reject) => {
        openDownloadStream(option)
            .on("response", (resp) => {
                realFilePath = pathResolve(option.destination, decodeURI(basename(resp.url as string)));
            })
            .pipe(createWriteStream(tempFilePath))
            .on("close", () => resolve())
            .on("error", reject);
    });
    if (realFilePath !== tempFilePath) {
        await promises.rename(tempFilePath, realFilePath);
    }
    return realFilePath;
}

