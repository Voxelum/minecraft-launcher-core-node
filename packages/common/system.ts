import { Platform } from "./platform";

export interface System extends Platform {
    fs: FileSystem;
    openFileSystem(basePath: string | Uint8Array): Promise<FileSystem>;

    md5(data: Uint8Array): Promise<string>;
    sha1(data: Uint8Array): Promise<string>;

    decodeBase64(input: string): string;
    encodeBase64(input: string): string;

    openSocket?(): null;

    basename(path: string): string;
    /**
     * Just like `path.join`
     */
    join(...paths: string[]): string;

    eol: string;
}

export abstract class FileSystem {
    abstract readonly root: string;

    // base methods

    abstract isDirectory(name: string): Promise<boolean>;
    abstract writeFile(name: string, data: Uint8Array): Promise<void>;
    abstract existsFile(name: string): Promise<boolean>;
    abstract readFile(name: string, encoding: "utf-8" | "base64"): Promise<string>;
    abstract readFile(name: string): Promise<Uint8Array>;
    abstract readFile(name: string, encoding?: "utf-8" | "base64"): Promise<Uint8Array | string>;

    abstract listFiles(name: string): Promise<string[]>;

    // extension methods

    async walkFiles(startingDir: string, walker: (path: string) => void | Promise<void>) {
        const childs = await this.listFiles(startingDir);
        for (const child of childs) {
            if (this.isDirectory(child)) {
                await this.walkFiles(System.join(startingDir, child), walker);
            } else {
                const result = walker(System.join(startingDir, child));
                if (result instanceof Promise) {
                    await result;
                }
            }
        }
    }

    async validateSha1(name: string, hash: string) {
        if (!await this.existsFile(name)) {
            return false;
        }
        const sha1 = await System.sha1(await this.readFile(name));
        return sha1 === hash;
    }
}

export let System: System;

export function setSystem(sys: System) {
    System = sys;
}

