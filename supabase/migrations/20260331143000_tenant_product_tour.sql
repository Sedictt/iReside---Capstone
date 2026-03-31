-- Migration: Tenant Product Tour
-- Date: 2026-03-31
-- Description: Adds tenant product tour state, lifecycle telemetry, and visibility policies.

CREATE TABLE IF NOT EXISTS tenant_product_tour_states (
    tenant_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'not_started'
        CHECK (status IN ('not_started', 'in_progress', 'skipped', 'completed')),
    current_step_index INTEGER NOT NULL DEFAULT 0 CHECK (current_step_index >= 0),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    skipped_at TIMESTAMPTZ,
    skip_suppressed_until TIMESTAMPTZ,
    replay_count INTEGER NOT NULL DEFAULT 0 CHECK (replay_count >= 0),
    last_event_at TIMESTAMPTZ,
    last_route TEXT,
    last_anchor_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_product_tour_states_status
    ON tenant_product_tour_states (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_product_tour_states_last_event
    ON tenant_product_tour_states (last_event_at DESC)
    WHERE last_event_at IS NOT NULL;

ALTER TABLE tenant_product_tour_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can view own product tour state" ON tenant_product_tour_states;
CREATE POLICY "Tenants can view own product tour state"
    ON tenant_product_tour_states FOR SELECT
    USING (auth.uid() = tenant_id);

DROP POLICY IF EXISTS "Tenants can update own product tour state" ON tenant_product_tour_states;
CREATE POLICY "Tenants can update own product tour state"
    ON tenant_product_tour_states FOR UPDATE
    USING (auth.uid() = tenant_id)
    WITH CHECK (auth.uid() = tenant_id);

DROP POLICY IF EXISTS "Tenants can create own product tour state" ON tenant_product_tour_states;
CREATE POLICY "Tenants can create own product tour state"
    ON tenant_product_tour_states FOR INSERT
    WITH CHECK (auth.uid() = tenant_id);

DROP POLICY IF EXISTS "Landlords can view product tour state for own tenants" ON tenant_product_tour_states;
CREATE POLICY "Landlords can view product tour state for own tenants"
    ON tenant_product_tour_states FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM leases
            WHERE leases.tenant_id = tenant_product_tour_states.tenant_id
              AND leases.landlord_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all product tour states" ON tenant_product_tour_states;
CREATE POLICY "Admins can view all product tour states"
    ON tenant_product_tour_states FOR SELECT
    TO authenticated
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP TRIGGER IF EXISTS trg_tenant_product_tour_states_updated_at ON tenant_product_tour_states;
CREATE TRIGGER trg_tenant_product_tour_states_updated_at
    BEFORE UPDATE ON tenant_product_tour_states
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE tenant_product_tour_states IS 'Current tenant product tour lifecycle state with replay/suppression metadata.';

CREATE TABLE IF NOT EXISTS tenant_product_tour_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_id UUID NOT NULL DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL CHECK (event_type IN (
        'tour_started',
        'tour_step_completed',
        'tour_skipped',
        'tour_completed',
        'tour_replayed',
        'tour_failed'
    )),
    step_id TEXT,
    trigger_source TEXT NOT NULL CHECK (trigger_source IN (
        'onboarding_handoff',
        'auto_portal_entry',
        'manual',
        'resume',
        'replay',
        'step_progression',
        'fallback',
        'system'
    )),
    is_replay BOOLEAN NOT NULL DEFAULT false,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_product_tour_events_tenant_created
    ON tenant_product_tour_events (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_product_tour_events_type_created
    ON tenant_product_tour_events (event_type, created_at DESC);

ALTER TABLE tenant_product_tour_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can view own product tour events" ON tenant_product_tour_events;
CREATE POLICY "Tenants can view own product tour events"
    ON tenant_product_tour_events FOR SELECT
    USING (auth.uid() = tenant_id);

DROP POLICY IF EXISTS "Landlords can view product tour events for own tenants" ON tenant_product_tour_events;
CREATE POLICY "Landlords can view product tour events for own tenants"
    ON tenant_product_tour_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM leases
            WHERE leases.tenant_id = tenant_product_tour_events.tenant_id
              AND leases.landlord_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all product tour events" ON tenant_product_tour_events;
CREATE POLICY "Admins can view all product tour events"
    ON tenant_product_tour_events FOR SELECT
    TO authenticated
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Tenants can insert own product tour events" ON tenant_product_tour_events;
CREATE POLICY "Tenants can insert own product tour events"
    ON tenant_product_tour_events FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = tenant_id);

COMMENT ON TABLE tenant_product_tour_events IS 'Lifecycle telemetry for tenant product tours including replay segmentation.';

-- Backfill strategy:
-- - Recent onboarding completions (<= 14 days): mark as not_started to be eligible for first-run tour.
-- - Older onboarding completions: mark as skipped with long suppression to avoid surprising existing tenants.
INSERT INTO tenant_product_tour_states (
    tenant_id,
    status,
    current_step_index,
    started_at,
    completed_at,
    skipped_at,
    skip_suppressed_until,
    replay_count,
    metadata
)
SELECT
    tos.tenant_id,
    CASE
        WHEN tos.completed_at IS NOT NULL AND tos.completed_at >= (now() - interval '14 days') THEN 'not_started'
        ELSE 'skipped'
    END AS status,
    0,
    NULL,
    NULL,
    CASE
        WHEN tos.completed_at IS NOT NULL AND tos.completed_at >= (now() - interval '14 days') THEN NULL
        ELSE now()
    END AS skipped_at,
    CASE
        WHEN tos.completed_at IS NOT NULL AND tos.completed_at >= (now() - interval '14 days') THEN NULL
        ELSE (now() + interval '180 days')
    END AS skip_suppressed_until,
    0,
    jsonb_build_object(
        'backfilled', true,
        'source', 'tenant_onboarding_states'
    )
FROM tenant_onboarding_states tos
WHERE tos.status = 'completed'
ON CONFLICT (tenant_id) DO NOTHING;
