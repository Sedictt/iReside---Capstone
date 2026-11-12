import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const manualDir = path.join(__dirname, '..', 'docs', 'manual');

// Base HTML template builder
function getHtmlTemplate({ withScreenshots }) {
  const title = 'iReside - Gabay sa Paggamit (User Manual)';
  const subtitle = 'Opisyal na Gabay sa Paggamit';
  const editionInfo = 'Para sa mga Umuupa (Tenants) at Nagpapaupa (Landlords) • Bersyon 1.0 (2026)';

  // Screenshot definitions
  const screen1 = `
      <div class="screenshot-figure">
        <img src="images/screen-login.png" alt="Login Screen" class="screenshot-img" />
        <div class="screenshot-caption">Larawan 1: Screen ng Pag-sign In (Email, Password, at Sign In button)</div>
      </div>`;

  const screen2 = `
      <div class="screenshot-figure">
        <img src="images/screen-finance-hub.png" alt="Finance Hub Card" class="screenshot-img" />
        <div class="screenshot-caption">Larawan 2: Finance Hub (Current Bill, Halaga ng Renta, at Due Date)</div>
      </div>`;

  const screen3 = `
      <div class="screenshot-figure">
        <img src="images/screen-maintenance-request.png" alt="Maintenance Request Form" class="screenshot-img" />
        <div class="screenshot-caption">Larawan 3: Form ng Sira (Category, Description, at Self-Repair switch)</div>
      </div>`;

  const screen4 = `
      <div class="screenshot-figure">
        <img src="images/screen-add-property.png" alt="Add Property Dialog" class="screenshot-img" />
        <div class="screenshot-caption">Larawan 4: Add Property (Property Name, Address, at Step 1 Basics)</div>
      </div>`;

  const screen5 = `
      <div class="screenshot-figure">
        <img src="images/screen-add-tenant.png" alt="Add Tenant Modal" class="screenshot-img" />
        <div class="screenshot-caption">Larawan 5: Add Tenant Modal (Onboard Residents, Invite Link, at Payment Terms)</div>
      </div>`;

  const screen6 = `
      <div class="screenshot-figure">
        <img src="images/screen-maintenance-management.png" alt="Maintenance Ticket Management" class="screenshot-img" />
        <div class="screenshot-caption">Larawan 6: Ticket Management (Request details at Mark as Completed button)</div>
      </div>`;

  // Text-only replacements (clean tips)
  const tip1 = `
      <div class="tip-box">
        Tip: Kung bago ang iyong account, hingin ang pansamantalang password sa iyong landlord.
      </div>`;

  const tip2 = `
      <div class="tip-box">
        Tip: Makikita rin sa Current Bill tab ang breakdown ng renta at mga metro.
      </div>`;

  const tip3 = `
      <div class="tip-box">
        Tip: Kunan ng malinaw na litrato ang sira bago i-upload para mabilis maaksyunan.
      </div>`;

  const tip4 = `
      <div class="tip-box">
        Tip: Maaari kang magdagdag ng maraming gusali anumang oras sa pamamagitan ng Properties menu.
      </div>`;

  const tip5 = `
      <div class="tip-box">
        Tip: Kopyahin at i-save agad ang pansamantalang password bago isara ang window.
      </div>`;

  const tip6 = `
      <div class="tip-box">
        Tip: Makikita ng lahat ng mga residente ang anunsyo sa kanilang dashboard.
      </div>`;

  return `<!DOCTYPE html>
<html lang="fil">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    /* CSS Paged Media & Print Specifications */
    @page {
      size: A5 portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: ${withScreenshots ? '10.5pt' : '11pt'};
      line-height: ${withScreenshots ? '1.32' : '1.38'};
      color: #111;
      background: #e5e7eb;
    }

    /* Screen Preview Container */
    .book-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 20px 0;
    }

    /* A5 Page Container: 148mm x 210mm */
    .page {
      width: 148mm;
      height: 210mm;
      background: #ffffff;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      page-break-after: always;
      break-after: page;
      page-break-inside: avoid;
    }

    /* Binding Edge Margins: Odd (Recto) vs Even (Verso) */
    .page:nth-child(odd) {
      padding: 12mm 12mm 12mm 16mm; /* 16mm inside left for odd pages */
    }
    .page:nth-child(even) {
      padding: 12mm 16mm 12mm 12mm; /* 16mm inside right for even pages */
    }

    /* Print Overrides */
    @media print {
      body {
        background: none;
      }
      .book-container {
        padding: 0;
        gap: 0;
      }
      .page {
        box-shadow: none;
        margin: 0;
        width: 148mm;
        height: 210mm;
      }
    }

    /* Running Header */
    .running-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 1px solid #111;
      padding-bottom: 1.5mm;
      margin-bottom: 2.5mm;
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #333;
    }

    .running-header .app-brand {
      font-weight: 800;
      color: #000;
    }

    /* Running Footer */
    .running-footer {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-top: 1px solid #ccc;
      padding-top: 1.5mm;
      margin-top: 2.2mm;
      font-size: 8.5pt;
      color: #444;
    }

    .running-footer .page-number {
      font-weight: 700;
      color: #000;
    }

    /* Content Area */
    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      overflow: hidden;
    }

    /* Headings */
    h1 {
      font-size: 16pt;
      font-weight: 800;
      line-height: 1.25;
      margin: 0 0 2mm 0;
      color: #000;
      letter-spacing: -0.3px;
    }

    h2 {
      font-size: ${withScreenshots ? '12pt' : '12.5pt'};
      font-weight: 800;
      line-height: 1.22;
      margin: ${withScreenshots ? '1.5mm 0 1mm 0' : '2mm 0 1.2mm 0'};
      color: #111;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 0.8mm;
    }

    h3 {
      font-size: 10.5pt;
      font-weight: 700;
      margin: 1.2mm 0 0.8mm 0;
      color: #111;
    }

    p {
      margin: 0 0 ${withScreenshots ? '1.5mm' : '1.8mm'} 0;
      font-size: ${withScreenshots ? '10.5pt' : '11pt'};
      line-height: ${withScreenshots ? '1.32' : '1.36'};
    }

    /* Lists */
    ol, ul {
      margin: 0 0 ${withScreenshots ? '1.5mm' : '2mm'} 0;
      padding-left: 16px;
    }

    li {
      margin-bottom: ${withScreenshots ? '0.7mm' : '1mm'};
      font-size: ${withScreenshots ? '10.5pt' : '11pt'};
      line-height: ${withScreenshots ? '1.3' : '1.34'};
    }

    /* Task Container */
    .task-block {
      margin-bottom: ${withScreenshots ? '2mm' : '2.8mm'};
    }

    .task-title {
      font-size: ${withScreenshots ? '10pt' : '10.2pt'};
      font-weight: 800;
      color: #000;
      margin: 0 0 1mm 0;
      display: flex;
      align-items: center;
      gap: 6px;
      line-height: 1.25;
      letter-spacing: -0.15px;
      white-space: nowrap;
    }

    .task-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
      flex-shrink: 0;
      font-size: 7.5pt;
      font-weight: 800;
      border: 1px solid #000;
      padding: 0.5px 4.5px;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.35px;
      line-height: 1.2;
    }

    /* Tips & Warnings */
    .tip-box {
      border-left: 3px solid #555;
      background: #f8f8f8;
      padding: 1.2mm 2.2mm;
      margin: 1.2mm 0 1.8mm 0;
      font-size: 9pt;
      line-height: 1.26;
    }

    .warning-box {
      border-left: 3.5px solid #000;
      background: #f1f1f1;
      padding: 1.2mm 2.2mm;
      margin: 1.2mm 0 1.8mm 0;
      font-size: 9pt;
      line-height: 1.26;
      font-weight: 600;
    }

    /* Monochrome / Grayscale Screenshots (Strict B&W Printing Optimized) */
    .screenshot-figure {
      border: 1px solid #777;
      background: #fafafa;
      padding: 1.2mm 1.5mm;
      margin: 1mm 0 1.5mm 0;
      border-radius: 4px;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .screenshot-img {
      max-width: 100%;
      max-height: 32mm;
      height: auto;
      display: block;
      margin: 0 auto 0.6mm auto;
      filter: grayscale(100%) contrast(120%);
      -webkit-filter: grayscale(100%) contrast(120%);
      image-rendering: -webkit-optimize-contrast;
      border: 1px solid #ccc;
      border-radius: 2px;
    }

    .screenshot-caption {
      font-size: 7.8pt;
      font-weight: 700;
      color: #222;
      line-height: 1.15;
    }

    /* Table of Contents */
    .toc-table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5mm 0 2.5mm 0;
      font-size: 9.8pt;
    }

    .toc-table td {
      padding: 0.8mm 0;
      vertical-align: bottom;
    }

    .toc-table .toc-title {
      padding-right: 4px;
      white-space: nowrap;
    }

    .toc-table .toc-leader {
      width: 100%;
      border-bottom: 1px dotted #888;
      position: relative;
      top: -3px;
    }

    .toc-table .toc-page {
      padding-left: 6px;
      text-align: right;
      font-weight: 700;
      white-space: nowrap;
    }

    /* Q&A Items */
    .qa-item {
      margin-bottom: 1.8mm;
    }

    .qa-question {
      font-weight: 800;
      font-size: 9.8pt;
      color: #000;
      margin-bottom: 0.5mm;
    }

    .qa-answer {
      font-size: 9.8pt;
      line-height: 1.28;
      color: #222;
      margin: 0;
    }

    /* Glossary Grid */
    .glossary-item {
      margin-bottom: 1.5mm;
      font-size: 9.6pt;
      line-height: 1.26;
    }

    .glossary-term {
      font-weight: 800;
      color: #000;
    }

    /* Enterprise Masthead & Document Header */
    .enterprise-masthead {
      border-bottom: 2px solid #111;
      padding-bottom: 1.8mm;
      margin-bottom: 1.8mm;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .brand-title-group {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-size: 17pt;
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -0.5px;
      color: #000;
      margin: 0;
    }

    .brand-tagline {
      font-size: 8.2pt;
      font-weight: 700;
      color: #333;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-top: 0.6mm;
    }

    .doc-meta-badge {
      text-align: right;
      font-size: 7.2pt;
      color: #444;
      line-height: 1.25;
      font-weight: 600;
    }

    .doc-meta-badge .badge-code {
      font-weight: 800;
      color: #000;
      display: block;
      letter-spacing: 0.4px;
    }

    /* Document Metadata Control Table */
    .doc-control-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 2mm;
      font-size: 7.5pt;
      background: #fafafa;
      border: 1px solid #ccc;
      border-radius: 3px;
    }

    .doc-control-table td {
      padding: 1mm 1.8mm;
      border: 1px solid #e0e0e0;
      vertical-align: middle;
    }

    .doc-control-table .control-label {
      font-weight: 800;
      color: #333;
      width: 22%;
      background: #f0f0f0;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      font-size: 6.8pt;
    }

    .doc-control-table .control-value {
      color: #111;
      width: 28%;
      font-weight: 600;
    }

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

  </style>
</head>
<body>

<div class="book-container">

    <!-- ========================================================================= -->
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
  <!-- PAHINA 3: TALAAN NG NILALAMAN AT SAKLAW                                   -->
  <!-- ========================================================================= -->
  <div class="page" id="page-3">

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
  </div>
        <div class="doc-meta-badge">
          <span class="badge-code">DOC REF: IR-UM-2026</span>
          <span>Standard Operating Guide</span>
        </div>
      </div>

      <table class="doc-control-table">
        <tr>
          <td class="control-label">Dokumento</td>
          <td class="control-value">Gabay sa Paggamit (User Manual)</td>
          <td class="control-label">Bersyon</td>
          <td class="control-value">Release 1.0 (2026)</td>
        </tr>
        <tr>
          <td class="control-label">Mga Gumagamit</td>
          <td class="control-value">Landlords &amp; Tenants</td>
          <td class="control-label">Plataporma</td>
          <td class="control-value">Web &amp; Android Client</td>
        </tr>
      </table>

      <h2>Talaan ng Nilalaman</h2>
      <table class="toc-table">
        <tr>
          <td class="toc-title">1. Pagsisimula: Mga Kailangan at Pag-login</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 2–3</td>
        </tr>
        <tr>
          <td class="toc-title">2. Gabay sa Tenant: Kontrata at Buwanang Bills</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 4–5</td>
        </tr>
        <tr>
          <td class="toc-title">3. Gabay sa Tenant: Maintenance, Chat at Pag-alis</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 6–7</td>
        </tr>
        <tr>
          <td class="toc-title">4. Gabay sa Landlord: Gusali, Mapa at Singilin</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 8–9</td>
        </tr>
        <tr>
          <td class="toc-title">5. Gabay sa Landlord: Tenant, Bayad at Metro</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 10–11</td>
        </tr>
        <tr>
          <td class="toc-title">6. Gabay sa Landlord: Sira, Anunsyo at Ulat</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 12–13</td>
        </tr>
        <tr>
          <td class="toc-title">7. Solusyon sa Problema at Seguridad</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 14–15</td>
        </tr>
        <tr>
          <td class="toc-title">8. Suporta, Helpline at Talasalitaan</td>
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
      <span>iReside User Manual • Bersyon 1.0</span>
      <span class="page-number">Pahina 1</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 2: MGA KAILANGAN BAGO MAGSIMULA AT PAG-SIGN IN                     -->
  <!-- ========================================================================= -->
  <div class="page" id="page-2">
    <div class="running-header">
      <span class="app-brand">Pagsisimula</span>
      <span>Mga Kailangan at Pag-Log In</span>
    </div>

    <div class="content">
      <h2>Mga Kailangan Bago Magsimula</h2>
      <p>Bago buksan ang iReside, ihanda ang mga sumusunod na gamit:</p>
      <ul>
        <li><strong>Smartphone o Computer:</strong> Kahit anong Android, iPhone, o laptop.</li>
        <li><strong>Internet o Mobile Data:</strong> Kailangan ng koneksyon upang makapag-load.</li>
        <li><strong>Email Address:</strong> Dito ipapadala ang mga resibo at verification code.</li>
        <li><strong>Login Details:</strong> Ang email at pansamantalang password mula sa landlord.</li>
      </ul>

      <h2>Paano Mag-Sign In sa Account</h2>
      <p>Sundin ang mga hakbang na ito upang makapasok sa iReside:</p>
      <ol>
        <li>Buksan ang browser at pumunta sa website ng iReside.</li>
        <li>I-type ang iyong rehistradong email sa kahon ng <strong>Email Address</strong>.</li>
        <li>I-type ang iyong password sa kahon ng <strong>Password</strong>.</li>
        <li>Pindutin ang <strong>Sign In</strong> button.</li>
        <li>Kung hihingin ang 2FA, buksan ang email at kopyahin ang 6-digit code.</li>
        <li>I-type ang code sa <strong>6-Digit Verification Code</strong> at pindutin ang <strong>Verify & Sign In</strong>.</li>
      </ol>

      ${withScreenshots ? screen1 : tip1}

      <div class="warning-box">
        Babala: Huwag ibigay ang iyong password o verification code kahit kanino. Lihim ito para sa iyong seguridad.
      </div>
    </div>

    <div class="running-footer">
      <span>iReside User Manual • Bersyon 1.0</span>
      <span class="page-number">Pahina 3 ng 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 4: PAG-INSTALL NG APP AT EMERGENCY SPARE KEY                       -->
  <!-- ========================================================================= -->
  <div class="page" id="page-4">

    <div class="running-header">
      <span class="app-brand">Pagsisimula</span>
      <span>Pag-install ng App at Spare Key</span>
    </div>

    <div class="content">
      <h2>Paano I-install ang App sa Phone</h2>
      <p>Maaari mong ilagay ang iReside sa iyong cellphone para mabilis buksan:</p>

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Android</span> Pag-install sa Android Phone</div>
        <ol>
          <li>Pumunta sa kaliwang menu at pindutin ang <strong>Download App</strong>.</li>
          <li>Pindutin ang <strong>Download iReside App</strong> para makuha ang APK file.</li>
          <li>Buksan ang na-download na file at pindutin ang <strong>Install</strong>.</li>
          <li>Kapag nagtanong ang phone, pindutin ang <strong>Allow</strong>.</li>
        </ol>
      </div>

      <div class="task-block">
        <div class="task-title"><span class="task-badge">iPhone</span> Paglagay sa Home Screen ng iPhone</div>
        <ol>
          <li>Buksan ang Safari browser at puntahan ang iReside.</li>
          <li>Pindutin ang <strong>Share</strong> icon sa ibaba (kahon na may arrow).</li>
          <li>Piliin ang <strong>Add to Home Screen</strong> mula sa listahan.</li>
          <li>Pindutin ang <strong>Add</strong> sa kanang itaas ng screen.</li>
        </ol>
      </div>

      <div class="tip-box">
        Tip: Pindutin ang <strong>Allow</strong> para makatanggap ng paalala sa buwanang renta at bayarin.
      </div>

      <h2>Emergency Backup Key (Spare Key ng Account)</h2>
      <p>Ang <strong>Emergency Spare Key</strong> ay ekstrang susi kung makalimutan mo ang password.</p>
      <ol>
        <li>Sa unang pag-login, lilitaw ang iyong Emergency Spare Key.</li>
        <li>Pindutin ang <strong>Download (.txt)</strong> button para mai-save ang key file.</li>
        <li>Lagyan ng tsek ang <strong>I saved or wrote down my emergency key</strong>.</li>
        <li>Pindutin ang <strong>Proceed to Sign In</strong> button upang magpatuloy.</li>
        <li>Itago ang file sa ligtas na folder o isulat sa kwaderno.</li>
      </ol>
    </div>

    <div class="running-footer">
      <span>iReside User Manual • Bersyon 1.0</span>
      <span class="page-number">Pahina 4 ng 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 5: GABAY PARA SA TENANT (1) - KONTRATA AT BILLS                    -->
  <!-- ========================================================================= -->
  <div class="page" id="page-5">

    <div class="running-header">
      <span class="app-brand">Gabay Para sa Tenant</span>
      <span>Kontrata at Mga Bayarin</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Gawain T1</span> Pumirma sa Kontrata ng Upa (Sign Lease)</div>
        <p>Bago tumira sa kuwarto, kailangang pirmahan ang digital na kasunduan:</p>
        <ol>
          <li>Sa menu, pindutin ang <strong>Leases</strong>.</li>
          <li>Sa itaas ng screen, pindutin ang <strong>Review & sign</strong> button.</li>
          <li>Basahin nang maigi ang buwanang renta, deposito, at mga patakaran.</li>
          <li>Pindutin ang <strong>Sign Document</strong> para buksan ang pirmahan.</li>
          <li>Gamitin ang iyong daliri o mouse upang gumuhit ng pirma sa screen.</li>
          <li>Pindutin ang <strong>Finalize</strong> at kumpirmahin ang iyong pirma.</li>
        </ol>
        <div class="tip-box">
          Tip: Pindutin ang <strong>Download</strong> anumang oras para sa sariling kopya ng kontrata.
        </div>
      </div>

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Gawain T2</span> Paano Tingnan ang Monthly Bills at Dues</div>
        <p>Upang malaman ang halaga ng babayaran ngayong buwan:</p>
        <ol>
          <li>Sa kaliwang menu, pindutin ang <strong>Finance Hub</strong>.</li>
          <li>Sa itaas, makikita ang kabuuang halaga sa ilalim ng <strong>Balance Due</strong>.</li>
          <li>Tingnan ang <strong>Due Date</strong> upang malaman ang huling araw ng pagbabayad.</li>
          <li>Buksan ang tab na <strong>Current Bill</strong> para sa detalye ng renta, tubig, at kuryente.</li>
        </ol>
      </div>

      ${withScreenshots ? screen2 : tip2}
    </div>

    <div class="running-footer">
      <span>iReside User Manual • Bersyon 1.0</span>
      <span class="page-number">Pahina 5 ng 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 6: GABAY PARA SA TENANT (2) - PAGBABAYAD NG RENTA                  -->
  <!-- ========================================================================= -->
  <div class="page" id="page-6">

    <div class="running-header">
      <span class="app-brand">Gabay Para sa Tenant</span>
      <span>Pagbabayad ng Renta at Bills</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Gawain T3</span> Paano Magbayad Gamit ang GCash o Maya</div>
        <p>Maaari kang magbayad gamit ang iyong e-wallet nang hindi umaalis ng bahay:</p>
        <ol>
          <li>Pumunta sa <strong>Finance Hub</strong> at pindutin ang <strong>Pay Now</strong> button.</li>
          <li>Piliin ang <strong>GCash</strong> o <strong>Maya</strong> bilang payment method.</li>
          <li>I-scan ang QR code ng landlord o kopyahin ang nakasulat na numero.</li>
          <li>Buksan ang GCash o Maya app, magbayad, at kunan ng screenshot ang resibo.</li>
          <li>Sa ilalim ng <strong>Transaction Receipt</strong>, pindutin ang <strong>Upload Screenshot</strong>.</li>
          <li>I-type ang numero sa <strong>Reference number</strong> box at pindutin ang <strong>Confirm & Settle Now</strong>.</li>
        </ol>
      </div>

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Gawain T4</span> Paano Magbayad ng Cash (Abot-Kamay)</div>
        <p>Kung nais magbayad ng pisikal na pera sa landlord:</p>
        <ol>
          <li>Sa screen ng checkout, piliin ang <strong>Cash / In-Person</strong>.</li>
          <li>Pindutin ang <strong>Notify Landlord of Payment</strong> button.</li>
          <li>Puntahan ang landlord at iabot ang eksaktong halaga ng bayad.</li>
          <li>Hintaying pindutin ng landlord ang <strong>Confirm Cash Received</strong> sa system.</li>
          <li>Sa <strong>Payment History</strong> tab, i-download ang opisyal na resibo.</li>
        </ol>
      </div>

      <div class="warning-box">
        Paalala: Siguraduhing tama ang na-type na Reference Number upang mabilis maaprubahan ang iyong bayad.
      </div>
    </div>

    <div class="running-footer">
      <span>iReside User Manual • Bersyon 1.0</span>
      <span class="page-number">Pahina 6 ng 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 7: GABAY PARA SA TENANT (3) - MAINTENANCE AT MENSAHE               -->
  <!-- ========================================================================= -->
  <div class="page" id="page-7">

    <div class="running-header">
      <span class="app-brand">Gabay Para sa Tenant</span>
      <span>Maintenance at Mensahe</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Gawain T5</span> Paano Mag-ulat ng Sira (Report Repair)</div>
        <p>Kapag may sirang ilaw, gripo, o pinto sa kuwarto, magsumite ng ticket:</p>
        <ol>
          <li>Sa kaliwang menu, pindutin ang <strong>Maintenance</strong>.</li>
          <li>Pindutin ang <strong>New Request</strong> button sa itaas.</li>
          <li>Piliin ang kategorya ng sira (Plumbing, Electrical, Furniture, o General).</li>
          <li>Sa kahon ng <strong>Description</strong>, isulat nang maikli ang nangyaring sira.</li>
          <li>Pindutin ang <strong>Upload</strong> button para maglagay ng litrato ng sira.</li>
          <li>Kung ikaw ang aayos, i-on ang switch ng <strong>Self-Repair</strong>.</li>
          <li>Pindutin ang <strong>Submit Request</strong> button.</li>
        </ol>
      </div>

      ${withScreenshots ? screen3 : tip3}

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Gawain T6</span> Paano Mag-chat sa Landlord (Messages)</div>
        <p>Para sa mga katanungan o simpleng pakikipag-ugnayan:</p>
        <ol>
          <li>Sa kaliwang menu, pindutin ang <strong>Messages</strong>.</li>
          <li>Piliin ang pangalan ng iyong landlord mula sa listahan.</li>
          <li>I-type ang iyong mensahe sa kahon sa ibaba ng chat.</li>
          <li>Pindutin ang <strong>Send</strong> button o pindutin ang Enter key.</li>
        </ol>
      </div>
    </div>

    <div class="running-footer">
      <span>iReside User Manual • Bersyon 1.0</span>
      <span class="page-number">Pahina 7 ng 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 8: GABAY PARA SA TENANT (4) - MAPA, PASILIDAD, AT MOVE-OUT         -->
  <!-- ========================================================================= -->
  <div class="page" id="page-8">

    <div class="running-header">
      <span class="app-brand">Gabay Para sa Tenant</span>
      <span>Pasilidad, Mapa, at Pag-alis</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Gawain T7</span> Paano Gamitin ang Unit Map at Facilities</div>
        <p>Maaari mong tingnan ang plano ng gusali at magreserba ng pasilidad:</p>
        <ol>
          <li>Pindutin ang <strong>Unit Map</strong> sa menu para makita ang 2D floor plan.</li>
          <li>Makikita rito kung nasaan ang iyong kuwarto, labasan, at hagdanan.</li>
          <li>Pindutin ang <strong>Facilities</strong> sa menu para sa mga amenities (gaya ng laundry).</li>
          <li>Piliin ang nais gamitin at pindutin ang <strong>Book Amenity</strong>.</li>
          <li>Piliin ang petsa at oras, tapos pindutin ang <strong>Confirm Booking</strong>.</li>
        </ol>
      </div>

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Gawain T8</span> Paano Mag-request ng Renewal o Move-Out</div>
        <p>Kung malapit nang matapos ang iyong kontrata sa pag-upa:</p>
        <ol>
          <li>Sa kaliwang menu, pindutin ang <strong>Leases</strong>.</li>
          <li>Kung nais magpatuloy sa pagtira, pindutin ang <strong>Request Renewal</strong> button.</li>
          <li>Kung aalis na sa kuwarto, pindutin ang <strong>Submit Move-Out Notice</strong>.</li>
          <li>Piliin ang iyong target na araw ng pag-alis at ilagay ang dahilan.</li>
          <li>Pindutin ang <strong>Submit Notice</strong> button.</li>
        </ol>
        <div class="tip-box">
          Tip: Magsumite ng notice 30 araw bago umalis para maayos ang inspeksyon at refund.
        </div>
      </div>
    </div>

    <div class="running-footer">
      <span>iReside User Manual • Bersyon 1.0</span>
      <span class="page-number">Pahina 8 ng 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 9: GABAY PARA SA LANDLORD (1) - 5 HAKBANG AT PROPERTY SETUP       -->
  <!-- ========================================================================= -->
  <div class="page" id="page-9">

    <div class="running-header">
      <span class="app-brand">Gabay Para sa Landlord</span>
      <span>5-Stage Onboarding at Gusali</span>
    </div>

    <div class="content">
      <h2>Ang 5-Stage Onboarding ng Landlord</h2>
      <p>Kapag bago ang landlord account, kailangang tapusin ang 5 hakbang:</p>
      <ol>
        <li><strong>Step 1: Property Setup:</strong> Pagrehistro ng gusali at mga unit.</li>
        <li><strong>Step 2: Unit Map Layout:</strong> Paggawa ng visual 2D layout ng mga palapag.</li>
        <li><strong>Step 3: Utility & Billing Rails:</strong> Pag-set ng rate sa kuryente, tubig, at GCash.</li>
        <li><strong>Step 4: Tenant Onboarding:</strong> Pagpasok ng unang tenant sa kuwarto.</li>
        <li><strong>Step 5: Dashboard Overview:</strong> Pagsisimula ng regular na pamamahala.</li>
      </ol>

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Gawain L1</span> Paano Magdagdag ng Bagong Property at Units</div>
        <p>Para irehistro ang iyong bagong paupahan sa system:</p>
        <ol>
          <li>Sa kaliwang menu, pindutin ang <strong>Properties</strong>.</li>
          <li>Pindutin ang <strong>Add Property</strong> button sa itaas.</li>
          <li>I-type ang pangalan ng gusali sa kahon ng <strong>Property Name</strong>.</li>
          <li>Piliin ang uri ng gusali: <strong>Apartment</strong>, <strong>Dormitory</strong>, o <strong>Boarding House</strong>.</li>
          <li>Pindutin ang <strong>Continue</strong> at ilagay ang units, floors, at address.</li>
          <li>Ilagay ang <strong>Base Monthly Rent</strong> at pindutin ang <strong>Continue</strong>.</li>
          <li>Pindutin ang <strong>Complete & Save Property</strong> button.</li>
        </ol>
      </div>

      ${withScreenshots ? screen4 : tip4}
    </div>

    <div class="running-footer">
      <span>iReside User Manual • Bersyon 1.0</span>
      <span class="page-number">Pahina 9 ng 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 10: GABAY PARA SA LANDLORD (2) - UNIT MAP AT BILLING RAILS          -->
  <!-- ========================================================================= -->
  <div class="page" id="page-10">

    <div class="running-header">
      <span class="app-brand">Gabay Para sa Landlord</span>
      <span>Unit Map at Billing Rails</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Gawain L2</span> Paano Isaayos ang Interactive Unit Map</div>
        <p>Gumawa ng malinaw na mapa ng bawat palapag para sa madaling pamamahala:</p>
        <ol>
          <li>Sa menu, pindutin ang <strong>Unit Map</strong>.</li>
          <li>Pumili ng layout preset (gaya ng <strong>Double Loaded</strong> o <strong>Single Loaded</strong>).</li>
          <li>I-drag at i-drop ang mga kahon ng unit upang itugma sa ayos ng iyong pasilyo.</li>
          <li>I-click ang unit upang palitan ang estado: <strong>Vacant</strong> o <strong>Occupied</strong>.</li>
          <li>Kusang naitatabi ang mapa sa ilalim ng <strong>Saved to Cloud</strong> badge.</li>
        </ol>
      </div>

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Gawain L3</span> Paano I-set Up ang GCash at Utility Rates</div>
        <p>Bago mag-singil ng kuryente at tubig, itakda muna ang taripa:</p>
        <ol>
          <li>Sa menu, pindutin ang <strong>Utility Billing</strong>.</li>
          <li>Buksan ang tab na <strong>Electricity & Water Rates</strong>.</li>
          <li>I-type ang rate ng kuryente bawat kWh at tubig bawat metro kubiko.</li>
          <li>Pindutin ang <strong>Save Changes</strong> at pindutin ang <strong>Confirm & Save</strong>.</li>
          <li>Pumunta sa <strong>Settings</strong> at buksan ang <strong>Payment methods</strong>.</li>
          <li>I-type ang iyong <strong>GCash Number</strong> at i-upload ang iyong QR code.</li>
          <li>Pindutin ang <strong>Save Changes</strong> button.</li>
        </ol>
      </div>

      <div class="tip-box">
        Tip: Siguraduhing malinaw ang QR code upang hindi mahirapan ang mga tenant sa pag-scan.
      </div>
    </div>

    <div class="running-footer">
      <span>iReside User Manual • Bersyon 1.0</span>
      <span class="page-number">Pahina 10 ng 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 11: GABAY PARA SA LANDLORD (3) - PAGDAGDAG NG TENANT               -->
  <!-- ========================================================================= -->
  <div class="page" id="page-11">

    <div class="running-header">
      <span class="app-brand">Gabay Para sa Landlord</span>
      <span>Pagdagdag at Pag-imbita ng Tenant</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Gawain L4</span> Paano Magdagdag ng Tenant (Quick Add)</div>
        <p>Ito ang pinakamabilis na paraan kapag kaharap mo na ang umuupa:</p>
        <ol>
          <li>Sa menu, pindutin ang <strong>Tenants</strong> at pindutin ang <strong>+ Add Tenant</strong>.</li>
          <li>Piliin ang tab na <strong>Quick Add</strong>.</li>
          <li>I-type ang Buong Pangalan, Email Address, at Numero ng Telepono.</li>
          <li>Piliin ang gusali at ang tiyak na kuwarto sa <strong>Unit</strong> selector.</li>
          <li>I-type ang <strong>Monthly Rent</strong>, <strong>Advance Rent</strong>, at <strong>Security Deposit</strong>.</li>
          <li>Pindutin ang <strong>Register Resident</strong> button sa ibaba.</li>
          <li>Kopyahin ang temporary password mula sa screen at ibigay sa tenant.</li>
        </ol>
      </div>

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Gawain L5</span> Paano Gumawa ng Onboarding Invite Link</div>
        <p>Para sa mga aplikante na gustong mag-fill up sa sarili nilang phone:</p>
        <ol>
          <li>Sa <strong>Add Tenant</strong> window, pindutin ang <strong>Self-Onboarding Link</strong>.</li>
          <li>Piliin ang unit at ilagay ang araw kung kailan mag-e-expire ang link.</li>
          <li>Pindutin ang <strong>Generate Onboarding Link</strong> button.</li>
          <li>Pindutin ang <strong>Copy Link</strong> o i-download ang QR code para mai-print sa bulletin board.</li>
        </ol>
      </div>

      ${withScreenshots ? screen5 : tip5}
    </div>

    <div class="running-footer">
      <span>iReside User Manual • Bersyon 1.0</span>
      <span class="page-number">Pahina 11 ng 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 12: GABAY PARA SA LANDLORD (4) - BAYARIN AT METRO                  -->
  <!-- ========================================================================= -->
  <div class="page" id="page-12">

    <div class="running-header">
      <span class="app-brand">Gabay Para sa Landlord</span>
      <span>Pag-verify ng Bayad at Pagbasa ng Metro</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Gawain L6</span> Paano Mag-verify ng Bayad at Resibo</div>
        <p>Kapag nagbayad ang tenant gamit ang GCash o nag-abot ng cash:</p>
        <ol>
          <li>Sa kaliwang menu, pindutin ang <strong>Finance Hub</strong>.</li>
          <li>Pindutin ang filter chip na <strong>Needs Verification</strong> sa itaas.</li>
          <li>I-click ang invoice para tingnan ang screenshot at Reference Number.</li>
          <li>I-check ang GCash app; kung pumasok ang pera, pindutin ang <strong>Confirm & Issue Receipt</strong>.</li>
          <li>Kung nag-abot ng cash sa kamay, pindutin ang <strong>Confirm Cash Received</strong>.</li>
          <li>Kusang maglalabas ang system ng digital official receipt para sa tenant.</li>
        </ol>
      </div>

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Gawain L7</span> Paano Magbasa at Mag-compute ng Submeter</div>
        <p>Upang ma-compute ang konsumo sa kuryente at tubig bawat buwan:</p>
        <ol>
          <li>Sa menu, pumunta sa <strong>Utility Billing</strong>.</li>
          <li>Buksan ang tab na <strong>Meter Readings</strong>.</li>
          <li>I-type ang kasalukuyang numero mula sa metro sa bawat unit.</li>
          <li>Pindutin ang <strong>Save Readings</strong> upang mai-save ang mga numero.</li>
          <li>Pindutin ang <strong>Send Monthly Bills</strong> upang maipadala ang bill sa tenant.</li>
        </ol>
      </div>

      <div class="warning-box">
        Paalala: Huwag mag-kumpirma hangga't hindi nasisilip ang pumasok na pera sa iyong GCash o bangko.
      </div>
    </div>

    <div class="running-footer">
      <span>iReside User Manual • Bersyon 1.0</span>
      <span class="page-number">Pahina 12 ng 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 13: GABAY PARA SA LANDLORD (5) - MAINTENANCE AT ANUNSYO            -->
  <!-- ========================================================================= -->
  <div class="page" id="page-13">

    <div class="running-header">
      <span class="app-brand">Gabay Para sa Landlord</span>
      <span>Maintenance at Mga Anunsyo</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Gawain L8</span> Paano Mag-asikaso ng Maintenance Requests</div>
        <p>Kapag nagsumite ng ulat ng sira ang tenant, asikasuhin ito agad:</p>
        <ol>
          <li>Sa kaliwang menu, pindutin ang <strong>Maintenance</strong>.</li>
          <li>I-click ang tiket na may pulang marka o may nakasulat na <strong>Pending</strong>.</li>
          <li>Basahin ang reklamo at tingnan ang litratong ipinadala ng tenant.</li>
          <li>Piliin ang gagawa: <strong>Landlord Repair</strong> o <strong>Third Party Repair</strong>.</li>
          <li>Pindutin ang <strong>To Process</strong> button.</li>
          <li>Kapag tapos nang ayusin ang sira, pindutin ang <strong>Mark as Completed</strong> button.</li>
        </ol>
      </div>

      ${withScreenshots ? screen6 : tip6}

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Gawain L9</span> Paano Mag-post ng Anunsyo sa Community Hub</div>
        <p>Magpadala ng anunsyo sa lahat ng tenant (hal. water interruption):</p>
        <ol>
          <li>Sa kaliwang menu, pindutin ang <strong>Community Hub</strong>.</li>
          <li>Sa itaas ng composer, piliin ang <strong>Announcement</strong> tab.</li>
          <li>I-type ang buong detalye ng iyong mahalagang paalala sa mga residente.</li>
          <li>Pindutin ang <strong>Photo</strong> kung may nais ilakip na litrato.</li>
          <li>Pindutin ang <strong>Publish</strong> button sa kanang ibaba.</li>
        </ol>
      </div>
    </div>

    <div class="running-footer">
      <span>iReside User Manual • Bersyon 1.0</span>
      <span class="page-number">Pahina 13 ng 16</span>
    </div>
  </div>

    <!-- ========================================================================= -->
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

</body>
</html>
`;
}

