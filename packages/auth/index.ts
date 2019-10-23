import { AuthResponse, GameProfile, UserType } from "@xmcl/common";
import { fetchJson, got } from "@xmcl/net";
import { Response } from "got";
import { v4 } from "uuid";

/**
 * The interface to login/logout user
 */
export interface Auth {
    /**
     * The minecraft client token, the launcher should persist this
     */
    readonly clientToken: string;
    /**
     * The access token get from auth server, which is used with client token to auth user identity
     * The launcher should persist this
     */
    readonly accessToken: string;
    /**
     * Selected game profile. It will be one of the `GameProfile` in `profiles`
     */
    readonly selectedProfile: GameProfile;
    /**
     * All avaiable game profiles
     */
    readonly profiles: GameProfile[];
    /**
     * User unique id, not same with the id in `GameProfile`
     */
    readonly userId: string;
    /**
     * Properties of user
     */
    readonly properties: { [key: string]: string };
    /**
     * The type of the user
     */
    readonly userType: UserType;
}

export namespace Auth {
    /**
     * Random generate a new token by uuid v4. It can be client or auth token.
     * @returns a new token
     */
    export function newToken() {
        return v4().replace(/-/g, "");
    }
    /**
     * The client for Yggdrasil auth service
     */
    export interface Yggdrasil {
        login(option: { username: string; password: string; requestUser?: boolean }): Promise<AuthResponse>;
        validate(option: { accessToken: string; }): Promise<boolean>;
        invalidate(option: { accessToken: string; }): Promise<void>;
        refresh(option: { accessToken: string; profile?: string; }): Promise<Pick<AuthResponse, "accessToken" | "clientToken">>;
        signout(option: { username: string; password: string; }): Promise<void>;
    }
    export namespace Yggdrasil {
        /**
         * Create a client for `Yggdrasil` service, given API and clientToken.
         * @param clientToken The client token uuid. It will generate a new one if it's absent.
         * @param api The api for this client.
         */
        export function create(clientToken: string = newToken(), api: API = API_MOJANG): Yggdrasil {
            const client = got.extend({
                baseUrl: api.hostName,
                encoding: "UTF-8",
                json: true,
                method: "POST",
            });
            return {
                async login(option) {
                    const { body } = await client(api.authenticate, {
                        body: {
                            agent: "Minecraft",
                            requestUser: option.requestUser || true,
                            clientToken,
                            ...option,
                        },
                    });
                    return body;
                },
                async validate(option) {
                    try {
                        await client(api.validate, {
                            body: {
                                clientToken,
                                ...option,
                            },
                        });
                        return true;
                    } catch (e) {
                        return false;
                    }
                },
                async invalidate(option) {
                    await client(api.invalidate, {
                        body: {
                            clientToken,
                            ...option,
                        },
                    });
                },
                async refresh(option) {
                    const { body } = await client(api.refresh, {
                        body: {
                            clientToken,
                            ...option,
                        },
                    });
                    return body;
                },
                async signout(option) {
                    await client(api.signout, {
                        body: option,
                    });
                },
            };
        }
        export interface API {
            /**
             * The host url, like https://xxx.xxx.com
             */
            readonly hostName: string;
            /**
             * Authenticate path, in the form of `/your-endpoint`.
             * Use to login
             */
            readonly authenticate: string;
            /**
             * Use to refresh access token
             */
            readonly refresh: string;
            /**
             * Use to validate the user access token
             */
            readonly validate: string;
            /**
             * Use to logout user (invalidate user access token)
             */
            readonly invalidate: string;
            /**
             * Use to logout user (by username and password)
             */
            readonly signout: string;
        }
        /**
         * The default Mojang API
         */
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
         * @throws This may throw the error object with `statusCode`, `statusMessage`, `type` (error type), and `message`
         */
        export async function login(option: { username: string, password?: string, clientToken?: string | undefined },
            api: API = API_MOJANG): Promise<Auth> {
            try {
                const resp = await request(api.hostName, api.authenticate, {
                    agent: "Minecraft",
                    requestUser: true,
                    ...option,
                });
                return parseResponse(resp);
            } catch (e) {
                const body = e.body;
                if (body) {
                    throw { statusCode: e.statusCode, statusMessage: e.statusMessage, type: body.error, message: body.errorMessage };
                } else {
                    throw { statusCode: e.statusCode, statusMessage: e.statusMessage };
                }
            }
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
        export async function refresh(option: { clientToken: string, accessToken: string, profile?: string },
            api: API = API_MOJANG): Promise<Auth> {
            const resp = await request(api.hostName, api.refresh, {
                clientToken: option.clientToken,
                accessToken: option.accessToken,
                requestUser: true,
                selectedProfile: option.profile ? {
                    id: option.profile,
                } : undefined,
            });
            return parseResponse(resp);
        }
        /**
         * Determine whether the access/client token pair is valid.
         *
         * @param option The tokens
         * @param api The API of the auth server
         */
        export async function validate(option: { accessToken: string, clientToken?: string }, api: API = API_MOJANG): Promise<boolean> {
            try {
                const s = await request(api.hostName, api.validate, Object.assign({}, option));
                return s.body.error === undefined;
            } catch (e) {
                if (e.error === "ForbiddenOperationException") {
                    return false;
                }
                if (e.body) {
                    if (e.body.errorMessage === "Invalid token" || e.body.errorMessage === "Invalid token.") {
                        return false;
                    }
                    throw e.body;
                }
                throw e;
            }
        }

        /**
         * Invalidate an access/client token pair
         *
         * @param option The tokens
         * @param api The API of the auth server
         */
        export async function invalidate(option: { accessToken: string, clientToken: string }, api: API = API_MOJANG): Promise<void> {
            await request(api.hostName, api.invalidate, option);
            return undefined;
        }
        /**
         * Signout user by username and password
         *
         * @param option The username and password
         * @param api The API of the auth server
         */
        export async function signout(option: { username: string, password: string }, api: API = API_MOJANG): Promise<void> {
            const { body } = await request(api.hostName, api.signout, option);
            if (body.error) {
                throw { type: body.error, message: body.errorMessage };
            }
        }
    }

    /**
     * Create an offline auth. It'll ensure the user game profile's `uuid` is the same for the same `username`.
     *
     * @param username The username you want to have in-game.
     */
    export function offline(username: string): Auth {
        const v5 = (s: string) => require("uuid/lib/v35")("", 50, require("uuid/lib/sha1"))(s, new (class A extends Array { concat(o: any[]) { return o; } })(16));
        const prof = {
            id: v5(username).replace(/-/g, "") as string,
            name: username,
        };
        return {
            accessToken: newToken(),
            clientToken: newToken(),
            selectedProfile: prof,
            profiles: [prof],
            userId: newToken(),
            properties: {},
            userType: UserType.Mojang,
        };
    }
}

export default Auth;
