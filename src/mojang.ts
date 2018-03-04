import * as https from 'https'
import * as url from 'url'
import { download as request } from './utils/download'
import { Auth } from './auth';
import * as ByteBuffer from 'bytebuffer'
import { GameProfile } from './profile'
import * as crypto from 'crypto'

export interface MojangAccount {
    readonly id: string
    readonly email: string
    readonly username: string
    readonly registerIp: string
    readonly registeredAt: Long
    readonly passwordChangedAt: Long
    readonly dateOfBirth: Long
    readonly deleted: boolean
    readonly blocked: boolean
    readonly secured: boolean
    readonly migrated: boolean
    readonly emailVerified: boolean
    readonly legacyUser: boolean
    readonly verifiedByParent: boolean
    readonly fullName: string
    readonly fromMigratedUser: boolean
    readonly hashed: boolean
}

export namespace MojangService {
    export interface Provider {
        readonly apiStatus: string
        readonly userInfo: string
        readonly blockedServers: string
        readonly salesStatistics: string
        texture(uuid: string, type: 'skin' | 'cape' | 'elytra'): string
        nameHistory(uuid: string): string
    }
    const defaultProvider: Provider = {
        apiStatus: "https://status.mojang.com/check",
        userInfo: "https://api.mojang.com/user",
        blockedServers: "https://sessionserver.mojang.com/blockedservers",
        salesStatistics: "https://api.mojang.com/orders/statistics",
        texture: (uuid, type) => `https://api.mojang.com/user/profile/${uuid}/${type}`,
        nameHistory: (uuid) => `https://api.mojang.com/user/profiles/${uuid}/names`
    }

    export enum Status {
        GREEN, YELLOW, RED
    }
    export function getServiceStatus(provider: Provider = defaultProvider): Promise<{ [server: string]: Status }[]> {
        return request(provider.apiStatus)
            .then(b => JSON.parse((b as Buffer).toString()))
            .then(arr => arr.reduce((a: any, b: any) => Object.assign(a, b), {}))
    }
    export function getAccountInfo(accessToken: string, provider: Provider = defaultProvider): Promise<MojangAccount> {
        return new Promise((resolve, reject) => {
            const userInfUrl = url.parse(provider.userInfo);
            const req = https.get({
                host: userInfUrl.host, path: userInfUrl.path,
                headers: { Authorization: `Bearer: ${accessToken}` }
            }, (res) => {
                let data = ''
                res.on('data', (d) => { data += d.toString(); })
                res.on('end', () => { resolve(JSON.parse(data)); })
                res.on('error', (e) => { reject(e); })
            })
            req.on('error', (e) => { reject(e) })
            req.end();
        });
    }
    export async function setTexture($option: {
        accessToken: string, uuid: string, type: 'skin' | 'cape' | 'elytra',
        texture?: GameProfile.Texture
    }, provider: Provider = defaultProvider): Promise<void> {
        const textUrl = url.parse(provider.texture($option.uuid, $option.type));
        const headers: any = { Authorization: `Bearer: ${$option.accessToken}` }
        const requireEmpty = (option: https.RequestOptions, content?: string | Buffer) =>
            new Promise<void>((resolve, reject) => {
                const req = https.request(option, (inc) => {
                    let d = ''
                    inc.on('error', (e) => { reject(e) });
                    inc.on('data', (b) => d += b.toString());
                    inc.on('end', () => {
                        if (d === '') resolve()
                        else reject(JSON.parse(d));
                    })
                });
                req.on('error', e => reject(e))
                if (content) req.write(content)
                req.end();
            })
        if (!$option.texture)
            return requireEmpty({
                method: 'DELETE',
                path: textUrl.path,
                host: textUrl.host,
                headers,
            })
        else if ($option.texture.data) {
            let status = 0;
            const boundary = `---------------------------${crypto.randomBytes(8).toString('hex')}`;
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

            for (const key in $option.texture.metadata) {
                diposition('name', key)
                content($option.texture.metadata[key])
            }
            diposition('name', 'file')
            header('Content-Type', 'image/png')
            content($option.texture.data)
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
        } else if ($option.texture.url) {
            const param = new url.URLSearchParams(Object.assign({ url: $option.texture.url }, $option.texture.metadata)).toString();
            headers['Content-Type'] = 'x-www-form-urlencoded'
            headers['Content-Length'] = param.length;
            return requireEmpty({
                method: 'POST',
                host: textUrl.host,
                path: textUrl.path,
                headers,
            }, param)
        } else {
            throw new Error();
        }
    }
}

export default MojangService