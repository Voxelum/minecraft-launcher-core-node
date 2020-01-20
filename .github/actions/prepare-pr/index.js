const fs = require('fs');
const convBump = require('conventional-recommended-bump');
const semver = require('semver');
const core = require('@actions/core');

const DRY = !process.env.CI;

function scanPackages() {
    function readPackageJson(package) {
        let packageJSON;
        try {
            packageJSON = JSON.parse(fs.readFileSync(`packages/${package}/package.json`).toString());
        } catch (e) {
            if (e.code === 'ENOTDIR')
                return undefined;
            throw e;
        }
        return packageJSON;
    }
    const affectedMapping = {};
    const nameToPack = {};
    const packageMapping = {};
    // scan all packages and filter out useless folder like .DS_Store
    let packages = fs.readdirSync('packages')
        .map(name => ({ package: readPackageJson(name), name }))
        .filter(pack => pack.package !== undefined);
    // create dependencies mapping
    packages.forEach(pack => {
        nameToPack[pack.name] = pack;
    });

    packages.forEach(pack => {
        const packageJSON = pack.package;
        if (packageJSON.dependencies) {
            for (const dep of Object.values(packageJSON.dependencies)) {
                const name = dep.substring(dep.indexOf('/') + 1);
                affectedMapping[name] = affectedMapping[name] || [];
                affectedMapping[name].push(pack);

                packageMapping[pack.name] = packageMapping[pack.name] || [];
                if (nameToPack[name]) {
                    packageMapping[pack.name].push(nameToPack[name]);
                }
            }
        }
    });

    packages = toposort(packageMapping, packages);

    return [affectedMapping, packages];
}

async function bumpPackages(packages) {
    async function getBumpSuggestion(package) {
        const result = await new Promise((resolve, reject) => {
            convBump({
                path: `packages/${package}`,
                lernaPackage: '@xmcl/minecraft-launcher-core',
                whatBump(comments) {
                    const reasons = comments.filter(c => c.type === 'feat' || c.type === 'fix' || c.header.startsWith('BREAKING CHANGE:'));
                    if (comments.some(c => c.header.startsWith('BREAKING CHANGE:'))) {
                        return { level: 0, reasons }; // major
                    } else if (comments.some(c => c.type === 'feat')) {
                        return { level: 1, reasons }; // minor
                    } else if (comments.some(c => c.type === 'fix')) {
                        return { level: 2, reasons }; // patch
                    }
                }
            }, function (err, result) {
                if (err) reject(err);
                else resolve(result);
            });
        });
        return result;
    }
    for (const package of packages) {
        const packageJSON = package.package;
        const result = await getBumpSuggestion(package.name);
        // bump version according to the release type 'major', 'minor' or 'patch'
        if (result.releaseType) {
            const newVersion = semver.inc(packageJSON.version, result.releaseType);
            package.newVersion = newVersion;
            package.releaseType = result.releaseType;
            package.reasons = result.reasons;
            package.level = result.level;
        }
    }
}

/**
 * Toposort the packages
 * @param { {[name: string]: Package[]} } packageMapping
 * @param { Array<Package> } packages
 * @returns {Array<Package>}
 */
function toposort(packageMapping, packages) {
    const sorted = [];
    const visited = new Set();
    /**
     * @param {Package} package
     */
    function dfs(package) {
        if (visited.has(package.name)) {
            return;
        }
        visited.add(package.name);
        const deps = packageMapping[package.name] || [];
        for (const dep of deps) {
            dfs(dep);
        }
        sorted.push(package);
    }

    for (const pack of packages) {
        dfs(pack);
    }

    return sorted;
}

/**
 * @typedef {{ name: string; version: string; dependencies?: {[name:string]: string} }} PackageJSON
 * @typedef {{ package: PackageJSON; level?: number; releaseType?: string; passive?: boolean; newVersion?: string; name: string }} Package
 * @param { {[name: string]: Package[]} } affectedMapping
 * @param { Array<Package> } packages
 */
function bumpDependenciesPackage(affectedMapping, packages) {
    function bump(package) {
        // only major & minor change affect the dependents packages update
        const allAffectedPackages = affectedMapping[package.name] || [];
        for (const affectedPackage of allAffectedPackages) {
            let newVersion;
            const affectedPackageJSON = affectedPackage.package;

            let bumpLevel = 2;
            let bumpType = 'patch';
            let affected = false;

            // if current bumping priority is lower than affected bumped priority
            if (!("level" in affectedPackage) || bumpLevel < affectedPackage.level) {
                newVersion = semver.inc(affectedPackageJSON.version, bumpType);
                affectedPackage.level = bumpLevel;
                affectedPackage.releaseType = bumpType;
                affectedPackage.newVersion = newVersion;

                affected = true;
            }

            if (!affectedPackage.reasons) {
                affectedPackage.reasons = [];
            }
            affectedPackage.passive = true;
            affectedPackage.reasons.push(`Dependency ${package.package.name} bump **${bumpType}**`);
            if (affected) {
                bump(affectedPackage);
            }
        }
    }
    for (const package of packages.filter(package => package.newVersion && package.releaseType)) {
        bump(package);
    }
}

/**
 * Update the package.json
 * 
 * @param {Package[]} packages 
 */
function writeAllNewVersionsToPackageJson(packages) {
    for (const package of packages) {
        if (!package.newVersion) continue;
        if (!DRY) {
            fs.writeFileSync(`packages/${package.name}/package.json`, JSON.stringify(Object.assign({}, package.package, { version: package.newVersion }), null, 2) + '\n');
        }
    }
}

function info(packages) {
    let body = ``;

    for (const package of packages.sort((a, b) => a.passive && !b.passive ? 1 : !a.passive && b.passive ? -1 : 0)) {
        const packageJSON = package.package;
        if (!package.newVersion) continue;
        body += `- **${packageJSON.name}: ${packageJSON.version}** -> ${package.newVersion}\n`;
        if (package.reasons) {
            for (const reason of package.reasons) {
                if (typeof reason === 'string') {
                    body += `  - ${reason}\n`;
                } else {
                    body += `  - ${reason.header} ([${reason.hash}](https://github.com/voxelum/minecraft-launcher-core-node/commit/${reason.hash}))\n`
                }
            }
        }
    }
    return body;
}

function prTitle(version) {
    return `Prepare Release ${version}`
}
function prBody(packages) {
    let body = `This PR is auto-generated by
[create-pull-request](https://github.com/peter-evans/create-pull-request)
to prepare new releases for changed packages.\n\n### Package Changes\n\n`;
    body += info(packages);
    return body;
}
function commitMessage(version) {
    return `chore: bump version ${version}`
}

async function main(output) {
    const [affectedMapping, packages] = scanPackages();
    await bumpPackages(packages);
    bumpDependenciesPackage(affectedMapping, packages);
    console.log(info(packages));
    writeAllNewVersionsToPackageJson(packages);

    const packageJSON = JSON.parse(fs.readFileSync(`package.json`).toString());
    const newVersion = packageJSON.version;

    output('title', prTitle(newVersion));
    output('body', prBody(packages));
    output('message', commitMessage(newVersion));
}

main(core ? core.setOutput : (k, v) => {
    console.log(k)
    console.log(v)
});
