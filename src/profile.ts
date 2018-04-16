import * as https from 'https'
import * as queryString from 'querystring'
import * as url from 'url'
import { download as get } from './utils/download'

export interface GameProfile {
    readonly id: string,
    readonly name: string,
    readonly properties?: { [name: string]: string }
}

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
    export interface Texture {
        metadata: { model: 'slim' | 'steve', [key: string]: any },
        url: string,
        data?: Buffer,
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
        profile(uuid: string): string,
        profileByName(name: string): string,
    }
    export const mojang: API = {
        profile(uuid: string) {
            return `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`;
        },
        profileByName(name: string) {
            return "https://api.mojang.com/users/profiles/minecraft/" + name;
        },
    }

    async function cache(texture: GameProfile.Texture): Promise<GameProfile.Texture> {
        if (texture.data) return texture;
        return {
            ...texture,
            data: await get(texture.url).then(buf => (buf as Buffer))
        }
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

    export async function fetchProfileTexture(profile: GameProfile): Promise<GameProfile.Textures> {
        const texture = GameProfile.parseTexturesInfo(profile);
        if (texture) return cacheTextures(texture);
        return Promise.reject(`No texture for user ${profile.id}.`);
    }

    async function fetchProfile(target: string, pubKey?: string) {
        const buf = await get(target) as Buffer;
        const obj = JSON.parse(buf.toString())
        if (obj.properties) {
            const properties = obj.properties;
            const to: any = {}
            for (const prop of properties) {
                if (prop.signature && pubKey) {

                }
                to[prop.name] = prop.value;
            }
            obj.properties = to;
        }
        return obj as GameProfile;
    }
    export function fetch(uuid: string, option: { api?: API, pubKey?: string } = {}) {
        return fetchProfile((option.api || mojang).profile(uuid) + '?' + queryString.stringify({
            unsigned: false,
        }), option.pubKey)
    }
    export function lookup(name: string, option: { api?: API, timestamp?: number, pubKey?: string } = {}) {
        const api = option.api || mojang;
        const time: number = option.timestamp || 0;
        let target;
        if (!time)
            target = (api.profileByName(name));
        else target = (api.profileByName(name) + "?" + queryString.stringify({
            at: (time / 1000),
        }))
        return fetchProfile(target, option.pubKey)
    }
}
