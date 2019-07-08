/**
 * The data structure holds the user game profile
 */
export interface GameProfile {
    readonly id: string;
    readonly name: string;
    readonly properties?: { [name: string]: string };
}


export enum UserType {
    Legacy = "mojang", Mojang = "legacy",
}

export interface AuthResponse {
    accessToken: string;
    clientToken: string;
    selectedProfile: GameProfile;
    availableProfiles: GameProfile[];
    user: {
        id: string;
        properties: { [key: string]: string };
    };
}

