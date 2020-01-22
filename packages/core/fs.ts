import { createHash } from "crypto";
import { constants, createReadStream, promises } from "fs";
import { dirname, resolve as presolve } from "path";
import { finished } from "stream";

export const readFile = promises.readFile;
export const writeFile = promises.writeFile;
export const stat = promises.stat;
export const readlink = promises.readlink;
export const copyFile = promises.copyFile;
export const unlink = promises.unlink;
export const rename = promises.rename;

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
    return promises.access(target, constants.F_OK).then(() => true).catch(() => false);
}
export function missing(target: string) {
    return promises.access(target, constants.F_OK).then(() => false).catch(() => true);
}
export async function validateSha1(target: string, hash: string) {
    if (await missing(target)) { return false; }
    const sha1 = await checksum(target, "sha1");
    return sha1 === hash;
}
export async function validateMd5(target: string, hash: string) {
    if (await missing(target)) { return false; }
    const sha1 = await checksum(target, "md5");
    return sha1 === hash;
}
export async function copyPassively(src: string, dest: string, filter: (name: string) => boolean = () => true) {
    const s = await promises.stat(src).catch((_) => { });
    if (!s) { return; }
    if (!filter(src)) { return; }
    if (s.isDirectory()) {
        await ensureDir(dest);
        const childs = await promises.readdir(src);
        await Promise.all(childs.map((p) => copyPassively(presolve(src, p), presolve(dest, p))));
    } else if (await missing(dest)) {
        await promises.copyFile(src, dest);
    }
}
export async function ensureDir(target: string) {
    try {
        await promises.mkdir(target);
    } catch (e) {
        if (await promises.stat(target).then((s) => s.isDirectory()).catch((e) => false)) { return; }
        if (e.code === "EEXIST") { return; }
        if (e.code === "ENOENT") {
            if (dirname(target) === target) {
                throw e;
            }
            try {
                await ensureDir(dirname(target));
                await promises.mkdir(target);
            } catch {
                if (await promises.stat(target).then((s) => s.isDirectory()).catch((e) => false)) { return; }
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
        const stat = await promises.stat(f);
        if (stat.isDirectory()) {
            const children = await promises.readdir(f);
            await Promise.all(children.map((child) => remove(presolve(f, child))));
            await promises.rmdir(f);
        } else {
            await promises.unlink(f);
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
