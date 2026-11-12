import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourceFile = path.join(__dirname, 'generate-manual-variants.mjs');

let code = fs.readFileSync(sourceFile, 'utf-8');

// 1. Add Cover Page CSS before </style>
const coverCss = `
    /* ======================================================================= */
    /* DEDICATED ENTERPRISE COVER PAGE (PAGE 1)                                */
    /* ======================================================================= */
    .page#page-1.cover-page {
      padding: 10mm !important;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 1px solid #ccc;
    }

    .cover-frame {
      border: 2px solid #111;
      height: 100%;
      padding: 5.5mm 6.5mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      background: #ffffff;
    }

    .cover-header-group {
      border-bottom: 2px solid #111;
      padding-bottom: 3mm;
    }

    .cover-org-title {
      font-size: 26pt;
      font-weight: 900;
      line-height: 1;
      letter-spacing: -0.6px;
      color: #000;
      margin: 0;
    }

    .cover-org-subtitle {
      font-size: 8pt;
      font-weight: 700;
      color: #333;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-top: 1.2mm;
    }

    .cover-main-body {
      margin: 3mm 0;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .cover-badge-pill {
      display: inline-block;
      border: 1.5px solid #000;
      padding: 0.8mm 2.8mm;
      font-size: 7.2pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3mm;
      background: #f7f7f7;
      border-radius: 3px;
    }

    .cover-primary-title {
      font-size: 20pt;
      font-weight: 900;
      line-height: 1.15;
      letter-spacing: -0.5px;
      color: #000;
      margin: 0 0 1.2mm 0;
    }

    .cover-secondary-title {
      font-size: 10.5pt;
      font-weight: 800;
      color: #333;
      letter-spacing: 0.5px;
      margin-bottom: 2.8mm;
      text-transform: uppercase;
    }

    .cover-synopsis {
      font-size: 9pt;
      line-height: 1.32;
      color: #222;
      margin: 0;
      max-width: 96%;
    }

    .cover-emblem-box {
      margin: 3mm 0;
      align-self: center;
      text-align: center;
    }

    .cover-doc-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #222;
      background: #fafafa;
      font-size: 7.2pt;
      margin-top: auto;
      margin-bottom: 2.5mm;
    }

    .cover-doc-table td {
      padding: 1mm 1.8mm;
      border: 1px solid #ddd;
      vertical-align: middle;
    }

    .cover-doc-table .meta-label {
      width: 32%;
      font-weight: 800;
      color: #222;
      background: #eeeeee;
      text-transform: uppercase;
      letter-spacing: 0.35px;
      font-size: 6.6pt;
    }

    .cover-doc-table .meta-value {
      width: 68%;
      font-weight: 600;
      color: #111;
    }

    .cover-footer-note {
      border-top: 1px solid #ccc;
      padding-top: 1.8mm;
      font-size: 6.8pt;
      color: #555;
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
`;

// Replace </style> with coverCss + </style>
code = code.replace('  </style>', coverCss + '\n  </style>');

