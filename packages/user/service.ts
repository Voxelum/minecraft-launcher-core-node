import { GameProfile, GameProfileWithProperties, FormItems } from "./base";
import { httpRequester as request, verify, decodeBase64 } from "./util";

export interface ProfileLookupException {
    /**
     * - statusCode=204 -> error="NoPlayerFound"
     * - statusCode=400 -> error="IllegalArgumentException" (parsed from body)
     * - statusCode=other -> error=statusCode.toString()
     */
    error: "NoPlayerFoundException" | "IllegalArgumentException" | "GeneralException";
    errorMessage?: string | "Invalid timestamp.";
    statusCode?: number;
    statusMessage?: string;
}

export interface ProfileServiceAPI {
    /**
     * The PEM public key
     */
    publicKey?: string;
    /**
     * Full url to query profile by uuid. Place the uuid as `${uuid}` in this url
     */
    profile: string;
    /**
     * Full url to query profile by name. Place the name as `${name}` in this url
     */
    profileByName: string;
    /**
     * Full url to set texture by profile uuid and texture type. Place uuid as `${uuid}` and type as `${type}`
     */
    texture: string;
}

export namespace ProfileServiceAPI {
    /**
     * Replace `${uuid}` string into uuid param
     * @param api The api
     * @param uuid The uuid will be replaced
     */
    export function getProfileUrl(api: ProfileServiceAPI, uuid: string) {
        return api.profile.replace("${uuid}", uuid);
    }
    /**
     * Replace `${name}` string into name param
     * @param api The api
     * @param name The name will be replaced
     */
    export function getProfileByNameUrl(api: ProfileServiceAPI, name: string) {
        return api.profileByName.replace("${name}", name);
    }

    /**
     * Replace uuid string into `${uuid}`, and type string into `${type}`
     * @param api The api
     * @param uuid The uuid string
     * @param type The type string
     */
    export function getTextureUrl(api: ProfileServiceAPI, uuid: string, type: string) {
        return api.texture.replace("${uuid}", uuid).replace("${type}", type);
    }
}
/**
 * The default Mojang API
 */
export const PROFILE_API_MOJANG: ProfileServiceAPI = {
    publicKey: `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAylB4B6m5lz7jwrcFz6Fd
/fnfUhcvlxsTSn5kIK/2aGG1C3kMy4VjhwlxF6BFUSnfxhNswPjh3ZitkBxEAFY2
5uzkJFRwHwVA9mdwjashXILtR6OqdLXXFVyUPIURLOSWqGNBtb08EN5fMnG8iFLg
EJIBMxs9BvF3s3/FhuHyPKiVTZmXY0WY4ZyYqvoKR+XjaTRPPvBsDa4WI2u1zxXM
eHlodT3lnCzVvyOYBLXL6CJgByuOxccJ8hnXfF9yY4F0aeL080Jz/3+EBNG8RO4B
yhtBf4Ny8NQ6stWsjfeUIvH7bU/4zCYcYOq4WrInXHqS8qruDmIl7P5XXGcabuzQ
stPf/h2CRAUpP/PlHXcMlvewjmGU6MfDK+lifScNYwjPxRo4nKTGFZf/0aqHCh/E
AsQyLKrOIYRE0lDG3bzBh8ogIMLAugsAfBb6M3mqCqKaTMAf/VAjh5FFJnjS+7bE
+bZEV0qwax1CEoPPJL1fIQjOS8zj086gjpGRCtSy9+bTPTfTR/SJ+VUB5G2IeCIt
kNHpJX2ygojFZ9n5Fnj7R9ZnOM+L8nyIjPu3aePvtcrXlyLhH/hvOfIOjPxOlqW+
O5QwSFP4OEcyLAUgDdUgyW36Z5mB285uKW/ighzZsOTevVUG2QwDItObIV6i8RCx
FbN2oDHyPaO5j1tTaBNyVt8CAwEAAQ==
-----END PUBLIC KEY-----`,
    texture: "https://api.mojang.com/user/profile/${uuid}/${type}",
    profile: "https://sessionserver.mojang.com/session/minecraft/profile/${uuid}",
    profileByName: "https://api.mojang.com/users/profiles/minecraft/${name}",
};

/**
 * Get all the textures of this GameProfile and cache them.
 *
 * @param profile The game profile from the profile service
 * @param cache Should we cache the texture into url? Default is `true`.
 */
export function getTextures(profile: GameProfile): GameProfile.TexturesInfo | undefined {
    if (!profile.properties || !profile.properties.textures) { return undefined; }
    const content: string = decodeBase64(profile.properties.textures);
    return JSON.parse(content);
}
/**
 * Fetch the GameProfile by uuid.
 *
 * @param uuid The unique id of user/player
 * @param option the options for this function
 */
