import { _exists as exists, _mkdir as mkdir, _pipeline as pipeline, _readFile as readFile, _writeFile as writeFile } from "@xmcl/core";
import { ChildProcessWithoutNullStreams, ExecOptions } from "child_process";
import { spawn } from "cross-spawn";
import { close as fclose, copyFile as fcopyFile, ftruncate, link as fslink, open as fopen, stat as fstat, unlink as funlink } from "fs";
import { dirname } from "path";
import { promisify } from "util";

export const unlink = promisify(funlink);
export const stat = promisify(fstat);

export const link = promisify(fslink);

export const open = promisify(fopen);
export const close = promisify(fclose);
export const copyFile = promisify(fcopyFile);
export const truncate = promisify(ftruncate);

export { checksum } from "@xmcl/core";
export { readFile, writeFile, mkdir, exists, pipeline };

export function missing(target: string) {
    return exists(target).then((v) => !v);
}
export async function ensureDir(target: string) {
    try {
        await mkdir(target);
    } catch (err) {
        const e: any = err;
        if (await stat(target).then((s) => s.isDirectory()).catch(() => false)) { return; }
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
export function spawnProcess(javaPath: string, args: string[], options?: ExecOptions) {
    let process = spawn(javaPath, args, options);
    return waitProcess(process);
}

export function waitProcess(process: ChildProcessWithoutNullStreams) {
    return new Promise<void>((resolve, reject) => {
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


export interface ParallelTaskOptions {
    throwErrorImmediately?: boolean
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

export function errorToString(e: any) {
    if (e instanceof Error) {
        return e.stack ? e.stack : e.message
    }
    return e.toString()
}
