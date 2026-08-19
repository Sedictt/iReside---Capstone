# iReside System-Wide Backend Refactoring Plan

> **Last Updated:** 2026-06-21
> **Status:** Phase 3 In Progress — Auth Guard Migration (AUTH-1 Complete)
> **Progress:** 2 / 7 Phases Complete (Phase 3 actively underway)

---

## Guiding Principles

### 1. Non-Destructive — Zero Downtime
- Every change is **additive-first**: extract → test → then remove old code
- No mass deletions. No "big bang" rewrites.
- Each refactored module ships independently — if it breaks, only that module is affected
- Database migrations are **additive only** (new columns, new tables, new policies; never drop without a deprecation window)
- Old and new code coexist during transition via adapter/façade pattern
- Every phase ends with the full test suite passing

### 2. Identifier Naming Convention (NON-NEGOTIABLE)
Every identifier in the codebase MUST follow these rules:

| Rule | Description | ❌ Forbidden | ✅ Required |
|------|-------------|-------------|-------------|
| **No single letters** | Any identifier shorter than 3 characters (except idiomatic loop indices `i`, `j`, `k` in <10 line loops) | `x`, `y`, `z`, `a`, `b`, `e` | `coordinate`, `item`, `result`, `error`, `index` |
| **No abbreviations** | Full words only — no truncations or acronyms unless universally known (URL, ID, API, JSON, HTML) | `usr`, `prof`, `prp`, `req`, `res`, `ctx`, `cfg`, `btn`, `msg` | `user`, `profile`, `property`, `request`, `response`, `context`, `config`, `button`, `message` |
| **No random symbols** | No underscores as names, no Hungarian notation, no type prefixes | `_unused`, `$element`, `m_data`, `str_name` | `unusedParameter`, `element`, `data`, `propertyName` |
| **Must be noun/verb/adjective** | Identifiers describe what they ARE (nouns), what they DO (verbs), or what QUALITY they have (adjectives) | `temp`, `stuff`, `data1`, `foo`, `handle`, `process` | `temporaryFile`, `userProfile`, `primaryData`, `handleSubmit`, `processPayment` |
| **Booleans use `is`/`has`/`should` prefix** | Boolean variables MUST start with `is`, `has`, `should`, `can`, `will`, or `does` | `loading`, `valid`, `active` | `isLoading`, `isValid`, `isActive` |
| **Functions use verb prefix** | Functions that do something start with `get`, `set`, `create`, `update`, `delete`, `fetch`, `validate`, `compute`, `build`, `handle`, `process`, `send`, `check`, `find` | `leaseById()`, `paymentData()`, `profile()` | `getLeaseById()`, `validatePaymentData()`, `fetchUserProfile()` |
| **Arrays are plural** | Array variable names end in `s` or use `List`/`Collection` suffix | `user`, `payment`, `item` | `users`, `payments`, `items`, `userList`, `paymentCollection` |
| **Constants are UPPER_SNAKE** | Module-level constants use SCREAMING_SNAKE_CASE | `maxRetries`, `apiUrl` | `MAX_RETRIES`, `API_URL` |
| **Types/Interfaces are PascalCase** | TypeScript types and interfaces | `userProfile`, `property_type` | `UserProfile`, `PropertyType` |
| **Avoid generic suffixes** | No `Data`, `Info`, `Details`, `Object` unless there's a specific reason | `userData`, `paymentInfo` | `userProfile`, `paymentReceipt` |
| **Handler/Event naming** | Event handlers start with `handle` or `on` | `click()`, `submit()` | `handleClick()`, `onSubmit()` |
| **Parameter naming** | Parameters describe their purpose, not their type | `(str: string)`, `(num: number)` | `(email: string)`, `(leaseId: number)` |

### Identifier Audit Process (Before every PR)
Before merging any refactored code:
1. Run `grep -rPn '\b[a-zA-Z]\b' --include="*.ts" --include="*.tsx" src/` to find single-letter variables
2. Run a script that flags any identifier <3 chars (except allowed: `id`, `db`, `AI`, etc.)
3. Manual review that all identifiers are descriptive nouns/verbs/adjectives
4. No identifier is a "temporary name" or "placeholder"

---

## Current State — Backend Anti-Pattern Inventory

### Architecture & Layer Violations
| # | Anti-Pattern | Severity | Files Affected |
|---|-------------|----------|---------------|
| A1 | No service layer — business logic in route handlers | Critical | ~70 API route files |
| A2 | Only 2 files use `'use server'` directive | High | Entire codebase |
| A3 | `email.ts` is 37KB dumping ground (13 functions, inline HTML) | Critical | `src/lib/email.ts` |
| A4 | `community/actions.ts` is 1267 lines, 18+ unrelated functions | Critical | `src/lib/community/actions.ts` |
| A5 | `billing/workflow.ts` is 1432 lines mixing audit, notifications, payments | High | `src/lib/billing/workflow.ts` |
| A6 | Duplicate payment query logic: `queries/payments.ts` vs `billing/workflow.ts` | Medium | 2 files |
| A7 | Auth copy-pasted inline in 70+ route handlers | Critical | All API routes |
| A8 | Two different auth helpers with overlap (middleware.ts `auth()` vs auth.ts functions) | High | `src/lib/supabase/middleware.ts`, `src/lib/supabase/auth.ts` |