// 2. Generate Page 1 (Dedicated Cover) and Page 2 (TOC & Scope)
const newPage1And2 = `  <!-- ========================================================================= -->
  <!-- PAHINA 1: OPISYAL NA ENTERPRISE COVER PAGE                                -->
  <!-- ========================================================================= -->
  <div class="page cover-page" id="page-1">
    <div class="cover-frame">
      <div class="cover-header-group">
        <h1 class="cover-org-title">iReside</h1>
        <div class="cover-org-subtitle">Property Operations Platform &bull; Tenancy Management</div>
      </div>

      <div class="cover-main-body">
        <div class="cover-badge-pill">Official Standard Operating Guide</div>
        <div class="cover-primary-title">Gabay sa Paggamit</div>
        <div class="cover-secondary-title">USER MANUAL</div>
        <p class="cover-synopsis">
          Opisyal na gabay sa pamamahala ng paupahan, buwanang singilin, submetering, at maintenance para sa mga Landlord at mga Tenant.
        </p>
      </div>

      <div class="cover-emblem-box">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="#222" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="14" y="8" width="36" height="48" rx="2" fill="#fafafa"/>
          <line x1="22" y1="16" x2="28" y2="16"/>
          <line x1="36" y1="16" x2="42" y2="16"/>
          <line x1="22" y1="24" x2="28" y2="24"/>
          <line x1="36" y1="24" x2="42" y2="24"/>
          <line x1="22" y1="32" x2="28" y2="32"/>
          <line x1="36" y1="32" x2="42" y2="32"/>
          <line x1="22" y1="40" x2="28" y2="40"/>
          <line x1="36" y1="40" x2="42" y2="40"/>
          <path d="M28 56V48H36V56"/>
        </svg>
      </div>

      <table class="cover-doc-table">
        <tr>
          <td class="meta-label">Document ID</td>
          <td class="meta-value">DOC REF: IR-UM-2026-V1</td>
        </tr>
        <tr>
          <td class="meta-label">Bersyon</td>
          <td class="meta-value">Release 1.0 (Production Release &bull; 2026)</td>
        </tr>
        <tr>
          <td class="meta-label">Audience</td>
          <td class="meta-value">Property Owners, Landlords, and Residents (Tenants)</td>
        </tr>
        <tr>
          <td class="meta-label">Plataporma</td>
          <td class="meta-value">Next.js Web Hub &bull; Android Mobile Application</td>
        </tr>
        <tr>
          <td class="meta-label">Pilot Scope</td>
          <td class="meta-value">Barangay Marulas Pilot Implementation, Valenzuela City</td>
        </tr>
      </table>

      <div class="cover-footer-note">
        <span>Nilimbag ng iReside Documentation &amp; Systems Team</span>
        <span>Strictly Monochrome Grayscale Edition</span>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 2: TALAAN NG NILALAMAN AT SAKLAW                                   -->
  <!-- ========================================================================= -->
  <div class="page" id="page-2">
    <div class="running-header">
      <span class="app-brand">iReside Portal</span>
      <span>Talaan ng Nilalaman at Saklaw</span>
    </div>

    <div class="content">
      <h2>Talaan ng Nilalaman</h2>
      <table class="toc-table">
        <tr>
          <td class="toc-title">1. Pagsisimula: Mga Kailangan at Pag-login</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 3</td>
        </tr>
        <tr>
          <td class="toc-title">2. Pagsisimula: Pag-install ng App at Spare Key</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 4</td>
        </tr>
        <tr>
          <td class="toc-title">3. Gabay sa Tenant: Kontrata at Buwanang Bills</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 5</td>
        </tr>
        <tr>
          <td class="toc-title">4. Gabay sa Tenant: Pagbabayad ng Renta at Bills</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 6</td>
        </tr>
        <tr>
          <td class="toc-title">5. Gabay sa Tenant: Maintenance at Chat sa Landlord</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 7</td>
        </tr>
        <tr>
          <td class="toc-title">6. Gabay sa Tenant: Pag-alis at Spare Key Login</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 8</td>
        </tr>
        <tr>
          <td class="toc-title">7. Gabay sa Landlord: Gusali at Interactive Unit Map</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 9</td>
        </tr>
        <tr>
          <td class="toc-title">8. Gabay sa Landlord: Singilin at Pagpasok ng Tenant</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 10</td>
        </tr>
        <tr>
          <td class="toc-title">9. Gabay sa Landlord: Pag-verify ng Bayad at Metro</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 11</td>
        </tr>
        <tr>
          <td class="toc-title">10. Gabay sa Landlord: Maintenance at Mga Anunsyo</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 12</td>
        </tr>
        <tr>
          <td class="toc-title">11. Gabay sa Landlord: Move-Out, Ledger at Reports</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 13</td>
        </tr>
        <tr>
          <td class="toc-title">12. Solusyon sa Karaniwang Problema (Troubleshooting)</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 14</td>
        </tr>
        <tr>
          <td class="toc-title">13. Mga Payong Pangkaligtasan at FAQs</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 15</td>
        </tr>
        <tr>
          <td class="toc-title">14. Suporta, Helpline, at Talasalitaan</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 16</td>
        </tr>
      </table>

      <h2>Layunin at Saklaw (Purpose &amp; Scope)</h2>
      <p>Ang <strong>iReside</strong> ay isang web portal para sa mga paupahan sa Pilipinas.</p>
      <p>Pinapabilis nito ang pamamahala sa buwanang renta, billing, at maintenance requests.</p>
      <p>Ang gabay na ito ay para sa mga <strong>Landlord</strong> at mga <strong>Tenant</strong>.</p>
      <p>Naglalaman ito ng opisyal na hakbang para sa bawat transaksyon ng system.</p>
    </div>

    <div class="running-footer">
      <span>iReside User Manual &bull; Bersyon 1.0</span>
      <span class="page-number">Pahina 2 ng 16</span>
    </div>
  </div>`;

