import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const manualDir = path.join(__dirname, '..', 'docs', 'manual');

function extractPages(html) {
  const pages = [];
  const pageRegex = /<div class="page" id="page-(\d+)">([\s\S]*?)<\/div>\s*(?=(?:<!-- ===|<div class="page"|<\/div>\s*<\/body>))/g;
  let match;
  while ((match = pageRegex.exec(html)) !== null) {
    pages.push({
      num: parseInt(match[1], 10),
      outer: match[0],
      inner: match[2]
    });
  }
  return pages;
}

function parsePage(pageStr) {
  const headerMatch = pageStr.match(/<div class="running-header">([\s\S]*?)<\/div>/);
  const contentMatch = pageStr.match(/<div class="content">([\s\S]*?)<\/div>\s*<div class="running-footer">/);
  return {
    header: headerMatch ? headerMatch[1].trim() : '',
    content: contentMatch ? contentMatch[1].trim() : ''
  };
}

// Build unified HTML with pixel-perfect scoped CSS
const unifiedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>iReside - Pinag-isang Gabay sa Paggamit at IT Technical Documentation</title>
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
      font-size: 10pt;
      line-height: 1.30;
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

    /* Page 1 (Unified Master Cover & TOC) */
    .page#page-1 {
      padding: 11mm 11mm 11mm 15mm;
    }

    /* Part I User Manual Margins: 16mm inside, 12mm outside/top/bottom */
    .page.user-manual:nth-child(odd) {
      padding: 12mm 12mm 12mm 16mm;
    }
    .page.user-manual:nth-child(even) {
      padding: 12mm 16mm 12mm 12mm;
    }

    /* Part II IT Manual Margins: 15mm inside, 11mm outside/top/bottom */
    .page.it-manual:nth-child(odd) {
      padding: 11mm 11mm 11mm 15mm;
    }
    .page.it-manual:nth-child(even) {
      padding: 11mm 15mm 11mm 11mm;
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
      white-space: nowrap;
    }

    .page.it-manual .running-header {
      padding-bottom: 1.2mm;
      margin-bottom: 2mm;
      font-size: 8pt;
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
      white-space: nowrap;
    }

    .page.it-manual .running-footer {
      padding-top: 1.2mm;
      margin-top: 1.8mm;
      font-size: 8pt;
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

    /* ======================================================================= */
    /* USER MANUAL STYLES (PART I)                                             */
    /* ======================================================================= */
    .page.user-manual {
      font-size: 10.5pt;
      line-height: 1.32;
    }
    .page.user-manual p {
      margin: 0 0 1.5mm 0;
      font-size: 10.5pt;
      line-height: 1.32;
    }
    .page.user-manual ol, .page.user-manual ul {
      margin: 0 0 1.5mm 0;
      padding-left: 16px;
    }
    .page.user-manual li {
      margin-bottom: 0.7mm;
      font-size: 10.5pt;
      line-height: 1.3;
    }
    .page.user-manual h1 {
      font-size: 16pt;
      font-weight: 800;
      line-height: 1.25;
      margin: 0 0 2mm 0;
      color: #000;
      letter-spacing: -0.3px;
    }
    .page.user-manual h2 {
      font-size: 12pt;
      font-weight: 800;
      line-height: 1.22;
      margin: 1.5mm 0 1mm 0;
      color: #111;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 0.8mm;
      white-space: nowrap;
    }
    .page.user-manual h3 {
      font-size: 10.5pt;
      font-weight: 700;
      margin: 1.2mm 0 0.8mm 0;
      color: #111;
      white-space: nowrap;
    }

    .task-block {
      margin-bottom: 2mm;
    }
    .task-title {
      font-size: 10pt;
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
    .glossary-item {
      margin-bottom: 1.5mm;
      font-size: 9.6pt;
      line-height: 1.26;
    }
    .glossary-term {
      font-weight: 800;
      color: #000;
    }

    /* ======================================================================= */
    /* IT TECHNICAL MANUAL STYLES (PART II)                                    */
    /* ======================================================================= */
    .page.it-manual {
      font-size: 9.5pt;
      line-height: 1.30;
    }
    .page.it-manual p {
      margin: 0 0 1.2mm 0;
      font-size: 9.5pt;
      line-height: 1.28;
    }
    .page.it-manual ol, .page.it-manual ul {
      margin: 0 0 1.2mm 0;
      padding-left: 15px;
    }
    .page.it-manual li {
      margin-bottom: 0.6mm;
      font-size: 9.2pt;
      line-height: 1.26;
    }
    .page.it-manual h1 {
      font-size: 14pt;
      font-weight: 800;
      line-height: 1.2;
      margin: 0 0 1.5mm 0;
      color: #000;
      letter-spacing: -0.3px;
      white-space: nowrap;
    }
    .page.it-manual h2 {
      font-size: 10.8pt;
      font-weight: 800;
      line-height: 1.2;
      margin: 1.2mm 0 0.8mm 0;
      color: #111;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 0.6mm;
      white-space: nowrap;
    }
    .page.it-manual h3 {
      font-size: 9.5pt;
      font-weight: 700;
      margin: 1mm 0 0.6mm 0;
      color: #111;
      line-height: 1.2;
      white-space: nowrap;
    }

    .tech-table {
      width: 100%;
      border-collapse: collapse;
      margin: 1mm 0 1.5mm 0;
      font-size: 7.6pt;
      line-height: 1.22;
    }
    .tech-table th {
      background: #f0f0f0;
      border: 1px solid #888;
      padding: 0.6mm 1.2mm;
      font-weight: 800;
      text-align: left;
      white-space: nowrap;
    }
    .tech-table td {
      border: 1px solid #bbb;
      padding: 0.6mm 1.2mm;
      vertical-align: top;
    }
    .tech-table tr:nth-child(even) td {
      background: #fafafa;
    }

    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 8pt;
      background: #f0f0f0;
      padding: 0.5px 3px;
      border-radius: 2px;
      border: 1px solid #ddd;
    }

    .code-box {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 7.2pt;
      line-height: 1.22;
      background: #f7f7f7;
      border: 1px solid #888;
      padding: 1.2mm 2mm;
      margin: 1mm 0 1.4mm 0;
      border-radius: 3px;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .ascii-diagram {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 6.8pt;
      line-height: 1.15;
      background: #fcfcfc;
      border: 1px solid #888;
      padding: 1.2mm 1.5mm;
      margin: 1mm 0 1.4mm 0;
      border-radius: 3px;
      white-space: pre;
      overflow: hidden;
    }

    /* Vector Flow Diagrams (Monochrome / Grayscale A5 Print Optimized) */
    .flow-diagram {
      margin: 1mm 0 1.4mm 0;
      width: 100%;
      box-sizing: border-box;
      font-size: 7.2pt;
      line-height: 1.2;
    }

    .flow-card {
      border: 1.5px solid #333;
      background: #f9f9f9;
      border-radius: 4px;
      padding: 1.1mm 2mm;
      text-align: center;
      box-sizing: border-box;
    }

    .flow-card-title {
      font-weight: 700;
      font-size: 7.4pt;
      color: #111;
      margin-bottom: 0.2mm;
    }

    .flow-card-desc {
      font-size: 6.8pt;
      color: #333;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      line-height: 1.22;
    }

    .flow-connector-v {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 0.2mm 0;
      position: relative;
    }

    .flow-stem {
      width: 1.5px;
      height: 3.5px;
      background: #333;
    }

    .flow-connector-v svg {
      display: block;
    }

    .flow-badge {
      display: inline-block;
      background: #ffffff;
      border: 1px solid #555;
      border-radius: 3px;
      padding: 0.2mm 1.6mm;
      font-size: 6.4pt;
      font-weight: 600;
      color: #222;
      margin: 0.2mm 0;
      white-space: nowrap;
    }

    .flow-row {
      display: flex;
      align-items: stretch;
      justify-content: space-between;
      gap: 1.5mm;
      width: 100%;
      box-sizing: border-box;
    }

    .flow-col {
      display: flex;
      flex-direction: column;
      flex: 1;
      box-sizing: border-box;
    }

    .flow-connector-h {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.8mm;
      flex-shrink: 0;
    }

    .flow-rel {
      font-size: 6.8pt;
      font-weight: 700;
      color: #333;
      font-family: ui-monospace, monospace;
    }

    .flow-pipeline-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.1mm;
      width: 100%;
      box-sizing: border-box;
    }

    .flow-step-item {
      border: 1.5px solid #333;
      background: #f9f9f9;
      border-radius: 4px;
      padding: 0.9mm 1.6mm;
      display: flex;
      align-items: flex-start;
      gap: 1.4mm;
      box-sizing: border-box;
    }

    .flow-step-num {
      background: #333;
      color: #fff;
      font-weight: 700;
      font-size: 6.6pt;
      width: 13px;
      height: 13px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 0.2mm;
    }

    .flow-step-content {
      flex: 1;
      min-width: 0;
    }

    .flow-step-title {
      font-weight: 700;
      font-size: 7.1pt;
      color: #111;
      line-height: 1.2;
    }

    .flow-step-desc {
      font-size: 6.3pt;
      color: #333;
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      line-height: 1.22;
      word-break: break-word;
      overflow-wrap: anywhere;
    }

    .flow-diagram code {
      font-size: inherit;
      font-family: inherit;
      background: #eeeeee;
      border: 1px solid #cccccc;
      padding: 0.2px 2px;
      border-radius: 2px;
      word-break: break-all;
      overflow-wrap: anywhere;
      white-space: normal;
    }

    /* Common Callouts */
    .tip-box {
      border-left: 3px solid #555;
      background: #f8f8f8;
      padding: 1mm 2mm;
      margin: 1mm 0 1.4mm 0;
      font-size: 8.5pt;
      line-height: 1.24;
    }
    .warning-box {
      border-left: 3.5px solid #000;
      background: #f1f1f1;
      padding: 1mm 2mm;
      margin: 1mm 0 1.4mm 0;
      font-size: 8.5pt;
      line-height: 1.24;
      font-weight: 600;
    }

    /* Enterprise Masthead & Document Header */
    .enterprise-masthead {
      border-bottom: 2px solid #111;
      padding-bottom: 1.5mm;
      margin-bottom: 1.5mm;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .brand-title-group {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-size: 15pt;
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -0.4px;
      color: #000;
      margin: 0;
    }

    .brand-tagline {
      font-size: 7.6pt;
      font-weight: 700;
      color: #333;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 0.4mm;
    }

    .doc-meta-badge {
      text-align: right;
      font-size: 6.8pt;
      color: #444;
      line-height: 1.2;
      font-weight: 600;
    }

    .doc-meta-badge .badge-code {
      font-weight: 800;
      color: #000;
      display: block;
      letter-spacing: 0.3px;
    }

    /* Document Metadata Control Table */
    .doc-control-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.5mm;
      font-size: 7.2pt;
      background: #fafafa;
      border: 1px solid #ccc;
      border-radius: 3px;
    }

    .doc-control-table td {
      padding: 0.7mm 1.5mm;
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
      font-size: 6.6pt;
    }

    .doc-control-table .control-value {
      color: #111;
      width: 28%;
      font-weight: 600;
    }

    /* TOC Formatting */
    .toc-table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.8mm 0 1.4mm 0;
      font-size: 8.4pt;
    }
    .toc-table td {
      padding: 0.5mm 0;
      vertical-align: bottom;
    }
    .toc-table .toc-title {
      padding-right: 4px;
      white-space: nowrap;
      font-weight: 600;
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
    .toc-section-header {
      font-size: 8.6pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #000;
      background: #eee;
      padding: 0.6mm 2mm;
      margin: 1.2mm 0 0.6mm 0;
      border-left: 3px solid #000;
    }

    /* Page 1 Compact Spacing to Ensure Generous Clearance */
    .page#page-1 .enterprise-masthead {
      padding-bottom: 1.2mm;
      margin-bottom: 1.2mm;
    }
    .page#page-1 .doc-control-table {
      margin-bottom: 1.2mm;
    }
    .page#page-1 .doc-control-table td {
      padding: 0.55mm 1.5mm;
    }
    .page#page-1 .toc-section-header {
      font-size: 8.2pt;
      padding: 0.4mm 1.8mm;
      margin: 0.8mm 0 0.4mm 0;
    }
    .page#page-1 .toc-table {
      font-size: 8pt;
      margin: 0.4mm 0 0.8mm 0;
    }
    .page#page-1 .toc-table td {
      padding: 0.32mm 0;
    }
  </style>
