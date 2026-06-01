-- Consolidate high-traffic workflow RLS policies and wrap auth calls in SELECT.
-- This reduces multiple permissive policy checks while preserving the same
-- landlord/tenant ownership access model.

-- applications
DROP POLICY IF EXISTS "Applicants can update own applications" ON public.applications;
DROP POLICY IF EXISTS "Applicants can view own applications" ON public.applications;
DROP POLICY IF EXISTS "Authenticated users can create applications" ON public.applications;
DROP POLICY IF EXISTS "Landlords can create walk-in applications" ON public.applications;
DROP POLICY IF EXISTS "Landlords can update applications for their units" ON public.applications;
DROP POLICY IF EXISTS "Landlords can view applications for their units" ON public.applications;

CREATE POLICY "Application participants can view applications"
ON public.applications
FOR SELECT
TO authenticated
USING (
    applicant_id = (select auth.uid())
    OR landlord_id = (select auth.uid())
);

CREATE POLICY "Application participants can update applications"
ON public.applications
FOR UPDATE
TO authenticated
USING (
    applicant_id = (select auth.uid())
    OR landlord_id = (select auth.uid())
)
WITH CHECK (
    applicant_id = (select auth.uid())
    OR landlord_id = (select auth.uid())
);

CREATE POLICY "Application owners can create applications"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (
    applicant_id = (select auth.uid())
    OR (
        created_by = (select auth.uid())
        AND EXISTS (
            SELECT 1
            FROM public.units u
            JOIN public.properties p ON p.id = u.property_id
            WHERE u.id = applications.unit_id
              AND p.landlord_id = (select auth.uid())
        )
    )
);

-- leases
DROP POLICY IF EXISTS "Landlords can create leases" ON public.leases;
DROP POLICY IF EXISTS "Landlords can update own leases" ON public.leases;
DROP POLICY IF EXISTS "Landlords can view own leases" ON public.leases;
DROP POLICY IF EXISTS "Tenants can update own leases for signing" ON public.leases;
DROP POLICY IF EXISTS "Tenants can view own leases" ON public.leases;

CREATE POLICY "Lease participants can view leases"
ON public.leases
FOR SELECT
TO authenticated
USING (
    landlord_id = (select auth.uid())
    OR tenant_id = (select auth.uid())
);

CREATE POLICY "Lease participants can update leases"
ON public.leases
FOR UPDATE
TO authenticated
USING (
    landlord_id = (select auth.uid())
    OR tenant_id = (select auth.uid())
)
WITH CHECK (
    landlord_id = (select auth.uid())
    OR tenant_id = (select auth.uid())
);

CREATE POLICY "Landlords can create leases"
ON public.leases
FOR INSERT
TO authenticated
WITH CHECK (landlord_id = (select auth.uid()));

-- payments
DROP POLICY IF EXISTS "Landlords can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Payment updates" ON public.payments;
DROP POLICY IF EXISTS "System can create payments" ON public.payments;
DROP POLICY IF EXISTS "Tenants can view own payments" ON public.payments;

CREATE POLICY "Payment participants can view payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
    landlord_id = (select auth.uid())
    OR tenant_id = (select auth.uid())
);

CREATE POLICY "Payment participants can update payments"
ON public.payments
FOR UPDATE
TO authenticated
USING (
    landlord_id = (select auth.uid())
    OR tenant_id = (select auth.uid())
)
WITH CHECK (
    landlord_id = (select auth.uid())
    OR tenant_id = (select auth.uid())
);

CREATE POLICY "Payment participants can create payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (
    landlord_id = (select auth.uid())
    OR tenant_id = (select auth.uid())
);

-- payment_receipts
DROP POLICY IF EXISTS "Landlords can insert own payment receipts" ON public.payment_receipts;
DROP POLICY IF EXISTS "Landlords can view own payment receipts" ON public.payment_receipts;
DROP POLICY IF EXISTS "Tenants can view own payment receipts" ON public.payment_receipts;

CREATE POLICY "Payment receipt participants can view receipts"
ON public.payment_receipts
FOR SELECT
TO authenticated
USING (
    landlord_id = (select auth.uid())
    OR tenant_id = (select auth.uid())
);

CREATE POLICY "Landlords can insert own payment receipts"
ON public.payment_receipts
FOR INSERT
TO authenticated
WITH CHECK (landlord_id = (select auth.uid()));

-- maintenance_requests
DROP POLICY IF EXISTS "Landlords can update maintenance requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Landlords can view maintenance requests for their properties" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Tenants can create maintenance requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Tenants can update own maintenance requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Tenants can view own maintenance requests" ON public.maintenance_requests;

