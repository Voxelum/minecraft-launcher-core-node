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
} from "fs";
import { promisify } from "util";
import { pipeline as pip } from "stream";

const pipeline = promisify(pip);
const access = promisify(faccess);

/** @ignore */
export const link = promisify(flink);
/** @ignore */
export const readFile = promisify(freadFile);
/** @ignore */
export const writeFile = promisify(fwriteFile);
/** @ignore */
export const mkdir = promisify(fmkdir);

/**
 * Validate the sha1 value of the file
 * @ignore
 */
export async function validateSha1(target: string, hash?: string, strict: boolean = false) {
    if (await access(target).then(() => false, () => true)) { return false; }
    if (!hash) { return !strict; }
    let sha1 = await getSha1(target);
    return sha1 === hash;
}
/**
 * Return the sha1 of a file
 * @ignore
 */
export async function getSha1(target: string) {
    let hash = createHash("sha1").setEncoding("hex");
    await pipeline(createReadStream(target), hash);
    return hash.read();
}

