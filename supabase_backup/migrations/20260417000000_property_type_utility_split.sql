-- ============================================================
-- Property Type + Utility Split Personalization
-- Migration: 20260417000000
-- ============================================================

-- ── Step 1: Add utility_split_method enum ───────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'utility_split_method') THEN
        CREATE TYPE "public"."utility_split_method"
            AS ENUM ('equal_per_head', 'equal_per_unit', 'fixed_charge', 'individual_meter');
    END IF;
END
$$;

-- ── Step 2: Add new columns to property_environment_policies ─
ALTER TABLE "public"."property_environment_policies"
    ADD COLUMN IF NOT EXISTS "utility_split_method" "public"."utility_split_method",
    ADD COLUMN IF NOT EXISTS "utility_fixed_charge_amount" numeric(12,2);

-- ── Step 3: Backfill utility_split_method from legacy utility_policy_mode ─
UPDATE "public"."property_environment_policies"
SET "utility_split_method" = CASE
    WHEN "utility_policy_mode" = 'mixed'              THEN 'equal_per_head'::"public"."utility_split_method"
    WHEN "utility_policy_mode" = 'separate_metered'   THEN 'individual_meter'::"public"."utility_split_method"
    WHEN "utility_policy_mode" = 'included_in_rent'   THEN 'fixed_charge'::"public"."utility_split_method"
    ELSE 'individual_meter'::"public"."utility_split_method"
END
WHERE "utility_split_method" IS NULL;

-- ── Step 4: Migrate legacy property types on properties table to 'apartment' ─
-- We do this via a temporary text column dance because PG doesn't allow
-- removing enum values directly without dropping and recreating the type.

-- 4a. Add a temporary text shadow column
ALTER TABLE "public"."properties"
    ADD COLUMN IF NOT EXISTS "_type_migration_tmp" text;

-- 4b. Copy current values into the temp column
UPDATE "public"."properties"
SET "_type_migration_tmp" = type::text;

-- 4c. Map legacy values to their new equivalents in the temp column
UPDATE "public"."properties"
SET "_type_migration_tmp" = 'apartment'
WHERE "_type_migration_tmp" IN ('condo', 'house', 'townhouse', 'studio');

-- 4d. Create the new narrow enum (ignore if already exactly right)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'property_type_v2'
    ) THEN
        CREATE TYPE "public"."property_type_v2"
            AS ENUM ('apartment', 'dormitory', 'boarding_house');
    END IF;
END
$$;

-- 4e. Drop the old column, recreate with new type
ALTER TABLE "public"."properties"
    DROP COLUMN "type";

ALTER TABLE "public"."properties"
    ADD COLUMN "type" "public"."property_type_v2" NOT NULL DEFAULT 'apartment';

-- 4f. Restore values from the temp column
UPDATE "public"."properties"
SET "type" = "_type_migration_tmp"::"public"."property_type_v2";

-- 4g. Drop the old enum and rename the new one
DROP TYPE IF EXISTS "public"."property_type";
ALTER TYPE "public"."property_type_v2" RENAME TO "property_type";

-- 4h. Clean up temp column
ALTER TABLE "public"."properties"
    DROP COLUMN "_type_migration_tmp";

-- ── Step 5: Normalise environment_mode on policies table ─────
UPDATE "public"."property_environment_policies"
SET "environment_mode" = 'apartment'
WHERE "environment_mode" IN ('condo', 'house', 'townhouse', 'studio');

-- ── Step 6: Ensure apartment properties also have a policy row ─
INSERT INTO "public"."property_environment_policies"
    (property_id, environment_mode, needs_review, max_occupants_per_unit,
     utility_split_method, curfew_enabled, visitor_cutoff_enabled, gender_restriction_mode)
SELECT
    p.id,
    p.type::text,
    false,
    5,
    'individual_meter'::"public"."utility_split_method",
    false,
    false,
    'none'
FROM "public"."properties" p
WHERE NOT EXISTS (
    SELECT 1 FROM "public"."property_environment_policies" ep
    WHERE ep.property_id = p.id
)
ON CONFLICT (property_id) DO NOTHING;
