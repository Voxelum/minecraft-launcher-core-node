import { _exists as exists, _mkdir as mkdir, _readFile as readFile, _writeFile as writeFile, _pipeline as pipeline } from "@xmcl/core";
import { CancelledError } from "@xmcl/task";
import { ExecOptions, spawn } from "child_process";
import { close as fclose, copyFile as fcopyFile, ftruncate, open as fopen, stat as fstat, unlink as funlink } from "fs";
import { dirname } from "path";
import { promisify } from "util";

export const unlink = promisify(funlink);
export const stat = promisify(fstat);

export const open = promisify(fopen);
export const close = promisify(fclose);
export const copyFile = promisify(fcopyFile);
export const truncate = promisify(ftruncate);

export { readFile, writeFile, mkdir, exists, pipeline };
export { checksum } from "@xmcl/core";

export function missing(target: string) {
    return exists(target).then((v) => !v);
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
export function normalizeArray<T>(arr: T | T[] = []): T[] {
    return arr instanceof Array ? arr : [arr];
}
/**
 * The collection of errors happened during a parallel process
 */
export class MultipleError extends Error {
    constructor(public errors: unknown[], message?: string) { super(message); };
}
export function errorFrom<T>(error: T, message?: string): T & Error {
    return Object.assign(new Error(message), error);
}

export function spawnProcess(javaPath: string, args: string[], options?: ExecOptions) {
    return new Promise<void>((resolve, reject) => {
        let process = spawn(javaPath, args, options);
        let errorMsg: string[] = [];
        process.on("error", reject);
        process.on("close", (code) => {
            if (code !== 0) { reject(errorMsg.join("")); } else { resolve(); }
        });
        process.on("exit", (code) => {
            if (code !== 0) { reject(errorMsg.join("")); } else { resolve(); }
        });
        process.stdout.setEncoding("utf-8");
        process.stdout.on("data", (buf) => { });
        process.stderr.setEncoding("utf-8");
        process.stderr.on("data", (buf) => { errorMsg.push(buf.toString()) });
    });
}
export async function all(promises: Promise<any>[], throwErrorImmediately: boolean, getErrorMessage?: (errors: unknown[]) => string): Promise<any[]> {
    const errors: unknown[] = [];
    const result = await Promise.all(promises.map(async (promise) => {
        try {
            return promise;
        } catch (error) {
            if (throwErrorImmediately || error instanceof CancelledError) {
                throw error;
            }
            errors.push(error);
        }
    }));
    if (errors.length > 0) {
        throw new MultipleError(errors, getErrorMessage?.(errors));
    }
    return result;
}

/**
 * Shared install options
 */
export interface InstallOptions {
    /**
     * When you want to install a version over another one.
     *
     * Like, you want to install liteloader over a forge version.
     * You should fill this with that forge version id.
     */
    inheritsFrom?: string;

    /**
     * Override the newly installed version id.
     *
     * If this is absent, the installed version id will be either generated or provided by installer.
     */
    versionId?: string;
}
