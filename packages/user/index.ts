import got from "got";
import { createVerify } from "crypto";
import FormData from "form-data";
import { setKernal, FormItems } from "./base";

setKernal({
    httpRequester(option) {
        let body;
        let query;
        let json = true;
        let headers: Record<string, string> = {};
        if (option.body) {
            switch (option.bodyType) {
                case "json":
                    headers["Content-Type"] = "application/json";
                    body = option.body;
                    json = true;
                    break;
                case "search":
                    query = new URLSearchParams(option.body as Record<string, string>);
                    json = false;
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
                    json = false;
                    headers = { ...headers, ...body.getHeaders() };
                    break;
            }
        }
        return got(option.url, {
            method: option.method,
            json: json as any,
            headers,
            body: body as any,
            query,
            encoding: "utf-8",
            throwHttpErrors: false,
        });
    },
    async verify(data: string, signature: string, pemKey: string | Uint8Array) {
        return createVerify("SHA1").update(data, "utf8").verify(pemKey, signature, "base64");
    }
});

export * from "./auth";
export * from "./service";
export { GameProfile, GameProfileWithProperties } from "./base";
