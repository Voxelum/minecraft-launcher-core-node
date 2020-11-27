/**
 * @ignore
 */

import { createHash } from "crypto";
import {
    createReadStream,
    readFile as freadFile,
    writeFile as fwriteFile,
    access as faccess,
    mkdir as fmkdir,
    link as flink,
    constants,
} from "fs";
import { promisify } from "util";
import { pipeline as pip } from "stream";

/** @ignore */
export const pipeline = promisify(pip);
/** @ignore */
export const access = promisify(faccess);
/** @ignore */
export const link = promisify(flink);
/** @ignore */
export const readFile = promisify(freadFile);
/** @ignore */
export const writeFile = promisify(fwriteFile);
/** @ignore */
export const mkdir = promisify(fmkdir);

export function exists(file: string) {
    return access(file, constants.F_OK).then(() => true, () => false);
}
/**
 * Validate the sha1 value of the file
 * @ignore
 */
export async function validateSha1(target: string, hash?: string, strict: boolean = false) {
    if (await access(target).then(() => false, () => true)) { return false; }
    if (!hash) { return !strict; }
    let sha1 = await checksum(target, "sha1");
    return sha1 === hash;
}
/**
 * Return the sha1 of a file
 * @ignore
 */
export async function checksum(target: string, algorithm: string) {
    let hash = createHash(algorithm).setEncoding("hex");
    await pipeline(createReadStream(target), hash);
    return hash.read();
}
/**
 * @ignore
 */
export function isNotNull<T>(v: T | undefined): v is T {
    return v !== undefined
}

