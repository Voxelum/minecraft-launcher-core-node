import { v3, v4 } from "uuid";
import { GameProfile } from "./base";
import { httpRequester as request } from "./util";

type LoginWithUser = { username: string; password: string; requestUser: true }
    | { username: string; password: string; };
type LoginWithoutUser = { username: string; password: string; requestUser: false }
type LoginOption = LoginWithUser | LoginWithoutUser

const loginPayload = (clientToken: string, option: LoginOption) => ({
    agent: { name: "Minecraft", version: 1 },
    requestUser: "requestUser" in option ? option.requestUser : true,
    clientToken,
    username: option.username,
    password: option.password,
})
const refreshPayload = (clientToken: string, option: { accessToken: string; requestUser?: boolean }) => ({
    clientToken,
    accessToken: option.accessToken,
    requestUser: typeof option.requestUser === "boolean" ? option.requestUser : false,
});

/**
 * The auth response format.
 *
 * Please refer https://wiki.vg/Authentication
 */
export interface Authentication {
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
    user?: {
        id: string;
        username: string;
        email?: string;
        registerIp?: string;
        migratedFrom?: string;
        migratedAt?: number;
        registeredAt?: number;
        passwordChangedAt?: number;
        dateOfBirth?: number;
        suspended?: boolean;
        blocked?: boolean;
        secured?: boolean;
        migrated?: boolean;
        emailVerified?: boolean;
        legacyUser?: boolean;
        verifiedByParent?: boolean;
        properties?: object[];
    };
}
/**
 * Random generate a new token by uuid v4. It can be client or auth token.
 * @returns a new token
 */
export function newToken() {
    return v4().replace(/-/g, "");
}

export interface AuthException {
    error:
    "Method Not Allowed" |
    "Not Not Found" |
    "ForbiddenOperationException" |
    "IllegalArgumentException" |
    "Unsupported Media Type";
    errorMessage: string;
}

export class Authenticator {
    /**
     * Create a client for `Yggdrasil` service, given API and clientToken.
     * @param clientToken The client token uuid. It will generate a new one if it's absent.
     * @param api The api for this client.
     */
    constructor(readonly clientToken: string, readonly api: YggdrasilAuthAPI) { }

    protected post(endpoint: string, payload: object) {
        return post(this.api.hostName + endpoint, payload);
    }

    /**
     * Login to the server by username and password. Notice that the auth server usually have the cooldown time for login.
     * You have to wait for about a minute after one approch of login, to login again.
     *
     * @param option The login options, contains the username, password
     * @throws This may throw the error object with `statusCode`, `statusMessage`, `type` (error type), and `message`
     */
    login(option: LoginOption): Promise<Authentication> {
        return this.post(this.api.authenticate,
            loginPayload(this.clientToken, option)) as Promise<Authentication>;
    }
    /**
     * Determine whether the access/client token pair is valid.
     *
     * @param option The access token
     */
    validate(option: { accessToken: string; }): Promise<boolean> {
        return this.post(this.api.validate, {
            clientToken: this.clientToken,
            accessToken: option.accessToken,
        }).then(() => true, () => false);
    }
    /**
     * Invalidate an access token and client token
     *
     * @param option The tokens
     */
    invalidate(option: { accessToken: string; }): Promise<void> {
        return this.post(this.api.invalidate, {
            clientToken: this.clientToken,
            accessToken: option.accessToken,
        }).then(() => { });
    }
    /**
     * Refresh the current access token with specific client token.
     * Notice that the client token and access token must match.
     *
     * You can use this function to get a new token when your old token is expired.
     *
     * @param option The access token
     */
    refresh(option: { accessToken: string; requestUser?: boolean; }): Promise<Pick<Authentication, "accessToken" | "clientToken">> {
        return this.post(this.api.refresh, refreshPayload(this.clientToken, option)) as Promise<Authentication>;
    }
    signout(option: { username: string; password: string; }): Promise<void> {
        return this.post(this.api.signout, {
            username: option.username,
            password: option.password,
        }).then(() => { });
    }
}

