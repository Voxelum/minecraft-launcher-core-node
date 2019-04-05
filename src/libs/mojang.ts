import * as https from "https";
import * as url from "url";
import { DownloadService } from "./services";


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

export namespace MojangService {
    export interface Provider {
        readonly apiStatus: string;
        readonly userInfo: string;
        readonly blockedServers: string;
        readonly salesStatistics: string;
        nameHistory(uuid: string): string;
    }
    const defaultProvider: Provider = {
        apiStatus: "https://status.mojang.com/check",
        blockedServers: "https://sessionserver.mojang.com/blockedservers",
        nameHistory: (uuid) => `https://api.mojang.com/user/profiles/${uuid}/names`,
        salesStatistics: "https://api.mojang.com/orders/statistics",
        userInfo: "https://api.mojang.com/user",
    };

    export enum Status {
        GREEN, YELLOW, RED,
    }
    /**
     * Get the all mojang server statuses
     *
     * @param provider
     */
    export function getServiceStatus(provider: Provider = defaultProvider): Promise<Array<{ [server: string]: Status }>> {
        const service = DownloadService.get();
        return service.download(provider.apiStatus)
            .then((b) => JSON.parse((b as Buffer).toString()))
            .then((arr) => arr.reduce((a: any, b: any) => Object.assign(a, b), {}));
    }
    /**
     * Get Mojang account information by user access token, which is given by the mojang ygg auth.
     *
     * @param accessToken The user access token
     * @param provider
     */
    export function getAccountInfo(accessToken: string, provider: Provider = defaultProvider): Promise<MojangAccount> {
        return new Promise((resolve, reject) => {
            const userInfUrl = url.parse(provider.userInfo);
            const req = https.get({
                headers: { Authorization: `Bearer: ${accessToken}` },
                host: userInfUrl.host, path: userInfUrl.path,
            }, (res) => {
                let data = "";
                res.on("data", (d) => { data += d.toString(); });
                res.on("end", () => { resolve(JSON.parse(data)); });
                res.on("error", (e) => { reject(e); });
            });
            req.on("error", (e) => { reject(e); });
            req.end();
        }).then((obj) => {
            if ((obj as any).error) {
                throw obj;
            } else {
                return (obj as MojangAccount);
            }
        });
    }
}

export default MojangService;
