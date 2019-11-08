import { join } from "path";
import { vfs } from ".";

export interface MinecraftFolder {
    readonly root: string;
}

export class MinecraftFolder {
    get mods(): string { return join(this.root, "mods"); }
    get resourcepacks(): string { return join(this.root, "resourcepacks"); }
    get assets(): string { return join(this.root, "assets"); }
    get libraries(): string { return join(this.root, "libraries"); }
    get versions(): string { return this.getPath("versions"); }
    get logs(): string { return this.getPath("logs"); }
    get options(): string { return this.getPath("options.txt"); }
    get launcherProfile(): string { return this.getPath("launcher_profiles.json"); }
    get lastestLog(): string { return this.getPath("logs", "latest.log"); }
    get maps(): string { return this.getPath("saves"); }
    get saves(): string { return this.getPath("saves"); }
    get screenshots(): string { return this.getPath("screenshots"); }

    static from(location: MinecraftLocation) {
        return typeof location === "string"
            ? new MinecraftFolder(location)
            : location instanceof MinecraftFolder
                ? location
                : new MinecraftFolder((location as any).root);
    }

    constructor(readonly root: string) { }

    getNativesRoot(version: string) { return join(this.getVersionRoot(version), version + "-natives"); }
    getVersionRoot(version: string) { return join(this.versions, version); }
    getVersionJson(version: string) { return join(this.getVersionRoot(version), version + ".json"); }
    getVersionJar(version: string, type?: string) { return type === "client" || type === undefined ? join(this.getVersionRoot(version), version + ".jar") : join(this.getVersionRoot(version), `${version}-${type}.jar`); }
    getVersionAll(version: string) {
        return [
            join(this.versions, version), join(this.versions, version, version + ".json"),
            join(this.versions, version, version + ".jar")
        ];
    }
    getResourcePack(fileName: string) { return join(this.resourcepacks, fileName); }
    getMod(fileName: string) { return join(this.mods, fileName); }
    getLog(fileName: string) { return join(this.logs, fileName); }
    getMapInfo(map: string) { return this.getPath("saves", map, "level.dat"); }
    getMapIcon(map: string) { return this.getPath("saves", map, "icon.png"); }
    getLibraryByPath(libraryPath: string): string {
        return join(this.libraries, libraryPath);
    }
    getAssetsIndex(versionAssets: string): string { return this.getPath("assets", "indexes", versionAssets + ".json"); }
    getAsset(hash: string): string { return this.getPath("assets", "objects", hash.substring(0, 2), hash); }
    getPath(...path: string[]) {
        return join(this.root, ...path);
    }
}

export type MinecraftLocation = MinecraftFolder | string;
