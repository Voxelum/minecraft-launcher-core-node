import { LibraryInfo, MinecraftFolder, MinecraftLocation, Version } from "@xmcl/core";
import { copyFile, ensureDir, ensureFile, exists, missing, readFile, stat, unlink, validateSha1, waitStream, writeFile } from "@xmcl/core/fs";
import { parse as parseForge } from "@xmcl/forge-site-parser";
import Task from "@xmcl/task";
import Unzip from "@xmcl/unzip";
import { createReadStream, createWriteStream } from "fs";
import { delimiter, join } from "path";
import { Readable } from "stream";
import { JavaExecutor } from "./java";
import { Installer } from "./minecraft";
import { downloadFileIfAbsentTask, downloadFileTask, getIfUpdate, UpdatedObject } from "./downloader";

async function findMainClass(lib: string) {
    const zip = await Unzip.open(lib, { lazyEntries: true });
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

/**
 * The forge installer Module to install forge to the game
 */
export namespace ForgeInstaller {
    export interface VersionMetaList extends UpdatedObject {
        mcversion: string;
        versions: VersionMeta[];
    }
    /**
     * The forge version metadata to download a forge
     */
    export interface VersionMeta {
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
        libraries: Version.NormalLibrary[];
    }

    /**
     * The forge diagnosis report. It may have some intersection with `Version.Diagnosis`.
     */
    export interface Diagnosis {
        /**
         * When this flag is true, please reinstall totally
         */
        badInstall: boolean;
        /**
         * When only this is not empty
         */
        badProcessedFiles: Array<InstallProfile["processors"][number]>;
        badVersionJson: boolean;
        /**
         * When this is not empty, please use `postProcessInstallProfile`
         */
        missingInstallDependencies: Version.NormalLibrary[];

        missingBinpatch: boolean;

        /**
         * Alt for badProcessedFiles
         */
        missingSrgJar: boolean;
        /**
         * Alt for badProcessedFiles
         */
        missingMinecraftExtraJar: boolean;
        /**
         * Alt for badProcessedFiles
         */
        missingForgePatchesJar: boolean;
    }

    /**
     * Diagnose for specific forge version. Majorly for the current installer forge. (mcversion >= 1.13)
     *
     * Don't use this with the version less than 1.13
     * @param versionOrProfile If the version string present, it will try to find the installer profile under version folder. Otherwise it will use presented installer profile to diagnose
     * @param minecraft The minecraft location.
     */
    export async function diagnoseForgeVersion(versionOrProfile: string | InstallProfile, minecraft: MinecraftLocation): Promise<Diagnosis> {
        const version = typeof versionOrProfile === "string" ? versionOrProfile : versionOrProfile.version;
        const mc = MinecraftFolder.from(minecraft);
        const verRoot = mc.getVersionRoot(version);
        const versionJsonPath = mc.getVersionJson(version);

        const diag: Diagnosis = {
            badProcessedFiles: [],
            missingInstallDependencies: [],
            badVersionJson: false,
            missingBinpatch: false,
            badInstall: false,
            missingSrgJar: false,
            missingMinecraftExtraJar: false,
            missingForgePatchesJar: false,
        };

        let prof: InstallProfile | undefined;
        if (typeof versionOrProfile === "string") {
            const installProfPath = join(verRoot, "install_profile.json");
            if (await exists(installProfPath)) {
                prof = JSON.parse(await readFile(installProfPath).then((b) => b.toString()));
            }
        } else {
            prof = versionOrProfile;
        }
        if (prof) {
            const processedProfile = postProcessInstallProfile(mc, prof);
            for (const proc of processedProfile.processors) {
                if (proc.outputs) {
                    let bad = false;
                    for (const file in proc.outputs) {
                        if (! await validateSha1(file, proc.outputs[file].replace(/'/g, ""))) {
                            bad = true;
                            break;
                        }
                    }
                    if (bad) {
                        diag.badProcessedFiles.push(proc);
                    }
                }
            }
            // if we have to process file, we have to check if the forge deps are ready
            if (diag.badProcessedFiles.length !== 0) {
                const libValidMask = await Promise.all(processedProfile.libraries.map(async (lib) => {
                    const artifact = lib.downloads.artifact;
                    const libPath = mc.getLibraryByPath(artifact.path);
                    if (await exists(libPath)) {
                        return artifact.sha1 ? validateSha1(libPath, artifact.sha1) : true;
                    }
                    return false;
                }));
                const missingLibraries = processedProfile.libraries.filter((_, i) => !libValidMask[i]);
                diag.missingInstallDependencies.push(...missingLibraries);

                const validClient = await stat(processedProfile.data.BINPATCH.client).then((s) => s.size !== 0).catch((_) => false);
                if (!validClient) {
                    diag.missingBinpatch = true;
                    diag.badInstall = true;
                }
            }
        }
        if (await exists(versionJsonPath)) {
            const versionJSON: Version = JSON.parse(await readFile(versionJsonPath).then((b) => b.toString()));
            if (versionJSON.arguments && versionJSON.arguments.game) {
                const args = versionJSON.arguments.game;
                const forgeVersion = args.indexOf("--fml.forgeVersion") + 1;
                const mcVersion = args.indexOf("--fml.mcVersion") + 1;
                const mcpVersion = args.indexOf("--fml.mcpVersion") + 1;
                if (!forgeVersion || !mcVersion || !mcpVersion) {
                    diag.badVersionJson = true;
                    diag.badInstall = true;
                } else {
                    const srgPath = mc.getLibraryByPath(`net/minecraft/client/${mcVersion}-${mcpVersion}/client-${mcVersion}-${mcpVersion}-srg.jar`);
                    const extraPath = mc.getLibraryByPath(`net/minecraft/client/${mcVersion}/client-${mcVersion}-extra.jar`);
                    const forgePatchPath = mc.getLibraryByPath(`net/minecraftforge/forge/${mcVersion}-${forgeVersion}/forge-${mcVersion}-${forgeVersion}-client.jar`);
                    diag.missingSrgJar = await missing(srgPath);
                    diag.missingMinecraftExtraJar = await missing(extraPath);
                    diag.missingForgePatchesJar = await missing(forgePatchPath);
                }
            } else {
                diag.badVersionJson = true;
                diag.badInstall = true;
            }
        } else {
            diag.badVersionJson = true;
            diag.badInstall = true;
        }

        return diag;
    }

    /**
     * Post processing function for new forge installer (mcversion >= 1.13). You can use this with `ForgeInstaller.diagnose`.
     *
     * @param mc The minecraft location
     * @param proc The processor
     * @param java The java executor
     */
    export async function postProcess(mc: MinecraftFolder, proc: InstallProfile["processors"][number], java: JavaExecutor) {
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

    function postProcessInstallProfile(mc: MinecraftFolder, installProfile: InstallProfile) {
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

    /**
     * Install for forge installer step 2 and 3.
     * @param version The version string or installer profile
     * @param minecraft The minecraft location
     */
    export function installByInstallerPartialTask(version: string | InstallProfile, minecraft: MinecraftLocation, option: {
        java?: JavaExecutor,
    } & Installer.LibraryOption = {}) {
        return async function installForge(context: Task.Context) {
            const mc = MinecraftFolder.from(minecraft);
            let prof: InstallProfile;
            let ver: Version;
            if (typeof version === "string") {
                const versionRoot = mc.getVersionRoot(version);
                prof = await readFile(join(versionRoot, "install_profile.json")).then((b) => b.toString()).then(JSON.parse);
            } else {
                prof = version;
            }
            ver = await readFile(mc.getVersionJson(prof.version)).then((b) => b.toString()).then(JSON.parse);
            await installByInstallerPartialWork(mc, prof, ver, option.java || JavaExecutor.createSimple("java"), option)(context);
        };
    }

    /**
     * Install for forge installer step 2 and 3.
     * @param version The version string or installer profile
     * @param minecraft The minecraft location
     */
    export async function installByInstallerPartial(version: string | InstallProfile, minecraft: MinecraftLocation, option: {
        java?: JavaExecutor,
    } & Installer.LibraryOption = {}) {
        return Task.execute(installByInstallerPartialTask(version, minecraft, option)).wait();
    }

    function installByInstallerPartialWork(mc: MinecraftFolder, profile: InstallProfile, versionJson: Version, java: JavaExecutor, installLibOption: Installer.LibraryOption) {
        return async (context: Task.Context) => {
            profile = postProcessInstallProfile(mc, profile);

            const parsedLibs = Version.resolveLibraries([...profile.libraries, ...versionJson.libraries]);
            await context.execute(Installer.installLibrariesDirectTask(parsedLibs, mc, {
                ...installLibOption,
                libraryHost: installLibOption.libraryHost ? (l) => {
                    if (l.artifactId === "forge" && l.groupId === "net.minecraftforge") {
                        return `file://${mc.getLibraryByPath(l.path)}`;
                    }
                    return installLibOption.libraryHost!(l);
                } : undefined,
            }));

            await context.execute(async function postProcessing(ctx) {
                ctx.update(0, profile.processors.length);
                let i = 0;
                const errs: Error[] = [];
                for (const proc of profile.processors) {
                    try {
                        await postProcess(mc, proc, java);
                    } catch (e) {
                        errs.push(e);
                    }
                    ctx.update(i += 1, profile.processors.length);
                }
                i += 1;
                ctx.update(i, profile.processors.length);

                if (errs.length !== 0) {
                    errs.forEach((e) => console.error(e));
                    throw new Error("Fail to post processing");
                }
            });
        };
    }

    function installByInstallerTask(version: VersionMeta, minecraft: MinecraftLocation, maven: string, installLibOption: Installer.LibraryOption, java: JavaExecutor) {
        return async function installForge(context: Task.Context) {
            const mc = MinecraftFolder.from(minecraft);

            const forgeVersion = `${version.mcversion}-${version.version}`;
            const installerURL = `${maven}${version.installer.path}`;
            const installerURLFallback = `${maven}/maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-installer.jar`;
            const installJar = mc.getLibraryByPath(version.installer.path.substring(version.installer.path.substring(1).indexOf("/") + 1));

            let versionId: string;
            let profile!: InstallProfile;
            let versionJson!: Version;

            function downloadInstallerTask(installer: string, dest: string) {
                return async function downloadInstaller(ctx: Task.Context) {
                    await downloadFileIfAbsentTask({
                        url: installer,
                        destination: dest,
                        checksum: {
                            hash: version.installer.sha1,
                            algorithm: "sha1",
                        },
                    })(ctx);
                    return createReadStream(dest).pipe(Unzip.createParseStream({ lazyEntries: true })).wait();
                };
            }
            async function processVersion(zip: Unzip.ZipFile, installProfileEntry: Unzip.Entry, versionEntry: Unzip.Entry, clientDataEntry: Unzip.Entry) {
                profile = await zip.readEntry(installProfileEntry).then((b) => b.toString()).then(JSON.parse);
                versionJson = await zip.readEntry(versionEntry).then((b) => b.toString()).then(JSON.parse);
                versionId = versionJson.id;

                const rootPath = mc.getVersionRoot(versionJson.id);
                const jsonPath = join(rootPath, `${versionJson.id}.json`);
                const installJsonPath = join(rootPath, "install_profile.json");
                const clientDataPath = join(rootPath, profile.data.BINPATCH.client);

                await ensureFile(jsonPath);
                await writeFile(installJsonPath, JSON.stringify(profile));
                await writeFile(jsonPath, JSON.stringify(versionJson));

                await ensureFile(clientDataPath);
                const stream = await zip.openEntry(clientDataEntry);
                await waitStream(stream.pipe(createWriteStream(clientDataPath)));
            }
            async function processExtractLibrary(stream: Readable, p: string) {
                const file = mc.getLibraryByPath(p.substring(p.indexOf("/") + 1));
                await ensureFile(file);
                await waitStream(stream.pipe(createWriteStream(file)));
            }

            try {
                let zip: Unzip.LazyZipFile;
                try {
                    zip = await context.execute(downloadInstallerTask(installerURL, installJar));
                } catch {
                    zip = await context.execute(downloadInstallerTask(installerURLFallback, installJar));
                }

                const [forgeEntry, forgeUniversalEntry, clientDataEntry, installProfileEntry, versionEntry] = await zip.filterEntries([
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

                await processExtractLibrary(await zip.openEntry(forgeEntry), forgeEntry.fileName);
                await processExtractLibrary(await zip.openEntry(forgeUniversalEntry), forgeUniversalEntry.fileName);
                await processVersion(zip, installProfileEntry, versionEntry, clientDataEntry);

                await installByInstallerPartialWork(mc, profile, versionJson, java, installLibOption)(context);

                return versionId!;
            } catch (e) {
                console.error(`Cannot install forge by installer ${version.version}`);
                throw e;
            }
        };
    }

    function installByUniversalTask(version: VersionMeta, minecraft: MinecraftLocation, maven: string) {
        return async function installForge(context: Task.Context) {
            const mc = MinecraftFolder.from(minecraft);
            const forgeVersion = `${version.mcversion}-${version.version}`;
            const paths = version.universal.path.split("/");
            const realForgeVersion = paths[paths.length - 2];
            const jarPath = mc.getLibraryByPath(`net/minecraftforge/forge/${realForgeVersion}/forge-${realForgeVersion}.jar`);
            let fullVersion: string;
            let realJarPath: string;

            const universalURLFallback = `${maven}/maven/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-universal.jar`;
            const universalURL = `${maven}${version.universal.path}`;

            await context.execute(async function installForgeJar() {
                if (await exists(jarPath)) {
                    const valid = await validateSha1(jarPath, version.universal.sha1);
                    if (valid) {
                        return;
                    }
                }
                function downloadJar(ctx: Task.Context) {
                    return downloadFileTask({ url: universalURL, destination: jarPath })(ctx);
                }
                await context.execute(downloadJar);
            });

            await context.execute(async function installForgeJson() {
                const zip = await Unzip.open(jarPath, { lazyEntries: true });
                const [versionEntry] = await zip.filterEntries(["version.json"]);

                if (versionEntry) {
                    const buf = await zip.readEntry(versionEntry);
                    const raw = JSON.parse(buf.toString());
                    const id = raw.id;
                    fullVersion = id;
                    const rootPath = mc.getVersionRoot(fullVersion);
                    realJarPath = mc.getLibraryByPath(LibraryInfo.resolve(raw.libraries.find((l: any) => l.name.startsWith("net.minecraftforge:forge"))).path);

                    await ensureDir(rootPath);
                    const jsonPath = join(rootPath, `${id}.json`);
                    if (await missing(jsonPath)) {
                        await writeFile(jsonPath, buf);
                    }
                } else {
                    throw new Error(`Cannot install forge json for ${version.version} since the version json is missing!`);
                }
            });

            if (realJarPath! !== jarPath) {
                await ensureFile(realJarPath!);
                await copyFile(jarPath, realJarPath!);
                await unlink(jarPath);
            }

            return fullVersion!;
        };
    }

    /**
     * Install forge to target location.
     * Installation task for forge with mcversion >= 1.13 requires java installed on your pc.
     * @param version The forge version meta
     */
    export function install(version: VersionMeta, minecraft: MinecraftLocation, option?: {
        maven?: string,
        java?: JavaExecutor,
    }) {
        return Task.execute(installTask(version, minecraft, option)).wait();
    }

    /**
     * Install forge to target location.
     * Installation task for forge with mcversion >= 1.13 requires java installed on your pc.
     * @param version The forge version meta
     */
    export function installTask(version: VersionMeta, minecraft: MinecraftLocation, option: {
        maven?: string,
        java?: JavaExecutor,
    } & Installer.LibraryOption = {}): Task<string> {
        let byInstaller = true;
        try {
            const minorVersion = Number.parseInt(version.mcversion.split(".")[1], 10);
            byInstaller = minorVersion >= 13;
        } catch { }
        const work = byInstaller
            ? installByInstallerTask(version, minecraft, option.maven || DEFAULT_FORGE_MAVEN, option, option.java || JavaExecutor.createSimple("java"))
            : installByUniversalTask(version, minecraft, option.maven || DEFAULT_FORGE_MAVEN);
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
    export function getVersionMetaList(): Promise<VersionMetaList | undefined>;
    /**
     * Query the webpage content from files.minecraftforge.net.
     *
     * You can put the last query result to the fallback option. It will check if your old result is up-to-date.
     * It will request a new page only when the fallback option is outdated.
     *
     * @param option The option can control querying minecraft version, and page caching.
     */
    export function getVersionMetaList(option?: {
        mcversion?: string;
    }): Promise<VersionMetaList | undefined>;
    /**
     * Query the webpage content from files.minecraftforge.net.
     *
     * You can put the last query result to the fallback option. It will check if your old result is up-to-date.
     * It will request a new page only when the fallback option is outdated.
     *
     * @param option The option can control querying minecraft version, and page caching.
     */
    export function getVersionMetaList(option?: {
        mcversion?: string;
        fallback?: VersionMetaList;
    }): Promise<VersionMetaList | undefined>;
    /**
     * Query the webpage content from files.minecraftforge.net.
     *
     * You can put the last query result to the fallback option. It will check if your old result is up-to-date.
     * It will request a new page only when the fallback option is outdated.
     *
     * @param option The option can control querying minecraft version, and page caching.
     */
    export function getVersionMetaList(option?: {
        mcversion?: string;
        fallback: VersionMetaList;
    }): Promise<VersionMetaList>;

    /**
     * Query the webpage content from files.minecraftforge.net.
     *
     * You can put the last query result to the fallback option. It will check if your old result is up-to-date.
     * It will request a new page only when the fallback option is outdated.
     *
     * @param option The option can control querying minecraft version, and page caching.
     */
    export async function getVersionMetaList(option: {
        mcversion?: string,
        fallback?: VersionMetaList,
    } = {}): Promise<VersionMetaList | undefined> {
        const mcversion = option.mcversion || "";
        const url = mcversion === "" ? "http://files.minecraftforge.net/maven/net/minecraftforge/forge/index.html" : `http://files.minecraftforge.net/maven/net/minecraftforge/forge/index_${mcversion}.html`;
        const page = await getIfUpdate(url, parseForge, option.fallback);
        return page;
    }
}

export default ForgeInstaller;
