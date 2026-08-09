-- Harden RLS policies for renewal_requests, tenant_intake_invites, and tenant_intake_invite_events.
-- Uses (select auth.uid()) wrapper to optimize query evaluation plans and eliminate RLS initplan warnings.

ALTER TABLE public.renewal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_intake_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_intake_invite_events ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 1. renewal_requests Policies
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Landlords can view renewal requests for their properties" ON public.renewal_requests;
CREATE POLICY "Landlords can view renewal requests for their properties"
ON public.renewal_requests
FOR SELECT
TO authenticated
USING (landlord_id = (select auth.uid()));

DROP POLICY IF EXISTS "Landlords can update renewal requests for their properties" ON public.renewal_requests;
CREATE POLICY "Landlords can update renewal requests for their properties"
ON public.renewal_requests
FOR UPDATE
TO authenticated
USING (landlord_id = (select auth.uid()))
WITH CHECK (landlord_id = (select auth.uid()));

DROP POLICY IF EXISTS "Landlords can insert renewal requests" ON public.renewal_requests;
CREATE POLICY "Landlords can insert renewal requests"
ON public.renewal_requests
FOR INSERT
TO authenticated
WITH CHECK (landlord_id = (select auth.uid()));

DROP POLICY IF EXISTS "Tenants can view own renewal requests" ON public.renewal_requests;
CREATE POLICY "Tenants can view own renewal requests"
ON public.renewal_requests
FOR SELECT
TO authenticated
USING (tenant_id = (select auth.uid()));

DROP POLICY IF EXISTS "Tenants can insert own renewal requests" ON public.renewal_requests;
CREATE POLICY "Tenants can insert own renewal requests"
ON public.renewal_requests
FOR INSERT
TO authenticated
WITH CHECK (tenant_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 2. tenant_intake_invites Policies
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Landlords can view own invites" ON public.tenant_intake_invites;
CREATE POLICY "Landlords can view own invites"
ON public.tenant_intake_invites
FOR SELECT
TO authenticated
USING (landlord_id = (select auth.uid()));

DROP POLICY IF EXISTS "Landlords can insert own invites" ON public.tenant_intake_invites;
CREATE POLICY "Landlords can insert own invites"
ON public.tenant_intake_invites
FOR INSERT
TO authenticated
WITH CHECK (landlord_id = (select auth.uid()));

DROP POLICY IF EXISTS "Landlords can update own invites" ON public.tenant_intake_invites;
CREATE POLICY "Landlords can update own invites"
ON public.tenant_intake_invites
FOR UPDATE
TO authenticated
USING (landlord_id = (select auth.uid()))
WITH CHECK (landlord_id = (select auth.uid()));

DROP POLICY IF EXISTS "Tenants can view invites assigned to them" ON public.tenant_intake_invites;
CREATE POLICY "Tenants can view invites assigned to them"
ON public.tenant_intake_invites
FOR SELECT
TO authenticated
USING (tenant_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 3. tenant_intake_invite_events Policies
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Landlords can view invite events for their invites" ON public.tenant_intake_invite_events;
CREATE POLICY "Landlords can view invite events for their invites"
ON public.tenant_intake_invite_events
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.tenant_intake_invites
        WHERE tenant_intake_invites.id = tenant_intake_invite_events.invite_id
          AND tenant_intake_invites.landlord_id = (select auth.uid())
    )
);
