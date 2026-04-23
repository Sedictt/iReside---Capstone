


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."application_status" AS ENUM (
    'pending',
    'reviewing',
    'approved',
    'rejected',
    'withdrawn',
    'payment_pending'
);


ALTER TYPE "public"."application_status" OWNER TO "postgres";


CREATE TYPE "public"."lease_status" AS ENUM (
    'draft',
    'pending_signature',
    'active',
    'expired',
    'terminated',
    'pending_tenant_signature',
    'pending_landlord_signature'
);


ALTER TYPE "public"."lease_status" OWNER TO "postgres";


CREATE TYPE "public"."listing_scope" AS ENUM (
    'property',
    'unit'
);


ALTER TYPE "public"."listing_scope" OWNER TO "postgres";


CREATE TYPE "public"."listing_status" AS ENUM (
    'draft',
    'published',
    'paused'
);


ALTER TYPE "public"."listing_status" OWNER TO "postgres";


CREATE TYPE "public"."location_type" AS ENUM (
    'city',
    'barangay',
    'street'
);


ALTER TYPE "public"."location_type" OWNER TO "postgres";


CREATE TYPE "public"."maintenance_priority" AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE "public"."maintenance_priority" OWNER TO "postgres";


CREATE TYPE "public"."maintenance_status" AS ENUM (
    'open',
    'in_progress',
    'resolved',
    'closed'
);


ALTER TYPE "public"."maintenance_status" OWNER TO "postgres";


CREATE TYPE "public"."message_type" AS ENUM (
    'text',
    'system',
    'image',
    'file'
);


ALTER TYPE "public"."message_type" OWNER TO "postgres";


CREATE TYPE "public"."move_out_status" AS ENUM (
    'pending',
    'approved',
    'denied',
    'completed'
);


ALTER TYPE "public"."move_out_status" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'payment',
    'lease',
    'maintenance',
    'announcement',
    'message',
    'application'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."payment_amount_tag" AS ENUM (
    'exact',
    'partial',
    'overpaid',
    'short_paid'
);


ALTER TYPE "public"."payment_amount_tag" OWNER TO "postgres";


CREATE TYPE "public"."payment_intent_method" AS ENUM (
    'gcash',
    'in_person'
);


ALTER TYPE "public"."payment_intent_method" OWNER TO "postgres";


CREATE TYPE "public"."payment_method" AS ENUM (
    'credit_card',
    'debit_card',
    'gcash',
    'maya',
    'bank_transfer',
    'cash'
);


ALTER TYPE "public"."payment_method" OWNER TO "postgres";


CREATE TYPE "public"."payment_review_action" AS ENUM (
    'accept_partial',
    'request_completion',
    'reject',
    'confirm_received'
);


ALTER TYPE "public"."payment_review_action" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'refunded'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_workflow_status" AS ENUM (
    'pending',
    'reminder_sent',
    'intent_submitted',
    'under_review',
    'awaiting_in_person',
    'confirmed',
    'rejected',
    'receipted'
);


ALTER TYPE "public"."payment_workflow_status" OWNER TO "postgres";


CREATE TYPE "public"."post_status_enum" AS ENUM (
    'draft',
    'published',
    'archived'
);


ALTER TYPE "public"."post_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."post_type_enum" AS ENUM (
    'announcement',
    'poll',
    'photo_album',
    'discussion'
);


ALTER TYPE "public"."post_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."property_type" AS ENUM (
    'apartment',
    'condo',
    'house',
    'townhouse',
    'studio',
    'dormitory',
    'boarding_house'
);


ALTER TYPE "public"."property_type" OWNER TO "postgres";


CREATE TYPE "public"."reaction_type_enum" AS ENUM (
    'like',
    'heart',
    'thumbs_up',
    'clap',
    'celebration'
);


ALTER TYPE "public"."reaction_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."report_status_enum" AS ENUM (
    'pending',
    'reviewed',
    'dismissed',
    'escalated'
);


ALTER TYPE "public"."report_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."unit_status" AS ENUM (
    'vacant',
    'occupied',
    'maintenance'
);


ALTER TYPE "public"."unit_status" OWNER TO "postgres";


CREATE TYPE "public"."unit_transfer_status" AS ENUM (
    'pending',
    'approved',
    'denied',
    'cancelled'
);


ALTER TYPE "public"."unit_transfer_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'tenant',
    'landlord',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."utility_billing_mode" AS ENUM (
    'included_in_rent',
    'tenant_paid'
);


ALTER TYPE "public"."utility_billing_mode" OWNER TO "postgres";


CREATE TYPE "public"."utility_type" AS ENUM (
    'water',
    'electricity'
);


ALTER TYPE "public"."utility_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_lease_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF NEW.status = 'active' THEN
        UPDATE units SET status = 'occupied' WHERE id = NEW.unit_id;
    ELSIF NEW.status IN ('expired', 'terminated') AND OLD.status = 'active' THEN
        UPDATE units SET status = 'vacant' WHERE id = NEW.unit_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_lease_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_message"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE conversations SET updated_at = now() WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, phone, business_name, business_permits)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'tenant'::user_role),
        NULLIF(NEW.raw_user_meta_data->>'phone', ''),
        NULLIF(NEW.raw_user_meta_data->>'business_name', ''),
        COALESCE(
            ARRAY(
                SELECT jsonb_array_elements_text(COALESCE(NEW.raw_user_meta_data->'business_permits', '[]'::jsonb))
            ),
            '{}'::TEXT[]
        )
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_listing_metric"("p_listing_id" "uuid", "p_metric" "text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    updated_count integer := 0;
BEGIN
    IF p_metric = 'view' THEN
        UPDATE public.listings
        SET views = views + 1
        WHERE id = p_listing_id
          AND status = 'published'::public.listing_status;
    ELSIF p_metric = 'lead' THEN
        UPDATE public.listings
        SET leads = leads + 1
        WHERE id = p_listing_id
          AND status = 'published'::public.listing_status;
    ELSE
        RAISE EXCEPTION 'Unknown listing metric: %', p_metric
            USING ERRCODE = '22023';
    END IF;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;


ALTER FUNCTION "public"."increment_listing_metric"("p_listing_id" "uuid", "p_metric" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_post_view"("p_post_id" "uuid", "p_user_id" "uuid", "p_session_id" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_inserted integer;
begin
  insert into post_views (
    post_id,
    user_id,
    session_id,
    viewed_at,
    view_day
  )
  values (
    p_post_id,
    p_user_id,
    p_session_id,
    now(),
    (now() at time zone 'UTC')::date
  )
  on conflict do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    update community_posts
    set view_count = view_count + 1
    where id = p_post_id;
  end if;
end;
$$;


ALTER FUNCTION "public"."increment_post_view"("p_post_id" "uuid", "p_user_id" "uuid", "p_session_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_payment_receipt_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RAISE EXCEPTION 'Issued receipts are immutable.';
END;
$$;


ALTER FUNCTION "public"."prevent_payment_receipt_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_compat_payment_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.workflow_status IN ('under_review', 'intent_submitted') THEN
        NEW.status := 'processing';
    ELSIF NEW.workflow_status IN ('confirmed', 'receipted') THEN
        NEW.status := 'completed';
    ELSIF NEW.workflow_status = 'rejected' THEN
        NEW.status := 'failed';
    ELSE
        NEW.status := 'pending';
    END IF;

    IF NEW.workflow_status IN ('confirmed', 'receipted') THEN
        NEW.landlord_confirmed := true;
    ELSIF NEW.workflow_status IN ('rejected', 'pending', 'reminder_sent', 'intent_submitted', 'under_review', 'awaiting_in_person') THEN
        NEW.landlord_confirmed := false;
    END IF;

    IF NEW.workflow_status IN ('confirmed', 'receipted') AND NEW.paid_at IS NULL THEN
        NEW.paid_at := now();
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_compat_payment_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lease_signature_timestamps"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update tenant_signed_at when tenant_signature changes
    IF NEW.tenant_signature IS NOT NULL AND OLD.tenant_signature IS NULL THEN
        NEW.tenant_signed_at = now();
    END IF;
    
    -- Update landlord_signed_at when landlord_signature changes
    IF NEW.landlord_signature IS NOT NULL AND OLD.landlord_signature IS NULL THEN
        NEW.landlord_signed_at = now();
    END IF;
    
    -- Update signed_at when both signatures are present
    IF NEW.tenant_signature IS NOT NULL 
       AND NEW.landlord_signature IS NOT NULL 
       AND NEW.signed_at IS NULL THEN
        NEW.signed_at = now();
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_lease_signature_timestamps"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_lease_status_transition"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Prevent transition to active without both signatures
    IF NEW.status = 'active' THEN
        IF NEW.tenant_signature IS NULL OR NEW.landlord_signature IS NULL THEN
            RAISE EXCEPTION 'Cannot set lease status to active without both signatures';
        END IF;
    END IF;
    
    -- Prevent invalid status transitions (basic validation)
    IF OLD.status = 'active' AND NEW.status = 'draft' THEN
        RAISE EXCEPTION 'Cannot transition from active to draft status';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_lease_status_transition"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."application_payment_audit_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "payment_request_id" "uuid",
    "actor_id" "uuid",
    "actor_role" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "application_payment_audit_events_actor_role_check" CHECK (("actor_role" = ANY (ARRAY['system'::"text", 'landlord'::"text", 'prospect'::"text"]))),
    CONSTRAINT "application_payment_audit_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['request_generated'::"text", 'portal_opened'::"text", 'proof_submitted'::"text", 'payment_confirmed'::"text", 'payment_rejected'::"text", 'payment_needs_correction'::"text", 'bypass_used'::"text", 'expired'::"text", 'finalized'::"text"])))
);


ALTER TABLE "public"."application_payment_audit_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."application_payment_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "landlord_id" "uuid" NOT NULL,
    "requirement_type" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "due_at" "date",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "method" "public"."payment_method",
    "reference_number" "text",
    "payment_note" "text",
    "payment_proof_path" "text",
    "payment_proof_url" "text",
    "submitted_at" timestamp with time zone,
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    "review_note" "text",
    "bypassed" boolean DEFAULT false NOT NULL,
    "linked_payment_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "application_payment_requests_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "application_payment_requests_requirement_type_check" CHECK (("requirement_type" = ANY (ARRAY['advance_rent'::"text", 'security_deposit'::"text"]))),
    CONSTRAINT "application_payment_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'rejected'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."application_payment_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "unit_id" "uuid" NOT NULL,
    "applicant_id" "uuid",
    "landlord_id" "uuid" NOT NULL,
    "status" "public"."application_status" DEFAULT 'pending'::"public"."application_status" NOT NULL,
    "message" "text",
    "monthly_income" numeric(12,2),
    "employment_status" "text",
    "move_in_date" "date",
    "documents" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "emergency_contact_name" "text",
    "emergency_contact_phone" "text",
    "reference_name" "text",
    "reference_phone" "text",
    "compliance_checklist" "jsonb" DEFAULT '{"valid_id": false, "lease_signed": false, "income_verified": false, "inspection_done": false, "payment_received": false, "background_checked": false, "application_completed": false}'::"jsonb",
    "created_by" "uuid",
    "applicant_name" "text",
    "applicant_phone" "text",
    "applicant_email" "text",
    "employment_info" "jsonb" DEFAULT '{}'::"jsonb",
    "requirements_checklist" "jsonb" DEFAULT '{}'::"jsonb",
    "lease_id" "uuid",
    "invite_id" "uuid",
    "application_source" "text" DEFAULT 'walk_in_application'::"text" NOT NULL,
    "payment_pending_started_at" timestamp with time zone,
    "payment_pending_expires_at" timestamp with time zone,
    "payment_portal_token_hash" "text",
    "payment_portal_token_expires_at" timestamp with time zone,
    CONSTRAINT "applications_application_source_check" CHECK (("application_source" = ANY (ARRAY['walk_in_application'::"text", 'invite_link'::"text"])))
);


ALTER TABLE "public"."applications" OWNER TO "postgres";


COMMENT ON COLUMN "public"."applications"."compliance_checklist" IS 'Tracks the 7 mandatory requirements before accepting a renter.';



