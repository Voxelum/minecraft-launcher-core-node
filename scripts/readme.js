const fs = require("fs");
const path = require("path");
const os = require("os");

/**
 * @param {string} content
 */
function extractUsage(content) {
  const lines = content.split("\n");
  const usageLineIndex = lines.findIndex((l) =>
    l.trim().startsWith("## Usage")
  );
  if (usageLineIndex === -1) return [];

  let usageStart = lines.findIndex(
    (l, i) => l.trim() !== "" && i > usageLineIndex
  );
  let usageEnd = lines.findIndex(
    (l, i) => l.startsWith("## ") && i > usageStart
  );
  if (usageEnd === -1) usageEnd = lines.length;

  let usageContent = lines.slice(usageStart, usageEnd);

  let lastLineIndex = usageContent.length - 1;
  for (let i = usageContent.length - 1; i > 0; --i) {
    if (usageContent[i] !== "") {
      lastLineIndex = i;
      break;
    }
  }
  usageContent = usageContent.slice(0, lastLineIndex + 1);

  const topicIndex = [];
  const topic = [];
  let lastIndex = usageContent.findIndex((c) => c.startsWith("### "));
  let i;
  for (i = lastIndex + 1; i < usageContent.length; ++i) {
    if (usageContent[i].startsWith("### ")) {
      topicIndex.push(i);
      topic.push(usageContent.slice(lastIndex, i));
      lastIndex = i;
    }
  }

  topicIndex.push(i);
  topic.push(usageContent.slice(lastIndex, i));

  return topic;
}

function extractReadmeUsages() {
  return fs
    .readdirSync(path.join(__dirname, "../packages"))
    .map((p) => ({
      project: p,
      path: path.join(__dirname, "../packages", p, "README.md"),
    }))
    .map((r) => {
      if (fs.existsSync(r.path)) {
        const reg = new RegExp(os.EOL);
        reg.global = true;
        return {
          ...r,
          content: extractUsage(
            fs.readFileSync(r.path).toString().replace(reg, "\n")
          ),
        };
      }
      return { ...r, content: [] };
    });
}

module.exports.extractReadmeUsages = extractReadmeUsages;
