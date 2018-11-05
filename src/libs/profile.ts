import * as https from 'https'
import * as queryString from 'querystring'
import * as url from 'url'
import { download as get } from './utils/download'
import * as ByteBuffer from 'bytebuffer'
import * as crypto from 'crypto'

/**
 * The data structure holds the user game profile
 */
export interface GameProfile {
    readonly id: string,
    readonly name: string,
    readonly properties?: { [name: string]: string }
}

/**
 * The module handle the game profile things
 * @see class:GameProfile
 */
export namespace GameProfile {
    export interface Textures {
        timestamp: number,
        profileName: string,
        profileId: string,
        textures: {
            skin?: Texture,
            cape?: Texture,
            elytra?: Texture,
        }
    }
    /**
     * The data structure that hold the texture, it 
     */
    export interface Texture {
        url: string,
        metadata?: { model?: 'slim' | 'steve', [key: string]: any },
        data?: Buffer,
    }

    export namespace Texture {
        export function isSlim(texture: Texture) {
            return texture.metadata ? texture.metadata.model === 'slim' : false;
        }

        export function getModelType(texture: Texture) {
            return isSlim(texture) ? 'slim' : 'steve';
        }
    }

    export function parseTexturesInfo(profile: GameProfile): Textures | undefined {
        if (!profile.properties || !profile.properties.textures) return undefined;
        const obj = JSON.parse(new Buffer(profile.properties.textures, 'base64').toString());
        obj.textures.skin = obj.textures.SKIN;
        if (obj.textures.CAPE) obj.textures.cape = obj.textures.CAPE;
        if (obj.textures.ELYTRA) obj.textures.elytra = obj.textures.ELYTRA;
        delete obj.textures.SKIN;
        delete obj.textures.CAPE;
        delete obj.textures.ELYTRA;

        return obj;
    }
}

