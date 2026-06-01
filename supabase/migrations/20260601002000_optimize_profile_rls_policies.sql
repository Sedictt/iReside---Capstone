-- Optimize profile-related RLS policies for Supabase lint/performance.
--
-- This keeps the current application access model intact while removing
-- redundant permissive policies and wrapping stable auth calls in SELECT so
-- Postgres can evaluate them once per statement.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlord_business_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = (select auth.uid()))
WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own private profile" ON public.profile_private;
DROP POLICY IF EXISTS "Admins can view private profiles" ON public.profile_private;
DROP POLICY IF EXISTS "Users can update own private profile" ON public.profile_private;
DROP POLICY IF EXISTS "Users can insert own private profile" ON public.profile_private;

CREATE POLICY "Owners and admins can view private profiles"
ON public.profile_private
FOR SELECT
TO authenticated
USING (
    profile_id = (select auth.uid())
    OR (((select auth.jwt()) -> 'user_metadata'::text) ->> 'role'::text) = 'admin'
);

CREATE POLICY "Users can update own private profile"
ON public.profile_private
FOR UPDATE
TO authenticated
USING (profile_id = (select auth.uid()))
WITH CHECK (profile_id = (select auth.uid()));

CREATE POLICY "Users can insert own private profile"
ON public.profile_private
FOR INSERT
TO authenticated
WITH CHECK (profile_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own landlord business profile" ON public.landlord_business_profiles;
DROP POLICY IF EXISTS "Admins can view landlord business profiles" ON public.landlord_business_profiles;
DROP POLICY IF EXISTS "Users can update own landlord business profile" ON public.landlord_business_profiles;
DROP POLICY IF EXISTS "Users can insert own landlord business profile" ON public.landlord_business_profiles;

CREATE POLICY "Owners and admins can view landlord business profiles"
ON public.landlord_business_profiles
FOR SELECT
TO authenticated
USING (
    profile_id = (select auth.uid())
    OR (((select auth.jwt()) -> 'user_metadata'::text) ->> 'role'::text) = 'admin'
);

CREATE POLICY "Users can update own landlord business profile"
ON public.landlord_business_profiles
FOR UPDATE
TO authenticated
USING (profile_id = (select auth.uid()))
WITH CHECK (profile_id = (select auth.uid()));

CREATE POLICY "Users can insert own landlord business profile"
ON public.landlord_business_profiles
FOR INSERT
TO authenticated
WITH CHECK (profile_id = (select auth.uid()));
