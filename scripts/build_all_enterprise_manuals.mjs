import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import { buildUserManualHtml } from './generate_user_manual_html.mjs';
import { buildUserManualEnHtml } from './generate_user_manual_en_html.mjs';
import { buildItManualHtml } from './generate_it_manual_html.mjs';
import { buildUnifiedManualHtml } from './generate_unified_manual_html.mjs';
import { buildUnifiedManualEnHtml } from './generate_unified_manual_en_html.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const manualDir = path.join(__dirname, '..', 'docs', 'manual');

async function auditAndExportPdf(browser, htmlFileName, pdfFileName, expectedPages) {
  const htmlPath = path.join(manualDir, htmlFileName);
  const pdfPath = path.join(manualDir, pdfFileName);

  console.log(`\n======================================================`);
  console.log(`Auditing & Exporting: ${htmlFileName} -> ${pdfFileName}`);
  console.log(`Expected Pages: ${expectedPages}`);
  console.log(`======================================================`);

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
  await page.goto('file://' + path.resolve(htmlPath).replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

  // 1. Audit Page Count
  const actualPages = await page.evaluate(() => document.querySelectorAll('.page').length);
  if (actualPages !== expectedPages) {
    throw new Error(`Page count mismatch for ${htmlFileName}: expected ${expectedPages}, got ${actualPages}`);
  }

  // 2. Audit Page Heights & Clearance
  const pageAudit = await page.evaluate(() => {
    const pageNodes = document.querySelectorAll('.page');
    const results = [];

    pageNodes.forEach((p, idx) => {
      const pageId = p.id || `page-${idx + 1}`;
      const header = p.querySelector('.running-header');
      const footer = p.querySelector('.running-footer');
      const content = p.querySelector('.content') || p.querySelector('.cover-frame');

      if (p.classList.contains('cover-page') || !footer || !content) {
        results.push({
          index: idx + 1,
          pageId,
          clearanceMm: 0,
          clearancePx: 0,
          usedPx: p.getBoundingClientRect().height,
          availablePx: p.getBoundingClientRect().height,
          isOverflow: false,
          isCover: true
        });
        return;
      }

      // Check bottom-most child inside content
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
        index: idx + 1,
        pageId,
        clearanceMm: parseFloat(gapMm.toFixed(1)),
        clearancePx: parseFloat(gapPx.toFixed(1)),
        usedPx: parseFloat((maxBottom - content.getBoundingClientRect().top).toFixed(1)),
        availablePx: parseFloat((footerTop - content.getBoundingClientRect().top).toFixed(1)),
        isOverflow: gapMm < 0,
        isCover: false
      });
    });

    return results;
  });

  let hasClearanceViolation = false;
  pageAudit.forEach(r => {
    let status = '✓ OK';
    if (r.isCover) {
      status = '✓ COVER';
    } else if (r.isOverflow) {
      status = '❌ OVERFLOW';
      hasClearanceViolation = true;
    } else if (r.clearanceMm < 15.0 || r.clearanceMm > 35.0) {
      status = `❌ OUT OF WINDOW (${r.clearanceMm}mm not in 15-35mm)`;
      hasClearanceViolation = true;
    }
    console.log(`  Page ${String(r.index).padStart(2)} (${r.pageId}): Clearance = ${r.clearanceMm} mm (${r.clearancePx} px) [${status}]`);
  });

  if (hasClearanceViolation) {
    throw new Error(`Audit FAILED for ${htmlFileName}: One or more pages violate the 15mm-35mm clearance window!`);
  }


  // 3. Audit Single-Row Discipline (NO 2-ROW WRAPPING)
  const wrappingAudit = await page.evaluate(() => {
    const issues = [];

    // Check .task-badge
    document.querySelectorAll('.task-badge').forEach(b => {
      const rects = b.getClientRects();
      if (rects.length > 1) {
        issues.push(`Task badge wrapped into multiple lines: "${b.textContent.trim()}"`);
      }
    });

    // Check .task-title
    document.querySelectorAll('.task-title').forEach(t => {
      if (t.offsetHeight > 26) {
        issues.push(`Task title height exceeded single-line limit (${t.offsetHeight}px): "${t.textContent.trim()}"`);
      }
    });

    // Check section headings
    document.querySelectorAll('h1, h2, h3').forEach(h => {
      const r = document.createRange();
      r.selectNodeContents(h);
      if (r.getClientRects().length > 1) {
        issues.push(`Heading wrapped into multiple lines: "${h.textContent.trim()}"`);
      }
    });

    // Check TOC titles
    document.querySelectorAll('.toc-title').forEach(toc => {
      const r = document.createRange();
      r.selectNodeContents(toc);
      if (r.getClientRects().length > 1) {
        issues.push(`TOC row wrapped into multiple lines: "${toc.textContent.trim()}"`);
      }
    });

    return issues;
  });

  if (wrappingAudit.length > 0) {
    console.error(`\n❌ Wrapping issues found in ${htmlFileName}:`);
    wrappingAudit.forEach(i => console.error(`  - ${i}`));
    throw new Error(`Single-row discipline violated in ${htmlFileName}!`);
  } else {
    console.log(`✓ Single-row discipline PASSED: 0 wrapped badges, headings, or TOC rows.`);
  }

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
  console.log(`✓ Generated ${pdfFileName}: ${stats.size} bytes`);
}

