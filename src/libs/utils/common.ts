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

export async function validate(target: string, sha1: string) {
    return await exists(target) && await computeChecksum(target, "sha1") === sha1;
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


export function writeUTF8(out: ByteBuffer, str: string) {
    const strlen = str.length;
    let utflen = 0;
    let c: number;
    let count: number = 0;

    /* use charAt instead of copying String to char array */
    for (let idx = 0; idx < strlen; idx++) {
        c = str.charCodeAt(idx);
        if ((c >= 0x0001) && (c <= 0x007F)) {
            utflen++;
        } else if (c > 0x07FF) {
            utflen += 3;
        } else {
            utflen += 2;
        }
    }

    if (utflen > 65535) {
        throw new Error(
            "encoded string too long: " + utflen + " bytes");
    }

    const bytearr = new Uint8Array(utflen + 2);

    bytearr[count++] = ((utflen >>> 8) & 0xFF);
    bytearr[count++] = ((utflen >>> 0) & 0xFF);

    let i = 0;
    for (i = 0; i < strlen; i++) {
        c = str.charCodeAt(i);
        if (!((c >= 0x0001) && (c <= 0x007F))) { break; }
        bytearr[count++] = c;
    }

    for (; i < strlen; i++) {
        c = str.charCodeAt(i);
        if ((c >= 0x0001) && (c <= 0x007F)) {
            bytearr[count++] = c;

        } else if (c > 0x07FF) {
            bytearr[count++] = (0xE0 | ((c >> 12) & 0x0F));
            bytearr[count++] = (0x80 | ((c >> 6) & 0x3F));
            bytearr[count++] = (0x80 | ((c >> 0) & 0x3F));
        } else {
            bytearr[count++] = (0xC0 | ((c >> 6) & 0x1F));
            bytearr[count++] = (0x80 | ((c >> 0) & 0x3F));
        }
    }
    out.append(bytearr);
    // out.write(bytearr, 0, utflen + 2);
    return utflen + 2;
}

export function readUTF8(buff: ByteBuffer) {
    const utflen = buff.readUint16();
    const bytearr: number[] = new Array<number>(utflen);
    const chararr = new Array<number>(utflen);

    let c, char2, char3;
    let count = 0;
    let chararrCount = 0;

    for (let i = 0; i < utflen; i++) {
        bytearr[i] = (buff.readByte());
    }

    while (count < utflen) {
        c = bytearr[count] & 0xff;
        if (c > 127) { break; }
        count++;
        chararr[chararrCount++] = c;
    }

    while (count < utflen) {
        c = bytearr[count] & 0xff;
        switch (c >> 4) {
            case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
                /* 0xxxxxxx*/
                count++;
                chararr[chararrCount++] = c;
                break;
            case 12: case 13:
                /* 110x xxxx   10xx xxxx*/
                count += 2;
                if (count > utflen) {
                    throw new Error(
                        "malformed input: partial character at end");
                }
                char2 = bytearr[count - 1];
                if ((char2 & 0xC0) !== 0x80) {
                    throw new Error(
                        "malformed input around byte " + count);
                }
                chararr[chararrCount++] = (((c & 0x1F) << 6) |
                    (char2 & 0x3F));
                break;
            case 14:
                /* 1110 xxxx  10xx xxxx  10xx xxxx */
                count += 3;
                if (count > utflen) {
                    throw new Error(
                        "malformed input: partial character at end");
                }
                char2 = bytearr[count - 2];
                char3 = bytearr[count - 1];
                if (((char2 & 0xC0) !== 0x80) || ((char3 & 0xC0) !== 0x80)) {
                    throw new Error(
                        "malformed input around byte " + (count - 1));
                }
                chararr[chararrCount++] = (((c & 0x0F) << 12) |
                    ((char2 & 0x3F) << 6) |
                    ((char3 & 0x3F) << 0));
                break;
            default:
                /* 10xx xxxx,  1111 xxxx */
                throw new Error(
                    "malformed input around byte " + count);
        }
    }
    // The number of chars produced may be less than utflen
    return chararr.map((i) => String.fromCharCode(i)).join("");
}
