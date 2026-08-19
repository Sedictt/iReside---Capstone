# iReside Database Redesign Audit

Date: 2026-06-01

## Current Evidence

- Primary database platform: Supabase PostgreSQL.
- Active migration folder: `supabase/migrations`.
- Competing schema snapshots:
  - `source-of-truth-db.sql`: 54 public tables.
  - `source-of-truth-db-cleaned.sql`: 53 public tables.
  - `dump.sql`: 54 public tables.
- `source-of-truth-db-cleaned.sql` is missing `saved_posts`, while app code uses `saved_posts` in `src/lib/community/actions.ts`.
- `src/app/api/landlord/unit-map/route.ts` previously queried `tenant_applications`, but the current source-of-truth schemas define `applications`, not `tenant_applications`. This code reference has been corrected to `applications`.
- Generated inventory artifacts:
  - `docs/database-inventory/summary.md`
  - `docs/database-inventory/inventory.json`
- First hardening migration added:
  - `supabase/migrations/20260601000000_harden_function_execute_grants.sql`
- First normalization migration added:
  - `supabase/migrations/20260601001000_add_profile_security_normalization_tables.sql`
- First RLS optimization migration added:
  - `supabase/migrations/20260601002000_optimize_profile_rls_policies.sql`
- Second RLS optimization migration added:
  - `supabase/migrations/20260601003000_optimize_workflow_rls_policies.sql`
- Third RLS optimization migration added:
  - `supabase/migrations/20260601004000_optimize_remaining_access_rls_policies.sql`
- Current inventory from `source-of-truth-db.sql`:
  - Inventory now layers `source-of-truth-db.sql` with active `supabase/migrations`.
  - 58 public tables.
  - 1 public view: `user_sessions`.
  - 12 public functions.
  - 24 public table triggers.
  - 58 database tables referenced from code/tests.
  - 1 RPC function referenced from code/tests: `check_renewal_windows`.
  - 0 referenced tables missing from the source-of-truth schema.
  - 1 schema table not directly referenced from code/tests: `post_views`.
  - `post_views` is indirectly referenced by the `increment_post_view` SQL function.
  - `increment_post_view` is now called by the community feed through a server action, so `post_views` is intentionally retained for per-post analytics.
  - 2 functions not referenced by code RPC or triggers: `handle_new_user`, `rls_auto_enable`.
  - 0 functions granted to `anon` after applying the migration overlay.
  - `profiles` direct code references have been reduced to 91 after moving 2FA, tenant account-claim state, private contact fields, and key landlord business flows.
  - `profile_private` is now directly referenced by app code for staged phone/address migration.
  - `landlord_business_profiles` is now directly referenced by app code for staged landlord business metadata migration.
  - Local RLS diagnostics after applying migration overlay:
    - 52 policies still contain unwrapped `auth.uid()` / `auth.jwt()` calls.
    - 0 tables still have multiple policies for the same command.
- Supabase lint export shows:
  - 154 `auth_rls_initplan` warnings.
  - 162 `multiple_permissive_policies` warnings.
- Current schema has broad RLS and constraint coverage:
  - 226 RLS/policy lines.
  - 230 primary key, foreign key, unique, and index lines.

## High-Risk Findings

### 1. Canonical Schema Drift

There is no single reliable canonical schema file today. `source-of-truth-db.sql`, `source-of-truth-db-cleaned.sql`, `dump.sql`, active migrations, and backup migrations disagree.

Impact:
- Redesign work can accidentally delete live features.
- Migration generation will be fragile.
- Team members may reason from different schemas.

Action:
- Promote one file as canonical, preferably regenerated from the live/staging database after all migrations are applied.
- Repair `source-of-truth-db-cleaned.sql` or retire it.
- Keep historical dumps outside the normal schema workflow.

### 2. Directly Unused or Indirectly Used Table: `post_views`

The generated inventory found `post_views` in the schema but no direct `.from("post_views")` reference in app code/tests.

Impact:
- It may be unused, or it may be used only through database functions, triggers, analytics jobs, or future community analytics.
- Dropping it without checking dependencies could break post analytics if usage is indirect.

Action:
- Retain `post_views` as the backing table for community post analytics.
- Keep access routed through `increment_post_view` from trusted server code.
- Continue hardening `post_views` RLS so author stats reads and insert paths use init-plan-safe auth checks.

