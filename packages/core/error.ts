import { ResolvedLibrary, ResolvedVersion } from "./version";

export interface CorruptedVersionJarError {
    error: "CorruptedVersionJar";
    version: string;
}
export interface MissingLibrariesError {
    error: "MissingLibraries";
    libraries: ResolvedLibrary[];
    version: ResolvedVersion;
}
export interface BadVersionJsonError {
    error: "BadVersionJson";
    missing: "MainClass" | "AssetIndex" | "Downloads";
    version: string;
}
export interface CorruptedVersionJsonError {
    error: "CorruptedVersionJson";
    version: string;
    json: string;
}
export interface MissingVersionJsonError {
    error: "MissingVersionJson";
    version: string;
    path: string;
}

type _LauncherCoreError = CorruptedVersionJarError | MissingLibrariesError | BadVersionJsonError | CorruptedVersionJsonError | MissingVersionJsonError;
export type LauncherCoreError = (CorruptedVersionJarError | MissingLibrariesError | BadVersionJsonError | CorruptedVersionJsonError | MissingVersionJsonError) & Error;

/**
 * @ignore
 */
export function createErr<T extends _LauncherCoreError>(value: T, message?: string): T & Error {
    let err = new Error(message);
    return Object.assign(err, value);
}
