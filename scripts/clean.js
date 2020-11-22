const fs = require("fs");

function scandir(dir) {
    try {
        if (dir.indexOf('node_modules') !== -1) { return; }
        for (const file of fs.readdirSync(dir)) {
            const f = `${dir}/${file}`;
            if (file.endsWith(".d.ts") || file.endsWith(".js") || file.endsWith(".map") || file.endsWith(".ts.map") || file.endsWith(".cjs") || file.endsWith(".esm.js")) {
                fs.unlinkSync(f);
            } else if (fs.statSync(f).isDirectory()) {
                scandir(f);
            }
        }
    } catch (e) {
        console.error(e)
    }
}

scandir("packages");