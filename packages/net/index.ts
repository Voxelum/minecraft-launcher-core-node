import Task from "@xmcl/task";
import { vfs } from "@xmcl/util";
import * as gotDefault from "got";
import { IncomingMessage, RequestOptions } from "http";
import { basename, resolve as pathResolve } from "path";
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
    url: string;
    retry?: number;
    method?: string;
    headers?: { [key: string]: string };
    timeout?: number;
    progress?: (written: number, total: number) => boolean | void;
    pausable?: (pauseFunc: () => void, resumeFunc: () => void) => void;
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


export interface HttpDownloadService<T extends HttpDownloadService.Option> {
    download(options: T): Promise<string>;
}

export namespace HttpDownloadService {
    export interface Option extends RequestOptions {
        directory: string;
        name?: string;
        checksums?: { [algorithm: string]: string };
    }
}

export function openDownloadStream(option: DownloadOption) {
    const onProgress = option.progress || (() => { });
    let response: IncomingMessage;
    const stream = got.stream(option.url, {
        method: option.method,
        headers: option.headers,
        timeout: option.timeout,
        followRedirect: true,
        retry: option.retry,
    }).on("response", (resp) => {
        response = resp;
    }).on("error", (e) => {
        console.error(`Unable to download ${option.url}`);
        console.error(e);
    }).on("downloadProgress", (progress) => {
        if (onProgress(progress.transferred, progress.total || -1)) {
            response.destroy();
        }
    });
    if (option.pausable) {
        option.pausable(stream.pause, stream.resume);
    }
    return stream;
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
    await vfs.ensureFile(option.destination);
    const url = parse(option.url);
    if (url.protocol === "file:") {
        return new Promise<string>((resolve, reject) => {
            vfs.createReadStream(fileURLToPath(option.url))
                .pipe(vfs.createWriteStream(option.destination))
                .on("close", () => resolve(option.destination));
        });
    }
    return new Promise<string>((resolve, reject) => {
        openDownloadStream(option)
            .on("error", reject)
            .pipe(vfs.createWriteStream(option.destination))
            .on("error", reject)
            .on("close", () => resolve(option.destination));
    });
}

export async function downloadFileIfAbsent(option: DownloadAndCheckOption & DownloadToOption) {
    if (await vfs.validate(option.destination, option.checksum)) {
        return option.destination;
    }
    return downloadFile(option);
}

export function downloadFileWork(option: DownloadToOption) {
    return async (context: Task.Context) => {
        let pf: (() => void) | undefined;
        let rf: () => void;
        option.pausable = (pFunc, rFunc) => {
            context.task.on("pause", pf = pFunc);
            context.task.on("resume", rf = rFunc);
        };
        option.progress = (p, t) => context.update(p, t, option.url);
        await downloadFile(option);
        if (pf) {
            context.task.removeListener("pause", pf);
            context.task.removeListener("resmue", rf!);
        }
    };
}

export function downloadFileIfAbsentWork(option: DownloadAndCheckOption & DownloadToOption) {
    return async (context: Task.Context) => {
        let pf: (() => void) | undefined;
        let rf: () => void;
        option.pausable = (pFunc, rFunc) => {
            context.task.on("pause", pf = pFunc);
            context.task.on("resume", rf = rFunc);
        };
        option.progress = (p, t) => context.update(p, t, option.url);
        await downloadFileIfAbsent(option);
        if (pf) {
            context.task.removeListener("pause", pf);
            context.task.removeListener("resmue", rf!);
        }
    };
}

export async function downloadToFolder(option: DownloadToOption) {
    const isDir = await vfs.stat(option.destination).then((s) => s.isDirectory(), (_) => false);
    if (!isDir) { throw new Error("Require destination is a directory!"); }
    const tempFilePath: string = pathResolve(option.destination, decodeURI(basename(option.url)));
    let realFilePath = tempFilePath;
    await new Promise((resolve, reject) => {
        openDownloadStream(option)
            .on("response", (resp) => {
                realFilePath = pathResolve(option.destination, decodeURI(basename(resp.url as string)));
            })
            .pipe(vfs.createWriteStream(tempFilePath))
            .on("close", () => resolve())
            .on("error", reject);
    });
    if (realFilePath !== tempFilePath) {
        await vfs.rename(tempFilePath, realFilePath);
    }
    return realFilePath;
}
