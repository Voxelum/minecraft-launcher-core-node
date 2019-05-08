const fs = require("fs");
const { resolve } = require("path");

async function clean(f) {
    if (!fs.existsSync(f)) {
        return;
    }
    const stat = await fs.promises.stat(f);
    if (stat.isDirectory()) {
        const children = await fs.promises.readdir(f);
        await Promise.all(children.map(child => clean(resolve(f, child))));
    } else {
        await fs.promises.unlink(f);
    }
}

clean('./dest');
