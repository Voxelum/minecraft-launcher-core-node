const fs = require("fs");

const packages = fs.readdirSync("packages");
for (const pack of packages) {
    try {
        for (const file of fs.readdirSync("packages/" + pack)) {
            if (file.endsWith(".d.ts") || file.endsWith(".js") || file.endsWith(".js.map")) {
                fs.unlinkSync(`packages/${pack}/${file}`);
            }
        }
    } catch { }
}