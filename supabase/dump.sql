


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






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."application_status" AS ENUM (
    'pending',
    'reviewing',
    'approved',
    'rejected',
    'withdrawn'
);


ALTER TYPE "public"."application_status" OWNER TO "postgres";


CREATE TYPE "public"."lease_status" AS ENUM (
    'draft',
    'pending_signature',
    'active',
    'expired',
    'terminated'
);


ALTER TYPE "public"."lease_status" OWNER TO "postgres";


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


CREATE TYPE "public"."payment_method" AS ENUM (
    'credit_card',
    'debit_card',
    'gcash',
    'maya',
    'bank_transfer',
    'cash'
);


ALTER TYPE "public"."payment_method" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'refunded'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."property_type" AS ENUM (
    'apartment',
    'condo',
    'house',
    'townhouse',
    'studio'
);


ALTER TYPE "public"."property_type" OWNER TO "postgres";


CREATE TYPE "public"."unit_status" AS ENUM (
    'vacant',
    'occupied',
    'maintenance'
);


ALTER TYPE "public"."unit_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'tenant',
    'landlord'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "unit_id" "uuid" NOT NULL,
    "applicant_id" "uuid" NOT NULL,
    "landlord_id" "uuid" NOT NULL,
    "status" "public"."application_status" DEFAULT 'pending'::"public"."application_status" NOT NULL,
    "message" "text",
    "monthly_income" numeric(12,2),
    "employment_status" "text",
    "move_in_date" "date",
    "documents" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."applications" OWNER TO "postgres";


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
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
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
    CONSTRAINT "lease_dates_valid" CHECK (("end_date" > "start_date"))
);


ALTER TABLE "public"."leases" OWNER TO "postgres";


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
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."maintenance_requests" OWNER TO "postgres";


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
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payment_items" OWNER TO "postgres";


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
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


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
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."properties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_properties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."saved_properties" OWNER TO "postgres";


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


ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."iris_chat_messages"
    ADD CONSTRAINT "iris_chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."landlord_applications"
    ADD CONSTRAINT "landlord_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."landlord_inquiry_actions"
    ADD CONSTRAINT "landlord_inquiry_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."landlord_inquiry_actions"
    ADD CONSTRAINT "landlord_inquiry_actions_unique" UNIQUE ("inquiry_id", "landlord_id");



ALTER TABLE ONLY "public"."landlord_reviews"
    ADD CONSTRAINT "landlord_reviews_one_per_lease" UNIQUE ("lease_id");



ALTER TABLE ONLY "public"."landlord_reviews"
    ADD CONSTRAINT "landlord_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."landlord_statistics_exports"
    ADD CONSTRAINT "landlord_statistics_exports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leases"
    ADD CONSTRAINT "leases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_properties"
    ADD CONSTRAINT "saved_properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "unique_application" UNIQUE ("unit_id", "applicant_id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "unique_participant" UNIQUE ("conversation_id", "user_id");



ALTER TABLE ONLY "public"."landlord_applications"
    ADD CONSTRAINT "unique_pending_application" UNIQUE ("profile_id", "status");



ALTER TABLE ONLY "public"."saved_properties"
    ADD CONSTRAINT "unique_saved" UNIQUE ("user_id", "property_id");



ALTER TABLE ONLY "public"."units"
    ADD CONSTRAINT "units_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_applications_applicant" ON "public"."applications" USING "btree" ("applicant_id");



CREATE INDEX "idx_applications_landlord" ON "public"."applications" USING "btree" ("landlord_id");



CREATE INDEX "idx_applications_status" ON "public"."applications" USING "btree" ("status");



CREATE INDEX "idx_applications_unit" ON "public"."applications" USING "btree" ("unit_id");



CREATE INDEX "idx_conv_participants_conv" ON "public"."conversation_participants" USING "btree" ("conversation_id");



CREATE INDEX "idx_conv_participants_user" ON "public"."conversation_participants" USING "btree" ("user_id");



CREATE INDEX "idx_iris_chat_messages_user_created_at" ON "public"."iris_chat_messages" USING "btree" ("user_id", "created_at");



CREATE INDEX "idx_landlord_inquiry_actions_inquiry" ON "public"."landlord_inquiry_actions" USING "btree" ("inquiry_id");



CREATE INDEX "idx_landlord_inquiry_actions_landlord" ON "public"."landlord_inquiry_actions" USING "btree" ("landlord_id", "updated_at" DESC);



CREATE INDEX "idx_landlord_reviews_landlord_created" ON "public"."landlord_reviews" USING "btree" ("landlord_id", "created_at" DESC);



