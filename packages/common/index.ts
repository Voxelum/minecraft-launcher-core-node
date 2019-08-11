export default class ResourceLocation {
    constructor(readonly domain: string, readonly id: string) { }
}

export interface Platform {
    name: "osx" | "linux" | "windows" | "unknown";
    version: string;
    arch: "32" | "64" | string;
}

export * from "./game";
export * from "./version";
export * from "./gamesetting";
export * from "./user";
export * from "./mojang";
export * from "./world";
export * from "./server";

const { World } = require("./world");
const { Version } = require("./version");
exports.World = World;
exports.Version = Version;
