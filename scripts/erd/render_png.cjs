// Renders docs/iReside-ERD.svg to docs/iReside-ERD.png at 2x using Playwright (Chromium).
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const root = path.resolve(__dirname, '..', '..');
  const svgPath = path.join(root, 'docs', 'iReside-ERD.svg');
  const svg = fs.readFileSync(svgPath, 'utf8');
  const w = +svg.match(/width="([\d.]+)"/)[1], h = +svg.match(/height="([\d.]+)"/)[1];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: Math.ceil(w), height: Math.ceil(h) }, deviceScaleFactor: 2 });
  await page.setContent(`<html><body style="margin:0;background:#fff">${svg}</body></html>`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(root, 'docs', 'iReside-ERD.png'), fullPage: true, omitBackground: false });
  await browser.close();
  console.log('wrote docs/iReside-ERD.png', w, h);
})();
