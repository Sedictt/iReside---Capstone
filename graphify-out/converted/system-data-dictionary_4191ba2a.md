<!-- converted from system-data-dictionary.docx -->

iReside Data Dictionary
This document summarizes the current iReside database structure in Markdown using the same table-style format as your sample.
Source basis:
- C:\Users\JV\Documents\GitHub\iReside\supabase\migrations\primary-schema.sql
- C:\Users\JV\Documents\GitHub\iReside\supabase\migrations\20260330120000_tenant_onboarding_workflow.sql
- C:\Users\JV\Documents\GitHub\iReside\supabase\migrations\20260331143000_tenant_product_tour.sql
- C:\Users\JV\Documents\GitHub\iReside\supabase\migrations\20260331190000_unit_transfer_requests.sql
# Enum Reference

# Identity and User Management
## profiles Table

## landlord_applications Table

## geo_locations Table

# Property and Listing Management
## properties Table

## units Table

## listings Table

## saved_properties Table

# Leasing, Applications, and Tenant Lifecycle
## applications Table

## leases Table

## lease_signing_audit Table

## move_out_requests Table

## unit_transfer_requests Table

## tenant_onboarding_states Table

## tenant_onboarding_events Table

## tenant_product_tour_states Table

## tenant_product_tour_events Table

# Billing and Financial Reporting
## payments Table

## payment_items Table

## landlord_statistics_exports Table

# Maintenance, Reviews, and Operational Actions
## maintenance_requests Table

## landlord_reviews Table

## landlord_inquiry_actions Table

# Messaging, Notifications, and AI Chat
## conversations Table

## conversation_participants Table

## messages Table

## message_user_actions Table

## message_user_reports Table

## notifications Table

## iris_chat_messages Table

# Community Module
## community_posts Table

## community_comments Table

## community_reactions Table

## community_poll_votes Table

## content_reports Table

## community_albums Table

## community_photos Table

## post_views Table

