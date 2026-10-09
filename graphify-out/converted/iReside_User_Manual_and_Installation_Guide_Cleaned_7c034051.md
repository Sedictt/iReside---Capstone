<!-- converted from iReside_User_Manual_and_Installation_Guide_Cleaned.docx -->

SECTION 4: USER MANUAL & INSTALLATION GUIDE
iReside: Integrated Rental Property Management Platform
Oral Defense Evaluation & System Turnover Edition | Academic Year 2025–2026
────────────────────────────────────────────────────────────────────────
4. User Manual & Installation Guide
Project Title: iReside — Integrated Rental Property Management Platform
Document Reference: IR-DOC-2026-CH4
Target Audience: Capstone Examination Panelists, Academic Advisers, Property Owners (Landlords), Residents (Tenants), and IT Commissioning Officers (Administrators)
Publication Date: May 2026 | Document Revision: 2.0 (Final Oral Defense & Turnover Edition)
Document Control & System Turnover Acceptance
Handover Commissioning Sign-Off Sheet
*This document and its contained operational workflows and installation procedures have been inspected, tested, and verified in accordance with the project requirements for oral defense presentation and formal software turnover.*


PART I: USER MANUAL
1. System Requirements & Required Specifications
To guarantee system stability, low latency, and fluid interaction (specifically for the interactive 2D visual unit floorplan builder, HTML5 signature pads, and real-time messaging), all client devices and hosting servers must satisfy the specifications below.
1.1 Hardware Specifications
Client Devices (End-Users: Landlords & Tenants)

Cloud Hosting Server Specifications

1.2 Software Specifications
- Supported Web Browsers:
- Google Chrome (Version 110+) — *Recommended for optimal web performance*
- Mozilla Firefox (Version 115+)
- Microsoft Edge (Version 110+)
- Apple Safari (Version 15.4+ on macOS and iOS)
- Samsung Internet (Version 20.0+)
- *Note: Internet Explorer is not supported. JavaScript and LocalStorage must be enabled.*
- Operating Systems:
- Desktop: Windows 10/11 (64-bit), macOS Monterey 12.0+, Ubuntu 22.04 LTS or compatible Linux.
- Mobile: Android 8.0+ or iOS 14.0+.
1.3 Network & Connectivity Specifications
- Internet Bandwidth: Minimum 1.5 Mbps broadband/mobile data. Recommended 5.0 Mbps+ for rapid high-resolution receipt uploads and smooth floorplan rendering.
- Latency: `< 150 ms` ping to hosting edge.
- Security Protocols: Encrypted TLS 1.3 (HTTPS) via Port 443; WebSocket Secure (`WSS`) via Port 443 for real-time messaging and live billing notifications.
- Offline Tolerance: Client UI caching powered by Service Workers and browser IndexedDB allows offline viewing of past bills, emergency contacts, and building house rules.
2. Requirements Needed Before Installing / Using the System
Before using or deploying iReside, each stakeholder group must prepare the following prerequisites:
2.1 For Property Owners / Landlords
- Property Layout & Structural Records: Complete building address, total floor count, unit room numbers, base monthly rental fees, and unit occupant capacities.
- GCash Merchant / Personal Account: Active, verified GCash account capable of receiving funds, along with a high-resolution export of the account's GCash QR Code (PNG or JPG).
- Submeter Hardware: Physical electric submeters (reading kilowatt-hours - kWh) and water submeters (reading cubic meters - m³) installed for each tenant unit, plus current billing rate tariffs (Meralco / Maynilad).
- Master Tenancy Rules: Defined house rules (curfew, visitors, pets, parking policies) to be baked into digital lease contracts.
2.2 For Tenants / Residents
- Valid Email Address: Required for receiving the onboarding invitation magic link, monthly statement alerts, and countersigned lease copies.
- Camera-Enabled Smartphone: Required for scanning the landlord's GCash QR code, photographing payment confirmation screens, and documenting maintenance requests.
- Verified GCash / Online Banking App: Funded account to execute monthly payments and produce 13-digit transaction reference numbers.
- Valid Government / Student ID: Prepared for digital upload during lease registration.
2.3 For System Administrators (IT Commissioning Staff)
- Source Code Access: GitHub repository credentials to `Sedictt/iReside---Capstone`.
- Cloud Service Accounts:
- Supabase project (PostgreSQL database, Auth, and Storage buckets).
- Vercel account (Production hosting and edge functions).
- SMTP transactional email account (Google App Password or Resend API key).
- Groq Cloud or OpenAI API key (for the iRis AI resident concierge).
3. Different Types of Users & Their Corresponding Access
iReside enforces strict Role-Based Access Control (RBAC) backed by PostgreSQL Row-Level Security (RLS) to ensure absolute tenant privacy and landlord isolation.

