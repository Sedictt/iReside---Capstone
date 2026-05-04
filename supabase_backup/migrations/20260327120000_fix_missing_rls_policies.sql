-- Migration: Add missing columns and RLS policies for landlord endpoints
-- Purpose: Fix 500 errors on /api/landlord/applications and /api/landlord/listings
-- The queries work with service role but fail for regular users due to missing SELECT policies.

-- 1. Ensure columns exist for walk-in applications
-- These might be missing in some environments causing 500 errors in the /api/landlord/applications route
ALTER TABLE IF EXISTS public.applications 
    ADD COLUMN IF NOT EXISTS applicant_name TEXT,
    ADD COLUMN IF NOT EXISTS applicant_phone TEXT,
    ADD COLUMN IF NOT EXISTS applicant_email TEXT,
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);

-- 2. Ensure RLS is enabled on all target tables
ALTER TABLE IF EXISTS public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.units ENABLE ROW LEVEL SECURITY;

-- 3. Applications Table Policies
DROP POLICY IF EXISTS "Applicants can view own applications" ON public.applications;
CREATE POLICY "Applicants can view own applications" 
    ON public.applications FOR SELECT 
    USING (auth.uid() = applicant_id);

DROP POLICY IF EXISTS "Landlords can view applications for their units" ON public.applications;
CREATE POLICY "Landlords can view applications for their units" 
    ON public.applications FOR SELECT 
    USING (auth.uid() = landlord_id);

-- 4. Listings Table Policies
DROP POLICY IF EXISTS "Landlords can view own listings" ON public.listings;
CREATE POLICY "Landlords can view own listings" 
    ON public.listings FOR SELECT 
    USING (auth.uid() = landlord_id);

DROP POLICY IF EXISTS "Published listings are viewable by everyone" ON public.listings;
CREATE POLICY "Published listings are viewable by everyone" 
    ON public.listings FOR SELECT 
    USING (status = 'published');

-- 5. Properties Table Policies
DROP POLICY IF EXISTS "Properties visible to owner and tenants" ON public.properties;
CREATE POLICY "Properties visible to owner and tenants" 
    ON public.properties FOR SELECT 
    USING (
        landlord_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM public.leases l
            JOIN public.units u ON u.id = l.unit_id
            WHERE u.property_id = public.properties.id
            AND l.tenant_id = auth.uid() 
            AND l.status IN ('active', 'pending_signature')
        )
        OR EXISTS (
            SELECT 1 FROM public.listings lst
            WHERE lst.property_id = public.properties.id
            AND lst.status = 'published'
        )
    );

-- 6. Units Table Policies
DROP POLICY IF EXISTS "Units visible to owner and tenants" ON public.units;
CREATE POLICY "Units visible to owner and tenants" 
    ON public.units FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id = public.units.property_id
            AND p.landlord_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.leases l
            WHERE l.unit_id = public.units.id
            AND l.tenant_id = auth.uid() 
            AND l.status IN ('active', 'pending_signature')
        )
        OR EXISTS (
            SELECT 1 FROM public.listings lst
            WHERE lst.unit_id = public.units.id
            AND lst.status = 'published'
        )
    );


