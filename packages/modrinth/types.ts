export interface User {
    /**
     * The user's id
     */
    id: string
    /**
     * The user's github id; only visible to the user themself
     */
    github_id: number
    /**
     * The user's username
     */
    username: string
    /**
     * The user's display name
     */
    name: string
    /**
     * The user's email; only visible to the user themself
     */
    email?: string
    /**
     * The user's avatar url; uses github's icons
     */
    avatar_url?: string
    /**
     * A description of the user
     */
    bio: string
    /**
     * The time at which the user was created
     */
    created: Date
    /**
     * The user's role developer, moderator, or admin
     */
    role: string
}

export interface Mod {
    /**
     * The ID of the mod, encoded as a base62 string
     */
    id: string
    /**
     * The slug of a mod, used for vanity URLs
     */
    slug: string
    /**
     * The id of the team that has ownership of this mod
     */
    team: string
    /**
     * The title or name of the mod
     */
    title: string
    /**
     * A short description of the mod
     */
    description: string
    /**
     * A long form description of the mod.
     */
    body: string
    /**
     * DEPRECATED The link to the long description of the mod
     */
    body_url?: string
    /**
     * The date at which the mod was first published
     */
    published: Date
    /**
     * The date at which the mod was updated
     */
    updated: Date
    /**
     * The status of the mod - approved, rejected, draft, unlisted, processing, or unknown
     */
    status: string
    /**
     * The license of the mod
     */
    license: License
    /**
     * The support range for the client mod - required, optional, unsupported, or unknown
     */
    client_side: string
    /**
     * The support range for the server mod - required, optional, unsupported, or unknown
     */
    server_side: string
    /**
     * The total number of downloads the mod has
     */
    downloads: number
    /**
     * A list of the categories that the mod is in
     */
    categories: Array<string>
    /**
     * A list of ids for versions of the mod
     */
    versions: Array<string>
    /**
     * The URL of the icon of the mod
     */
    icon_url?: string
    /**
     * An optional link to where to submit bugs or issues with the mod
     */
    issues_url?: string
    /**
     * An optional link to the source code for the mod
     */
    source_url?: string
    /**
     * An optional link to the mod's wiki page or other relevant information
     */
    wiki_url?: string
    /**
     * An optional link to the mod's discord
     */
    discord_url?: string
    /**
     * An optional list of all donation links the mod has
     */
    donation_urls: Array<DonationLink>
}

export interface ModVersion {
    /**
     * The ID of the version, encoded as a base62 string
     */
    id: string
    /**
     * The ID of the mod this version is for
     */
    mod_id: string
    /**
     * The ID of the author who published this version
     */
    author_id: string
    /**
     * Whether the version is featured or not
     */
    featured: string
    /**
     * The name of this version
     */
    name: string
    /**
     * The version number. Ideally will follow semantic versioning
     */
    version_number: string
    /**
     * The changelog for this version of the mod.
     */
    changelog?: string
    /**
     * DEPRECATED A link to the changelog for this version of the mod
     */
    changelog_url?: string
    /**
     * The date that this version was published
     */
    date_published: Date
    /**
     * The number of downloads this specific version has
     */
    downloads: number
    /**
     * The type of the release - alpha, beta, or release
     */
    version_type: string
    /**
     * A list of files available for download for this version
     */
    files: Array<ModVersionFile>
    /**
     * A list of specific versions of mods that this version depends on
     */
    dependencies: Array<string>
    /**
     * A list of versions of Minecraft that this version of the mod supports
     */
    game_versions: Array<string>
    /**
     * The mod loaders that this version supports
     */
    loaders: Array<string>
}

export interface ModVersionFile {
    /**
     * A map of hashes of the file. The key is the hashing algorithm and the value is the string version of the hash.
     */
    hashes: Record<string, string>
    /**
     * A direct link to the file
     */
    url: string
    /**
     * The name of the file
     */
    filename: string
}

export interface License {
    /**
     * The license id of a mod, retrieved from the licenses get route
     */
    id: string
    /**
     * The long for name of a license
     */
    name: string
    /**
     * The URL to this license
     */
    url: string
}

export interface DonationLink {
    /**
     * The platform id of a mod, retrieved from the donation platforms get route
     */
    id: string
    /**
     * The long for name of a platform
     */
    platform: string
    /**
     * The URL to this donation link
     */
    url: string
}