async function main() {
  console.log('Generating English & Filipino enterprise manual files...');

  // ================= ENGLISH MANUAL EDITIONS =================
  // 1. English User Manual (With Screenshots)
  const userEnScreenHtml = buildUserManualEnHtml({ withScreenshots: true });
  fs.writeFileSync(path.join(manualDir, 'ireside-user-manual-en.html'), userEnScreenHtml, 'utf-8');
  console.log('✓ Generated docs/manual/ireside-user-manual-en.html (16 pages)');

  // 2. English User Manual (Text-Only)
  const userEnTextHtml = buildUserManualEnHtml({ withScreenshots: false });
  fs.writeFileSync(path.join(manualDir, 'ireside-user-manual-en-text.html'), userEnTextHtml, 'utf-8');
  console.log('✓ Generated docs/manual/ireside-user-manual-en-text.html (16 pages)');

  // 3. English Unified Manual (With Screenshots)
  const unifiedEnScreenHtml = buildUnifiedManualEnHtml({ withScreenshots: true });
  fs.writeFileSync(path.join(manualDir, 'ireside-manual-unified-en.html'), unifiedEnScreenHtml, 'utf-8');
  console.log('✓ Generated docs/manual/ireside-manual-unified-en.html (32 pages)');

  // 4. English Unified Manual (Text-Only)
  const unifiedEnTextHtml = buildUnifiedManualEnHtml({ withScreenshots: false });
  fs.writeFileSync(path.join(manualDir, 'ireside-manual-unified-en-text.html'), unifiedEnTextHtml, 'utf-8');
  console.log('✓ Generated docs/manual/ireside-manual-unified-en-text.html (32 pages)');

  // ================= TECHNICAL & FILIPINO EDITIONS =================
  // 5. IT Technical Manual (English - 16 pages)
  const itHtml = buildItManualHtml();
  fs.writeFileSync(path.join(manualDir, 'ireside-it-manual.html'), itHtml, 'utf-8');
  console.log('✓ Generated docs/manual/ireside-it-manual.html (16 pages)');

  // 6. Filipino User Manual (With Screenshots)
  const userScreenHtml = buildUserManualHtml({ withScreenshots: true });
  fs.writeFileSync(path.join(manualDir, 'ireside-user-manual.html'), userScreenHtml, 'utf-8');
  fs.writeFileSync(path.join(manualDir, 'ireside-user-manual-with-screens.html'), userScreenHtml, 'utf-8');
  console.log('✓ Generated docs/manual/ireside-user-manual.html (16 pages)');

  // 7. Filipino User Manual (Text-Only)
  const userTextHtml = buildUserManualHtml({ withScreenshots: false });
  fs.writeFileSync(path.join(manualDir, 'ireside-user-manual-text.html'), userTextHtml, 'utf-8');
  console.log('✓ Generated docs/manual/ireside-user-manual-text.html (16 pages)');

  // 8. Filipino Unified Manual (With Screenshots)
  const unifiedScreenHtml = buildUnifiedManualHtml({ withScreenshots: true });
  fs.writeFileSync(path.join(manualDir, 'ireside-manual-unified.html'), unifiedScreenHtml, 'utf-8');
  console.log('✓ Generated docs/manual/ireside-manual-unified.html (32 pages)');

  // 9. Filipino Unified Manual (Text-Only)
  const unifiedTextHtml = buildUnifiedManualHtml({ withScreenshots: false });
  fs.writeFileSync(path.join(manualDir, 'ireside-manual-unified-text.html'), unifiedTextHtml, 'utf-8');
  console.log('✓ Generated docs/manual/ireside-manual-unified-text.html (32 pages)');

  // Verify No Forbidden Strings
  console.log('\nAuditing forbidden phrases and ASCII art across all generated files...');
  const allGenerated = [
    'ireside-user-manual-en.html',
    'ireside-user-manual-en-text.html',
    'ireside-manual-unified-en.html',
    'ireside-manual-unified-en-text.html',
    'ireside-it-manual.html',
    'ireside-user-manual.html',
    'ireside-user-manual-text.html',
    'ireside-manual-unified.html',
    'ireside-manual-unified-text.html'
  ];

  for (const f of allGenerated) {
    const raw = fs.readFileSync(path.join(manualDir, f), 'utf-8');
    if (raw.includes('TEXT-ONLY EDITION')) {
      throw new Error(`Found forbidden string "(TEXT-ONLY EDITION)" in ${f}`);
    }
    if (raw.includes('PINAG-ISANG GABAY (UNIFIED MANUAL)')) {
      throw new Error(`Found forbidden string "PINAG-ISANG GABAY (UNIFIED MANUAL)" in ${f}`);
    }
    if (raw.includes('+-------------------------------------------------------------+')) {
      throw new Error(`Found forbidden ASCII diagram in ${f}`);
    }
  }
  console.log('✓ Clean phrase audit PASSED: Zero forbidden tags or ASCII diagrams.');

  // Launch Puppeteer for Automated Audit & PDF Rendering
  console.log('\nLaunching Puppeteer for comprehensive pixel & clearance audit...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // English User Manuals
    await auditAndExportPdf(browser, 'ireside-user-manual-en.html', 'ireside-user-manual-en.pdf', 16);
    await auditAndExportPdf(browser, 'ireside-user-manual-en-text.html', 'ireside-user-manual-en-text.pdf', 16);

    // English Unified Manuals
    await auditAndExportPdf(browser, 'ireside-manual-unified-en.html', 'ireside-manual-unified-en.pdf', 32);
    await auditAndExportPdf(browser, 'ireside-manual-unified-en-text.html', 'ireside-manual-unified-en-text.pdf', 32);

    // IT Technical Manual (English)
    await auditAndExportPdf(browser, 'ireside-it-manual.html', 'ireside-it-manual.pdf', 16);

    // Filipino User Manuals
    await auditAndExportPdf(browser, 'ireside-user-manual.html', 'ireside-user-manual.pdf', 16);
    await auditAndExportPdf(browser, 'ireside-user-manual-text.html', 'ireside-user-manual-text.pdf', 16);

    // Filipino Unified Manuals
    await auditAndExportPdf(browser, 'ireside-manual-unified.html', 'ireside-manual-unified.pdf', 32);
    await auditAndExportPdf(browser, 'ireside-manual-unified-text.html', 'ireside-manual-unified-text.pdf', 32);

    console.log('\n======================================================');
    console.log('ALL ENGLISH & FILIPINO MANUALS AUDITED & EXPORTED!');
    console.log('======================================================');
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('\n❌ BUILD FAILED:', err);
  process.exit(1);
});
