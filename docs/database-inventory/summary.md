# Database Inventory Summary

Generated: 2026-06-01T13:34:08.708Z
Schema source: `source-of-truth-db.sql`
Migration overlay: `supabase/migrations`

## Counts

- Schema tables: 58
- Schema views: 1
- Schema functions: 12
- Schema triggers: 24
- Tables referenced from code/tests: 58
- RPC functions referenced from code/tests: 1
- Missing in schema: 0
- RPC functions missing in schema: 0
- Unreferenced in code/tests: 1
- Functions not referenced by code RPC or triggers: 3
- Functions granted to anon: 0

## Supabase Lint Warning Baseline

- auth_rls_initplan: 154
- multiple_permissive_policies: 162

## Local RLS Diagnostics After Migration Overlay

- Unwrapped auth.uid/auth.jwt policy calls: 77
- Tables with multiple policies for the same command: 8

### Multiple Policy Tables

- `community_albums` ALL: 2 policies
- `community_photos` ALL: 2 policies
- `community_posts` UPDATE: 3 policies
- `community_posts` INSERT: 3 policies
- `community_posts` SELECT: 4 policies
- `community_posts` DELETE: 2 policies
- `property_environment_policies` SELECT: 2 policies
- `unit_environment_overrides` SELECT: 2 policies

## Referenced Tables Missing From Schema

- None

## Referenced RPC Functions Missing From Schema

- None

## Schema Tables Not Directly Referenced From Code

- `post_views`

## Schema Tables Only Referenced Indirectly By SQL Functions

- `post_views`: increment_post_view

## Schema Functions Not Referenced By Code RPC Or Triggers

- `handle_new_user`
- `increment_post_view`
- `rls_auto_enable`

## Schema Functions Granted To Anon

- None

## Referenced RPC Functions

- `check_renewal_windows`: 1 files

## Most Referenced Tables

- `profiles`: 91 references across 62 files
- `leases`: 80 references across 49 files
- `properties`: 65 references across 33 files
- `payments`: 52 references across 23 files
- `units`: 48 references across 29 files
- `applications`: 41 references across 23 files
- `notifications`: 27 references across 21 files
- `landlord_applications`: 25 references across 12 files
- `move_out_requests`: 23 references across 13 files
- `messages`: 18 references across 11 files
- `property_floor_configs`: 16 references across 4 files
- `maintenance_requests`: 15 references across 9 files
- `renewal_requests`: 15 references across 6 files
- `community_posts`: 13 references across 1 files
- `application_payment_requests`: 12 references across 5 files

## Tables With Structural Risk Signals

- `properties`: json_columns, array_columns, unwrapped_auth_rls_calls
- `tenant_intake_invites`: json_columns, array_columns, rls_enabled_without_policies
- `amenities`: array_columns, unwrapped_auth_rls_calls
- `application_payment_audit_events`: json_columns, unwrapped_auth_rls_calls
- `application_payment_requests`: json_columns, unwrapped_auth_rls_calls
- `applications`: json_columns, array_columns
- `community_posts`: json_columns, unwrapped_auth_rls_calls
- `iris_chat_messages`: json_columns, unwrapped_auth_rls_calls
- `landlord_product_tour_events`: json_columns, unwrapped_auth_rls_calls
- `landlord_product_tour_states`: json_columns, unwrapped_auth_rls_calls
- `landlord_statistics_exports`: json_columns, unwrapped_auth_rls_calls
- `lease_signing_audit`: json_columns, unwrapped_auth_rls_calls
- `message_moderation_banned_terms`: json_columns, unwrapped_auth_rls_calls
- `message_user_reports`: json_columns, unwrapped_auth_rls_calls
- `move_out_requests`: json_columns, array_columns
- `notifications`: json_columns, unwrapped_auth_rls_calls
- `payment_items`: json_columns, unwrapped_auth_rls_calls
- `payment_workflow_audit_events`: json_columns, unwrapped_auth_rls_calls
- `profiles`: json_columns, array_columns
- `property_environment_policies`: json_columns, unwrapped_auth_rls_calls
- `renewal_requests`: json_columns, rls_enabled_without_policies
- `tenant_intake_invite_events`: json_columns, rls_enabled_without_policies
- `amenity_bookings`: unwrapped_auth_rls_calls
- `community_albums`: unwrapped_auth_rls_calls
- `community_photos`: unwrapped_auth_rls_calls
- `community_poll_votes`: unwrapped_auth_rls_calls
- `community_reactions`: unwrapped_auth_rls_calls
- `consultation_documents`: unwrapped_auth_rls_calls
- `content_reports`: unwrapped_auth_rls_calls
- `conversations`: unwrapped_auth_rls_calls
- `expenses`: unwrapped_auth_rls_calls
- `external_account_tokens`: rls_enabled_without_policies
- `landlord_applications`: json_columns
- `landlord_business_profiles`: array_columns
- `landlord_inquiry_actions`: unwrapped_auth_rls_calls
- `leases`: json_columns
- `maintenance_requests`: array_columns
- `message_user_actions`: unwrapped_auth_rls_calls
- `messages`: json_columns
- `payment_receipts`: json_columns
- `payments`: json_columns
- `post_views`: unwrapped_auth_rls_calls
- `property_floor_configs`: unwrapped_auth_rls_calls
- `saved_posts`: unwrapped_auth_rls_calls
- `tenant_product_tour_events`: json_columns
- `tenant_product_tour_states`: json_columns
- `unit_environment_overrides`: unwrapped_auth_rls_calls
- `unit_map_positions`: unwrapped_auth_rls_calls
- `units`: unwrapped_auth_rls_calls
- `user_security_settings`: rls_enabled_without_policies

## Referenced Storage Buckets

- `business-permits`: 1 files
- `community-images`: 1 files
- `landlord-documents`: 1 files
- `maintenance-images`: 1 files
- `profile-avatars`: 1 files
- `profile-covers`: 1 files
- `property-images`: 2 files
- `tenant-invite-documents`: 2 files
