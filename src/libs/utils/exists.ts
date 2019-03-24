import { access, constants } from "fs-extra";

export function exists(path: string) {
    return access(path, constants.F_OK).then(() => true).catch(() => false);
}

export function missing(path: string) {
    return access(path, constants.F_OK).then(() => false).catch(() => true);
}
