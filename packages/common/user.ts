/**
 * The data structure holds the user game profile
 */
export interface GameProfile {
    readonly id: string;
    readonly name: string;
    readonly properties?: { [name: string]: string };
}

export namespace GameProfile {
    export interface TexturesInfo {
        timestamp: number;
        profileName: string;
        profileId: string;
        textures: {
            SKIN?: Texture,
            CAPE?: Texture,
            ELYTRA?: Texture,
        };
    }
    /**
     * The data structure that hold the texture
     */
    export interface Texture {
        url: string;
        metadata?: { model?: "slim" | "steve", [key: string]: any };
    }

    export namespace Texture {
        export function isSlim(o: Texture) {
            return o.metadata ? o.metadata.model === "slim" : false;
        }

        export function getModelType(o: Texture) {
            return isSlim(o) ? "slim" : "steve";
        }
    }
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

