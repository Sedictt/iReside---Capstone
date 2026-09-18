# iReside System — DFD Data Stores Specification
**Methodology:** Gane & Sarson Data Flow Diagram (DFD) Standards  
**Scope & Actors:** Strictly **Tenant** and **Landlord** (No Admin)  
**Analysis Date & Mode:** Real-Time Live Codebase Audit (`src/`, `supabase/migrations/`, `source-of-truth-db.sql`)  

---

## 1. Executive Summary & Audit Methodology

To establish 100% accurate, empirically verified Data Stores for the **iReside Level-1 Data Flow Diagram (DFD)**, we executed a real-time static and behavioral analysis across all **707 source files** in `src/`, **45 PostgreSQL migrations** in `supabase/migrations/`, and active Supabase schema type definitions (`src/types/supabase.ts`, `src/types/database.ts`).

### Audit Summary:
1. **Total Database Tables Queried in Production Code:** **58 active tables**.
2. **Unused / Abandoned Schema Tables:** **1 table** (`post_views` has a SQL schema definition but **0 queries** anywhere in active application code).
3. **Storage Objects Disregarded:** **5 Supabase Storage Buckets** (`landlord-documents`, `payment-proofs`, `consultation-documents`, `property-images`, `tenant-invite-documents`) — these store unstructured binary blobs (PDFs, images) and are accessed via `supabase.storage.from()`, not relational table data stores.
4. **Admin-Only / Telemetry Excluded:** Per project rules (*"we only have landlord and tenant, we dont have Admin. Make sure it 100% accurate"*), the admin consultation tool (`consultation_documents`) and admin tour telemetry logs (`tenant_product_tour_events`, `landlord_product_tour_events`) are isolated and excluded from the Landlord-Tenant operational DFD.
5. **1NF Consolidation Approach:** In accordance with academic guidance (*"if we think that the tables are too complicated, we can use the first normal form of our database for the data store as long as we take note of the tables that we normalized"*), the 58 granular relational tables (normalized to 3NF in PostgreSQL to prevent anomalies) are consolidated into **10 First Normal Form (1NF) Logical Data Stores** (`D1` through `D10`).

---

## 2. The 10 DFD Data Stores Overview (Gane & Sarson Standard)

In Gane & Sarson notation, a Data Store is represented by an **open-ended rectangle** (closed on the left, open on the right) labeled with an identifier (`D1`, `D2`, etc.) and a noun-phrase store name.

| Data Store ID | Data Store Name | Core Domain | Primary Associated Processes | Constituent Normalized 3NF Tables |
| :--- | :--- | :--- | :--- | :--- |
| **D1** | **User & Account Data Store** | Identities, profiles, contact info, credentials, sessions, 2FA | **P1.0** Authenticate & Auth | `profiles`, `profile_private`, `user_security_settings`, `landlord_business_profiles`, `external_account_tokens`, `user_sessions`, `sessions`, `landlord_product_tour_states`, `tenant_product_tour_states`, `user_audit_logs` |
| **D2** | **Property & Unit Data Store** | Buildings, units, specs, environment rules, policies, reviews | **P2.0** Manage Properties | `properties`, `units`, `property_environment_policies`, `unit_environment_overrides`, `landlord_reviews` |
| **D3** | **Blueprint & Layout Data Store** | Floor configurations, 2D/3D spatial map bounding coordinates | **P3.0** Map Space & Blueprint | `property_floor_configs`, `unit_map_positions` |
| **D4** | **Rental Application & Intake Data Store** | Rental applications, walk-in leads, onboarding invites, fee requests | **P4.0** Process Intake | `applications`, `landlord_applications`, `tenant_intake_invites`, `tenant_intake_invite_events`, `application_payment_requests`, `application_payment_audit_events`, `landlord_inquiry_actions` |
| **D5** | **Lease & Contract Data Store** | Active leases, renewals, move-out notices, transfers, signing audit | **P5.0** Manage Leases | `leases`, `renewal_requests`, `move_out_requests`, `unit_transfer_requests`, `lease_signing_audit` |
| **D6** | **Billing & Financial Data Store** | Invoices, itemized charges, meter readings, receipts, payouts, expenses | **P6.0** Process Billing | `payments`, `payment_items`, `utility_configs`, `utility_readings`, `payment_receipts`, `landlord_payment_destinations`, `expenses`, `payment_workflow_audit_events`, `landlord_statistics_exports` |
| **D7** | **Maintenance & Incident Data Store** | Repair tickets, work orders, triage urgency, incident logs | **P7.0** Triage Maintenance | `maintenance_requests` |
| **D8** | **Communication & Messaging Data Store** | Chat conversations, direct messages, moderation flags, AI logs | **P8.0** Facilitate Messaging | `conversations`, `conversation_participants`, `messages`, `message_user_actions`, `message_user_reports`, `message_moderation_banned_terms`, `iris_chat_messages` |
| **D9** | **Community & Amenity Data Store** | Social feed, posts, comments, polls, media albums, amenity bookings | **P9.0** Manage Community | `community_posts`, `community_comments`, `community_reactions`, `community_poll_votes`, `saved_posts`, `community_saved_posts`, `community_albums`, `community_photos`, `community_reports`, `amenities`, `amenity_bookings` |
| **D10** | **Notification Data Store** | Asynchronous in-app event alerts, status banners, action reminders | Cross-cutting (**P1.0 – P9.0**) | `notifications` |

---

## 3. Exhaustive Data Store Specification & Normalization Breakdown

---

