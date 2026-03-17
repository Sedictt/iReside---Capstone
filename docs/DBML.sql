// Use DBML to define your database structure
// Docs: https://dbml.dbdiagram.io/docs



Enum "application_status" {
  "pending"
  "reviewing"
  "approved"
  "rejected"
  "withdrawn"
}

Enum "lease_status" {
  "draft"
  "pending_signature"
  "active"
  "expired"
  "terminated"
}

Enum "listing_scope" {
  "property"
  "unit"
}

Enum "listing_status" {
  "draft"
  "published"
  "paused"
}

Enum "maintenance_priority" {
  "low"
  "medium"
  "high"
  "urgent"
}

Enum "location_type" {
  "city"
  "barangay"
  "street"
}

Enum "maintenance_status" {
  "open"
  "in_progress"
  "resolved"
  "closed"
}

Enum "message_type" {
  "text"
  "system"
  "image"
  "file"
}

Enum "move_out_status" {
  "pending"
  "approved"
  "denied"
  "completed"
}

Enum "notification_type" {
  "payment"
  "lease"
  "maintenance"
  "announcement"
  "message"
  "application"
}

Enum "payment_method" {
  "credit_card"
  "debit_card"
  "gcash"
  "maya"
  "bank_transfer"
  "cash"
}

Enum "payment_status" {
  "pending"
  "processing"
  "completed"
  "failed"
  "refunded"
}

Enum "property_type" {
  "apartment"
  "condo"
  "house"
  "townhouse"
  "studio"
}

Enum "unit_status" {
  "vacant"
  "occupied"
  "maintenance"
}

Enum "user_role" {
  "tenant"
  "landlord"
}

Table "applications" {
  "id" uuid [pk, not null, default: `"gen_random_uuid"()`]
  "unit_id" uuid [not null]
  "applicant_id" uuid [not null]
  "landlord_id" uuid [not null]
  "status" public.application_status [not null, default: `'pending'::"public"."application_status"`]
  "message" text
  "monthly_income" numeric(12,2)
  "employment_status" text
  "move_in_date" date
  "documents" "text[]" [not null, default: `'{}'::"text"[]`]
  "reviewed_at" timestamp
  "created_at" timestamp [not null, default: `"now"()`]
  "updated_at" timestamp [not null, default: `"now"()`]

  Indexes {
    (unit_id, applicant_id) [unique, name: "unique_application"]
    applicant_id [type: btree, name: "idx_applications_applicant"]
    landlord_id [type: btree, name: "idx_applications_landlord"]
    status [type: btree, name: "idx_applications_status"]
    unit_id [type: btree, name: "idx_applications_unit"]
  }
}

Table "conversation_participants" {
  "id" uuid [pk, not null, default: `"gen_random_uuid"()`]
  "conversation_id" uuid [not null]
  "user_id" uuid [not null]
  "created_at" timestamp [not null, default: `"now"()`]

  Indexes {
    (conversation_id, user_id) [unique, name: "unique_participant"]
    conversation_id [type: btree, name: "idx_conv_participants_conv"]
    user_id [type: btree, name: "idx_conv_participants_user"]
  }
}

Table "conversations" {
  "id" uuid [pk, not null, default: `"gen_random_uuid"()`]
  "created_at" timestamp [not null, default: `"now"()`]
  "updated_at" timestamp [not null, default: `"now"()`]
}

Table "geo_locations" {
  "id" uuid [pk, not null, default: `"gen_random_uuid"()`]
  "name" text [not null]
  "type" public.location_type [not null]
  "city_name" text
  "barangay_name" text
  "full_label" text [not null]
  "created_at" timestamp [not null, default: `"now"()`]

  Indexes {
    name [type: btree, name: "idx_geo_locations_name"]
    type [type: btree, name: "idx_geo_locations_type"]
    name [type: gin, name: "idx_geo_locations_name_trgm"]
    full_label [type: gin, name: "idx_geo_locations_full_label_trgm"]
  }
}

