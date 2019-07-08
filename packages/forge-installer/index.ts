import { Installer } from "@xmcl/installer";
import Task from "@xmcl/task";
import { computeChecksum, downloadFileWork, ensureDir, ensureFile, exists, got, MinecraftFolder, MinecraftLocation, multiChecksum, remove } from "@xmcl/util";
import { parseLibPath, ResolvedLibrary, resolveLibraries, Version } from "@xmcl/version";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { finished, Readable } from "stream";
import { promisify } from "util";
import { Entry, ZipFile } from "yauzl";
import { bufferEntry, createExtractStream, createParseStream, open, openEntryReadStream, parseEntries } from "yauzlw";

async function findMainClass(lib: string) {
    const zip = await open(lib, { lazyEntries: true, autoClose: false });
    const { "META-INF/MANIFEST.MF": manifest } = await parseEntries(zip, ["META-INF/MANIFEST.MF"]);
    let mainClass: string | undefined;
    if (manifest) {
        const content = await bufferEntry(zip, manifest).then((b) => b.toString());
        const mainClassPair = content.split("\n").map((l) => l.split(": ")).filter((arr) => arr[0] === "Main-Class")[0];
        if (mainClassPair) {
            mainClass = mainClassPair[1].trim();
        }
    }
    zip.close();
    return mainClass;
}

export namespace ForgeInstaller {
    export interface VersionMeta {
        installer: {
            md5: string;
            sha1: string;
            path: string;
        };
        universal: {
            md5: string;
            sha1: string;
            path: string;
        };
        mcversion: string;
        version: string;
    }

    export const DEFAULT_FORGE_MAVEN = "http://files.minecraftforge.net";

    interface LaunchProfile extends Version {
        data: {
            [key: string]: {
                client: string,
                server: string,
            },
        };
        processors: Array<{
            jar: string,
            classpath: string[],
            args: string[],
            outputs?: {
                [key: string]: string,
            },
        }>;
    }

