import { httpRequester } from "./http";
import { Agent } from "https";

const BASE_URL = "https://addons-ecs.forgesvc.net";

export interface AddonInfo {
    /**
     * The addon id. You can use this in many functions required the `addonID`
     */
    id: number;
    /**
     * The display name of the addon
     */
    name: string;
    /**
     * The list of authors
     */
    authors: Author[];
    /**
     * The attachments. Usually include the project icon and the exmaple images.
     */
    attachments: Attachment[];
    websiteUrl: string;
    /**
     * Game id. Minecraft is 432.
     */
    gameId: number;
    /**
     * One line summery
     */
    summary: string;
    /**
     * The default download file id
     */
    defaultFileId: number;
    downloadCount: number;
    latestFiles: File[];
    /**
     * The category of the project
     */
    categories: ProjectCategory[];
    status: number;
    primaryCategoryId: number;
    /**
     * The big category section
     */
    categorySection: CategorySection;
    slug: string;
    gameVersionLatestFiles: GameVersionLatestFile[];
    isFeatured: boolean;
    popularityScore: number;
    gamePopularityRank: number;
    primaryLanguage: string;
    gameSlug: string;
    gameName: string;
    portalName: string;
    dateModified: string;
    dateCreated: string;
    dateReleased: string;
    isAvailable: boolean;
    isExperiemental: boolean;
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

export interface File {
    /**
     * The fileID
     */
    id: number;
    /**
     * Display name
     */
    displayName: string;
    /**
     * File name. Might be the same with `displayName`
     */
    fileName: string;
    /**
     * The date of this file uploaded
     */
    fileDate: string;
    /**
     * # bytes of this file.
     */
    fileLength: number;
    /**
     * Release or type.
     * - `1` is the release
     * - ``
     */
    releaseType: number;
    fileStatus: number;
    /**
     * Url to download
     */
    downloadUrl: string;
    isAlternate: boolean;
    alternateFileId: number;
    dependencies: any[];
    isAvailable: boolean;
    /**
     * What files inside?
     */
    modules: Module[];
    packageFingerprint: number;
    /**
     * Game version string array, like `["1.12.2"]`
     */
    gameVersion: string[];
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
    /**
     * The projectId (addonId)
     */
    projectId: number;
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
    gameId: number;
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
    foldername: string;
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
    categoryId: number;
    name: string;
    url: string;
    avatarUrl: string;
    parentId: number;
    rootId: number;
    projectId: number;
    avatarId: number;
    gameId: number;
}

/**
 * The category in curseforge. For example, "World", "Resource Packs", "Modpacks", "Mods"... and so on..
 */
export interface Category {
    /**
     * The number id of the category. e.g. `4471`
     */
    id: number;
    /**
     * The display name of the category. For example, "Resource Packs", "Modpacks", "Mods"...
     */
    name: string;
    /**
     * The slug is used on url path. It should looks like, "modpacks", "texture-packs", "mc-mods"...
     */
    slug: string;
    /**
     * The display icon of the category
     */
    avatarUrl: string;
    /**
     * Last modified date. The string of `Date`.
     */
    dateModified: string;
    /**
     * The parent category id (`Category.id`)
     */
    parentGameCategoryId: number;
    /**
     * The root category id.
     */
    rootGameCategoryId: number;
    /**
     * The game id. Minecraft is 432.
     */
    gameId: number;
}

export interface SearchOptions {
    /**
     * Please use `getCategories` to find the category id
     */
    categoryID?: number;
    sectionId?: number | MinecraftSection; // 4471
    /**
     * The game id. The Minecraft is 432.
     * @default 432
     */
    gameId?: number; // 432 for Minecraft
    /**
     * The game version. For Minecraft, it should looks lile 1.12.2
     */
    gameVersion?: string; // 1.12.2
    /**
     * @default 0
     */
    index?: number; // 0
    /**
     * @default 25
     */
    pageSize?: number; // 25
    /**
     * The keyword of search
     */
    searchFilter: string; // ultimate
    /**
     * @default 0
     */
    sort?: number; // 0
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
    if (text) {
        return result.body;
    } else {
        return JSON.parse(result.body);
    }
}

/**
 * Cached minecraft section name to id
 */
export enum MinecraftSection {
    MapandInformation = 423,
    Addons = 426,
    ArmorToolsAndWeapons = 434,
    Structures = 409,
    BloodMagic = 4485,
    Storage = 420,
    IndustrialCraft = 429,
    Magic = 419,
    Technology = 412,
    Redstone = 4558,
    TinkersConstruct = 428,
    PlayerTransport = 414,
    LuckyBlocks = 4486,
    Buildcraft = 432,
    Genetics = 418,
    TwitchIntegration = 4671,
    OresandResources = 408,
    CraftTweaker = 4773,
    Thaumcraft = 430,
    AdventureandRPG = 422,
    Processing = 413,
    Energy = 417,
    EnergyFluidAndItemTransport = 415,
    Forestry = 433,
    Miscellaneous = 425,
    AppliedEnergistics2 = 4545,
    Farming = 416,
    APIandLibrary = 421,
    Cosmetic = 424,
    Fabric = 4780,
    WorldGen = 406,
    Mobs = 411,
    Biomes = 407,
    ThermalExpansion = 427,
    ServerUtility = 435,
    Dimensions = 410,
    Food = 436
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
 * Search addons by keyword.
 */
export async function searchAddons(searchOptions: SearchOptions, options: QueryOption = {}) {
    let url = `/api/v2/addon/search?categoryId=${searchOptions.categoryID ?? ""}&gameId=${searchOptions.gameId ?? 432}&gameVersion=${searchOptions.gameVersion ?? ""}&index=${searchOptions.index ?? 0}&pageSize=${searchOptions.pageSize ?? 12}5&searchFilter=${searchOptions.searchFilter}§ionId=${searchOptions.sectionId ?? ""}&sort=${searchOptions.sort ?? 0}`
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
    return body as File[];
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
    let body = await get(url, options);
    return body as string;
}
/**
 * Select several addons for the game.
 */
export async function getFeaturedAddon(getOptions: GetFeaturedAddonOptions, options: QueryOption = {}) {
    let url = "/api/v2/addon/featured"
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
    let url = "/api/v2/category"
    let body = await get(url, options);
    return body as Category[];
}
/**
 * Get the timestamp of the categories data base.
 * It should return the `Date` string like "2019-06-09T23:34:29.103Z"
 */
export async function getCategoryTimestamp(options: QueryOption = {}) {
    let url = "/api/v2/category/timestamp";
    let body = await get(url, options, undefined, true);
    return body;
}
