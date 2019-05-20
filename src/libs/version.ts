import * as fs from "fs";
import * as paths from "path";

import Task from "treelike-task";
import { MinecraftFolder, MinecraftLocation } from "../index";
import { computeChecksum, exists, missing } from "./utils/common";

export function parseLibPath(name: string) {
    const pathArr = name.split(":");

    const groupPath = pathArr[0].replace(/\./g, "/");
    const id = pathArr[1];
    const versionIdentifier = pathArr[2];
    let version;
    let ext;
    if (versionIdentifier.indexOf("@") !== -1) {
        [version, ext] = versionIdentifier.split("@");
    } else {
        version = versionIdentifier;
        ext = "jar";
    }
    const isSnapshot = version.endsWith("-SNAPSHOT");

    return !isSnapshot ? `${groupPath}/${id}/${version}/${id}-${version}.${ext}` : `${groupPath}/${id}/${version}/${version}.${ext}`;
}

function getPlatform() {
    const os = require("os");
    let arch = os.arch();
    if (arch.startsWith("x")) { arch = arch.substring(1); }
    const version = os.release();
    switch (os.platform()) {
        case "darwin":
            return { name: "osx", version, arch };
        case "linux":
            return { name: "linux", version, arch };
        case "win32":
            return { name: "windows", version, arch };
        default:
            return { name: "unknown", version, arch };
    }
}

export interface Download {
    readonly sha1: string;
    readonly size: number;
    readonly url: string;
}
export interface AssetIndex extends Download {
    readonly id: string;
    readonly totalSize: number;
}
export interface Artifact extends Download {
    readonly path: string;
}
export interface LoggingFile extends Download {
    readonly id: string;
}


export interface RawArtifact {
    path: string;
    url: string;
    sha1: string;
    size: number;
}


export interface RawLib {
    name: string;
    rules?: Array<{ action: "allow" | "disallow", os?: { name: string } }>;
    extract?: {
        exclude: string[],
    };
    natives: {
        [os: string]: string,
    };
    downloads: {
        classifiers: {
            [os: string]: RawArtifact,
        },
        artifact: RawArtifact,
    };
    url?: string;
    checksums?: string[];
    serverreq?: boolean;
    clientreq?: boolean;
}

export type LaunchArgument = string | { rules: Array<{ action: string, features?: any, os?: { name?: string, version?: string } }>, value: string | string[] };
export interface Version {
    inheritsFrom?: string;
    assetIndex: AssetIndex;
    assets: string;
    downloads: {
        client: Download,
        server: Download,
        [key: string]: Download,
    };
    libraries: Library[];
    id: string;
    arguments: {
        game: LaunchArgument[],
        jvm: LaunchArgument[],
    };
    mainClass: string;
    minimumLauncherVersion: number;
    releaseTime: string;
    time: string;
    type: string;
    client: string;
    server: string;
    logging?: {
        [key: string]: {
            file: Download,
            argument: string,
            type: string,
        },
    };

    pathChain: string[];
}

export namespace Version {

    export interface Diagnosis {
        minecraftLocation: MinecraftFolder;
        version: string;

        missingVersionJson: string;
        missingVersionJar: boolean;
        missingAssetsIndex: boolean;

        missingLibraries: Library[];
        missingAssets: { [file: string]: string };
    }


    export interface Raw {
        id: string;
        time: string;
        type: string;
        releaseTime: string;
        inheritsFrom?: string;
        minimumLauncherVersion?: number;

        minecraftArguments?: string;
        arguments?: {
            game: LaunchArgument[],
            jvm: LaunchArgument[],
        };

        mainClass: string;
        libraries: RawLib[];

        jar?: string;


        assetIndex?: AssetIndex;
        assets?: string;
        downloads?: {
            client: Download,
            server: Download,
            [key: string]: Download,
        };

        client?: string;
        server?: string;
        logging?: {
            [key: string]: {
                file: Download,
                argument: string,
                type: string,
            },
        };
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
        return resolveDependency(minecraftPath, version).then(parseVersionHierarchy);
    }