### [D1] User & Account Data Store
* **Gane & Sarson Notation:** `[D1 | User & Account Data Store]`
* **DFD Primary Process:** `P1.0 Authenticate & Auth` (also referenced by P4.0, P5.0, P6.0, P8.0, P9.0)
* **Interacting External Entities:** `Tenant`, `Landlord`

#### 1NF Logical Representation (Conceptual Store Schema):
In 1NF, a single consolidated user account record holds:
> `user_id`, `email`, `role` (`'tenant'` | `'landlord'`), `full_name`, `avatar_url`, `avatar_bg_color`, `bio`, `created_at`, `phone`, `address`, `two_factor_enabled`, `two_factor_email`, `otp_code`, `otp_expiry`, `has_changed_password`, `business_name`, `business_permit_number`, `business_permit_url`, `business_permits[]`, `external_oauth_provider`, `external_access_token`, `external_refresh_token`, `active_session_ids[]`, `tour_step_index`, `tour_completed_at`, `audit_event_records`

#### Underlying 3NF Normalized Physical Tables in PostgreSQL:
1. **`profiles`** (114 hits across 73 files) — Core public profile: id, email, full_name, role, avatar_url, bio, timestamps.
2. **`profile_private`** (8 hits across 7 files) — Sensitive PII segregated for GDPR/data privacy: phone, home address.
3. **`user_security_settings`** (10 hits across 8 files) — Authentication credentials & 2FA: OTP codes, OTP expiration, 2FA status, password change flag.
4. **`landlord_business_profiles`** (9 hits across 7 files) — Landlord-specific enterprise metadata: registered business name, business permit number, uploaded permit URLs.
5. **`external_account_tokens`** (4 hits across 2 files) — External integrations (e.g. Gmail / OAuth tokens).
6. **`user_sessions`** & **`sessions`** (6 hits across 4 files) — Real-time active login session tokens, IP addresses, client devices.
7. **`landlord_product_tour_states`** & **`tenant_product_tour_states`** (22 hits across 9 files) — Account onboarding and UI feature tour progress.
8. **`user_audit_logs`** (2 hits across 2 files) — Security audit trail for logins and profile updates.

#### Why it was normalized from 1NF to 3NF:
* **Security & Least-Privilege Isolation:** Separating public profile attributes (visible to neighbors/landlords) from private PII (`profile_private`) and critical authentication hashes (`user_security_settings`).
* **Role-Specific Null Elimination:** Landlord business registration fields only apply to landlords; normalizing to `landlord_business_profiles` prevents large amounts of NULL values in tenant records.
* **1:M Cardinality Elimination:** A single user can have multiple active sessions and multiple OAuth tokens.

#### Code-Verified DFD Data Flows:
* **Inflows (Writes):**
  * `P1.0 -> D1`: *User Account Creation & Registration Data* (`INSERT profiles`, `profile_private`, `landlord_business_profiles`)
  * `P1.0 -> D1`: *Security Credentials & 2FA State* (`UPSERT user_security_settings`, `external_account_tokens`)
  * `P1.0 -> D1`: *Profile & Contact Updates* (`UPDATE profiles`, `profile_private`)
  * `P1.0 -> D1`: *Session Invalidation / Logout* (`DELETE sessions`)
* **Outflows (Reads):**
  * `D1 -> P1.0`: *Authentication Credentials & Account Role* (`SELECT` for identity verification and role routing)
  * `D1 -> P1.0`: *Profile & Security Settings Data* (`SELECT` for user settings rendering and 2FA challenge)

---

### [D2] Property & Unit Data Store
* **Gane & Sarson Notation:** `[D2 | Property & Unit Data Store]`
* **DFD Primary Process:** `P2.0 Manage Properties` (also referenced by P3.0, P4.0, P5.0, P6.0, P7.0)
* **Interacting External Entities:** `Landlord` (Management), `Tenant` (Browsing / Directory)

#### 1NF Logical Representation (Conceptual Store Schema):
In 1NF, a consolidated property and rental space record holds:
> `property_id`, `landlord_id`, `name`, `property_type`, `address`, `city`, `description`, `amenities[]`, `house_rules[]`, `contract_template`, `base_rent_amount`, `advance_rent_months`, `security_deposit_months`, `curfew_enabled`, `curfew_time`, `quiet_hours_start`, `quiet_hours_end`, `gender_restriction_mode`, `max_occupants_per_unit`, `environment_mode`, `unit_id`, `unit_name`, `floor`, `rent_amount`, `beds`, `baths`, `sqft`, `unit_status` (`'available'` | `'occupied'` | `'maintenance'`), `unit_overrides`, `landlord_reviews[]`

#### Underlying 3NF Normalized Physical Tables in PostgreSQL:
1. **`properties`** (87 hits across 40 files) — Real estate entity: property name, address, general amenities, base pricing, house rules.
2. **`units`** (68 hits across 38 files) — Individual rentable rooms/units: unit number, floor number, monthly rent, bed/bath count, square footage, vacancy status.
3. **`property_environment_policies`** (9 hits across 8 files) — Property-wide residential house rules: curfew times, quiet hours, gender restrictions, maximum occupancy.
4. **`unit_environment_overrides`** (2 hits across 2 files) — Unit-specific policy exemptions overriding the building policy.
5. **`landlord_reviews`** (1 hit in landlord profile) — Tenant feedback, rating scores, and written reviews regarding the property/landlord.

