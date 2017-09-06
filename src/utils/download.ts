import * as fs from 'fs-extra'
import * as http from 'http'
import * as https from 'https'
import * as urls from 'url'
import { Writable } from 'stream';

type Requestor = {
    get(options: http.RequestOptions | string, callback?: (res: http.IncomingMessage) => void): http.ClientRequest;
};

let download: (url: string, file?: string) => Promise<Buffer | void>;
try {
    const electron = require('electron')
    const net = electron.net
    download = (url: string, file?: string) => {
        const req = net.request(url);
        return new Promise<Buffer | void>((resolve, reject) => {
            req.on('response', (response: any) => {
                if (response.statusCode !== 200) {
                    throw new Error(response.statusCode)
                }
                let stream = file ? fs.createWriteStream(file) : new Writable()
                response.on('error', (e: Error) => {
                    if (file) fs.unlink(file, err => {
                        reject(e);
                    });
                })
                response.pipe(stream)
                stream.on('finish', () => {
                    if (file) {
                        (stream as any).close();
                        resolve()
                    } else {
                        resolve((stream as any)._writableState.getBuffer())
                    }
                })
            })
            req.on('error', (err: any) => {
                if (file) fs.unlink(file, e => {
                    reject(err);
                });
                else reject(err)
            })
            req.end()
        });
    }
}
catch (e) {
    const findSource = (requester: Requestor, url: string): Promise<http.IncomingMessage> => {
        return new Promise((resolve, reject) => {
            const target = urls.parse(url);
            let path = target.path;
            if (!path) { reject(); return }
            let req = requester.get({
                path: (path + target.search ? target.search : ''),
                host: target.host,
            },
                res => {
                    if (res.statusCode == 304 || res.statusCode == 302)
                        resolve(findSource(requester, res.headers['location'] as string))
                    else if (res.statusCode === 301) {
                        console.log(res.headers)
                        resolve(findSource(requester, res.headers['location'] as string))
                    }
                    else resolve(res)
                })
            req.on('error', reject)
            req.end()
        })
    }
    download = (url: string, file?: string): Promise<void> => {
        let u = urls.parse(url)
        let reqestor: Requestor = u.protocol === 'https' ? https : http
        return findSource(reqestor, url)
            .then(res => {
                if (res.statusCode !== 200)
                    throw new Error(`Error ${res.statusCode}`)
                else {
                    let stream = file ? fs.createWriteStream(file) : new Writable()
                    return new Promise<void>((resolve, reject) => {
                        res.pipe(stream)
                        res.on('error', (err) => {
                            if (file) {
                                (stream as any).close();
                                fs.unlink(file, e => {
                                    reject(err);
                                });
                            } else reject(err);
                        })
                        stream.on('finish', () => {
                            if (file) {
                                (stream as any).close(); resolve();
                            } else {
                                resolve((stream as any)._writableState.getBuffer())
                            }
                        })
                    });
                }
            })
    }
}

export default download;

