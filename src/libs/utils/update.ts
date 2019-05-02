import got = require("got");

export interface UpdatedObject {
    timestamp: string;
}

export function getIfUpdate<T extends UpdatedObject = UpdatedObject>(url: string, parser: (s: string) => any, lastObj?: T): Promise<T> {
    const lastModified = lastObj ? lastObj.timestamp : undefined;
    return got(url, {
        encoding: "utf-8",
        headers: lastModified ? { "If-Modified-Since": lastModified } : undefined,
    }).then((resp) => {
        return resp.statusCode === 304 ? lastObj : {
            ...parser(resp.body),
            timestamp: resp.headers["last-modified"] as string,
        };
    }).catch((e) => lastObj);
}
