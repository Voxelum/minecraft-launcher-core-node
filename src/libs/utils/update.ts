import * as http from "http";
import * as https from "https";
import * as urls from "url";

export interface UpdatedObject {
    timestamp: string;
}

export function getIfUpdate<T extends UpdatedObject = UpdatedObject>(url: string, parser: (s: string) => any, lastObj?: T): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const lastModified = lastObj ? lastObj.timestamp : undefined;
        const resolvedURL = urls.parse(url);
        const worker = resolvedURL.protocol === "https:" ? https : http;
        const req = worker.request({
            protocol: resolvedURL.protocol,
            host: resolvedURL.host,
            path: resolvedURL.path,
            headers: lastModified ? { "If-Modified-Since": lastModified } : undefined,
        }, (res: any) => {
            if (res.statusCode === 200) {
                res.setEncoding("utf-8");
                let buf = "";
                const last = res.headers["last-modified"] as string;
                res.on("data", (e: any) => buf += e);
                res.on("end", () => {
                    const result = parser(buf);
                    result.timestamp = last;
                    resolve(result);
                });
            } else if (res.statusCode === 304) {
                resolve(lastObj);
            } else {
                resolve(lastObj);
            }
        });
        req.on("error", (e: any) => reject(e));
        req.end();
    });
}
