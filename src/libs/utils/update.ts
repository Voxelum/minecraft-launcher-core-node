import * as http from 'http'
import * as https from 'https'
import * as urls from 'url'

export type UpdatedObject = {
    timestamp: string
}

export default function UPDATE(option: {
    fallback?: UpdatedObject, remote: string
}): Promise<UpdatedObject> {
    return new Promise<UpdatedObject>((resolve, reject) => {
        let u = urls.parse(option.remote)
        let worker
        if (u.protocol == 'https:')
            worker = https
        else worker = http
        let req = (worker as any).request({
            protocol: u.protocol,
            host: u.host,
            path: u.path,
            headers: (option.fallback && option.fallback.date) ? { 'If-Modified-Since': option.fallback.date } : undefined
        }, (res: any) => {
            if (res.statusCode == 200) {
                res.setEncoding('utf-8')
                let buf = ''
                let last = res.headers['last-modified'] as string
                res.on('data', (e: any) => buf += e)
                res.on('end', () => {
                    let obj = JSON.parse(buf)
                    //TODO check the data
                    resolve({ object: obj, date: last })
                })
            }
            else if (res.statusCode == 304) {
                resolve((option as any).fallback)
            }
        })
        req.on('error', (e: any) => reject(e))
        req.end()
    });
}

export function getIfUpdate(url: string, parser: (s: string) => any, lastObj?: UpdatedObject): Promise<UpdatedObject> {
    return new Promise<UpdatedObject>((resolve, reject) => {
        const lastModified = lastObj ? lastObj.timestamp : undefined;
        const resolvedURL = urls.parse(url)
        const worker = resolvedURL.protocol == 'https:' ? https : http;
        const req = worker.request({
            protocol: resolvedURL.protocol,
            host: resolvedURL.host,
            path: resolvedURL.path,
            headers: lastModified ? { 'If-Modified-Since': lastModified } : undefined
        }, (res: any) => {
            if (res.statusCode == 200) {
                res.setEncoding('utf-8')
                let buf = ''
                const last = res.headers['last-modified'] as string
                res.on('data', (e: any) => buf += e)
                res.on('end', () => {
                    const result = parser(buf);
                    result.timestamp = last;
                    resolve(result);
                })
            } else if (res.statusCode == 304) {
                resolve(lastObj)
            }
        })
        req.on('error', (e: any) => reject(e))
        req.end()
    });
}