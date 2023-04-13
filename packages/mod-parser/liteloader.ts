import { FileSystem, resolveFileSystem } from "@xmcl/system";

export interface LiteloaderModMetadata {
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

export async function readLiteloaderMod(mod: string | Uint8Array | FileSystem) {
    const fs = await resolveFileSystem(mod);
    const text = await fs.readFile("litemod.json", "utf-8").then((s) => s.replace(/^\uFEFF/, "")).catch(() => undefined);
    if (!text) {
        throw {
            error: "IllegalInputType",
            errorMessage: "Illegal input type! Expect a jar file contains litemod.json",
            mod,
        };
    }
    const metadata = JSON.parse(text.trim(), (key, value) => key === "revision" ? Number.parseInt(value, 10) : value) as LiteloaderModMetadata;
    if (!metadata.version) {
        (metadata as any).version = `${metadata.mcversion}:${metadata.revision || 0}`;
    }
    fs.close();
    return metadata;
}
