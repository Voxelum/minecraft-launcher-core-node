import { v4 } from "uuid";
import { GameProfile } from "./profile";

import { Response } from "got";
import { fetchJson } from "./utils/network";

export enum UserType {
    Legacy = "mojang", Mojang = "legacy",
}

export namespace UserType {
    export function toString(type: UserType): string {
        return type;
    }
}

export interface Auth {
    readonly clientToken: string;
    readonly accessToken: string;
    readonly selectedProfile: GameProfile;
    readonly profiles: GameProfile[];
    readonly userId: string;
    readonly properties: { [key: string]: string };
    readonly userType: UserType;
}

export namespace Auth {
    // this module migrates from jmccc: https://github.com/to2mbn/JMCCC/tree/master/jmccc-yggdrasil-authenticator
    // @author huangyuhui
    export namespace Yggdrasil {
        export interface API {
            readonly hostName: string;
            // paths
            readonly authenticate: string;
            readonly refresh: string;
            readonly validate: string;
            readonly invalidate: string;
            readonly signout: string;
        }
        export const API_MOJANG: API = {
            hostName: "https://authserver.mojang.com",
            authenticate: "/authenticate",
            refresh: "/refresh",
            validate: "/validate",
            invalidate: "/invalidate",
            signout: "/signout",
        };

        function request(baseUrl: string, path: string, payload: object) {
            return fetchJson(path, {
                baseUrl,
                method: "POST",
                body: payload,
                encoding: "utf-8",
            });
        }

        function parseResponse(resp: Response<any>) {
            const { body } = resp;
            if (body.error) {
                throw { type: body.error, message: body.errorMessage };
            }
            const userId = body.user ? body.user.id ? body.user.id : "" : "";
            const prop = body.user ? body.user.properties ? body.user.properties : {} : {};
            return {
                accessToken: body.accessToken as string,
                clientToken: body.clientToken as string,
                selectedProfile: body.selectedProfile as GameProfile,
                profiles: body.availableProfiles as GameProfile[],
                userId,
                properties: prop,
                userType: UserType.Mojang,
            };
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
            return fetchJson(api.authenticate, {
                baseUrl: api.hostName,
                method: "POST",
                body: {
                    agent: "Minecraft",
                    requestUser: true,
                    ...option,
                },
            }).then(parseResponse, (resp) => {
                const body = resp.body;
                if (body) {
                    throw { statusCode: resp.statusCode, statusMessage: resp.statusMessage, type: body.error, message: body.errorMessage };
                } else {
                    throw { statusCode: resp.statusCode, statusMessage: resp.statusMessage };
                }
            });
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
            return request(api.hostName, api.refresh, {
                clientToken: option.clientToken,
                accessToken: option.accessToken,
                requestUser: true,
                selectedProfile: option.profile ? {
                    id: option.profile,
                } : undefined,
            }).then(parseResponse);
        }
        /**
         * Determine whether the access/client token pair is valid.
         *
         * @param option The tokens
         * @param api The API of the auth server
         */
        export function validate(option: { accessToken: string, clientToken?: string }, api: API = API_MOJANG): Promise<boolean> {
            return request(api.hostName, api.validate, Object.assign({}, option))
                .then((s) => s.body.error === undefined, (error) => {
                    if (error.body) {
                        if (error.body.errorMessage === "Invalid token.") {
                            return false;
                        }
                        throw error.body;
                    }
                    throw error;
                });
        }
        /**
         * Invalidate an access/client token pair
         *
         * @deprecated
         * @param option The tokens
         * @param api The API of the auth server
         */
        export const invalide = invalidate;

        /**
         * Invalidate an access/client token pair
         *
         * @param option The tokens
         * @param api The API of the auth server
         */
        export function invalidate(option: { accessToken: string, clientToken: string }, api: API = API_MOJANG): Promise<void> {
            return request(api.hostName, api.invalidate, option).then(() => undefined);
        }
        /**
         * Signout user by username and password
         *
         * @param option The username and password
         * @param api The API of the auth server
         */
        export function signout(option: { username: string, password: string }, api: API = API_MOJANG): Promise<void> {
            return request(api.hostName, api.signout, option).then(() => undefined);
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
                name: username,
            },
            profiles: [],
            userId: username,
            properties: {},
            userType: UserType.Mojang,
        };
    }
}

