export interface System {
    fs: FileSystem;
    openFileSystem(basePath: string | Uint8Array): Promise<FileSystem>;

    md5(data: Uint8Array): Promise<string>;
    sha1(data: Uint8Array): Promise<string>;

    decodeBase64(input: string): string;
    encodeBase64(input: string): string;

    basename(path: string): string;
    /**
     * Just like `path.join`
     */
    join(...paths: string[]): string;

    eol: string;
}

export abstract class FileSystem {
    abstract readonly root: string;
    abstract readonly writeable: boolean;

    // base methods

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

    async close(): Promise<void> { }
}

export let System: System;

export function setSystem(sys: System) {
    System = sys;
}

