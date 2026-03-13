-- Persist landlord statistics export history for audit and reporting.
CREATE TABLE IF NOT EXISTS public.landlord_statistics_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    format TEXT NOT NULL CHECK (format IN ('csv', 'pdf')),
    report_range TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('Simplified', 'Detailed')),
    include_expanded_kpis BOOLEAN NOT NULL DEFAULT false,
    row_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_landlord_statistics_exports_landlord_created
    ON public.landlord_statistics_exports (landlord_id, created_at DESC);

ALTER TABLE public.landlord_statistics_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can view own statistics exports"
    ON public.landlord_statistics_exports FOR SELECT
    USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can insert own statistics exports"
    ON public.landlord_statistics_exports FOR INSERT
    WITH CHECK (auth.uid() = landlord_id);
