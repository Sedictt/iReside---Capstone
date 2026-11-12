import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const manualDir = path.join(__dirname, '..', 'docs', 'manual');

async function measureAllElements(htmlFilename) {
  const htmlPath = path.join(manualDir, htmlFilename);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 559, height: 794, deviceScaleFactor: 2 });
  await page.emulateMediaType('print');
  await page.goto('file://' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);

  const results = await page.evaluate(() => {
    const list = [];
    // Check all h1, h2, h3
    document.querySelectorAll('h1, h2, h3').forEach(el => {
      const pageEl = el.closest('.page');
      const r = document.createRange();
      r.selectNodeContents(el);
      const rects = r.getClientRects();
      const containerW = el.parentElement.getBoundingClientRect().width;
      const computed = window.getComputedStyle(el);
      const lineHeight = parseFloat(computed.lineHeight) || 20;
      list.push({
        type: el.tagName,
        page: pageEl ? pageEl.id : '',
        text: el.textContent.trim().replace(/\s+/g, ' '),
        rectsCount: rects.length,
        height: Math.round(el.offsetHeight),
        lineHeight: Math.round(lineHeight),
        isMultiRow: rects.length > 1 || el.offsetHeight > lineHeight * 1.5
      });
    });

    // Running headers
    document.querySelectorAll('.running-header').forEach(el => {
      const pageEl = el.closest('.page');
      const spans = Array.from(el.querySelectorAll('span'));
      spans.forEach(s => {
        const r = document.createRange();
        r.selectNodeContents(s);
        const rects = r.getClientRects();
        list.push({
          type: 'HEADER-SPAN',
          page: pageEl ? pageEl.id : '',
          text: s.textContent.trim(),
          rectsCount: rects.length,
          height: Math.round(s.offsetHeight),
          isMultiRow: rects.length > 1
        });
      });
    });

    // TOC items
    document.querySelectorAll('.toc-table tr').forEach(tr => {
      const titleTd = tr.querySelector('.toc-title');
      const pageTd = tr.querySelector('.toc-page');
      if (titleTd) {
        const r = document.createRange();
        r.selectNodeContents(titleTd);
        const rects = r.getClientRects();
        list.push({
          type: 'TOC-ROW',
          page: 'page-1',
          text: titleTd.textContent.trim(),
          rectsCount: rects.length,
          height: Math.round(titleTd.offsetHeight),
          isMultiRow: rects.length > 1
        });
      }
    });

    return list;
  });

  await browser.close();
  return results;
}

async function main() {
  for (const file of ['ireside-user-manual-with-screens.html', 'ireside-user-manual-text.html']) {
    console.log(`\n=== CHECKING HEADINGS & TOC: ${file} ===`);
    const res = await measureAllElements(file);
    const multi = res.filter(r => r.isMultiRow);
    console.log(`Total elements: ${res.length}, Multi-row: ${multi.length}`);
    if (multi.length > 0) {
      console.log('Multi-row elements:');
      console.table(multi);
    } else {
      console.log('All headings, running headers, and TOC rows are STRICTLY SINGLE-ROW!');
    }
  }
}

main().catch(console.error);
