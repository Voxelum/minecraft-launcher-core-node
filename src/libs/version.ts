import * as paths from 'path'
import * as fs from 'fs-extra'
import { decompressXZ, unpack200 } from './utils/decompress'

import { MinecraftLocation } from '../index';

function getPlatform() {
    const os = require('os')
    let arch = os.arch();
    if (arch.startsWith('x')) arch = arch.substring(1);
    const version = os.release();
    let name: string = 'unknown'
    switch (os.platform()) {
        case 'darwin':
            return { name: 'osx', version, arch }
        case 'linux':
            return { name, version, arch }
        case 'win32':
            return { name: 'windows', version, arch }
        default:
            return { name: 'unknown', version, arch }
    }
}

export interface Download {
    readonly sha1: string,
    readonly size: number,
    readonly url: string
}
export interface AssetIndex extends Download {
    readonly id: string,
    readonly totalSize: number
}
export interface Artifact extends Download {
    readonly path: string;
    readonly compressed: boolean;
}
export interface LoggingFile extends Download {
    readonly id: string
}

export type LaunchArgument = string | { rules: { action: string, features?: any, os?: { name?: string, version?: string } }[], value: string | string[] };
export interface Version {
    inheritsFrom?: string,
    assetIndex: AssetIndex,
    assets: string,
    downloads: {
        client: Download,
        server: Download,
        [key: string]: Download,
    },
    libraries: Library[],
    id: string,
    arguments: {
        game: LaunchArgument[],
        jvm: LaunchArgument[],
    },
    mainClass: string,
    minimumLauncherVersion: number,
    releaseTime: string,
    time: string,
    type: string,
    client: string,
    server: string,
    logging?: {
        [key: string]: {
            file: Download,
            argument: string,
            type: string,
        }
    }
}


export namespace Version {
    export interface Raw {
        id: string,
        time: string,
        type: string,
        releaseTime: string,
        inheritsFrom?: string,
        minimumLauncherVersion?: number,

        minecraftArguments?: string,
        arguments?: {
            game: LaunchArgument[],
            jvm: LaunchArgument[],
        },

        mainClass: string,
        libraries: Library[],

        jar?: string,


        assetIndex?: AssetIndex,
        assets?: string,
        downloads?: {
            client: Download,
            server: Download,
            [key: string]: Download,
        },

        client?: string,
        server?: string,
        logging?: {
            [key: string]: {
                file: Download,
                argument: string,
                type: string,
            }
        }
    }
    /**
     * Recursively parse the version JSON. 
     * 
     * This function requires that the id in version.json is identical to the directory name of that version.
     * 
     * e.g. .minecraft/<version-a>/<version-a.json> and in <version-a.json>:
     * 
     * { "id": "<version-a>", ... }
     *  
     * @param minecraftPath The .minecraft path
     * @param version The vesion id.
     * @return The final resolved version detail
     */
    export function parse(minecraftPath: MinecraftLocation, version: string): Promise<Version> {
        return resolveDependency(minecraftPath, version).then(parseVersionHierarchy)
    }

    /**
     * Simply mixin the version (actaully mixin)
     * 
     * This function won't handle the lib version conflict 
     * 
     * @param parent 
     * @param extra 
     */
    export function mixinVersion(id: string, parent: Version, extra: Version): Version.Raw {
        const libMap: { [name: string]: Library } = {};
        parent.libraries.forEach(l => libMap[l.name] = l);
        const extraLibs = extra.libraries.filter(l => libMap[l.name] === undefined);
        const raw: Version.Raw = {
            id,
            time: new Date().toString(),
            releaseTime: new Date().toString(),
            type: extra.type,
            libraries: extraLibs,
            mainClass: extra.mainClass,
            inheritsFrom: parent.id,
        }
        return raw;
    }
    /**
     * Mixin the string arguments
     * @beta
     * @param hi Higher priority argument
     * @param lo Lower priority argument
     */
    export function mixinArgumentString(hi: string, lo: string): string {
        const arrA = hi.split(' ');
        const arrB = lo.split(' ');
        const args: { [key: string]: Array<string> } = {};
        for (let i = 0; i < arrA.length; i++) { // collection higher priority argument
            const element = arrA[i];
            if (!args[element]) { args[element] = []; }
            if (arrA[i + 1]) args[element].push(arrA[i += 1]);
        }
        for (let i = 0; i < arrB.length; i++) { // collect lower priority argument
            const element = arrB[i];
            if (!args[element]) { args[element] = []; }
            if (arrB[i + 1]) args[element].push(arrB[i += 1]);
        }
        const out: string[] = []
        for (const k of Object.keys(args)) {
            switch (k) {
                case '--tweakClass':
                    const set: { [arg: string]: 0 } = {};
                    for (const v of args[k]) set[v] = 0;
                    Object.keys(set).forEach(v => out.push(k, v))
                    break;
                default:
                    if (args[k][0]) out.push(k, args[k][0]); // use higher priority argument in common 
                    break;
            }
        }
        return out.join(' ');
    }
}
export class Library {
    constructor(readonly name: string, readonly download: Artifact) { }
}
export class Native extends Library {
    constructor(name: string, download: Artifact, readonly extractExclude?: string[]) {
        super(name, download);
    }
}