Progress:
- Wired the community feed to call `recordPostView`, which verifies the post is visible to the current user before invoking `increment_post_view` through the service-role admin client.
- Regenerated inventory now reports `increment_post_view` as a referenced RPC and removes it from the unreferenced function list.
- Added `20260601005000_optimize_post_views_rls.sql` to wrap `post_views` auth checks in init-plan-safe forms; local inventory no longer flags `post_views` for unwrapped auth policy calls.

### 3. Sensitive Data in `profiles`

`profiles` stores broad identity/profile fields plus security and integration secrets:
- `gmail_access_token`
- `gmail_refresh_token`
- `gmail_token_expiry`
- `otp_code`
- `otp_expiry`
- `two_factor_enabled`
- `two_factor_email`
- landlord business permit fields

Impact:
- Larger blast radius if profile access policy is wrong.
- User-facing profile reads may carry security-only columns.
- Refresh tokens should not live beside commonly selected profile data.

Action:
- Split into:
  - `profiles`: public/user display and role basics.
  - `profile_private`: phone/address/private user info.
  - `user_security_settings`: 2FA, OTP metadata, password flags.
  - `external_account_tokens`: provider tokens, encrypted where possible, service-role only.
  - `landlord_business_profiles`: landlord business identity and permit metadata.

Progress:
- Added `20260601001000_add_profile_security_normalization_tables.sql`.
- The migration creates and backfills:
  - `profile_private`
  - `user_security_settings`
  - `external_account_tokens`
  - `landlord_business_profiles`
- Legacy `profiles` columns are retained for compatibility until API routes are migrated.
- `user_security_settings` and `external_account_tokens` have RLS enabled with no client policies so service-role routes can be moved first without exposing token/OTP data.
- Migrated landlord 2FA routes away from legacy `profiles` secret columns:
  - `src/app/api/landlord/2fa/route.ts`
  - `src/app/api/landlord/2fa/callback/route.ts`
- 2FA status, Gmail token storage, OTP generation, OTP verification, and disable flows now use `user_security_settings` and `external_account_tokens` through the service-role server route.
- Migrated tenant account-claim state away from legacy `profiles.has_changed_password` writes/reads:
  - `src/app/api/tenant/profile/route.ts`
  - `src/lib/supabase/client-auth.ts`
  - `src/app/api/landlord/applications/[applicationId]/resend-credentials/route.ts`
- Tenant password changes now mark claimed accounts through a service-role server route, and landlord credential resend checks `user_security_settings.has_changed_password`.
- Migrated primary phone/address settings flows to `profile_private`:
  - `src/context/AuthContext.tsx`
  - `src/app/api/tenant/profile/route.ts`
  - `src/components/tenant/TenantSettings.tsx`
  - `src/components/landlord/LandlordSettings.tsx`
  - `src/app/api/landlord/tenants/[id]/profile/route.ts`
- Legacy `profiles.phone` and `profiles.address` columns remain for compatibility, but current settings writes and authenticated profile reads now prefer `profile_private`.
- Migrated primary landlord business metadata flows to `landlord_business_profiles`:
  - `src/context/AuthContext.tsx`
  - `src/components/landlord/LandlordSettings.tsx`
  - `src/app/api/profile/permit/route.ts`
  - `src/app/api/auth/landlord-register/route.ts`
  - `src/app/api/landlord/onboarding/[token]/route.ts`
  - `src/app/landlord/profile/page.tsx`
  - `src/app/api/landlord/documents/route.ts`
- Legacy `profiles.business_*` columns remain for compatibility, but current settings, permit upload, registration, onboarding, and landlord profile reads now prefer `landlord_business_profiles`.
- Added `20260601002000_optimize_profile_rls_policies.sql` to reduce RLS lint debt on the profile surface:
  - Consolidates redundant `profiles` SELECT policies into one explicit authenticated-read policy.
  - Recreates `profiles` UPDATE policy with `(select auth.uid())`.
  - Consolidates owner/admin SELECT policies on `profile_private`.
  - Consolidates owner/admin SELECT policies on `landlord_business_profiles`.
  - Keeps owner INSERT/UPDATE policies on normalized profile tables using `(select auth.uid())`.
