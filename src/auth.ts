import { v4 } from 'uuid'

export enum UserType {
    Legacy, Mojang
}

export namespace UserType {
    export function toString(type: UserType): string {
        if (type = UserType.Mojang)
            return 'mojang';
        else return 'legacy';
    }
}

export interface GameProfile {
    readonly uuid: string,
    readonly name: string
}

import * as https from 'https';
import * as http from 'http';

//this module migrates from jmccc: https://github.com/to2mbn/JMCCC/tree/master/jmccc-yggdrasil-authenticator
//@author huangyuhui

export interface AuthResponse {
    readonly clientToken: string
    readonly accessToken: string
    readonly selectedProfile: GameProfile
    readonly profiles: GameProfile[]
    readonly userId: string
    readonly properties: { [key: string]: string }
    readonly userType: UserType
}

export interface AuthService {
    login(username: string, password: string, clientToken?: string): Promise<AuthResponse>;
    refresh(clientToken: string, accessToken: string, profile: string): Promise<AuthResponse>;
    validate(accessToken: string, clientToken?: string): Promise<boolean>;
    invalide(accessToken: string, clientToken: string): void;
    signout(username: string, password: string): void;
}

export namespace AuthService {
    export interface API {
        readonly hostName: string;
        //paths
        readonly authenticate: string;
        readonly refresh: string;
        readonly validate: string;
        readonly invalidate: string;
        readonly signout: string;
    }

    export function mojangAPI(): API {
        return {
            hostName: 'authserver.mojang.com',
            authenticate: '/authenticate',
            refresh: '/refresh',
            validate: "/validate",
            invalidate: '/invalidate',
            signout: '/signout',
        }
    }
    class Yggdrasil implements AuthService {
        constructor(private api: API) { }
        private request(payload: any, path: string): Promise<string> {
            return new Promise((resolve, reject) => {
                payload = JSON.stringify(payload)
                let responseHandler = (response: http.IncomingMessage) => {
                    let buffer = ''
                    response.setEncoding('utf8');
                    response.on('data', (chunk) => {
                        if (typeof (chunk) === 'string') buffer += chunk
                    })
                    response.on('end', () => { resolve(buffer) });
                }
                let req = https.request({
                    hostname: this.api.hostName,
                    path: path,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': payload.length
                    }
                }, responseHandler)
                req.on('error', (e) => {
                    reject(e)
                });
                req.write(payload);
                req.end();
            });

        }

        private requestAndHandleResponse(payload: any, path: string): Promise<AuthResponse> {
            return this.request(payload, path).then(s => {
                let obj = JSON.parse(s)
                if (obj.error)
                    throw (new Error(obj.errorMessage))
                let userId = obj.user ? obj.user.id ? obj.user.id : '' : ''
                let prop = obj.user ? obj.user.properties ? obj.user.properties : {} : {}
                return {
                    accessToken: <string>obj.accessToken,
                    clientToken: <string>obj.clientToken,
                    selectedProfile: <GameProfile>{
                        uuid: obj.selectedProfile.id,
                        name: obj.selectedProfile.name
                    },
                    profiles: <GameProfile[]>obj.availableProfiles,
                    userId: userId,
                    properties: prop,
                    userType: UserType.Mojang
                }
            })
        }

        login(username: string, password: string, clientToken?: string | undefined): Promise<AuthResponse> {
            let payload = {
                agent: 'Minecraft',
                username: username,
                password: password,
                clientToken: clientToken,
                requestUser: true
            };
            return this.requestAndHandleResponse(payload, this.api.authenticate)
        }

        refresh(clientToken: string, accessToken: string, profile?: string): Promise<AuthResponse> {
            let payloadObj: any = {
                // agent: 'Minecraft',
                clientToken: clientToken,
                accessToken: accessToken,
                requestUser: true
            }
            if (profile)
                payloadObj.selectedProfile = {
                    id: profile
                }
            return this.requestAndHandleResponse(payloadObj, this.api.refresh)
        }
        validate(accessToken: string, clientToken?: string): Promise<boolean> {
            let obj = {
                accessToken: accessToken,
                clientToken: clientToken
            }
            return this.request(obj, this.api.validate).then(suc => true, fail => false)
        }
        invalide(accessToken: string, clientToken: string): void {
            this.request({ accessToken: accessToken, clientToken: clientToken }, this.api.invalidate)
        }
        signout(username: string, password: string): void {
            this.request({ username: username, password: password }, this.api.signout)
        }
    }
    export function newYggdrasilAuthService(api?: API): AuthService {
        if (api) return new Yggdrasil(api)
        return new Yggdrasil(mojangAPI())
    }

    export function offlineAuth(username: string) {
        return new Promise((resolve, reject) => {
            resolve({
                accessToken: v4(),
                clientToken: v4(),
                selectedProfile: <GameProfile>{
                    uuid: v4(),
                    name: username
                },
                profiles: [],
                userId: username,
                properties: {},
                userType: UserType.Mojang
            })
        });
    }

    export function yggdrasilAuth(option: {
        api?: API,
        username: string,
        password: string,
        clientToken?: string
    }): Promise<AuthResponse> {
        return newYggdrasilAuthService(option.api).login(option.username, option.password, option.clientToken)
    }
}