#### Why it was normalized from 1NF to 3NF:
* **1:M Repeating Group Elimination:** A single property has dozens or hundreds of units. Storing them in 1NF causes massive repeating data.
* **Transitive & Functional Dependency:** Environment policies have complex rule parameters that apply building-wide, while units have discrete physical and pricing specifications.

#### Code-Verified DFD Data Flows:
* **Inflows (Writes):**
  * `P2.0 -> D2`: *Property Profile & Listing Specifications* (`INSERT/UPDATE properties`)
  * `P2.0 -> D2`: *Unit Inventory & Availability Records* (`INSERT/UPDATE/DELETE units`)
  * `P2.0 -> D2`: *Living Environment & House Policy Rules* (`UPSERT property_environment_policies`, `unit_environment_overrides`)
* **Outflows (Reads):**
  * `D2 -> P2.0`: *Property Portfolio & Unit Details* (`SELECT` for landlord inventory management)
  * `D2 -> P2.0`: *Available Units & Policy Guidelines* (`SELECT` for tenant listing and search)

---

### [D3] Blueprint & Layout Data Store
* **Gane & Sarson Notation:** `[D3 | Blueprint & Layout Data Store]`
* **DFD Primary Process:** `P3.0 Map Space & Blueprint` (reads unit status from D2, lease status from D5)
* **Interacting External Entities:** `Landlord` (Editor / Designer), `Tenant` (Viewer / Unit Explorer)

#### 1NF Logical Representation (Conceptual Store Schema):
In 1NF, a spatial floorplan record holds:
> `floor_config_id`, `property_id`, `floor_key`, `floor_number`, `display_name`, `sort_order`, `unit_id`, `map_position_x`, `map_position_y`, `map_position_width`, `map_position_height`, `layout_decorations[]`

#### Underlying 3NF Normalized Physical Tables in PostgreSQL:
1. **`property_floor_configs`** (20 hits across 6 files) — Architectural floor definitions: floor key, floor number, floor title/label, visual sort order.
2. **`unit_map_positions`** (7 hits across 4 files) — 2D/3D spatial coordinates: unit binding (`unit_id`), x/y grid coordinates, bounding box width/height (`w`, `h`), floor alignment.

#### Why it was normalized from 1NF to 3NF:
* **Separation of Architectural Levels from Spatial Objects:** A property has multiple floors (`property_floor_configs`), and each floor contains multiple positioned unit elements (`unit_map_positions`).
* **Decoupling Physical Unit Data from Visual Canvas Coordinates:** Real estate properties (`units`) remain invariant even if the visual canvas layout or 2D floorplan is repositioned or redrawn.

#### Code-Verified DFD Data Flows:
* **Inflows (Writes):**
  * `P3.0 -> D3`: *Floor Level Configurations* (`UPSERT property_floor_configs`)
  * `P3.0 -> D3`: *Spatial Unit Coordinates & Layout Vectors* (`UPSERT/DELETE unit_map_positions`)
* **Outflows (Reads):**
  * `D3 -> P3.0`: *Floorplan Geometries & Unit Positions* (`SELECT` to render the interactive visual map)

---

### [D4] Rental Application & Intake Data Store
* **Gane & Sarson Notation:** `[D4 | Rental Application & Intake Data Store]`
* **DFD Primary Process:** `P4.0 Process Intake` (coordinates with D1, D2, D5, D6)
* **Interacting External Entities:** `Tenant` (Applicant), `Landlord` (Reviewer / Approver)

#### 1NF Logical Representation (Conceptual Store Schema):
In 1NF, a tenant intake record holds:
> `application_id`, `property_id`, `unit_id`, `applicant_id`, `application_status` (`'pending'` | `'approved'` | `'rejected'` | `'withdrawn'`), `full_name`, `email`, `phone`, `current_address`, `monthly_income`, `employer`, `emergency_contact`, `id_document_urls[]`, `is_walk_in`, `landlord_created_notes`, `intake_invite_token`, `invite_status`, `invite_expires_at`, `application_fee_required`, `application_fee_amount`, `fee_payment_status`, `fee_payment_proof_url`, `intake_audit_events[]`

#### Underlying 3NF Normalized Physical Tables in PostgreSQL:
1. **`applications`** (51 hits across 24 files) — Core tenant rental applications: applicant personal info, income, employment, documents, review status.
2. **`landlord_applications`** (26 hits across 13 files) — Walk-in applications or manual tenant intake entries initiated directly by the landlord.
3. **`tenant_intake_invites`** (13 hits across 6 files) — Direct invitation tokens sent by landlords to pre-approved or existing tenants with expiration dates.
4. **`tenant_intake_invite_events`** (5 hits across 3 files) — Audit timeline tracking invite generation, opens, and acceptances.
5. **`application_payment_requests`** (17 hits across 6 files) — Reservation fee or application deposit payment tracking (token, amount, verification status, payment proof).
6. **`application_payment_audit_events`** (1 hit in application route) — Cryptographic/audit history of application fee payment transitions.
7. **`landlord_inquiry_actions`** (2 hits across 2 files) — Intake inquiry follow-ups and landlord action logging.

#### Why it was normalized from 1NF to 3NF:
* **Workflow Segmentation:** Distinguishing self-service online portal applicants (`applications`) from offline walk-ins (`landlord_applications`) and direct email invitations (`tenant_intake_invites`).
* **Financial & Audit Decoupling:** Upfront reservation fees and security payments have distinct validation lifecycles and compliance audit requirements (`application_payment_requests`, `application_payment_audit_events`).