### Security Vulnerabilities
| # | Issue | Severity | Location |
|---|-------|----------|----------|
| S1 | OTP returned in HTTP response body | Critical | `src/app/api/auth/registration-otp/route.ts` |
| S2 | Cron endpoint has no authorization check | High | `src/app/api/cron/monthly-invoices/route.ts` |
| S3 | 52 RLS policies with unwrapped `auth.uid()` calls | High | Database |
| S4 | 162 multiple permissive policy warnings from Supabase lint | High | Database |
| S5 | Gmail OAuth tokens stored in `profiles` table | High | `profiles` table |
| S6 | OTP codes in `profiles` alongside public profile data | High | `profiles` table |
| S7 | `email.ts` has no `'use server'` directive (server-only by accident) | Medium | `src/lib/email.ts` |
| S8 | Boneyard/bypass user-agent allowlist in middleware | Medium | `src/lib/supabase/middleware.ts` |
| S9 | No rate limiting on auth or AI endpoints | Medium | All auth + IRIS routes |
| S10 | `as any` type assertions mask real type errors everywhere | Medium | Throughout codebase |

### Database Structural Issues
| # | Issue | Severity | Details |
|---|-------|----------|---------|
| D1 | 3 competing schema files (source-of-truth, cleaned, dump) | Critical | No canonical schema |
| D2 | JSON columns for structured data in 14+ tables | High | Notifications, payment items, applications, tour events, etc. |
| D3 | Column migration fallback loop in production route handler | High | `applications/route.ts` — retries with different columns |
| D4 | Legacy column name `post_id` alongside `poll_id` with runtime fallback | Medium | `community/actions.ts` |
| D5 | `tenant_intake_invites` has RLS enabled but no policies | Medium | Security gap |
| D6 | `post_views` accessible only via function (no direct RLS) | Low | Indirect access pattern |

### Code Quality Issues
| # | Issue | Severity | Files |
|---|-------|----------|-------|
| C1 | `validatePaymentData` reimplemented in test file (not imported) | High | `__tests__/route.test.ts` |
| C2 | `renewal-validation.test.ts` reimplements logic instead of importing | High | `src/lib/__tests__/renewal-validation.test.ts` |
| C3 | No standard error response envelope across API routes | High | All API routes |
| C4 | No standard success response envelope | Medium | All API routes |
| C5 | `business-verification.test.ts` is a 9-line smoke test | Medium | Test coverage gap |
| C6 | No shared test factories or mock utilities | Medium | All tests |
| C7 | Integration tests hit production-like Supabase instance | Medium | 2 integration test files |
| C8 | `utils.ts` is 172 bytes (only exports `cn()`) | Low | `src/lib/utils.ts` |
| C9 | `constants.ts` is 203 bytes | Low | `src/lib/constants.ts` |
| C10 | `example.spec.js` tests external site (playwright.dev) | Low | `tests/example.spec.js` |

---

## Refactoring Plan — 7 Phases

---

### Phase 1: Foundation — Shared Infrastructure (Non-Destructive Setup)

**Goal:** Create the new patterns. Old code continues to work unchanged. New code will use these.

**Duration:** ~1 week

---

#### 1.1 Standard API Response Envelope

**Create** `src/lib/api/response.ts`:

```typescript
// New file — zero existing code modified

export interface ApiSuccessEnvelope<T> {
  readonly success: true;
  readonly data: T;
  readonly timestamp: string;
}

export interface ApiErrorEnvelope {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
  readonly timestamp: string;
}

export interface ApiPaginatedEnvelope<T> {
  readonly success: true;
  readonly data: T[];
  readonly pagination: {
    readonly page: number;
    readonly pageSize: number;
    readonly totalCount: number;
    readonly totalPages: number;
  };
  readonly timestamp: string;
}

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope | ApiPaginatedEnvelope<T>;
```

**Non-destructive:** This is a new file. Nothing imports it yet.

---

#### 1.2 Standard API Auth Guards

**Create** `src/lib/api/auth-guard.ts`:

```typescript
// New file — zero existing code modified

export async function requireAuthenticatedUser(): Promise<AuthenticatedContext>;
export async function requireRole(role: string): Promise<AuthenticatedContext>;
export async function requireLandlordOwnsProperty(propertyId: string): Promise<void>;
export async function requireAccessToLease(leaseId: string): Promise<void>;
```

Merges the auth helper duplication (middleware.ts `auth()` vs auth.ts functions) into one place.

**Non-destructive:** Old inline auth checks remain functional.

---

#### 1.3 Typed Database Client Consolidation

**Refactor** `src/lib/supabase/` — rename exports for clarity, keep old exports as aliases:

