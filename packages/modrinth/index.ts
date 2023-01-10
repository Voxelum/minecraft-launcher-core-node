import { httpRequester } from "./http";
import { stringify } from "querystring";
import { Project, ProjectVersion, User } from "./types";
import { Agent } from "https";

export * from "./types";

const BASE_URL = "https://api.modrinth.com/v2";

/* eslint-disable camelcase */
export interface SearchResultHit {
    /**
     * The slug of project, e.g. "my_project"
     */
    slug: string
    /**
     * The id of the project; prefixed with local-
     */
    project_id: string
    /**
     * The project type of the project.
     * @enum "mod" "modpack"
     * */
    project_type: string
    /**
     * The username of the author of the project
     */
    author: string
    /**
     * The name of the project.
     */
    title: string
    /**
     * A short description of the project
     */
    description: string
    /**
     * A list of the categories the project is in.
     */
    categories: Array<string>
    /**
     * A list of the minecraft versions supported by the project.
     */
    versions: Array<string>
    /**
     * The total number of downloads for the project
     */
    downloads: number
    /**
     * A link to the project's main page; */
    page_url: string
    /**
     * The url of the project's icon */
    icon_url: string
    /**
     * The url of the project's author */
    author_url: string
    /**
     * The date that the project was originally created
     */
    date_created: string
    /**
     * The date that the project was last modified
     */
    date_modified: string
    /**
     * The latest version of minecraft that this project supports */
    latest_version: string
    /**
     * The id of the license this project follows */
    license: string
    /**
     * The side type id that this project is on the client */
    client_side: string
    /**
     * The side type id that this project is on the server */
    server_side: string
    /**
     * The host that this project is from, always modrinth */
    host: string
}


export interface SearchProjectOptions {
    /**
     * The query to search for
     */
    query?: string

    /**
     * The recommended way of filtering search results. [Learn more about using facets](https://docs.modrinth.com/docs/tutorials/search).
     *
     * @enum "categories" "versions" "license" "project_type"
     * @example [["categories:forge"],["versions:1.17.1"],["project_type:mod"]]
     */
    facets?: string
    /**
     * A list of filters relating to the properties of a project. Use filters when there isn't an available facet for your needs. [More information](https://docs.meilisearch.com/reference/features/filtering.html)
     *
     * @example filters=categories="fabric" AND (categories="technology" OR categories="utility")
     */
    filters?: string
    /**
     * What the results are sorted by
     *
     * @enum "relevance" "downloads" "follows" "newest" "updated"
     * @example "downloads"
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

export interface SearchResult {
    /**
     * The list of results
     */
    hits: Array<SearchResultHit>
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
        throw new Error(`HTTP Failed: ${BASE_URL}${path} Status Code ${statusCode}.`)
    }
    return JSON.parse(body)
}

export function searchProjects(options: SearchProjectOptions, agent?: Agent): Promise<SearchResult> {
    const params: Record<string, string | undefined | number> = {
        query: options.query ?? "",
        filter: options.filters ?? undefined,
        index: options.index || "relevance",
        offset: options.offset ?? 0,
        limit: options.limit ?? 10,
    };
    if (options.facets) {
        params.facets = options.facets;
    }
    return get(`/search?${stringify(params)}`, agent);
}

/**
 * @param id project id or slug
 */
export function getProject(id: string, agent?: Agent): Promise<Project> {
    return get(`/project/${id}`, agent)
}

export interface GetProjectVersionsOptions {
    id: string
    loaders?: Array<string>
    /**
     * Minecraft version filtering
     */
    game_versions?: Array<string>
    featured?: boolean
}

/**
 * @param id project id or slug
 */
export function getProjectVersions(options: string | GetProjectVersionsOptions, agent?: Agent): Promise<ProjectVersion[]> {
    if (typeof options === "string") {
        return get(`/project/${options}/version`, agent)
    }

    const params = {
        loaders: options.loaders,
        game_versions: options.game_versions,
        featured: options.featured,
    }
    return get(`/project/${options.id}/version?${stringify(params)}`, agent)
}


export function getProjectVersion(versionId: string, agent?: Agent): Promise<ProjectVersion> {
    return get(`/version/${versionId}`, agent)
}

/**
 * @param id User id or username
 */
export function getUser(id: string, agent?: Agent): Promise<User> {
    return get(`/user/${id}`, agent)
}

export function getUserProjects(id: string, agent?: Agent): Promise<Project[]> {
    return get(`/user/${id}/projects`, agent)
}

export interface Category {
    icon: string;
    name: string;
    project_type: string;
    header: string
}

export function listCategories(agent?: Agent): Promise<Category[]> {
    return get("/tag/category", agent)
}

export interface Loader {
    icon: string;
    name: string;
    supported_project_types: string[];
}

export function listLoaders(agent?: Agent): Promise<Loader[]> {
    return get("/tag/loader", agent)
}

export interface GameVersion {
    date: string
    major: boolean
    version: string
    version_type: string
}

export async function listGameVersion(agent?: Agent): Promise<GameVersion[]> {
    return get("/tag/game_version", agent)
}

export interface License {
    name: string
    short: string
}

export async function listLicenses(agent?: Agent): Promise<License[]> {
    return get("/tag/license", agent)
}
