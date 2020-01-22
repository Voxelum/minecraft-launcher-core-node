import * as os from "os";

export interface Platform {
    name: "osx" | "linux" | "windows" | "unknown";
    version: string;
    arch: "x86" | "x64" | string;
}

/**
 * Get Minecraft style platform info. (Majorly used to enable/disable native dependencies)
 */
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

/**
 * The current platform
 */
export const currentPlatform: Platform = getPlatform();
