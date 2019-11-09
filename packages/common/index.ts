import { Unzip } from "@xmcl/unzip";
import { createHash } from "crypto";
import { promises } from "fs";
import { EOL } from "os";
import { basename, join } from "path";
import { FileSystem, setSystem, System } from "./system";

export * from "./system";

class DefaultFS extends FileSystem {
    readonly writeable = true;
    isDirectory(name: string): Promise<boolean> {
        return promises.stat(join(this.root, name)).then((s) => s.isDirectory());
    }
    writeFile(name: string, data: Uint8Array): Promise<void> {
        return promises.writeFile(join(this.root, name), data);
    }
    existsFile(name: string): Promise<boolean> {
        return promises.stat(join(this.root, name)).then(() => true, () => false);
    }
    readFile(name: any, encoding?: any) {
        return promises.readFile(join(this.root, name), { encoding }) as any;
    }
    listFiles(name: string): Promise<string[]> {
        return promises.readdir(join(this.root, name));
    }
    constructor(readonly root: string) { super(); }
}
class ZipFS extends FileSystem {
    writeable = false;
    isDirectory(name: string): Promise<boolean> {
        return Promise.resolve(Object.keys(this.zip.entries).some((k) => k.startsWith(name)));
    }
    existsFile(name: string): Promise<boolean> {
        if (this.zip.entries[name]) { return Promise.resolve(true); }
        return this.isDirectory(name);
    }
    async readFile(name: string, encoding?: "utf-8" | "base64"): Promise<any> {
        const entry = this.zip.entries[name];
        if (!entry) { throw new Error(`Not found file named ${name}`); }
        const buffer = await this.zip.readEntry(entry);
        if (encoding === "utf-8") {
            return buffer.toString("utf-8");
        }
        if (encoding === "base64") {
            return buffer.toString("base64");
        }
        return buffer;
    }
    listFiles(name: string): Promise<string[]> {
        return promises.readdir(join(this.root, name));
    }
    constructor(readonly root: string, private zip: Unzip.CachedZipFile) { super(); }
}
class NodeSystem implements System {
    fs: FileSystem = new DefaultFS("/");
    async openFileSystem<T>(basePath: string | Uint8Array): Promise<FileSystem> {
        if (typeof basePath === "string") {
            const stat = await promises.stat(basePath);
            if (stat.isDirectory()) {
                return new DefaultFS(basePath) as any;
            } else {
                const zip = await Unzip.open(basePath, { lazyEntries: false });
                return new ZipFS(basePath, zip) as any;
            }
        } else {
            const zip = await Unzip.open(basePath as Buffer, { lazyEntries: false });
            return new ZipFS("", zip) as any;
        }
    }
    md5(data: Uint8Array): Promise<string> {
        return Promise.resolve(createHash("md5").update(data).digest("hex"));
    }
    sha1(data: Uint8Array): Promise<string> {
        return Promise.resolve(createHash("sha1").update(data).digest("hex"));
    }
    decodeBase64(input: string): string {
        return Buffer.from(input, "base64").toString("utf-8");
    }
    encodeBase64(input: string): string {
        return Buffer.from(input, "utf-8").toString("base64");
    }
    basename(path: string): string {
        return basename(path);
    }
    join(...paths: string[]): string {
        return join(...paths);
    }
    eol: string = EOL;

    constructor() { }
}

setSystem(new NodeSystem());
