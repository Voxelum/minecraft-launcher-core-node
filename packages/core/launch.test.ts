import { MinecraftFolder } from "./folder";
import assert from "assert";
import { ChildProcess, exec, spawnSync } from "child_process";
import { existsSync } from "fs";
import { EOL } from "os";
import * as path from "path";
import { DEFAULT_EXTRA_JVM_ARGS, LaunchOption, LaunchPrecheck, generateArguments, generateArgumentsServer, launch, launchServer } from "./launch";
import { Version } from "./version";

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
    return new Promise((resolve, reject) => {
        process.stdout!!.on("data", (chunk) => {
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
        process.stderr!!.on("data", (chunk) => {
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

const IN_CI = process.env.CI || process.env.GITHUB_WORKFLOW;

describe("Launcher", () => {
    const root = path.normalize(path.join(__dirname, "..", "..", "temp"));
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

    describe("#generateArgumentsServer", () => {
        test("should generate command arguments", async () => {
            const args = await generateArgumentsServer({
                javaPath: "/test/java",
                path: root,
                version: "1.7.10",
            });
            assert(args);
            expect(args[0]).toEqual("/test/java");
        });
    });
    // describe("#ensureLibraries", () => {
    //     test("should check all libraries", async () => {
    //         await expect(PrecheckService.ensureLibraries(MinecraftFolder.from(root),
    //             await Version.parse(root, "1.7.10")))
    //             .resolves
    //             .toBeUndefined();
    //     });
    // });
    describe.skip("#launchServer", () => {
        test("should launch server", async () => {
            const proc = await launchServer({
                javaPath,
                path: root,
                version: "1.12.2",
            });
            await new Promise((resolve, reject) => {
                proc.stdout!!.on("data", (buf) => {
                    const str = buf.toString();
                    console.warn(str);
                    if (str.indexOf("Starting minecraft server version 1.12.2") !== -1) {
                        resolve();
                    }
                });
            });
            proc.kill();
        });
    });

    describe("#generateArguments", () => {
        test("should throw error if the version is empty", async () => {
            await expect(generateArguments({} as any))
                .rejects
                .toEqual(new Error("Version cannot be null!"));
        });
        test("should generate correct command for 1.7.10 with forge", async () => {
            const jPath = "/test/java";
            const version = "1.7.10-Forge10.13.3.1400-1.7.10";
            const gamePath = root;
            const args = await generateArguments({
                version,
                gamePath,
                javaPath: jPath,
                userType: "mojang",
                accessToken: "accessToken",
                gameProfile: {
                    id: "profileId",
                    name: "username",
                },
                launcherBrand: "launcherVersion",
                launcherName: "launcherName",
            });
            expect(args[0]).toEqual(jPath);
            expect(args.indexOf("net.minecraft.launchwrapper.Launch")).not.toEqual(-1);
            expect(args[args.indexOf("--username") + 1]).toEqual("username");
            expect(args[args.indexOf("--uuid") + 1]).toEqual("profileId");
            expect(args[args.indexOf("--version") + 1]).toEqual("1.7.10-Forge10.13.3.1400-1.7.10");
            expect(args[args.indexOf("--gameDir") + 1]).toEqual(path.resolve(gamePath));
            expect(args[args.indexOf("--assetsDir") + 1]).toEqual(path.resolve(gamePath, "assets"));
            const lversion = args.find((a) => a.startsWith("-Dminecraft.launcher.version"));
            expect(lversion).toEqual("-Dminecraft.launcher.version=launcherVersion");
            const lname = args.find((a) => a.startsWith("-Dminecraft.launcher.brand"));
            expect(lname).toEqual("-Dminecraft.launcher.brand=launcherName");
        });

        test("should generate correct command for 1.14.4 with forge", async () => {
            const jPath = "/test/java";
            const version = "1.14.4-forge-28.0.45";
            const gamePath = root;
            const args = await generateArguments({
                version, gamePath, javaPath: jPath,
                launcherBrand: "launcherVersion",
                launcherName: "launcherName",
                gameProfile: {
                    id: "userid",
                    name: "username",
                }
            });
            expect(args[0]).toEqual(jPath);
            expect(args.indexOf("cpw.mods.modlauncher.Launcher")).not.toEqual(-1);
            expect(args[args.indexOf("--username") + 1]).toEqual("username");
            expect(args[args.indexOf("--uuid") + 1]).toEqual("userid");
            expect(args[args.indexOf("--version") + 1]).toEqual("1.14.4-forge-28.0.45");
            expect(args[args.indexOf("--gameDir") + 1]).toEqual(path.resolve(gamePath));
            expect(args[args.indexOf("--assetsDir") + 1]).toEqual(path.resolve(gamePath, "assets"));
            const lversion = args.find((a) => a.startsWith("-Dminecraft.launcher.version"));
            expect(lversion).toEqual("-Dminecraft.launcher.version=launcherVersion");
            const lname = args.find((a) => a.startsWith("-Dminecraft.launcher.brand"));
            expect(lname).toEqual("-Dminecraft.launcher.brand=launcherName");
        });

        test("should generate correct command", async () => {
            const jPath = "/test/java";
            const version = "1.14.4";
            const gamePath = root;
            const args = await generateArguments({
                version, gamePath, javaPath: jPath,
                gameProfile: {
                    id: "id",
                    name: "name",
                },
                launcherBrand: "launcherVersion",
                launcherName: "launcherName",
                server: { ip: "localhost", port: 10 },
                minMemory: 10,
                maxMemory: 20,
                ignoreInvalidMinecraftCertificates: true,
                ignorePatchDiscrepancies: true,
                extraJVMArgs: ["hello"],
                extraMCArgs: ["Minecraft!"]
            });
            expect(args[0]).toEqual(jPath);
            expect(args.indexOf("net.minecraft.client.main.Main")).not.toEqual(-1);
            expect(args[args.indexOf("--username") + 1]).toEqual("name");
            expect(args[args.indexOf("--uuid") + 1]).toEqual("id");
            expect(args[args.indexOf("--version") + 1]).toEqual(version);
            expect(args[args.indexOf("--gameDir") + 1]).toEqual(path.resolve(gamePath));
            expect(args[args.indexOf("--assetsDir") + 1]).toEqual(path.resolve(gamePath, "assets"));
            expect(args.indexOf("-Xms10M") !== -1).toBeTruthy();
            expect(args.indexOf("-Xmx20M") !== -1).toBeTruthy();
            expect(args.indexOf("-Dfml.ignoreInvalidMinecraftCertificates=true") !== -1).toBeTruthy();
            expect(args.indexOf("-Dfml.ignorePatchDiscrepancies=true") !== -1).toBeTruthy();
            expect(args.indexOf("hello") + 1).toEqual(args.indexOf("net.minecraft.client.main.Main"));
            expect(args.indexOf("Minecraft!")).toBeGreaterThan(args.indexOf("net.minecraft.client.main.Main"));
            expect(args[args.indexOf("--server") + 1]).toEqual("localhost");
            expect(args[args.indexOf("--port") + 1]).toEqual("10");

            expect(args.find((a) => a.startsWith("-Dminecraft.launcher.version")))
                .toEqual("-Dminecraft.launcher.version=launcherVersion");
            expect(args.find((a) => a.startsWith("-Dminecraft.launcher.brand")))
                .toEqual("-Dminecraft.launcher.brand=launcherName");
        });
        test("should use default jvm arguments", async () => {
            const jPath = "/test/java";
            const version = "1.14.4";
            const gamePath = root;
            const args = await generateArguments({
                version, gamePath, javaPath: jPath,
                gameProfile: {
                    id: "id",
                    name: "name",
                },
                launcherBrand: "launcherVersion",
                launcherName: "launcherName",
                server: { ip: "localhost", port: 10 },
                minMemory: 10,
                maxMemory: 20,
                ignoreInvalidMinecraftCertificates: true,
                ignorePatchDiscrepancies: true,
                extraJVMArgs: ["hello"],
                extraMCArgs: ["Minecraft!"]
            });
            expect(DEFAULT_EXTRA_JVM_ARGS.every((a) => args.indexOf(a) !== -1));
        });
        test("should genearte correct command for partial resolution", async () => {
            let args = await generateArguments({
                version: "1.14.4",
                gamePath: root,
                javaPath: "/test/java",
                resolution: {
                    height: 10,
                },
            });
            expect(args.indexOf("net.minecraft.client.main.Main")).not.toBe(-1);
            expect(args[args.indexOf("--height") + 1]).toEqual("10");

            args = await generateArguments({
                version: "1.14.4",
                gamePath: root,
                javaPath: "/test/java",
                resolution: {
                    width: 10,
                },
            });
            expect(args.indexOf("net.minecraft.client.main.Main")).not.toBe(-1);
            expect(args[args.indexOf("--width") + 1]).toEqual("10");
        });
        test("should genearte correct command for fullscreen", async () => {
            const args = await generateArguments({
                version: "1.14.4",
                gamePath: root,
                javaPath: "/test/java",
                resolution: {
                    fullscreen: true,
                },
            });
            expect(args.indexOf("net.minecraft.client.main.Main")).not.toBe(-1);
            expect(args.indexOf("--fullscreen"))
        });
        test("should generate default user", async () => {
            const args = await generateArguments({
                version: "1.14.4", gamePath: root, javaPath: "/test/java",
            });
            expect(args.indexOf("net.minecraft.client.main.Main")).not.toBe(-1);
            expect(args[args.indexOf("--username") + 1]).toEqual("Steve");
            // expect(args[args.indexOf("--uuid") + 1]);
        });
        test("should generate correct command with server", async () => {
            const server = {
                ip: "127.0.0.1",
            };
            const args = await generateArguments({
                version: "1.14.4", gamePath: root, javaPath: "/test/java", server,
            });
            expect(args[args.indexOf("--server") + 1]).toEqual(server.ip);
        });
        test("should generate correct command with server with port", async () => {
            const server = {
                ip: "127.0.0.1",
                port: 25565,
            };
            const args = await generateArguments({
                version: "1.14.4", gamePath: root, javaPath: "/test/java", server,
            });
            expect(args[args.indexOf("--server") + 1]).toEqual(server.ip);
            expect(args[args.indexOf("--port") + 1]).toEqual(server.port.toString());
        });
    });
    describe("#ensureNative", () => {
        test("should be able to extract natives 1.14.4", async () => {
            const loc = new MinecraftFolder(root);
            const ver = await Version.parse(loc, "1.14.4");
            const nativeRoot = loc.getNativesRoot(ver.id);
            await LaunchPrecheck.checkNatives(loc, ver, {} as any);
            expect(existsSync(path.join(nativeRoot, ".json")));
            await LaunchPrecheck.checkNatives(loc, ver, {} as any);
        });
        test("should be able to extract natives 1.13.2", async () => {
            const loc = new MinecraftFolder(root);
            const ver = await Version.parse(loc, "1.13.2");
            await LaunchPrecheck.checkNatives(loc, ver, {} as any);
        });
    });
    describe.skip("#launch", () => {
        describe("1.17.10", () => {
            let t = test;
            if ((javaVersion && javaVersion > 8) || !javaPath) { t = test.skip; }
            t("should launch with forge", async () => {
                const option: LaunchOption = { version: "1.7.10-Forge10.13.3.1400-1.7.10", gamePath: root, javaPath };
                await waitGameProcess(await launch(option), "OpenAL initialized.");
            });
        });

        describe("1.12.2", () => {
            let t = test;
            if ((javaVersion && javaVersion > 8) || !javaPath) { t = test.skip; }
            t("should launch normal minecraft", async () => {
                const option: LaunchOption = { version: "1.12.2", gamePath: root, javaPath };
                await waitGameProcess(await launch(option), "[Client thread/INFO]: Created: 1024x512 textures-atlas");
            });
            t("should launch server", async () => {
                const option: LaunchOption = {
                    version: "1.12.2", gamePath: root, javaPath, server: {
                        ip: "127.0.0.1",
                        port: 25565,
                    },
                };
                await waitGameProcess(await launch(option), "[Client thread/INFO]: Connecting to 127.0.0.1, 25565");
            });
            t("should launch forge minecraft", async () => {
                const option: LaunchOption = { version: "1.12.2-forge1.12.2-14.23.5.2823", gamePath: root, javaPath };
                await waitGameProcess(await launch(option), "[main/INFO] [FML]:");
            });
            t("should launch liteloader minecraft", async () => {
                const option: LaunchOption = { version: "1.12.2-Liteloader1.12.2-1.12.2-SNAPSHOT", gamePath: root, javaPath };
                await waitGameProcess(await launch(option), "LiteLoader begin POSTINIT");
            });
            t("should launch forge liteloader minecraft", async () => {
                const option: LaunchOption = { version: "1.12.2-forge1.12.2-14.23.5.2823-Liteloader1.12.2-1.12.2-SNAPSHOT", gamePath: root, javaPath };
                await waitGameProcess(await launch(option), "LiteLoader begin POSTINIT", "[main/INFO] [FML]:");
            });
        });

        describe("1.13.2", () => {
            let t = test;
            if (!javaPath) { t = test.skip; }
            t("should launch normal minecraft", async () => {
                const option: LaunchOption = { version: "1.13.2", gamePath: root, javaPath };
                await waitGameProcess(await launch(option), "[Client thread/INFO]: Created: 1024x512 textures-atlas");
            });
        });
        describe("1.14.4", () => {
            let t = test;
            if (!javaPath) { t = test.skip; }
            t("should launch normal minecraft", async () => {
                const option: LaunchOption = { version: "1.14.4", gamePath: root, javaPath };
                await waitGameProcess(await launch(option), "[Client thread/INFO]: OpenAL initialized");
            });
        });
        describe("1.15.2", () => {
            let t = test;
            if (!javaPath) { t = test.skip; }
            t("should launch normal minecraft", async () => {
                const option: LaunchOption = { version: "1.15.2", gamePath: root, javaPath };
                await waitGameProcess(await launch(option), "OpenAL initialized.");
            });
        });
    });
    describe.skip("#launchServer", () => {
        test("should launch 1.12.2", async () => {
            const process = await launchServer({
                version: "1.12.2",
                path: root,
                javaPath,
                cwd: path.resolve(".")
            })
            await waitGameProcess(process, "You need to agree to the EULA in order to run the server. Go to eula.txt for more info.");
        });
    });
});
