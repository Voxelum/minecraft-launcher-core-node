import { missing, readFile, validateSha1, exists, stat } from "@xmcl/core/fs";
import { MinecraftFolder, MinecraftLocation, Version, ResolvedLibrary, ResolvedVersion } from "@xmcl/core";
import { InstallProfile, linkInstallProfile } from "./forge";
import { join } from "path";
import Task from "@xmcl/task";

export enum Status {
    /**
     * File is missing
     */
    Missing = "missing",
    /**
     * File checksum not match
     */
    Corrupted = "corrupted",
    /**
     * Not checked
     */
    Unknown = "unknown",
    /**
     * File is good
     */
    Good = "",
}

async function getStatus(file: string, sha1?: string) {
    if (await missing(file)) {
        return Status.Missing;
    }
    if (sha1 && (!await validateSha1(file, sha1))) {
        return Status.Corrupted;
    }
    return Status.Good;
}

export interface StatusItem<T> {
    status: Status;
    value: T;
}

/**
 * General diagnosis of the version.
 * The missing diagnosis means either the file not existed, or the file not valid (checksum not matched)
 */
export interface Report {
    minecraftLocation: MinecraftFolder;
    version: string;

    versionJson: StatusItem<string>;
    versionJar: Status;
    assetsIndex: Status;
    libraries: StatusItem<ResolvedLibrary>[];
    assets: StatusItem<{ file: string; hash: string }>[];

    forge?: ForgeReport;
}

/**
 * Diagnose the version. It will check the version json/jar, libraries and assets.
 *
 * @param version The version id string
 * @param minecraft The minecraft location
 */
export function diagnose(version: string, minecraft: MinecraftLocation): Promise<Report> {
    return Task.execute(diagnoseTask(version, minecraft)).wait();
}

/**
 * Diagnose the version. It will check the version json/jar, libraries and assets.
 *
 * @param version The version id string
 * @param minecraft The minecraft location
 */
export function diagnoseTask(version: string, minecraftLocation: MinecraftLocation): Task<Report> {
    function hasNewForge(version: ResolvedVersion) {
        if (Number.parseInt(version.minecraftVersion.split(".")[1], 10) >= 13) {
            return version.libraries.find((l) => l.name.startsWith("net.minecraftforge:forge")) !== undefined;
        }
        return false;
    }
    const minecraft = MinecraftFolder.from(minecraftLocation);
    return Task.create("diagnose", async function diagnose(context: Task.Context) {
        let resolvedVersion: ResolvedVersion;
        try {
            resolvedVersion = await context.execute(Task.create("checkVersionJson", function checkVersionJson() { return Version.parse(minecraft, version) }));
        } catch (e) {
            return {
                minecraftLocation: minecraft,
                version,

                versionJson: {
                    value: e.version,
                    status: e.error === "MissingVersionJson"
                        ? Status.Missing
                        : Status.Unknown,
                },

                versionJar: Status.Unknown,
                assetsIndex: Status.Unknown,

                libraries: [],
                assets: [],
            } as Report;
        }
        const jarPath = minecraft.getVersionJar(resolvedVersion.minecraftVersion);
        const assetsIndexPath = minecraft.getAssetsIndex(resolvedVersion.assets);

        const missingJar = await context.execute(Task.create("checkJar", function checkJar() {
            return getStatus(jarPath, resolvedVersion.downloads.client.sha1);
        }));
        const assetsIndex = await context.execute(Task.create("checkAssetIndex", async function checkAssetIndex() {
            return getStatus(assetsIndexPath, resolvedVersion.assetIndex.sha1);
        }));
        const libMask = await context.execute(Task.create("checkLibraries", function checkLibraries() {
            return Promise.all(resolvedVersion.libraries.map(async (lib) => {
                const libPath = minecraft.getLibraryByPath(lib.download.path);
                return getStatus(libPath, lib.download.sha1);
            }));
        }));
        const libraries = resolvedVersion.libraries.map((l, i) => ({ value: l, status: libMask[i] }))
            .filter((v) => v.status !== Status.Good);
        // const assets: { [object: string]: string } = {};

        let assets: any[] = [];
        if (assetsIndex === Status.Good) {
            const objects = (await readFile(assetsIndexPath, "utf-8").then((b) => JSON.parse(b.toString()))).objects;
            const files = Object.keys(objects);
            const assetsMask = await context.execute(Task.create("checkAssets", function checkAssets() {
                return Promise.all(files.map(async (object) => {
                    const { hash } = objects[object];
                    const hashPath = minecraft.getAsset(hash);
                    return getStatus(hashPath, hash);
                }));
            }));
            assets = files.map((path, i) => ({
                value: { file: path, hash: objects[path] },
                status: assetsMask[i]
            })).filter((v) => v.status !== Status.Good);
        }

        const diagnosis = {
            minecraftLocation: minecraft,
            version,

            versionJson: { value: "", status: Status.Good },
            versionJar: missingJar,
            assetsIndex,

            libraries,
            assets,
        } as Report;

        if (hasNewForge(resolvedVersion)) {
            diagnosis.forge = await context.execute(Task.create("forge", () => diagnoseForgeVersion(version, minecraft)));
        }

        return diagnosis;
    });
}

