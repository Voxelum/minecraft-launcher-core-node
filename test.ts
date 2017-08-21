import StreamZip = require('node-stream-zip-promise')
import * as fs from 'fs'

const buf: any = fs.readFileSync('./tests/assets/sample-map.zip');
fs.open(buf, 'r', function (err, f) {
    if (err) console.log(err)
    else {
        console.log(f)
    }
});
// (StreamZip as any).create({ file: buf })
//     .then((zip: any) => {
//         console.log(zip.entries())
//     }, (e: any) => {
//         console.log(e)
//     })

