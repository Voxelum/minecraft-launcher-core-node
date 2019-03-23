import * as assert from "assert";
import { spawn } from "child_process";
import * as path from "path";
import { Auth, Launcher, Version } from "../index";

describe("Launch", () => {
    describe("Generate Command", function() {
        it("should generate correct command", async function() {
            const javaPath = "/test/java";
            const version = "1.12.2";
            const gamePath = this.gameDirectory;
            const auth = Auth.offline("tester");
            const args = await Launcher.generateArguments({
                version, gamePath, javaPath, auth,
            });
            assert.equal(args[0], javaPath);
            assert(args.indexOf("net.minecraft.client.main.Main") !== -1);
            assert.equal(args[args.indexOf("--username") + 1], auth.selectedProfile.name);
            assert.equal(args[args.indexOf("--uuid") + 1], auth.selectedProfile.id.replace(/-/g, ""));
            assert.equal(args[args.indexOf("--version") + 1], version);
            assert.equal(args[args.indexOf("--gameDir") + 1], path.resolve(gamePath));
            assert.equal(args[args.indexOf("--assetsDir") + 1], path.resolve(gamePath, "assets"));
        });
        it("should generate default user", async function() {
            const args = await Launcher.generateArguments({
                version: "1.12.2", gamePath: this.gameDirectory, javaPath: "/test/java",
            });
            assert(args.indexOf("net.minecraft.client.main.Main") !== -1);
            assert.equal(args[args.indexOf("--username") + 1], "Steve");
            assert(args[args.indexOf("--uuid") + 1]);
        });
        it("should generate correct command with server", async function() {
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
    describe("Launching Game", function() {
        let javaPath: string;
        before(function() {
            if (process.env.JAVA_HOME) {
                javaPath = `${process.env.JAVA_HOME}/bin/java`;
            } else {
                this.skip();
            }
        });

        it("should launch normal minecraft", async function() {
            const option = { version: "1.12.2", gamePath: this.gameDirectory, javaPath };
            const proc = await Launcher.launch(option);
            await new Promise((resol, rej) => {
                proc.stdout.on("data", (chunk) => {
                    const str = chunk.toString();
                    if (str.indexOf("[Client thread/INFO]: Created: 1024x512 textures-atlas") !== -1) {
                        proc.kill("SIGINT");
                    }
                });
                proc.stderr.on("data", (chunk) => {
                    console.log(chunk.toString());
                });
                proc.on("exit", (code, signal) => {
                    if (signal === "SIGINT") {
                        resol();
                    } else { rej({ code, signal }); }
                });
            });
        }).timeout(100000);
        it("should launch server", async function() {
            const option: Launcher.Option = {
                version: "1.12.2", gamePath: this.gameDirectory, javaPath, server: {
                    ip: "127.0.0.1",
                    port: 25565,
                },
            };
            const proc = await Launcher.launch(option);
            await new Promise((resol, rej) => {
                proc.stdout.on("data", (chunk) => {
                    const str = chunk.toString();
                    if (str.indexOf("[Client thread/INFO]: Connecting to 127.0.0.1, 25565") !== -1) {
                        proc.kill("SIGINT");
                    }
                });
                proc.stderr.on("data", (chunk) => {
                    console.log(chunk.toString());
                });
                proc.on("exit", (code, signal) => {
                    if (signal === "SIGINT") {
                        resol();
                    } else { rej({ code, signal }); }
                });
            });
        }).timeout(100000);
        it("should launch forge minecraft", async function() {
            const option = { version: "1.12.2-forge1.12.2-14.23.2.2611", gamePath: this.gameDirectory, javaPath };
            const proc = await Launcher.launch(option);
            await new Promise((resol, rej) => {
                proc.stdout.on("data", (chunk) => {
                    const str = chunk.toString();
                    if (str.indexOf("[main/INFO] [FML]: Itemstack injection complete") !== -1) {
                        proc.kill("SIGINT");
                    }
                    // console.log(chunk.toString())
                });
                proc.stderr.on("data", (chunk) => {
                    console.log(chunk.toString());
                });
                proc.on("exit", (code, signal) => {
                    if (signal === "SIGINT") {
                        resol();
                    } else { rej({ code, signal }); }
                });
            });
        }).timeout(100000);
        it("should launch liteloader minecraft", async function() {
            const option = { version: "1.12.2-Liteloader1.12.2-1.12.2-SNAPSHOT", gamePath: this.gameDirectory, javaPath };
            const proc = await Launcher.launch(option);
            await new Promise((resol, rej) => {
                const out: string[] = [];
                proc.stdout.on("data", (chunk) => {
                    const str = chunk.toString();
                    out.push(str);
                    if (str.indexOf("LiteLoader begin POSTINIT") !== -1) {
                        proc.kill("SIGINT");
                    }
                });
                proc.stderr.on("data", (chunk) => {
                    out.push(chunk.toString());
                });
                proc.on("exit", (code, signal) => {
                    if (signal === "SIGINT") {
                        resol();
                    } else { rej({ code, signal }); }
                });
            });
        }).timeout(100000);

        it("should launch forge liteloader minecraft", async function() {
            const option = { version: "1.12.2-forge1.12.2-14.23.2.2611-Liteloader1.12.2-1.12.2-SNAPSHOT", gamePath: this.gameDirectory, javaPath };
            const proc = await Launcher.launch(option);
            await new Promise((resol, rej) => {
                let foundLite = false;
                let foundForge = false;
                const out: string[] = [];
                proc.stdout.on("data", (chunk) => {
                    const str = chunk.toString();
                    out.push(str);
                    if (str.indexOf("LiteLoader begin POSTINIT") !== -1) { foundLite = true; }
                    if (str.indexOf("[main/INFO] [FML]: Itemstack injection complete") !== -1) { foundForge = true; }
                    if (foundForge && foundLite) {
                        proc.kill("SIGINT");
                    }
                });
                proc.stderr.on("data", (chunk) => {
                    out.push(chunk.toString());
                });
                proc.on("exit", (code, signal) => {
                    if (signal === "SIGINT") {
                        resol();
                    } else { rej({ code, signal, log: out }); }
                });
            });
        }).timeout(100000);
    });
});
