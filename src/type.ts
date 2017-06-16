var fs = require('fs');

export function readJSONFile<T>(file: string, type: any): T | undefined {
    let obj: any;
    fs.readFile(file, (err: any, data: any) => {
        if (err) throw err;
        obj = JSON.parse(data);
    })
    if (obj)
        obj.__proto__ = type.prototype;
    return obj
}

export function cast<T>(obj: any, cl: any): T {
    obj.__proto__ = cl.prototype;
    return obj;
}