- Added `20260601003000_optimize_workflow_rls_policies.sql` to reduce RLS lint debt on core workflow tables:
  - Consolidates applicant/landlord policies on `applications`.
  - Consolidates tenant/landlord policies on `leases`, `payments`, `payment_receipts`, `maintenance_requests`, and `move_out_requests`.
  - Consolidates landlord/tenant payment destination visibility on `landlord_payment_destinations`.
  - Consolidates owner/admin visibility on `landlord_applications`.
  - Local diagnostics now show these touched tables have one effective policy per command.
- Added `20260601004000_optimize_remaining_access_rls_policies.sql` for straightforward remaining access overlaps:
  - Consolidates tenant/admin/landlord product-tour access on `tenant_product_tour_events` and `tenant_product_tour_states`.
  - Consolidates participant access on `unit_transfer_requests`, `utility_configs`, `utility_readings`, and `landlord_reviews`.
  - Consolidates participant/co-participant messaging access on `conversation_participants` and `messages`.
  - Corrects a review insert check so the lease landlord must match `landlord_reviews.landlord_id`.
  - Local diagnostics now show the touched tables have one effective policy per command.

### 4. Application Data Is Overloaded

`applications` contains applicant profile snapshots, employment info, compliance JSON, requirement JSON, payment portal token fields, lease linkage, invite linkage, and status fields.

Impact:
- Hard to validate and index.
- Payment workflow and document review are mixed into application intake.
- JSON checklists hide searchable status.

Action:
- Split into:
  - `rental_applications`
  - `application_applicants`
  - `application_documents`
  - `application_requirement_checks`
  - `application_payment_sessions`
  - `application_reviews`

Keep denormalized applicant snapshot fields only where they are intentional historical snapshots.

### 5. Payments Mix Invoice, Workflow, Proof, Receipt, and Ledger Concepts

`payments` contains invoice fields, balance fields, payment proof fields, review workflow fields, reminder fields, receipt fields, and metadata.

Impact:
- Harder to enforce status transitions.
- Partial payments and receipts are difficult to model cleanly.
- Indexing a single wide payments table becomes blunt.

Action:
- Model:
  - `invoices`
  - `invoice_items`
  - `payment_attempts`
  - `payment_proofs`
  - `payment_receipts`
  - `payment_workflow_events`
  - `ledger_entries`

Keep `payments` temporarily as a compatibility view during migration if frontend changes need to be staged.

### 6. Property and Unit Media Are Stored as Arrays/JSON

`properties` has `images text[]`, `amenities text[]`, `house_rules text[]`, `renewal_settings jsonb`, and `map_decorations jsonb`.

Impact:
- Poor referential integrity for media.
- Hard to query, sort, moderate, or audit changes.
- JSON is acceptable for flexible UI layout state, but not for core business data.

Action:
- Normalize:
  - `property_media`
  - `property_amenities`
  - `property_rules`
  - `property_renewal_policies`
  - Keep map decorations as JSON only if the UI treats them as a freeform canvas document.

### 7. Maintenance Workflow Is Column-Heavy

`maintenance_requests` includes core ticket fields, self-repair decision fields, third-party fields, photo request state, tenant progress state, and AI triage cache fields.

Impact:
- Many nullable workflow columns.
- Repeated future workflow additions will keep widening the table.

Action:
- Split into:
  - `maintenance_requests`
  - `maintenance_assignments`
  - `maintenance_status_events`
  - `maintenance_attachments`
  - `maintenance_ai_triage`
  - `maintenance_tenant_updates`

### 8. RLS Policies Are Correctness-Critical but Performance-Noisy

Supabase lints report repeated `auth.uid()`/auth function evaluation and multiple permissive policies.

Impact:
- Queries can degrade at scale.
- Multiple permissive policies make access behavior harder to audit.

Action:
- Replace direct auth calls in policies with init-plan safe forms such as `(select auth.uid())`.
- Consolidate same-role/same-action permissive policies into single policies per table/action where possible.
- Prefer helper functions for tenant/landlord membership checks, marked `security definer` only when carefully reviewed.

