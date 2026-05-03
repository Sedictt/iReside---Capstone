-- Alter property_type to add dormitory and boarding_house
ALTER TYPE "public"."property_type" ADD VALUE IF NOT EXISTS 'dormitory';
ALTER TYPE "public"."property_type" ADD VALUE IF NOT EXISTS 'boarding_house';

-- Property Environment Policies
CREATE TABLE IF NOT EXISTS "public"."property_environment_policies" (
    "property_id" uuid PRIMARY KEY REFERENCES "public"."properties"("id") ON DELETE CASCADE,
    "environment_mode" text NOT NULL,
    "max_occupants_per_unit" integer,
    "curfew_enabled" boolean DEFAULT false,
    "curfew_time" time,
    "visitor_cutoff_enabled" boolean DEFAULT false,
    "visitor_cutoff_time" time,
    "quiet_hours_start" time,
    "quiet_hours_end" time,
    "gender_restriction_mode" text DEFAULT 'none',
    "utility_policy_mode" text DEFAULT 'included_in_rent',
    "utility_split_method" text,
    "utility_fixed_charge_amount" numeric,
    "payment_profile_defaults" jsonb,
    "needs_review" boolean DEFAULT false,
    "reviewed_at" timestamp with time zone,
    "reviewed_by" uuid REFERENCES "public"."profiles"("id"),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Unit Environment Overrides
CREATE TABLE IF NOT EXISTS "public"."unit_environment_overrides" (
    "unit_id" uuid PRIMARY KEY REFERENCES "public"."units"("id") ON DELETE CASCADE,
    "max_occupants_per_unit" integer,
    "curfew_enabled" boolean,
    "curfew_time" time,
    "visitor_cutoff_enabled" boolean,
    "visitor_cutoff_time" time,
    "quiet_hours_start" time,
    "quiet_hours_end" time,
    "gender_restriction_mode" text,
    "utility_policy_mode" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Row Level Security
ALTER TABLE "public"."property_environment_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."unit_environment_overrides" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_environment_policies
CREATE POLICY "Landlords can select their own property policies"
    ON "public"."property_environment_policies" FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM "public"."properties" p WHERE p.id = property_environment_policies.property_id AND p.landlord_id = auth.uid()
    ));

CREATE POLICY "Landlords can insert their own property policies"
    ON "public"."property_environment_policies" FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM "public"."properties" p WHERE p.id = property_environment_policies.property_id AND p.landlord_id = auth.uid()
    ));

CREATE POLICY "Landlords can update their own property policies"
    ON "public"."property_environment_policies" FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM "public"."properties" p WHERE p.id = property_environment_policies.property_id AND p.landlord_id = auth.uid()
    ));

-- Tenants can read their property's policy
CREATE POLICY "Users can select policy if they have an active lease"
    ON "public"."property_environment_policies" FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM "public"."leases" l
        JOIN "public"."units" u ON l.unit_id = u.id
        WHERE u.property_id = property_environment_policies.property_id
          AND l.tenant_id = auth.uid()
          AND l.status = 'active'
    ));

-- RLS Policies for unit_environment_overrides
CREATE POLICY "Landlords can select their own unit overrides"
    ON "public"."unit_environment_overrides" FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM "public"."units" u
        JOIN "public"."properties" p ON u.property_id = p.id
        WHERE u.id = unit_environment_overrides.unit_id AND p.landlord_id = auth.uid()
    ));

CREATE POLICY "Landlords can insert their own unit overrides"
    ON "public"."unit_environment_overrides" FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM "public"."units" u
        JOIN "public"."properties" p ON u.property_id = p.id
        WHERE u.id = unit_environment_overrides.unit_id AND p.landlord_id = auth.uid()
    ));

CREATE POLICY "Landlords can update their own unit overrides"
    ON "public"."unit_environment_overrides" FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM "public"."units" u
        JOIN "public"."properties" p ON u.property_id = p.id
        WHERE u.id = unit_environment_overrides.unit_id AND p.landlord_id = auth.uid()
    ));

CREATE POLICY "Users can select override if they have an active lease"
    ON "public"."unit_environment_overrides" FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM "public"."leases" l
        WHERE l.unit_id = unit_environment_overrides.unit_id
          AND l.tenant_id = auth.uid()
          AND l.status = 'active'
    ));

-- Auto-map existing properties
INSERT INTO "public"."property_environment_policies" (property_id, environment_mode, needs_review)
SELECT id, type::text, true
FROM "public"."properties"
ON CONFLICT (property_id) DO NOTHING;
