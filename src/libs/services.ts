import Task from "treelike-task";

export namespace DownloadService {
    let defaultDownloadService: DownloadService;

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
}

export interface DownloadService {
    download(option: DownloadService.Option | string): Promise<Buffer>;
    download(option: DownloadService.Option | string, destination: string): Promise<void>;
}

