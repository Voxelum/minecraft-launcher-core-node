export function writeString(out: ByteBuffer, str: string) {
    let strlen = str.length;
    let utflen = 0;
    let c: number;
    let count: number = 0;

    /* use charAt instead of copying String to char array */
    for (let i = 0; i < strlen; i++) {
        c = str.charCodeAt(i);
        if ((c >= 0x0001) && (c <= 0x007F)) {
            utflen++;
        } else if (c > 0x07FF) {
            utflen += 3;
        } else {
            utflen += 2;
        }
    }

    if (utflen > 65535)
        throw new Error(
            "encoded string too long: " + utflen + " bytes");

    let bytearr = new Uint8Array(utflen + 2);

    bytearr[count++] = ((utflen >>> 8) & 0xFF);
    bytearr[count++] = ((utflen >>> 0) & 0xFF);

    let i = 0;
    for (i = 0; i < strlen; i++) {
        c = str.charCodeAt(i);
        if (!((c >= 0x0001) && (c <= 0x007F))) break;
        bytearr[count++] = c;
    }

    for (; i < strlen; i++) {
        c = str.charCodeAt(i);
        if ((c >= 0x0001) && (c <= 0x007F)) {
            bytearr[count++] = c;

        } else if (c > 0x07FF) {
            bytearr[count++] = (0xE0 | ((c >> 12) & 0x0F));
            bytearr[count++] = (0x80 | ((c >> 6) & 0x3F));
            bytearr[count++] = (0x80 | ((c >> 0) & 0x3F));
        } else {
            bytearr[count++] = (0xC0 | ((c >> 6) & 0x1F));
            bytearr[count++] = (0x80 | ((c >> 0) & 0x3F));
        }
    }
    out.append(bytearr)
    // out.write(bytearr, 0, utflen + 2);
    return utflen + 2;
}
export function readString(buff: ByteBuffer) {
    let utflen = buff.readUint16()
    let bytearr: number[] = new Array<number>(utflen);
    let chararr = new Array<number>(utflen);

    let c, char2, char3;
    let count = 0;
    let chararr_count = 0;

    for (let i = 0; i < utflen; i++)
        bytearr[i] = (buff.readByte())

    while (count < utflen) {
        c = bytearr[count] & 0xff;
        if (c > 127) break;
        count++;
        chararr[chararr_count++] = c;
    }

    while (count < utflen) {
        c = bytearr[count] & 0xff;
        switch (c >> 4) {
            case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
                /* 0xxxxxxx*/
                count++;
                chararr[chararr_count++] = c;
                break;
            case 12: case 13:
                /* 110x xxxx   10xx xxxx*/
                count += 2;
                if (count > utflen)
                    throw new Error(
                        "malformed input: partial character at end");
                char2 = bytearr[count - 1];
                if ((char2 & 0xC0) != 0x80)
                    throw new Error(
                        "malformed input around byte " + count);
                chararr[chararr_count++] = (((c & 0x1F) << 6) |
                    (char2 & 0x3F));
                break;
            case 14:
                /* 1110 xxxx  10xx xxxx  10xx xxxx */
                count += 3;
                if (count > utflen)
                    throw new Error(
                        "malformed input: partial character at end");
                char2 = bytearr[count - 2];
                char3 = bytearr[count - 1];
                if (((char2 & 0xC0) != 0x80) || ((char3 & 0xC0) != 0x80))
                    throw new Error(
                        "malformed input around byte " + (count - 1));
                chararr[chararr_count++] = (((c & 0x0F) << 12) |
                    ((char2 & 0x3F) << 6) |
                    ((char3 & 0x3F) << 0));
                break;
            default:
                /* 10xx xxxx,  1111 xxxx */
                throw new Error(
                    "malformed input around byte " + count);
        }
    }
    // The number of chars produced may be less than utflen
    return chararr.map(i => String.fromCharCode(i)).join('')
}

export function startWith(string: string, prefix: string) {
    return string.match(new RegExp('^' + prefix))
}

export function endWith(string: string, postfix: string) {
    return string.match(new RegExp(postfix + '$'))
}

import * as http from 'http'
import * as https from 'https'
import * as urls from 'url'
import * as fs from 'fs'
import * as path from 'path'
import * as dir from 'mkdirp'
import * as crypto from 'crypto'

let net: any;

try {
    const electron = require('electron')
    net = electron.net
}
catch (e) {

}


export async function CHECKSUM(path: string, algorithm: string = 'sha1'): Promise<string> {
    return new Promise<string>((resolve, reject) =>
        fs.readFile(path, (err, data) => {
            if (err) reject(err)
            else resolve(crypto.createHash(algorithm).update(data).digest('hex'))
        })
    );
}

export async function DIR(path: string): Promise<string> {
    return new Promise<string>((acc, den) => {
        dir(path, (e, m) => {
            if (e) den()
            else acc(m)
        })
    })
}