export namespace ProfileService {
    export interface API {
        profile(uuid: string): string
        profileByName(name: string): string
        texture(uuid: string, type: 'skin' | 'cape' | 'elytra'): string
        /**
         * The PEM public key
         */
        publicKey?: string
    }
    export const API_MOJANG: API = {
        profile: (uuid: string) => `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`,
        profileByName: (name: string) => `https://api.mojang.com/users/profiles/minecraft/${name}`,
        texture: (uuid, type) => `https://api.mojang.com/user/profile/${uuid}/${type}`,
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
-----END PUBLIC KEY-----`
    }
    /**
     * @deprecated
     */
    export const mojang: API = API_MOJANG

    async function cache(texture: GameProfile.Texture): Promise<GameProfile.Texture> {
        if (texture.data) return texture;
        return {
            ...texture,
            data: await get(texture.url).then(buf => (buf as Buffer))
        }
    }

    function checkSign(value: string, signature: string, pemKey: string) {
        return crypto.createVerify('SHA1').update(value, 'utf8')
            .verify(pemKey, signature, 'base64');
    }

    async function fetchProfile(target: string, pemPubKey?: string) {
        const buf = await get(target) as Buffer;
        const obj = JSON.parse(buf.toString())
        if (obj.properties) {
            const properties = obj.properties;
            const to: any = {}
            for (const prop of properties) {
                if (prop.signature && pemPubKey && !checkSign(prop.value, prop.signature, pemPubKey))
                    throw { type: 'SignatureMissMatch' };
                to[prop.name] = prop.value;
            }
            obj.properties = to;
        }
        return obj as GameProfile;
    }

    export async function cacheTextures(tex: GameProfile.Textures) {
        if (!tex) return Promise.reject('No textures')
        if (tex.textures.skin)
            tex.textures.skin = await cache(tex.textures.skin);
        if (tex.textures.cape)
            tex.textures.cape = await cache(tex.textures.cape);
        if (tex.textures.elytra)
            tex.textures.elytra = await cache(tex.textures.elytra);
        return tex;
    }

    /**
     * Get all the textures of this GameProfile and cache them.
     *  
     * @param profile 
     */
    export async function getTextures(profile: GameProfile): Promise<GameProfile.Textures> {
        const texture = GameProfile.parseTexturesInfo(profile);
        if (texture) return cacheTextures(texture);
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
        return fetchProfile(api.profile(uuid) + '?' + queryString.stringify({
            unsigned: false,
        }), api.publicKey);
    }
    /**
     * Look up the GameProfile by username in game.
     * @param name The username in game.
     * @param option the options of this function
     */
    export function lookup(name: string, option: { api?: API, timestamp?: number } = {}) {
        const api = option.api || API_MOJANG;
        const time: number = option.timestamp || 0;
        let target;
        if (!time)
            target = (api.profileByName(name));
        else target = (api.profileByName(name) + "?" + queryString.stringify({
            at: (time / 1000),
        }))
        return fetchProfile(target, api.publicKey)
    }

    /**
     * Set texture by access token and uuid. If the texture is undefined, it will clear the texture to default steve.
     * 
     * @param option 
     * @param api 
     */
    export async function setTexture(option: {
        accessToken: string, uuid: string, type: 'skin' | 'cape' | 'elytra',
        texture?: GameProfile.Texture
    }, api: API = API_MOJANG): Promise<void> {
        const textUrl = url.parse(api.texture(option.uuid, option.type));
        const headers: any = { Authorization: `Bearer: ${option.accessToken}` }
        const requireEmpty = (_option: https.RequestOptions, content?: string | Buffer) =>
            new Promise<void>((resolve, reject) => {
                const req = https.request(_option, (inc) => {
                    let d = ''
                    inc.on('error', (e) => { reject(e) });
                    inc.on('data', (b) => d += b.toString());
                    inc.on('end', () => {
                        if (d === '' && inc.statusCode === 204) resolve()
                        else reject(JSON.parse(d));
                    })
                });
                req.on('error', e => reject(e))
                if (content) req.write(content)
                req.end();
            })
        if (!option.texture)
            return requireEmpty({
                method: 'DELETE',
                path: textUrl.path,
                host: textUrl.host,
                headers,
            })
        else if (option.texture.data) {
            let status = 0;
            const boundary = `----------------------${crypto.randomBytes(8).toString('hex')}`;
            let buff: ByteBuffer = new ByteBuffer();
            const diposition = (key: string, value: string) => {
                if (status === 0) {
                    buff.writeUTF8String(`--${boundary}\r\nContent-Disposition: form-data`)
                    status = 1
                }
                buff.writeUTF8String(`; ${key}="${value}"`);
            }
            const header = (key: string, value: string) => {
                if (status === 1) {
                    buff.writeUTF8String('\r\n')
                    status = 2;
                }
                buff.writeUTF8String(`${key}:${value}\r\n`);
            }
            const content = (payload: Buffer) => {
                if (status === 1)
                    buff.writeUTF8String('\r\n')
                status = 0;
                buff.writeUTF8String('\r\n')
                buff = buff.append(payload)
                buff.writeUTF8String('\r\n')
            }
            const finish = () => {
                buff.writeUTF8String(`--${boundary}--\r\n`)
            }

            if (option.texture.metadata)
                for (const key in option.texture.metadata) {
                    diposition('name', key)
                    content(option.texture.metadata[key])
                }
            diposition('name', 'file')
            header('Content-Type', 'image/png')
            content(option.texture.data)
            finish();
            buff.flip();
            const out = Buffer.from(buff.toArrayBuffer());
            headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`
            headers['Content-Length'] = out.byteLength;
            return requireEmpty({
                method: 'PUT',
                host: textUrl.host,
                path: textUrl.path,
                headers,
            }, out);
        } else if (option.texture.url) {
            const param = new url.URLSearchParams(Object.assign({ url: option.texture.url }, option.texture.metadata)).toString();
            headers['Content-Type'] = 'x-www-form-urlencoded'
            headers['Content-Length'] = param.length;
            return requireEmpty({
                method: 'POST',
                host: textUrl.host,
                path: textUrl.path,
                headers,
            }, param)
        } else {
            throw new Error('Illegal Option Format!');
        }
    }
}
