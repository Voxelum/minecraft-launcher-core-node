export * from "./fs";
export * from "./folder";
import * as os from "os";

import * as folder from "./folder";
import * as fs from "./fs";

export function getPlatform(): Platform {
    const arch = os.arch();
    const version = os.release();
    switch (os.platform()) {
        case "darwin":
            return { name: "osx", version, arch };
        case "linux":
            return { name: "linux", version, arch };
        case "win32":
            return { name: "windows", version, arch };
        default:
            return { name: "unknown", version, arch };
    }
}

export const currentPlatform: Platform = getPlatform();
export interface Platform {
    name: "osx" | "linux" | "windows" | "unknown";
    version: string;
    arch: "x32" | "x64" | string;
}

export default {
    ...fs,
    ...folder,
    getPlatform,
    currentPlatform,
};
