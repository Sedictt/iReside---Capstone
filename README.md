# iReside — Tenant-Centric Property Management Platform

iReside is a property management platform designed for multi-unit rental systems, apartments, dormitories, and boarding houses. Built with localized integrations for the Philippine market (including GCash and Maya workflows) and municipal registry verification, the platform coordinates tenant onboarding, double-entry financial ledger accounting, interactive property maps, automated utility splits, and AI-assisted maintenance triaging.

The application features a sleek Glassmorphism and Neumorphic design system, optimized for fast and accessible interactions on desktop and mobile viewports.

---

## 🛠️ Technology Stack & Architecture

- **Frontend**: Next.js 16 (App Router, dynamic page-level templates, React 19 Client Components, custom GSAP transitions, Framer Motion)
- **Styling**: Tailwind CSS v4 & custom CSS variables implementing a premium neumorphic-glass token system
- **Backend & Authentication**: Supabase (PostgreSQL client layer, Row Level Security (RLS) policies, PgBouncer pooler, and real-time listening via WebSockets)
- **Database Logic**: Custom PL/pgSQL database triggers, index constraints, standard auditing pipelines, and automated `pg_cron` jobs
- **AI Integrations**: Llama 3 models via Groq SDK, context-aware Retrieval-Augmented Generation (RAG) for localized concierges, and triaging priority algorithms
- **Browser Automation**: Headless Puppeteer engine executing secure municipal web queries
- **Electronic Signatures**: HTML5 signature canvas validation using base64 PNG tracking, size limits, aspect-ratio constraints, and XSS sanitization
- **Testing**: Vitest for robust unit testing; Playwright for end-to-end browser workflows

---

## 🏗️ Core System Modules

### 1. Landlord Business & Permit Verification
To prevent fraudulent listings, iReside implements background verification for onboarding landlords.
- **Engine**: Scrapes official Valenzuela City Business Directory Databank (`bd.valenzuela.gov.ph`) using Puppeteer (`valenzuela-scraper.ts`).
- **Mechanics**: Launches a headless chromium instance, navigates search forms, triggers DataTables AJAX filters, extracts verified rows (Business Name, District, Barangay, Industry), and returns data to the admin review panel.
- **Manual Fallback**: Generates localized permalinks for direct government search pages if site latency triggers Puppeteer timeouts.

### 2. Double-Entry Ledger & Payment Compliance
iReside operates an audit-compliant, secure billing workflow.
- **Billing Mechanics**: Implements custom multi-state invoicing (`src/lib/billing/server.ts`) representing payment states: `pending`, `intent_submitted`, `under_review`, `confirmed`, `rejected`, `receipted`.
- **Payment Gateways**: Localized workflow for GCash (QR code upload and reference number verification) and In-Person cash collection.
- **Ledger Immutability**: Uses PostgreSQL triggers (`trg_payment_receipts_immutable`) to enforce that generated financial receipts are completely immutable in the database layer.
- **Utility Splitter**: Supports automated meter-reading audits and splits utility costs (water, electricity) across units under customizable modes (included in rent, split by occupant, split by square area, or split evenly).

### 3. e-Signature Lease Validation
Lease agreements can be signed digitally within the browser and compiled into secure PDFs.
- **Signature Canvas**: Handled via `signature_pad` with real-time UI tracking.
- **Verification Engine**: Sanity-checks the signature before saving (`src/lib/signature-validation.ts`):
  - **Base64 Validity**: Rejects structural corruptions or injection payloads.
  - **Sanitization**: Filters raw data-URLs to only permit `data:image/png;base64` structures to shield against XSS.
  - **Canvas Verification**: Scans pixel-level data to ensure the signature is not empty (checks transparency/contrast threshold).
  - **Size & Proportions**: Blocks files over 500KB and restricts dimension limits to guarantee legible PDF rendering.

### 4. iRis Concierge AI (Context-Aware RAG)
An AI-powered building assistant that keeps tenants informed and automates common questions.
- **Processor**: Powered by Groq's high-speed Llama 3 models via standard OpenAI-compatible server routes (`/api/iris/chat`).
- **Retrieval Context**: Queries the logged-in tenant's specific context, formatting active profiles, lease dates, amenity lists, building announcements, maintenance history, and utility invoice snapshots directly into the prompt context for RAG.
- **Security**: Context retrieval is strictly constrained by Supabase session tokens, avoiding crosstalk between tenants.

### 5. Interactive 2D/3D Unit Maps
Visual overlays map units within properties, making navigation intuitive for landlords and prospective tenants.
- **Core rendering**: Developed with `@react-three/fiber`, `three`, and `framer-motion`.
- **Landlord Editor**: Allows property administrators to position, decorate, and map unit bounds interactively.
- **Occupancy Visuals**: Visual mapping updates dynamically via unit database state changes (e.g. green for vacant, blue for occupied, yellow for ongoing maintenance).

### 6. Philippine Localized Message Moderation
Chat rooms and community spaces are audited to support clean, safe environments.
- **Lexicons**: Custom Filipino profanity dictionary (`filipino-profanity.json`) and common phishing/spam pattern libraries (`spam-phishing.json`).
- **Engine**: Performs redactions, masks terms, flags high-probability spam runs, and generates historical logs of violating terms for moderator audits.

