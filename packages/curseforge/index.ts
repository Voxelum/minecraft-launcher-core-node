/**
 * @module @xmcl/curseforge
 */
import { httpRequester } from "./http";
import { Agent } from "https";

const BASE_URL = "https://addons-ecs.forgesvc.net";

export interface AddonAsset {
    id: number;
    modId: number;
    title: string;
    description: string;
    thumbnailUrl: string;
    url: string;
}

export const enum AddonStatus {
    New = 1,
    ChangesRequired = 2,
    UnderSoftReview = 3,
    Approved = 4,
    Rejected = 5,
    ChangesMade = 6,
    Inactive = 7,
    Abandoned = 8,
    Deleted = 9,
    UnderReview = 10,
}
export const enum FileReleaseType {
    Release = 1,
    Beta = 2,
    Alpha = 3,
}

export const enum FileModLoaderType {
    Any = 0,
    Forge = 1,
    Cauldron = 2,
    LiteLoader = 3,
    Fabric = 4,
    Quilt = 5,
}
export interface FileIndex {
    gameVersion: string
    field: number
    filename: string
    releaseType: FileReleaseType

    gameVersionTypeId: number | null
    modLoader: FileModLoaderType
}

export interface AddonInfo {
    /**
     * The addon id. You can use this in many functions required the `addonID`
     */
    id: number;
    /**
     * Game id. Minecraft is 432.
     */
    gameId: number;
    /**
     * The display name of the addon
     */
    name: string;
    /**
     * The mod slug that would appear in the URL
     */
    slug: string;
    /** Relevant links for the mod such as Issue tracker and Wiki */
    links: {
        websiteUrl: string
        wikiUrl: string
        issuesUrl: string
        sourceYUrl: string
    };
    /**
     * One line summery
     */
    summary: string;
    /**
     * Current mod status
     */
    status: AddonStatus;
    /**
     * Number of downloads for the mod
     */
    downloadCount: number;
    /**
     * Whether the mod is included in the featured mods list
     */
    isFeatured: boolean;
    /**
     * The main category of the mod as it was chosen by the mod author
     */
    primaryCategoryId: number;
    /**
     * List of categories that this mod is related to
     */
    categories: ProjectCategory[];
    /**
     * The class id this mod belongs to
     */
    classId: number | null
    /**
     * The list of authors
     */
    authors: Author[];

    logo: AddonAsset;

    screenshots: AddonAsset[];
    /**
     * The id of the main file of the mod
     */
    mainFileId: number;
    latestFiles: File[];
    /**
     * List of file related details for the latest files of the mod
     */
    latestFilesIndexes: FileIndex[];
    /**
     * The creation date of the mod
     */
    dateCreated: string;

    dateModified: string;
    dateReleased: string;

    /**
     * Is mod allowed to be distributed
     */
    allowModDistribution: boolean | null
    /**
     * The mod popularity rank for the game
     */
    gamePopularityRank: number
    /**
     * Is the mod available for search. This can be false when a mod is experimental, in a deleted state or has only alpha files
     */
    isAvailable: boolean;

    /**
     * The default download file id
     */
    defaultFileId: number;
    /**
     * The mod's thumbs up count
     */
    thumbsUpCount: number
}

export interface GameVersionLatestFile {
    gameVersion: string;
    projectFileId: number;
    projectFileName: string;
    fileType: number;
}

export interface CategorySection {
    id: number;
    gameId: number;
    name: string;
    packageType: number;
    path: string;
    initialInclusionPattern: string;
    extraIncludePattern?: any;
    gameCategoryId: number;
}
export const enum HashAlgo {
    Sha1 = 1,
    Md5 = 2,
}
export interface FileHash {
    algo: HashAlgo
    value: string
}

export const enum FileStatus {
    Processing = 1,
    ChangesRequired = 2,
    UnderReview = 3,
    Approved = 4,
    Rejected = 5,
    MalwareDetected = 6,
    Deleted = 7,
    Archived = 8,
    Testing = 9,
    Released = 10,
    ReadyForReview = 11,
    Deprecated = 12,
    Baking = 13,
    AwaitingPublishing = 14,
    FailedPublishing = 15,
}

