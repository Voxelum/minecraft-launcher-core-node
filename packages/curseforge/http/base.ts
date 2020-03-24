import { Agent } from "https";

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
        body?: object;
        userAgent?: Agent;
    }) => Promise<{
        body: string;
        statusMessage: string;
        statusCode: number;
    }>;