async function renderAndExport(htmlFilename, pdfFilename, withScreenshots) {
  const htmlPath = path.join(manualDir, htmlFilename);
  const pdfPath = path.join(manualDir, pdfFilename);

  const htmlContent = getHtmlTemplate({ withScreenshots });
  fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
  console.log(`Generated HTML: ${htmlPath}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=medium']
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 559, // 148 mm * (96 / 25.4) ~ 559.37 px
    height: 794, // 210 mm * (96 / 25.4) ~ 793.7 px
    deviceScaleFactor: 2
  });

  const htmlUrl = 'file://' + htmlPath.replace(/\\/g, '/');
  await page.goto(htmlUrl, { waitUntil: 'load', timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);

  // Measure overflow/clearance and single-row invariants on every page
  const verification = await page.evaluate(() => {
    const pages = Array.from(document.querySelectorAll('.page'));
    const pageMeasurements = pages.map((p, idx) => {
      const content = p.querySelector('.content');
      const header = p.querySelector('.running-header');
      const footer = p.querySelector('.running-footer');
      return {
        page: idx + 1,
        pageHeight: p.clientHeight,
        pageScrollHeight: p.scrollHeight,
        contentHeight: content ? content.clientHeight : 0,
        contentScrollHeight: content ? content.scrollHeight : 0,
        isOverflowing: p.scrollHeight > p.clientHeight || (content && content.scrollHeight > content.clientHeight)
      };
    });

    const wrappingIssues = [];
    document.querySelectorAll('.task-badge').forEach(b => {
      const rects = b.getClientRects();
      if (rects.length > 1) {
        wrappingIssues.push(`Task badge wrapped into multiple lines: "${b.textContent.trim()}"`);
      }
    });

    document.querySelectorAll('.task-title').forEach(t => {
      const textNodes = Array.from(t.childNodes).filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
      textNodes.forEach(tn => {
        const r = document.createRange();
        r.selectNodeContents(tn);
        if (r.getClientRects().length > 1) {
          wrappingIssues.push(`Task title wrapped into multiple lines: "${t.textContent.trim()}"`);
        }
      });
      if (t.offsetHeight > 26) {
        wrappingIssues.push(`Task title height exceeded single-line limit (${t.offsetHeight}px): "${t.textContent.trim()}"`);
      }
    });

    document.querySelectorAll('h1, h2, h3').forEach(h => {
      const r = document.createRange();
      r.selectNodeContents(h);
      if (r.getClientRects().length > 1) {
        wrappingIssues.push(`Heading wrapped into multiple lines: "${h.textContent.trim()}"`);
      }
    });

    document.querySelectorAll('.toc-table .toc-title').forEach(toc => {
      const r = document.createRange();
      r.selectNodeContents(toc);
      if (r.getClientRects().length > 1) {
        wrappingIssues.push(`TOC row wrapped into multiple lines: "${toc.textContent.trim()}"`);
      }
    });

    return { pageMeasurements, wrappingIssues };
  });

  console.log(`--- Measurements for ${htmlFilename} ---`);
  let hasOverflow = false;
  verification.pageMeasurements.forEach(m => {
    const status = m.isOverflowing ? 'OVERFLOW!' : 'OK';
    if (m.isOverflowing) hasOverflow = true;
    console.log(`Page ${m.page}: ${status} (page: ${m.pageScrollHeight}/${m.pageHeight}px, content: ${m.contentScrollHeight}/${m.contentHeight}px)`);
  });

  if (verification.wrappingIssues.length > 0) {
    console.error(`--- Wrapping Issues Detected in ${htmlFilename} ---`);
    verification.wrappingIssues.forEach(err => console.error(` ❌ ${err}`));
    throw new Error(`Single-row invariant violated in ${htmlFilename}! Found ${verification.wrappingIssues.length} wrapping issue(s).`);
  } else {
    console.log(`✓ Single-row invariant verified: all task titles, badges, headings, and TOC rows are strictly 1 line!`);
  }

  // Export PDF
  await page.pdf({
    path: pdfPath,
    format: 'a5',
    preferCSSPageSize: true,
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 }
  });

  await browser.close();

  // Verify page count using pdf-lib
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const count = pdfDoc.getPageCount();
  console.log(`Exported PDF: ${pdfPath} (${count} pages, ${pdfBytes.length} bytes)`);

  if (count !== 16) {
    throw new Error(`Expected exactly 16 pages, but got ${count} for ${pdfFilename}`);
  }
  if (hasOverflow) {
    throw new Error(`Content overflow detected in ${htmlFilename}! Please adjust styles/spacing.`);
  }

  return { count, hasOverflow };
}

async function main() {
  console.log('Generating Version 1: Text-Only (without screenshots)...');
  await renderAndExport('ireside-user-manual-text.html', 'ireside-user-manual-text.pdf', false);

  console.log('\nGenerating Version 2: With Screenshots (Monochrome / Grayscale)...');
  await renderAndExport('ireside-user-manual-with-screens.html', 'ireside-user-manual-with-screens.pdf', true);

  // Also sync the canonical ireside-user-manual.html to with-screens
  console.log('\nSyncing canonical ireside-user-manual.html & ireside-user-manual.pdf...');
  await renderAndExport('ireside-user-manual.html', 'ireside-user-manual.pdf', true);

  console.log('\nAll user manual variants generated, verified, and exported successfully!');
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
