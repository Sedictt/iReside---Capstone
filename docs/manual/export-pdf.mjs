import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportSinglePdf(htmlName, pdfName, expectedPages = 16) {
  const htmlPath = path.join(__dirname, htmlName);
  const pdfPath = path.join(__dirname, pdfName);

  if (!fs.existsSync(htmlPath)) {
    console.warn(`HTML file not found: ${htmlPath}`);
    return;
  }

  console.log(`Rendering: ${htmlName} -> ${pdfName} (Target: ${expectedPages} pages)`);
  const htmlUrl = 'file://' + htmlPath.replace(/\\/g, '/');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=medium']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: 559, // 148 mm * (96 / 25.4) ~ 559.37 px
      height: 794, // 210 mm * (96 / 25.4) ~ 793.7 px
      deviceScaleFactor: 2
    });

    await page.goto(htmlUrl, { waitUntil: 'load', timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);

    await page.pdf({
      path: pdfPath,
      format: 'a5',
      preferCSSPageSize: true,
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 }
    });
  } finally {
    await browser.close();
  }

  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();
  console.log(`✓ Generated ${pdfName}: ${pageCount} pages (${pdfBytes.length} bytes)`);

  if (pageCount !== expectedPages) {
    throw new Error(`Expected ${expectedPages} pages for ${pdfName}, but got ${pageCount}`);
  }
}

async function exportAllManuals() {
  console.log('Starting iReside manual PDF compilation suite...\n');

  // 1. User Manual (for Tenant and Landlord) - 16 pages
  await exportSinglePdf('ireside-user-manual.html', 'ireside-user-manual.pdf', 16);

  // 2. Technical Documentation Manual (for IT) - 16 pages
  await exportSinglePdf('ireside-it-manual.html', 'ireside-it-manual.pdf', 16);

  // 3. Unified Master Manual (for Tenant, Landlord, and IT) - 32 pages
  await exportSinglePdf('ireside-manual-unified.html', 'ireside-manual-unified.pdf', 32);

  // 4. Text-only variant for Tenant and Landlord
  if (fs.existsSync(path.join(__dirname, 'ireside-user-manual-text.html'))) {
    await exportSinglePdf('ireside-user-manual-text.html', 'ireside-user-manual-text.pdf', 16);
  }

  // 5. Illustrated variant with screens
  if (fs.existsSync(path.join(__dirname, 'ireside-user-manual-with-screens.html'))) {
    await exportSinglePdf('ireside-user-manual-with-screens.html', 'ireside-user-manual-with-screens.pdf', 16);
  }

  // 6. Unified variant without screenshots (for Tenant, Landlord, and IT) - 32 pages
  if (fs.existsSync(path.join(__dirname, 'ireside-manual-unified-text.html'))) {
    await exportSinglePdf('ireside-manual-unified-text.html', 'ireside-manual-unified-text.pdf', 32);
  }

  console.log('\nAll iReside manual deliverables successfully exported and verified:');
  console.log(' • User Manual (Tenants & Landlords): 16 pages (ireside-user-manual.pdf)');
  console.log(' • IT Technical Manual (IT & SysAdmins): 16 pages (ireside-it-manual.pdf)');
  console.log(' • Unified Master Manual (Tenants, Landlords & IT): 32 pages (ireside-manual-unified.pdf)');
}

exportAllManuals().catch((err) => {
  console.error('Error exporting PDF:', err);
  process.exit(1);
});
