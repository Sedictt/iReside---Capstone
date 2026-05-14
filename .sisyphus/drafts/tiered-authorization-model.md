# Draft: Tiered Authorization Model for Online Applications

## Requirements (confirmed)
- **Problem**: Current approval requires payment data upfront (`advance_payment` + `security_deposit_payment`). Tenants send money before having an account — security risk.
- **Goal**: Landlord approves first → account created → tenant pays within platform → full access.
- **Lease timing**: Created at approval with `pending_tenant_payment` status, transitions to `pending_signature` after payment.
- **Tenant restrictions** (probationary account): Dashboard viewable, payment page accessible (can send payments), messages allowed (both directions, landlord only), lease document viewable, password change allowed, maintenance requests blocked, profile editing blocked.
- **Payment**: Two separate payments (advance rent + security deposit). All-or-nothing activation (both must clear). Landlord can override.
- **Activation**: After both payments clear → full access + signing link auto-sent to tenant.
- **Note**: `quick-approve` is a debugging tool — not for production use.

## Technical Decisions
- ApplicationStatus: `pending | reviewing | payment_pending | approved | rejected | withdrawn`
- Lease needs a new intermediate status: `pending_tenant_payment`
- Quick-approve excluded from consideration

## Research Findings
- `src/app/api/landlord/applications/[applicationId]/actions/route.ts` - Main approval handler. Line 410-413: requires `advance_payment` + `security_deposit_payment` when approving.
- `src/app/api/landlord/applications/[applicationId]/quick-approve/route.ts` - Bypass approval, debugging tool only.
- `src/app/api/landlord/applications/[applicationId]/resend-credentials/route.ts` - Only works for `status === "approved"`.
- `src/types/database.ts` line 22: ApplicationStatus type defined.
- `tenant-application-to-payment-flowchart.md` - Detailed process flowchart.
- Walk-in flow exists in `src/app/api/landlord/applications/walk-in/` — must not break existing walk-in path.

## Open Questions
- [RESOLVED] Quick-approve excluded — debugging tool only
- [RESOLVED] Lease created at approval with pending_tenant_payment → pending_signature
- [RESOLVED] Tenant restrictions defined (hybrid: same pages, data redacted where sensitive)
- [RESOLVED] Two separate payments, all-or-nothing activation, signing link auto-sent
- [PENDING] Payment due date / timeout — what happens if tenant doesn't pay within N days?

## Scope Boundaries
- IN: Landlord approval → tenant account creation → restricted login → payment → full access
- IN: New "online approval" flow (separate from walk-in)
- IN: Tenant restriction layer (feature flags/data gating for probationary accounts)
- OUT: Walk-in application changes
- OUT: Payment gateway integration details
- OUT: UI design specifics (will be generated later)