</head>
<body>

<div class="book-container">

  <!-- ========================================================================= -->
  <!-- PAHINA 1: UNIFIED MASTER COVER & COMPREHENSIVE TABLE OF CONTENTS          -->
  <!-- ========================================================================= -->
  <div class="page" id="page-1">
    <div class="running-header">
      <span class="app-brand">iReside Portal</span>
      <span>Opisyal na Gabay sa Paggamit</span>
    </div>

    <div class="content">
      <div class="enterprise-masthead">
        <div class="brand-title-group">
          <h1 class="brand-title">iReside</h1>
          <div class="brand-tagline">Property Operations Platform &bull; Unified Documentation</div>
        </div>
        <div class="doc-meta-badge">
          <span class="badge-code">DOC REF: IR-UNIFIED-2026</span>
          <span>Comprehensive Reference Suite</span>
        </div>
      </div>

      <table class="doc-control-table">
        <tr>
          <td class="control-label">Document</td>
          <td class="control-value">Unified Operations &amp; IT Manual</td>
          <td class="control-label">Scope</td>
          <td class="control-value">Parts I &amp; II (32 Pages)</td>
        </tr>
        <tr>
          <td class="control-label">Audience</td>
          <td class="control-value">Landlords, Tenants &amp; IT Teams</td>
          <td class="control-label">Release</td>
          <td class="control-value">Version 1.0 (2026)</td>
        </tr>
      </table>

      <div class="toc-section-header">Bahagi I: Gabay sa Paggamit ng Tenant at Landlord</div>
      <table class="toc-table">
        <tr>
          <td class="toc-title">1. Pagsisimula (Kailangan, Pag-login, at App)</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 2–3</td>
        </tr>
        <tr>
          <td class="toc-title">2. Gabay sa Tenant (Kontrata, Bills, at Bayad)</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 4–5</td>
        </tr>
        <tr>
          <td class="toc-title">3. Gabay sa Tenant (Sira, Chat, at Pag-alis)</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 6–7</td>
        </tr>
        <tr>
          <td class="toc-title">4. Gabay sa Landlord (Gusali, Mapa, at Singilin)</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 8–9</td>
        </tr>
        <tr>
          <td class="toc-title">5. Gabay sa Landlord (Tenant, Bayad, at Metro)</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 10–11</td>
        </tr>
        <tr>
          <td class="toc-title">6. Gabay sa Landlord (Sira, Anunsyo, at Ulat)</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 12–13</td>
        </tr>
        <tr>
          <td class="toc-title">7. Solusyon sa Problema at Seguridad</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 14–15</td>
        </tr>
        <tr>
          <td class="toc-title">8. Suporta, Helpline, at Talasalitaan</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 16</td>
        </tr>
      </table>

      <div class="toc-section-header">Bahagi II: IT Technical Documentation &amp; Operations</div>
      <table class="toc-table">
        <tr>
          <td class="toc-title">9. System Overview &amp; IT Handbook Directory</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 17</td>
        </tr>
        <tr>
          <td class="toc-title">10. System Architecture &amp; Complete Tech Stack</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 18</td>
        </tr>
        <tr>
          <td class="toc-title">11. Role Model &amp; Service Role Operations (Zero Admin)</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 19</td>
        </tr>
        <tr>
          <td class="toc-title">12. Environment Secrets &amp; Cookie Governance</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 20</td>
        </tr>
        <tr>
          <td class="toc-title">13. Database Schema: Profiles, Units &amp; Floor Map</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 21</td>
        </tr>
        <tr>
          <td class="toc-title">14. Database Schema: Leases, Financials &amp; Submeters</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 22</td>
        </tr>
        <tr>
          <td class="toc-title">15. Database Schema: Maintenance, Chat &amp; Security</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 23</td>
        </tr>
        <tr>
          <td class="toc-title">16. Row-Level Security (RLS) &amp; Multi-Tenant Isolation</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 24</td>
        </tr>
        <tr>
          <td class="toc-title">17. Authentication Engine, 2FA OTP &amp; Session Guards</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 25</td>
        </tr>
        <tr>
          <td class="toc-title">18. Cryptographic Emergency Spare Key Architecture</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 26</td>
        </tr>
        <tr>
          <td class="toc-title">19. Workspace Claiming Lifecycle (/api/setup/launch)</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 27</td>
        </tr>
        <tr>
          <td class="toc-title">20. Core REST API Endpoints &amp; Webhook Lifecycle</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 28</td>
        </tr>
        <tr>
          <td class="toc-title">21. Mobile Client Build Pipeline &amp; Android Compilation</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 29</td>
        </tr>
        <tr>
          <td class="toc-title">22. Automated Schedulers &amp; Serverless Cron Workers</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 30</td>
        </tr>
        <tr>
          <td class="toc-title">23. IT Operations, Disaster Recovery &amp; Troubleshooting</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 31</td>
        </tr>
        <tr>
          <td class="toc-title">24. Commissioning Sign-Off, Helpline &amp; Glossary</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 32</td>
        </tr>
      </table>
    </div>

    <div class="running-footer">
      <span>iReside Unified Manual • Bersyon 1.0</span>
      <span class="page-number">Pahina 1 ng 32</span>
    </div>
  </div>
