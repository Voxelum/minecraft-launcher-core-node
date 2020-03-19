import { futils, MinecraftFolder, MinecraftLocation, ResolvedLibrary, ResolvedVersion, Version } from "@xmcl/core";
import { Task, task } from "@xmcl/task";
import { InstallProfile, resolveProcessors } from "./minecraft";

const { checksum, readFile, exists } = futils;

async function getSha1(file: string) {
    return checksum(file, "sha1");
}
type Processor = InstallProfile["processors"][number];

export interface Issue {
    /**
     * The type of the issue.
     */
    type: "missing" | "corrupted";
    /**
     * The role of the file in Minecraft.
     */
    role: "minecraftJar" | "versionJson" | "library" | "asset" | "assetIndex" | "processor";
    /**
     * The path of the problematic file.
     */
    file: string;
    /**
     * The useful hint to fix this issue. This should be a human readable string.
     */
    hint: string;
    /**
     * The expected checksum of the file
     */
    expectedChecksum: string;
    /**
     * The actual checksum of the file
     */
    receivedChecksum: string;
}

export type MinecraftIssues = LibraryIssue | MinecraftJarIssue | VersionJsonIssue | AssetIssue | AssetIndexIssue;
export type InstallIssues = Issue;

export interface ProcessorIssue extends Issue {
    role: "processor";

    /**
     * The processor
     */
    processor: Processor;
}

export interface LibraryIssue extends Issue {
    role: "library";

    /**
     * The problematic library
     */
    library: ResolvedLibrary;
}
export interface MinecraftJarIssue extends Issue {
    role: "minecraftJar";

    /**
     * The minecraft version for that jar
     */
    version: string;
}
export interface VersionJsonIssue extends Issue {
    role: "versionJson";

    /**
     * The version of version json that has problem.
     */
    version: string;
}
export interface AssetIssue extends Issue {
    role: "asset";

    /**
     * The problematic asset
     */
    asset: { name: string; hash: string; size: number; };
}
export interface AssetIndexIssue extends Issue {
    role: "assetIndex";

    /**
     * The minecraft version of the asset index
     */
    version: string;
}

export interface MinecraftIssueReport {
    minecraftLocation: MinecraftFolder;
    version: string;
    issues: MinecraftIssues[];
}

export interface InstallProfileIssueReport {
    minecraftLocation: MinecraftFolder;
    installProfile: InstallProfile;
    issues: ProcessorIssue[];
}

async function diagnoseSingleFile(role: Issue["role"], file: string, expectedChecksum: string, hint: string) {
    let issue = false;
    let fileExisted = await exists(file);
    let receivedChecksum = "";
    if (!fileExisted) {
        issue = true;
    } else if (expectedChecksum !== "") {
        receivedChecksum = await getSha1(file);
        issue = receivedChecksum !== expectedChecksum;
    }
    if (issue) {
        return {
            type: fileExisted ? "corrupted" : "missing",
            role,
            file,
            expectedChecksum,
            receivedChecksum,
            hint,
        } as any;
    }
    return undefined;
}

/**
 * Diagnose the version. It will check the version json/jar, libraries and assets.
 *
 * @param version The version id string
 * @param minecraft The minecraft location
 * @beta
 */
