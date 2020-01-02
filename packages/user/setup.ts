import got from "got";
import { createVerify } from "crypto";
import FormData from "form-data";
import { setKernal, FormItems } from "./base";

setKernal({
    async httpRequester(option) {
        let body;
        let query;
        let headers: Record<string, string> = {};
        if (option.body) {
            switch (option.bodyType) {
                case "json":
                    headers["Content-Type"] = "application/json";
                    body = JSON.stringify(option.body);
                    break;
                case "search":
                    query = new URLSearchParams(option.body as Record<string, string>);
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
            method: option.method,
            headers,
            body: body as any,
            query,
            encoding: "utf-8",
            throwHttpErrors: false,
        });
        return {
            body: respBody,
            statusCode,
            statusMessage
        }
    },
    async verify(data: string, signature: string, pemKey: string | Uint8Array) {
        return createVerify("SHA1").update(data, "utf8").verify(pemKey, signature, "base64");
    },
    decodeBase64(s) {
        return Buffer.from(s, "base64").toString();
    }
});
