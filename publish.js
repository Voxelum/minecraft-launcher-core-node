const fs = require('fs');
const convBump = require('conventional-recommended-bump');
const { execSync } = require('child_process');

async function main(dry) {
    const packages = fs.readdirSync('packages');
    for (const package of packages) {
        try {
            JSON.parse(fs.readFileSync(`packages/${package}/package.json`).toString());
        } catch (e) {
            if (e.code === 'ENOTDIR')
                continue;
        }
        const result = await new Promise((resolve, reject) => {
            convBump({
                path: `packages/${package}`,
                lernaPackage: '@xmcl/minecraft-launcher-core',
                whatBump(comments) {
                    if (comments.some(c => c.header.startsWith('BREAKING CHANGE:'))) {
                        return { level: 0 };
                    } else if (comments.some(c => c.type === 'feat')) {
                        return { level: 1 };
                    } else if (comments.some(c => c.type === 'fix')) {
                        return { level: 2 };
                    }
                }
            }, function (err, result) {
                if (err) reject(err);
                else resolve(result);
            });
        });

        if (result.releaseType) {
            if (!dry) {
                execSync(`npm publish packages/${package}`);
            } else {
                execSync(`npm publish packages/${package} --dry-run`);
            }
        }
    }
}

main(false);
