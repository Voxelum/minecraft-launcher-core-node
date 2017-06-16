import { GameProfile, UserType, AuthInfo } from './auth'

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

export namespace AuthResponse {
    export function toAuthInfo(response: AuthResponse): AuthInfo {
        return {
            accessToken: response.accessToken,
            profile: response.selectedProfile,
            properties: response.properties,
            userType: response.userType
        }
    }
}

export interface AuthService {
    login(username: string, password: string, clientToken?: string, callback?: (response: AuthResponse) => void): void;
    refresh(clientToken: string, accessToken: string, profile: string, callback?: (response: AuthResponse) => void): void;
    validate(accessToken: string, clientToken?: string, callback?: (valid: boolean) => void): void;
    invalide(accessToken: string, clientToken: string): void;
    signout(username: string, password: string): void;
}

export namespace AuthService {
    class Yggdrasil implements AuthService {
        private api: API;
        private request(payload: any, path: string, callback?: (string: string) => void, error?: (e: Error) => void) {
            let responseHandler = callback ? (response: http.IncomingMessage) => {
                let buffer = ''
                response.setEncoding('utf8');
                response.on('data', (chunk) => {
                    if (typeof (chunk) === 'string') buffer += chunk
                })
                response.on('end', () => { callback(buffer) });
            } : undefined
            let req = https.request({
                hostname: MojangAPI.hostName,
                path: path,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': payload.length
                }
            }, responseHandler)
            req.on('error', (e) => {
                if (error) error(e)
                console.error(`problem with request: ${e.message}`);
            });
            req.write(payload);
            req.end();
        }

        private requestAndHandleResponse(payload: any, path: string, callback?: (string: AuthResponse) => void, error?: (e: Error) => void) {
            let call = callback ? (s: string) => {
                let obj = JSON.parse(s)
                let userId = obj.user ? obj.user.id ? obj.user.id : '' : ''
                let prop = obj.user ? obj.user.properties ? obj.user.properties : {} : {}
                if (callback)
                    callback({
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
                    })
            } : undefined
            this.request(payload, path, call, error)
        }

        login(username: string, password: string, clientToken?: string | undefined, callback?: (response: AuthResponse) => void | undefined): void {
            let payload = {
                agent: 'Minecraft',
                username: username,
                password: password,
                clientToken: clientToken,
                requestUser: true
            };
            this.requestAndHandleResponse(payload, this.api.authenticate, callback)
        }

        refresh(clientToken: string, accessToken: string, profile?: string, callback?: (response: AuthResponse) => void): void {
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
            this.requestAndHandleResponse(payloadObj, this.api.refresh, callback)
        }
        validate(accessToken: string, clientToken?: string, callback?: (valid: boolean) => void): void {
            let obj = {
                accessToken: accessToken,
                clientToken: clientToken
            }
            this.request(obj, this.api.validate, (s) => {
                if (callback) callback(true)
            }, (e) => { if (callback) callback(false) })
        }
        invalide(accessToken: string, clientToken: string): void {
            this.request({ accessToken: accessToken, clientToken: clientToken }, this.api.invalidate)
        }
        signout(username: string, password: string): void {
            this.request({ username: username, password: password }, this.api.signout)
        }
    }
    export function newYggdrasilAuthService(): AuthService {
        return new Yggdrasil();
    }
}

export interface API {
    hostName: string;
    //paths
    authenticate: string;
    refresh: string;
    validate: string;
    invalidate: string;
    signout: string;
}

export const MojangAPI: API = {
    hostName: 'authserver.mojang.com',
    authenticate: '/authenticate',
    refresh: '/refresh',
    validate: "/validate",
    invalidate: '/invalidate',
    signout: '/signout',
}

import * as https from 'https';
import * as http from 'http';