CREATE TABLE IF NOT EXISTS "public"."community_albums" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "cover_photo_url" "text",
    "photo_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."community_albums" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "parent_comment_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."community_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "url" "text" NOT NULL,
    "caption" "text",
    "display_order" integer DEFAULT 0 NOT NULL,
    "uploaded_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."community_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_poll_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "poll_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "option_index" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "community_poll_votes_option_index_check" CHECK (("option_index" >= 0))
);


ALTER TABLE "public"."community_poll_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "author_role" "public"."user_role" NOT NULL,
    "type" "public"."post_type_enum" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "metadata" "jsonb",
    "is_pinned" boolean DEFAULT false,
    "is_moderated" boolean DEFAULT false,
    "is_approved" boolean DEFAULT false,
    "status" "public"."post_status_enum" DEFAULT 'published'::"public"."post_status_enum",
    "view_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."community_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reaction_type" "public"."reaction_type_enum" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."community_reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "reporter_id" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "status" "public"."report_status_enum" DEFAULT 'pending'::"public"."report_status_enum",
    "moderator_notes" "text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."content_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."conversation_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."geo_locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "public"."location_type" NOT NULL,
    "city_name" "text",
    "barangay_name" "text",
    "full_label" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."geo_locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."iris_chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "iris_chat_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text"])))
);


ALTER TABLE "public"."iris_chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."landlord_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "phone" "text" NOT NULL,
    "identity_document_url" "text",
    "ownership_document_url" "text",
    "liveness_document_url" "text",
    "status" "public"."application_status" DEFAULT 'pending'::"public"."application_status" NOT NULL,
    "admin_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "business_name" "text",
    "business_address" "text",
    "verification_status" "text" DEFAULT 'not_verified'::"text",
    "verification_data" "jsonb",
    "verification_checked_at" timestamp with time zone,
    "verification_notes" "text",
    CONSTRAINT "landlord_applications_verification_status_check" CHECK (("verification_status" = ANY (ARRAY['not_verified'::"text", 'verified'::"text", 'not_found'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."landlord_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."landlord_inquiry_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "inquiry_id" "uuid" NOT NULL,
    "landlord_id" "uuid" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "is_archived" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."landlord_inquiry_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."landlord_payment_destinations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "landlord_id" "uuid" NOT NULL,
    "provider" "text" DEFAULT 'gcash'::"text" NOT NULL,
    "account_name" "text" NOT NULL,
    "account_number" "text" NOT NULL,
    "qr_image_path" "text",
    "qr_image_url" "text",
    "is_enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "landlord_payment_destinations_provider_check" CHECK (("provider" = 'gcash'::"text"))
);


ALTER TABLE "public"."landlord_payment_destinations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."landlord_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lease_id" "uuid" NOT NULL,
    "landlord_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "rating" smallint NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "landlord_reviews_no_self_review" CHECK (("landlord_id" <> "tenant_id")),
    CONSTRAINT "landlord_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."landlord_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."landlord_statistics_exports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "landlord_id" "uuid" NOT NULL,
    "format" "text" NOT NULL,
    "report_range" "text" NOT NULL,
    "mode" "text" NOT NULL,
    "include_expanded_kpis" boolean DEFAULT false NOT NULL,
    "row_count" integer DEFAULT 0 NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "landlord_statistics_exports_format_check" CHECK (("format" = ANY (ARRAY['csv'::"text", 'pdf'::"text"]))),
    CONSTRAINT "landlord_statistics_exports_mode_check" CHECK (("mode" = ANY (ARRAY['Simplified'::"text", 'Detailed'::"text"])))
);


ALTER TABLE "public"."landlord_statistics_exports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lease_signing_audit" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lease_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "actor_id" "uuid",
    "ip_address" "inet",
    "user_agent" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "lease_signing_audit_event_type_check" CHECK (("event_type" = ANY (ARRAY['signing_link_generated'::"text", 'signing_link_accessed'::"text", 'signing_link_expired'::"text", 'signing_link_regenerated'::"text", 'tenant_signed'::"text", 'landlord_signed'::"text", 'lease_activated'::"text", 'signing_failed'::"text"])))
);


ALTER TABLE "public"."lease_signing_audit" OWNER TO "postgres";


COMMENT ON TABLE "public"."lease_signing_audit" IS 'Audit trail for all lease signing events';



COMMENT ON COLUMN "public"."lease_signing_audit"."event_type" IS 'Type of signing event: signing_link_generated, tenant_signed, landlord_signed, etc.';



COMMENT ON COLUMN "public"."lease_signing_audit"."ip_address" IS 'IP address of the user performing the action';



COMMENT ON COLUMN "public"."lease_signing_audit"."user_agent" IS 'Browser user agent string';



COMMENT ON COLUMN "public"."lease_signing_audit"."metadata" IS 'Additional event-specific metadata (error details, link expiration, etc.)';



CREATE TABLE IF NOT EXISTS "public"."leases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "unit_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "landlord_id" "uuid" NOT NULL,
    "status" "public"."lease_status" DEFAULT 'draft'::"public"."lease_status" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "monthly_rent" numeric(12,2) NOT NULL,
    "security_deposit" numeric(12,2) DEFAULT 0 NOT NULL,
    "terms" "jsonb",
    "tenant_signature" "text",
    "landlord_signature" "text",
    "signed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "signing_mode" "text",
    "tenant_signed_at" timestamp with time zone,
    "landlord_signed_at" timestamp with time zone,
    "signing_link_token_hash" "text",
    "signature_lock_version" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "lease_dates_valid" CHECK (("end_date" > "start_date")),
    CONSTRAINT "leases_signing_mode_check" CHECK (("signing_mode" = ANY (ARRAY['in_person'::"text", 'remote'::"text"])))
);


ALTER TABLE "public"."leases" OWNER TO "postgres";


COMMENT ON COLUMN "public"."leases"."signing_mode" IS 'Signing mode: in_person (both sign in same session) or remote (tenant signs via email link)';



COMMENT ON COLUMN "public"."leases"."tenant_signed_at" IS 'Timestamp when tenant signed the lease';



COMMENT ON COLUMN "public"."leases"."landlord_signed_at" IS 'Timestamp when landlord signed the lease';



COMMENT ON COLUMN "public"."leases"."signing_link_token_hash" IS 'SHA-256 hash of JWT token for remote signing link';



COMMENT ON COLUMN "public"."leases"."signature_lock_version" IS 'Optimistic lock version for concurrent signature prevention';



CREATE TABLE IF NOT EXISTS "public"."listings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "landlord_id" "uuid" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "unit_id" "uuid",
    "scope" "public"."listing_scope" NOT NULL,
    "title" "text" NOT NULL,
    "rent_amount" numeric(12,2) NOT NULL,
    "status" "public"."listing_status" DEFAULT 'draft'::"public"."listing_status" NOT NULL,
    "views" integer DEFAULT 0 NOT NULL,
    "leads" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "listings_rent_amount_check" CHECK (("rent_amount" >= (0)::numeric)),
    CONSTRAINT "listings_scope_unit_consistency" CHECK (((("scope" = 'property'::"public"."listing_scope") AND ("unit_id" IS NULL)) OR (("scope" = 'unit'::"public"."listing_scope") AND ("unit_id" IS NOT NULL))))
);


ALTER TABLE "public"."listings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."maintenance_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "unit_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "landlord_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "status" "public"."maintenance_status" DEFAULT 'open'::"public"."maintenance_status" NOT NULL,
    "priority" "public"."maintenance_priority" DEFAULT 'medium'::"public"."maintenance_priority" NOT NULL,
    "category" "text",
    "images" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "self_repair_requested" boolean DEFAULT false NOT NULL,
    "self_repair_decision" "text",
    "repair_method" "text",
    "third_party_name" "text",
    "photo_requested" boolean DEFAULT false NOT NULL,
    "tenant_repair_status" "text",
    "tenant_provided_photos" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "ai_triage_priority" "public"."maintenance_priority",
    "ai_triage_sentiment" "text",
    "ai_triage_reason" "text",
    "ai_triage_confidence" double precision,
    "ai_triage_hash" "text",
    "ai_triage_version" "text",
    "ai_triaged_at" timestamp with time zone,
    CONSTRAINT "maintenance_requests_ai_triage_sentiment_check" CHECK ((("ai_triage_sentiment" IS NULL) OR ("ai_triage_sentiment" = ANY (ARRAY['distressed'::"text", 'negative'::"text", 'neutral'::"text", 'positive'::"text"])))),
    CONSTRAINT "maintenance_requests_repair_method_check" CHECK ((("repair_method" = ANY (ARRAY['landlord'::"text", 'third_party'::"text", 'self_repair'::"text"])) OR ("repair_method" IS NULL))),
    CONSTRAINT "maintenance_requests_self_repair_decision_check" CHECK ((("self_repair_decision" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])) OR ("self_repair_decision" IS NULL))),
    CONSTRAINT "maintenance_requests_tenant_repair_status_check" CHECK ((("tenant_repair_status" = ANY (ARRAY['not_started'::"text", 'personnel_arrived'::"text", 'repairing'::"text", 'done'::"text"])) OR ("tenant_repair_status" IS NULL)))
);


ALTER TABLE "public"."maintenance_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_moderation_banned_terms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "term" "text" NOT NULL,
    "normalized_term" "text" NOT NULL,
    "source" "text" DEFAULT 'manual'::"text" NOT NULL,
    "report_id" "uuid",
    "created_by" "uuid",
    "is_active" boolean DEFAULT true NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "message_moderation_banned_terms_source_check" CHECK (("source" = ANY (ARRAY['manual'::"text", 'report'::"text"])))
);


ALTER TABLE "public"."message_moderation_banned_terms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_user_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_user_id" "uuid" NOT NULL,
    "target_user_id" "uuid" NOT NULL,
    "archived" boolean DEFAULT false NOT NULL,
    "blocked" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "message_user_actions_no_self_target" CHECK (("actor_user_id" <> "target_user_id"))
);


ALTER TABLE "public"."message_user_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_user_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reporter_user_id" "uuid" NOT NULL,
    "target_user_id" "uuid" NOT NULL,
    "conversation_id" "uuid",
    "category" "text" NOT NULL,
    "details" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "message_user_reports_no_self_target" CHECK (("reporter_user_id" <> "target_user_id")),
    CONSTRAINT "message_user_reports_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'reviewing'::"text", 'resolved'::"text", 'dismissed'::"text"])))
);


ALTER TABLE "public"."message_user_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "type" "public"."message_type" DEFAULT 'text'::"public"."message_type" NOT NULL,
    "content" "text" NOT NULL,
    "metadata" "jsonb",
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."move_out_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lease_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "landlord_id" "uuid" NOT NULL,
    "reason" "text",
    "requested_date" "date" NOT NULL,
    "status" "public"."move_out_status" DEFAULT 'pending'::"public"."move_out_status" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."move_out_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."notification_type" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "data" "jsonb",
    "read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payment_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "category" "text" DEFAULT 'rent'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "utility_type" "public"."utility_type",
    "billing_mode" "public"."utility_billing_mode",
    "reading_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."payment_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_receipts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payment_id" "uuid" NOT NULL,
    "landlord_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "receipt_number" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "issued_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "issued_by" "uuid",
    "notes" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "method" "public"."payment_method",
    "amount_breakdown" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."payment_receipts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_workflow_audit_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payment_id" "uuid" NOT NULL,
    "actor_id" "uuid",
    "action" "text" NOT NULL,
    "source" "text" NOT NULL,
    "idempotency_key" "text",
    "before_state" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "after_state" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payment_workflow_audit_events_source_check" CHECK (("source" = ANY (ARRAY['api'::"text", 'chat_button'::"text", 'system_expiry'::"text"])))
);