export interface File {
    /**
     * The fileID
     */
    id: number;
    /**
     * The game id related to the mod that this file belongs to
     */
    gameId: number;
    /**
     * The projectId (addonId)
     */
    modId: number;
    /**
     * Whether the file is available to download
     */
    isAvailable: boolean;
    /**
     * Display name
     */
    displayName: string;
    /**
     * File name. Might be the same with `displayName`
     */
    fileName: string;
    /**
    * Release or type.
    * - `1` is the release
    * - `2` beta
    * - `3` alpha
    */
    releaseType: number;

    fileStatus: FileStatus;

    hashes: FileHash[];

    /**
     * The date of this file uploaded
     */
    fileDate: string;
    /**
     * # bytes of this file.
     */
    fileLength: number;

    /**
     * Number of downloads for the mod
     */
    downloadCount: number;

    /**
     * Url to download
     */
    downloadUrl: string;
    /**
     * Game version string array, like `["1.12.2"]`
     */
    gameVersions: string[]
    /**
     * Metadata used for sorting by game versions
     */
    sortableGameVersions: string[]
    isAlternate: boolean;
    alternateFileId: number;
    dependencies: any[];
    /**
     * What files inside?
     */
    modules: Module[];
    packageFingerprint: number;
    
    sortableGameVersion?: SortableGameVersion[];
    installMetadata?: any;
    changelog?: any;
    hasInstallScript: boolean;
    isCompatibleWithClient: boolean;
    categorySectionPackageType: number;
    restrictProjectFileAccess: number;
    projectStatus: number;
    renderCacheId: number;
    fileLegacyMappingId?: any;
    parentProjectFileId?: any;
    parentFileLegacyMappingId?: any;
    fileTypeId?: any;
    exposeAsAlternative?: any;
    packageFingerprintId: number;
    gameVersionDateReleased: string;
    gameVersionMappingId: number;
    /**
     * A number represents the game version id from curseforge (Not the same with Minecraft version string id).
     */
    gameVersionId: number;

    isServerPack: boolean;
    serverPackFileId?: any;
}

export interface SortableGameVersion {
    gameVersionPadded: string;
    gameVersion: string;
    gameVersionReleaseDate: string;
    gameVersionName: string;
}

/**
 * Represent a file in a `File`.
 */
export interface Module {
    /**
     * Actually the file name, not the folder
     */
    name: string;
    /**
     * A number represent fingerprint
     */
    fingerprint: number;
    type: number;
}

export interface Attachment {
    id: number;
    projectId: number;
    description: string;
    isDefault: boolean;
    /**
     * Small icon
     */
    thumbnailUrl: string;
    /**
     * The title of this attachment
     */
    title: string;
    /**
     * The url. Usually the image url.
     */
    url: string;
    status: number;
}

/**
 * The author info
 */
export interface Author {
    /**
     * The project id of this query
     */
    projectId: number;
    projectTitleId?: any;
    projectTitleTitle?: any;

    /**
     * Display name of the author
     */
    name: string;
    /**
     * The full url of author homepage in curseforge
     */
    url: string;
    /**
     * The id of this author
     */
    id: number;
    userId: number;
    twitchId: number;
}


export interface ProjectCategory {
    /**
     * The category id
     */
    id: number;
    gameId: number;
    name: string;
    slug: string
    url: string;
    iconUrl: string;
    dateModified: string
    /**
     * A top level category for other categories
     */
    isClass: boolean | null
    /**
     * The class id of the category, meaning - the class of which this category is under
     */
    classId: number | null
    /**
     * 	The parent category for this category
     */
    parentCategoryId: number | null
    /**
     * 	The display index for this category
     */
    displayIndex: number | null
}

/**
 * The search options of the search API.
 *
 * @see {@link searchAddons}
 */
