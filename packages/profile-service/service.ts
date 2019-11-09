/**
 * The data structure holds the user game profile
 */
export interface GameProfile {
    readonly id: string;
    readonly name: string;
    readonly properties?: { [name: string]: string };
}

export namespace GameProfile {

    export interface TexturesInfo {
        /**
         * java time in ms
         */
        timestamp: number;
        /**
         * player name
         */
        profileName: string;
        /**
         * player id
         */
        profileId: string;
        textures: {
            SKIN?: Texture,
            CAPE?: Texture,
            ELYTRA?: Texture,
        };
    }
    /**
     * The data structure that hold the texture
     */
    export interface Texture {
        url: string;
        metadata?: { model?: "slim" | "steve", [key: string]: any };
    }

    export namespace Texture {
        export function isSlim(o: Texture) {
            return o.metadata ? o.metadata.model === "slim" : false;
        }

        export function getModelType(o: Texture) {
            return isSlim(o) ? "slim" : "steve";
        }
    }
}

function parseTexturesInfo(profile: GameProfile): GameProfile.TexturesInfo | undefined {
    if (!profile.properties || !profile.properties.textures) { return undefined; }
    return JSON.parse(Buffer.from(profile.properties.textures, "base64").toString());
}

let requester: Requester;
let verify: Verify;

export function setBase(req: typeof requester, ver: Verify) {
    requester = req;
    verify = ver;
}

type Verify = (value: string, signature: string, pemKey: string) => Promise<boolean>;
type Requester = (url: string, option?: { methods?: string; body?: any, headers?: { [key: string]: string }, search?: any, formMultipart?: any }) => Promise<{ body: any; statusCode: number; statusMessage: string }>;

export namespace ProfileService {
    export interface API {
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

    export namespace API {
        /**
         * Replace `${uuid}` string into uuid param
         * @param api The api
         * @param uuid The uuid will be replaced
         */
        export function getProfileUrl(api: API, uuid: string) {
            return api.profile.replace("${uuid}", uuid);
        }
        /**
         * Replace `${name}` string into name param
         * @param api The api
         * @param name The name will be replaced
         */
        export function getProfileByNameUrl(api: API, name: string) {
            return api.profileByName.replace("${name}", name);
        }

        /**
         * Replace uuid string into `${uuid}`, and type string into `${type}`
         * @param api The api
         * @param uuid The uuid string
         * @param type The type string
         */
        export function getTextureUrl(api: API, uuid: string, type: string) {
            return api.texture.replace("${uuid}", uuid).replace("${type}", type);
        }
    }
    /**
     * The default Mojang API
     */
    export const API_MOJANG: API = {
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

    async function fetchProfile(target: string, pemPubKey?: string, payload?: object, search?: object) {
        const { body: obj, statusCode, statusMessage } = await requester(target, { methods: "GET", body: payload, search });
        if (statusCode !== 200) {
            throw new Error(statusMessage);
        }
        async function parseProfile(o: any) {
            if (typeof o.id !== "string" || typeof o.name !== "string") {
                throw new Error(`Corrupted profile response ${JSON.stringify(o)}`);
            }
            if (o.properties && o.properties instanceof Array) {
                const properties = o.properties as Array<{ name: string; value: string; signature: string; }>;
                const to: { [key: string]: string } = {};
                for (const prop of properties) {
                    if (prop.signature && pemPubKey && !await verify(prop.value, prop.signature, pemPubKey.toString())) {
                        console.warn(`Discard corrupted prop ${prop.name}: ${prop.value} as the signature mismatched!`);
                    } else {
                        to[prop.name] = prop.value;
                    }
                }
                o.properties = to;
            }
            return o as GameProfile;
        }
        if (obj instanceof Array) {
            return Promise.all(obj.map(parseProfile));
        } else {
            return parseProfile(obj);
        }
    }

    /**
     * Get all the textures of this GameProfile and cache them.
     *
     * @param profile The game profile from the profile service
     * @param cache Should we cache the texture into url? Default is `true`.
     */
    export async function getTextures(profile: GameProfile): Promise<GameProfile.TexturesInfo> {
        const texture = parseTexturesInfo(profile);
        if (texture) { return texture; }
        return Promise.reject(`No texture for user ${profile.id}.`);
    }


    /**
     * Fetch the GameProfile by uuid.
     *
     * @param uuid The unique id of user/player
     * @param option the options for this function
     */
    export function fetch(uuid: string, option: { api?: API } = {}) {
        const api = option.api || API_MOJANG;
        return fetchProfile(API.getProfileUrl(api, uuid), api.publicKey, undefined, {
            unsigned: false,
        }).then((p) => p as GameProfile);
    }
    /**
     * Look up the GameProfile by username in game.
     * @param name The username in game.
     * @param option the options of this function
     */
    export function lookup(name: string, option: { api?: API, timestamp?: number } = {}) {
        const api = option.api || API_MOJANG;
        const time: number = option.timestamp || 0;
        let target = API.getProfileByNameUrl(api, name);
        let form;
        if (time) {
            form = { at: (time / 1000) };
        }
        return fetchProfile(target, api.publicKey, undefined, form).then((p) => p as GameProfile);
    }

    /**
     * Look up all names by api
     * @param names The names will go through
     * @param option The option with api
     */
    export function lookUpAll(names: string[], option: { api?: API } = {}) {
        const api = option.api || API_MOJANG;
        let target = API.getProfileByNameUrl(api, "");
        target = target.substring(0, target.length - 1);
        return fetchProfile(target, api.publicKey, names).then((r) => r as Array<GameProfile | undefined>);
    }

    /**
     * Set texture by access token and uuid. If the texture is undefined, it will clear the texture to default steve.
     *
     * @param option
     * @param api
     */
    export async function setTexture(option: {
        accessToken: string,
        uuid: string,
        type: "skin" | "cape" | "elytra",
        texture?: GameProfile.Texture,
        data?: Uint8Array,
    }, api: API = API_MOJANG): Promise<void> {
        const urlString = API.getTextureUrl(api, option.uuid, option.type);
        const headers = {
            Authorization: `Bearer: ${option.accessToken}`
        };
        if (!option.texture) {
            await requester(urlString, { methods: "DELETE", headers });
        } else if (option.data) {
            await requester(urlString, {
                methods: "PUT",
                formMultipart: {
                    ...(option.texture.metadata || {}),
                    file: option.data,
                },
                headers,
            });
        } else if (option.texture.url) {
            await requester(urlString, {
                methods: "PUT",
                search: {
                    url: option.texture.url, ...(option.texture.metadata || {})
                },
                headers,
            });
        } else {
            throw new Error("Illegal Option Format!");
        }
    }
}
