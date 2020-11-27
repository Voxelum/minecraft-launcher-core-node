import path from "path";

let existedFiles = [] as string[];
let checksums: Record<string, string> = {};

export function exists(name: string) {
    return Promise.resolve(existedFiles.indexOf(name) !== -1);
}

export function checksum(name: string, algorithm: string) {
    return Promise.resolve(checksums[name]);
}

export function __addChecksum(record: object) {
    for (const [k, v] of Object.entries(record)) {
        checksums[path.join(/* root, */ k)] = v;
    }
}

export function __addExistedFile(name: string) {
    existedFiles.push(path.join(/* root, */ name))
}

export function __reset() {
    checksums = {};
    existedFiles = [];
}

export function isNotNull(v: any) { return !!v }
