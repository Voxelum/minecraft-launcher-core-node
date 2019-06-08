import * as assert from "assert";
import { ChildProcess, exec } from "child_process";
import { EOL } from "os";
import * as path from "path";
import { Auth, Launcher, Version } from "../index";
import { MinecraftFolder } from "../libs/utils/folder";

function getJavaVersion(javaPath: string) {
    return new Promise<number>((resolve, reject) => {
        exec(`"${javaPath}" -version`, { encoding: "utf8" }, (e, out, err) => {
            if (e) {
                reject(e);
            } else {
                if (err) {
                    const line = err.split(EOL)[0];
                    console.log(line);
                    if (err.startsWith("java version")) {
                        const strNumber = line.split(" ")[2].split(".")[0];
                        resolve(Number.parseInt(strNumber.replace(/[^0-9]/g, ""), 10));
                    } else {
                        resolve(Number.parseInt(line.split(" ")[1].split(".")[0], 10));
                    }
                } else {
                    reject(out);
                }
            }
        });
    });
}

function waitGameProcess(process: ChildProcess, ...hints: string[]) {
    const found = new Array<boolean>(hints.length);
    found.fill(false);
    return new Promise((resolve, reject) => {
        process.stdout.on("data", (chunk) => {
            const content = chunk.toString();
            console.log(content);
            for (let i = 0; i < hints.length; i++) {
                if (content.indexOf(hints[i]) !== -1) {
                    found[i] = true;
                }
            }
            if (found.every((f) => f)) {
                process.kill("SIGINT");
            }
        });
        process.stderr.on("data", (chunk) => {
            console.log(chunk.toString());
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
    describe("#generateArgumentsServer", function () {
        it("should generate command arguments", async function () {
            const args = await Launcher.generateArgumentsServer({
                javaPath: "/test/java",
                path: this.gameDirectory,
                version: "1.12.2",
            });
            assert(args);
            assert.equal(args[0], "/test/java");
        });
    });
    describe("#launchServer", function () {
        let javaPath: string;
        let javaVersion;
        before(async function () {
            if (process.env.JAVA_HOME) {
                javaPath = `${process.env.JAVA_HOME}/bin/java`;
                if (process.env.ENV && process.env.ENV === "TRAVIS") {
                    this.skip();
                } else {
                    javaVersion = await getJavaVersion(javaPath);
                }
            } else {
                try {
                    javaPath = "java";
                    javaVersion = await getJavaVersion(javaPath);
                } catch {
                    this.skip();
                }
            }
        });
        it("should launch server", async function () {
            const proc = await Launcher.launchServer({
                javaPath,
                path: this.gameDirectory,
                version: "1.12.2",
            });
            await new Promise((resolve, reject) => {
                proc.stdout.on("data", (buf) => {
                    const str = buf.toString();
                    console.log(str);
                    if (str.indexOf("Starting minecraft server version 1.12.2") !== -1) {
                        resolve();
                    }
                });
            });
            proc.kill();
        }).timeout(10000000);
    });

    describe("#generateArguments", function () {
        it("should generate correct command", async function () {
            const javaPath = "/test/java";
            const version = "1.12.2";
            const gamePath = this.gameDirectory;
            const auth = Auth.offline("tester");
            const args = await Launcher.generateArguments({
                version, gamePath, javaPath, auth,
                launcherBrand: "launcherVersion",
                launcherName: "launcherName",
            });
            assert.equal(args[0], javaPath);
            assert(args.indexOf("net.minecraft.client.main.Main") !== -1);
            assert.equal(args[args.indexOf("--username") + 1], auth.selectedProfile.name);
            assert.equal(args[args.indexOf("--uuid") + 1], auth.selectedProfile.id.replace(/-/g, ""));
            assert.equal(args[args.indexOf("--version") + 1], version);
            assert.equal(args[args.indexOf("--gameDir") + 1], path.resolve(gamePath));
            assert.equal(args[args.indexOf("--assetsDir") + 1], path.resolve(gamePath, "assets"));
            const lversion = args.find((a) => a.startsWith("-Dminecraft.launcher.version"));
            assert.equal(lversion, `-Dminecraft.launcher.version=launcherVersion`);
            const lname = args.find((a) => a.startsWith("-Dminecraft.launcher.brand"));
            assert.equal(lname, "-Dminecraft.launcher.brand=launcherName");
        });
        it("should generate default user", async function () {
            const args = await Launcher.generateArguments({
                version: "1.12.2", gamePath: this.gameDirectory, javaPath: "/test/java",
            });
            assert(args.indexOf("net.minecraft.client.main.Main") !== -1);
            assert.equal(args[args.indexOf("--username") + 1], "Steve");
            assert(args[args.indexOf("--uuid") + 1]);
        });
        it("should generate correct command with server", async function () {
            const server = {
                ip: "127.0.0.1",
                port: 25565,
            };
            const args = await Launcher.generateArguments({
                version: "1.12.2", gamePath: this.gameDirectory, javaPath: "/test/java", server,
            });
            assert.equal(args[args.indexOf("--server") + 1], server.ip);
            assert.equal(args[args.indexOf("--port") + 1], server.port.toString());
        });
    });
    it("should be able to extract natives", async function () {
        const loc = new MinecraftFolder(this.gameDirectory);
        const ver = await Version.parse(loc, "1.13.2");
        await Launcher.ensureNative(loc, ver);
    });
    describe("#launch", function () {
        let javaPath: string;
        let javaVersion: number;
        before(async function () {
            if (process.env.JAVA_HOME) {
                javaPath = `${process.env.JAVA_HOME}/bin/java`;
                if (process.env.ENV && process.env.ENV === "TRAVIS") {
                    this.skip();
                } else {
                    javaVersion = await getJavaVersion(javaPath);
                }
            } else {
                try {
                    javaPath = "java";
                    javaVersion = await getJavaVersion(javaPath);
                } catch {
                    this.skip();
                }
            }
            console.log(javaPath, javaVersion);
        });

        describe("1.12.2", function () {
            it("should launch normal minecraft", async function () {
                const option = { version: "1.12.2", gamePath: this.gameDirectory, javaPath };
                await waitGameProcess(await Launcher.launch(option), "[Client thread/INFO]: Created: 1024x512 textures-atlas");
            }).timeout(100000);
            it("should launch server", async function () {
                const option: Launcher.Option = {
                    version: "1.12.2", gamePath: this.gameDirectory, javaPath, server: {
                        ip: "127.0.0.1",
                        port: 25565,
                    },
                };
                await waitGameProcess(await Launcher.launch(option), "[Client thread/INFO]: Connecting to 127.0.0.1, 25565");
            }).timeout(100000);
            it("should launch forge minecraft", async function () {
                if (javaVersion > 8) { this.skip(); }
                const option = { version: "1.12.2-forge1.12.2-14.23.5.2823", gamePath: this.gameDirectory, javaPath };
                await waitGameProcess(await Launcher.launch(option), "[main/INFO] [FML]: Itemstack injection complete");
            }).timeout(100000);
            it("should launch liteloader minecraft", async function () {
                if (javaVersion > 8) { this.skip(); }
                const option = { version: "1.12.2-Liteloader1.12.2-1.12.2-SNAPSHOT", gamePath: this.gameDirectory, javaPath };
                await waitGameProcess(await Launcher.launch(option), "LiteLoader begin POSTINIT");
            }).timeout(100000);

            it("should launch forge liteloader minecraft", async function () {
                if (javaVersion > 8) { this.skip(); }
                const option = { version: "1.12.2-forge1.12.2-14.23.5.2823-Liteloader1.12.2-1.12.2-SNAPSHOT", gamePath: this.gameDirectory, javaPath };
                await waitGameProcess(await Launcher.launch(option), "LiteLoader begin POSTINIT", "[main/INFO] [FML]: Itemstack injection complete");
            }).timeout(100000);
        });

        describe("1.13.2", function () {
            it("should launch normal minecraft", async function () {
                const option = { version: "1.13.2", gamePath: this.gameDirectory, javaPath };
                await waitGameProcess(await Launcher.launch(option), "[Client thread/INFO]: Created: 1024x512 textures-atlas");
            }).timeout(100000);
        });
        describe("1.14.2", function () {
            it("should launch normal minecraft", async function () {
                const option = { version: "1.14.2", gamePath: this.gameDirectory, javaPath };
                await waitGameProcess(await Launcher.launch(option), "[Client thread/INFO]: Built for minecraft version 1.14.2");
            }).timeout(100000);
        });
    });
});
