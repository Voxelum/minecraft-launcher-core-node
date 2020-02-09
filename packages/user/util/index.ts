import got from "got";
import { createVerify } from "crypto";
import FormData from "form-data";
import { URLSearchParams } from "url";
import { HttpRequester, FormItems } from "./base";

export const httpRequester: HttpRequester = async (option) => {
    let body;
    let search: URLSearchParams | undefined;
    let headers: Record<string, string> = {};
    if (option.body) {
        switch (option.bodyType) {
            case "json":
                headers["Content-Type"] = "application/json";
                body = JSON.stringify(option.body);
                break;
            case "search":
                search = new URLSearchParams(option.body as Record<string, string>);
                break;
            case "formMultiPart":
                body = new FormData();
                for (let [key, value] of Object.entries(option.body as FormItems)) {
                    if (typeof value === "string") {
                        body.append(key, value);
                    } else {
                        body.append(key, value.value, { contentType: value.type });
                    }
                }
                headers = { ...headers, ...body.getHeaders() };
                break;
        }
    }
    const { body: respBody, statusCode, statusMessage } = await got(option.url, {
        method: option.method as "get",
        headers,
        body: body as any,
        encoding: "utf8",
        searchParams: search,
        throwHttpErrors: false,
    });
    return {
        body: respBody,
        statusCode,
        statusMessage: statusMessage || "",
    }
}

export async function verify(data: string, signature: string, pemKey: string | Uint8Array) {
    return createVerify("SHA1").update(data, "utf8").verify(pemKey, signature, "base64");
}

export function decodeBase64(s: string) {
    return Buffer.from(s, "base64").toString();
}