# Notes
- The document is organized by actual database tables, not by UI page.
- JSONB columns store structured payloads that may evolve as features expand.
- Some workflow tables use triggers to maintain updated_at automatically.
- Sample values are representative examples, not production data.
| Enum Name | Allowed Values |
| --- | --- |
| user_role | tenant, landlord, admin |
| property_type | apartment, condo, house, townhouse, studio |
| unit_status | vacant, occupied, maintenance |
| lease_status | draft, pending_signature, pending_tenant_signature, pending_landlord_signature, active, expired, terminated |
| payment_status | pending, processing, completed, failed, refunded |
| payment_method | credit_card, debit_card, gcash, maya, bank_transfer, cash |
| application_status | pending, reviewing, approved, rejected, withdrawn |
| maintenance_status | open, in_progress, resolved, closed |
| maintenance_priority | low, medium, high, urgent |
| move_out_status | pending, approved, denied, completed |
| message_type | text, system, image, file |
| notification_type | payment, lease, maintenance, announcement, message, application |
| location_type | city, barangay, street |
| listing_scope | property, unit |
| listing_status | draft, published, paused |
| post_type_enum | announcement, poll, photo_album, discussion |
| post_status_enum | draft, published, archived |
| reaction_type_enum | like, heart, thumbs_up, clap, celebration |
| report_status_enum | pending, reviewed, dismissed, escalated |
| unit_transfer_status | pending, approved, denied, cancelled |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK, FK -> auth.users.id) | Unique identifier for the user profile. Deletes with the auth user. | 550e8400-e29b-41d4-a716-446655440000 |
| email | TEXT | User email address. Required. | tenant1@ireside.app |
| full_name | TEXT | Full legal or display name. Required. | Maria Santos |
| role | user_role | Role in the platform. Default tenant. | tenant |
| avatar_url | TEXT | Optional avatar or profile image URL. | https://cdn.ireside.app/avatars/maria.jpg |
| phone | TEXT | Optional contact number. | +63-917-555-1200 |
| created_at | TIMESTAMPTZ | Profile creation timestamp. Default now(). | 2026-03-10T08:30:00Z |
| updated_at | TIMESTAMPTZ | Last profile update timestamp. Default now(). | 2026-03-28T14:22:15Z |
| business_name | TEXT | Optional business or property management name for landlord accounts. | Santos Property Rentals |
| business_permits | TEXT[] | Uploaded or recorded permit document URLs/identifiers. Default empty array. | {"permit-2026.pdf","barangay-clearance.pdf"} |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a landlord registration application. Default gen_random_uuid(). | 8a61eb2a-f8d9-4b6a-90df-548dc67a7b32 |
| profile_id | UUID (FK -> profiles.id) | Applicant profile submitting the landlord request. Required. | 550e8400-e29b-41d4-a716-446655440010 |
| phone | TEXT | Contact number used during review. Required. | +63-917-800-4411 |
| identity_document_url | TEXT | Optional ID document URL. | https://cdn.ireside.app/docs/id-4411.png |
| ownership_document_url | TEXT | Optional proof-of-ownership document URL. | https://cdn.ireside.app/docs/title-4411.pdf |
| liveness_document_url | TEXT | Optional selfie/liveness proof URL. | https://cdn.ireside.app/docs/liveness-4411.mp4 |
| status | application_status | Review state of the landlord application. Default pending. | reviewing |
| admin_notes | TEXT | Internal admin review notes. | Verified tax declaration and ID. |
| created_at | TIMESTAMPTZ | Submission timestamp. Default now(). | 2026-03-12T03:05:00Z |
| updated_at | TIMESTAMPTZ | Last review update timestamp. Default now(). | 2026-03-13T07:42:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a searchable geo reference item. | 0c7a5d27-1ec9-4b31-a4f5-7f7619d34fe1 |
| name | TEXT | Short place name. Required. | Valenzuela |
| type | location_type | Geo item kind: city, barangay, or street. | city |
| city_name | TEXT | Parent city label when applicable. | Valenzuela |
| barangay_name | TEXT | Parent barangay label when applicable. | Karuhatan |
| full_label | TEXT | Full display label used in search results. Required. | Valenzuela, Metro Manila |
| created_at | TIMESTAMPTZ | Creation timestamp. Default now(). | 2026-03-17T01:00:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a property. Default gen_random_uuid(). | 16a0db58-91d8-447f-9f82-f2ef2485531f |
| landlord_id | UUID (FK -> profiles.id) | Owner/manager of the property. Required. | 550e8400-e29b-41d4-a716-446655440020 |
| name | TEXT | Property name. Required. | Sunset Residences |
| address | TEXT | Full street address. Required. | 123 Maysan Road, Valenzuela City |
| city | TEXT | City label. Default Valenzuela. | Valenzuela |
| description | TEXT | Optional property summary. | Three-story apartment complex with gated entry. |
| type | property_type | Property category. Default apartment. | apartment |
| lat | DOUBLE PRECISION | Optional latitude coordinate. | 14.7001 |
| lng | DOUBLE PRECISION | Optional longitude coordinate. | 120.9834 |
| amenities | TEXT[] | Property-level amenities. Default empty array. | {"wifi","parking","laundry area"} |
| house_rules | TEXT[] | Property-level rules. Default empty array. | {"No pets","Quiet hours after 10 PM"} |
| images | TEXT[] | Property image URLs. Default empty array. | {"front.jpg","lobby.jpg"} |
| is_featured | BOOLEAN | Marks property for featured placement. Default false. | true |
| created_at | TIMESTAMPTZ | Creation timestamp. Default now(). | 2026-03-09T05:15:00Z |
| updated_at | TIMESTAMPTZ | Last update timestamp. Default now(). | 2026-03-29T09:10:00Z |
| contract_template | JSONB | Optional reusable lease contract template stored per property. | {"title":"Standard Lease v2","sections":[...]} |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a unit. Default gen_random_uuid(). | 2613d503-0639-46ca-b88d-73e16ecce8ba |
| property_id | UUID (FK -> properties.id) | Parent property. Required. | 16a0db58-91d8-447f-9f82-f2ef2485531f |
| name | TEXT | Unit label or code. Required. | Unit 2B |
| floor | INT | Floor number. Default 1. | 2 |
| status | unit_status | Occupancy/availability state. Default vacant. | occupied |
| rent_amount | NUMERIC(12,2) | Monthly rent amount. Required. | 12500.00 |
| sqft | INT | Optional floor area. | 420 |
| beds | INT | Number of bedrooms. Default 1. | 2 |
| baths | INT | Number of bathrooms. Default 1. | 1 |
| created_at | TIMESTAMPTZ | Creation timestamp. Default now(). | 2026-03-09T06:30:00Z |
| updated_at | TIMESTAMPTZ | Last update timestamp. Default now(). | 2026-03-25T10:20:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a public listing record. | 95fa4374-b014-4ce1-ae88-986f574d1a54 |
| landlord_id | UUID (FK -> profiles.id) | Landlord who published the listing. Required. | 550e8400-e29b-41d4-a716-446655440020 |
| property_id | UUID (FK -> properties.id) | Property being advertised. Required. | 16a0db58-91d8-447f-9f82-f2ef2485531f |
| unit_id | UUID (FK -> units.id) | Optional linked unit. Must be null when scope is property. | 2613d503-0639-46ca-b88d-73e16ecce8ba |
| scope | listing_scope | Listing level. Check requires property with null unit_id or unit with non-null unit_id. | unit |
| title | TEXT | Listing headline. Required. | Bright 2BR Unit Near Valenzuela Gateway |
| rent_amount | NUMERIC(12,2) | Advertised rent. Must be >= 0. | 12500.00 |
| status | listing_status | Publication state. Default draft. | published |
| views | INTEGER | View counter. Default 0. | 214 |
| leads | INTEGER | Lead/inquiry counter. Default 0. | 12 |
| created_at | TIMESTAMPTZ | Listing creation time. Default now(). | 2026-03-17T04:00:00Z |
| updated_at | TIMESTAMPTZ | Last listing update time. Default now(). | 2026-03-21T11:15:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a saved-property bookmark. | b71bd7be-8f40-44f9-8ce3-367ff6aa9b8f |
| user_id | UUID (FK -> profiles.id) | User who bookmarked the property. Required. | 550e8400-e29b-41d4-a716-446655440030 |
| property_id | UUID (FK -> properties.id) | Property being bookmarked. Required. | 16a0db58-91d8-447f-9f82-f2ef2485531f |
| created_at | TIMESTAMPTZ | Bookmark creation time. Default now(). | 2026-03-18T13:44:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a rental application. | c4b58526-f33e-4718-b964-6e70d1ebfd62 |
| unit_id | UUID (FK -> units.id) | Unit being applied for. Required. | 2613d503-0639-46ca-b88d-73e16ecce8ba |
| applicant_id | UUID (FK -> profiles.id) | Existing tenant profile when one already exists. Nullable for walk-in applications. | 550e8400-e29b-41d4-a716-446655440030 |
| landlord_id | UUID (FK -> profiles.id) | Landlord reviewing or owning the application. Required. | 550e8400-e29b-41d4-a716-446655440020 |
| status | application_status | Application workflow status. Default pending. | approved |
| message | TEXT | Applicant note or landlord-facing message. | I would like to move in by next month. |
| monthly_income | NUMERIC(12,2) | Declared income. | 35000.00 |
| employment_status | TEXT | Basic employment status text. | Full-time |
| move_in_date | DATE | Target move-in date. | 2026-04-15 |
| documents | TEXT[] | Uploaded document URLs. Default empty array. | {"valid-id.pdf","proof-of-income.pdf"} |
| reviewed_at | TIMESTAMPTZ | Timestamp when reviewed by landlord/admin. | 2026-03-26T09:00:00Z |
| created_at | TIMESTAMPTZ | Application creation timestamp. Default now(). | 2026-03-24T08:00:00Z |
| updated_at | TIMESTAMPTZ | Last application update timestamp. Default now(). | 2026-03-26T09:05:00Z |
| emergency_contact_name | TEXT | Emergency contact name for applicant onboarding. | Jose Santos |
| emergency_contact_phone | TEXT | Emergency contact phone number. | +63-917-600-1100 |
| reference_name | TEXT | Personal or rental reference name. | Ana Reyes |
| reference_phone | TEXT | Personal or rental reference phone. | +63-917-611-2200 |
| compliance_checklist | JSONB | Seven-step landlord checklist before acceptance. Default checklist JSON. | {"valid_id":true,"lease_signed":false} |
| created_by | UUID (FK -> profiles.id) | Landlord who created the walk-in application record. | 550e8400-e29b-41d4-a716-446655440020 |
| applicant_name | TEXT | Name captured for walk-in applicants without accounts yet. | John dela Cruz |
| applicant_phone | TEXT | Phone captured for walk-in applicants. | +63-917-444-8899 |
| applicant_email | TEXT | Email captured for walk-in applicants. | john.dc@example.com |
| employment_info | JSONB | Structured employment payload for walk-in or reviewed applications. Default {}. | {"company":"ACME BPO","position":"Analyst"} |
| requirements_checklist | JSONB | Structured checklist for required application documents. Default {}. | {"valid_id":true,"proof_of_income":true} |
| lease_id | UUID (FK -> leases.id) | Optional link to the lease created from the application. | 01f91dad-5e2e-42df-b248-477dc1490acb |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a lease. | 01f91dad-5e2e-42df-b248-477dc1490acb |
| unit_id | UUID (FK -> units.id) | Leased unit. Required. | 2613d503-0639-46ca-b88d-73e16ecce8ba |
| tenant_id | UUID (FK -> profiles.id) | Tenant assigned to the lease. Required. | 550e8400-e29b-41d4-a716-446655440030 |
| landlord_id | UUID (FK -> profiles.id) | Landlord managing the lease. Required. | 550e8400-e29b-41d4-a716-446655440020 |
| status | lease_status | Lease lifecycle state. Default draft. | pending_tenant_signature |
| start_date | DATE | Lease start date. Required. | 2026-04-15 |
| end_date | DATE | Lease end date. Must be later than start_date. | 2027-04-14 |
| monthly_rent | NUMERIC(12,2) | Contracted monthly rent. Required. | 12500.00 |
| security_deposit | NUMERIC(12,2) | Deposit amount. Default 0. | 12500.00 |
| terms | JSONB | Structured lease clauses and settings. | {"utilities":"tenant","renewal_notice_days":30} |
| tenant_signature | TEXT | Tenant signature payload or encoded signature. | data:image/png;base64,iVBOR... |
| landlord_signature | TEXT | Landlord signature payload or encoded signature. | data:image/png;base64,iVBOR... |
| signed_at | TIMESTAMPTZ | Timestamp when both parties are considered signed. | 2026-04-10T10:22:00Z |
| created_at | TIMESTAMPTZ | Lease creation timestamp. Default now(). | 2026-03-28T02:15:00Z |
| updated_at | TIMESTAMPTZ | Last lease update timestamp. Default now(). | 2026-04-10T10:22:00Z |
| signing_mode | TEXT | Check limited to in_person or remote. | remote |
| tenant_signed_at | TIMESTAMPTZ | Timestamp when tenant signed. | 2026-04-09T14:10:00Z |
| landlord_signed_at | TIMESTAMPTZ | Timestamp when landlord signed. | 2026-04-10T10:22:00Z |
| signing_link_token_hash | TEXT | SHA-256 hash of the remote signing token. | 8df0a8d8f5f6d8f63b7b7d5c... |
| signature_lock_version | INTEGER | Optimistic lock counter for concurrent signature actions. Default 0. | 2 |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for an audit event. | b7446d6f-b1d3-49e5-b1b2-4bd3fc840e90 |
| lease_id | UUID (FK -> leases.id) | Lease tied to the audit event. Required. | 01f91dad-5e2e-42df-b248-477dc1490acb |
| event_type | TEXT | Signing event type. Check allows generated, accessed, expired, regenerated, signed, activated, failed events. | tenant_signed |
| actor_id | UUID (FK -> auth.users.id) | Optional actor who triggered the event. | 550e8400-e29b-41d4-a716-446655440030 |
| ip_address | INET | Optional IP address of the actor. | 203.0.113.42 |
| user_agent | TEXT | Optional browser/device user agent. | Mozilla/5.0 (Windows NT 10.0; Win64; x64) |
| metadata | JSONB | Event-specific payload such as error data or link metadata. | {"link_expires_at":"2026-04-10T14:00:00Z"} |
| created_at | TIMESTAMPTZ | Event timestamp. Default now(). | 2026-04-09T14:10:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a move-out request. | 4ef5f29f-f5e8-44c2-9322-a7eb5bd7361c |
| lease_id | UUID (FK -> leases.id) | Lease associated with the request. Required. | 01f91dad-5e2e-42df-b248-477dc1490acb |
| tenant_id | UUID (FK -> profiles.id) | Tenant requesting move-out. Required. | 550e8400-e29b-41d4-a716-446655440030 |
| landlord_id | UUID (FK -> profiles.id) | Landlord reviewing the request. Required. | 550e8400-e29b-41d4-a716-446655440020 |
| reason | TEXT | Optional move-out justification. | Relocating closer to work. |
| requested_date | DATE | Requested move-out date. Required. | 2026-06-01 |
| status | move_out_status | Request state. Default pending. | approved |
| notes | TEXT | Optional landlord or system notes. | Inspection scheduled for May 29. |
| created_at | TIMESTAMPTZ | Request creation time. Default now(). | 2026-05-10T06:00:00Z |
| updated_at | TIMESTAMPTZ | Last request update time. Default now(). | 2026-05-12T09:30:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a unit transfer request. | ed88b295-e99e-4136-b2ec-15aaf6f04f6e |
| lease_id | UUID (FK -> leases.id) | Active lease initiating the transfer. Required. | 01f91dad-5e2e-42df-b248-477dc1490acb |
| tenant_id | UUID (FK -> profiles.id) | Tenant requesting the transfer. Required. | 550e8400-e29b-41d4-a716-446655440030 |
| landlord_id | UUID (FK -> profiles.id) | Landlord approving/denying the request. Required. | 550e8400-e29b-41d4-a716-446655440020 |
| property_id | UUID (FK -> properties.id) | Property where both units belong. Required. | 16a0db58-91d8-447f-9f82-f2ef2485531f |
| current_unit_id | UUID (FK -> units.id) | Tenant's current unit. Must differ from requested_unit_id. | 2613d503-0639-46ca-b88d-73e16ecce8ba |
| requested_unit_id | UUID (FK -> units.id) | Desired vacant unit in the same property. | 8efbcb7f-2dd0-4358-ad78-f8573ca3e4ec |
| reason | TEXT | Optional tenant justification. | Need more space for a home office. |
| status | unit_transfer_status | Workflow state. Default pending. | pending |
| landlord_note | TEXT | Optional landlord response or decision note. | Will evaluate after month-end vacancy review. |
| created_at | TIMESTAMPTZ | Request creation time. Default now(). | 2026-03-31T15:00:00Z |
| updated_at | TIMESTAMPTZ | Last request update time. Default now(). | 2026-04-01T10:45:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| tenant_id | UUID (PK, FK -> profiles.id) | Tenant whose onboarding state is being tracked. | 550e8400-e29b-41d4-a716-446655440030 |
| status | TEXT | Check limited to pending, in_progress, completed. Default pending. | in_progress |
| current_step | TEXT | Check limited to profile, lease_acknowledged, payment_readiness, support_handoff. | payment_readiness |
| steps | JSONB | Boolean completion map for each onboarding step. Default generated object. | {"profile":true,"lease_acknowledged":true,"payment_readiness":false,"support_handoff":false} |
| step_data | JSONB | Optional payload captured per completed step. Default {}. | {"profile":{"confirmed":true}} |
| started_at | TIMESTAMPTZ | When onboarding started. | 2026-03-30T08:00:00Z |
| completed_at | TIMESTAMPTZ | When onboarding was completed. | 2026-03-30T08:20:00Z |
| last_reminder_sent_at | TIMESTAMPTZ | Last reminder timestamp for incomplete onboarding. | 2026-03-31T02:00:00Z |
| reminder_send_count | INTEGER | Reminder counter. Must be >= 0. Default 0. | 1 |
| reminder_window_started_at | TIMESTAMPTZ | Start of the current reminder window. | 2026-03-31T00:00:00Z |
| created_at | TIMESTAMPTZ | Row creation time. Default now(). | 2026-03-30T08:00:00Z |
| updated_at | TIMESTAMPTZ | Last state update time. Default now() with update trigger. | 2026-03-31T02:00:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for an onboarding event. | 5e48032a-ec9b-4e17-8209-198b57b27d96 |
| tenant_id | UUID (FK -> profiles.id) | Tenant tied to the event. Required. | 550e8400-e29b-41d4-a716-446655440030 |
| event_type | TEXT | Check limited to onboarding_started, step_completed, onboarding_completed, reminder_sent, reminder_failed. | step_completed |
| actor_id | UUID (FK -> auth.users.id) | Optional actor causing the event. | 550e8400-e29b-41d4-a716-446655440020 |
| trigger_source | TEXT | Optional source label. Check limited to manual or automated. | automated |
| metadata | JSONB | Event metadata. Default {}. | {"step":"lease_acknowledged"} |
| created_at | TIMESTAMPTZ | Event timestamp. Default now(). | 2026-03-30T08:07:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| tenant_id | UUID (PK, FK -> profiles.id) | Tenant whose product tour state is tracked. | 550e8400-e29b-41d4-a716-446655440030 |
| status | TEXT | Check limited to not_started, in_progress, skipped, completed. Default not_started. | in_progress |
| current_step_index | INTEGER | Current tour step number. Must be >= 0. Default 0. | 3 |
| started_at | TIMESTAMPTZ | When the current or first run started. | 2026-03-31T09:00:00Z |
| completed_at | TIMESTAMPTZ | When the tour was completed. | 2026-03-31T09:08:00Z |
| skipped_at | TIMESTAMPTZ | When the tour was skipped. | 2026-03-31T09:02:00Z |
| skip_suppressed_until | TIMESTAMPTZ | Suppression window that hides the tour prompt after a skip. | 2026-09-27T09:02:00Z |
| replay_count | INTEGER | Number of replays. Must be >= 0. Default 0. | 1 |
| last_event_at | TIMESTAMPTZ | Timestamp of the last recorded tour event. | 2026-03-31T09:04:00Z |
| last_route | TEXT | Last route where the tour was active. | /tenant/dashboard |
| last_anchor_id | TEXT | Last UI anchor/element ID used by the tour. | dashboard-overview-card |
| metadata | JSONB | Additional lifecycle metadata. Default {}. | {"backfilled":false} |
| created_at | TIMESTAMPTZ | Row creation time. Default now(). | 2026-03-31T09:00:00Z |
| updated_at | TIMESTAMPTZ | Last state update time. Default now() with update trigger. | 2026-03-31T09:04:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a product tour event. | 1d86f872-791b-40ec-84b4-9d14518d65ec |
| tenant_id | UUID (FK -> profiles.id) | Tenant tied to the event. Required. | 550e8400-e29b-41d4-a716-446655440030 |
| session_id | UUID | Replay or run session identifier. Default gen_random_uuid(). | 2682cf97-f00f-4cc8-a7de-8f69a38f495f |
| event_type | TEXT | Check limited to tour_started, tour_step_completed, tour_skipped, tour_completed, tour_replayed, tour_failed. | tour_step_completed |
| step_id | TEXT | Optional step identifier. | messages-tour-step |
| trigger_source | TEXT | Check limited to onboarding_handoff, auto_portal_entry, manual, resume, replay, step_progression, fallback, system. | manual |
| is_replay | BOOLEAN | Flags replay sessions. Default false. | false |
| payload | JSONB | Extra telemetry payload. Default {}. | {"route":"/tenant/messages"} |
| created_at | TIMESTAMPTZ | Event timestamp. Default now(). | 2026-03-31T09:03:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a payment or invoice record. | 7b4ef97a-95cf-47d3-8ae3-b39aa3e8c7aa |
| lease_id | UUID (FK -> leases.id) | Lease billed by the payment record. Required. | 01f91dad-5e2e-42df-b248-477dc1490acb |
| tenant_id | UUID (FK -> profiles.id) | Tenant billed by the payment. Required. | 550e8400-e29b-41d4-a716-446655440030 |
| landlord_id | UUID (FK -> profiles.id) | Landlord receiving the payment. Required. | 550e8400-e29b-41d4-a716-446655440020 |
| amount | NUMERIC(12,2) | Total invoice amount. Required. | 13250.00 |
| status | payment_status | Processing state. Default pending. | completed |
| method | payment_method | Optional payment channel used. | gcash |
| description | TEXT | Optional payment note. | April 2026 rent and utilities |
| due_date | DATE | Payment due date. Required. | 2026-04-05 |
| paid_at | TIMESTAMPTZ | Timestamp when payment was completed. | 2026-04-04T11:40:00Z |
| reference_number | TEXT | External transaction reference. | GCASH-20260404-9912 |
| landlord_confirmed | BOOLEAN | Whether landlord manually confirmed payment. Default false. | true |
| created_at | TIMESTAMPTZ | Record creation time. Default now(). | 2026-04-01T00:00:00Z |
| updated_at | TIMESTAMPTZ | Last update time. Default now(). | 2026-04-04T11:41:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a payment line item. | 19d3d916-c014-4fd5-b68e-aa6023595728 |
| payment_id | UUID (FK -> payments.id) | Parent payment or invoice. Required. | 7b4ef97a-95cf-47d3-8ae3-b39aa3e8c7aa |
| label | TEXT | Human-readable line item label. Required. | Base Rent |
| amount | NUMERIC(12,2) | Line amount. Required. | 12500.00 |
| category | TEXT | Classification such as rent, water, or electricity. Default rent. | water |
| created_at | TIMESTAMPTZ | Line item creation time. Default now(). | 2026-04-01T00:00:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for an analytics export event. | 958363e9-2d1a-4adb-b716-0d44eb3f0882 |
| landlord_id | UUID (FK -> profiles.id) | Landlord who requested the export. Required. | 550e8400-e29b-41d4-a716-446655440020 |
| format | TEXT | Check limited to csv or pdf. | pdf |
| report_range | TEXT | Date range or preset selected for the export. | 30D |
| mode | TEXT | Check limited to Simplified or Detailed. | Detailed |
| include_expanded_kpis | BOOLEAN | Whether extended metrics were included. Default false. | true |
| row_count | INTEGER | Number of rows exported. Default 0. | 48 |
| metadata | JSONB | Export metadata and filter context. Default {}. | {"property_id":"16a0db58-91d8-447f-9f82-f2ef2485531f"} |
| created_at | TIMESTAMPTZ | Export creation time. Default now(). | 2026-03-13T04:12:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a maintenance request. | d82861a7-96ba-437e-a98b-d46720fd40f0 |
| unit_id | UUID (FK -> units.id) | Unit requiring repair. Required. | 2613d503-0639-46ca-b88d-73e16ecce8ba |
| tenant_id | UUID (FK -> profiles.id) | Tenant who submitted the request. Required. | 550e8400-e29b-41d4-a716-446655440030 |
| landlord_id | UUID (FK -> profiles.id) | Landlord responsible for resolution. Required. | 550e8400-e29b-41d4-a716-446655440020 |
| title | TEXT | Short issue title. Required. | Leaking kitchen faucet |
| description | TEXT | Detailed repair description. Required. | The faucet has been dripping continuously since yesterday. |
| status | maintenance_status | Request state. Default open. | in_progress |
| priority | maintenance_priority | Urgency level. Default medium. | high |
| category | TEXT | Optional category label. | plumbing |
| images | TEXT[] | Photo evidence URLs. Default empty array. | {"leak-1.jpg","leak-2.jpg"} |
| resolved_at | TIMESTAMPTZ | When the request was resolved. | 2026-04-03T16:30:00Z |
| created_at | TIMESTAMPTZ | Request creation time. Default now(). | 2026-04-02T06:30:00Z |
| updated_at | TIMESTAMPTZ | Last update time. Default now(). | 2026-04-03T14:15:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a landlord review entry. | 3c95e974-dd1b-4fd0-98bf-a20a5551cc27 |
| lease_id | UUID (FK -> leases.id) | Lease context for the review. Required. | 01f91dad-5e2e-42df-b248-477dc1490acb |
| landlord_id | UUID (FK -> profiles.id) | Landlord submitting the review. Required. Must differ from tenant. | 550e8400-e29b-41d4-a716-446655440020 |
| tenant_id | UUID (FK -> profiles.id) | Tenant being reviewed. Required. | 550e8400-e29b-41d4-a716-446655440030 |
| rating | SMALLINT | Required rating from 1 to 5. | 5 |
| comment | TEXT | Optional review comment. | Tenant was consistently on time with payments. |
| created_at | TIMESTAMPTZ | Review creation time. Default now(). | 2026-05-01T07:00:00Z |
| updated_at | TIMESTAMPTZ | Last review update time. Default now(). | 2026-05-01T07:00:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a landlord inquiry-action record. | 7cb066c0-2c4b-491a-8ea1-b42d8fd6f118 |
| inquiry_id | UUID | Identifier of the associated inquiry item managed by the landlord. Required. | fd6b621f-3af9-49ce-a6db-cd7711e34d34 |
| landlord_id | UUID (FK -> profiles.id) | Landlord performing the action. Required. | 550e8400-e29b-41d4-a716-446655440020 |
| is_read | BOOLEAN | Whether the inquiry has been marked as read. Default false. | true |
| is_archived | BOOLEAN | Whether the inquiry has been archived. Default false. | false |
| deleted_at | TIMESTAMPTZ | Soft-delete timestamp when the record is hidden or removed. | 2026-03-20T11:30:00Z |
| created_at | TIMESTAMPTZ | Record creation time. Default now(). | 2026-03-15T05:00:00Z |
| updated_at | TIMESTAMPTZ | Last update time. Default now(). | 2026-03-15T05:15:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a direct message conversation. | cd6c5a79-74fa-41b9-b826-497549091f88 |
| created_at | TIMESTAMPTZ | Conversation creation time. Default now(). | 2026-03-10T09:00:00Z |
| updated_at | TIMESTAMPTZ | Last message or activity time. Default now(). | 2026-03-10T09:05:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a conversation participant row. | 6404d726-46ab-4d5e-8c69-b1971474df27 |
| conversation_id | UUID (FK -> conversations.id) | Parent conversation. Required. | cd6c5a79-74fa-41b9-b826-497549091f88 |
| user_id | UUID (FK -> profiles.id) | User taking part in the conversation. Required. Unique per conversation. | 550e8400-e29b-41d4-a716-446655440020 |
| created_at | TIMESTAMPTZ | Participant add time. Default now(). | 2026-03-10T09:00:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a message. | 2b271804-8c4b-4c2a-b508-f7f352ff5e35 |
| conversation_id | UUID (FK -> conversations.id) | Conversation containing the message. Required. | cd6c5a79-74fa-41b9-b826-497549091f88 |
| sender_id | UUID (FK -> profiles.id) | User who sent the message. Required. | 550e8400-e29b-41d4-a716-446655440020 |
| type | message_type | Message content type. Default text. | image |
| content | TEXT | Main text body or file/image reference body. Required. | Please review the attached unit photo. |
| metadata | JSONB | Optional attachment or moderation metadata. | {"file_url":"maintenance.jpg","mime_type":"image/jpeg"} |
| read_at | TIMESTAMPTZ | Timestamp when recipient read the message. | 2026-03-10T09:07:00Z |
| created_at | TIMESTAMPTZ | Message creation time. Default now(). | 2026-03-10T09:05:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a user-to-user messaging action. | e7239b6e-2d8b-4eb7-b9fa-1e7ca72cb1a5 |
| actor_user_id | UUID (FK -> profiles.id) | User storing the archive or block preference. Required. | 550e8400-e29b-41d4-a716-446655440030 |
| target_user_id | UUID (FK -> profiles.id) | User affected by the preference. Required. Must differ from actor. | 550e8400-e29b-41d4-a716-446655440020 |
| archived | BOOLEAN | Whether the conversation with the target is archived. Default false. | true |
| blocked | BOOLEAN | Whether the target user is blocked. Default false. | false |
| created_at | TIMESTAMPTZ | Record creation time. Default now(). | 2026-03-15T08:00:00Z |
| updated_at | TIMESTAMPTZ | Last preference update time. Default now(). | 2026-03-16T09:10:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a messaging abuse report. | fd76cb56-c95d-4744-81ce-e9d11a4f8378 |
| reporter_user_id | UUID (FK -> profiles.id) | User submitting the report. Required. | 550e8400-e29b-41d4-a716-446655440030 |
| target_user_id | UUID (FK -> profiles.id) | Reported user. Required. Must differ from reporter. | 550e8400-e29b-41d4-a716-446655440020 |
| conversation_id | UUID (FK -> conversations.id) | Optional related conversation. | cd6c5a79-74fa-41b9-b826-497549091f88 |
| category | TEXT | Report category selected by the user. Required. | harassment |
| details | TEXT | Detailed explanation of the report. Required. | Repeated unwanted messages after midnight. |
| status | TEXT | Check limited to open, reviewing, resolved, dismissed. Default open. | reviewing |
| metadata | JSONB | Optional report metadata. | {"message_ids":["2b271804-8c4b-4c2a-b508-f7f352ff5e35"]} |
| created_at | TIMESTAMPTZ | Report creation time. Default now(). | 2026-03-15T10:00:00Z |
| updated_at | TIMESTAMPTZ | Last moderation update time. Default now(). | 2026-03-15T10:30:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a notification. | a2ae7e4b-c8eb-4328-ba4d-a9f2bdb6149d |
| user_id | UUID (FK -> profiles.id) | Recipient user. Required. | 550e8400-e29b-41d4-a716-446655440030 |
| type | notification_type | Notification category. Required. | maintenance |
| title | TEXT | Notification title. Required. | Maintenance Request Updated |
| message | TEXT | Notification message body. Required. | Your faucet repair request is now in progress. |
| data | JSONB | Optional structured payload for deep-linking or UI context. | {"maintenance_request_id":"d82861a7-96ba-437e-a98b-d46720fd40f0"} |
| read | BOOLEAN | Read/unread flag. Default false. | false |
| created_at | TIMESTAMPTZ | Notification creation time. Default now(). | 2026-04-02T09:00:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for an iRis chat message. | dc3f4d84-5301-48d8-b404-d80d65a5a3d9 |
| user_id | UUID (FK -> profiles.id) | Owner of the chat thread or message. Required. | 550e8400-e29b-41d4-a716-446655440030 |
| role | TEXT | Check limited to user or assistant. | assistant |
| content | TEXT | Chat message body. Required. | Your next rent due date is April 5. |
| metadata | JSONB | Optional context, retrieval info, or prompt metadata. | {"lease_id":"01f91dad-5e2e-42df-b248-477dc1490acb"} |
| created_at | TIMESTAMPTZ | Message timestamp. Default now(). | 2026-03-15T07:25:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a community post. | 54671462-20f8-4c2f-a3ef-a1efb0cfb3ec |
| property_id | UUID (FK -> properties.id) | Property community space where the post belongs. Required. | 16a0db58-91d8-447f-9f82-f2ef2485531f |
| author_id | UUID (FK -> profiles.id) | User who authored the post. Required. | 550e8400-e29b-41d4-a716-446655440030 |
| author_role | user_role | Role of the author at posting time. Required. | tenant |
| type | post_type_enum | Post kind: announcement, poll, photo album, or discussion. | discussion |
| title | TEXT | Post title. Required. | Suggestions for laundry schedule |
| content | TEXT | Optional post body. | Would weekends work better for shared laundry use? |
| metadata | JSONB | Optional structured post metadata, including poll options or album info. | {"poll_options":["Morning","Afternoon","Evening"]} |
| is_pinned | BOOLEAN | Whether the post is pinned. Default false. | false |
| is_moderated | BOOLEAN | Whether moderation has been applied. Default false. | true |
| is_approved | BOOLEAN | Approval flag for posts requiring review. Default false. | true |
| status | post_status_enum | Publication state. Default published. | published |
| view_count | INTEGER | Daily deduplicated post view counter. Default 0. | 37 |
| created_at | TIMESTAMPTZ | Post creation time. Default now(). | 2026-03-24T04:30:00Z |
| updated_at | TIMESTAMPTZ | Last post update time. Default now(). | 2026-03-24T06:00:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a comment. | 7c364c9d-aa7f-4702-a691-c9b06e693d2f |
| post_id | UUID (FK -> community_posts.id) | Parent post. Required. Deletes with the post. | 54671462-20f8-4c2f-a3ef-a1efb0cfb3ec |
| author_id | UUID (FK -> profiles.id) | User who wrote the comment. Required. | 550e8400-e29b-41d4-a716-446655440020 |
| content | TEXT | Comment body. Required. | Evening slots seem fair for most tenants. |
| parent_comment_id | UUID (FK -> community_comments.id) | Optional parent comment for threaded replies. | 10991f67-2853-4b24-8dd7-6eb9ba763b1d |
| created_at | TIMESTAMPTZ | Comment creation time. Default now(). | 2026-03-24T05:00:00Z |
| updated_at | TIMESTAMPTZ | Last comment update time. Default now(). | 2026-03-24T05:00:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a reaction row. | 0f68863f-6302-4c03-b16f-663842bda50f |
| post_id | UUID (FK -> community_posts.id) | Reacted post. Required. Deletes with the post. | 54671462-20f8-4c2f-a3ef-a1efb0cfb3ec |
| user_id | UUID (FK -> profiles.id) | User who reacted. Required. | 550e8400-e29b-41d4-a716-446655440030 |
| reaction_type | reaction_type_enum | Reaction selected by the user. Required. Unique with post_id, user_id, and reaction type. | clap |
| created_at | TIMESTAMPTZ | Reaction creation time. Default now(). | 2026-03-24T05:10:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a poll vote. | 9d06f5d3-f7de-4be0-a2cb-282607ac16d5 |
| poll_id | UUID (FK -> community_posts.id) | Poll post receiving the vote. Required. | 54671462-20f8-4c2f-a3ef-a1efb0cfb3ec |
| user_id | UUID (FK -> profiles.id) | Voter. Required. Unique per poll. | 550e8400-e29b-41d4-a716-446655440030 |
| option_index | INTEGER | Selected option index. Must be >= 0. | 1 |
| created_at | TIMESTAMPTZ | Vote creation time. Default now(). | 2026-03-24T05:20:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a community content report. | bd4efad9-e9a5-4b98-aa9e-d030c2d49802 |
| post_id | UUID (FK -> community_posts.id) | Reported post. Required. Deletes with the post. | 54671462-20f8-4c2f-a3ef-a1efb0cfb3ec |
| reporter_id | UUID (FK -> profiles.id) | User who reported the post. Required. | 550e8400-e29b-41d4-a716-446655440030 |
| reason | TEXT | Report reason. Required. | Spam content |
| status | report_status_enum | Moderation state. Default pending. | reviewed |
| moderator_notes | TEXT | Optional moderator notes. | No violation found after review. |
| reviewed_by | UUID (FK -> profiles.id) | Moderator or admin who reviewed the report. | 550e8400-e29b-41d4-a716-446655440099 |
| reviewed_at | TIMESTAMPTZ | Review timestamp. | 2026-03-25T08:00:00Z |
| created_at | TIMESTAMPTZ | Report creation time. Default now(). | 2026-03-24T06:15:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a photo album. | 30db2fb4-38c6-40fd-a86f-fdf8f4ca3180 |
| post_id | UUID (FK -> community_posts.id) | Album's parent post. Required. Unique. | 54671462-20f8-4c2f-a3ef-a1efb0cfb3ec |
| property_id | UUID (FK -> properties.id) | Property associated with the album. Required. | 16a0db58-91d8-447f-9f82-f2ef2485531f |
| cover_photo_url | TEXT | Optional cover image URL. | https://cdn.ireside.app/community/album-cover.jpg |
| photo_count | INTEGER | Cached number of photos. Default 0. | 8 |
| created_at | TIMESTAMPTZ | Album creation time. Default now(). | 2026-03-24T07:00:00Z |
| updated_at | TIMESTAMPTZ | Last album update time. Default now(). | 2026-03-24T07:15:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for an album photo. | a9bd7ec8-b4e2-4b96-90c3-72d62bb7c555 |
| album_id | UUID (FK -> community_albums.id) | Parent album. Required. Deletes with the album. | 30db2fb4-38c6-40fd-a86f-fdf8f4ca3180 |
| url | TEXT | Image URL. Required. | https://cdn.ireside.app/community/photo-01.jpg |
| caption | TEXT | Optional image caption. | Lobby repainting progress |
| display_order | INTEGER | Sort order inside the album. Default 0. | 1 |
| uploaded_by | UUID (FK -> profiles.id) | User who uploaded the image. Required. | 550e8400-e29b-41d4-a716-446655440020 |
| created_at | TIMESTAMPTZ | Photo upload time. Default now(). | 2026-03-24T07:05:00Z |
| Attribute Name | Data Type | Description / Constraints | Sample Value |
| --- | --- | --- | --- |
| id | UUID (PK) | Unique identifier for a post-view event. | ae2b1adf-9726-412e-b7ef-d62e874099b5 |
| post_id | UUID (FK -> community_posts.id) | Viewed post. Required. | 54671462-20f8-4c2f-a3ef-a1efb0cfb3ec |
| user_id | UUID (FK -> profiles.id) | Optional authenticated viewer. Either this or session_id must exist. | 550e8400-e29b-41d4-a716-446655440030 |
| session_id | TEXT | Optional anonymous or browser session identifier. | sess_4cc0e8ef7fa1 |
| viewed_at | TIMESTAMPTZ | Exact time the view happened. Default now(). | 2026-03-24T07:10:00Z |
| view_day | DATE | UTC date bucket used to enforce one unique view per actor per day. | 2026-03-24 |