# iReside — Comprehensive System Workflow Documentation

> **Version:** 1.0  
> **Last Updated:** 2026-05-31  
> **Platform:** Next.js 16 + Supabase + Groq AI  
> **Documentation Scope:** End-to-end workflows for all user roles

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Authentication & Registration](#2-authentication--registration)
3. [Landlord Onboarding & Verification](#3-landlord-onboarding--verification)
4. [Tenant Application & Invite System](#4-tenant-application--invite-system)
5. [Lease Management & Digital Signing](#5-lease-management--digital-signing)
6. [Payment & Billing](#6-payment--billing)
7. [Maintenance Management](#7-maintenance-management)
8. [Move-Out Workflow](#8-move-out-workflow)
9. [Messaging System](#9-messaging-system)
10. [Community Hub](#10-community-hub)
11. [iRis AI Assistant](#11-iris-ai-assistant)
12. [Admin Portal](#12-admin-portal)
13. [Property & Unit Management](#13-property--unit-management)
14. [Analytics & Reporting](#14-analytics--reporting)
15. [Notifications System](#15-notifications-system)
16. [Product Tours (Onboarding)](#16-product-tours-onboarding)
17. [Amenities Booking](#17-amenities-booking)
18. [Appendix: Status Enums & Database Tables](#18-appendix-status-enums--database-tables)

---

## 1. System Overview

### 1.1 Architecture

iReside is a **multi-tenant property management platform** built on Next.js 16 (App Router) with Supabase as the backend. The system serves three distinct user roles:

| Role | Description | Primary Dashboard |
|------|-------------|-------------------|
| **Tenant** | Renter occupying a unit | `/tenant/dashboard` |
| **Landlord** | Property owner/manager | `/landlord/dashboard` |
| **Admin** | Platform administrator | `/admin/dashboard` |

### 1.2 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript 5 |
| Database | Supabase PostgreSQL 17 |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Storage | Supabase Storage (multiple buckets) |
| AI/ML | Groq SDK (Llama 3.1 8B, Qwen 32B) |
| Email | Nodemailer (SMTP via Gmail) |
| UI | React 19 + Tailwind CSS v4 + Radix UI + Framer Motion |
| PDF | pdf-lib + signature_pad + jspdf |
| Charts | Chart.js + react-chartjs-2 |
| Validation | Zod v4 + react-hook-form |

### 1.3 Security Model

- **Row-Level Security (RLS):** Every database table enforces multi-tenant isolation. Landlords see only their own data; tenants see only their own records.
- **Dual Supabase Clients:** Regular client (user-scoped, RLS-enforced) vs. Admin client (service-role key, bypasses RLS for server-side operations).
- **Middleware:** Next.js middleware refreshes sessions on every request and enforces role-based route protection.
- **JWT Signing Links:** Lease signing uses time-limited JWTs for secure remote signature workflows.

---

## 2. Authentication & Registration

### 2.1 Email/Password Login

**Route:** `/login`

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  User enters  │────▶│ supabase.auth   │────▶│ Role resolution   │
│  credentials  │     │ .signInWith     │     │ (metadata →       │
│  (email+pw)   │     │ Password()      │     │  profiles table)  │
└──────────────┘     └─────────────────┘     └────────┬─────────┘
                                                       │
                                            ┌──────────▼─────────┐
                                            │ Redirect based on   │
                                            │ role:               │
                                            │ admin → /admin      │
                                            │ landlord → /landlord│
                                            │ tenant → /tenant    │
                                            │ or ?redirect= param │
                                            └─────────────────────┘
```

**Role Resolution Cascade:**
1. `user.user_metadata.role` (set during creation)
2. Query `profiles` table: `SELECT role WHERE id = user.id`
3. Fallback: `'tenant'`

**Error Handling:** Supabase error messages displayed in animated error banner. Common errors: "Invalid login credentials", "Email not confirmed".

### 2.2 Google OAuth Login

**Routes:** `/login` → Google consent → `/auth/callback`

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  Clicks       │────▶│ Google OAuth     │────▶│ /auth/callback    │
│  "Google"     │     │ consent screen   │     │ exchangeCodeFor   │
│  button       │     │                  │     │ Session(code)     │
└──────────────┘     └─────────────────┘     └────────┬─────────┘
                                                       │
                                            ┌──────────▼─────────┐
                                            │ Profile lookup →    │
                                            │ role-based redirect │
                                            └─────────────────────┘
```

**Error Path:** Failed code exchange → redirect to `/login?error=Could not authenticate with provider`

### 2.3 Landlord Registration (3-Step Wizard)

**Route:** `/signup`  
**API:** `POST /api/auth/landlord-register`  
**State:** Persisted to `localStorage` under key `iReside_wizard_state` (24-hour TTL, versioned)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     LANDLORD REGISTRATION WIZARD                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  STEP 1: PERSONAL DETAILS            STEP 2: PROPERTY INFO           │
│  ┌─────────────────────────┐        ┌─────────────────────────┐     │
│  │ • Full Name (required)  │        │ • Property Name         │     │
│  │ • Phone Number (req.)   │───────▶│ • Property Address      │     │
│  │ • Email (required)      │        │                         │     │
│  │ • Email OTP Verification│        └───────────┬─────────────┘     │
│  │   - Send OTP via email  │                    │                    │
│  │   - Enter 6-digit code  │                    ▼                    │
│  │   - Match verification  │        STEP 3: DOCUMENT UPLOAD          │
│  └─────────────────────────┘        ┌─────────────────────────┐     │
│                                      │ • Valid ID (required)  │     │
│                                      │ • Business Permit      │     │
│                                      │ • Business Permit Card │     │
│                                      │ • Proof of Ownership   │     │
│                                      │ • Terms checkbox       │     │
│                                      │ • At least 3/4 docs    │     │
│                                      └───────────┬─────────────┘     │
│                                                  │                    │
│                                                  ▼                    │
│                                      ┌─────────────────────────┐     │
│                                      │ SUBMIT → API processes:  │     │
│                                      │ 1. Create/update auth   │     │
│                                      │    user (temp password)  │     │
│                                      │ 2. Upsert profile        │     │
│                                      │ 3. Upload docs to bucket │     │
│                                      │ 4. Insert application    │     │
│                                      │    (status: "pending")   │     │
│                                      └─────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

#### OTP Verification (Step 1b)

| Aspect | Detail |
|--------|--------|
| Generation | `Math.floor(100000 + Math.random() * 900000)` — 6 digits |
| Delivery | Email via Nodemailer: "`<code>` is your iReside verification code" |
| Validity | Stated as 10 minutes (no server-side expiry enforced) |
| Storage | Client-side `useRef` only (demo/prototype implementation) |

#### Document Upload Requirements

| Document | Accepted Formats | Max Size |
|----------|-----------------|----------|
| Valid ID | PDF, JPG, PNG | 5 MB |
| Business Permit (paper) | PDF, JPG, PNG | 5 MB |
| Business Permit Card | PDF, JPG, PNG | 5 MB |
| Proof of Ownership | PDF, JPG, PNG | 5 MB |

**Requirement:** Minimum 3 of 4 documents must be uploaded. Files are converted to base64 for transmission.

#### Server-Side Registration Processing

```
POST /api/auth/landlord-register
  │
  ├─[1] Validate Zod schema (all fields + file sizes)
  ├─[2] Check: emailVerified === true (400 if not)
  ├─[3] Duplicate check: landlord_applications (409 if pending/approved)
  ├─[4] Auth user: find by email or create new (64-char hex temp password)
  ├─[5] Profile upsert: profiles table
  ├─[6] Document uploads (parallel): landlord-documents bucket
  │     ├─ identity/<uuid>.<ext>
  │     ├─ permit/<uuid>.<ext>
  │     ├─ permit-card/<uuid>.<ext>
  │     └─ ownership/<uuid>.<ext>
  ├─[7] Insert landlord_applications (status: "pending")
  ├─[8] Sync profile with business_name + business_permit_url
  └─[9] Return { success, applicationId, userId }
```

**Rollback Strategy:** If profile creation fails, auth user is deleted. If application insert fails, both auth user and profile are deleted.

### 2.4 Tenant "Registration" (Invite-Only)

There is **no self-service tenant registration**. The `/signup/tenant` page is purely informational — it explains the invite-only nature and directs users to `/apply` with a landlord-provided token.

Tenants gain access through one of:
- **Invite Link:** Landlord generates a private URL with embedded token
- **Walk-In Intake:** Landlord manually creates the tenant account during application approval
- **Existing Tenant:** Transition from another unit

### 2.5 Logout

**Client-side:**
1. `supabase.auth.signOut({ scope: 'global' })` with 1500ms timeout
2. Clears all `localStorage`/`sessionStorage` keys starting with `supabase.` or containing "auth"/"session"
3. Redirects to `/auth/logout?logout=<timestamp>`

**Server-side (`/api/auth/logout`):**
1. Calls `supabase.auth.signOut()`
2. Redirects to `/login`

### 2.6 Middleware Route Protection

**File:** `src/middleware.ts` + `src/lib/supabase/middleware.ts`

| Route Pattern | Unauthenticated | Wrong Role |
|---------------|-----------------|------------|
| `/admin/*` | → `/login` | → Role dashboard |
| `/landlord/*` | → `/login` | N/A (only landlords access) |
| `/tenant/*` | → `/login` | N/A (only tenants access) |
| `/login`, `/signup` (authenticated) | → Role dashboard | — |
| Public routes | Allowed | — |

**Public routes (no auth required):** `/login`, `/signup`, `/signup/tenant`, `/auth/*`, `/apply/*`, `/apply-landlord/*`, `/landlord/onboarding`, `/demo`, `/sign`, `/docs`, `/about`, `/terms`, `/privacy`, `/`

**Cache Control:** Authenticated responses set `no-store, no-cache, must-revalidate, proxy-revalidate` to prevent back-button access to protected pages.

---

## 3. Landlord Onboarding & Verification

### 3.1 Admin Verification of Landlord Registration

**Route:** `/admin/registrations`  
**API:** `GET /api/admin/registrations`, `PATCH /api/admin/registrations/{id}`, `POST /api/admin/registrations/{id}/verify`

```
┌──────────────────────────────────────────────────────────────────┐
│                   ADMIN VERIFICATION WORKFLOW                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  PENDING APPLICATION                                               │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Admin reviews documents:                                    │   │
│  │  • Valid ID           • Business Permit (paper)             │   │
│  │  • Permit Card        • Proof of Ownership                  │   │
│  └────────────────────┬───────────────────────────────────────┘   │
│                       │                                            │
│           ┌───────────▼───────────┐                                │
│           │ Status → "reviewing"  │                                │
│           └───────────┬───────────┘                                │
│                       │                                            │
│           ┌───────────▼───────────┐                                │
│           │ BUSINESS VERIFICATION │                                │
│           │ Scrape Valenzuela City │                               │
│           │ Business Databank     │                                │
│           │ (bd.valenzuela.gov.ph)│                                │
│           └───────────┬───────────┘                                │
│                       │                                            │
│         ┌─────────────┼─────────────┐                              │
│         ▼             ▼             ▼                              │
│    ┌─────────┐  ┌──────────┐  ┌─────────┐                          │
│    │ verified│  │not_found │  │  error  │                          │
│    └────┬────┘  └────┬─────┘  └────┬────┘                          │
│         │            │             │                                │
│         └────────────┼─────────────┘                                │
│                      │                                              │
│         ┌────────────▼────────────┐                                 │
│         │ ADMIN DECISION          │                                 │
│         │                        │                                  │
│         │  APPROVE ─────────────▶│ Generate onboarding token       │
│         │                        │ (72-hour expiry)                 │
│         │                        │ Send magic link email            │
│         │                        │                                  │
│         │  REJECT ──────────────▶│ Status → "rejected"             │
│         │                        │ Store rejection reason           │
│         └────────────────────────┘                                 │
└──────────────────────────────────────────────────────────────────┘
```

**Verification Status Values:** `not_verified` → `verified` | `not_found` | `error`

**Business Verification API (`searchValenzuelaBusinessDatabank`):**
- Dynamically imports `valenzuela-scraper`
- Scrapes the Valenzuela City Business Directory Databank website
- Returns `{ status, rows, manualSearchURL }`
- Result persisted to `landlord_applications.verification_data` (JSON)

### 3.2 Landlord Onboarding Magic Link

**Route:** `/landlord/onboarding/[token]`  
**API:** `GET /api/landlord/onboarding/[token]`, `POST /api/landlord/onboarding/[token]`

```
┌──────────────────────────────────────────────────────────────────┐
│                  LANDLORD ONBOARDING FLOW                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1. TOKEN VALIDATION (GET)                                        │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ • Look up landlord_applications.onboarding_token            │   │
│  │ • Validate: token exists, not completed, not expired        │   │
│  │ • Fallback to profiles table for email/fullName             │   │
│  │ • Returns: { email, fullName, phone, propertyName, address }│   │
│  └────────────────────┬───────────────────────────────────────┘   │
│                       │                                            │
│  2. PASSWORD SETUP                                                │
│  ┌────────────────────▼───────────────────────────────────────┐   │
│  │ Password requirements:                                      │   │
│  │  • Minimum 8 characters                                     │   │
│  │  • At least 1 uppercase letter [A-Z]                        │   │
│  │  • At least 1 digit [0-9]                                   │   │
│  │  • At least 1 special character [^A-Za-z0-9]                │   │
│  └────────────────────┬───────────────────────────────────────┘   │
│                       │                                            │
│  3. PROPERTY CONFIGURATION                                        │
│  ┌────────────────────▼───────────────────────────────────────┐   │
│  │ Optional config:                                            │   │
│  │  • propertyPhoto, profilePhoto, coverPhoto (uploads)        │   │
│  │  • totalUnits (default: 1), totalFloors (default: 1)        │   │
│  │  • headLimit (number | "none", default: 4)                  │   │
│  │  • utilityBilling mode, baseRent, amenities, house_rules    │   │
│  │  • contractMode: "upload" or "generate"                     │   │
│  └────────────────────┬───────────────────────────────────────┘   │
│                       │                                            │
│  4. SERVER PROCESSING (POST)                                       │
│  ┌────────────────────▼───────────────────────────────────────┐   │
│  │ a) Create/update auth user, set password, email_confirm=true │  │
│  │ b) Upload avatar/cover/property photos to storage           │   │
│  │ c) Upsert profile (full_name, phone, business_name, etc.)   │   │
│  │ d) Create/update property record                            │   │
│  │ e) Upsert environment policies                              │   │
│  │ f) Auto-generate units (distributed across floors)          │   │
│  │ g) Create floor configurations                               │   │
│  │ h) Generate default contract template (if mode=generate)    │   │
│  │ i) Mark onboarding_completed_at, invalidate token           │   │
│  │ j) Set application status → "approved"                      │   │
│  │ k) Redirect → /landlord/dashboard                           │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

**Contract Template Auto-Generation (when `contractMode: "generate"`):**
- `rent_due_day`: 5
- `security_deposit`: 1 month
- `advance_rent`: 1 month
- `late_fee_policy`: "Standard 5% after 3 days"
- Default clauses: Maintenance, Quiet Hours

---

## 4. Tenant Application & Invite System

### 4.1 Invite Link System

Tenants gain access to the platform through landlord-generated invite links. There is no public tenant registration.

```
┌──────────────────────────────────────────────────────────────────┐
│                     INVITE LINK LIFECYCLE                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  LANDLORD CREATES INVITE                                           │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ POST /api/landlord/invites                                  │   │
│  │                                                             │   │
│  │ Configuration:                                              │   │
│  │  • mode: "property" (any vacant unit) or "unit" (specific)  │   │
│  │  • applicationType: "online" or "face_to_face"              │   │
│  │  • requiredRequirements: valid_id, proof_of_income, etc.    │   │
│  │  • expiresAt: preset (+1 day, +7 days, +30 days)            │   │
│  │  • maxUses: number of times the link can be used            │   │
│  │                                                             │   │
│  │ Generates:                                                  │   │
│  │  • public_token: 24 random bytes, base64url-encoded         │   │
│  │  • token_hash: SHA-256 hash (stored in DB)                  │   │
│  │  • inviteUrl: <origin>/apply/<token>                        │   │
│  │  • QR code: via api.qrserver.com                            │   │
│  └────────────────────┬───────────────────────────────────────┘   │
│                       │                                            │
│                       ▼                                            │
│  INVITE STATUSES:                                                  │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ active → revoked (landlord cancels)                         │   │
│  │ active → expired (passes expiresAt)                         │   │
│  │ active → consumed (useCount reaches maxUses)                │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  TENANT USES INVITE                                                │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ 1. Opens /apply/<token>                                     │   │
│  │ 2. GET /api/invites/[token] — validates token, returns      │   │
│  │    property details, available units, payment preview       │   │
│  │ 3. Completes multi-step application form                    │   │
│  │ 4. POST /api/invites/[token] — submits application          │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Tenant Application Form (Invite Flow)

**Routes:** `/apply/[token]`

```
┌──────────────────────────────────────────────────────────────────┐
│                TENANT APPLICATION STEPS                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  STEP 1: PERSONAL DETAILS                                         │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ • Full name           • Email address                       │   │
│  │ • Phone (PH format:   • Move-in date (not in past)          │   │
│  │   09XXXXXXXXX)         • Emergency contact + name           │   │
│  │ • Unit selection (from available vacant units)              │   │
│  └────────────────────┬───────────────────────────────────────┘   │
│                       │                                            │
│  STEP 2: EMPLOYMENT INFORMATION                                    │
│  ┌────────────────────▼───────────────────────────────────────┐   │
│  │ • Occupation           • Employer name                       │   │
│  │ • Monthly income       • Notes (optional)                    │   │
│  └────────────────────┬───────────────────────────────────────┘   │
│                       │                                            │
│  STEP 3: DOCUMENTS (Online applications only)                      │
│  ┌────────────────────▼───────────────────────────────────────┐   │
│  │ • Valid ID (required)   • Proof of Income (required)        │   │
│  │ • Max 5 files, images only, 10MB each                       │   │
│  │ • Upload via: POST /api/invites/[token]/documents           │   │
│  └────────────────────┬───────────────────────────────────────┘   │
│                       │                                            │
│  STEP 4: REVIEW & SUBMIT                                           │
│  ┌────────────────────▼───────────────────────────────────────┐   │
│  │ • Summary of all entered data                               │   │
│  │ • Payment preview (advance + deposit estimates)             │   │
│  │ • Submit → POST /api/invites/[token]                        │   │
│  │   - Validates all fields                                    │   │
│  │   - Checks unit still vacant (race condition guard)        │   │
│  │   - Inserts application record                              │   │
│  │   - Increments invite use_count                             │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

**Validation Rules:**
- Philippine phone: 10 or 11 digits, starts with `09`
- Move-in date: cannot be in the past
- Online applications: required documents must be uploaded
- Unit availability: double-checked at submission time
- `application_form` requirement: marked as "included digitally" (no upload needed)

### 4.3 Walk-In Application (Landlord Intake)

**Route:** Landlord applications dashboard  
**API:** `POST /api/landlord/applications/walk-in`

This is a 6-step wizard for landlords to manually intake tenants:

```
┌──────────────────────────────────────────────────────────────────┐
│              WALK-IN APPLICATION WIZARD (6 STEPS)                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  STEP 1: IDENTITY                    STEP 4: LEASE SETUP           │
│  ┌──────────────────────┐           ┌──────────────────────┐      │
│  │ • Unit selection     │           │ • Signing mode:       │      │
│  │ • Name, email, phone │           │   in_person | remote  │      │
│  │ • Move-in date       │           │ • Lease dates         │      │
│  │ • Emergency contact  │           │ • Rent + deposit      │      │
│  └──────────┬───────────┘           │ • Dual signing:       │      │
│             │                       │   tenant → landlord   │      │
│  STEP 2: PROFILE         │           │ • PDF generation      │      │
│  ┌──────────▼───────────┐           └──────────┬───────────┘      │
│  │ • Occupation         │                      │                   │
│  │ • Employer           │           STEP 5: PAYMENT               │
│  │ • Monthly income     │           ┌──────────▼───────────┐      │
│  │ • Notes              │           │ • Advance rent       │      │
│  └──────────┬───────────┘           │ • Security deposit   │      │
│             │                       │ • Payment record form│      │
│  STEP 3: VERIFY          │           └──────────┬───────────┘      │
│  ┌──────────▼───────────┐                      │                   │
│  │ • Valid ID toggle    │           STEP 6: FINALIZE              │
│  │ • Income verified    │           ┌──────────▼───────────┐      │
│  │ • Animated checklist │           │ • Summary cards       │      │
│  │   cards              │           │ • "Save as Draft"     │      │
│  └──────────────────────┘           │ • "Finish & Approve"  │      │
│                                     └──────────────────────┘      │
└──────────────────────────────────────────────────────────────────┘
```

### 4.4 Application Approval & Tenant Provisioning

**API:** `POST /api/landlord/applications/[id]/actions`  
**Status transitions:** `pending` → `reviewing` → `payment_pending` → `approved` | `rejected` | `withdrawn`

```
┌──────────────────────────────────────────────────────────────────┐
│              APPLICATION APPROVAL PROCESS                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  LANDLORD APPROVES APPLICATION                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ POST /api/landlord/applications/[id]/actions                │   │
│  │ { status: "approved", lease_data, payments }                │   │
│  └────────────────────┬───────────────────────────────────────┘   │
│                       │                                            │
│                       ▼                                            │
│  AUTOMATIC PROVISIONING SEQUENCE:                                  │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  1. Generate temp password (12 chars, no ambiguous chars)   │   │
│  │  2. Create Supabase Auth user (email_confirm: true,         │   │
│  │     role: tenant)                                           │   │
│  │  3. Create profile record (profiles table)                  │   │
│  │  4. Create lease (status: pending_signature, 12-month term) │   │
│  │  5. Link lease back to application                          │   │
│  │  6. Create payment records (advance_rent + security_deposit)│   │
│  │  7. Generate remote signing link (JWT)                      │   │
│  │  8. Send credentials email to tenant                        │   │
│  │  9. Send credentials copy to landlord                       │   │
│  │ 10. Mark unit as occupied                                   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ROLLBACK ON FAILURE:                                              │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Lease creation fails → delete auth user + profile           │   │
│  │ Payment creation fails → delete lease + auth user + profile │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  QUICK APPROVE (skip payment):                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ POST .../quick-approve → directly creates tenant account,   │   │
│  │ status → "approved", no payment required                    │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 4.5 Pre-Approval Payment Flow

**Route:** `/apply/payments/[token]`  
**API:** `GET /api/application-payments/[token]`, `POST /api/application-payments/[token]`

For applications where the landlord requires payment before final approval:

```
┌──────────────────────────────────────────────────────────────────┐
│              PRE-APPROVAL PAYMENT FLOW                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1. Landlord requests payment (status → "payment_pending")        │
│     • Creates application_payment_requests (advance + deposit)    │
│                                                                    │
│  2. Tenant accesses payment portal via token                       │
│     • GET /api/application-payments/[token]                       │
│     • Shows: amount, GCash destination, QR code                   │
│                                                                    │
│  3. Tenant submits payment proof                                   │
│     • Selects method: GCash, cash, bank transfer                  │
│     • Enters reference number                                     │
│     • Uploads proof of payment (file)                             │
│     • Status → "processing"                                       │
│                                                                    │
│  4. Landlord reviews payment                                       │
│     • POST .../payment-requests/[id]/review                       │
│     • Confirm → status: "completed"                               │
│     • Reject → status: "rejected" (with note)                     │
│                                                                    │
│  5. All payments confirmed → application proceeds to approval     │
└──────────────────────────────────────────────────────────────────┘
```

**Payment Request Statuses:** `pending` → `processing` → `completed` | `rejected` | `expired`

---

## 5. Lease Management & Digital Signing

### 5.1 Lease State Machine

**File:** `src/lib/lease-status-transitions.ts`

```
                         ┌─────────┐
                         │  draft  │
                         └────┬────┘
                              │ (landlord initiates)
                              ▼
                   ┌─────────────────────┐
                   │  pending_signature  │
                   └──────────┬──────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
   ┌──────────────────┐ ┌──────────┐ ┌──────────────┐
   │pending_tenant    │ │ pending_ │ │  terminated  │
   │_signature        │ │ landlord │ │              │
   └────────┬─────────┘ │_signature│ └──────────────┘
            │            └─────┬────┘
            │ (tenant signs)   │ (landlord signs directly)
            ▼                  │
   ┌──────────────────┐       │
   │pending_landlord  │       │
   │_signature        │◄──────┘
   └────────┬─────────┘
            │ (landlord countersigns)
            ▼
      ┌──────────┐         ┌──────────┐
      │  active  │────────▶│ expired  │
      └────┬─────┘         └──────────┘
           │
           │ (mutual termination or move-out)
           ▼
      ┌─────────────┐
      │  terminated │
      └─────────────┘
```

**Valid Transitions:**
| From | To | Trigger |
|------|----|---------|
| `draft` | `pending_signature` | Landlord finalizes lease |
| `pending_signature` | `pending_tenant_signature` | Signing link sent to tenant |
| `pending_signature` | `pending_landlord_signature` | Landlord signs first (in-person) |
| `pending_tenant_signature` | `pending_landlord_signature` | Tenant signs |
| `pending_landlord_signature` | `active` | Landlord countersigns |
| `active` | `expired` | End date passed |
| `active` | `terminated` | Move-out completed or mutual termination |

### 5.2 Remote Signing Flow (Digital Signatures)

**Routes:** `/(signing)/signing/tenant/[leaseId]`, `/(signing)/signing/landlord/[leaseId]`  
**API:** `POST /api/tenant/leases/[leaseId]/sign`, `POST /api/landlord/leases/[leaseId]/sign`

```
┌──────────────────────────────────────────────────────────────────┐
│                  REMOTE SIGNING FLOW                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  PHASE 1: SIGNING LINK GENERATION                                  │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Landlord triggers: POST /api/landlord/applications/[id]/    │   │
│  │ signing-link                                               │   │
│  │                                                             │   │
│  │ Generates JWT containing:                                   │   │
│  │  • leaseId, tenantId, role                                 │   │
│  │  • Expiry: configurable (typically 7 days)                  │   │
│  │                                                             │   │
│  │ Emails signing link to tenant:                              │   │
│  │  • Subject: "Your Lease Agreement is Ready for Signature"   │   │
│  │  • Body: property details, rent, deposit, expiry, link      │   │
│  └────────────────────┬───────────────────────────────────────┘   │
│                       │                                            │
│  PHASE 2: TENANT SIGNING                                           │
│  ┌────────────────────▼───────────────────────────────────────┐   │
│  │ Tenant opens signing link                                   │   │
│  │                                                             │   │
│  │ 1. Validates JWT (leaseId, tenantId, role, expiry)          │   │
│  │ 2. Checks lease status: pending_signature or                │   │
│  │    pending_tenant_signature                                 │   │
│  │ 3. Tenant draws signature on SignaturePad                   │   │
│  │ 4. Client-side validation:                                  │   │
│  │    • Signature not empty                                    │   │
│  │    • Signature format valid (data URL)                      │   │
│  │    • Signature sanitized                                    │   │
│  │ 5. POST /api/tenant/leases/[leaseId]/sign                   │   │
│  │    • Optimistic locking via signature_lock_version          │   │
│  │    • Up to 3 retry attempts on conflict                     │   │
│  │ 6. Server generates tenant-signed PDF                       │   │
│  │ 7. Uploads PDF to landlord-documents bucket                 │   │
│  │ 8. Status → pending_landlord_signature                      │   │
│  │ 9. Sends email notification to landlord                     │   │
│  │ 10. Creates in-app notification for landlord                │   │
│  └────────────────────┬───────────────────────────────────────┘   │
│                       │                                            │
│  PHASE 3: LANDLORD COUNTERSIGNING                                  │
│  ┌────────────────────▼───────────────────────────────────────┐   │
│  │ Landlord opens signing page                                 │   │
│  │                                                             │   │
│  │ 1. Validates lease status: pending_landlord_signature       │   │
│  │ 2. Landlord draws signature                                 │   │
│  │ 3. POST /api/landlord/leases/[leaseId]/sign                 │   │
│  │ 4. Server generates fully-signed PDF                        │   │
│  │ 5. Uploads final document to storage                        │   │
│  │ 6. Status → active                                          │   │
│  │ 7. Sends activation email to tenant                         │   │
│  │ 8. Creates in-app notification for tenant                   │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 5.3 In-Person Signing

Used in the Walk-In Application wizard (Step 4):

1. Tenant signs first (SignaturePad blocks landlord signature until tenant completes)
2. Landlord signs second
3. PDF generated and uploaded to `tenant-invite-documents` bucket
4. Status transitions directly through both signature states

### 5.4 Lease Renewal

**API:** `POST /api/tenant/lease/[id]/renew`  
**Statuses:** `pending` → `approved` → `rejected` → `signed`

```
┌──────────────────────────────────────────────────────────────────┐
│                   LEASE RENEWAL FLOW                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1. TENANT INITIATES RENEWAL                                       │
│     • Navigates to /tenant/lease/[id]/renew                       │
│     • POST /api/tenant/lease/[id]/renew                           │
│     • Status: renewal_request → "pending"                         │
│     • Landlord receives notification                               │
│                                                                    │
│  2. LANDLORD REVIEWS                                               │
│     • Reviews renewal request on landlord dashboard               │
│     • Can adjust: rent amount, terms, dates                       │
│     • Approve → status: "approved", new lease terms sent          │
│     • Reject → status: "rejected"                                 │
│                                                                    │
│  3. SIGNING                                                        │
│     • Approved renewals go through the standard signing flow      │
│     • Both parties sign → status: "signed" → lease "active"      │
│                                                                    │
│  RENEWAL SETTINGS (per property):                                  │
│     • Notification window (e.g., 60 days before expiry)           │
│     • Auto-renewal option (landlord configurable)                 │
└──────────────────────────────────────────────────────────────────┘
```

### 5.5 Lease PDF Generation

**File:** `src/lib/lease-pdf.ts`

- Uses `pdf-lib` library
- Includes: property details, unit info, lease terms, dates, rent/deposit amounts
- Embeds tenant and landlord signatures as images
- Generated PDFs stored in Supabase Storage (`landlord-documents` bucket)
- `signed_document_url` and `signed_document_path` stored on lease record

---

## 6. Payment & Billing

### 6.1 Payment Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    PAYMENT SYSTEM OVERVIEW                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  TABLES:                                                           │
│  • payments — Main payment/invoice records                        │
│  • payment_items — Line items per invoice                         │
│  • payment_proofs — Tenant-submitted proof of payment             │
│  • landlord_payment_destinations — GCash/Maya account details     │
│  • application_payment_requests — Pre-approval payments           │
│  • utility_readings — Meter readings per billing period           │
│                                                                    │
│  PAYMENT METHODS:                                                  │
│  • GCash (primary)         • Maya                                 │
│  • Bank transfer           • Cash (in-person)                     │
│  • Credit/Debit card                                                │
│                                                                    │
│  STATUS LIFECYCLE:                                                 │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ pending → processing → completed                             │  │
│  │   │                      │                                   │  │
│  │   └──────────────────────┼──→ failed                        │  │
│  │                          └──→ refunded                       │  │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 Monthly Invoice Generation (Cron Job)

**API:** `GET /api/cron/monthly-invoices`

```
┌──────────────────────────────────────────────────────────────────┐
│              MONTHLY INVOICE GENERATION                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Triggered by: External cron service (Vercel Cron / scheduled)    │
│  Frequency: Monthly (typically 1st of each month)                 │
│                                                                    │
│  PROCESS:                                                          │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ 1. Fetch all active leases                                  │   │
│  │ 2. For each active lease:                                   │   │
│  │    a) Calculate billing period (current month)              │   │
│  │    b) Base rent amount from lease.monthly_rent              │   │
│  │    c) Add utility charges (if tenant_paid mode):            │   │
│  │       - Water: last meter reading × rate                    │   │
│  │       - Electricity: last meter reading × rate              │   │
│  │    d) Add adjustments/penalties                             │   │
│  │    e) Apply late fee if past due                            │   │
│  │    f) Create payment record (status: pending)               │   │
│  │    g) Create payment_items (rent, water, electricity, etc.) │   │
│  │    h) Send invoice notification to tenant                   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  INVOICE LINE ITEMS (payment_items):                               │
│  • Base Rent (category: rent)                                      │
│  • Water (category: water, with utility_reading snapshot)         │
│  • Electricity (category: electricity, with utility_reading)      │
│  • Adjustments (credits, debits, penalties)                        │
│  • Late fees                                                       │
│                                                                    │
│  UTILITY BILLING MODES:                                            │
│  • included_in_rent: No separate utility line items               │
│  • tenant_paid: Separate water/electricity charges                │
│  • Configurable per property (default) and per unit (override)    │
└──────────────────────────────────────────────────────────────────┘
```

### 6.3 Payment Workflow (Tenant Side)

```
┌──────────────────────────────────────────────────────────────────┐
│                 TENANT PAYMENT WORKFLOW                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  WORKFLOW STATES:                                                  │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ pending → reminder_sent → intent_submitted → under_review  │   │
│  │                                              │               │   │
│  │                    ┌─────────────────────────┼───────────┐  │   │
│  │                    ▼                         ▼           ▼  │   │
│  │            awaiting_in_person           confirmed   rejected│   │
│  │                    │                         │              │   │
│  │                    ▼                         ▼              │   │
│  │               confirmed                 receipted           │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  STEP 1: VIEW INVOICE                                              │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Tenant navigates to /tenant/payments                        │   │
│  │ • Lists all invoices with status, amount, due date          │   │
│  │ • Overdue invoices highlighted                              │   │
│  └────────────────────┬───────────────────────────────────────┘   │
│                       │                                            │
│  STEP 2: SUBMIT PAYMENT INTENT                                     │
│  ┌────────────────────▼───────────────────────────────────────┐   │
│  │ Tenant clicks "Pay" → /tenant/payments/[id]/checkout        │   │
│  │ • Views landlord's GCash/Maya details + QR code             │   │
│  │ • Selects payment method                                    │   │
│  │ • POST /api/tenant/payments/[id]/intent                     │   │
│  │ • Status → intent_submitted                                 │   │
│  └────────────────────┬───────────────────────────────────────┘   │
│                       │                                            │
│  STEP 3: SUBMIT PROOF OF PAYMENT                                   │
│  ┌────────────────────▼───────────────────────────────────────┐   │
│  │ Tenant pays externally (GCash app, bank, etc.)              │   │
│  │ • Enters reference number                                   │   │
│  │ • Uploads screenshot/receipt                                │   │
│  │ • POST /api/tenant/payments/[id]/submit                     │   │
│  │ • Status → under_review                                     │   │
│  └────────────────────┬───────────────────────────────────────┘   │
│                       │                                            │
│  STEP 4: LANDLORD REVIEW                                           │
│  ┌────────────────────▼───────────────────────────────────────┐   │
│  │ Landlord verifies payment receipt                           │   │
│  │ • Confirm → status: confirmed → receipted                   │   │
│  │ • Reject → status: rejected (with reason)                   │   │
│  │ • In-person payment → status: awaiting_in_person            │   │
│  │   Landlord confirms cash receipt → confirmed                │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 6.4 GCash Integration

**Setup (Landlord):**
1. Landlord navigates to payment settings
2. Enters GCash account name and number
3. Uploads GCash QR code image
4. Stored in `landlord_payment_destinations` table

**Tenant Checkout:**
1. Views landlord's GCash details and QR code
2. Completes payment in GCash app
3. Returns to iReside to submit reference number + screenshot
4. Landlord receives notification of payment submission

### 6.5 In-Person/Cash Payment

1. Tenant indicates intent to pay in cash
2. Status → `awaiting_in_person`
3. Landlord confirms cash receipt via modal
4. Status → `confirmed` → `receipted`

### 6.6 Partial Payments

The system supports partial payments:
- `payment_items` track individual line items
- `installment_count` and `balance` fields on payment records
- Tenant can pay portions of the total due
- Landlord tracks outstanding balance

### 6.7 Late Fees

- Configured per lease in contract template (`late_fee_policy`)
- Default: "Standard 5% after 3 days"
- Calculated based on days past due date
- Added as adjustment line item in next billing cycle

### 6.8 Advance Rent & Security Deposit

**Lease-commanded defaults** from `property_contract_template`:
- `advance_rent_months`: Number of months' advance required
- `security_deposit_months`: Number of months' deposit required

These are created as initial payment records when a lease is provisioned.

### 6.9 Payment Reminders

**API:** `POST /api/landlord/invoices/[id]/reminder`
- Landlord manually triggers reminder email to tenant
- Creates system message in tenant-landlord conversation
- Updates payment workflow status to `reminder_sent`

### 6.10 Refunds

**API:** `POST /api/landlord/invoices/[id]/mark-refunded`
- Landlord marks a payment as refunded
- Status → `refunded`
- Requires refund reason/notes

---

## 7. Maintenance Management

### 7.1 Maintenance State Machine

```
┌──────────────────────────────────────────────────────────────────┐
│                MAINTENANCE REQUEST LIFECYCLE                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  STATUSES:                                                         │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ pending → open → assigned → in_progress → resolved → closed │ │
│  │    │                                              │          │ │
│  │    └──────────────────────────────────────────────┼→ cancelled│ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  PRIORITY LEVELS: low | medium | high | urgent                    │
│  CATEGORIES: Plumbing, Electrical, Carpentry, HVAC,               │
│              Pest Control, Appliance, Structural, Other           │
└──────────────────────────────────────────────────────────────────┘
```

### 7.2 Tenant Maintenance Request Flow

**Routes:** `/tenant/maintenance/new`, `/tenant/maintenance`  
**API:** `POST /api/tenant/maintenance`, `GET /api/tenant/maintenance`, `POST /api/tenant/maintenance/media`

```
┌──────────────────────────────────────────────────────────────────┐
│              TENANT MAINTENANCE REQUEST FLOW                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  STEP 1: SUBMIT REQUEST                                            │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Tenant fills form at /tenant/maintenance/new:               │   │
│  │                                                             │   │
│  │ • Category (dropdown: Plumbing, Electrical, etc.)           │   │
│  │ • Description (natural language, free text)                 │   │
│  │ • Priority (low, medium, high, urgent)                      │   │
│  │ • Photo attachments (optional, via media upload API)        │   │
│  │                                                             │   │
│  │ POST /api/tenant/maintenance → creates request              │   │
│  │ Status: pending                                             │   │
│  └────────────────────┬───────────────────────────────────────┘   │
│                       │                                            │
│  STEP 2: AI TRIAGE (automatic)                                     │
│  ┌────────────────────▼───────────────────────────────────────┐   │
│  │ AI MODEL: Groq Llama 3.1 8B                                 │   │
│  │                                                             │   │
│  │ Analyzes the description and performs:                      │   │
│  │                                                             │   │
│  │ • Category confirmation/override                            │   │
│  │   (Was tenant's category selection correct?)                │   │
│  │                                                             │   │
│  │ • Severity assessment                                       │   │
│  │   (Is this low/medium/high/urgent?)                         │   │
│  │                                                             │   │
│  │ • Estimated cost range                                      │   │
│  │   (PHP amount based on issue type)                          │   │
│  │                                                             │   │
│  │ • Sentiment analysis                                        │   │
│  │   (Is the tenant frustrated, calm, urgent?)                 │   │
│  │                                                             │   │
│  │ • Recommended action                                        │   │
│  │   (Immediate, scheduled, self-repair option)                │   │
│  │                                                             │   │
│  │ Output stored on maintenance request record:                │   │
│  │  • ai_category, ai_severity, ai_cost_estimate               │   │
│  │  • ai_sentiment, ai_recommendation                          │   │
│  └────────────────────┬───────────────────────────────────────┘   │
│                       │                                            │
│  STEP 3: LANDLORD REVIEW                                           │
│  ┌────────────────────▼───────────────────────────────────────┐   │
│  │ Landlord sees request with AI analysis on dashboard         │   │
│  │                                                             │   │
│  │ Actions available:                                          │   │
│  │ • Open → status: open                                       │   │
│  │ • Assign to staff → status: assigned                        │   │
│  │ • Start work → status: in_progress                          │   │
│  │ • Resolve → status: resolved                                │   │
│  │ • Close → status: closed                                    │   │
│  │ • Cancel → status: cancelled                                │   │
│  │ • Approve self-repair → tenant notified                     │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 7.3 Self-Repair Workflow

1. Tenant submits maintenance request
2. AI analysis may recommend self-repair as viable option
3. Tenant can request self-repair authorization
4. Landlord reviews and approves/denies
5. If approved: tenant performs repair, submits completion evidence
6. Landlord verifies and closes the request

### 7.4 AI Triage Details

**File:** `src/lib/maintenance-triage.ts`

| Analysis | Description |
|----------|-------------|
| Category Detection | Determines if tenant's category selection is accurate |
| Severity Assessment | Evaluates urgency based on description language |
| Cost Estimation | Provides PHP cost range for the repair |
| Sentiment Analysis | Detects tenant emotional state (frustrated, calm, urgent) |
| Action Recommendation | Suggests immediate action, scheduled repair, or self-repair |

The AI model (Groq Llama 3.1 8B) is prompted with the tenant's description and returns structured JSON with all analysis fields.

---

## 8. Move-Out Workflow

### 8.1 Move-Out State Machine

```
┌──────────────────────────────────────────────────────────────────┐
│                    MOVE-OUT LIFECYCLE                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  STATUSES: pending → approved → denied → completed                │
│                                                                    │
│  ┌──────────┐     ┌──────────┐     ┌──────────────┐              │
│  │ pending  │────▶│ approved │────▶│  completed   │              │
│  └────┬─────┘     └──────────┘     └──────────────┘              │
│       │                                                           │
│       └──────────▶┌──────────┐                                    │
│                   │  denied  │                                    │
│                   └──────────┘                                    │
└──────────────────────────────────────────────────────────────────┘
```

### 8.2 Move-Out Flow

**Routes:** `/tenant/lease/move-out`  
**API:** `POST /api/tenant/lease/move-out`, `POST /api/landlord/move-out`

```
┌──────────────────────────────────────────────────────────────────┐
│                     MOVE-OUT PROCESS                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  STEP 1: TENANT INITIATES MOVE-OUT                                 │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ • Navigates to /tenant/lease/move-out                       │   │
│  │ • Fills move-out request form:                              │   │
│  │   - Proposed move-out date                                  │   │
│  │   - Reason for moving out                                   │   │
│  │   - Forwarding address                                      │   │
│  │ • Completes inspection checklist:                           │   │
│  │   - Unit condition self-assessment                          │   │
│  │   - Damages to report                                       │   │
│  │   - Items to be removed                                     │   │
│  │                                                             │   │
│  │ POST /api/tenant/lease/move-out → status: pending           │   │
│  │ Landlord receives notification                              │   │
│  └────────────────────┬───────────────────────────────────────┘   │
│                       │                                            │
│  STEP 2: LANDLORD REVIEW                                           │
│  ┌────────────────────▼───────────────────────────────────────┐   │
│  │ Landlord reviews move-out request:                          │   │
│  │                                                             │   │
│  │ • Reviews inspection checklist                              │   │
│  │ • Schedules final inspection (if needed)                    │   │
│  │ • Calculates final balance:                                 │   │
│  │   - Outstanding rent                                        │   │
│  │   - Unpaid utilities                                        │   │
│  │   - Damage deductions (from security deposit)               │   │
│  │   - Security deposit refund amount                          │   │
│  │                                                             │   │
│  │ Decision:                                                    │   │
│  │ • Approve → status: approved                                │   │
│  │   - Sets move-out date                                      │   │
│  │   - Generates final statement                               │   │
│  │   - Initiates balance settlement                            │   │
│  │ • Deny → status: denied                                     │   │
│  │   - Provides denial reason                                  │   │
│  │   - Tenant can re-submit                                    │   │
│  └────────────────────┬───────────────────────────────────────┘   │
│                       │                                            │
│  STEP 3: FINALIZATION                                              │
│  ┌────────────────────▼───────────────────────────────────────┐   │
│  │ • Final inspection completed (landlord documents findings)  │   │
│  │ • Balance settlement:                                       │   │
│  │   - Tenant pays outstanding balance OR                      │   │
│  │   - Landlord refunds security deposit remainder             │   │
│  │ • Lease status → terminated                                 │   │
│  │ • Unit status → vacant                                      │   │
│  │ • Move-out status → completed                               │   │
│  │ • Final documents generated                                 │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 8.3 Balance Settlement

During move-out, the system calculates:

| Component | Calculation |
|-----------|-------------|
| Outstanding Rent | Unpaid rent up to move-out date |
| Unpaid Utilities | Last meter readings × rates |
| Damage Deductions | Landlord-assessed damages |
| Security Deposit Refund | Original deposit − deductions |
| Net Settlement | Tenant owes OR Landlord refunds |

---

## 9. Messaging System

### 9.1 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    MESSAGING ARCHITECTURE                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  TABLES:                                                           │
│  • conversations — Conversation metadata                          │
│  • conversation_participants — User membership                    │
│  • messages — Message content + read status                       │
│  • message_user_actions — Archive/block states                    │
│  • message_user_reports — Reported messages                      │
│  • message_moderation_banned_terms — Globally banned terms        │
│                                                                    │
│  MESSAGE TYPES:                                                    │
│  • text — Plain text message                                      │
│  • image — Photo attachment                                       │
│  • file — Document attachment                                     │
│  • system — System-generated (invoice, payment status, etc.)      │
│                                                                    │
│  SYSTEM MESSAGE SUBTYPES:                                          │
│  • invoice — Payment invoice card                                 │
│  • reminder_sent — Payment reminder card                          │
│  • awaiting_in_person — In-person payment prompt                  │
│  • landlord_review — Payment under review notification            │
└──────────────────────────────────────────────────────────────────┘
```

### 9.2 Conversation Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                  MESSAGING CONVERSATION FLOW                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1. CONVERSATION LIST                                              │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ GET/POST /api/messages/conversations                        │   │
│  │                                                             │   │
│  │ Returns: ConversationSummary[]                              │   │
│  │ • Participants (name, avatar, role, roleBadge)              │   │
│  │ • Last message preview                                      │   │
│  │ • Unread count badge                                        │   │
│  │ • Relationship classification:                              │   │
│  │   - tenant_landlord (from active lease)                     │   │
│  │   - prospective (from application)                          │   │
│  │   - stranger (no formal relationship)                       │   │
│  │ • Online/offline indicator                                   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  2. USER SEARCH                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ GET /api/messages/users?q=<search>                          │   │
│  │                                                             │   │
│  │ • Minimum 2 characters                                      │   │
│  │ • Case-insensitive ILike matching on name/email             │   │
│  │ • Maximum 20 results                                        │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  3. CONVERSATION VIEW                                              │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ GET /api/messages/conversations/{id}                        │   │
│  │                                                             │   │
│  │ • Returns up to 500 messages                                │   │
│  │ • Signed URLs for file attachments (1-hour TTL)             │   │
│  │ • Split-pane layout: contact list + message area            │   │
│  │ • Responsive: side-by-side (desktop), full-width (mobile)   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  4. SENDING MESSAGES                                               │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ POST /api/messages/conversations/{id}                       │   │
│  │                                                             │   │
│  │ Before insertion, server runs 3-layer moderation:           │   │
│  │                                                             │   │
│  │ Layer 1: Banned terms check                                 │   │
│  │   • Loads terms from message_moderation_banned_terms        │   │
│  │   • 1-minute cache TTL                                      │   │
│  │   • Case-insensitive matching                               │   │
│  │                                                             │   │
│  │ Layer 2: AI moderation (Groq Llama 3.1 8B)                  │   │
│  │   • Detects: profanity, hate speech, harassment, spam       │   │
│  │   • Returns: { isFlagged, category, confidence }            │   │
│  │                                                             │   │
│  │ Layer 3: Fallback regex pattern matching                    │   │
│  │   • Common profanity patterns                               │   │
│  │                                                             │   │
│  │ If flagged → 422 response with category                     │   │
│  │ If clean → message inserted, real-time broadcast            │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 9.3 File Attachments

| Feature | Detail |
|---------|--------|
| Max file size | 20 MB |
| Allowed types (images) | JPEG, PNG, GIF, WebP |
| Allowed types (documents) | PDF, DOCX, XLSX, PPTX, ZIP |
| Image optimization | Client-side Canvas → WebP (max 1600px, 0.82 quality) |
| Upload method | XHR with progress tracking |
| Storage bucket | `message-files` (auto-created) |
| URL expiry | 1-hour signed URLs |

### 9.4 Real-Time Messaging

- **Supabase Realtime** subscriptions on `messages` table
- Client subscribes to INSERT events for the active conversation
- On new message event: re-fetch messages to get full data with attachment URLs
- Typing indicator with animated dots

### 9.5 Reporting & Blocking

| Action | API |
|--------|-----|
| Report message | `POST /api/messages/users/{targetUserId}/reports` |
| Block user | `POST /api/messages/users/{targetUserId}/actions` |
| Archive conversation | `POST /api/messages/users/{targetUserId}/actions` |

---

## 10. Community Hub

### 10.1 Architecture

The Community Hub is a per-property social space where landlords and tenants can interact.

```
┌──────────────────────────────────────────────────────────────────┐
│                    COMMUNITY HUB ARCHITECTURE                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  POST TYPES:                                                       │
│  • announcement — Landlord-only, auto-pinned, prominent display   │
│  • discussion — Text posts with comments (all users)              │
│  • poll — 2-5 options with voting (landlord-created)              │
│  • photo_album — Multi-image posts (landlord-created)             │
│                                                                    │
│  DATABASE TABLES:                                                  │
│  • community_posts — Post content + metadata                      │
│  • community_post_reactions — 5 reaction types                    │
│  • community_comments — Comment threads                           │
│  • community_polls + community_poll_votes — Poll data             │
│  • community_albums + community_photos — Photo album data         │
│  • community_saved_posts — Bookmarks                               │
└──────────────────────────────────────────────────────────────────┘
```

### 10.2 Post Feed

**API:** Server actions in `src/lib/community/actions.ts`

```
┌──────────────────────────────────────────────────────────────────┐
│                     POST FEED WORKFLOW                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1. PROPERTY SCOPING                                               │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ • Tenants: auto-scoped to their leased property             │   │
│  │   (lease → unit → property_id)                              │   │
│  │ • Landlords: select property via animated picker            │   │
│  │   (GSAP-powered PropertySelectorHub)                        │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  2. POST CREATION                                                  │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Landlord: All 4 post types available                        │   │
│  │ Tenant: discussion type only                                │   │
│  │                                                             │   │
│  │ Announcements:                                              │   │
│  │  • Auto-pinned (isPinned: true)                             │   │
│  │  • Status: published (no approval needed)                   │   │
│  │                                                             │   │
│  │ Discussions:                                                │   │
│  │  • Text body only (no title required)                       │   │
│  │  • Tenant posts: status → pending_approval                  │   │
│  │  • Landlord posts: status → published                       │   │
│  │                                                             │   │
│  │ Polls:                                                      │   │
│  │  • 2-5 options, title + body                                │   │
│  │  • Real-time vote counting                                  │   │
│  │                                                             │   │
│  │ Photo Albums:                                               │   │
│  │  • Max 4 photos, images only                                │   │
│  │  • Upload via /api/community/media (10MB each)              │   │
│  │  • Photos stored in community-images bucket                 │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  3. INTERACTIONS                                                   │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Reactions: 5 types                                          │   │
│  │  • like, heart, thumbs_up, clap, celebration               │   │
│  │  • Toggle via toggleReaction(postId, type)                  │   │
│  │  • Animated button with count                               │   │
│  │                                                             │   │
│  │ Comments:                                                   │   │
│  │  • Expandable thread per post                               │   │
│  │  • Author avatar + timestamp                                │   │
│  │  • Edit/delete own comments                                 │   │
│  │                                                             │   │
│  │ Poll Voting:                                                │   │
│  │  • One vote per user per poll                               │   │
│  │  • Selected option highlighted                              │   │
│  │  • Vote counts updated in real time                         │   │
│  │                                                             │   │
│  │ Save/Bookmark:                                              │   │
│  │  • toggleSavePost(postId)                                   │   │
│  │  • "Saved" tab for bookmarked posts                         │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  4. MODERATION                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ • Tenant posts require landlord approval                    │   │
│  │ • Landlord sees "Approvals" tab with badge count            │   │
│  │ • approveResidentPost() server action                       │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 10.3 Post Feed Cursor Pagination

- `getPosts()` supports cursor-based pagination
- Filters: type, status, property_id, search (title/body)
- Role-scoped: tenants see only their property; landlords choose property

---

## 11. iRis AI Assistant

### 11.1 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    IRIS AI ARCHITECTURE                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  MODELS:                                                           │
│  • Groq Llama 3.1 8B Instant — Chat responses (temp 0.7)         │
│  • Qwen 32B — Portfolio analysis (temp 0.6)                       │
│                                                                    │
│  CAPABILITIES:                                                     │
│  • Tenant-facing: Building concierge with RAG context             │
│  • Landlord-facing: Analytics insights + portfolio analysis       │
│  • Message moderation: Content filtering                          │
│  • Maintenance triage: Auto-categorization + severity             │
│                                                                    │
│  DATABASE: iris_chat_messages — Persisted conversation history    │
└──────────────────────────────────────────────────────────────────┘
```

### 11.2 Tenant iRis (Concierge Mode)

**API:** `POST /api/iris/chat`, `GET /api/iris/history`

```
┌──────────────────────────────────────────────────────────────────┐
│                  IRIS CONCIERGE FLOW (TENANT)                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1. CONTEXT RETRIEVAL (RAG)                                        │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ On each message, getTenantContext(userId) fetches:          │   │
│  │                                                             │   │
│  │ • Tenant profile (name, phone, etc.)                        │   │
│  │ • Active lease details:                                     │   │
│  │   - Unit info (number, floor, beds, baths)                  │   │
│  │   - Property info (name, address, amenities, house rules)   │   │
│  │   - Lease terms (rent, dates, deposit)                      │   │
│  │ • 5 most recent maintenance requests                        │   │
│  │ • 5 most recent payments                                    │   │
│  │                                                             │   │
│  │ Data formatted into system prompt instructing AI to act     │   │
│  │ as a friendly building concierge                            │   │
│  └────────────────────┬───────────────────────────────────────┘   │
│                       │                                            │
│  2. CHAT PROCESSING                                                │
│  ┌────────────────────▼───────────────────────────────────────┐   │
│  │ • Loads up to 80 persisted messages for continuity          │   │
│  │ • Calls Groq Llama 3.1 8B Instant:                          │   │
│  │   - Temperature: 0.7                                        │   │
│  │   - Max tokens: 500                                         │   │
│  │ • Persists user message + assistant response                │   │
│  │ • WiFi info detection: if user asks about WiFi,             │   │
│  │   response includes hasDataCard: true                       │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  3. CLIENT-SIDE CACHING                                            │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Dual-cache strategy:                                        │   │
│  │  • In-memory Map (fastest)                                  │   │
│  │  • sessionStorage (survives page refreshes)                 │   │
│  │  • 5-minute TTL on history fetch                            │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 11.3 Landlord iRis (Analytics Mode)

**API:** `POST /api/landlord/analytics/insights`, `POST /api/landlord/analytics/iris-analysis`

```
┌──────────────────────────────────────────────────────────────────┐
│             IRIS ANALYTICS FLOW (LANDLORD)                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  PER-KPI INSIGHTS (Llama 3.1 8B):                                  │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ • Receives individual KPI data from analytics overview      │   │
│  │ • Generates natural-language explanation for each metric    │   │
│  │ • Explains what changed and why                              │   │
│  │ • Fallback: rule-based comparison if AI fails               │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  PORTFOLIO ANALYSIS (Qwen 32B):                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ • Receives full portfolio overview                           │   │
│  │ • Returns structured analysis:                              │   │
│  │   {                                                         │   │
│  │     summary: "Overall portfolio health assessment...",      │   │
│  │     goodThings: ["Occupancy is strong at 95%", ...],        │   │
│  │     toLookOutFor: ["3 maintenance requests overdue", ...]   │   │
│  │   }                                                         │   │
│  │ • Fallback: buildStatsAwareFallback() — rule-based          │   │
│  │   analysis from raw KPI titles and values                   │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 11.4 Redaction Service

**API:** `POST /api/iris/redact`

- Used by the messaging moderation pipeline
- Detects sensitive information (phone numbers, emails, addresses)
- Can run AI-based or regex-based redaction

---

## 12. Admin Portal

### 12.1 Dashboard

**Route:** `/admin/dashboard`  
**API:** `GET /api/admin/stats`, `GET /api/admin/registrations`, `GET /api/admin/product-tour/metrics`

```
┌──────────────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  METRICS DISPLAYED:                                                │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ USER STATS:                                                 │   │
│  │ • Total users, total landlords, total tenants               │   │
│  │                                                             │   │
│  │ PLATFORM ACTIVITY:                                          │   │
│  │ • Active leases count                                       │   │
│  │ • Total properties count                                    │   │
│  │                                                             │   │
│  │ REGISTRATION QUEUE:                                         │   │
│  │ • Pending applications count                                │   │
│  │ • Reviewing applications count                              │   │
│  │ • Status breakdown visualization                            │   │
│  │                                                             │   │
│  │ PRODUCT TOUR FUNNEL:                                        │   │
│  │ • Entered → Completed → Skipped                             │   │
│  │ • Completion rate percentage                                │   │
│  │ • Last 30 days trend                                        │   │
│  │                                                             │   │
│  │ PLATFORM HEALTH:                                             │   │
│  │ • Tenant saturation (% of properties with tenants)          │   │
│  │ • Landlord footprint                                        │   │
│  │ • Lease coverage                                            │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 12.2 Registration Management

**Routes:** `/admin/registrations`, `/admin/registrations/sync_permit_card`  
**API:** `GET /api/admin/registrations`, `PATCH /api/admin/registrations/{id}`, `POST /api/admin/registrations/{id}/verify`

(Detailed in Section 3.1 — Landlord Verification)

### 12.3 User Management

**Route:** `/admin/users`  
**API:** `GET /api/admin/users`, `GET /api/admin/users/{id}`, `PUT /api/admin/users/{id}`

- View all platform users
- Filter by role (tenant, landlord, admin)
- View user profiles and verification status
- Update user details

### 12.4 Chat Moderation

**Route:** `/admin/chat-moderation`  
**API:** `GET /api/admin/chat-moderation/reports`, `PATCH /api/admin/chat-moderation/reports/{id}`, `GET/POST /api/admin/chat-moderation/terms`

```
┌──────────────────────────────────────────────────────────────────┐
│                   CHAT MODERATION HUB                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  REPORT QUEUE:                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ • Expandable report cards with:                             │   │
│  │   - Reporter info + reported user info                      │   │
│  │   - Reported message snippet                                │   │
│  │   - Evidence screenshots (30-min signed URLs)               │   │
│  │   - Category + status                                       │   │
│  │                                                             │   │
│  │ Actions:                                                    │   │
│  │ • Dismiss → status: dismissed                               │   │
│  │ • Resolve → status: resolved                                │   │
│  │ • Promote to Banned Term → auto-resolves report             │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  BANNED TERMS MANAGEMENT:                                          │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ • Up to 500 terms, min 2 chars, max 200 chars               │   │
│  │ • Deduplication by normalized form                          │   │
│  │ • Source tracking: manual, AI-detected, promoted-from-report│   │
│  │ • Search within terms                                       │   │
│  │ • 1-minute cache sync with moderation engine                │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 12.5 Consultation Tool

**Route:** `/admin/consultation-tool`

- Document management for admin consultations
- File upload with signing capability
- Stored in `consultation_documents` table

---

## 13. Property & Unit Management

### 13.1 Property Portfolio Dashboard

**Route:** `/landlord/properties`  
**API:** `GET /api/landlord/properties/overview`

```
┌──────────────────────────────────────────────────────────────────┐
│                PROPERTY PORTFOLIO DASHBOARD                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  PER-PROPERTY METRICS:                                             │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ • Occupancy rate: occupied/total units (%)                  │   │
│  │ • Active maintenance count: open + assigned + in_progress   │   │
│  │ • NOI (Net Operating Income): sum of completed payments     │   │
│  │ • Annual potential rent: sum(unit_rent) × 12                │   │
│  │ • Valuation: annualPotential × 14                           │   │
│  │ • Cap rate: (NOI / valuation) × 100                         │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  PORTFOLIO STATUS CLASSIFICATION:                                  │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Performing:       occupancy ≥ 90% AND maintenance ≤ 2      │   │
│  │ Attention Needed: maintenance ≥ 5 OR occupancy < 70%        │   │
│  │ Stable:           everything else                           │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  FILTER TABS:                                                      │
│  • All Portfolio  • Stable Assets  • Action Required              │
└──────────────────────────────────────────────────────────────────┘
```

### 13.2 Property Creation Wizard

**Route:** `/landlord/properties/new`

```
┌──────────────────────────────────────────────────────────────────┐
│                PROPERTY CREATION WIZARD (4 STEPS)                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  STEP 1: BASIC INFO                                                │
│  • Property name, address, type (apartment/dormitory/boarding)    │
│                                                                    │
│  STEP 2: IMAGES                                                    │
│  • Upload up to 12 property photos                                │
│  • Client-side WebP optimization (max 1600px, 0.82 quality)       │
│                                                                    │
│  STEP 3: UNIT CONFIGURATION                                        │
│  • Define units: name, floor, beds, baths, sqft, rent             │
│                                                                    │
│  STEP 4: ENVIRONMENT POLICIES                                       │
│  • Curfew, visitor cutoff, quiet hours                            │
│  • Gender restrictions                                             │
│  • Utility billing mode: included_in_rent or tenant_paid          │
│  • Max occupants per unit                                          │
│  • Smart contract preview                                          │
└──────────────────────────────────────────────────────────────────┘
```

### 13.3 Unit Map (2D Visual Planner)

**Routes:** `/landlord/visual-planner`, `/tenant/unit-map`  
**API:** `GET/POST /api/landlord/unit-map`, `GET /api/landlord/unit-map/floor-configs`

- Drag-and-drop grid canvas (DnD Kit)
- Visual representation of building floors and units
- Color-coded by unit status (vacant, occupied, maintenance)
- Floor switching via floor configuration
- Read-only view for tenants

### 13.4 Environment Policies

**Table:** `property_environment_policies`, `unit_environment_overrides`

| Policy | Description |
|--------|-------------|
| `environment_mode` | Policy preset (relaxed, standard, strict) |
| `max_occupants_per_unit` | Maximum allowed occupants |
| `curfew_time` | Curfew start time |
| `visitor_cutoff_time` | Latest visitor entry |
| `quiet_hours_start/end` | Quiet hours window |
| `gender_restriction` | male_only, female_only, mixed |
| `utility_policy_mode` | included_in_rent or tenant_paid |

### 13.5 Property Type Defaults

| Type | Curfew | Visitor Cutoff | Utilities |
|------|--------|----------------|-----------|
| Apartment | None | None | Included in rent |
| Dormitory | 22:00 | 21:00 | Separately metered |
| Boarding House | None | None | Mixed |

---

## 14. Analytics & Reporting

### 14.1 Analytics Overview

**Route:** `/landlord/analytics`  
**API:** `GET /api/landlord/analytics/overview?start=&end=&propertyId=`

```
┌──────────────────────────────────────────────────────────────────┐
│                    ANALYTICS DASHBOARD                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  PRIMARY KPIs (with 7-point trend + period-over-period change):    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ • Gross Revenue — Total completed payments                  │   │
│  │ • Physical Occupancy — occupied/total units                 │   │
│  │ • Economic Occupancy — actual rent / potential rent         │   │
│  │ • Rent Arrears — overdue + unpaid amounts                   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  EXTENDED KPIs:                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ • Operating Expenses — Sum of expense records               │   │
│  │ • Net Operating Income — Revenue − Expenses                 │   │
│  │ • Turnover Rate — Unit turnover frequency                   │   │
│  │ • Resolution Efficiency — Avg days to resolve maintenance   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  FINANCIAL WINDOWS:                                                │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Week view:   7 daily data points                            │   │
│  │ Month view:  5 weekly data points                           │   │
│  │ Year view:   12 monthly data points                         │   │
│  │                                                             │   │
│  │ Each window: earnings[], expenses[], net_income[]           │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  OPERATIONAL SNAPSHOT:                                             │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ • Portfolio status: Performing / Stable / Attention          │   │
│  │ • Headline + summary text                                    │   │
│  │ • Metric tiles:                                              │   │
│  │   - Occupied Units count                                     │   │
│  │   - Urgent Issues count                                      │   │
│  │   - Renewals Soon count                                      │   │
│  │   - Outstanding Rent amount                                  │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  MAINTENANCE COST ESTIMATION:                                      │
│  • Direct: payments tagged with maintenance keywords              │
│    ("maintenance", "repair", "plumbing", "electrical", "fix")     │
│  • Fallback: resolvedCount × PHP 1,500                            │
│                                                                    │
│  CURRENCY FORMATTING: Intl.NumberFormat("en-PH") for PHP          │
└──────────────────────────────────────────────────────────────────┘
```

### 14.2 Report Export

**API:** `POST /api/landlord/analytics/report`

| Format | Method |
|--------|--------|
| CSV | Server-generated with proper escaping, returned as `text/csv` |
| PDF | Client-side via jsPDF library |

**Export Options:** Simplified/Detailed view, include expanded KPIs, date range, KPI row data

**Export History:** `GET /api/landlord/analytics/report` returns paginated export records from `landlord_statistics_exports` table.

---

## 15. Notifications System

### 15.1 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                  NOTIFICATIONS ARCHITECTURE                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  NOTIFICATION TYPES:                                               │
│  • payment — Payment-related updates                              │
│  • lease — Lease status changes                                   │
│  • lease_renewal_request — Tenant requests renewal                │
│  • lease_renewal_approved — Landlord approves renewal             │
│  • maintenance — Maintenance status changes                       │
│  • announcement — Community announcements                         │
│  • message — New message received                                 │
│  • application — Application status changes                       │
│  • move_out_request — Tenant initiates move-out                   │
│  • move_out_approved — Landlord approves move-out                 │
│                                                                    │
│  DELIVERY:                                                         │
│  • In-app: NotificationBanner + NotificationContext                │
│  • Email: Via Nodemailer for critical actions                     │
│  • Sound: Browser sound effects for real-time alerts              │
└──────────────────────────────────────────────────────────────────┘
```

### 15.2 NotificationContext

**File:** `src/context/NotificationContext.tsx`

```
┌──────────────────────────────────────────────────────────────────┐
│                NOTIFICATION CONTEXT                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  STATE (useReducer):                                              │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ • notifications[] — All notifications (limit 50)            │   │
│  │ • importantNotifications[] — Filtered by type               │   │
│  │ • unreadCount — Total unread                                │   │
│  │ • urgentCount — Important + unread                          │   │
│  │ • counts — Category counts (applications, maintenance, msgs)│   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  REAL-TIME SUBSCRIPTIONS (4 channels):                             │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ • notifications table — INSERT/UPDATE/DELETE                │   │
│  │ • applications table — Landlord-side count refresh          │   │
│  │ • maintenance_requests table — Count refresh                │   │
│  │ • messages table — Unread count refresh                     │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  METHODS:                                                          │
│  • markAsRead(id) — Mark single notification as read              │
│  • markAllAsRead() — Mark all as read                             │
│  • deleteNotification(id) — Remove notification                   │
│  • refresh() — Force re-fetch from database                       │
│                                                                    │
│  CATEGORY COUNTS:                                                  │
│  • Landlords: pending applications, active maintenance,            │
│    unread messages                                                 │
│  • Tenants: unread messages only                                   │
│                                                                    │
│  SOUND EFFECTS (via useSound hook):                                │
│  • "message" sound — New message notification                     │
│  • "notification" sound — All other notification types            │
└──────────────────────────────────────────────────────────────────┘
```

### 15.3 Notification Banner

**Component:** `src/components/navigation/NotificationBanner.tsx`

```
┌──────────────────────────────────────────────────────────────────┐
│                 NOTIFICATION BANNER                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  COLLAPSED STATE:                                                  │
│  • Compact pill (8rem × 2.5rem)                                   │
│  • Bell icon + "X Alerts" text                                    │
│  • Chevron-down indicator                                         │
│                                                                    │
│  EXPANDED STATE:                                                   │
│  • Full-width bar (max 4xl)                                       │
│  • "PRIORITY" label + counter (e.g., "2/5")                      │
│  • Type-specific theming:                                          │
│    - payment → Red + CreditCard icon                              │
│    - lease → Amber + FileText icon                                │
│    - maintenance → Blue + Wrench icon                             │
│    - default → Emerald + Bell icon                                │
│  • Title + message text (truncated)                                │
│  • Navigation arrows (prev/next)                                   │
│  • Dismiss button (marks read, advances)                           │
│  • "Take Action" button — routes to relevant page                 │
│    - payment → /tenant/payments/{id}/checkout                     │
│    - lease → /tenant/lease/{id}                                   │
│  • Progress bar (6-second auto-rotation)                           │
│  • Close button (collapses banner)                                 │
│                                                                    │
│  ANIMATION:                                                        │
│  • Framer Motion AnimatePresence with popLayout mode              │
│  • Spring physics for width/height transitions                    │
│  • Auto-rotation pauses on hover                                   │
│  • "New notification" pulse (5-second animation)                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 16. Product Tours (Onboarding)

### 16.1 Landlord Product Tour

**API:** `GET/POST /api/landlord/tour`, `POST /api/landlord/tour/start`, `POST /api/landlord/tour/skip`, `POST /api/landlord/tour/complete`, `GET /api/landlord/tour/replay`

**File:** `src/lib/landlord-product-tour.ts` (state machine)

```
┌──────────────────────────────────────────────────────────────────┐
│                LANDLORD PRODUCT TOUR                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Multi-step quest-like onboarding covering:                        │
│  • Dashboard navigation                                            │
│  • Property management                                             │
│  • Application review                                              │
│  • Lease creation                                                  │
│  • Payment collection                                              │
│  • Maintenance management                                          │
│  • Community hub                                                   │
│  • Analytics                                                       │
│                                                                    │
│  Features:                                                         │
│  • State persistence across sessions                              │
│  • Skip individual steps or entire tour                           │
│  • Replay capability                                               │
│  • Completion tracking with admin-visible metrics                 │
└──────────────────────────────────────────────────────────────────┘
```

### 16.2 Tenant Product Tour

**API:** `GET/POST /api/tenant/tour`, `POST /api/tenant/tour/skip`, `POST /api/tenant/tour/complete`, `GET /api/tenant/tour/replay`

**File:** `src/lib/product-tour.ts` (orchestration)

```
┌──────────────────────────────────────────────────────────────────┐
│                 TENANT PRODUCT TOUR                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Guided onboarding covering:                                       │
│  • Dashboard overview                                              │
│  • Viewing lease details                                           │
│  • Making payments                                                 │
│  • Submitting maintenance requests                                 │
│  • Messaging the landlord                                          │
│  • Community hub participation                                     │
│                                                                    │
│  Features:                                                         │
│  • Auto-redirect from middleware on first access                  │
│  • Source tracking (which page triggered the tour)                │
│  • State persistence                                               │
│  • Skip and replay options                                         │
└──────────────────────────────────────────────────────────────────┘
```

### 16.3 Admin Tour Metrics

**API:** `GET /api/admin/product-tour/metrics`

- Aggregate completion funnel (entered → completed → skipped)
- Completion rate as percentage
- Last 30 days trend data

---

## 17. Amenities Booking

### 17.1 Architecture

**API:** `GET/POST /api/tenant/amenities/bookings/[id]`

```
┌──────────────────────────────────────────────────────────────────┐
│                  AMENITIES BOOKING SYSTEM                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  LANDLORD SETUP:                                                   │
│  • Define amenities per property (pool, gym, function room, etc.) │
│  • Set pricing (per-use or hourly)                                │
│  • Set capacity limits                                             │
│  • Set availability status (available, unavailable, maintenance)  │
│                                                                    │
│  TENANT BOOKING:                                                   │
│  • Browse available amenities                                     │
│  • Select date and time slot                                       │
│  • Check capacity vs. current bookings                            │
│  • Confirm booking                                                 │
│  • Payment integration (if priced)                                │
│                                                                    │
│  STATUSES: available, booked, in_use, completed, cancelled         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 18. Appendix: Status Enums & Database Tables

### 18.1 Complete Status Enum Reference

| Entity | Status Values |
|--------|--------------|
| **ApplicationStatus** | `pending`, `reviewing`, `payment_pending`, `approved`, `rejected`, `withdrawn` |
| **LeaseStatus** | `draft`, `pending_signature`, `pending_tenant_signature`, `pending_landlord_signature`, `active`, `expired`, `terminated` |
| **PaymentStatus** | `pending`, `processing`, `completed`, `failed`, `refunded` |
| **PaymentWorkflow** | `pending`, `reminder_sent`, `intent_submitted`, `under_review`, `awaiting_in_person`, `confirmed`, `rejected`, `receipted` |
| **PaymentMethod** | `credit_card`, `debit_card`, `gcash`, `maya`, `bank_transfer`, `cash` |
| **MaintenanceStatus** | `pending`, `open`, `assigned`, `in_progress`, `resolved`, `closed`, `cancelled` |
| **MaintenancePriority** | `low`, `medium`, `high`, `urgent` |
| **MoveOutStatus** | `pending`, `approved`, `denied`, `completed` |
| **UnitStatus** | `vacant`, `occupied`, `maintenance` |
| **PropertyType** | `apartment`, `dormitory`, `boarding_house` |
| **InviteStatus** | `active`, `revoked`, `expired`, `consumed` |
| **InviteMode** | `property`, `unit` |
| **ApplicationType** | `online`, `face_to_face`, `existing_tenant` |
| **RenewalStatus** | `pending`, `approved`, `rejected`, `signed` |
| **UserRole** | `tenant`, `landlord`, `admin` |
| **UtilityType** | `water`, `electricity` |
| **UtilityBillingMode** | `included_in_rent`, `tenant_paid` |
| **AmenityStatus** | `available`, `booked`, `in_use`, `completed`, `cancelled` |
| **VerificationStatus** | `not_verified`, `verified`, `not_found`, `error` |
| **PortfolioStatus** | `Performing`, `Stable`, `Attention Required` |

### 18.2 Complete Database Table Reference

#### Core Business Tables

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `profiles` | All user accounts | id, email, full_name, role, phone, avatar_url, cover_url, business_name, has_changed_password, bio |
| `properties` | Property listings | id, landlord_id, name, address, type, images, total_units, total_floors, base_rent_amount, amenities, house_rules, contract_template |
| `units` | Individual rental units | id, property_id, name, status, floor, rent_amount, beds, baths, sqft |
| `leases` | Lease agreements | id, unit_id, tenant_id, landlord_id, status, start_date, end_date, monthly_rent, security_deposit, terms, tenant_signature, landlord_signature, tenant_signed_at, landlord_signed_at, signed_document_url, signing_link_token_hash, signing_link_expires_at, signature_lock_version |
| `payments` | Payment/invoice records | id, lease_id, tenant_id, landlord_id, amount, status, method, description, due_date, paid_at, reference_number, billing_cycle, landlord_confirmed |
| `payment_items` | Invoice line items | id, payment_id, label, amount, category, utility_reading snapshot |
| `payment_proofs` | Tenant-submitted payment proof | id, payment_id, file_url, reference_number, submitted_at |
| `maintenance_requests` | Maintenance issues | id, unit_id, tenant_id, category, description, priority, status, sentiment, ai_* fields |

#### Application & Onboarding Tables

| Table | Description |
|-------|-------------|
| `applications` | Tenant rental applications |
| `landlord_applications` | Landlord registration applications |
| `application_payment_requests` | Pre-approval payment requests for tenants |
| `tenant_intake_invites` | Invite links for tenant applications |
| `tenant_intake_invite_events` | Audit trail for invite usage |

#### Community Tables

| Table | Description |
|-------|-------------|
| `community_posts` | Community hub posts |
| `community_post_reactions` | Reaction records per post |
| `community_comments` | Comment threads |
| `community_polls` | Poll data |
| `community_poll_votes` | Individual votes |
| `community_albums` | Photo album metadata |
| `community_photos` | Individual photos in albums |
| `community_saved_posts` | User bookmarks |

#### Messaging Tables

| Table | Description |
|-------|-------------|
| `conversations` | Conversation metadata |
| `conversation_participants` | User membership in conversations |
| `messages` | Message content + read status |
| `message_user_actions` | Archive/block states |
| `message_user_reports` | Reported messages |
| `message_moderation_banned_terms` | Globally banned terms |

#### Configuration Tables

| Table | Description |
|-------|-------------|
| `property_environment_policies` | Curfew, visitor, quiet hours, utility config |
| `unit_environment_overrides` | Per-unit environment overrides |
| `property_environment_utility_configs` | Utility billing config per property/unit |
| `utility_readings` | Meter readings per billing period |
| `unit_floor_configs` | Floor configuration for Unit Map |
| `landlord_payment_destinations` | Landlord GCash/Maya account details |
| `landlord_renewal_notification_settings` | Renewal notification config |
| `property_images` | Property image gallery |
| `property_renewal_settings` | Lease renewal configuration |
| `chat_moderation_terms` | Community moderation terms |
| `chat_moderation_reports` | Moderation reports |

#### System Tables

| Table | Description |
|-------|-------------|
| `notifications` | In-app user notifications |
| `expenses` | Landlord expense tracking |
| `amenities` | Property amenities |
| `amenity_bookings` | Amenity reservations |
| `consultation_documents` | Admin consultation files |
| `landlord_statistics_exports` | Analytics export history |
| `iris_chat_messages` | iRis AI conversation history |
| `saved_posts` | Legacy saved posts (may be deprecated) |

### 18.3 Supabase Storage Buckets

| Bucket | Purpose | Contents |
|--------|---------|----------|
| `landlord-documents` | Landlord registration + onboarding | Identity docs, permits, ownership proofs, avatars, covers, property photos |
| `tenant-invite-documents` | Tenant application documents | Valid IDs, proof of income, signed leases |
| `message-files` | Chat file attachments | Images, PDFs, documents |
| `message-report-evidence` | Moderation evidence | Report screenshots |
| `community-images` | Community hub photos | Album photos, post images |
| `billing` | Billing-related files | Payment proofs (may use dedicated path) |

### 18.4 Email Templates

| Function | Recipient | Trigger | Subject |
|----------|-----------|---------|---------|
| `sendRegistrationOTP` | Landlord applicant | OTP request | "`<code>` is your iReside verification code" |
| `sendLandlordRegistrationApproved` | Landlord | Admin approves registration | "Your Landlord Registration is Approved" |
| `sendLandlordOnboardingMagicLink` | Landlord | Admin approves registration | "Complete Your Landlord Setup — Action Required" |
| `sendLandlordCredentialsCopy` | Landlord | Tenant account created | "Tenant Account Created — `<name>`" |
| `sendTenantCredentials` | Tenant | Account approved by landlord | "Welcome to iReside — Your Account is Ready" |
| `sendSigningLinkEmail` | Tenant | Lease ready for signature | "Your Lease Agreement is Ready for Signature" |
| `sendTenantSignedNotification` | Landlord | Tenant signed lease | "Tenant Signed Lease — `<name>`" |
| `sendLeaseActivatedNotification` | Tenant | Both parties signed | "Your Lease is Now Active" |
| `sendTenantOnboardingReminder` | Tenant | Incomplete onboarding | "Continue your iReside onboarding" |
| `sendProspectPaymentRequestEmail` | Prospect tenant | Payment step reached | "Action Required: Submit move-in payment details" |

---

## Document Information

- **Generated:** 2026-05-31
- **Repository:** [iReside](https://github.com/Sedictt/iReside)
- **Branch:** `main-development`
- **Total Workflows Documented:** 17 major workflow areas
- **Total API Endpoints Analyzed:** 80+
- **Total Database Tables Cataloged:** 35+

---

*This document provides a complete reference for all business workflows, state machines, API endpoints, and database operations in the iReside platform. For technical implementation details, refer to `docs/TECHNICAL_DOCUMENTATION.md` and `docs/SYSTEM_DESIGN_AND_API_DOCUMENTATION.md`.*