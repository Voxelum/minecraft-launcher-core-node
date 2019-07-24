export default class ResourceLocation {
    constructor(readonly domain: string, readonly id: string) { }
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
