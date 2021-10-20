/**
 * The core package for launching Minecraft.
 * It provides the {@link Version.parse} function to parse Minecraft version,
 * and the {@link launch} function to launch the game.
 *
 * @packageDocumentation
 * @module @xmcl/core
 */

export * from "./launch";
export * from "./version";
export * from "./platform";
export * from "./folder";
export * from "./diagnose";
export {
    access as _access, exists as _exists, mkdir as _mkdir, readFile as _readFile, writeFile as _writeFile, pipeline as _pipeline,
    checksum
} from "./utils";
