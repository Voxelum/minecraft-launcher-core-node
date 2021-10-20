const { join } = require('path');
const { execSync } = require('child_process');
const { readFileSync, readdirSync } = require('fs');

console.log(`Publish to tag ${'latest'}`)

const workspaces = readdirSync(join(__dirname, '../packages'))

for (const workspace of workspaces) {
    const cwd = join(__dirname, '..', 'packages', workspace);
    const packageContent = JSON.parse(readFileSync(join(cwd, 'package.json')).toString());
    const packageName = packageContent.name;
    const packageVersion = packageContent.version;
    const published = execSync(`npm show ${packageName} versions`);
    if (published.indexOf(packageVersion) === -1) {
        const result = execSync(`npm publish --access public`, { cwd }).toString('utf-8');
        console.log(result);
    } else {
        console.log(`${packageName}@${packageVersion} is already published. Skip it.`)
    }
}