Table "iris_chat_messages" {
  "id" uuid [pk, not null, default: `"gen_random_uuid"()`]
  "user_id" uuid [not null]
  "role" text [not null]
  "content" text [not null]
  "metadata" jsonb
  "created_at" timestamp [not null, default: `"now"()`]

  Checks {
    `("role" = ANY (ARRAY['user'::"text", 'assistant'::"text"]))` [name: 'iris_chat_messages_role_check']
  }

  Indexes {
    (user_id, created_at) [type: btree, name: "idx_iris_chat_messages_user_created_at"]
  }
}

Table "landlord_applications" {
  "id" uuid [pk, not null, default: `"gen_random_uuid"()`]
  "profile_id" uuid [not null]
  "phone" text [not null]
  "identity_document_url" text
  "ownership_document_url" text
  "liveness_document_url" text
  "status" public.application_status [not null, default: `'pending'::"public"."application_status"`]
  "admin_notes" text
  "created_at" timestamp [not null, default: `"now"()`]
  "updated_at" timestamp [not null, default: `"now"()`]

  Indexes {
    (profile_id, status) [unique, name: "unique_pending_application"]
  }
}

Table "listings" {
  "id" uuid [pk, not null, default: `"gen_random_uuid"()`]
  "landlord_id" uuid [not null]
  "property_id" uuid [not null]
  "unit_id" uuid
  "scope" public.listing_scope [not null]
  "title" text [not null]
  "rent_amount" numeric(12,2) [not null]
  "status" public.listing_status [not null, default: `'draft'::"public"."listing_status"`]
  "views" integer [not null, default: 0]
  "leads" integer [not null, default: 0]
  "created_at" timestamp [not null, default: `"now"()`]
  "updated_at" timestamp [not null, default: `"now"()`]

  Note: 'Listing views and leads are tracked via the public.increment_listing_metric(listing_id, metric_type) function.'

  Checks {
    `("rent_amount" >= (0)::numeric)` [name: 'listings_rent_amount_check']
    `((("scope" = 'property'::"public"."listing_scope") AND ("unit_id" IS NULL)) OR (("scope" = 'unit'::"public"."listing_scope") AND ("unit_id" IS NOT NULL)))` [name: 'listings_scope_unit_consistency']
  }

  Indexes {
    (landlord_id, created_at) [type: btree, name: "idx_listings_landlord_created", note: 'Sorted by created_at DESC']
    property_id [type: btree, name: "idx_listings_property"]
    unit_id [type: btree, name: "idx_listings_unit"]
    status [type: btree, name: "idx_listings_status"]
  }
}

Table "landlord_inquiry_actions" {
  "id" uuid [pk, not null, default: `"gen_random_uuid"()`]
  "inquiry_id" uuid [not null]
  "landlord_id" uuid [not null]
  "is_read" boolean [not null, default: false]
  "is_archived" boolean [not null, default: false]
  "deleted_at" timestamp
  "created_at" timestamp [not null, default: `"now"()`]
  "updated_at" timestamp [not null, default: `"now"()`]

  Indexes {
    (inquiry_id, landlord_id) [unique, name: "landlord_inquiry_actions_unique"]
    inquiry_id [type: btree, name: "idx_landlord_inquiry_actions_inquiry"]
    (landlord_id, updated_at) [type: btree, name: "idx_landlord_inquiry_actions_landlord"]
  }
}

Table "landlord_reviews" {
  "id" uuid [pk, not null, default: `"gen_random_uuid"()`]
  "lease_id" uuid [unique, not null]
  "landlord_id" uuid [not null]
  "tenant_id" uuid [not null]
  "rating" smallint [not null]
  "comment" text
  "created_at" timestamp [not null, default: `"now"()`]
  "updated_at" timestamp [not null, default: `"now"()`]

  Checks {
    `("landlord_id" <> "tenant_id")` [name: 'landlord_reviews_no_self_review']
    `(("rating" >= 1) AND ("rating" <= 5))` [name: 'landlord_reviews_rating_check']
  }

  Indexes {
    (landlord_id, created_at) [type: btree, name: "idx_landlord_reviews_landlord_created"]
    (tenant_id, created_at) [type: btree, name: "idx_landlord_reviews_tenant_created"]
  }
}