`;

const page17Html = `
  <!-- ========================================================================= -->
  <!-- PAGE 17: PART II DIVISIONAL COVER & IT TECHNICAL DIRECTORY                -->
  <!-- ========================================================================= -->
  <div class="page it-manual" id="page-17">
    <div class="running-header">
      <span class="app-brand">iReside Engineering</span>
      <span>Part II: IT Technical Documentation</span>
    </div>

    <div class="content">
      <div class="enterprise-masthead">
        <div class="brand-title-group">
          <h1 class="brand-title">iReside IT Operations</h1>
          <div class="brand-tagline">Cloud Infrastructure &bull; Systems Administration</div>
        </div>
        <div class="doc-meta-badge">
          <span class="badge-code">DOC REF: IR-TECH-2026</span>
          <span>Enterprise Architecture &amp; Runbook</span>
        </div>
      </div>

      <table class="doc-control-table">
        <tr>
          <td class="control-label">Document</td>
          <td class="control-value">Part II: IT Technical Manual</td>
          <td class="control-label">Scope</td>
          <td class="control-value">Pages 17&ndash;32</td>
        </tr>
        <tr>
          <td class="control-label">Audience</td>
          <td class="control-value">DevOps &amp; System Administrators</td>
          <td class="control-label">Stack</td>
          <td class="control-value">Next.js 16 &bull; Supabase &bull; Capacitor</td>
        </tr>
      </table>

      <h2>Executive Architecture Overview</h2>
      <p><strong>iReside</strong> is a property operations platform for Philippine rental housing.</p>
      <p>It provides cloud infrastructure for tenant onboarding, utility submetering, and maintenance tickets.</p>
      <p>The system enforces a strict two-role model: <strong>Landlord</strong> and <strong>Tenant</strong>.</p>
      <p>Automated operations and background cron workers execute through secure service role tokens.</p>

      <h2>Part II Table of Contents (IT Reference)</h2>
      <table class="toc-table">
        <tr>
          <td class="toc-title">10. System Architecture &amp; Complete Tech Stack</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 18</td>
        </tr>
        <tr>
          <td class="toc-title">11. Role Model &amp; Service Role Operations (Zero Admin)</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 19</td>
        </tr>
        <tr>
          <td class="toc-title">12. Environment Secrets &amp; Cookie Governance</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 20</td>
        </tr>
        <tr>
          <td class="toc-title">13. Database Schema: Profiles, Units &amp; Floor Map</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 21</td>
        </tr>
        <tr>
          <td class="toc-title">14. Database Schema: Leases, Financials &amp; Submeters</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 22</td>
        </tr>
        <tr>
          <td class="toc-title">15. Database Schema: Maintenance, Chat &amp; Security</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 23</td>
        </tr>
        <tr>
          <td class="toc-title">16. Row-Level Security (RLS) &amp; Multi-Tenant Isolation</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 24</td>
        </tr>
        <tr>
          <td class="toc-title">17. Authentication Engine, 2FA OTP &amp; Session Guards</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 25</td>
        </tr>
        <tr>
          <td class="toc-title">18. Cryptographic Emergency Spare Key Architecture</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 26</td>
        </tr>
        <tr>
          <td class="toc-title">19. Workspace Claiming Lifecycle (/api/setup/launch)</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 27</td>
        </tr>
        <tr>
          <td class="toc-title">20. Core REST API Endpoints &amp; Webhook Lifecycle</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 28</td>
        </tr>
        <tr>
          <td class="toc-title">21. Mobile Client Build Pipeline &amp; Android Compilation</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 29</td>
        </tr>
        <tr>
          <td class="toc-title">22. Automated Schedulers &amp; Serverless Cron Workers</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 30</td>
        </tr>
        <tr>
          <td class="toc-title">23. IT Operations, Disaster Recovery &amp; Troubleshooting</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 31</td>
        </tr>
        <tr>
          <td class="toc-title">24. Commissioning Sign-Off, Helpline &amp; Glossary</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 32</td>
        </tr>
      </table>
    </div>

    <div class="running-footer">
      <span>iReside Unified Manual • Technical Edition</span>
      <span class="page-number">Page 17 of 32</span>
    </div>
  </div>
