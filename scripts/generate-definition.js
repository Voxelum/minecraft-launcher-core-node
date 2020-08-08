const fs = require("fs");

function ecape(s) {
    return s.replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

{
    const definitions = [];
    function scanDefinitions(dir) {
        try {
            for (const file of fs.readdirSync(dir)) {
                const f = `${dir}/${file}`;
                if (file.endsWith(".d.ts")) {
                    const fname = `@xmcl/${dir.replace('packages/', '')}/${file}`;
                    definitions.push({ file: fname, content: fs.readFileSync(f).toString() })
                } else if (fs.statSync(f).isDirectory()) {
                    scanDefinitions(f);
                }
            }
        } catch (e) {
            console.error(e)
        }
    }
    function scanNodeDefinitions() {
        try {
            for (const file of fs.readdirSync('node_modules/@types/node')) {
                const f = `node_modules/@types/node/${file}`;
                if (file.endsWith(".d.ts")) {
                    const fname = `${file}`;
                    definitions.push({ file: fname, content: fs.readFileSync(f).toString() })
                }
            }
        } catch (e) {
            console.error(e)
        }
    }
    scanDefinitions("packages");
    scanNodeDefinitions();
    fs.writeFileSync('docs/site/definitions.js', definitions.map(f => {
        return `module.exports['${f.file}'] = \`${ecape(f.content)}\`;`
    }).join('\n'));
}

{
    const scenarios = [];
    try {
        for (const file of fs.readdirSync("docs/scenarios")) {
            const f = `docs/scenarios/${file}`
            scenarios.push({ file, content: fs.readFileSync(f).toString() })
        }
    } catch (e) {
        console.error(e)
    }
    fs.writeFileSync('docs/site/scenarios.js', scenarios.map(f => {
        return `module.exports['${f.file.replace(".ts", "")}'] = \`${ecape(f.content)}\`;`
    }).join('\n'));
}