Table "landlord_statistics_exports" {
  "id" uuid [pk, not null, default: `"gen_random_uuid"()`]
  "landlord_id" uuid [not null]
  "format" text [not null]
  "report_range" text [not null]
  "mode" text [not null]
  "include_expanded_kpis" boolean [not null, default: false]
  "row_count" integer [not null, default: 0]
  "metadata" jsonb [not null, default: `'{}'::"jsonb"`]
  "created_at" timestamp [not null, default: `"now"()`]

  Checks {
    `("format" = ANY (ARRAY['csv'::"text", 'pdf'::"text"]))` [name: 'landlord_statistics_exports_format_check']
    `("mode" = ANY (ARRAY['Simplified'::"text", 'Detailed'::"text"]))` [name: 'landlord_statistics_exports_mode_check']
  }

  Indexes {
    (landlord_id, created_at) [type: btree, name: "idx_landlord_statistics_exports_landlord_created"]
  }
}

Table "leases" {
  "id" uuid [pk, not null, default: `"gen_random_uuid"()`]
  "unit_id" uuid [not null]
  "tenant_id" uuid [not null]
  "landlord_id" uuid [not null]
  "status" public.lease_status [not null, default: `'draft'::"public"."lease_status"`]
  "start_date" date [not null]
  "end_date" date [not null]
  "monthly_rent" numeric(12,2) [not null]
  "security_deposit" numeric(12,2) [not null, default: 0]
  "terms" jsonb
  "tenant_signature" text
  "landlord_signature" text
  "signed_at" timestamp
  "created_at" timestamp [not null, default: `"now"()`]
  "updated_at" timestamp [not null, default: `"now"()`]

  Checks {
    `("end_date" > "start_date")` [name: 'lease_dates_valid']
  }

  Indexes {
    landlord_id [type: btree, name: "idx_leases_landlord"]
    status [type: btree, name: "idx_leases_status"]
    tenant_id [type: btree, name: "idx_leases_tenant"]
    unit_id [type: btree, name: "idx_leases_unit"]
  }
}

Table "maintenance_requests" {
  "id" uuid [pk, not null, default: `"gen_random_uuid"()`]
  "unit_id" uuid [not null]
  "tenant_id" uuid [not null]
  "landlord_id" uuid [not null]
  "title" text [not null]
  "description" text [not null]
  "status" public.maintenance_status [not null, default: `'open'::"public"."maintenance_status"`]
  "priority" public.maintenance_priority [not null, default: `'medium'::"public"."maintenance_priority"`]
  "category" text
  "images" "text[]" [not null, default: `'{}'::"text"[]`]
  "resolved_at" timestamp
  "created_at" timestamp [not null, default: `"now"()`]
  "updated_at" timestamp [not null, default: `"now"()`]

  Indexes {
    landlord_id [type: btree, name: "idx_maintenance_landlord"]
    status [type: btree, name: "idx_maintenance_status"]
    tenant_id [type: btree, name: "idx_maintenance_tenant"]
  }
}

Table "message_user_actions" {
  "id" uuid [pk, not null, default: `"gen_random_uuid"()`]
  "actor_user_id" uuid [not null]
  "target_user_id" uuid [not null]
  "archived" boolean [not null, default: false]
  "blocked" boolean [not null, default: false]
  "created_at" timestamp [not null, default: `"now"()`]
  "updated_at" timestamp [not null, default: `"now"()`]

  Checks {
    `("actor_user_id" <> "target_user_id")` [name: 'message_user_actions_no_self_target']
  }

  Indexes {
    (actor_user_id, target_user_id) [unique, name: "message_user_actions_actor_target_unique"]
    (actor_user_id, target_user_id) [type: btree, name: "idx_message_user_actions_actor_target"]
  }
}

