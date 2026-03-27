-- Migration: Restore Permissive Property/Unit Policies
-- Purpose: Fix 500 errors on landlord endpoints caused by restrictive RLS policies
-- This restores the "viewable by everyone" policies that existed before
-- migration 20260323_landlord_centric_refactor.sql.

-- Drop the problematic restrictive policies (if they exist)
DROP POLICY IF EXISTS "Properties visible to owner and tenants" ON public.properties;
DROP POLICY IF EXISTS "Units visible to owner and tenants" ON public.units;

-- Restore original permissive policies
CREATE POLICY "Properties are viewable by everyone"
    ON public.properties FOR SELECT
    USING (true);

CREATE POLICY "Units are viewable by everyone"
    ON public.units FOR SELECT
    USING (true);

-- Ensure applications and listings policies are correctly set (already in migration 20260327120000)
-- These are safe and necessary
-- (We assume those policies are in place; no changes needed here)
