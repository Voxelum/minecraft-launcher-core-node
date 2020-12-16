const fs = require('fs');
const convBump = require('conventional-recommended-bump');
const semver = require('semver');
const core = require('@actions/core');

const DRY = !process.env.CI;

/**
 * Toposort the packages
 * @param { {[name: string]: Package[]} } dependencies
 * @param { Array<Package> } packages
 * @returns {Array<Package>}
 */
function toposort(dependencies, packages) {
    const sorted = [];
    const visited = new Set();
    /**
     * @param {Package} pkg
     */
    function dfs(pkg) {
        if (visited.has(pkg.name)) {
            return;
        }
        visited.add(pkg.name);
        const deps = dependencies[pkg.name] || [];
        for (const dep of deps) {
            dfs(dep);
        }
        sorted.push(pkg);
    }

    for (const pack of packages) {
        dfs(pack);
    }

    return sorted;
}

function scanPackages() {
    /**
     * @param {string} packageName 
     */
    function readPackageJson(packageName) {
        let packageJSON;
        try {
            packageJSON = JSON.parse(fs.readFileSync(`packages/${packageName}/package.json`).toString());
        } catch (e) {
            if (e.code === 'ENOTDIR' || e.code === 'ENOENT')
                return undefined;
            throw e;
        }
        return packageJSON;
    }
    /**
     * @type {Record<string, Package>}
     */
    const nameToPack = {};
    /**
     * @type {Record<string, Package[]>}
     */
    const reversedDependencies = {};
    /**
     * @type {Record<string, Package[]>}
     */
    const dependencies = {};
    // scan all packages and filter out useless folder like .DS_Store
    /**
     * @type {Package[]}
     */
    const packages = fs.readdirSync('packages')
        .map(name => ({ content: readPackageJson(name), name }))
        .filter(pack => pack.content !== undefined);
    // create dependencies mapping
    packages.forEach(pack => {
        nameToPack[pack.name] = pack;
    });
    packages.forEach(pack => {
        const packageJSON = pack.content;
        if (packageJSON.dependencies) {
            for (const dep of Object.values(packageJSON.dependencies)) {
                const dependOn = dep.substring(dep.indexOf('/') + 1);
                reversedDependencies[dependOn] = reversedDependencies[dependOn] || [];
                reversedDependencies[dependOn].push(pack);

                dependencies[pack.name] = dependencies[pack.name] || [];
                if (nameToPack[dependOn]) {
                    dependencies[pack.name].push(nameToPack[dependOn]);
                }
            }
        }
    });
    return { reversedDependencies, packages: toposort(dependencies, packages), dependencies };
}

/**
 * Fill the package bump info by commits under it
 * @param {Package[]} packages 
 */
async function fillPackageBumpInfo(packages) {
    /**
     * @param {string} pkg 
     */
    async function getBumpSuggestion(pkg) {
        /**
         * @type {BumpSuggestion}
         */
        const result = await new Promise((resolve, reject) => {
            convBump({
                path: `packages/${pkg}`,
                whatBump(comments) {
                    const reasons = comments.filter(c => c.type === 'feat' || c.type === 'fix' || c.header.startsWith('BREAKING CHANGE'));
                    const feats = comments.filter(c => c.type === 'feat');
                    const fixes = comments.filter(c => c.type === 'fix');
                    const breakings = comments.filter(c => c.header.startsWith('BREAKING CHANGE'));
                    if (comments.some(c => c.header.startsWith('BREAKING CHANGE'))) {
                        return { level: 0, reasons, feats, fixes, breakings }; // major
                    } else if (comments.some(c => c.type === 'feat')) {
                        return { level: 1, reasons, feats, fixes, breakings }; // minor
                    } else if (comments.some(c => c.type === 'fix')) {
                        return { level: 2, reasons, feats, fixes, breakings }; // patch
                    }
                }
            }, function (err, result) {
                if (err) reject(err);
                else resolve(result);
            });
        });
        return result;
    }
    for (const pkg of packages) {
        const packageJSON = pkg.content;
        const result = await getBumpSuggestion(pkg.name);
        // bump version according to the release type 'major', 'minor' or 'patch'
        if (result.releaseType) {
            const newVersion = semver.inc(packageJSON.version, result.releaseType);
            pkg.newVersion = newVersion || undefined;
            pkg.releaseType = result.releaseType;
            pkg.reasons = result.reasons;
            pkg.level = result.level;
            pkg.feats = result.feats;
            pkg.fixes = result.fixes;
            pkg.breakings = result.breakings;
            console.log(`${pkg.name}: ${pkg.newVersion} ${pkg.releaseType}`)
        }
    }
}

/**
 * Bump dependencies according to the package changes
 * @param { {[name: string]: Package[]} } reversedDependencies
 * @param { Array<Package> } packages
 */
function bumpDependenciesPackage(reversedDependencies, packages) {
    let bumpTotalOrder = 3;
    /**
     * @param {Package} pkg 
     */
    function bump(pkg) {
        // only major & minor change affect the dependents packages update
        const allDependent = reversedDependencies[pkg.name] || [];
        for (const pkg of allDependent) {
            let affected = false;

            const pkgJson = pkg.content;
            const bumpLevel = 2;
            const bumpType = 'patch';

            // if current bumping priority is lower than affected bumped priority
            if (!("level" in pkg) || (typeof pkg.level === 'number' && bumpLevel < pkg.level)) {
                affected = true;
                pkg.level = bumpLevel;
                pkg.releaseType = bumpType;
                pkg.newVersion = semver.inc(pkgJson.version, bumpType) || undefined;
            }

            if (!pkg.reasons) {
                pkg.reasons = [];
            }
            pkg.passive = true;
            pkg.reasons.push(`Dependency ${pkg.package.name} bump **${bumpType}**`);
            if (affected) {
                // dfs bump package
                bump(pkg);
            }
        }
    }
    for (const pkg of packages.filter(pkg => pkg.newVersion && pkg.releaseType)) {
        bumpTotalOrder = Math.min(bumpTotalOrder, pkg.level);
        bump(pkg);
    }

    return bumpTotalOrder;
}