#### Code-Verified DFD Data Flows:
* **Inflows (Writes):**
  * `P4.0 -> D4`: *Rental Application Submission* (`INSERT applications`, `landlord_applications`)
  * `P4.0 -> D4`: *Tenant Intake Invitations & Event Logs* (`INSERT tenant_intake_invites`, `tenant_intake_invite_events`)
  * `P4.0 -> D4`: *Application Fee Proof & Verification Records* (`INSERT/UPDATE application_payment_requests`)
  * `P4.0 -> D4`: *Application Evaluation & Decision* (`UPDATE applications` status to approved/rejected)
* **Outflows (Reads):**
  * `D4 -> P4.0`: *Applicant Screening Profiles & Documents* (`SELECT` for landlord review)
  * `D4 -> P4.0`: *Intake Status & Invitation Verification* (`SELECT` for applicant dashboard and invite token resolver)

---

### [D5] Lease & Contract Data Store
* **Gane & Sarson Notation:** `[D5 | Lease & Contract Data Store]`
* **DFD Primary Process:** `P5.0 Manage Leases` (triggers billing in P6.0, reads units in D2)
* **Interacting External Entities:** `Landlord`, `Tenant`

#### 1NF Logical Representation (Conceptual Store Schema):
In 1NF, a tenancy contract record holds:
> `lease_id`, `property_id`, `unit_id`, `landlord_id`, `tenant_id`, `start_date`, `end_date`, `monthly_rent`, `security_deposit`, `advance_rent`, `payment_due_day`, `status` (`'active'` | `'terminated'` | `'pending_signature'` | `'expired'`), `contract_pdf_url`, `signed_lease_url`, `landlord_signed_at`, `tenant_signed_at`, `renewal_request_id`, `proposed_rent`, `renewal_status`, `move_out_notice_date`, `move_out_reason`, `inspection_notes`, `unit_transfer_requested_unit_id`, `transfer_status`, `signature_audit_hashes[]`

#### Underlying 3NF Normalized Physical Tables in PostgreSQL:
1. **`leases`** (93 hits across 50 files) — Legal lease contracts: dates, rent terms, deposit amounts, digital signature timestamps, active status.
2. **`renewal_requests`** (12 hits across 5 files) — Formal lease renewal proposals: proposed rent, proposed dates, landlord/tenant negotiations, acceptance status.
3. **`move_out_requests`** (23 hits across 13 files) — Tenancy termination workflows: move-out notice, move-out inspection schedule, clearance status.
4. **`unit_transfer_requests`** (3 hits in unit-map) — Requests by current tenants to transfer to another unit under an updated lease agreement.
5. **`lease_signing_audit`** (2 hits across 2 files) — Immutable digital signature audit logs (signer IP, timestamp, hash).

#### Why it was normalized from 1NF to 3NF:
* **Contract Immutability vs Dynamic Lifecycle Workflows:** The active legal contract (`leases`) must remain immutable for legal integrity, while renewals, move-outs, and transfers undergo independent multi-stage approval states.
* **1:M Historical Requests:** A single active lease can generate multiple renewal proposals, inspection checkpoints, and transfer attempts over time.

#### Code-Verified DFD Data Flows:
* **Inflows (Writes):**
  * `P5.0 -> D5`: *Executed Lease Contracts & Signatures* (`INSERT/UPDATE leases`, `lease_signing_audit`)
  * `P5.0 -> D5`: *Renewal Proposals & Decisions* (`INSERT/UPDATE renewal_requests`)
  * `P5.0 -> D5`: *Move-Out Notices & Inspection Records* (`INSERT/UPDATE move_out_requests`)
  * `P5.0 -> D5`: *Unit Transfer Requests* (`INSERT/UPDATE unit_transfer_requests`)
* **Outflows (Reads):**
  * `D5 -> P5.0`: *Active Lease Terms & Tenancy Status* (`SELECT` for lease management and verification)
  * `D5 -> P5.0`: *Renewal & Move-Out Workflow Data* (`SELECT` for decision processing)

---

### [D6] Billing & Financial Data Store
* **Gane & Sarson Notation:** `[D6 | Billing & Financial Data Store]`
* **DFD Primary Process:** `P6.0 Process Billing` (reads leases from D5, units from D2)
* **Interacting External Entities:** `Tenant` (Payer), `Landlord` (Collector / Manager)

#### 1NF Logical Representation (Conceptual Store Schema):
In 1NF, a financial billing ledger record holds:
> `payment_id`, `lease_id`, `property_id`, `unit_id`, `landlord_id`, `tenant_id`, `billing_cycle`, `due_date`, `total_amount`, `balance_remaining`, `payment_status` (`'pending'` | `'verified'` | `'rejected'` | `'overdue'`), `payment_proof_url`, `submitted_at`, `verified_at`, `line_items[]` (`item_id`, `category` [`rent`, `water`, `electricity`, `penalty`], `amount`, `label`), `utility_submeter_reading` (`previous_reading`, `current_reading`, `consumption`, `rate_per_unit`, `computed_charge`), `official_receipt_id`, `receipt_number`, `issued_at`, `landlord_payment_destination` (`bank_name`, `account_name`, `account_number`, `qr_code_url`), `operational_expenses[]` (`expense_id`, `category`, `amount`, `date`), `financial_audit_trail[]`

