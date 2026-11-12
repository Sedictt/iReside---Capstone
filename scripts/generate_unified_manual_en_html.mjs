import { getCommonCss } from './manual-common-css.mjs';
import { buildUserManualEnHtml } from './generate_user_manual_en_html.mjs';
import { buildItManualHtml } from './generate_it_manual_html.mjs';

function extractPages(html) {
  const pages = [];
  const pageRegex = /<div class="page[^"]*" id="page-(\d+)">([\s\S]*?)<\/div>\s*(?=(?:<!-- ===|<div class="page"|<\/div>\s*<\/body>))/g;
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

function parsePage(innerHtml) {
  const headerMatch = innerHtml.match(/<div class="running-header">([\s\S]*?)<\/div>/);
  const contentMatch = innerHtml.match(/<div class="content">([\s\S]*?)<\/div>\s*<div class="running-footer">/);
  return {
    header: headerMatch ? headerMatch[1].trim() : '',
    content: contentMatch ? contentMatch[1].trim() : ''
  };
}

export function buildUnifiedManualEnHtml({ withScreenshots = true } = {}) {
  const css = getCommonCss({ isUnified: true });
  const userHtml = buildUserManualEnHtml({ withScreenshots });
  const itHtml = buildItManualHtml();

  const userPages = extractPages(userHtml);
  const itPages = extractPages(itHtml);

  if (userPages.length !== 16 || itPages.length !== 16) {
    throw new Error(`Expected 16 user pages and 16 IT pages, got ${userPages.length} and ${itPages.length}`);
  }

  // Page 1: Unified Master Cover Page
  const page1 = `
  <!-- ========================================================================= -->
  <!-- PAGE 1: UNIFIED MASTER COVER PAGE                                         -->
  <!-- ========================================================================= -->
  <div class="page cover-page" id="page-1">
    <div class="cover-frame">
      <div class="cover-header-top">
        <span>iReside Operations Platform</span>
        <span>Comprehensive Reference Suite</span>
      </div>

      <div class="cover-hero">
        <div class="cover-wordmark">iReside</div>
        <div class="cover-tagline">Comprehensive Property Operations &amp; Technical Administration Suite</div>
        <div class="cover-rule"></div>
        <div class="cover-title">COMPREHENSIVE SYSTEM OPERATIONS &amp; TECHNICAL ADMINISTRATION MANUAL</div>
        <div class="cover-subtitle">Complete User Operations Guide, Financial Workflows &amp; IT Technical Reference Handbook</div>
      </div>

      <div class="cover-emblem-wrap">
        <img src="images/ireside-logo-bw.png" alt="iReside Logo" class="cover-logo-img" />
      </div>

      <table class="cover-doc-table">
        <tr>
          <td class="meta-label">Document ID</td>
          <td class="meta-value">DOC REF: IR-UNIFIED-2026-EN-V1.0</td>
        </tr>
        <tr>
          <td class="meta-label">Classification</td>
          <td class="meta-value">Official Comprehensive System Standard (Parts I &amp; II &bull; 32 Pages)</td>
        </tr>
        <tr>
          <td class="meta-label">Audience</td>
          <td class="meta-value">Landlords, Tenants, Systems Administrators &amp; DevOps Engineers</td>
        </tr>
        <tr>
          <td class="meta-label">Stack</td>
          <td class="meta-value">Next.js 16 (React 19), Supabase PostgreSQL 15, Vercel &amp; Capacitor 7</td>
        </tr>
        <tr>
          <td class="meta-label">Pilot Scope</td>
          <td class="meta-value">Barangay Marulas Pilot Implementation, Valenzuela City</td>
        </tr>
      </table>

      <div class="cover-imprint">
        <span>Published by iReside Documentation &amp; Systems Engineering Team</span>
        <span>Authorized Comprehensive Edition &bull; 2026</span>
      </div>
    </div>
  </div>`;

  // Page 2: Unified Master Table of Contents
  const page2 = `
  <!-- ========================================================================= -->
  <!-- PAGE 2: UNIFIED MASTER TABLE OF CONTENTS                                  -->
  <!-- ========================================================================= -->
  <div class="page" id="page-2">
    <div class="running-header">
      <span class="app-brand">iReside Comprehensive Suite</span>
      <span>Master Table of Contents</span>
    </div>

    <div class="content">
      <div style="font-size: 8.4pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; background: #eee; padding: 0.6mm 2mm; margin-bottom: 1mm; border-left: 3px solid #000;">
        Part I: User Operations Manual for Landlords &amp; Tenants (Pages 3&ndash;16)
      </div>
      <table class="toc-table">
        <tr><td class="toc-title">1. Getting Started: System Requirements &amp; Sign In</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 3</td></tr>
        <tr><td class="toc-title">2. Getting Started: App Setup &amp; Emergency Spare Key</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 4</td></tr>
        <tr><td class="toc-title">3. Tenant Guide: Digital Leases &amp; Monthly Dues</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 5</td></tr>
        <tr><td class="toc-title">4. Tenant Guide: Rent Payments via GCash &amp; Cash</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 6</td></tr>
        <tr><td class="toc-title">5. Tenant Guide: Repairs &amp; Direct Messaging</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 7</td></tr>
        <tr><td class="toc-title">6. Tenant Guide: Move-Out Notice &amp; Spare Key Login</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 8</td></tr>
        <tr><td class="toc-title">7. Landlord Guide: Property Setup &amp; Unit Map</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 9</td></tr>
        <tr><td class="toc-title">8. Landlord Guide: Utility Rates &amp; Tenant Onboarding</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 10</td></tr>
        <tr><td class="toc-title">9. Landlord Guide: Invites &amp; Walk-in Applicants</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 11</td></tr>
        <tr><td class="toc-title">10. Landlord Guide: Payment Verification &amp; Submeters</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 12</td></tr>
        <tr><td class="toc-title">11. Landlord Guide: Maintenance &amp; Announcements</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 13</td></tr>
        <tr><td class="toc-title">12. Landlord Guide: Move-Out, Ledgers &amp; Reports</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 14</td></tr>
        <tr><td class="toc-title">13. Troubleshooting Common Issues &amp; Security</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 15</td></tr>
        <tr><td class="toc-title">14. Support Helpline, FAQs &amp; Operational Glossary</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 16</td></tr>
      </table>

      <div style="font-size: 8.4pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; background: #eee; padding: 0.6mm 2mm; margin: 1.2mm 0 1mm 0; border-left: 3px solid #000;">
        Part II: IT Technical Documentation &amp; Operations (Pages 17&ndash;32)
      </div>
      <table class="toc-table">
        <tr><td class="toc-title">15. Part II Divisional Cover &amp; Technical Directory</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 17–18</td></tr>
        <tr><td class="toc-title">16. System Architecture &amp; Complete Tech Stack</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 19</td></tr>
        <tr><td class="toc-title">17. Role Model, Zero Admin &amp; Environment Secrets</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 20–21</td></tr>
        <tr><td class="toc-title">18. Relational Database Schema &amp; Row-Level Security</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 22–24</td></tr>
        <tr><td class="toc-title">19. Authentication, 2FA, Spare Key &amp; Workspace Launch</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 25–27</td></tr>
        <tr><td class="toc-title">20. REST APIs, Android Pipeline &amp; Schedulers</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 28–30</td></tr>
        <tr><td class="toc-title">21. DevOps, Backups, Sign-Off &amp; IT Glossary</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 31–32</td></tr>
      </table>

      <h2>Comprehensive Suite Architecture &amp; Governance</h2>
      <table>
        <thead>
          <tr>
            <th>Document Division</th>
            <th>Operational Target</th>
            <th>Primary Deliverable</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Part I: Operations</strong></td>
            <td>Landlords and Tenant Residents</td>
            <td>Sequential workflows for daily property tasks.</td>
          </tr>
          <tr>
            <td><strong>Part II: IT Technical</strong></td>
            <td>DevOps and System Architects</td>
            <td>Database schema, security invariants, and runbooks.</td>
          </tr>
          <tr>
            <td><strong>Pilot Implementation</strong></td>
            <td>Barangay Marulas, Valenzuela</td>
            <td>Pilot compliance standards under RA 10173.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="running-footer">
      <span>iReside Comprehensive System Handbook &bull; Master Suite</span>
      <span class="page-number">Page 2 of 32</span>
    </div>
  </div>`;

  let assembledPages = page1 + '\n\n' + page2 + '\n\n';

  // Pages 3 to 16: English User Manual Instructional Pages
  for (let pNum = 3; pNum <= 16; pNum++) {
    const pageObj = userPages.find(p => p.num === pNum);
    if (!pageObj) throw new Error(`User page ${pNum} not found`);
    const parsed = parsePage(pageObj.inner);

    assembledPages += `  <!-- ========================================================================= -->
  <!-- PAGE ${pNum}: PART I USER OPERATIONS PAGE ${pNum}                             -->
  <!-- ========================================================================= -->
  <div class="page" id="page-${pNum}">
    <div class="running-header">
      ${parsed.header}
    </div>

    <div class="content">
      ${parsed.content}
    </div>

    <div class="running-footer">
      <span>iReside Comprehensive System Handbook &bull; Part I</span>
      <span class="page-number">Page ${pNum} of 32</span>
    </div>
  </div>\n\n`;
  }

  // Page 17: Part II Divisional Cover Page
  const page17 = `  <!-- ========================================================================= -->
  <!-- PAGE 17: PART II DIVISIONAL COVER & IT TECHNICAL DIRECTORY                -->
  <!-- ========================================================================= -->
  <div class="page cover-page" id="page-17">
    <div class="cover-frame">
      <div class="cover-header-top">
        <span>iReside Engineering Group</span>
        <span>Part II Technical Suite</span>
      </div>

      <div class="cover-hero">
        <div class="cover-wordmark">iReside</div>
        <div class="cover-tagline">Part II: IT Technical Documentation &amp; Systems Administration</div>
        <div class="cover-rule"></div>
        <div class="cover-title">SYSTEM ARCHITECTURE &amp; TECHNICAL ADMINISTRATION HANDBOOK</div>
        <div class="cover-subtitle">Production Topology, Security Invariants, Database Schema &amp; Operational Runbooks</div>
      </div>

      <div class="cover-emblem-wrap">
        <img src="images/ireside-logo-bw.png" alt="iReside Logo" class="cover-logo-img" />
      </div>

      <table class="cover-doc-table">
        <tr>
          <td class="meta-label">Part II Ref</td>
          <td class="meta-value">DOC REF: IR-UNIFIED-PART-II</td>
        </tr>
        <tr>
          <td class="meta-label">Classification</td>
          <td class="meta-value">Internal Technical Reference &bull; Systems Operations</td>
        </tr>
        <tr>
          <td class="meta-label">Audience</td>
          <td class="meta-value">Systems Architects, DevOps Engineers, and Database Administrators</td>
        </tr>
        <tr>
          <td class="meta-label">Stack</td>
          <td class="meta-value">Next.js 16 (React 19), Supabase PostgreSQL 15, Vercel &amp; Capacitor 7</td>
        </tr>
        <tr>
          <td class="meta-label">Scope</td>
          <td class="meta-value">Pages 17 to 32 of Unified Comprehensive Documentation</td>
        </tr>
      </table>

      <div class="cover-imprint">
        <span>Published by iReside Core Engineering Group</span>
        <span>Authorized Technical Custody &bull; Part II</span>
      </div>
    </div>
  </div>\n\n`;

  // Page 18: Part II Technical Table of Contents & Executive Summary
  const page18 = `  <!-- ========================================================================= -->
  <!-- PAGE 18: PART II TECHNICAL TABLE OF CONTENTS                              -->
  <!-- ========================================================================= -->
  <div class="page" id="page-18">
    <div class="running-header">
      <span class="app-brand">iReside Engineering</span>
      <span>Part II Directory &amp; Executive Summary</span>
    </div>

    <div class="content">
      <h2>Part II Table of Contents</h2>
      <table class="toc-table">
        <tr><td class="toc-title">1. System Architecture &amp; Complete Tech Stack</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 19</td></tr>
        <tr><td class="toc-title">2. Strict Two-Role Model &amp; Zero Admin Architecture</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 20</td></tr>
        <tr><td class="toc-title">3. Environment Variables &amp; Secrets Governance</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 21</td></tr>
        <tr><td class="toc-title">4. Database Schema: Users, Profiles &amp; Buildings</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 22</td></tr>
        <tr><td class="toc-title">5. Database Schema: Leases, Financials &amp; Operations</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 23</td></tr>
        <tr><td class="toc-title">6. Row-Level Security (RLS) Policy Governance</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 24</td></tr>
        <tr><td class="toc-title">7. Authentication Engine &amp; 2FA Session Guards</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 25</td></tr>
        <tr><td class="toc-title">8. Cryptographic Emergency Spare Key Engine</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 26</td></tr>
        <tr><td class="toc-title">9. Turnkey Workspace Launch Lifecycle (/api/setup)</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 27</td></tr>
        <tr><td class="toc-title">10. Core Application REST API Directory</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 28</td></tr>
        <tr><td class="toc-title">11. Mobile Client Architecture &amp; Android Build Pipeline</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 29</td></tr>
        <tr><td class="toc-title">12. Automated Schedulers &amp; Serverless Cron Workers</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 30</td></tr>
        <tr><td class="toc-title">13. Database Backups, Disaster Recovery &amp; Runbooks</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 31</td></tr>
        <tr><td class="toc-title">14. Commissioning Sign-Off, Support &amp; Glossary</td><td><div class="toc-leader"></div></td><td class="toc-page">Page 32</td></tr>
      </table>

      <h2>Part II Executive Architecture Overview</h2>
      <p>This technical division documents production architecture and security invariants.</p>
      <p>The platform decouples presentation, serverless edge compute, and managed relational persistence.</p>
      <p>The system enforces a strict two-role model: <strong>Landlord</strong> and <strong>Tenant</strong> with zero human admin.</p>
      <p>All automated tasks execute through secure service role tokens.</p>

      <h2>Part II Technical Baseline &amp; Governance Rules</h2>
      <table>
        <thead>
          <tr>
            <th>Technical Pillar</th>
            <th>Production Architecture</th>
            <th>System Guarantee</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Zero Human Admin</strong></td>
            <td>Pure two-role authorization boundary.</td>
            <td>No human administrator security backdoors.</td>
          </tr>
          <tr>
            <td><strong>Data Isolation</strong></td>
            <td>PostgreSQL Row-Level Security policies.</td>
            <td>Strict isolation preventing cross-tenant leakage.</td>
          </tr>
          <tr>
            <td><strong>Toolchain Purity</strong></td>
            <td>Dedicated android/ native Gradle wrapper.</td>
            <td>Zero Next.js root directory pollution.</td>
          </tr>
          <tr>
            <td><strong>Asynchronous Sync</strong></td>
            <td>Bounded non-blocking token refresh.</td>
            <td>Eliminates browser thread navigation stalls.</td>
          </tr>
        </tbody>
      </table>

      <div class="tip-box">
        <strong>Technical Standard:</strong> All production updates must satisfy automated test suites without regression.
      </div>
    </div>

    <div class="running-footer">
      <span>iReside Comprehensive System Handbook &bull; Part II</span>
      <span class="page-number">Page 18 of 32</span>
    </div>
  </div>\n\n`;

  assembledPages += page17 + page18;

  // Pages 19 to 32: IT Technical Documentation Chapters (from IT pages 3 to 16)
  for (let itNum = 3; itNum <= 16; itNum++) {
    const pageObj = itPages.find(p => p.num === itNum);
    if (!pageObj) throw new Error(`IT page ${itNum} not found`);
    const parsed = parsePage(pageObj.inner);
    const unifiedPageNum = itNum + 16; // 3 -> 19, 16 -> 32

    assembledPages += `  <!-- ========================================================================= -->
  <!-- PAGE ${unifiedPageNum}: PART II IT TECHNICAL CHAPTER ${itNum - 2}          -->
  <!-- ========================================================================= -->
  <div class="page" id="page-${unifiedPageNum}">
    <div class="running-header">
      ${parsed.header}
    </div>

    <div class="content">
      ${parsed.content}
    </div>

    <div class="running-footer">
      <span>iReside Comprehensive System Handbook &bull; Part II</span>
      <span class="page-number">Page ${unifiedPageNum} of 32</span>
    </div>
  </div>\n\n`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>iReside - Comprehensive System Operations & IT Administration Manual</title>
  <style>
${css}
  </style>
</head>
<body>

<div class="book-container">
${assembledPages}
</div>

</body>
</html>
`;
}
