import { request as http, RequestOptions, ClientRequest, IncomingMessage } from "http";
import { request as https } from "https";
import { URL } from "url";
import { HttpRequester } from "./base";

export const httpRequester: HttpRequester = async (option) => {
    let headers: Record<string, string> = { ...option.headers };
    let requestOption: RequestOptions = {
        method: option.method,
        headers,
        agent: option.userAgent,
    }
    let url = new URL(option.url);

    let body: Buffer | undefined;
    if (option.body) {
        headers["Content-Type"] = "application/json";
        body = Buffer.from(JSON.stringify(option.body), "utf-8");
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
