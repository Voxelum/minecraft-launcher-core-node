
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

    export interface Library {
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
                [os: string]: Artifact,
            },
            artifact: Artifact,
        };
        url?: string;
        checksums?: string[];
        serverreq?: boolean;
        clientreq?: boolean;
    }

    export type LaunchArgument = string | { rules: Array<{ action: string, features?: any, os?: { name?: string, version?: string } }>, value: string | string[] };
}


export interface Version {
    id: string;
    time: string;
    type: string;
    releaseTime: string;
    inheritsFrom?: string;
    minimumLauncherVersion?: number;

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
