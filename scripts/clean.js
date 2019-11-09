const fs = require("fs");

function scandir(dir) {
    try {
        for (const file of fs.readdirSync(dir)) {
            const f = `${dir}/${file}`;
            if (file.endsWith(".d.ts") || file.endsWith(".js") || file.endsWith(".js.map")) {
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