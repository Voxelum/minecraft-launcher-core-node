import Task from "treelike-task";

let defaultDownloadService: DownloadService;
export namespace DownloadService {
    export function get() {
        return defaultDownloadService;
    }

    export function set(service: DownloadService) {
        defaultDownloadService = service;
    }
    export interface Option {
        url: string;
        checksum?: {
            algorithm: string,
            hash: string,
        };
        method?: string;
        headers?: { [key: string]: string };
        timeout?: number;
        progress?: (written: number, total: number) => void;
    }

    export type Cache = { timestamp: string } | { eTag: string } | { timestamp: string, eTag: string };
    export type CacheWithValue = Cache & { value: Buffer };

    export interface CacheOption extends Option {
        cache: Cache;
    }

    export function flatOption(option: DownloadService.Option | string) {
        return typeof option === "string" ? { url: option } : option;
    }
}

export declare namespace DownloadService {
    function download(option: DownloadService.Option & { cache: { timestamp: string } }): Promise<{ timestamp: string, value?: Buffer }>;
    function download(option: DownloadService.Option & { cache: { eTag: string } }): Promise<{ eTag: string, value: Buffer }>;

    function download(option: DownloadService.CacheOption): Promise<CacheWithValue>;
    function download(option: DownloadService.CacheOption, destination: string): Promise<Cache>;

    function download(option: DownloadService.Option | string): Promise<Buffer>;
    function download(option: DownloadService.Option | string, destination: string): Promise<void>;

    function downloadTask(option: DownloadService.CacheOption): (context: Task.Context) => Promise<CacheWithValue>;
    function downloadTask(option: DownloadService.CacheOption, destination: string): (context: Task.Context) => Promise<Cache>;

    function downloadTask(option: DownloadService.Option | string): (context: Task.Context) => Promise<Buffer>;
    function downloadTask(option: DownloadService.Option | string, destination: string): (context: Task.Context) => Promise<void>;
}

DownloadService.download = function (option: DownloadService.Option | string, destination?: string) {
    return defaultDownloadService.download(option, destination as string);
} as any;

DownloadService.downloadTask = function (option: DownloadService.Option | string, destination?: string) {
    return (context: Task.Context) => {
        const realOption = DownloadService.flatOption(option);
        if (typeof realOption.progress !== "function") {
            realOption.progress = context.update;
        } else {
            const external = realOption.progress;
            realOption.progress = (prog, total) => {
                external(prog, total);
                context.update(prog, total);
            };
        }
        return defaultDownloadService.download(option, destination as string);
    };
} as any;

export interface DownloadService {
    download(option: DownloadService.Option | DownloadService.CacheOption | string): Promise<Buffer | DownloadService.CacheWithValue>;
    download(option: DownloadService.Option | DownloadService.CacheOption | string, destination: string): Promise<undefined | DownloadService.Cache>;
}