ALTER TABLE "public"."payment_workflow_audit_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lease_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "landlord_id" "uuid" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status" NOT NULL,
    "method" "public"."payment_method",
    "description" "text",
    "due_date" "date" NOT NULL,
    "paid_at" timestamp with time zone,
    "reference_number" "text",
    "landlord_confirmed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "invoice_number" "text",
    "billing_cycle" "date",
    "invoice_period_start" "date",
    "invoice_period_end" "date",
    "subtotal" numeric(12,2) DEFAULT 0 NOT NULL,
    "paid_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "balance_remaining" numeric(12,2) DEFAULT 0 NOT NULL,
    "late_fee_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "late_fee_applied_at" timestamp with time zone,
    "allow_partial_payments" boolean DEFAULT false NOT NULL,
    "due_day_snapshot" integer,
    "payment_submitted_at" timestamp with time zone,
    "payment_proof_path" "text",
    "payment_proof_url" "text",
    "payment_note" "text",
    "reminder_sent_at" timestamp with time zone,
    "receipt_number" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "workflow_status" "public"."payment_workflow_status" DEFAULT 'pending'::"public"."payment_workflow_status" NOT NULL,
    "intent_method" "public"."payment_intent_method",
    "amount_tag" "public"."payment_amount_tag",
    "review_action" "public"."payment_review_action",
    "in_person_intent_expires_at" timestamp with time zone,
    "rejection_reason" "text",
    "last_action_at" timestamp with time zone,
    "last_action_by" "uuid",
    CONSTRAINT "payments_rejection_reason_required" CHECK ((("workflow_status" <> 'rejected'::"public"."payment_workflow_status") OR (NULLIF(TRIM(BOTH FROM COALESCE("rejection_reason", ''::"text")), ''::"text") IS NOT NULL)))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "session_id" "text",
    "viewed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "view_day" "date" DEFAULT (("now"() AT TIME ZONE 'UTC'::"text"))::"date" NOT NULL,
    CONSTRAINT "post_views_check" CHECK ((("user_id" IS NOT NULL) OR ("session_id" IS NOT NULL)))
);


ALTER TABLE "public"."post_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "role" "public"."user_role" DEFAULT 'tenant'::"public"."user_role" NOT NULL,
    "avatar_url" "text",
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "business_name" "text",
    "business_permits" "text"[] DEFAULT '{}'::"text"[] NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."properties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "landlord_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "address" "text" NOT NULL,
    "city" "text" DEFAULT 'Valenzuela'::"text" NOT NULL,
    "description" "text",
    "type" "public"."property_type" DEFAULT 'apartment'::"public"."property_type" NOT NULL,
    "lat" double precision,
    "lng" double precision,
    "amenities" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "house_rules" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "images" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "is_featured" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "contract_template" "jsonb"
);


ALTER TABLE "public"."properties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_environment_policies" (
    "property_id" "uuid" NOT NULL,
    "environment_mode" "text" NOT NULL,
    "max_occupants_per_unit" integer,
    "curfew_enabled" boolean DEFAULT false,
    "curfew_time" time without time zone,
    "visitor_cutoff_enabled" boolean DEFAULT false,
    "visitor_cutoff_time" time without time zone,
    "quiet_hours_start" time without time zone,
    "quiet_hours_end" time without time zone,
    "gender_restriction_mode" "text" DEFAULT 'none'::"text",
    "utility_policy_mode" "text" DEFAULT 'included_in_rent'::"text",
    "payment_profile_defaults" "jsonb",
    "needs_review" boolean DEFAULT false,
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."property_environment_policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_properties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."saved_properties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenant_intake_invite_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invite_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tenant_intake_invite_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['created'::"text", 'opened'::"text", 'submitted'::"text", 'revoked'::"text", 'expired'::"text", 'consumed'::"text"])))
);


ALTER TABLE "public"."tenant_intake_invite_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenant_intake_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "landlord_id" "uuid" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "unit_id" "uuid",
    "mode" "text" NOT NULL,
    "public_token" "text" NOT NULL,
    "token_hash" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "max_uses" integer DEFAULT 1 NOT NULL,
    "use_count" integer DEFAULT 0 NOT NULL,
    "expires_at" timestamp with time zone,
    "last_used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "application_type" "text" DEFAULT 'face_to_face'::"text" NOT NULL,
    "required_requirements" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    CONSTRAINT "tenant_intake_invites_application_type_check" CHECK (("application_type" = ANY (ARRAY['online'::"text", 'face_to_face'::"text"]))),
    CONSTRAINT "tenant_intake_invites_max_uses_check" CHECK (("max_uses" > 0)),
    CONSTRAINT "tenant_intake_invites_mode_check" CHECK (("mode" = ANY (ARRAY['property'::"text", 'unit'::"text"]))),
    CONSTRAINT "tenant_intake_invites_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'revoked'::"text", 'expired'::"text", 'consumed'::"text"]))),
    CONSTRAINT "tenant_intake_invites_use_count_check" CHECK (("use_count" >= 0))
);