3.1 User Roles Defined (Turnkey Private Deployment Model)
iReside is engineered as a Turnkey Private Deployment Platform where the property owner retains sovereign master governance over their self-contained installation. The system requires no recurring external IT administrator intervention for daily property operations:
- Landlord / Property Manager (Master Operator & Governor):
The sovereign administrative authority of the private deployment. Configures building and unit inventories, customizes 2D visual unit floorplans, issues tenant onboarding invitations, drafts and countersigns digital leases, logs utility submeter readings, verifies GCash payments, issues Official Receipts, dispatches maintenance tickets, broadcasts building announcements, and executes move-out deposit settlements.
- Tenant / Resident (Self-Service Leaseholder):
The verified resident occupying an assigned unit. Digitally e-signs lease agreements, views monthly itemized billings, executes rent payments via GCash with instant receipt uploads, submits maintenance work orders with photo evidence, communicates directly with property management, and queries the iRis AI resident concierge.
- Applicant / Prospective Resident (Public Portal User):
An unauthenticated or prospective resident who accesses public vacancy listings via `/download` or property links, inspects unit specifications and floorplans, submits rental screening applications with proof of income, and queries building house rules.

3.2 Role-Based Access Control (RBAC) Matrix

4. How Users Can Access the System
4.1 Web Portal Access
- Production URL: `https://ireside.ph` (or custom property domain `https://[property-name].vercel.app`)
- Local Testing URL: `http://localhost:3000`
- The application automatically identifies the user's session role:
- Landlords are directed to `/landlord`
- Tenants are directed to `/tenant`
- Administrators are directed to `/setup/technical`
- Unauthenticated visitors are routed to `/login`
4.2 Invitation Token Onboarding Flow
To prevent unauthorized registrations and preserve screening integrity, tenant onboarding uses secure cryptographic invitations:
- The Landlord inputs the tenant's legal name, email, and assigned unit under Tenants → Add Tenant.
- iReside dispatches an onboarding email containing a single-use token URL (`/invite/[token]`).
- The tenant clicks the link, enters their chosen password, reviews and accepts the property privacy agreement, and gains immediate access to their unit portal.
4.3 Native Windows Desktop Application (.exe)
- Installer File: `iReside-Setup-v2.1.0-x64.exe`
- Installation Procedure:
- Navigate to `/download` on any device.
- Click Download for Windows (.exe).
- Double-click the downloaded executable. If prompted by Windows SmartScreen, click More info → Run anyway.
- The desktop client installs locally and launches with smooth hardware-accelerated rendering.
4.4 Dedicated Android Mobile App (.apk)
- Package File: `iReside-Mobile-v2.1.0.apk`
- Installation Procedure:
- Open Chrome on Android and visit `/download` (or scan the on-screen QR code at the leasing desk).
- Tap Download APK.
- Open the downloaded APK. When prompted with *"Install unknown apps"*, tap Settings → enable "Allow from this source", then tap Install.
- The native app installs with direct camera access for instant receipt and maintenance photo capture.
4.5 Progressive Web App (PWA) Mobile Installation
- On Apple iOS (Safari): Open the website → tap the Share button → select "Add to Home Screen" → tap Add.
- On Android (Chrome): Open the website → tap the three-dot menu → tap "Install App" (or tap the bottom install banner).
4.6 Turnkey Discovery Channels (Finding the Apps)
To ensure users can always download the applications regardless of the deployment URL:
- Direct Path: `https://[your-domain]/download`
- Login Screen: Prominent "Get Apps" button in the top navigation header.
- Tenant Sidebar: Click Download App in the left menu under *Tenant Tools*.
- Landlord Sidebar: Click Download Apps under *Administration*.
- Printed Lobby Posters: Landlords can generate building flyers with auto-generated download QR codes directly from `/landlord/flyer`.
5. System Functions

