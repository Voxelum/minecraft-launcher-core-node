import * as fs from 'fs-extra'
import * as crypto from 'crypto';

export default function (path: string, algorithm: string = 'sha1'): Promise<string> {
    return fs.readFile(path).then(data => crypto.createHash(algorithm).update(data).digest('hex'))
}