CREATE POLICY "Maintenance participants can view requests"
ON public.maintenance_requests
FOR SELECT
TO authenticated
USING (
    landlord_id = (select auth.uid())
    OR tenant_id = (select auth.uid())
);

CREATE POLICY "Maintenance participants can update requests"
ON public.maintenance_requests
FOR UPDATE
TO authenticated
USING (
    landlord_id = (select auth.uid())
    OR tenant_id = (select auth.uid())
)
WITH CHECK (
    landlord_id = (select auth.uid())
    OR tenant_id = (select auth.uid())
);

CREATE POLICY "Tenants can create maintenance requests"
ON public.maintenance_requests
FOR INSERT
TO authenticated
WITH CHECK (tenant_id = (select auth.uid()));

-- move_out_requests
DROP POLICY IF EXISTS "Landlords can update move-out requests" ON public.move_out_requests;
DROP POLICY IF EXISTS "Landlords can view move-out requests" ON public.move_out_requests;
DROP POLICY IF EXISTS "Tenants can create move-out requests" ON public.move_out_requests;
DROP POLICY IF EXISTS "Tenants can update own move-out requests" ON public.move_out_requests;
DROP POLICY IF EXISTS "Tenants can view own move-out requests" ON public.move_out_requests;

CREATE POLICY "Move-out participants can view requests"
ON public.move_out_requests
FOR SELECT
TO authenticated
USING (
    landlord_id = (select auth.uid())
    OR tenant_id = (select auth.uid())
);

CREATE POLICY "Move-out participants can update requests"
ON public.move_out_requests
FOR UPDATE
TO authenticated
USING (
    landlord_id = (select auth.uid())
    OR tenant_id = (select auth.uid())
)
WITH CHECK (
    landlord_id = (select auth.uid())
    OR tenant_id = (select auth.uid())
);

CREATE POLICY "Tenants can create move-out requests"
ON public.move_out_requests
FOR INSERT
TO authenticated
WITH CHECK (tenant_id = (select auth.uid()));

-- landlord_payment_destinations
DROP POLICY IF EXISTS "Landlords can delete own payment destinations" ON public.landlord_payment_destinations;
DROP POLICY IF EXISTS "Landlords can insert own payment destinations" ON public.landlord_payment_destinations;
DROP POLICY IF EXISTS "Landlords can update own payment destinations" ON public.landlord_payment_destinations;
DROP POLICY IF EXISTS "Landlords can view own payment destinations" ON public.landlord_payment_destinations;
DROP POLICY IF EXISTS "Tenants can view payment destinations for own leases" ON public.landlord_payment_destinations;

CREATE POLICY "Payment destination participants can view destinations"
ON public.landlord_payment_destinations
FOR SELECT
TO authenticated
USING (
    landlord_id = (select auth.uid())
    OR EXISTS (
        SELECT 1
        FROM public.leases
        WHERE leases.landlord_id = landlord_payment_destinations.landlord_id
          AND leases.tenant_id = (select auth.uid())
    )
);

CREATE POLICY "Landlords can insert own payment destinations"
ON public.landlord_payment_destinations
FOR INSERT
TO authenticated
WITH CHECK (landlord_id = (select auth.uid()));

CREATE POLICY "Landlords can update own payment destinations"
ON public.landlord_payment_destinations
FOR UPDATE
TO authenticated
USING (landlord_id = (select auth.uid()))
WITH CHECK (landlord_id = (select auth.uid()));

CREATE POLICY "Landlords can delete own payment destinations"
ON public.landlord_payment_destinations
FOR DELETE
TO authenticated
USING (landlord_id = (select auth.uid()));

-- landlord_applications
DROP POLICY IF EXISTS "Admins can update landlord applications" ON public.landlord_applications;
DROP POLICY IF EXISTS "Admins can view all landlord applications" ON public.landlord_applications;
DROP POLICY IF EXISTS "Users can create their own applications" ON public.landlord_applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON public.landlord_applications;

CREATE POLICY "Landlord application owners and admins can view applications"
ON public.landlord_applications
FOR SELECT
TO authenticated
USING (
    profile_id = (select auth.uid())
    OR EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = (select auth.uid())
          AND p.role = 'admin'::public.user_role
    )
);

CREATE POLICY "Admins can update landlord applications"
ON public.landlord_applications
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = (select auth.uid())
          AND p.role = 'admin'::public.user_role
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = (select auth.uid())
          AND p.role = 'admin'::public.user_role
    )
);

CREATE POLICY "Users can create their own landlord applications"
ON public.landlord_applications
FOR INSERT
TO authenticated
WITH CHECK (profile_id = (select auth.uid()));