Table "message_user_reports" {
  "id" uuid [pk, not null, default: `"gen_random_uuid"()`]
  "reporter_user_id" uuid [not null]
  "target_user_id" uuid [not null]
  "conversation_id" uuid
  "category" text [not null]
  "details" text [not null]
  "status" text [not null, default: `'open'::"text"`]
  "metadata" jsonb
  "created_at" timestamp [not null, default: `"now"()`]
  "updated_at" timestamp [not null, default: `"now"()`]

  Checks {
    `("reporter_user_id" <> "target_user_id")` [name: 'message_user_reports_no_self_target']
    `("status" = ANY (ARRAY['open'::"text", 'reviewing'::"text", 'resolved'::"text", 'dismissed'::"text"]))` [name: 'message_user_reports_status_check']
  }

  Indexes {
    (reporter_user_id, created_at) [type: btree, name: "idx_message_user_reports_reporter_created"]
    (target_user_id, created_at) [type: btree, name: "idx_message_user_reports_target"]
  }
}

Table "messages" {
  "id" uuid [pk, not null, default: `"gen_random_uuid"()`]
  "conversation_id" uuid [not null]
  "sender_id" uuid [not null]
  "type" public.message_type [not null, default: `'text'::"public"."message_type"`]
  "content" text [not null]
  "metadata" jsonb
  "read_at" timestamp
  "created_at" timestamp [not null, default: `"now"()`]

  Indexes {
    conversation_id [type: btree, name: "idx_messages_conversation"]
    created_at [type: btree, name: "idx_messages_created_at"]
    sender_id [type: btree, name: "idx_messages_sender"]
  }
}

Table "move_out_requests" {
  "id" uuid [pk, not null, default: `"gen_random_uuid"()`]
  "lease_id" uuid [not null]
  "tenant_id" uuid [not null]
  "landlord_id" uuid [not null]
  "reason" text
  "requested_date" date [not null]
  "status" public.move_out_status [not null, default: `'pending'::"public"."move_out_status"`]
  "notes" text
  "created_at" timestamp [not null, default: `"now"()`]
  "updated_at" timestamp [not null, default: `"now"()`]

  Indexes {
    lease_id [type: btree, name: "idx_move_out_lease"]
    tenant_id [type: btree, name: "idx_move_out_tenant"]
  }
}

Table "notifications" {
  "id" uuid [pk, not null, default: `"gen_random_uuid"()`]
  "user_id" uuid [not null]
  "type" public.notification_type [not null]
  "title" text [not null]
  "message" text [not null]
  "data" jsonb
  "read" boolean [not null, default: false]
  "created_at" timestamp [not null, default: `"now"()`]

  Indexes {
    (user_id, read) [type: btree, name: "idx_notifications_read"]
    user_id [type: btree, name: "idx_notifications_user"]
  }
}

Table "payment_items" {
  "id" uuid [pk, not null, default: `"gen_random_uuid"()`]
  "payment_id" uuid [not null]
  "label" text [not null]
  "amount" numeric(12,2) [not null]
  "category" text [not null, default: `'rent'::"text"`]
  "created_at" timestamp [not null, default: `"now"()`]

  Indexes {
    payment_id [type: btree, name: "idx_payment_items_payment"]
  }
}

