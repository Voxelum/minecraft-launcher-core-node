import { httpRequester } from "./http";
import { stringify } from "querystring";
import { Mod, ModVersion } from "./types";

export * from "./types";

const BASE_URL = "https://api.modrinth.com";

/* eslint-disable camelcase */
export interface ModResult {
    /**
     * The id of the mod; prefixed with local-
     */
    mod_id: string
    /**
     * The project type of the mod
     * */
    project_type: string
    /**
     * The username of the author of the mod
     */
    author: string
    /**
     * The name of the mod
     */
    title: string
    /**
     * A short description of the mod */
    description: string
    /**
     * A list of the categories the mod is in
     */
    categories: Array<string>
    /**
     * A list of the minecraft versions supported by the mod
     */
    versions: Array<string>
    /**
     * The total number of downloads for the mod
     */
    downloads: number
    /**
     * A link to the mod's main page; */
    page_url: string
    /**
     * The url of the mod's icon */
    icon_url: string
    /**
     * The url of the mod's author */
    author_url: string
    /**
     * The date that the mod was originally created
     */
    date_created: Date
    /**
     * The date that the mod was last modified
     */
    date_modified: Date
    /**
     * The latest version of minecraft that this mod supports */
    latest_version: string
    /**
     * The id of the license this mod follows */
    license: string
    /**
     * The side type id that this mod is on the client */
    client_side: string
    /**
     * The side type id that this mod is on the server */
    server_side: string
    /**
     * The host that this mod is from, always modrinth */
    host: string
}


export interface SearchModOptions {
    /**
     * The query to search for
     */
    query?: string
    /**
     * A list of filters relating to the categories of a mod
     */
    filters?: string
    /**
     * A list of filters relating to the versions of a mod
     */
    version?: string
    /**
     * What the results are sorted by
     * @default relevance
     */
    index?: string
    /**
     * The offset into the search; skips this number of results
     * @default 0
     */
    offset?: number
    /**
     * The number of mods returned by the search
     * @default 10
     */
    limit?: number
}

export interface SearchModResult {
    /**
     * The list of results
     */
    hits: Array<ModResult>
    /**
     * The number of results that were skipped by the query
     */
    offset: number
    /**
     * The number of mods returned by the query
     */
    limit: number
    /**
     * The total number of mods that the query found
     */
    total_hits: number
}

async function get(path: string) {
    const { body, statusCode } = await httpRequester({
        url: `${BASE_URL}${path}`,
        method: "GET",
        headers: {},
    })
    if (statusCode !== 200) {
        throw new Error(`HTTP Failed: Status Code ${statusCode}.`)
    }
    return JSON.parse(body)
}

export function searchMods(options: SearchModOptions): Promise<SearchModResult> {
    return get(`/api/v1/mod?${stringify({
        query: options.query ?? "",
        filter: options.filters ?? "",
        version: options.version ?? "",
        index: options.index || "relevance",
        offset: options.offset ?? 0,
        limit: options.limit ?? 10,
    })}`)
}

export function getMod(id: string): Promise<Mod> {
    return get(`/api/v1/mod/${id}`)
}

export function getModVersions(id: string): Promise<string[]> {
    return get(`/api/v1/mod/${id}/version`)
}

export function getModVersion(versionId: string): Promise<ModVersion> {
    return get(`/api/v1/version/${versionId}`)
}

export function listCategories(): Promise<string[]> {
    return get("/api/v1/tag/category")
}

export function listLoaders(): Promise<string[]> {
    return get("/api/v1/tag/loader")
}

export async function listGameVersion(): Promise<string[]> {
    return get("/api/v1/tag/game_version")
}

export async function listLicenses(): Promise<string[]> {
    return get("/api/v1/tag/license")
}
