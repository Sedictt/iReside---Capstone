<!-- converted from iReside_User_Manual.docx -->

IRESIDE SYSTEM USER MANUAL
iReside: Integrated Rental Property Management Platform
Oral Defense Evaluation & System Turnover Edition | Academic Year 2025–2026
────────────────────────────────────────────────────────────────────────
iReside — Official System User Manual
Integrated Rental Property Management Platform
Document Reference: IR-UM-2026-V1
Prepared for: Academic Capstone Oral Defense & Enterprise System Turnover
Publication Date: May 2026 | Document Revision: 1.0
Document Control & System Turnover Acceptance
Document Identification
- Project Title: iReside: Integrated Rental Property Management Platform
- Target Deployment: Valenzuela City Rental Communities (Barangay Marulas Pilot)
- Document Purpose: Comprehensive operational user guide, oral defense evaluation reference, and formal system turnover artifact.
- Audience: Property Owners (Landlords), Residents (Tenants), System Administrators (IT Personnel), and Capstone Examination Panelists.
Turnover Sign-Off & Acceptance Sheet
This sheet verifies that the system functions, operational workflows, and software deliverables have been inspected, tested, and accepted for handover.

Documentation Ecosystem & Manual Taxonomy
To accommodate both non-technical everyday users and technical evaluators/administrators, the iReside platform provides three audience-specific dedicated manuals alongside this All-in-One Master Manual:


Table of Contents
1. Executive Summary & System Overview
2. System Requirements & Required Specifications
- 2.1 Hardware Specifications (Client & Server)
- 2.2 Software Specifications
- 2.3 Network & Connectivity Specifications
3. Requirements Needed Before Installing / Using the System
- 3.1 Prerequisites for Property Owners / Landlords
- 3.2 Prerequisites for Tenants / Residents
- 3.3 Prerequisites for System Administrators
4. User Types & Access Control Matrix
- 4.1 User Roles Defined
- 4.2 Comprehensive Role-Based Access Control (RBAC) Matrix
5. How Users Access the System
- 5.1 Web Portal URL Access
- 5.2 Invitation Links & First-Time Onboarding
- 5.3 Authentication & Password Recovery
- 5.4 Progressive Web App (PWA) Mobile Installation
- 5.5 Android Dedicated APK Installation
6. System Functions & Architecture
- 6.1 Core Functional Modules
- 6.2 Interactive Unit Map (2D Engine)
- 6.3 Automated Billing & GCash Financial Ledger
- 6.4 Utility Submetering Engine
- 6.5 Digital Lease Contracts & E-Signatures
- 6.6 Maintenance Dispatch & Photo Verification
- 6.7 Community Hub & Communication Hub
- 6.8 iRis AI Intelligent Resident Assistant
- 6.9 Move-Out Settlement & Security Deposit Refund
7. How to Use the System: Step-by-Step Operator Guides
- 7.1 Landlord / Property Manager Operations Guide
- 7.2 Tenant / Resident Operations Guide
- 7.3 System Administrator Operations Guide
8. Offline Mode & Data Resiliency
9. Troubleshooting & Frequently Asked Questions
10. Defense Evaluation Checklist
1. Executive Summary & System Overview
iReside is an enterprise-grade Integrated Rental Property Management Platform specifically engineered to digitize, streamline, and modernize rental operations in multi-family residences, apartment complexes, and dormitory facilities.
In traditional rental setups across the Philippines (such as apartment clusters in Valenzuela City), landlords and tenants grapple with fragmented paper receipts, unlogged maintenance verbal requests, lost GCash transaction screenshots, manual utility calculations, and delayed emergency notices.
iReside unifies the entire tenancy lifecycle into a secure, responsive, role-delineated web application and installable mobile progressive web app (PWA), backed by:
- Cloud-Native PostgreSQL with Row-Level Security (RLS) ensuring airtight tenant-landlord data isolation.
- Interactive 2D Digital Floor Planning enabling intuitive spatial awareness and real-time occupancy status.
- Automated Billing & GCash Verification Pipeline transforming screenshot receipts into tamper-resistant financial ledgers and downloadable PDF Official Receipts (OR).
- Legally Binding Digital E-Signatures compliant with modern digital document standards.
- Utility Submeter Splitters calculating kilowatt-hour (kWh) and water cubic meter (m³) usage automatically from photo-logged readings.
- iRis AI Property Concierge providing 24/7 intelligent answers to house rules, lease obligations, and maintenance triage.
2. System Requirements & Required Specifications
To ensure optimal performance, low latency, and full functionality (including canvas rendering and real-time chat), devices and servers must satisfy the specifications below.
2.1 Hardware Specifications (Client & Server)
Client-Side Hardware (End-Users: Landlords & Tenants)

