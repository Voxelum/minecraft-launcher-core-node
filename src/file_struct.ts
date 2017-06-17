import { Artifact, Library } from './version'
import { endWith } from './string_utils'

import * as paths from 'path'

function getArtifactBasePath(groupId: string, artifactId: string, version: string): string {
    return groupId.replace('.', '/') + "/" + artifactId + "/" + version + "/";
}

function isSnapshot(artifact: Artifact) { return endWith(artifact.version, "-SNAPSHOT"); }

function getPath(artfact: Artifact, snapshotPostfix = undefined) {
    var version: string;
    if (snapshotPostfix) {
        if (!isSnapshot(artfact))
            throw new TypeError("The artifact is not a snapshot.");
        version = artfact.version.substring(0, artfact.version.length - "SNAPSHOT".length) + snapshotPostfix;
    } else version = artfact.version;

    return getPath0(artfact);
}

function getPath0(artfact: Artifact) {
    return getArtifactBasePath(artfact.groupId, artfact.id, artfact.version) +
        artfact.id + "-" + artfact.version + (artfact.classifier ? "-" + artfact.classifier : "") + "." + artfact.type;
}


export class MinecraftLocation {
    constructor(readonly root: string) { }

    get mods(): string { return paths.join(this.root, 'mods') }
    get resourcepacks(): string { return paths.join(this.root, 'resourcepacks') }
    get assets(): string { return paths.join(this.root, 'assets') }
    get libraries(): string { return paths.join(this.root, 'libraries') }
    get versions(): string { return this.getPath('versions') }
    get logs(): string { return this.getPath('logs') }
    get options(): string { return this.getPath('options.txt') }
    get launcherProfile(): string { return this.getPath('launcher_profiles.json') }
    get lastestLog(): string { return this.getPath(this.logs, 'latest.log') }

    getNativesRoot(version: string) { return paths.join(this.getVersionRoot(version), version + '-natives') }
    getVersionRoot(version: string) { return paths.join(this.versions, version) }
    getVersionJson(version: string) { return paths.join(this.getVersionRoot(version), version + '.json') }
    getVersionJar(version: string) { return paths.join(this.getVersionRoot(version), version + '.jar') }
    getResourcePack(fileName: string) { return paths.join(this.resourcepacks, fileName) }
    getMod(fileName: string) { return paths.join(this.mods, fileName) }
    getLog(fileName: string) { return paths.join(this.logs, fileName) }
    getLibrary(library: Library): string {
        if (library.downloadInfo)
            return this.getPath('libraries', library.downloadInfo.path)
        return this.getPath('libraries', getPath(library))
    }

    getPath(...path: string[]) {
        let target = this.root
        for (let p of path)
            target = paths.join(target, p)
        return target
    }
}

export class ResourceLocation {
    constructor(readonly domain: string, readonly id: string) { }
}
