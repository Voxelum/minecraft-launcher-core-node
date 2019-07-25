const fs = require('fs');
const path = require('path');

const dirs = fs.readdirSync(path.join(__dirname, "packages"));
for (const name of dirs) {
    const errorLog = path.join(__dirname, "packages", name, `${name}.build.error.log`);
    if (fs.existsSync(errorLog)) {
        console.log(`> ${name}`);
        console.log("-----------------------------------")
        console.log(fs.readFileSync(errorLog).toString());
        console.log("")
    }
}
