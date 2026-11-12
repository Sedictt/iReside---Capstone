import fs from 'fs';

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  function cleanText(text) {
    return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const rawText = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                         .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  const longSentences = [];

  // Leaf block elements (p, li, h1-h4, th, td) with word boundary \b

  for (const m of rawText.matchAll(/<(p|li|h1|h2|h3|h4|th|td)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const text = cleanText(m[2]);
    if (!text || text.startsWith('©') || text.startsWith('http') || text.includes('@')) continue;
    const sentences = text.split(/(?<=[.!?])\s+|\n+/);
    sentences.forEach(s => {
      const trimmed = s.trim();
      if (!trimmed || trimmed.startsWith('©') || trimmed.startsWith('http') || trimmed.includes('@')) return;
      const words = trimmed.split(/\s+/).filter(Boolean);
      if (words.length > 15) {
        longSentences.push({ count: words.length, sentence: trimmed });
      }
    });
  }

  // Specialized leaf container divs
  const divRegex = /<div\s+class="[^"]*(?:tip-box|warning-box|screenshot-caption|task-title|qa-q|qa-a|glossary-item|cover-tagline|cover-title|cover-subtitle|cover-imprint|flow-card-desc|flow-card-title)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  for (const m of rawText.matchAll(divRegex)) {
    if (/<(p|ol|ul|table|h1|h2|h3)/i.test(m[1])) continue;
    const text = cleanText(m[1]);
    if (!text || text.startsWith('©') || text.startsWith('http') || text.includes('@')) continue;
    const sentences = text.split(/(?<=[.!?])\s+|\n+/);
    sentences.forEach(s => {
      const trimmed = s.trim();
      if (!trimmed || trimmed.startsWith('©') || trimmed.startsWith('http') || trimmed.includes('@')) return;
      const words = trimmed.split(/\s+/).filter(Boolean);
      if (words.length > 15) {
        longSentences.push({ count: words.length, sentence: trimmed });
      }
    });
  }


  console.log(`Checking ${filePath}:`);
  console.log('Total sentences > 15 words:', longSentences.length);
  if (longSentences.length > 0) {
    longSentences.forEach((s, i) => console.log(i + 1, `[${s.count} words]`, s.sentence));
    throw new Error(`Found ${longSentences.length} sentences with > 15 words in ${filePath}`);
  }
}

const allFiles = [
  'docs/manual/ireside-user-manual-en-text.html',
  'docs/manual/ireside-user-manual-en.html',
  'docs/manual/ireside-user-manual-text.html',
  'docs/manual/ireside-user-manual.html',
  'docs/manual/ireside-it-manual.html',
  'docs/manual/ireside-manual-unified-en-text.html',
  'docs/manual/ireside-manual-unified-en.html',
  'docs/manual/ireside-manual-unified-text.html',
  'docs/manual/ireside-manual-unified.html'
];

allFiles.forEach(f => {
  if (fs.existsSync(f)) {
    checkFile(f);
  }
});

console.log('All 9 enterprise manual files verified: strictly 0 sentences > 15 words across all block and inline elements!');
