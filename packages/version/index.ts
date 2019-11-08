import { MinecraftFolder, MinecraftLocation, Platform, vfs, currentPlatform } from "@xmcl/util";

type PickPartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type PartialResolvedVersion = Omit<PickPartial<ResolvedVersion, "assets" |
    "assetIndex" |
    "client" |
    "server" |
    "downloads">, "pathChain">;
/**
 * The resolved version for launcher.
 * It could be a combination of multiple versions as there might be some inheritions.
 */
export interface ResolvedVersion {
    inheritsFrom?: string;
    assetIndex: Version.AssetIndex;
    assets: string;
    downloads: {
        client: Version.Download,
        server: Version.Download,
        [key: string]: Version.Download,
    };
    libraries: ResolvedLibrary[];
    id: string;
    arguments: {
        game: Version.LaunchArgument[],
        jvm: Version.LaunchArgument[],
    };
    mainClass: string;
    minimumLauncherVersion: number;
    releaseTime: string;
    time: string;
    type: string;
    /**
     * The minecraft version of this version
     */
    client: string;
    server: string;
    logging?: {
        [key: string]: {
            file: Version.Download,
            argument: string,
            type: string,
        },
    };

    minecraftDirectory: string;

    pathChain: string[];
}

export interface LibraryInfo {
    readonly groupId: string;
    readonly artifactId: string;
    readonly version: string;
    readonly isSnapshot: boolean;
    readonly type: string;
    readonly classifier: string;
    readonly path: string;
    readonly name: string;
}

/**
 * A resolved library for launcher. It can by parsed from `LibraryInfo`.
 */
export class ResolvedLibrary implements LibraryInfo {
    readonly groupId: string;
    readonly artifactId: string;
    readonly version: string;
    readonly isSnapshot: boolean;
    readonly type: string;
    readonly classifier: string;
    readonly path: string;
    constructor(
        readonly name: string,
        info: LibraryInfo,
        readonly download: Version.Artifact,
        readonly checksums?: string[],
        readonly serverreq?: boolean,
        readonly clientreq?: boolean) {
        const { groupId, artifactId, version, isSnapshot, type, classifier, path } = info;
        this.groupId = groupId;
        this.artifactId = artifactId;
        this.version = version;
        this.isSnapshot = isSnapshot;
        this.type = type;
        this.classifier = classifier;
        this.path = path;
    }
}
export class ResolvedNative extends ResolvedLibrary {
    constructor(name: string,
        info: LibraryInfo,
        download: Version.Artifact,
        readonly extractExclude?: string[]) {
        super(name, info, download);
    }
}


export namespace Version {
    export interface Download {
        readonly sha1: string;
        readonly size: number;
        url: string;
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

    export interface NormalLibrary {
        name: string;
        downloads: {
            artifact: Artifact,
        };
    }

    export interface Rule {
        action: "allow" | "disallow";
        os?: Partial<Platform>;
        features?: { [feat: string]: boolean };
    }

    export interface NativeLibrary {
        name: string;
        downloads: {
            artifact: Artifact,
            classifiers: {
                [os: string]: Artifact,
            },
        };
        rules: Rule[];
        extract: {
            exclude: string[],
        };
        natives: {
            [os: string]: string,
        };
    }

    export interface PlatformSpecificLibrary {
        name: string;
        downloads: {
            artifact: Artifact,
        };
        rules: Rule[];
    }

    export interface LegacyLibrary {
        name: string;
        url?: string;
        clientreq?: boolean;
        serverreq?: boolean;
        checksums?: string[];
    }

    export type Library = NormalLibrary | NativeLibrary | PlatformSpecificLibrary | LegacyLibrary;

    export type LaunchArgument = string | {
        rules: Rule[];
        value: string | string[];
    };

