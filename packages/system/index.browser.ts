import { setSystem, System, FileSystem } from "./system";
import JSZip from "jszip";

const base64abc = (() => {
    let abc = [],
        A = "A".charCodeAt(0),
        a = "a".charCodeAt(0),
        n = "0".charCodeAt(0);
    for (let i = 0; i < 26; ++i) {
        abc.push(String.fromCharCode(A + i));
    }
    for (let i = 0; i < 26; ++i) {
        abc.push(String.fromCharCode(a + i));
    }
    for (let i = 0; i < 10; ++i) {
        abc.push(String.fromCharCode(n + i));
    }
    abc.push("+");
    abc.push("/");
    return abc;
})();

function bytesToBase64(bytes: Uint8Array) {
    let result = "", i, l = bytes.length;
    for (i = 2; i < l; i += 3) {
        result += base64abc[bytes[i - 2] >> 2];
        result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
        result += base64abc[((bytes[i - 1] & 0x0F) << 2) | (bytes[i] >> 6)];
        result += base64abc[bytes[i] & 0x3F];
    }
    if (i === l + 1) { // 1 octet missing
        result += base64abc[bytes[i - 2] >> 2];
        result += base64abc[(bytes[i - 2] & 0x03) << 4];
        result += "==";
    }
    if (i === l) { // 2 octets missing
        result += base64abc[bytes[i - 2] >> 2];
        result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
        result += base64abc[(bytes[i - 1] & 0x0F) << 2];
        result += "=";
    }
    return result;
}

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
        return this.zip.files[name].async("uint8array");
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

class BrowserSystem implements System {
    get fs(): FileSystem { throw new Error("Unsupprted"); }
    bufferToText(buff: Uint8Array): string {
        return new TextDecoder("utf-8").decode(buff);
    }
    bufferToBase64(buff: Uint8Array): string {
        return bytesToBase64(buff);
    }
    async openFileSystem(basePath: string | Uint8Array): Promise<FileSystem> {
        if (typeof basePath === "string") { throw new Error("Unsupported"); }
        return new JSZipFS(await JSZip.loadAsync(basePath));
    }
    resolveFileSystem(base: string | Uint8Array | FileSystem): Promise<FileSystem> {
        if (typeof base === "string" || base instanceof Uint8Array) {
            return this.openFileSystem(base);
        } else {
            return Promise.resolve(base);
        }
    }
    decodeBase64(input: string): string {
        return atob(input);
    }
    encodeBase64(input: string): string {
        return btoa(input);
    }
}

setSystem(new BrowserSystem());

export * from "./system";
