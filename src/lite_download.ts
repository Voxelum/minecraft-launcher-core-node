import { UPDATE } from "./string_utils";

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
    snapshot?:{
        
    }

}