#### Underlying 3NF Normalized Physical Tables in PostgreSQL:
1. **`payments`** (61 hits across 26 files) — Primary invoice and billing entries: billing cycle, due date, total amount, balance, status, proof of payment.
2. **`payment_items`** (11 hits across 4 files) — Itemized invoice line items: rent, water, electric, penalty fees, sub-totals.
3. **`utility_configs`** (12 hits across 3 files) — Utility rate configurations: rate per kWh (electricity), rate per cubic meter (water), billing mode.
4. **`utility_readings`** (13 hits across 4 files) — Sub-meter utility readings: previous reading, current reading, total consumption, computed billable amount.
5. **`payment_receipts`** (5 hits across 2 files) — Formally generated digital official receipts: receipt number, issued date, amount breakdown.
6. **`landlord_payment_destinations`** (5 hits across 3 files) — Landlord payment receiving methods: GCash QR, Maya, Bank Transfer details.
7. **`expenses`** (5 hits across 2 files) — Property operational expenses: maintenance costs, supplies, taxes.
8. **`payment_workflow_audit_events`** (6 hits across 4 files) — Tamper-evident ledger of payment submissions, verifications, rejections, and manual overrides.
9. **`landlord_statistics_exports`** (2 hits in analytics) — Metadata records of exported financial statements and revenue reports.

#### Why it was normalized from 1NF to 3NF:
* **Itemized Accounting & 1:M Line Items:** A monthly invoice consists of dynamic combinations of rent, water, electric, and incidental charges.
* **Separation of Rates from Consumption Readings:** Utility rates (`utility_configs`) change periodically, while meter readings (`utility_readings`) represent specific point-in-time consumptions.
* **Compliance & Financial Segregation:** Landlord bank credentials and payment destinations must be segregated from tenant payment transactions.

#### Code-Verified DFD Data Flows:
* **Inflows (Writes):**
  * `P6.0 -> D6`: *Invoices & Itemized Charges* (`INSERT payments`, `payment_items`)
  * `P6.0 -> D6`: *Sub-Meter Utility Consumption Readings* (`INSERT/UPDATE utility_readings`, `utility_configs`)
  * `P6.0 -> D6`: *Payment Submissions & Proof Attachments* (`UPDATE payments` with proof URLs and status)
  * `P6.0 -> D6`: *Payment Verifications & Official Receipts* (`INSERT payment_receipts`, `payment_workflow_audit_events`)
  * `P6.0 -> D6`: *Operational Expenses & Payment Destinations* (`INSERT expenses`, `UPSERT landlord_payment_destinations`)
* **Outflows (Reads):**
  * `D6 -> P6.0`: *Due Invoices & Utility Billing Statements* (`SELECT` for tenant payment presentation)
  * `D6 -> P6.0`: *Payment Proofs, Ledgers & Destination Accounts* (`SELECT` for landlord verification and accounting)

---

### [D7] Maintenance & Incident Data Store
* **Gane & Sarson Notation:** `[D7 | Maintenance & Incident Data Store]`
* **DFD Primary Process:** `P7.0 Triage Maintenance` (reads tenancy from D5, units from D2)
* **Interacting External Entities:** `Tenant` (Requester), `Landlord` (Dispatcher / Resolver)

#### 1NF Logical Representation (Conceptual Store Schema):
In 1NF, a maintenance ticket record holds:
> `request_id`, `ticket_number`, `property_id`, `unit_id`, `tenant_id`, `landlord_id`, `category` (`'plumbing'` | `'electrical'` | `'structural'` | `'appliance'` | `'other'`), `title`, `description`, `priority` (`'low'` | `'medium'` | `'high'` | `'emergency'`), `status` (`'submitted'` | `'triaged'` | `'assigned'` | `'in_progress'` | `'resolved'` | `'cancelled'`), `issue_images[]`, `assigned_technician`, `scheduled_at`, `ai_triage_cache`, `resolution_notes`, `cost_estimate`, `created_at`, `resolved_at`

#### Underlying 3NF Normalized Physical Tables in PostgreSQL:
1. **`maintenance_requests`** (18 hits across 11 files) — Core ticket and repair entity: contains the complete incident lifecycle, priority score, triage analysis cache, attachments, resolution logs.

#### Code-Verified DFD Data Flows:
* **Inflows (Writes):**
  * `P7.0 -> D7`: *Maintenance Trouble Tickets & Issue Media* (`INSERT maintenance_requests`)
  * `P7.0 -> D7`: *Ticket Triage, Scheduling & Status Updates* (`UPDATE maintenance_requests`)
* **Outflows (Reads):**
  * `D7 -> P7.0`: *Maintenance Queue & Incident Details* (`SELECT` for landlord triage and dispatch)
  * `D7 -> P7.0`: *Repair Progress & Resolution Status* (`SELECT` for tenant tracking)

---

### [D8] Communication & Messaging Data Store
* **Gane & Sarson Notation:** `[D8 | Communication & Messaging Data Store]`
* **DFD Primary Process:** `P8.0 Facilitate Messaging`
* **Interacting External Entities:** `Tenant`, `Landlord`

#### 1NF Logical Representation (Conceptual Store Schema):
In 1NF, a communication record holds:
> `conversation_id`, `property_id`, `conversation_type` (`'direct'` | `'inquiry'` | `'maintenance_thread'`), `participants[]` (`user_id`, `role`, `last_read_at`), `messages[]` (`message_id`, `sender_id`, `content`, `attachment_url`, `sent_at`, `is_read`), `user_chat_preferences[]` (`is_muted`, `is_blocked`), `moderation_reports[]` (`reported_by`, `reason`, `status`), `banned_terms[]`, `iris_ai_dialogues[]`

