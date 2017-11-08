// import { Artifact, Library } from '../version'

import * as paths from 'path'

// function getArtifactBasePath(groupId: string, artifactId: string, version: string): string {
//     return groupId.replace('.', '/') + "/" + artifactId + "/" + version + "/";
// }

// function isSnapshot(artifact: Artifact) { return artifact.version.endsWith("-SNAPSHOT"); }

// function getPath(artfact: Artifact, snapshotPostfix = undefined) {
//     var version: string;
//     if (snapshotPostfix) {
//         if (!isSnapshot(artfact))
//             throw new TypeError("The artifact is not a snapshot.");
//         version = artfact.version.substring(0, artfact.version.length - "SNAPSHOT".length) + snapshotPostfix;
//     } else version = artfact.version;
//     return getPath0(artfact);
// }

// function getPath0(artfact: Artifact) {
//     return getArtifactBasePath(artfact.groupId, artfact.id, artfact.version) +
//         artfact.id + "-" + artfact.version + (artfact.classifier ? "-" + artfact.classifier : "") + "." + artfact.type;
// }
export class MinecraftFolder {
    constructor(readonly root: string) { }
    get mods(): string { return paths.join(this.root, 'mods') }
    get resourcepacks(): string { return paths.join(this.root, 'resourcepacks') }
    get assets(): string { return paths.join(this.root, 'assets') }
    get libraries(): string { return paths.join(this.root, 'libraries') }
    get versions(): string { return this.getPath('versions') }
    get logs(): string { return this.getPath('logs') }
    get options(): string { return this.getPath('options.txt') }
    get launcherProfile(): string { return this.getPath('launcher_profiles.json') }
    get lastestLog(): string { return this.getPath('logs', 'latest.log') }
    get maps(): string { return this.getPath('saves') }

    getNativesRoot(version: string) { return paths.join(this.getVersionRoot(version), version + '-natives') }
    getVersionRoot(version: string) { return paths.join(this.versions, version) }
    getVersionJson(version: string) { return paths.join(this.getVersionRoot(version), version + '.json') }
    getVersionJar(version: string) { return paths.join(this.getVersionRoot(version), version + '.jar') }
    getVersionAll(version: string) {
        return [paths.join(this.versions, version), paths.join(this.versions, version, version + '.json'),
        paths.join(this.versions, version, version + '.jar')]
    }
    getResourcePack(fileName: string) { return paths.join(this.resourcepacks, fileName) }
    getMod(fileName: string) { return paths.join(this.mods, fileName) }
    getLog(fileName: string) { return paths.join(this.logs, fileName) }
    getMapInfo(map: string) { return this.getPath('saves', map, 'level.dat') }
    getMapIcon(map: string) { return this.getPath('saves', map, 'icon.png') }
    getLibraryByPath(libraryPath: string): string {
        return paths.join(this.libraries, libraryPath);
    }
    // getLibrary(library: Library): string {
    //     if (library.downloadInfo)
    //         return this.getPath('libraries', library.downloadInfo.path)
    //     return this.getPath('libraries', getPath(library))
    // }

    getPath(...path: string[]) {
        return paths.join(this.root, ...path)
    }
}

export type MinecraftLocation = MinecraftFolder | string