ALTER TABLE "public"."tenant_intake_invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenant_product_tour_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "session_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "step_id" "text",
    "trigger_source" "text" NOT NULL,
    "is_replay" boolean DEFAULT false NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tenant_product_tour_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['tour_started'::"text", 'tour_step_completed'::"text", 'tour_skipped'::"text", 'tour_completed'::"text", 'tour_replayed'::"text", 'tour_failed'::"text"]))),
    CONSTRAINT "tenant_product_tour_events_trigger_source_check" CHECK (("trigger_source" = ANY (ARRAY['onboarding_handoff'::"text", 'auto_portal_entry'::"text", 'manual'::"text", 'resume'::"text", 'replay'::"text", 'step_progression'::"text", 'fallback'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."tenant_product_tour_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."tenant_product_tour_events" IS 'Lifecycle telemetry for tenant product tours including replay segmentation.';



CREATE TABLE IF NOT EXISTS "public"."tenant_product_tour_states" (
    "tenant_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'not_started'::"text" NOT NULL,
    "current_step_index" integer DEFAULT 0 NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "skipped_at" timestamp with time zone,
    "skip_suppressed_until" timestamp with time zone,
    "replay_count" integer DEFAULT 0 NOT NULL,
    "last_event_at" timestamp with time zone,
    "last_route" "text",
    "last_anchor_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tenant_product_tour_states_current_step_index_check" CHECK (("current_step_index" >= 0)),
    CONSTRAINT "tenant_product_tour_states_replay_count_check" CHECK (("replay_count" >= 0)),
    CONSTRAINT "tenant_product_tour_states_status_check" CHECK (("status" = ANY (ARRAY['not_started'::"text", 'in_progress'::"text", 'skipped'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."tenant_product_tour_states" OWNER TO "postgres";


COMMENT ON TABLE "public"."tenant_product_tour_states" IS 'Current tenant product tour lifecycle state with replay/suppression metadata.';



CREATE TABLE IF NOT EXISTS "public"."unit_environment_overrides" (
    "unit_id" "uuid" NOT NULL,
    "max_occupants_per_unit" integer,
    "curfew_enabled" boolean,
    "curfew_time" time without time zone,
    "visitor_cutoff_enabled" boolean,
    "visitor_cutoff_time" time without time zone,
    "quiet_hours_start" time without time zone,
    "quiet_hours_end" time without time zone,
    "gender_restriction_mode" "text",
    "utility_policy_mode" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."unit_environment_overrides" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."unit_transfer_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lease_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "landlord_id" "uuid" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "current_unit_id" "uuid" NOT NULL,
    "requested_unit_id" "uuid" NOT NULL,
    "reason" "text",
    "status" "public"."unit_transfer_status" DEFAULT 'pending'::"public"."unit_transfer_status" NOT NULL,
    "landlord_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "unit_transfer_requests_distinct_units" CHECK (("current_unit_id" <> "requested_unit_id"))
);


ALTER TABLE "public"."unit_transfer_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."units" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "floor" integer DEFAULT 1 NOT NULL,
    "status" "public"."unit_status" DEFAULT 'vacant'::"public"."unit_status" NOT NULL,
    "rent_amount" numeric(12,2) NOT NULL,
    "sqft" integer,
    "beds" integer DEFAULT 1 NOT NULL,
    "baths" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."units" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."utility_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "landlord_id" "uuid" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "unit_id" "uuid",
    "utility_type" "public"."utility_type" NOT NULL,
    "billing_mode" "public"."utility_billing_mode" DEFAULT 'included_in_rent'::"public"."utility_billing_mode" NOT NULL,
    "rate_per_unit" numeric(12,2) DEFAULT 0 NOT NULL,
    "unit_label" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "effective_from" "date" DEFAULT CURRENT_DATE NOT NULL,
    "effective_to" "date",
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "utility_configs_unit_label_check" CHECK (((("utility_type" = 'water'::"public"."utility_type") AND ("unit_label" = 'cubic_meter'::"text")) OR (("utility_type" = 'electricity'::"public"."utility_type") AND ("unit_label" = 'kwh'::"text"))))
);


ALTER TABLE "public"."utility_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."utility_readings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "landlord_id" "uuid" NOT NULL,
    "lease_id" "uuid" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "unit_id" "uuid" NOT NULL,
    "utility_type" "public"."utility_type" NOT NULL,
    "billing_mode" "public"."utility_billing_mode" NOT NULL,
    "billing_period_start" "date" NOT NULL,
    "billing_period_end" "date" NOT NULL,
    "previous_reading" numeric(12,2) DEFAULT 0 NOT NULL,
    "current_reading" numeric(12,2) DEFAULT 0 NOT NULL,
    "usage" numeric(12,2) DEFAULT 0 NOT NULL,
    "billed_rate" numeric(12,2) DEFAULT 0 NOT NULL,
    "computed_charge" numeric(12,2) DEFAULT 0 NOT NULL,
    "entered_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "note" "text",
    "proof_image_path" "text",
    "proof_image_url" "text",
    "payment_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "utility_readings_period_order" CHECK (("billing_period_end" >= "billing_period_start")),
    CONSTRAINT "utility_readings_positive_progress" CHECK (("current_reading" >= "previous_reading")),
    CONSTRAINT "utility_readings_usage_nonnegative" CHECK (("usage" >= (0)::numeric))
);


ALTER TABLE "public"."utility_readings" OWNER TO "postgres";


ALTER TABLE ONLY "public"."application_payment_audit_events"
    ADD CONSTRAINT "application_payment_audit_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."application_payment_requests"
    ADD CONSTRAINT "application_payment_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."application_payment_requests"
    ADD CONSTRAINT "application_payment_requests_unique_requirement" UNIQUE ("application_id", "requirement_type");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_albums"
    ADD CONSTRAINT "community_albums_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_albums"
    ADD CONSTRAINT "community_albums_post_id_key" UNIQUE ("post_id");



ALTER TABLE ONLY "public"."community_comments"
    ADD CONSTRAINT "community_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_photos"
    ADD CONSTRAINT "community_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_poll_votes"
    ADD CONSTRAINT "community_poll_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_poll_votes"
    ADD CONSTRAINT "community_poll_votes_poll_id_user_id_key" UNIQUE ("poll_id", "user_id");



ALTER TABLE ONLY "public"."community_posts"
    ADD CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_reactions"
    ADD CONSTRAINT "community_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_reactions"
    ADD CONSTRAINT "community_reactions_post_id_user_id_reaction_type_key" UNIQUE ("post_id", "user_id", "reaction_type");



ALTER TABLE ONLY "public"."content_reports"
    ADD CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."geo_locations"
    ADD CONSTRAINT "geo_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."iris_chat_messages"
    ADD CONSTRAINT "iris_chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."landlord_applications"
    ADD CONSTRAINT "landlord_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."landlord_inquiry_actions"
    ADD CONSTRAINT "landlord_inquiry_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."landlord_inquiry_actions"
    ADD CONSTRAINT "landlord_inquiry_actions_unique" UNIQUE ("inquiry_id", "landlord_id");



ALTER TABLE ONLY "public"."landlord_payment_destinations"
    ADD CONSTRAINT "landlord_payment_destinations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."landlord_payment_destinations"
    ADD CONSTRAINT "landlord_payment_destinations_unique_provider" UNIQUE ("landlord_id", "provider");



ALTER TABLE ONLY "public"."landlord_reviews"
    ADD CONSTRAINT "landlord_reviews_one_per_lease" UNIQUE ("lease_id");



ALTER TABLE ONLY "public"."landlord_reviews"
    ADD CONSTRAINT "landlord_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."landlord_statistics_exports"
    ADD CONSTRAINT "landlord_statistics_exports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lease_signing_audit"
    ADD CONSTRAINT "lease_signing_audit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leases"
    ADD CONSTRAINT "leases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_moderation_banned_terms"
    ADD CONSTRAINT "message_moderation_banned_terms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_user_actions"
    ADD CONSTRAINT "message_user_actions_actor_target_unique" UNIQUE ("actor_user_id", "target_user_id");



ALTER TABLE ONLY "public"."message_user_actions"
    ADD CONSTRAINT "message_user_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_user_reports"
    ADD CONSTRAINT "message_user_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."move_out_requests"
    ADD CONSTRAINT "move_out_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_items"
    ADD CONSTRAINT "payment_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_receipts"
    ADD CONSTRAINT "payment_receipts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_receipts"
    ADD CONSTRAINT "payment_receipts_receipt_number_key" UNIQUE ("receipt_number");



ALTER TABLE ONLY "public"."payment_workflow_audit_events"
    ADD CONSTRAINT "payment_workflow_audit_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_views"
    ADD CONSTRAINT "post_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_environment_policies"
    ADD CONSTRAINT "property_environment_policies_pkey" PRIMARY KEY ("property_id");



ALTER TABLE ONLY "public"."saved_properties"
    ADD CONSTRAINT "saved_properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenant_intake_invite_events"
    ADD CONSTRAINT "tenant_intake_invite_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenant_intake_invites"
    ADD CONSTRAINT "tenant_intake_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenant_intake_invites"
    ADD CONSTRAINT "tenant_intake_invites_public_token_key" UNIQUE ("public_token");



ALTER TABLE ONLY "public"."tenant_intake_invites"
    ADD CONSTRAINT "tenant_intake_invites_token_hash_key" UNIQUE ("token_hash");



ALTER TABLE ONLY "public"."tenant_product_tour_events"
    ADD CONSTRAINT "tenant_product_tour_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenant_product_tour_states"
    ADD CONSTRAINT "tenant_product_tour_states_pkey" PRIMARY KEY ("tenant_id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "unique_participant" UNIQUE ("conversation_id", "user_id");



ALTER TABLE ONLY "public"."landlord_applications"
    ADD CONSTRAINT "unique_pending_application" UNIQUE ("profile_id", "status");



ALTER TABLE ONLY "public"."saved_properties"
    ADD CONSTRAINT "unique_saved" UNIQUE ("user_id", "property_id");



ALTER TABLE ONLY "public"."unit_environment_overrides"
    ADD CONSTRAINT "unit_environment_overrides_pkey" PRIMARY KEY ("unit_id");



ALTER TABLE ONLY "public"."unit_transfer_requests"
    ADD CONSTRAINT "unit_transfer_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."units"
    ADD CONSTRAINT "units_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."utility_configs"
    ADD CONSTRAINT "utility_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."utility_readings"
    ADD CONSTRAINT "utility_readings_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_application_payment_audit_application" ON "public"."application_payment_audit_events" USING "btree" ("application_id", "created_at" DESC);



CREATE INDEX "idx_application_payment_requests_application" ON "public"."application_payment_requests" USING "btree" ("application_id", "status");



CREATE INDEX "idx_application_payment_requests_landlord" ON "public"."application_payment_requests" USING "btree" ("landlord_id", "status");



CREATE INDEX "idx_applications_applicant" ON "public"."applications" USING "btree" ("applicant_id");



CREATE INDEX "idx_applications_applicant_email" ON "public"."applications" USING "btree" ("applicant_email");



CREATE INDEX "idx_applications_application_source" ON "public"."applications" USING "btree" ("application_source");



CREATE INDEX "idx_applications_created_by" ON "public"."applications" USING "btree" ("created_by");



CREATE INDEX "idx_applications_invite_id" ON "public"."applications" USING "btree" ("invite_id");



CREATE INDEX "idx_applications_landlord" ON "public"."applications" USING "btree" ("landlord_id");



CREATE INDEX "idx_applications_lease_id" ON "public"."applications" USING "btree" ("lease_id");



CREATE INDEX "idx_applications_payment_pending_expiry" ON "public"."applications" USING "btree" ("payment_pending_expires_at") WHERE ("payment_pending_expires_at" IS NOT NULL);



CREATE INDEX "idx_applications_status" ON "public"."applications" USING "btree" ("status");



CREATE INDEX "idx_applications_unit" ON "public"."applications" USING "btree" ("unit_id");



CREATE INDEX "idx_community_comments_post" ON "public"."community_comments" USING "btree" ("post_id", "created_at");



CREATE INDEX "idx_community_photos_album" ON "public"."community_photos" USING "btree" ("album_id", "display_order");



CREATE INDEX "idx_community_poll_votes_poll" ON "public"."community_poll_votes" USING "btree" ("poll_id");



CREATE INDEX "idx_community_posts_approved" ON "public"."community_posts" USING "btree" ("is_approved", "status", "created_at" DESC);



CREATE INDEX "idx_community_posts_property_approved" ON "public"."community_posts" USING "btree" ("property_id", "is_approved", "created_at" DESC);



CREATE INDEX "idx_community_posts_property_created" ON "public"."community_posts" USING "btree" ("property_id", "created_at" DESC);



CREATE INDEX "idx_community_reactions_post_user" ON "public"."community_reactions" USING "btree" ("post_id", "user_id");



CREATE INDEX "idx_content_reports_post" ON "public"."content_reports" USING "btree" ("post_id");



CREATE INDEX "idx_content_reports_reporter" ON "public"."content_reports" USING "btree" ("reporter_id");



CREATE INDEX "idx_conv_participants_conv" ON "public"."conversation_participants" USING "btree" ("conversation_id");



CREATE INDEX "idx_conv_participants_user" ON "public"."conversation_participants" USING "btree" ("user_id");



CREATE INDEX "idx_geo_locations_full_label_trgm" ON "public"."geo_locations" USING "gin" ("full_label" "public"."gin_trgm_ops");



CREATE INDEX "idx_geo_locations_name_trgm" ON "public"."geo_locations" USING "gin" ("name" "public"."gin_trgm_ops");



CREATE INDEX "idx_geo_locations_type" ON "public"."geo_locations" USING "btree" ("type");



CREATE INDEX "idx_iris_chat_messages_user_created_at" ON "public"."iris_chat_messages" USING "btree" ("user_id", "created_at");



CREATE INDEX "idx_landlord_inquiry_actions_inquiry" ON "public"."landlord_inquiry_actions" USING "btree" ("inquiry_id");



CREATE INDEX "idx_landlord_inquiry_actions_landlord" ON "public"."landlord_inquiry_actions" USING "btree" ("landlord_id", "updated_at" DESC);



CREATE INDEX "idx_landlord_payment_destinations_landlord" ON "public"."landlord_payment_destinations" USING "btree" ("landlord_id");



CREATE INDEX "idx_landlord_reviews_landlord_created" ON "public"."landlord_reviews" USING "btree" ("landlord_id", "created_at" DESC);



CREATE INDEX "idx_landlord_reviews_tenant_created" ON "public"."landlord_reviews" USING "btree" ("tenant_id", "created_at" DESC);



CREATE INDEX "idx_landlord_statistics_exports_landlord_created" ON "public"."landlord_statistics_exports" USING "btree" ("landlord_id", "created_at" DESC);



CREATE INDEX "idx_lease_signing_audit_event_type" ON "public"."lease_signing_audit" USING "btree" ("event_type", "created_at" DESC);



CREATE INDEX "idx_lease_signing_audit_lease_id" ON "public"."lease_signing_audit" USING "btree" ("lease_id", "created_at" DESC);



CREATE INDEX "idx_leases_landlord" ON "public"."leases" USING "btree" ("landlord_id");



CREATE INDEX "idx_leases_signing_link_token_hash" ON "public"."leases" USING "btree" ("signing_link_token_hash") WHERE ("signing_link_token_hash" IS NOT NULL);



CREATE INDEX "idx_leases_status" ON "public"."leases" USING "btree" ("status");



CREATE INDEX "idx_leases_tenant" ON "public"."leases" USING "btree" ("tenant_id");



CREATE INDEX "idx_leases_unit" ON "public"."leases" USING "btree" ("unit_id");



CREATE INDEX "idx_listings_landlord_created" ON "public"."listings" USING "btree" ("landlord_id", "created_at" DESC);



CREATE INDEX "idx_listings_property" ON "public"."listings" USING "btree" ("property_id");



CREATE INDEX "idx_listings_status" ON "public"."listings" USING "btree" ("status");



CREATE INDEX "idx_listings_unit" ON "public"."listings" USING "btree" ("unit_id");



CREATE INDEX "idx_maintenance_ai_triage_hash" ON "public"."maintenance_requests" USING "btree" ("ai_triage_hash");



CREATE INDEX "idx_maintenance_landlord" ON "public"."maintenance_requests" USING "btree" ("landlord_id");



CREATE INDEX "idx_maintenance_status" ON "public"."maintenance_requests" USING "btree" ("status");



CREATE INDEX "idx_maintenance_tenant" ON "public"."maintenance_requests" USING "btree" ("tenant_id");



CREATE INDEX "idx_message_moderation_banned_terms_active" ON "public"."message_moderation_banned_terms" USING "btree" ("is_active", "created_at" DESC);



CREATE UNIQUE INDEX "idx_message_moderation_banned_terms_normalized_unique" ON "public"."message_moderation_banned_terms" USING "btree" ("normalized_term");



CREATE INDEX "idx_message_user_actions_actor_target" ON "public"."message_user_actions" USING "btree" ("actor_user_id", "target_user_id");



CREATE INDEX "idx_message_user_reports_reporter_created" ON "public"."message_user_reports" USING "btree" ("reporter_user_id", "created_at" DESC);



CREATE INDEX "idx_message_user_reports_target" ON "public"."message_user_reports" USING "btree" ("target_user_id", "created_at" DESC);



CREATE INDEX "idx_messages_conversation" ON "public"."messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_messages_created_at" ON "public"."messages" USING "btree" ("created_at");



CREATE INDEX "idx_messages_sender" ON "public"."messages" USING "btree" ("sender_id");



CREATE INDEX "idx_move_out_lease" ON "public"."move_out_requests" USING "btree" ("lease_id");



CREATE INDEX "idx_move_out_tenant" ON "public"."move_out_requests" USING "btree" ("tenant_id");



CREATE INDEX "idx_notifications_read" ON "public"."notifications" USING "btree" ("user_id", "read");



CREATE INDEX "idx_notifications_user" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_payment_items_payment" ON "public"."payment_items" USING "btree" ("payment_id");



CREATE INDEX "idx_payment_receipts_payment" ON "public"."payment_receipts" USING "btree" ("payment_id");



CREATE UNIQUE INDEX "idx_payment_receipts_unique_payment" ON "public"."payment_receipts" USING "btree" ("payment_id");



CREATE UNIQUE INDEX "idx_payment_workflow_audit_idempotency" ON "public"."payment_workflow_audit_events" USING "btree" ("payment_id", "idempotency_key") WHERE ("idempotency_key" IS NOT NULL);



CREATE INDEX "idx_payment_workflow_audit_payment" ON "public"."payment_workflow_audit_events" USING "btree" ("payment_id", "created_at" DESC);



CREATE INDEX "idx_payments_due_date" ON "public"."payments" USING "btree" ("due_date");



CREATE UNIQUE INDEX "idx_payments_invoice_number" ON "public"."payments" USING "btree" ("invoice_number") WHERE ("invoice_number" IS NOT NULL);



CREATE INDEX "idx_payments_landlord" ON "public"."payments" USING "btree" ("landlord_id");



CREATE INDEX "idx_payments_lease" ON "public"."payments" USING "btree" ("lease_id");



CREATE INDEX "idx_payments_status" ON "public"."payments" USING "btree" ("status");



CREATE INDEX "idx_payments_tenant" ON "public"."payments" USING "btree" ("tenant_id");



CREATE UNIQUE INDEX "idx_payments_unique_billing_cycle" ON "public"."payments" USING "btree" ("lease_id", "billing_cycle") WHERE ("billing_cycle" IS NOT NULL);



CREATE UNIQUE INDEX "idx_post_views_daily_unique" ON "public"."post_views" USING "btree" ("post_id", COALESCE(("user_id")::"text", "session_id"), "view_day");



CREATE INDEX "idx_post_views_post" ON "public"."post_views" USING "btree" ("post_id");



CREATE INDEX "idx_post_views_user_session" ON "public"."post_views" USING "btree" ("post_id", "user_id", "session_id");



CREATE INDEX "idx_properties_address_trgm" ON "public"."properties" USING "gin" ("address" "public"."gin_trgm_ops");



CREATE INDEX "idx_properties_city" ON "public"."properties" USING "btree" ("city");



CREATE INDEX "idx_properties_city_trgm" ON "public"."properties" USING "gin" ("city" "public"."gin_trgm_ops");



CREATE INDEX "idx_properties_landlord" ON "public"."properties" USING "btree" ("landlord_id");



CREATE INDEX "idx_properties_name_trgm" ON "public"."properties" USING "gin" ("name" "public"."gin_trgm_ops");



CREATE INDEX "idx_properties_type" ON "public"."properties" USING "btree" ("type");



CREATE INDEX "idx_saved_properties_user" ON "public"."saved_properties" USING "btree" ("user_id");



CREATE INDEX "idx_tenant_intake_invite_events_invite_id" ON "public"."tenant_intake_invite_events" USING "btree" ("invite_id");



CREATE INDEX "idx_tenant_intake_invites_landlord_id" ON "public"."tenant_intake_invites" USING "btree" ("landlord_id");



CREATE INDEX "idx_tenant_intake_invites_property_id" ON "public"."tenant_intake_invites" USING "btree" ("property_id");



CREATE INDEX "idx_tenant_intake_invites_status" ON "public"."tenant_intake_invites" USING "btree" ("status");



CREATE INDEX "idx_tenant_intake_invites_unit_id" ON "public"."tenant_intake_invites" USING "btree" ("unit_id");



CREATE INDEX "idx_tenant_product_tour_events_tenant_created" ON "public"."tenant_product_tour_events" USING "btree" ("tenant_id", "created_at" DESC);



CREATE INDEX "idx_tenant_product_tour_events_type_created" ON "public"."tenant_product_tour_events" USING "btree" ("event_type", "created_at" DESC);



CREATE INDEX "idx_tenant_product_tour_states_last_event" ON "public"."tenant_product_tour_states" USING "btree" ("last_event_at" DESC) WHERE ("last_event_at" IS NOT NULL);



CREATE INDEX "idx_tenant_product_tour_states_status" ON "public"."tenant_product_tour_states" USING "btree" ("status", "updated_at" DESC);



CREATE INDEX "idx_unit_transfer_requests_landlord" ON "public"."unit_transfer_requests" USING "btree" ("landlord_id");



CREATE INDEX "idx_unit_transfer_requests_property" ON "public"."unit_transfer_requests" USING "btree" ("property_id");



CREATE INDEX "idx_unit_transfer_requests_requested_unit" ON "public"."unit_transfer_requests" USING "btree" ("requested_unit_id");



CREATE INDEX "idx_unit_transfer_requests_tenant" ON "public"."unit_transfer_requests" USING "btree" ("tenant_id");



CREATE INDEX "idx_units_property" ON "public"."units" USING "btree" ("property_id");



CREATE INDEX "idx_units_status" ON "public"."units" USING "btree" ("status");



CREATE INDEX "idx_utility_configs_property" ON "public"."utility_configs" USING "btree" ("property_id", "unit_id", "utility_type", "is_active");



CREATE UNIQUE INDEX "idx_utility_configs_scope_period" ON "public"."utility_configs" USING "btree" ("property_id", COALESCE("unit_id", '00000000-0000-0000-0000-000000000000'::"uuid"), "utility_type", "effective_from");



CREATE INDEX "idx_utility_readings_lease" ON "public"."utility_readings" USING "btree" ("lease_id", "utility_type", "billing_period_start" DESC);



CREATE INDEX "idx_utility_readings_payment" ON "public"."utility_readings" USING "btree" ("payment_id");



CREATE UNIQUE INDEX "idx_utility_readings_unique_period" ON "public"."utility_readings" USING "btree" ("unit_id", "utility_type", "billing_period_start", "billing_period_end");



CREATE UNIQUE INDEX "uniq_pending_transfer_per_tenant_property" ON "public"."unit_transfer_requests" USING "btree" ("tenant_id", "property_id") WHERE ("status" = 'pending'::"public"."unit_transfer_status");



CREATE OR REPLACE TRIGGER "on_lease_status_change" AFTER UPDATE OF "status" ON "public"."leases" FOR EACH ROW EXECUTE FUNCTION "public"."handle_lease_status_change"();



CREATE OR REPLACE TRIGGER "on_new_message" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_message"();



CREATE OR REPLACE TRIGGER "trg_application_payment_requests_updated_at" BEFORE UPDATE ON "public"."application_payment_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_applications_updated_at" BEFORE UPDATE ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_conversations_updated_at" BEFORE UPDATE ON "public"."conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_leases_updated_at" BEFORE UPDATE ON "public"."leases" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_listings_updated_at" BEFORE UPDATE ON "public"."listings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_maintenance_updated_at" BEFORE UPDATE ON "public"."maintenance_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_message_moderation_banned_terms_updated_at" BEFORE UPDATE ON "public"."message_moderation_banned_terms" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_move_out_updated_at" BEFORE UPDATE ON "public"."move_out_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_payment_receipts_immutable" BEFORE UPDATE ON "public"."payment_receipts" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_payment_receipt_update"();



CREATE OR REPLACE TRIGGER "trg_payments_sync_compat_status" BEFORE INSERT OR UPDATE OF "workflow_status" ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."sync_compat_payment_status"();



CREATE OR REPLACE TRIGGER "trg_payments_updated_at" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_properties_updated_at" BEFORE UPDATE ON "public"."properties" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_tenant_intake_invites_updated_at" BEFORE UPDATE ON "public"."tenant_intake_invites" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_tenant_product_tour_states_updated_at" BEFORE UPDATE ON "public"."tenant_product_tour_states" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_unit_transfer_requests_updated_at" BEFORE UPDATE ON "public"."unit_transfer_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_units_updated_at" BEFORE UPDATE ON "public"."units" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_lease_signature_timestamps" BEFORE UPDATE ON "public"."leases" FOR EACH ROW WHEN ((("new"."tenant_signature" IS DISTINCT FROM "old"."tenant_signature") OR ("new"."landlord_signature" IS DISTINCT FROM "old"."landlord_signature"))) EXECUTE FUNCTION "public"."update_lease_signature_timestamps"();



CREATE OR REPLACE TRIGGER "trigger_validate_lease_status_transition" BEFORE UPDATE OF "status" ON "public"."leases" FOR EACH ROW WHEN (("new"."status" IS DISTINCT FROM "old"."status")) EXECUTE FUNCTION "public"."validate_lease_status_transition"();



ALTER TABLE ONLY "public"."application_payment_audit_events"
    ADD CONSTRAINT "application_payment_audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."application_payment_audit_events"
    ADD CONSTRAINT "application_payment_audit_events_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application_payment_audit_events"
    ADD CONSTRAINT "application_payment_audit_events_payment_request_id_fkey" FOREIGN KEY ("payment_request_id") REFERENCES "public"."application_payment_requests"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."application_payment_requests"
    ADD CONSTRAINT "application_payment_requests_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application_payment_requests"
    ADD CONSTRAINT "application_payment_requests_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application_payment_requests"
    ADD CONSTRAINT "application_payment_requests_linked_payment_id_fkey" FOREIGN KEY ("linked_payment_id") REFERENCES "public"."payments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."application_payment_requests"
    ADD CONSTRAINT "application_payment_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_invite_id_fkey" FOREIGN KEY ("invite_id") REFERENCES "public"."tenant_intake_invites"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_albums"
    ADD CONSTRAINT "community_albums_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_albums"
    ADD CONSTRAINT "community_albums_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id");



ALTER TABLE ONLY "public"."community_comments"
    ADD CONSTRAINT "community_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."community_comments"
    ADD CONSTRAINT "community_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."community_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_comments"
    ADD CONSTRAINT "community_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_photos"
    ADD CONSTRAINT "community_photos_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."community_albums"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_photos"
    ADD CONSTRAINT "community_photos_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."community_poll_votes"
    ADD CONSTRAINT "community_poll_votes_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "public"."community_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_poll_votes"
    ADD CONSTRAINT "community_poll_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."community_posts"
    ADD CONSTRAINT "community_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."community_posts"
    ADD CONSTRAINT "community_posts_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id");



ALTER TABLE ONLY "public"."community_reactions"
    ADD CONSTRAINT "community_reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_reactions"
    ADD CONSTRAINT "community_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."content_reports"
    ADD CONSTRAINT "content_reports_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_reports"
    ADD CONSTRAINT "content_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."content_reports"
    ADD CONSTRAINT "content_reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."iris_chat_messages"
    ADD CONSTRAINT "iris_chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."landlord_applications"
    ADD CONSTRAINT "landlord_applications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."landlord_inquiry_actions"
    ADD CONSTRAINT "landlord_inquiry_actions_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "public"."applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."landlord_inquiry_actions"
    ADD CONSTRAINT "landlord_inquiry_actions_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."landlord_payment_destinations"
    ADD CONSTRAINT "landlord_payment_destinations_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."landlord_reviews"
    ADD CONSTRAINT "landlord_reviews_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."landlord_reviews"
    ADD CONSTRAINT "landlord_reviews_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."landlord_reviews"
    ADD CONSTRAINT "landlord_reviews_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."landlord_statistics_exports"
    ADD CONSTRAINT "landlord_statistics_exports_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lease_signing_audit"
    ADD CONSTRAINT "lease_signing_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."lease_signing_audit"
    ADD CONSTRAINT "lease_signing_audit_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leases"
    ADD CONSTRAINT "leases_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."leases"
    ADD CONSTRAINT "leases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."leases"
    ADD CONSTRAINT "leases_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_moderation_banned_terms"
    ADD CONSTRAINT "message_moderation_banned_terms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."message_moderation_banned_terms"
    ADD CONSTRAINT "message_moderation_banned_terms_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."message_user_reports"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."message_user_actions"
    ADD CONSTRAINT "message_user_actions_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_user_actions"
    ADD CONSTRAINT "message_user_actions_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_user_reports"
    ADD CONSTRAINT "message_user_reports_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."message_user_reports"
    ADD CONSTRAINT "message_user_reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_user_reports"
    ADD CONSTRAINT "message_user_reports_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."move_out_requests"
    ADD CONSTRAINT "move_out_requests_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."move_out_requests"
    ADD CONSTRAINT "move_out_requests_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."move_out_requests"
    ADD CONSTRAINT "move_out_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_items"
    ADD CONSTRAINT "payment_items_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_items"
    ADD CONSTRAINT "payment_items_reading_id_fkey" FOREIGN KEY ("reading_id") REFERENCES "public"."utility_readings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_receipts"
    ADD CONSTRAINT "payment_receipts_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_receipts"
    ADD CONSTRAINT "payment_receipts_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_receipts"
    ADD CONSTRAINT "payment_receipts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_receipts"
    ADD CONSTRAINT "payment_receipts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_workflow_audit_events"
    ADD CONSTRAINT "payment_workflow_audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_workflow_audit_events"
    ADD CONSTRAINT "payment_workflow_audit_events_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_last_action_by_fkey" FOREIGN KEY ("last_action_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."post_views"
    ADD CONSTRAINT "post_views_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_views"
    ADD CONSTRAINT "post_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_environment_policies"
    ADD CONSTRAINT "property_environment_policies_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_environment_policies"
    ADD CONSTRAINT "property_environment_policies_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."saved_properties"
    ADD CONSTRAINT "saved_properties_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_properties"
    ADD CONSTRAINT "saved_properties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_intake_invite_events"
    ADD CONSTRAINT "tenant_intake_invite_events_invite_id_fkey" FOREIGN KEY ("invite_id") REFERENCES "public"."tenant_intake_invites"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_intake_invites"
    ADD CONSTRAINT "tenant_intake_invites_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_intake_invites"
    ADD CONSTRAINT "tenant_intake_invites_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_intake_invites"
    ADD CONSTRAINT "tenant_intake_invites_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_product_tour_events"
    ADD CONSTRAINT "tenant_product_tour_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_product_tour_states"
    ADD CONSTRAINT "tenant_product_tour_states_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."unit_environment_overrides"
    ADD CONSTRAINT "unit_environment_overrides_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."unit_transfer_requests"
    ADD CONSTRAINT "unit_transfer_requests_current_unit_id_fkey" FOREIGN KEY ("current_unit_id") REFERENCES "public"."units"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."unit_transfer_requests"
    ADD CONSTRAINT "unit_transfer_requests_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."unit_transfer_requests"
    ADD CONSTRAINT "unit_transfer_requests_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."unit_transfer_requests"
    ADD CONSTRAINT "unit_transfer_requests_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."unit_transfer_requests"
    ADD CONSTRAINT "unit_transfer_requests_requested_unit_id_fkey" FOREIGN KEY ("requested_unit_id") REFERENCES "public"."units"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."unit_transfer_requests"
    ADD CONSTRAINT "unit_transfer_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."units"
    ADD CONSTRAINT "units_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."utility_configs"
    ADD CONSTRAINT "utility_configs_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."utility_configs"
    ADD CONSTRAINT "utility_configs_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."utility_configs"
    ADD CONSTRAINT "utility_configs_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."utility_readings"
    ADD CONSTRAINT "utility_readings_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."utility_readings"
    ADD CONSTRAINT "utility_readings_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."utility_readings"
    ADD CONSTRAINT "utility_readings_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."utility_readings"
    ADD CONSTRAINT "utility_readings_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."utility_readings"
    ADD CONSTRAINT "utility_readings_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can insert banned moderation terms" ON "public"."message_moderation_banned_terms" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can update banned moderation terms" ON "public"."message_moderation_banned_terms" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can update landlord applications" ON "public"."landlord_applications" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can view all landlord applications" ON "public"."landlord_applications" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can view all product tour events" ON "public"."tenant_product_tour_events" FOR SELECT TO "authenticated" USING (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can view all product tour states" ON "public"."tenant_product_tour_states" FOR SELECT TO "authenticated" USING (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can view all profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can view banned moderation terms" ON "public"."message_moderation_banned_terms" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Albums visible with published posts" ON "public"."community_albums" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."community_posts"
  WHERE (("community_posts"."id" = "community_albums"."post_id") AND ("community_posts"."is_approved" = true) AND ("community_posts"."status" = 'published'::"public"."post_status_enum")))));



CREATE POLICY "Applicants can update own applications" ON "public"."applications" FOR UPDATE USING (("auth"."uid"() = "applicant_id"));



CREATE POLICY "Applicants can view own applications" ON "public"."applications" FOR SELECT USING (("auth"."uid"() = "applicant_id"));



CREATE POLICY "Authenticated users can add participants" ON "public"."conversation_participants" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can comment" ON "public"."community_comments" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can create applications" ON "public"."applications" FOR INSERT WITH CHECK (("auth"."uid"() = "applicant_id"));



CREATE POLICY "Authenticated users can create conversations" ON "public"."conversations" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can create reports" ON "public"."content_reports" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ("reporter_id" = "auth"."uid"())));



CREATE POLICY "Authenticated users can view all profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authors can view post stats" ON "public"."post_views" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."community_posts"
  WHERE (("community_posts"."id" = "post_views"."post_id") AND ("community_posts"."author_id" = "auth"."uid"())))));



CREATE POLICY "Comments visible with post" ON "public"."community_comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."community_posts"
  WHERE (("community_posts"."id" = "community_comments"."post_id") AND ("community_posts"."is_approved" = true) AND ("community_posts"."status" = 'published'::"public"."post_status_enum")))));



