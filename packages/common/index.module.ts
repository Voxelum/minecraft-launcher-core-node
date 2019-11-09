export * from "./system";

// import md5 from "ts-md5";
// import rusha from "rusha";
import { setSystem, System, FileSystem } from "./system";
import JSZip from "jszip";

// class JSZipFS extends FileSystem {
//     root: string = "";
//     isDirectory(name: string): Promise<boolean> {
//         throw new Error("Method not implemented.");
//     }
//     writeFile(name: string, data: Uint8Array): Promise<void> {
//         throw new Error("Method not implemented.");
//     }
//     existsFile(name: string): Promise<boolean> {
//         throw new Error("Method not implemented.");
//     }
//     readFile(name: any, encoding?: any) {
//         throw new Error("Method not implemented.");
//     }
//     listFiles(name: string): Promise<string[]> {
//         throw new Error("Method not implemented.");
//     }

//     constructor(private zip: JSZip) { super(); }
// }

// class BrowserSystem implements System {
//     fs: FileSystem = null as any;
//     openFileSystem(basePath: string | Uint8Array): Promise<FileSystem> {
//         throw new Error("Method not implemented.");
//     }
//     md5(data: Uint8Array): Promise<string> {
//         return Promise.resolve(new md5.Md5().start().appendByteArray(data).end() as string);
//     }
//     sha1(data: Uint8Array): Promise<string> {
//         return Promise.resolve(rusha.createHash().update(data).digest("hex"));
//     }
//     decodeBase64(input: string): string {
//         return atob(input);
//     }
//     encodeBase64(input: string): string {
//         return btoa(input);
//     }
//     basename(path: string): string {
//         throw new Error("Method not implemented.");
//     }
//     join(...paths: string[]): string {
//         throw new Error("Method not implemented.");
//     }
//     eol: string = "\n";
//     name: "osx" | "linux" | "windows" | "unknown" = "unknown";
//     version: string = "";
//     arch: string = "";
// }

// setSystem(new BrowserSystem());