Table "payments" {
  "id" uuid [pk, not null, default: `"gen_random_uuid"()`]
  "lease_id" uuid [not null]
  "tenant_id" uuid [not null]
  "landlord_id" uuid [not null]
  "amount" numeric(12,2) [not null]
  "status" public.payment_status [not null, default: `'pending'::"public"."payment_status"`]
  "method" public.payment_method
  "description" text
  "due_date" date [not null]
  "paid_at" timestamp
  "reference_number" text
  "landlord_confirmed" boolean [not null, default: false]
  "created_at" timestamp [not null, default: `"now"()`]
  "updated_at" timestamp [not null, default: `"now"()`]

  Indexes {
    due_date [type: btree, name: "idx_payments_due_date"]
    landlord_id [type: btree, name: "idx_payments_landlord"]
    lease_id [type: btree, name: "idx_payments_lease"]
    status [type: btree, name: "idx_payments_status"]
    tenant_id [type: btree, name: "idx_payments_tenant"]
  }
}

Table "profiles" {
  "id" uuid [pk, not null]
  "email" text [not null]
  "full_name" text [not null]
  "role" public.user_role [not null, default: `'tenant'::"public"."user_role"`]
  "avatar_url" text
  "phone" text
  "created_at" timestamp [not null, default: `"now"()`]
  "updated_at" timestamp [not null, default: `"now"()`]
  "business_name" text
  "business_permits" "text[]" [not null, default: `'{}'::"text"[]`]
}

Table "properties" {
  "id" uuid [pk, not null, default: `"gen_random_uuid"()`]
  "landlord_id" uuid [not null]
  "name" text [not null]
  "address" text [not null]
  "city" text [not null, default: `'Valenzuela'::"text"`]
  "description" text
  "type" public.property_type [not null, default: `'apartment'::"public"."property_type"`]
  "lat" doubleprecision
  "lng" doubleprecision
  "amenities" "text[]" [not null, default: `'{}'::"text"[]`]
  "house_rules" "text[]" [not null, default: `'{}'::"text"[]`]
  "images" "text[]" [not null, default: `'{}'::"text"[]`]
  "is_featured" boolean [not null, default: false]
  "contract_template" jsonb
  "created_at" timestamp [not null, default: `"now"()`]
  "updated_at" timestamp [not null, default: `"now"()`]

  Indexes {
    city [type: btree, name: "idx_properties_city"]
    landlord_id [type: btree, name: "idx_properties_landlord"]
    type [type: btree, name: "idx_properties_type"]
    name [type: gin, name: "idx_properties_name_trgm"]
    address [type: gin, name: "idx_properties_address_trgm"]
    city [type: gin, name: "idx_properties_city_trgm"]
  }
}

Table "saved_properties" {
  "id" uuid [pk, not null, default: `"gen_random_uuid"()`]
  "user_id" uuid [not null]
  "property_id" uuid [not null]
  "created_at" timestamp [not null, default: `"now"()`]

  Indexes {
    (user_id, property_id) [unique, name: "unique_saved"]
    user_id [type: btree, name: "idx_saved_properties_user"]
  }
}

Table "units" {
  "id" uuid [pk, not null, default: `"gen_random_uuid"()`]
  "property_id" uuid [not null]
  "name" text [not null]
  "floor" integer [not null, default: 1]
  "status" public.unit_status [not null, default: `'vacant'::"public"."unit_status"`]
  "rent_amount" numeric(12,2) [not null]
  "sqft" integer
  "beds" integer [not null, default: 1]
  "baths" integer [not null, default: 1]
  "created_at" timestamp [not null, default: `"now"()`]
  "updated_at" timestamp [not null, default: `"now"()`]

  Indexes {
    property_id [type: btree, name: "idx_units_property"]
    status [type: btree, name: "idx_units_status"]
  }
}

Ref "submits":"profiles"."id" < "applications"."applicant_id" [delete: cascade]

Ref "receives":"profiles"."id" < "applications"."landlord_id" [delete: cascade]

Ref "applied_to":"units"."id" < "applications"."unit_id" [delete: cascade]

Ref "has_participants":"conversations"."id" < "conversation_participants"."conversation_id" [delete: cascade]

Ref "participates_in":"profiles"."id" < "conversation_participants"."user_id" [delete: cascade]

