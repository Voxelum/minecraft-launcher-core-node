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
export interface ItemBlob {
    type: string;
    value: Uint8Array;
}
export interface FormItems {
    [name: string]: ItemBlob | string;
}
