-- Historical chat moderation terms promoted from admin-reviewed user reports.

CREATE TABLE IF NOT EXISTS public.message_moderation_banned_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term TEXT NOT NULL,
    normalized_term TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'report')),
    report_id UUID REFERENCES public.message_user_reports(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_message_moderation_banned_terms_normalized_unique
    ON public.message_moderation_banned_terms(normalized_term);

CREATE INDEX IF NOT EXISTS idx_message_moderation_banned_terms_active
    ON public.message_moderation_banned_terms(is_active, created_at DESC);

ALTER TABLE public.message_moderation_banned_terms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view banned moderation terms" ON public.message_moderation_banned_terms;
CREATE POLICY "Admins can view banned moderation terms"
    ON public.message_moderation_banned_terms FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can insert banned moderation terms" ON public.message_moderation_banned_terms;
CREATE POLICY "Admins can insert banned moderation terms"
    ON public.message_moderation_banned_terms FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update banned moderation terms" ON public.message_moderation_banned_terms;
CREATE POLICY "Admins can update banned moderation terms"
    ON public.message_moderation_banned_terms FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

DROP TRIGGER IF EXISTS trg_message_moderation_banned_terms_updated_at ON public.message_moderation_banned_terms;
CREATE TRIGGER trg_message_moderation_banned_terms_updated_at
    BEFORE UPDATE ON public.message_moderation_banned_terms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();
