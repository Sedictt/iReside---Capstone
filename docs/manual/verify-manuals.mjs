import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const manualDir = __dirname;

async function auditManual(browser, htmlFileName, pdfFileName, expectedPages) {
  const htmlPath = path.join(manualDir, htmlFileName);
  const pdfPath = path.join(manualDir, pdfFileName);

  console.log(`\n======================================================`);
  console.log(`Auditing & Exporting: ${htmlFileName} -> ${pdfFileName}`);
  console.log(`Expected Pages: ${expectedPages}`);
  console.log(`======================================================`);

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
  await page.goto('file://' + path.resolve(htmlPath).replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

  // 1. Check Page Count
  const actualPages = await page.evaluate(() => document.querySelectorAll('.page').length);
  if (actualPages !== expectedPages) {
    throw new Error(`Page count mismatch for ${htmlFileName}: expected ${expectedPages}, got ${actualPages}`);
  }

  // 2. Exact Child-to-Footer Clearance
  const clearanceReport = await page.evaluate(() => {
    const pages = document.querySelectorAll('.page');
    const results = [];

    pages.forEach((p, idx) => {
      const footer = p.querySelector('.running-footer');
      const content = p.querySelector('.content');

      if (!content || !footer) {
        results.push({ page: idx + 1, pageId: p.id, clearanceMm: 0, status: 'COVER' });
        return;
      }

      const children = Array.from(content.querySelectorAll('*'));
      let maxBottom = content.getBoundingClientRect().top;
      children.forEach(c => {
        const r = c.getBoundingClientRect();
        if (r.bottom > maxBottom) {
          maxBottom = r.bottom;
        }
      });

      const footerTop = footer.getBoundingClientRect().top;
      const gapPx = footerTop - maxBottom;
      const gapMm = gapPx * 0.264583;

      results.push({
        page: idx + 1,
        pageId: p.id,
        clearanceMm: parseFloat(gapMm.toFixed(1)),
        clearancePx: parseFloat(gapPx.toFixed(1)),
        isOverflow: gapMm < 0
      });
    });

    return results;
  });

  let hasOverflow = false;
  clearanceReport.forEach(r => {
    if (r.status === 'COVER') {
      console.log(`  Page ${String(r.page).padStart(2)} (${r.pageId}): [COVER FRAME - OK]`);
    } else {
      const status = r.isOverflow ? '❌ OVERFLOW' : '✓ OK';
      console.log(`  Page ${String(r.page).padStart(2)} (${r.pageId}): Clearance = ${r.clearanceMm} mm (${r.clearancePx} px) [${status}]`);
      if (r.isOverflow) hasOverflow = true;
    }
  });

  if (hasOverflow) {
    throw new Error(`Audit FAILED for ${htmlFileName}: Negative clearance detected!`);
  }

  // 3. Single-Row Discipline
  const wrappingAudit = await page.evaluate(() => {
    const issues = [];

    document.querySelectorAll('.task-badge').forEach(b => {
      if (b.getClientRects().length > 1) {
        issues.push(`Task badge wrapped: "${b.textContent.trim()}"`);
      }
    });

    document.querySelectorAll('.task-title').forEach(t => {
      if (t.offsetHeight > 26) {
        issues.push(`Task title height exceeded (${t.offsetHeight}px): "${t.textContent.trim()}"`);
      }
    });

    document.querySelectorAll('h1, h2, h3').forEach(h => {
      if (h.getClientRects().length > 1) {
        issues.push(`Heading wrapped: "${h.textContent.trim()}"`);
      }
    });

    document.querySelectorAll('.toc-title').forEach(toc => {
      if (toc.getClientRects().length > 1) {
        issues.push(`TOC row wrapped: "${toc.textContent.trim()}"`);
      }
    });

    return issues;
  });

  if (wrappingAudit.length > 0) {
    console.error(`Wrapping issues:`, wrappingAudit);
    throw new Error(`Single-row discipline violated in ${htmlFileName}!`);
  }
  console.log(`✓ Single-row discipline PASSED (0 wrapped elements).`);

  // 4. Export PDF
  await page.pdf({
    path: pdfPath,
    format: 'A5',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    preferCSSPageSize: true
  });

  await page.close();
  const stats = fs.statSync(pdfPath);
  console.log(`✓ Exported ${pdfFileName} (${stats.size} bytes)`);
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    await auditManual(browser, 'ireside-user-manual.html', 'ireside-user-manual.pdf', 16);
    await auditManual(browser, 'ireside-user-manual-text.html', 'ireside-user-manual-text.pdf', 16);
    await auditManual(browser, 'ireside-it-manual.html', 'ireside-it-manual.pdf', 16);
    await auditManual(browser, 'ireside-manual-unified.html', 'ireside-manual-unified.pdf', 32);
    await auditManual(browser, 'ireside-manual-unified-text.html', 'ireside-manual-unified-text.pdf', 32);
    console.log('\n======================================================');
    console.log('ALL AUDITS PASSED WITH 100% COMPLIANCE!');
    console.log('======================================================');
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