CREATE POLICY "Geo locations are viewable by everyone" ON "public"."geo_locations" FOR SELECT USING (true);



CREATE POLICY "Landlord can update reports" ON "public"."content_reports" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."community_posts"
     JOIN "public"."properties" ON (("properties"."id" = "community_posts"."property_id")))
  WHERE (("community_posts"."id" = "content_reports"."post_id") AND ("properties"."landlord_id" = "auth"."uid"())))));



CREATE POLICY "Landlords can create leases" ON "public"."leases" FOR INSERT WITH CHECK (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can create own inquiry actions" ON "public"."landlord_inquiry_actions" FOR INSERT WITH CHECK ((("auth"."uid"() = "landlord_id") AND (EXISTS ( SELECT 1
   FROM "public"."applications"
  WHERE (("applications"."id" = "landlord_inquiry_actions"."inquiry_id") AND ("applications"."landlord_id" = "auth"."uid"()))))));



CREATE POLICY "Landlords can create own listings" ON "public"."listings" FOR INSERT WITH CHECK (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can create walk-in applications" ON "public"."applications" FOR INSERT WITH CHECK ((("created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("public"."units" "u"
     JOIN "public"."properties" "p" ON (("p"."id" = "u"."property_id")))
  WHERE (("u"."id" = "applications"."unit_id") AND ("p"."landlord_id" = "auth"."uid"()))))));



