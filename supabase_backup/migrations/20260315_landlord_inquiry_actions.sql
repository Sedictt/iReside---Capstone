-- Persist landlord-specific inquiry UI state for dashboard actions.

CREATE TABLE IF NOT EXISTS public.landlord_inquiry_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT landlord_inquiry_actions_unique UNIQUE (inquiry_id, landlord_id)
);

ALTER TABLE public.landlord_inquiry_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can view own inquiry actions"
    ON public.landlord_inquiry_actions FOR SELECT
    USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can create own inquiry actions"
    ON public.landlord_inquiry_actions FOR INSERT
    WITH CHECK (
        auth.uid() = landlord_id
        AND EXISTS (
            SELECT 1
            FROM public.applications
            WHERE applications.id = inquiry_id
              AND applications.landlord_id = auth.uid()
        )
    );

CREATE POLICY "Landlords can update own inquiry actions"
    ON public.landlord_inquiry_actions FOR UPDATE
    USING (auth.uid() = landlord_id)
    WITH CHECK (auth.uid() = landlord_id);

CREATE INDEX IF NOT EXISTS idx_landlord_inquiry_actions_landlord
    ON public.landlord_inquiry_actions(landlord_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_landlord_inquiry_actions_inquiry
    ON public.landlord_inquiry_actions(inquiry_id);
