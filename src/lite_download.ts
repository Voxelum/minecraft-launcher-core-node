import { UPDATE } from "./string_utils";
import { MinecraftLocation } from './file_struct';

export interface LiteVersionMetaList {
    meta: {
        description: string,
        authors: string,
        url: string,
        updated: string,
        updatedTime: number
    }
    versions: { [version: string]: LiteVersionMeta }
}
export namespace LiteVersionMetaList {
    export async function update(option?: {
        fallback?: {
            list: LiteVersionMetaList, date: string
        }, remote?: string
    }): Promise<{ list: LiteVersionMetaList, date: string }> {
        if (!option) option = {}
        return UPDATE({
            fallback: option.fallback,
            remote: option.remote || 'http://dl.liteloader.com/versions/versions.json'
        }).then(result => result as { list: LiteVersionMetaList, date: string })
    }
}

export interface LiteVersionMeta {
    repo: {
        stream: string,
        type: string,
        url: string,
        classifier: string
    },
    snapshot?: {
        libraries: Array<any>,
        "com.mumfrey:liteloader": {
            latest: LiteArtifact,
            [id: string]: LiteArtifact
        }
    },
    artefacts?: {
        "com.mumfrey:liteloader": {
            latest: LiteArtifact,
            [id: string]: LiteArtifact
        }
    }
}
import * as path from 'path'
export namespace LiteVersionMeta {
    export function installLiteloader(version: LiteVersionMeta, artifact: LiteArtifact, location: MinecraftLocation) {
        const targetURL = path.join(version.repo.url, 'com/mumfrey/liteloader', artifact.version, artifact.file)
    }
}
export interface LiteArtifact {
    tweakClass: string,
    libraries: Array<any>,
    stream: string,
    file: string,
    version: string,
    build: string,
    md5: string,
    timestamp: string,
    lastSuccessfulBuild: number
}