import { Platform } from "./platform";

export interface System extends Platform {
    fs: FileSystem;
    openFileSystem(basePath: string | Uint8Array): Promise<FileSystem>;

    md5(data: Uint8Array): Promise<string>;
    sha1(data: Uint8Array): Promise<string>;

    decodeBase64(input: string): string;
    encodeBase64(input: string): string;

    gzip(buffer: Uint8Array): Promise<Uint8Array>;
    gzipSync(buffer: Uint8Array): Uint8Array;
    unzip(buffer: Uint8Array): Promise<Uint8Array>;
    unzipSync(buffer: Uint8Array): Uint8Array;

    basename(path: string): string;
    /**
     * Just like `path.join`
     */
    join(...paths: string[]): string;

    eol: string;
}

export abstract class FileSystem {
    abstract readonly root: string;

    // base methods

    abstract isDirectory(name: string): Promise<boolean>;
    abstract writeFile(name: string, data: Uint8Array): Promise<void>;
    abstract existsFile(name: string): Promise<boolean>;
    abstract readFile(name: string, encoding: "utf-8" | "base64"): Promise<string>;
    abstract readFile(name: string): Promise<Uint8Array>;
    abstract readFile(name: string, encoding?: "utf-8" | "base64"): Promise<Uint8Array | string>;

    abstract listFiles(name: string): Promise<string[]>;

    // extension methods

    async walkFiles(startingDir: string, walker: (path: string) => void | Promise<void>) {
        const childs = await this.listFiles(startingDir);
        for (const child of childs) {
            if (this.isDirectory(child)) {
                await this.walkFiles(System.join(startingDir, child), walker);
            } else {
                const result = walker(System.join(startingDir, child));
                if (result instanceof Promise) {
                    await result;
                }
            }
        }
    }

    async validateSha1(name: string, hash: string) {
        if (!await this.existsFile(name)) {
            return false;
        }
        const sha1 = await System.sha1(await this.readFile(name));
        return sha1 === hash;
    }
}

export class MinecraftFolder {
    get mods(): string { return System.join(this.root, "mods"); }
    get resourcepacks(): string { return System.join(this.root, "resourcepacks"); }
    get assets(): string { return System.join(this.root, "assets"); }
    get libraries(): string { return System.join(this.root, "libraries"); }
    get versions(): string { return this.getPath("versions"); }
    get logs(): string { return this.getPath("logs"); }
    get options(): string { return this.getPath("options.txt"); }
    get launcherProfile(): string { return this.getPath("launcher_profiles.json"); }
    get lastestLog(): string { return this.getPath("logs", "latest.log"); }
    get maps(): string { return this.getPath("saves"); }
    get saves(): string { return this.getPath("saves"); }
    get screenshots(): string { return this.getPath("screenshots"); }

    static from(location: MinecraftLocation) {
        return typeof location === "string" ? new MinecraftFolder(location) : location;
    }
    constructor(readonly root: string) { }

    getNativesRoot(version: string) { return System.join(this.getVersionRoot(version), version + "-natives"); }
    getVersionRoot(version: string) { return System.join(this.versions, version); }
    getVersionJson(version: string) { return System.join(this.getVersionRoot(version), version + ".json"); }
    getVersionJar(version: string, type?: string) { return type === "client" || type === undefined ? System.join(this.getVersionRoot(version), version + ".jar") : System.join(this.getVersionRoot(version), `${version}-${type}.jar`); }
    getVersionAll(version: string) {
        return [
            System.join(this.versions, version), System.join(this.versions, version, version + ".json"),
            System.join(this.versions, version, version + ".jar")
        ];
    }
    getResourcePack(fileName: string) { return System.join(this.resourcepacks, fileName); }
    getMod(fileName: string) { return System.join(this.mods, fileName); }
    getLog(fileName: string) { return System.join(this.logs, fileName); }
    getMapInfo(map: string) { return this.getPath("saves", map, "level.dat"); }
    getMapIcon(map: string) { return this.getPath("saves", map, "icon.png"); }
    getLibraryByPath(libraryPath: string): string {
        return System.join(this.libraries, libraryPath);
    }
    getAssetsIndex(versionAssets: string): string { return this.getPath("assets", "indexes", versionAssets + ".json"); }
    getAsset(hash: string): string { return this.getPath("assets", "objects", hash.substring(0, 2), hash); }
    getPath(...path: string[]) {
        return System.join(this.root, ...path);
    }
}

export type MinecraftLocation = MinecraftFolder | string;

export let System: System;

export function setSystem(sys: System) {
    System = sys;
}