CREATE POLICY "Landlords can delete own listings" ON "public"."listings" FOR DELETE USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can delete own payment destinations" ON "public"."landlord_payment_destinations" FOR DELETE USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can delete own properties" ON "public"."properties" FOR DELETE USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can delete own utility configs" ON "public"."utility_configs" FOR DELETE USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can delete own utility readings" ON "public"."utility_readings" FOR DELETE USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can delete units of own properties" ON "public"."units" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "units"."property_id") AND ("properties"."landlord_id" = "auth"."uid"())))));



CREATE POLICY "Landlords can insert own payment destinations" ON "public"."landlord_payment_destinations" FOR INSERT WITH CHECK (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can insert own payment receipts" ON "public"."payment_receipts" FOR INSERT WITH CHECK (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can insert own properties" ON "public"."properties" FOR INSERT WITH CHECK (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can insert own statistics exports" ON "public"."landlord_statistics_exports" FOR INSERT WITH CHECK (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can insert own utility configs" ON "public"."utility_configs" FOR INSERT WITH CHECK (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can insert own utility readings" ON "public"."utility_readings" FOR INSERT WITH CHECK (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can insert their own property policies" ON "public"."property_environment_policies" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."properties" "p"
  WHERE (("p"."id" = "property_environment_policies"."property_id") AND ("p"."landlord_id" = "auth"."uid"())))));



CREATE POLICY "Landlords can insert their own unit overrides" ON "public"."unit_environment_overrides" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."units" "u"
     JOIN "public"."properties" "p" ON (("u"."property_id" = "p"."id")))
  WHERE (("u"."id" = "unit_environment_overrides"."unit_id") AND ("p"."landlord_id" = "auth"."uid"())))));



CREATE POLICY "Landlords can manage albums" ON "public"."community_albums" USING (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."landlord_id" = "auth"."uid"()))));



CREATE POLICY "Landlords can manage own application payment requests" ON "public"."application_payment_requests" USING (("auth"."uid"() = "landlord_id")) WITH CHECK (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can manage photos" ON "public"."community_photos" USING (("album_id" IN ( SELECT "community_albums"."id"
   FROM "public"."community_albums"
  WHERE ("community_albums"."property_id" IN ( SELECT "properties"."id"
           FROM "public"."properties"
          WHERE ("properties"."landlord_id" = "auth"."uid"()))))));



CREATE POLICY "Landlords can manage units of own properties" ON "public"."units" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "units"."property_id") AND ("properties"."landlord_id" = "auth"."uid"())))));



CREATE POLICY "Landlords can select their own property policies" ON "public"."property_environment_policies" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."properties" "p"
  WHERE (("p"."id" = "property_environment_policies"."property_id") AND ("p"."landlord_id" = "auth"."uid"())))));



CREATE POLICY "Landlords can select their own unit overrides" ON "public"."unit_environment_overrides" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."units" "u"
     JOIN "public"."properties" "p" ON (("u"."property_id" = "p"."id")))
  WHERE (("u"."id" = "unit_environment_overrides"."unit_id") AND ("p"."landlord_id" = "auth"."uid"())))));



CREATE POLICY "Landlords can update applications for their units" ON "public"."applications" FOR UPDATE USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can update maintenance requests" ON "public"."maintenance_requests" FOR UPDATE USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can update move-out requests" ON "public"."move_out_requests" FOR UPDATE USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can update own inquiry actions" ON "public"."landlord_inquiry_actions" FOR UPDATE USING (("auth"."uid"() = "landlord_id")) WITH CHECK (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can update own leases" ON "public"."leases" FOR UPDATE USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can update own listings" ON "public"."listings" FOR UPDATE USING (("auth"."uid"() = "landlord_id")) WITH CHECK (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can update own payment destinations" ON "public"."landlord_payment_destinations" FOR UPDATE USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can update own properties" ON "public"."properties" FOR UPDATE USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can update own utility configs" ON "public"."utility_configs" FOR UPDATE USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can update own utility readings" ON "public"."utility_readings" FOR UPDATE USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can update their own property policies" ON "public"."property_environment_policies" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."properties" "p"
  WHERE (("p"."id" = "property_environment_policies"."property_id") AND ("p"."landlord_id" = "auth"."uid"())))));



CREATE POLICY "Landlords can update their own unit overrides" ON "public"."unit_environment_overrides" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."units" "u"
     JOIN "public"."properties" "p" ON (("u"."property_id" = "p"."id")))
  WHERE (("u"."id" = "unit_environment_overrides"."unit_id") AND ("p"."landlord_id" = "auth"."uid"())))));



CREATE POLICY "Landlords can update transfer requests" ON "public"."unit_transfer_requests" FOR UPDATE USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can update units of own properties" ON "public"."units" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "units"."property_id") AND ("properties"."landlord_id" = "auth"."uid"())))));



CREATE POLICY "Landlords can view applications for their units" ON "public"."applications" FOR SELECT USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can view audit for their leases" ON "public"."lease_signing_audit" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."leases"
  WHERE (("leases"."id" = "lease_signing_audit"."lease_id") AND ("leases"."landlord_id" = "auth"."uid"())))));



CREATE POLICY "Landlords can view maintenance requests for their properties" ON "public"."maintenance_requests" FOR SELECT USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can view move-out requests" ON "public"."move_out_requests" FOR SELECT USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can view own application payment audits" ON "public"."application_payment_audit_events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."applications"
  WHERE (("applications"."id" = "application_payment_audit_events"."application_id") AND ("applications"."landlord_id" = "auth"."uid"())))));



CREATE POLICY "Landlords can view own application payment requests" ON "public"."application_payment_requests" FOR SELECT USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can view own inquiry actions" ON "public"."landlord_inquiry_actions" FOR SELECT USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can view own leases" ON "public"."leases" FOR SELECT USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can view own listings" ON "public"."listings" FOR SELECT USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can view own payment destinations" ON "public"."landlord_payment_destinations" FOR SELECT USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can view own payment receipts" ON "public"."payment_receipts" FOR SELECT USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can view own payments" ON "public"."payments" FOR SELECT USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can view own reviews" ON "public"."landlord_reviews" FOR SELECT USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can view own statistics exports" ON "public"."landlord_statistics_exports" FOR SELECT USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can view own transfer requests" ON "public"."unit_transfer_requests" FOR SELECT USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can view own utility configs" ON "public"."utility_configs" FOR SELECT USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can view own utility readings" ON "public"."utility_readings" FOR SELECT USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can view product tour events for own tenants" ON "public"."tenant_product_tour_events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."leases"
  WHERE (("leases"."tenant_id" = "tenant_product_tour_events"."tenant_id") AND ("leases"."landlord_id" = "auth"."uid"())))));



CREATE POLICY "Landlords can view product tour state for own tenants" ON "public"."tenant_product_tour_states" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."leases"
  WHERE (("leases"."tenant_id" = "tenant_product_tour_states"."tenant_id") AND ("leases"."landlord_id" = "auth"."uid"())))));



