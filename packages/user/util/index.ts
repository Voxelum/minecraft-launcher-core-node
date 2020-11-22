import { request as http, RequestOptions, ClientRequest, IncomingMessage } from "http";
import { request as https } from "https";
import { createVerify } from "crypto";
import FormData from "form-data";
import { URL } from "url";
import { HttpRequester, FormItems } from "./base";

export const httpRequester: HttpRequester = async (option) => {
    let headers: Record<string, string> = { ...option.headers };
    let requestOption: RequestOptions = {
        method: option.method,
        headers,
    }
    let url = new URL(option.url);

    let body: Buffer | undefined;
    if (option.body) {
        switch (option.bodyType) {
            case "json":
                headers["Content-Type"] = "application/json";
                body = Buffer.from(JSON.stringify(option.body), "utf-8");
                break;
            case "search":
                for (let [key, value] of Object.entries(option.body)) {
                    url.searchParams.append(key, value);
                }
                break;
            case "formMultiPart":
                let form = new FormData();
                for (let [key, value] of Object.entries(option.body as FormItems)) {
                    if (typeof value === "string") {
                        form.append(key, value);
                    } else {
                        form.append(key, value.value, { contentType: value.type });
                    }
                }
                headers = { ...headers, ...form.getHeaders() };
                body = form.getBuffer();
                break;
        }
    }
    return new Promise<{
        body: string;
        statusMessage: string;
        statusCode: number;
    }>((resolve, reject) => {
        function handleMessage(message: IncomingMessage) {
            let buffers = [] as Buffer[];
            message.on("data", (buf) => { buffers.push(buf); });
            message.on("end", () => {
                resolve({
                    body: Buffer.concat(buffers).toString("utf-8"),
                    statusCode: message.statusCode || -1,
                    statusMessage: message.statusMessage || "",
                });
            });
            message.on("error", reject);
        }
        let req: ClientRequest;
        if (url.protocol === "https:") {
            req = https(url, requestOption, handleMessage);
        } else if (url.protocol === "http:") {
            req = http(url, requestOption, handleMessage);
        } else {
            reject(new Error(`Unsupported protocol ${url.protocol}`));
            return;
        }
        req.on("error", reject);
        if (body) {
            req.write(body);
        }
        req.end();
    });
}

export async function verify(data: string, signature: string, pemKey: string | Uint8Array) {
    return createVerify("SHA1").update(data, "utf8").verify(pemKey as Buffer, signature, "base64");
}

export function decodeBase64(s: string) {
    return Buffer.from(s, "base64").toString();
}