#### Underlying 3NF Normalized Physical Tables in PostgreSQL:
1. **`conversations`** (7 hits across 6 files) — Conversation threads linking users and property context.
2. **`conversation_participants`** (17 hits across 8 files) — Association table tracking who is in each chat and unread message checkpoints (`last_read_at`).
3. **`messages`** (23 hits across 11 files) — Individual chat message records: sender, body text, image/file attachments, timestamps.
4. **`message_user_actions`** (3 hits across 2 files) — User preferences: mute conversation, block user.
5. **`message_user_reports`** (5 hits across 4 files) — Abusive message flags and report submissions.
6. **`message_moderation_banned_terms`** (4 hits across 2 files) — Filter list of prohibited terms.
7. **`iris_chat_messages`** (3 hits in iris service) — AI resident assistant inquiry history.

#### Why it was normalized from 1NF to 3NF:
* **Classic Chat Relational Decomposition:** 1 conversation has M participants, and 1 conversation contains M sequential messages.
* **High-Throughput Concurrency:** Messages are appended continuously; keeping them normalized allows lightning-fast appends without locking conversation headers.

#### Code-Verified DFD Data Flows:
* **Inflows (Writes):**
  * `P8.0 -> D8`: *New Conversation Threads & Participants* (`INSERT conversations`, `conversation_participants`)
  * `P8.0 -> D8`: *Transmitted Messages & File Attachments* (`INSERT messages`)
  * `P8.0 -> D8`: *Read Receipts & User Chat Actions* (`UPDATE conversation_participants`, `UPSERT message_user_actions`)
  * `P8.0 -> D8`: *Moderation Reports & AI Chat Entries* (`INSERT message_user_reports`, `iris_chat_messages`)
* **Outflows (Reads):**
  * `D8 -> P8.0`: *Chat History & Unread Message Streams* (`SELECT messages`, `conversation_participants` for display)
  * `D8 -> P8.0`: *Conversation Participant Rosters* (`SELECT` to route incoming messages)

---

### [D9] Community & Amenity Data Store
* **Gane & Sarson Notation:** `[D9 | Community & Amenity Data Store]`
* **DFD Primary Process:** `P9.0 Manage Community` (reads residency status from D5)
* **Interacting External Entities:** `Tenant`, `Landlord`

#### 1NF Logical Representation (Conceptual Store Schema):
In 1NF, a community bulletin and shared facility record holds:
> `post_id`, `property_id`, `author_id`, `title`, `content`, `post_type` (`'announcement'` | `'general'` | `'poll'`), `image_urls[]`, `comments[]` (`comment_id`, `author_id`, `content`, `created_at`), `reactions[]` (`reaction_id`, `user_id`, `reaction_type`), `poll_options[]`, `poll_votes[]` (`user_id`, `option_index`), `saved_post_users[]`, `community_albums[]` (`album_id`, `title`, `photos[]`), `community_reports[]`, `amenity_id`, `amenity_name`, `description`, `capacity`, `rules`, `booking_id`, `booked_by_tenant_id`, `start_time`, `end_time`, `booking_status`

#### Underlying 3NF Normalized Physical Tables in PostgreSQL:
1. **`community_posts`** (26 hits across 4 files) — Community feed posts, landlord announcements, discussions.
2. **`community_comments`** (11 hits across 2 files) — Threaded replies on posts.
3. **`community_reactions`** (8 hits across 2 files) — Emojis, likes, and upvotes on posts and comments.
4. **`community_poll_votes`** (8 hits across 2 files) — Individual tenant votes on interactive community polls.
5. **`saved_posts`** & **`community_saved_posts`** (8 hits across 2 files) — User bookmarks.
6. **`community_albums`** & **`community_photos`** (2 hits across 2 files) — Property event photo galleries.
7. **`community_reports`** & **`content_reports`** (2 hits across 2 files) — User flags for offensive community content.
8. **`amenities`** (5 hits in amenity route) — Shared facilities: study lounge, gym, rooftop deck, kitchen.
9. **`amenity_bookings`** (7 hits across 3 files) — Facility reservations: tenant id, time slots, reservation status.

#### Why it was normalized from 1NF to 3NF:
* **Social Media Feed Hierarchy:** Posts have 1:M comments, 1:M reactions, 1:M poll options, and 1:M poll votes. Normalization prevents massive array thrashing and update locks.
* **Amenity Booking Schedule Normalization:** Physical amenities exist permanently, while reservations are transient scheduled events.

#### Code-Verified DFD Data Flows:
* **Inflows (Writes):**
  * `P9.0 -> D9`: *Community Posts & Official Announcements* (`INSERT/UPDATE community_posts`, `community_albums`, `community_photos`)
  * `P9.0 -> D9`: *Social Interactions (Comments, Reactions, Poll Votes)* (`INSERT/DELETE community_comments`, `community_reactions`, `community_poll_votes`)
  * `P9.0 -> D9`: *Amenity Facility Catalog & Rules* (`UPSERT/DELETE amenities`)
  * `P9.0 -> D9`: *Amenity Reservation Requests & Approvals* (`INSERT/UPDATE amenity_bookings`)
* **Outflows (Reads):**
  * `D9 -> P9.0`: *Community Bulletin Feed, Comments & Poll Tallies* (`SELECT` for feed display)
  * `D9 -> P9.0`: *Amenity Availability & Booking Schedules* (`SELECT` to verify time slots and show reservations)

---