    /**
      * Check if all the rules in `Rule[]` are acceptable in certain OS `platform` and features.
      * @param rules The rules usually comes from `Library` or `LaunchArgument`
      * @param platform The platform, leave it absent will use the `currentPlatform`
      * @param features The features, used by game launch argument `arguments.game`
      */
    export function checkAllowed(rules: Rule[], platform: Platform = currentPlatform, features: string[] = []): boolean {
        // by default it's allowed
        if (!rules || rules.length === 0) { return true; }
        // else it's disallow by default
        let allow = false;
        for (const rule of rules) {
            const action = rule.action === "allow";
            // apply by default
            let apply = true;
            if ("os" in rule && rule.os) {
                // don't apply by default if has os rule
                apply = false;
                const osRule = rule.os;
                if (platform.name === osRule.name
                    && (!osRule.version || platform.version.match(osRule.version))) {
                    apply = true;
                }
            }
            if (apply) {
                if ("features" in rule && rule.features) {
                    const featureRequire = rule.features;
                    // only apply when the EVERY required features enabled & not required features disabled
                    apply = Object.entries(featureRequire)
                        .every(([k, v]) => v ? features.indexOf(k) !== -1 : features.indexOf(k) === -1);
                }
            }
            if (apply) { allow = action; }
        }
        return allow;
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
    export async function parse(minecraftPath: MinecraftLocation, version: string): Promise<ResolvedVersion> {
        const folder = MinecraftFolder.from(minecraftPath);
        // the hierarchy is outer version to dep version
        // e.g. [liteloader version, forge version, minecraft version]
        const hierarchy = await resolveDependency(folder, version);
        const rootVersion = hierarchy[hierarchy.length - 1];
        const id: string = hierarchy[0].id;
        let assetIndex: Version.AssetIndex = rootVersion.assetIndex!;
        let assets: string = "";

        const downloadsMap: { [key: string]: Version.Download } = {};
        const librariesMap: { [key: string]: ResolvedLibrary } = {};
        const nativesMap: { [key: string]: ResolvedNative } = {};

        let mainClass: string = "";
        const args = { jvm: [] as Version.LaunchArgument[], game: [] as Version.LaunchArgument[] };
        let minimumLauncherVersion: number = 0;
        let releaseTime: string = "";
        let time: string = "";
        let type: string = "";
        let logging: any;
        let client: string = rootVersion.id;
        let location: string;

        const replaceMode = Reflect.get(rootVersion, "replace");

        const chains: string[] = hierarchy.map((j) => folder.getVersionRoot(j.id));

        let json: ResolvedVersion;
        do {
            json = hierarchy.pop() as ResolvedVersion;
            minimumLauncherVersion = Math.max(json.minimumLauncherVersion || 0, minimumLauncherVersion);
            location = json.minecraftDirectory;

            client = (json as any).jar || client;

            if (!replaceMode) {
                args.game.push(...json.arguments.game);
                args.jvm.push(...json.arguments.jvm);
            } else {
                args.game = json.arguments.game;
                args.jvm = json.arguments.jvm;
            }

            releaseTime = json.releaseTime || releaseTime;
            time = json.time || time;
            logging = json.logging || logging;
            assets = json.assets || assets;
            type = json.type || type;
            mainClass = json.mainClass || mainClass;
            assetIndex = json.assetIndex || assetIndex;
            if (json.libraries) {
                json.libraries.forEach((lib) => {
                    const libOrgName = lib.name.substring(0, lib.name.lastIndexOf(":"));
                    if (lib instanceof ResolvedNative) {
                        nativesMap[libOrgName] = lib;
                    } else {
                        librariesMap[libOrgName] = lib;
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
        if (Object.keys(downloadsMap).length === 0) {
            throw {
                type: "CorruptedVersionJson",
                version: id,
                missing: "Downloads",
            };
        }

        return {
            id,
            assetIndex,
            assets,
            client,
            arguments: args,
            downloads: downloadsMap,
            libraries: Object.keys(librariesMap).map((k) => librariesMap[k]).concat(Object.keys(nativesMap).map((k) => nativesMap[k])),
            mainClass, minimumLauncherVersion, releaseTime, time, type, logging,
            pathChain: chains,
            minecraftDirectory: location,
        } as ResolvedVersion;
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
     * @param version The version info which will overlap some parent information
     * @return The raw version json could be save to the version json file
     */
    export function extendsVersion(id: string, parent: Version, version: Version): Version {
        const launcherVersion = Math.max(parent.minimumLauncherVersion, version.minimumLauncherVersion);

        const libMap: { [name: string]: Version.Library } = {};
        parent.libraries.forEach((l) => { libMap[l.name] = l; });
        const libraries = version.libraries.filter((l) => libMap[l.name] === undefined);

        const result: Version = {
            id,
            time: new Date().toISOString(),
            releaseTime: new Date().toISOString(),
            type: version.type,
            libraries,
            mainClass: version.mainClass,
            inheritsFrom: parent.id,
            minimumLauncherVersion: launcherVersion,
        };

        if (typeof parent.minecraftArguments === "string") {
            if (typeof version.arguments === "object") {
                throw new Error("Extends require two version in same format!");
            }
            result.minecraftArguments = mixinArgumentString(parent.minecraftArguments,
                version.minecraftArguments || "");
        } else if (typeof parent.arguments === "object") {
            if (typeof version.minecraftArguments === "string") {
                throw new Error("Extends require two version in same format!");
            }
            result.arguments = version.arguments;
        }

        return result;
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
     * Resolve the dependencies of a minecraft version
     * @param path The path of minecraft
     * @param version The version id
     * @returns All the version required to run this version, including this version
     */
    export async function resolveDependency(path: MinecraftLocation, version: string): Promise<PartialResolvedVersion[]> {
        const folder = typeof path === "string" ? new MinecraftFolder(path) : path;
        const stack: PartialResolvedVersion[] = [];

        async function walk(versionName: string) {
            const jsonPath = folder.getVersionJson(versionName);
            if (!await vfs.exists(jsonPath)) {
                return Promise.reject({
                    type: "MissingVersionJson",
                    version: versionName,
                });
            }
            const contentString = await vfs.readFile(jsonPath, "utf-8").then(b => b.toString());
            let nextVersion: string | undefined;
            try {
                const raw = parseVersionJson(contentString, folder.root);
                stack.push(raw);
                nextVersion = raw.inheritsFrom;
            } catch (e) {
                throw { error: "CorruptedVersionJson", version: versionName, message: e.message, json: contentString };
            }
            if (nextVersion) {
                await walk(nextVersion);
            }
        }
        await walk(version);

        return stack;
    }

    /**
     * Resolve all these library and filter out os specific libs
     * @param libs All raw lib
     * @param platform The platform
     */
    export function resolveLibraries(libs: Library[], platform: Platform = currentPlatform): ResolvedLibrary[] {
        const empty: ResolvedLibrary = null!;
        return libs.map((lib) => {
            if ("rules" in lib && !checkAllowed(lib.rules, platform)) {
                return empty;
            }
            if ("natives" in lib) {
                if (!lib.natives[platform.name]) { return empty; }
                const classifier = (lib.natives[platform.name]).replace("${arch}", platform.arch.substring(1));
                const nativeArtifact = lib.downloads.classifiers[classifier];
                if (!nativeArtifact) { return empty; }
                return new ResolvedNative(lib.name, getLibraryInfo(lib.name), lib.downloads.classifiers[classifier], lib.extract ? lib.extract.exclude ? lib.extract.exclude : undefined : undefined);
            }
            const info = getLibraryInfo(lib.name);
            if ("downloads" in lib) {
                if (!lib.downloads.artifact.url) {
                    lib.downloads.artifact.url = info.groupId === "net.minecraftforge"
                        ? "https://files.minecraftforge.net/maven/" + lib.downloads.artifact.path
                        : "https://libraries.minecraft.net/" + lib.downloads.artifact.path;
                }
                return new ResolvedLibrary(lib.name, info, lib.downloads.artifact);
            }
            const maven = lib.url || "https://libraries.minecraft.net/";
            const artifact: Version.Artifact = {
                size: -1,
                sha1: lib.checksums ? lib.checksums[0] : "",
                path: info.path,
                url: maven + info.path,
            };
            return new ResolvedLibrary(lib.name, info, artifact, lib.checksums, lib.serverreq, lib.clientreq);
        }).filter((l) => l !== empty);
    }

    /**
     * Get the base info of the library
     *
     * @param lib The name of library or the library itself
     */
    export function getLibraryInfo(lib: string | Library | ResolvedLibrary): LibraryInfo {
        const name: string = typeof lib === "string" ? lib : lib.name;
        const [body, type = "jar"] = name.split("@");
        const [groupId, artifactId, version, classifier = ""] = body.split(":");
        const isSnapshot = version.endsWith("-SNAPSHOT");

        const groupPath = groupId.replace(/\./g, "/");
        let base = !isSnapshot
            ? `${groupPath}/${artifactId}/${version}/${artifactId}-${version}`
            : `${groupPath}/${artifactId}/${version}/${version}`;
        if (classifier) { base += `-${classifier}`; }
        const path = `${base}.${type}`;

        return {
            type,
            groupId,
            artifactId,
            version,
            name,
            isSnapshot,
            classifier,
            path,
        };
    }

    function parseVersionJson(versionString: string, root: string): PartialResolvedVersion {
        const platform = currentPlatform;
        const processArguments = (ar: Version.LaunchArgument[]) => {
            return ar.map((a) => {
                if (typeof a === "object") { return checkAllowed(a.rules, platform) ? a.value : ""; }
                return a;
            }).filter((a) => a !== "").reduce<string[]>((a, b) => {
                if (b instanceof Array) {
                    a.push(...b);
                } else {
                    a.push(b);
                }
                return a;
            }, []);
        };
        const parsed: Version = JSON.parse(versionString);
        const libraries = resolveLibraries(parsed.libraries || [], platform);
        const args = {
            jvm: [] as Version.LaunchArgument[],
            game: [] as Version.LaunchArgument[],
        };
        if (!parsed.arguments) { // old version
            args.game = parsed.minecraftArguments
                ? parsed.minecraftArguments.split(" ")
                : [];
            args.jvm = [
                {
                    rules: [
                        {
                            action: "allow",
                            os: {
                                name: "osx",
                            },
                        },
                    ],
                    value: ["-XstartOnFirstThread",],
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
            ];
        } else {
            args.jvm = parsed.arguments.jvm || [];
            args.game = parsed.arguments.game || [];
        }

        args.jvm = processArguments(args.jvm);
        const partial = { ...parsed, libraries, arguments: args, minecraftDirectory: root, replace: !parsed.arguments };
        return partial;
    }
}

export interface Version {
    id: string;
    time: string;
    type: string;
    releaseTime: string;
    inheritsFrom?: string;
    minimumLauncherVersion: number;

    minecraftArguments?: string;
    arguments?: {
        game: Version.LaunchArgument[],
        jvm: Version.LaunchArgument[],
    };

    mainClass: string;
    libraries: Version.Library[];

    jar?: string;

    assetIndex?: Version.AssetIndex;
    assets?: string;
    downloads?: {
        client: Version.Download,
        server: Version.Download,
        [key: string]: Version.Download,
    };

    client?: string;
    server?: string;
    logging?: {
        [key: string]: {
            file: Version.Download,
            argument: string,
            type: string,
        },
    };
}

export default Version;
