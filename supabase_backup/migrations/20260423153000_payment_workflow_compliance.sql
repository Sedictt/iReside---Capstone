-- ============================================================
-- Payment Workflow Compliance Upgrade (compat-layer strategy)
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_workflow_status') THEN
        CREATE TYPE payment_workflow_status AS ENUM (
            'pending',
            'reminder_sent',
            'intent_submitted',
            'under_review',
            'awaiting_in_person',
            'confirmed',
            'rejected',
            'receipted'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_intent_method') THEN
        CREATE TYPE payment_intent_method AS ENUM ('gcash', 'in_person');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_amount_tag') THEN
        CREATE TYPE payment_amount_tag AS ENUM ('exact', 'partial', 'overpaid', 'short_paid');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_review_action') THEN
        CREATE TYPE payment_review_action AS ENUM (
            'accept_partial',
            'request_completion',
            'reject',
            'confirm_received'
        );
    END IF;
END $$;

ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS workflow_status payment_workflow_status NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS intent_method payment_intent_method,
    ADD COLUMN IF NOT EXISTS amount_tag payment_amount_tag,
    ADD COLUMN IF NOT EXISTS review_action payment_review_action,
    ADD COLUMN IF NOT EXISTS in_person_intent_expires_at timestamptz,
    ADD COLUMN IF NOT EXISTS rejection_reason text,
    ADD COLUMN IF NOT EXISTS last_action_at timestamptz,
    ADD COLUMN IF NOT EXISTS last_action_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'payments_rejection_reason_required'
    ) THEN
        ALTER TABLE public.payments
            ADD CONSTRAINT payments_rejection_reason_required
            CHECK (
                workflow_status <> 'rejected'
                OR nullif(trim(coalesce(rejection_reason, '')), '') IS NOT NULL
            );
    END IF;
END $$;

UPDATE public.payments
SET workflow_status = CASE
    WHEN status = 'completed' AND receipt_number IS NOT NULL THEN 'receipted'::payment_workflow_status
    WHEN status = 'completed' THEN 'confirmed'::payment_workflow_status
    WHEN status = 'processing' THEN 'under_review'::payment_workflow_status
    WHEN status = 'failed' THEN 'rejected'::payment_workflow_status
    ELSE 'pending'::payment_workflow_status
END
WHERE workflow_status IS NULL
   OR workflow_status = 'pending';

CREATE OR REPLACE FUNCTION public.sync_compat_payment_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.workflow_status IN ('under_review', 'intent_submitted') THEN
        NEW.status := 'processing';
    ELSIF NEW.workflow_status IN ('confirmed', 'receipted') THEN
        NEW.status := 'completed';
    ELSIF NEW.workflow_status = 'rejected' THEN
        NEW.status := 'failed';
    ELSE
        NEW.status := 'pending';
    END IF;

    IF NEW.workflow_status IN ('confirmed', 'receipted') THEN
        NEW.landlord_confirmed := true;
    ELSIF NEW.workflow_status IN ('rejected', 'pending', 'reminder_sent', 'intent_submitted', 'under_review', 'awaiting_in_person') THEN
        NEW.landlord_confirmed := false;
    END IF;

    IF NEW.workflow_status IN ('confirmed', 'receipted') AND NEW.paid_at IS NULL THEN
        NEW.paid_at := now();
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payments_sync_compat_status ON public.payments;
CREATE TRIGGER trg_payments_sync_compat_status
BEFORE INSERT OR UPDATE OF workflow_status
ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.sync_compat_payment_status();

CREATE TABLE IF NOT EXISTS public.payment_workflow_audit_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    action text NOT NULL,
    source text NOT NULL CHECK (source IN ('api', 'chat_button', 'system_expiry')),
    idempotency_key text,
    before_state jsonb NOT NULL DEFAULT '{}'::jsonb,
    after_state jsonb NOT NULL DEFAULT '{}'::jsonb,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_workflow_audit_payment
    ON public.payment_workflow_audit_events(payment_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_workflow_audit_idempotency
    ON public.payment_workflow_audit_events(payment_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

ALTER TABLE public.payment_workflow_audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant and landlord can view payment workflow audits" ON public.payment_workflow_audit_events;
CREATE POLICY "Tenant and landlord can view payment workflow audits"
    ON public.payment_workflow_audit_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.payments
            WHERE payments.id = payment_workflow_audit_events.payment_id
              AND (payments.tenant_id = auth.uid() OR payments.landlord_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "System can write payment workflow audits" ON public.payment_workflow_audit_events;
CREATE POLICY "System can write payment workflow audits"
    ON public.payment_workflow_audit_events FOR INSERT
    WITH CHECK (true);

ALTER TABLE public.payment_receipts
    ADD COLUMN IF NOT EXISTS method payment_method,
    ADD COLUMN IF NOT EXISTS amount_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_receipts_unique_payment
    ON public.payment_receipts(payment_id);

CREATE OR REPLACE FUNCTION public.prevent_payment_receipt_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Issued receipts are immutable.';
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_receipts_immutable ON public.payment_receipts;
CREATE TRIGGER trg_payment_receipts_immutable
BEFORE UPDATE
ON public.payment_receipts
FOR EACH ROW
EXECUTE FUNCTION public.prevent_payment_receipt_update();
