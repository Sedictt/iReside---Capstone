-- Add missing columns for property onboarding
BEGIN;

ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS total_units INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_floors INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS base_rent_amount NUMERIC(10, 2) DEFAULT 0;

-- Ensure property_environment_policies has utility_split_method if needed
-- (It's already in the table according to previous views)

COMMIT;