```typescript
// src/lib/supabase/server.ts — RENAME export
- export async function createClient()
+ export async function createServerSupabaseClient()
+ // Backward compat alias:
+ export const createClient = createServerSupabaseClient;  // ← REMOVE after all consumers migrated

// src/lib/supabase/admin.ts — RENAME export
- export function createAdminClient()
+ export function createServiceRoleSupabaseClient()
+ export const createAdminClient = createServiceRoleSupabaseClient; // ← backward compat

// src/lib/supabase/client.ts — RENAME export
- export function createClient()
+ export function createBrowserSupabaseClient()
+ export const createClient = createBrowserSupabaseClient; // ← backward compat
```

**Non-destructive:** Aliases keep all existing imports working. Migration is gradual.

---

#### 1.4 Input Validation Schemas

**Create** `src/lib/validation/` directory:

```
src/lib/validation/
  schemas/
    common.schema.ts     — UUID, email, pagination, date-range
    auth.schema.ts       — login, signup, OTP
    lease.schema.ts      — lease creation, renewal, move-out
    payment.schema.ts    — payment recording, invoice generation
    property.schema.ts   — property CRUD, unit management
    community.schema.ts  — posts, comments, reactions
    messaging.schema.ts  — conversations, messages
  validation-middleware.ts — validateBody(), validateQuery(), validateParams()
```

**Non-destructive:** New validation schemas. Old inline validation stays in place until routes are migrated.

---

#### 1.5 Identifier Audit Script

**Create** `scripts/audit-identifiers.sh`:

A script that scans the codebase and flags:
- Single-letter variables
- Identifiers <3 characters (except whitelist: `id`, `db`, `AI`, `OTP`, `URL`)
- Non-descriptive names (heuristic: no vowels, or only common words like "data", "temp", "stuff")
- Boolean variables without `is`/`has` prefix
- Functions without verb prefix

**Purpose:** Runs as a pre-commit hook and CI step to enforce naming conventions.

---

### Phase 2: Email Service Refactor (Highest Impact, Isolated Domain)

**Goal:** Decompose the 37KB `email.ts` monolith into a modular email service with typed facade and shared transport.

**Status:** 🟢 Complete | 2026-06-14 → 2026-06-15

**Duration:** ~2 days

---

#### 2.1 Update email.ts to Use Shared Transport

- Added `'use server'` directive to `src/lib/email.ts`
- Replaced inline `nodemailer.createTransport()` + `sendMail()` with calls to `sendEmail()` from transport layer
- All 10 original function signatures preserved — zero consumers broken

#### 2.2 Create Email Transport Layer

**Created** `src/lib/email/transport.ts` (104 lines):
- SMTP connection management via nodemailer
- Automatic retry with exponential backoff (3 attempts, 1s/2s/3s delays)
- All failures logged but never thrown — email failures don't block request flow
- Config: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- Single export: `sendEmail(emailOptions: EmailOptions): Promise<void>`

#### 2.3 Create Email Service Facade

**Created** `src/lib/email/email-service.ts` (304 lines):
- Thin facade wrapping all 10 email functions from `email.ts`
- Each function has a typed parameter interface (e.g., `TenantWelcomeEmailParameters`, `LeaseSigningRequestEmailParameters`)
- Descriptive, convention-compliant function names (e.g., `sendTenantWelcomeEmail`, `sendLeaseSigningRequestEmail`)
- All functions marked `"use server"` — only callable server-side
- Zero HTML duplication — delegates entirely to `email.ts` implementation

**Function mapping (old → new):**

| Old Name | New Name |
|----------|----------|
| `sendTenantCredentials` | `sendTenantWelcomeEmail` |
| `sendLandlordCredentialsCopy` | `sendLandlordCredentialsCopyEmail` |
| `sendSigningLinkEmail` | `sendLeaseSigningRequestEmail` |
| `sendTenantSignedNotification` | `sendTenantSignedNotificationEmail` |
| `sendLeaseActivatedNotification` | `sendLeaseActivatedNotificationEmail` |
| `sendTenantOnboardingReminder` | `sendTenantOnboardingReminderEmail` |
| `sendProspectPaymentRequestEmail` | `sendProspectPaymentRequestEmail` (kept) |
| `sendRegistrationOTP` | `sendRegistrationOtpEmail` |
| `sendLandlordRegistrationApproved` | `sendLandlordRegistrationApprovedEmail` |
| `sendLandlordOnboardingMagicLink` | `sendLandlordOnboardingMagicLinkEmail` |

#### 2.4 Deliverables

| # | File | Status |
|---|------|--------|
| 1 | `src/lib/email/transport.ts` | ✅ Created — SMTP with retry |
| 2 | `src/lib/email/email-service.ts` | ✅ Created — typed facade (10 functions) |
| 3 | `src/lib/email.ts` | ✅ Updated — delegates to transport |
| 4 | `src/lib/__tests__/email.test.ts` | ✅ Updated — mock matches namespace import |
| 5 | Full test suite | ✅ 281/281 passing |

#### 2.5 Pending: Consumer Migration (deferred to Phase 3+)

- 8 call sites across routes still use old `email.ts` import paths
- Old functions remain fully functional — no rush to migrate
- Migration will be done one route per commit alongside Phase 3 service extraction

---

### Phase 3: Service Layer Extraction (Domain by Domain)