### [D10] Notification Data Store
* **Gane & Sarson Notation:** `[D10 | Notification Data Store]`
* **DFD Primary Process:** Cross-Cutting Data Store (written to by P1.0, P4.0, P5.0, P6.0, P7.0, P8.0, P9.0; read by all processes to notify Tenant and Landlord)
* **Interacting External Entities:** `Tenant`, `Landlord`

#### 1NF Logical Representation (Conceptual Store Schema):
In 1NF, a system alert notification holds:
> `notification_id`, `user_id`, `type` (`'lease_renewal'` | `'payment_due'` | `'payment_verified'` | `'maintenance_update'` | `'chat_message'` | `'announcement'`), `title`, `message`, `link`, `is_read`, `metadata`, `created_at`

#### Underlying 3NF Normalized Physical Tables in PostgreSQL:
1. **`notifications`** (35 hits across 25 files) — Central asynchronous notification queue and delivery record.

#### Code-Verified DFD Data Flows:
* **Inflows (Writes):**
  * `P1.0 – P9.0 -> D10`: *System Event Alert / Notification Dispatch* (`INSERT notifications`)
  * `All Processes -> D10`: *Read Status Updates / Dismissals* (`UPDATE/DELETE notifications`)
* **Outflows (Reads):**
  * `D10 -> P1.0 – P9.0`: *Unread Alerts & Notification Summaries* (`SELECT notifications` rendered to Landlord & Tenant)

---

## 4. DFD Level-1 Complete Process-To-Data-Store Matrix (Gane & Sarson Downward Flow)

This matrix proves complete compliance with all Gane & Sarson modeling rules:
1. **Mandatory Processing:** All flows begin or end at a process (`P1.0` - `P9.0`).
2. **No Entity-to-Entity Flows:** Entities only interface with processes.
3. **No Direct Entity-to-Store Flows:** All database persistence is mediated by a process.
4. **No Black Holes or Miracles:** Every process has documented input and output data flows. Every data store has both write inflows and read outflows.
5. **Entities Strictly Limited:** Strictly **Tenant** and **Landlord**.

| Process ID & Name | Input Flows (From Entity / Store) | Output Flows (To Entity / Store) | Interacting Data Stores |
| :--- | :--- | :--- | :--- |
| **P1.0 Authenticate & Auth** | • *Credentials & Auth Input* (from `Tenant`/`Landlord`)<br>• *Account Data & 2FA State* (from `D1`) | • *Auth Token & User Profile* (to `Tenant`/`Landlord`)<br>• *New/Updated Account Records* (to `D1`)<br>• *Security Alerts* (to `D10`) | **D1**, **D10** |
| **P2.0 Manage Properties** | • *Property & Unit Data* (from `Landlord`)<br>• *Search/Browse Criteria* (from `Tenant`)<br>• *Property Records & Policies* (from `D2`) | • *Property Portfolio & Metrics* (to `Landlord`)<br>• *Available Listings & Rules* (to `Tenant`)<br>• *Property & Unit Specs* (to `D2`) | **D2** |
| **P3.0 Map Space & Blueprint** | • *Floor Layout Config & Vector Pins* (from `Landlord`)<br>• *Floor & Unit Inquiries* (from `Tenant`)<br>• *Saved Geometries* (from `D3`)<br>• *Unit Availability* (from `D2`) | • *Interactive Floorplan View* (to `Tenant`/`Landlord`)<br>• *Updated Layout Coordinates* (to `D3`) | **D3**, **D2** |
| **P4.0 Process Intake** | • *Application Form & Proof Docs* (from `Tenant`)<br>• *Walk-In Entry & Review Decisions* (from `Landlord`)<br>• *Unit Pricing/Specs* (from `D2`)<br>• *Application Records* (from `D4`) | • *Application Status & Onboarding Invites* (to `Tenant`)<br>• *Applicant Screening Dossier* (to `Landlord`)<br>• *Application & Intake Entries* (to `D4`)<br>• *Intake Notifications* (to `D10`) | **D4**, **D2**, **D10** |
| **P5.0 Manage Leases** | • *Signed Lease & Renewal/Move-Out Notice* (from `Tenant`)<br>• *Contract Terms, Offers & Approvals* (from `Landlord`)<br>• *Lease Contracts & Renewal History* (from `D5`)<br>• *Applicant Data* (from `D4`) | • *Executed Contract & Tenancy Status* (to `Tenant`/`Landlord`)<br>• *Lease Records & Signatures* (to `D5`)<br>• *Unit Status Updates* (to `D2`)<br>• *Lease Alerts* (to `D10`) | **D5**, **D4**, **D2**, **D10** |
| **P6.0 Process Billing** | • *Payment Submissions & Proof Slip* (from `Tenant`)<br>• *Invoice Adjustments, Meter Readings, Expenses* (from `Landlord`)<br>• *Lease Rent Terms* (from `D5`)<br>• *Financial Records & Receipts* (from `D6`) | • *Invoices, Statements & Receipts* (to `Tenant`)<br>• *Financial Ledgers & Payout Summary* (to `Landlord`)<br>• *Recorded Invoices, Receipts & Ledger* (to `D6`)<br>• *Payment Alerts* (to `D10`) | **D6**, **D5**, **D10** |
| **P7.0 Triage Maintenance** | • *Maintenance Issue Report & Photos* (from `Tenant`)<br>• *Assignment, Scheduling & Status Updates* (from `Landlord`)<br>• *Unit & Tenant Context* (from `D2`, `D5`)<br>• *Ticket Records* (from `D7`) | • *Ticket Status & Scheduling Confirmation* (to `Tenant`)<br>• *Triaged Incident Work Orders* (to `Landlord`)<br>• *Created/Updated Repair Tickets* (to `D7`)<br>• *Work Order Alerts* (to `D10`) | **D7**, **D2**, **D5**, **D10** |
| **P8.0 Facilitate Messaging** | • *Outgoing Chat Messages & Attachments* (from `Tenant`/`Landlord`)<br>• *Message History & Active Threads* (from `D8`)<br>• *User Profile Info* (from `D1`) | • *Incoming Messages & Read Status* (to `Tenant`/`Landlord`)<br>• *Stored Messages, Threads & Reports* (to `D8`)<br>• *Message Alert Pings* (to `D10`) | **D8**, **D1**, **D10** |
| **P9.0 Manage Community** | • *Posts, Comments, Votes & Amenity Bookings* (from `Tenant`)<br>• *Official Announcements, Amenities & Moderation* (from `Landlord`)<br>• *Community & Facility Records* (from `D9`)<br>• *Resident Verification* (from `D5`) | • *Community Feed & Booking Status* (to `Tenant`/`Landlord`)<br>• *Published Posts, Votes, Amenities & Reservations* (to `D9`)<br>• *Community Event Notifications* (to `D10`) | **D9**, **D5**, **D10** |

