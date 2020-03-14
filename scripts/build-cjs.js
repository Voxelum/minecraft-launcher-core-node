const fs = require('fs');
const child_process = require('child_process');
const path = require('path')

async function main() {
    let dirs = fs.readdirSync('packages')
    for (let dir of dirs) {
        try {
            let cmds = [path.resolve('./node_modules/.bin/rollup'), '-c', 'rollup.config.js', '--environment', `PACKAGE_NAME:${dir}`];
            await new Promise((resolve, reject) => {
                let process = child_process.exec(cmds.join(' '));
                process.stdout.on('data', (data) => console.log(data.toString('utf-8')))
                process.stderr.on('data', (data) => console.log(data.toString('utf-8')))
                process.on('error', reject)
                process.on('exit', (code) => {
                    if (code === 0) {
                        resolve()
                    } else {
                        reject(code)
                    }
                });
            });
        } catch (e) {
            console.error(e)
        }
    }
}

main()
