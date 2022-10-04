import { ResolvedLibrary, ResolvedVersion, Version } from "./version";
import { MinecraftFolder, MinecraftLocation } from "./folder";
import { checksum, exists, isNotNull } from "./utils";
import { readFile, stat } from "fs/promises"

/**
 * Represent a issue for your diagnosed minecraft client.
 */
export interface Issue {
    /**
     * The type of the issue.
     */
    type: "missing" | "corrupted";
    /**
     * The role of the file in Minecraft.
     */
    role: string;
    /**
     * The path of the problematic file.
     */
    file: string;
    /**
     * The useful hint to fix this issue. This should be a human readable string.
     */
    hint: string;
    /**
     * The expected checksum of the file. Can be an empty string if this file is missing or not check checksum at all!
     */
    expectedChecksum: string;
    /**
     * The actual checksum of the file. Can be an empty string if this file is missing or not check checksum at all!
     */
    receivedChecksum: string;
}

export type MinecraftIssues = LibraryIssue | MinecraftJarIssue | VersionJsonIssue | AssetIssue | AssetIndexIssue;

/**
 * The library issue represents a corrupted or missing lib.
 * You can use `Installer.installResolvedLibraries` to fix this.
 */
export interface LibraryIssue extends Issue {
    role: "library";

    /**
     * The problematic library
     */
    library: ResolvedLibrary;
}
/**
 * The minecraft jar issue represents a corrupted or missing minecraft jar.
 * You can use `Installer.installVersion` to fix this.
 */
export interface MinecraftJarIssue extends Issue {
    role: "minecraftJar";

    /**
     * The minecraft version for that jar
     */
    version: string;
}
/**
 * The minecraft jar issue represents a corrupted or missing version jar.
 *
 * This means your version is totally broken, and you should reinstall this version.
 *
 * - If this is just a Minecraft version, you will need to use `Installer.install` to re-install Minecraft.
 * - If this is a Forge version, you will need to use `ForgeInstaller.install` to re-install.
 * - Others are the same, just re-install
 */
export interface VersionJsonIssue extends Issue {
    role: "versionJson";

    /**
     * The version of version json that has problem.
     */
    version: string;
}
/**
 * The asset issue represents a corrupted or missing minecraft asset file.
 * You can use `Installer.installResolvedAssets` to fix this.
 */
export interface AssetIssue extends Issue {
    role: "asset";

    /**
     * The problematic asset
     */
    asset: { name: string; hash: string; size: number; };
}
/**
 * The asset index issue represents a corrupted or missing minecraft asset index file.
 * You can use `Installer.installAssets` to fix this.
 */
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

export interface DiagnoseOptions {
    checksum?: (file: string, algorithm: string) => Promise<string>
    strict?: boolean
}

/**
 * Diagnose a single file by a certain checksum algorithm. By default, this use sha1
 */