`;

function buildUnifiedVariant(userSourceFile, outputHtmlFile, editionLabel) {
  const userManualHtml = fs.readFileSync(path.join(manualDir, userSourceFile), 'utf-8');
  const itManualHtml = fs.readFileSync(path.join(manualDir, 'ireside-it-manual.html'), 'utf-8');

  const userPages = extractPages(userManualHtml);
  const itPages = extractPages(itManualHtml);

  if (userPages.length !== 16 || itPages.length !== 16) {
    throw new Error(`Expected 16 pages each, got user=${userPages.length}, it=${itPages.length}`);
  }

  let bodyPages = '';

  // Add Part I pages: Pages 2 to 16 from userManual
  for (let i = 2; i <= 16; i++) {
    const p = userPages.find(up => up.num === i);
    if (!p) throw new Error(`User page ${i} not found`);
    const parsed = parsePage(p.outer);

    bodyPages += `
  <!-- ========================================================================= -->
  <!-- PAHINA ${i}: PART I USER MANUAL PAGE ${i}                                 -->
  <!-- ========================================================================= -->
  <div class="page user-manual" id="page-${i}">
    <div class="running-header">
      ${parsed.header}
    </div>

    <div class="content">
      ${parsed.content}
    </div>

    <div class="running-footer">
      <span>iReside Pinag-isang Gabay • Bahagi I</span>
      <span class="page-number">Pahina ${i} ng 32</span>
    </div>
  </div>
