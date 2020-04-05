const fs = require('fs');
const { extractReadmeUsages } = require('./readme');

let allReadme = [];

extractReadmeUsages()
    .filter(({ content }) => content.length !== 0)
    .map(({ content }) => content)
    .reduce((a, b) => [...a, ...b])
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach((a) => allReadme.push(...a, ''));

function injectRoot() {
    const rootReadme = fs.readFileSync('USAGE.md').toString();
    const lines = rootReadme.split("\n");

    const gettingStartedLine = lines.findIndex(l => l.trim().startsWith('## Getting Started'));
    const firstSampleLine = lines.findIndex((l, i) => i > gettingStartedLine && l.trim().startsWith("### "));
    const endSampleLine = lines.findIndex((l, i) => i > firstSampleLine && l.trim().startsWith("## "));

    lines.splice(firstSampleLine, endSampleLine - firstSampleLine, ...allReadme);

    fs.writeFileSync("USAGE.md", lines.join('\n'));
}

injectRoot();