CREATE INDEX "idx_landlord_reviews_tenant_created" ON "public"."landlord_reviews" USING "btree" ("tenant_id", "created_at" DESC);



CREATE INDEX "idx_landlord_statistics_exports_landlord_created" ON "public"."landlord_statistics_exports" USING "btree" ("landlord_id", "created_at" DESC);



CREATE INDEX "idx_leases_landlord" ON "public"."leases" USING "btree" ("landlord_id");



CREATE INDEX "idx_leases_status" ON "public"."leases" USING "btree" ("status");



CREATE INDEX "idx_leases_tenant" ON "public"."leases" USING "btree" ("tenant_id");



CREATE INDEX "idx_leases_unit" ON "public"."leases" USING "btree" ("unit_id");



CREATE INDEX "idx_maintenance_landlord" ON "public"."maintenance_requests" USING "btree" ("landlord_id");



CREATE INDEX "idx_maintenance_status" ON "public"."maintenance_requests" USING "btree" ("status");



CREATE INDEX "idx_maintenance_tenant" ON "public"."maintenance_requests" USING "btree" ("tenant_id");



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



CREATE INDEX "idx_payments_due_date" ON "public"."payments" USING "btree" ("due_date");



CREATE INDEX "idx_payments_landlord" ON "public"."payments" USING "btree" ("landlord_id");



CREATE INDEX "idx_payments_lease" ON "public"."payments" USING "btree" ("lease_id");



CREATE INDEX "idx_payments_status" ON "public"."payments" USING "btree" ("status");



CREATE INDEX "idx_payments_tenant" ON "public"."payments" USING "btree" ("tenant_id");



CREATE INDEX "idx_properties_city" ON "public"."properties" USING "btree" ("city");



CREATE INDEX "idx_properties_landlord" ON "public"."properties" USING "btree" ("landlord_id");



CREATE INDEX "idx_properties_type" ON "public"."properties" USING "btree" ("type");



CREATE INDEX "idx_saved_properties_user" ON "public"."saved_properties" USING "btree" ("user_id");



CREATE INDEX "idx_units_property" ON "public"."units" USING "btree" ("property_id");



CREATE INDEX "idx_units_status" ON "public"."units" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "on_lease_status_change" AFTER UPDATE OF "status" ON "public"."leases" FOR EACH ROW EXECUTE FUNCTION "public"."handle_lease_status_change"();



CREATE OR REPLACE TRIGGER "on_new_message" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_message"();



CREATE OR REPLACE TRIGGER "trg_applications_updated_at" BEFORE UPDATE ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_conversations_updated_at" BEFORE UPDATE ON "public"."conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_leases_updated_at" BEFORE UPDATE ON "public"."leases" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_maintenance_updated_at" BEFORE UPDATE ON "public"."maintenance_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_move_out_updated_at" BEFORE UPDATE ON "public"."move_out_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_payments_updated_at" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_properties_updated_at" BEFORE UPDATE ON "public"."properties" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_units_updated_at" BEFORE UPDATE ON "public"."units" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."landlord_reviews"
    ADD CONSTRAINT "landlord_reviews_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."landlord_reviews"
    ADD CONSTRAINT "landlord_reviews_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."landlord_reviews"
    ADD CONSTRAINT "landlord_reviews_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."landlord_statistics_exports"
    ADD CONSTRAINT "landlord_statistics_exports_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leases"
    ADD CONSTRAINT "leases_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."leases"
    ADD CONSTRAINT "leases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."leases"
    ADD CONSTRAINT "leases_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_properties"
    ADD CONSTRAINT "saved_properties_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_properties"
    ADD CONSTRAINT "saved_properties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."units"
    ADD CONSTRAINT "units_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



CREATE POLICY "Applicants can update own applications" ON "public"."applications" FOR UPDATE USING (("auth"."uid"() = "applicant_id"));



CREATE POLICY "Applicants can view own applications" ON "public"."applications" FOR SELECT USING (("auth"."uid"() = "applicant_id"));



CREATE POLICY "Authenticated users can add participants" ON "public"."conversation_participants" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can create applications" ON "public"."applications" FOR INSERT WITH CHECK (("auth"."uid"() = "applicant_id"));



