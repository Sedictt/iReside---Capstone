-- Consolidate remaining straightforward RLS overlaps for tours, utilities,
-- transfers, reviews, and messaging. Community post moderation policies are
-- intentionally left for a separate, domain-specific pass.

-- tenant_product_tour_events
DROP POLICY IF EXISTS "Admins can view all product tour events" ON public.tenant_product_tour_events;
DROP POLICY IF EXISTS "Landlords can view product tour events for own tenants" ON public.tenant_product_tour_events;
DROP POLICY IF EXISTS "Tenants can insert own product tour events" ON public.tenant_product_tour_events;
DROP POLICY IF EXISTS "Tenants can view own product tour events" ON public.tenant_product_tour_events;

CREATE POLICY "Tenant tour event stakeholders can view events"
ON public.tenant_product_tour_events
FOR SELECT
TO authenticated
USING (
    tenant_id = (select auth.uid())
    OR (((select auth.jwt()) -> 'user_metadata'::text) ->> 'role'::text) = 'admin'
    OR EXISTS (
        SELECT 1
        FROM public.leases
        WHERE leases.tenant_id = tenant_product_tour_events.tenant_id
          AND leases.landlord_id = (select auth.uid())
    )
);

CREATE POLICY "Tenants can insert own product tour events"
ON public.tenant_product_tour_events
FOR INSERT
TO authenticated
WITH CHECK (tenant_id = (select auth.uid()));

-- tenant_product_tour_states
DROP POLICY IF EXISTS "Admins can view all product tour states" ON public.tenant_product_tour_states;
DROP POLICY IF EXISTS "Landlords can view product tour state for own tenants" ON public.tenant_product_tour_states;
DROP POLICY IF EXISTS "Tenants can create own product tour state" ON public.tenant_product_tour_states;
DROP POLICY IF EXISTS "Tenants can update own product tour state" ON public.tenant_product_tour_states;
DROP POLICY IF EXISTS "Tenants can view own product tour state" ON public.tenant_product_tour_states;

CREATE POLICY "Tenant tour state stakeholders can view states"
ON public.tenant_product_tour_states
FOR SELECT
TO authenticated
USING (
    tenant_id = (select auth.uid())
    OR (((select auth.jwt()) -> 'user_metadata'::text) ->> 'role'::text) = 'admin'
    OR EXISTS (
        SELECT 1
        FROM public.leases
        WHERE leases.tenant_id = tenant_product_tour_states.tenant_id
          AND leases.landlord_id = (select auth.uid())
    )
);

CREATE POLICY "Tenants can create own product tour state"
ON public.tenant_product_tour_states
FOR INSERT
TO authenticated
WITH CHECK (tenant_id = (select auth.uid()));

CREATE POLICY "Tenants can update own product tour state"
ON public.tenant_product_tour_states
FOR UPDATE
TO authenticated
USING (tenant_id = (select auth.uid()))
WITH CHECK (tenant_id = (select auth.uid()));

-- unit_transfer_requests
DROP POLICY IF EXISTS "Landlords can update transfer requests" ON public.unit_transfer_requests;
DROP POLICY IF EXISTS "Landlords can view own transfer requests" ON public.unit_transfer_requests;
DROP POLICY IF EXISTS "Tenants can create transfer requests" ON public.unit_transfer_requests;
DROP POLICY IF EXISTS "Tenants can view own transfer requests" ON public.unit_transfer_requests;

CREATE POLICY "Transfer request participants can view requests"
ON public.unit_transfer_requests
FOR SELECT
TO authenticated
USING (
    landlord_id = (select auth.uid())
    OR tenant_id = (select auth.uid())
);

CREATE POLICY "Landlords can update transfer requests"
ON public.unit_transfer_requests
FOR UPDATE
TO authenticated
USING (landlord_id = (select auth.uid()))
WITH CHECK (landlord_id = (select auth.uid()));

CREATE POLICY "Tenants can create transfer requests"
ON public.unit_transfer_requests
FOR INSERT
TO authenticated
WITH CHECK (
    tenant_id = (select auth.uid())
    AND EXISTS (
        SELECT 1
        FROM public.leases l
        JOIN public.units current_u ON current_u.id = l.unit_id
        JOIN public.units requested_u ON requested_u.id = unit_transfer_requests.requested_unit_id
        WHERE l.id = unit_transfer_requests.lease_id
          AND l.tenant_id = (select auth.uid())
          AND l.landlord_id = unit_transfer_requests.landlord_id
          AND l.status = 'active'::public.lease_status
          AND current_u.id = unit_transfer_requests.current_unit_id
          AND current_u.property_id = requested_u.property_id
    )
);

-- utility_configs
DROP POLICY IF EXISTS "Landlords can delete own utility configs" ON public.utility_configs;
DROP POLICY IF EXISTS "Landlords can insert own utility configs" ON public.utility_configs;
DROP POLICY IF EXISTS "Landlords can update own utility configs" ON public.utility_configs;
DROP POLICY IF EXISTS "Landlords can view own utility configs" ON public.utility_configs;
DROP POLICY IF EXISTS "Tenants can view utility configs for own leases" ON public.utility_configs;