export function diagnoseTask(version: string, minecraftLocation: MinecraftLocation): Task<MinecraftIssueReport> {
    const minecraft = MinecraftFolder.from(minecraftLocation);
    return task("diagnose", async function diagnose(context: Task.Context) {
        let report: MinecraftIssueReport = {
            minecraftLocation: minecraft,
            version: version,
            issues: [],
        }
        let issues: Issue[] = report.issues;

        let resolvedVersion: ResolvedVersion;
        try {
            resolvedVersion = await context.execute(task("checkVersionJson", () => Version.parse(minecraft, version)));
        } catch (e) {
            if (e.error === "CorruptedVersionJson") {
                issues.push({ type: "corrupted", role: "versionJson", file: minecraft.getVersionJson(e.version), expectedChecksum: "", receivedChecksum: "", hint: "Re-install the minecraft!" });
            } else {
                issues.push({ type: "missing", role: "versionJson", file: minecraft.getVersionJson(e.version), expectedChecksum: "", receivedChecksum: "", hint: "Re-install the minecraft!" });
            }
            return report;
        }

        await context.execute(task("checkJar", async function checkJar() {
            let jarPath = minecraft.getVersionJar(resolvedVersion.minecraftVersion);
            let issue: MinecraftJarIssue | undefined = await diagnoseSingleFile("minecraftJar",
                jarPath,
                resolvedVersion.downloads.client.sha1,
                "Problem on Minecraft jar! Please consider to use Installer.instalVersion to fix.");
            if (issue) {
                issue.version = resolvedVersion.minecraftVersion;
                issues.push(issue);
            }
        }));

        let assetsIndexPath = minecraft.getAssetsIndex(resolvedVersion.assets);
        let validAssetIndex = await context.execute(task("checkAssetIndex", async function checkAssetIndex() {
            let issue: AssetIndexIssue | undefined = await diagnoseSingleFile("assetIndex",
                assetsIndexPath,
                resolvedVersion.assetIndex.sha1,
                "Problem on assets index file! Please consider to use Installer.installAssets to fix.");
            if (issue) {
                issue.version = resolvedVersion.minecraftVersion;
                issues.push(issue);
                return false;
            }
            return true;
        }));
        await context.execute(task("checkLibraries", function checkLibraries() {
            return Promise.all(resolvedVersion.libraries.map(async (lib) => {
                let libPath = minecraft.getLibraryByPath(lib.download.path);
                let issue: LibraryIssue | undefined = await diagnoseSingleFile("library", libPath, lib.download.sha1,
                    "Problem on library! Please consider to use Installer.installLibraries to fix.");
                if (issue) {
                    issue.library = lib;
                    issues.push(issue);
                }
            }));
        }));
        if (validAssetIndex) {
            let objects = (await readFile(assetsIndexPath, "utf-8").then((b) => JSON.parse(b.toString()))).objects;
            let filenames = Object.keys(objects);
            await context.execute(task("checkAssets", function checkAssets() {
                return Promise.all(filenames.map(async (filename) => {
                    let { hash, size } = objects[filename];
                    let assetPath = minecraft.getAsset(hash);

                    let issue: AssetIssue | undefined = await diagnoseSingleFile("asset", assetPath, hash,
                        "Problem on asset! Please consider to use Installer.installAssets to fix.");
                    if (issue) {
                        issue.asset = { name: filename, hash, size };
                        issues.push(issue);
                    }
                }));
            }));
        }

        return report;
    });
}

/**
 * Diagnose the version. It will check the version json/jar, libraries and assets.
 * @beta
 *
 * @param version The version id string
 * @param minecraft The minecraft location
 */
export function diagnose(version: string, minecraft: MinecraftLocation): Promise<MinecraftIssueReport> {
    return Task.execute(diagnoseTask(version, minecraft)).wait();
}


/**
 * Diagnose a install profile status. Check if it processor output correctly processed.
 *
 * This can be used for check if forge correctly installed when minecraft >= 1.13
 * @beta
 *
 * @param installProfile The install profile.
 * @param minecraftLocation The minecraft location
 */
export function diagnoseInstallTask(installProfile: InstallProfile, minecraftLocation: MinecraftLocation) {
    const mc = MinecraftFolder.from(minecraftLocation);
    return task("diagnoseInstallProfile", async (c) => {
        let report: InstallProfileIssueReport = {
            minecraftLocation: mc,
            installProfile,
            issues: [],
        };
        let processors: Processor[];
        try {
            processors = resolveProcessors("client", installProfile, mc);
        } catch (e) {
            return report;
        }

        let done = 0;
        let total = processors.length;
        let issues = report.issues;
        c.update(done, total);
        for (let proc of processors) {
            if (proc.outputs) {
                for (let file in proc.outputs) {
                    let issue: ProcessorIssue = await diagnoseSingleFile("processor", file, proc.outputs[file].replace(/'/g, ""), "Re-install this installer profile!");
                    if (issue) {
                        issue.processor = proc;
                        issues.push(issue);
                    }
                }
            }
            c.update(done += 1, total, proc.jar);
        }

        return report;
    });
}

/**
 * Diagnose a install profile status. Check if it processor output correctly processed.
 *
 * This can be used for check if forge correctly installed when minecraft >= 1.13
 * @beta
 *
 * @param installProfile The install profile.
 * @param minecraftLocation The minecraft location
 */
export function diagnoseInstall(installProfile: InstallProfile, minecraftLocation: MinecraftLocation) {
    return Task.execute(diagnoseInstallTask(installProfile, minecraftLocation)).wait();
}

