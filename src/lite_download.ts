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
    const snapshotRoot = 'http://dl.liteloader.com/versions/com/mumfrey/liteloader/';
    const releaseRoot = 'http://repo.mumfrey.com/content/repositories/liteloader/com/mumfrey/liteloader/'
    const jerkinsRoot = 'http://jenkins.liteloader.com/'
    export function installLiteloader(artifact: LiteArtifact, location: MinecraftLocation) {
        let targetURL
        if (artifact.stream === 'SNAPSHOT')
            targetURL = path.join(snapshotRoot, artifact.version, artifact.version + '.jar')
        else if (artifact.stream === 'RELEASE')
            targetURL = path.join(releaseRoot, artifact.version, artifact.file)
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