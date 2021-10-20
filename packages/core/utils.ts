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

/** @internal */
export const pipeline = promisify(pip);
/** @internal */
export const access = promisify(faccess);
/** @internal */
export const link = promisify(flink);
/** @internal */
export const readFile = promisify(freadFile);
/** @internal */
export const writeFile = promisify(fwriteFile);
/** @internal */
export const mkdir = promisify(fmkdir);

/** @internal */
export function exists(file: string) {
    return access(file, constants.F_OK).then(() => true, () => false);
}
/**
 * Validate the sha1 value of the file
 * @internal
 */
export async function validateSha1(target: string, hash?: string, strict: boolean = false) {
    if (await access(target).then(() => false, () => true)) { return false; }
    if (!hash) { return !strict; }
    let sha1 = await checksum(target, "sha1");
    return sha1 === hash;
}
/**
 * Return the sha1 of a file
 * @internal
 */
export async function checksum(target: string, algorithm: string) {
    let hash = createHash(algorithm).setEncoding("hex");
    await pipeline(createReadStream(target), hash);
    return hash.read();
}
/**
 * @internal
 */
export function isNotNull<T>(v: T | undefined): v is T {
    return v !== undefined
}