CREATE POLICY "Authenticated users can create conversations" ON "public"."conversations" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can view all profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Landlords can create leases" ON "public"."leases" FOR INSERT WITH CHECK (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can create own inquiry actions" ON "public"."landlord_inquiry_actions" FOR INSERT WITH CHECK ((("auth"."uid"() = "landlord_id") AND (EXISTS ( SELECT 1
   FROM "public"."applications"
  WHERE (("applications"."id" = "landlord_inquiry_actions"."inquiry_id") AND ("applications"."landlord_id" = "auth"."uid"()))))));



CREATE POLICY "Landlords can delete own properties" ON "public"."properties" FOR DELETE USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can delete units of own properties" ON "public"."units" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "units"."property_id") AND ("properties"."landlord_id" = "auth"."uid"())))));



CREATE POLICY "Landlords can insert own properties" ON "public"."properties" FOR INSERT WITH CHECK (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can insert own statistics exports" ON "public"."landlord_statistics_exports" FOR INSERT WITH CHECK (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can manage units of own properties" ON "public"."units" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "units"."property_id") AND ("properties"."landlord_id" = "auth"."uid"())))));



CREATE POLICY "Landlords can update applications for their units" ON "public"."applications" FOR UPDATE USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can update maintenance requests" ON "public"."maintenance_requests" FOR UPDATE USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can update move-out requests" ON "public"."move_out_requests" FOR UPDATE USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can update own inquiry actions" ON "public"."landlord_inquiry_actions" FOR UPDATE USING (("auth"."uid"() = "landlord_id")) WITH CHECK (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can update own leases" ON "public"."leases" FOR UPDATE USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can update own properties" ON "public"."properties" FOR UPDATE USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can update units of own properties" ON "public"."units" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "units"."property_id") AND ("properties"."landlord_id" = "auth"."uid"())))));



CREATE POLICY "Landlords can view applications for their units" ON "public"."applications" FOR SELECT USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can view maintenance requests for their properties" ON "public"."maintenance_requests" FOR SELECT USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can view move-out requests" ON "public"."move_out_requests" FOR SELECT USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can view own inquiry actions" ON "public"."landlord_inquiry_actions" FOR SELECT USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can view own leases" ON "public"."leases" FOR SELECT USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can view own payments" ON "public"."payments" FOR SELECT USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can view own reviews" ON "public"."landlord_reviews" FOR SELECT USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Landlords can view own statistics exports" ON "public"."landlord_statistics_exports" FOR SELECT USING (("auth"."uid"() = "landlord_id"));



CREATE POLICY "Participants can send messages" ON "public"."messages" FOR INSERT WITH CHECK ((("auth"."uid"() = "sender_id") AND (EXISTS ( SELECT 1
   FROM "public"."conversation_participants"
  WHERE (("conversation_participants"."conversation_id" = "conversation_participants"."conversation_id") AND ("conversation_participants"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Participants can view conversations" ON "public"."conversations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversation_participants"
  WHERE (("conversation_participants"."conversation_id" = "conversation_participants"."id") AND ("conversation_participants"."user_id" = "auth"."uid"())))));



CREATE POLICY "Participants can view messages" ON "public"."messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversation_participants"
  WHERE (("conversation_participants"."conversation_id" = "conversation_participants"."conversation_id") AND ("conversation_participants"."user_id" = "auth"."uid"())))));



CREATE POLICY "Participants can view their participant records" ON "public"."conversation_participants" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Payment items follow payment access" ON "public"."payment_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."payments"
  WHERE (("payments"."id" = "payment_items"."payment_id") AND (("payments"."tenant_id" = "auth"."uid"()) OR ("payments"."landlord_id" = "auth"."uid"()))))));



CREATE POLICY "Payment items insert via payment owner" ON "public"."payment_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."payments"
  WHERE (("payments"."id" = "payment_items"."payment_id") AND (("payments"."tenant_id" = "auth"."uid"()) OR ("payments"."landlord_id" = "auth"."uid"()))))));



CREATE POLICY "Payment updates" ON "public"."payments" FOR UPDATE USING ((("auth"."uid"() = "tenant_id") OR ("auth"."uid"() = "landlord_id")));



CREATE POLICY "Properties are viewable by everyone" ON "public"."properties" FOR SELECT USING (true);



CREATE POLICY "Recipient can update message read status" ON "public"."messages" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."conversation_participants"
  WHERE (("conversation_participants"."conversation_id" = "conversation_participants"."conversation_id") AND ("conversation_participants"."user_id" = "auth"."uid"())))));



CREATE POLICY "System can create notifications" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "System can create payments" ON "public"."payments" FOR INSERT WITH CHECK ((("auth"."uid"() = "landlord_id") OR ("auth"."uid"() = "tenant_id")));



