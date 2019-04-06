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

    export function flatOption(option: DownloadService.Option | string) {
        return typeof option === "string" ? { url: option } : option;
    }
}

export declare namespace DownloadService {
    function download(option: DownloadService.Option | string): Promise<Buffer>;
    function download(option: DownloadService.Option | string, destination: string): Promise<void>;

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
        defaultDownloadService.download(option, destination as string);
    };
} as any;

export interface DownloadService {
    download(option: DownloadService.Option | string): Promise<Buffer>;
    download(option: DownloadService.Option | string, destination: string): Promise<void>;
}

