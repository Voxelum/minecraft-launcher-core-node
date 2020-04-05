/**
 * @module
 * @ignore
 */
import { createHash } from "crypto";
import {
    constants,
    createReadStream,
    readFile as freadFile,
    readdir as freaddir,
    rename as frename,
    readlink as freadlink,
    stat as fstat,
    copyFile as fcopyFile,
    unlink as funlink,
    writeFile as fwriteFile,
    access as faccess,
    mkdir as fmkdir,
    rmdir as frmdir,
} from "fs";
import { dirname, resolve as presolve } from "path";
import { finished } from "stream";
import { promisify } from "util";

export const readFile = promisify(freadFile);
export const writeFile = promisify(fwriteFile);
export const stat = promisify(fstat);
export const readlink = promisify(freadlink);
export const copyFile = promisify(fcopyFile);
export const unlink = promisify(funlink);
export const rename = promisify(frename);
export const readdir = promisify(freaddir);
export const access = promisify(faccess);
export const mkdir = promisify(fmkdir);
export const rmdir = promisify(frmdir);

export function waitStream(stream: NodeJS.ReadableStream | NodeJS.WritableStream | NodeJS.ReadWriteStream) {
    return new Promise<void>((resolve, reject) => {
        finished(stream, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}
export function exists(target: string) {
    return access(target, constants.F_OK).then(() => true).catch(() => false);
}
export function missing(target: string) {
    return access(target, constants.F_OK).then(() => false).catch(() => true);
}
export async function validateSha1(target: string, hash?: string) {
    if (await missing(target)) { return false; }
    if (!hash) { return true; }
    const sha1 = await checksum(target, "sha1");
    return sha1 === hash;
}
export async function validateMd5(target: string, hash?: string) {
    if (await missing(target)) { return false; }
    if (!hash) { return true; }
    const sha1 = await checksum(target, "md5");
    return sha1 === hash;
}
export async function copyPassively(src: string, dest: string, filter: (name: string) => boolean = () => true) {
    const s = await stat(src).catch((_) => { });
    if (!s) { return; }
    if (!filter(src)) { return; }
    if (s.isDirectory()) {
        await ensureDir(dest);
        const childs = await readdir(src);
        await Promise.all(childs.map((p) => copyPassively(presolve(src, p), presolve(dest, p))));
    } else if (await missing(dest)) {
        await copyFile(src, dest);
    }
}
export async function ensureDir(target: string) {
    try {
        await mkdir(target);
    } catch (e) {
        if (await stat(target).then((s) => s.isDirectory()).catch((e) => false)) { return; }
        if (e.code === "EEXIST") { return; }
        if (e.code === "ENOENT") {
            if (dirname(target) === target) {
                throw e;
            }
            try {
                await ensureDir(dirname(target));
                await mkdir(target);
            } catch {
                if (await stat(target).then((s) => s.isDirectory()).catch((e) => false)) { return; }
                throw e;
            }
            return;
        }
        throw e;
    }
}
export function ensureFile(target: string) {
    return ensureDir(dirname(target));
}
export async function remove(f: string) {
    try {
        const stats = await stat(f);
        if (stats.isDirectory()) {
            const children = await readdir(f);
            await Promise.all(children.map((child) => remove(presolve(f, child))));
            await rmdir(f);
        } else {
            await unlink(f);
        }
    } catch {

    }
}
export function checksum(path: string, algorithm: string = "sha1"): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const hash = createHash(algorithm).setEncoding("hex");
        createReadStream(path)
            .pipe(hash)
            .on("error", (e) => { reject(e); })
            .once("finish", () => { resolve(hash.read() as string); });
    });
}
export function checksums(path: string, algorithms: string[]): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
        const hashes = algorithms.map((name) => createHash(name));
        createReadStream(path)
            .on("data", (chunk) => { hashes.forEach((h) => h.update(chunk)); })
            .on("error", (e) => { reject(e); })
            .once("close", () => { resolve(hashes.map((h) => h.digest("hex"))); });
    });
}
