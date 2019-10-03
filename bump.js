const fs = require('fs');
const convBump = require('conventional-recommended-bump');
const semver = require('semver');

async function main(dry) {
    const packages = fs.readdirSync('packages');
    for (const package of packages) {
        let packageJSON;
        try {
            packageJSON = JSON.parse(fs.readFileSync(`packages/${package}/package.json`).toString());
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
            const newVersion = semver.inc(packageJSON.version, result.releaseType);
            console.log(`${packageJSON.name}: ${packageJSON.version} -> ${newVersion}`);
            if (!dry) {
                fs.writeFileSync(`packages/${package}/package.json`, JSON.stringify({ ...packageJSON, version: newVersion }));
            }
        }
    }
}

main(true);
