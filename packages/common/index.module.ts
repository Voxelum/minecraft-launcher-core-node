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

import pako from "pako";
import md5 from "ts-md5";
import rusha from "rusha";
import { setSystem, System, FileSystem } from "./system";

class BrowserSystem implements System {
    fs: FileSystem = null as any;
    openFileSystem(basePath: string | Uint8Array): Promise<FileSystem> {
        throw new Error("Method not implemented.");
    }
    md5(data: Uint8Array): Promise<string> {
        return Promise.resolve(new md5.Md5().start().appendByteArray(data).end() as string);
    }
    sha1(data: Uint8Array): Promise<string> {
        return Promise.resolve(rusha.createHash().update(data).digest("hex"));
    }
    decodeBase64(input: string): string {
        return atob(input);
    }
    encodeBase64(input: string): string {
        return btoa(input);
    }
    gzip(buffer: Uint8Array): Promise<Uint8Array> {
        return Promise.resolve(pako.gzip(buffer));
    }
    gzipSync(buffer: Uint8Array): Uint8Array {
        return pako.gzip(buffer);
    }
    unzip(buffer: Uint8Array): Promise<Uint8Array> {
        throw new Error("Method not implemented.");
    }
    unzipSync(buffer: Uint8Array): Uint8Array {
        throw new Error("Method not implemented.");
    }
    basename(path: string): string {
        throw new Error("Method not implemented.");
    }
    join(...paths: string[]): string {
        throw new Error("Method not implemented.");
    }
    eol: string = "\n";
    name: "osx" | "linux" | "windows" | "unknown" = "unknown";
    version: string = "";
    arch: string = "";
}

setSystem(new BrowserSystem());