    function installByInstallerTask(version: VersionMeta, minecraft: MinecraftLocation, maven: string, java: string, tempDir?: string, clearTempDir: boolean = true) {
        return async (context: Task.Context) => {
            const mc = typeof minecraft === "string" ? new MinecraftFolder(minecraft) : minecraft;
            const forgeVersion = `${version.mcversion}-${version.version}`;
            const fullVersion = `${version.mcversion}-forge${version.mcversion}-${version.version}`;

            const installerURLFallback = `${maven}/maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-installer.jar`;
            const installerURL = `${maven}${version.installer.path}`;

            function downloadInstallerTask(installer: string, dest: string) {
                return async (ctx: Task.Context) => {
                    let inStream;
                    if (fs.existsSync(dest)) {
                        const [md5, sha1] = await multiChecksum(dest, ["md5", "sha1"]);
                        if (md5 === version.installer.md5 && sha1 === version.installer.sha1) {
                            inStream = fs.createReadStream(dest);
                        }
                    }
                    if (!inStream) {
                        inStream = got.stream(installer, {
                            method: "GET",
                            headers: { connection: "keep-alive" },
                        }).on("error", () => { })
                            .on("downloadProgress", (progress) => { ctx.update(progress.transferred, progress.total as number); });

                        inStream.pipe(fs.createWriteStream(dest));
                    }

                    return inStream.pipe(createParseStream({ autoClose: false, lazyEntries: true }))
                        .promise();
                };
            }

            const temp = tempDir || await fs.promises.mkdtemp(mc.root + path.sep);
            if (!fs.existsSync(temp)) {
                await ensureDir(temp);
            }
            const installJar = path.join(temp, "forge-installer.jar");

            function processValue(v: string) {
                if (v.match(/^\[.+\]$/g)) {
                    const targetId = v.substring(1, v.length - 1);
                    return mc.getLibraryByPath(parseLibPath(targetId));
                }
                return v;
            }
            function processMapping(data: LaunchProfile["data"], m: string) {
                m = processValue(m);
                if (m.match(/^{.+}$/g)) {
                    const key = m.substring(1, m.length - 1);
                    m = data[key].client;
                }
                return m;
            }
            async function processVersionJson(s: Version) {
                const rootPath = mc.getVersionRoot(s.id);
                const jsonPath = path.join(rootPath, `${s.id}.json`);
                await ensureFile(jsonPath);
                await fs.promises.writeFile(jsonPath, JSON.stringify(s));
            }
            async function processExtract(s: Readable, p: string) {
                const file = path.join(temp, p);
                await ensureFile(file);
                await promisify(finished)(s.pipe(fs.createWriteStream(file)));
            }
            try {
                let zip: ZipFile;
                try {
                    zip = await context.execute("downloadInstaller", downloadInstallerTask(installerURL, installJar));
                } catch {
                    zip = await context.execute("downloadInstaller", downloadInstallerTask(installerURLFallback, installJar));
                }
                let profile!: LaunchProfile;
                let versionJson!: Version;
                await new Promise<void>((resolve, reject) => {
                    let foundProfile = false, foundBin = false, foundVersion = false, foundUniversal = false, foundForge = false;
                    const forgeEntry = `maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}.jar`;
                    const forgeUniversalEntry = `maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-universal.jar`;
                    const binEntry = "data/client.lzma";
                    zip.once("end", () => {
                        if (!foundProfile || !foundBin || !foundVersion || !foundUniversal || !foundForge) {
                            reject({ foundProfile, foundBin, foundVersion, foundUniversal, foundForge });
                        } else {
                            resolve();
                        }
                    });
                    zip.on("entry", (entry: Entry) => {
                        function shouldContinue() {
                            if (!foundProfile || !foundBin || !foundVersion || !foundUniversal || !foundForge) {
                                zip.readEntry();
                            } else {
                                zip.close();
                                resolve();
                            }
                        }
                        if (entry.fileName === "install_profile.json") {
                            bufferEntry(zip, entry).then((b) => b.toString()).then(JSON.parse).then((obj) => {
                                foundProfile = true;
                                profile = obj;
                                shouldContinue();
                            });
                        } else if (entry.fileName === "version.json") {
                            bufferEntry(zip, entry).then((b) => b.toString()).then(JSON.parse).then((obj) => {
                                foundVersion = true;
                                versionJson = obj;
                                return processVersionJson(versionJson);
                            }).then(() => {
                                shouldContinue();
                            });
                        } else if (entry.fileName === binEntry) {
                            openEntryReadStream(zip, entry).then((s) => processExtract(s, binEntry)).then(() => {
                                foundBin = true;
                                shouldContinue();
                            });
                        } else if (entry.fileName === forgeEntry) {
                            openEntryReadStream(zip, entry).then((s) => processExtract(s, forgeEntry)).then(() => {
                                foundForge = true;
                                shouldContinue();
                            });
                        } else if (entry.fileName === forgeUniversalEntry) {
                            openEntryReadStream(zip, entry).then((s) => processExtract(s, forgeUniversalEntry)).then(() => {
                                foundUniversal = true;
                                shouldContinue();
                            });
                        } else {
                            zip.readEntry();
                        }
                    });
                    zip.readEntry();
                });

                profile.data.MINECRAFT_JAR = {
                    client: mc.getVersionJar(version.mcversion),
                    server: "",
                };
                for (const key in profile.data) {
                    const value = profile.data[key];
                    value.client = processValue(value.client);
                    value.server = processValue(value.server);

                    if (key === "BINPATCH") {
                        value.client = path.join(temp, value.client);
                        value.server = path.join(temp, value.server);
                    }
                }
                for (const proc of profile.processors) {
                    proc.args = proc.args.map((a) => processMapping(profile.data, a));
                    if (proc.outputs) {
                        const replacedOutput: LaunchProfile["processors"][0]["outputs"] = {};
                        for (const key in proc.outputs) {
                            replacedOutput[processMapping(profile.data, key)] = processMapping(profile.data, proc.outputs[key]);
                        }
                        proc.outputs = replacedOutput;
                    }
                }

                function libRedirect(lib: ResolvedLibrary) {
                    if (lib.name.startsWith("net.minecraftforge:forge:")) {
                        return `file://${path.join(temp, "maven", lib.download.path)}`;
                    }
                    return undefined;
                }

                const parsedLibs = resolveLibraries([...profile.libraries, ...versionJson.libraries]);

                await context.execute("downloadLibraries", Installer.installLibrariesDirectTask(parsedLibs, mc, { libraryHost: libRedirect }).work);

                await context.execute("postProcessing", async (ctx) => {
                    ctx.update(0, profile.processors.length);
                    let i = 0;
                    for (const proc of profile.processors) {
                        const jarRealPath = mc.getLibraryByPath(parseLibPath(proc.jar));
                        const mainClass = await findMainClass(jarRealPath);
                        if (!mainClass) { throw new Error(`Cannot find main class for processor ${proc.jar}.`); }
                        const cp = [...proc.classpath, proc.jar].map(parseLibPath).map((p) => mc.getLibraryByPath(p)).join(path.delimiter);
                        const cmd = ["-cp", cp, mainClass, ...proc.args];

                        await new Promise<void>((resolve, reject) => {
                            const process = spawn(java, cmd, { cwd: tempDir });
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
                                // console.error(buf.toString("utf-8"));
                            });
                            process.stderr.setEncoding("utf-8");
                            process.stderr.on("data", (buf) => {
                                console.error(buf.toString("utf-8"));
                            });
                        });
                        i += 1;
                        ctx.update(i, profile.processors.length);
                        if (proc.outputs) {
                            for (const file in proc.outputs) {
                                const sha1 = await computeChecksum(file, "sha1");
                                const expected = proc.outputs[file].replace(/\'/g, "");
                                if (sha1 !== expected) {
                                    throw new Error(`Fail to process ${proc.jar} @ ${file} since its validation failed. ${sha1} vs ${expected}`);
                                }
                            }
                        }
                    }

                    if (clearTempDir) {
                        await remove(temp);
                    }
                    i += 1;
                    ctx.update(i, profile.processors.length);
                });
                return fullVersion;
            } catch (e) {
                if (clearTempDir) {
                    await remove(temp);
                }
                throw e;
            }
        };
    }

    function installByUniversalTask(version: VersionMeta, minecraft: MinecraftLocation, maven: string, checkDependecies: boolean) {
        return async (context: Task.Context) => {
            const mc = typeof minecraft === "string" ? new MinecraftFolder(minecraft) : minecraft;
            const forgeVersion = `${version.mcversion}-${version.version}`;
            const jarPath = mc.getLibraryByPath(`net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}.jar`);
            const fullVersion = `${version.mcversion}-forge${version.mcversion}-${version.version}`;
            const rootPath = mc.getVersionRoot(fullVersion);
            const jsonPath = path.join(rootPath, `${fullVersion}.json`);

            const universalURLFallback = `${maven}/maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-universal.jar`;
            const universalURL = `${maven}${version.universal.path}`;

            await context.execute("installForgeJar", async () => {
                if (await exists(jarPath)) {
                    const [md5, sha1] = await multiChecksum(jarPath, ["md5", "sha1"]);
                    if (version.universal.md5 === md5 && version.universal.sha1 === sha1) {
                        return;
                    }
                }

                try {
                    await context.execute("downloadJar", downloadFileWork({ url: universalURL, destination: jarPath }));
                } catch  {
                    await context.execute("redownloadJar", downloadFileWork({ url: universalURLFallback, destination: jarPath }));
                }
            });

            await context.execute("installForgeJson", async () => {
                if (await exists(jsonPath)) { return; }

                await ensureDir(rootPath);
                await fs.createReadStream(jarPath).pipe(createExtractStream(path.dirname(jsonPath), ["version.json"])).promise();
                await fs.promises.rename(path.resolve(path.dirname(jsonPath), "version.json"), jsonPath);
            });

            if (checkDependecies) {
                const resolvedVersion = await Version.parse(minecraft, fullVersion);
                context.execute("installDependencies", Installer.installDependenciesTask(resolvedVersion).work);
            }

            return fullVersion;
        };
    }

    /**
     * Install forge to target location.
     * Installation task for forge with mcversion >= 1.13 requires java installed on your pc.
     * @param version The forge version meta
     */
    export function install(version: VersionMeta, minecraft: MinecraftLocation, option?: {
        maven?: string,
        forceCheckDependencies?: boolean,
        java?: string,
        tempDir?: string,
        clearTempDirAfterInstall?: boolean,
    }) {
        return installTask(version, minecraft, option).execute();
    }

    /**
     * Install forge to target location.
     * Installation task for forge with mcversion >= 1.13 requires java installed on your pc.
     * @param version The forge version meta
     */
    export function installTask(version: VersionMeta, minecraft: MinecraftLocation, option: {
        maven?: string,
        forceCheckDependencies?: boolean,
        java?: string,
        tempDir?: string,
        clearTempDirAfterInstall?: boolean,
    } = {}): Task<string> {
        let byInstaller = true;
        try {
            const minorVersion = Number.parseInt(version.mcversion.split(".")[1], 10);
            byInstaller = minorVersion >= 13;
        } catch { }
        const work = byInstaller ? installByInstallerTask(version, minecraft, option.maven || DEFAULT_FORGE_MAVEN, option.java || "java", option.tempDir, option.clearTempDirAfterInstall)
            : installByUniversalTask(version, minecraft, option.maven || DEFAULT_FORGE_MAVEN, option.forceCheckDependencies === true);
        return Task.create("installForge", work);
    }
}

export default ForgeInstaller;