export function resolveDependency(path: MinecraftLocation, version: string): Promise<Version[]> {
    const folderLoc = typeof path === 'string' ? path : path.root;
    return new Promise<Version[]>((res, rej) => {
        let stack: Version[] = []
        let fullPath = paths.join(folderLoc, 'versions', version, version + '.json')
        if (!fs.existsSync(fullPath)) rej({
            type: "MissingVersionJson",
            version,
        });
        function interal(fullPath: string): Promise<Version[]> {
            return fs.readFile(fullPath).then((value) => {
                let ver = parseVersionJson(value.toString());
                stack.push(ver);
                if (ver.inheritsFrom)
                    return interal(paths.join(folderLoc, 'versions', ver.inheritsFrom, ver.inheritsFrom + '.json'))
                else
                    return stack
            })
        }
        interal(fullPath).then(r => res(r), e => rej(e))
    })
}


function parseVersionHierarchy(hierarchy: Version[]): Version {
    if (hierarchy.length === 0) throw new Error('The hierarchy cannot be empty!');
    let id: string = hierarchy[0].id;
    let assetIndex: AssetIndex = hierarchy[0].assetIndex;
    let assets: string = '';

    let downloadsMap: { [key: string]: Download } = {};
    let librariesMap: { [key: string]: Library } = {};
    let nativesMap: { [key: string]: Native } = {};

    let mainClass: string
    let args: any;
    let minimumLauncherVersion: number = hierarchy[0].minimumLauncherVersion;
    let releaseTime: string = hierarchy[0].releaseTime;
    let time: string = hierarchy[0].time;
    let type: string
    let logging: any;
    let client: string | undefined = undefined;

    let json: Version;
    do {
        json = hierarchy.pop() as Version;

        client = (json as any).jar || client || json.id;

        args = json.arguments;

        logging = json.logging || logging;
        assets = json.assets || assets;
        type = json.type;
        mainClass = json.mainClass;
        if (json.assetIndex) assetIndex = json.assetIndex
        if (json.libraries) {
            json.libraries.forEach(lib => {
                if (lib instanceof Native) {
                    nativesMap[lib.name] = lib;
                } else {
                    librariesMap[lib.name] = lib;
                }
            })
        }
        if (json.downloads)
            for (let key in json.downloads)
                downloadsMap[key] = json.downloads[key]
    } while (hierarchy.length != 0);

    if (!mainClass)
        throw {
            type: 'CorruptedVersionJson',
            missing: 'MainClass',
            version: id,
        };
    if (!assetIndex)
        throw {
            type: 'CorruptedVersionJson',
            version: id,
            missing: 'AssetIndex',
        };

    return {
        id, assetIndex, assets, client,
        arguments: args,
        downloads: downloadsMap,
        libraries: Object.keys(librariesMap).map(k => librariesMap[k]).concat(Object.keys(nativesMap).map(k => nativesMap[k])),
        mainClass, minimumLauncherVersion, releaseTime, time, type, logging,
    } as Version
}

