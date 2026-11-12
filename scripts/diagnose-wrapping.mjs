import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const manualDir = path.join(__dirname, '..', 'docs', 'manual');

async function checkDetailedWrapping(htmlFilename) {
  const htmlPath = path.join(manualDir, htmlFilename);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 559,
    height: 794,
    deviceScaleFactor: 2
  });

  // Emulate print media
  await page.emulateMediaType('print');
  const htmlUrl = 'file://' + htmlPath.replace(/\\/g, '/');
  await page.goto(htmlUrl, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);

  const report = await page.evaluate(() => {
    const list = [];
    document.querySelectorAll('.task-title').forEach((title) => {
      const pageEl = title.closest('.page');
      const pageId = pageEl ? pageEl.id : 'unknown';
      const badge = title.querySelector('.task-badge');
      const badgeText = badge ? badge.textContent.trim() : '';

      // Check badge wrapping
      const badgeRects = badge ? badge.getClientRects() : [];
      const badgeMultiLine = badgeRects.length > 1;

      // Find the text node(s) inside task-title
      const textNodes = Array.from(title.childNodes).filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
      let textRectsCount = 0;
      let textContent = '';
      textNodes.forEach(tn => {
        const r = document.createRange();
        r.selectNodeContents(tn);
        const rects = r.getClientRects();
        textRectsCount += rects.length;
        textContent += tn.textContent.trim();
      });

      const titleHeight = title.offsetHeight;
      const titleScrollHeight = title.scrollHeight;

      list.push({
        pageId,
        badgeText,
        textContent,
        badgeMultiLine,
        textLines: textRectsCount,
        titleHeight,
        isMultiRow: badgeMultiLine || textRectsCount > 1
      });
    });
    return list;
  });

  await browser.close();
  return report;
}

async function main() {
  for (const file of ['ireside-user-manual-with-screens.html', 'ireside-user-manual-text.html', 'ireside-user-manual.html']) {
    console.log(`\n================ ${file} ================`);
    const report = await checkDetailedWrapping(file);
    const multiRow = report.filter(r => r.isMultiRow);
    console.log(`Total task titles: ${report.length}, Multi-row: ${multiRow.length}`);
    report.forEach(r => {
      const status = r.isMultiRow ? '>>> MULTI-ROW WRAP <<<' : 'Single-row OK';
      console.log(`[${status}] [${r.pageId}] ${r.badgeText} | "${r.textContent}" (textLines: ${r.textLines}, badgeWrap: ${r.badgeMultiLine}, h: ${r.titleHeight})`);
    });
  }
}

main().catch(console.error);
