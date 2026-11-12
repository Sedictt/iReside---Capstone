import { getCommonCss } from './manual-common-css.mjs';

export function buildUserManualEnHtml({ withScreenshots = true } = {}) {
  const css = getCommonCss();

  const screenLogin = `
      <div class="screenshot-figure">
        <img src="images/screen-login.png" alt="Sign In Screen" class="screenshot-img" />
        <div class="screenshot-caption">Figure 1: Portal Sign In Screen (Email, Password, and Sign In button)</div>
      </div>`;

  const textLogin = `
      <table>
        <thead>
          <tr>
            <th>Authentication Step</th>
            <th>User Action</th>
            <th>System Response</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Submit Details</strong></td>
            <td>Enter email and temporary password.</td>
            <td>System validates registered account.</td>
          </tr>
          <tr>
            <td><strong>2. Receive Code</strong></td>
            <td>Retrieve 6-digit email passcode.</td>
            <td>Code remains valid for ten minutes.</td>
          </tr>
          <tr>
            <td><strong>3. Authorize</strong></td>
            <td>Type code into verification prompt.</td>
            <td>Redirects to role dashboard immediately.</td>
          </tr>
        </tbody>
      </table>
      <div class="tip-box">
        <strong>Login Standard:</strong> Two-factor verification protects accounts against unauthorized access.
      </div>`;

  const screenFinance = `
      <div class="screenshot-figure">
        <img src="images/screen-finance-hub.png" alt="Finance Hub Screen" class="screenshot-img" />
        <div class="screenshot-caption">Figure 2: Finance Hub (Total Balance Due and Upload Payment button)</div>
      </div>`;

  const textFinance = `
      <table>
        <thead>
          <tr>
            <th>Settlement Stage</th>
            <th>Responsible Role</th>
            <th>Operational Deliverable</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Payment Submission</strong></td>
            <td>Tenant Resident</td>
            <td>Uploads payment receipt screenshot with reference number.</td>
          </tr>
          <tr>
            <td><strong>2. Verification Queue</strong></td>
            <td>Accounting Ledger</td>
            <td>Transfers invoice to pending review ledger queue.</td>
          </tr>
          <tr>
            <td><strong>3. Settlement Approval</strong></td>
            <td>Landlord Manager</td>
            <td>Approves payment proof and issues digital receipt.</td>
          </tr>
        </tbody>
      </table>
      <div class="tip-box">
        <strong>Payment Standard:</strong> Double check the 13-digit GCash reference number before submitting verification.
      </div>`;

  const screenMaintenance = `
      <div class="screenshot-figure">
        <img src="images/screen-maintenance-request.png" alt="Maintenance Request Screen" class="screenshot-img" />
        <div class="screenshot-caption">Figure 3: Repair Request Form (Category, Description, and Photo Upload)</div>
      </div>`;

  const textMaintenance = `
      <table>
        <thead>
          <tr>
            <th>Repair Stage</th>
            <th>Responsible Party</th>
            <th>Operational Standard</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Ticket Creation</strong></td>
            <td>Tenant Resident</td>
            <td>Provides problem description and clear damage photos.</td>
          </tr>
          <tr>
            <td><strong>2. Triage &amp; Schedule</strong></td>
            <td>Landlord Manager</td>
            <td>Reviews urgency and assigns technician to work order.</td>
          </tr>
          <tr>
            <td><strong>3. Repair Completion</strong></td>
            <td>Assigned Technician</td>
            <td>Fixes reported fault and verifies physical restoration.</td>
          </tr>
        </tbody>
      </table>
      <div class="tip-box">
        <strong>Repair Standard:</strong> Include well-lit close-up photos of damages to speed up repair scheduling.
      </div>`;

  const screenAddProperty = `
      <div class="screenshot-figure">
        <img src="images/screen-add-property.png" alt="Add Property Modal" class="screenshot-img" />
        <div class="screenshot-caption">Figure 4: Property Creation Modal (Title, Address, and Floor Levels)</div>
      </div>`;

  const textAddProperty = `
      <table>
        <thead>
          <tr>
            <th>Architectural Preset</th>
            <th>Corridor Configuration</th>
            <th>Recommended Property Type</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Double Loaded</strong></td>
            <td>Central hallway with rooms on both sides.</td>
            <td>Multi-story apartment and boarding buildings.</td>
          </tr>
          <tr>
            <td><strong>Single Loaded</strong></td>
            <td>Single corridor with open exterior railing.</td>
            <td>Open-air rental complexes and row houses.</td>
          </tr>
          <tr>
            <td><strong>U-Shape Layout</strong></td>
            <td>Three-sided building enclosing central courtyard.</td>
            <td>Multi-wing gated compound residential rental units.</td>
          </tr>
        </tbody>
      </table>
      <div class="tip-box">
        <strong>Unit Map Standard:</strong> Drag room cards along the interactive grid to match corridors.
      </div>`;

  const screenAddTenant = `
      <div class="screenshot-figure">
        <img src="images/screen-add-tenant.png" alt="Add Tenant Dialog" class="screenshot-img" />
        <div class="screenshot-caption">Figure 5: Resident Onboarding Window (Quick Add and Self-Onboarding Link)</div>
      </div>`;

  const textAddTenant = `
      <table>
        <thead>
          <tr>
            <th>Onboarding Channel</th>
            <th>Workflow Method</th>
            <th>Primary Benefit</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Quick Add Form</strong></td>
            <td>Landlord enters resident details directly.</td>
            <td>Instant credentials created for walk-in residents.</td>
          </tr>
          <tr>
            <td><strong>Self-Onboarding Link</strong></td>
            <td>Applicant completes mobile registration form.</td>
            <td>Eliminates manual paperwork during remote leasing.</td>
          </tr>
          <tr>
            <td><strong>QR Code Poster</strong></td>
            <td>Prospective tenant scans physical sign.</td>
            <td>Instant access during on-site property walkthroughs.</td>
          </tr>
        </tbody>
      </table>
      <div class="tip-box">
        <strong>Onboarding Standard:</strong> Verify government ID photos and mobile numbers before executing contracts.
      </div>`;

  const screenMaintenanceLandlord = `
      <div class="screenshot-figure">
        <img src="images/screen-maintenance-management.png" alt="Maintenance Ticket Operations" class="screenshot-img" />
        <div class="screenshot-caption">Figure 6: Maintenance Management (Work Orders, Scheduling, and Resolution)</div>
      </div>`;

  const textMaintenanceLandlord = `
      <table>
        <thead>
          <tr>
            <th>Advisory Type</th>
            <th>Broadcast Scope</th>
            <th>Priority Indicator</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Utility Interruption</strong></td>
            <td>Scheduled water or electrical repair outages.</td>
            <td>Urgent banner on tenant dashboard.</td>
          </tr>
          <tr>
            <td><strong>Payment Reminder</strong></td>
            <td>Upcoming monthly rent settlement deadlines.</td>
            <td>Standard notification alert feed.</td>
          </tr>
          <tr>
            <td><strong>Building Advisory</strong></td>
            <td>Waste disposal schedules and quiet hours.</td>
            <td>Community bulletin post on board.</td>
          </tr>
        </tbody>
      </table>
      <div class="tip-box">
        <strong>Communication Standard:</strong> Published announcements broadcast instantly across all active resident mobile devices.
      </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>iReside - User Operations Manual</title>
  <style>
${css}
  </style>
</head>
<body>

<div class="book-container">

  <!-- ========================================================================= -->
  <!-- PAGE 1: DEDICATED ENTERPRISE COVER PAGE                                   -->
  <!-- ========================================================================= -->
  <div class="page cover-page" id="page-1">
    <div class="cover-frame">
      <div class="cover-header-top">
        <span>Republic of the Philippines &bull; City of Valenzuela</span>
        <span>Brgy. Marulas Pilot</span>
      </div>

      <div class="cover-hero">
        <div class="cover-wordmark">iReside</div>
        <div class="cover-tagline">Intelligent Rental Housing Operations Platform</div>
        <div class="cover-rule"></div>
        <div class="cover-title">USER OPERATIONS MANUAL</div>
        <div class="cover-subtitle">Standard Operational Procedures &amp; Resident Self-Service Handbook</div>
      </div>

      <div class="cover-emblem-wrap">
        <img src="images/ireside-logo-bw.png" alt="iReside Logo" class="cover-logo-img" />
      </div>

      <table class="cover-doc-table">
        <tr>
          <td class="meta-label">Document ID</td>
          <td class="meta-value">DOC REF: IR-USER-2026-EN-V1.0</td>
        </tr>
        <tr>
          <td class="meta-label">Classification</td>
          <td class="meta-value">Official Operating Manual &bull; Standard Release (16 Pages)</td>
        </tr>
        <tr>
          <td class="meta-label">Audience</td>
          <td class="meta-value">Landlords, Property Owners, Tenants &amp; Resident Occupants</td>
        </tr>
        <tr>
          <td class="meta-label">Coverage</td>
          <td class="meta-value">Property Onboarding, Unit Map, Leases, Payments &amp; Work Orders</td>
        </tr>
        <tr>
          <td class="meta-label">Pilot Scope</td>
          <td class="meta-value">Barangay Marulas Pilot Implementation, Valenzuela City</td>
        </tr>
      </table>

      <div class="cover-imprint">
        <span>Published by iReside Documentation &amp; Systems Engineering Team</span>
        <span>Authorized Operations Edition &bull; 2026</span>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 2: TABLE OF CONTENTS & OPERATIONAL STANDARDS                         -->
  <!-- ========================================================================= -->
  <div class="page" id="page-2">
    <div class="running-header">
      <span class="app-brand">iReside User Operations</span>
      <span>Directory &amp; Overview</span>
    </div>

    <div class="content">
      <h2>Table of Contents</h2>
      <table class="toc-table">
        <tr>
          <td class="toc-title">1. Getting Started: System Requirements &amp; Sign In</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 3</td>
        </tr>
        <tr>
          <td class="toc-title">2. Getting Started: App Setup &amp; Emergency Spare Key</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 4</td>
        </tr>
        <tr>
          <td class="toc-title">3. Tenant Guide: Digital Leases &amp; Monthly Dues</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 5</td>
        </tr>
        <tr>
          <td class="toc-title">4. Tenant Guide: Rent Payments via GCash &amp; Cash</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 6</td>
        </tr>
        <tr>
          <td class="toc-title">5. Tenant Guide: Repairs &amp; Direct Messaging</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 7</td>
        </tr>
        <tr>
          <td class="toc-title">6. Tenant Guide: Move-Out Notice &amp; Spare Key Login</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 8</td>
        </tr>
        <tr>
          <td class="toc-title">7. Landlord Guide: Property Setup &amp; Unit Map</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 9</td>
        </tr>
        <tr>
          <td class="toc-title">8. Landlord Guide: Utility Rates &amp; Tenant Onboarding</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 10</td>
        </tr>
        <tr>
          <td class="toc-title">9. Landlord Guide: Invites &amp; Walk-in Applicants</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 11</td>
        </tr>
        <tr>
          <td class="toc-title">10. Landlord Guide: Payment Verification &amp; Submeters</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 12</td>
        </tr>
        <tr>
          <td class="toc-title">11. Landlord Guide: Maintenance &amp; Announcements</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 13</td>
        </tr>
        <tr>
          <td class="toc-title">12. Landlord Guide: Move-Out, Ledgers &amp; Reports</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 14</td>
        </tr>
        <tr>
          <td class="toc-title">13. Troubleshooting Common Issues &amp; Security</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 15</td>
        </tr>
        <tr>
          <td class="toc-title">14. Support Helpline, FAQs &amp; Operational Glossary</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Page 16</td>
        </tr>
      </table>

      <h2>Purpose &amp; Scope</h2>
      <p><strong>iReside</strong> is an integrated cloud platform for residential rental operations.</p>
      <p>It streamlines rent collection, utility submetering, and property maintenance.</p>
      <p>This manual provides standard operational workflows for landlords and tenants.</p>
      <p>All procedures reflect verified production software controls and button names.</p>

      <h2>Operational Standards &amp; Architecture Invariants</h2>
      <table>
        <thead>
          <tr>
            <th>Standard Pillar</th>
            <th>System Implementation</th>
            <th>Operational Requirement</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Two-Role Model</strong></td>
            <td>Strict Landlord and Tenant separation.</td>
            <td>Zero administrative backdoors or human admin roles.</td>
          </tr>
          <tr>
            <td><strong>Legal Compliance</strong></td>
            <td>Adheres to RA 10173 and RA 8792.</td>
            <td>Guarantees privacy and binding digital signatures.</td>
          </tr>
          <tr>
            <td><strong>Client Access</strong></td>
            <td>Progressive Web App and Android APK.</td>
            <td>Provides access across smartphones and desktop computers.</td>
          </tr>
        </tbody>
      </table>

      <div class="tip-box">
        <strong>Guide Standard:</strong> Follow sequential numbered steps to ensure consistent property operations.
      </div>
    </div>

    <div class="running-footer">
      <span>iReside User Manual &bull; Version 1.0</span>
      <span class="page-number">Page 2 of 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 3: GETTING STARTED - REQUIREMENTS & SIGN IN                          -->
  <!-- ========================================================================= -->
  <div class="page" id="page-3">
    <div class="running-header">
      <span class="app-brand">Getting Started</span>
      <span>Requirements &amp; Sign In</span>
    </div>

    <div class="content">
      <h2>Prerequisites Before Getting Started</h2>
      <p>Ensure you have the following items ready before accessing iReside:</p>
      <ul>
        <li><strong>Smartphone or Computer:</strong> Any modern Android phone, iPhone, or laptop.</li>
        <li><strong>Internet Connectivity:</strong> Active Wi-Fi or mobile cellular data connection.</li>
        <li><strong>Valid Email Address:</strong> Used for login verification and digital receipts.</li>
        <li><strong>Account Credentials:</strong> Email and temporary password provided by management.</li>
      </ul>

      <h2>How to Sign In to Your Account</h2>
      <p>Follow these standard steps to authenticate into the system:</p>
      <ol>
        <li>Open your browser and navigate to the official iReside portal.</li>
        <li>Enter your registered email address in the <strong>Email Address</strong> field.</li>
        <li>Enter your password in the <strong>Password</strong> field.</li>
        <li>Click the <strong>Sign In</strong> button.</li>
        <li>Retrieve the 6-digit verification code sent to your email inbox.</li>
        <li>Type the code into <strong>6-Digit Verification Code</strong> and click <strong>Verify &amp; Sign In</strong>.</li>
      </ol>

      <h2>Sign-In Credentials &amp; Verification Matrix</h2>
      <table>
        <thead>
          <tr>
            <th>Credential Field</th>
            <th>Input Format</th>
            <th>Verification Rule</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Email Address</strong></td>
            <td>Standard valid email string</td>
            <td>Must match active profile record.</td>
          </tr>
          <tr>
            <td><strong>Account Password</strong></td>
            <td>Minimum 8 alphanumeric characters</td>
            <td>Case-sensitive credentials.</td>
          </tr>
          <tr>
            <td><strong>Verification Code</strong></td>
            <td>6-digit numeric OTP code</td>
            <td>One-time code expiring in 10 minutes.</td>
          </tr>
        </tbody>
      </table>

      ${withScreenshots ? screenLogin : textLogin}

      <div class="warning-box">
        Warning: Never share your password or verification code with anyone. Keep it confidential.
      </div>
    </div>

    <div class="running-footer">
      <span>iReside User Manual &bull; Version 1.0</span>
      <span class="page-number">Page 3 of 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 4: GETTING STARTED - APP SETUP & SPARE KEY                           -->
  <!-- ========================================================================= -->
  <div class="page" id="page-4">
    <div class="running-header">
      <span class="app-brand">Getting Started</span>
      <span>App Setup &amp; Spare Key</span>
    </div>

    <div class="content">
      <h2>How to Install the Mobile App</h2>
      <p>You can install iReside on your mobile phone for fast daily access:</p>

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Android</span> Installing on Android Phone</div>
        <ol>
          <li>Open the left sidebar menu and click <strong>Download App</strong>.</li>
          <li>Click <strong>Download iReside App</strong> to save the APK file.</li>
          <li>Open your downloaded file and click <strong>Install</strong>.</li>
          <li>When prompted by Android security, tap <strong>Allow</strong> to continue.</li>
        </ol>
      </div>

      <div class="task-block">
        <div class="task-title"><span class="task-badge">iPhone</span> Adding to iPhone Home Screen</div>
        <ol>
          <li>Open the Safari browser and navigate to the iReside portal.</li>
          <li>Tap the <strong>Share</strong> button at the bottom of the screen.</li>
          <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
          <li>Tap <strong>Add</strong> in the top-right corner to complete setup.</li>
        </ol>
      </div>

      <h2>Mobile Device Compatibility &amp; Requirements</h2>
      <table>
        <thead>
          <tr>
            <th>Platform</th>
            <th>Minimum System</th>
            <th>Supported Features</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Android Client</strong></td>
            <td>Android 8.0 (Oreo) or newer</td>
            <td>Native APK wrapper, push alerts, camera uploads.</td>
          </tr>
          <tr>
            <td><strong>Apple iOS</strong></td>
            <td>iOS 14.0 or newer</td>
            <td>Safari Home Screen PWA, camera uploads.</td>
          </tr>
          <tr>
            <td><strong>Desktop Browser</strong></td>
            <td>Chrome, Firefox, Safari, Edge</td>
            <td>Full keyboard navigation, dual monitors, export tools.</td>
          </tr>
        </tbody>
      </table>

      <h2>The Emergency Spare Key (Account Recovery)</h2>
      <p>Just like a spare physical house key, this unlocks your account safely.</p>

      <h2>Emergency Spare Key Specifications</h2>
      <table>
        <thead>
          <tr>
            <th>Security Parameter</th>
            <th>Specification Standard</th>
            <th>Safety Directive</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Code Structure</strong></td>
            <td>16 uppercase alphanumeric characters</td>
            <td>Divided into 4 hyphenated blocks.</td>
          </tr>
          <tr>
            <td><strong>Storage Method</strong></td>
            <td>One-way bcrypt cryptographic hash</td>
            <td>Plaintext key is never stored online.</td>
          </tr>
          <tr>
            <td><strong>Usage Restriction</strong></td>
            <td>Single-use emergency recovery token</td>
            <td>Automatically rotated upon successful login.</td>
          </tr>
        </tbody>
      </table>

      <div class="tip-box">
        Store your Emergency Spare Key safely on a flash drive or notepad.
      </div>
    </div>

    <div class="running-footer">
      <span>iReside User Manual &bull; Version 1.0</span>
      <span class="page-number">Page 4 of 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 5: TENANT GUIDE - CONTRACTS & MONTHLY DUES                           -->
  <!-- ========================================================================= -->
  <div class="page" id="page-5">
    <div class="running-header">
      <span class="app-brand">Tenant Guide</span>
      <span>Contracts &amp; Monthly Dues</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task T1</span> Sign Digital Lease Agreement (Sign Lease)</div>
        <p>Before moving in, residents must digitally execute their lease contract:</p>
        <ol>
          <li>Click <strong>Leases</strong> in the main navigation menu.</li>
          <li>Click the <strong>Review &amp; sign</strong> button at the top of the screen.</li>
          <li>Carefully review monthly rent, security deposit terms, and building rules.</li>
          <li>Click <strong>Sign Document</strong> to open the digital signature pad.</li>
          <li>Draw your signature using your finger or mouse cursor.</li>
          <li>Click <strong>Finalize</strong> and confirm to submit your signed lease.</li>
        </ol>
      </div>

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task T2</span> Review Monthly Rent and Due Dates</div>
        <p>Track your active rental dues, utility submeters, and payment history:</p>
        <ol>
          <li>Click <strong>Finance Hub</strong> in the main navigation menu.</li>
          <li>Review the top balance summary card labeled <strong>Total Balance Due</strong>.</li>
          <li>Inspect current water and electric consumption calculated from submeters.</li>
          <li>Review upcoming payment deadlines to avoid late payment notices.</li>
          <li>Click <strong>View Statement</strong> to inspect an itemized billing breakdown.</li>
        </ol>
      </div>

      <h2>Lease Terms &amp; Invoice Status Matrix</h2>
      <table>
        <thead>
          <tr>
            <th>Term / Status</th>
            <th>Operational Policy</th>
            <th>Tenant Directive</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Monthly Rent</strong></td>
            <td>Payable on the first day of each month.</td>
            <td>Submit payment receipts promptly via portal.</td>
          </tr>
          <tr>
            <td><strong>Security Deposit</strong></td>
            <td>Guarantees damages and unpaid bills.</td>
            <td>Refunded within 15 days following move-out.</td>
          </tr>
          <tr>
            <td><strong>Unpaid / Overdue</strong></td>
            <td>Current or past due invoice balance.</td>
            <td>Settle balance immediately to prevent penalties.</td>
          </tr>
          <tr>
            <td><strong>Paid / Pending</strong></td>
            <td>Approved or queued for verification.</td>
            <td>Download and archive digital payment receipt.</td>
          </tr>
        </tbody>
      </table>

      <h2>Philippine Tenancy Compliance &amp; Statutory Standards</h2>
      <table>
        <thead>
          <tr>
            <th>Regulatory Standard</th>
            <th>Statutory Requirement</th>
            <th>Compliance Policy</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Rent Control Act</strong></td>
            <td>Annual rent increase limits apply.</td>
            <td>Automatic statutory rate capping.</td>
          </tr>
          <tr>
            <td><strong>Deposit Ceiling</strong></td>
            <td>Maximum two months advance rent.</td>
            <td>Configurable deposit input constraints.</td>
          </tr>
          <tr>
            <td><strong>Grace Period</strong></td>
            <td>Standard 5-day payment leeway.</td>
            <td>Penalties apply only after grace days.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="running-footer">
      <span>iReside User Manual &bull; Version 1.0</span>
      <span class="page-number">Page 5 of 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 6: TENANT GUIDE - RENT PAYMENTS & RECEIPTS                           -->
  <!-- ========================================================================= -->
  <div class="page" id="page-6">
    <div class="running-header">
      <span class="app-brand">Tenant Guide</span>
      <span>Rent Payments &amp; Receipts</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task T3</span> Pay Rent via GCash or Maya</div>
        <p>You can settle rental payments electronically without leaving home:</p>
        <ol>
          <li>Open <strong>Finance Hub</strong> and click the <strong>Upload Payment</strong> button.</li>
          <li>Scan the landlord GCash QR code or copy the recipient mobile number.</li>
          <li>Complete payment inside GCash and capture a screenshot of your receipt.</li>
          <li>Return to iReside and upload the payment proof screenshot image.</li>
          <li>Type the exact <strong>Reference Number</strong> from your payment receipt.</li>
          <li>Click <strong>Submit Payment</strong> to transmit verification to management.</li>
        </ol>
      </div>

      ${withScreenshots ? screenFinance : textFinance}

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task T4</span> Pay Cash Directly to Landlord</div>
        <p>If you prefer paying rent with physical cash to management:</p>
        <ol>
          <li>Visit the management office and submit the exact cash amount.</li>
          <li>Wait for the landlord to record the transaction in iReside.</li>
          <li>Open your Finance Hub screen and refresh the page.</li>
          <li>Locate your new receipt row under <strong>Payment History</strong>.</li>
        </ol>
      </div>

      <h2>Payment Method Comparison &amp; Requirements</h2>
      <table>
        <thead>
          <tr>
            <th>Payment Method</th>
            <th>Verification Data</th>
            <th>Processing SLA</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>GCash / Maya Transfer</strong></td>
            <td>Screenshot and 13-digit reference number</td>
            <td>Verified within 24 hours of upload.</td>
          </tr>
          <tr>
            <td><strong>Cash to Landlord</strong></td>
            <td>Handover to management office in person</td>
            <td>Instant electronic ledger update on receipt.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="running-footer">
      <span>iReside User Manual &bull; Version 1.0</span>
      <span class="page-number">Page 6 of 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 7: TENANT GUIDE - REPAIRS & DIRECT MESSAGING                         -->
  <!-- ========================================================================= -->
  <div class="page" id="page-7">
    <div class="running-header">
      <span class="app-brand">Tenant Guide</span>
      <span>Repairs &amp; Direct Chat</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task T5</span> Submit Repair Request (Report Repairs)</div>
        <p>When experiencing damaged fixtures, plumbing issues, or electrical faults:</p>
        <ol>
          <li>Click <strong>Maintenance</strong> in the main navigation menu.</li>
          <li>Click the <strong>+ Submit Request</strong> button at the top right.</li>
          <li>Select an issue category such as <strong>Plumbing</strong> or <strong>Electrical</strong>.</li>
          <li>Type a clear, detailed description of the maintenance problem.</li>
          <li>Click <strong>Upload Photo</strong> and choose clear picture evidence.</li>
          <li>Click <strong>Submit Ticket</strong> to dispatch the repair work order.</li>
        </ol>
      </div>

      ${withScreenshots ? screenMaintenance : textMaintenance}

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task T6</span> Send Direct Message to Landlord</div>
        <p>For inquiries, notices, or general questions with property management:</p>
        <ol>
          <li>Click <strong>Messages</strong> in the left navigation sidebar.</li>
          <li>Select the conversation thread with your property manager.</li>
          <li>Type your question or inquiry in the message composer.</li>
          <li>Click the <strong>Send</strong> icon to dispatch your message immediately.</li>
          <li>You will receive a notification alert once management replies.</li>
        </ol>
      </div>

      <h2>Maintenance Priority Matrix &amp; SLA Times</h2>
      <table>
        <thead>
          <tr>
            <th>Fault Category</th>
            <th>Representative Damage</th>
            <th>Target Resolution SLA</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Plumbing</strong></td>
            <td>Water leaks, pipe burst, faucet failure</td>
            <td>Resolved within 24 hours.</td>
          </tr>
          <tr>
            <td><strong>Electrical</strong></td>
            <td>Exposed wire, breaker trip, light failure</td>
            <td>Resolved immediately or within 12 hours.</td>
          </tr>
          <tr>
            <td><strong>General Fixture</strong></td>
            <td>Window lock, door hinge, cabinet damage</td>
            <td>Resolved within 48 to 72 hours.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="running-footer">
      <span>iReside User Manual &bull; Version 1.0</span>
      <span class="page-number">Page 7 of 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 8: TENANT GUIDE - MOVE-OUT & SPARE KEY LOGIN                         -->
  <!-- ========================================================================= -->
  <div class="page" id="page-8">
    <div class="running-header">
      <span class="app-brand">Tenant Guide</span>
      <span>Move-Out &amp; Account Recovery</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task T7</span> Submit Move-Out Notice (Notice to Vacate)</div>
        <p>When your lease concludes and you intend to vacate your unit:</p>
        <ol>
          <li>Click <strong>Leases</strong> in the main navigation menu.</li>
          <li>Review your active tenancy contract specifications.</li>
          <li>Click the <strong>Submit Move-Out Notice</strong> button.</li>
          <li>Select your intended move-out departure date on the calendar.</li>
          <li>Provide your moving reason and click <strong>Confirm Notice</strong>.</li>
        </ol>
      </div>

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task T8</span> Sign In Using Emergency Spare Key</div>
        <p>If you lose your phone or cannot access your email inbox:</p>
        <ol>
          <li>On the login page, click the <strong>Use Emergency Key</strong> link.</li>
          <li>Enter your registered account email address.</li>
          <li>Enter your unique 16-character Emergency Spare Key code.</li>
          <li>Click the <strong>Unlock Account</strong> button to authenticate.</li>
          <li>Set a new password and save your replacement emergency key.</li>
        </ol>
      </div>

      <h2>Move-Out Inspection &amp; Emergency Recovery Matrix</h2>
      <table>
        <thead>
          <tr>
            <th>Workflow Area</th>
            <th>Required Action</th>
            <th>Verification Standard</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Room Cleanliness</strong></td>
            <td>Trash removed and surfaces cleaned.</td>
            <td>Cleaning fee charged if left dirty.</td>
          </tr>
          <tr>
            <td><strong>Key Handover</strong></td>
            <td>All gate and unit keys returned.</td>
            <td>Missing keys deducted from deposit.</td>
          </tr>
          <tr>
            <td><strong>Final Submeters</strong></td>
            <td>Final water and electric readings taken.</td>
            <td>Final usage deducted from deposit balance.</td>
          </tr>
          <tr>
            <td><strong>Spare Key Recovery</strong></td>
            <td>Input 16-character emergency code.</td>
            <td>Resets password and rotates recovery key.</td>
          </tr>
        </tbody>
      </table>

      <h2>Security Deposit Settlement &amp; Deduction Schedule</h2>
      <table>
        <thead>
          <tr>
            <th>Deduction Item</th>
            <th>Assessment Standard</th>
            <th>Settlement Window</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Unpaid Utilities</strong></td>
            <td>Final electric and water submeter readings.</td>
            <td>Deducted directly from deposit balance.</td>
          </tr>
          <tr>
            <td><strong>Room Damage</strong></td>
            <td>Physical inspection and repair estimate.</td>
            <td>Itemized repair receipts provided to tenant.</td>
          </tr>
          <tr>
            <td><strong>Remaining Balance</strong></td>
            <td>Deposit funds minus verified deductions.</td>
            <td>Refunded within 15 days of departure.</td>
          </tr>
        </tbody>
      </table>

      <div class="warning-box">
        Security Directive: Store your Emergency Spare Key offline. Do not share it over messages.
      </div>
    </div>

    <div class="running-footer">
      <span>iReside User Manual &bull; Version 1.0</span>
      <span class="page-number">Page 8 of 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 9: LANDLORD GUIDE - PROPERTY & UNIT MAP                              -->
  <!-- ========================================================================= -->
  <div class="page" id="page-9">
    <div class="running-header">
      <span class="app-brand">Landlord Guide</span>
      <span>Property &amp; Unit Map</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task L1</span> Add New Rental Property and Units</div>
        <p>Register a new rental building and its inventory in the portal:</p>
        <ol>
          <li>Click <strong>Properties</strong> in the left navigation sidebar.</li>
          <li>Click the <strong>Add Property</strong> button in the top action bar.</li>
          <li>Enter your building title under <strong>Property Name</strong>.</li>
          <li>Provide the complete address and select number of floors.</li>
          <li>Specify room counts for each floor level.</li>
          <li>Click <strong>Create Property</strong> to register the building in iReside.</li>
        </ol>
      </div>

      ${withScreenshots ? screenAddProperty : textAddProperty}

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task L2</span> Configure Interactive Unit Map</div>
        <p>Create visual 2D floorplans for effortless hallway oversight:</p>
        <ol>
          <li>Click <strong>Unit Map</strong> in the main navigation menu.</li>
          <li>Choose an architectural preset like <strong>Double Loaded</strong> or <strong>Single Loaded</strong>.</li>
          <li>Drag and drop room cards to match your corridor layout.</li>
          <li>Click any unit card to edit numbers and monthly rates.</li>
          <li>Click <strong>Save Layout</strong> to publish your floor plan.</li>
        </ol>
      </div>

      <h2>Property Specifications &amp; Boundary Rules</h2>
      <table>
        <thead>
          <tr>
            <th>Configuration Field</th>
            <th>Input Constraint</th>
            <th>Operational Guidance</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Property Title</strong></td>
            <td>Maximum 60 alphanumeric characters</td>
            <td>Use distinct building name for recognition.</td>
          </tr>
          <tr>
            <td><strong>Complete Address</strong></td>
            <td>Barangay Marulas street location</td>
            <td>Must be physical location within pilot area.</td>
          </tr>
          <tr>
            <td><strong>Floor Count</strong></td>
            <td>Number from 1 to 10 floors</td>
            <td>Generates structural floor plan levels.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="running-footer">
      <span>iReside User Manual &bull; Version 1.0</span>
      <span class="page-number">Page 9 of 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 10: LANDLORD GUIDE - UTILITY RATES & TENANTS                         -->
  <!-- ========================================================================= -->
  <div class="page" id="page-10">
    <div class="running-header">
      <span class="app-brand">Landlord Guide</span>
      <span>Utility Rates &amp; Tenants</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task L3</span> Configure Utility Rates &amp; Payment Details</div>
        <p>Establish utility billing tariffs before calculating water and power:</p>
        <ol>
          <li>Click <strong>Utility Billing</strong> in the left navigation menu.</li>
          <li>Open the <strong>Electricity &amp; Water Rates</strong> configuration tab.</li>
          <li>Set electricity rate per kWh and water rate per cubic meter.</li>
          <li>Enter your official <strong>GCash Mobile Number</strong> and account name.</li>
          <li>Click <strong>Save Financial Configuration</strong> to apply rates across units.</li>
        </ol>
        <div class="tip-box">
          Tip: Ensure your GCash account name matches official payment recipient details.
        </div>
      </div>

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task L4</span> Add New Resident Tenant (Quick Add)</div>
        <p>The fastest onboarding method when meeting residents in person:</p>
        <ol>
          <li>Click <strong>Tenants</strong> in the sidebar and click <strong>+ Add Tenant</strong>.</li>
          <li>Select the <strong>Quick Add</strong> onboarding tab.</li>
          <li>Enter the resident Full Name, Email Address, and Phone Number.</li>
          <li>Assign a vacant room, monthly rent, and lease start date.</li>
          <li>Click <strong>Create Tenant Account</strong> to generate login credentials.</li>
        </ol>
      </div>

      <h2>Utility Tariff Structure &amp; Billing Specifications</h2>
      <table>
        <thead>
          <tr>
            <th>Utility Service</th>
            <th>Measurement Unit</th>
            <th>Billing Formula</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Electricity</strong></td>
            <td>Kilowatt-hour (kWh)</td>
            <td>Usage multiplied by configured rate per kWh.</td>
          </tr>
          <tr>
            <td><strong>Water</strong></td>
            <td>Cubic meter (m&sup3;)</td>
            <td>Usage multiplied by configured rate per cubic meter.</td>
          </tr>
          <tr>
            <td><strong>GCash Account</strong></td>
            <td>11-digit mobile number</td>
            <td>Displayed directly on tenant invoices.</td>
          </tr>
        </tbody>
      </table>

      <h2>Tenant Onboarding Options &amp; Account Provisioning</h2>
      <table>
        <thead>
          <tr>
            <th>Onboarding Option</th>
            <th>Intended Applicant</th>
            <th>System Output</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Quick Add</strong></td>
            <td>Walk-in tenants meeting in person.</td>
            <td>Instant account with temporary password.</td>
          </tr>
          <tr>
            <td><strong>Self-Onboarding</strong></td>
            <td>Remote applicants using mobile phones.</td>
            <td>Secure application link sent via SMS or chat.</td>
          </tr>
          <tr>
            <td><strong>Digital Lease</strong></td>
            <td>Approved incoming residents.</td>
            <td>Binding electronic contract ready to sign.</td>
          </tr>
        </tbody>
      </table>

      <div class="tip-box">
        <strong>Privacy Standard:</strong> Tenant phone numbers and contact details remain protected under Republic Act 10173.
      </div>
    </div>

    <div class="running-footer">
      <span>iReside User Manual &bull; Version 1.0</span>
      <span class="page-number">Page 10 of 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 11: LANDLORD GUIDE - INVITES & WALK-IN APPLICANTS                    -->
  <!-- ========================================================================= -->
  <div class="page" id="page-11">
    <div class="running-header">
      <span class="app-brand">Landlord Guide</span>
      <span>Invites &amp; Walk-in Applicants</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task L5</span> Generate Self-Onboarding Invite Link</div>
        <p>Allow prospective tenants to complete application forms on mobile:</p>
        <ol>
          <li>Inside the Add Tenant dialog, click <strong>Self-Onboarding Link</strong>.</li>
          <li>Select the target vacant unit and link expiration timeframe.</li>
          <li>Click <strong>Generate Onboarding Link</strong> to create the registration URL.</li>
          <li>Click <strong>Copy Link</strong> or show the QR code to the applicant.</li>
          <li>You receive an instant alert when the tenant submits their application.</li>
        </ol>
      </div>

      ${withScreenshots ? screenAddTenant : textAddTenant}

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task L6</span> Review and Process Walk-in Applications</div>
        <p>Process rental applicants who visit your management office:</p>
        <ol>
          <li>Open <strong>Tenants</strong> in the sidebar and choose the <strong>Applications</strong> tab.</li>
          <li>Click the applicant name to inspect uploaded identity credentials.</li>
          <li>If documentation is approved, click the <strong>Approve Application</strong> button.</li>
          <li>Select the unit assignment and generate the digital lease agreement.</li>
          <li>The platform automatically sends sign-in credentials to their verified email.</li>
        </ol>
      </div>

      <h2>Applicant Verification &amp; Document Review Criteria</h2>
      <table>
        <thead>
          <tr>
            <th>Verification Item</th>
            <th>Required Evidence</th>
            <th>Approval Directive</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Government ID</strong></td>
            <td>UMID, Passport, or Driver License</td>
            <td>Verify photo matches applicant name clearly.</td>
          </tr>
          <tr>
            <td><strong>Mobile Contact</strong></td>
            <td>11-digit Philippine mobile number</td>
            <td>Perform test phone call or SMS inquiry.</td>
          </tr>
          <tr>
            <td><strong>Assigned Room</strong></td>
            <td>Vacant unit on interactive map</td>
            <td>Confirm room status before lease generation.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="running-footer">
      <span>iReside User Manual &bull; Version 1.0</span>
      <span class="page-number">Page 11 of 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 12: LANDLORD GUIDE - PAYMENTS & SUBMETERS                            -->
  <!-- ========================================================================= -->
  <div class="page" id="page-12">
    <div class="running-header">
      <span class="app-brand">Landlord Guide</span>
      <span>Payments &amp; Submeters</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task L7</span> Verify and Settle Tenant Payments</div>
        <p>Confirm electronic GCash transfers or direct cash collections:</p>
        <ol>
          <li>Click <strong>Finance Hub</strong> in the left navigation sidebar.</li>
          <li>Under <strong>Pending Verification</strong>, click the submitted tenant payment row.</li>
          <li>Review the uploaded receipt screenshot and match the reference number.</li>
          <li>Click the <strong>Confirm Payment</strong> button to approve the transaction.</li>
          <li>The tenant balance updates instantly and a receipt is issued.</li>
        </ol>
      </div>

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task L8</span> Record Submeter Readings (Electric &amp; Water)</div>
        <p>Automate tenant utility billing calculations effortlessly:</p>
        <ol>
          <li>Click <strong>Utility Billing</strong> and open the <strong>Submeters</strong> tab.</li>
          <li>Select a room and enter current numbers into <strong>Current Reading</strong>.</li>
          <li>The system computes exact consumption from previous recorded readings.</li>
          <li>Total charges are calculated using your configured utility tariff rates.</li>
          <li>Click <strong>Save Reading &amp; Generate Bill</strong> to post charges.</li>
        </ol>
      </div>

      <h2>Payment Settlement &amp; Submeter Invoicing Matrix</h2>
      <table>
        <thead>
          <tr>
            <th>Workflow Action</th>
            <th>Verification Data</th>
            <th>Ledger Result</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>GCash / Maya</strong></td>
            <td>Match 13-digit reference number against statement.</td>
            <td>Mark invoice paid and issue receipt.</td>
          </tr>
          <tr>
            <td><strong>Physical Cash</strong></td>
            <td>Confirm exact cash received in office.</td>
            <td>Record cash transaction in ledger.</td>
          </tr>
          <tr>
            <td><strong>Partial Payment</strong></td>
            <td>Accepted payment is less than total due.</td>
            <td>Deduct paid amount and retain remaining balance.</td>
          </tr>
          <tr>
            <td><strong>Submeter Billing</strong></td>
            <td>Net usage multiplied by tariff rate.</td>
            <td>Consolidated invoice posted to tenant portal.</td>
          </tr>
        </tbody>
      </table>

      <h2>Utility Tariff Standards &amp; Meter Variance Policies</h2>
      <table>
        <thead>
          <tr>
            <th>Utility Service</th>
            <th>Billing Baseline</th>
            <th>Audit Verification Standard</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Electricity (kWh)</strong></td>
            <td>Submeter consumption multiplied by tariff rate.</td>
            <td>Monthly photo documentation of analog dials.</td>
          </tr>
          <tr>
            <td><strong>Water (Cubic Meters)</strong></td>
            <td>Net volume usage times configured rate.</td>
            <td>Checked against master water utility bill.</td>
          </tr>
        </tbody>
      </table>

      <div class="tip-box">
        <strong>Audit Standard:</strong> Take reference photos of analog meters during monthly inspections to verify records.
      </div>
    </div>

    <div class="running-footer">
      <span>iReside User Manual &bull; Version 1.0</span>
      <span class="page-number">Page 12 of 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 13: LANDLORD GUIDE - MAINTENANCE & ANNOUNCEMENTS                     -->
  <!-- ========================================================================= -->
  <div class="page" id="page-13">
    <div class="running-header">
      <span class="app-brand">Landlord Guide</span>
      <span>Maintenance &amp; Announcements</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task L9</span> Manage and Resolve Maintenance Requests</div>
        <p>Process repair work orders submitted by building residents:</p>
        <ol>
          <li>Click <strong>Maintenance</strong> in the left navigation sidebar.</li>
          <li>Click any ticket marked with a red tag or <strong>Pending</strong> status.</li>
          <li>Review the problem description and photo evidence submitted by resident.</li>
          <li>Assign the repair: <strong>Landlord Repair</strong> or <strong>Third Party Repair</strong>.</li>
          <li>Click the <strong>To Process</strong> button to start scheduling.</li>
          <li>Once work is finished, click the <strong>Mark as Completed</strong> button.</li>
        </ol>
      </div>

      ${withScreenshots ? screenMaintenanceLandlord : textMaintenanceLandlord}

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task L10</span> Post Building Announcements</div>
        <p>Broadcast essential building advisories (such as water maintenance):</p>
        <ol>
          <li>Click <strong>Community Hub</strong> in the left navigation sidebar.</li>
          <li>In the composer toolbar, select the <strong>Announcement</strong> tab.</li>
          <li>Type the full notice details for your building residents.</li>
          <li>Click <strong>Photo</strong> if you wish to attach an informative image.</li>
          <li>Click the <strong>Publish</strong> button in the bottom right corner.</li>
        </ol>
      </div>

      <h2>Maintenance Workflow &amp; Resolution Protocol</h2>
      <table>
        <thead>
          <tr>
            <th>Workflow Stage</th>
            <th>Responsible Actor</th>
            <th>Target Resolution Standard</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Initial Review</strong></td>
            <td>Landlord Property Manager</td>
            <td>Review damage photo within 12 hours.</td>
          </tr>
          <tr>
            <td><strong>Work Assignment</strong></td>
            <td>Internal Caretaker or Vendor</td>
            <td>Schedule physical repair date with tenant.</td>
          </tr>
          <tr>
            <td><strong>Final Sign-Off</strong></td>
            <td>Landlord and Resident Tenant</td>
            <td>Confirm repairs and close maintenance ticket.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="running-footer">
      <span>iReside User Manual &bull; Version 1.0</span>
      <span class="page-number">Page 13 of 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 14: LANDLORD GUIDE - MOVE-OUT, LEDGERS & REPORTS                     -->
  <!-- ========================================================================= -->
  <div class="page" id="page-14">
    <div class="running-header">
      <span class="app-brand">Landlord Guide</span>
      <span>Move-Out, Ledgers &amp; Reports</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task L11</span> Process Move-Out and Security Deposit</div>
        <p>Execute structured move-out settlements when residents vacate:</p>
        <ol>
          <li>Click <strong>Leases</strong> in the sidebar and open <strong>Move-Out Requests</strong>.</li>
          <li>Complete the physical room inspection using the built-in checklist.</li>
          <li>Enter itemized deductions for damages or outstanding utility balances.</li>
          <li>The system calculates the net refundable <strong>Security Deposit</strong> amount.</li>
          <li>Click <strong>Finalize Move-Out</strong> and disburse remaining funds to tenant.</li>
          <li>The assigned room status returns to <strong>Vacant</strong> automatically.</li>
        </ol>
        <div class="tip-box">
          Tip: The system automatically deducts unpaid utility bills from deposits.
        </div>
      </div>

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task L12</span> Export Financial Reports and Ledgers</div>
        <p>Extract verified income and expense records for financial auditing:</p>
        <ol>
          <li>Click <strong>Finance Hub</strong> in the menu and select <strong>Reports</strong>.</li>
          <li>Select your reporting period by month, quarter, or annual range.</li>
          <li>Inspect total collected rent, electricity fees, and water charges.</li>
          <li>Click the <strong>Export PDF</strong> button to download a formatted statement.</li>
          <li>Save or print the document for official property bookkeeping records.</li>
        </ol>
      </div>

      <h2>Move-Out Settlement &amp; Security Deposit Deductions</h2>
      <table>
        <thead>
          <tr>
            <th>Deduction Item</th>
            <th>Assessment Standard</th>
            <th>Settlement Directive</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Utility Arrears</strong></td>
            <td>Final submeter meter readings.</td>
            <td>Deducted directly from deposit balance.</td>
          </tr>
          <tr>
            <td><strong>Room Damages</strong></td>
            <td>Damage exceeding normal wear and tear.</td>
            <td>Itemized repair receipts provided to tenant.</td>
          </tr>
          <tr>
            <td><strong>Net Refund</strong></td>
            <td>Remaining security deposit balance.</td>
            <td>Transferred via GCash or cash within 15 days.</td>
          </tr>
        </tbody>
      </table>

      <h2>Financial Reporting &amp; Tax Audit Export Reference</h2>
      <table>
        <thead>
          <tr>
            <th>Report Format</th>
            <th>Coverage Period</th>
            <th>Key Financial Metrics</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Monthly Rent Ledger</strong></td>
            <td>Current billing month</td>
            <td>Total collected rent, unpaid arrears, utility fees.</td>
          </tr>
          <tr>
            <td><strong>Annual Revenue Sheet</strong></td>
            <td>12-month calendar year</td>
            <td>Gross rental collections, deductions, net income.</td>
          </tr>
          <tr>
            <td><strong>Submeter Utility Audit</strong></td>
            <td>Monthly meter readings</td>
            <td>Initial reading, final reading, total billable units.</td>
          </tr>
        </tbody>
      </table>

      <div class="tip-box">
        <strong>Bookkeeping Directive:</strong> Retain exported PDF financial reports for 5 years for tax compliance.
      </div>
    </div>

    <div class="running-footer">
      <span>iReside User Manual &bull; Version 1.0</span>
      <span class="page-number">Page 14 of 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 15: TROUBLESHOOTING COMMON ISSUES & SECURITY                         -->
  <!-- ========================================================================= -->
  <div class="page" id="page-15">
    <div class="running-header">
      <span class="app-brand">Support &amp; Security</span>
      <span>Troubleshooting Guide</span>
    </div>

    <div class="content">
      <h2>Troubleshooting Frequently Encountered Issues</h2>

      <div class="qa-block">
        <div class="qa-q">1. Did not receive 2FA verification email?</div>
        <p class="qa-a">Check your Spam or Junk folder. Wait 60 seconds before clicking Resend Code.</p>
      </div>

      <div class="qa-block">
        <div class="qa-q">2. Forgotten password and unable to access email?</div>
        <p class="qa-a">Use your Emergency Spare Key. Click Use Emergency Key on the login screen.</p>
      </div>

      <div class="qa-block">
        <div class="qa-q">3. Weak internet connection while submitting payments?</div>
        <p class="qa-a">Save your receipt screenshot. Upload proof once your internet connection is restored.</p>
      </div>

      <div class="qa-block">
        <div class="qa-q">4. Submitted payment not yet deducted from balance?</div>
        <p class="qa-a">Landlords must review and confirm receipts before balances update on screen.</p>
      </div>

      <div class="qa-block">
        <div class="qa-q">5. How to upload clear repair request photos?</div>
        <p class="qa-a">Turn on room lighting. Capture close-up photos of the specific damaged fixtures.</p>
      </div>

      <div class="qa-block">
        <div class="qa-q">6. Who to contact during building emergencies?</div>
        <p class="qa-a">Contact management emergency hotlines or Barangay Marulas Rescue Services immediately.</p>
      </div>

      <div class="qa-block">
        <div class="qa-q">7. How to resolve camera permission errors when uploading receipts?</div>
        <p class="qa-a">Open phone browser settings. Tap Site Settings, select Camera, and choose Allow.</p>
      </div>

      <h2>Data Privacy &amp; Legal Compliance Standards</h2>
      <table>
        <thead>
          <tr>
            <th>Regulatory Mandate</th>
            <th>Protected Domain</th>
            <th>Compliance Implementation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>RA 10173 (Data Privacy)</strong></td>
            <td>Tenant personal information</td>
            <td>Encrypted storage of ID photos and phone numbers.</td>
          </tr>
          <tr>
            <td><strong>RA 8792 (E-Commerce)</strong></td>
            <td>Digital lease agreements</td>
            <td>Legally binding electronic signatures on contracts.</td>
          </tr>
          <tr>
            <td><strong>Audit Trail Standard</strong></td>
            <td>Financial payment records</td>
            <td>Immutable transaction timestamps on receipts.</td>
          </tr>
        </tbody>
      </table>

      <h2>Essential Security Guidelines</h2>
      <ul>
        <li><strong>Keep Passwords Secret:</strong> Never share passwords with anyone. Use mixed letters and numbers.</li>
        <li><strong>Store Emergency Keys Safely:</strong> Save your spare key on a flash drive or notebook.</li>
        <li><strong>Beware of Phishing Messages:</strong> Never log in through text message links. Use official URLs.</li>
        <li><strong>Archive Payment Receipts:</strong> Save reference numbers and keep digital payment proof files.</li>
        <li><strong>Protect Personal Identity Data:</strong> Government IDs remain encrypted and restricted to verified management.</li>
      </ul>
    </div>

    <div class="running-footer">
      <span>iReside User Manual &bull; Version 1.0</span>
      <span class="page-number">Page 15 of 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 16: SUPPORT HELPLINE, FAQS & OPERATIONAL GLOSSARY                     -->
  <!-- ========================================================================= -->
  <div class="page" id="page-16">
    <div class="running-header">
      <span class="app-brand">Support &amp; Reference</span>
      <span>FAQs, Helpline &amp; Glossary</span>
    </div>

    <div class="content">
      <h2>Frequently Asked Questions (FAQs)</h2>

      <div class="qa-block">
        <div class="qa-q">Q: How are monthly electricity and water bills computed?</div>
        <p class="qa-a">System subtracts previous meter readings from current readings and multiplies tariffs.</p>
      </div>

      <div class="qa-block">
        <div class="qa-q">Q: Are digital lease signatures legally binding in the Philippines?</div>
        <p class="qa-a">Yes. Electronic signatures comply with Philippine Republic Act No. 8792.</p>
      </div>

      <div class="qa-block">
        <div class="qa-q">Q: How is resident personal data protected inside iReside?</div>
        <p class="qa-a">System complies with the Philippine Data Privacy Act of 2012 (RA 10173).</p>
      </div>

      <div class="qa-block">
        <div class="qa-q">Q: What should I do if my GCash payment fails during transfer?</div>
        <p class="qa-a">Wait 5 minutes, verify GCash wallet balance, and re-attempt payment transfer.</p>
      </div>

      <h2>Official Helpline &amp; Technical Support</h2>
      <p style="font-size: 7.2pt; margin-bottom: 1.2mm;">
        For operational support, reach out to:
        <strong>support@ireside.ph</strong> | Tel: <strong>(02) 8292-1000</strong> (Monday through Saturday, 8:00 AM &ndash; 5:00 PM).
        Barangay Marulas Hall, MacArthur Highway, Valenzuela City.
      </p>

      <h2>Local Emergency &amp; Assistance Hotlines</h2>
      <table>
        <thead>
          <tr>
            <th>Public Agency</th>
            <th>Service Scope</th>
            <th>Emergency Contact</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Barangay Hall</strong></td>
            <td>Barangay Marulas Community Desk</td>
            <td>(02) 8292-1000</td>
          </tr>
          <tr>
            <td><strong>Fire Station</strong></td>
            <td>Valenzuela Fire Protection Service</td>
            <td>160 / (02) 8292-2222</td>
          </tr>
          <tr>
            <td><strong>Police Substation</strong></td>
            <td>Marulas Police Community Precinct</td>
            <td>166 / (02) 8292-1111</td>
          </tr>
        </tbody>
      </table>

      <h2>Operational Glossary</h2>
      <div class="glossary-item"><span class="glossary-term">2FA:</span> Two-Factor Authentication securing logins with 6-digit email codes.</div>
      <div class="glossary-item"><span class="glossary-term">Base Rent:</span> Fixed monthly accommodation fee excluding utility submeter charges.</div>
      <div class="glossary-item"><span class="glossary-term">Submeter:</span> Individual utility meter dedicated to recording room water or electric usage.</div>
      <div class="glossary-item"><span class="glossary-term">Maintenance Ticket:</span> Digital work order tracking property repairs and resolutions.</div>
      <div class="glossary-item"><span class="glossary-term">Emergency Spare Key:</span> Cryptographic backup code restoring access when phones are lost.</div>
      <div class="glossary-item"><span class="glossary-term">Dashboard:</span> Operational overview displaying rent statuses, announcements, and quick tools.</div>
      <div class="glossary-item"><span class="glossary-term">Ledger:</span> Comprehensive financial ledger tracking debits, credits, and rent collections.</div>
      <div class="glossary-item"><span class="glossary-term">Invoice:</span> Itemized monthly billing statement specifying exact payments due.</div>
      <div class="glossary-item"><span class="glossary-term">Unit Map:</span> Visual floorplan displaying vacant and occupied rental rooms.</div>
      <div class="glossary-item"><span class="glossary-term">Security Deposit:</span> Upfront refundable deposit protecting landlords against property damages.</div>
      <div class="glossary-item"><span class="glossary-term">Upload:</span> Submitting images or documents from your device to iReside.</div>
      <div class="glossary-item"><span class="glossary-term">Move-Out Notice:</span> Formal notification declaring intention to vacate rental premises.</div>
      <div class="glossary-item"><span class="glossary-term">Tariff Rate:</span> Unit cost per kilowatt-hour or cubic meter of water.</div>

      <p style="font-size: 6.8pt; color: #666; text-align: center; margin-top: 1.2mm; border-top: 1px solid #ddd; padding-top: 0.6mm;">
        &copy; 2026 iReside Technologies. All rights reserved. Authorized Operational Guide.
      </p>
    </div>

    <div class="running-footer">
      <span>iReside User Manual &bull; Version 1.0</span>
      <span class="page-number">Page 16 of 16</span>
    </div>
  </div>

</div>

</body>
</html>
`;
}
