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

const contents = readmeContents;

let allReadme = [];

contents.map(c => {
    const content = c.content;
    if (content) {
        const lines = content.split("\n");
        const usageLineIndex = lines.findIndex(l => l.trim().startsWith("## Usage"));
        if (usageLineIndex === -1) return;

        let usageStart = lines.findIndex((l, i) => l.trim() !== '' && i > usageLineIndex);
        let usageEnd = lines.findIndex((l, i) => l.startsWith('## ') && i > usageStart);
        if (usageEnd === -1) usageEnd = lines.length;

        let usageContent = lines.slice(usageStart, usageEnd);

        // console.log(usageContent[0]);

        let lastLineIndex = usageContent.length - 1
        for (let i = usageContent.length - 1; i > 0; --i) {
            if (usageContent[i] !== '') {
                lastLineIndex = i;
                break;
            }
        }
        usageContent = usageContent.slice(0, lastLineIndex + 1);

        const topicIndex = [];
        const topic = [];
        let lastIndex = usageContent.findIndex(c => c.startsWith("### "));
        let i;
        for (i = lastIndex + 1;
            i < usageContent.length; ++i) {
            if (usageContent[i].startsWith('### ')) {
                topicIndex.push(i);
                topic.push(usageContent.slice(lastIndex, i));
                lastIndex = i;
            }
        }

        topicIndex.push(i);
        topic.push(usageContent.slice(lastIndex, i));

        topic.map(t => t[0]).forEach(t => console.log(t));

        return topic;
    }
    return undefined;
}).filter(c => c !== undefined).reduce((p, c) => {
    return [...p, ...c];
}).sort((a, b) => {
    return a[0].localeCompare(b[0]);
}).forEach(c => {
    allReadme.push(...c, '');
});

function injectRoot() {
    const rootReadme = fs.readFileSync('README.md').toString();
    const lines = rootReadme.split("\n");

    const gettingStartedLine = lines.findIndex(l => l.trim().startsWith('## Getting Started'));
    const firstSampleLine = lines.findIndex((l, i) => i > gettingStartedLine && l.trim().startsWith("### "));
    const endSampleLine = lines.findIndex((l, i) => i > firstSampleLine && l.trim().startsWith("## "));

    lines.splice(firstSampleLine, endSampleLine - firstSampleLine, ...allReadme);

    fs.writeFileSync("README.md", lines.join('\n'));
}

injectRoot();