5.1 Interactive 2D Visual Unit Map & Floorplan Engine
- 2D Visual Floorplan Canvas: Interactive, intuitive canvas allowing landlords to map unit layouts to match the real physical architecture of the property. Units are dynamically color-coded by real-time occupancy state:
- Green (Vacant): Ready for immediate occupancy and tenant allocation.
- Red (Occupied): Leased by an active resident with active contract terms.
- Yellow (Reserved): Pending lease contract drafting or tenant signature.
- Blue (Maintenance): Temporarily offline for repair, turnover inspection, or cleaning.
- Interactive Spatial Unit Inspector: Landlords can click any unit directly on the 2D floorplan to open a modal summary showing occupant details, payment standing, utility usage, and active maintenance work orders.
5.2 Financial Ledger & GCash Payment Automation
- Invoice Generation Engine: Computes monthly totals on scheduled billing dates:
Formula: Total Amount Due = Base Rent + Electric Bill + Water Bill + Amenity Fees − Credits
- GCash QR Integration: Dynamically presents the landlord's verified QR code and reference instructions upon tenant checkout.
- Verification Queue: Tenants submit the 13-digit GCash Reference Number and screenshot proof. Landlords inspect the proof in a side-by-side verification modal and click Approve or Reject.
- Official Receipt Generator: Approved payments automatically generate a tamper-evident, downloadable PDF Official Receipt stamped with transaction date, reference number, and unit ID.
5.3 Utility Submetering Engine
- Eliminates manual utility estimation disputes:
Formula 1 (Usage): Consumption = Current Meter Reading − Previous Meter Reading
Formula 2 (Cost): Utility Charge (PHP) = Consumption × Tariff Rate
- Includes automated anomaly detection: warns the landlord if recorded consumption exceeds 200% of historical average (indicating pipe bursts or meter defects).
5.4 Digital Lease Contracts & E-Signatures
- Standardized legal contract generator incorporating Philippine Tenancy Law provisions.
- Integrated HTML5 canvas allows smooth stylus, touch, or mouse digital signatures.
- Stamped with timestamp, IP address, and SHA-256 cryptographic verification hashes to ensure non-repudiation.
5.5 Maintenance Dispatch & Photo Verification
- Multi-tier ticketing (`Urgent`, `High`, `Medium`, `Low`) with category classification (*Plumbing, Electrical, Structural, Aircon, Pest Control*).
- Tenants upload up to 4 high-resolution photos of the defect.
- Landlord dashboard enables contractor assignment, notes, and completion photo logging before closing the ticket.
5.6 Community Notice Board & In-App Messaging
- Notice Board: Landlords publish building-wide alerts (water interruptions, pest control schedules, elevator maintenance) with priority banners.
- Neighbor Marketplace: Safe resident forum for carpool coordination and pre-owned item trade.
- Direct Messaging: Encrypted 1-on-1 real-time chat between landlords and tenants.
5.7 iRis AI Intelligent Resident Concierge
- Integrated 24/7 resident assistant powered by LLM inference (Groq Llama-3 / OpenAI).
- Context-aware: grounded in the property's specific house rules, trash schedules, quiet hours, and payment policies.
- Answers procedural queries (e.g., *"How do I submit my GCash receipt?"*, *"Are visitors allowed after 10 PM?"*).
5.8 Move-Out Settlement & Security Deposit Refund Engine
- Structured end-of-tenancy settlement:
- Tenant files Intent to Vacate notice.
- Landlord conducts digital Move-Out Inspection with photo-logged checklist.
- System automatically computes deductions:
Formula: Final Refund = Security Deposit − (Unpaid Invoices + Repair Damages)
- Landlord records the GCash/Bank refund reference and issues a digital settlement voucher.
6. How to Use the System (Step-by-Step Operator Procedures)
6.1 Landlord / Property Manager Operations Guide
Procedure 1: Creating a Property & Setting Up Units
- Log in to the Landlord Portal at `/landlord`.
- From the left sidebar, click Properties → click + Add Property.
- Fill in Property Name, Street Address, Barangay, and select building amenities.
- Click Save Property.
- Select the property, click Units, then click + Add Unit.
- Specify Unit Number (e.g., *Unit 302*), Floor (*3*), Monthly Base Rent (e.g., *₱9,000*), and Occupant Capacity (*2*).
- Save the unit. It immediately registers on the Interactive 2D Unit Map.
Procedure 2: Onboarding a Tenant & Executing a Lease
- Navigate to Tenants → click Add Tenant → select Invite via Magic Link.
- Enter the tenant's full legal name, email address, assigned unit, and lease commencement date.
- Click Send Invitation.
- Once the tenant completes profile activation, navigate to Leases → Create Lease.
- Enter deposit amount, advance rent months, and house rules.
- Sign using the digital signature pad and click Dispatch to Tenant for Signature.
- Once countersigned, the lease status transitions to `Active`.
Procedure 3: Recording Utility Submeters & Verifying Payments
- On your monthly meter-reading date, click Invoices → Record Submeter.
- Select the unit, input the current electricity reading (kWh) and water reading (m³), then click Compute & Post.
- When tenants pay, navigate to Invoices → Pending Verifications.
- Review the uploaded GCash screenshot and match the 13-digit Reference Number against your GCash SMS confirmation.
- Click Approve Payment. The invoice status updates to `Paid`, and an Official Receipt PDF is issued to the tenant.
6.2 Tenant / Resident Operations Guide
Procedure 1: Accepting Onboarding Invitation & Activating Account
- Open the invitation email received from iReside and click Activate Your Unit Account.
- On the setup screen (`/invite/[token]`), set a secure password (minimum 8 characters).
- Review the property privacy policy and click Complete Registration.
Procedure 2: Paying Monthly Rent via GCash & Uploading Proof
- Log in at `/tenant`.
- On your dashboard, locate the Outstanding Balance card and tap Pay Invoice.
- Review your itemized charges (Base Rent, Electricity, Water).
- Tap Pay with GCash:
- Scan the Landlord's GCash QR code displayed on screen or copy the mobile number.
- Complete the transfer in your GCash app and save the transaction screenshot.
- In iReside, enter the 13-digit GCash Reference Number.
- Tap Upload Receipt Screenshot and attach the confirmation image.
- Tap Submit Payment. Once approved by your landlord, your Official Receipt is available under Receipts.
Procedure 3: Submitting a Maintenance Ticket with Photos
- In the navigation menu, tap Maintenance → tap + New Request.
- Select category (*Plumbing, Electrical, Structural, Appliance, etc.*).
- Select urgency (*Standard* or *Emergency*).
- Enter an exact description of the issue.
- Tap Add Photos and capture or attach up to 4 photos.
- Tap Submit Ticket. Monitor real-time status updates (*Pending → Dispatched → In Progress → Resolved*).
6.3 System Administrator Operations Guide
Procedure 1: System Health Diagnostic & Backup Verification
- Access the administrator diagnostics console at `/setup/technical`.
- Verify that PostgreSQL connection pool latency is `< 100ms`.
- Check the daily keep-alive cron job status (`/api/cron/keep-alive`).
- Ensure the monthly automated billing cron job (`/api/cron/monthly-invoices`) is scheduled for `0 0 1 * *`.

