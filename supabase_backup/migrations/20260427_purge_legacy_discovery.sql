-- Purge Legacy Discovery Portal and Unit Listing Infrastructure
-- Objective: Remove dormant tables, types, and functions to reduce technical debt.

-- 1. Drop Policies
DROP POLICY IF EXISTS "Geo locations are viewable by everyone" ON public.geo_locations;
DROP POLICY IF EXISTS "Landlords can create own listings" ON public.listings;
DROP POLICY IF EXISTS "Landlords can delete own listings" ON public.listings;
DROP POLICY IF EXISTS "Landlords can update own listings" ON public.listings;
DROP POLICY IF EXISTS "Landlords can view own listings" ON public.listings;
DROP POLICY IF EXISTS "Published listings are viewable by everyone" ON public.listings;
DROP POLICY IF EXISTS "Users can save properties" ON public.saved_properties;
DROP POLICY IF EXISTS "Users can unsave properties" ON public.saved_properties;
DROP POLICY IF EXISTS "Users can view own saved properties" ON public.saved_properties;

-- 2. Drop Tables (this will also drop indices and constraints)
DROP TABLE IF EXISTS public.saved_properties CASCADE;
DROP TABLE IF EXISTS public.listings CASCADE;
DROP TABLE IF EXISTS public.geo_locations CASCADE;

-- 3. Remove Columns from Properties
ALTER TABLE public.properties 
DROP COLUMN IF EXISTS lat,
DROP COLUMN IF EXISTS lng,
DROP COLUMN IF EXISTS map_decorations;

-- 4. Drop Legacy Functions
DROP FUNCTION IF EXISTS public.increment_listing_metric(uuid, text);

-- 5. Drop Legacy Types
DROP TYPE IF EXISTS public.listing_scope;
DROP TYPE IF EXISTS public.listing_status;
DROP TYPE IF EXISTS public.location_type;