type Processor = InstallProfile["processors"][number];

/**
 * The forge diagnosis report. It may have some intersection with `Version.Diagnosis`.
 */
export interface ForgeReport {
    /**
     * When this flag is true, please reinstall totally.
     */
    badInstall: boolean;
    /**
     * This will be true if the forge version json doesn't contain correct argument or it does not exist.
     */
    badVersionJson: boolean;
    /**
     * Determine whether the forge binary patch existed.
     */
    binpatch: Status.Missing | Status.Good | Status.Unknown;
    /**
     * When this is not empty, please use `postProcessInstallProfile`
     */
    libraries: StatusItem<Version.NormalLibrary>[];
    /**
     * Existed some unprocess processors or fail to process processor.
     * You can use `postProcess` to process these Processors.
     */
    unprocessed: Processor[];
    /**
     * Forge launch require a srg jar, but it might missing here. Missing it require a full re-install.
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
export async function diagnoseForgeVersion(versionOrProfile: string | InstallProfile, minecraft: MinecraftLocation): Promise<ForgeReport> {
    const version = typeof versionOrProfile === "string" ? versionOrProfile : versionOrProfile.version;
    const mc = MinecraftFolder.from(minecraft);
    const verRoot = mc.getVersionRoot(version);
    let prof: InstallProfile | undefined;
    if (typeof versionOrProfile === "string") {
        const installProfPath = join(verRoot, "install_profile.json");
        if (await exists(installProfPath)) {
            prof = JSON.parse(await readFile(installProfPath).then((b) => b.toString()));
        }
    } else {
        prof = versionOrProfile;
    }
    return diagnoseForge(version, prof, mc);
}


async function diagnoseForge(version: string, prof: InstallProfile | undefined, mc: MinecraftFolder) {
    const versionJsonPath = mc.getVersionJson(version);

    const diag: ForgeReport = {
        unprocessed: [],
        libraries: [],
        badVersionJson: false,
        binpatch: Status.Unknown,
        badInstall: false,
        missingSrgJar: false,
        missingMinecraftExtraJar: false,
        missingForgePatchesJar: false,
    };

    if (prof) {
        // check processor in install profiles
        const processedProfile = linkInstallProfile(mc, prof);
        for (const proc of processedProfile.processors) {
            if (proc.outputs) {
                let status = Status.Good;
                for (const file in proc.outputs) {
                    const nStatus = await getStatus(file, proc.outputs[file].replace(/'/g, ""));
                    if (nStatus !== Status.Good) {
                        status = Status.Corrupted;
                        break;
                    }
                }
                if (status !== Status.Good) {
                    diag.unprocessed.push(proc);
                }
            }
        }
        // if we have to process file, we have to check if the forge deps are ready
        if (diag.unprocessed.length !== 0) {
            const libValidMask = await Promise.all(processedProfile.libraries.map(async (lib) => {
                const artifact = lib.downloads.artifact;
                const libPath = mc.getLibraryByPath(artifact.path);
                return getStatus(libPath, artifact.sha1);
            }));
            const missingLibraries = processedProfile.libraries
                .map((l, s) => ({ value: l, status: libValidMask[s] }))
                .filter((v) => v.status !== Status.Good);
            diag.libraries.push(...missingLibraries);

            const validClient = await stat(processedProfile.data.BINPATCH.client).then((s) => s.size !== 0).catch((_) => false);
            if (!validClient) {
                diag.binpatch = Status.Missing;
                diag.badInstall = true;
            }
        }
    }
    if (await exists(versionJsonPath)) {
        const versionJSON: Version = JSON.parse(await readFile(versionJsonPath).then((b) => b.toString()), () => undefined);
        if (versionJSON) {
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
    } else {
        diag.badVersionJson = true;
        diag.badInstall = true;
    }

    return diag;
}
