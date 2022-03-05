import { httpRequester } from "./http";
import { stringify } from "querystring";
import { Mod, ModVersion } from "./types";
import { Agent } from "https";

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

    facets?: string
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

async function get(path: string, agent?: Agent) {
    const { body, statusCode } = await httpRequester({
        url: `${BASE_URL}${path}`,
        method: "GET",
        headers: {},
        userAgent: agent
    })
    if (statusCode !== 200) {
        throw new Error(`HTTP Failed: Status Code ${statusCode}.`)
    }
    return JSON.parse(body)
}

export function searchMods(options: SearchModOptions, agent?: Agent): Promise<SearchModResult> {
    const params: Record<string, string | undefined | number> = {
        query: options.query ?? "",
        filter: options.filters ?? undefined,
        version: options.version ?? "",
        index: options.index || "relevance",
        offset: options.offset ?? 0,
        limit: options.limit ?? 10,
    };
    if (options.facets) {
        params.facets = options.facets;
    }
    return get(`/api/v1/mod?${stringify(params)}`, agent);
}

export function getMod(id: string, agent?: Agent): Promise<Mod> {
    return get(`/api/v1/mod/${id}`, agent)
}

export function getModVersions(id: string, agent?: Agent): Promise<string[]> {
    return get(`/api/v1/mod/${id}/version`, agent)
}

export function getModVersion(versionId: string, agent?: Agent): Promise<ModVersion> {
    return get(`/api/v1/version/${versionId}`, agent)
}

export function listCategories(agent?: Agent): Promise<string[]> {
    return get("/api/v1/tag/category", agent)
}

export function listLoaders(agent?: Agent): Promise<string[]> {
    return get("/api/v1/tag/loader", agent)
}

export async function listGameVersion(agent?: Agent): Promise<string[]> {
    return get("/api/v1/tag/game_version", agent)
}

export async function listLicenses(agent?: Agent): Promise<string[]> {
    return get("/api/v1/tag/license", agent)
}
