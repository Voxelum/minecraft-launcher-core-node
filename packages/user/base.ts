/**
 * The game profile of the user.
 *
 * In auth response, it will usually carry the `userId`, `createdAt` properties.
 *
 * In `lookup` function, it will carry the `properties` property.
 */
export interface GameProfile {
    /**
     * game profile unique id
     */
    id: string;
    /**
     * This is in game displayed name
     */
    name: string;
    properties?: { [name: string]: string };
    userId?: string;
    createdAt?: number;
    legacyProfile?: boolean;
    suspended?: boolean;
    paid?: boolean;
    migrated?: boolean;
    legacy?: boolean;
}

export interface GameProfileWithProperties extends GameProfile {
    properties: { [name: string]: string };
}

export namespace GameProfile {

    export interface TexturesInfo {
        /**
         * java time in ms
         */
        timestamp: number;
        /**
         * player name
         */
        profileName: string;
        /**
         * player id
         */
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

/**
 * Abstract layer for http requester.
 */
export type HttpRequester =
    (option: {
        url: string;
        method: string;
        headers: { [key: string]: string };
        /**
         * Search string
         */
        search?: { [key: string]: string | string[] | undefined };
        /**
         * Either form multi part or json. Default is json.
         */
        bodyType?: "formMultiPart" | "json" | "search";
        body?: FormItems | object | Record<string, string>;
    }) => Promise<{
        body: string;
        statusMessage: string;
        statusCode: number;
    }>;

export type Verify = (value: string, signature: string, pemKey: string) => Promise<boolean>;

export interface ItemBlob {
    type: string;
    value: Uint8Array;
}

export interface FormItems {
    [name: string]: ItemBlob | string;
}
