# Complete Payment Flow Upgrade

## Summary
Upgrade the current payment system into a real landlord-to-tenant billing flow with monthly invoice generation, utility billing, payment proof submission, landlord confirmation, and per-landlord GCash setup.

Chosen product decisions:
- Water and electricity are configured separately.
- Utility defaults are set per property with optional unit override.
- Tenants pay through a single monthly invoice with line items.
- Meter readings are always recorded every cycle, even if a utility is bundled into rent.
- Each landlord can set up their own GCash payment destination, including QR upload.

## Key Changes
### Billing and invoice model
- Keep `payments` as the monthly invoice/payment record and `payment_items` as the invoice breakdown.
- Add structured monthly billing generation for each active lease:
  - base rent
  - water
  - electricity
  - optional fees/adjustments
- Add invoice-cycle uniqueness so one lease cannot accidentally get duplicate bills for the same month.
- Replace description-based utility inference with structured utility categories and billing metadata.

### Utility billing
- Add property-level utility defaults with per-unit override support.
- For each of `water` and `electricity`, store:
  - billing mode: `included_in_rent` or `tenant_paid`
  - rate per unit
  - unit label: `kwh` or `cubic_meter`
  - effective dates / active state
- Add monthly reading records per billing period with:
  - previous reading
  - current reading
  - usage
  - billed rate snapshot
  - computed charge
  - billing period
  - entered date
  - landlord note
  - optional proof image
- Billing rules:
  - bundled utility: reading is still recorded, but no extra charge is added
  - tenant-paid utility: charge is computed and added as a payment item
- Tenant invoice must show reading transparency for both bundled and billed utilities.

### Landlord payment destination setup
- Add landlord payment settings for GCash:
  - account name
  - GCash mobile number
  - QR image upload
  - enabled/disabled status
- Store QR image in Supabase Storage and persist the file path plus metadata in the database.
- Allow landlords to replace or remove the QR code.
- Update tenant checkout so it loads the correct landlord's GCash details for the active lease instead of using the shared hardcoded `/gcash-qr.png`.
- If QR is missing, fall back to showing landlord account name and number only.
- Keep room for future payment destinations, but GCash is the first-class supported e-wallet in this change.

### Payment submission and confirmation
- Tenant checkout flow:
  - view invoice and full itemized breakdown
  - choose payment method
  - if GCash: see landlord QR/account info, upload receipt, submit reference
  - if cash/in-person: submit intent and wait for landlord confirmation
- Landlord billing operations:
  - view submitted payment proofs and references
  - mark payment as confirmed, rejected, or needs correction
  - confirm partial or full receipt only if partials are enabled
- Define payment lifecycle clearly:
  - `pending`: invoice issued, not yet submitted
  - `processing`: tenant submitted proof / awaiting review
  - `completed`: landlord confirmed payment
  - `failed`: rejected / invalid attempt
  - `refunded`: reversed payment
- Use `landlord_confirmed` as an operational confirmation flag only where still needed; do not let it substitute for a proper status flow.

### Late fees, partials, reminders, and adjustments
- Promote lease billing rules from implicit seed data into actual behavior:
  - due day
  - late fee
  - allow partial payments
- Support optional late fee application during invoice generation or overdue transition, with a consistent rule.
- If partial payments are enabled:
  - track paid amount vs remaining balance
  - keep invoice open until fully settled
- Add landlord reminder actions for overdue invoices and surface them in notifications/messages.
- Add invoice adjustment support for mistakes in readings or manual corrections:
  - create an adjustment item or reversal record
  - do not silently mutate old billed amounts
- Generate tenant-visible receipt/transaction records for confirmed payments.

## Important API, schema, and type changes
- Add landlord payment destination table or equivalent settings fields for GCash metadata and QR storage path.
- Add utility configuration table or equivalent config model with property default and unit override support.
- Add utility reading table keyed by unit/lease + utility type + billing period.
- Extend invoice/payment response payloads to include:
  - structured payment items
  - utility reading metadata
  - billed-vs-bundled state
  - landlord payment destination data needed for checkout
  - receipt/proof status
  - partial-payment summary if enabled
- Extend landlord invoice detail responses so invoice modals and billing screens render real line items, readings, proofs, and outstanding balance.

## Test Cases and Scenarios
- Landlord can save GCash account name, number, and QR; tenant checkout shows that landlord's QR.
- Replacing a landlord QR updates future checkouts without breaking past invoices.
- Property utility default applies when unit override is absent.
- Unit override takes precedence over property default.
- Water bundled + electricity tenant-paid generates one invoice with correct breakdown.
- Bundled utilities still show readings but no extra charge.
- Tenant-paid utilities compute correctly from readings and rates.
- Duplicate reading for the same period is rejected.
- Decreasing current reading is rejected.
- Duplicate monthly invoice generation for the same lease/period is blocked.
- Tenant GCash payment submission moves invoice to review/processing with receipt and reference stored.
- Landlord confirmation completes payment and generates receipt history.
- Rejected proof returns invoice to actionable state.
- Overdue invoice reminder can be sent.
- Late fee behavior follows configured rule.
- Partial payment behavior works only when enabled.
- Dashboard and invoice summaries use structured utility/payment data instead of description matching.

## Assumptions and Defaults
- Scope is monthly residential billing only.
- Water and electricity are the only utility types in v1.
- GCash is the only fully supported QR-based e-wallet in this phase.
- QR images are landlord-specific and must not be stored as shared public assets.
- Manual meter entry is sufficient for v1; no OCR or smart-meter integration.
- Historical invoices must remain immutable in financial meaning; later config changes only affect future billing cycles.