`;
  }

  // Add Page 17: Part II Divisional Cover & IT Table of Contents
  bodyPages += page17Html;

  // Add Part II pages: Pages 2 to 16 from itManual -> Pages 18 to 32
  for (let i = 2; i <= 16; i++) {
    const unifiedPageNum = i + 16;
    const p = itPages.find(ip => ip.num === i);
    if (!p) throw new Error(`IT page ${i} not found`);
    const parsed = parsePage(p.outer);

    bodyPages += `
  <!-- ========================================================================= -->
  <!-- PAGE ${unifiedPageNum}: PART II IT TECHNICAL PAGE ${i}                    -->
  <!-- ========================================================================= -->
  <div class="page it-manual" id="page-${unifiedPageNum}">
    <div class="running-header">
      ${parsed.header}
    </div>

    <div class="content">
      ${parsed.content}
    </div>

    <div class="running-footer">
      <span>iReside Unified Manual • Technical Edition</span>
      <span class="page-number">Page ${unifiedPageNum} of 32</span>
    </div>
  </div>
`;
  }

  const finalHtml = unifiedHtml + bodyPages + `
</div>

</body>
</html>
`;

  fs.writeFileSync(path.join(manualDir, outputHtmlFile), finalHtml, 'utf-8');
  console.log(`Successfully generated docs/manual/${outputHtmlFile} (32 pages) [${editionLabel}]`);
}

// 1. Unified with screenshots
buildUnifiedVariant('ireside-user-manual.html', 'ireside-manual-unified.html', 'With Screenshots');

// 2. Unified without screenshots (Text-Only)
buildUnifiedVariant('ireside-user-manual-text.html', 'ireside-manual-unified-text.html', 'Without Screenshots / Text-Only');
