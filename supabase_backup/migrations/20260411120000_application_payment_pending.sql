-- Payment-gated application approval workflow
-- Adds payment_pending status, pre-approval payment requests, portal tokens, and audit events.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'payment_pending'
          AND enumtypid = 'public.application_status'::regtype
    ) THEN
        ALTER TYPE public.application_status ADD VALUE 'payment_pending';
    END IF;
END $$;

ALTER TABLE public.applications
    ADD COLUMN IF NOT EXISTS payment_pending_started_at timestamptz,
    ADD COLUMN IF NOT EXISTS payment_pending_expires_at timestamptz,
    ADD COLUMN IF NOT EXISTS payment_portal_token_hash text,
    ADD COLUMN IF NOT EXISTS payment_portal_token_expires_at timestamptz;

CREATE TABLE IF NOT EXISTS public.application_payment_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    landlord_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    requirement_type text NOT NULL CHECK (requirement_type IN ('advance_rent', 'security_deposit')),
    amount numeric(12,2) NOT NULL CHECK (amount > 0),
    due_at date,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected', 'expired')),
    method public.payment_method,
    reference_number text,
    payment_note text,
    payment_proof_path text,
    payment_proof_url text,
    submitted_at timestamptz,
    reviewed_at timestamptz,
    reviewed_by uuid REFERENCES auth.users(id),
    review_note text,
    bypassed boolean NOT NULL DEFAULT false,
    linked_payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT application_payment_requests_unique_requirement UNIQUE (application_id, requirement_type)
);

CREATE TABLE IF NOT EXISTS public.application_payment_audit_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    payment_request_id uuid REFERENCES public.application_payment_requests(id) ON DELETE SET NULL,
    actor_id uuid REFERENCES auth.users(id),
    actor_role text NOT NULL CHECK (actor_role IN ('system', 'landlord', 'prospect')),
    event_type text NOT NULL CHECK (
        event_type IN (
            'request_generated',
            'portal_opened',
            'proof_submitted',
            'payment_confirmed',
            'payment_rejected',
            'payment_needs_correction',
            'bypass_used',
            'expired',
            'finalized'
        )
    ),
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_application_payment_requests_application
    ON public.application_payment_requests(application_id, status);

CREATE INDEX IF NOT EXISTS idx_application_payment_requests_landlord
    ON public.application_payment_requests(landlord_id, status);

CREATE INDEX IF NOT EXISTS idx_application_payment_audit_application
    ON public.application_payment_audit_events(application_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_payment_pending_expiry
    ON public.applications(payment_pending_expires_at)
    WHERE payment_pending_expires_at IS NOT NULL;

DROP TRIGGER IF EXISTS trg_application_payment_requests_updated_at ON public.application_payment_requests;
CREATE TRIGGER trg_application_payment_requests_updated_at
BEFORE UPDATE ON public.application_payment_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.application_payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_payment_audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Landlords can view own application payment requests" ON public.application_payment_requests;
CREATE POLICY "Landlords can view own application payment requests"
    ON public.application_payment_requests FOR SELECT
    USING (auth.uid() = landlord_id);

DROP POLICY IF EXISTS "Landlords can manage own application payment requests" ON public.application_payment_requests;
CREATE POLICY "Landlords can manage own application payment requests"
    ON public.application_payment_requests FOR ALL
    USING (auth.uid() = landlord_id)
    WITH CHECK (auth.uid() = landlord_id);

DROP POLICY IF EXISTS "Landlords can view own application payment audits" ON public.application_payment_audit_events;
CREATE POLICY "Landlords can view own application payment audits"
    ON public.application_payment_audit_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.applications
            WHERE applications.id = application_payment_audit_events.application_id
              AND applications.landlord_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "System can insert application payment audits" ON public.application_payment_audit_events;
CREATE POLICY "System can insert application payment audits"
    ON public.application_payment_audit_events FOR INSERT
    WITH CHECK (true);
