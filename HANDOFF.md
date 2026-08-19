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

## Status

- **Phase 1 & 2:** Foundation envelopes, auth-guards, validation schemas, email service facade.
- **Phase 3.1:** Full `LeaseService` extraction, domain types & errors, status machine migration & facade, route migrations for all landlord/tenant lease routes, 41 unit tests.
- **Phase 3.2:** Extracted `PaymentService`, `BillingService`, and `ExpenseService`, migrated all tenant and landlord payment/billing routes, 31 unit tests.
- **Phase 3.3:** Created `src/lib/services/application/` (`ApplicationService`, `application.types.ts`, `application.errors.ts`, `application-state-machine.ts`, `index.ts`), added 14 unit tests, and migrated tenant and landlord application API routes to `ApplicationService`, `requireAuthenticatedUser`, and `createServiceRoleSupabaseClient`.
- **Phase 3.4:** Created `src/lib/services/user/` (`UserService`, `AuthService`, `user.types.ts`, `user.errors.ts`, `index.ts`), added 10 unit tests, and migrated `/api/admin/users`, `/api/admin/users/[id]`, `/api/profile/avatar`, `/api/profile/cover`, and `/api/profile/permit` to use `UserService`, `requireAuthenticatedUser`, and `createServiceRoleSupabaseClient`.
- **Phase 3.5:** Extracted `src/lib/services/community/` (`PostService`, `CommentService`, `ReactionService`, `PollService`, `ModerationService`, `community.types.ts`, `community.errors.ts`, `index.ts`), migrated `src/lib/community/actions.ts` to `createServiceRoleSupabaseClient`, and added 20 unit tests across 5 test files.
- **Phase 3.6:** Extracted `src/lib/services/messaging/` (`ConversationService`, `MessageService`, `messaging.types.ts`, `messaging.errors.ts`, `index.ts`). Migrated `messages/conversations/route.ts`, `messages/conversations/[conversationId]/route.ts`, `messages/conversations/[conversationId]/read/route.ts`, `messages/unread-count/route.ts`. Updated `[conversationId]/route.test.ts` to match new auth pattern. Added 7 unit tests.
- **Phase 3.7:** Extracted `src/lib/services/notification/` (`NotificationService`, `notification.types.ts`, `notification.errors.ts`, `index.ts`). Migrated `landlord/notifications/recent/route.ts`. Added 6 unit tests.
- **Phase 3.8:** Extracted `src/lib/services/property/` (`PropertyService`, `property.types.ts`, `property.errors.ts`, `index.ts`) covering `getPropertiesForLandlord`, `getPropertyIdsForLandlord`, `getPropertyDetail`, `getPropertiesWithUnits`, `getPortfolioOverview`, `getUnitForLandlord`, `updateRenewalSettings`. Migrated `src/app/api/landlord/properties/[id]/route.ts`. Added 6 unit tests.
- **Phase 3.9:** Extracted `src/lib/services/maintenance/` (`MaintenanceService`, `maintenance.types.ts`, `maintenance.errors.ts`, `index.ts`) covering `getLandlordMaintenanceRequests`, `getTenantMaintenanceRequests`, `createLandlordMaintenance`, `createTenantMaintenance`, `updateLandlordMaintenance`, `updateTenantMaintenance`. Migrated `src/app/api/landlord/maintenance/route.ts` and `src/app/api/tenant/maintenance/route.ts` to use `requireAuthenticatedUser` and `MaintenanceService`. Added 7 unit tests.
- **Phase 3.10:** Extracted `src/lib/services/iris/` (`IrisService`, `IrisContextService`, `iris.types.ts`, `iris.errors.ts`, `index.ts`) covering tenant AI context assembly, prompt formatting, chat completions orchestration with rate limit handling, and history retrieval. Migrated `src/app/api/iris/chat/route.ts`, `src/app/api/iris/history/route.ts`, and converted `src/lib/iris/context.ts` into a backward-compatible facade. Added 5 unit tests.
- **Phase 4.1:** Designated `source-of-truth-db.sql` as the single canonical schema, archived historical `dump.sql` to `docs/archive/dump.sql`, added `npm run db:inventory` script, refreshed `docs/database-inventory/`.
- **Phase 5.3:** Extracted centralized `AppError` class hierarchy (`NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`, `ConflictError`, `RateLimitError`, `InternalServerError`) in `src/lib/errors/app-error.ts` with `toApiResponseEnvelope` converter. Added 5 unit tests.
- **Phase 6:** Built testing infrastructure:
  - `src/__tests__/helpers/mock-supabase.ts`: Fluent chain mock builder.
  - `src/__tests__/factories/`: Domain test factories (`user`, `property`, `lease`, `payment`, `maintenance`, `community`) with 9 unit tests.
  - Upgraded `src/lib/__tests__/business-verification.test.ts` to full test coverage (6 tests).
  - Removed dead external test `tests/example.spec.js`.

---

## Verification status

- ✅ `npx tsc --noEmit` → **0 errors, clean**.
- ✅ `npx vitest run` → **448 passed / 0 failed** across all 49 test files.
- ⚠️ Excluded from commit: `graphify-out/*`, `supabase/.temp/cli-latest`, `supabase_backup/*.sql`, and untracked scratch docs.

---

## Next Steps
- Phase 4.2: Sensitive data extraction from `profiles` / dual-write audit.
- Phase 5: API Route Standardization for remaining legacy endpoints.
- Phase 7: Final Code Polish and Global Identifier Linting.