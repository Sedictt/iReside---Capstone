# iReside — Official Installation & Deployment Guide

**Integrated Rental Property Management Platform**  
*Document Reference: IR-IG-2026-V1*  
*Target Audience: System Administrators, IT Commissioning Officers, Panel Evaluators & Developers*  
*Publication Date: May 2026 | Document Revision: 1.0*  

---

## Document Control & Installation Acceptance

### Purpose of this Guide
This document serves as the authoritative, end-to-end technical installation and configuration runbook for the **iReside** property management platform. It describes every prerequisite, dependency, database migration procedure, environment variable, cloud deployment, and sanity verification test required to deploy a fully functional iReside instance from scratch.

### Handover Commissioning Sign-Off
| Role | Name | Organization | Signature | Date |
|---|---|---|---|---|
| **Deploying Engineer** | __________________________ | Capstone Development Team | _________________ | ___/___/2026 |
| **System Administrator** | __________________________ | Client / Hosting Org | _________________ | ___/___/2026 |
| **Oral Defense Panelist** | __________________________ | Examination Committee | _________________ | ___/___/2026 |

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Required Software & Hardware](#2-required-software--hardware)
   - 2.1 [Development & Deployment Host Hardware](#21-development--deployment-host-hardware)
   - 2.2 [Required Base Software & Runtimes](#22-required-base-software--runtimes)
3. [Installation Requirements & Cloud Accounts](#3-installation-requirements--cloud-accounts)
4. [Step-by-Step Installation Procedure](#4-step-by-step-installation-procedure)
   - [Step 1: Clone Repository & Workspace Setup](#step-1-clone-repository--workspace-setup)
   - [Step 2: Install Node.js Dependencies](#step-2-install-nodejs-dependencies)
   - [Step 3: Configure Environment Variables (.env.local)](#step-3-configure-environment-variables-envlocal)
   - [Step 4: Initialize Supabase Database (source-of-truth-db.sql)](#step-4-initialize-supabase-database-source-of-truth-dbsql)
   - [Step 5: Configure Supabase Storage Buckets & Policies](#step-5-configure-supabase-storage-buckets--policies)
   - [Step 6: Configure SMTP Transactional Email Services](#step-6-configure-smtp-transactional-email-services)
   - [Step 7: Seed Initial Test Accounts & Demo Fixtures](#step-7-seed-initial-test-accounts--demo-fixtures)
   - [Step 8: Launch Local Development Server](#step-8-launch-local-development-server)
   - [Step 9: Compile Production Build & Smoke Test](#step-9-compile-production-build--smoke-test)
5. [Cloud Production Deployment (Vercel)](#5-cloud-production-deployment-vercel)
   - 5.1 [Vercel Project Setup & Git Linking](#51-vercel-project-setup--git-linking)
   - 5.2 [Automated Serverless Cron Jobs Configuration](#52-automated-serverless-cron-jobs-configuration)
   - 5.3 [Custom Domain & SSL Enforcement](#53-custom-domain--ssl-enforcement)
6. [Mobile Client & PWA / APK Deployment](#6-mobile-client--pwa--apk-deployment)
7. [Troubleshooting Common Installation Errors](#7-troubleshooting-common-installation-errors)
8. [Installation Verification & Commissioning Checklist](#8-installation-verification--commissioning-checklist)

---

## 1. System Architecture Overview

iReside is architected as a modern, decoupled full-stack application built upon Next.js App Router and Supabase cloud infrastructure:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Client Presentation Tier                          │
│   - Landlord Dashboard (/landlord)      - Tenant Portal (/tenant)           │
│   - Public Catalog (/download, /)       - Mobile PWA / Standalone APK       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS (TLS 1.3) / WebSocket WSS
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    Application & API Server (Vercel Edge)                   │
│   - Next.js 16 (App Router SSR, Edge API Routes, Server Actions)            │
│   - Auth Verification & Session Token Guard                                 │
│   - Cron Workers (/api/cron/monthly-invoices, /api/cron/keep-alive)         │
└───────────────────┬─────────────────────────────────────┬───────────────────┘
                    │                                     │
                    │ PostgreSQL Connection (Port 5432)   │ S3 REST API (HTTPS)
                    ▼                                     ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────────┐
│     Supabase Managed PostgreSQL 15    │ │     Supabase Storage CDN S3       │
│  - Row-Level Security (RLS) Policies  │ │  - property-images (Units/Floors) │
│  - Triggers, Functions & Constraints  │ │  - billing (Payment Proofs/ORs)   │
│  - Supabase Auth JWT Tables           │ │  - maintenance (Repair Photos)    │
└───────────────────────────────────────┘ └───────────────────────────────────┘
```

---

## 2. Required Software & Hardware

### 2.1 Development & Deployment Host Hardware

#### Local Development Workstation
- **Processor:** 64-bit multi-core processor (Intel Core i5 / AMD Ryzen 5 / Apple Silicon M-series or higher).
- **RAM:** 8 GB minimum (16 GB strongly recommended for smooth Next.js compilation and Three.js 3D testing).
- **Disk Space:** Minimum 10 GB free space on an SSD (Solid State Drive) for `node_modules`, build caches, and Git history.
- **Operating System:** Windows 10/11 (64-bit) with PowerShell 7+, macOS (Monterey 12.0+), or Linux (Ubuntu 22.04 LTS / Debian 12).

#### Production Hosting Server (Cloud-Native Serverless)
- **Host Provider:** Vercel Serverless Platform (Edge & Node.js Serverless Functions).
- **Function Memory Limit:** 1024 MB (Default) or 2048 MB.
- **Database Compute:** Supabase Cloud Project (PostgreSQL 15.x engine with connection pooling enabled via PgBouncer / Supavisor).

### 2.2 Required Base Software & Runtimes

Ensure the following tools are installed on the commissioning workstation:

| Software / Tool | Minimum Version | Recommended Version | Verification Command |
|---|---|---|---|
| **Node.js** | v20.10.0 LTS | v20.18.0 LTS or v22.x | `node -v` |
| **npm** | v10.2.0 | v10.8.2+ | `npm -v` |
| **Git** | v2.39.0 | Latest release | `git --version` |
| **Supabase CLI** *(Optional)* | v1.140.0 | Latest release | `supabase --version` |

---

## 3. Installation Requirements & Cloud Accounts

Before executing the installation commands, create or retrieve credentials for the following external services:

1. **Supabase Account:** (Free tier or Pro at [https://supabase.com](https://supabase.com))
   - A new blank Supabase Project (e.g., `ireside-prod`).
   - Project API URL (`https://xxxxxxxx.supabase.co`).
   - Public Anonymous Key (`anon` key).
   - Administrative Service Role Key (`service_role` key - keep strictly confidential).
   - Database Connection String URI (`postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`).
2. **SMTP Transactional Mailer Account:**
   - A dedicated Gmail account with **2-Step Verification** turned on and a 16-character **App Password** generated, OR a free account on SendGrid / Resend.
3. **AI Inference Provider (For iRis AI Resident Concierge):**
   - Groq Cloud API Key (`gsk_...` via [https://console.groq.com](https://console.groq.com)), OR
   - OpenAI API Key (`sk-...` via [https://platform.openai.com](https://platform.openai.com)).

---

## 4. Step-by-Step Installation Procedure

### Step 1: Clone Repository & Workspace Setup
Open your terminal (PowerShell or Bash) and clone the repository:

```bash
# Clone the repository from GitHub
git clone https://github.com/Sedictt/iReside---Capstone.git iReside

# Enter the project directory
cd iReside
```

### Step 2: Install Node.js Dependencies
Install all production and development packages defined in `package.json`:

```bash
# Clean dependency installation using npm
npm install --legacy-peer-deps
```

> [!TIP]
> The `--legacy-peer-deps` flag ensures full compatibility across React 19, Next.js 16, and specialized UI canvas packages (`@react-three/fiber`, `jspdf`, `react-pageflip`).

### Step 3: Configure Environment Variables (`.env.local`)
Create a `.env.local` file in the project root directory. Copy the configuration template below and replace the placeholder values with your real credentials:

```bash
# Copy example if present, or create .env.local directly
touch .env.local
```

#### `.env.local` Master Configuration Template:
```env
# ==============================================================================
# 1. APPLICATION CORE CONFIGURATION
# ==============================================================================
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ==============================================================================
# 2. SUPABASE DATABASE & AUTHENTICATION SECRETS
# ==============================================================================
# Your Supabase Project Settings -> API -> Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Your Supabase Project Settings -> API -> Project API Keys -> "anon" (Public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Your Supabase Project Settings -> API -> Project API Keys -> "service_role" (Secret)
# CAUTION: Never expose this key in client-side code or public repositories!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Direct PostgreSQL Connection String (Database Settings -> Connection String -> URI)
DATABASE_URL=postgresql://postgres.your-project-id:YourPassword@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# ==============================================================================
# 3. TRANSACTIONAL EMAIL (SMTP) MAILER
# ==============================================================================
# For Gmail: host=smtp.gmail.com, port=587
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=property.ireside@gmail.com
# 16-character Google Account App Password (generate at myaccount.google.com/apppasswords)
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM="iReside Notifications" <property.ireside@gmail.com>

# ==============================================================================
# 4. AI RESIDENT CONCIERGE (iRis ASSISTANT)
# ==============================================================================
# Groq provides ultra-fast inference with Llama 3 70B
GROQ_API_KEY=gsk_your_groq_api_key_here

# OpenAI fallback (Optional if Groq is supplied)
OPENAI_API_KEY=sk-your_openai_api_key_here

# ==============================================================================
# 5. AUTOMATED CRON SECURITY SECRET
# ==============================================================================
# Secret token used by Vercel or external callers to authorize /api/cron/* jobs
CRON_SECRET=ireside_super_secret_cron_token_2026
```

### Step 4: Initialize Supabase Database (`source-of-truth-db.sql`)
The authoritative database structure for iReside is encapsulated in `source-of-truth-db.sql` located at the project root. This SQL file provisions all required tables, foreign keys, triggers, enum types, and Row-Level Security (RLS) policies.

#### Method A: Via Supabase Web Dashboard (Recommended & Simplest)
1. Open your browser and navigate to your **Supabase Project Dashboard**.
2. From the left navigation menu, click **SQL Editor**.
3. Click **+ New Query**.
4. Open `source-of-truth-db.sql` in your code editor, copy the complete contents, and paste them into the Supabase SQL Editor.
5. Click **Run** (or press `Ctrl + Enter`).
6. Verify that the query output indicates success without syntax errors.

#### Method B: Via Supabase CLI / Direct psql
If you have `psql` installed on your machine:
```bash
psql "postgresql://postgres.[YOUR-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" -f source-of-truth-db.sql
```

### Step 5: Configure Supabase Storage Buckets & Policies
iReside stores payment screenshots, property photos, and maintenance proofs in Supabase S3-compatible Object Storage.

1. In your Supabase Dashboard, click **Storage** in the left menu.
2. Ensure the following 4 buckets exist. If they do not, click **New Bucket** and create them:
   - `property-images` — **Public Bucket: ON** *(For building flyers and unit photos)*
   - `billing` — **Public Bucket: OFF** *(Private for tenant payment screenshots and receipts)*
   - `avatars` — **Public Bucket: ON** *(For user profile pictures)*
   - `maintenance` — **Public Bucket: OFF** *(Private for repair issue photos)*
3. **Set Storage RLS Policies:**
   - Under `property-images` and `avatars`: Add a policy allowing **SELECT** to `public` (anyone can view).
   - Under `billing`: Add a policy allowing **INSERT** to `authenticated` users and **SELECT** restricted to the unit tenant and landlord.
   - Under `maintenance`: Add a policy allowing **INSERT** and **SELECT** to `authenticated` users linked to that request.

### Step 6: Configure SMTP Transactional Email Services
To enable automated sending of onboarding invite links, password reset emails, and monthly invoice alerts:

1. Log into your Google Account $\rightarrow$ Go to [Google Security](https://myaccount.google.com/security).
2. Ensure **2-Step Verification** is turned **ON**.
3. Under *"How you sign in to Google"*, search for and click **App Passwords**.
4. Enter an App Name (e.g., `iReside Mailer`) and click **Create**.
5. Copy the generated 16-character code (e.g., `abcd efgh ijkl mnop`).
6. Paste it into your `.env.local` under `SMTP_PASS` (spaces are ignored).

### Step 7: Seed Initial Test Accounts & Demo Fixtures
To populate demo properties, rooms, and test users for evaluation:
```bash
# Seed initial notification records and mock dataset fixtures
npm run seed:notifications
```

### Step 8: Launch Local Development Server
Execute the custom Next.js development command (configured with an expanded HTTP header buffer to support large digital signatures and auth tokens):

```bash
npm run dev
```

The terminal will confirm:
```
▲ Next.js 16.1.6
- Local:        http://localhost:3000
- Environments: .env.local
✓ Starting...
✓ Ready in 1800ms
```

Open your browser and navigate to `http://localhost:3000`. You will see the iReside Landing and Authentication portal.

### Step 9: Compile Production Build & Smoke Test
To verify that all TypeScript types, Tailwind CSS classes, and dynamic modules compile cleanly without build breaks:

```bash
# Run the Next.js production compiler
npm run build
```

Verify that the build outputs static edge routes, serverless function endpoints, and exits with code `0`.

---

## 5. Cloud Production Deployment (Vercel)

Deploying iReside to the Vercel cloud environment provides edge serverless scalability, automatic SSL certificates, and zero-maintenance infrastructure.

### 5.1 Vercel Project Setup & Git Linking
1. Push your repository to GitHub: `git push origin main`.
2. Open [https://vercel.com](https://vercel.com) and log in.
3. Click **Add New... $\rightarrow$ Project**.
4. Import the `Sedictt/iReside---Capstone` repository.
5. In the **Configure Project** screen:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `./`
   - **Build Command:** `next build`
   - **Output Directory:** `.next`
6. Expand **Environment Variables** and add all key-value pairs from your `.env.local` file (e.g., `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_PASS`, `CRON_SECRET`, etc.).
7. Click **Deploy**.

### 5.2 Automated Serverless Cron Jobs Configuration
iReside automates billing and prevents free-tier database sleep through serverless crons defined in `vercel.json` at the root of the project:

```json
{
  "crons": [
    {
      "path": "/api/cron/monthly-invoices",
      "schedule": "0 0 1 * *"
    },
    {
      "path": "/api/cron/keep-alive",
      "schedule": "0 12 * * *"
    }
  ]
}
```

- **/api/cron/monthly-invoices:** Triggers at 00:00 UTC on the 1st of every month to generate upcoming rent statements.
- **/api/cron/keep-alive:** Executes daily at 12:00 UTC, performing a lightweight health check to keep Supabase PostgreSQL active.

### 5.3 Custom Domain & SSL Enforcement
1. In Vercel Project Settings $\rightarrow$ **Domains**, enter your custom domain (e.g., `app.ireside.ph`).
2. Add the provided `CNAME` or `A` record in your DNS provider (Cloudflare, Namecheap, GoDaddy).
3. Vercel automatically provisions a free Let's Encrypt TLS 1.3 SSL certificate.

---

## 6. Native Desktop & Mobile Client Deployment (Windows .exe & Android .apk)

In addition to the standard browser portal, iReside provides dedicated native clients for Windows Desktop and Android Mobile to maximize performance, hardware access, and offline reliability.

### 6.1 Windows Desktop Native Application Deployment (.exe)
The Windows Desktop Client is tailored for Landlords, Property Managers, and Front-Desk Leasing Staff requiring multi-monitor floorplan mapping and dedicated local performance.

- **Installer Package:** `iReside-Setup-v2.1.0-x64.exe`
- **Target OS:** Windows 10 (64-bit) & Windows 11 (x64 / ARM64).
- **Key Capabilities:**
  - Standalone desktop frame (independent of browser tabs and URL bars).
  - Hardware-accelerated WebGL 2.0 rendering for 2D & 3D Interactive Floorplans.
  - Desktop notifications and Start Menu / Taskbar pinning.
  - Multi-window support (viewing map on Monitor 1 while verifying invoices on Monitor 2).
- **Distribution Setup:**
  1. Build the desktop binary via the native build pipeline or place the compiled executable into `public/downloads/iReside-Setup-v2.1.0-x64.exe`.
  2. The download route is automatically bound to the **"Download for Windows (.exe)"** button on `/download`.
- **End-User Installation Steps:**
  1. Navigate to `/download` on any Windows PC.
  2. Click **Download for Windows (.exe)**.
  3. Run the installer and complete the setup wizard.
  4. Launch the application from the desktop shortcut.

### 6.2 Android Native Mobile Application Deployment (.apk)
The Android Mobile Client provides residents and on-site staff with direct camera and sensor integration.

- **Installer Package:** `iReside-Mobile-v2.1.0.apk`
- **Target OS:** Android 8.0 (Oreo) through Android 14+.
- **Key Capabilities:**
  - Direct hardware camera integration for snapping GCash payment confirmations and repair photos.
  - Native push notification listeners for rent billing cycles and urgent building announcements.
  - Full-screen touch interface eliminating browser address bars.
  - Offline cache storage via IndexedDB for house rules and emergency hotlines.
- **Distribution Setup:**
  1. Place the compiled signed APK into `public/apk/iReside-Mobile-v2.1.0.apk`.
  2. The mobile download button on `/download` automatically serves this binary with `Content-Type: application/vnd.android.package-archive`.
- **End-User Installation Steps:**
  1. Open `/download` on an Android smartphone.
  2. Tap **Download APK** (or scan the QR code from a computer screen).
  3. Enable **"Allow installation from unknown sources"** in Android security settings if prompted.
  4. Tap **Install** and open the app.

### 6.3 Progressive Web App (PWA) Deployment (iOS & Android Alternative)
The web application is pre-configured with a standards-compliant web app manifest at `public/manifest.json` and service worker caching logic.
- **On iPhone / iPad (iOS):** Users open `/` in Apple Safari $\rightarrow$ tap **Share** $\rightarrow$ tap **Add to Home Screen**.
- **On Android Chrome:** Users visit `/` $\rightarrow$ tap **Install App** on the prompt banner.

### 6.4 The App Download Hub (`/download`) & Turnkey Dynamic Routing
The `/download` route serves as the self-contained distribution portal for each turnkey property deployment:
- **Zero Centralized SaaS Dependency:** The download page uses dynamic origin resolution (`window.location.origin + '/download'`). Regardless of whether the property is deployed on `https://marulas-residences.vercel.app`, a custom domain `https://clientdomain.ph`, or a local network IP `http://192.168.1.50:3000`, the download hub always resolves correctly without manual hardcoding.
- **Built-in Entry Points in UI:**
  - Login Screen (`/login`) utility header: **"Get Apps"** button.
  - Tenant Navigation Sidebar: **"Download App"** button under Tenant Tools.
  - Landlord Administration Sidebar: **"Download Apps"** button.
- **Desktop & Mobile Download Buttons:** Direct one-click download buttons for the Windows Installer (`.exe`) and Android Package (`.apk`).
- **Dynamic On-Screen QR Code Generator:** Clicking **"Show QR Code"** generates a live QR code encoding the exact deployment URL, allowing on-site residents to scan and download with zero manual typing.
- **One-Click Share Utility:** Copies the active property origin link for instant dispatch across messaging channels.

---

## 7. Troubleshooting Common Installation Errors

### Issue 1: "Prisma / Supabase error: relation does not exist"
- **Cause:** Database tables have not been provisioned in the active Supabase project.
- **Solution:** Re-run `source-of-truth-db.sql` in the Supabase SQL Editor as described in [Step 4](#step-4-initialize-supabase-database-source-of-truth-dbsql).

### Issue 2: "Request Header Fields Too Large (HTTP 431)"
- **Cause:** Large JWT tokens or base64 canvas signature payloads exceeding default Node HTTP limits.
- **Solution:** Always start the local development server using `npm run dev`, which includes the flag `--max-http-header-size=65536`.

### Issue 3: "SMTP connection refused or 535-5.7.8 Username and Password not accepted"
- **Cause:** Using standard Gmail login password instead of a dedicated 16-character App Password, or 2-Step Verification is disabled.
- **Solution:** Generate an App Password in Google Account Settings and paste it into `.env.local` under `SMTP_PASS`.

### Issue 4: "Next.js Build fails on Three.js / Canvas SSR"
- **Cause:** Browser-specific canvas objects (`window`, `HTMLCanvasElement`) being invoked during Node server-side pre-rendering.
- **Solution:** Ensure all 3D or canvas components utilize Next.js `dynamic(() => import(...), { ssr: false })` or contain `"use client"`.

---

## 8. Installation Verification & Commissioning Checklist

Execute this checklist before signing off on deployment or presenting to the examination committee:

| Verification Item | Command / Procedure | Expected Result | Pass / Fail |
|---|---|---|:---:|
| **Dependency Integrity** | `npm ls --depth=0` | All packages resolved without missing dependencies | [ ] |
| **TypeScript Compilation** | `npx tsc --noEmit` | Clean type-check exit code 0 | [ ] |
| **Unit & Integration Tests**| `npm run test` | All Vitest test suites passing | [ ] |
| **Database Connectivity** | Access `/api/health` | HTTP 200 with database status: `connected` | [ ] |
| **Storage Uploads** | Upload property flyer in modal | Image renders via public Supabase CDN URL | [ ] |
| **Email Dispatch** | Send test invite link | Email received in inbox within 15 seconds | [ ] |
| **Responsive PWA** | Open on Android / iPhone | UI scales cleanly without horizontal scroll | [ ] |
| **Turnover Sign-Off** | Section 1 Acceptance Sheet | Signed by developer, administrator, and panel | [ ] |
