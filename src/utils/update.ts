import * as http from 'http'
import * as https from 'https'
import * as urls from 'url'

export type UpdatedList = {
    list: any, date: string
}

export default function (option: {
    fallback?: UpdatedList, remote: string
}): Promise<UpdatedList> {
    return new Promise<UpdatedList>((resolve, reject) => {
        let u = urls.parse(option.remote)
        let worker
        if (u.protocol == 'https:')
            worker = https
        else worker = http
        let req = (worker as any).request({
            protocol: u.protocol,
            host: u.host,
            path: u.path,
            headers: option.fallback ? { 'If-Modified-Since': option.fallback.date } : undefined
        }, (res: any) => {
            if (res.statusCode == 200) {
                res.setEncoding('utf-8')
                let buf = ''
                let last = res.headers['last-modified'] as string
                res.on('data', (e: any) => buf += e)
                res.on('end', () => {
                    let obj = JSON.parse(buf)
                    //TODO check the data
                    resolve({ list: obj, date: last })
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