**Goal:** Extract business logic from route handlers into testable service modules. Each domain is an independent, non-destructive migration.

**Duration:** ~2 weeks (1-2 domains per day)

---

#### Service Module Structure (Consistent Across All Domains)

Each service follows this file structure:

```
src/lib/services/<domain>/
  <domain>.service.ts     # Public API — all business logic
  <domain>.types.ts       # Domain-specific types/interfaces
  <domain>.errors.ts      # Domain-specific error classes
  __tests__/
    <domain>.service.test.ts
```

**Pattern for every service:**

```typescript
// Every service method receives its dependencies explicitly (Supabase client, etc.)
// NEVER imports supabase directly — receives it

export class LeaseService {
  constructor(private readonly supabase: SupabaseClient) {}

  async getLeaseById(leaseId: string): Promise<Lease> { ... }
  async createLease(input: CreateLeaseInput): Promise<Lease> { ... }
  async signLease(leaseId: string, signature: SignatureData): Promise<void> { ... }
  // ...
}
```

---

#### 3.1 Lease Service (DO FIRST — most complex, sets the pattern)

**Extract from:**
- `src/app/api/landlord/leases/[leaseId]/route.ts`
- `src/app/api/landlord/leases/sign/route.ts`
- `src/app/api/landlord/leases/signing-link/route.ts`
- `src/app/api/tenant/lease/` (all sub-routes)
- `src/lib/lease-status-transitions.ts`
- `src/lib/signature-validation.ts`
- `src/lib/lease-pdf.ts`
- `src/lib/queries/leases.ts`

**Create:**

```
src/lib/services/lease/
  lease.service.ts         # Core business logic
  lease.types.ts            # Lease, LeaseStatus, LeaseTransition, etc.
  lease.errors.ts           # LeaseNotFoundError, InvalidTransitionError, etc.
  lease-status-machine.ts   # Refactored from lease-status-transitions.ts
  lease-signature.ts        # Refactored from signature-validation.ts
  lease-pdf-generator.ts    # Refactored from lease-pdf.ts
  __tests__/
    lease.service.test.ts
    lease-status-machine.test.ts
    lease-signature.test.ts
```

**Migration approach:**
1. Create the service module → all tests pass
2. Pick one route (e.g., tenant lease GET) → refactor to use service
3. Test → deploy → verify
4. Repeat for remaining lease routes
5. After all routes migrated → remove old lease utility files (or keep as deprecated re-exports)

---

#### 3.2 Payment & Billing Service

**Extract from:**
- `src/lib/billing/workflow.ts` (1432 lines)
- `src/lib/queries/payments.ts`
- `src/lib/billing/server.ts`
- `src/lib/billing/utils.ts`
- `src/app/api/landlord/payments/`
- `src/app/api/landlord/invoices/`
- `src/app/api/landlord/expenses/`
- `src/app/api/landlord/utility-readings/`
- `src/app/api/tenant/payments/`

**Create:**

```
src/lib/services/payment/
  payment.service.ts       # Payment CRUD, invoice generation
  billing.service.ts       # Utility billing computation
  expense.service.ts       # Expense tracking
  ledger.service.ts        # Financial ledger queries
  audit.service.ts         # Payment audit events
  payment.types.ts
  payment.errors.ts
  __tests__/
```

---

#### 3.3 Application Service

**Extract from:** Landlord and tenant application routes.

```
src/lib/services/application/
  application.service.ts
  application.types.ts
  application.errors.ts
  application-state-machine.ts  # Application status transitions
  __tests__/
```

---

#### 3.4 User & Profile Service

**Extract from:**
- `src/lib/supabase/auth.ts` (server actions)
- `src/app/api/profile/`
- `src/app/api/admin/users/`

```
src/lib/services/user/
  user.service.ts          # Profile CRUD, role management
  auth.service.ts          # Sign up, sign in, sign out, password management
  user.types.ts
  user.errors.ts
  __tests__/
```

**Also merges the two auth helpers** (middleware.ts `auth()` + auth.ts functions) into one auth service.

---

#### 3.5 Community Service

**Refactor** `src/lib/community/actions.ts` (1267 lines → split by concern):

```
src/lib/services/community/
  post.service.ts          # Create, read, update, delete posts
  comment.service.ts       # Comment operations
  reaction.service.ts      # Like, reactions
  poll.service.ts          # Poll creation, voting
  moderation.service.ts    # Content moderation, reporting
  community.types.ts
  community.errors.ts
  __tests__/
  queries/
    post.queries.ts        # Refactored from community/queries.ts
```

---

#### 3.6 Messaging Service

**Extract from:** `src/lib/messages/engine.ts` and conversation routes.

```
src/lib/services/messaging/
  conversation.service.ts
  message.service.ts
  messaging.types.ts
  messaging.errors.ts
  __tests__/
```

---

#### 3.7 Notification Service

**Centralize** — notification creation currently scattered across billing, messaging, lease code.

```
src/lib/services/notification/
  notification.service.ts
  notification.types.ts
  __tests__/
```

---

#### 3.8 Property Service

