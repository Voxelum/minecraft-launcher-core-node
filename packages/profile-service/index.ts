import { ProfileService, setBase } from "./service";
import got from "got";
import { URLSearchParams } from "url";
import FormData from "form-data";
import { createVerify } from "crypto";

async function req(url: string, option: { method?: string, headers?: any, form?: Record<string, string>, formMultipart?: any; body?: any } = {}) {
    let body;
    if (option.form) {
        body = new URLSearchParams(option.form);
    }
    if (option.formMultipart) {
        body = new FormData();
        for (let [key, value] of option.formMultipart) {
            if (value instanceof Uint8Array) {
                body.append(key, value, { header: { "Content-Type": "image/png" } });
            } else {
                body.append(key, value);
            }
        }
    }
    if (option.body) {
        body = option.body;
    }
    const { body: respBody, statusCode, statusMessage } = await got(url, {
        method: option.method,
        headers: option.headers,
        body,
        json: true
    })
    return {
        statusCode,
        statusMessage,
        body: respBody,
    }
}

async function verify(data: string, signature: string, pemKey: string | Uint8Array) {
    return createVerify("SHA1").update(data, "utf8").verify(pemKey, signature, "base64");
}

setBase(req, verify);

export { ProfileService }
export { GameProfile } from "@xmcl/common";
export default ProfileService;