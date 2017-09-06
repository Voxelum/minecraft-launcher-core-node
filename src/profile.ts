import * as https from 'https'
import * as queryString from 'querystring'
import * as url from 'url'
import get from './utils/download'

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
            SKIN?: Texture,
            CAPE?: Texture,
            ELYTRA?: Texture,
        }
    }
    export namespace Textures {
        export async function cache(texture: Texture): Promise<Texture> {
            if (texture.data) return texture;
            return {
                ...texture,
                data: await get(texture.url).then(buf => (buf as Buffer).toString('base64'))
            }
        }
    }
    export interface Texture {
        metadata: { model: 'slim' | 'steve' },
        url: string,
        data?: string, // base64 skin data
    }
    export async function cacheTextures(profile: GameProfile) {
        const tex = getTextures(profile);
        if (!tex) return Promise.reject('No textures')
        if (tex.textures.SKIN)
            tex.textures.SKIN = await Textures.cache(tex.textures.SKIN)
        if (tex.textures.CAPE)
            tex.textures.CAPE = await Textures.cache(tex.textures.CAPE)
        if (tex.textures.ELYTRA)
            tex.textures.ELYTRA = await Textures.cache(tex.textures.ELYTRA)
        return tex;
    }
    export function getTextures(profile: GameProfile): Textures | undefined {
        if (!profile.properties || !profile.properties.textures) return undefined;
        return JSON.parse(new Buffer(profile.properties.textures, 'base64').toString())
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
        return obj;
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
        console.log(api.profileByName(name))
        return fetchProfile(target, option.pubKey)
    }
}
