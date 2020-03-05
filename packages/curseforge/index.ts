import { Task } from "@xmcl/task";
import { ensureDir } from "@xmcl/core/fs";

export interface AuthorInfo {
    name: string;
    url: string;
    projectId: number;
    id: number;
    projectTitleId: string | null;
    projectTitleTitle: string | null;
    userId: number;
    twitchId: number;
}
export interface Attachment {
    id: number; // 185018,
    projectId: number; // 310806,
    description: string; // "",
    isDefault: boolean; // true,
    thumbnailUrl: string; // "https://media.forgecdn.net/avatars/thumbnails/185/18/256/256/636824897396091696.png",
    title: string; // "636824897396091696.png",
    url: string; // "https://media.forgecdn.net/avatars/185/18/636824897396091696.png",
    status: number; // 1
}
export interface File {
    "id": number,
    "displayName": "Watermark-1.12-1.0.jar",
    "fileName": "Watermark-1.12-1.0.jar",
    "fileDate": "2019-01-07T20:37:37.717Z",
    "fileLength": number,
    "releaseType": number,
    "fileStatus": number,
    "downloadUrl": "https://edge.forgecdn.net/files/2657/461/Watermark-1.12-1.0.jar",
    "isAlternate": boolean,
    "alternateFileId": number,
    "dependencies": [],
    "isAvailable": boolean,
    "modules": [
        {
            "foldername": "META-INF",
            "fingerprint": 1774297949,
            "type": 3
        },
        {
            "foldername": "uk",
            "fingerprint": 3536121930,
            "type": 3
        },
        {
            "foldername": "mcmod.info",
            "fingerprint": 1697886471,
            "type": 3
        },
        {
            "foldername": "pack.mcmeta",
            "fingerprint": 3273911401,
            "type": 3
        }
    ],
    "packageFingerprint": 3028671922,
    "gameVersion": [
        "1.12.2"
    ],
    "sortableGameVersion": [
        {
            "gameVersionPadded": "0000000001.0000000012.0000000002",
            "gameVersion": "1.12.2",
            "gameVersionReleaseDate": "2017-09-18T05:00:00Z",
            "gameVersionName": "1.12.2"
        }
    ],
    "installMetadata": null,
    "changelog": null,
    "hasInstallScript": boolean,
    "isCompatibleWithClient": boolean,
    "categorySectionPackageType": number,
    "restrictProjectFileAccess": number,
    "projectStatus": number,
    "renderCacheId": number,
    "fileLegacyMappingId": null,
    "projectId": number,
    "parentProjectFileId": null,
    "parentFileLegacyMappingId": null,
    "fileTypeId": null,
    "exposeAsAlternative": null,
    "packageFingerprintId": number,
    "gameVersionDateReleased": string,
    "gameVersionMappingId": number,
    "gameVersionId": number,
    "gameId": number,
    "isServerPack": boolean,
    "serverPackFileId": null
}
interface Category {
    "categoryId": 424,
    "name": "Cosmetic",
    "url": "https://www.curseforge.com/minecraft/mc-mods/cosmetic",
    "avatarUrl": "https://media.forgecdn.net/avatars/6/39/635351497555976928.png",
    "parentId": 6,
    "rootId": 6,
    "projectId": number,
    "avatarId": 6039,
    "gameId": 432
}
export interface CategorySection {
    id: number;
    gameId: number;
    name: string; // "Mods"
    packageType: number;
    path: string; // "mods"
    initialInclusionPattern: string; // "."
    extraIncludePattern: null;
    gameCategoryId: number;
}
export interface GameVersionFile {
    gameVersion: string; // "1.12.2",
    projectFileId: number; // 2657461,
    projectFileName: string; // "Watermark-1.12-1.0.jar",
    fileType: number; // 1
}
export interface AddonInfo {
    id: number;
    name: string;
    authors: AuthorInfo[];
    attachments: Attachment[];
    websiteUrl: string;
    gameId: number;
    summary: string;
    defaultFileId: number;
    downloadCount: number;
    latestFiles: File[];
    categories: Category[];
    status: number;
    primaryCategoryId: number;
    categorySection: CategorySection;
    slug: string; // "watermark",
    gameVersionLatestFiles: GameVersionFile[];
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


export interface API {
    host: string;
    getAddonInfo: string;
    getMultiAddons: string;
}

export const DEFAULT_CURSEFORGE_API: API = {
    host: "https://addons-ecs.forgesvc.net",
    getAddonInfo: "api/v2/addon/{addonID}",
    getMultiAddons: "https://addons-ecs.forgesvc.net/api/v2/addon",
}
