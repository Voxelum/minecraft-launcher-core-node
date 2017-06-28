import { GameProfile, UserType, AuthInfo } from './auth'
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
    login(username: string, password: string, clientToken?: string, callback?: (response: AuthResponse | Error) => void): void;
    refresh(clientToken: string, accessToken: string, profile: string, callback?: (response: AuthResponse | Error) => void): void;
    validate(accessToken: string, clientToken?: string, callback?: (valid: boolean) => void): void;
    invalide(accessToken: string, clientToken: string): void;
    signout(username: string, password: string): void;
}

export namespace AuthService {
    export interface API {
        hostName: string;
        //paths
        authenticate: string;
        refresh: string;
        validate: string;
        invalidate: string;
        signout: string;
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
        private request(payload: any, path: string, callback?: (string: string) => void, error?: (e: Error) => void) {
            payload = JSON.stringify(payload)
            let responseHandler = callback ? (response: http.IncomingMessage) => {
                let buffer = ''
                response.setEncoding('utf8');
                response.on('data', (chunk) => {
                    if (typeof (chunk) === 'string') buffer += chunk
                })
                response.on('end', () => { callback(buffer) });
            } : undefined
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
                if (error) error(e)
                console.error(`problem with request: ${e.message}`);
            });
            req.write(payload);
            req.end();
        }

        private requestAndHandleResponse(payload: any, path: string, callback?: (respon: AuthResponse) => void, error?: (e: Error) => void) {
            let call = callback ? (s: string) => {
                let obj = JSON.parse(s)
                if (obj.error) {
                    if (error) error(new Error(obj.errorMessage))
                    return
                }

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

        login(username: string, password: string, clientToken?: string | undefined, callback?: (response: AuthResponse | Error) => void | undefined): void {
            let payload = {
                agent: 'Minecraft',
                username: username,
                password: password,
                clientToken: clientToken,
                requestUser: true
            };
            this.requestAndHandleResponse(payload, this.api.authenticate, callback, callback)
        }

        refresh(clientToken: string, accessToken: string, profile?: string, callback?: (response: AuthResponse | Error) => void): void {
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
            this.requestAndHandleResponse(payloadObj, this.api.refresh, callback, callback)
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
    export function newYggdrasilAuthService(api?: API): AuthService {
        if (api)
            return new Yggdrasil(api)
        return new Yggdrasil(mojangAPI())
    }
}