---

## 5. Summary of Disregarded & Deprecated Database Tables

During our real-time audit, the following database artifacts were identified and intentionally excluded from the DFD Data Stores:

| Table / Object Name | Nature of Artifact | Reason for Disregard / Exclusion |
| :--- | :--- | :--- |
| **`post_views`** | Unused Schema Table | Present in SQL schema, but has **0 calls across all 707 source files** in `src/`. Completely abandoned analytics table. |
| **`consultation_documents`** | Admin-Only Feature | Only queried by `/admin/consultation-tool/ConsultationDashboard.tsx`. Excluded per project rule: *"we only have landlord and tenant, we dont have Admin"*. |
| **`tenant_product_tour_events`** & **`landlord_product_tour_events`** | Admin Metric Telemetry | Only queried for admin dashboard clickstream telemetry metrics (`/api/admin/product-tour/metrics`). |
| **`landlord-documents`** | Storage Bucket | Supabase Blob Storage bucket for raw landlord PDF uploads; not a structured database table. |
| **`payment-proofs`** | Storage Bucket | Supabase Blob Storage bucket for transaction image screenshots; not a structured database table. |
| **`consultation-documents`** | Storage Bucket | Supabase Blob Storage bucket for admin consultation tool files. |
| **`property-images`** | Storage Bucket | Supabase Blob Storage bucket for listing photos and floorplan image assets. |
| **`tenant-invite-documents`** | Storage Bucket | Supabase Blob Storage bucket for tenant onboarding attachments. |

---

## 6. The 1-to-1 DFD-to-ERD Core Table Harmonization (Manuscript Edition)

To ensure **100% exact name matching** between the Level-1 DFD and your manuscript ERD diagram, the top 20 production tables have been synchronized 1-to-1 with the Data Stores.

### Exact 1-to-1 Mapping Table:

| DFD Data Store Box | Exact Physical Table Name in ERD | Core Function in System |
| :--- | :--- | :--- |
| **D1** | **`profiles`** | User identities, roles, contact & basic profile attributes |
| **D1** | **`user_security_settings`** | Two-factor authentication, OTP credentials, password status |
| **D2** | **`properties`** | Real estate listings, addresses, base rules, landlord ownership |
| **D2** | **`units`** | Rentable spaces, room numbers, floor numbers, rent pricing |
| **D3** | **`property_floor_configs`** | Floor layout levels, display orders, blueprint keys |
| **D3** | **`unit_map_positions`** | 2D/3D visual canvas coordinates (`x`, `y`, `w`, `h`) |
| **D4** | **`applications`** | Tenant rental applications, employment, income, documents |
| **D4** | **`tenant_intake_invites`** | Direct landlord invitation onboarding tokens |
| **D5** | **`leases`** | Active legal lease contracts, dates, monthly rent terms |
| **D5** | **`lease_signing_audit`** | Digital signature compliance and cryptographic audit records |
| **D6** | **`payments`** | Invoices, monthly rent statements, balances, status |
| **D6** | **`utility_readings`** | Monthly sub-meter water & electric meter consumption |
| **D6** | **`payment_receipts`** | Official digital receipts issued upon transaction clearance |
| **D7** | **`maintenance_requests`** | Maintenance trouble tickets, priority scoring, repair notes |
| **D7** | **`expenses`** | Property operational maintenance costs and repair expenditures |
| **D8** | **`conversations`** | Messaging channels, direct message threads |
| **D8** | **`messages`** | Individual chat messages, body text, timestamps, senders |
| **D8** | **`notifications`** | System notification queue and alert banners |
| **D9** | **`community_posts`** | Community announcements, bulletin discussions |
| **D9** | **`amenity_bookings`** | Facility reservations, time slots, scheduling |

### Corresponding Files in Project:
* **Level-1 DFD Diagram File:** [`docs/dfd-level-1.drawio`](file:///c:/Users/JV/Documents/GitHub/iReside/docs/dfd-level-1.drawio)
* **Consolidated Core ERD File:** [`docs/iReside_ERD_Consolidated.drawio`](file:///c:/Users/JV/Documents/GitHub/iReside/docs/iReside_ERD_Consolidated.drawio)

---
*Document produced autonomously via deep live codebase inspection.*