CREATE POLICY "Tenants can create lease-based landlord reviews" ON "public"."landlord_reviews" FOR INSERT WITH CHECK ((("auth"."uid"() = "tenant_id") AND (EXISTS ( SELECT 1
   FROM "public"."leases"
  WHERE (("leases"."id" = "landlord_reviews"."lease_id") AND ("leases"."tenant_id" = "auth"."uid"()) AND ("leases"."landlord_id" = "leases"."landlord_id"))))));



CREATE POLICY "Tenants can create maintenance requests" ON "public"."maintenance_requests" FOR INSERT WITH CHECK (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can create move-out requests" ON "public"."move_out_requests" FOR INSERT WITH CHECK (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can update own leases for signing" ON "public"."leases" FOR UPDATE USING (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can update own maintenance requests" ON "public"."maintenance_requests" FOR UPDATE USING (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can update own reviews" ON "public"."landlord_reviews" FOR UPDATE USING (("auth"."uid"() = "tenant_id")) WITH CHECK (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can view own leases" ON "public"."leases" FOR SELECT USING (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can view own maintenance requests" ON "public"."maintenance_requests" FOR SELECT USING (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can view own move-out requests" ON "public"."move_out_requests" FOR SELECT USING (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can view own payments" ON "public"."payments" FOR SELECT USING (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Tenants can view own submitted reviews" ON "public"."landlord_reviews" FOR SELECT USING (("auth"."uid"() = "tenant_id"));



CREATE POLICY "Units are viewable by everyone" ON "public"."units" FOR SELECT USING (true);



CREATE POLICY "Users can create own message actions" ON "public"."message_user_actions" FOR INSERT WITH CHECK (("auth"."uid"() = "actor_user_id"));



CREATE POLICY "Users can create own message reports" ON "public"."message_user_reports" FOR INSERT WITH CHECK (("auth"."uid"() = "reporter_user_id"));



CREATE POLICY "Users can create their own applications" ON "public"."landlord_applications" FOR INSERT WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can insert own iRis chat messages" ON "public"."iris_chat_messages" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can save properties" ON "public"."saved_properties" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can unsave properties" ON "public"."saved_properties" FOR DELETE USING (("auth"."uid"() = "user_id"));



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
  WHERE (("cp"."conversation_id" = "cp"."conversation_id") AND ("cp"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."iris_chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."landlord_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."landlord_inquiry_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."landlord_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."landlord_statistics_exports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."maintenance_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_user_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_user_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."move_out_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saved_properties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."units" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."handle_lease_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_lease_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_lease_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."applications" TO "anon";
GRANT ALL ON TABLE "public"."applications" TO "authenticated";
GRANT ALL ON TABLE "public"."applications" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_participants" TO "anon";
GRANT ALL ON TABLE "public"."conversation_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_participants" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."iris_chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."iris_chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."iris_chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."landlord_applications" TO "anon";
GRANT ALL ON TABLE "public"."landlord_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."landlord_applications" TO "service_role";



GRANT ALL ON TABLE "public"."landlord_inquiry_actions" TO "anon";
GRANT ALL ON TABLE "public"."landlord_inquiry_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."landlord_inquiry_actions" TO "service_role";



GRANT ALL ON TABLE "public"."landlord_reviews" TO "anon";
GRANT ALL ON TABLE "public"."landlord_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."landlord_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."landlord_statistics_exports" TO "anon";
GRANT ALL ON TABLE "public"."landlord_statistics_exports" TO "authenticated";
GRANT ALL ON TABLE "public"."landlord_statistics_exports" TO "service_role";



GRANT ALL ON TABLE "public"."leases" TO "anon";
GRANT ALL ON TABLE "public"."leases" TO "authenticated";
GRANT ALL ON TABLE "public"."leases" TO "service_role";



GRANT ALL ON TABLE "public"."maintenance_requests" TO "anon";
GRANT ALL ON TABLE "public"."maintenance_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."maintenance_requests" TO "service_role";



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



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."properties" TO "anon";
GRANT ALL ON TABLE "public"."properties" TO "authenticated";
GRANT ALL ON TABLE "public"."properties" TO "service_role";



GRANT ALL ON TABLE "public"."saved_properties" TO "anon";
GRANT ALL ON TABLE "public"."saved_properties" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_properties" TO "service_role";



GRANT ALL ON TABLE "public"."units" TO "anon";
GRANT ALL ON TABLE "public"."units" TO "authenticated";
GRANT ALL ON TABLE "public"."units" TO "service_role";









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



