### 7. Maintenance Triage & Scheduling
- **Triage Pipeline**: Tenants report unit issues, assigning priority tags.
- **Reassignment System**: Allows landlords to review tickets, assign external contractors, track parts-incurred expenses, and log resolution status directly in the database.

---

## 🗄️ Database Architecture & Custom PL/pgSQL Triggers

The relational schema is configured under rigorous Row Level Security (RLS). Crucial actions are governed by database-level triggers to guarantee data integrity regardless of frontend state:

1. **`handle_new_user()`**: Listens to `auth.users` additions, automatically syncing user profiles, contact details, roles, and permit attachments to `public.profiles`.
2. **`handle_lease_status_change()`**: Automatically updates units state to `occupied` once an associated lease becomes `active`, and marks the unit `vacant` upon lease expiration or termination.
3. **`validate_lease_status_transition()`**: Asserts that a lease status cannot be marked `active` unless both the `tenant_signature` and `landlord_signature` are present.
4. **`sync_compat_payment_status()`**: Aligns payment metadata (GCash references, payment dates, confirmation statuses) with workflow changes.
5. **`prevent_payment_receipt_update()`**: Blocks updates on `payment_receipts` entries, rendering receipts completely write-once and audit-safe.
6. **`check_renewal_windows()`**: Automatically queries leases and schedules `lease_renewal_available` notifications as active agreements approach their renewal dates.

---

## 📂 Project Directory Structure

```
├── public/                 # Static assets, local datasets, and GCash QR mockups
├── scripts/                # Lexicon compilers and automation testing scripts
├── supabase/               # Core SQL configuration
│   ├── migrations/         # Modular DB migration scripts (RLS, audit ledgers, cron jobs)
│   └── config.toml         # Supabase local environment configuration
├── src/
│   ├── app/                # App router pages, layouts, and API routes
│   │   ├── (signing)/      # Secure electronic signature routing
│   │   ├── api/            # Server endpoints (billing, moderations, chat assistants)
│   │   ├── landlord/       # Landlord workspace dashboards
│   │   └── tenant/         # Tenant portals, utility records, community walls
│   ├── components/         # Premium UI component layers
│   │   ├── community/      # Forums, announcements, and polls
│   │   ├── ui/             # Core Glassmorphic buttons, inputs, profiles, ClickSpark effects
│   │   ├── transitions/    # GSAP navigation wrappers
│   │   └── navigation/     # Contextual sidebars and mobile drawers
│   ├── context/            # React state providers (Auth, Global Loading, Notifications)
│   ├── hooks/              # Custom sound, animation, and database event listeners
│   └── lib/                # Core business logic
│       ├── billing/        # Ledger entries and utility calculations
│       ├── iris/           # RAG context configuration and LLM integrations
│       ├── messages/       # Moderation, filtration, and censorship engine
│       ├── supabase/       # SSR client and server bindings
│       └── valenzuela-scraper.ts # Puppeteer municipal scraping tool
├── source-of-truth-db.sql  # Backup single-file database schema
└── tsconfig.json           # TS ruleset and aliases
```

---

## 🚀 Setup & Installation Guide

### Prerequisites
- **Node.js**: `v20.x` or higher
- **NPM**: `v10.x` or higher
- **Supabase CLI**: For local PostgreSQL/Supabase development (optional)
- **Groq API Key**: (Optional, required to run the `iRis AI assistant`)

### 1. Database Configuration
To set up your database, you can choose one of the following approaches:

**Option A: Supabase Dashboard**
1. Create a new project in the [Supabase Dashboard](https://supabase.com).
2. Go to the **SQL Editor**.
3. Copy the contents of `source-of-truth-db.sql` and execute the query to set up tables, RLS, custom triggers, and indexes.

**Option B: Local Supabase CLI**
Initialize your project locally:
```bash
supabase link --project-ref your_project_ref
supabase db push
```

### 2. Environment Variables Setup
Create a `.env.local` file in the root folder of the repository:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anonymous-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Groq API Configuration (for iRis AI)
GROQ_API_KEY=gsk_your_groq_api_key
```

### 3. Dependency Installation
Initialize packages and launch dependencies:
```bash
npm install
```

### 4. Launching the Local Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 5. Pre-generating Moderation Lexicons (Optional)
To process raw profanity and spam csv datasets into active JSON candidate patterns:
```bash
npm run moderation:candidates
npm run moderation:spam-candidates
```

---

## 🧪 Testing Suites

iReside implements comprehensive test frameworks:

### Unit & Integration Tests (Vitest)
Validates core mathematical splits, signature base64 encoders, and transition state machines.
```bash
npm run test
```

### End-to-End Workflow Tests (Playwright)
Executes cross-browser verification for multi-stage rental processes, applications, and payments.
```bash
npx playwright test
```

---

## 🌿 Repository Guidelines

To maintain code reliability, development is split across two main branches:
- **`master`**: The stable production branch. Contains strictly verified Next.js application features, functional components, and stable Supabase schemas. No temporary scratch scripts, conversion run logs, or draft configs.
- **`main-development`**: The integration and testing environment. Features experimental setups, linter logs, Playwright configurations, and auxiliary research folders. Pull requests are compiled and reviewed on `main-development` before being squashed and merged into `master`.
