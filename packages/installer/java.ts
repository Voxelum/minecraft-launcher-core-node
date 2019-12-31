import { ExecOptions, spawn } from "child_process";

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
