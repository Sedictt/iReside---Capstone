import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 559, height: 794, deviceScaleFactor: 2 });
  
  const testHtml = `<!DOCTYPE html><html><head><style>
    @page { size: A5 portrait; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: -apple-system, sans-serif; font-size: 8.8pt; line-height: 1.22; }
    .page { width: 148mm; height: 210mm; padding: 12mm 16mm 12mm 12mm; display: flex; flex-direction: column; justify-content: space-between; }
    .running-header { border-bottom: 1px solid #111; padding-bottom: 1.2mm; margin-bottom: 1.8mm; font-size: 8.5pt; font-weight: 700; text-transform: uppercase; }
    .running-footer { border-top: 1px solid #ccc; padding-top: 1.2mm; margin-top: 1.8mm; font-size: 8.5pt; }
    .content { flex: 1; overflow: hidden; }
    h2 { font-size: 10.5pt; font-weight: 800; margin: 1mm 0 0.6mm 0; border-bottom: 1px solid #e0e0e0; padding-bottom: 0.4mm; }
    .qa-item { margin-bottom: 1mm; }
    .qa-question { font-weight: 800; font-size: 8.8pt; margin-bottom: 0.2mm; }
    .qa-answer { font-size: 8.8pt; line-height: 1.22; margin: 0; }
    ul { margin: 0 0 1mm 0; padding-left: 14px; }
    li { margin-bottom: 0.4mm; font-size: 8.8pt; line-height: 1.22; }
    .warning-box { border-left: 3px solid #000; background: #f1f1f1; padding: 0.8mm 1.8mm; margin: 0.8mm 0 1.2mm 0; font-size: 8.4pt; line-height: 1.22; font-weight: 600; }
    .glossary-item { margin-bottom: 0.6mm; font-size: 8.6pt; line-height: 1.20; }
    .glossary-term { font-weight: 800; color: #000; }
  </style></head><body>
  <div class="page">
    <div class="running-header"><span>Tulong at Talasalitaan</span><span>FAQs, Helpline at Gabay sa Salita</span></div>
    <div class="content">
      <h2>Mga Madalas Itanong (FAQs)</h2>
      <div class="qa-item"><div class="qa-question">T: Pwede bang mag-log in sa dalawang cellphone nang sabay?</div><p class="qa-answer">S: Oo. Maaari kang mag-log in sa cellphone at computer gamit ang iisang account.</p></div>
      <div class="qa-item"><div class="qa-question">T: Libre ba ang paggamit ng app para sa tenant?</div><p class="qa-answer">S: Oo, libre ang app para sa lahat ng mga rehistradong tenant.</p></div>
      <div class="qa-item"><div class="qa-question">T: Paano kung mawalan ng kuryente habang nagbabasa ng metro?</div><p class="qa-answer">S: Kusang naitatabi ang iyong mga ginagawa sa system, kaya hindi mawawala ang iyong na-type.</p></div>

      <h2>Saan Kukuha ng Tulong at Suporta</h2>
      <ul>
        <li><strong>Email Support:</strong> support@ireside.app</li>
        <li><strong>Helpline:</strong> (02) 8123-4567 o +63 917 123 4567</li>
        <li><strong>Opisyal na Website:</strong> https://i-reside-capstone.vercel.app</li>
        <li><strong>Oras ng Tanggapan:</strong> Lunes hanggang Biyernes, 8:00 AM – 5:00 PM</li>
      </ul>
      <div class="warning-box">
        Sa oras ng emergency: Tumawag agad sa hotline 911 o sa barangay hall.
      </div>

      <h2>Maikling Talasalitaan (Glossary)</h2>
      <div class="glossary-item"><span class="glossary-term">Account:</span> Ang iyong sariling profile gamit ang email at password.</div>
      <div class="glossary-item"><span class="glossary-term">Dashboard:</span> Ang unang pahina na nagpapakita ng buod ng iyong paupahan.</div>
      <div class="glossary-item"><span class="glossary-term">Download:</span> Pag-save ng file o resibo sa iyong sariling gamit.</div>
      <div class="glossary-item"><span class="glossary-term">Due Date:</span> Ang takdang araw kung kailan dapat bayaran ang bills.</div>
      <div class="glossary-item"><span class="glossary-term">E-Signature:</span> Digital na pirma gamit ang daliri o mouse sa screen.</div>
      <div class="glossary-item"><span class="glossary-term">Lease:</span> Legal na kasunduan o kontrata sa pag-upa ng kuwarto.</div>
      <div class="glossary-item"><span class="glossary-term">Password:</span> Lihim na salita o numero para sa seguridad ng account.</div>
      <div class="glossary-item"><span class="glossary-term">QR Code:</span> Parisukat na barcode na ini-scan upang magbayad o mag-download.</div>
      <div class="glossary-item"><span class="glossary-term">Submeter:</span> Sariling metro ng kuryente o tubig sa bawat kuwarto.</div>
      <div class="glossary-item"><span class="glossary-term">2FA:</span> Karagdagang 6-digit code sa email para sa dagdag na proteksyon.</div>
      <div class="glossary-item"><span class="glossary-term">Upload:</span> Pagpapadala ng file o litrato mula sa phone papunta sa system.</div>

      <p style="font-size: 7.2pt; color: #666; text-align: center; margin-top: 1.5mm; border-top: 1px solid #ddd; padding-top: 0.8mm;">
        &copy; 2026 iReside Technologies. All rights reserved. Nilimbag para sa pampublikong gabay.
      </p>
    </div>
    <div class="running-footer"><span>iReside User Manual • Bersyon 1.0</span><span>Pahina 16 ng 16</span></div>
  </div>
  </body></html>`;
  
  await page.setContent(testHtml, { waitUntil: 'load' });
  const data = await page.evaluate(() => {
    const content = document.querySelector('.content');
    return {
      contentHeight: content.clientHeight,
      contentScroll: content.scrollHeight,
      remainingPx: content.clientHeight - content.scrollHeight,
      overflow: content.scrollHeight > content.clientHeight
    };
  });
  console.log('Page 16 test:', data);
  await browser.close();
})();
