
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

    export interface NativeLibrary {
        name: string;
        downloads: {
            artifact: Artifact,
            classifiers: {
                [os: string]: Artifact,
            },
        };
        rules: Array<{ action: "allow" | "disallow", os?: { name: string } }>;
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
        rules: Array<{ action: "allow" | "disallow", os?: { name: string } }>;
    }

    export interface LegacyLibrary {
        name: string;
        url?: string;
        clientreq?: boolean;
        serverreq?: boolean;
        checksums?: string[];
    }

    export type Library = NormalLibrary | NativeLibrary | PlatformSpecificLibrary | LegacyLibrary

    export type LaunchArgument = string | {
        rules: Array<{ action: string, features?: any, os?: { name?: string, version?: string } }>, value: string | string[]
    };
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
