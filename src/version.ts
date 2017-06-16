/*
    This module migrate the JMCCC: https://github.com/to2mbn/JMCCC/blob/master/jmccc/src/main/java/org/to2mbn/jmccc/version/
*/

import * as fs from 'fs'
import * as os from 'os'
import * as paths from 'path'

/**
 * Virtual representation of artifact in memory. May not be the same with the file structure.
 */
export interface Artifact {
    readonly groupId: string,
    readonly id: string,
    readonly version: string,
    readonly classifier?: string,
    readonly type: string //= 'jar'
}

export interface Library extends Artifact {
    readonly downloadInfo?: LibraryArtifact,
    readonly customizedUrl?: string,
    readonly checksums?: string[]
}

export interface Native extends Library {
    readonly extractExcludes: string[]
}

/**
 * Abstract interface represent the download info. Closed to the actual file structure. Used by lots of things.
 */
export interface DownloadInfo {
    readonly url: string,
    readonly sha1: string,
    readonly size: number
}

export interface LibraryArtifact extends DownloadInfo {
    readonly path: string
}

export interface AssetIndex extends DownloadInfo {
    readonly id: string,
    readonly totalSize: number
}

/**
 * the version json file
 */
export class Version {
    constructor(readonly version: string, readonly type: string, readonly mainClass: string, readonly assets: string, readonly launchArgs: string,
        readonly root: string, readonly libraries: Library[], readonly legacy: boolean, readonly assetIndexDownloadInfo: AssetIndex,
        readonly downloads: { [id: string]: DownloadInfo }) {
    }
}

export namespace Version {
    export function parse(minecraftPath: string, version: string): Version | undefined {
        let stack = resolveDependency(minecraftPath, version)
        if (stack.length == 0) return undefined
        return parseVersionHierarchy(stack, currentPlatform())
    }
}

/**
 * the json tokens in assets index file
 */
export interface Asset {
    readonly virtualPath: string,
    readonly hash: string,
    readonly size: number
}

export namespace Asset {
    export function getPath(asset: Asset): string {
        return asset.hash.substring(0, 2) + "/" + asset.hash;
    }
}

class PlatformDescription {
    constructor(readonly name: string, readonly version: string, readonly arch: string) {
    }
}

function currentPlatform(): PlatformDescription {
    let platform = os.platform()
    let osName: string = 'unknown'
    switch (platform) {
        case 'darwin':
            osName = 'osx'
            break
        case 'linux':
            osName = 'linux'
            break
        case 'win32':
            osName = 'windows'
            break
    }
    return new PlatformDescription(osName, os.release(), platform)
}


function parseAssetIndex(json: any): Asset[] {
    let objects = json['objects'];
    let assets = [];
    for (let rawVirtualPath in objects) {
        let object = objects[rawVirtualPath];
        object.virtualPath = rawVirtualPath
        assets.push(<Asset>object);
    }
    return assets;
}

function resolveDependency(path: string, version: string): any[] {
    let stack = []
    let fullPath = paths.join(path, 'versions', version, version + '.json')
    if (fs.existsSync(fullPath)) {
        let obj
        do {
            obj = JSON.parse(fs.readFileSync(fullPath).toString('utf-8'))
            stack.push(obj)
            obj = obj.inheritsFrom
        } while (obj);
    }
    return stack
}

function parseVersionHierarchy(hierarchy: any[], platform: PlatformDescription) {
    let version: string = hierarchy[0].id;
    let root: string = hierarchy[hierarchy.length - 1].id;

    let assets = "legacy";
    let mainClass: string;
    let launchArgs: string;
    let type: string;

    let libs = []
    let downloads: { [key: string]: DownloadInfo } = {};
    let assetIndexInfo: AssetIndex | undefined;

    let json: any;
    do {
        json = hierarchy.pop();

        assets = json.assets;
        mainClass = json.mainClass;
        launchArgs = json.minecraftArguments;
        type = json.type;

        if (json.libraries) {
            for (let s of json.libraries) {
                let lib = parseLibrary(s, platform)
                if (lib) libs.push(lib)
            }
        }

        if (json.downloads)
            for (let key in json.downloads)
                downloads[key] = json.downloads[key]

        if (json.assetIndex)
            assetIndexInfo = json.assetIndex
    } while (hierarchy.length != 0);

    if (!mainClass)
        throw new Error("Missing mainClass");
    if (!launchArgs)
        throw new Error("Missing minecraftArguments");
    if (!assetIndexInfo)
        throw new Error('Missing asset!');

    return new Version(version, type, mainClass, assets, launchArgs, root, libs, assets == 'legacy', assetIndexInfo, downloads)
}
// function parseArtifactName(name: string) {
//     let splitedGav = name.split(":");
//     return { groupId: sp }
// }
function parseLibrary(json: any, platformDescription: PlatformDescription): Library | undefined {
    if (!json) return undefined;
    let clientreq = true
    if (json.clientreq)
        clientreq = json.clientreq
    if (!checkAllowed(json.rules, platformDescription)
        || !clientreq)
        return undefined;
    let splitedGav = json["name"].split(":", 3);
    let groupId = splitedGav[0];
    let artifactId = splitedGav[1];
    let version = splitedGav[2];

    let url = json.url;
    let checksums = json.checksums;
    let jsonNatives = json.natives;
    let classifier = jsonNatives ? parseNativeClassifier(jsonNatives, platformDescription) : undefined;
    let libinfo = parseLibraryDownloads(json.downloads, classifier);
    let type = "jar";

    let obj: any = {
        groupId: groupId,
        id: artifactId,
        version: version,
        type: type,
        downloadInfo: libinfo
    }

    if (classifier)
        obj.classifier = classifier
    if (url)
        obj.customizedUrl = url
    if (checksums)
        obj.checksums = checksums
    if (jsonNatives) {
        obj.extractExcludes = parseExtractExcludes(json.extract)
        return <Native>obj
    } else return obj
}

function parseNativeClassifier(natives: any, platform: PlatformDescription) {
    if (!natives) return undefined;
    let classifier = natives[platform.name]
    // if (classifier)
    // classifier = classifier("\\Q${arch}", platform.arch)
    return classifier;
}

function parseLibraryDownloads(json: any, classifier?: string): LibraryArtifact | undefined {
    if (!json) return undefined;
    if (!classifier)
        return json["artifact"];
    else {
        let classifiers = json.classifiers;
        if (!classifiers) return undefined;
        return classifiers[classifier];
    }
}

function parseExtractExcludes(json: any): string[] | undefined {
    if (!json) return undefined;
    let elements = json.exclude;
    if (!elements) return undefined;
    return elements;
}

function checkAllowed(rules: any, platformDescription: PlatformDescription): boolean {
    // by default it's allowed
    if (rules == null || Object.keys(rules).length == 0)
        return true;
    // else it's disallow by default
    let allow = false;
    for (let rule of rules) {
        let action = rule["action"] == "allow";
        // apply by default
        let apply = true;
        if (rule["os"]) {
            // don't apply by default if has os rule
            apply = false;
            let osRule = rule.os;

            if (platformDescription.name == osRule.name
                && (!osRule.version || platformDescription.version.match(osRule.version)))
                apply = true;
        }
        if (apply) allow = action;
    }
    return allow;
}
