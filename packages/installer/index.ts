/**
 * The installer module provides commonly used installation functions for Minecraft.
 * @packageDocumentation
 */

export * from "./fabric";
export * from "./liteloader";
export * from "./forge";
export * from "./minecraft";
export * from "./profile";
export * from "./curseforge";
export * from "./optifine";
export * from "./java";
export * from "./diagnose";
export {
    InstallOptions
} from "./utils";
export {
    DownloadBaseOptions,
    DownloadFallbackTask,
    DownloadFallbackOptions as DownloadMultiUrlOptions,
    DownloadUrlOptions as DownloadSingleUrlOptions,
    DownloadTask,
    Segment,
    Agents,
    Timestamped,
    ChecksumNotMatchError,
    createAgents,
    withAgents,
} from "./http";
export * from "./unzip";
