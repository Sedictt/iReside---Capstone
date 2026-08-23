# 🧭 iReside: Team Alignment, System Roadmap & Strategic Decision Guide

> **Target Audience:** All Team Members & Project Contributors  
> **Purpose:** Catch up on the system's current architecture, understand planned changes, review risks and loopholes, and collaboratively decide on open items without unilateral assumptions.  
> **Last Updated:** August 2026

---

## 📌 1. Executive Summary & Why We're Doing This (The "Why")

### What Happened During Past Evaluations?
During defense evaluations, the panel consistently raised a critical question about our system's architecture:
> ⚠️ **The Panel's Big Concern:**  
> *"Who governs, monitors, and pays for the servers after you graduate? If you are a SaaS company, who reviews landlord registrations and moderates tenant disputes? If you abandon the server, the whole system dies."*

### The Solution: The "Turnkey Private Deployment" Pivot
Instead of pretending to run a perpetual SaaS startup with a Super Admin department that ceases to exist after graduation, we are pivoting to a **Self-Contained Turnkey System Model**:

1. **What is a "Turnkey System"?**
   - Think of it like setting up a POS system, CCTV network, or customized WordPress portal for a business: we provide the software and configure it, but **the client landlord completely owns and governs their own system**.
   - The landlord has their own private cloud infrastructure (Supabase + Vercel) which runs on free/low-cost tiers with **zero ongoing monthly server fees** and **zero IT staff needed**.
2. **What is the Student Team's Role?**
   - We are the **Deployment Consultants & Software Engineers**. We deliver the software, conduct a 10-minute guided setup session, hand over the administrative credentials, and execute a formal **System Handover Agreement**.
   - After handover, the landlord is the sole governing authority of their property.

---

## 🗺️ 2. The Simple Flow: How the System Works in Real Life (Day 0 to Year 2+)

Here is how the entire system actually works from the day we install it to years down the road:

```
+----------------------------------------------------------------------------------------------------+
|                                      THE SIMPLE SYSTEM STORY                                       |
|                                                                                                    |
|   [ 1. THE 10-MIN SETUP ]       [ 2. APPS & ONBOARDING ]      [ 3. DAILY OPERATIONS ]              |
|   • We connect the cloud        • Landlord installs on PC     • Auto-bills sent on the 1st         |
|   • Landlord enters name & logo • Prints QR flyer for lobby   • Tenants pay with GCash             |
|   • Landlord creates login      • Tenants scan to join        • Landlord approves with 1 click     |
|                                                                                                    |
|                                         │                                                          |
|                                         ▼                                                          |
|                            [ 4. IF A LAPTOP BREAKS (YEAR 2+) ]                                     |
|                            • Landlord gets a new laptop                                            |
|                            • Opens their website link & logs in                                    |
|                            • 100% of leases, payments & records are still there!                   |
+----------------------------------------------------------------------------------------------------+
```