Ref "chats_with":"profiles"."id" < "iris_chat_messages"."user_id" [delete: cascade]

Ref "applies_for_landlord":"profiles"."id" < "landlord_applications"."profile_id" [delete: cascade]

Ref "tracks_inquiry":"applications"."id" < "landlord_inquiry_actions"."inquiry_id" [delete: cascade]

Ref "manages_inquiry":"profiles"."id" < "landlord_inquiry_actions"."landlord_id" [delete: cascade]

Ref "is_reviewed":"profiles"."id" < "landlord_reviews"."landlord_id" [delete: cascade]

Ref "references_lease":"leases"."id" < "landlord_reviews"."lease_id" [delete: cascade]

Ref "writes_review":"profiles"."id" < "landlord_reviews"."tenant_id" [delete: cascade]

Ref "exports_stats":"profiles"."id" < "landlord_statistics_exports"."landlord_id" [delete: cascade]

Ref "manages_listing":"profiles"."id" < "listings"."landlord_id" [delete: cascade]

Ref "lists_property":"properties"."id" < "listings"."property_id" [delete: cascade]

Ref "lists_unit":"units"."id" < "listings"."unit_id" [delete: cascade]

Ref "manages_lease":"profiles"."id" < "leases"."landlord_id" [delete: restrict]

Ref "holds_lease":"profiles"."id" < "leases"."tenant_id" [delete: restrict]

Ref "leased_in":"units"."id" < "leases"."unit_id" [delete: restrict]

Ref "oversees_maintenance":"profiles"."id" < "maintenance_requests"."landlord_id" [delete: cascade]

Ref "requests_maintenance":"profiles"."id" < "maintenance_requests"."tenant_id" [delete: cascade]

Ref "requires_maintenance":"units"."id" < "maintenance_requests"."unit_id" [delete: cascade]

Ref "performs_action":"profiles"."id" < "message_user_actions"."actor_user_id" [delete: cascade]

Ref "subject_of_action":"profiles"."id" < "message_user_actions"."target_user_id" [delete: cascade]

Ref "reported_context":"conversations"."id" < "message_user_reports"."conversation_id" [delete: set null]

Ref "files_report":"profiles"."id" < "message_user_reports"."reporter_user_id" [delete: cascade]

Ref "is_reported":"profiles"."id" < "message_user_reports"."target_user_id" [delete: cascade]

Ref "contains_messages":"conversations"."id" < "messages"."conversation_id" [delete: cascade]

Ref "sends_message":"profiles"."id" < "messages"."sender_id" [delete: cascade]

Ref "reviews_move_out":"profiles"."id" < "move_out_requests"."landlord_id" [delete: cascade]

Ref "terminates_lease":"leases"."id" < "move_out_requests"."lease_id" [delete: cascade]

Ref "requests_move_out":"profiles"."id" < "move_out_requests"."tenant_id" [delete: cascade]

Ref "receives_notification":"profiles"."id" < "notifications"."user_id" [delete: cascade]

Ref "includes_item":"payments"."id" < "payment_items"."payment_id" [delete: cascade]

Ref "collects_payment":"profiles"."id" < "payments"."landlord_id" [delete: restrict]

Ref "fulfills_lease":"leases"."id" < "payments"."lease_id" [delete: restrict]

Ref "pays_rent":"profiles"."id" < "payments"."tenant_id" [delete: restrict]

Ref "identifies":"auth"."users"."id" < "profiles"."id" [delete: cascade]

Ref "owns_property":"profiles"."id" < "properties"."landlord_id" [delete: cascade]

Ref "bookmarks_property":"properties"."id" < "saved_properties"."property_id" [delete: cascade]

Ref "saves_property":"profiles"."id" < "saved_properties"."user_id" [delete: cascade]

Ref "contains_units":"properties"."id" < "units"."property_id" [delete: cascade]

Table "auth"."users" {
  "id" uuid [pk]
}