export interface YggdrasilAuthAPI {
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
export const AUTH_API_MOJANG: YggdrasilAuthAPI = {
    hostName: "https://authserver.mojang.com",
    authenticate: "/authenticate",
    refresh: "/refresh",
    validate: "/validate",
    invalidate: "/invalidate",
    signout: "/signout",
};

function post(url: string, payload: object): Promise<object | undefined> {
    return request({
        url,
        method: "POST",
        body: payload,
        headers: {},
        bodyType: "json",
    }).then(({ statusCode, body, statusMessage }) => {
        try {
            if (statusCode >= 200 && statusCode < 300) {
                if (!body) { return undefined; }
                return JSON.parse(body);
            } else {
                const errorBody = JSON.parse(body);
                const err = {
                    ...errorBody,
                    error: typeof errorBody.error === "string" ? errorBody.error : "General",
                    statusCode,
                    statusMessage,
                };
                throw err;
            }
        } catch (e) {
            if (typeof (e as any).error === "string") {
                throw e;
            }
            throw {
                error: "General",
                statusCode,
                statusMessage,
                body,
            }
        }
    });
}

/**
 * Login to the server by username and password. Notice that the auth server usually have the cooldown time for login.
 * You have to wait for about a minute after one approch of login, to login again.
 *
 * @param option The login options, contains the username, password and clientToken
 * @param api The API of the auth server
 * @throws This may throw the error object with `statusCode`, `statusMessage`, `type` (error type), and `message`
 */
export async function login(option: LoginOption & { clientToken?: string }, api: YggdrasilAuthAPI = AUTH_API_MOJANG): Promise<Authentication> {
    return post(api.hostName + api.authenticate, loginPayload(option.clientToken || newToken(), option)) as Promise<Authentication>;
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
export function refresh(option: { clientToken: string, accessToken: string, requestUser?: boolean }, api: YggdrasilAuthAPI = AUTH_API_MOJANG): Promise<Pick<Authentication, "accessToken" | "clientToken">> {
    return post(api.hostName + api.refresh, refreshPayload(option.clientToken, option)) as Promise<Authentication>;
}
/**
 * Determine whether the access/client token pair is valid.
 *
 * @param option The tokens
 * @param api The API of the auth server
 */
export async function validate(option: { accessToken: string, clientToken?: string }, api: YggdrasilAuthAPI = AUTH_API_MOJANG): Promise<boolean> {
    try {
        await post(api.hostName + api.validate, {
            accessToken: option.accessToken,
            clientToken: option.clientToken,
        });
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
export async function invalidate(option: { accessToken: string, clientToken: string }, api: YggdrasilAuthAPI = AUTH_API_MOJANG): Promise<void> {
    await post(api.hostName + api.invalidate, {
        accessToken: option.accessToken,
        clientToken: option.clientToken,
    });
}
/**
 * Signout user by username and password
 *
 * @param option The username and password
 * @param api The API of the auth server
 */
export async function signout(option: { username: string, password: string }, api: YggdrasilAuthAPI = AUTH_API_MOJANG): Promise<void> {
    await post(api.hostName + api.signout, {
        username: option.username,
        password: option.password,
    });
}

/**
 * Create an offline auth. It'll ensure the user game profile's `uuid` is the same for the same `username`.
 *
 * @param username The username you want to have in-game.
 */
export function offline(username: string, uuid?: string): Authentication {
    const id = (uuid || v3(username, "00000000-0000-0000-0000-000000000000")).replace(/-/g, '')
    const prof = {
        id: id,
        name: username,
    };
    return {
        accessToken: newToken(),
        clientToken: newToken(),
        selectedProfile: prof,
        availableProfiles: [prof],
        user: {
            id,
            username: username,
        },
    };
}

