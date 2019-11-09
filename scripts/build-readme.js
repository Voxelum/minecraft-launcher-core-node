const fs = require('fs');
const path = require('path');
const os = require('os')

const readmeContents = fs.readdirSync('packages')
    .map(p => ({ project: p, path: path.join('packages', p, 'README.md') }))
    .map(r => {
        if (fs.existsSync(r.path)) {
            const reg = new RegExp(os.EOL);
            reg.global = true;
            return { ...r, content: fs.readFileSync(r.path).toString().replace(reg, "\n") };
        }
        return { ...r, content: '' };
    });

const contents = readmeContents.filter(r => r.project !== 'launcher-core');

const coreDepProjects = new Set(Object.values(JSON.parse(fs.readFileSync('packages/launcher-core/package.json').toString())
    .dependencies)
    .map(v => v.substring(v.indexOf('/') + 1)))

let allReadme = [];
let coreReadme = [];

contents.forEach(c => {
    const content = c.content;
    if (content) {
        const lines = content.split("\n");
        const usageLineIndex = lines.findIndex(l => l.trim().startsWith("## Usage"));
        if (usageLineIndex === -1) return;

        let usageStart = lines.findIndex((l, i) => l.trim() !== '' && i > usageLineIndex);
        let usageEnd = lines.findIndex((l, i) => l.startsWith('## ') && i > usageStart);
        if (usageEnd === -1) usageEnd = lines.length - 1;

        let usageContent = lines.slice(usageStart, usageEnd + 1);
        let lastLineIndex = usageContent.length - 1
        for (let i = usageContent.length - 1; i > 0; --i) {
            if (usageContent[i] !== '') {
                lastLineIndex = i;
                break;
            }
        }
        usageContent = usageContent.slice(0, lastLineIndex + 1)

        allReadme.push(...usageContent, '');
        if (coreDepProjects.has(c.project)) {
            coreReadme.push(...usageContent, '');
        }
    } else {
        console.log(`No README.md for ${c.project}`);
    }
});

function injectRoot() {
    const rootReadme = fs.readFileSync('README.md').toString();
    const lines = rootReadme.split("\n");

    const gettingStartedLine = lines.findIndex(l => l.trim().startsWith('-'));
    const firstSampleLine = lines.findIndex((l, i) => i > gettingStartedLine && l.trim().length === 0) + 1;
    const endSampleLine = lines.findIndex((l, i) => i > firstSampleLine && l.trim().startsWith("## "));

    lines.splice(firstSampleLine, endSampleLine - firstSampleLine, ...allReadme);

    fs.writeFileSync("README.md", lines.join('\n'));
}

function injectMinecraftLauncherCore() {
    const rootReadme = fs.readFileSync('packages/launcher-core/README.md').toString();
    const lines = rootReadme.split("\n");

    const gettingStartedLine = lines.findIndex(l => l.trim() === '## Getting Started') + 1;
    let firstSampleLine = lines.findIndex((l, i) => i > gettingStartedLine && l.trim().length === 0) + 1;
    let endSampleLine = lines.findIndex((l, i) => i > firstSampleLine && l.trim().startsWith("## "));

    if (endSampleLine === -1) endSampleLine = lines.length - 1;

    lines.splice(firstSampleLine, endSampleLine - firstSampleLine, ...coreReadme);

    fs.writeFileSync("packages/launcher-core/README.md", lines.join('\n'));
}

injectRoot();
injectMinecraftLauncherCore();
