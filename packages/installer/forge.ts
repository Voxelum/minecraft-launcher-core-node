import { LibraryInfo, MinecraftFolder, MinecraftLocation, Version as VersionJson, futils } from "@xmcl/core";
import { parse as parseForge } from "@xmcl/forge-site-parser";
import { Task } from "@xmcl/task";
import { createParseStream, Entry, open } from "@xmcl/unzip";
import { createReadStream, createWriteStream } from "fs";
import { delimiter, join } from "path";
import { DownloaderOption, installResolvedLibrariesTask, LibraryOption, MultipleError } from "./minecraft";
import { downloadFileIfAbsentTask, getIfUpdate, InstallOptions as InstallOptionsBase, JavaExecutor, UpdatedObject } from "./util";

const { copyFile, ensureDir, ensureFile, missing, readFile, unlink, validateSha1, waitStream, writeFile } = futils;

async function findMainClass(lib: string) {
    const zip = await open(lib, { lazyEntries: true });
    const [manifest] = await zip.filterEntries(["META-INF/MANIFEST.MF"]);
    let mainClass: string | undefined;
    if (manifest) {
        const content = await zip.readEntry(manifest).then((b) => b.toString());
        const mainClassPair = content.split("\n").map((l) => l.split(": ")).filter((arr) => arr[0] === "Main-Class")[0];
        if (mainClassPair) {
            mainClass = mainClassPair[1].trim();
        }
    }
    zip.close();
    return mainClass;
}

export interface VersionList extends UpdatedObject {
    mcversion: string;
    versions: Version[];
}
/**
 * The forge version metadata to download a forge
 */
export interface Version {
    /**
     * The installer info
     */
    installer: {
        md5: string;
        sha1: string;
        /**
         * The url path to concat with forge maven
         */
        path: string;
    };
    universal: {
        md5: string;
        sha1: string;
        /**
         * The url path to concat with forge maven
         */
        path: string;
    };
    /**
     * The minecraft version
     */
    mcversion: string;
    /**
     * The forge version (without minecraft version)
     */
    version: string;

    type?: "buggy" | "recommended" | "common" | "latest";
}

type RequiredVersion = {
    /**
     * The installer info
     */
    installer: {
        sha1?: string;
        /**
         * The url path to concat with forge maven
         */
        path: string;
    };
    universal: {
        sha1?: string;
        /**
         * The url path to concat with forge maven
         */
        path: string;
    };
    /**
     * The minecraft version
     */
    mcversion: string;
    /**
     * The forge version (without minecraft version)
     */
    version: string;

    type?: "buggy" | "recommended" | "common" | "latest";
}

export const DEFAULT_FORGE_MAVEN = "http://files.minecraftforge.net";

export interface InstallProfile {
    spec: number;
    profile: string;
    version: string;
    json: string;
    path: string;
    minecraft: string;
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
    libraries: VersionJson.NormalLibrary[];
}

/**
 * The options to install forge.
 */
export interface Options extends DownloaderOption, LibraryOption, InstallOptionsBase {
    /**
     * You custom maven host url for the people have trouble to download
     */
    maven?: string;
    /**
    * New forge (>=1.13) require java to install. Can be a executor or java executable path.
    */
    java?: JavaExecutor | string;
}

/**
 * Post processing function for new forge installer (mcversion >= 1.13). You can use this with `ForgeInstaller.diagnose`.
 *
 * @param mc The minecraft location
 * @param proc The processor
 * @param java The java executor
 */