export interface SearchOptions {
    /**
     * The category section id, which is also a category id.
     * You can fetch if from `getCategories`.
     *
     * To get available categories, you can:
     *
     * ```ts
     * const cat = await getCategories();
     * const sectionIds = cat
     *  .filter(c => c.gameId === 432) // 432 is minecraft game id
     *  .filter(c => c.rootGameCategoryId === null).map(c => c.id);
     * // the sectionIds is all normal sections here
     * ```
     *
     * @see {@link getCategories}
     */
    classId?: number;
    /**
     * This is actually the sub category id of the `sectionId`. All the numbers for this should also be fetch by `getCategories`.
     *
     * To get available values, you can:
     *
     * ```ts
     * const cat = await getCategories();
     * const sectionId = 6; // the mods
     * const categoryIds = cat
     *  .filter(c => c.gameId === 432) // 432 is minecraft game id
     *  .filter(c => c.rootGameCategoryId === sectionId) // only under the section id
     *  .map(c => c.id);
     * // Use categoryIds' id to search under the corresponding section id.
     * ```
     *
     * @see {@link getCategories}
     */
    categoryId?: number;
    /**
     * The game id. The Minecraft is 432.
     *
     * @default 432
     */
    gameId?: number;
    /**
     * The game version. For Minecraft, it should looks like 1.12.2.
     */
    gameVersion?: string;
    /**
     * The index of the addon, NOT the page!
     *
     * When your page size is 25, if you want to get next page contents, you should have index = 25 to get 2nd page content.
     *
     * @default 0
     */
    index?: number;
    /**
     * Filter by ModsSearchSortField enumeration
     */
    sortField?: ModsSearchSortField;
    /**
     * 'asc' if sort is in ascending order, 'desc' if sort is in descending order
     */
    sortOrder?: "asc" | "desc";
    /**
     * Filter only mods associated to a given modloader (Forge, Fabric ...). Must be coupled with gameVersion.
     */
    modLoaderType?: FileModLoaderType
    /**
     * Filter only mods that contain files tagged with versions of the given gameVersionTypeId
     */
    gameVersionTypeId?: number
    /**
     * Filter by slug (coupled with classId will result in a unique result).
     */
    slug?: string
    /**
     * The page size, or the number of the addons in a page.
     *
     * @default 25
     */
    pageSize?: number;
    /**
     * The keyword of search. If this is absent, it just list out the available addons by `sectionId` and `categoryId`.
     */
    searchFilter?: string;
}

export const enum ModsSearchSortField {
    Featured = 1,
    Popularity = 2,
    LastUpdated = 3,
    Name = 4,
    Author = 5,
    TotalDownloads = 6,
    Category = 7,
    GameVersion = 8,
}

export interface GetFeaturedAddonOptions {
    /**
     * The game id. The Minecraft is 432.
     * @default 432
     */
    gameId?: number;
    /**
     * The # of featured
     */
    featuredCount?: number;
    popularCount?: number;
    updatedCount?: number;
}

/**
 * The options to query
 */
export interface QueryOption {
    /**
     * Additional header
     */
    headers?: Record<string, any>;
    /**
     * The user agent in nodejs of https
     */
    userAgent?: Agent;
}

async function get(url: string, options: QueryOption, body?: object, text?: boolean) {
    let fullUrl = BASE_URL + url;
    let result = await httpRequester({ method: body ? "POST" : "GET", url: fullUrl, headers: options.headers || {}, body, userAgent: options.userAgent });
    if (result.statusCode < 200 || result.statusCode >= 300) {
        throw new Error(`HTTP Error: Status Code ${result.statusCode}. (${url})`);
    }
    if (text) {
        return result.body;
    } else {
        return JSON.parse(result.body);
    }
}

export interface Pagination {
    /**
     * A zero based index of the first item that is included in the response
     */
    index: number
    /**
     * The requested number of items to be included in the response
     */
    pageSize: number
    /**
     * The actual number of items that were included in the response
     */
    resultCount: number
    /**
     * The total number of items available by the request
     */
    totalCount: number
}

/**
 * Get the addon by addon Id.
 * @param addonID The id of addon
 * @param options The query options
 */
