const { workspaces } = require('../package.json');
const { join } = require('path');
const { execSync } = require('child_process');

const tag = process.argv[process.argv.length - 1];
console.log(`Publish to tag ${tag ?? 'latest'}`)

for (const workspace of workspaces) {
    const cwd = join(__dirname, '..', workspace);
    const result = execSync(`npm publish --tag ${tag} --dry-run`, { cwd }).toString('utf-8');
    console.log(result);
}