export async function postProcess(mc: MinecraftFolder, proc: InstallProfile["processors"][number], java: JavaExecutor) {
    let shouldProcess = false;
    if (proc.outputs) {
        for (const file in proc.outputs) {
            if (! await validateSha1(file, proc.outputs[file].replace(/'/g, ""))) {
                shouldProcess = true;
                break;
            }
        }
    } else {
        shouldProcess = true;
    }
    if (!shouldProcess) { return; }
    const jarRealPath = mc.getLibraryByPath(LibraryInfo.resolve(proc.jar).path);
    const mainClass = await findMainClass(jarRealPath);
    if (!mainClass) { throw new Error(`Cannot find main class for processor ${proc.jar}.`); }
    const cp = [...proc.classpath, proc.jar].map(LibraryInfo.resolve).map((p) => mc.getLibraryByPath(p.path)).join(delimiter);
    const cmd = ["-cp", cp, mainClass, ...proc.args];
    await java(cmd);
    let failed = false;
    if (proc.outputs) {
        for (const file in proc.outputs) {
            if (! await validateSha1(file, proc.outputs[file].replace(/'/g, ""))) {
                console.error(`Fail to process ${proc.jar} @ ${file} since its validation failed.`);
                failed = true;
            }
        }
    }
    if (failed) {
        console.error(`Java arguments: ${JSON.stringify(cmd)}`);
        throw new Error("Fail to process post processing since its validation failed.");
    }
}

/**
 * @interal
 */
export function linkInstallProfile(mc: MinecraftFolder, installProfile: InstallProfile) {
    function processValue(v: string) {
        if (v.match(/^\[.+\]$/g)) {
            const targetId = v.substring(1, v.length - 1);
            return mc.getLibraryByPath(LibraryInfo.resolve(targetId).path);
        }
        return v;
    }
    function processMapping(data: InstallProfile["data"], m: string) {
        m = processValue(m);
        if (m.match(/^{.+}$/g)) {
            const key = m.substring(1, m.length - 1);
            m = data[key].client;
        }
        return m;
    }
    const profile: InstallProfile = JSON.parse(JSON.stringify(installProfile));
    profile.data.MINECRAFT_JAR = {
        client: mc.getVersionJar(profile.minecraft),
        server: "",
    };
    for (const key in profile.data) {
        const value = profile.data[key];
        value.client = processValue(value.client);
        value.server = processValue(value.server);

        if (key === "BINPATCH") {
            const verRoot = mc.getVersionRoot(profile.version);
            value.client = join(verRoot, value.client);
            value.server = join(verRoot, value.server);
        }
    }
    for (const proc of profile.processors) {
        proc.args = proc.args.map((a) => processMapping(profile.data, a));
        if (proc.outputs) {
            const replacedOutput: InstallProfile["processors"][0]["outputs"] = {};
            for (const key in proc.outputs) {
                replacedOutput[processMapping(profile.data, key)] = processMapping(profile.data, proc.outputs[key]);
            }
            proc.outputs = replacedOutput;
        }
    }

    return profile;
}

function decorateOptions(minecraftFolder: MinecraftFolder, options: Options): Options {
    return {
        ...options,
        libraryHost: (l) => {
            if (l.artifactId === "forge" && l.groupId === "net.minecraftforge") {
                return `file://${minecraftFolder.getLibraryByPath(l.path)}`;
            }
            return options.libraryHost?.(l);
        }
    };
}

/**
 * Install for forge installer step 2 and 3.
 * @param version The version string or installer profile
 * @param minecraft The minecraft location
 */
export function installByInstallerPartialTask(version: string | InstallProfile, minecraft: MinecraftLocation, options: Options = {}) {
    return Task.create("installForge", async function installForge(context: Task.Context) {
        const minecraftFolder = MinecraftFolder.from(minecraft);
        const java = typeof options.java === "string" ? JavaExecutor.createSimple(options.java) : typeof options.java === "function" ? options.java : JavaExecutor.createSimple("java");

        let installProfile: InstallProfile;
        if (typeof version === "string") {
            let versionRoot = minecraftFolder.getVersionRoot(version);
            installProfile = await readFile(join(versionRoot, "install_profile.json")).then((b) => b.toString()).then(JSON.parse);
        } else {
            installProfile = version;
        }
        installProfile = linkInstallProfile(minecraftFolder, installProfile);

        let versionJson: VersionJson = await readFile(minecraftFolder.getVersionJson(installProfile.version)).then((b) => b.toString()).then(JSON.parse);
        let libraries = VersionJson.resolveLibraries([...installProfile.libraries, ...versionJson.libraries]);

        await context.execute(installResolvedLibrariesTask(libraries, minecraft, decorateOptions(minecraftFolder, options)), 50);
        await context.execute(postProcessingTask(minecraftFolder, installProfile, java, options.throwErrorImmediately || false), 50);
    });
}

/**
 * Install for forge installer step 2 and 3.
 * @param version The version string or installer profile
 * @param minecraft The minecraft location
 */
export async function installByInstallerPartial(version: string | InstallProfile, minecraft: MinecraftLocation, option: Options = {}) {
    return Task.execute(installByInstallerPartialTask(version, minecraft, option)).wait();
}

function postProcessingTask(minecraft: MinecraftFolder, installProfile: InstallProfile, java: JavaExecutor, failImmediately: boolean) {
    return Task.create("postProcessing", async function postProcessing(ctx) {
        ctx.update(0, installProfile.processors.length);
        let done = 0;
        let errors: Error[] = [];
        for (const proc of installProfile.processors) {
            try {
                await postProcess(minecraft, proc, java);
            } catch (e) {
                e = e || new Error(`Fail to post porcess ${proc.jar} ${proc.args.join(" ")}, ${proc.classpath.join(" ")}`);
                if (failImmediately) {
                    throw e;
                }
                errors.push(e);
            }
            ctx.update(done += 1, installProfile.processors.length);
        }

        done += 1;
        ctx.update(done, installProfile.processors.length);

        if (errors.length !== 0) {
            throw new MultipleError(errors, `Fail to post process for forge at ${installProfile.version}.`);
        }
    });
}

/**
 * @task installForge
 * @child downloadInstaller
 * @child installForgeJar
 * @child installForgeJson
 */
function installByInstallerTask(version: RequiredVersion, minecraft: MinecraftLocation, options: Options) {
    const maven = options.maven || DEFAULT_FORGE_MAVEN;
    const installLibOption = options;
    const java = typeof options.java === "string" ? JavaExecutor.createSimple(options.java) : typeof options.java === "function" ? options.java : JavaExecutor.createSimple("java");
    return Task.create("installForge", async function installForge(context: Task.Context) {
        const mc = MinecraftFolder.from(minecraft);
        const forgeVersion = `${version.mcversion}-${version.version}`;
        const installerURL = `${maven}${version.installer.path}`;
        const installerURLFallback = `${maven}/maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-installer.jar`;
        const installJar = mc.getLibraryByPath(version.installer.path.substring(version.installer.path.substring(1).indexOf("/") + 1));

        function downloadInstallerTask(installer: string[], dest: string) {
            return Task.create("downloadInstaller", async function downloadInstaller(ctx: Task.Context) {
                await downloadFileIfAbsentTask({
                    url: installer,
                    destination: dest,
                    checksum: version.installer.sha1 ? {
                        hash: version.installer.sha1,
                        algorithm: "sha1",
                    } : undefined,
                }, options.downloader, options.downloadStrategy)(ctx);
                return createReadStream(dest).pipe(createParseStream({ lazyEntries: true })).wait();
            });
        }

        let zip = await context.execute(downloadInstallerTask([installerURL, installerURLFallback], installJar), 20);

        let [forgeEntry, forgeUniversalEntry, clientDataEntry, installProfileEntry, versionEntry] = await zip.filterEntries([
            `maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}.jar`,
            `maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-universal.jar`,
            "data/client.lzma",
            "install_profile.json",
            "version.json"
        ]);

        if (!forgeEntry) {
            throw new Error("Missing forge jar entry");
        }
        if (!forgeUniversalEntry) {
            throw new Error("Missing forge universal entry");
        }
        if (!installProfileEntry) {
            throw new Error("Missing install profile");
        }
        if (!versionEntry) {
            throw new Error("Missing version entry");
        }

        function getLibraryPath(name: string) {
            // remove the maven/ prefix
            return mc.getLibraryByPath(name.substring(name.indexOf("/") + 1));
        }
        function extractEntryTo(e: Entry, dest: string) {
            return zip.openEntry(e).then((stream) => stream.pipe(createWriteStream(dest))).then(waitStream);
        }

        let profile: InstallProfile = await zip.readEntry(installProfileEntry).then((b) => b.toString()).then(JSON.parse);
        let versionJson: VersionJson = await zip.readEntry(versionEntry).then((b) => b.toString()).then(JSON.parse);

        versionJson.id = options.versionId || versionJson.id;
        versionJson.inheritsFrom = options.inheritsFrom || versionJson.inheritsFrom;

        let rootPath = mc.getVersionRoot(versionJson.id);
        let jsonPath = join(rootPath, `${versionJson.id}.json`);
        let installJsonPath = join(rootPath, "install_profile.json");
        let clientDataPath = join(rootPath, profile.data.BINPATCH.client);

        await ensureFile(jsonPath);
        await ensureFile(clientDataPath);

        await Promise.all([
            writeFile(installJsonPath, JSON.stringify(profile)),
            writeFile(jsonPath, JSON.stringify(versionJson)),
            extractEntryTo(forgeEntry, getLibraryPath(forgeEntry.fileName)),
            extractEntryTo(forgeUniversalEntry, getLibraryPath(forgeUniversalEntry.fileName)),
            extractEntryTo(clientDataEntry, clientDataPath),
        ]);

        profile = linkInstallProfile(mc, profile);

        let libraries = VersionJson.resolveLibraries([...profile.libraries, ...versionJson.libraries]);

        await context.execute(installResolvedLibrariesTask(libraries, mc, decorateOptions(mc, installLibOption)), 40);
        await context.execute(postProcessingTask(mc, profile, java, options.throwErrorImmediately || false), 40);

        return versionJson.id;
    });
}

/**
 * @task installForge
 * @child installForgeJar
 * @child installForgeJson
 */
function installByUniversalTask(version: RequiredVersion, minecraft: MinecraftLocation, options: Options) {
    return Task.create("installForge", async function installForge(context: Task.Context) {
        const mc = MinecraftFolder.from(minecraft);
        const paths = version.universal.path.split("/");
        const realForgeVersion = paths[paths.length - 2];
        const jarPath = mc.getLibraryByPath(`net/minecraftforge/forge/${realForgeVersion}/forge-${realForgeVersion}.jar`);
        const maven = options.maven || DEFAULT_FORGE_MAVEN;
        const universalURL = `${maven}${version.universal.path}`;

        let targetVersionId: string;
        let realJarPath: string;

        await context.execute(Task.create("jar", downloadFileIfAbsentTask({
            destination: jarPath,
            url: universalURL,
            checksum: version.universal.sha1 ? { hash: version.universal.sha1, algorithm: "sha1" } : undefined,
        }, options.downloader, options.downloadStrategy)), 80);

        await context.execute(Task.create("json", async function installForgeJson() {
            const zip = await open(jarPath, { lazyEntries: true });
            const [versionEntry] = await zip.filterEntries(["version.json"]);

            if (versionEntry) {
                const buf = await zip.readEntry(versionEntry);
                const raw = JSON.parse(buf.toString());

                targetVersionId = options.versionId || raw.id;
                raw.id = targetVersionId;
                realJarPath = mc.getLibraryByPath(LibraryInfo.resolve(raw.libraries.find((l: any) => l.name.startsWith("net.minecraftforge:forge"))).path);

                const rootPath = mc.getVersionRoot(targetVersionId);
                await ensureDir(rootPath);
                const jsonPath = join(rootPath, `${targetVersionId}.json`);
                if (await missing(jsonPath)) {
                    await writeFile(jsonPath, JSON.stringify(raw, undefined, 4));
                }
            } else {
                throw new Error(`Cannot install forge json for ${version.version} since the version json is missing!`);
            }
        }), 20);

        if (realJarPath! !== jarPath) {
            await ensureFile(realJarPath!);
            await copyFile(jarPath, realJarPath!);
            await unlink(jarPath);
        }

        return targetVersionId!;
    });
}

/**
 * Install forge to target location.
 * Installation task for forge with mcversion >= 1.13 requires java installed on your pc.
 * @param version The forge version meta
 * @returns The installed version name.
 */
export function install(version: RequiredVersion, minecraft: MinecraftLocation, option?: Options) {
    return Task.execute(installTask(version, minecraft, option)).wait();
}

/**
 * Install forge to target location.
 * Installation task for forge with mcversion >= 1.13 requires java installed on your pc.
 * @param version The forge version meta
 * @returns The task to install the forge
 */
export function installTask(version: RequiredVersion, minecraft: MinecraftLocation, option: Options = {}): Task<string> {
    let byInstaller = true;
    try {
        const minorVersion = Number.parseInt(version.mcversion.split(".")[1], 10);
        byInstaller = minorVersion >= 13;
    } catch { }
    const work = byInstaller
        ? installByInstallerTask(version, minecraft, option)
        : installByUniversalTask(version, minecraft, option);
    return work;
}

/**
 * Query the webpage content from files.minecraftforge.net.
 *
 * You can put the last query result to the fallback option. It will check if your old result is up-to-date.
 * It will request a new page only when the fallback option is outdated.
 *
 * @param option The option can control querying minecraft version, and page caching.
 */
export async function getVersionList(option: {
    /**
     * The minecraft version you are requesting
     */
    mcversion?: string;
    /**
     * If this presents, it will send request with the original list timestamp.
     *
     * If the server believes there is no modification after the original one,
     * it will directly return the orignal one.
     */
    original?: VersionList;
} = {}): Promise<VersionList> {
    const mcversion = option.mcversion || "";
    const url = mcversion === "" ? "http://files.minecraftforge.net/maven/net/minecraftforge/forge/index.html" : `http://files.minecraftforge.net/maven/net/minecraftforge/forge/index_${mcversion}.html`;
    return getIfUpdate(url, parseForge, option.original);
}
