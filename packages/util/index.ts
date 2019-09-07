export * from "./fs";
export * from "./folder";
import { ExecOptions, spawn } from "child_process";
import * as os from "os";

import * as folder from "./folder";
import * as fs from "./fs";

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
export interface Platform {
    name: "osx" | "linux" | "windows" | "unknown";
    version: string;
    arch: "x32" | "x64" | string;
}

export type JavaExecutor = (args: string[], option?: ExecOptions) => Promise<any>;

export namespace JavaExecutor {
    export function createSimple(javaPath: string, defaultOptions?: ExecOptions): JavaExecutor {
        return function (args, options) {
            return new Promise<void>((resolve, reject) => {
                const process = spawn(javaPath, args, options || defaultOptions);
                process.on("error", (error) => {
                    reject(error);
                });
                process.on("close", (code, signal) => {
                    if (code !== 0) {
                        reject();
                    } else {
                        resolve();
                    }
                });
                process.on("exit", (code, signal) => {
                    if (code !== 0) {
                        reject();
                    } else {
                        resolve();
                    }
                });
                process.stdout.setEncoding("utf-8");
                process.stdout.on("data", (buf) => {
                });
                process.stderr.setEncoding("utf-8");
                process.stderr.on("data", (buf) => {
                    console.error(buf.toString("utf-8"));
                });
            });
        };
    }
}

export default {
    ...fs,
    ...folder,
    getPlatform,
    currentPlatform,
};
