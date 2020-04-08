import { FileSystem } from "./system";
import JSZip from "jszip";

class JSZipFS extends FileSystem {
    sep: string = "/";
    type: "zip" | "path" = "zip";
    writeable: boolean = true;
    root: string = "";
    join(...paths: string[]): string {
        return paths.join("/");
    }
    isDirectory(name: string): Promise<boolean> {
        if (name === "" || name === "/") { return Promise.resolve(true); }
        name = name.startsWith("/") ? name.substring(1) : name;
        name = name.endsWith("/") ? name : name + "/";
        return Promise.resolve(Object.keys(this.zip.files).some((e) => e.startsWith(name)))
    }
    async writeFile(name: string, data: Uint8Array): Promise<void> {
        this.zip.file(name, data);
    }
    existsFile(name: string): Promise<boolean> {
        if (this.zip.files[name] !== undefined) { return Promise.resolve(true); }
        return this.isDirectory(name);
    }
    readFile(name: any, encoding?: any): Promise<any> {
        if (!encoding) {
            return this.zip.files[name].async("uint8array");
        }
        if (encoding === "utf-8") {
            return this.zip.files[name].async("text");
        }
        if (encoding === "base64") {
            return this.zip.files[name].async("base64");
        }
        throw new TypeError(`Expect encoding to be utf-8/base64 or empty. Got ${encoding}.`);
    }
    async listFiles(name: string): Promise<string[]> {
        if (!await this.isDirectory(name)) { return Promise.reject("Require a directory!"); }
        name = name.startsWith("/") ? name.substring(1) : name;
        return Promise.resolve(Object.keys(this.zip.files)
            .filter((e) => e.startsWith(name))
            .map((e) => e.substring(name.length))
            .map((e) => e.startsWith("/") ? e.substring(1) : e)
            .map((e) => e.split("/")[0]))
    }

    constructor(private zip: JSZip) { super(); }
}

export async function openFileSystem(basePath: string | Uint8Array): Promise<FileSystem> {
    if (typeof basePath === "string") { throw new Error("Unsupported"); }
    return new JSZipFS(await JSZip.loadAsync(basePath));
}
export function resolveFileSystem(base: string | Uint8Array | FileSystem): Promise<FileSystem> {
    if (typeof base === "string" || base instanceof Uint8Array) {
        return openFileSystem(base);
    } else {
        return Promise.resolve(base);
    }
}

export * from "./system";
