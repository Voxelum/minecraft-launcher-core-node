import { open, CachedZipFile } from "@xmcl/unzip";
import { promises } from "fs";
import { join, sep } from "path";
import { FileSystem, setSystem, System } from "./system";

class DefaultFS extends FileSystem {
    sep = sep;
    type = "path" as const;
    writeable = true;
    join(...paths: string[]): string {
        return join(...paths);
    }
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
    sep = "/";
    type = "zip" as const;
    writeable = false;
    join(...paths: string[]): string {
        return paths.join("/");
    }
    isDirectory(name: string): Promise<boolean> {
        if (this.zip.entries[name]) {
            return Promise.resolve(name.endsWith("/"));
        }
        if (this.zip.entries[name + "/"]) {
            return Promise.resolve(true);
        }
        // the root dir won't have entries
        // therefore we need to do an extra track here
        const entries = Object.keys(this.zip.entries);
        return Promise.resolve(entries.some((e) => e.startsWith(name + "/")));
    }
    existsFile(name: string): Promise<boolean> {
        name = name.startsWith("/") ? name.substring(1) : name;
        if (this.zip.entries[name]
            || this.zip.entries[name + "/"]) { return Promise.resolve(true); }
        // the root dir won't have entries
        // therefore we need to do an extra track here
        const entries = Object.keys(this.zip.entries);
        return Promise.resolve(entries.some((e) => e.startsWith(name + "/")));
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
        name = name.startsWith("/") ? name.substring(1) : name;
        return Promise.resolve([
            ...new Set(Object.keys(this.zip.entries)
                .filter((n) => n.startsWith(name))
                .map((n) => n.substring(name.length))
                .map((n) => n.startsWith("/") ? n.substring(1) : n)
                .map((n) => n.split("/")[0])),
        ]);
    }
    async walkFiles(startingDir: string, walker: (path: string) => void | Promise<void>) {
        const root = startingDir.startsWith("/") ? startingDir.substring(1) : startingDir;
        for (const child of Object.keys(this.zip.entries).filter((e) => e.startsWith(root))) {
            if (child.endsWith("/")) { continue; }
            const result = walker(child);
            if (result instanceof Promise) {
                await result;
            }
        }
    }
    constructor(readonly root: string, private zip: CachedZipFile) { super(); }
}
class NodeSystem implements System {
    fs: FileSystem = new DefaultFS("/");
    resolveFileSystem(base: string | Uint8Array | FileSystem): Promise<FileSystem> {
        if (typeof base === "string" || base instanceof Uint8Array) {
            return this.openFileSystem(base);
        } else {
            return Promise.resolve(base);
        }
    }
    async openFileSystem(basePath: string | Uint8Array): Promise<FileSystem> {
        if (typeof basePath === "string") {
            const stat = await promises.stat(basePath);
            if (stat.isDirectory()) {
                return new DefaultFS(basePath);
            } else {
                const zip = await open(basePath, { lazyEntries: false });
                return new ZipFS(basePath, zip);
            }
        } else {
            const zip = await open(basePath as Buffer, { lazyEntries: false });
            return new ZipFS("", zip);
        }
    }
    decodeBase64(input: string): string {
        return Buffer.from(input, "base64").toString("utf-8");
    }
    encodeBase64(input: string): string {
        return Buffer.from(input, "utf-8").toString("base64");
    }
    bufferToText(buff: Uint8Array): string {
        if (buff instanceof Buffer) {
            return buff.toString("utf-8");
        }
        return Buffer.from(buff).toString("utf-8");
    }
    bufferToBase64(buff: Uint8Array): string {
        if (buff instanceof Buffer) {
            return buff.toString("base64");
        }
        return Buffer.from(buff).toString("base64");
    }

    constructor() { }
}

const node: System = new NodeSystem();

setSystem(node);

export * from "./system";

