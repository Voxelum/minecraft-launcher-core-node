import { setSystem, System, FileSystem } from "./system";
import { EOL, platform, arch, release } from "os";

export * from "./game";
export * from "./version";
export * from "./gamesetting";
export * from "./user";
export * from "./mojang";
export * from "./world";
export * from "./server";
export * from "./model";
export * from "./resource";
export * from "./system";
export * from "./platform";

const { World } = require("./world");
const { Version } = require("./version");
exports.World = World;
exports.Version = Version;

import { basename, join } from "path";
import { createHash } from "crypto";
import { Unzip } from "@xmcl/unzip";
import { promises } from "fs";

class DefaultFS extends FileSystem {
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
    isDirectory(name: string): Promise<boolean> {
        return Promise.resolve(Object.keys(this.zip.entries).some((k) => k.startsWith(name)));
    }
    writeFile(name: string, data: Uint8Array): Promise<void> {
        throw new Error("Unsupported!");
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
    async openFileSystem(basePath: string | Uint8Array): Promise<FileSystem> {
        if (typeof basePath === "string") {
            const stat = await promises.stat(basePath);
            if (stat.isDirectory()) {
                return new DefaultFS(basePath);
            } else {
                const zip = await Unzip.open(basePath, { lazyEntries: false });
                return new ZipFS(basePath, zip);
            }
        } else {
            const zip = await Unzip.open(basePath as Buffer, { lazyEntries: false });
            return new ZipFS("", zip);
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
    name: "osx" | "linux" | "windows" | "unknown";
    version: string;
    arch: string;

    constructor() {
        this.arch = arch();
        this.version = release();
        switch (platform()) {
            case "darwin":
                this.name = "osx";
                break;
            case "linux":
                this.name = "linux";
                break;
            case "win32":
                this.name = "windows";
                break;
            default:
                this.name = "unknown";
                break;
        }
    }
}

setSystem(new NodeSystem());