function parseVersionJson(versionString: string): Version {
    const platform = getPlatform();
    const checkAllowed = (rules: { action?: string, os?: any }[]) => {
        // by default it's allowed
        if (!rules) return true;
        // else it's disallow by default
        let allow = false;
        for (let rule of rules) {
            let action = rule.action == "allow";
            // apply by default
            let apply = true;
            if (rule["os"]) {
                // don't apply by default if has os rule
                apply = false;
                let osRule = rule.os;
                if (platform.name == osRule.name
                    && (!osRule.version || platform.version.match(osRule.version)))
                    apply = true;
            }
            if (apply) allow = action;
        }
        return allow;
    }
    const parseLibs = (libs: Array<any>) => {
        const empty = new Library('', { path: '', sha1: '', size: 0, url: '', compressed: false })
        return libs.map(lib => {
            if (lib.rules && !checkAllowed(lib.rules)) return empty;
            if (lib.natives) {
                if (!lib.natives[platform.name]) return empty;
                const classifier = (lib.natives[platform.name] as string).replace('${arch}', platform.arch);
                const nativArt = lib.downloads.classifiers[classifier]
                if (!nativArt) return empty;
                return new Native(lib.name, lib.downloads.classifiers[classifier], lib.extract ? lib.extract.exclude ? lib.extract.exclude : undefined : undefined);
            } else {
                if (lib.downloads)
                    return new Library(lib.name, lib.downloads.artifact);
                const url = lib.url || 'https://libraries.minecraft.net/';
                const pathArr = lib.name.split(':');
                const groupPath = pathArr[0].replace(/\./g, '/')
                const id = pathArr[1];
                const version = pathArr[2];
                const isSnapshot = version.endsWith('-SNAPSHOT');

                const path = !isSnapshot ? `${groupPath}/${id}/${version}/${id}-${version}.jar` : `${groupPath}/${id}/${version}/${version}.jar`

                /**
                 * we have to check if our module support decompression or not
                 */
                const shouldCompressed = (lib.checksums) ? lib.checksums.length > 1 ? true : false : false
                const compressed = shouldCompressed && decompressXZ !== undefined;

                let actualUrl = `${url}${path}`;
                /**
                 * if we just cannot compress... maybe change source
                 */
                // if (shouldCompressed && !compressed) {
                //     /**
                //      * use maven central
                //      */
                //     actualUrl = `http://central.maven.org/maven2/${path}`;
                // }

                const artifact: Artifact = {
                    size: -1,
                    sha1: lib.checksums,
                    path,
                    compressed,
                    url: actualUrl
                }
                return new Library(lib.name, artifact);
            }
        }).filter(l => l !== empty)
    }
    const parseArgs = (args: any) => {
        if (args.jvm)
            args.jvm = args.jvm.map((a: string | any) => {
                if (typeof a === 'object') return checkAllowed(a.rules) ? a.value : undefined
                return a;
            }).filter((a: any) => a !== undefined).reduce((a: Array<string>, b: string | Array<string>) => {
                if (b instanceof Array) a.push(...b);
                else a.push(b);
                return a
            }, [])
        if (args.game)
            args.game = args.game.filter((a: string) => typeof a === 'string')
        return args;
    }
    const parsed = JSON.parse(versionString, (key, value) => {
        if (key === 'libraries') return parseLibs(value)
        if (key === 'arguments') return parseArgs(value)
        return value;
    })
    if (!parsed.arguments) {
        parsed.arguments = {
            game: parsed.minecraftArguments.split(' '),
            "jvm": [
                {
                    "rules": [
                        {
                            "action": "allow",
                            "os": {
                                "name": "osx"
                            }
                        }
                    ],
                    "value": [
                        "-XstartOnFirstThread"
                    ]
                },
                {
                    "rules": [
                        {
                            "action": "allow",
                            "os": {
                                "name": "windows"
                            }
                        }
                    ],
                    "value": "-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump"
                },
                {
                    "rules": [
                        {
                            "action": "allow",
                            "os": {
                                "name": "windows",
                                "version": "^10\\."
                            }
                        }
                    ],
                    "value": [
                        "-Dos.name=Windows 10",
                        "-Dos.version=10.0"
                    ]
                },
                "-Djava.library.path=${natives_directory}",
                "-Dminecraft.launcher.brand=${launcher_name}",
                "-Dminecraft.launcher.version=${launcher_version}",
                "-cp",
                "${classpath}"
            ]
        }
        const jvms: string[] = [];
        parsed.arguments.jvm
            .filter((arg: LaunchArgument) => typeof arg === 'string' ? true : checkAllowed(arg.rules) ? true : false)
            .forEach((arg: LaunchArgument) => typeof arg === 'string' ? jvms.push(arg) : arg.value instanceof Array ? jvms.push(...arg.value) : jvms.push(arg.value as string))
        parsed.arguments.jvm = jvms;
    }
    return parsed as Version;
}