    /**
     * Simply extends the version (actaully mixin)
     *
     * The result version will have the union of two version's libs. If one lib in two versions has different version, it will take the extra version one.
     * It will also mixin the launchArgument if it could.
     *
     * This function can be used for mixin forge and liteloader version.
     *
     * This function will throw an Error if two version have different assets. It doesn't care about the detail version though.
     *
     * @beta
     * @param id The new version id
     * @param parent The parent version will be inherited
     * @param extra The extra version info which will overlap some parent information
     * @return The raw version json could be save to the version json file
     */
    export function extendsVersion(id: string, parent: Version, extra: Version): Version.Raw {
        if (parent.assets !== extra.assets) { throw new Error("Cannot extends to the different minecraft version"); }

        const libMap: { [name: string]: Library } = {};
        parent.libraries.forEach((l) => { libMap[l.name] = l; });

        const extraLibs = extra.libraries.filter((l) => libMap[l.name] === undefined).map((lib) => {
            const alib: any = Object.assign({}, lib);
            delete alib.download;
            if (lib.download.sha1 === "") {
                const url = lib.download.url.substring(0, lib.download.url.length - lib.download.path.length);
                if (url !== "https://libraries.minecraft.net/") { alib.url = url; }
            }
            return alib;
        });
        const launcherVersion = Math.max(parent.minimumLauncherVersion, extra.minimumLauncherVersion);

        const raw: Version.Raw = {
            id,
            time: new Date().toISOString(),
            releaseTime: new Date().toISOString(),
            type: extra.type,
            libraries: extraLibs,
            mainClass: extra.mainClass,
            inheritsFrom: parent.id,
            minimumLauncherVersion: launcherVersion,
        };

        if (launcherVersion < 21) {
            raw.minecraftArguments = mixinArgumentString(parent.arguments.game.filter((arg) => typeof arg === "string").join(" "),
                extra.arguments.game.filter((arg) => typeof arg === "string").join(" "));
        } else {
            // not really know how new forge will do
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
        const arrA = hi.split(" ");
        const arrB = lo.split(" ");
        const args: { [key: string]: string[] } = {};
        for (let i = 0; i < arrA.length; i++) { // collection higher priority argument
            const element = arrA[i];
            if (!args[element]) { args[element] = []; }
            if (arrA[i + 1]) { args[element].push(arrA[i += 1]); }
        }
        for (let i = 0; i < arrB.length; i++) { // collect lower priority argument
            const element = arrB[i];
            if (!args[element]) { args[element] = []; }
            if (arrB[i + 1]) { args[element].push(arrB[i += 1]); }
        }
        const out: string[] = [];
        for (const k of Object.keys(args)) {
            switch (k) {
                case "--tweakClass":
                    const set: { [arg: string]: 0 } = {};
                    for (const v of args[k]) { set[v] = 0; }
                    Object.keys(set).forEach((v) => out.push(k, v));
                    break;
                default:
                    if (args[k][0]) { out.push(k, args[k][0]); } // use higher priority argument in common
                    break;
            }
        }
        return out.join(" ");
    }

    /**
     * Diagnose the version. It will check the version json/jar, libraries and assets.
     *
     * @param version The version id string
     * @param minecraft The minecraft location
     */
    export function diagnose(version: string, minecraft: MinecraftLocation): Promise<Diagnosis> {
        return diagnoseTask(version, minecraft).execute();
    }

    /**
     * Diagnose the version. It will check the version json/jar, libraries and assets.
     *
     * @param version The version id string
     * @param minecraft The minecraft location
     */
    export function diagnoseTask(version: string, minecraft: MinecraftLocation): Task<Diagnosis> {
        return Task.create("Diagnose", diagnoseSkeleton(version, typeof minecraft === "string" ? new MinecraftFolder(minecraft) : minecraft));
    }

    function mixinArgument(hi: {
        game: LaunchArgument[],
        jvm: LaunchArgument[],
    }, lo: {
        game: LaunchArgument[],
        jvm: LaunchArgument[],
    }) {

    }
}

function diagnoseSkeleton(version: string, minecraft: MinecraftFolder): (context: Task.Context) => Promise<Version.Diagnosis> {
    return async (context: Task.Context) => {
        let resolvedVersion: Version;
        try {
            resolvedVersion = await context.execute("checkVersionJson", () => Version.parse(minecraft, version));
        } catch (e) {
            return {
                minecraftLocation: minecraft,
                version,

                missingVersionJson: e.version,
                missingVersionJar: false,
                missingAssetsIndex: false,

                missingLibraries: [],
                missingAssets: {},
            };
        }
        const jarPath = minecraft.getVersionJar(resolvedVersion.client);
        const missingJar = await context.execute("checkJar", () => missing(jarPath));
        const assetsIndexPath = minecraft.getAssetsIndex(resolvedVersion.assets);
        const missingAssetsIndex = await context.execute("checkAssetIndex", async () => await missing(assetsIndexPath) || await computeChecksum(assetsIndexPath) !== resolvedVersion.assetIndex.sha1);
        const libMask = await context.execute("checkLibraries", () => Promise.all(resolvedVersion.libraries.map(async (lib) => {
            const libPath = minecraft.getLibraryByPath(lib.download.path);
            if (await exists(libPath)) {
                if (lib.download.sha1) {
                    return computeChecksum(libPath).then((c) => c === lib.download.sha1);
                }
                return true;
            }
            return false;
        })));
        const missingLibraries = resolvedVersion.libraries.filter((_, i) => !libMask[i]);
        const missingAssets: { [object: string]: string } = {};

        if (!missingAssetsIndex) {
            const objects = (await fs.promises.readFile(assetsIndexPath).then((b) => b.toString()).then(JSON.parse)).objects;
            const files = Object.keys(objects);
            const assetsMask = await context.execute("checkAssets", () => Promise.all(files.map(async (object) => {
                const { hash } = objects[object];
                const hashPath = minecraft.getAsset(hash);
                if (await exists(hashPath)) {
                    return (await computeChecksum(hashPath)) === hash;
                }
                return false;
            })));
            files.filter((_, i) => !assetsMask[i]).forEach((file) => { missingAssets[file] = objects[file].hash; });
        }

        return {
            minecraftLocation: minecraft,
            version,

            missingVersionJson: "",
            missingVersionJar: missingJar,
            missingAssetsIndex,

            missingLibraries,
            missingAssets,
        };
    };
}

export class Library {
    constructor(readonly name: string, readonly download: Artifact,
        readonly checksums?: string[], readonly serverreq?: boolean, readonly clientreq?: boolean) { }
}
export class Native extends Library {
    constructor(name: string, download: Artifact, readonly extractExclude?: string[]) {
        super(name, download);
    }
}

export function resolveDependency(path: MinecraftLocation, version: string): Promise<Version[]> {
    const folder = typeof path === "string" ? new MinecraftFolder(path) : path;
    return new Promise<Version[]>((res, rej) => {
        const stack: Version[] = [];
        const versionJsonPath = folder.getVersionJson(version);
        function interal(jsonPath: string, versionName: string): Promise<Version[]> {
            if (!fs.existsSync(jsonPath)) {
                return Promise.reject({
                    type: "MissingVersionJson",
                    version: versionName,
                });
            }
            return fs.promises.readFile(jsonPath).then((value) => {
                const versionInst = parseVersionJson(value.toString());
                Object.defineProperty(versionInst, "_path", { value: paths.dirname(jsonPath) });
                stack.push(versionInst);
                if (versionInst.inheritsFrom) {
                    return interal(folder.getVersionJson(versionInst.inheritsFrom), versionInst.inheritsFrom);
                } else {
                    return stack;
                }
            });
        }
        interal(versionJsonPath, version).then((r) => res(r), (e) => rej(e));
    });
}


function parseVersionHierarchy(hierarchy: Version[]): Version {
    if (hierarchy.length === 0) { throw new Error("The hierarchy cannot be empty!"); }
    const id: string = hierarchy[0].id;
    let assetIndex: AssetIndex = hierarchy[0].assetIndex;
    let assets: string = "";

    const downloadsMap: { [key: string]: Download } = {};
    const librariesMap: { [key: string]: Library } = {};
    const nativesMap: { [key: string]: Native } = {};

    let mainClass: string;
    let args: any;
    let minimumLauncherVersion: number = 0;
    const releaseTime: string = hierarchy[0].releaseTime;
    const time: string = hierarchy[0].time;
    let type: string;
    let logging: any;
    let client: string | undefined;

    const chains: string[] = hierarchy.map((j) => Reflect.get(j, "_path"));

    let json: Version;
    do {
        json = hierarchy.pop() as Version;
        minimumLauncherVersion = Math.max(json.minimumLauncherVersion || 0, minimumLauncherVersion);

        client = (json as any).jar || client || json.id;

        args = json.arguments;

        logging = json.logging || logging;
        assets = json.assets || assets;
        type = json.type;
        mainClass = json.mainClass;
        if (json.assetIndex) { assetIndex = json.assetIndex; }
        if (json.libraries) {
            json.libraries.forEach((lib) => {
                if (lib instanceof Native) {
                    nativesMap[lib.name] = lib;
                } else {
                    librariesMap[lib.name] = lib;
                }
            });
        }
        if (json.downloads) {
            for (const key in json.downloads) {
                downloadsMap[key] = json.downloads[key];
            }
        }
    } while (hierarchy.length !== 0);

    if (!mainClass) {
        throw {
            type: "CorruptedVersionJson",
            missing: "MainClass",
            version: id,
        };
    }
    if (!assetIndex) {
        throw {
            type: "CorruptedVersionJson",
            version: id,
            missing: "AssetIndex",
        };
    }

    return {
        id, assetIndex, assets, client,
        arguments: args,
        downloads: downloadsMap,
        libraries: Object.keys(librariesMap).map((k) => librariesMap[k]).concat(Object.keys(nativesMap).map((k) => nativesMap[k])),
        mainClass, minimumLauncherVersion, releaseTime, time, type, logging,
        pathChain: chains,
    } as Version;
}

function checkAllowed(rules: Array<{ action?: string, os?: any }>, platform: ReturnType<typeof getPlatform>) {
    // by default it's allowed
    if (!rules) { return true; }
    // else it's disallow by default
    let allow = false;
    for (const rule of rules) {
        const action = rule.action === "allow";
        // apply by default
        let apply = true;
        if (rule.os) {
            // don't apply by default if has os rule
            apply = false;
            const osRule = rule.os;
            if (platform.name === osRule.name
                && (!osRule.version || platform.version.match(osRule.version))) {
                apply = true;
            }
        }
        if (apply) { allow = action; }
    }
    return allow;
}

export function parseLibraries(libs: Version.Raw["libraries"], platform: ReturnType<typeof getPlatform> = getPlatform()) {
    const empty = new Library("", { path: "", sha1: "", size: 0, url: "" });
    return libs.map((lib) => {
        if (lib.rules && !checkAllowed(lib.rules, platform)) { return empty; }
        if (lib.natives) {
            if (!lib.natives[platform.name]) { return empty; }
            const classifier = (lib.natives[platform.name] as string).replace("${arch}", platform.arch);
            const nativArt = lib.downloads.classifiers[classifier];
            if (!nativArt) { return empty; }
            return new Native(lib.name, lib.downloads.classifiers[classifier], lib.extract ? lib.extract.exclude ? lib.extract.exclude : undefined : undefined);
        } else {
            const ensureUrl = (u: string, name: string, p: string) =>
                (u === "" || u === undefined) ?
                    name.split(":")[0] === "net.minecraftforge" ?
                        "https://files.minecraftforge.net/maven/" + p
                        : "https://libraries.minecraft.net/" + p
                    : u;

            if (lib.downloads) {
                lib.downloads.artifact.url = ensureUrl(lib.downloads.artifact.url, lib.name, lib.downloads.artifact.path);
                return new Library(lib.name, lib.downloads.artifact);
            }

            const path = parseLibPath(lib.name);
            const artifact: Artifact = {
                size: -1,
                sha1: lib.checksums ? lib.checksums[0] : "",
                path,
                url: ensureUrl(lib.url!, lib.name, path),
            };
            return new Library(lib.name, artifact, lib.checksums, lib.serverreq, lib.clientreq);
        }
    }).filter((l) => l !== empty);
}

function parseVersionJson(versionString: string): Version {
    const platform = getPlatform();
    const parseArgs = (args: any) => {
        if (args.jvm) {
            args.jvm = args.jvm.map((a: string | any) => {
                if (typeof a === "object") { return checkAllowed(a.rules, platform) ? a.value : undefined; }
                return a;
            }).filter((a: any) => a !== undefined).reduce((a: string[], b: string | string[]) => {
                if (b instanceof Array) { a.push(...b); } else { a.push(b); }
                return a;
            }, []);
        }
        if (args.game) {
            args.game = args.game.filter((a: string) => typeof a === "string");
        }
        return args;
    };
    const parsed = JSON.parse(versionString, (key, value) => {
        if (key === "libraries") { return parseLibraries(value, platform); }
        if (key === "arguments") { return parseArgs(value); }
        return value;
    });
    if (!parsed.arguments) {
        parsed.arguments = {
            game: parsed.minecraftArguments.split(" "),
            jvm: [
                {
                    rules: [
                        {
                            action: "allow",
                            os: {
                                name: "osx",
                            },
                        },
                    ],
                    value: [
                        "-XstartOnFirstThread",
                    ],
                },
                {
                    rules: [
                        {
                            action: "allow",
                            os: {
                                name: "windows",
                            },
                        },
                    ],
                    value: "-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump",
                },
                {
                    rules: [
                        {
                            action: "allow",
                            os: {
                                name: "windows",
                                version: "^10\\.",
                            },
                        },
                    ],
                    value: [
                        "-Dos.name=Windows 10",
                        "-Dos.version=10.0",
                    ],
                },
                "-Djava.library.path=${natives_directory}",
                "-Dminecraft.launcher.brand=${launcher_name}",
                "-Dminecraft.launcher.version=${launcher_version}",
                "-cp",
                "${classpath}",
            ],
        };
        const jvms: string[] = [];
        parsed.arguments.jvm
            .filter((arg: LaunchArgument) => typeof arg === "string" ? true : checkAllowed(arg.rules, platform) ? true : false)
            .forEach((arg: LaunchArgument) => typeof arg === "string" ? jvms.push(arg) : arg.value instanceof Array ? jvms.push(...arg.value) : jvms.push(arg.value as string));
        parsed.arguments.jvm = jvms;
    }
    return parsed as Version;
}