// Replace Page 1 with new Page 1 and Page 2
const oldPage1Regex = /<!-- =+ -->\s*<!-- PAHINA 1:[\s\S]*?<\/div>\s*<\/div>/;
code = code.replace(oldPage1Regex, newPage1And2);

// Re-map pages 2 through 13 to be pages 3 through 14
for (let oldP = 13; oldP >= 2; oldP--) {
  const newP = oldP + 1;
  const pageRegex = new RegExp(`<!-- =+ -->\\s*<!-- PAHINA ${oldP}:([\\s\\S]*?)<div class="page" id="page-${oldP}">([\\s\\S]*?)<span class="page-number">Pahina ${oldP}</span>`, 'g');
  code = code.replace(pageRegex, (match, comment, body) => {
    return `<!-- ========================================================================= -->\n  <!-- PAHINA ${newP}:${comment}<div class="page" id="page-${newP}">\n${body}<span class="page-number">Pahina ${newP} ng 16</span>`;
  });
}

// Re-map Page 14 & 15 to combined Page 15 & Page 16
const oldPages14To16Regex = /<!-- =+ -->\s*<!-- PAHINA 14:[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\n\s*<\/body>/;

const newPages15And16 = `  <!-- ========================================================================= -->
  <!-- PAHINA 15: MGA KARANIWANG PROBLEMA AT KALIGTASAN                          -->
  <!-- ========================================================================= -->
  <div class="page" id="page-15">
    <div class="running-header">
      <span class="app-brand">Seguridad at Troubleshooting</span>
      <span>Karaniwang Problema at Kaligtasan</span>
    </div>

    <div class="content">
      <h2>Mga Karaniwang Problema at Solusyon</h2>

      <div class="qa-item">
        <div class="qa-question">1. Nakalimutan ko ang aking password. Ano ang gagawin ko?</div>
        <p class="qa-answer">Sa login screen, pindutin ang <strong>Forgot Password?</strong>. I-type ang iyong email upang makatanggap ng link. Kung mayroon kang Emergency Spare Key, gamitin ito upang buksan agad ang account.</p>
      </div>

      <div class="qa-item">
        <div class="qa-question">2. Hindi dumarating ang 6-digit code sa aking email.</div>
        <p class="qa-answer">Tingnan ang iyong Spam o Junk folder. Siguraduhing tama ang spelling ng email. Maghintay ng 60 segundo at pindutin ang <strong>Resend Code</strong> button.</p>
      </div>

      <div class="qa-item">
        <div class="qa-question">3. Ayaw pumasok o mag-upload ng litrato ng resibo.</div>
        <p class="qa-answer">Suriin kung malakas ang internet o mobile data. Kung masyadong malaki ang file, kumuha ng bagong screenshot ng resibo bago i-upload muli.</p>
      </div>

      <div class="qa-item">
        <div class="qa-question">4. May mali sa pangalan o renta sa aking kontrata.</div>
        <p class="qa-answer">Huwag munang pirmahan ang kontrata. Magpadala agad ng chat sa landlord sa pamamagitan ng <strong>Messages</strong> upang maiwasto ang detalye.</p>
      </div>

      <div class="qa-item">
        <div class="qa-question">5. Nagbayad na ako sa GCash pero "Unpaid" pa rin ang status.</div>
        <p class="qa-answer">Kailangan munang kumpirmahin ng landlord ang bayad. Pagkapindot ng <strong>Confirm & Issue Receipt</strong>, lalabas ang opisyal na resibo.</p>
      </div>

      <div class="qa-item">
        <div class="qa-question">6. Naka-lock ang ilang menu sa kaliwa (may padlock icon).</div>
        <p class="qa-answer">Tapusin muna ang naunang hakbang sa onboarding. Kusang magbubukas ang iba pang menu.</p>
      </div>

      <h2>Mga Payong Pangkaligtasan (Safety Tips)</h2>
      <ul>
        <li><strong>Lihim na Password:</strong> Huwag ibahagi ang password kahit kanino. Gumamit ng titik at numero.</li>
        <li><strong>Itago ang Emergency Key:</strong> I-save ang spare key sa sariling flash drive o kwaderno.</li>
        <li><strong>Mag-ingat sa Pekeng Mensahe:</strong> Huwag mag-log in sa mga link sa text. Gamitin ang opisyal na website.</li>
        <li><strong>I-save ang Resibo:</strong> Kumuha ng screenshot ng reference number at itago ang digital resibo.</li>
        <li><strong>Proteksyon sa Impormasyon:</strong> Naka-encrypt ang iyong mga ID. Ang landlord lamang ang makakakita nito.</li>
      </ul>
    </div>

    <div class="running-footer">
      <span>iReside User Manual &bull; Bersyon 1.0</span>
      <span class="page-number">Pahina 15 ng 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 16: FAQS, TULONG, TALASALITAAN, AT CONTACT DETAILS                 -->
  <!-- ========================================================================= -->
  <div class="page" id="page-16">
    <div class="running-header">
      <span class="app-brand">Tulong at Talasalitaan</span>
      <span>FAQs, Helpline at Gabay sa Salita</span>
    </div>

    <div class="content">
      <h2>Mga Madalas Itanong (FAQs)</h2>

      <div class="qa-item">
        <div class="qa-question">T: Pwede bang mag-log in sa dalawang cellphone nang sabay?</div>
        <p class="qa-answer">S: Oo. Maaari kang mag-log in sa cellphone at computer gamit ang iisang account.</p>
      </div>

      <div class="qa-item">
        <div class="qa-question">T: Libre ba ang paggamit ng app para sa tenant?</div>
        <p class="qa-answer">S: Oo, libre ang app para sa lahat ng mga rehistradong tenant.</p>
      </div>

      <div class="qa-item">
        <div class="qa-question">T: Paano kung mawalan ng kuryente habang nagbabasa ng metro?</div>
        <p class="qa-answer">S: Kusang naitatabi ang iyong mga ginagawa sa system, kaya hindi mawawala ang iyong na-type.</p>
      </div>

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

      <p style="font-size: 7.6pt; color: #666; text-align: center; margin-top: 1.8mm; border-top: 1px solid #ddd; padding-top: 1mm;">
        &copy; 2026 iReside Technologies. All rights reserved. Nilimbag para sa pampublikong gabay.
      </p>
    </div>

    <div class="running-footer">
      <span>iReside User Manual &bull; Bersyon 1.0</span>
      <span class="page-number">Pahina 16 ng 16</span>
    </div>
  </div>

</div>

</body>`;

code = code.replace(oldPages14To16Regex, newPages15And16);

fs.writeFileSync(sourceFile, code, 'utf-8');
console.log('Successfully updated scripts/generate-manual-variants.mjs with dedicated Enterprise Cover Page!');
