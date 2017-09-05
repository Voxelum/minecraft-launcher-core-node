import * as https from 'https'
import * as queryString from 'querystring'
import * as url from 'url'

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
    export interface Texture {
        metadata: { model: 'slim' | 'steve' },
        url: string,
    }
    export type TextureType = 'SKIN' | 'CAPE' | 'ELYTRA';
    export function getTexture(profile: GameProfile): Textures | undefined {
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

    export async function fetchGameProfile(uuid: string, option: { api?: API, pubKey?: string } = {}): Promise<GameProfile> {
        const target = url.parse((option.api || mojang).profile(uuid) + '?' + queryString.stringify({
            unsigned: false,
        }), true)
        const obj = JSON.parse(await new Promise<string>((resolve, reject) => {
            let s = ''
            if (!target.path || !target.search) {
                reject();
                return
            }
            const req = https.get({
                host: target.host,
                path: target.path + target.search
            }, (res) => {
                res.setEncoding('utf8')
                res.on('data', (b) => { s += b; })
                res.on('end', () => { resolve(s) })
            })
            req.on('error', reject);
        }));
        const properties = obj.properties;
        const to: any = {}
        for (const prop of properties) {
            if (prop.signature && option.pubKey) {

            }
            to[prop.name] = prop.value;
        }
        obj.properties = to;
        return obj;
    }
}