Progress:
- Profile-surface RLS optimization migration added.
- Core workflow RLS optimization migration added.
- Remaining straightforward access-overlap RLS optimization migration added.
- Local inventory now reports post-overlay policy diagnostics so RLS cleanup progress is measurable without waiting for a fresh hosted Supabase lint export.
- Local same-command RLS overlap diagnostics are now cleared after the migration overlay.
- `post_views` RLS has been optimized after wiring analytics.
- Added `20260601006000_consolidate_community_posts_rls.sql` to consolidate `community_posts` into one policy per command while preserving the existing access union for tenant, landlord, and admin community flows.
- Local inventory no longer reports `community_posts` in the same-command overlap list, and `community_posts` is now flagged only for JSON structure rather than unwrapped auth policy calls.
- Added `20260601007000_consolidate_environment_rls.sql` and `20260601008000_optimize_environment_write_rls.sql` to merge environment SELECT policies and wrap landlord write checks.
- Local inventory no longer reports `property_environment_policies` or `unit_environment_overrides` in the same-command overlap list or unwrapped-auth risk list; `property_environment_policies` remains flagged only for JSON structure.
- Added `20260601009000_consolidate_community_media_rls.sql` to consolidate community album/photo media policies while preserving published-read, landlord-manage, and owner-manage paths.
- Local inventory now reports 0 tables with multiple policies for the same command.

### 9. Public Function Grants Are Too Broad

The source dump grants all 12 public functions to `anon`, including trigger-oriented functions:
- `handle_lease_status_change`
- `handle_new_message`
- `handle_new_user`
- `prevent_payment_receipt_update`
- `sync_compat_payment_status`
- `update_lease_signature_timestamps`
- `update_updated_at`
- `update_updated_at_column`
- `validate_lease_status_transition`

Impact:
- Trigger-only implementation functions should not normally be callable by anonymous clients.
- Broad function grants increase the blast radius of any missing RLS or unsafe `security definer` behavior.
- `check_renewal_windows` appears to be a scheduled/admin maintenance operation but is also granted to `anon`.

Action:
- Revoke execute on internal functions from `anon` and usually from `authenticated`.
- Grant execute only on explicit RPC APIs that the app intentionally calls.
- Keep scheduled/admin functions service-role only unless there is a documented user-facing call path.
- Verify Supabase migrations do not reintroduce broad function grants after schema dumps.

Progress:
- Added `20260601000000_harden_function_execute_grants.sql` to revoke direct client execution from the 12 existing public functions and grant execution back to `service_role`.

### 10. Function and Trigger Integrity Gaps

Inventory found 3 functions not referenced by app RPC calls or public-table triggers:
- `handle_new_user`: expected to be attached to `auth.users`, but no trigger appears in `source-of-truth-db.sql`.
- `increment_post_view`: writes `post_views`; now called from the community feed through `recordPostView`.
- `rls_auto_enable`: event trigger function exists, but no event trigger appears in `source-of-truth-db.sql`.

Impact:
- Signup profile creation may depend on a missing `auth.users` trigger.
- `post_views` is now wired as community post analytics rather than dead data.
- Automatic RLS enforcement may be intended but inactive.

Action:
- Check the live database for auth schema triggers and event triggers, not just public schema dumps.
- If missing in live too, add explicit migrations or remove dead functions/tables.
- For `post_views`, continue with RLS policy hardening and hosted validation now that the community feed calls `increment_post_view`.

### 11. Structural Risk Hotspots From Inventory

The generated inventory flags tables with JSON and array columns because these often hide unindexed, unvalidated, or mixed-responsibility data.

Highest-priority hotspots:
- `tenant_intake_invites`: JSON columns, array columns, and RLS enabled without policies in the source schema.
- `applications`: JSON and array columns.
- `move_out_requests`: JSON and array columns.
- `profiles`: JSON and array columns.
- `properties`: JSON and array columns.
- `renewal_requests`: JSON columns and RLS enabled without policies in the source schema.
- `tenant_intake_invite_events`: JSON columns and RLS enabled without policies in the source schema.

Action:
- Treat these as the first normalization review queue.
- Keep JSON only for flexible UI documents, append-only metadata, or external payload snapshots.
- Move searchable workflow state, documents, media, checklists, and security fields into typed relational tables.

## Proposed Target Domains

### Identity and Access

- `profiles`
- `profile_private`
- `user_security_settings`
- `external_account_tokens`
- `landlord_business_profiles`
- `landlord_verifications`