function _findDownloadRes(requester: any, url: string) {
    return new Promise((resolve, reject) => {
        let req = requester.get(url,
            (res: any) => {
                if (res.statusCode == 304 || res.statusCode == 302)
                    resolve(_findDownloadRes(requester, res.headers.location))
                else resolve(res)
            })
        req.on('error', (e: any) => {
            reject(e);
        })
        req.end()
    })
}
async function httpDownloadRec(url: string, file: string) {
    let u = urls.parse(url)
    let reqestor = u.protocol === 'https' ? https : http
    let res: any = await _findDownloadRes(reqestor, url);

    if (res.statusCode !== 200) {
        throw new Error(res.statusCode)
    } else {
        let stream = fs.createWriteStream(file)
        try {
            await new Promise((resolve, reject) => {
                res.pipe(stream)
                stream.on('finish', () => { stream.close(); resolve() })
            });
        } catch (e) {
            stream.close();
            await new Promise((resolve, reject) => {
                fs.unlink(file, err => {
                    reject(e);
                });
            });
        }
    }
}

function electronNetDownload(url: string, file: string) {
    const req = net.request(url);
    req.followRedirect();
    return new Promise<void>((resolve, reject) => {
        req.on('response', (response: any) => {
            if (response.statusCode !== 200) {
                throw new Error(response.statusCode)
            }
            let stream = fs.createWriteStream(file)
            response.on('error', (e: Error) => {
                fs.unlink(file, err => {
                    reject(e);
                });
            })
            response.pipe(stream)
            stream.on('finish', () => { stream.close(); resolve() })
        })
        req.on('error', (err: any) => {
            fs.unlink(file, e => {
                reject(err);
            });
            reject(err)
        })
        req.end()
    });
}
export function DOWN_R(url: string, file: string): Promise<void> {
    if (net) return electronNetDownload(url, file)
    else return httpDownloadRec(url, file)
}

export function DOWN(url: string, file: string): Promise<void> {
    if (net) return electronNetDownload(url, file);
    return new Promise<void>((resolve, reject) => {
        let stream = fs.createWriteStream(file)
        let u = urls.parse(url)
        let req
        let resHandler = (res: any) => {
            if (res.statusCode === 502) {
                stream.close();
                fs.unlink(file, err => {
                    reject(502);
                });
            } else
                res.pipe(stream)
            stream.on('finish', () => { stream.close(); resolve() })
        }
        if (u.protocol == 'https:')
            req = https.get({
                host: u.host,
                path: u.path
            }, resHandler)
        else
            req = http.get({
                host: u.host,
                path: u.path
            }, resHandler)
        req.on('error', e => {
            stream.close();
            fs.unlink(file, err => {
                reject(e);
            });
        })
        req.end()
    });

}

export async function READ(path: string): Promise<string> {
    return new Promise<string>((res, rej) => {
        fs.readFile(path, (e, d) => {
            if (e) rej(e)
            else res(d.toString())
        })
    })
}
export async function UPDATE(option: {
    fallback?: {
        list: any, date: string
    }, remote: string
}): Promise<{ list: any, date: string }> {
    return new Promise<{ list: any, date: string }>((resolve, reject) => {
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

async function httpget(url: string) {
    return new Promise<string>((resolve, reject) => {
        let u = urls.parse(url)
        let buf = ''
        let call = (res: http.IncomingMessage) => {
            res.setEncoding('utf-8')
            res.on('data', (data) => buf += data)
            res.on('end', () => resolve(buf))
        }
        let req
        if (u.protocol == 'https:') req = https.get({
            host: u.host,
            hostname: u.hostname,
            path: u.path,
        }, call)
        else req = http.get({
            host: u.host,
            hostname: u.hostname,
            path: u.path,
        }, call)
        req.on('error', (e) => reject(e))
        req.end()
    })
}

function enetget(url: string) {
    return new Promise<string>((resolve, reject) => {
        const request = net.request(url)
        let buffer = ''
        request.on('response', (response: any) => {
            response.on('data', (chunk: any) => {
                buffer += chunk.toString()
            })
            response.on('end', () => {
                resolve(buffer)
            })
        })
        request.on('error', (e: any) => reject(e))
        request.end()
    });
}
export async function GET(url: string): Promise<string> {
    if (net) return enetget(url)
    else return httpget(url);
}

export function getString(url: string, callback: (result: string, error?: Error) => void) {
    let u = urls.parse(url)
    let buf = ''
    let call = (res: http.IncomingMessage) => {
        res.setEncoding('utf-8')
        res.on('data', (data) => buf += data)
        res.on('end', () => callback(buf))
    }
    let req
    if (u.protocol == 'https:') req = https.get({
        host: u.host,
        hostname: u.hostname,
        path: u.path,
    }, call)
    else req = http.get(url, call)
    req.on('error', (e) => callback('', e))
    req.end()
}