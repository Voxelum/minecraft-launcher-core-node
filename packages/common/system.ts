export interface System {
    fs: FileSystem;
    openFileSystem(basePath: string | Uint8Array): Promise<FileSystem>;

    md5(data: Uint8Array): Promise<string>;
    sha1(data: Uint8Array): Promise<string>;

    decodeBase64(input: string): string;
    encodeBase64(input: string): string;

    bufferToText(buff: Uint8Array): string;
    bufferToBase64(buff: Uint8Array): string;

    basename(path: string): string;

    eol: string;
}

export abstract class FileSystem {
    abstract readonly root: string;
    abstract readonly sep: string;
    abstract readonly type: "zip" | "path";
    abstract readonly writeable: boolean;

    // base methods

    abstract join(...paths: string[]): string;

    abstract isDirectory(name: string): Promise<boolean>;
    abstract existsFile(name: string): Promise<boolean>;
    abstract readFile(name: string, encoding: "utf-8" | "base64"): Promise<string>;
    abstract readFile(name: string): Promise<Uint8Array>;
    abstract readFile(name: string, encoding?: "utf-8" | "base64"): Promise<Uint8Array | string>;

    abstract listFiles(name: string): Promise<string[]>;

    // extension methods

    async missingFile(name: string) {
        return this.existsFile(name).then((v) => !v);
    }

    async walkFiles(target: string, walker: (path: string) => void | Promise<void>) {
        if (await this.isDirectory(target)) {
            const childs = await this.listFiles(target);
            for (const child of childs) {
                await this.walkFiles(this.join(target, child), walker);
            }
        } else {
            const result = walker(this.join(target));
            if (result instanceof Promise) {
                await result;
            }
        }
    }

}

export let System: System;

export function setSystem(sys: System) {
    System = sys;
}