CREATE POLICY "Utility config stakeholders can view configs"
ON public.utility_configs
FOR SELECT
TO authenticated
USING (
    landlord_id = (select auth.uid())
    OR EXISTS (
        SELECT 1
        FROM public.leases
        JOIN public.units ON units.id = leases.unit_id
        WHERE leases.tenant_id = (select auth.uid())
          AND units.property_id = utility_configs.property_id
          AND (utility_configs.unit_id IS NULL OR utility_configs.unit_id = leases.unit_id)
    )
);

CREATE POLICY "Landlords can insert own utility configs"
ON public.utility_configs
FOR INSERT
TO authenticated
WITH CHECK (landlord_id = (select auth.uid()));

CREATE POLICY "Landlords can update own utility configs"
ON public.utility_configs
FOR UPDATE
TO authenticated
USING (landlord_id = (select auth.uid()))
WITH CHECK (landlord_id = (select auth.uid()));

CREATE POLICY "Landlords can delete own utility configs"
ON public.utility_configs
FOR DELETE
TO authenticated
USING (landlord_id = (select auth.uid()));

-- utility_readings
DROP POLICY IF EXISTS "Landlords can delete own utility readings" ON public.utility_readings;
DROP POLICY IF EXISTS "Landlords can insert own utility readings" ON public.utility_readings;
DROP POLICY IF EXISTS "Landlords can update own utility readings" ON public.utility_readings;
DROP POLICY IF EXISTS "Landlords can view own utility readings" ON public.utility_readings;
DROP POLICY IF EXISTS "Tenants can view own utility readings" ON public.utility_readings;

CREATE POLICY "Utility reading stakeholders can view readings"
ON public.utility_readings
FOR SELECT
TO authenticated
USING (
    landlord_id = (select auth.uid())
    OR EXISTS (
        SELECT 1
        FROM public.leases
        WHERE leases.id = utility_readings.lease_id
          AND leases.tenant_id = (select auth.uid())
    )
);

CREATE POLICY "Landlords can insert own utility readings"
ON public.utility_readings
FOR INSERT
TO authenticated
WITH CHECK (landlord_id = (select auth.uid()));

CREATE POLICY "Landlords can update own utility readings"
ON public.utility_readings
FOR UPDATE
TO authenticated
USING (landlord_id = (select auth.uid()))
WITH CHECK (landlord_id = (select auth.uid()));

CREATE POLICY "Landlords can delete own utility readings"
ON public.utility_readings
FOR DELETE
TO authenticated
USING (landlord_id = (select auth.uid()));

-- landlord_reviews
DROP POLICY IF EXISTS "Landlords can view own reviews" ON public.landlord_reviews;
DROP POLICY IF EXISTS "Tenants can create lease-based landlord reviews" ON public.landlord_reviews;
DROP POLICY IF EXISTS "Tenants can update own reviews" ON public.landlord_reviews;
DROP POLICY IF EXISTS "Tenants can view own submitted reviews" ON public.landlord_reviews;

CREATE POLICY "Review participants can view reviews"
ON public.landlord_reviews
FOR SELECT
TO authenticated
USING (
    landlord_id = (select auth.uid())
    OR tenant_id = (select auth.uid())
);

CREATE POLICY "Tenants can create lease-based landlord reviews"
ON public.landlord_reviews
FOR INSERT
TO authenticated
WITH CHECK (
    tenant_id = (select auth.uid())
    AND EXISTS (
        SELECT 1
        FROM public.leases
        WHERE leases.id = landlord_reviews.lease_id
          AND leases.tenant_id = (select auth.uid())
          AND leases.landlord_id = landlord_reviews.landlord_id
    )
);

CREATE POLICY "Tenants can update own reviews"
ON public.landlord_reviews
FOR UPDATE
TO authenticated
USING (tenant_id = (select auth.uid()))
WITH CHECK (tenant_id = (select auth.uid()));

-- conversation_participants
DROP POLICY IF EXISTS "Participants can view their participant records" ON public.conversation_participants;
DROP POLICY IF EXISTS "View co-participants" ON public.conversation_participants;

CREATE POLICY "Conversation participants can view participant records"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (
    user_id = (select auth.uid())
    OR EXISTS (
        SELECT 1
        FROM public.conversation_participants cp
        WHERE cp.conversation_id = conversation_participants.conversation_id
          AND cp.user_id = (select auth.uid())
    )
);

-- messages
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Recipient can update message read status" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;

CREATE POLICY "Conversation participants can view messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.conversation_participants
        WHERE conversation_participants.conversation_id = messages.conversation_id
          AND conversation_participants.user_id = (select auth.uid())
    )
);

CREATE POLICY "Participants can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = (select auth.uid())
    AND EXISTS (
        SELECT 1
        FROM public.conversation_participants
        WHERE conversation_participants.conversation_id = messages.conversation_id
          AND conversation_participants.user_id = (select auth.uid())
    )
);

CREATE POLICY "Conversation participants can update messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.conversation_participants
        WHERE conversation_participants.conversation_id = messages.conversation_id
          AND conversation_participants.user_id = (select auth.uid())
    )
);
