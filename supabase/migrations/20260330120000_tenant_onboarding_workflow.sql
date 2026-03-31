-- Migration: Guided Tenant Onboarding Workflow
-- Date: 2026-03-30
-- Description: Adds onboarding state persistence, events, throttling metadata, and RLS policies.

-- ======================== ONBOARDING STATE ============================

CREATE TABLE IF NOT EXISTS tenant_onboarding_states (
    tenant_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'completed')),
    current_step TEXT NOT NULL DEFAULT 'profile'
        CHECK (current_step IN ('profile', 'lease_acknowledged', 'payment_readiness', 'support_handoff')),
    steps JSONB NOT NULL DEFAULT jsonb_build_object(
        'profile', false,
        'lease_acknowledged', false,
        'payment_readiness', false,
        'support_handoff', false
    ),
    step_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_reminder_sent_at TIMESTAMPTZ,
    reminder_send_count INTEGER NOT NULL DEFAULT 0 CHECK (reminder_send_count >= 0),
    reminder_window_started_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_onboarding_states_status
    ON tenant_onboarding_states(status);

CREATE INDEX IF NOT EXISTS idx_tenant_onboarding_states_last_reminder
    ON tenant_onboarding_states(last_reminder_sent_at DESC)
    WHERE status <> 'completed';

ALTER TABLE tenant_onboarding_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can view own onboarding state" ON tenant_onboarding_states;
CREATE POLICY "Tenants can view own onboarding state"
    ON tenant_onboarding_states FOR SELECT
    USING (auth.uid() = tenant_id);

DROP POLICY IF EXISTS "Tenants can update own onboarding state" ON tenant_onboarding_states;
CREATE POLICY "Tenants can update own onboarding state"
    ON tenant_onboarding_states FOR UPDATE
    USING (auth.uid() = tenant_id)
    WITH CHECK (auth.uid() = tenant_id);

DROP POLICY IF EXISTS "Tenants can create own onboarding state" ON tenant_onboarding_states;
CREATE POLICY "Tenants can create own onboarding state"
    ON tenant_onboarding_states FOR INSERT
    WITH CHECK (auth.uid() = tenant_id);

DROP POLICY IF EXISTS "Landlords can view tenant onboarding state for own leases" ON tenant_onboarding_states;
CREATE POLICY "Landlords can view tenant onboarding state for own leases"
    ON tenant_onboarding_states FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM leases
            WHERE leases.tenant_id = tenant_onboarding_states.tenant_id
              AND leases.landlord_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all onboarding states" ON tenant_onboarding_states;
CREATE POLICY "Admins can view all onboarding states"
    ON tenant_onboarding_states FOR SELECT
    TO authenticated
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP TRIGGER IF EXISTS trg_tenant_onboarding_states_updated_at ON tenant_onboarding_states;
CREATE TRIGGER trg_tenant_onboarding_states_updated_at
    BEFORE UPDATE ON tenant_onboarding_states
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE tenant_onboarding_states IS 'Tenant onboarding progress, completion state, and reminder throttling metadata.';
COMMENT ON COLUMN tenant_onboarding_states.steps IS 'Boolean checklist for onboarding steps.';
COMMENT ON COLUMN tenant_onboarding_states.step_data IS 'Optional payload captured per completed onboarding step.';

-- ======================== ONBOARDING EVENTS ============================

CREATE TABLE IF NOT EXISTS tenant_onboarding_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'onboarding_started',
        'step_completed',
        'onboarding_completed',
        'reminder_sent',
        'reminder_failed'
    )),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    trigger_source TEXT CHECK (trigger_source IN ('manual', 'automated')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_onboarding_events_tenant_created
    ON tenant_onboarding_events(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_onboarding_events_event_type
    ON tenant_onboarding_events(event_type, created_at DESC);

ALTER TABLE tenant_onboarding_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can view own onboarding events" ON tenant_onboarding_events;
CREATE POLICY "Tenants can view own onboarding events"
    ON tenant_onboarding_events FOR SELECT
    USING (auth.uid() = tenant_id);

DROP POLICY IF EXISTS "Landlords can view onboarding events for own leases" ON tenant_onboarding_events;
CREATE POLICY "Landlords can view onboarding events for own leases"
    ON tenant_onboarding_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM leases
            WHERE leases.tenant_id = tenant_onboarding_events.tenant_id
              AND leases.landlord_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all onboarding events" ON tenant_onboarding_events;
CREATE POLICY "Admins can view all onboarding events"
    ON tenant_onboarding_events FOR SELECT
    TO authenticated
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Authenticated actors can insert onboarding events" ON tenant_onboarding_events;
CREATE POLICY "Authenticated actors can insert onboarding events"
    ON tenant_onboarding_events FOR INSERT
    TO authenticated
    WITH CHECK (actor_id IS NULL OR actor_id = auth.uid());

COMMENT ON TABLE tenant_onboarding_events IS 'Audit events for onboarding lifecycle and reminders.';

-- ======================== BACKFILL ============================

-- Mark existing active tenants as completed onboarding.
INSERT INTO tenant_onboarding_states (
    tenant_id,
    status,
    current_step,
    steps,
    step_data,
    started_at,
    completed_at
)
SELECT DISTINCT
    leases.tenant_id,
    'completed',
    'support_handoff',
    jsonb_build_object(
        'profile', true,
        'lease_acknowledged', true,
        'payment_readiness', true,
        'support_handoff', true
    ),
    '{}'::jsonb,
    now(),
    now()
FROM leases
WHERE leases.tenant_id IS NOT NULL
  AND leases.status = 'active'
ON CONFLICT (tenant_id) DO NOTHING;

-- Ensure pending rows exist for tenants with in-flight lease/signing states.
INSERT INTO tenant_onboarding_states (
    tenant_id,
    status,
    current_step,
    steps,
    step_data
)
SELECT DISTINCT
    leases.tenant_id,
    'pending',
    'profile',
    jsonb_build_object(
        'profile', false,
        'lease_acknowledged', false,
        'payment_readiness', false,
        'support_handoff', false
    ),
    '{}'::jsonb
FROM leases
WHERE leases.tenant_id IS NOT NULL
  AND leases.status IN ('draft', 'pending_signature', 'pending_tenant_signature', 'pending_landlord_signature')
ON CONFLICT (tenant_id) DO NOTHING;
