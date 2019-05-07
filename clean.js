const fs = require("fs");
const { resolve } = require("path");

function clean(f) {
    if (!fs.existsSync(f)) {
        return;
    }
    const stat = fs.statSync(f);
    if (stat.isDirectory()) {
        const children = fs.readdirSync(f);
        for (const child of children) {
            clean(resolve(f, child));
        }
    } else {
        fs.unlinkSync(f);
    }
}

clean('./dest');
