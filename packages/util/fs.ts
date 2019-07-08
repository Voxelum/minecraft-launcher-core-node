import * as ByteBuffer from "bytebuffer";
import { createHash } from "crypto";
import { constants, createReadStream, existsSync, promises } from "fs";
import { arch as getArch, platform as getPlatform, release } from "os";
import { dirname, resolve as presolve } from "path";

export function exists(target: string) {
    return promises.access(target, constants.F_OK).then(() => true).catch(() => false);
}

export function missing(target: string) {
    return promises.access(target, constants.F_OK).then(() => false).catch(() => true);
}

export async function validate(target: string, hash: string, algorithm: string = "sha1") {
    return await exists(target) && await computeChecksum(target, algorithm) === hash;
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
        return;
    }
}

export function computeChecksum(path: string, algorithm: string = "sha1"): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const hash = createHash(algorithm).setEncoding("hex");
        createReadStream(path)
            .pipe(hash)
            .on("error", (e) => { reject(new Error(e)); })
            .once("finish", () => { resolve(hash.read() as string); });
    });
}

export function multiChecksum(path: string, algorithms: string[]): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
        const hashes = algorithms.map((name) => createHash(name));
        createReadStream(path)
            .on("data", (chunk) => { hashes.forEach((h) => h.update(chunk)); })
            .on("error", (e) => { reject(new Error(e)); })
            .once("close", () => { resolve(hashes.map((h) => h.digest("hex"))); });
    });
}

export function format(template: string, args: any) {
    return template.replace(/\$\{(.*?)}/g, (key) => {
        const value = args[key.substring(2).substring(0, key.length - 3)];
        return value ? value : key;
    });
}

export const platform = (() => {
    let arch = getArch();
    let osName: string = "unknown";
    switch (getPlatform()) {
        case "darwin":
            osName = "osx";
            break;
        case "linux":
            osName = "linux";
            break;
        case "win32":
            osName = "windows";
            break;
    }

    if (arch.startsWith("x")) { arch = arch.substring(1); }
    return {
        arch,
        name: osName,
        version: release(),
    };
});