Server-Side / Cloud Hosting Hardware (Deployment Host)

2.2 Software Specifications
Supported Web Browsers
iReside utilizes cutting-edge web technologies (CSS Grid, WebGL, Service Workers, Web Audio API, and HTML Canvas). The following modern browsers are officially supported:
- Google Chrome: Version 110 or higher (Recommended for best WebGL rendering)
- Mozilla Firefox: Version 115 or higher
- Microsoft Edge: Version 110 or higher
- Apple Safari: Version 15.4 or higher (macOS and iOS)
- Samsung Internet: Version 20.0 or higher
- Brave / Opera: Modern Chromium-based versions

Operating Systems
- Desktop: Windows 10/11, macOS Monterey (12.0) or newer, Ubuntu 22.04+ / Linux Mint / Fedora.
- Mobile: Android 9.0+ or iOS 14.0+.
2.3 Network & Connectivity Specifications
- Internet Bandwidth: Minimum 1.5 Mbps broadband/cellular (3G/4G/5G/Fiber). Recommended 5 Mbps+ for high-resolution maintenance photo uploads .
- Network Latency: < 150 ms ping to cloud edge nodes.
- Communication Protocol: Encrypted TLS 1.3 (HTTPS) across port 443; WebSocket Secure (WSS) on port 443 for real-time chat and instantaneous notification delivery.
- Offline Tolerance: Supported via IndexedDB and Service Worker caching for core viewing and read-only checklist operations.
3. Requirements Needed Before Installing / Using the System
Before accessing, installing, or deploying iReside, operators and participants must fulfill these prerequisites:
3.1 Prerequisites for Property Owners / Landlords
1. Registered Property Information:
- Physical building address, barangay location, and building footprint layout.
- Exact unit counts, floor groupings, monthly base rental rates, and unit capacity.
2. Billing & Banking Setup:
- Active GCash Merchant or Personal Account with a downloadable high-resolution QR code image (JPG or PNG).
- Defined billing day-of-the-month (e.g., every 1st, 5th, or 15th) and grace period length.
3. Utility Submeter Hardware:
- Physical electric submeters (reading kilowatt-hours - kWh) installed outside units.
- Physical water submeters (reading cubic meters - m³) installed on unit lines.
- Current rate tariffs (Meralco per kWh rate; Maynilad/Manila Water per cubic meter rate).
4. Digital Identity & Documentation:
- Valid government ID and business permit/barangay authorization.
- Master lease agreement template clauses (rules regarding pets, visitors, curfews, and noise restrictions).
3.2 Prerequisites for Tenants / Residents
1. Valid Personal Email Address: Required for receiving official onboarding invitation links, password credentials, automated invoice alerts, and signed lease contracts.
2. Smartphone or Computer with Camera: Required for scanning QR codes, uploading GCash transaction proofs, taking maintenance photos, and digitally signing contracts.
3. Verified GCash / Online Banking Account: Funded account capable of generating a standard Reference Number and screenshot receipt upon payment.
4. Valid Government or Student Identification: Required for walk-in application verification and lease profiling.
3.3 Prerequisites for System Administrators / IT Handover Staff
1. GitHub Account & Source Code Access: Permission to the repository Sedictt/iReside---Capstone.
2. Supabase Cloud Account: Access to project dashboard with administrative privileges (service_role key access).
3. Vercel Account: Pro/Hobby account linked to repository for continuous deployment and edge function routing.
4. SMTP Service Provider: Google Account with 2-Step Verification enabled and a 16-character App Password, or API access to SendGrid/Resend.
5. AI API Key (Optional for iRis): Active API key from Groq (Llama-3-70b-versatile) or OpenAI (gpt-4o-mini).
4. User Types & Access Control Matrix
iReside enforces strict Role-Based Access Control (RBAC) coupled with database-level Row Level Security (RLS). Every database request validates the requester's authenticated session token against their assigned role.
4.1 User Roles Defined

1. System Administrator (IT Staff):
Oversees infrastructure health, database schemas, environment variables, cron scheduling, and system disaster recovery. Does not intervene in day-to-day tenancy disputes.
2. Landlord / Property Manager:
The property administrator. Manages buildings, configures units, sets pricing, sends onboarding invites, creates and signs leases, validates GCash payments, dispatches maintenance personnel, broadcasts notices, and executes move-out refunds.
3. Tenant / Resident:
The verified leaseholder occupying a specific unit. Reviews their lease, signs contracts with e-signatures, receives itemized monthly statements, submits GCash payment proofs, logs repair requests with photos, chats with the landlord, and participates in the community hub.
4. Prospective Resident / Applicant:
Unregistered or newly invited user who views available rooms, submits tenant screening applications, uploads proof of income, and tracks application status before signing a lease.
4.2 Comprehensive Role-Based Access Control (RBAC) Matrix

