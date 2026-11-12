import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const manualDir = path.join(__dirname, '..', 'docs', 'manual');

async function measureIntrinsicWidths(htmlFilename) {
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

  const measurements = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.task-title')).map(t => {
      const pageEl = t.closest('.page');
      const badge = t.querySelector('.task-badge');
      const badgeW = badge ? badge.getBoundingClientRect().width : 0;
      
      // Measure text node width
      const textNodes = Array.from(t.childNodes).filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
      let textW = 0;
      textNodes.forEach(tn => {
        const r = document.createRange();
        r.selectNodeContents(tn);
        // If it wrapped, getClientRects will have multiple rects
        const rects = r.getClientRects();
        if (rects.length === 1) {
          textW += rects[0].width;
        } else {
          // Wrapped! Let's sum widths or measure unwrapped
          textW += Array.from(rects).reduce((acc, cur) => acc + cur.width, 0);
        }
      });

      const gap = 6; // gap in flex
      const totalIntrinsicW = badgeW + gap + textW;
      const containerW = t.parentElement.getBoundingClientRect().width;
      const margin = containerW - totalIntrinsicW;

      return {
        file: document.title.includes('Edisyong Teksto') ? 'text' : 'screens',
        page: pageEl ? pageEl.id : '',
        badgeText: badge ? badge.textContent.trim() : '',
        titleText: t.textContent.trim().replace(/\s+/g, ' '),
        totalIntrinsicW: Math.round(totalIntrinsicW * 10) / 10,
        containerW: Math.round(containerW * 10) / 10,
        margin: Math.round(margin * 10) / 10,
        wraps: totalIntrinsicW > containerW
      };
    });
  });

  await browser.close();
  return measurements;
}

async function main() {
  console.log('=== WITH SCREENS ===');
  const screens = await measureIntrinsicWidths('ireside-user-manual-with-screens.html');
  console.table(screens);

  console.log('\n=== TEXT ONLY ===');
  const text = await measureIntrinsicWidths('ireside-user-manual-text.html');
  console.table(text);
}

main().catch(console.error);
