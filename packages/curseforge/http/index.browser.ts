import { HttpRequester } from "./base";

export const httpRequester: HttpRequester = async (option) => {
    const url = new URL(option.url);
    let body: any = undefined;
    let headers: { [key: string]: string } = option.headers;
    if (option.body) {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(option.body);
    }
    const response = await fetch(url.toString(), {
        body,
        headers,
        method: option.method,
    });
    return {
        body: await response.text(),
        statusCode: response.status,
        statusMessage: response.statusText,
    };
}
