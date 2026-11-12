import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const manualDir = path.join(__dirname, '..', 'docs', 'manual');

/**
 * Common Monochrome & Print CSS for A5 Portrait (148mm x 210mm)
 */
export function getCommonCss({ isIt = false, isUnified = false } = {}) {
  return `
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
      font-size: 8.8pt;
      line-height: 1.26;
      color: #111;
      background: #e5e5e5;
    }

    /* Screen Preview Container */
    .book-container {
      width: 148mm;
      margin: 20px auto;
    }

    /* Page Canvas */
    .page {
      width: 148mm;
      height: 210mm;
      padding: 7mm 10mm 8mm 10mm;
      background: #ffffff;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      break-after: page;
      box-sizing: border-box;
    }

    @media print {
      body {
        background: #ffffff;
      }
      .book-container {
        margin: 0;
        width: 100%;
      }
      .page {
        margin: 0;
        box-shadow: none;
      }
    }

    /* Dedicated Enterprise Cover Page (Page 1 & Page 17) */
    .page.cover-page {
      padding: 8.5mm 9.5mm !important;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #ffffff;
    }

    .cover-frame {
      border: 2px solid #111;
      outline: 1px solid #666;
      outline-offset: -3.5mm;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 6.5mm 7.5mm;
      box-sizing: border-box;
    }

    .cover-header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #111;
      padding-bottom: 2mm;
      font-size: 6.8pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #222;
      white-space: nowrap !important;
    }

    .cover-header-top span {
      white-space: nowrap !important;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cover-hero {
      text-align: center;
      margin: 2.5mm 0 1.5mm 0;
    }

    .cover-wordmark {
      font-size: 26pt;
      font-weight: 900;
      letter-spacing: -0.6px;
      line-height: 1.1;
      color: #000;
      margin: 0 0 1.8mm 0;
      text-transform: none;
    }

    .cover-tagline {
      font-size: 7.2pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.9px;
      line-height: 1.35;
      color: #333;
      margin: 0 0 3.5mm 0;
    }

    .cover-rule {
      width: 44mm;
      height: 1.5px;
      background: #111;
      margin: 0 auto 3.5mm auto;
    }

    .cover-title {
      font-size: 11.5pt;
      font-weight: 900;
      letter-spacing: 0.5px;
      line-height: 1.45;
      color: #000;
      text-transform: uppercase;
      margin: 0 auto 2.5mm auto;
      max-width: 115mm;
    }

    .cover-subtitle {
      font-size: 7.6pt;
      font-weight: 500;
      line-height: 1.45;
      color: #333;
      max-width: 108mm;
      margin: 0 auto;
    }

    .cover-emblem-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 2.5mm 0;
    }

    .cover-logo-img {
      width: 22mm;
      height: 22mm;
      object-fit: contain;
      display: block;
      margin: 0 auto;
      filter: grayscale(100%) contrast(120%);
    }

    .cover-doc-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #222;
      font-size: 6.8pt;
      margin: 2mm 0 1mm 0;
    }

    .cover-doc-table td {
      padding: 0.75mm 1.8mm;
      border: 1px solid #ccc;
      line-height: 1.22;
    }

    .cover-doc-table .meta-label {
      width: 25%;
      font-weight: 800;
      color: #222;
      background: #eeeeee;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      font-size: 6.5pt;
    }

    .cover-doc-table .meta-value {
      font-weight: 600;
      color: #111;
    }

    .cover-imprint {
      display: flex;
      justify-content: space-between;
      border-top: 1.5px solid #111;
      padding-top: 1.8mm;
      font-size: 6.2pt;
      font-weight: 600;
      color: #555;
    }

    /* Running Headers & Footers */
    .running-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #222;
      padding-bottom: 1.2mm;
      margin-bottom: 2mm;
      font-size: 6.8pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #444;
      flex-shrink: 0;
    }

    .running-header .app-brand {
      color: #000;
      font-weight: 900;
      display: flex;
      align-items: center;
      gap: 1.2mm;
    }

    .running-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1.5px solid #222;
      padding-top: 1.2mm;
      margin-top: 1.5mm;
      font-size: 6.8pt;
      color: #555;
      font-weight: 600;
      flex-shrink: 0;
    }

    .running-footer .page-number {
      font-weight: 800;
      color: #000;
    }

    /* Content Area */
    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      min-height: 0;
    }

    /* Typography & Hierarchy */
    h1, h2, h3, h4 {
      margin: 0;
      color: #000;
      white-space: nowrap !important;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    h1 {
      font-size: 13pt;
      font-weight: 900;
      letter-spacing: -0.3px;
      margin-bottom: 1.5mm;
    }

    h2 {
      font-size: 9.8pt;
      font-weight: 800;
      letter-spacing: -0.1px;
      margin: 1.2mm 0 1.2mm 0;
      border-bottom: 1px solid #111;
      padding-bottom: 0.6mm;
    }

    h3 {
      font-size: 8.6pt;
      font-weight: 800;
      margin: 1mm 0 0.8mm 0;
    }

    p {
      margin: 0 0 1.2mm 0;
      line-height: 1.26;
      color: #111;
    }

    ul, ol {
      margin: 0 0 1.4mm 0;
      padding-left: 4.5mm;
    }

    li {
      margin-bottom: 0.8mm;
      line-height: 1.24;
    }

    strong {
      font-weight: 800;
      color: #000;
    }

    code {
      font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 7.8pt;
      background: #f0f0f0;
      border: 1px solid #d4d4d4;
      padding: 0.2px 2.5px;
      border-radius: 2px;
      color: #111;
    }

    /* Single-Row Task Block Discipline */
    .task-block {
      margin-bottom: 1.6mm;
    }

    .task-title {
      display: flex;
      align-items: center;
      gap: 1.8mm;
      font-size: 8.8pt !important;
      font-weight: 800;
      color: #000;
      margin: 1mm 0 1.2mm 0;
      white-space: nowrap !important;
      overflow: hidden;
      text-overflow: ellipsis;
      height: 22px;
      line-height: 22px;
    }

    .task-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #eee;
      border: 1.2px solid #222;
      border-radius: 3px;
      padding: 0 5px;
      font-size: 7pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #111;
      white-space: nowrap !important;
      flex-shrink: 0;
      height: 18px;
      line-height: 18px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1mm 0 1.6mm 0;
      font-size: 7.6pt;
    }

    th, td {
      border: 1px solid #333;
      padding: 0.8mm 1.5mm;
      text-align: left;
      line-height: 1.22;
    }

    th {
      background: #f0f0f0;
      font-weight: 800;
      color: #000;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      font-size: 7pt;
    }

    /* Table of Contents */
    .toc-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.9pt;
      margin: 0.8mm 0 1.5mm 0;
    }

    .toc-table td {
      border: none;
      padding: 0.65mm 0;
      line-height: 1.22;
    }

    .toc-table .toc-title {
      font-weight: 600;
      color: #111;
      white-space: nowrap !important;
      padding-right: 2mm;
    }

    .toc-table .toc-leader {
      width: 100%;
      border-bottom: 1px dotted #666;
      position: relative;
      top: -3px;
    }

    .toc-table .toc-page {
      padding-left: 2mm;
      text-align: right;
      font-weight: 800;
      color: #000;
      white-space: nowrap !important;
    }

    /* Callouts & Highlights */
    .tip-box {
      border-left: 3px solid #333;
      background: #f8f8f8;
      padding: 0.9mm 2mm;
      margin: 0.9mm 0 1.2mm 0;
      font-size: 7.8pt;
      line-height: 1.22;
      color: #222;
    }

    .warning-box {
      border-left: 3.5px solid #000;
      background: #f1f1f1;
      padding: 0.9mm 2mm;
      margin: 0.9mm 0 1.2mm 0;
      font-size: 7.8pt;
      line-height: 1.22;
      font-weight: 600;
      color: #111;
    }

    /* Screenshot Figures (Pure Monochrome Grayscale) */
    .screenshot-figure {
      border: 1.5px solid #333;
      background: #fafafa;
      padding: 1mm;
      margin: 1mm 0 1.4mm 0;
      text-align: center;
    }

    .screenshot-img {
      max-width: 100%;
      height: auto;
      max-height: 38mm;
      object-fit: contain;
      filter: grayscale(100%) contrast(110%);
      display: block;
      margin: 0 auto;
      border: 1px solid #ddd;
    }

    .screenshot-caption {
      font-size: 6.8pt;
      font-weight: 700;
      color: #444;
      margin-top: 0.8mm;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      white-space: nowrap !important;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Vector Flow Diagrams (NO ASCII ART) */
    .flow-diagram {
      border: 1.5px solid #333;
      background: #fafafa;
      padding: 1.5mm 2mm;
      margin: 1.2mm 0 1.5mm 0;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1mm;
    }

    .flow-card {
      border: 1.5px solid #222;
      background: #ffffff;
      border-radius: 3px;
      padding: 1mm 2mm;
      text-align: center;
      width: 100%;
      box-sizing: border-box;
    }

    .flow-card-title {
      font-weight: 800;
      font-size: 7.6pt;
      color: #000;
      margin-bottom: 0.4mm;
      white-space: nowrap !important;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .flow-card-desc {
      font-size: 6.6pt;
      color: #333;
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      white-space: nowrap !important;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .flow-connector-v {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.3mm;
    }

    .flow-stem {
      width: 1.5px;
      height: 3.5mm;
      background: #333;
    }

    .flow-badge {
      font-size: 6.3pt;
      font-weight: 800;
      background: #eee;
      border: 1px solid #444;
      border-radius: 2px;
      padding: 0.2px 4px;
      white-space: nowrap !important;
      color: #111;
      margin: 0.2mm 0;
    }

    /* Q&A & Troubleshooting Blocks */
    .qa-block {
      border: 1px solid #ccc;
      background: #fafafa;
      padding: 0.8mm 1.6mm;
      margin-bottom: 1mm;
      border-left: 2.5px solid #222;
    }

    .qa-q {
      font-weight: 800;
      font-size: 7.6pt;
      color: #000;
      margin-bottom: 0.3mm;
      white-space: nowrap !important;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .qa-a {
      font-size: 7.2pt;
      color: #222;
      line-height: 1.22;
      margin: 0;
    }

    /* Glossary Items */
    .glossary-item {
      font-size: 7.2pt;
      line-height: 1.22;
      margin-bottom: 0.8mm;
    }

    .glossary-term {
      font-weight: 800;
      color: #000;
      text-transform: uppercase;
      font-size: 7pt;
      letter-spacing: 0.3px;
    }
  `;
}