```
src/lib/services/property/
  property.service.ts
  unit.service.ts
  amenity.service.ts
  property.types.ts
  property.errors.ts
  __tests__/
```

---

#### 3.9 Maintenance Service

```
src/lib/services/maintenance/
  maintenance.service.ts
  maintenance.types.ts
  maintenance.errors.ts
  __tests__/
```

---

#### 3.10 IRIS AI Service

```
src/lib/services/iris/
  iris.service.ts          # Chat orchestration
  iris-context.service.ts  # Refactored from iris/context.ts
  iris.types.ts
  __tests__/
```

---

### Phase 4: Database Hardening (Additive Only)

**Goal:** Fix structural schema issues. All migrations are additive (new columns, new tables, new policies). Nothing is dropped without a full deprecation cycle.

**Duration:** ~1 week

---

#### 4.1 Establish Single Canonical Schema

- Promote `source-of-truth-db.sql` as the single canonical source of truth
- Delete `source-of-truth-db-cleaned.sql` (it's already missing `saved_posts`)
- Move `dump.sql` to `docs/archive/` (historical reference, not active)
- Add to `package.json` scripts: `db:inventory` → regenerates `docs/database-inventory/`

**Non-destructive:** We're just designating which file is authoritative.

---

#### 4.2 Sensitive Data Extraction from `profiles` (ADDITIVE)

**Step 1 — Create new normalized tables (additive):**

```sql
-- Migration: 20260610000000_extract_sensitive_from_profiles.sql

-- OTP storage (already partially done via profile_private, but incomplete)
ALTER TABLE profile_private
  ADD COLUMN IF NOT EXISTS otp_code TEXT,
  ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMPTZ;

-- Move external tokens to existing external_account_tokens table
-- (gmail_access_token, gmail_refresh_token, gmail_token_expiry already have a home)
-- Just ensure columns exist and app writes to both old AND new locations during migration

-- 2FA settings to user_security_settings
ALTER TABLE user_security_settings
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS two_factor_email TEXT;
```

**Step 2 — Dual-write adaptation:**

Update profile update code to write to BOTH old and new locations during migration window.

**Step 3 — Code migration:**

After dual-write is deployed and verified, update reads to use new locations.

**Step 4 — Cleanup (future migration, separate PR):**

After full verification, drop columns from `profiles` in a separate migration (with backup).

---

#### 4.3 RLS Policy Hardening

Continue the `20260601*` series:

- `20260610010000_wrap_auth_calls_in_initplan` — addresses 52 remaining unwrapped `auth.uid()` calls
- `20260610020000_consolidate_permissive_policies` — addresses 162 multiple-permissive warnings
- Add RLS policies to `tenant_intake_invites` (currently has RLS enabled but no policies)

**Non-destructive:** All changes are policy rewrites that maintain or improve security without changing behavior.

---

#### 4.4 JSON Column Assessment

**Do NOT blindly normalize.** Audit each JSON column:

| Table | JSON Column | Assessment | Action |
|-------|------------|------------|--------|
| `notifications` | `metadata` | Log data, queried occasionally | Keep JSON — add validation |
| `payment_items` | `details` | Line-item data | **Normalize** — high query frequency |
| `applications` | `form_data` | Submitted form data | Keep JSON — variable schema, read-heavy |
| `landlord_product_tour_events` | `event_data` | Log data | Keep JSON — append-only audit log |
| `landlord_product_tour_states` | `state_data` | State snapshot | Keep JSON — single-row read per user |
| `lease_signing_audit` | `metadata` | Audit trail | Keep JSON — immutable log |
| `message_moderation_banned_terms` | `metadata` | Config data | Keep JSON — reads infrequent |
| `move_out_requests` | `checklist_data` | Variable checklist | Keep JSON — variable structure |
| `landlord_statistics_exports` | `query_params` | Export parameters | Keep JSON — one-time reads |

**Key principle:** Normalize only when the JSON fields are queried/joined/filtered in WHERE clauses.

---

#### 4.5 Production Code Cleanup

- Remove column-migration fallback loop from `applications/route.ts` (once schema is stable)
- Clean up `poll_id`/`post_id` dual column — standardize on `poll_id`, add migration if `post_id` still exists
- Remove legacy column references across codebase

---

### Phase 5: API Route Standardization

**Goal:** Every route becomes a thin shell: auth → validate → service → respond. Apply the patterns from previous phases.

**Duration:** ~1 week

---

#### 5.1 Route Refactoring Pattern (Applied to Each Domain)

**Before (anti-pattern):**
```typescript
// route.ts — 150+ lines
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("property_id");
  if (!propertyId) return NextResponse.json({ error: "Missing property_id" }, { status: 400 });
  
  // 100+ lines of business logic, DB queries, error handling mixed together...
}
```

**After (standardized pattern):**
```typescript
// route.ts — <30 lines
export async function GET(request: NextRequest): Promise<NextResponse<ApiEnvelope<Lease[]>>> {
  const authenticatedContext = await requireAuthenticatedUser();
  const validatedQuery = await validateQuery(getLeasesSchema, request);
  const leaseList = await new LeaseService(authenticatedContext.supabase)
    .getLeasesByProperty(authenticatedContext.userId, validatedQuery.propertyId);
  return apiSuccess(leaseList);
}
```

**Error handling is centralized:** Service throws `LeaseNotFoundError` → caught by a route-level wrapper → mapped to `apiError("LEASE_NOT_FOUND", 404)`.

---

#### 5.2 Domain Route Refactor Order

1. Lease routes (tenant + landlord) — Phase 3.1 service ready
2. Payment routes — Phase 3.2 service ready
3. Application routes — Phase 3.3 service ready
4. Profile routes — Phase 3.4 service ready
5. Community routes — Phase 3.5 service ready
6. Messaging routes — Phase 3.6 service ready
7. Admin routes
8. Cron routes
9. IRIS routes
10. All remaining routes

Each route refactor is a single commit. Each route passes existing tests before and after.

---

#### 5.3 Error Handling Standardization

**Create** `src/lib/errors/app-error.ts`:

```typescript
export class AppError extends Error {
  constructor(
    readonly errorCode: string,
    readonly httpStatus: number,
    message: string,
    readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier: string) {
    super(`${resource.toUpperCase()}_NOT_FOUND`, 404, `${resource} not found: ${identifier}`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super('UNAUTHORIZED', 401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super('FORBIDDEN', 403, message);
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown) {
    super('VALIDATION_FAILED', 400, 'Request validation failed', details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', 409, message);
  }
}
```

---

### Phase 6: Testing Infrastructure

**Goal:** Reliable, maintainable test suite with shared utilities.

**Duration:** ~1 week

---

#### 6.1 Test Factories (Builder Pattern)

**Create** `src/__tests__/factories/`:

```typescript
// user.factory.ts
export function buildUserProfile(overrides?: Partial<UserProfile>): UserProfile;
export function buildAuthenticatedContext(overrides?: Partial<AuthenticatedContext>): AuthenticatedContext;

// property.factory.ts
export function buildProperty(overrides?: Partial<Property>): Property;
export function buildUnit(overrides?: Partial<Unit>): Unit;

// lease.factory.ts
export function buildLease(overrides?: Partial<Lease>): Lease;
export function buildLeaseInput(overrides?: Partial<CreateLeaseInput>): CreateLeaseInput;

// payment.factory.ts
export function buildPayment(overrides?: Partial<Payment>): Payment;
export function buildInvoice(overrides?: Partial<Invoice>): Invoice;

// community.factory.ts
export function buildCommunityPost(overrides?: Partial<CommunityPost>): CommunityPost;
export function buildComment(overrides?: Partial<Comment>): Comment;
```

---

#### 6.2 Reusable Supabase Mock Builder

**Create** `src/__tests__/helpers/mock-supabase.ts`:

```typescript
export function createMockSupabaseClient(): SupabaseClient {
  // Centralized mock that all tests use
  // Each test can override specific chains
}
```

---

#### 6.3 Fix Duplicated Test Logic

| Test File | Issue | Fix |
|-----------|-------|-----|
| `applications/.../__tests__/route.test.ts` | `validatePaymentData` reimplemented | Import from source |
| `renewal-validation.test.ts` | Logic reimplemented | Import actual functions |
| `business-verification.test.ts` | 9-line smoke test | Write proper tests |

---

#### 6.4 Integration Test Isolation

- Move `lease-renewal.integration.test.ts` and `renewal-policy.integration.test.ts` to use Docker Supabase (or local Supabase CLI)
- Add seed scripts for required test data
- Add CI configuration for integration test runs

---

#### 6.5 Remove Dead/Essential Tests

- Delete `tests/example.spec.js` (tests external site)

---

### Phase 7: Code Quality & Final Polish

**Goal:** Consistency, documentation, cleanup.

**Duration:** ~1 week

---

#### 7.1 Global Identifier Rename

**Systematic pass over the entire codebase** to enforce the naming conventions:

| Category | Target | Script/Method |
|----------|--------|---------------|
| Single-letter variables | `a`, `b`, `x`, `y`, `z`, `e`, `i` (except loop index) | `grep -rPn '\b[a-zA-Z]\b' src/` → manual rename |
| Abbreviated names | `usr`, `prof`, `req`, `res`, `ctx`, `cfg` | Search common patterns → rename to full words |
| Non-descriptive names | `data`, `temp`, `stuff`, `foo`, `item`, `val`, `obj` | Manual review → rename to specific nouns |
| Boolean without prefix | `loading`, `valid`, `active`, `open`, `visible` | `grep -rPn '(let|const)\s+\w*(loading|valid|active|open|visible)'` → rename `isLoading`, etc. |
| Function without verb prefix | `lease()`, `payment()`, `profile()` | Manual review → rename `getLease()`, `fetchPayment()`, etc. |

**Non-destructive:** Pure rename operations. Functionality unchanged. Tests re-run after each batch.

---

#### 7.2 Enable TypeScript Strict Mode

1. Add `strict: true` to `tsconfig.json`
2. Fix all resulting type errors (no `as any` escapes)
3. Add `noUncheckedIndexedAccess: true`

**Approach:** Enable strict mode file-by-file or directory-by-directory. Each fix is a separate commit.

---

#### 7.3 Consistent File Naming

Standardize across the project:

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `LeaseCard.tsx` |
| Hooks | camelCase, `use` prefix | `useLeaseData.ts` |
| Services | kebab-case, `.service.ts` suffix | `lease.service.ts` |
| Types | kebab-case, `.types.ts` suffix | `lease.types.ts` |
| Utilities | kebab-case | `format-currency.ts` |
| API Routes | Next.js convention | `route.ts` |
| Tests | `__tests__/` directory, `.test.ts` suffix | `lease.service.test.ts` |
| Migrations | Timestamp prefix | `20260610000000_description.sql` |

---

#### 7.4 Documentation

- Update or create `docs/backend-architecture.md` — architecture overview, layers, patterns
- Create `docs/api-endpoints.md` — list of all endpoints with auth requirements
- Create `docs/database-schema.md` — generated from canonical schema
- Add JSDoc to all service public methods
- Create `docs/naming-conventions.md` — the identifier rules from this document

---

#### 7.5 Dead Code Removal

- Remove unused exports (after verifying zero imports)
- Remove legacy `poll_id`/`post_id` fallback
- Remove column-migration retry loop
- Remove `example.spec.js`
- Remove empty/trivial utility files (or populate them)

---

---

## Phase 1 Completion Report (2026-06-14)

### Deliverables

| Sub-phase | File | Status |
|-----------|------|--------|
| 1.1 API Response Envelope | `src/lib/api/response.ts` | ✅ Created |
| 1.1 API Barrel Export | `src/lib/api/index.ts` | ✅ Created |
| 1.2 API Auth Guards | `src/lib/api/auth-guard.ts` | ✅ Created |
| 1.3 Supabase Client Renames | `src/lib/supabase/server.ts` | ✅ Refactored (backward compat) |
| 1.3 Supabase Client Renames | `src/lib/supabase/client.ts` | ✅ Refactored (backward compat) |
| 1.3 Supabase Client Renames | `src/lib/supabase/admin.ts` | ✅ Refactored (backward compat) |
| 1.3 Supabase Re-export | `src/lib/supabase.ts` | ✅ Updated |
| 1.4 Validation Schemas | `src/lib/validation/schemas/common.schema.ts` | ✅ Created |
| 1.4 Validation Schemas | `src/lib/validation/schemas/auth.schema.ts` | ✅ Created |
| 1.4 Validation Middleware | `src/lib/validation/validation-middleware.ts` | ✅ Created |
| 1.4 Validation Barrel | `src/lib/validation/index.ts` | ✅ Created |
| 1.5 Identifier Audit Script | `scripts/audit-identifiers.sh` | ✅ Created |

### Backward Compatibility

- `createClient()` — **still works** on all three Supabase client modules (deprecated alias)
- `createServerSupabaseClient()` — **new preferred name** for server.ts
- `createBrowserSupabaseClient()` — **new preferred name** for client.ts
- `createServiceRoleSupabaseClient()` — **new preferred name** for admin.ts
- All 180+ existing files that import `createClient` continue to compile without changes

### Identifier Audit

- All 3 new files in `src/lib/api/` pass the audit with **zero violations**
- All 4 new files in `src/lib/validation/` pass the audit with **zero violations**
- The audit script is ready for CI integration (`bash scripts/audit-identifiers.sh --strict`)

### Safety Verification

- **Zero existing files modified** (except supabase client files which added aliases)
- **Zero database changes** — this phase was purely code-level
- **Zero test failures introduced** — all existing tests continue to pass with old import paths

---

## Progress Tracking

| Phase | Status | Started | Completed | Notes |
|-------|--------|---------|-----------|-------|
| Phase 1: Foundation | 🟢 Complete | 2026-06-14 | 2026-06-14 | 5 new modules created — zero existing code touched |
| Phase 2: Email Refactor | 🟢 Complete | 2026-06-14 | 2026-06-15 | Transport layer + typed facade — zero HTML duplication |
| Phase 3: Service Layer | 🔴 Not Started | — | — | 10 sub-phases |
| Phase 4: DB Hardening | 🔴 Not Started | — | — | |
| Phase 5: API Standardization | 🔴 Not Started | — | — | |
| Phase 6: Testing | 🔴 Not Started | — | — | |
| Phase 7: Polish | 🔴 Not Started | — | — | |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Breaking existing functionality | Medium | High | Non-destructive approach: extract → test → switch → remove |
| Schema drift during long refactor | Medium | Medium | Canonical schema enforcement + CI check |
| Test gaps letting regressions through | Medium | High | Service-level tests added before route refactor |
| Identifier renames breaking imports | Low | Medium | IDE/TypeScript catches all import errors at compile time |
| Phase dependencies blocking progress | Low | Low | Each service domain is independent; can reorder freely |

---

## Appendix A: Identifier Audit Checklist (Per-File)

Before marking any file as "refactored," verify:

- [ ] No single-letter variables (except `i`, `j`, `k` in <10 line loops)
- [ ] No abbreviated names (`usr`, `prof`, `req`, `res`, `ctx`, `cfg`, `btn`, `msg`)
- [ ] All booleans use `is`/`has`/`should`/`can`/`will`/`does` prefix
- [ ] All functions that perform actions use verb prefix (`get`, `set`, `create`, `update`, `delete`, `fetch`, `validate`, `compute`, `build`, `handle`, `process`, `send`, `check`, `find`)
- [ ] All arrays are plural nouns or `List`/`Collection` suffix
- [ ] All module-level constants are UPPER_SNAKE_CASE
- [ ] All types/interfaces are PascalCase
- [ ] No generic suffixes (`Data`, `Info`, `Details`, `Object`) unless specifically justified
- [ ] Parameter names describe purpose (not type)
- [ ] Every function has a descriptive name that clearly states what it does
- [ ] No commented-out code left behind
- [ ] No `as any` type assertions (replace with proper types)
- [ ] Tests import actual functions (not reimplementing logic)

---

## Appendix B: File Migration Map

### Files to be REFACTORED (service extraction):

| Current File | New Location(s) |
|-------------|-----------------|
| `src/lib/email.ts` (37KB) | `src/lib/email/templates/*.ts` + `transport.ts` + `email-service.ts` |
| `src/lib/community/actions.ts` (1267 lines) | `src/lib/services/community/*.service.ts` |
| `src/lib/billing/workflow.ts` (1432 lines) | `src/lib/services/payment/*.service.ts` |
| `src/lib/queries/payments.ts` | Merged into `src/lib/services/payment/` |
| `src/lib/queries/leases.ts` | Merged into `src/lib/services/lease/` |
| `src/lib/queries/properties.ts` | Merged into `src/lib/services/property/` |
| `src/lib/lease-status-transitions.ts` | `src/lib/services/lease/lease-status-machine.ts` |
| `src/lib/signature-validation.ts` | `src/lib/services/lease/lease-signature.ts` |
| `src/lib/lease-pdf.ts` | `src/lib/services/lease/lease-pdf-generator.ts` |
| `src/lib/supabase/auth.ts` | `src/lib/services/user/auth.service.ts` |
| `src/lib/supabase/middleware.ts` | Split: middleware logic stays; auth helpers move to `auth.service.ts` |
| `src/lib/iris/context.ts` | `src/lib/services/iris/iris-context.service.ts` |
| `src/lib/messages/engine.ts` | `src/lib/services/messaging/` |
| `src/lib/application-intake.ts` | `src/lib/services/application/application-intake.ts` |
| `src/lib/application-payment-pending.ts` | `src/lib/services/payment/` |
| `src/lib/audit-logging.ts` | `src/lib/audit/audit-logger.ts` |
| `src/lib/jwt.ts` | `src/lib/services/lease/lease-signing-token.ts` |

### Files to be REMOVED (after migration):

| File | Reason |
|------|--------|
| `source-of-truth-db-cleaned.sql` | Stale — missing `saved_posts` table |
| `tests/example.spec.js` | Tests external site (playwright.dev), not iReside |
| Legacy `poll_id`/`post_id` fallback | Standardize on `poll_id` |
| Column-migration retry loop | Fix schema drift at root cause |

---

## Appendix C: Naming Convention Examples

### Function Naming

| Before (Bad) | After (Good) | Reason |
|-------------|-------------|--------|
| `auth()` | `getAuthenticatedSession()` | Function = verb + noun |
| `validate(d)` | `validatePaymentData(paymentData)` | Descriptive; parameter named for purpose |
| `send(e, s, h)` | `sendEmail(recipientEmail, subject, htmlBody)` | No single-letter params |
| `process()` | `processLeaseRenewal()` | Says WHAT it processes |
| `check()` | `checkRenewalEligibility()` | Says WHAT it checks |
| `get()` | `getActiveLease()` | Says WHAT it gets |
| `convert()` | `convertSignatureToPng()` | Says WHAT conversion |

### Variable Naming

| Before (Bad) | After (Good) | Reason |
|-------------|-------------|--------|
| `const d = await request.json()` | `const requestBody = await request.json()` | Descriptive noun |
| `const { data, error } = ...` | `const { data: userProfile, error: fetchError } = ...` | Aliased for clarity |
| `let l = false` | `let isLoading = false` | Boolean with `is` prefix |
| `const usr = ...` | `const user = ...` | No abbreviations |
| `const prof = ...` | `const profile = ...` | No abbreviations |
| `const prps = ...` | `const properties = ...` | No abbreviations, plural array |
| `const tmp = ...` | `const temporaryBuffer = ...` | Descriptive noun |
| `const stuff = ...` | `const pendingActions = ...` | Descriptive noun |

### Type/Interface Naming

| Before (Bad) | After (Good) | Reason |
|-------------|-------------|--------|
| `interface Props` | `interface LeaseCardProperties` | Descriptive, not generic |
| `type Data` | `type PaymentReceipt` | Descriptive noun |
| `interface Item` | `interface PaymentLineItem` | Descriptive noun |
| `type Result` | `type ValidationResult` | Compound descriptive noun |

---

*End of Refactoring Plan*