import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        results = results.concat(walk(full));
      }
    } else if (/\.(tsx|ts)$/.test(file)) {
      results.push(full);
    }
  });
  return results;
}

const files = walk('src');
const missingInputs = [];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (/<(input|Input|textarea|Textarea)\b/i.test(line)) {
      let tag = line;
      let j = idx;
      let braceDepth = 0;
      let inTag = true;

      // Count braces from start of line where tag starts
      const tagStartIndex = line.search(/<(input|Input|textarea|Textarea)\b/i);
      for (let k = tagStartIndex; k < line.length; k++) {
        if (line[k] === '{') braceDepth++;
        else if (line[k] === '}') braceDepth = Math.max(0, braceDepth - 1);
        else if (line[k] === '>' && braceDepth === 0) {
          inTag = false;
          tag = line.slice(tagStartIndex, k + 1);
          break;
        }
      }

      while (inTag && j < lines.length - 1) {
        j++;
        const nextLine = lines[j];
        for (let k = 0; k < nextLine.length; k++) {
          if (nextLine[k] === '{') braceDepth++;
          else if (nextLine[k] === '}') braceDepth = Math.max(0, braceDepth - 1);
          else if (nextLine[k] === '>' && braceDepth === 0) {
            inTag = false;
            tag += ' ' + nextLine.slice(0, k + 1).trim();
            break;
          }
        }
        if (inTag) {
          tag += ' ' + nextLine.trim();
        }
      }

      const isBooleanOrFile = /type=["'](checkbox|radio|file|hidden|color|range)["']/i.test(tag);
      const isComment = /^\s*(\/\/|\/\*|\*)/.test(line);
      if (!isBooleanOrFile && !isComment && !/maxLength|max=|max:/i.test(tag)) {
        missingInputs.push({
          file: path.relative(process.cwd(), f).replace(/\\/g, '/'),
          line: idx + 1,
          tag: tag.replace(/\s+/g, ' ').slice(0, 140)
        });
      }
    }
  });
});

const report = {
  totalMissing: missingInputs.length,
  filesCount: new Set(missingInputs.map(m => m.file)).size,
  items: missingInputs
};

fs.writeFileSync('scripts/audit-report.json', JSON.stringify(report, null, 2));
console.log(`Audited: ${report.totalMissing} items across ${report.filesCount} files. Saved to scripts/audit-report.json`);
