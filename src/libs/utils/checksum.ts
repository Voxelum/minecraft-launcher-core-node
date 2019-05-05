import * as crypto from "crypto";
import * as fs from "fs";

export default function checksum(path: string, algorithm: string = "sha1"): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const hash = crypto.createHash(algorithm).setEncoding("hex");
        fs.createReadStream(path)
            .pipe(hash)
            .once("finish", () => { resolve(hash.read() as string); });
    });
}

export function multiChecksum(path: string, algorithms: string[]): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
        const hashes = algorithms.map((name) => crypto.createHash(name).setEncoding("hex"));
        fs.createReadStream(path)
            .on("data", (chunk) => { hashes.forEach((h) => h.update(chunk)); })
            .once("finish", () => { resolve(hashes.map((h) => h.digest().toString())); });
    });
}