CREATE POLICY "Management can approve resident posts" ON "public"."community_posts" FOR UPDATE TO "authenticated" USING ((("author_role" = 'tenant'::"public"."user_role") AND (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."landlord_id" = "auth"."uid"()))) OR ((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'admin'::"text")))) WITH CHECK ((("author_role" = 'tenant'::"public"."user_role") AND (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."landlord_id" = "auth"."uid"()))) OR ((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"))));



CREATE POLICY "Management can create community posts" ON "public"."community_posts" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ("author_id" = "auth"."uid"()) AND ("author_role" = 'landlord'::"public"."user_role") AND ("is_approved" = true) AND ("type" = ANY (ARRAY['announcement'::"public"."post_type_enum", 'discussion'::"public"."post_type_enum", 'poll'::"public"."post_type_enum", 'photo_album'::"public"."post_type_enum"])) AND (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."landlord_id" = "auth"."uid"()))) OR ((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"))));



CREATE POLICY "Management can view published community posts" ON "public"."community_posts" FOR SELECT TO "authenticated" USING ((("is_approved" = true) AND ("status" = 'published'::"public"."post_status_enum") AND (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."landlord_id" = "auth"."uid"()))) OR ((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"))));



CREATE POLICY "Management can view resident moderation queue" ON "public"."community_posts" FOR SELECT TO "authenticated" USING ((("author_role" = 'tenant'::"public"."user_role") AND ("is_approved" = false) AND (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."landlord_id" = "auth"."uid"()))) OR ((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"))));



CREATE POLICY "Participants can send messages" ON "public"."messages" FOR INSERT WITH CHECK ((("auth"."uid"() = "sender_id") AND (EXISTS ( SELECT 1
   FROM "public"."conversation_participants"
  WHERE (("conversation_participants"."conversation_id" = "messages"."conversation_id") AND ("conversation_participants"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Participants can view conversations" ON "public"."conversations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversation_participants"
  WHERE (("conversation_participants"."conversation_id" = "conversations"."id") AND ("conversation_participants"."user_id" = "auth"."uid"())))));



CREATE POLICY "Participants can view messages" ON "public"."messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversation_participants"
  WHERE (("conversation_participants"."conversation_id" = "messages"."conversation_id") AND ("conversation_participants"."user_id" = "auth"."uid"())))));



CREATE POLICY "Participants can view their participant records" ON "public"."conversation_participants" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Payment items follow payment access" ON "public"."payment_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."payments"
  WHERE (("payments"."id" = "payment_items"."payment_id") AND (("payments"."tenant_id" = "auth"."uid"()) OR ("payments"."landlord_id" = "auth"."uid"()))))));



CREATE POLICY "Payment items insert via payment owner" ON "public"."payment_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."payments"
  WHERE (("payments"."id" = "payment_items"."payment_id") AND (("payments"."tenant_id" = "auth"."uid"()) OR ("payments"."landlord_id" = "auth"."uid"()))))));



CREATE POLICY "Payment updates" ON "public"."payments" FOR UPDATE USING ((("auth"."uid"() = "tenant_id") OR ("auth"."uid"() = "landlord_id")));



CREATE POLICY "Photos visible with album" ON "public"."community_photos" FOR SELECT USING (("album_id" IN ( SELECT "community_albums"."id"
   FROM "public"."community_albums"
  WHERE (EXISTS ( SELECT 1
           FROM "public"."community_posts"
          WHERE (("community_posts"."id" = "community_albums"."post_id") AND ("community_posts"."is_approved" = true) AND ("community_posts"."status" = 'published'::"public"."post_status_enum")))))));



CREATE POLICY "Poll votes visible with post" ON "public"."community_poll_votes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."community_posts"
  WHERE (("community_posts"."id" = "community_poll_votes"."poll_id") AND ("community_posts"."is_approved" = true) AND ("community_posts"."status" = 'published'::"public"."post_status_enum")))));



CREATE POLICY "Post views insert allowed" ON "public"."post_views" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Properties are viewable by everyone" ON "public"."properties" FOR SELECT USING (true);



CREATE POLICY "Published listings are viewable by everyone" ON "public"."listings" FOR SELECT USING (("status" = 'published'::"public"."listing_status"));



CREATE POLICY "Reactions visible with post" ON "public"."community_reactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."community_posts"
  WHERE (("community_posts"."id" = "community_reactions"."post_id") AND ("community_posts"."is_approved" = true) AND ("community_posts"."status" = 'published'::"public"."post_status_enum")))));



CREATE POLICY "Recipient can update message read status" ON "public"."messages" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."conversation_participants"
  WHERE (("conversation_participants"."conversation_id" = "messages"."conversation_id") AND ("conversation_participants"."user_id" = "auth"."uid"())))));



CREATE POLICY "Reporter and property landlord can view reports" ON "public"."content_reports" FOR SELECT USING ((("reporter_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."community_posts"
     JOIN "public"."properties" ON (("properties"."id" = "community_posts"."property_id")))
  WHERE (("community_posts"."id" = "content_reports"."post_id") AND ("properties"."landlord_id" = "auth"."uid"()))))));



CREATE POLICY "System can create notifications" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "System can create payments" ON "public"."payments" FOR INSERT WITH CHECK ((("auth"."uid"() = "landlord_id") OR ("auth"."uid"() = "tenant_id")));



CREATE POLICY "System can insert application payment audits" ON "public"."application_payment_audit_events" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert audit events" ON "public"."lease_signing_audit" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can write payment workflow audits" ON "public"."payment_workflow_audit_events" FOR INSERT WITH CHECK (true);



CREATE POLICY "Tenant and landlord can view payment workflow audits" ON "public"."payment_workflow_audit_events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."payments"
  WHERE (("payments"."id" = "payment_workflow_audit_events"."payment_id") AND (("payments"."tenant_id" = "auth"."uid"()) OR ("payments"."landlord_id" = "auth"."uid"()))))));



CREATE POLICY "Tenants can create discussion posts for active lease property" ON "public"."community_posts" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ("author_id" = "auth"."uid"()) AND ("author_role" = 'tenant'::"public"."user_role") AND ("type" = 'discussion'::"public"."post_type_enum") AND ("is_approved" = false) AND ("is_moderated" = true) AND ("property_id" IN ( SELECT "units"."property_id"
   FROM ("public"."leases"
     JOIN "public"."units" ON (("units"."id" = "leases"."unit_id")))
  WHERE (("leases"."tenant_id" = "auth"."uid"()) AND ("leases"."status" = 'active'::"public"."lease_status"))))));



CREATE POLICY "Tenants can create lease-based landlord reviews" ON "public"."landlord_reviews" FOR INSERT WITH CHECK ((("auth"."uid"() = "tenant_id") AND (EXISTS ( SELECT 1
   FROM "public"."leases"
  WHERE (("leases"."id" = "landlord_reviews"."lease_id") AND ("leases"."tenant_id" = "auth"."uid"()) AND ("leases"."landlord_id" = "leases"."landlord_id"))))));



CREATE POLICY "Tenants can create maintenance requests" ON "public"."maintenance_requests" FOR INSERT WITH CHECK (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can create move-out requests" ON "public"."move_out_requests" FOR INSERT WITH CHECK (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can create own product tour state" ON "public"."tenant_product_tour_states" FOR INSERT WITH CHECK (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can create posts for their property" ON "public"."community_posts" FOR INSERT WITH CHECK ((("author_id" = "auth"."uid"()) AND ("property_id" IN ( SELECT "units"."property_id"
   FROM ("public"."leases"
     JOIN "public"."units" ON (("units"."id" = "leases"."unit_id")))
  WHERE (("leases"."tenant_id" = "auth"."uid"()) AND ("leases"."status" = 'active'::"public"."lease_status"))))));



CREATE POLICY "Tenants can create transfer requests" ON "public"."unit_transfer_requests" FOR INSERT WITH CHECK ((("auth"."uid"() = "tenant_id") AND (EXISTS ( SELECT 1
   FROM (("public"."leases" "l"
     JOIN "public"."units" "current_u" ON (("current_u"."id" = "l"."unit_id")))
     JOIN "public"."units" "requested_u" ON (("requested_u"."id" = "unit_transfer_requests"."requested_unit_id")))
  WHERE (("l"."id" = "unit_transfer_requests"."lease_id") AND ("l"."tenant_id" = "auth"."uid"()) AND ("l"."landlord_id" = "unit_transfer_requests"."landlord_id") AND ("l"."status" = 'active'::"public"."lease_status") AND ("current_u"."id" = "unit_transfer_requests"."current_unit_id") AND ("current_u"."property_id" = "unit_transfer_requests"."property_id") AND ("requested_u"."property_id" = "unit_transfer_requests"."property_id") AND ("requested_u"."status" = 'vacant'::"public"."unit_status"))))));



CREATE POLICY "Tenants can delete own posts" ON "public"."community_posts" FOR DELETE USING (("author_id" = "auth"."uid"()));



CREATE POLICY "Tenants can insert own product tour events" ON "public"."tenant_product_tour_events" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can manage own albums" ON "public"."community_albums" USING (("post_id" IN ( SELECT "community_posts"."id"
   FROM "public"."community_posts"
  WHERE ("community_posts"."author_id" = "auth"."uid"())))) WITH CHECK (("post_id" IN ( SELECT "community_posts"."id"
   FROM "public"."community_posts"
  WHERE ("community_posts"."author_id" = "auth"."uid"()))));



CREATE POLICY "Tenants can manage own photos" ON "public"."community_photos" USING (("uploaded_by" = "auth"."uid"())) WITH CHECK (("uploaded_by" = "auth"."uid"()));



CREATE POLICY "Tenants can update own leases for signing" ON "public"."leases" FOR UPDATE USING (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can update own maintenance requests" ON "public"."maintenance_requests" FOR UPDATE USING (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can update own posts" ON "public"."community_posts" FOR UPDATE USING (("author_id" = "auth"."uid"()));



CREATE POLICY "Tenants can update own product tour state" ON "public"."tenant_product_tour_states" FOR UPDATE USING (("auth"."uid"() = "tenant_id")) WITH CHECK (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can update own reviews" ON "public"."landlord_reviews" FOR UPDATE USING (("auth"."uid"() = "tenant_id")) WITH CHECK (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can view approved posts for their property" ON "public"."community_posts" FOR SELECT USING ((("is_approved" = true) AND ("status" = 'published'::"public"."post_status_enum") AND ("property_id" IN ( SELECT "units"."property_id"
   FROM ("public"."leases"
     JOIN "public"."units" ON (("units"."id" = "leases"."unit_id")))
  WHERE (("leases"."tenant_id" = "auth"."uid"()) AND ("leases"."status" = 'active'::"public"."lease_status"))))));



CREATE POLICY "Tenants can view own leases" ON "public"."leases" FOR SELECT USING (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can view own maintenance requests" ON "public"."maintenance_requests" FOR SELECT USING (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can view own move-out requests" ON "public"."move_out_requests" FOR SELECT USING (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can view own payment receipts" ON "public"."payment_receipts" FOR SELECT USING (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can view own payments" ON "public"."payments" FOR SELECT USING (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can view own pending posts" ON "public"."community_posts" FOR SELECT TO "authenticated" USING ((("author_id" = "auth"."uid"()) AND ("author_role" = 'tenant'::"public"."user_role") AND ("is_approved" = false) AND ("property_id" IN ( SELECT "units"."property_id"
   FROM ("public"."leases"
     JOIN "public"."units" ON (("units"."id" = "leases"."unit_id")))
  WHERE (("leases"."tenant_id" = "auth"."uid"()) AND ("leases"."status" = 'active'::"public"."lease_status"))))));



CREATE POLICY "Tenants can view own product tour events" ON "public"."tenant_product_tour_events" FOR SELECT USING (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can view own product tour state" ON "public"."tenant_product_tour_states" FOR SELECT USING (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can view own submitted reviews" ON "public"."landlord_reviews" FOR SELECT USING (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can view own transfer requests" ON "public"."unit_transfer_requests" FOR SELECT USING (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can view own utility readings" ON "public"."utility_readings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."leases"
  WHERE (("leases"."id" = "utility_readings"."lease_id") AND ("leases"."tenant_id" = "auth"."uid"())))));



CREATE POLICY "Tenants can view payment destinations for own leases" ON "public"."landlord_payment_destinations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."leases"
  WHERE (("leases"."landlord_id" = "landlord_payment_destinations"."landlord_id") AND ("leases"."tenant_id" = "auth"."uid"())))));