### Property Inventory

- `properties`
- `property_media`
- `property_amenities`
- `property_rules`
- `property_floor_configs`
- `units`
- `unit_map_positions`
- `unit_environment_overrides`

### Leasing

- `leases`
- `lease_terms`
- `lease_signatures`
- `lease_documents`
- `lease_status_events`
- `renewal_requests`
- `move_out_requests`
- `move_out_inspections`

### Applications

- `rental_applications`
- `application_applicants`
- `application_documents`
- `application_requirement_checks`
- `application_reviews`
- `application_payment_sessions`
- `tenant_intake_invites`
- `tenant_intake_invite_events`

### Billing and Ledger

- `invoices`
- `invoice_items`
- `payment_attempts`
- `payment_proofs`
- `payment_receipts`
- `payment_workflow_events`
- `ledger_entries`
- `expenses`
- `utility_configs`
- `utility_readings`

### Maintenance

- `maintenance_requests`
- `maintenance_assignments`
- `maintenance_status_events`
- `maintenance_attachments`
- `maintenance_ai_triage`
- `maintenance_tenant_updates`

### Messaging and Community

- `conversations`
- `conversation_participants`
- `messages`
- `message_user_actions`
- `message_user_reports`
- `message_moderation_banned_terms`
- `community_posts`
- `community_comments`
- `community_reactions`
- `community_poll_votes`
- `community_albums`
- `community_photos`
- `saved_posts`
- `content_reports`
- `post_views`

### Product Experience and Notifications

- `notifications`
- `tenant_product_tour_states`
- `tenant_product_tour_events`
- `landlord_product_tour_states`
- `landlord_product_tour_events`
- `iris_chat_messages`

## Migration Strategy

### Phase 0: Freeze and Inventory

- Pick the canonical schema source. Current inventory uses `source-of-truth-db.sql`.
- Generate a fresh schema dump from staging/live.
- Capture row counts and table sizes.
- Capture all Supabase lint warnings as a baseline.
- Build a code-to-table usage inventory from `.from(...)`, RPC calls, storage bucket usage, and SQL functions. Initial `.from(...)` and storage inventory now exists in `docs/database-inventory`.

### Phase 1: Safety Fixes Before Redesign

- Fix the `tenant_applications` query mismatch. Done in `src/app/api/landlord/unit-map/route.ts`.
- Restore `saved_posts` to the cleaned schema or remove the cleaned schema from use.
- Move secret/token fields out of `profiles`.
- Patch the highest-risk RLS policies:
  - public storage upload policies.
  - profile admin policies.
  - landlord application policies.
  - payment and lease policies.

### Phase 2: Add New Normalized Tables

- Add new normalized tables without dropping old columns.
- Backfill from current tables.
- Add foreign keys, unique constraints, check constraints, and targeted indexes.
- Add RLS policies using consolidated, init-plan-safe checks.

### Phase 3: Dual Read/Write or Compatibility Views

- For high-traffic modules, add compatibility views such as `payments` -> `invoices` if needed.
- Move API routes one bounded domain at a time.
- Keep old tables/columns read-only after cutover.

### Phase 4: Remove Redundant Columns and Tables

- Drop columns only after:
  - no code references remain,
  - backfill checks pass,
  - row counts reconcile,
  - staging smoke tests pass,
  - rollback scripts exist.

### Phase 5: Performance Validation

- Re-run Supabase lints.
- Compare query plans for landlord dashboard, tenant dashboard, payments overview, unit map, maintenance, messages, and community feed.
- Add missing composite indexes only for proven query paths.

## Immediate Next Tasks

1. Verify live auth triggers and event triggers for `handle_new_user` and `rls_auto_enable`.
2. Apply and verify `20260601000000_harden_function_execute_grants.sql` against the real Supabase database.
3. Validate `increment_post_view` in staging now that `post_views` is wired and its local RLS policy warning is cleared.
4. Decide whether `source-of-truth-db-cleaned.sql` should be repaired or deleted.
5. Migrate remaining profile-related flows to the new split tables, especially tenant account-claim and landlord business profile updates.
6. Regenerate Supabase TypeScript types after applying migrations so new tables are strongly typed instead of accessed through service-role casts.
7. After code migration and staging verification, remove legacy sensitive columns from `profiles`.
