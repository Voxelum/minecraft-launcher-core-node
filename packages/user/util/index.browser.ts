import { HttpRequester } from "./base";

export const httpRequester: HttpRequester = async (option) => {
    const url = new URL(option.url);
    let body: any = undefined;
    let headers: { [key: string]: string } = option.headers;
    if (option.body) {
        switch (option.bodyType || "json") {
            case "json":
                headers["Content-Type"] = "application/json";
                body = JSON.stringify(option.body);
                break;
            case "search":
                url.search = new URLSearchParams(option.body as Record<string, string>).toString();
                break;
            case "formMultiPart":
                body = new FormData();
                for (let [key, value] of body) {
                    if (value instanceof Uint8Array) {
                        value = new File([value], "", { type: "image/png" })
                    }
                    body.append(key, value);
                }
                break;
        }
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
export async function verify(data: string, signature: string, pemKey: string | Uint8Array) {
    function stringToBuffer(s: string) {
        const byteArray = new Uint8Array(s.length);
        for (let i = 0; i < s.length; i++) { byteArray[i] = s.charCodeAt(i); }
        return byteArray;
    }
    const option = {
        name: "RSASSA-PKCS1-v1_5",
        hash: "sha1",
    };
    if (typeof pemKey === "string") {
        pemKey = pemKey.replace("\n", "")
            .replace("-----BEGIN PRIVATE KEY-----", "")
            .replace("-----END PRIVATE KEY-----", "");
        pemKey = atob(pemKey);
        pemKey = stringToBuffer(pemKey);
    }
    const key = await crypto.subtle.importKey("pkcs8", pemKey, option, false, ["verify"]);
    return crypto.subtle.verify(option, key, stringToBuffer(signature), stringToBuffer(data));
}
export function decodeBase64(b: string) {
    return atob(b);
}
