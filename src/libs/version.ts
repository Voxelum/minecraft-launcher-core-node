import * as fs from "fs";
import * as paths from "path";


import { gt } from "semver";
import Task from "treelike-task";
import { MinecraftFolder, MinecraftLocation } from "../index";
import { computeChecksum, exists, missing } from "./utils/common";

function getPlatform() {
    const os = require("os");
    let arch = os.arch();
    if (arch.startsWith("x")) { arch = arch.substring(1); }
    const version = os.release();
    const name: string = "unknown";
    switch (os.platform()) {
        case "darwin":
            return { name: "osx", version, arch };
        case "linux":
            return { name, version, arch };
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
        libraries: Library[];

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
     * Mixin the versions libs and game arguments. If two version has same lib in different version, this function will take higher version
     *
     * @param src The src version
     * @param extra The extra version which will overlap most of the src version
     */
    export function mixinVersion(src: Version, extra: Version): Version {
        if (src.assets !== extra.assets) { throw new Error("Cannot mixin to the different minecraft version"); }

        const libMap: { [name: string]: Library } = {};
        src.libraries.forEach((l) => { libMap[name] = l; });
        extra.libraries.forEach((l) => {
            const splited = l.name.split(":");
            const name = `${splited[0]}:${splited[1]}`;
            const version = splited[2];
            if (!libMap[name]) {
                libMap[name] = l;
            } else {
                const otherVersion = libMap[name].name.substring(libMap[name].name.lastIndexOf(":") + 1, libMap[name].name.length);
                if (gt(version, otherVersion)) {
                    libMap[name] = l;
                }
            }
        });
        const gameArgs = [...extra.arguments.game];
        const eTweak = gameArgs.indexOf("--tweakClass");
        const sTweak = src.arguments.game.indexOf("--tweakClass");
        if (eTweak !== -1) {
            if (sTweak !== -1 && gameArgs[eTweak + 1] !== src.arguments.game[sTweak + 1]) {
                gameArgs.push("--tweakClass", src.arguments.game[sTweak + 1]);
            }
        } else if (sTweak !== -1) {
            gameArgs.push("--tweakClass", src.arguments.game[sTweak + 1]);
        }
        return {
            id: `${src.id}-${extra.id}`,
            time: new Date().toISOString(),
            releaseTime: new Date().toISOString(),

            client: extra.client,
            server: extra.server,

            type: extra.type,
            assets: extra.assets,
            assetIndex: extra.assetIndex,
            downloads: extra.downloads,
            libraries: Object.keys(libMap).map((k) => libMap[k]),
            arguments: {
                jvm: extra.arguments.jvm,
                game: gameArgs,
            },
            mainClass: extra.mainClass,
            minimumLauncherVersion: Math.max(src.minimumLauncherVersion, extra.minimumLauncherVersion),
        };
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
        const jarPath = minecraft.getVersionJar(version);
        const missingJar = await context.execute("checkJar", () => missing(jarPath));
        let resolvedVersion: Version;
        try {
            resolvedVersion = await context.execute("checkVersionJson", () => Version.parse(minecraft, version));
        } catch (e) {
            return {
                minecraftLocation: minecraft,
                version,

                missingVersionJson: e.version,
                missingVersionJar: missingJar,
                missingAssetsIndex: false,

                missingLibraries: [],
                missingAssets: {},
            };
        }
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
    const folderLoc = typeof path === "string" ? path : path.root;
    return new Promise<Version[]>((res, rej) => {
        const stack: Version[] = [];
        const fullPath = paths.join(folderLoc, "versions", version, version + ".json");
        function interal(jsonPath: string, versionName: string): Promise<Version[]> {
            if (!fs.existsSync(jsonPath)) {
                return Promise.reject({
                    type: "MissingVersionJson",
                    version: versionName,
                });
            }
            return fs.promises.readFile(jsonPath).then((value) => {
                const ver = parseVersionJson(value.toString());
                stack.push(ver);
                if (ver.inheritsFrom) {
                    return interal(paths.join(folderLoc, "versions", ver.inheritsFrom, ver.inheritsFrom + ".json"), ver.inheritsFrom);
                } else {
                    return stack;
                }
            });
        }
        interal(fullPath, version).then((r) => res(r), (e) => rej(e));
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
    } as Version;
}

function parseVersionJson(versionString: string): Version {
    const platform = getPlatform();
    const checkAllowed = (rules: Array<{ action?: string, os?: any }>) => {
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
    };
    const parseLibs = (libs: any[]) => {
        const empty = new Library("", { path: "", sha1: "", size: 0, url: "" });
        return libs.map((lib) => {
            if (lib.rules && !checkAllowed(lib.rules)) { return empty; }
            if (lib.natives) {
                if (!lib.natives[platform.name]) { return empty; }
                const classifier = (lib.natives[platform.name] as string).replace("${arch}", platform.arch);
                const nativArt = lib.downloads.classifiers[classifier];
                if (!nativArt) { return empty; }
                return new Native(lib.name, lib.downloads.classifiers[classifier], lib.extract ? lib.extract.exclude ? lib.extract.exclude : undefined : undefined);
            } else {
                if (lib.downloads) { return new Library(lib.name, lib.downloads.artifact); }

                const url = lib.url || "https://libraries.minecraft.net/";
                const pathArr = lib.name.split(":");
                const groupPath = pathArr[0].replace(/\./g, "/");
                const id = pathArr[1];
                const version = pathArr[2];
                const isSnapshot = version.endsWith("-SNAPSHOT");

                const path = !isSnapshot ? `${groupPath}/${id}/${version}/${id}-${version}.jar` : `${groupPath}/${id}/${version}/${version}.jar`;

                const artifact: Artifact = {
                    size: -1,
                    sha1: lib.checksums ? lib.checksums[0] : "",
                    path,
                    url: `${url}${path}`,
                };
                return new Library(lib.name, artifact, lib.checksums, lib.serverreq, lib.clientreq);
            }
        }).filter((l) => l !== empty);
    };
    const parseArgs = (args: any) => {
        if (args.jvm) {
            args.jvm = args.jvm.map((a: string | any) => {
                if (typeof a === "object") { return checkAllowed(a.rules) ? a.value : undefined; }
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
        if (key === "libraries") { return parseLibs(value); }
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
            .filter((arg: LaunchArgument) => typeof arg === "string" ? true : checkAllowed(arg.rules) ? true : false)
            .forEach((arg: LaunchArgument) => typeof arg === "string" ? jvms.push(arg) : arg.value instanceof Array ? jvms.push(...arg.value) : jvms.push(arg.value as string));
        parsed.arguments.jvm = jvms;
    }
    return parsed as Version;
}
