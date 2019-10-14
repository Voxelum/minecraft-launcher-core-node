import Auth from "@xmcl/auth";
import { MinecraftFolder } from "@xmcl/util";
import Version from "@xmcl/version";
import assert from "assert";
import { ChildProcess, exec } from "child_process";
import { EOL } from "os";
import * as path from "path";
import Launcher from "./index";


function getJavaVersion(javaPath: string) {
    return new Promise<number>((resolve, reject) => {
        exec(`"${javaPath}" -version`, { encoding: "utf8" }, (e, out, err) => {
            if (e) {
                reject(e);
            } else {
                if (err) {
                    const line = err.split(EOL)[0];
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
            // console.log(content);
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
    const root = path.normalize(path.join(__dirname, "..", "..", "temp"));
    let javaPath: string;
    let javaVersion: number;
    let testOnJava: typeof test = test;
    let testOnOldJava: typeof test = test;

    jest.setTimeout(10000000);

    beforeAll(async function () {
        if (process.env.CI || process.env.GITHUB_WORKFLOW) {
            testOnJava = test.skip;
            testOnOldJava = test.skip;
            return;
        }
        if (process.env.JAVA_HOME) {
            javaPath = `${process.env.JAVA_HOME}/bin/java`;
            if (process.env.ENV && process.env.ENV === "TRAVIS") {
                testOnJava = test.skip;
            } else {
                javaVersion = await getJavaVersion(javaPath);
            }
        } else {
            try {
                javaPath = "java";
                javaVersion = await getJavaVersion(javaPath);
            } catch {
                testOnJava = test.skip;
            }
        }
        if (javaVersion > 8) {
            testOnOldJava = test.skip;
        }
        if (process.env.CI) {
            testOnJava = test.skip;
            testOnOldJava = test.skip;
        }
    });
    describe("#generateArgumentsServer", () => {
        testOnJava("should generate command arguments", async () => {
            const args = await Launcher.generateArgumentsServer({
                javaPath: "/test/java",
                path: root,
                version: "1.7.10",
            });
            assert(args);
            expect(args[0]).toEqual("/test/java");
        });
    });
    describe("#ensureLibraries", () => {
        test("should check all libraries", async () => {
            await expect(Launcher.ensureLibraries(new MinecraftFolder(root),
                await Version.parse(root, "1.7.10")))
                .resolves
                .toBeUndefined();
        });
    });
    describe.skip("#launchServer", () => {
        testOnJava("should launch server", async () => {
            const proc = await Launcher.launchServer({
                javaPath,
                path: root,
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
        });
    });

    describe("#generateArguments", () => {
        test(
            "should generate correct command for 1.7.10 with forge",
            async () => {
                const jPath = "/test/java";
                const version = "1.7.10-Forge10.13.3.1400-1.7.10";
                const gamePath = root;
                const auth = Auth.offline("tester");
                const args = await Launcher.generateArguments({
                    version, gamePath, javaPath: jPath, auth,
                    launcherBrand: "launcherVersion",
                    launcherName: "launcherName",
                });
                expect(args[0]).toEqual(jPath);
                expect(args.indexOf("net.minecraft.launchwrapper.Launch")).not.toEqual(-1);
                expect(args[args.indexOf("--username") + 1]).toEqual(auth.selectedProfile.name);
                expect(args[args.indexOf("--uuid") + 1]).toEqual(auth.selectedProfile.id.replace(/-/g, ""));
                expect(args[args.indexOf("--version") + 1]).toEqual("1.7.10-Forge10.13.3.1400-1.7.10");
                expect(args[args.indexOf("--gameDir") + 1]).toEqual(path.resolve(gamePath));
                expect(args[args.indexOf("--assetsDir") + 1]).toEqual(path.resolve(gamePath, "assets"));
                const lversion = args.find((a) => a.startsWith("-Dminecraft.launcher.version"));
                expect(lversion).toEqual(`-Dminecraft.launcher.version=launcherVersion`);
                const lname = args.find((a) => a.startsWith("-Dminecraft.launcher.brand"));
                expect(lname).toEqual("-Dminecraft.launcher.brand=launcherName");
            },
        );

        test(
            "should generate correct command for 1.14.4 with forge",
            async () => {
                const jPath = "/test/java";
                const version = "1.14.4-forge-28.0.45";
                const gamePath = root;
                const auth = Auth.offline("tester");
                const args = await Launcher.generateArguments({
                    version, gamePath, javaPath: jPath, auth,
                    launcherBrand: "launcherVersion",
                    launcherName: "launcherName",
                });
                expect(args[0]).toEqual(jPath);
                expect(args.indexOf("cpw.mods.modlauncher.Launcher")).not.toEqual(-1);
                expect(args[args.indexOf("--username") + 1]).toEqual(auth.selectedProfile.name);
                expect(args[args.indexOf("--uuid") + 1]).toEqual(auth.selectedProfile.id.replace(/-/g, ""));
                expect(args[args.indexOf("--version") + 1]).toEqual("1.14.4-forge-28.0.45");
                expect(args[args.indexOf("--gameDir") + 1]).toEqual(path.resolve(gamePath));
                expect(args[args.indexOf("--assetsDir") + 1]).toEqual(path.resolve(gamePath, "assets"));
                const lversion = args.find((a) => a.startsWith("-Dminecraft.launcher.version"));
                expect(lversion).toEqual(`-Dminecraft.launcher.version=launcherVersion`);
                const lname = args.find((a) => a.startsWith("-Dminecraft.launcher.brand"));
                expect(lname).toEqual("-Dminecraft.launcher.brand=launcherName");
            },
        );

        test("should generate correct command", async () => {
            const jPath = "/test/java";
            const version = "1.14.4";
            const gamePath = root;
            const auth = Auth.offline("tester");
            const args = await Launcher.generateArguments({
                version, gamePath, javaPath: jPath, auth,
                launcherBrand: "launcherVersion",
                launcherName: "launcherName",
            });
            expect(args[0]).toEqual(jPath);
            expect(args.indexOf("net.minecraft.client.main.Main")).not.toEqual(-1);
            expect(args[args.indexOf("--username") + 1]).toEqual(auth.selectedProfile.name);
            expect(args[args.indexOf("--uuid") + 1]).toEqual(auth.selectedProfile.id.replace(/-/g, ""));
            expect(args[args.indexOf("--version") + 1]).toEqual(version);
            expect(args[args.indexOf("--gameDir") + 1]).toEqual(path.resolve(gamePath));
            expect(args[args.indexOf("--assetsDir") + 1]).toEqual(path.resolve(gamePath, "assets"));
            expect(args.find((a) => a.startsWith("-Dminecraft.launcher.version")))
                .toEqual(`-Dminecraft.launcher.version=launcherVersion`);
            expect(args.find((a) => a.startsWith("-Dminecraft.launcher.brand")))
                .toEqual("-Dminecraft.launcher.brand=launcherName");
        });
        test("should generate default user", async () => {
            const args = await Launcher.generateArguments({
                version: "1.14.4", gamePath: root, javaPath: "/test/java",
            });
            expect(args.indexOf("net.minecraft.client.main.Main")).not.toBe(-1);
            expect(args[args.indexOf("--username") + 1]).toEqual("Steve");
            // expect(args[args.indexOf("--uuid") + 1]);
        });
        test("should generate correct command with server", async () => {
            const server = {
                ip: "127.0.0.1",
                port: 25565,
            };
            const args = await Launcher.generateArguments({
                version: "1.14.4", gamePath: root, javaPath: "/test/java", server,
            });
            expect(args[args.indexOf("--server") + 1]).toEqual(server.ip);
            expect(args[args.indexOf("--port") + 1]).toEqual(server.port.toString());
        });
    });
    // test("should be able to extract natives", async () => {
    //     const loc = new MinecraftFolder(root);
    //     const ver = await Version.parse(loc, "1.13.2");
    //     await Launcher.ensureNative(loc, ver);
    // });
    describe.skip("#launch", () => {
        describe("1.17.10", () => {
            testOnJava("should launch with forge", async () => {
                const option = { version: "1.7.10-Forge10.13.3.1400-1.7.10", gamePath: root, javaPath };
                await waitGameProcess(await Launcher.launch(option), "OpenAL initialized.");
            });
        });

        describe("1.12.2", () => {
            testOnJava("should launch normal minecraft", async () => {
                const option = { version: "1.12.2", gamePath: root, javaPath };
                await waitGameProcess(await Launcher.launch(option), "[Client thread/INFO]: Created: 1024x512 textures-atlas");
            });
            testOnJava("should launch server", async () => {
                const option: Launcher.Option = {
                    version: "1.12.2", gamePath: root, javaPath, server: {
                        ip: "127.0.0.1",
                        port: 25565,
                    },
                };
                await waitGameProcess(await Launcher.launch(option), "[Client thread/INFO]: Connecting to 127.0.0.1, 25565");
            });
            testOnOldJava("should launch forge minecraft", async () => {
                const option = { version: "1.12.2-forge1.12.2-14.23.5.2823", gamePath: root, javaPath };
                await waitGameProcess(await Launcher.launch(option), "[main/INFO] [FML]: Itemstack injection complete");
            });
            testOnOldJava("should launch liteloader minecraft", async () => {
                const option = { version: "1.12.2-Liteloader1.12.2-1.12.2-SNAPSHOT", gamePath: root, javaPath };
                await waitGameProcess(await Launcher.launch(option), "LiteLoader begin POSTINIT");
            });
            testOnOldJava("should launch forge liteloader minecraft", async () => {
                const option = { version: "1.12.2-forge1.12.2-14.23.5.2823-Liteloader1.12.2-1.12.2-SNAPSHOT", gamePath: root, javaPath };
                await waitGameProcess(await Launcher.launch(option), "LiteLoader begin POSTINIT", "[main/INFO] [FML]: Itemstack injection complete");
            });
        });

        describe("1.13.2", () => {
            testOnJava("should launch normal minecraft", async () => {
                const option = { version: "1.13.2", gamePath: root, javaPath };
                await waitGameProcess(await Launcher.launch(option), "[Client thread/INFO]: Created: 1024x512 textures-atlas");
            });
        });
        describe("1.14.4", () => {
            testOnJava("should launch normal minecraft", async () => {
                const option = { version: "1.14.4", gamePath: root, javaPath };
                await waitGameProcess(await Launcher.launch(option), "[Client thread/INFO]: Built for minecraft version 1.14.4");
            });
        });
    });
});
