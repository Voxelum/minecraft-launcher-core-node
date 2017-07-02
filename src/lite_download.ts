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
export interface LiteVersionMeta {

}