5. How Users Access the System
5.1 Web Portal URL Access
Users can access iReside from any browser:
- Production URL: https://ireside.ph (or assigned Vercel deployment URL)
- Local Development URL: http://localhost:3000
- Automatically routes users to /login if unauthenticated. Once authenticated, users are routed based on role:
- Landlords → /landlord
- Tenants → /tenant
- Technical Admins → /setup/technical
5.2 Invitation Links & First-Time Onboarding
To prevent unauthorized signups and maintain strict tenant screening, iReside operates on an invitation-validated model:
1. The Landlord generates a unique onboarding link (or QR code) from the Tenants → Invite Tenant modal.
2. The Tenant receives an email invitation containing a secure cryptographic token.
3. Clicking the link opens the dedicated onboarding screen (/invite/[token]).
4. The tenant confirms their full legal name, sets a secure password (minimum 8 characters with letters and numbers), accepts the building privacy consent agreement, and enters their unit dashboard immediately.

5.3 Authentication & Password Recovery
- Standard Login: Visit /login, input email address and password, and click Sign In.
- Session Duration: Sessions are maintained via encrypted HttpOnly JSON Web Tokens (JWT) for 7 days.
- Forgot Password Workflow:
1. Click Forgot Password? on the login screen.
2. Enter the registered account email.
3. The system sends an email with a time-limited (1 hour) password reset link.
4. Enter and confirm the new password.
5.4 Downloadable Native Windows Desktop Application (.exe)
For landlords, property managers, and front-desk leasing offices, iReside provides a dedicated, standalone desktop client:
- Executable Package: iReside-Setup-v2.1.0-x64.exe (Tauri/Electron native wrapper)
- Supported Systems: Windows 10 (64-bit) and Windows 11 (x64 / ARM64).
- Advantages over Browser:
- Standalone application window with desktop and Start Menu shortcut icons.
- Dedicated hardware acceleration for the 2D Interactive Unit Floorplan builder.
- Multi-monitor support for simultaneous property mapping and payment verification.
- High-performance local caching with background cloud database synchronization.
- Installation Procedure:
1. Open your browser and navigate to https://ireside.ph/download (or your property deployment URL).
2. Click Download for Windows (.exe).
3. Locate iReside-Setup-v2.1.0-x64.exe in your Downloads folder and double-click to launch.
4. If prompted by Windows SmartScreen, click More info → Run anyway.
5. The installer configures local assets and automatically creates a desktop icon.
6. Launch iReside Desktop and log in with your landlord credentials.
5.5 Downloadable Native Android Mobile Application (.apk)
For tenants and on-the-go landlords, a native Android Package (.apk) provides direct smartphone hardware integration:
- Package Name: iReside-Mobile-v2.1.0.apk
- Supported Systems: Android 8.0 (Oreo), 9, 10, 11, 12, 13, 14, and newer.
- Advantages over Browser:
- Direct hardware camera integration for snapping GCash payment confirmations and repair photos without file picker friction.
- Real-time Android push notifications for upcoming rent due dates, payment approvals, and building notices.
- Full-screen touch optimized interface eliminating mobile browser navigation bars.
- Fast offline reading for emergency contacts and building house rules.
- Installation Procedure:
1. Open your mobile browser on your Android smartphone and go to https://ireside.ph/download.
2. Tap Download APK (or scan the desktop QR code using your phone camera).
3. When downloaded, tap the notification or open the file from your phone's Files / Downloads folder.
4. If prompted with "For your security, your phone is not allowed to install unknown apps from this source", tap Settings → enable "Allow from this source", then return and tap Install.
5. Once installation finishes, tap Open to launch the iReside Mobile App.
5.6 Progressive Web App (PWA) Mobile Installation (iOS & Android Alternative)
For iPhone users or devices where APK installation is restricted:
On Apple iOS (iPhone / iPad via Safari):
1. Open Apple Safari and navigate to https://ireside.ph.
2. Tap the Share icon (the square with an upward arrow at the bottom of the screen).
3. Scroll down and tap Add to Home Screen.
4. Confirm the name "iReside" and tap Add in the top-right corner.
5. The app launches independently in standalone full-screen mode from your iOS home screen.
On Android (Google Chrome PWA):
1. Open Chrome and visit https://ireside.ph.
2. Tap the three dots menu in the top-right → tap Install App (or tap the bottom prompt banner).
3. Tap Install to add the application to your app drawer.
5.7 How Users Locate the Download Page in a Turnkey System
Because iReside operates on a Turnkey Private Delivery Model (where each property complex operates its own independent deployment rather than sharing a single centralized SaaS URL), the web address will vary per property (e.g., https://marulas-residences.vercel.app, https://app.yourproperty.ph, or http://localhost:3000).
To ensure that both landlords and residents can effortlessly find and download the Windows and Mobile applications regardless of where the system is deployed, the platform provides 5 built-in discovery methods:

1. The Relative URL Standard (`/download`):
- On any turnkey deployment, the Download Hub is permanently located at the relative path /download.
- Formula: https://[Your-Property-Address]/download
2. Permanent In-App Navigation (Always Visible):
- On the Public Login Page (`/login`): A prominent "Get Apps" button with a download icon is located directly in the top utility header next to the theme toggle. Anyone accessing the property's website can click it before signing in.
- In the Tenant Portal (`/tenant`): In the left navigation menu under Tenant Tools, tenants can click Download App at any time.
- In the Landlord Dashboard (`/landlord`): In the left sidebar under Administration, landlords can click Download Apps to grab the Windows .exe desktop installer.
3. Physical Property Lobby Posters & Welcome Flyers:
- Landlords can generate and print building flyers from the Marketing & Flyers module (/landlord/flyer).
- Every printed flyer automatically generates a dynamic QR code that points directly to that specific property's download URL (${origin}/download).
- Incoming residents simply point their phone camera at the physical flyer on the lobby wall or welcome packet to open the download page.
4. On-Screen QR Code Sharing (at the Leasing Desk):
- When onboarding a new resident at the leasing office, the landlord opens /download on their computer and clicks "Show QR Code".
- A large, high-contrast QR code appears on screen. The tenant scans it from across the desk with their smartphone camera, opening the download page on their device.
5. One-Click Share Link:
- Landlords can click "Copy Link" on the download page to copy the property's exact mobile download link to their clipboard, allowing instant dispatch via SMS, Viber, WhatsApp, or Facebook Messenger.
6. System Functions & Architecture
The following sections provide an architectural breakdown of every system function within iReside.

6.1 Core Functional Modules
- Building & Unit Inventory: Complete record of real estate assets, pricing tiers, unit capacity, floor groupings, and availability states (vacant, occupied, reserved, maintenance).
- Tenant Management: Centralized resident profiles, government ID files, emergency contacts, lease associations, and payment standings.
- Financial Ledger & Billing: Automated invoice calculation engine, receipt screenshot OCR parsing, manual verification queue, itemized deduction tracking, and official PDF receipts.
- Maintenance & Work Orders: Multi-priority ticketing system (urgent, high, medium, low) with real-time status updates, photo proof uploads, contractor assignment, and resident satisfaction ratings.
- Digital Document Vault: Cloud-backed repository for signed contracts, inspection checksheets, and government compliance documents.
6.2 Interactive Unit Map (2D Engine)
- 2D Floorplan Layout: Drag-and-drop spatial canvas where landlords can place, resize, and orient units according to the real physical building layout. Units are dynamically color-coded:
- 🟢 Green: Vacant & Ready for Occupancy
- 🔴 Red: Occupied by Active Tenant
- 🟡 Yellow: Reserved / Pending Lease Signature
- 🔵 Blue: Under Maintenance / Inspection
- 3D Visual Building Explorer: Powered by modern HTML5 Canvas and CSS Grid. Evaluators and landlords can rotate, zoom, and inspect multi-story apartment elevations, seeing unit distribution across floors in real time.
6.3 Automated Billing & GCash Financial Ledger
- Invoice Generation: On the configured billing cycle (e.g., 1st of every month), the system generates an itemized invoice for each occupied unit, combining:
Formula: Total Amount Due = Base Rent + Electric Bill + Water Bill + Amenity/Parking Fees − Credits
- GCash QR Integration: When tenants tap Pay Now, the landlord's exact GCash QR code is displayed alongside the exact total amount and unit reference string.
- Screenshot Verification Queue: The tenant uploads their GCash confirmation screenshot with the reference number. The transaction enters the landlord's Verification Queue. Upon landlord approval, the status changes to Paid, and a downloadable PDF Official Receipt is issued.
6.4 Utility Submetering Engine
- Eliminates disputes over utility sharing.
- Landlords input the current meter reading numbers:
Formula 1 (Usage): Consumption = Current Meter Reading − Previous Meter Reading
Formula 2 (Cost): Utility Charge (PHP) = Consumption × Tariff Rate
- The system prevents negative consumption entries and alerts landlords if usage exceeds 200% of the historical average (indicating possible pipe leaks or faulty appliances).
6.5 Digital Lease Contracts & E-Signatures
- Generates legally structured Philippine residential tenancy agreements incorporating:
- Lessor & Lessee identification
- Unit designation & permitted occupants
- Monthly rental amount, advance deposits, and security deposit holding
- House rules, utility responsibilities, and termination clauses
- Digital Signer: Landlords and tenants sign on-screen via fingertip or mouse on an HTML5 HTMLCanvas signature pad. Signatures are stamped with date, time, IP address, and cryptographic SHA-256 integrity hash.
6.6 Maintenance Dispatch & Photo Verification
- Tenants submit maintenance tickets selecting categories: Plumbing, Electrical, Structural, Air Conditioning, Pest Control, Appliance, General.
- Tenants attach up to 4 photos illustrating the problem.
- Landlord dashboard displays emergency badges for urgent problems (e.g., active water leak).
- Landlords assign internal handymen or external contractors, add estimated resolution times, and upload post-repair completion photos before closing the ticket.
6.7 Community Hub & Communication Hub
- Digital Notice Board: Landlords publish building announcements (scheduled water interruptions, pest fumigation, lobby renovations) with optional pinned priority.
- Neighbor Marketplace & Discussion: Tenants post community messages, organize shared carpools, or trade pre-owned furniture.
- Direct Messaging: 1-on-1 private real-time chat between landlord and tenant with read receipts and image attachments.
6.8 iRis AI Intelligent Resident Assistant
- Available 24/7 in the bottom-right corner of the interface.
- Powered by LLM integration (Groq Llama-3 / OpenAI), contextually grounded in the specific building's house rules, office hours, garbage collection schedules, and emergency contact numbers.
- Guides tenants on how to perform platform actions (e.g., "How do I upload my payment proof?", "Can I have overnight guests?").
6.9 Move-Out Settlement & Security Deposit Refund
- Governs the end-of-tenancy settlement process:
1. Tenant files Intent to Vacate notice (minimum 30 days notice).
2. Landlord conducts digital Move-Out Inspection with photo-logged checklist.
3. System calculates outstanding rent, unpaid utilities, and repair damages.
4. Final refund balance is computed:
Formula: Refund Amount = Security Deposit − (Unpaid Invoices + Repair Deductions)
5. Landlord inputs refund transaction reference (GCash/Bank), and both parties receive a digital settlement statement.
7. How to Use the System: Step-by-Step Operator Guides
7.1 Landlord / Property Manager Operations Guide
Workflow A: Adding a New Property & Configuring Units
1. Log in to the Landlord Portal at /landlord.
2. From the left sidebar, click Properties.
3. Click the black + Add Property button in the upper-right corner.
4. Fill in the modal fields:
- Property Name: (e.g., Marulas Green Residences)
- Full Street Address: (e.g., 123 MacArthur Highway, Barangay Marulas, Valenzuela City)
- Total Floors & Amenities: Check available amenities (Wi-Fi, CCTV, Elevator, Parking).
5. Click Save Property.
6. Select the newly created property and click + Add Unit:
- Specify Unit Number (e.g., Unit 201), Floor Number (2), Base Rent (₱8,500/month), Maximum Occupancy (2 Persons).
7. Save the unit. It immediately appears as Vacant (Green) on the unit map.
Workflow B: Onboarding a Tenant & Creating a Lease
1. Click Tenants in the sidebar, then click Add Tenant.
2. Select Invite via Magic Link.
3. Enter the tenant's full legal name, email address, assigned unit, and lease start date.
4. Click Send Invitation. The tenant receives an email invitation.
5. Once the tenant accepts, navigate to Leases → Create Lease Agreement.
6. Review terms (security deposit amount, advance rent months, utility rules).
7. Apply your digital signature using the signature pad.
8. Click Send Lease for Tenant Signature. Once the tenant signs, the status changes to Active.
Workflow C: Logging Utilities & Verifying GCash Payments
1. On the 25th of the month, click Invoices → Record Submeter.
2. Select the unit, input the latest electricity meter reading (kWh) and water reading (m³), and click Compute & Post.
3. The system automatically attaches the utility charge to the tenant's upcoming invoice.
4. When a tenant pays, navigate to Invoices → Pending Verifications:
- Inspect the uploaded GCash screenshot and verify the reference number against your GCash app.
- Click Approve Payment. The invoice status updates to Paid, and an Official Receipt PDF is automatically dispatched to the tenant.
7.2 Tenant / Resident Operations Guide
Workflow A: Paying Monthly Rent via GCash
1. Log in to your Tenant Portal at /tenant.
2. On your dashboard, locate the Outstanding Balance alert card and click Pay Invoice.
3. Review the itemized breakdown (Base Rent, Electricity, Water).
4. Tap Pay with GCash:
- Scan the Landlord's GCash QR code displayed on screen or copy the mobile number.
- Open your GCash app, send the exact amount, and take a screenshot of the confirmation screen.
5. In iReside, enter the 13-digit GCash Reference Number.
6. Tap Upload Receipt Screenshot and select the photo from your gallery.
7. Click Submit Payment Verification.
8. Once approved by your landlord, download your Official Receipt under the Receipts tab.
Workflow B: Filing a Maintenance Ticket
1. From the navigation bar, tap Maintenance.
2. Tap the blue + New Request button.
3. Select the affected category (e.g., Plumbing).
4. Enter a clear description (e.g., "Kitchen faucet has a steady water leak beneath the sink cabinet").
5. Set urgency: Standard or Emergency (Active Flooding).
6. Tap Add Photos and snap up to 4 photos of the issue.
7. Tap Submit Request. You can track the progress (Pending → Dispatched → In Progress → Completed) and rate the technician's service upon completion.
7.3 System Administrator Operations Guide
Workflow A: Verifying System Health & Keep-Alive Cron
1. Access /setup/technical or inspect Supabase project health.
2. Check the daily keep-alive cron job in Vercel settings (/api/cron/keep-alive).
3. Verify that the automated monthly invoice cron (/api/cron/monthly-invoices) is scheduled for 0 0 1 * * (midnight UTC on the 1st).
4. Test email delivery by executing a test ping through the SMTP diagnostics tool.
8. Offline Mode & Data Resiliency
Rental properties often experience momentary internet dropouts. iReside is engineered with resilient offline-first safeguards:
- Service Worker Cache: Core application UI screens, fonts, styling, and previously fetched unit maps remain accessible even without an active internet connection.
- Action Reminders & Queue: If a landlord records notes or checks units offline, actions are queued in browser localStorage/IndexedDB and synchronized automatically once network connectivity resumes.
- Data Integrity: Idempotency keys prevent duplicate invoice generation or double-payment entries if a user taps a submit button during network re-connection.
9. Troubleshooting & Frequently Asked Questions
FAQ 1: "My GCash payment screenshot fails to upload."
- Cause: Mobile photos exceeding 10 MB or unsupported image formats (HEIC on older iPhones).
- Resolution: Take a screenshot of the photo in your gallery (which compresses the file to < 2 MB in PNG/JPEG) or tap the image compression toggle before uploading.
FAQ 2: "The 3D Unit Map does not display on my computer."
- Cause: Hardware acceleration is disabled in your web browser.
- Resolution: Open Chrome Settings → System → Enable "Use graphics acceleration when available", then restart your browser. Alternatively, switch to the lightweight 2D Map view.
FAQ 3: "I did not receive my invitation email or password reset link."
- Cause: Email filtered by spam filters or incorrect email address entered by landlord.
- Resolution: Check your Spam / Junk folder for emails from noreply@ireside.ph or your landlord's configured mailer. If still absent, ask your landlord to copy your direct magic link from Tenants → Copy Invite Link.
10. Defense Evaluation Checklist
For the Academic Panel Examination Committee and Client Turnover Evaluators:
- [x] Requirement Compliance: System operates on client devices meeting Section 2 hardware and software specifications.
- [x] Security & RLS Isolation: Tenant accounts cannot query, edit, or view records belonging to other tenants or unauthorized units.
- [x] Financial Accuracy: Automated invoice formulas calculate exact rent and submeter totals without rounding errors.
- [x] Digital Legality: E-Signatures are stamped with date, time, and cryptographic integrity hashes.
- [x] Turnover Completeness: Complete source code, SQL schema (source-of-truth-db.sql), and Installation Guide delivered for independent hosting.
| Role | Name | Organization / Affiliation | Signature | Date |
| --- | --- | --- | --- | --- |
| Project Lead / Developer | __________________________ | Capstone Development Team | _________________ | ___/___/2026 |
| System Architect | __________________________ | Capstone Development Team | _________________ | ___/___/2026 |
| Lead Panelist / Evaluator | __________________________ | Academic Examination Committee | _________________ | ___/___/2026 |
| Client / Property Representative | __________________________ | Marulas Property Management | _________________ | ___/___/2026 |
| ┌─────────────────────────────────────────────────────────────┐
                                    │      iReside All-in-One Master System User Manual           │
                                    │    (Complete Compendium for Defense & System Turnover)      │
                                    └──────────────────────────────┬──────────────────────────────┘
                                                                   │
                       ┌───────────────────────────────────────────┼───────────────────────────────────────────┐
                       │                                           │                                           │
                       ▼                                           ▼                                           ▼
        ┌─────────────────────────────┐             ┌─────────────────────────────┐             ┌─────────────────────────────┐
        │     TENANT USER MANUAL      │             │    LANDLORD USER MANUAL     │             │     INSTALLATION GUIDE      │
        │    (Normal Resident User)   │             │   (Normal Operator User)    │             │   (Technical / IT Admin)    │
        ├─────────────────────────────┤             ├─────────────────────────────┤             ├─────────────────────────────┤
        │ • Everyday resident language│             │ • Business management style │             │ • Precise technical runbook │
        │ • GCash payments & receipts │             │ • Unit & tenant management  │             │ • Node.js & npm commands    │
        │ • Photo repair requests     │             │ • Submeter billing logs     │             │ • Supabase PostgreSQL setup │
        │ • Chat & community board    │             │ • GCash payment approvals   │             │ • .env secrets & SMTP setup │
        │ • E-signing lease agreement │             │ • Maintenance dispatch      │             │ • Vercel cloud deployment   │
        │ • ZERO code or DB jargon    │             │ • ZERO developer jargon     │             │ • Automated cron pipelines  │
        │ 📁 iReside-Tenant-User-     │             │ 📁 iReside-Landlord-User-   │             │ 📁 INSTALLATION_GUIDE.md    │
        │    Manual.md                │             │    Manual.md                │             │                             │
        └─────────────────────────────┘             └─────────────────────────────┘             └─────────────────────────────┘ |
| --- |
| [NOTE] Which Manual Should You Read? - If you are a Resident / Tenant: Read the dedicated iReside Tenant User Manual. - If you are a Property Owner / Landlord: Read the dedicated iReside Landlord User Manual. - If you are a System Administrator / Developer: Read the dedicated iReside Installation & Deployment Guide. - If you are an Oral Defense Panelist or Turnover Evaluator: Read this document (USER_MANUAL.md), which serves as the comprehensive master compendium unifying all specifications, user procedures, and technical configurations into a single reference. |
| --- |
| Device Type / Client Application | Minimum Specification | Recommended Specification |
| --- | --- | --- |
| Windows Desktop Client (.exe) | Windows 10 (64-bit) / Windows 11
Intel Core i3 (4th Gen) / AMD Ryzen 3
4 GB RAM
250 MB free SSD disk space | Windows 11 (64-bit)
Intel Core i5 (8th Gen+) / AMD Ryzen 5
8 GB+ RAM
Dedicated GPU with WebGL 2.0 multi-monitor acceleration |
| Android Native Mobile App (.apk) | Android 8.0 (Oreo) or higher
Quad-Core 1.8 GHz processor
3 GB RAM
80 MB free storage
Rear camera for receipt/repair capture | Android 12, 13, 14 or higher
Octa-Core 2.4 GHz processor
6 GB+ RAM
High-resolution autofocus camera with flashlight |
| iOS Mobile Client (PWA) | iOS 14.0 or higher
Apple A10 Fusion chip (iPhone 7+)
2 GB RAM | iOS 16.0+ (iPhone 12 or newer)
4 GB RAM with Safari Web Push notifications enabled |
| Desktop Web Browser Client | Any modern OS (Windows/macOS/Linux)
Dual-core 1.8 GHz, 4 GB RAM
1366 × 768 display resolution | Quad-core 2.4 GHz+, 8 GB RAM
1920 × 1080 Full HD display |
| Tablets (Android / iPad) | Dual-core 1.5 GHz, 3 GB RAM, 1024 × 768 | Quad-core 2.0 GHz+, 4 GB+ RAM, 2048 × 1536 Retina display |
| Component | Minimum Specification | Recommended Specification |
| --- | --- | --- |
| Web / Application Server | Vercel Serverless Edge Platform / 1 vCPU Container
1024 MB Execution Memory Limit
Serverless Edge Runtime Node.js 20+ | Multi-region Edge CDN
2048 MB Memory Ceiling
Sub-100ms serverless function execution budget |
| Database Server | Supabase Managed Cloud / Dedicated PostgreSQL 15
2 Shared vCPU
1 GB Dedicated RAM
10 GB SSD Storage (IOPS 3,000) | 4 vCPU Dedicated PostgreSQL Compute
8 GB RAM
50 GB NVMe Storage with Automated Daily Snapshots |
| File Storage Bucket (CDN) | 5 GB Object Storage (S3-compatible API)
Max file upload size: 10 MB per image | 50 GB High-Throughput Object Storage with Global Edge CDN caching |
| [NOTE] Internet Explorer (any version) and legacy pre-Chromium Edge are not supported. JavaScript must be enabled in the browser settings. |
| --- |
| ┌─────────────────────────────┐
                                  │      SYSTEM ADMINISTRATOR   │
                                  │   (Platform IT & Hosting)   │
                                  └──────────────┬──────────────┘
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        │                                                 │
                        ▼                                                 ▼
         ┌─────────────────────────────┐                   ┌─────────────────────────────┐
         │     LANDLORD / MANAGER      │                   │     APPLICANT / VISITOR     │
         │  (Full Property Governance) │                   │  (Public Vacancy & Portal)  │
         └──────────────┬──────────────┘                   └─────────────────────────────┘
                        │
                        ▼
         ┌─────────────────────────────┐
         │      TENANT / RESIDENT      │
         │  (Self-Service Leaseholder) │
         └─────────────────────────────┘ |
| --- |
| Module & Functional Capability | Administrator | Landlord | Tenant | Applicant | Public Guest |
| --- | --- | --- | --- | --- | --- |
| Access System Infrastructure & DB Schema | FULL | NONE | NONE | NONE | NONE |
| Manage Environment Secrets & Cron Jobs | FULL | NONE | NONE | NONE | NONE |
| Add / Edit / Archive Properties & Units | READ | FULL | NONE | NONE | NONE |
| 2D Interactive Map Customization | READ | FULL | VIEW ONLY | NONE | NONE |
| Generate Tenant Invite Magic Links | NONE | FULL | NONE | NONE | NONE |
| Create & Countersign Lease Contracts | NONE | FULL | SIGN ONLY | NONE | NONE |
| View Tenant Private Profile & Emergency Info | NONE | FULL | OWN ONLY | NONE | NONE |
| Generate & Issue Monthly Invoices | NONE | FULL | NONE | NONE | NONE |
| Log Utility Submeter Readings (kWh / m³) | NONE | FULL | VIEW OWN | NONE | NONE |
| Submit GCash Payment Proofs | NONE | NONE | FULL | NONE | NONE |
| Verify / Reject GCash Receipts & Issue OR | NONE | FULL | NONE | NONE | NONE |
| Submit Maintenance Work Orders with Photos | NONE | CREATE | FULL | NONE | NONE |
| Assign Repair Technicians & Mark Resolved | NONE | FULL | RATE ONLY | NONE | NONE |
| Post Announcements to Community Notice Board | NONE | FULL | COMMENT | NONE | NONE |
| Chat via Direct Messaging | NONE | ALL TENANTS | ASSIGNED LL | NONE | NONE |
| Interact with iRis AI Resident Assistant | TEST | FULL | FULL | FAQ | NONE |
| Process Move-Out Checklist & Security Deposit | NONE | FULL | VIEW OWN | NONE | NONE |
| Browse Vacant Units & Pricing Catalog | VIEW | VIEW | VIEW | FULL | FULL |
| Submit Rental Screening Application | NONE | NONE | NONE | FULL | REDIRECT |
| Landlord Generates Invite ──> Secure Token Emailed ──> Tenant Clicks Link ──> Sets Password ──> Active Session |
| --- |
| ┌─────────────────────────────────────────────────────────────────────────────┐
│                    Turnkey App Download Discovery Channels                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Direct Web Path        ──> https://[your-property-domain]/download       │
│ 2. Login Screen Header    ──> "Get Apps" button in top-right header         │
│ 3. Tenant Sidebar Menu    ──> "Download App" button under Tenant Tools      │
│ 4. Landlord Sidebar Menu  ──> "Download Apps" button under Administration   │
│ 5. Physical Lobby Posters ──> Auto-generated dynamic QR code printed on wall│
└─────────────────────────────────────────────────────────────────────────────┘ |
| --- |
| ┌──────────────────────────────────────────────────────────────────────────────┐
│                              iReside Ecosystem                               │
├──────────────────────────────────────────────────────────────────────────────┤
│  [Visual Map & 3D Engine] ── [Digital Leasing] ── [Billing & GCash Ledger]   │
│  [Utility Submetering]    ── [Work Orders]     ── [Community Notice Board]   │
│  [iRis AI Assistant]      ── [Direct Chat]     ── [Move-Out Refund Engine]   │
└──────────────────────────────────────────────────────────────────────────────┘ |
| --- |