# iReside — Session Handoff

Last updated: 2026-08-09 — Phase 3.1 (Lease Service), first pass.

---

## TL;DR

We are executing the **iReside backend refactoring plan** (`docs/backend-refactoring-plan.md`), a 7-phase effort to centralize auth, extract a service layer, and clean up the Supabase API routes. Phases 1 (foundation) and 2 (email) and the ~80-landlord-route auth migration are **committed**. We are in the middle of **Phase 3.1 (Lease Service)** — the first domain of Phase 3 "Service Layer Extraction," deliberately scoped as the pattern-setter.

**Phase 3.1 first pass is code-complete.** The lease service module is built, unit-tested, and the two safe read-only landlord lease GET routes are migrated to it. It just needs verification + a commit.

---

## Current branch & baseline

- Branch: **`main-development`** (protected PR source; `master` is the PR target).
- Latest commits (already pushed to base):
  - `28f631a test(infra): harden vitest setup and regenerate supabase types`
  - `0db10d1 docs(database): add backend refactoring plan, feature registry, migrations, auth migration tooling`
  - `f82c84d refactor(auth): migrate landlord routes to centralized requireAuthenticatedUser guard`
  - `253a47a feat(api): add foundation modules — response envelope, auth guards, validation schemas, email service`

---

## Phase 3.1 work — IN PROGRESS (uncommitted, in working tree)

The following changes sit in the **working tree, not yet committed**. Do not lose them.

### Created (untracked)
- `src/lib/services/lease/` — the new service module:
  - `lease.types.ts` — `LandlordLeaseFilters`, `LeaseListItem`, `LeaseDetail` (+ nested unit/party summary types)
  - `lease.errors.ts` — `LeaseError` base; `LeaseNotFoundError` (404 / `LEASE_NOT_FOUND`), `LeaseAccessError` (403), `InvalidLeaseTransitionError` (409)
  - `lease-status-machine.ts` — moved verbatim from old `src/lib/lease-status-transitions.ts` (source of truth)
  - `lease.service.ts` — `LeaseService` class, takes `SupabaseClient<Database>` via constructor (NEVER imports supabase internally); methods `listLeasesForLandlord(landlordId, filters)` and `getLeaseDetail(leaseId)`
  - `index.ts` — barrel export
  - `__tests__/lease.service.test.ts` — 39 unit tests (fluent chain mocks)

### Modified
- `src/app/api/landlord/leases/route.ts` — GET list now uses `LeaseService.listLeasesForLandlord`
- `src/app/api/landlord/leases/[leaseId]/route.ts` — GET single now uses `LeaseService.getLeaseDetail`; keeps dual token/session auth + 403 landlord_id check; catches `LeaseNotFoundError` → 404
- `src/lib/lease-status-transitions.ts` — turned into a **facade re-export** (`export * from "@/lib/services/lease/lease-status-machine"`) so existing importers + tests keep passing unchanged

### Design conventions (NON-NEGOTIABLE, from the plan)
- Identifiers: no single letters; booleans use `is`/`has` prefix; arrays plural; types PascalCase; functions verb-prefixed; constants UPPER_SNAKE.
- Services receive their `SupabaseClient<Database>` via constructor — never import `createClient()` internally.
- Route handlers keep auth + HTTP concerns; services do data access only.

---

## Verification status

- ✅ `npx tsc --noEmit` → **0 errors, clean**.
- ✅ `npx vitest run` → **312 passed / 0 failed** across all 29 test files.
- ⚠️ Excluded from commit: `graphify-out/*`, `supabase/.temp/cli-latest`, `supabase_backup/*.sql`, and untracked scratch docs.

---

## Status

- **Phase 3.1 Pass 1 (d1ed42b):** `LeaseService` extraction, status machine migration & facade, route migration for landlord lease GET routes.
- **Phase 3.1 Pass 2 (95c93af):** Refactored `src/lib/queries/leases.ts` into `LeaseService` query methods (tenant leases, active lease, landlord full leases, renewal requests) with 100% backward-compatible facade wrappers + 24 unit tests.
- **Phase 3.1 Pass 3:** Migrated Tenant Lease GET routes (`/api/tenant/lease` and `/api/tenant/lease/[id]`) to `LeaseService` + `requireAuthenticatedUser` guard, added rich tenant lease query methods, and hardened test timeouts.



## Deferred — future Phase 3.1 passes (NOT yet requested)
- `src/lib/queries/leases.ts` — refactor its internal `createClient()` import into a constructor-injected service.
- The 445-line `src/app/api/landlord/leases/sign/route.ts` monolith migration.
- `signing-link` route and all `tenant/lease/**` routes.
- Email / PDF / audit / jwt extraction into services (they stay as imported helpers for now).

## Other notes
- Test command: `npx vitest run` (jsdom, globals on, `@` → `./src`). Targeted: `npx vitest run src/lib/services/lease`.
- Type check: `npx tsc --noEmit` (NOT `npx vite-tsc` — that package doesn't exist in this registry).
- `docs/backend-refactoring-plan.md` is the authoritative plan. Phase 3.1 is "DO FIRST … sets the pattern."
- Auth guard: `requireAuthenticatedUser()` from `@/lib/api/auth-guard` returns `{ userId, userEmail, userRole, supabase }` or a 401 Response; type-guard via `if (!("userId" in authContext)) return authContext as any;`. Tests that mock it mock `@/lib/api/auth-guard` (NOT `@/lib/supabase/server`) to avoid `resolveUserRole` consuming `mockReturnValueOnce` chain slots.