import { ChildProcess, spawnSync } from "child_process";
import { EOL } from "os";
import * as path from "path";
import { launch, LaunchOption, launchServer } from "./launch";

declare const tempDir: string;
declare const inCI: boolean;

function getJavaVersion(javaPath: string) {
    const { stderr } = spawnSync(javaPath, ["-version"], { encoding: "utf8" });
    const line = stderr.split(EOL)[0];
    if (stderr.startsWith("java version")) {
        const parts = line.split(" ")[2].replace(/"/g, "").split(".");
        if (parts[0] === "1") {
            return Number.parseInt(parts[1].replace(/[^0-9]/g, ""), 10);
        } else {
            return (Number.parseInt(parts[0].replace(/[^0-9]/g, ""), 10));
        }
    } else {
        return (Number.parseInt(line.split(" ")[1].split(".")[0], 10));
    }
}

function waitGameProcess(process: ChildProcess, ...hints: string[]) {
    const found = new Array<boolean>(hints.length);
    found.fill(false);
    return new Promise<void>((resolve, reject) => {
        process.stdout!.on("data", (chunk) => {
            const content = chunk.toString();
            for (let i = 0; i < hints.length; i++) {
                if (content.indexOf(hints[i]) !== -1) {
                    found[i] = true;
                }
            }
            if (found.every((f) => f)) {
                process.kill("SIGINT");
            }
        });
        process.stderr!.on("data", (chunk) => {
            console.warn(chunk.toString());
        });
        process.on("exit", (code, signal) => {
            if (signal === "SIGINT" || code === 130) {
                resolve();
            } else {
                reject({ code, signal });
            }
        });
    });
}

describe("Launcher", () => {
    let javaPath: string;
    let javaVersion: number;

    jest.setTimeout(10000000);

    if (process.env.JAVA_HOME) {
        javaPath = `${process.env.JAVA_HOME}/bin/java`;
        javaVersion = getJavaVersion(javaPath);
    } else {
        javaPath = "java";
        try {
            javaVersion = getJavaVersion(javaPath);
        } catch {
            javaPath = "";
        }
    }
    describe.skip("#launch", () => {
        describe("1.6.4", () => {
            let t = test;
            if ((javaVersion && javaVersion > 8) || !javaPath) { t = test.skip; }
            test("should launch 1.6.4", async () => {
                const option: LaunchOption = { version: "1.6.4", gamePath: tempDir, javaPath };
                await waitGameProcess(await launch(option), "OpenAL initialized.");
            });
        });
        describe("1.17.10", () => {
            let t = test;
            if ((javaVersion && javaVersion > 8) || !javaPath) { t = test.skip; }
            test("should launch with forge", async () => {
                const option: LaunchOption = { version: "1.7.10-Forge10.13.3.1400-1.7.10", gamePath: tempDir, javaPath };
                await waitGameProcess(await launch(option), "OpenAL initialized.");
            });
        });

        describe("1.12.2", () => {
            let t = test;
            if ((javaVersion && javaVersion > 8) || !javaPath) { t = test.skip; }
            test("should launch normal minecraft", async () => {
                const option: LaunchOption = { version: "1.12.2", gamePath: tempDir, javaPath };
                await waitGameProcess(await launch(option), "[Client thread/INFO]: Created: 1024x512 textures-atlas");
            });
            t("should launch server", async () => {
                const option: LaunchOption = {
                    version: "1.12.2", gamePath: tempDir, javaPath, server: {
                        ip: "127.0.0.1",
                        port: 25565,
                    },
                };
                await waitGameProcess(await launch(option), "[Client thread/INFO]: Connecting to 127.0.0.1, 25565");
            });
            t("should launch forge minecraft", async () => {
                const option: LaunchOption = { version: "1.12.2-forge1.12.2-14.23.5.2823", gamePath: tempDir, javaPath };
                await waitGameProcess(await launch(option), "[main/INFO] [FML]:");
            });
            t("should launch liteloader minecraft", async () => {
                const option: LaunchOption = { version: "1.12.2-Liteloader1.12.2-1.12.2-SNAPSHOT", gamePath: tempDir, javaPath };
                await waitGameProcess(await launch(option), "LiteLoader begin POSTINIT");
            });
            t("should launch forge liteloader minecraft", async () => {
                const option: LaunchOption = { version: "1.12.2-forge1.12.2-14.23.5.2823-Liteloader1.12.2-1.12.2-SNAPSHOT", gamePath: tempDir, javaPath };
                await waitGameProcess(await launch(option), "LiteLoader begin POSTINIT", "[main/INFO] [FML]:");
            });
        });

        describe("1.14.4", () => {
            let t = test;
            if (!javaPath) { t = test.skip; }
            t("should launch normal minecraft", async () => {
                const option: LaunchOption = { version: "1.14.4", gamePath: tempDir, javaPath };
                await waitGameProcess(await launch(option), "[Client thread/INFO]: OpenAL initialized");
            });
        });
        describe("1.15.2", () => {
            let t = test;
            if (!javaPath) { t = test.skip; }
            t("should launch normal minecraft", async () => {
                const option: LaunchOption = { version: "1.15.2", gamePath: tempDir, javaPath };
                await waitGameProcess(await launch(option), "OpenAL initialized.");
            });
        });
    });
    describe.skip("#launchServer", () => {
        test("should launch 1.12.2", async () => {
            const process = await launchServer({
                version: "1.12.2",
                path: tempDir,
                javaPath,
                cwd: path.resolve(".")
            })
            await waitGameProcess(process, "You need to agree to the EULA in order to run the server. Go to eula.txt for more info.");
        });
    });
});
