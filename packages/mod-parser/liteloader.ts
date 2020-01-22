import { FileSystem, System } from "@xmcl/system";

export const DEFAULT_VERSION_MANIFEST = "http://dl.liteloader.com/versions/versions.json";
export interface MetaData {
    readonly mcversion: string;
    readonly name: string;
    readonly revision: number;

    readonly author?: string;
    readonly version?: string;
    readonly description?: string;
    readonly url?: string;

    readonly tweakClass?: string;
    readonly dependsOn?: string[];
    readonly injectAt?: string;
    readonly requiredAPIs?: string[];
    readonly classTransformerClasses?: string[];
}
export interface VersionMeta {
    version: string;
    url: string;
    file: string;
    mcversion: string;
    type: "RELEASE" | "SNAPSHOT";
    md5: string;
    timestamp: string;
    libraries: Array<{ name: string, url?: string }>;
    tweakClass: string;
}
export async function readModMetaData(mod: string | Uint8Array | FileSystem) {
    const fs = await System.resolveFileSystem(mod);
    const text = await fs.readFile("litemod.json", "utf-8").catch(() => undefined);
    if (!text) {
        throw {
            error: "IllegalInputType",
            errorMessage: "Illegal input type! Expect a jar file contains litemod.json",
            mod,
        };
    }
    const metadata = JSON.parse(text.trim(), (key, value) => key === "revision" ? Number.parseInt(value, 10) : value) as MetaData;
    if (!metadata.version) {
        (metadata as any).version = `${metadata.mcversion}:${metadata.revision || 0}`;
    }
    return metadata;
}