### 1️⃣ Phase 1: Day 0 — The 10-Minute Setup Session
* **Step A (Our Job - 5 mins):** During the initial meeting, we open the setup page, paste the client's cloud database keys, and click *"Initialize"*.
* **Step B (Landlord's Job - 5 mins):** We turn the laptop to the landlord. They type in their **Property Name** (e.g., *"Reyes Residences"*), upload their **Logo**, pick a **Theme Color**, and create their **Master Admin Account** (email + password).
* **Step C (Handover & Ownership Transfer):** The system generates a downloadable **System Handover Kit (PDF)** directly in the landlord's dashboard containing their cloud endpoints and recovery steps. The student team's temporary setup access is revoked, and the landlord takes full ownership.

---

### 2️⃣ Phase 2: Day 1 — Installing Apps & Inviting Tenants
* **For the Landlord:** They visit their website link and click *"Install Desktop App"* to get a dedicated icon on their Windows PC.
* **For the Building:** The landlord clicks *"Print Lobby Flyer"* on their dashboard to print a poster with a QR code. They stick this flyer on the lobby wall or reception desk.
* **For the Tenants:** Tenants scan the lobby flyer with their phones. The resident app opens, letting them sign up, review their digital lease contract, and see their room details.

---

### 3️⃣ Phase 3: Day 30+ — Everyday Monthly Operations
* **Automated Billing:** On the 1st of every month, the system calculates rent and utility bills and sends them to each tenant.
* **GCash Payments:** Tenants scan the landlord's GCash QR code directly in the app and upload a screenshot of their receipt. The landlord reviews and approves it in seconds.
* **Zero Maintenance:** The cloud system runs quietly 24/7 on free tiers without the landlord ever needing to touch a server or hire an IT person.

---

### 4️⃣ Phase 4: Year 2+ — What If the Landlord's Laptop Breaks?
* If the landlord's computer is damaged or lost 2 years later:
  1. They buy a new laptop, open any web browser, and go to their property link (e.g., `reyes-residences.vercel.app`).
  2. The website **already has their custom name, logo, and colors** because it is stored safely in the cloud.
  3. The landlord logs in with their email and password.
  4. **Everything is right where they left it:** all past receipts, signed contracts, active tenants, and maintenance logs appear instantly. Zero data lost!

---

## 🔄 3. Feature Lifecycle Audit: What Changes?

To make the system clean, defensible, and focused on actual landlord-tenant needs, here is the breakdown of features:

```
+-----------------------------------------------------------------------------------+
|                            FEATURE LIFECYCLE SUMMARY                              |
|                                                                                   |
|   [ 🟢 KEEP & POLISH ]         [ 🔄 TRANSFER ]          [ 🔴 RETIRE / REMOVE ]    |
|   - Rent Collection (GCash)    - System Health Monitor  - SaaS Super Admin Portal |
|   - Digital Lease Signing      - Standalone PDF Signer  - Public Self-Signup      |
|   - Maintenance Triage         - Daily DB Backups       - LGU Permit Web Scraper  |
|   - Resident Direct Chat                                - Cross-Landlord Directory|
+-----------------------------------------------------------------------------------+
```

### A. 🟢 Keep & Polish (Core Value)
* **GCash Payment Flow:** Itemized billing (Rent + Water + Electricity) with payment proof upload and landlord verification.
* **Digital Leases & Contracts:** In-browser digital signature signing and downloadable PDF generation.
* **Maintenance Request Engine:** Categorized repair tickets with before/after photos and landlord status updates.
* **Community Hub & Messaging:** Private direct messaging between landlord and residents, plus building-wide announcements.

### B. 🔄 Transfer & Repurpose (Moved to Landlord Settings)
* **System Health Monitor:** Formerly on the Super Admin page — now accessible directly in **Landlord Settings ➔ System Diagnostics** (checks Supabase connectivity, database storage usage, and keep-alive status).
* **Database Backups:** Moved to **Landlord Settings ➔ Data Management** (one-click CSV/JSON data export for disaster recovery).
* **Standalone PDF Signer:** Moved to **Landlord ➔ Documents Hub** as a utility tool for uploading and signing general property addendums.

### C. 🔴 Retire / Remove (Unnecessary SaaS Overhead)
* **Super Admin Portal (`/admin/*`):** Removed because there is no post-graduation governing entity.
* **Public Landlord Self-Signup (`/signup`):** Removed. Since each deployment is dedicated to one property, the landlord creates their master admin account during initial setup.
* **LGU Permit Web Scraper:** Removed due to high risk of external government site breakages and fragile scraping logic.

### D. 🚀 Add (Turnkey Essentials)
* **Technical Commissioning Hub (`/setup/technical`):** A 3-step installer screen used by students during handover to verify database keys, SMTP email, and run database migrations.
* **Business Personalization Wizard (`/setup`):** The landlord's first-launch screen (sets Property Name, Logo, Brand Theme, and Master Admin login).
* **Multi-Device Download Page (`/download`):** Download page for the Windows Desktop installer (.exe) and Android mobile app (.apk / QR code install).
* **Lobby QR Code Flyer Generator:** Allows landlords to print a branded PDF flyer with a QR code for the building lobby so residents can easily join the portal.
* **Automated 24h Keep-Alive Cron:** A lightweight background worker that prevents Supabase free-tier databases from pausing after 7 days of inactivity.

---

## 🕳️ 4. Risks, Loopholes ("Holes"), and Concrete Solutions

Here are the technical and academic blindspots we need to watch out for, along with how we solve them:

### Hole 1: "What if the free database goes to sleep after 7 days of inactivity?"
* **The Risk:** Supabase free tier pauses projects after 7 consecutive days without requests. If a small landlord has no activity during a quiet week, the site might show a database error.
* **The Solution:** We set up a free automated daily keep-alive cron job (via Vercel Cron or GitHub Actions) that pings `/api/cron/keep-alive` every 24 hours. The database stays active 24/7 forever without paying a cent.

### Hole 2: "What if the landlord's computer crashes or they lose their phone?"
* **The Risk:** The panel might ask: *"If the landlord loses their computer, do they lose all tenant data?"*
* **The Solution:** The database lives in the **Cloud (PostgreSQL on Supabase)**, NOT locally on the landlord's device. If they buy a new laptop or phone, they simply open the portal and sign in — 100% of their records, receipts, and leases are restored instantly.

### Hole 3: "How do we defend our sample size of 4 landlords (N=4)?"
* **The Risk:** A panelist might ask: *"Is testing on only 4 landlords enough for a capstone?"*
* **The Solution (Academic Grounding):**
  * We frame our evaluation around **Usability Engineering (Jakob Nielsen, 2000 - Nielsen Norman Group)**:
    > *"Testing with 4–5 representative users uncovers 80–85% of all core usability defects in complex workflows."*
  * We tested across **4 distinct property archetypes in Valenzuela City**:
    1. *Apartment Complex* (Whole-unit leases, individual submeter billing).
    2. *Student Dormitory* (Bedspace leases, equal utility splitting per head).
    3. *Boarding House* (Room leases, flat monthly utility fee).
    4. *Commercial/Mixed Residential* (Variable multi-unit billing).

### Hole 4: "What about app distribution (Desktop & Mobile)?"
* **The Risk:** Promising official Apple App Store or Google Play Store deployment requires paid developer accounts ($99/yr Apple, $25 Google) and lengthy app review periods.
* **The Solution:**
  * **Windows Desktop:** Packaged lightweight native installer (`.exe` via Tauri/Electron).
  * **Android Mobile:** Direct `.apk` download and installable Progressive Web App (PWA) with camera hardware permissions.
  * **Universal Web Access:** Accessible directly in any web browser without installation.

---

## 🗳️ 5. Decisions to Make Together as a Team

Please review these open questions so we can agree on the final implementation details:

| # | Question / Decision Point | Option A | Option B (Recommended) | Option C |
|---|---|---|---|---|
| **1** | **Meter Reading Error Protection** | Allow landlord to edit readings anytime | **Read-only once invoice is created; adjustments require an explicit "+/- Adjustment" item to preserve the audit trail** | Hard cap preventing bills > ₱50,000 without admin pin |
| **2** | **Dormitory Utility Splitting when Beds are Vacant** | Split only among active tenants (remaining tenants pay more) | **Split by total room capacity (Landlord covers vacant shares to protect staying tenants)** | Flat utility fee bundled into rent |
| **3** | **Partial Rent Payments** | Strictly disallow (Full payment only) | **Landlord toggle in Settings: "Allow/Disallow Partial Payments"** | Always allow partial payments |
| **4** | **Initial Setup Method for Landlords** | Students do everything via terminal/SQL | **2-Tier Setup: Students do 5-min technical setup at `/setup/technical`; Landlord personalizes at `/setup`** | Landlord must follow a 20-page manual alone |
| **5** | **App Packaging for Defense** | Browser URL only | **Windows `.exe` + Android `.apk` / PWA + Live Web Fallback** | Publish to Google Play Store |

---

## 🗺️ 6. Implementation Roadmap & Prototype Status

Here is the step-by-step rollout plan for the remaining tasks:

```
[ Flow 1: Technical Setup (/setup/technical) ] ➔ DONE & POLISHED
[ Flow 3: App Download Hub (/download) ]        ➔ DONE & POLISHED
[ Flow 2: Landlord Personalization (/setup) ]   ➔ NEXT TO BUILD
[ Flow 4: Lobby QR Code Flyer Generator ]       ➔ QUEUED
[ Flow 5: Landlord System Diagnostics Page ]    ➔ QUEUED
```

### Action Items & Task Allocations
1. **Frontend / UI:**
   - [x] Build Technical Commissioning Stepper (`/setup/technical`).
   - [x] Build App Download Hub (`/download`).
   - [ ] Build First-Launch Landlord Personalization Wizard (`/setup`).
   - [ ] Build Printable Lobby QR Code Flyer component.
2. **Backend & Database:**
   - [ ] Verify `system_settings` table for property brand colors and logo storage.
   - [ ] Ensure Vercel daily keep-alive cron is scheduled (`/api/cron/keep-alive`).
   - [ ] Test GCash QR upload and dynamic checkout rendering.
3. **Documentation & Defense Prep:**
   - [x] `docs/DEFENSE_MASTER_REBUTTAL_GUIDE.md` (Panel trap questions & answers).
   - [ ] Build the downloadable **System Handover Kit (PDF Generator)** inside Landlord Settings.

---

> 💡 **Next Team Discussion:** Let's review the table in Section 5 together. Once we agree on Options 1–5, we will finalize the remaining screens and run our first full dry-run demo!
