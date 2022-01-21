const { join } = require('path');
const { execSync } = require('child_process');
const { readFileSync, readdirSync, existsSync } = require('fs');

console.log(`Publish to tag ${'latest'}`)

const workspaces = readdirSync(join(__dirname, '../packages'))

for (const workspace of workspaces) {
    const cwd = join(__dirname, '..', 'packages', workspace);
    if (!existsSync(join(cwd, 'package.json'))) {
        continue
    }
    const packageContent = JSON.parse(readFileSync(join(cwd, 'package.json')).toString());
    const packageName = packageContent.name;
    const packageVersion = packageContent.version;
    const published = execSync(`npm show ${packageName} versions`);
    try {
        if (published.indexOf(packageVersion) === -1) {
            const result = execSync(`pnpm publish --access public`, { cwd });
            console.log(result.toString());
        } else {
            console.log(`${packageName}@${packageVersion} is already published. Skip it.`)
        }
    } catch (e) {
        console.log(e.stdout.toString());
    }
}
