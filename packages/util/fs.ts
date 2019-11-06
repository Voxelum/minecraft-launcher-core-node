import { createHash } from "crypto";
import { constants, createReadStream, createWriteStream, promises } from "fs";
import { dirname, resolve as presolve } from "path";
import { finished } from "stream";
import { FileSystem, System } from "@xmcl/common";

export type VFS = typeof promises & {
    createReadStream: typeof createReadStream;
    createWriteStream: typeof createWriteStream;
    ensureDir(target: string): Promise<void>;
    ensureFile(target: string): Promise<void>;
    remove(target: string): Promise<void>;
    missing(target: string): Promise<boolean>;
    exists(target: string): Promise<boolean>;
    copy(src: string, dest: string, filter?: (name: string) => boolean): Promise<void>;
    waitStream(stream: NodeJS.ReadableStream | NodeJS.WritableStream | NodeJS.ReadWriteStream): Promise<void>;
    validate(target: string, ...validations: Array<{ algorithm: string, hash: string }>): Promise<boolean>;
};

export const vfs: VFS = {
    ...promises,
    exists,
    missing,
    remove,
    ensureDir,
    ensureFile,
    createReadStream,
    createWriteStream,
    copy,
    waitStream,
    validate(target, ...validations) {
        return multiChecksum(target, validations.map((v) => v.algorithm)).then((r) => r.every((h, i) =>
            h === validations[i].hash)).catch(() => false);
    },
};

export namespace VFS {
    export const defaultFs = Object.freeze({
        ...promises,
        exists,
        missing,
        remove,
        ensureDir,
        ensureFile,
    });

    export function setVirtualFS(nvfs: Partial<VFS>) {
        for (const [key, value] of Object.entries(nvfs)) {
            if (key in vfs && value !== undefined) {
                Reflect.set(vfs, key, value);
            }
        }
    }

    export function restoreToDefault() {
        Object.assign(vfs, defaultFs);
    }
}

export function waitStream(stream: NodeJS.ReadableStream | NodeJS.WritableStream | NodeJS.ReadWriteStream) {
    return new Promise<void>((resolve, reject) => {
        finished(stream, (err) => {
            if (err) { reject(err); } else { resolve(); }
        });
    });
}

export function exists(target: string) {
    return promises.access(target, constants.F_OK).then(() => true).catch(() => false);
}

export function missing(target: string) {
    return promises.access(target, constants.F_OK).then(() => false).catch(() => true);
}

export async function validate(fs: FileSystem, target: string, hash: string, algorithm: string = "sha1") {
    return await fs.existsFile(target)
        && await computeChecksum(target, algorithm) === hash;
}

export async function validateSha1(fs: FileSystem, target: string, hash: string) {
    if (!await fs.existsFile(target)) {
        return false;
    }
    const sha1 = await System.sha1(await fs.readFile(target));
    return sha1 === hash;
}

export async function copy(src: string, dest: string, filter: (name: string) => boolean = () => true) {
    const s = await promises.stat(src).catch((_) => { });
    if (!s) { return; }
    if (!filter(src)) { return; }
    if (s.isDirectory()) {
        await ensureDir(dest);
        const childs = await promises.readdir(src);
        await Promise.all(childs.map((p) => copy(presolve(src, p), presolve(dest, p))));
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

export function computeChecksum(path: string, algorithm: string = "sha1"): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const hash = createHash(algorithm).setEncoding("hex");
        createReadStream(path)
            .pipe(hash)
            .on("error", (e) => { reject(e); })
            .once("finish", () => { resolve(hash.read() as string); });
    });
}

export function multiChecksum(path: string, algorithms: string[]): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
        const hashes = algorithms.map((name) => createHash(name));
        createReadStream(path)
            .on("data", (chunk) => { hashes.forEach((h) => h.update(chunk)); })
            .on("error", (e) => { reject(e); })
            .once("close", () => { resolve(hashes.map((h) => h.digest("hex"))); });
    });
}
