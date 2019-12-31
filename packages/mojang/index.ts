import { Response, extend } from "got";

const fetchJson = extend({ json: true });

export interface MojangAccount {
    readonly id: string;
    readonly email: string;
    readonly username: string;
    readonly registerIp: string;
    readonly registeredAt: Long;
    readonly passwordChangedAt: Long;
    readonly dateOfBirth: Long;
    readonly deleted: boolean;
    readonly blocked: boolean;
    readonly secured: boolean;
    readonly migrated: boolean;
    readonly emailVerified: boolean;
    readonly legacyUser: boolean;
    readonly verifiedByParent: boolean;
    readonly fullName: string;
    readonly fromMigratedUser: boolean;
    readonly hashed: boolean;
}

export interface MojangChallenge {
    readonly answer: { id: number };
    readonly question: { id: number; question: string; };
}

export interface MojangChallengeResponse {
    id: number;
    answer: string;
}

export namespace MojangService {
    const defaultProvider = {
        apiStatus: "https://status.mojang.com/check",
        blockedServers: "https://sessionserver.mojang.com/blockedservers",
        nameHistory: (uuid: string) => `https://api.mojang.com/user/profiles/${uuid}/names`,
        salesStatistics: "https://api.mojang.com/orders/statistics",
        userInfo: "https://api.mojang.com/user",
        userChallenges: "https://api.mojang.com/user/security/challenges",
        userLocation: "https://api.mojang.com/user/security/location",
    };

    export enum Status {
        GREEN, YELLOW, RED,
    }
    /**
     * Get the all mojang server statuses
     *
     * @param provider
     */
    export function getServiceStatus(): Promise<{ [server: string]: Status }> {
        return fetchJson("https://status.mojang.com/check", { json: true }).then((resp) => resp.body.reduce((a: any, b: any) => Object.assign(a, b), {}));
    }
    export async function checkLocation(accessToken: string): Promise<boolean> {
        // "ForbiddenOperationException";
        // "Current IP is not secured";
        try {
            const { statusCode } = await fetchJson("/user/security/location", {
                baseUrl: "https://api.mojang.com",
                method: "GET",
                headers: { Authorization: `Bearer: ${accessToken}` },
            });
            return statusCode === 204;
        } catch (e) {
            throw { statusCode: e.statusCode, statusMessage: e.statusMessage, ...e.body };
        }
    }
    export async function getChallenges(accessToken: string): Promise<MojangChallenge[]> {
        return fetchJson("/user/security/challenges", {
            baseUrl: "https://api.mojang.com",
            method: "GET",
            headers: { Authorization: `Bearer: ${accessToken}` },
        }).then((resp) => resp.body as MojangChallenge[])
            .catch((resp) => { throw { statusCode: resp.statusCode, statusMessage: resp.statusMessage, ...resp.body }; });
    }
    export async function responseChallenges(accessToken: string, responses: MojangChallengeResponse[]): Promise<Response<any>> {
        return fetchJson("/user/security/location", {
            baseUrl: "https://api.mojang.com",
            method: "POST",
            body: responses,
            headers: { Authorization: `Bearer: ${accessToken}` },
        }).catch((resp) => { throw { statusCode: resp.statusCode, statusMessage: resp.statusMessage, ...resp.body }; });
    }
    /**
     * Get Mojang account information by user access token, which is given by the mojang ygg auth.
     *
     * @param accessToken The user access token
     */
    export async function getAccountInfo(accessToken: string): Promise<MojangAccount> {
        return fetchJson("/user", {
            baseUrl: "https://api.mojang.com",
            headers: { Authorization: `Bearer: ${accessToken}` },
        }).then((resp) => {
            return resp.body;
        }).catch((e) => {
            throw { statusCode: e.statusCode, statusMessage: e.statusMessage, ...e.body };
        });
    }
}

export default MojangService;