/**
 * Update the package.json
 * 
 * @param {Package[]} packages 
 * @param {Record<string, Package[]>} dependencies
 */
function writeAllNewVersionsToPackageJson(packages, dependencies) {
    for (const pkg of packages) {
        if (!pkg.newVersion) continue;
        if (!DRY) {
            const newContent = Object.assign({}, pkg.content, {
                version: pkg.newVersion,
            });
            const deps = dependencies[pkg.content.name];
            for (const dep of deps) {
                if (dep.newVersion) {
                    newContent.dependencies[dep.content.name] = `^${dep.newVersion}`
                }
            }
            fs.writeFileSync(`packages/${pkg.name}/package.json`, JSON.stringify(newContent, null, 2) + '\n');
        } else {
            console.log(`Mock write file packages/${pkg.name}/package.json ${pkg.newVersion}`);
        }
    }
}

/**
 * Get commits info of packagess
 * @param {Package[]} packages 
 */
function getCommitInfoText(packages) {
    let body = ``;

    for (const pkg of packages.sort((a, b) => a.passive && !b.passive ? 1 : !a.passive && b.passive ? -1 : 0)) {
        const packageJSON = pkg.content;
        if (!pkg.newVersion) continue;
        body += `- **${packageJSON.name}: ${packageJSON.version}** -> ${pkg.newVersion}\n`;
        if (pkg.reasons) {
            for (const reason of pkg.reasons) {
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

/**
 * @param {string} version 
 * @param {Package[]} packages 
 */
function writeChangelog(version, packages) {
    let body = `\n## ${version}\n`;

    function log(reason) {
        return `- ${reason.header} ([${reason.hash}](https://github.com/voxelum/minecraft-launcher-core-node/commit/${reason.hash}))\n`
    }

    for (const pkg of packages.sort((a, b) => a.passive && !b.passive ? 1 : !a.passive && b.passive ? -1 : 0)) {
        const packageJSON = pkg.content;
        if (!pkg.newVersion) continue;
        body += `### ${packageJSON.name}@${pkg.newVersion}\n`;
        if (pkg.reasons) {
            let { breakings, feats, fixes, reasons } = pkg;

            if (breakings && breakings.length !== 0) {
                body += '#### BREAKING CHANGES\n\n';
                breakings.map(log).forEach(l => body += l);
            }
            if (feats && feats.length !== 0) {
                body += '#### Features\n\n';
                feats.map(log).forEach(l => body += l);
            }
            if (fixes && fixes.length !== 0) {
                body += '#### Bug Fixes\n\n';
                fixes.map(log).forEach(l => body += l);
            }

            let texts = reasons.filter(r => typeof r === 'string');

            texts.forEach(l => body += `- ${l}\n`);
        }
    }

    let changelog = fs.readFileSync('CHANGELOG.md').toString();

    let logs = changelog.split('\n');

    let head = logs.shift();
    logs.unshift(body);
    logs.unshift(head);

    changelog = logs.join('\n');
    console.log(changelog);
    if (!DRY) {
        fs.writeFileSync('CHANGELOG.md', changelog);
    }
}

function getPrTitle(version) {
    return `Prepare Release ${version}`
}
/**
 * Get PR body text
 * @param {Package[]} packages 
 */
function getPRBody(packages) {
    let body = `This PR is auto-generated by
[create-pull-request](https://github.com/peter-evans/create-pull-request)
to prepare new releases for changed packages.\n\n### Package Changes\n\n`;
    body += getCommitInfoText(packages);
    return body;
}
/**
 * Get commit message
 * @param {string} version 
 */
function getCommitMessage(version) {
    return `chore: bump version ${version}`
}

async function main(output) {
    const { reversedDependencies, packages, dependencies } = scanPackages();
    await fillPackageBumpInfo(packages);
    const bumpLevel = bumpDependenciesPackage(reversedDependencies, packages);

    console.log(getCommitInfoText(packages));

    const packageJSON = JSON.parse(fs.readFileSync(`package.json`).toString());

    console.log(bumpLevel)

    if (bumpLevel < 3) {
        const oldVersion = packageJSON.version;
        const bumpType = ["major", "minor", "patch"][bumpLevel];
        const newVersion = semver.inc(packageJSON.version, bumpType);
        packageJSON.version = newVersion;
        console.log(`Bump total version by [${bumpType}]: ${oldVersion} -> ${newVersion}`);

        if (DRY) {
            console.log(`Mock write file package.json`);
        } else {
            fs.writeFileSync(`package.json`, JSON.stringify(packageJSON, null, 4));
        }
        writeAllNewVersionsToPackageJson(packages, dependencies);
        writeChangelog(newVersion, packages);

        output('title', getPrTitle(newVersion));
        output('body', getPRBody(packages));
        output('message', getCommitMessage(newVersion));
        output('release', true);
    } else {
        output('release', false);
    }
}

main(core ? core.setOutput : (k, v) => {
    console.log(k)
    console.log(v)
});
