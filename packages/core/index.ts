/**
 * The core package for launching Minecraft.
 * It provides the {@link Version.parse} function to parse Minecraft version,
 * and the {@link launch} function to launch the game.
 *
 * @packageDocumentation
 */

export * from "./launch";
export * from "./version";
export * from "./platform";
export * from "./folder";
export { BadVersionJsonError, CorruptedVersionJarError, CorruptedVersionJsonError, LauncherCoreError, MissingLibrariesError, MissingVersionJsonError } from "./error";
/**
 * The wrapped file system utility.
 */
import * as futils from "./fs";
export { futils }
