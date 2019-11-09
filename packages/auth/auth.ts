import { v4 } from "uuid";

export interface GameProfile {
    id: string;
    name: string;
    userId?: string;
    createdAt?: number;
    legacyProfile?: boolean;
    suspended?: boolean;
    paid?: boolean;
    migrated?: boolean;
    legacy?: boolean;
}

let requester: PostRequester & {
    extends(option: { baseUrl: string }): PostRequester;
};

export function setRequester(req: typeof requester) {
    requester = req;
}

interface PostRequester {
    (apiPath: string, body: object): Promise<{ body: any; statusCode: number; statusMessage: number }>
}

type LoginWithUser = { username: string; password: string; requestUser: true }
    | { username: string; password: string; };
type LoginWithoutUser = { username: string; password: string; requestUser: false }
type LoginOption = LoginWithUser | LoginWithoutUser

function wrap(req: PostRequester) {
    return async function (url: string, payload: object) {
        const { body, statusCode, statusMessage } = await req(url, payload);
        if (statusCode < 200 || statusCode >= 300) {
            throw { statusCode, statusMessage, ...body };
        }
        return body;
    }
}

const loginPayload = (clientToken: string, option: LoginOption) => ({
    agent: { name: "Minecraft", version: 1 },
    requestUser: "requestUser" in option ? option.requestUser : true,
    clientToken,
    username: option.username,
    password: option.password,
})
const refreshPayload = (option: { accessToken: string; clientToken: string; requestUser?: boolean }) => ({
    clientToken: option.clientToken,
    accessToken: option.accessToken,
    requestUser: option.requestUser || false,
});

export namespace Auth {

    /**
     * The auth response format.
     *
     * Please refer https://wiki.vg/Authentication
     */
    export interface Response {
        /**
         * hexadecimal or JSON-Web-Token (unconfirmed) [The normal accessToken can be found in the payload of the JWT (second by '.' separated part as Base64 encoded JSON object), in key "yggt"]
         */
        accessToken: string;
        /**
         * identical to the one received
         */
        clientToken: string;
        /**
         * only present if the agent field was received
         */
        availableProfiles: GameProfile[];
        /**
         * only present if the agent field was received
         */
        selectedProfile: GameProfile;
        /**
         * only present if requestUser was true in the request payload
         */
        user: {
            id: string;
            email: string;
            username: string;
            registerIp: string;
            migratedFrom: string;
            migratedAt: number;
            registeredAt: number;
            passwordChangedAt: number;
            dateOfBirth: number;
            suspended: boolean;
            blocked: boolean;
            secured: boolean;
            migrated: boolean;
            emailVerified: boolean;
            legacyUser: boolean;
            verifiedByParent: boolean;
            properties: object[];
        };
    }
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
        login(option: LoginWithoutUser): Promise<Omit<Auth.Response, "user">>;
        login(option: LoginOption): Promise<Auth.Response>;
        validate(option: { accessToken: string; }): Promise<boolean>;
        invalidate(option: { accessToken: string; }): Promise<void>;
        refresh(option: { accessToken: string; profile?: string; }): Promise<Pick<Auth.Response, "accessToken" | "clientToken">>;
        signout(option: { username: string; password: string; }): Promise<void>;
    }

    export namespace Yggdrasil {
        /**
         * Create a client for `Yggdrasil` service, given API and clientToken.
         * @param clientToken The client token uuid. It will generate a new one if it's absent.
         * @param api The api for this client.
         */
        export function create(clientToken: string = newToken(), api: API = API_MOJANG): Yggdrasil {
            const fetch = wrap(requester.extends({
                baseUrl: api.hostName,
            }));
            return {
                login(option: LoginOption) {
                    return fetch(api.authenticate, loginPayload(clientToken, option));
                },
                async validate(option) {
                    try {
                        await fetch(api.validate, {
                            clientToken,
                            ...option,
                        });
                        return true;
                    } catch (e) {
                        return false;
                    }
                },
                async invalidate(option) {
                    await fetch(api.invalidate, {
                        clientToken,
                        ...option,
                    });
                },
                refresh(option) {
                    return fetch(api.refresh, refreshPayload({
                        clientToken,
                        ...option,
                    }));
                },
                async signout(option) {
                    await fetch(api.signout, option);
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

        const fetch = wrap(requester);

        /**
         * Login to the server by username and password. Notice that the auth server usually have the cooldown time for login.
         * You have to wait for about a minute after one approch of login, to login again.
         *
         * @param option The login options, contains the username, password and clientToken
         * @param api The API of the auth server
         * @throws This may throw the error object with `statusCode`, `statusMessage`, `type` (error type), and `message`
         */
        export async function login(option: LoginOption & { clientToken?: string }, api: API = API_MOJANG): Promise<Auth.Response> {
            return fetch(api.hostName + api.authenticate, loginPayload(option.clientToken || newToken(), option));
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
        export function refresh(option: { clientToken: string, accessToken: string, requestUser?: boolean }, api: API = API_MOJANG): Promise<Auth.Response> {
            return fetch(api.hostName + api.refresh, refreshPayload(option));
        }
        /**
         * Determine whether the access/client token pair is valid.
         *
         * @param option The tokens
         * @param api The API of the auth server
         */
        export async function validate(option: { accessToken: string, clientToken?: string }, api: API = API_MOJANG): Promise<boolean> {
            try {
                await fetch(api.hostName + api.validate, { ...option });
                return true;
            }
            catch (e) {
                return false;
            }
        }

        /**
         * Invalidate an access/client token pair
         *
         * @param option The tokens
         * @param api The API of the auth server
         */
        export async function invalidate(option: { accessToken: string, clientToken: string }, api: API = API_MOJANG): Promise<void> {
            await fetch(api.hostName + api.invalidate, option);
        }
        /**
         * Signout user by username and password
         *
         * @param option The username and password
         * @param api The API of the auth server
         */
        export async function signout(option: { username: string, password: string }, api: API = API_MOJANG): Promise<void> {
            await fetch(api.hostName + api.signout, option);
        }
    }

    /**
     * Create an offline auth. It'll ensure the user game profile's `uuid` is the same for the same `username`.
     *
     * @param username The username you want to have in-game.
     */
    export function offline(username: string): Omit<Auth.Response, "user"> & { user: { id: string } } {
        const v5 = (s: string) => require("uuid/lib/v35")("", 50, require("uuid/lib/sha1"))(s, new (class A extends Array { concat(o: any[]) { return o; } })(16));
        const prof = {
            id: v5(username).replace(/-/g, "") as string,
            name: username,
        };
        return {
            accessToken: newToken(),
            clientToken: newToken(),
            selectedProfile: prof,
            availableProfiles: [prof],
            user: {
                id: newToken(),
            },
        };
    }
}

export default Auth;
