-- Persist landlord reviews submitted by tenants.

CREATE TABLE IF NOT EXISTS public.landlord_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID NOT NULL REFERENCES public.leases(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT landlord_reviews_one_per_lease UNIQUE (lease_id),
    CONSTRAINT landlord_reviews_no_self_review CHECK (landlord_id <> tenant_id)
);

ALTER TABLE public.landlord_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can view own reviews"
    ON public.landlord_reviews FOR SELECT
    USING (auth.uid() = landlord_id);

CREATE POLICY "Tenants can view own submitted reviews"
    ON public.landlord_reviews FOR SELECT
    USING (auth.uid() = tenant_id);

CREATE POLICY "Tenants can create lease-based landlord reviews"
    ON public.landlord_reviews FOR INSERT
    WITH CHECK (
        auth.uid() = tenant_id
        AND EXISTS (
            SELECT 1
            FROM public.leases
            WHERE leases.id = lease_id
              AND leases.tenant_id = auth.uid()
              AND leases.landlord_id = landlord_id
        )
    );

CREATE POLICY "Tenants can update own reviews"
    ON public.landlord_reviews FOR UPDATE
    USING (auth.uid() = tenant_id)
    WITH CHECK (auth.uid() = tenant_id);

CREATE INDEX IF NOT EXISTS idx_landlord_reviews_landlord_created
    ON public.landlord_reviews(landlord_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_landlord_reviews_tenant_created
    ON public.landlord_reviews(tenant_id, created_at DESC);