export async function getAddonInfo(addonID: number, options: QueryOption = {}) {
    let body = await get(`/api/v2/addon/${addonID}`, options);
    return body as AddonInfo;
}
/**
 * Get the list of addon by addon ids.
 */
export async function getAddons(addonIDs: number[], options: QueryOption = {}) {
    let body = await get("/api/v2/addon", options, addonIDs);
    return body as AddonInfo[];
}
/**
 * List the addons by category/section or search addons by keyword.
 */
export async function searchAddons(searchOptions: SearchOptions, options: QueryOption = {}) {
    let url = `/api/v2/addon/search?gameId=${searchOptions.gameId ?? 432}&gameVersion=${searchOptions.gameVersion ?? ""}&index=${searchOptions.index ?? 0}&pageSize=${searchOptions.pageSize ?? 12}&sortField=${searchOptions.sortField ?? 1}`;
    if (typeof searchOptions.searchFilter === "string") {
        url += `&searchFilter=${searchOptions.searchFilter}`;
    }
    // if (typeof searchOptions.sectionId === "number") {
    //     url += `&sectionId=${searchOptions.sectionId}`;
    // }
    if (typeof searchOptions.categoryId === "number") {
        url += `&categoryId=${searchOptions.categoryId}`;
    }
    let body = await get(url, options);
    return body as AddonInfo[];
}
/**
 * Get the addon project description HTML string.
 *
 * @returns The string of description HTML.
 */
export async function getAddonDescription(addonID: number, options: QueryOption = {}) {
    let url = `/api/v2/addon/${addonID}/description`;
    let body = await get(url, options, undefined, true);
    return body as string;
}
/**
 * Get the content of the changelog of a addon's file
 */
export async function getAddonFileChangelog(addonID: number, fileID: number, options: QueryOption = {}) {
    let url = `/api/v2/addon/${addonID}/file/${fileID}/changelog`;
    let body = await get(url, options, undefined, true);
    return body as string;
}
export async function getAddonFileInfo(addonID: number, fileID: number, options: QueryOption = {}) {
    let url = `/api/v2/addon/${addonID}/file/${fileID}`;
    let body = await get(url, options);
    return body as File;
}
/**
 * Return the addon file download url string.
 */
export async function getAddonFileDownloadURL(addonID: number, fileID: number, options: QueryOption = {}) {
    let url = `/api/v2/addon/${addonID}/file/${fileID}/download-url`;
    let body = await get(url, options, undefined, true);
    return body as string;
}
/**
 * Get the file list of the addon.
 */
export async function getAddonFiles(addonID: number, options: QueryOption = {}) {
    let url = `/api/v2/addon/${addonID}/files`;
    let body = await get(url, options);
    return body as File[];
}
/**
 * Get the addon data base timestamp in string of `Date`, like "2019-06-09T23:34:29.103Z".
 */
export async function getAddonDatabaseTimestamp(options: QueryOption = {}) {
    let url = "/api/v2/addon/timestamp";
    let body = await get(url, options, undefined, false);
    return body as string;
}
/**
 * Select several addons for the game.
 */
export async function getFeaturedAddons(getOptions: GetFeaturedAddonOptions = {}, options: QueryOption = {}) {
    let url = "/api/v2/addon/featured";
    let body = await get(url, options, {
        "GameId": getOptions.gameId ?? 432,
        "addonIds": [],
        "featuredCount": getOptions.featuredCount ?? 4,
        "popularCount": getOptions.popularCount ?? 4,
        "updatedCount": getOptions.updatedCount ?? 4,
    });
    return body as AddonInfo[];
}
/**
 * Get the list of category. You can use the `category.id` in params of `searchAddon` function.
 */
export async function getCategories(options: QueryOption = {}) {
    let url = "/api/v2/category";
    let body = await get(url, options);
    return body as ProjectCategory[];
}
/**
 * Get the timestamp of the categories data base.
 * It should return the `Date` string like "2019-06-09T23:34:29.103Z"
 */
export async function getCategoryTimestamp(options: QueryOption = {}) {
    let url = "/api/v2/category/timestamp";
    let body = await get(url, options, undefined, false);
    return body;
}
