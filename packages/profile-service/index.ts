import { ProfileService, setBase, GameProfile } from "./service";
import got from "got";
import { URLSearchParams } from "url";
import FormData from "form-data";
import { createVerify } from "crypto";

async function request(url: string, option: { method?: string, headers?: any, search?: Record<string, string>, formMultipart?: any; body?: any } = {}) {
    let body;
    let query;
    let json = true;
    if (option.search) {
        query = new URLSearchParams(option.search);
    }
    if (option.formMultipart) {
        body = new FormData();
        for (let [key, value] of Object.entries(option.formMultipart)) {
            if (value instanceof Uint8Array) {
                body.append(key, value, { header: { "Content-Type": "image/png" } });
            } else {
                body.append(key, value);
            }
        }
        json = false;
    }
    if (option.body) {
        body = option.body;
    }

    const { body: respBody, statusCode, statusMessage } = await got(url, {
        method: option.method,
        headers: option.headers,
        body,
        query,
        json: json as any,
        throwHttpErrors: false,
    });
    if (statusCode < 200 || statusCode >= 300) {
        throw { ...body, statusCode, statusMessage };
    }
    return {
        statusCode,
        statusMessage,
        body: respBody,
    }
}

async function verify(data: string, signature: string, pemKey: string | Uint8Array) {
    return createVerify("SHA1").update(data, "utf8").verify(pemKey, signature, "base64");
}

setBase(request, verify);

export { ProfileService, GameProfile }
export default ProfileService;