export async function diagnoseFile<T extends string>({ file, expectedChecksum, role, hint, algorithm }: { file: string; expectedChecksum: string; role: T; hint: string; algorithm?: string }, options?: DiagnoseOptions) {
    let issue = false;
    let receivedChecksum = "";
    algorithm = algorithm ?? "sha1";

    const checksumFunc = options?.checksum?? checksum
    const fileExisted = await exists(file);
    if (!fileExisted) {
        issue = true;
    } else if (expectedChecksum !== "") {
        receivedChecksum = await checksumFunc(file, algorithm);
        issue = receivedChecksum !== expectedChecksum;
    }
    const type = fileExisted ? "corrupted" : "missing" as const
    if (issue) {
        return {
            type,
            role,
            file,
            expectedChecksum,
            receivedChecksum,
            hint,
        } as const;
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
export async function diagnose(version: string, minecraftLocation: MinecraftLocation, options?: DiagnoseOptions): Promise<MinecraftIssueReport> {
    const minecraft = MinecraftFolder.from(minecraftLocation);
    let report: MinecraftIssueReport = {
        minecraftLocation: minecraft,
        version: version,
        issues: [],
    }
    let issues: Issue[] = report.issues;

    let resolvedVersion: ResolvedVersion;
    try {
        resolvedVersion = await Version.parse(minecraft, version);
    } catch (err) {
        const e: any = err;
        if (e.error === "CorruptedVersionJson") {
            issues.push({ type: "corrupted", role: "versionJson", file: minecraft.getVersionJson(e.version), expectedChecksum: "", receivedChecksum: "", hint: "Re-install the minecraft!" });
        } else {
            issues.push({ type: "missing", role: "versionJson", file: minecraft.getVersionJson(e.version), expectedChecksum: "", receivedChecksum: "", hint: "Re-install the minecraft!" });
        }
        return report;
    }

    const jarIssue = await diagnoseJar(resolvedVersion, minecraft);

    if (jarIssue) {
        report.issues.push(jarIssue);
    }

    const assetIndexIssue = await diagnoseAssetIndex(resolvedVersion, minecraft);

    if (assetIndexIssue) {
        report.issues.push(assetIndexIssue);
    }

    const librariesIssues = await diagnoseLibraries(resolvedVersion, minecraft, options);

    if (librariesIssues.length > 0) {
        report.issues.push(...librariesIssues);
    }

    if (!assetIndexIssue) {
        const objects = (await readFile(minecraft.getAssetsIndex(resolvedVersion.assets), "utf-8").then((b) => JSON.parse(b.toString()))).objects;
        const assetsIssues = await diagnoseAssets(objects, minecraft, options);

        if (assetsIssues.length > 0) {
            report.issues.push(...assetsIssues);
        }
    }

    return report;
}

/**
 * Diagnose assets currently installed.
 * @param assetObjects The assets object metadata to check
 * @param minecraft The minecraft location
 * @returns The diagnose report
 */
export async function diagnoseAssets(assetObjects: Record<string, { hash: string; size: number }>, minecraft: MinecraftFolder, options?: DiagnoseOptions): Promise<Array<AssetIssue>> {
    const filenames = Object.keys(assetObjects);
    const issues = await Promise.all(filenames.map(async (filename) => {
        const { hash, size } = assetObjects[filename];
        const assetPath = minecraft.getAsset(hash);

        if (options?.strict) {
            const issue = await diagnoseFile({ file: assetPath, expectedChecksum: hash, role: "asset", hint: "Problem on asset! Please consider to use Installer.installAssets to fix." }, options);
            if (issue) {
                return Object.assign(issue, { asset: { name: filename, hash, size } });
            }
        } else {
            // non-strict mode might be faster
            const { size: realSize } = await stat(assetPath).catch(() => ({ size: -1 }))
            if (realSize !== size) {
                const issue = await diagnoseFile({ file: assetPath, expectedChecksum: hash, role: "asset", hint: "Problem on asset! Please consider to use Installer.installAssets to fix." }, options);
                if (issue) {
                    return Object.assign(issue, { asset: { name: filename, hash, size } });
                }
            }
        }

        return undefined;
    }));
    return issues.filter(isNotNull);
}

/**
 * Diagnose all libraries presented in this resolved version.
 *
 * @param resolvedVersion The resolved version to check
 * @param minecraft The minecraft location
 * @returns List of libraries issue
 * @see {@link ResolvedVersion}
 */
export async function diagnoseLibraries(resolvedVersion: ResolvedVersion, minecraft: MinecraftFolder, options?: DiagnoseOptions): Promise<Array<LibraryIssue>> {
    const issues = await Promise.all(resolvedVersion.libraries.map(async (lib) => {
        const libPath = minecraft.getLibraryByPath(lib.download.path);
        const issue = await diagnoseFile({ file: libPath, expectedChecksum: lib.download.sha1, role: "library", hint: "Problem on library! Please consider to use Installer.installLibraries to fix." }, options);
        if (issue) {
            return Object.assign(issue, { library: lib });
        }
        return undefined;
    }));
    return issues.filter(isNotNull);
}

export async function diagnoseAssetIndex(resolvedVersion: ResolvedVersion, minecraft: MinecraftFolder): Promise<AssetIndexIssue | undefined> {
    const assetsIndexPath = minecraft.getAssetsIndex(resolvedVersion.assets);
    const issue = await diagnoseFile(
        { file: assetsIndexPath, expectedChecksum: resolvedVersion.assetIndex?.sha1 ?? "", role: "assetIndex", hint: "Problem on assets index file! Please consider to use Installer.installAssets to fix." });
    if (issue) {
        return Object.assign(issue, { version: resolvedVersion.minecraftVersion });
    }
    return undefined;
}

export async function diagnoseJar(resolvedVersion: ResolvedVersion, minecraft: MinecraftFolder, options?: DiagnoseOptions): Promise<MinecraftJarIssue | undefined> {
    const jarPath = minecraft.getVersionJar(resolvedVersion.minecraftVersion);
    const issue = await diagnoseFile(
        { file: jarPath, expectedChecksum: resolvedVersion.downloads.client?.sha1 ?? "", role: "minecraftJar", hint: "Problem on Minecraft jar! Please consider to use Installer.instalVersion to fix." });
    if (issue) {
        return Object.assign(issue, { version: resolvedVersion.minecraftVersion });
    }
    return undefined;
}
