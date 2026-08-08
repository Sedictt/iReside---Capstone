-- Wrap remaining environment write policy auth calls for RLS performance.

DROP POLICY IF EXISTS "Landlords can insert their own property policies" ON public.property_environment_policies;
DROP POLICY IF EXISTS "Landlords can update their own property policies" ON public.property_environment_policies;
DROP POLICY IF EXISTS "Landlords can insert their own unit overrides" ON public.unit_environment_overrides;
DROP POLICY IF EXISTS "Landlords can update their own unit overrides" ON public.unit_environment_overrides;

CREATE POLICY "Landlords can insert their own property policies"
ON public.property_environment_policies
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.properties p
        WHERE p.id = property_environment_policies.property_id
          AND p.landlord_id = (select auth.uid())
    )
);

CREATE POLICY "Landlords can update their own property policies"
ON public.property_environment_policies
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.properties p
        WHERE p.id = property_environment_policies.property_id
          AND p.landlord_id = (select auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.properties p
        WHERE p.id = property_environment_policies.property_id
          AND p.landlord_id = (select auth.uid())
    )
);

CREATE POLICY "Landlords can insert their own unit overrides"
ON public.unit_environment_overrides
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.units u
        JOIN public.properties p ON p.id = u.property_id
        WHERE u.id = unit_environment_overrides.unit_id
          AND p.landlord_id = (select auth.uid())
    )
);

CREATE POLICY "Landlords can update their own unit overrides"
ON public.unit_environment_overrides
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.units u
        JOIN public.properties p ON p.id = u.property_id
        WHERE u.id = unit_environment_overrides.unit_id
          AND p.landlord_id = (select auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.units u
        JOIN public.properties p ON p.id = u.property_id
        WHERE u.id = unit_environment_overrides.unit_id
          AND p.landlord_id = (select auth.uid())
    )
);