PART II: INSTALLATION GUIDE
1. Required Software & Hardware
1.1 Development & Commissioning Host Hardware
- Processor: 64-bit multi-core CPU (Intel Core i5 / AMD Ryzen 5 or Apple Silicon M-series).
- RAM: Minimum 8 GB RAM (16 GB recommended for rapid Next.js compilation).
- Disk Storage: Minimum 10 GB free SSD storage for repository, `node_modules`, build artifacts, and database dumps.
- Operating System: Windows 10/11 (64-bit) with PowerShell 7+, macOS 12+, or Ubuntu 22.04 LTS.
1.2 Required Base Software & Runtimes
Verify that the following runtimes are installed on the commissioning workstation:

2. Installation Requirements & Cloud Accounts
Before running installation scripts, prepare credentials for the following services:
- Supabase Account ([https://supabase.com](https://supabase.com)):
- New Supabase project instance (e.g., `ireside-prod`).
- Project API URL (`https://xxxxxxxx.supabase.co`).
- Public Anonymous Key (`anon` key).
- Service Role Secret Key (`service_role` key — keep strictly confidential).
- Direct PostgreSQL Connection URI (`postgresql://postgres.[ref]:[pwd]@aws-0-[region].pooler.supabase.com:6543/postgres`).
- SMTP Transactional Mailer Account:
- Dedicated Gmail account with 2-Step Verification enabled and a 16-character App Password generated, or Resend / SendGrid API key.
- AI Inference Provider (For iRis Concierge):
- Groq Cloud API Key (`gsk_...` via [https://console.groq.com](https://console.groq.com)) or OpenAI API Key (`sk-...`).
- Vercel Account ([https://vercel.com](https://vercel.com)):
- Linked to the GitHub repository for production cloud hosting.
3. Step-by-Step Installation Procedure
Step 1: Clone Repository & Workspace Setup
Open your terminal (PowerShell or Bash) and clone the project:

Step 2: Install Node.js Dependencies
Install all required packages defined in `package.json`:


Step 3: Configure Environment Variables (`.env.local`)
Create `.env.local` in the project root directory and populate it with your credentials:

Master `.env.local` Configuration Template:

Step 4: Initialize Supabase Database (`source_of_truth_db.sql`)
The complete schema, relations, triggers, and Row-Level Security policies are codified in `source_of_truth_db.sql`.
Method A: Via Supabase Web Dashboard (Recommended)
- Navigate to your Supabase Project Dashboard.
- In the left navigation menu, click SQL Editor.
- Click + New Query.
- Open `source_of_truth_db.sql` in your code editor, copy the entire file, and paste it into the editor.
- Click Run (or press `Ctrl + Enter`).
- Confirm that the query executes successfully with all tables and policies created.
Method B: Via Command Line (`psql`)

Step 5: Configure Supabase Storage Buckets & Policies
iReside utilizes cloud object storage for photos and receipts:
- In your Supabase Dashboard, click Storage.
- Verify or create the following 4 buckets:
- `property-images` — Public: ON (Building flyers, property banners, unit photos)
- `billing` — Public: OFF (Payment screenshots, official receipt PDFs)
- `avatars` — Public: ON (User profile pictures)
- `maintenance` — Public: OFF (Repair request and resolution photos)
- Storage Security Policies:
- `property-images` & `avatars`: Allow `SELECT` to `public`.
- `billing`: Allow `INSERT` to authenticated users; allow `SELECT` restricted to tenant and landlord.
- `maintenance`: Allow `INSERT` and `SELECT` to authenticated ticket participants.
Step 6: Configure SMTP Transactional Email Services
- Go to your [Google Security](https://myaccount.google.com/security) settings.
- Confirm 2-Step Verification is active.
- Under *"How you sign in to Google"*, search for and click App Passwords.
- Create an entry named `iReside Mailer` and copy the 16-character code.
- Paste it into `.env.local` under `SMTP_PASS`.
Step 7: Seed Initial Test Accounts & Demo Fixtures
To populate the database with demonstration data for oral defense evaluation:

*(Or insert the standard evaluation accounts provided in the Defense Master Guide).*
Step 8: Launch Local Development Server

Open your browser and navigate to `http://localhost:3000`. Verify that the landing page and login screen load cleanly.
Step 9: Compile Production Build & Smoke Test

Ensure the build completes with zero fatal compilation errors.
4. Any Necessary Configuration
4.1 Cloud Production Deployment (Vercel)
- Push your clean code to your GitHub repository.
- Log into [Vercel](https://vercel.com) → click Add New... → Project.
- Import the repository `Sedictt/iReside---Capstone`.
- Under Environment Variables, copy all key-value pairs from your `.env.local` file (set `NODE_ENV=production` and `NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app`).
- Click Deploy. Vercel will compile and provision edge serverless functions within 2–3 minutes.
4.2 Automated Serverless Cron Jobs Configuration
iReside includes automated cron workers configured via `vercel.json`:
- Monthly Billing Generation (`/api/cron/monthly-invoices`):
- Schedule: `0 0 1 * *` (Runs automatically at 00:00 UTC on the 1st of every month).
- Automatically calculates rent + submeters and creates draft/unpaid invoices.
- Database Keep-Alive Ping (`/api/cron/keep-alive`):
- Schedule: `0 */12 * * *` (Runs every 12 hours).
- Prevents free-tier Supabase projects from pausing due to inactivity.
- Authorization Guard: All cron endpoints check the incoming HTTP `Authorization: Bearer <CRON_SECRET>` header to reject unauthorized requests.
4.3 Custom Domain & TLS / SSL Enforcement
- In Vercel, navigate to Project Settings → Domains.
- Add your custom domain (e.g., `ireside.ph` or `marulas-residences.ph`).
- In your DNS provider (Cloudflare, GoDaddy, Namecheap), add the required `CNAME` and `A` records pointing to `cname.vercel-dns.com` and `76.76.21.21`.
- Vercel automatically provisions and auto-renews free Let's Encrypt TLS 1.3 certificates.
5. Troubleshooting Common Installation Errors

6. Installation Verification & Pre-Defense Commissioning Checklist
Before presenting the system to the capstone oral defense panel or executing formal turnover to the client, verify every item below:
- [ ] Node.js Environment: Verified Node.js v20+ and npm v10+ installed (`node -v`, `npm -v`).
- [ ] Database Integrity: Executed `source_of_truth_db.sql`; confirmed all tables, foreign keys, and RLS policies active.
- [ ] Environment Secrets: Configured `.env.local` with valid Supabase, SMTP, and AI API keys.
- [ ] Storage Buckets: Created `property-images`, `billing`, `avatars`, and `maintenance` buckets with appropriate policies.
- [ ] Transactional Email: Successfully delivered a test invitation link and password reset email.
- [ ] Production Build: Ran `npm run build` with zero fatal compilation errors.
- [ ] Cloud Deployment: Verified Vercel deployment live with valid HTTPS/TLS 1.3 certificate.
- [ ] Cron Workers: Verified `/api/cron/monthly-invoices` responds with HTTP 200 when presented with `CRON_SECRET`.
- [ ] Mobile & Desktop Availability: Verified `/download` serves both the Windows `.exe` and Android `.apk` packages.
- [ ] Printed Copies: Two (2) printed copies of this document bound and ready for panel evaluation and turnover acceptance.
| Role | Evaluator / Signee Name | Designation / Organization | Signature | Date |
| --- | --- | --- | --- | --- |
| Project Lead | __________________________ | Capstone Development Team | _________________ | ___/___/2026 |
| System Architect | __________________________ | Capstone Development Team | _________________ | ___/___/2026 |
| Capstone Adviser | __________________________ | College of Computer Studies | _________________ | ___/___/2026 |
| Lead Defense Panelist | __________________________ | Examination Committee | _________________ | ___/___/2026 |
| Client Representative | __________________________ | Marulas Property Management | _________________ | ___/___/2026 |
| Device Type / Client Application | Minimum Specification | Recommended Specification |
| --- | --- | --- |
| Desktop / Laptop Workstation | • Dual-Core 64-bit CPU (2.0 GHz+)
• 4 GB RAM
• 1366 × 768 display resolution
• 500 MB free local disk storage | • Quad-Core CPU (Intel Core i5 / Ryzen 5 or higher)
• 8 GB+ RAM
• 1920 × 1080 Full HD display
• Dedicated GPU with 2D canvas hardware acceleration |
| Android Smartphone / Tablet | • Android 8.0 (Oreo) or higher
• Quad-Core 1.8 GHz processor
• 3 GB RAM
• 100 MB free internal storage
• Rear autofocus camera (for receipts & repair photos) | • Android 12, 13, 14 or higher
• Octa-Core 2.4 GHz processor
• 6 GB+ RAM
• High-resolution camera with flashlight |
| Apple iOS Devices (iPhone / iPad) | • iOS 14.0 or higher
• Apple A10 Fusion chip (iPhone 7 or newer)
• 2 GB RAM | • iOS 16.0+ (iPhone 12 or newer)
• 4 GB+ RAM with Safari Web Push enabled |
| Dedicated Windows Desktop App (.exe) | • Windows 10 (64-bit) / Windows 11
• 4 GB RAM, 250 MB disk space | • Windows 11 (64-bit)
• 8 GB RAM, SSD storage, Multi-monitor display |
| Server Component | Minimum Specification | Recommended Specification |
| --- | --- | --- |
| Application & API Server (Vercel Edge) | • Serverless Node.js 20+ runtime
• 1024 MB function memory allocation
• Sub-250ms execution timeout | • Multi-zone Global Edge CDN
• 2048 MB function memory ceiling
• Automated continuous deployment from Git |
| Database Server (Supabase Managed) | • PostgreSQL 15.x engine
• 2 Shared vCPUs
• 1 GB Dedicated RAM
• 10 GB SSD Storage (IOPS 3,000) | • 4 Dedicated vCPUs
• 8 GB Dedicated RAM
• 50 GB NVMe Storage with Point-in-Time Recovery (PITR) |
| Object File Storage (CDN Bucket) | • 5 GB S3-compatible cloud storage
• Max 10 MB per image upload | • 50 GB High-Throughput Object Storage with image CDN caching |
| ┌─────────────────────────────┐
                    │     LANDLORD / MANAGER      │
                    │  (Master System Governance) │
                    └──────────────┬──────────────┘
                                   │
           ┌───────────────────────┴───────────────────────┐
           │                                               │
           ▼                                               ▼
    ┌─────────────────────────────┐         ┌─────────────────────────────┐
    │      TENANT / RESIDENT      │         │     APPLICANT / VISITOR     │
    │  (Self-Service Leaseholder) │         │  (Public Vacancy & Portal)  │
    └─────────────────────────────┘         └─────────────────────────────┘ |
| --- |
| [NOTE] **Technical Commissioning vs. Daily Operations:** In accordance with the Turnkey Delivery Model, technical server administration (database migrations, environment variables, and cloud edge routing) is performed exclusively as a one-time commissioning and handover protocol by the Deployment Team (detailed in **Part II: Installation Guide**). Once handed over, the system functions autonomously on enterprise-grade managed cloud infrastructure with zero ongoing developer dependency. |
| --- |
| System Module & Operational Capability | Landlord / Property Manager | Tenant / Resident | Applicant / Public Visitor |
| --- | --- | --- | --- |
| Property & Unit Architecture Configuration | FULL CONTROL | NO ACCESS | NO ACCESS |
| Interactive 2D Visual Floorplan & Unit Map | FULL CONTROL | VIEW ASSIGNED | VIEW VACANT ONLY |
| Tenant Onboarding Magic Link Generation | FULL CONTROL | NO ACCESS | NO ACCESS |
| Digital Lease Drafting & Counter-Signing | FULL CONTROL | SIGN ASSIGNED | NO ACCESS |
| Monthly Billing Invoicing & Submeter Engine | FULL CONTROL | VIEW OWN INVOICES | NO ACCESS |
| Utility Submeter Logging (kWh & m³) | FULL CONTROL | VIEW BREAKDOWN | NO ACCESS |
| GCash Payment Proof Submission | NO ACCESS | FULL CONTROL | NO ACCESS |
| GCash Payment Verification & Official Receipt Issuance | FULL CONTROL | VIEW OWN RECEIPTS | NO ACCESS |
| Maintenance Work Order Submission with Photos | CREATE / MANAGE | FULL CONTROL | NO ACCESS |
| Maintenance Dispatch & Resolution Verification | FULL CONTROL | RATE & CONFIRM | NO ACCESS |
| Community Notice Board Broadcast | FULL CONTROL | COMMENT / VIEW | NO ACCESS |
| Direct 1-on-1 Secure Messaging | ALL RESIDENTS | ASSIGNED LANDLORD | NO ACCESS |
| iRis AI Intelligent Resident Concierge | FULL INTERACTION | FULL INTERACTION | BASIC BUILDING FAQ |
| Move-Out Damage Inspection & Deposit Refund | FULL CONTROL | VIEW SETTLEMENT | NO ACCESS |
| Public Vacancy Catalog & App Download Hub | VIEW / SHARE | VIEW / SHARE | FULL ACCESS |
| ┌─────────────────────────────────────────────────────────────────────────────┐
│                           iReside System Functions                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Interactive 2D Unit Map]  ── [Billing & GCash Ledger] ── [Utility Submeter] │
│  [Digital E-Signatures]   ── [Maintenance Dispatch]   ── [Community Hub]    │
│  [iRis AI Concierge]      ── [Direct Messaging]       ── [Move-Out Refund]  │
└─────────────────────────────────────────────────────────────────────────────┘ |
| --- |
| Runtime / Tool | Minimum Version | Recommended Version | Verification Command |
| --- | --- | --- | --- |
| Node.js | v20.10.0 LTS | v20.18.0 LTS or v22.x | `node -v` |
| npm | v10.2.0 | v10.8.2+ | `npm -v` |
| Git | v2.39.0 | Latest release | `git --version` |
| PostgreSQL Client (psql) | v14.0 | v15.x or v16.x | `psql --version` |
| # Clone the repository from GitHub
git clone https://github.com/Sedictt/iReside---Capstone.git iReside

# Enter the project directory
cd iReside |
| --- |
| # Clean dependency installation using npm
npm install --legacy-peer-deps |
| --- |
| [TIP] The `--legacy-peer-deps` flag ensures seamless compatibility across React 19, Next.js 16, and specialized canvas packages (`@react-three/fiber`, `jspdf`, `react-pageflip`). |
| --- |
| # Create .env.local file
touch .env.local |
| --- |
| # ==============================================================================
# 1. CORE APPLICATION SETTINGS
# ==============================================================================
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ==============================================================================
# 2. SUPABASE DATABASE & AUTHENTICATION SECRETS
# ==============================================================================
# Supabase Project Dashboard -> Project Settings -> API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# PostgreSQL Direct Connection String (Settings -> Database -> Connection String -> URI)
DATABASE_URL=postgresql://postgres.your-project-id:YourPassword@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# ==============================================================================
# 3. SMTP TRANSACTIONAL EMAIL CONFIGURATION
# ==============================================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=property.ireside@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM="iReside Notifications" <property.ireside@gmail.com>

# ==============================================================================
# 4. AI RESIDENT CONCIERGE (iRis ASSISTANT)
# ==============================================================================
GROQ_API_KEY=gsk_your_groq_api_key_here
OPENAI_API_KEY=sk-your_openai_api_key_here

# ==============================================================================
# 5. AUTOMATED CRON SECURITY SECRET
# ==============================================================================
CRON_SECRET=ireside_super_secret_cron_token_2026 |
| --- |
| psql "postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" -f source_of_truth_db.sql |
| --- |
| # Execute initial seed script
npm run db:seed |
| --- |
| # Start Next.js local development server
npm run dev |
| --- |
| # Verify TypeScript types and compile production bundle
npm run build |
| --- |
| Error Symptom | Root Cause | Exact Resolution Procedure |
| --- | --- | --- |
| `UnhandledPromiseRejection: connection timeout to PostgreSQL` | Incorrect database port or network firewall blocking port 5432/6543. | In `.env.local`, ensure `DATABASE_URL` uses port `6543` (transaction connection pooler) rather than `5432` if running on restricted Wi-Fi networks. |
| `Invalid login credentials / SMTP Authentication failed (535)` | Using regular Google account password instead of dedicated App Password. | Generate a fresh 16-character App Password at `myaccount.google.com/apppasswords`. Do not use your personal Gmail login password. |
| `Bucket 'billing' does not exist or row violation` | Storage bucket not created or missing RLS INSERT policy. | Navigate to Supabase Dashboard → Storage → click New Bucket → create bucket named `billing`. Add authenticated upload policy. |
| `Type error: Property '...' does not exist on type '...'` | Node.js / React package mismatch during build. | Run `rm -rf node_modules package-lock.json` followed by `npm install --legacy-peer-deps`. |
| `Cross-Origin Request Blocked (CORS) on API calls` | `NEXT_PUBLIC_APP_URL` does not match the actual browser origin. | Set `NEXT_PUBLIC_APP_URL` in `.env.local` to match your exact protocol and port (e.g., `http://localhost:3000` or `https://ireside.ph`). |