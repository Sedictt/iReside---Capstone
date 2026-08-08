-- Consolidate environment SELECT policies and wrap auth calls for RLS performance.

DROP POLICY IF EXISTS "Landlords can select their own property policies" ON public.property_environment_policies;
DROP POLICY IF EXISTS "Users can select policy if they have an active lease" ON public.property_environment_policies;
DROP POLICY IF EXISTS "Landlords can select their own unit overrides" ON public.unit_environment_overrides;
DROP POLICY IF EXISTS "Users can select override if they have an active lease" ON public.unit_environment_overrides;

CREATE POLICY "Environment policy stakeholders can select policies"
ON public.property_environment_policies
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.properties p
        WHERE p.id = property_environment_policies.property_id
          AND p.landlord_id = (select auth.uid())
    )
    OR EXISTS (
        SELECT 1
        FROM public.leases l
        JOIN public.units u ON u.id = l.unit_id
        WHERE u.property_id = property_environment_policies.property_id
          AND l.tenant_id = (select auth.uid())
          AND l.status = 'active'::public.lease_status
    )
);

CREATE POLICY "Environment override stakeholders can select overrides"
ON public.unit_environment_overrides
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.units u
        JOIN public.properties p ON p.id = u.property_id
        WHERE u.id = unit_environment_overrides.unit_id
          AND p.landlord_id = (select auth.uid())
    )
    OR EXISTS (
        SELECT 1
        FROM public.leases l
        WHERE l.unit_id = unit_environment_overrides.unit_id
          AND l.tenant_id = (select auth.uid())
          AND l.status = 'active'::public.lease_status
    )
);
