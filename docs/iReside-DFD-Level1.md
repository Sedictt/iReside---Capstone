# iReside — Level 1 Data Flow Diagram (Gane & Sarson)

**Diagram files**

| File | Purpose |
| --- | --- |
| `docs/iReside-DFD-Level1.png` | High-resolution landscape render (6280 × 4948 px, 2×) for documents and defense slides |
| `docs/iReside-DFD-Level1.svg` | Vector master (prints at any size) |
| `docs/iReside-DFD-Level1.drawio` | Editable source for diagrams.net / draw.io |
| `scripts/erd/generate_dfd.py` | Declarative generator (entities, processes, stores, flows) that writes the SVG and draw.io files |
| `scripts/erd/render_dfd_png.cjs` | Renders the SVG to PNG with Playwright |

Regenerate after editing the spec in `generate_dfd.py`:

```bash
python scripts/erd/generate_dfd.py && node scripts/erd/render_dfd_png.cjs
```

This diagram was built from scratch against the live system (Supabase schema of 58 tables, the `src/app/api` route tree, service modules and `vercel.json`) as of October 2026. Earlier DFD iterations in `docs/` were not used.

---

## 1. Scope and level

* **Level:** Level 1. Process 0 of the context diagram ("iReside Property Management System") is decomposed into the ten most significant processes.
* **System boundary:** the Next.js application together with its Supabase database, Supabase Auth and Supabase Storage. These are inside the boundary and therefore appear as data stores, not external entities.
* **External entities (2):**

| ID | Entity | Why it is external |
| --- | --- | --- |
| E1 | Landlord | Human user role; owns properties, approves applications, bills tenants |
| E2 | Tenant (applicant / resident) | Human user role; the prospective applicant who submits through a public invite link is the pre-account state of the same actor and is not modelled as a separate role, matching the system's two-role design (`profiles.role` = landlord \| tenant) |

Supporting services the system calls (SMTP mail delivery, Google OAuth for 2FA e-mail linking, the Groq LLM API, and the Vercel Cron trigger for monthly invoicing) are treated as part of the system's infrastructure rather than as external entities, because they neither originate nor consume business data on their own: they act only on data the two user roles supplied. The legacy `/api/admin/*` routes were excluded for the same reason: the current system defines only the landlord and tenant roles.

---

## 2. Selected processes (ranked, 1.0 = most significant)

| # | Process | Why it was selected | Main implementation |
| --- | --- | --- | --- |
| 1.0 | Authenticate Users & Secure Accounts | Gatekeeper for every other process; registration, login, OTP, password reset, 2FA, account claim, security keys. | `api/auth/*`, `api/setup/*`, `api/landlord/2fa`, `api/tenant/2fa`, `lib/supabase/middleware.ts` |
| 2.0 | Manage Properties & Units | Creates the core asset data (properties, units, floors, unit map, environment policies, amenities) that intake, leasing and billing depend on. | `api/landlord/properties/*`, `property-units`, `unit-map/*`, `units/*`, `amenities` |
| 3.0 | Process Tenant Applications | Primary acquisition workflow: invite links, public application intake, walk-in applications, document upload, application fee requests and review, tenant account creation. | `api/invites/*`, `api/landlord/applications/*`, `api/application-payments/*`, `api/tenant/applications` |
| 4.0 | Manage Leases & E-Signing | Converts approved applications into leases; dual-mode signing links, signature capture, signed PDF generation, renewals, unit transfers, signing audit. | `api/landlord/lease/finalize`, `api/landlord/leases/*`, `api/tenant/leases/*`, `renewals`, `lib/lease-pdf` |
| 5.0 | Bill Rent & Process Payments | Revenue cycle: scheduled monthly invoices, utility readings and configs, payment intents, proof-of-payment submission, landlord review, receipts, refunds. | `api/cron/monthly-invoices`, `lib/billing/server.ts`, `api/tenant/payments/*`, `api/landlord/invoices/*`, `utility-readings`, `payment-settings` |
| 6.0 | Handle Maintenance Requests | High-frequency tenant↔landlord operation with heuristic triage, status workflow and photo evidence. | `api/tenant/maintenance/*`, `api/landlord/maintenance`, `lib/services/maintenance` |
| 7.0 | Process Move-Out Requests | Closes the tenancy lifecycle: request, approval/denial, inspection, deposit deductions, lease termination and unit vacancy. | `api/tenant/lease/move-out/*`, `api/landlord/move-out/*` |
| 8.0 | Deliver Messages & Notifications | Real-time conversations, attachments, user reports/blocks and the notification feed that most other processes write to. | `api/messages/*`, `api/landlord/notifications`, `notifications` writers across modules |
| 9.0 | Generate Analytics & Reports | Reads every operational store to produce KPIs, AI insight narratives, expense tracking and CSV/PDF exports. | `api/landlord/analytics/*`, `expenses`, `export` |
| 10.0 | Provide iRis AI Assistance | Tenant-facing assistant that assembles lease, payment and maintenance context, generates a reply and persists chat history. | `api/iris/*`, `lib/services/iris` |

Consolidation decisions: amenity bookings, calendar notes/events, product tours, branding, community hub and documentation pages were judged lower-significance and are not shown as separate processes. Community hub was the closest candidate for inclusion but is a secondary engagement feature; it can be added as an 11th process (with a "Community Posts & Interactions" store) if the panel asks for it.