CREATE POLICY "Tenants can view utility configs for own leases" ON "public"."utility_configs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."leases"
     JOIN "public"."units" ON (("units"."id" = "leases"."unit_id")))
  WHERE (("leases"."tenant_id" = "auth"."uid"()) AND ("units"."property_id" = "utility_configs"."property_id") AND (("utility_configs"."unit_id" IS NULL) OR ("utility_configs"."unit_id" = "leases"."unit_id"))))));



CREATE POLICY "Units are viewable by everyone" ON "public"."units" FOR SELECT USING (true);



CREATE POLICY "Users can create own message actions" ON "public"."message_user_actions" FOR INSERT WITH CHECK (("auth"."uid"() = "actor_user_id"));



CREATE POLICY "Users can create own message reports" ON "public"."message_user_reports" FOR INSERT WITH CHECK (("auth"."uid"() = "reporter_user_id"));



CREATE POLICY "Users can create their own applications" ON "public"."landlord_applications" FOR INSERT WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can delete own community posts" ON "public"."community_posts" FOR DELETE TO "authenticated" USING (("author_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own iRis chat messages" ON "public"."iris_chat_messages" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own poll votes" ON "public"."community_poll_votes" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own reactions" ON "public"."community_reactions" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can save properties" ON "public"."saved_properties" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select override if they have an active lease" ON "public"."unit_environment_overrides" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."leases" "l"
  WHERE (("l"."unit_id" = "unit_environment_overrides"."unit_id") AND ("l"."tenant_id" = "auth"."uid"()) AND ("l"."status" = 'active'::"public"."lease_status")))));



CREATE POLICY "Users can select policy if they have an active lease" ON "public"."property_environment_policies" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."leases" "l"
     JOIN "public"."units" "u" ON (("l"."unit_id" = "u"."id")))
  WHERE (("u"."property_id" = "property_environment_policies"."property_id") AND ("l"."tenant_id" = "auth"."uid"()) AND ("l"."status" = 'active'::"public"."lease_status")))));



CREATE POLICY "Users can unsave properties" ON "public"."saved_properties" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own community posts" ON "public"."community_posts" FOR UPDATE TO "authenticated" USING (("author_id" = "auth"."uid"())) WITH CHECK ((("author_id" = "auth"."uid"()) AND (("author_role" <> 'landlord'::"public"."user_role") OR ("is_approved" = true)) AND (("author_role" <> 'tenant'::"public"."user_role") OR ("is_approved" = false))));



CREATE POLICY "Users can update own message actions" ON "public"."message_user_actions" FOR UPDATE USING (("auth"."uid"() = "actor_user_id")) WITH CHECK (("auth"."uid"() = "actor_user_id"));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own iRis chat messages" ON "public"."iris_chat_messages" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own message actions" ON "public"."message_user_actions" FOR SELECT USING (("auth"."uid"() = "actor_user_id"));



CREATE POLICY "Users can view own message reports" ON "public"."message_user_reports" FOR SELECT USING (("auth"."uid"() = "reporter_user_id"));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own saved properties" ON "public"."saved_properties" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own applications" ON "public"."landlord_applications" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "View co-participants" ON "public"."conversation_participants" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversation_participants" "cp"
  WHERE (("cp"."conversation_id" = "conversation_participants"."conversation_id") AND ("cp"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."application_payment_audit_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."application_payment_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_albums" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_poll_votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."geo_locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."iris_chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."landlord_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."landlord_inquiry_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."landlord_payment_destinations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."landlord_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."landlord_statistics_exports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lease_signing_audit" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."listings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."maintenance_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_moderation_banned_terms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_user_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_user_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."move_out_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_receipts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_workflow_audit_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_environment_policies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saved_properties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenant_intake_invite_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenant_intake_invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenant_product_tour_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenant_product_tour_states" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."unit_environment_overrides" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."unit_transfer_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."units" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."utility_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."utility_readings" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_lease_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_lease_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_lease_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_listing_metric"("p_listing_id" "uuid", "p_metric" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_listing_metric"("p_listing_id" "uuid", "p_metric" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_listing_metric"("p_listing_id" "uuid", "p_metric" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_post_view"("p_post_id" "uuid", "p_user_id" "uuid", "p_session_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_post_view"("p_post_id" "uuid", "p_user_id" "uuid", "p_session_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_post_view"("p_post_id" "uuid", "p_user_id" "uuid", "p_session_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_payment_receipt_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_payment_receipt_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_payment_receipt_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_compat_payment_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_compat_payment_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_compat_payment_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lease_signature_timestamps"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lease_signature_timestamps"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lease_signature_timestamps"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_lease_status_transition"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_lease_status_transition"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_lease_status_transition"() TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";


















GRANT ALL ON TABLE "public"."application_payment_audit_events" TO "anon";
GRANT ALL ON TABLE "public"."application_payment_audit_events" TO "authenticated";
GRANT ALL ON TABLE "public"."application_payment_audit_events" TO "service_role";



GRANT ALL ON TABLE "public"."application_payment_requests" TO "anon";
GRANT ALL ON TABLE "public"."application_payment_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."application_payment_requests" TO "service_role";



GRANT ALL ON TABLE "public"."applications" TO "anon";
GRANT ALL ON TABLE "public"."applications" TO "authenticated";
GRANT ALL ON TABLE "public"."applications" TO "service_role";



GRANT ALL ON TABLE "public"."community_albums" TO "anon";
GRANT ALL ON TABLE "public"."community_albums" TO "authenticated";
GRANT ALL ON TABLE "public"."community_albums" TO "service_role";



GRANT ALL ON TABLE "public"."community_comments" TO "anon";
GRANT ALL ON TABLE "public"."community_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."community_comments" TO "service_role";



GRANT ALL ON TABLE "public"."community_photos" TO "anon";
GRANT ALL ON TABLE "public"."community_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."community_photos" TO "service_role";



GRANT ALL ON TABLE "public"."community_poll_votes" TO "anon";
GRANT ALL ON TABLE "public"."community_poll_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."community_poll_votes" TO "service_role";



GRANT ALL ON TABLE "public"."community_posts" TO "anon";
GRANT ALL ON TABLE "public"."community_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."community_posts" TO "service_role";



GRANT ALL ON TABLE "public"."community_reactions" TO "anon";
GRANT ALL ON TABLE "public"."community_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."community_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."content_reports" TO "anon";
GRANT ALL ON TABLE "public"."content_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."content_reports" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_participants" TO "anon";
GRANT ALL ON TABLE "public"."conversation_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_participants" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."geo_locations" TO "anon";
GRANT ALL ON TABLE "public"."geo_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."geo_locations" TO "service_role";



GRANT ALL ON TABLE "public"."iris_chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."iris_chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."iris_chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."landlord_applications" TO "anon";
GRANT ALL ON TABLE "public"."landlord_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."landlord_applications" TO "service_role";



GRANT ALL ON TABLE "public"."landlord_inquiry_actions" TO "anon";
GRANT ALL ON TABLE "public"."landlord_inquiry_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."landlord_inquiry_actions" TO "service_role";



GRANT ALL ON TABLE "public"."landlord_payment_destinations" TO "anon";
GRANT ALL ON TABLE "public"."landlord_payment_destinations" TO "authenticated";
GRANT ALL ON TABLE "public"."landlord_payment_destinations" TO "service_role";



GRANT ALL ON TABLE "public"."landlord_reviews" TO "anon";
GRANT ALL ON TABLE "public"."landlord_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."landlord_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."landlord_statistics_exports" TO "anon";
GRANT ALL ON TABLE "public"."landlord_statistics_exports" TO "authenticated";
GRANT ALL ON TABLE "public"."landlord_statistics_exports" TO "service_role";



GRANT ALL ON TABLE "public"."lease_signing_audit" TO "anon";
GRANT ALL ON TABLE "public"."lease_signing_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."lease_signing_audit" TO "service_role";



GRANT ALL ON TABLE "public"."leases" TO "anon";
GRANT ALL ON TABLE "public"."leases" TO "authenticated";
GRANT ALL ON TABLE "public"."leases" TO "service_role";



GRANT ALL ON TABLE "public"."listings" TO "anon";
GRANT ALL ON TABLE "public"."listings" TO "authenticated";
GRANT ALL ON TABLE "public"."listings" TO "service_role";



GRANT ALL ON TABLE "public"."maintenance_requests" TO "anon";
GRANT ALL ON TABLE "public"."maintenance_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."maintenance_requests" TO "service_role";



GRANT ALL ON TABLE "public"."message_moderation_banned_terms" TO "anon";
GRANT ALL ON TABLE "public"."message_moderation_banned_terms" TO "authenticated";
GRANT ALL ON TABLE "public"."message_moderation_banned_terms" TO "service_role";



GRANT ALL ON TABLE "public"."message_user_actions" TO "anon";
GRANT ALL ON TABLE "public"."message_user_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."message_user_actions" TO "service_role";



GRANT ALL ON TABLE "public"."message_user_reports" TO "anon";
GRANT ALL ON TABLE "public"."message_user_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."message_user_reports" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."move_out_requests" TO "anon";
GRANT ALL ON TABLE "public"."move_out_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."move_out_requests" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."payment_items" TO "anon";
GRANT ALL ON TABLE "public"."payment_items" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_items" TO "service_role";



GRANT ALL ON TABLE "public"."payment_receipts" TO "anon";
GRANT ALL ON TABLE "public"."payment_receipts" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_receipts" TO "service_role";



GRANT ALL ON TABLE "public"."payment_workflow_audit_events" TO "anon";
GRANT ALL ON TABLE "public"."payment_workflow_audit_events" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_workflow_audit_events" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."post_views" TO "anon";
GRANT ALL ON TABLE "public"."post_views" TO "authenticated";
GRANT ALL ON TABLE "public"."post_views" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."properties" TO "anon";
GRANT ALL ON TABLE "public"."properties" TO "authenticated";
GRANT ALL ON TABLE "public"."properties" TO "service_role";



GRANT ALL ON TABLE "public"."property_environment_policies" TO "anon";
GRANT ALL ON TABLE "public"."property_environment_policies" TO "authenticated";
GRANT ALL ON TABLE "public"."property_environment_policies" TO "service_role";



GRANT ALL ON TABLE "public"."saved_properties" TO "anon";
GRANT ALL ON TABLE "public"."saved_properties" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_properties" TO "service_role";



GRANT ALL ON TABLE "public"."tenant_intake_invite_events" TO "anon";
GRANT ALL ON TABLE "public"."tenant_intake_invite_events" TO "authenticated";
GRANT ALL ON TABLE "public"."tenant_intake_invite_events" TO "service_role";



GRANT ALL ON TABLE "public"."tenant_intake_invites" TO "anon";
GRANT ALL ON TABLE "public"."tenant_intake_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."tenant_intake_invites" TO "service_role";



GRANT ALL ON TABLE "public"."tenant_product_tour_events" TO "anon";
GRANT ALL ON TABLE "public"."tenant_product_tour_events" TO "authenticated";
GRANT ALL ON TABLE "public"."tenant_product_tour_events" TO "service_role";



GRANT ALL ON TABLE "public"."tenant_product_tour_states" TO "anon";
GRANT ALL ON TABLE "public"."tenant_product_tour_states" TO "authenticated";
GRANT ALL ON TABLE "public"."tenant_product_tour_states" TO "service_role";



GRANT ALL ON TABLE "public"."unit_environment_overrides" TO "anon";
GRANT ALL ON TABLE "public"."unit_environment_overrides" TO "authenticated";
GRANT ALL ON TABLE "public"."unit_environment_overrides" TO "service_role";



GRANT ALL ON TABLE "public"."unit_transfer_requests" TO "anon";
GRANT ALL ON TABLE "public"."unit_transfer_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."unit_transfer_requests" TO "service_role";



GRANT ALL ON TABLE "public"."units" TO "anon";
GRANT ALL ON TABLE "public"."units" TO "authenticated";
GRANT ALL ON TABLE "public"."units" TO "service_role";



GRANT ALL ON TABLE "public"."utility_configs" TO "anon";
GRANT ALL ON TABLE "public"."utility_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."utility_configs" TO "service_role";



GRANT ALL ON TABLE "public"."utility_readings" TO "anon";
GRANT ALL ON TABLE "public"."utility_readings" TO "authenticated";
GRANT ALL ON TABLE "public"."utility_readings" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































