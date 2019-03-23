import * as crypto from "crypto";
import * as fs from "fs-extra";

export default function checksum(path: string, algorithm: string = "sha1"): Promise<string> {
    return fs.readFile(path).then((data) => crypto.createHash(algorithm).update(data).digest("hex"));
}
