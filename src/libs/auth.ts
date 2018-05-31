import { v4 } from 'uuid'
import { GameProfile } from './profile'

import * as https from 'https';
import * as http from 'http';

export enum UserType {
    Legacy = 'mojang', Mojang = 'legacy'
}

export namespace UserType {
    export function toString(type: UserType): string {
        if (type = UserType.Mojang)
            return 'mojang';
        else return 'legacy';
    }
}

export interface Auth {
    readonly clientToken: string
    readonly accessToken: string
    readonly selectedProfile: GameProfile
    readonly profiles: GameProfile[]
    readonly userId: string
    readonly properties: { [key: string]: string }
    readonly userType: UserType
}

export namespace Auth {
    //this module migrates from jmccc: https://github.com/to2mbn/JMCCC/tree/master/jmccc-yggdrasil-authenticator
    //@author huangyuhui
    export namespace Yggdrasil {
        export interface API {
            readonly hostName: string;
            //paths
            readonly authenticate: string;
            readonly refresh: string;
            readonly validate: string;
            readonly invalidate: string;
            readonly signout: string;
        }
        export const API_MOJANG: API = {
            hostName: 'authserver.mojang.com',
            authenticate: '/authenticate',
            refresh: '/refresh',
            validate: "/validate",
            invalidate: '/invalidate',
            signout: '/signout',
        }

        function request(api: API, payload: any, path: string): Promise<string> {
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
                    hostname: api.hostName,
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

        function requestAndHandleResponse(api: API, payload: any, path: string): Promise<Auth> {
            return request(api, payload, path).then(s => {
                let obj = JSON.parse(s)
                if (obj.error) {
                    throw { type: obj.error, message: obj.errorMessage };
                }
                let userId = obj.user ? obj.user.id ? obj.user.id : '' : ''
                let prop = obj.user ? obj.user.properties ? obj.user.properties : {} : {}
                return {
                    accessToken: <string>obj.accessToken,
                    clientToken: <string>obj.clientToken,
                    selectedProfile: <GameProfile>obj.selectedProfile,
                    profiles: <GameProfile[]>obj.availableProfiles,
                    userId: userId,
                    properties: prop,
                    userType: UserType.Mojang
                }
            })
        }

        /**
         * Login to the server by username and password. Notice that the auth server usually have the cooldown time for login. 
         * You have to wait for about a minute after one approch of login, to login again.
         * 
         * @param option The login options, contains the username, password and clientToken
         * @param api The API of the auth server
         */
        export function login(option: { username: string, password?: string, clientToken?: string | undefined },
            api: API = API_MOJANG): Promise<Auth> {
            return requestAndHandleResponse(api, Object.assign({
                agent: 'Minecraft',
                requestUser: true
            }, option), api.authenticate)
        }

        /**
         * Refresh the current access token with specific client token.
         * Notice that the client token and access token must match. 
         * 
         * You can use this function to get a new token when your old token is expired.
         * 
         * @param option The tokens 
         * @param api The API of the auth server
         */
        export function refresh(option: { clientToken: string, accessToken: string, profile?: string },
            api: API = API_MOJANG): Promise<Auth> {
            let payloadObj: any = {
                // agent: 'Minecraft',
                clientToken: option.clientToken,
                accessToken: option.accessToken,
                requestUser: true
            }
            if (option.profile)
                payloadObj.selectedProfile = {
                    id: option.profile
                }
            return requestAndHandleResponse(api, payloadObj, api.refresh)
        }
        /**
         * Determine whether the access/client token pair is valid. 
         * 
         * @param option The tokens
         * @param api The API of the auth server
         */
        export function validate(option: { accessToken: string, clientToken?: string }, api: API = API_MOJANG): Promise<boolean> {
            return request(api, Object.assign({}, option), api.validate)
                .then(s => s === '' || JSON.parse(s).error === undefined, fail => false)
        }
        /**
         * Invalidate an access/client token pair 
         * 
         * @param option The tokens
         * @param api The API of the auth server
         */
        export function invalide(option: { accessToken: string, clientToken: string }, api: API = API_MOJANG): void {
            request(api, option, api.invalidate)
        }
        /**
         * Signout user by username and password
         *  
         * @param option The username and password
         * @param api The API of the auth server
         */
        export function signout(option: { username: string, password: string }, api: API = API_MOJANG): void {
            request(api, option, api.signout)
        }
    }

    /**
     * Create an offline auth.
     * 
     * @param username The username you want to have in-game.
     */
    export function offline(username: string): Auth {
        return {
            accessToken: v4(),
            clientToken: v4(),
            selectedProfile: {
                id: v4(),
                name: username
            },
            profiles: [],
            userId: username,
            properties: {},
            userType: UserType.Mojang
        }
    }
}

