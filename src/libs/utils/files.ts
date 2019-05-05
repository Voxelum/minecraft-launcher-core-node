import { access, constants, mkdir } from "fs";
import { dirname } from "path";

export function exists(target: string) {
    return access.__promisify__(target, constants.F_OK).then(() => true).catch(() => false);
}

export function missing(target: string) {
    return access.__promisify__(target, constants.F_OK).then(() => false).catch(() => true);
}

export function ensureDir(target: string) {
    return mkdir.__promisify__(target, { recursive: true }).catch(() => { });
}

export function ensureFile(target: string) {
    return mkdir.__promisify__(dirname(target), { recursive: true }).catch(() => { });
}
