import { GameProfile } from "@xmcl/common";
import { fetchBuffer, fetchJson } from "@xmcl/net";
import * as ByteBuffer from "bytebuffer";
import * as crypto from "crypto";
import * as https from "https";
import * as queryString from "querystring";
import * as url from "url";

export { GameProfile } from "@xmcl/common";

function parseTexturesInfo(profile: GameProfile): GameProfile.TexturesInfo | undefined {
    if (!profile.properties || !profile.properties.textures) { return undefined; }
    return JSON.parse(Buffer.from(profile.properties.textures, "base64").toString());
}

export namespace ProfileService {
    export interface API {
        /**
         * The PEM public key
         */
        publicKey?: string;
        profile: string;
        profileByName: string;
        texture: string;
    }

    export namespace API {
        export function getProfileUrl(api: API, uuid: string) {
            return api.profile.replace("${uuid}", uuid);
        }

        export function getProfileByNameUrl(api: API, name: string) {
            return api.profileByName.replace("${name}", name);
        }

        export function getTextureUrl(api: API, uuid: string, type: string) {
            return api.texture.replace("${uuid}", uuid).replace("${type}", type);
        }
    }
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


    function checkSign(value: string, signature: string, pemKey: string) {
        return crypto.createVerify("SHA1").update(value, "utf8").verify(pemKey, signature, "base64");
    }

    async function fetchProfile(target: string, pemPubKey?: string, payload?: object) {
        const { body: obj,  statusCode, statusMessage } = await fetchJson(target, { body: payload });
        if (statusCode !== 200) {
            throw new Error(statusMessage);
        }
        function parseProfile(o: any) {
            if (o.properties) {
                const properties = o.properties;
                const to: any = {};
                for (const prop of properties) {
                    if (prop.signature && pemPubKey && !checkSign(prop.value, prop.signature, pemPubKey)) {
                        throw { type: "SignatureMissMatch" };
                    }
                    to[prop.name] = prop.value;
                }
                o.properties = to;
            }
            return o as GameProfile;
        }
        if (obj instanceof Array) {
            return obj.map(parseProfile);
        } else {
            return parseProfile(obj);
        }
    }

    export async function cacheTextures(tex: GameProfile.TexturesInfo) {
        if (!tex) { return Promise.reject("No textures"); }

        async function cache(texture: GameProfile.Texture): Promise<GameProfile.Texture> {
            if (new URL(texture.url).protocol === "data;") { return texture; }
            texture.url = await fetchBuffer(texture.url)
                .then((resp) => resp.body)
                .then((b) => b.toString("base64"))
                .then((s) => `data:image/png;base64,${s}`);
            return texture;
        }
        if (tex.textures.SKIN) {
            tex.textures.SKIN = await cache(tex.textures.SKIN);
        }
        if (tex.textures.CAPE) {
            tex.textures.CAPE = await cache(tex.textures.CAPE);
        }
        if (tex.textures.ELYTRA) {
            tex.textures.ELYTRA = await cache(tex.textures.ELYTRA);
        }
        return tex;
    }

    /**
     * Get all the textures of this GameProfile and cache them.
     *
     * @param profile
     */
    export async function getTextures(profile: GameProfile): Promise<GameProfile.TexturesInfo> {
        const texture = parseTexturesInfo(profile);
        if (texture) { return cacheTextures(texture); }
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
        return fetchProfile(API.getProfileUrl(api, uuid) + "?" + queryString.stringify({
            unsigned: false,
        }), api.publicKey).then((p) => p as GameProfile);
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
        if (time) {
            target += "?" + queryString.stringify({
                at: (time / 1000),
            });
        }
        return fetchProfile(target, api.publicKey).then((p) => p as GameProfile);
    }

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
        data?: Buffer,
    }, api: API = API_MOJANG): Promise<void> {
        const textUrl = url.parse(API.getTextureUrl(api, option.uuid, option.type));
        const headers: any = { Authorization: `Bearer: ${option.accessToken}` };
        const requireEmpty = (httpOption: https.RequestOptions, content?: string | Buffer) =>
            new Promise<void>((resolve, reject) => {
                const req = https.request(httpOption, (inc) => {
                    let d = "";
                    inc.on("error", (e) => { reject(e); });
                    inc.on("data", (b) => d += b.toString());
                    inc.on("end", () => {
                        if (d === "" && inc.statusCode === 204) { resolve(); } else { reject(JSON.parse(d)); }
                    });
                });
                req.on("error", (e) => reject(e));
                if (content) { req.write(content); }
                req.end();
            });
        if (!option.texture) {
            return requireEmpty({
                method: "DELETE",
                path: textUrl.path,
                host: textUrl.host,
                headers,
            });
        } else if (option.data) {
            let status = 0;
            const boundary = `----------------------${crypto.randomBytes(8).toString("hex")}`;
            let buff: ByteBuffer = new ByteBuffer();
            const diposition = (key: string, value: string) => {
                if (status === 0) {
                    buff.writeUTF8String(`--${boundary}\r\nContent-Disposition: form-data`);
                    status = 1;
                }
                buff.writeUTF8String(`; ${key}="${value}"`);
            };
            const header = (key: string, value: string) => {
                if (status === 1) {
                    buff.writeUTF8String("\r\n");
                    status = 2;
                }
                buff.writeUTF8String(`${key}:${value}\r\n`);
            };
            const content = (payload: Buffer) => {
                if (status === 1) {
                    buff.writeUTF8String("\r\n");
                }
                status = 0;
                buff.writeUTF8String("\r\n");
                buff = buff.append(payload);
                buff.writeUTF8String("\r\n");
            };
            const finish = () => {
                buff.writeUTF8String(`--${boundary}--\r\n`);
            };

            if (option.texture.metadata) {
                for (const key in option.texture.metadata) {
                    diposition("name", key);
                    content(option.texture.metadata[key]);
                }
            }
            diposition("name", "file");
            header("Content-Type", "image/png");
            content(option.data);
            finish();
            buff.flip();
            const out = Buffer.from(buff.toArrayBuffer());
            headers["Content-Type"] = `multipart/form-data; boundary=${boundary}`;
            headers["Content-Length"] = out.byteLength;
            return requireEmpty({
                method: "PUT",
                host: textUrl.host,
                path: textUrl.path,
                headers,
            }, out);
        } else if (option.texture.url) {
            const param = new url.URLSearchParams(Object.assign({ url: option.texture.url }, option.texture.metadata)).toString();
            headers["Content-Type"] = "x-www-form-urlencoded";
            headers["Content-Length"] = param.length;
            return requireEmpty({
                method: "POST",
                host: textUrl.host,
                path: textUrl.path,
                headers,
            }, param);
        } else {
            throw new Error("Illegal Option Format!");
        }
    }
}
