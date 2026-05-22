# iReside — Modern Tenant-Centric Property Management Platform

iReside is a premium, state-of-the-art property management platform designed to deliver an exceptional, seamless, and tenant-first experience. By bridging the gap between landlords and residents through a beautiful glassmorphic Neumorphism user interface and reliable database syncing, iReside simplifies unit onboarding, rent payment processing, community collaboration, and maintenance triaging.

---

## 🌟 Key Features

- **Resident Portal**: An all-in-one hub for residents to view lease terms, pay rent, view payment history, check utility meters, and track maintenance requests.
- **Landlord Workspace**: Comprehensive panel to manage properties, onboard units, track invoices, review applicant files, and approve community postings.
- **Interactive Community Board**: Integrated announcement feed, post composer, and rules board for fostering boarding community engagement.
- **Seamless Checkout & Payment**: Integrated billing workflow showing complete monthly snapshots, receipt logging, and advance payments.
- **Smart Maintenance Triage**: Dynamic creation of maintenance requests with priority triage and active landlord-assigned workflows.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL with RLS and schema-safe triggers)
- **Styling**: [TailwindCSS](https://tailwindcss.com/) & Vanilla CSS with modern Glassmorphism / Neumorphism design system tokens
- **Deployment**: Optimized for [Vercel](https://vercel.com/)

---

## 📂 Repository Clean Footprint

The `master` branch is maintained as a clean, production-ready codebase containing only functional runtime assets:

```
├── public/                 # Static web assets (logos, illustrations, payment QR)
├── src/
│   ├── app/                # Next.js pages & API routes (landlord, tenant, authentication)
│   ├── components/         # Reusable UI elements, community widgets, navigations
│   ├── context/            # Auth and Property context providers
│   ├── hooks/              # Custom React hooks (GSAP transitions, database helpers)
│   └── lib/                # Database clients and scraper modules
├── supabase/               # Core SQL migrations and seed data
├── tsconfig.json           # TypeScript configuration
├── next.config.ts          # Next.js bundler config
├── vercel.json             # Vercel deployment routing
├── package.json            # Application dependencies and scripts
└── source-of-truth-db.sql  # Database source of truth schema
```

> [!NOTE]
> All automated tests (Playwright, Vitest), temporary conversion scripts, linter logs, design backups, and research artifacts reside entirely on the separate `main-development` branch to keep the main branch immaculate.

---

## 🚀 Quick Start Guide

Follow these steps to run the iReside platform locally:

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or v20.x recommended)
- [NPM](https://www.npmjs.com/) (comes bundled with Node)
- A [Supabase](https://supabase.com/) project instance

### 2. Setup Environment Variables
Create a `.env.local` file in the root directory and populate it with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Install Dependencies
Run the package installation:
```bash
npm install
```

### 4. Run the Development Server
Launch the local Next.js dev server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 5. Build for Production
To compile and bundle the application for production:
```bash
npm run build
```

---

## 🌿 Branching Guidelines

- **`master`**: Serves as the primary production-grade repository. Only clean, tested, and fully-functioning Next.js app components and essential schema SQL are committed here. No test scripts, logs, or local utility files are allowed.
- **`main-development`**: The active engineering branch. Contains the complete test suites, database helpers, playground scripts, design specifications, and other auxiliary workspace files. All pull requests should target `main-development` before being merged into `master`.
