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

export interface AuthInfo {
    readonly profile: GameProfile,
    readonly accessToken: string,
    readonly properties: { [key: string]: string },
    readonly userType: UserType
}

export interface GameProfile {
    readonly uuid: string,
    readonly name: string
}

export interface Authorizer {
    username: string,
    password?: string,
    clientToken?: string,
    accessToken?: string
    auth(): AuthInfo
}

export namespace Authorizer {
    export function offline(): Authorizer {
        return new OfflineAuthorizer()
    }

    export function offlineAuth(username: string): AuthInfo {
        let auth = new OfflineAuthorizer()
        auth.username = username
        return auth.auth()
    }
}

class OfflineAuthorizer implements Authorizer {
    private account: string;

    set username(account: string) {
        this.account = account;
    }
    get username() { return this.account; }

    set password(password: string) {
        throw new Error("Offline doesn't have password!");
    }

    public clientToken: string;
    public accessToken: string;

    auth(): AuthInfo {
        const id = v4();
        return {
            profile: {
                name: this.account,
                uuid: id
            },
            accessToken: id, properties: {},
            userType: UserType.Mojang
        };
    }
}