export async function lookup(uuid: string, option: { api?: ProfileServiceAPI, unsigned?: boolean } = {}) {
    const api = option.api || PROFILE_API_MOJANG;
    const unsigned = "unsigned" in option ? option.unsigned : !api.publicKey;
    const {
        body,
        statusCode,
        statusMessage,
    } = await request({
        url: ProfileServiceAPI.getProfileUrl(api, uuid),
        method: "GET",
        headers: {},
        body: { unsigned },
        bodyType: "search",
    });
    if (statusCode !== 200) {
        throw {
            error: "General",
            statusCode,
            statusMessage,
        };
    }
    const o = JSON.parse(body);
    if (o.properties && o.properties instanceof Array) {
        const properties = o.properties as Array<{ name: string; value: string; signature: string; }>;
        const to: { [key: string]: string } = {};
        for (const prop of properties) {
            if (prop.signature && api.publicKey && !await verify(prop.value, prop.signature, api.publicKey)) {
                console.warn(`Discard corrupted prop ${prop.name}: ${prop.value} as the signature mismatched!`);
            } else {
                to[prop.name] = prop.value;
            }
        }
        o.properties = to;
    }
    return o as GameProfileWithProperties;
}
/**
 * Look up the GameProfile by username in game.
 * This will return the UUID of the name at the timestamp provided.
 * `?at=0` can be used to get the UUID of the original user of that username, but, it only works if the name was changed at least once, or if the account is legacy.

 * The timestamp is a UNIX timestamp (without milliseconds)
 * When the at parameter is not sent, the current time is used
 * @param name The username in game.
 * @param option the options of this function
 * @throws ProfileLookupException
 */
export function lookupByName(name: string, option: { api?: ProfileServiceAPI, timestamp?: number } = {}) {
    const api = option.api || PROFILE_API_MOJANG;
    const time: number = option.timestamp || 0;
    let target = ProfileServiceAPI.getProfileByNameUrl(api, name);
    let form;
    if (time) {
        form = { at: (time / 1000) };
    }
    return request({
        url: target,
        method: "GET",
        headers: {},
        body: form,
        bodyType: "search",
    }).then(({ statusCode, statusMessage, body }) => {
        if (statusCode === 200) {
            return JSON.parse(body) as GameProfile;
        } else if (statusCode === 204) {
            throw {
                error: "NoPlayerFoundException",
                errorMessage: "",
                statusCode,
                statusMessage
            } as ProfileLookupException;
        } else {
            let errorBody;
            try {
                errorBody = JSON.parse(body);
            } catch {
                errorBody = {};
            }
            throw {
                error: errorBody.error || "General",
                errorMessage: errorBody.errorMessage,
                statusCode,
                statusMessage
            } as ProfileLookupException;
        }
    });
}

export interface SetTextureOption {
    accessToken: string,
    uuid: string,
    type: "skin" | "cape" | "elytra",
    texture?: {
        url: string;
        metadata?: { model?: "slim" | "steve", [key: string]: any };
    } | {
        data: Uint8Array;
        metadata?: { model?: "slim" | "steve", [key: string]: any };
    },
}

/**
 * Set texture by access token and uuid.
 * If the texture is undefined, it will clear the texture to default steve.
 */
export async function setTexture(option: SetTextureOption, api: ProfileServiceAPI = PROFILE_API_MOJANG): Promise<void> {
    const urlString = ProfileServiceAPI.getTextureUrl(api, option.uuid, option.type);
    const headers = {
        Authorization: `Bearer: ${option.accessToken}`
    };
    if (!option.texture) {
        // delete texture
        const response = await request({
            url: urlString,
            method: "DELETE",
            headers,
        });
        if (response.statusCode >= 300) {
            throw new Error(`Status code ${response.statusCode}!`)
        }
    } else if ("data" in option.texture) {
        // upload texture
        const response = await request({
            url: urlString,
            method: "PUT",
            body: {
                model: option.texture.metadata?.model || "",
                file: { type: "image/png", value: option.texture.data },
            } as FormItems,
            bodyType: "formMultiPart",
            headers,
        });
        if (response.statusCode >= 300) {
            throw new Error(`Status code ${response.statusCode}!`)
        }
    } else if ("url" in option.texture) {
        // set texture
        const response = await request({
            url: urlString,
            method: "POST",
            body: {
                model: option.texture.metadata?.model || "",
                url: option.texture.url,
            },
            bodyType: "search",
            headers,
        });
        if (response.statusCode >= 300) {
            throw new Error(`Status code ${response.statusCode}!`)
        }
    } else {
        throw new Error("Illegal Option Format!");
    }
}

/**
 * A lookuper will maintain your last time of lookup. It will prevent the lookup frequency exceed the rate limit
 */
export class ProfileLookuper {
    protected lookupRecord: Record<string, {
        lastLookupTime: number;
        deferredLookup: Promise<any> | undefined;
    }> = {};

    constructor(
        readonly api: ProfileServiceAPI,
        /**
         * The rate limit of this lookuper
         */
        readonly rateLimit: number = 6000) { }

    lookup(uuid: string): Promise<GameProfileWithProperties> {
        const now = Date.now();
        const api = this.api;
        const rateLimit = this.rateLimit;

        const lastLookup = this.lookupRecord[uuid];

        if (!lastLookup) {
            // never lookup
            this.lookupRecord[uuid] = {
                deferredLookup: undefined,
                lastLookupTime: Date.now(),
            }
            return lookup(uuid, { api });
        }

        let lastLookupTime = lastLookup.lastLookupTime;
        let deferredLookup = lastLookup.deferredLookup;

        if (now - lastLookupTime < rateLimit) {
            // lookup too freq
            if (!deferredLookup) {
                // no one looked
                deferredLookup = new Promise((resolve) => {
                    setTimeout(() => {
                        this.lookupRecord[uuid] = {
                            deferredLookup: undefined,
                            lastLookupTime: Date.now(),
                        };
                        resolve(lookup(uuid, { api }));
                    }, (now - lastLookupTime - rateLimit));
                });
            }
            lastLookup.deferredLookup = deferredLookup;
            return deferredLookup;
        }

        // not too freq, update the look up time
        lastLookup.lastLookupTime = Date.now();
        return lookup(uuid, { api });
    }
}
