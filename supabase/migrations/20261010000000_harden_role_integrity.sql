-- Harden role integrity and stop trusting user-editable JWT metadata.
--
-- Background
-- ----------
-- 1. `profiles.role` decides what a signed-in user may do, but the RLS policy
--    "Users can update own profile" allows any user to UPDATE every column of
--    their own row, including `role`. A tenant can promote themselves to
--    landlord or admin with a single PostgREST call.
-- 2. Several policies grant admin access when
--    `auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'`. `user_metadata` is
--    writable by the user themselves (supabase.auth.updateUser({ data })), so
--    that check is also self-serviceable.
-- 3. The `landlord-documents` bucket accepts anonymous INSERTs. Every upload to
--    it goes through server routes using the service role (which bypasses
--    RLS), so the public grant only serves attackers.
--
-- Design notes (safety)
-- ---------------------
-- * Nothing new is granted. Policies are only rewritten in place when they
--   exist and only the admin expression changes; the rest of each policy body
--   is copied verbatim from the catalog. Tables without such a policy are not
--   touched.
-- * The trigger only rejects *changes* to identity/security columns from
--   anon/authenticated requests. Updates that leave those columns unchanged
--   (the normal profile edits from the app) are unaffected, and the service
--   role (all server routes, cron, migrations, Studio) is exempt.
-- * The consultation-tool policies ("Public Upload" on consultation-documents
--   and "Public can update documents to sign them") are intentionally left in
--   place: the public /sign/[id] page uploads and updates from the browser.

-- ---------------------------------------------------------------------------
-- 1. Role helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT p.role
    FROM public.profiles p
    WHERE p.id = auth.uid()
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(public.current_user_role() = 'admin'::public.user_role, false);
$$;

-- Policies are evaluated as the requesting role, so every API role needs EXECUTE.
REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Protect identity / security columns on profiles
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_profile_identity_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    -- auth.role() reads the request JWT role from either PostgREST claim
    -- format. It is NULL outside PostgREST (psql, Studio, migrations, GoTrue).
    caller_role text := COALESCE(auth.role(), '');
    old_row jsonb := to_jsonb(OLD);
    new_row jsonb := to_jsonb(NEW);
BEGIN
    -- Only end-user API roles are restricted. Server code (service_role) and
    -- direct database sessions may change anything.
    IF caller_role NOT IN ('anon', 'authenticated') THEN
        RETURN NEW;
    END IF;

    IF new_row ->> 'id' IS DISTINCT FROM old_row ->> 'id' THEN
        RAISE EXCEPTION 'profiles.id cannot be changed' USING ERRCODE = '42501';
    END IF;

    IF new_row ->> 'role' IS DISTINCT FROM old_row ->> 'role' THEN
        RAISE EXCEPTION 'profiles.role can only be changed by the server' USING ERRCODE = '42501';
    END IF;

    IF new_row ->> 'email' IS DISTINCT FROM old_row ->> 'email' THEN
        RAISE EXCEPTION 'profiles.email can only be changed through a verified email flow' USING ERRCODE = '42501';
    END IF;

    IF new_row ->> 'two_factor_enabled' IS DISTINCT FROM old_row ->> 'two_factor_enabled' THEN
        RAISE EXCEPTION 'profiles.two_factor_enabled can only be changed through the 2FA flow' USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_profile_identity_columns() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.protect_profile_identity_columns() TO service_role;

DROP TRIGGER IF EXISTS trg_protect_profile_identity_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_identity_columns
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_identity_columns();

-- ---------------------------------------------------------------------------
-- 3. Replace every JWT-metadata admin check with public.is_admin()
-- ---------------------------------------------------------------------------
-- Rewrites each existing policy in place from the catalog, so the result
-- matches whatever policy set is deployed (the hosted project uses names such
-- as "Admins can view all profiles" and "Management can ...", while the
-- repository migrations use the consolidated "... stakeholders ..." names).

DO $$
DECLARE
    pol record;
    -- Deparsed form of: (auth.jwt() -> 'user_metadata') ->> 'role' = 'admin'
    -- with and without the "(select auth.jwt())" sub-select variant.
    admin_pattern constant text :=
        '\(\(\((\( SELECT )?auth\.jwt\(\)( AS jwt\))? -> ''user_metadata''::text\) ->> ''role''::text\) = ''admin''::text\)';
    new_qual text;
    new_check text;
    role_list text;
    rewritten int := 0;
BEGIN
    FOR pol IN
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies
        WHERE COALESCE(qual, '') LIKE '%user_metadata%'
           OR COALESCE(with_check, '') LIKE '%user_metadata%'
    LOOP
        new_qual := CASE WHEN pol.qual IS NULL THEN NULL
                         ELSE regexp_replace(pol.qual, admin_pattern, 'public.is_admin()', 'g') END;
        new_check := CASE WHEN pol.with_check IS NULL THEN NULL
                          ELSE regexp_replace(pol.with_check, admin_pattern, 'public.is_admin()', 'g') END;

        -- Leave anything the pattern did not fully clean up untouched and report it.
        IF COALESCE(new_qual, '') LIKE '%user_metadata%' OR COALESCE(new_check, '') LIKE '%user_metadata%' THEN
            RAISE WARNING 'Policy %.%."%" still references user_metadata and was NOT rewritten; review it manually.',
                pol.schemaname, pol.tablename, pol.policyname;
            CONTINUE;
        END IF;

        SELECT string_agg(quote_ident(r), ', ') INTO role_list FROM unnest(pol.roles) AS r;

        EXECUTE format('DROP POLICY %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
        EXECUTE format(
            'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s %s %s',
            pol.policyname,
            pol.schemaname,
            pol.tablename,
            pol.permissive,
            pol.cmd,
            role_list,
            CASE WHEN new_qual IS NOT NULL THEN 'USING (' || new_qual || ')' ELSE '' END,
            CASE WHEN new_check IS NOT NULL THEN 'WITH CHECK (' || new_check || ')' ELSE '' END
        );
        rewritten := rewritten + 1;
        RAISE NOTICE 'Rewrote policy %.%."%" to use public.is_admin()', pol.schemaname, pol.tablename, pol.policyname;
    END LOOP;

    RAISE NOTICE 'Rewrote % metadata-based policies', rewritten;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Remove the anonymous upload grant on landlord-documents
-- ---------------------------------------------------------------------------
-- Uploads to this bucket (permits, IDs, onboarding photos) are all performed
-- by server routes with the service role; no browser code writes to it.

DROP POLICY IF EXISTS "Public Upload on landlord-documents" ON storage.objects;
