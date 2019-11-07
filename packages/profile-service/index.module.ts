import { ProfileService, setBase } from "./service";

async function req(url: string, option: { method?: string, headers?: any, form?: Record<string, string>, formMultipart?: any; body?: any } = {}) {
    let body;
    if (option.form) {
        body = new URLSearchParams(option.form);
    }
    if (option.formMultipart) {
        body = new FormData();
        for (let [key, value] of option.formMultipart) {
            if (value instanceof Uint8Array) {
                value = new File([value], "", { type: "image/png" })
            }
            body.append(key, value);
        }
    }
    if (option.body) {
        body = option.body;
    }
    const result = await fetch(url, {
        method: option.method,
        headers: option.headers,
        body,
    })
    return {
        statusCode: result.status,
        statusMessage: result.statusText,
        body: await result.json().catch(() => ({})),
    }
}

function stringToBuffer(s: string) {
    const byteArray = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) { byteArray[i] = s.charCodeAt(i); }
    return byteArray;
}

async function verify(data: string, signature: string, pemKey: string | Uint8Array) {
    const option = {
        name: "RSASSA-PKCS1-v1_5",
        hash: "sha1",
    };
    if (typeof pemKey === "string") {
        pemKey = pemKey.replace("\n", "")
            .replace('-----BEGIN PRIVATE KEY-----', '')
            .replace('-----END PRIVATE KEY-----', '');
        pemKey = atob(pemKey);
        pemKey = stringToBuffer(pemKey);
    }
    const key = await crypto.subtle.importKey("pkcs8", pemKey, option, false, ["verify"]);
    return crypto.subtle.verify(option, key, stringToBuffer(signature), stringToBuffer(data));
}

setBase(req, verify);

export { ProfileService }
export { GameProfile } from "@xmcl/common";
export default ProfileService;