---

## 3. Data store mapping (logical grouping of the 1NF schema)

| ID | Logical data store | Underlying tables / buckets |
| --- | --- | --- |
| D1 | User Accounts & Security Settings | `profiles`, `profile_private`, `user_security_settings`, `external_account_tokens`, `landlord_business_profiles`, `landlord_applications` (landlord registration / onboarding) |
| D2 | Properties, Units & Floor Plans | `properties`, `units`, `property_floor_configs`, `unit_map_positions`, `property_environment_policies`, `unit_environment_overrides`, `amenities` |
| D3 | Intake Invites & Applications | `tenant_intake_invites`, `tenant_intake_invite_events`, `applications`, `application_payment_requests`, `application_payment_audit_events` |
| D4 | Leases, Renewals & Signing Audit | `leases`, `lease_signing_audit`, `renewal_requests`, `unit_transfer_requests` |
| D5 | Invoices, Payments & Utility Billing | `payments`, `payment_items`, `payment_receipts`, `payment_workflow_audit_events`, `utility_configs`, `utility_readings`, `landlord_payment_destinations` |
| D6 | Maintenance Requests | `maintenance_requests` (including the `ai_triage_*` columns) |
| D7 | Move-Out Requests | `move_out_requests` |
| D8 | Conversations, Messages & Notifications | `conversations`, `conversation_participants`, `messages`, `message_user_actions`, `message_user_reports`, `message_moderation_banned_terms`, `notifications` |
| D9 | Expenses & Report Exports | `expenses`, `landlord_statistics_exports` |
| D10 | iRis Chat History | `iris_chat_messages` |
| D11 | Document & Media Files (Storage Buckets) | Supabase Storage: `landlord-documents`, `tenant-invite-documents`, `business-permits`, `property-images`, `maintenance-images`, `message-files`, `payment-proofs`, `profile-avatars`, `profile-covers` |

Tables deliberately outside the ten-process scope (not drawn): `amenity_bookings`, `community_*`, `saved_posts`, `post_views`, `content_reports`, `landlord_reviews`, `landlord_inquiry_actions`, `landlord_/tenant_product_tour_*`, `consultation_documents`. Each belongs to a feature that was not selected; none was merged into another store to avoid misrepresenting the data.

Grouping rationale: each store is a set of tables that share one owning aggregate (for example a payment and its items, receipts and audit events) and is read or written by the same processes. The schema is already in 3NF; the grouping only simplifies presentation and does not denormalise anything.

---

## 4. Flow inventory summary

| Category | Count |
| --- | --- |
| Entity → process | 17 |
| Process → entity | 17 |
| Process → store (write) | 26 |
| Store → process (read) | 27 |
| **Total labelled flows** | **87** |

Every write and every read is a separate directed arrow. Notification records written by 3.0–7.0 are shown as distinct flows into D8 because each of those modules inserts into `notifications` directly.

---

## 5. Validation summary

**Structural**

* Exactly 10 processes, numbered 1.0–10.0 top-to-bottom in descending significance; numbering is explicitly noted as rank, not execution order.
* Three strict vertical zones: entities at x = 70–320, processes at x = 1140–1520, stores at x = 2600–3070 on a 3140 × 2474 landscape canvas.
* Symbols: entities = rectangle with drop shadow, processes = rounded rectangle with a number strip above a divider, stores = open-ended rectangle with a separate ID cell.

**Data flow (checked programmatically by `validate()` in the generator)**

* Every flow has exactly one process end: no entity↔store or store↔store flows exist.
* Every flow is labelled with the data carried; no generic labels (“Data”, “Input”).
* No duplicate (source, destination, label) triples.
* Every process has at least one input and one output; every entity and every store is connected to at least one process.
* No process-to-process flows: cross-module dependencies are expressed through the shared stores (e.g. 4.0 reads D3 “Approved Application Details”, 5.0 reads D4 “Active Lease Terms”), which is how the code actually exchanges the data.

**Database**

* Stores map one-to-one onto real tables and storage buckets listed above; no invented stores.
* 1NF was treated as a schema property, not a notation: related tables were grouped, unrelated ones were not merged.

**Presentation**

* Orthogonal routing only; each flow has its own vertical trunk so no two arrows overlap.
* Trunk ordering was chosen by an automated crossing-minimisation search (left gap 210 crossings, right gap 504 crossings across 87 flows); residual crossings are unavoidable in a strict three-column layout with two entities that each reach nine processes, and were kept legible with white label halos.
* Labels sit on the stub next to the owning process; no overlapping text, no clipped symbols (verified on the 2× render).

---

## 6. Assumptions

1. The admin portal is legacy and not part of the delivered system; the Landlord workspace absorbs all administrative duties.
2. Supabase Auth, Postgres and Storage are inside the system boundary (they are the system's persistence layer), so they appear as data stores rather than external entities.
3. Only the two user roles are modelled as external entities; e-mail delivery, Google OAuth, the Groq LLM API and the cron scheduler are infrastructure inside the system boundary and are documented in the process table rather than drawn.
4. Prospective applicants are represented by the Tenant entity rather than a separate role, consistent with the two-role data model.
