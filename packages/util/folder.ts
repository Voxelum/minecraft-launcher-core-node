import * as paths from "path";
export class MinecraftFolder {
    get mods(): string { return paths.join(this.root, "mods"); }
    get resourcepacks(): string { return paths.join(this.root, "resourcepacks"); }
    get assets(): string { return paths.join(this.root, "assets"); }
    get libraries(): string { return paths.join(this.root, "libraries"); }
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

    getNativesRoot(version: string) { return paths.join(this.getVersionRoot(version), version + "-natives"); }
    getVersionRoot(version: string) { return paths.join(this.versions, version); }
    getVersionJson(version: string) { return paths.join(this.getVersionRoot(version), version + ".json"); }
    getVersionJar(version: string, type?: string) { return type === "client" || type === undefined ? paths.join(this.getVersionRoot(version), version + ".jar") : paths.join(this.getVersionRoot(version), `${version}-${type}.jar`); }
    getVersionAll(version: string) {
        return [
paths.join(this.versions, version), paths.join(this.versions, version, version + ".json"),
        paths.join(this.versions, version, version + ".jar")
];
    }
    getResourcePack(fileName: string) { return paths.join(this.resourcepacks, fileName); }
    getMod(fileName: string) { return paths.join(this.mods, fileName); }
    getLog(fileName: string) { return paths.join(this.logs, fileName); }
    getMapInfo(map: string) { return this.getPath("saves", map, "level.dat"); }
    getMapIcon(map: string) { return this.getPath("saves", map, "icon.png"); }
    getLibraryByPath(libraryPath: string): string {
        return paths.join(this.libraries, libraryPath);
    }
    getAssetsIndex(versionAssets: string): string { return this.getPath("assets", "indexes", versionAssets + ".json"); }
    getAsset(hash: string): string { return this.getPath("assets", "objects", hash.substring(0, 2), hash); }
    getPath(...path: string[]) {
        return paths.join(this.root, ...path);
    }
}

export type MinecraftLocation = MinecraftFolder | string;


