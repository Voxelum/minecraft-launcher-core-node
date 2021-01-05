import { diagnoseFile, Issue, LibraryIssue, MinecraftFolder, MinecraftLocation, Version } from "@xmcl/core";
import { InstallProfile, resolveProcessors, PostProcessor } from "./profile";

export type InstallIssues = ProcessorIssue | LibraryIssue;

/**
 * The processor issue
 */
export interface ProcessorIssue extends Issue {
    role: "processor";

    /**
     * The processor
     */
    processor: PostProcessor;
}

export interface InstallProfileIssueReport {
    minecraftLocation: MinecraftFolder;
    installProfile: InstallProfile;
    issues: InstallIssues[];
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
export async function diagnoseInstall(installProfile: InstallProfile, minecraftLocation: MinecraftLocation) {
    const mc = MinecraftFolder.from(minecraftLocation);
    const report: InstallProfileIssueReport = {
        minecraftLocation: mc,
        installProfile,
        issues: [],
    };
    const issues = report.issues;
    const processors: PostProcessor[] = resolveProcessors("client", installProfile, mc);
    await Promise.all(Version.resolveLibraries(installProfile.libraries).map(async (lib) => {
        const libPath = mc.getLibraryByPath(lib.download.path);
        const issue = await diagnoseFile({
            role: "library",
            file: libPath,
            expectedChecksum: lib.download.sha1,
            hint: "Problem on install_profile! Please consider to use Installer.installByProfile to fix."
        });
        if (issue) {
            issues.push(Object.assign(issue, { library: lib }));
        }
    }));
    for (const proc of processors) {
        if (proc.outputs) {
            for (const file in proc.outputs) {
                const issue = await diagnoseFile({
                    role: "processor",
                    file,
                    expectedChecksum: proc.outputs[file].replace(/'/g, ""),
                    hint: "Re-install this installer profile!"
                });
                if (issue) {
                    issues.push(Object.assign(issue, { processor: proc }));
                }
            }
        }
    }
    return report;
}

