-- Create a table for landlord applications
CREATE TABLE IF NOT EXISTS public.landlord_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    identity_document_url TEXT,
    ownership_document_url TEXT,
    liveness_document_url TEXT,
    status application_status NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Only one active application per profile
    CONSTRAINT unique_pending_application UNIQUE (profile_id, status)
);

-- Turn on row level security
ALTER TABLE public.landlord_applications ENABLE ROW LEVEL SECURITY;

-- Users can insert their own applications
CREATE POLICY "Users can create their own applications"
    ON public.landlord_applications FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

-- Users can view their own applications
CREATE POLICY "Users can view their own applications"
    ON public.landlord_applications FOR SELECT
    USING (auth.uid() = profile_id);
